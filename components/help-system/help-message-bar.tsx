'use client'

/**
 * Help Message Bar
 *
 * Fixed bar displayed when help mode is active.
 * Shows status and instructions.
 */

import React, { useEffect } from 'react'
import { X, HelpCircle } from 'lucide-react'
import { useHelp } from './help-provider'
import { cn } from '@/lib/utils'

export function HelpMessageBar() {
  const { helpMode, exitHelpMode } = useHelp()

  // Add body class when help mode is active
  useEffect(() => {
    if (helpMode.isActive) {
      document.body.classList.add('help-mode-active')
    } else {
      document.body.classList.remove('help-mode-active')
    }

    return () => {
      document.body.classList.remove('help-mode-active')
    }
  }, [helpMode.isActive])

  if (!helpMode.isActive) return null

  return (
    <div
      data-help-ui
      className={cn(
        'fixed top-0 left-0 right-0 z-[9999]',
        'flex items-center justify-between gap-4 px-4 py-2.5',
        'bg-slate-900/95 backdrop-blur-sm text-white',
        'border-b border-slate-700',
        'shadow-lg'
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-3">
        <div
          className="flex items-center justify-center w-8 h-8 rounded-full"
          style={{ backgroundColor: 'rgba(194, 106, 58, 0.2)' }}
        >
          <HelpCircle
            className="w-5 h-5"
            style={{ color: '#C26A3A' }}
          />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
          <span className="font-medium text-sm">Help Mode</span>
          <span className="hidden sm:inline text-slate-400">-</span>
          <span className="text-sm text-slate-300">
            Click any highlighted element to learn what it does
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <span className="hidden md:inline text-xs text-slate-400">
          Press <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-slate-300 font-mono">Esc</kbd> or{' '}
          <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-slate-300 font-mono">Ctrl+Q</kbd> to exit
        </span>

        <button
          onClick={exitHelpMode}
          className={cn(
            'flex items-center justify-center w-8 h-8 rounded-full',
            'text-slate-400 hover:text-white hover:bg-slate-700',
            'transition-colors duration-150',
            'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-white'
          )}
          aria-label="Exit help mode"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
