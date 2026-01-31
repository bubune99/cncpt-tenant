import type { LanguageModelUsage } from "ai";

/**
 * Usage data for token cost and context tracking.
 * Compatible with tokenlens/helpers UsageData type.
 * Can be extended with actual tokenlens if installed.
 */
export type UsageData = {
  context?: {
    remaining?: number;
    percentUsed?: number;
    total?: number;
    totalMax?: number;
    combinedMax?: number;
    inputMax?: number;
  };
  costUSD?: {
    cacheReadUSD?: number;
    inputUSD?: number;
    outputUSD?: number;
    reasoningUSD?: number;
    totalUSD?: number;
  };
};

// Server-merged usage: base usage + TokenLens summary + optional modelId
export type AppUsage = LanguageModelUsage & UsageData & { modelId?: string };
