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

// ChatModel type - re-exported from models.ts for backwards compatibility
// Use the chatModels from './models' instead
export type { ChatModel } from './models';
export { chatModels } from './models';

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
