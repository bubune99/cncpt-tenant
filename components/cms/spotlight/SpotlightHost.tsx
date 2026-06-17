'use client'

/**
 * Global Spotlight Host
 *
 * Mount this once at the root layout. Listens to the singleton spotlight
 * store, waits for the current step's selector to appear in the DOM (across
 * navigations), measures the target rect, and renders the SVG overlay +
 * tooltip on top of the page.
 *
 * Survives every route change because it lives in the root layout tree.
 */

import { useEffect, useMemo } from 'react'
import { usePathname } from 'next/navigation'
import { useSpotlightStore, waitForSelector } from '@/stores/spotlight-store'
import { SpotlightOverlay } from './SpotlightOverlay'
import { TourTooltip } from './TourTooltip'

export function SpotlightHost() {
  const pathname = usePathname()
  const steps = useSpotlightStore((s) => s.steps)
  const currentIndex = useSpotlightStore((s) => s.currentIndex)
  const measureTick = useSpotlightStore((s) => s.measureTick)
  const next = useSpotlightStore((s) => s.next)
  const prev = useSpotlightStore((s) => s.prev)
  const clear = useSpotlightStore((s) => s.clear)
  const setRect = useSpotlightStore((s) => s.setRect)

  const step = useMemo(
    () =>
      currentIndex >= 0 && currentIndex < steps.length
        ? steps[currentIndex]
        : null,
    [steps, currentIndex]
  )

  // Resolve the current step's target whenever the step (or the measureTick)
  // changes. waitForSelector handles the post-navigation case where the
  // target element doesn't exist yet.
  useEffect(() => {
    if (!step) return
    let cancelled = false

    const resolve = async () => {
      const el = await waitForSelector(step.target, 5000)
      if (cancelled) return
      if (!el) {
        console.warn(
          `[Spotlight] target not found within 5s: ${step.target} — auto-advancing`
        )
        // Auto-advance past missing targets so a broken step doesn't strand the user.
        next()
        return
      }
      // Scroll into view, then measure on the next frame so we get the
      // post-scroll rect.
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect()
        setRect(step.id, rect)
      })
    }

    resolve()
    return () => {
      cancelled = true
    }
    // `pathname` is included so that when navigate_to_route changes the route
    // mid-tour, the current step re-resolves on the new page (re-anchoring if
    // the target is present, or auto-advancing if it never appears) instead of
    // stranding a stale overlay from the previous page.
  }, [step?.id, step?.target, measureTick, pathname, next, setRect, step])

  // Re-measure on resize / scroll so the spotlight tracks the target.
  useEffect(() => {
    if (!step) return
    const remeasure = () => {
      const el = document.querySelector<HTMLElement>(step.target)
      if (el) setRect(step.id, el.getBoundingClientRect())
    }
    window.addEventListener('resize', remeasure)
    window.addEventListener('scroll', remeasure, true)
    return () => {
      window.removeEventListener('resize', remeasure)
      window.removeEventListener('scroll', remeasure, true)
    }
  }, [step?.id, step?.target, setRect, step])

  // Keyboard: Esc closes, Arrow keys navigate.
  useEffect(() => {
    if (!step) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        clear()
      } else if (e.key === 'ArrowRight') {
        next()
      } else if (e.key === 'ArrowLeft') {
        prev()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [step, next, prev, clear])

  if (!step) return null

  return (
    <>
      <SpotlightOverlay step={step} onClose={clear} />
      <TourTooltip
        step={step}
        stepIndex={currentIndex}
        totalSteps={steps.length}
        onNext={next}
        onPrev={prev}
        onClose={clear}
      />
    </>
  )
}
