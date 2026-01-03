/**
 * AI Providers Configuration
 *
 * Maps abstract model IDs to actual provider models.
 * Integrates with the project's AI settings system.
 */

import { customProvider, extractReasoningMiddleware, wrapLanguageModel, type LanguageModel } from 'ai';
import { createModelFromSettings } from './index';

// Test environment detection
const isTestEnvironment = process.env.NODE_ENV === 'test';

// Cached model instance
let cachedModel: LanguageModel | null = null;

/**
 * Get the language model for a given model ID
 *
 * Maps abstract model IDs (chat-model, chat-model-reasoning) to
 * actual provider models based on project settings.
 */
export async function getLanguageModel(modelId: string) {
  const { model } = await createModelFromSettings();

  // For reasoning models, wrap with reasoning middleware
  if (modelId === 'chat-model-reasoning') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return wrapLanguageModel({
      model: model as any,
      middleware: extractReasoningMiddleware({ tagName: 'thinking' }),
    });
  }

  return model;
}

/**
 * Get the title generation model
 * Uses a smaller/faster model for generating chat titles
 */
export async function getTitleModel() {
  const { model } = await createModelFromSettings();
  return model;
}

/**
 * Get the artifact model for document generation
 */
export async function getArtifactModel() {
  const { model } = await createModelFromSettings();
  return model;
}

/**
 * Create a custom provider that wraps async model creation
 */
export function createChatProvider() {
  if (isTestEnvironment) {
    // In test environment, use mock models
    try {
      const { artifactModel, chatModel, reasoningModel, titleModel } = require('./models.mock');
      return customProvider({
        languageModels: {
          'chat-model': chatModel,
          'chat-model-reasoning': reasoningModel,
          'title-model': titleModel,
          'artifact-model': artifactModel,
        },
      });
    } catch {
      // Mock file not available, fall through to dynamic provider
    }
  }

  // Return a provider that creates models dynamically
  // Note: This uses a proxy pattern to lazily load models
  return {
    languageModel: (modelId: string) => {
      // Return a placeholder that will be replaced with the actual model
      // This is a workaround for the synchronous customProvider API
      throw new Error(
        `Use getLanguageModel('${modelId}') or getArtifactModel() instead of myProvider.languageModel()`
      );
    },
  };
}

export const myProvider = createChatProvider();
