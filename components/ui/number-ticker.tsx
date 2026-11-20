"use client"

import { useEffect, useRef } from "react"
import { useInView, useMotionValue, useSpring } from "framer-motion"

import { cn } from "@/lib/utils"
import { formatFigure } from "@/lib/landing/figures"

/**
 * A figure that counts up when it scrolls into view. The figure itself is in the HTML from the start
 * (search engines, screen readers, and a window that never draws all see it); the count-up only runs
 * on top, and not at all for people who asked for less motion. Check: lib/landing/figures.assert.ts.
 */
export function NumberTicker({
  value,
  direction = "up",
  delay = 0,
  className,
  decimalPlaces = 0,
}: {
  value: number
  direction?: "up" | "down"
  className?: string
  delay?: number // delay in s
  decimalPlaces?: number
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const motionValue = useMotionValue(direction === "down" ? value : 0)
  const springValue = useSpring(motionValue, {
    damping: 60,
    stiffness: 100,
  })
  const isInView = useInView(ref, { once: true, margin: "0px" })

  useEffect(() => {
    if (!isInView) return
    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return
    const t = setTimeout(() => {
      motionValue.jump(direction === "down" ? value : 0)
      motionValue.set(direction === "down" ? 0 : value)
    }, delay * 1000)
    return () => clearTimeout(t)
  }, [motionValue, isInView, delay, value, direction])

  useEffect(
    () =>
      springValue.on("change", (latest) => {
        if (ref.current) ref.current.textContent = formatFigure(latest, decimalPlaces)
      }),
    [springValue, decimalPlaces],
  )

  return (
    <span
      className={cn(
        "inline-block tabular-nums text-black dark:text-white tracking-wider",
        className,
      )}
      ref={ref}
    >
      {formatFigure(value, decimalPlaces)}
    </span>
  )
}
