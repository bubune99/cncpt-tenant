'use client'

import React, { useEffect, useState, useRef, useCallback } from 'react'
import { X, Loader2 } from 'lucide-react'
import { useHelp } from './help-provider'
import { cn } from '@/lib/cms/utils'

const ACCENT_COLOR = '#C26A3A'
const BACKDROP_OPACITY = 0.6

interface TargetRect {
  top: number
  left: number
  width: number
  height: number
}

export function SpotlightOverlay() {
  const { spotlightMode, dismissSpotlight } = useHelp()
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null)
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 })

  const { isActive, targetElement, content, isLoading } = spotlightMode

  // Track target element position on scroll/resize
  const updateTargetRect = useCallback(() => {
    if (!targetElement?.element) return
    const rect = targetElement.element.getBoundingClientRect()
    setTargetRect({
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    })
  }, [targetElement?.element])

  useEffect(() => {
    if (!isActive || !targetElement?.element) return

    // Scroll target into view
    targetElement.element.scrollIntoView({ behavior: 'smooth', block: 'nearest' })

    // Initial measurement after scroll settles
    const timer = setTimeout(updateTargetRect, 100)

    window.addEventListener('scroll', updateTargetRect, true)
    window.addEventListener('resize', updateTargetRect)

    return () => {
      clearTimeout(timer)
      window.removeEventListener('scroll', updateTargetRect, true)
      window.removeEventListener('resize', updateTargetRect)
    }
  }, [isActive, targetElement?.element, updateTargetRect])

  // Position tooltip relative to target
  useEffect(() => {
    if (!targetRect || !tooltipRef.current) return

    const tooltip = tooltipRef.current
    const tooltipRect = tooltip.getBoundingClientRect()
    const padding = 16
    const vw = window.innerWidth
    const vh = window.innerHeight

    let top: number
    let left: number

    // Prefer below
    if (targetRect.top + targetRect.height + tooltipRect.height + padding < vh) {
      top = targetRect.top + targetRect.height + padding
    }
    // Try above
    else if (targetRect.top - tooltipRect.height - padding > 0) {
      top = targetRect.top - tooltipRect.height - padding
    }
    // Fallback: vertically centered
    else {
      top = Math.max(padding, (vh - tooltipRect.height) / 2)
    }

    // Horizontally centered on target
    left = targetRect.left + targetRect.width / 2 - tooltipRect.width / 2
    // Clamp to viewport
    left = Math.max(padding, Math.min(left, vw - tooltipRect.width - padding))

    setTooltipPos({ top, left })
  }, [targetRect])

  if (!isActive || !targetRect) return null

  const pad = 6 // padding around cutout

  return (
    <div
      data-help-ui
      className="fixed inset-0 z-[9998]"
      role="dialog"
      aria-label="Spotlight"
    >
      {/* SVG backdrop with cutout */}
      <svg
        className="fixed inset-0 w-full h-full z-[9998]"
        onClick={dismissSpotlight}
      >
        <defs>
          <mask id="spotlight-mask">
            <rect width="100%" height="100%" fill="white" />
            <rect
              x={targetRect.left - pad}
              y={targetRect.top - pad}
              width={targetRect.width + pad * 2}
              height={targetRect.height + pad * 2}
              rx="6"
              fill="black"
            />
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill={`rgba(0, 0, 0, ${BACKDROP_OPACITY})`}
          mask="url(#spotlight-mask)"
        />
      </svg>

      {/* Highlight ring around target */}
      <div
        className="fixed z-[9999] pointer-events-none rounded-md"
        style={{
          top: targetRect.top - pad,
          left: targetRect.left - pad,
          width: targetRect.width + pad * 2,
          height: targetRect.height + pad * 2,
          boxShadow: `0 0 0 3px ${ACCENT_COLOR}, 0 0 16px rgba(194, 106, 58, 0.4)`,
          animation: 'spotlight-pulse 2s ease-in-out infinite',
        }}
      />

      {/* Tooltip card */}
      <div
        ref={tooltipRef}
        data-help-ui
        className={cn(
          'fixed z-[10000] w-[380px] max-w-[calc(100vw-32px)]',
          'bg-white dark:bg-slate-900 rounded-lg shadow-2xl',
          'border border-slate-200 dark:border-slate-700',
          'overflow-hidden',
          'animate-in fade-in-0 zoom-in-95 duration-200'
        )}
        style={{ top: tooltipPos.top, left: tooltipPos.left }}
      >
        {/* Header */}
        <div
          className="flex items-start justify-between gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-800"
          style={{ borderTopWidth: '3px', borderTopColor: ACCENT_COLOR }}
        >
          {isLoading ? (
            <div className="flex items-center gap-2 text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Loading...</span>
            </div>
          ) : content ? (
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-slate-900 dark:text-white truncate">
                {content.title}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                {content.summary}
              </p>
            </div>
          ) : (
            <div className="flex-1">
              <h3 className="font-semibold text-slate-900 dark:text-white">
                No Help Available
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Help content hasn&apos;t been created for this element yet.
              </p>
            </div>
          )}

          <button
            onClick={dismissSpotlight}
            className={cn(
              'flex-shrink-0 p-1 rounded-full',
              'text-slate-400 hover:text-slate-600 hover:bg-slate-100',
              'dark:hover:text-slate-200 dark:hover:bg-slate-800',
              'transition-colors duration-150',
              'focus:outline-none focus:ring-2 focus:ring-offset-2'
            )}
            style={{ '--tw-ring-color': ACCENT_COLOR } as React.CSSProperties}
            aria-label="Close spotlight"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Details */}
        {!isLoading && content?.details && (
          <div className="px-4 py-3 max-h-[300px] overflow-y-auto">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              {content.details.split('\n').map((line, i) => (
                <p key={i} className="mt-1 first:mt-0 text-sm text-slate-600 dark:text-slate-300">
                  {line}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Source */}
        {!isLoading && content && (
          <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
            <p className="text-xs text-slate-400 flex items-center justify-between">
              <span>
                {content.createdBy === 'AI' && 'Generated by AI'}
                {content.createdBy === 'MANUAL' && 'Custom content'}
                {content.createdBy === 'SYSTEM' && 'Built-in documentation'}
              </span>
              <span className="text-slate-300 dark:text-slate-600">Press Esc to close</span>
            </p>
          </div>
        )}
      </div>

      {/* Pulse animation */}
      <style jsx global>{`
        @keyframes spotlight-pulse {
          0%, 100% {
            box-shadow: 0 0 0 3px ${ACCENT_COLOR}, 0 0 16px rgba(194, 106, 58, 0.4);
          }
          50% {
            box-shadow: 0 0 0 5px ${ACCENT_COLOR}, 0 0 24px rgba(194, 106, 58, 0.6);
          }
        }
      `}</style>
    </div>
  )
}
