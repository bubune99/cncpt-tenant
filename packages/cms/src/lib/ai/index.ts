/**
 * AI Provider Service
 *
 * Factory for creating AI model instances using Vercel AI SDK.
 * Supports OpenAI, Anthropic, and Google AI providers.
 */

import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import type { LanguageModel } from 'ai';
import { getAiSettings } from '@/lib/settings';
import type { AiSettings } from '@/lib/settings/types';

export type AiProvider = 'openai' | 'anthropic' | 'google';

// Default models for each provider
export const DEFAULT_MODELS: Record<AiProvider, string> = {
  openai: 'gpt-4o',
  anthropic: 'claude-sonnet-4-5-20250514',
  google: 'gemini-1.5-pro',
};

// Available models for each provider
export const AVAILABLE_MODELS: Record<AiProvider, { id: string; name: string }[]> = {
  openai: [
    { id: 'gpt-4o', name: 'GPT-4o' },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
  ],
  anthropic: [
    { id: 'claude-sonnet-4-5-20250514', name: 'Claude Sonnet 4.5' },
    { id: 'claude-haiku-4-5-20250514', name: 'Claude Haiku 4.5' },
    { id: 'claude-3-5-sonnet-latest', name: 'Claude 3.5 Sonnet' },
    { id: 'claude-3-5-haiku-latest', name: 'Claude 3.5 Haiku' },
    { id: 'claude-3-opus-latest', name: 'Claude 3 Opus' },
  ],
  google: [
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
    { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash' },
  ],
};

interface CreateModelOptions {
  provider?: AiProvider;
  model?: string;
  apiKey?: string;
}

/**
 * Create an AI model instance
 */
export function createModel(options: CreateModelOptions = {}): LanguageModel {
  const { provider = 'openai', model, apiKey } = options;

  const modelId = model || DEFAULT_MODELS[provider];

  switch (provider) {
    case 'openai': {
      const openai = createOpenAI({
        apiKey: apiKey || process.env.OPENAI_API_KEY,
      });
      return openai(modelId);
    }
    case 'anthropic': {
      const anthropic = createAnthropic({
        apiKey: apiKey || process.env.ANTHROPIC_API_KEY,
      });
      return anthropic(modelId);
    }
    case 'google': {
      const google = createGoogleGenerativeAI({
        apiKey: apiKey || process.env.GOOGLE_AI_API_KEY,
      });
      return google(modelId);
    }
    default:
      throw new Error(`Unknown AI provider: ${provider}`);
  }
}

/**
 * Create an AI model instance from settings
 */
export async function createModelFromSettings(): Promise<{
  model: LanguageModel;
  settings: AiSettings;
}> {
  const settings = await getAiSettings();

  if (!settings.enabled) {
    throw new Error('AI is not enabled. Please enable it in settings.');
  }

  if (!settings.apiKey) {
    throw new Error(
      `No API key configured for ${settings.provider}. Please add one in settings or environment variables.`
    );
  }

  const model = createModel({
    provider: settings.provider,
    model: settings.model,
    apiKey: settings.apiKey,
  });

  return { model, settings };
}

/**
 * Check if AI is available (enabled and configured)
 */
export async function isAiAvailable(): Promise<boolean> {
  try {
    const settings = await getAiSettings();
    return settings.enabled && !!settings.apiKey;
  } catch {
    return false;
  }
}

/**
 * Get the current AI configuration status
 */
export async function getAiStatus(): Promise<{
  available: boolean;
  enabled: boolean;
  provider: AiProvider;
  model: string;
  hasApiKey: boolean;
}> {
  const settings = await getAiSettings();
  const hasApiKey = !!settings.apiKey;

  return {
    available: settings.enabled && hasApiKey,
    enabled: settings.enabled,
    provider: settings.provider,
    model: settings.model,
    hasApiKey,
  };
}

// Export types
export type { AiSettings };
