/**
 * AI Providers Configuration
 *
 * Supports multiple provider backends with fallback:
 * 1. Vercel AI Gateway (automatic on Vercel, needs AI_GATEWAY_API_KEY locally)
 * 2. Direct Anthropic API (ANTHROPIC_API_KEY)
 * 3. Direct OpenAI API (OPENAI_API_KEY)
 */

import { gateway } from '@ai-sdk/gateway';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { extractReasoningMiddleware, wrapLanguageModel } from 'ai';
import { isReasoningModel } from './models';

// Check if we should use direct API instead of gateway
const useDirectApi = !process.env.VERCEL && !process.env.AI_GATEWAY_API_KEY;

// Debug logging for provider configuration
console.log('[AI Providers] Configuration:', {
  isVercel: !!process.env.VERCEL,
  hasGatewayKey: !!process.env.AI_GATEWAY_API_KEY,
  hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY,
  hasOpenAIKey: !!process.env.OPENAI_API_KEY,
  useDirectApi,
});

// Direct provider instances (lazy initialized)
let anthropicProvider: ReturnType<typeof createAnthropic> | null = null;
let openaiProvider: ReturnType<typeof createOpenAI> | null = null;

function getAnthropicProvider() {
  if (!anthropicProvider && process.env.ANTHROPIC_API_KEY) {
    anthropicProvider = createAnthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return anthropicProvider;
}

function getOpenAIProvider() {
  if (!openaiProvider && process.env.OPENAI_API_KEY) {
    openaiProvider = createOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiProvider;
}

/**
 * Get a language model, with fallback to direct API keys
 *
 * @param modelId - Gateway model ID (e.g., "anthropic/claude-sonnet-4.5")
 * @returns Language model instance
 */
export function getLanguageModel(modelId: string) {
  console.log('[AI Providers] getLanguageModel called with:', modelId);

  // Extract provider and model from ID (e.g., "anthropic/claude-sonnet-4.5")
  const [provider, ...modelParts] = modelId.split('/');
  const modelName = modelParts.join('/');

  // Determine base model ID for reasoning models
  const isReasoning = isReasoningModel(modelId);
  const baseModelId = isReasoning
    ? modelId.replace('-reasoning', '').replace('-thinking', '')
    : modelId;
  const baseModelName = isReasoning
    ? modelName.replace('-reasoning', '').replace('-thinking', '')
    : modelName;

  console.log('[AI Providers] Provider:', provider, '| Model:', modelName, '| isReasoning:', isReasoning);

  // Try direct API if gateway not available
  if (useDirectApi) {
    console.log('[AI Providers] Using direct API path');
    let model;

    if (provider === 'anthropic' && getAnthropicProvider()) {
      console.log('[AI Providers] ✓ Using direct Anthropic API');
      model = getAnthropicProvider()!(baseModelName);
    } else if (provider === 'openai' && getOpenAIProvider()) {
      console.log('[AI Providers] ✓ Using direct OpenAI API');
      model = getOpenAIProvider()!(baseModelName);
    } else {
      console.log('[AI Providers] ⚠ No direct provider available, falling back to gateway');
      // Fallback to gateway anyway (will error if not configured)
      model = gateway.languageModel(baseModelId);
    }

    // Wrap reasoning models
    if (isReasoning) {
      return wrapLanguageModel({
        model,
        middleware: extractReasoningMiddleware({ tagName: 'thinking' }),
      });
    }

    return model;
  }

  // Use Vercel AI Gateway (default for Vercel deployment)
  console.log('[AI Providers] Using Vercel AI Gateway');
  if (isReasoning) {
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
  return getLanguageModel('anthropic/claude-haiku-4.5');
}

/**
 * Get the artifact model for document generation
 */
export function getArtifactModel() {
  return getLanguageModel('anthropic/claude-haiku-4.5');
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
