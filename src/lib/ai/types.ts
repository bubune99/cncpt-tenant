/**
 * AI Chat Types
 */

export interface Attachment {
  url: string;
  name: string;
  contentType: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  parts?: Array<
    | { type: 'text'; text: string }
    | { type: 'file'; url: string; filename?: string; mediaType: string }
    | { type: 'reasoning'; text: string }
  >;
  createdAt?: Date;
  metadata?: Record<string, unknown>;
}

export interface ChatContext {
  type: 'product' | 'order' | 'page' | 'general';
  id?: string;
  data?: Record<string, unknown>;
}

export interface ChatRequestBody {
  id: string;
  message: ChatMessage;
  messages?: ChatMessage[];
  selectedModel?: string;
  context?: ChatContext;
}

export interface ChatModel {
  id: string;
  name: string;
  description: string;
  provider: 'openai' | 'anthropic' | 'google';
}

export const chatModels: ChatModel[] = [
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    description: 'Most capable OpenAI model',
    provider: 'openai',
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    description: 'Fast and efficient OpenAI model',
    provider: 'openai',
  },
  {
    id: 'claude-3-5-sonnet-latest',
    name: 'Claude 3.5 Sonnet',
    description: 'Balanced Anthropic model',
    provider: 'anthropic',
  },
  {
    id: 'claude-3-5-haiku-latest',
    name: 'Claude 3.5 Haiku',
    description: 'Fast Anthropic model',
    provider: 'anthropic',
  },
  {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    description: 'Advanced Google model',
    provider: 'google',
  },
  {
    id: 'gemini-1.5-flash',
    name: 'Gemini 1.5 Flash',
    description: 'Fast Google model',
    provider: 'google',
  },
];

export type VisibilityType = 'public' | 'private';

// Conversation with messages for API responses
export interface ConversationWithMessages {
  id: string;
  userId: string;
  title: string;
  status: 'ACTIVE' | 'ARCHIVED';
  contextType: string | null;
  contextId: string | null;
  createdAt: Date;
  updatedAt: Date;
  messages: Array<{
    id: string;
    role: string;
    content: string;
    createdAt: Date;
    metadata?: Record<string, unknown>;
  }>;
}
