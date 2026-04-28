"use client"

import { createContext, useCallback, useContext, useState } from "react"
import { X } from "lucide-react"

type ToastState = { id: number; message: string } | null

const ToastContext = createContext<{
  showDemoToast: (message?: string) => void
}>({
  showDemoToast: () => {},
})

export function useDemoToast() {
  return useContext(ToastContext)
}

const DEFAULT_MESSAGE =
  "This is a demo — sign up for free to manage real sites."

/**
 * Tiny in-memory toast for the demo dashboard. Shows a transient
 * message when the visitor clicks a button that would mutate state
 * in the real product. Auto-dismisses after a few seconds.
 */
export function DemoToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState>(null)

  const showDemoToast = useCallback((message?: string) => {
    const id = Date.now()
    setToast({ id, message: message ?? DEFAULT_MESSAGE })
    setTimeout(() => {
      setToast((current) => (current?.id === id ? null : current))
    }, 3500)
  }, [])

  return (
    <ToastContext.Provider value={{ showDemoToast }}>
      {children}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          data-demo-toast
          className="fixed bottom-6 right-6 z-50 max-w-sm rounded-lg border border-gray-200 dark:border-white/[0.1] bg-white dark:bg-gray-800 shadow-lg px-4 py-3 flex items-start gap-3 text-sm text-gray-900 dark:text-white"
        >
          <span className="flex-1">{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            aria-label="Dismiss"
            className="text-gray-400 hover:text-gray-600 dark:text-white/40 dark:hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </ToastContext.Provider>
  )
}
