"use client"

import dynamic from "next/dynamic"

// Dynamic import to avoid SSR hydration issues with Zustand
const ChatPanel = dynamic(
  () => import("./chat-panel").then((mod) => mod.ChatPanel),
  {
    ssr: false,
    loading: () => null,
  }
)

export function DashboardChat() {
  return <ChatPanel />
}

// Re-export store hooks for external use
export {
  useDashboardChatPanel,
  useDashboardChatMessages,
  useDashboardChatContext,
  useDashboardChatConversation,
  useDashboardChatHistory,
} from "./store"
