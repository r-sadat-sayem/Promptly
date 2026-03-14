import db from '@/lib/db';
import type { OptimizationResult } from '@/lib/optimizer';
import {
  buildCacheKey,
  ensurePromptPattern,
  hashText,
  jaccardSimilarity,
  normalizePrompt,
  type OptimizationMode,
} from '@/lib/promptUtils';

export interface CacheLookupInput {
  prompt: string;
  mode: OptimizationMode;
  fileHash?: string | null;
  craftAsSystemPrompt?: boolean;
  modelId: string;
}

export interface KnowledgeEntryInput {
  prompt: string;
  optimizedPrompt: string;
  tokenReduction: number;
  accuracyScore: number;
  optimizationRules: string[];
  mode: OptimizationMode;
}

interface CacheRow {
  cache_key: string;
  optimized_prompt: string;
  changes_json: string;
  quality_confidence: number;
  quality_notes: string;
  metadata_json: string | null;
}

interface KnowledgeRow {
  optimized_prompt: string;
  optimization_rules_json: string;
  accuracy_score: number;
  token_reduction: number;
  normalized_prompt: string;
}

export interface SimilarKnowledgeMatch {
  optimizedPrompt: string;
  optimizationRules: string[];
  accuracyScore: number;
  tokenReduction: number;
  similarity: number;
}

export function getExactCacheKey(input: CacheLookupInput): string {
  return buildCacheKey({
    prompt: normalizePrompt(input.prompt),
    mode: input.mode,
    fileHash: input.fileHash ?? null,
    craftAsSystemPrompt: input.craftAsSystemPrompt ?? false,
    modelId: input.modelId,
  });
}

export function findExactCache(key: string): OptimizationResult | null {
  const row = db.prepare(
    `SELECT cache_key, optimized_prompt, changes_json, quality_confidence, quality_notes, metadata_json
     FROM optimization_cache
     WHERE cache_key = ?`
  ).get(key) as CacheRow | undefined;

  if (!row) return null;

  return {
    optimized: row.optimized_prompt,
    changes: JSON.parse(row.changes_json),
    quality_confidence: row.quality_confidence,
    quality_notes: row.quality_notes,
    metadata: row.metadata_json ? JSON.parse(row.metadata_json) : undefined,
  };
}

export function markCacheHit(key: string) {
  db.prepare(
    `UPDATE optimization_cache
     SET hit_count = hit_count + 1, last_hit_at = ?
     WHERE cache_key = ?`
  ).run(Date.now(), key);
}

export function storeCacheEntry(
  input: CacheLookupInput,
  result: OptimizationResult,
  metadata: Record<string, unknown>
) {
  const now = Date.now();
  const normalizedPrompt = normalizePrompt(input.prompt);
  const promptHash = hashText(normalizedPrompt);
  const key = getExactCacheKey(input);

  db.prepare(
    `INSERT INTO optimization_cache (
      cache_key, prompt_hash, mode, normalized_prompt, normalized_file_hash,
      optimized_prompt, changes_json, quality_confidence, quality_notes,
      metadata_json, created_at, last_hit_at, hit_count
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    ON CONFLICT(cache_key) DO UPDATE SET
      optimized_prompt = excluded.optimized_prompt,
      changes_json = excluded.changes_json,
      quality_confidence = excluded.quality_confidence,
      quality_notes = excluded.quality_notes,
      metadata_json = excluded.metadata_json,
      last_hit_at = excluded.last_hit_at`
  ).run(
    key,
    promptHash,
    input.mode,
    normalizedPrompt,
    input.fileHash ?? null,
    result.optimized,
    JSON.stringify(result.changes),
    result.quality_confidence,
    result.quality_notes,
    JSON.stringify(metadata),
    now,
    now
  );
}

export function storeKnowledgeEntry(input: KnowledgeEntryInput) {
  const normalizedPrompt = normalizePrompt(input.prompt);

  db.prepare(
    `INSERT INTO optimization_knowledge (
      prompt_hash, mode, normalized_prompt, original_prompt_pattern,
      optimized_prompt, token_reduction, accuracy_score, optimization_rules_json, timestamp
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    hashText(normalizedPrompt),
    input.mode,
    normalizedPrompt,
    ensurePromptPattern(input.prompt),
    input.optimizedPrompt,
    input.tokenReduction,
    input.accuracyScore,
    JSON.stringify(input.optimizationRules),
    Date.now()
  );
}

export function findSimilarKnowledge(
  prompt: string,
  mode: OptimizationMode,
  threshold: number
): SimilarKnowledgeMatch | null {
  // This repository has no embedding provider today, so similarity uses
  // deterministic lexical overlap to stay dependency-free and predictable.
  const normalizedPrompt = normalizePrompt(prompt);
  const rows = db.prepare(
    `SELECT optimized_prompt, optimization_rules_json, accuracy_score, token_reduction, normalized_prompt
     FROM optimization_knowledge
     WHERE mode = ?
     ORDER BY timestamp DESC
     LIMIT 200`
  ).all(mode) as KnowledgeRow[];

  let bestMatch: SimilarKnowledgeMatch | null = null;
  for (const row of rows) {
    const similarity = jaccardSimilarity(normalizedPrompt, row.normalized_prompt);
    if (similarity < threshold) continue;

    if (!bestMatch || similarity > bestMatch.similarity) {
      bestMatch = {
        optimizedPrompt: row.optimized_prompt,
        optimizationRules: JSON.parse(row.optimization_rules_json),
        accuracyScore: row.accuracy_score,
        tokenReduction: row.token_reduction,
        similarity,
      };
    }
  }

  return bestMatch;
}
