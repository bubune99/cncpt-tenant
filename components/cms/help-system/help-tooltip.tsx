'use client'

/**
 * Help Tooltip
 *
 * Rich content tooltip displayed when an element is selected in help mode.
 * Shows title, summary, detailed explanation, and optional media.
 */

import React, { useEffect, useState, useRef } from 'react'
import { X, Play, ExternalLink, Loader2 } from 'lucide-react'
import { useHelp } from './help-provider'
import { cn } from '@/lib/utils'

// Burnt orange for accents
const ACCENT_COLOR = '#C26A3A'

export function HelpTooltip() {
  const { helpMode, clearSelection, startWalkthrough } = useHelp()
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ top: 0, left: 0 })

  const { selectedElement, content, isLoading } = helpMode

  // Calculate tooltip position based on selected element
  useEffect(() => {
    if (!selectedElement?.rect || !tooltipRef.current) return

    const rect = selectedElement.rect
    const tooltip = tooltipRef.current
    const tooltipRect = tooltip.getBoundingClientRect()

    const padding = 12
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    let top: number
    let left: number

    // Try to position below the element
    if (rect.bottom + tooltipRect.height + padding < viewportHeight) {
      top = rect.bottom + padding
    }
    // Otherwise position above
    else if (rect.top - tooltipRect.height - padding > 60) {
      // 60px for message bar
      top = rect.top - tooltipRect.height - padding
    }
    // Fall back to side of viewport
    else {
      top = Math.max(70, Math.min(rect.top, viewportHeight - tooltipRect.height - padding))
    }

    // Horizontal positioning - prefer right of element
    if (rect.right + tooltipRect.width + padding < viewportWidth) {
      left = rect.right + padding
    }
    // Try left of element
    else if (rect.left - tooltipRect.width - padding > 0) {
      left = rect.left - tooltipRect.width - padding
    }
    // Center horizontally
    else {
      left = Math.max(padding, (viewportWidth - tooltipRect.width) / 2)
    }

    setPosition({ top, left })
  }, [selectedElement?.rect])

  if (!selectedElement) return null

  return (
    <>
      {/* Backdrop to close tooltip */}
      <div
        data-help-ui
        className="fixed inset-0 z-[9999]"
        onClick={clearSelection}
        aria-hidden="true"
      />

      {/* Tooltip card */}
      <div
        ref={tooltipRef}
        data-help-ui
        className={cn(
          'fixed z-[10000] w-[380px] max-w-[calc(100vw-24px)]',
          'bg-white dark:bg-slate-900 rounded-lg shadow-2xl',
          'border border-slate-200 dark:border-slate-700',
          'overflow-hidden',
          'animate-in fade-in-0 zoom-in-95 duration-200'
        )}
        style={{
          top: position.top,
          left: position.left,
        }}
        role="dialog"
        aria-labelledby="help-tooltip-title"
        aria-describedby="help-tooltip-content"
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
              <h3
                id="help-tooltip-title"
                className="font-semibold text-slate-900 dark:text-white truncate"
              >
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
                Help content hasn't been created for this element yet.
              </p>
            </div>
          )}

          <button
            onClick={clearSelection}
            className={cn(
              'flex-shrink-0 p-1 rounded-full',
              'text-slate-400 hover:text-slate-600 hover:bg-slate-100',
              'dark:hover:text-slate-200 dark:hover:bg-slate-800',
              'transition-colors duration-150',
              'focus:outline-none focus:ring-2 focus:ring-offset-2'
            )}
            style={{ '--tw-ring-color': ACCENT_COLOR } as React.CSSProperties}
            aria-label="Close help"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        {!isLoading && content?.details && (
          <div
            id="help-tooltip-content"
            className="px-4 py-3 max-h-[300px] overflow-y-auto"
          >
            <div className="prose prose-sm dark:prose-invert max-w-none">
              {/* Render markdown-like content */}
              {content.details.split('\n\n').map((paragraph, i) => {
                // Headers
                if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
                  return (
                    <h4 key={i} className="font-semibold text-slate-900 dark:text-white mt-3 first:mt-0">
                      {paragraph.slice(2, -2)}
                    </h4>
                  )
                }

                // Lists
                if (paragraph.startsWith('- ')) {
                  const items = paragraph.split('\n').filter((line) => line.startsWith('- '))
                  return (
                    <ul key={i} className="mt-2 space-y-1 list-disc list-inside text-slate-600 dark:text-slate-300">
                      {items.map((item, j) => (
                        <li key={j} className="text-sm">
                          {renderInlineMarkdown(item.slice(2))}
                        </li>
                      ))}
                    </ul>
                  )
                }

                // Regular paragraph
                return (
                  <p key={i} className="mt-2 first:mt-0 text-sm text-slate-600 dark:text-slate-300">
                    {renderInlineMarkdown(paragraph)}
                  </p>
                )
              })}
            </div>
          </div>
        )}

        {/* Media */}
        {!isLoading && content?.mediaUrl && (
          <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800">
            {content.mediaType === 'VIDEO' ? (
              <button
                className={cn(
                  'flex items-center gap-2 w-full px-3 py-2 rounded-md',
                  'bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700',
                  'text-sm font-medium text-slate-700 dark:text-slate-200',
                  'transition-colors duration-150'
                )}
                onClick={() => window.open(content.mediaUrl, '_blank')}
              >
                <Play className="w-4 h-4" style={{ color: ACCENT_COLOR }} />
                <span>Watch video tutorial</span>
                <ExternalLink className="w-3 h-3 ml-auto text-slate-400" />
              </button>
            ) : content.mediaType === 'IMAGE' ? (
              <img
                src={content.mediaUrl}
                alt={`Help illustration for ${content.title}`}
                className="w-full rounded-md"
              />
            ) : null}
          </div>
        )}

        {/* Related tour */}
        {!isLoading && content?.tourId && (
          <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800">
            <button
              className={cn(
                'flex items-center gap-2 w-full px-3 py-2 rounded-md',
                'text-sm font-medium text-white',
                'transition-colors duration-150'
              )}
              style={{
                backgroundColor: ACCENT_COLOR,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#A85830')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = ACCENT_COLOR)}
              onClick={() => {
                clearSelection()
                startWalkthrough(content.tourId!)
              }}
            >
              <Play className="w-4 h-4" />
              <span>Start guided walkthrough</span>
            </button>
          </div>
        )}

        {/* Related topics */}
        {!isLoading && content?.relatedKeys && content.relatedKeys.length > 0 && (
          <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
              Related
            </p>
            <div className="flex flex-wrap gap-1.5">
              {content.relatedKeys.slice(0, 5).map((key) => (
                <span
                  key={key}
                  className="inline-block px-2 py-0.5 text-xs rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                >
                  {formatKeyForDisplay(key)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Source indicator */}
        {!isLoading && content && (
          <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
            <p className="text-xs text-slate-400">
              {content.createdBy === 'AI' && 'Generated by AI'}
              {content.createdBy === 'MANUAL' && 'Custom content'}
              {content.createdBy === 'SYSTEM' && 'Built-in documentation'}
            </p>
          </div>
        )}
      </div>
    </>
  )
}

/**
 * Render inline markdown (bold, code)
 */
function renderInlineMarkdown(text: string): React.ReactNode {
  const parts: React.ReactNode[] = []
  let remaining = text
  let key = 0

  while (remaining) {
    // Bold
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/)
    if (boldMatch && boldMatch.index !== undefined) {
      if (boldMatch.index > 0) {
        parts.push(remaining.slice(0, boldMatch.index))
      }
      parts.push(
        <strong key={key++} className="font-semibold text-slate-900 dark:text-white">
          {boldMatch[1]}
        </strong>
      )
      remaining = remaining.slice(boldMatch.index + boldMatch[0].length)
      continue
    }

    // Code
    const codeMatch = remaining.match(/`(.+?)`/)
    if (codeMatch && codeMatch.index !== undefined) {
      if (codeMatch.index > 0) {
        parts.push(remaining.slice(0, codeMatch.index))
      }
      parts.push(
        <code
          key={key++}
          className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-xs font-mono"
        >
          {codeMatch[1]}
        </code>
      )
      remaining = remaining.slice(codeMatch.index + codeMatch[0].length)
      continue
    }

    // No more matches
    parts.push(remaining)
    break
  }

  return parts
}

/**
 * Format element key for display
 */
function formatKeyForDisplay(key: string): string {
  const parts = key.split('.')
  const last = parts[parts.length - 1]
  return last
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .trim()
}
