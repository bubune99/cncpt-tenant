'use client'

import React, { useEffect, useState, useRef, useCallback } from 'react'
import { X, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { useHelp } from './help-provider'
import { cn } from '@/lib/cms/utils'

const ACCENT_COLOR = '#C26A3A'
const ACCENT_DARK = '#A85830'
const BACKDROP_OPACITY = 0.6

interface TargetRect {
  top: number
  left: number
  width: number
  height: number
}

export function GuidedExplanationOverlay() {
  const {
    guidedExplanation,
    guidedExplanationNext,
    guidedExplanationBack,
    dismissGuidedExplanation,
  } = useHelp()
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null)
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 })

  const {
    isActive,
    title,
    steps,
    currentStepIndex,
    targetElement,
    content,
    isLoading,
  } = guidedExplanation

  const currentStep = steps[currentStepIndex]
  const isFirstStep = currentStepIndex === 0
  const isLastStep = currentStepIndex === steps.length - 1

  // Track target element position
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
    if (!isActive || !targetElement?.element) {
      setTargetRect(null)
      return
    }

    // Scroll target into view
    targetElement.element.scrollIntoView({ behavior: 'smooth', block: 'nearest' })

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
    if (!tooltipRef.current) return

    const tooltip = tooltipRef.current
    const tooltipRect = tooltip.getBoundingClientRect()
    const padding = 16
    const vw = window.innerWidth
    const vh = window.innerHeight

    // If no target rect (element not found), center the tooltip
    if (!targetRect) {
      setTooltipPos({
        top: (vh - tooltipRect.height) / 2,
        left: Math.max(padding, (vw - tooltipRect.width) / 2),
      })
      return
    }

    let top: number
    let left: number

    if (targetRect.top + targetRect.height + tooltipRect.height + padding < vh) {
      top = targetRect.top + targetRect.height + padding
    } else if (targetRect.top - tooltipRect.height - padding > 0) {
      top = targetRect.top - tooltipRect.height - padding
    } else {
      top = Math.max(padding, (vh - tooltipRect.height) / 2)
    }

    left = targetRect.left + targetRect.width / 2 - tooltipRect.width / 2
    left = Math.max(padding, Math.min(left, vw - tooltipRect.width - padding))

    setTooltipPos({ top, left })
  }, [targetRect])

  if (!isActive) return null

  const pad = 6

  return (
    <div
      data-help-ui
      className="fixed inset-0 z-[9998]"
      role="dialog"
      aria-label={title}
    >
      {/* SVG backdrop with cutout */}
      <svg
        className="fixed inset-0 w-full h-full z-[9998]"
        onClick={dismissGuidedExplanation}
      >
        <defs>
          <mask id="guided-mask">
            <rect width="100%" height="100%" fill="white" />
            {targetRect && (
              <rect
                x={targetRect.left - pad}
                y={targetRect.top - pad}
                width={targetRect.width + pad * 2}
                height={targetRect.height + pad * 2}
                rx="6"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill={`rgba(0, 0, 0, ${BACKDROP_OPACITY})`}
          mask="url(#guided-mask)"
        />
      </svg>

      {/* Highlight ring */}
      {targetRect && (
        <div
          className="fixed z-[9999] pointer-events-none rounded-md"
          style={{
            top: targetRect.top - pad,
            left: targetRect.left - pad,
            width: targetRect.width + pad * 2,
            height: targetRect.height + pad * 2,
            boxShadow: `0 0 0 3px ${ACCENT_COLOR}, 0 0 16px rgba(194, 106, 58, 0.4)`,
            animation: 'guided-pulse 2s ease-in-out infinite',
          }}
        />
      )}

      {/* Tooltip card */}
      <div
        ref={tooltipRef}
        data-help-ui
        className={cn(
          'fixed z-[10000] w-[420px] max-w-[calc(100vw-32px)]',
          'bg-white dark:bg-slate-900 rounded-lg shadow-2xl',
          'border border-slate-200 dark:border-slate-700',
          'overflow-hidden',
          'animate-in fade-in-0 zoom-in-95 duration-200'
        )}
        style={{ top: tooltipPos.top, left: tooltipPos.left }}
      >
        {/* Header with title + step indicator */}
        <div
          className="flex items-start justify-between gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-800"
          style={{ borderTopWidth: '3px', borderTopColor: ACCENT_COLOR }}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-900 dark:text-white truncate">
                {title}
              </h3>
              <span
                className="flex-shrink-0 px-2 py-0.5 text-xs font-medium rounded-full text-white"
                style={{ backgroundColor: ACCENT_COLOR }}
              >
                {currentStepIndex + 1} / {steps.length}
              </span>
            </div>
          </div>

          <button
            onClick={dismissGuidedExplanation}
            className={cn(
              'flex-shrink-0 p-1 rounded-full',
              'text-slate-400 hover:text-slate-600 hover:bg-slate-100',
              'dark:hover:text-slate-200 dark:hover:bg-slate-800',
              'transition-colors duration-150',
              'focus:outline-none focus:ring-2 focus:ring-offset-2'
            )}
            style={{ '--tw-ring-color': ACCENT_COLOR } as React.CSSProperties}
            aria-label="Close guided explanation"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="flex gap-0.5 px-4 pt-3">
          {steps.map((_, i) => (
            <div
              key={i}
              className="h-1 flex-1 rounded-full transition-colors duration-300"
              style={{
                backgroundColor:
                  i < currentStepIndex
                    ? ACCENT_COLOR
                    : i === currentStepIndex
                      ? ACCENT_DARK
                      : 'rgb(226, 232, 240)', // slate-200
              }}
            />
          ))}
        </div>

        {/* Step content */}
        <div className="px-4 py-3">
          {isLoading ? (
            <div className="flex items-center gap-2 text-slate-500 py-4">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Finding element...</span>
            </div>
          ) : (
            <>
              {/* Explanation text */}
              {content?.summary && (
                <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                  {content.summary}
                </p>
              )}

              {/* Tips */}
              {currentStep?.tips && currentStep.tips.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {currentStep.tips.map((tip, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300"
                    >
                      <span
                        className="flex-shrink-0 mt-0.5 w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: ACCENT_COLOR }}
                      />
                      <span>{tip}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Navigation footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <button
            onClick={guidedExplanationBack}
            disabled={isFirstStep}
            className={cn(
              'flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-md',
              'transition-colors duration-150',
              isFirstStep
                ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            )}
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>

          <button
            onClick={dismissGuidedExplanation}
            className="text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            Skip
          </button>

          <button
            onClick={isLastStep ? dismissGuidedExplanation : guidedExplanationNext}
            className={cn(
              'flex items-center gap-1 px-4 py-1.5 text-sm font-medium rounded-md text-white',
              'transition-colors duration-150'
            )}
            style={{ backgroundColor: ACCENT_COLOR }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = ACCENT_DARK)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = ACCENT_COLOR)}
          >
            {isLastStep ? 'Done' : 'Next'}
            {!isLastStep && <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Pulse animation */}
      <style jsx global>{`
        @keyframes guided-pulse {
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
