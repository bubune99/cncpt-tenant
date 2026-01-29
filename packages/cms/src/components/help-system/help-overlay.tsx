'use client'

/**
 * Help Overlay
 *
 * Applies CSS outlines directly to elements with data-help-key attribute.
 * This keeps highlights attached to elements as they scroll/move.
 */

import React, { useEffect, useCallback, useRef } from 'react'
import { useHelp } from './help-provider'

// Burnt orange color palette
const COLORS = {
  outline: '#C26A3A',
  outlineHover: '#E07A48',
  outlineSelected: '#A85830',
}

export function HelpOverlay() {
  const { helpMode, selectElement } = useHelp()
  const clickHandlersRef = useRef<Map<string, (e: Event) => void>>(new Map())

  // Apply highlight classes to elements when help mode is active
  useEffect(() => {
    if (!helpMode.isActive) {
      // Remove all highlights when help mode is off
      document.querySelectorAll('[data-help-key]').forEach((el) => {
        el.classList.remove('help-highlight', 'help-highlight-selected')
      })
      // Add body class for help mode
      document.body.classList.remove('help-mode-active')
      return
    }

    // Add body class for help mode
    document.body.classList.add('help-mode-active')

    // Add highlight class to all help elements
    const elements = document.querySelectorAll('[data-help-key]')
    elements.forEach((el) => {
      el.classList.add('help-highlight')

      // Add click handler
      const key = el.getAttribute('data-help-key')
      if (key) {
        const handler = (e: Event) => {
          e.preventDefault()
          e.stopPropagation()
          selectElement(key)
        }
        clickHandlersRef.current.set(key, handler)
        el.addEventListener('click', handler, { capture: true })
      }
    })

    return () => {
      // Cleanup click handlers
      elements.forEach((el) => {
        const key = el.getAttribute('data-help-key')
        if (key) {
          const handler = clickHandlersRef.current.get(key)
          if (handler) {
            el.removeEventListener('click', handler, { capture: true })
            clickHandlersRef.current.delete(key)
          }
        }
        el.classList.remove('help-highlight', 'help-highlight-selected')
      })
    }
  }, [helpMode.isActive, selectElement])

  // Update selected element highlight
  useEffect(() => {
    if (!helpMode.isActive) return

    // Remove selected class from all elements
    document.querySelectorAll('.help-highlight-selected').forEach((el) => {
      el.classList.remove('help-highlight-selected')
    })

    // Add selected class to the selected element
    if (helpMode.selectedElement?.key) {
      const selectedEl = document.querySelector(
        `[data-help-key="${helpMode.selectedElement.key}"]`
      )
      if (selectedEl) {
        selectedEl.classList.add('help-highlight-selected')
      }
    }
  }, [helpMode.isActive, helpMode.selectedElement?.key])

  if (!helpMode.isActive) return null

  return (
    <style jsx global>{`
      /* Help mode cursor */
      body.help-mode-active *:not([data-help-ui]):not([data-help-ui] *) {
        cursor: help !important;
      }

      /* Block normal interactions except help UI */
      body.help-mode-active a:not([data-help-ui] *):not(.help-highlight),
      body.help-mode-active button:not([data-help-ui] *):not(.help-highlight),
      body.help-mode-active [role="button"]:not([data-help-ui] *):not(.help-highlight),
      body.help-mode-active input:not([data-help-ui] *),
      body.help-mode-active select:not([data-help-ui] *),
      body.help-mode-active textarea:not([data-help-ui] *) {
        pointer-events: none !important;
      }

      /* Base highlight - outline attached to element */
      .help-highlight {
        outline: 2px solid ${COLORS.outline} !important;
        outline-offset: 2px !important;
        position: relative !important;
        cursor: help !important;
        pointer-events: auto !important;
        transition: outline-color 0.15s ease, outline-offset 0.15s ease, box-shadow 0.15s ease !important;
      }

      /* Hover state */
      .help-highlight:hover {
        outline-color: ${COLORS.outlineHover} !important;
        outline-offset: 3px !important;
        box-shadow: 0 0 0 4px rgba(194, 106, 58, 0.15) !important;
        z-index: 100 !important;
      }

      /* Selected state */
      .help-highlight-selected {
        outline-color: ${COLORS.outlineSelected} !important;
        outline-width: 3px !important;
        outline-offset: 3px !important;
        box-shadow: 0 0 0 6px rgba(194, 106, 58, 0.2), 0 0 20px rgba(194, 106, 58, 0.3) !important;
        z-index: 101 !important;
      }

      /* Pulse animation for selected element */
      .help-highlight-selected {
        animation: help-pulse 2s ease-in-out infinite !important;
      }

      @keyframes help-pulse {
        0%, 100% {
          box-shadow: 0 0 0 6px rgba(194, 106, 58, 0.2), 0 0 20px rgba(194, 106, 58, 0.3);
        }
        50% {
          box-shadow: 0 0 0 8px rgba(194, 106, 58, 0.3), 0 0 30px rgba(194, 106, 58, 0.4);
        }
      }
    `}</style>
  )
}
