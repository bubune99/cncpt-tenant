/**
 * Dashboard Chat Store
 *
 * Zustand store for dashboard chat state management.
 */

import {
  createChatStore,
  createChatSelectors,
  type DashboardChatContext,
} from "@/lib/ai/core"

// Default context for dashboard
const defaultDashboardContext: DashboardChatContext = {
  type: "general",
}

// Create the store with dashboard-specific storage key
export const useDashboardChatStore = createChatStore<DashboardChatContext>(
  "dashboard-chat-storage",
  defaultDashboardContext
)

// Create selector hooks
const selectors = createChatSelectors(useDashboardChatStore)

export const useDashboardChatPanel = selectors.useChatPanel
export const useDashboardChatMessages = selectors.useChatMessages
export const useDashboardChatContext = selectors.useChatContext
export const useDashboardChatConversation = selectors.useChatConversation
export const useDashboardChatHistory = selectors.useChatHistory
