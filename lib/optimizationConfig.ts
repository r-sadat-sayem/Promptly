export const OPTIMIZATION_CONFIG = {
  maxIterations: 5,
  stagnationThresholdPct: 5,
  stagnationLimit: 2,
  accuracyBaseline: 0.85,
  minimumKnowledgeReductionPct: 10,
  similarityThreshold: 0.9,
  maxPromptTokens: 6000,
  maxFileTokens: 2500,
  maxEvaluationTokens: 3000,
  maxGenerationTokens: 2048,
  maxRefinementGrowthPct: 10,
} as const;
