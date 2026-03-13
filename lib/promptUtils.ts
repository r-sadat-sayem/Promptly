import { createHash } from 'crypto';
import { countTokens, truncateToTokenLimit } from '@/lib/tokenCounter';
import { OPTIMIZATION_CONFIG } from '@/lib/optimizationConfig';

export type OptimizationMode = 'optimize' | 'craft';

export function normalizePrompt(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

export function hashText(text: string): string {
  return createHash('sha256').update(text).digest('hex');
}

export function buildCacheKey(parts: Record<string, unknown>): string {
  return hashText(JSON.stringify(parts));
}

export function tokenizeTerms(text: string): string[] {
  const matches = normalizePrompt(text).match(/[a-z0-9]+/g);
  return matches ?? [];
}

export function jaccardSimilarity(a: string, b: string): number {
  const aTerms = new Set(tokenizeTerms(a));
  const bTerms = new Set(tokenizeTerms(b));

  if (aTerms.size === 0 || bTerms.size === 0) return 0;

  let intersection = 0;
  for (const term of aTerms) {
    if (bTerms.has(term)) intersection += 1;
  }

  const union = new Set([...aTerms, ...bTerms]).size;
  return union === 0 ? 0 : intersection / union;
}

export function tokenReductionPct(beforeTokens: number, afterTokens: number): number {
  if (beforeTokens <= 0) return 0;
  return ((beforeTokens - afterTokens) / beforeTokens) * 100;
}

export function clampScore(score: number): number {
  if (Number.isNaN(score)) return 0;
  return Math.max(0, Math.min(1, score));
}

export function computeOutputTokenBudget(
  inputTokens: number,
  mode: OptimizationMode
): number {
  if (mode === 'craft') {
    return Math.min(768, Math.max(256, Math.ceil(inputTokens * 0.7)));
  }
  return Math.min(
    OPTIMIZATION_CONFIG.maxGenerationTokens,
    Math.max(256, Math.ceil(inputTokens * 0.8))
  );
}

export function sanitizePromptInput(text: string): string {
  return truncateToTokenLimit(text, OPTIMIZATION_CONFIG.maxPromptTokens);
}

export function sanitizeFileInput(text: string): string {
  return truncateToTokenLimit(text, OPTIMIZATION_CONFIG.maxFileTokens);
}

export function sanitizeEvaluationInput(text: string): string {
  return truncateToTokenLimit(text, OPTIMIZATION_CONFIG.maxEvaluationTokens);
}

export function isSafeRefinement(
  originalTokens: number,
  previousTokens: number,
  nextTokens: number
): boolean {
  const maxFromOriginal = Math.ceil(
    originalTokens * (1 + OPTIMIZATION_CONFIG.maxRefinementGrowthPct / 100)
  );
  const maxFromPrevious = previousTokens + 64;

  return nextTokens <= maxFromOriginal && nextTokens <= maxFromPrevious;
}

export function hasMeaningfulReduction(
  beforeTokens: number,
  afterTokens: number
): boolean {
  return tokenReductionPct(beforeTokens, afterTokens) >= OPTIMIZATION_CONFIG.minimumKnowledgeReductionPct;
}

export function computeRelativeImprovement(previousScore: number, nextScore: number): number {
  if (previousScore <= 0) {
    return nextScore > 0 ? 100 : 0;
  }
  return ((nextScore - previousScore) / previousScore) * 100;
}

export function ensurePromptPattern(text: string): string {
  return normalizePrompt(text).slice(0, 500);
}
