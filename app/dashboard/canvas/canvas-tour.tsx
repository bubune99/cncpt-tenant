"use client"

/**
 * The workspace tour: a few stops, each highlighting one part of the screen with a short note.
 * Opened from "Take the tour" on the Overview. Closes with Skip, Done, Esc, or a press outside
 * the note; focus goes back to what opened it. Stops whose target is not on screen are skipped.
 */

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"

export interface TourStop {
  /** CSS selector of the part to highlight */
  target: string
  title: string
  body: string
}

interface Rect { left: number; top: number; width: number; height: number }

export function CanvasTour({ stops, open, onClose }: { stops: TourStop[]; open: boolean; onClose: () => void }) {
  const [i, setI] = useState(0)
  const [rect, setRect] = useState<Rect | null>(null)
  const boxRef = useRef<HTMLDivElement>(null)
  const returnTo = useRef<HTMLElement | null>(null)

  const visible = useCallback(
    (from: number, step: 1 | -1) => {
      for (let k = from; k >= 0 && k < stops.length; k += step) if (document.querySelector(stops[k].target)) return k
      return -1
    },
    [stops],
  )

  // Kept in a ref so a parent re-render (a new onClose) does not re-run the effects below and steal focus.
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose
  const close = useCallback(() => {
    setRect(null)
    onCloseRef.current()
    returnTo.current?.focus?.()
  }, [])

  useEffect(() => {
    if (!open) return
    returnTo.current = document.activeElement as HTMLElement | null
    setRect(null)
    const first = visible(0, 1)
    if (first < 0) { close(); return }
    setI(first)
  }, [open, visible, close])

  useLayoutEffect(() => {
    if (!open) return
    const el = document.querySelector(stops[i]?.target ?? "") as HTMLElement | null
    if (!el) { setRect(null); return }
    el.scrollIntoView({ block: "nearest" })
    const measure = () => {
      const r = el.getBoundingClientRect()
      setRect({ left: r.left, top: r.top, width: r.width, height: r.height })
    }
    measure()
    window.addEventListener("resize", measure)
    window.addEventListener("scroll", measure, true)
    return () => {
      window.removeEventListener("resize", measure)
      window.removeEventListener("scroll", measure, true)
    }
  }, [open, i, stops])

  // Focus the main button when a stop is shown (only when the stop changes).
  useEffect(() => {
    if (!open || !rect) return
    boxRef.current?.querySelector<HTMLButtonElement>("[data-tour-next]")?.focus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, i, rect === null])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.stopPropagation(); close() }
    }
    const onDown = (e: PointerEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) close()
    }
    document.addEventListener("keydown", onKey, true)
    document.addEventListener("pointerdown", onDown, true)
    return () => {
      document.removeEventListener("keydown", onKey, true)
      document.removeEventListener("pointerdown", onDown, true)
    }
  }, [open, close])

  if (!open || !rect || !stops[i] || !document.querySelector(stops[i].target)) return null

  const next = visible(i + 1, 1)
  const prev = visible(i - 1, -1)
  const shown = stops.filter((s) => document.querySelector(s.target)).length
  const at = stops.slice(0, i + 1).filter((s) => document.querySelector(s.target)).length
  const boxW = 300
  const left = Math.min(window.innerWidth - boxW - 12, Math.max(12, rect.left))
  const below = rect.top + rect.height + 12
  const top = below + 190 > window.innerHeight ? Math.max(12, rect.top - 190) : below

  return (
    <>
      <div
        className="tnt__tour-ring"
        aria-hidden="true"
        style={{ left: rect.left - 4, top: rect.top - 4, width: rect.width + 8, height: rect.height + 8 }}
      />
      <div
        ref={boxRef}
        className="tnt__tour"
        role="dialog"
        aria-modal="false"
        aria-labelledby="tnt-tour-title"
        data-ui="tour.note"
        style={{ left, top, width: boxW }}
      >
        <div className="tnt__tour-n">Tour, {at} of {shown}</div>
        <div id="tnt-tour-title" className="tnt__tour-h">{stops[i].title}</div>
        <p className="tnt__tour-p">{stops[i].body}</p>
        <div className="tnt__tour-row">
          <button type="button" className="btn btn--ghost btn--xs" onClick={close} data-ui="tour.skip">Skip tour</button>
          <div className="row" style={{ gap: 6 }}>
            {prev >= 0 ? (
              <button type="button" className="btn btn--secondary btn--xs" onClick={() => setI(prev)} data-ui="tour.back">Back</button>
            ) : null}
            <button
              type="button"
              className="btn btn--primary btn--xs"
              data-tour-next
              data-ui="tour.next"
              onClick={() => (next >= 0 ? setI(next) : close())}
            >
              {next >= 0 ? "Next" : "Done"}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
