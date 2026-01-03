/**
 * ChatSDK Schema Types
 *
 * Type definitions that align with Prisma models for ChatSDK compatibility.
 * These types mirror the Prisma schema and provide ChatSDK-compatible aliases.
 */

// Re-export Prisma types for direct usage
export type {
  AiConversation,
  AiMessage,
  AiDocument,
  AiSuggestion,
  AiVote,
  AiStream,
  ChatVisibility,
  ConversationStatus,
} from '@prisma/client';

// ChatSDK-compatible type aliases
// These map to the original ChatSDK naming conventions

/** User type - maps to Prisma User model */
export type User = {
  id: string;
  email: string;
  name?: string | null;
  stackAuthId?: string | null;
};

/** Chat type - alias for AiConversation */
export type Chat = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  title: string;
  userId: string;
  status: 'ACTIVE' | 'ARCHIVED';
  visibility: 'PUBLIC' | 'PRIVATE';
  contextType?: string | null;
  contextId?: string | null;
  lastContext?: unknown;
};

/** DBMessage type - alias for AiMessage with ChatSDK structure */
export type DBMessage = {
  id: string;
  conversationId: string;
  role: string;
  content?: string | null;
  parts?: unknown; // Array of { type: "text" | "image" | "tool-call" | "tool-result", ... }
  attachments?: unknown; // Array of { name, type, url, ... }
  toolCalls?: unknown;
  toolResults?: unknown;
  metadata?: unknown;
  createdAt: Date;
};

/** Vote type - alias for AiVote */
export type Vote = {
  conversationId: string;
  messageId: string;
  isUpvoted: boolean;
};

/** Document type - alias for AiDocument */
export type Document = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  title: string;
  content?: string | null;
  kind: 'text' | 'code' | 'image' | 'sheet';
  userId: string;
};

/** Suggestion type - alias for AiSuggestion */
export type Suggestion = {
  id: string;
  documentId: string;
  documentCreatedAt: Date;
  originalText: string;
  suggestedText: string;
  description?: string | null;
  isResolved: boolean;
  userId: string;
  createdAt: Date;
};

/** Stream type - alias for AiStream */
export type Stream = {
  id: string;
  conversationId: string;
  createdAt: Date;
};

// Visibility type for UI components
export type VisibilityType = 'public' | 'private';

// Helper to convert Prisma enum to UI type
export function toVisibilityType(prismaVisibility: 'PUBLIC' | 'PRIVATE'): VisibilityType {
  return prismaVisibility === 'PUBLIC' ? 'public' : 'private';
}

// Helper to convert UI type to Prisma enum
export function toDbVisibility(uiVisibility: VisibilityType): 'PUBLIC' | 'PRIVATE' {
  return uiVisibility === 'public' ? 'PUBLIC' : 'PRIVATE';
}
