/**
 * AI Provider Service
 *
 * Uses Vercel AI Gateway for model access.
 * Provides utilities for checking AI availability and status.
 */

import type { LanguageModel } from 'ai';
import { getAiSettings } from '../settings';
import type { AiSettings } from '../settings/types';
import { DEFAULT_CHAT_MODEL } from './models';
import { getLanguageModel, myProvider } from './providers';

export type AiProvider = 'gateway';

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

  // Use the first enabled model, or fall back to default
  const modelId = settings.enabledModels?.[0] || DEFAULT_CHAT_MODEL;
  const model = getLanguageModel(modelId);

  return { model, settings };
}

/**
 * Check if AI is available (enabled in settings)
 * Note: With Vercel AI Gateway, no API key is needed when deployed on Vercel
 */
export async function isAiAvailable(): Promise<boolean> {
  try {
    const settings = await getAiSettings();
    return settings.enabled;
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
  provider: 'gateway';
  enabledModels: string[];
}> {
  const settings = await getAiSettings();

  return {
    available: settings.enabled,
    enabled: settings.enabled,
    provider: 'gateway',
    enabledModels: settings.enabledModels || [DEFAULT_CHAT_MODEL],
  };
}

// Export types
export type { AiSettings };

// Re-export providers
export { getLanguageModel, getTitleModel, getArtifactModel, myProvider } from './providers';
