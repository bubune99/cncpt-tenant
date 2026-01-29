/**
 * Dashboard Chat Store
 *
 * Zustand store for dashboard chat state management.
 */

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { DashboardChatContext } from "@/lib/ai/core/types"

export type ChatPanelMode = "collapsed" | "minimized" | "side" | "full"

interface ChatMessage {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  timestamp?: Date
}

interface DashboardChatState {
  // Panel state
  mode: ChatPanelMode
  setMode: (mode: ChatPanelMode) => void
  togglePanel: () => void
  minimizePanel: () => void
  expandPanel: () => void

  // Current conversation
  conversationId: string | null
  messages: ChatMessage[]
  isLoading: boolean
  error: string | null

  // Context awareness
  context: DashboardChatContext
  setContext: (context: DashboardChatContext) => void

  // Message actions
  addMessage: (message: ChatMessage) => void
  updateMessage: (id: string, updates: Partial<ChatMessage>) => void
  setMessages: (messages: ChatMessage[]) => void
  clearMessages: () => void

  // Conversation actions
  setConversationId: (id: string | null) => void
  startNewConversation: () => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void

  // History
  conversationHistory: Array<{
    id: string
    title: string
    lastMessage: string
    updatedAt: Date
    context?: DashboardChatContext
  }>
  addToHistory: (conversation: {
    id: string
    title: string
    lastMessage: string
    context?: DashboardChatContext
  }) => void
  removeFromHistory: (id: string) => void
  loadConversation: (id: string) => void
  clearHistory: () => void
}

// Default context for dashboard
const defaultDashboardContext: DashboardChatContext = {
  type: "general",
}

// Create the store with dashboard-specific storage key
export const useDashboardChatStore = create<DashboardChatState>()(
  persist(
    (set, get) => ({
      // Panel state
      mode: "collapsed",
      setMode: (mode) => set({ mode }),
      togglePanel: () => {
        const current = get().mode
        if (current === "collapsed" || current === "minimized") {
          set({ mode: "side" })
        } else {
          set({ mode: "collapsed" })
        }
      },
      minimizePanel: () => {
        const current = get().mode
        if (current === "side" || current === "full") {
          set({ mode: "minimized" })
        }
      },
      expandPanel: () => {
        const current = get().mode
        if (current === "minimized" || current === "collapsed") {
          set({ mode: "side" })
        }
      },

      // Current conversation
      conversationId: null,
      messages: [],
      isLoading: false,
      error: null,

      // Context
      context: defaultDashboardContext,
      setContext: (context) => set({ context }),

      // Message actions
      addMessage: (message) =>
        set((state) => ({
          messages: [...state.messages, message],
        })),
      updateMessage: (id, updates) =>
        set((state) => ({
          messages: state.messages.map((msg) =>
            msg.id === id ? { ...msg, ...updates } : msg
          ),
        })),
      setMessages: (messages) => set({ messages }),
      clearMessages: () => set({ messages: [] }),

      // Conversation actions
      setConversationId: (id) => set({ conversationId: id }),
      startNewConversation: () => {
        const newId = crypto.randomUUID()
        set({
          conversationId: newId,
          messages: [],
          error: null,
        })
      },
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),

      // History
      conversationHistory: [],
      addToHistory: (conversation) =>
        set((state) => {
          const filtered = state.conversationHistory.filter(
            (c) => c.id !== conversation.id
          )
          return {
            conversationHistory: [
              { ...conversation, updatedAt: new Date() },
              ...filtered,
            ].slice(0, 50),
          }
        }),
      removeFromHistory: (id) =>
        set((state) => ({
          conversationHistory: state.conversationHistory.filter((c) => c.id !== id),
        })),
      loadConversation: (id) => {
        const history = get().conversationHistory.find((c) => c.id === id)
        if (history) {
          set({
            conversationId: id,
            messages: [],
            error: null,
            context: history.context || defaultDashboardContext,
          })
        }
      },
      clearHistory: () => set({ conversationHistory: [] }),
    }),
    {
      name: "dashboard-chat-storage",
      partialize: (state) => ({
        mode: state.mode,
        conversationId: state.conversationId,
        messages: state.messages,
        conversationHistory: state.conversationHistory,
      }),
    }
  )
)

// Selector hooks
export function useDashboardChatPanel() {
  const mode = useDashboardChatStore((s) => s.mode)
  const setMode = useDashboardChatStore((s) => s.setMode)
  const togglePanel = useDashboardChatStore((s) => s.togglePanel)
  const minimizePanel = useDashboardChatStore((s) => s.minimizePanel)
  const expandPanel = useDashboardChatStore((s) => s.expandPanel)
  return { mode, setMode, togglePanel, minimizePanel, expandPanel }
}

export function useDashboardChatMessages() {
  const messages = useDashboardChatStore((s) => s.messages)
  const addMessage = useDashboardChatStore((s) => s.addMessage)
  const updateMessage = useDashboardChatStore((s) => s.updateMessage)
  const setMessages = useDashboardChatStore((s) => s.setMessages)
  const clearMessages = useDashboardChatStore((s) => s.clearMessages)
  return { messages, addMessage, updateMessage, setMessages, clearMessages }
}

export function useDashboardChatContext() {
  const context = useDashboardChatStore((s) => s.context)
  const setContext = useDashboardChatStore((s) => s.setContext)
  return { context, setContext }
}

export function useDashboardChatConversation() {
  const conversationId = useDashboardChatStore((s) => s.conversationId)
  const isLoading = useDashboardChatStore((s) => s.isLoading)
  const error = useDashboardChatStore((s) => s.error)
  const setConversationId = useDashboardChatStore((s) => s.setConversationId)
  const startNewConversation = useDashboardChatStore((s) => s.startNewConversation)
  const setLoading = useDashboardChatStore((s) => s.setLoading)
  const setError = useDashboardChatStore((s) => s.setError)
  return {
    conversationId,
    isLoading,
    error,
    setConversationId,
    startNewConversation,
    setLoading,
    setError,
  }
}

export function useDashboardChatHistory() {
  const conversationHistory = useDashboardChatStore((s) => s.conversationHistory)
  const addToHistory = useDashboardChatStore((s) => s.addToHistory)
  const removeFromHistory = useDashboardChatStore((s) => s.removeFromHistory)
  const loadConversation = useDashboardChatStore((s) => s.loadConversation)
  const clearHistory = useDashboardChatStore((s) => s.clearHistory)
  return {
    conversationHistory,
    addToHistory,
    removeFromHistory,
    loadConversation,
    clearHistory,
  }
}
