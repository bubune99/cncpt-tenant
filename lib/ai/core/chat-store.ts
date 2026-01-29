/**
 * Chat State Store (Zustand) - Shared Core
 *
 * Generic state management for chat panels.
 * Can be configured for different contexts (CMS, Dashboard, etc.)
 */

import { create, type StateCreator } from "zustand"
import { persist, type PersistOptions } from "zustand/middleware"
import type { ChatMessage, BaseChatContext } from "./types"

export type ChatPanelMode = "collapsed" | "minimized" | "side" | "full"

interface ChatState<TContext extends BaseChatContext = BaseChatContext> {
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
  context: TContext
  setContext: (context: TContext) => void

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
    context?: TContext
  }>
  addToHistory: (conversation: {
    id: string
    title: string
    lastMessage: string
    context?: TContext
  }) => void
  removeFromHistory: (id: string) => void
  loadConversation: (id: string) => void
  clearHistory: () => void
}

/**
 * Create a chat store with configurable storage key and default context
 */
export function createChatStore<TContext extends BaseChatContext>(
  storageKey: string,
  defaultContext: TContext
) {
  type State = ChatState<TContext>

  const stateCreator: StateCreator<State, [], [["zustand/persist", Partial<State>]]> = (
    set,
    get
  ) => ({
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
    context: defaultContext,
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
          context: history.context || defaultContext,
        })
      }
    },
    clearHistory: () => set({ conversationHistory: [] }),
  })

  const persistOptions: PersistOptions<State, Partial<State>> = {
    name: storageKey,
    partialize: (state) => ({
      mode: state.mode,
      conversationId: state.conversationId,
      messages: state.messages,
      conversationHistory: state.conversationHistory,
    }),
  }

  return create<State>()(persist(stateCreator, persistOptions))
}

// Selector hook factory
export function createChatSelectors<TContext extends BaseChatContext>(
  useStore: ReturnType<typeof createChatStore<TContext>>
) {
  return {
    useChatPanel: () => {
      const mode = useStore((s) => s.mode)
      const setMode = useStore((s) => s.setMode)
      const togglePanel = useStore((s) => s.togglePanel)
      const minimizePanel = useStore((s) => s.minimizePanel)
      const expandPanel = useStore((s) => s.expandPanel)
      return { mode, setMode, togglePanel, minimizePanel, expandPanel }
    },

    useChatMessages: () => {
      const messages = useStore((s) => s.messages)
      const addMessage = useStore((s) => s.addMessage)
      const updateMessage = useStore((s) => s.updateMessage)
      const setMessages = useStore((s) => s.setMessages)
      const clearMessages = useStore((s) => s.clearMessages)
      return { messages, addMessage, updateMessage, setMessages, clearMessages }
    },

    useChatContext: () => {
      const context = useStore((s) => s.context)
      const setContext = useStore((s) => s.setContext)
      return { context, setContext }
    },

    useChatConversation: () => {
      const conversationId = useStore((s) => s.conversationId)
      const isLoading = useStore((s) => s.isLoading)
      const error = useStore((s) => s.error)
      const setConversationId = useStore((s) => s.setConversationId)
      const startNewConversation = useStore((s) => s.startNewConversation)
      const setLoading = useStore((s) => s.setLoading)
      const setError = useStore((s) => s.setError)
      return {
        conversationId,
        isLoading,
        error,
        setConversationId,
        startNewConversation,
        setLoading,
        setError,
      }
    },

    useChatHistory: () => {
      const conversationHistory = useStore((s) => s.conversationHistory)
      const addToHistory = useStore((s) => s.addToHistory)
      const removeFromHistory = useStore((s) => s.removeFromHistory)
      const loadConversation = useStore((s) => s.loadConversation)
      const clearHistory = useStore((s) => s.clearHistory)
      return {
        conversationHistory,
        addToHistory,
        removeFromHistory,
        loadConversation,
        clearHistory,
      }
    },
  }
}
