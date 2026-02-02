'use client'

import { createContext, useContext, ReactNode } from 'react'

interface DemoContextType {
  isDemo: boolean
  demoMessage: string
}

const DemoContext = createContext<DemoContextType>({
  isDemo: false,
  demoMessage: '',
})

export function DemoProvider({
  children,
  isDemo = false
}: {
  children: ReactNode
  isDemo?: boolean
}) {
  return (
    <DemoContext.Provider
      value={{
        isDemo,
        demoMessage: isDemo ? 'You are viewing a demo. Changes will not be saved.' : ''
      }}
    >
      {children}
    </DemoContext.Provider>
  )
}

export function useDemo() {
  return useContext(DemoContext)
}

// Demo banner component to show at the top of the admin
export function DemoBanner() {
  const { isDemo, demoMessage } = useDemo()

  if (!isDemo) return null

  return (
    <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 text-center text-sm font-medium sticky top-0 z-50">
      <span className="inline-flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>DEMO MODE</span>
        <span className="hidden sm:inline">— {demoMessage}</span>
        <a
          href="/pricing"
          className="ml-2 underline hover:no-underline"
        >
          Start Free Trial →
        </a>
      </span>
    </div>
  )
}
