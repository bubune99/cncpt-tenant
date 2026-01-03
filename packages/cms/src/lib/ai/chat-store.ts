/**
 * Chat State Store (Zustand)
 *
 * Global state management for the admin chat panel.
 * Persists across route changes within the admin panel.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ChatMessage } from './types';

export type ChatPanelMode = 'collapsed' | 'side' | 'full';

export interface ChatContext {
  type: 'general' | 'product' | 'order' | 'page' | 'user' | 'blog';
  id?: string;
  title?: string;
  data?: Record<string, unknown>;
}

interface ChatState {
  // Panel state
  mode: ChatPanelMode;
  setMode: (mode: ChatPanelMode) => void;
  togglePanel: () => void;

  // Current conversation
  conversationId: string | null;
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;

  // Context awareness
  context: ChatContext;
  setContext: (context: ChatContext) => void;

  // Message actions
  addMessage: (message: ChatMessage) => void;
  updateMessage: (id: string, updates: Partial<ChatMessage>) => void;
  setMessages: (messages: ChatMessage[]) => void;
  clearMessages: () => void;

  // Conversation actions
  setConversationId: (id: string | null) => void;
  startNewConversation: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // History
  conversationHistory: Array<{
    id: string;
    title: string;
    lastMessage: string;
    updatedAt: Date;
    context?: ChatContext;
  }>;
  addToHistory: (conversation: { id: string; title: string; lastMessage: string; context?: ChatContext }) => void;
  removeFromHistory: (id: string) => void;
  loadConversation: (id: string) => void;
  clearHistory: () => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      // Panel state
      mode: 'collapsed',
      setMode: (mode) => set({ mode }),
      togglePanel: () => {
        const current = get().mode;
        if (current === 'collapsed') {
          set({ mode: 'side' });
        } else {
          set({ mode: 'collapsed' });
        }
      },

      // Current conversation
      conversationId: null,
      messages: [],
      isLoading: false,
      error: null,

      // Context
      context: { type: 'general' },
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
        const newId = crypto.randomUUID();
        set({
          conversationId: newId,
          messages: [],
          error: null,
        });
      },
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),

      // History
      conversationHistory: [],
      addToHistory: (conversation) =>
        set((state) => {
          // Remove existing entry if present, add to top
          const filtered = state.conversationHistory.filter(
            (c) => c.id !== conversation.id
          );
          return {
            conversationHistory: [
              { ...conversation, updatedAt: new Date() },
              ...filtered,
            ].slice(0, 50), // Keep last 50 conversations
          };
        }),
      removeFromHistory: (id) =>
        set((state) => ({
          conversationHistory: state.conversationHistory.filter(
            (c) => c.id !== id
          ),
        })),
      loadConversation: (id) => {
        const history = get().conversationHistory.find((c) => c.id === id);
        if (history) {
          set({
            conversationId: id,
            messages: [], // Messages will be loaded from the useChat hook via transport
            error: null,
            context: history.context || { type: 'general' },
          });
        }
      },
      clearHistory: () => set({ conversationHistory: [] }),
    }),
    {
      name: 'admin-chat-storage',
      partialize: (state) => ({
        // Only persist these fields
        mode: state.mode,
        conversationId: state.conversationId,
        messages: state.messages,
        conversationHistory: state.conversationHistory,
      }),
    }
  )
);

// Selector hooks for common patterns
export const useChatPanel = () => {
  const mode = useChatStore((s) => s.mode);
  const setMode = useChatStore((s) => s.setMode);
  const togglePanel = useChatStore((s) => s.togglePanel);
  return { mode, setMode, togglePanel };
};

export const useChatMessages = () => {
  const messages = useChatStore((s) => s.messages);
  const addMessage = useChatStore((s) => s.addMessage);
  const updateMessage = useChatStore((s) => s.updateMessage);
  const setMessages = useChatStore((s) => s.setMessages);
  const clearMessages = useChatStore((s) => s.clearMessages);
  return { messages, addMessage, updateMessage, setMessages, clearMessages };
};

export const useChatContext = () => {
  const context = useChatStore((s) => s.context);
  const setContext = useChatStore((s) => s.setContext);
  return { context, setContext };
};
