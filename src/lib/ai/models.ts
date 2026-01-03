/**
 * AI Chat Models Configuration
 *
 * Defines available chat models for the admin AI assistant.
 * Uses the project's configured AI provider from settings.
 */

export const DEFAULT_CHAT_MODEL: string = 'chat-model';

export type ChatModel = {
  id: string;
  name: string;
  description: string;
};

/**
 * Available chat models
 * These are abstract model IDs that get mapped to actual provider models in providers.ts
 */
export const chatModels: ChatModel[] = [
  {
    id: 'chat-model',
    name: 'Standard Chat',
    description: 'General purpose chat model for admin assistance',
  },
  {
    id: 'chat-model-reasoning',
    name: 'Reasoning Model',
    description: 'Uses advanced chain-of-thought reasoning for complex problems',
  },
];

/**
 * Get a chat model by ID
 */
export function getChatModel(id: string): ChatModel | undefined {
  return chatModels.find((model) => model.id === id);
}

/**
 * Check if a model ID is valid
 */
export function isValidChatModel(id: string): boolean {
  return chatModels.some((model) => model.id === id);
}
