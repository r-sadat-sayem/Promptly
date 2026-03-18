import type { CandidateEvaluation, OptimizationResult } from '@/lib/optimizer';
import {
  EVALUATOR_SYSTEM_PROMPT,
  FILE_AWARE_OPTIMIZER_SYSTEM_PROMPT,
  OPTIMIZER_SYSTEM_PROMPT,
  REFINER_SYSTEM_PROMPT,
} from '@/lib/optimizer';
import { runJsonCompletion } from '@/lib/llmJson';
import { OPTIMIZATION_CONFIG } from '@/lib/optimizationConfig';
import { logOptimizationEvent } from '@/lib/optimizationLogger';
import {
  findExactCache,
  findSimilarKnowledge,
  getExactCacheKey,
  markCacheHit,
  storeCacheEntry,
  storeKnowledgeEntry,
  type CacheLookupInput,
} from '@/lib/knowledgeBase';
import {
  clampScore,
  computeOutputTokenBudget,
  computeRelativeImprovement,
  hasMeaningfulReduction,
  hashText,
  isSafeRefinement,
  sanitizeEvaluationInput,
  sanitizeFileInput,
  sanitizePromptInput,
  tokenReductionPct,
  type OptimizationMode,
} from '@/lib/promptUtils';
import { countTokens } from '@/lib/tokenCounter';
import { AppError } from '@/lib/appErrors';

export interface PipelineInput {
  prompt: string;
  fileContent?: string | null;
  fileName?: string | null;
  craftAsSystemPrompt?: boolean;
  modelId: string;
}

interface PipelineOutcome {
  result: OptimizationResult;
}

function inferMode(input: PipelineInput): OptimizationMode {
  return input.fileContent && input.fileContent.trim().length > 0 ? 'craft' : 'optimize';
}

function buildGenerationMessage(input: PipelineInput, mode: OptimizationMode): string {
  if (mode === 'craft') {
    const safeFile = sanitizeFileInput(input.fileContent ?? '');
    let message =
      `Reference document (filename: ${input.fileName ?? 'unknown'}):\n` +
      '```\n' +
      `${safeFile}\n` +
      '```\n\n' +
      `User's rough prompt:\n${sanitizePromptInput(input.prompt)}`;

    if (input.craftAsSystemPrompt) {
      message +=
        '\n\nIMPORTANT: The output must be explicitly formatted as a production-ready system prompt. It will be placed in the system turn of an LLM API call.';
    }
    return message;
  }

  return `Optimize this prompt for token efficiency:\n\n${sanitizePromptInput(input.prompt)}`;
}

function buildEvaluationMessage(
  originalPrompt: string,
  candidate: OptimizationResult,
  mode: OptimizationMode
): string {
  return [
    `Mode: ${mode}`,
    `Original prompt:\n${sanitizeEvaluationInput(originalPrompt)}`,
    `Candidate prompt:\n${sanitizeEvaluationInput(candidate.optimized)}`,
    'Evaluate whether the candidate preserves intent and constraints while improving efficiency.',
  ].join('\n\n');
}

function buildRefinementMessage(
  originalPrompt: string,
  currentCandidate: OptimizationResult,
  evaluation: CandidateEvaluation,
  mode: OptimizationMode
): string {
  return [
    `Mode: ${mode}`,
    `Original prompt:\n${sanitizeEvaluationInput(originalPrompt)}`,
    `Current candidate:\n${sanitizeEvaluationInput(currentCandidate.optimized)}`,
    `Critique:\n${evaluation.critique}`,
    `Issues:\n${evaluation.issues.join('\n') || 'None'}`,
    `Optimization rules to preserve:\n${evaluation.optimization_rules.join('\n') || 'None'}`,
    'Produce a better candidate. Preserve hard constraints. Keep the result the same length or shorter when possible.',
  ].join('\n\n');
}

function computeOverallScore(
  originalTokens: number,
  optimizedTokens: number,
  evaluation: CandidateEvaluation
): number {
  const reduction = Math.max(0, tokenReductionPct(originalTokens, optimizedTokens));
  const reductionScore = Math.min(1, reduction / 50);
  const accuracy = clampScore(evaluation.accuracy_score);
  const clarity = clampScore(evaluation.clarity_score);
  const constraintPenalty = evaluation.preserved_constraints ? 0 : 0.25;
  const expansionPenalty =
    optimizedTokens > originalTokens && originalTokens > 0
      ? Math.min(0.25, (optimizedTokens - originalTokens) / originalTokens)
      : 0;

  return clampScore(accuracy * 0.75 + clarity * 0.15 + reductionScore * 0.1 - constraintPenalty - expansionPenalty);
}

function sanitizeResult(result: OptimizationResult): OptimizationResult {
  return {
    optimized: result.optimized.trim(),
    changes: Array.isArray(result.changes) ? result.changes.slice(0, 12) : [],
    quality_confidence: clampScore(result.quality_confidence),
    quality_notes: result.quality_notes.trim(),
    metadata: result.metadata,
  };
}

async function generateCandidate(
  input: PipelineInput,
  mode: OptimizationMode
): Promise<OptimizationResult> {
  const promptTokens = countTokens(input.prompt);
  const systemPrompt = mode === 'craft' ? FILE_AWARE_OPTIMIZER_SYSTEM_PROMPT : OPTIMIZER_SYSTEM_PROMPT;

  return sanitizeResult(
    await runJsonCompletion<OptimizationResult>({
      model: input.modelId,
      system: systemPrompt,
      user: buildGenerationMessage(input, mode),
      maxTokens: computeOutputTokenBudget(promptTokens, mode),
    })
  );
}

async function evaluateCandidate(
  originalPrompt: string,
  candidate: OptimizationResult,
  mode: OptimizationMode,
  modelId: string
): Promise<CandidateEvaluation> {
  const evaluation = await runJsonCompletion<CandidateEvaluation>({
    model: modelId,
    system: EVALUATOR_SYSTEM_PROMPT,
    user: buildEvaluationMessage(originalPrompt, candidate, mode),
    maxTokens: 512,
  });

  return {
    accuracy_score: clampScore(evaluation.accuracy_score),
    clarity_score: clampScore(evaluation.clarity_score),
    preserved_constraints: Boolean(evaluation.preserved_constraints),
    critique: evaluation.critique.trim(),
    optimization_rules: Array.isArray(evaluation.optimization_rules)
      ? evaluation.optimization_rules.slice(0, 8)
      : [],
    issues: Array.isArray(evaluation.issues) ? evaluation.issues.slice(0, 8) : [],
  };
}

async function refineCandidate(
  originalPrompt: string,
  currentCandidate: OptimizationResult,
  evaluation: CandidateEvaluation,
  mode: OptimizationMode,
  modelId: string
): Promise<OptimizationResult> {
  return sanitizeResult(
    await runJsonCompletion<OptimizationResult>({
      model: modelId,
      system: REFINER_SYSTEM_PROMPT,
      user: buildRefinementMessage(originalPrompt, currentCandidate, evaluation, mode),
      maxTokens: computeOutputTokenBudget(countTokens(currentCandidate.optimized), mode),
    })
  );
}

function buildCacheInput(
  input: PipelineInput,
  mode: OptimizationMode
): CacheLookupInput {
  const safeFile = mode === 'craft' ? sanitizeFileInput(input.fileContent ?? '') : '';
  return {
    prompt: sanitizePromptInput(input.prompt),
    mode,
    fileHash: safeFile ? hashText(safeFile) : null,
    craftAsSystemPrompt: input.craftAsSystemPrompt,
    modelId: input.modelId,
  };
}

function buildCacheResult(
  result: OptimizationResult,
  source: 'exact-cache' | 'similarity-cache',
  extras: Record<string, unknown>
): OptimizationResult {
  return {
    ...result,
    metadata: {
      ...(result.metadata ?? {}),
      source,
      ...extras,
    },
  };
}

export async function runOptimizationPipeline(input: PipelineInput): Promise<PipelineOutcome> {
  const mode = inferMode(input);
  const cacheInput = buildCacheInput(input, mode);
  const exactCacheKey = getExactCacheKey(cacheInput);
  const originalTokens = countTokens(input.prompt);

  if (originalTokens > OPTIMIZATION_CONFIG.maxPromptTokens) {
    throw new AppError({
      code: 'PROMPT_TOO_LARGE',
      userMessage: `This prompt is too large to optimize reliably in one pass. Please shorten it to under ${OPTIMIZATION_CONFIG.maxPromptTokens} tokens or split it into smaller sections.`,
      technicalMessage: `Prompt token count ${originalTokens} exceeds limit ${OPTIMIZATION_CONFIG.maxPromptTokens}.`,
      canAutoFix: true,
      suggestedAction: 'Use AI Magic Fix to clean or simplify the prompt before retrying.',
    });
  }

  logOptimizationEvent('pipeline_start', {
    mode,
    originalTokens,
    cacheKey: exactCacheKey,
  });

  const exactHit = findExactCache(exactCacheKey);
  if (exactHit) {
    markCacheHit(exactCacheKey);
    logOptimizationEvent('cache_hit', { cacheKey: exactCacheKey, mode, strategy: 'exact' });
    return {
      result: buildCacheResult(exactHit, 'exact-cache', { cacheKey: exactCacheKey, iterations: 0 }),
    };
  }

  logOptimizationEvent('cache_miss', { cacheKey: exactCacheKey, mode, strategy: 'exact' });

  if (mode === 'optimize') {
    const similarHit = findSimilarKnowledge(
      input.prompt,
      mode,
      OPTIMIZATION_CONFIG.similarityThreshold
    );

    if (similarHit) {
      logOptimizationEvent('cache_hit', {
        mode,
        strategy: 'similarity',
        similarity: Number(similarHit.similarity.toFixed(3)),
      });

      return {
        result: {
          optimized: similarHit.optimizedPrompt,
          changes: similarHit.optimizationRules.length > 0
            ? similarHit.optimizationRules
            : ['Reused a prior high-similarity optimization result'],
          quality_confidence: similarHit.accuracyScore,
          quality_notes: `Reused a stored optimization from the knowledge base (similarity ${(similarHit.similarity * 100).toFixed(1)}%).`,
          metadata: {
            source: 'similarity-cache',
            iterations: 0,
            similarity: Number(similarHit.similarity.toFixed(3)),
          },
        },
      };
    }

    logOptimizationEvent('cache_miss', { mode, strategy: 'similarity' });
  }

  let currentCandidate = await generateCandidate(input, mode);
  let currentEvaluation = await evaluateCandidate(
    input.prompt,
    currentCandidate,
    mode,
    input.modelId
  );
  let currentTokens = countTokens(currentCandidate.optimized);
  let currentScore = computeOverallScore(originalTokens, currentTokens, currentEvaluation);

  let bestCandidate = currentCandidate;
  let bestEvaluation = currentEvaluation;
  let bestTokens = currentTokens;
  let bestScore = currentScore;
  let stagnationCount = 0;
  let completedIterations = 1;

  logOptimizationEvent('iteration_complete', {
    mode,
    iteration: 1,
    originalTokens,
    optimizedTokens: currentTokens,
    tokenReductionPct: Number(tokenReductionPct(originalTokens, currentTokens).toFixed(2)),
    accuracyScore: currentEvaluation.accuracy_score,
    overallScore: Number(currentScore.toFixed(3)),
  });

  for (let iteration = 2; iteration <= OPTIMIZATION_CONFIG.maxIterations; iteration += 1) {
    const refinedCandidate = await refineCandidate(
      input.prompt,
      currentCandidate,
      currentEvaluation,
      mode,
      input.modelId
    );
    const refinedTokens = countTokens(refinedCandidate.optimized);

    if (!isSafeRefinement(originalTokens, currentTokens, refinedTokens)) {
      logOptimizationEvent(
        'refinement_blocked',
        {
          mode,
          iteration,
          previousTokens: currentTokens,
          refinedTokens,
        },
        'warn'
      );
      break;
    }

    const refinedEvaluation = await evaluateCandidate(
      input.prompt,
      refinedCandidate,
      mode,
      input.modelId
    );
    const refinedScore = computeOverallScore(originalTokens, refinedTokens, refinedEvaluation);
    const improvementPct = computeRelativeImprovement(currentScore, refinedScore);

    completedIterations = iteration;
    logOptimizationEvent('iteration_complete', {
      mode,
      iteration,
      originalTokens,
      optimizedTokens: refinedTokens,
      tokenReductionPct: Number(tokenReductionPct(originalTokens, refinedTokens).toFixed(2)),
      accuracyScore: refinedEvaluation.accuracy_score,
      overallScore: Number(refinedScore.toFixed(3)),
      improvementPct: Number(improvementPct.toFixed(2)),
    });

    if (refinedScore > bestScore) {
      bestCandidate = refinedCandidate;
      bestEvaluation = refinedEvaluation;
      bestTokens = refinedTokens;
      bestScore = refinedScore;
    }

    if (improvementPct < OPTIMIZATION_CONFIG.stagnationThresholdPct) {
      stagnationCount += 1;
    } else {
      stagnationCount = 0;
    }

    currentCandidate = refinedCandidate;
    currentEvaluation = refinedEvaluation;
    currentTokens = refinedTokens;
    currentScore = refinedScore;

    if (stagnationCount >= OPTIMIZATION_CONFIG.stagnationLimit) {
      logOptimizationEvent('early_stop', {
        mode,
        iteration,
        reason: 'stagnation',
        thresholdPct: OPTIMIZATION_CONFIG.stagnationThresholdPct,
      });
      break;
    }
  }

  const finalReduction = tokenReductionPct(originalTokens, bestTokens);
  const finalResult: OptimizationResult = {
    ...bestCandidate,
    metadata: {
      source: 'llm',
      iterations: completedIterations,
      overallScore: Number(bestScore.toFixed(3)),
      cacheKey: exactCacheKey,
    },
  };

  storeCacheEntry(cacheInput, finalResult, {
    accuracyScore: bestEvaluation.accuracy_score,
    overallScore: Number(bestScore.toFixed(3)),
    iterations: completedIterations,
  });
  logOptimizationEvent('cache_write', {
    mode,
    cacheKey: exactCacheKey,
    iterations: completedIterations,
  });

  if (
    bestEvaluation.accuracy_score >= OPTIMIZATION_CONFIG.accuracyBaseline &&
    hasMeaningfulReduction(originalTokens, bestTokens)
  ) {
    storeKnowledgeEntry({
      prompt: input.prompt,
      optimizedPrompt: finalResult.optimized,
      tokenReduction: Number(finalReduction.toFixed(2)),
      accuracyScore: bestEvaluation.accuracy_score,
      optimizationRules: bestEvaluation.optimization_rules,
      mode,
    });
    logOptimizationEvent('knowledge_write', {
      mode,
      tokenReductionPct: Number(finalReduction.toFixed(2)),
      accuracyScore: bestEvaluation.accuracy_score,
    });
  } else {
    logOptimizationEvent('knowledge_skip', {
      mode,
      tokenReductionPct: Number(finalReduction.toFixed(2)),
      accuracyScore: bestEvaluation.accuracy_score,
      baselineAccuracy: OPTIMIZATION_CONFIG.accuracyBaseline,
    });
  }

  return { result: finalResult };
}
