/**
 * AI Chat Models Configuration
 *
 * Defines available chat models via Vercel AI Gateway.
 * Models use gateway paths like "anthropic/claude-sonnet-4.5"
 */

export const DEFAULT_CHAT_MODEL: string = 'anthropic/claude-sonnet-4.5';

export type ChatModel = {
  id: string;
  name: string;
  provider: string;
  description: string;
};

/**
 * Available chat models via Vercel AI Gateway
 *
 * Using Anthropic models for now, but can easily add OpenAI, Google, etc.
 */
export const chatModels: ChatModel[] = [
  {
    id: 'anthropic/claude-sonnet-4.5',
    name: 'Claude 4.5 Sonnet',
    provider: 'Anthropic',
    description: 'Balanced performance and cost for most tasks',
  },
  {
    id: 'anthropic/claude-haiku-4.5',
    name: 'Claude 4.5 Haiku',
    provider: 'Anthropic',
    description: 'Fast and cost-effective for simple tasks',
  },
  {
    id: 'anthropic/claude-opus-4.5',
    name: 'Claude 4.5 Opus',
    provider: 'Anthropic',
    description: 'Most capable model for complex tasks',
  },
];

/**
 * Group models by provider for UI display
 */
export const modelsByProvider = chatModels.reduce(
  (acc, model) => {
    if (!acc[model.provider]) {
      acc[model.provider] = [];
    }
    acc[model.provider].push(model);
    return acc;
  },
  {} as Record<string, ChatModel[]>
);

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

/**
 * Check if a model supports reasoning/extended thinking
 */
export function isReasoningModel(modelId: string): boolean {
  return modelId.includes('reasoning') || modelId.endsWith('-thinking');
}
