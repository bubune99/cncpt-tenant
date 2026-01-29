/**
 * AI Core Module (Shared)
 *
 * Exports shared AI infrastructure for both CMS and Dashboard chat.
 */

// Providers
export { getLanguageModel, getTitleModel, aiProvider } from "./providers"

// Models
export {
  DEFAULT_CHAT_MODEL,
  chatModels,
  modelsByProvider,
  getChatModel,
  isValidChatModel,
  isReasoningModel,
  type ChatModel,
} from "./models"

// Types
export type {
  ChatMessage,
  ChatRequestBody,
  BaseChatContext,
  DashboardChatContext,
  CMSChatContext,
  VisibilityType,
  ConversationWithMessages,
} from "./types"

// Chat Store
export {
  createChatStore,
  createChatSelectors,
  type ChatPanelMode,
} from "./chat-store"
