/**
 * AI Providers Configuration
 *
 * Uses Vercel AI Gateway for model access.
 * When deployed on Vercel, authentication is automatic via OIDC.
 * For local development, set AI_GATEWAY_API_KEY environment variable.
 */

import { gateway } from '@ai-sdk/gateway';
import { extractReasoningMiddleware, wrapLanguageModel } from 'ai';
import { isReasoningModel } from './models';

/**
 * Get a language model from the Vercel AI Gateway
 *
 * @param modelId - Gateway model ID (e.g., "anthropic/claude-sonnet-4.5")
 * @returns Language model instance
 */
export function getLanguageModel(modelId: string) {
  // For reasoning models, wrap with middleware to extract thinking tags
  if (isReasoningModel(modelId)) {
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
 * Uses a fast, cost-effective model for generating chat titles
 */
export function getTitleModel() {
  return gateway.languageModel('anthropic/claude-haiku-4.5');
}

/**
 * Get the artifact model for document generation
 */
export function getArtifactModel() {
  return gateway.languageModel('anthropic/claude-haiku-4.5');
}

/**
 * Legacy myProvider export for backwards compatibility
 * Wraps the gateway in the old interface
 */
export const myProvider = {
  languageModel(modelId: string) {
    return getLanguageModel(modelId);
  },
};
