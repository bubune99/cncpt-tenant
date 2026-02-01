"use client"

/**
 * Dashboard Chat Component
 *
 * Wrapper component that handles hydration and provides the chat panel
 * in the dashboard layout.
 */

import dynamic from "next/dynamic"

// Dynamic import to avoid SSR hydration issues with Zustand persist
const ChatPanel = dynamic(
  () => import("./chat-panel").then((mod) => ({ default: mod.ChatPanel })),
  { ssr: false }
)

export function DashboardChat() {
  return <ChatPanel />
}

// Export the ChatPanel for direct use if needed
export { ChatPanel } from "./chat-panel"

// Re-export store hooks for external use
export {
  useDashboardChatPanel,
  useDashboardChatMessages,
  useDashboardChatContext,
  useDashboardChatConversation,
  useDashboardChatHistory,
} from "./store"
