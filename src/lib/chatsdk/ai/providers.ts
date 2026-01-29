/**
 * AI providers for chatsdk artifacts
 * Uses Vercel AI Gateway for model access.
 * When deployed on Vercel, authentication is automatic via OIDC.
 */

import { gateway } from "@ai-sdk/gateway";
import {
  extractReasoningMiddleware,
  wrapLanguageModel,
} from "ai";

/**
 * Get a language model from the Vercel AI Gateway
 */
export function getLanguageModel(modelId: string) {
  // For reasoning models, wrap with middleware to extract thinking tags
  if (modelId.includes('reasoning') || modelId.endsWith('-thinking')) {
    const baseModelId = modelId
      .replace('-reasoning', '')
      .replace('-thinking', '');

    return wrapLanguageModel({
      model: gateway.languageModel(baseModelId),
      middleware: extractReasoningMiddleware({ tagName: 'thinking' }),
    });
  }

  return gateway.languageModel(modelId);
}

/**
 * Get the title generation model
 */
export function getTitleModel() {
  return gateway.languageModel('anthropic/claude-haiku-4.5');
}

/**
 * Get the artifact model
 */
export function getArtifactModel() {
  return gateway.languageModel('anthropic/claude-haiku-4.5');
}

/**
 * Legacy myProvider export for backwards compatibility
 */
export const myProvider = {
  languageModel(modelId: string) {
    return getLanguageModel(modelId);
  },
};
