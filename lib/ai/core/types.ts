/**
 * AI Chat Types (Shared Core)
 */

export interface ChatMessage {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  parts?: Array<
    | { type: "text"; text: string }
    | { type: "file"; url: string; filename?: string; mediaType: string }
    | { type: "reasoning"; text: string }
    | { type: "tool-invocation"; toolInvocation: unknown }
  >
  createdAt?: Date
  metadata?: Record<string, unknown>
}

export interface ChatRequestBody {
  id: string
  messages: ChatMessage[]
  selectedModel?: string
  context?: BaseChatContext
}

// Base context that both CMS and Dashboard extend
export interface BaseChatContext {
  type: string
  id?: string
  title?: string
  data?: Record<string, unknown>
}

// Dashboard-specific context
export interface DashboardChatContext extends BaseChatContext {
  type:
    | "general"
    | "overview"
    | "subdomain"
    | "team"
    | "domains"
    | "billing"
    | "deployment"
    | "settings"
  subdomain?: string
  teamId?: string
  teamRole?: "owner" | "admin" | "member" | "viewer"
  currentPage?: string
  section?: string
}

// CMS-specific context (for reference)
export interface CMSChatContext extends BaseChatContext {
  type: "general" | "product" | "order" | "page" | "user" | "blog"
}

export type VisibilityType = "public" | "private"

// Conversation with messages for API responses
export interface ConversationWithMessages {
  id: string
  userId: string
  title: string
  status: "ACTIVE" | "ARCHIVED"
  contextType: string | null
  contextId: string | null
  createdAt: Date
  updatedAt: Date
  messages: Array<{
    id: string
    role: string
    content: string
    createdAt: Date
    metadata?: Record<string, unknown>
  }>
}

// Re-export for convenience
export type { ChatModel } from "./models"
export { chatModels } from "./models"
