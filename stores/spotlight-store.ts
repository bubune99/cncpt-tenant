/**
 * Spotlight Tour Store (Zustand)
 *
 * Singleton state for the AI-driven spotlight tour engine.
 * Lives outside any React tree so the queue + current step survive
 * route changes (multi-screen tours).
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { SpotlightStep } from '@/components/cms/spotlight/types'

let stepCounter = 0
function genStepId(): string {
  return `spotlight-${++stepCounter}-${Date.now().toString(36)}`
}

/**
 * Per-step mini-chat history (StackDive walkthrough-ai-tutor pattern).
 * Keyed by spotlight step id. We only persist this slice — the live `steps`
 * + rect are rebuilt fresh on every tour, so persisting them would just
 * cause stale-DOM bugs.
 */
export interface MiniChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  /**
   * Stored as plain text so we can rehydrate without dragging the full
   * AI-SDK UIMessage parts shape into localStorage. Live messages are kept
   * as `parts` arrays in `useChat`; we serialize on save.
   */
  text: string
  createdAt: number
}

interface SpotlightState {
  steps: SpotlightStep[]
  currentIndex: number
  /** Tick bumped every time the active step's rect re-measures so consumers re-render. */
  measureTick: number
  /** Set true while the engine is actively driving a tour (used for keyboard hooks etc.). */
  active: boolean
  /** Per-step mini-chat history — survives route changes + reloads. */
  chatHistoryByStep: Record<string, MiniChatMessage[]>

  enqueueAll: (newSteps: Array<Omit<SpotlightStep, 'id'> & { id?: string }>) => void
  next: () => boolean
  prev: () => boolean
  goto: (index: number) => boolean
  clear: () => void
  setRect: (id: string, rect: DOMRect) => void
  bumpMeasure: () => void
  setStepChat: (stepId: string, messages: MiniChatMessage[]) => void
  appendStepChat: (stepId: string, message: MiniChatMessage) => void
  clearStepChat: (stepId: string) => void
}

export const useSpotlightStore = create<SpotlightState>()(
  persist(
    (set, get) => ({
      steps: [],
      currentIndex: -1,
      measureTick: 0,
      active: false,
      chatHistoryByStep: {},

      enqueueAll: (newSteps) => {
        const fullSteps: SpotlightStep[] = newSteps.map((s) => ({
          padding: 8,
          transition: 'spring' as const,
          ...s,
          id: s.id ?? genStepId(),
        }))
        set({
          steps: fullSteps,
          currentIndex: fullSteps.length > 0 ? 0 : -1,
          active: fullSteps.length > 0,
          measureTick: get().measureTick + 1,
        })
      },

      next: () => {
        const { currentIndex, steps } = get()
        if (currentIndex >= steps.length - 1) {
          // End of tour — clear
          set({ steps: [], currentIndex: -1, active: false })
          return false
        }
        set({
          currentIndex: currentIndex + 1,
          measureTick: get().measureTick + 1,
        })
        return true
      },

      prev: () => {
        const { currentIndex } = get()
        if (currentIndex <= 0) return false
        set({
          currentIndex: currentIndex - 1,
          measureTick: get().measureTick + 1,
        })
        return true
      },

      goto: (index) => {
        const { steps } = get()
        if (index < 0 || index >= steps.length) return false
        set({
          currentIndex: index,
          measureTick: get().measureTick + 1,
        })
        return true
      },

      clear: () => set({ steps: [], currentIndex: -1, active: false }),

      setRect: (id, rect) => {
        set((state) => ({
          steps: state.steps.map((s) => (s.id === id ? { ...s, rect } : s)),
        }))
      },

      bumpMeasure: () => set({ measureTick: get().measureTick + 1 }),

      setStepChat: (stepId, messages) => {
        set((state) => ({
          chatHistoryByStep: { ...state.chatHistoryByStep, [stepId]: messages },
        }))
      },

      appendStepChat: (stepId, message) => {
        set((state) => {
          const prior = state.chatHistoryByStep[stepId] ?? []
          return {
            chatHistoryByStep: {
              ...state.chatHistoryByStep,
              [stepId]: [...prior, message],
            },
          }
        })
      },

      clearStepChat: (stepId) => {
        set((state) => {
          if (!(stepId in state.chatHistoryByStep)) return state
          const next = { ...state.chatHistoryByStep }
          delete next[stepId]
          return { chatHistoryByStep: next }
        })
      },
    }),
    {
      name: 'spotlight-store',
      // Only persist the chat history — `steps`/`currentIndex`/`rect`
      // re-derive on every tour and would cause stale-DOM bugs if rehydrated.
      partialize: (state) => ({ chatHistoryByStep: state.chatHistoryByStep }),
      storage: createJSONStorage(() =>
        // Guard for SSR — return a no-op storage on the server.
        typeof window === 'undefined'
          ? {
              getItem: () => null,
              setItem: () => {},
              removeItem: () => {},
            }
          : window.localStorage
      ),
      // Cap chat history at 50 steps to keep localStorage bounded.
      // Older entries are silently dropped after rehydration.
      onRehydrateStorage: () => (state) => {
        if (!state?.chatHistoryByStep) return
        const entries = Object.entries(state.chatHistoryByStep)
        if (entries.length > 50) {
          const trimmed = Object.fromEntries(entries.slice(-50))
          state.chatHistoryByStep = trimmed
        }
      },
    }
  )
)

/**
 * Wait for a CSS selector to appear in the DOM.
 * Polls every 50ms until match or timeout.
 */
export async function waitForSelector(
  selector: string,
  timeoutMs = 5000
): Promise<HTMLElement | null> {
  if (typeof document === 'undefined') return null
  const found = document.querySelector<HTMLElement>(selector)
  if (found) return found

  return new Promise((resolve) => {
    const start = Date.now()
    const poll = () => {
      const el = document.querySelector<HTMLElement>(selector)
      if (el) {
        resolve(el)
        return
      }
      if (Date.now() - start > timeoutMs) {
        resolve(null)
        return
      }
      setTimeout(poll, 50)
    }
    poll()
  })
}
