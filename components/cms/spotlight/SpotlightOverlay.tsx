'use client'

import { motion, useMotionValue, useSpring } from 'framer-motion'
import { useEffect, useId, useState } from 'react'
import { createPortal } from 'react-dom'
import type { SpotlightStep } from './types'
import {
  SPOTLIGHT_OVERLAY_Z,
  SPOTLIGHT_TOOLTIP_Z,
} from './z-index'

interface SpotlightOverlayProps {
  step: SpotlightStep | null
  onClose?: () => void
  className?: string
  showDotGrid?: boolean
}

const SPRING_CONFIG = { stiffness: 200, damping: 25 }
const DEFAULT_PADDING = 8

// Re-export so SpotlightHost can read both values without re-importing.
export { SPOTLIGHT_OVERLAY_Z, SPOTLIGHT_TOOLTIP_Z }

export function SpotlightOverlay({ step, onClose, className, showDotGrid }: SpotlightOverlayProps) {
  const maskId = useId()
  const filterId = useId()
  const patternId = useId()

  const padding = step?.padding ?? DEFAULT_PADDING
  const rect = step?.rect

  // Raw motion values for the cutout position/size
  const rawX = useMotionValue(rect ? rect.x - padding : 0)
  const rawY = useMotionValue(rect ? rect.y - padding : 0)
  const rawW = useMotionValue(rect ? rect.width + padding * 2 : 0)
  const rawH = useMotionValue(rect ? rect.height + padding * 2 : 0)

  // Spring-animated values
  const x = useSpring(rawX, SPRING_CONFIG)
  const y = useSpring(rawY, SPRING_CONFIG)
  const w = useSpring(rawW, SPRING_CONFIG)
  const h = useSpring(rawH, SPRING_CONFIG)

  // Update motion values when rect changes
  useEffect(() => {
    if (!rect) return
    rawX.set(rect.x - padding)
    rawY.set(rect.y - padding)
    rawW.set(rect.width + padding * 2)
    rawH.set(rect.height + padding * 2)
  }, [rect, padding, rawX, rawY, rawW, rawH])

  // Portal target — guarded for SSR. We mount once on the client.
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null)
  useEffect(() => {
    if (typeof document === 'undefined') return
    setPortalTarget(document.body)
  }, [])

  if (!step) return null
  if (!portalTarget) return null

  // ─── See `./z-index.ts` for the full stacking-context audit. ──────────
  // The overlay portals to `document.body` so ancestor `transform` /
  // `backdrop-blur` stacking contexts (admin sidebar, drawer, etc.) can't
  // trap our z-index. Without this portal, the overlay would only stack
  // within whatever subtree mounted SpotlightHost.
  const overlay = (
    <div
      className={className}
      data-spotlight-overlay
      data-spotlight-step-id={step.id}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: SPOTLIGHT_OVERLAY_Z,
        pointerEvents: 'none',
      }}
    >
      <svg
        data-spotlight
        width="100%"
        height="100%"
        style={{ position: 'absolute', inset: 0 }}
      >
        <defs>
          {/* Mask: white = visible overlay, black = transparent cutout */}
          <mask id={maskId}>
            <rect width="100%" height="100%" fill="white" />
            <motion.rect
              x={x}
              y={y}
              width={w}
              height={h}
              rx={8}
              ry={8}
              fill="black"
            />
          </mask>

          {/* Glow filter for the spotlight edge */}
          <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" />
          </filter>

          {/* Dot grid pattern */}
          {showDotGrid && (
            <pattern id={patternId} width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="0.5" fill="rgba(255,255,255,0.07)" />
            </pattern>
          )}
        </defs>

        {/* Semi-transparent overlay with cutout mask */}
        <rect
          width="100%"
          height="100%"
          fill="#0d1117"
          fillOpacity={0.6}
          mask={`url(#${maskId})`}
          style={{ pointerEvents: 'auto', cursor: 'default' }}
          onClick={onClose}
        />

        {/* Dot grid on the overlay area */}
        {showDotGrid && (
          <rect
            width="100%"
            height="100%"
            fill={`url(#${patternId})`}
            mask={`url(#${maskId})`}
            style={{ pointerEvents: 'none' }}
          />
        )}

        {/* Glow ring around the cutout */}
        <motion.rect
          x={x}
          y={y}
          width={w}
          height={h}
          rx={8}
          ry={8}
          fill="none"
          stroke="hsl(174, 72%, 44%)"
          strokeWidth={2}
          strokeOpacity={0.5}
          filter={`url(#${filterId})`}
          style={{ pointerEvents: 'none' }}
        />

        {/* Crisp border around cutout */}
        <motion.rect
          x={x}
          y={y}
          width={w}
          height={h}
          rx={8}
          ry={8}
          fill="none"
          stroke="hsl(174, 72%, 44%)"
          strokeWidth={1}
          strokeOpacity={0.3}
          style={{ pointerEvents: 'none' }}
        />
      </svg>
    </div>
  )

  return createPortal(overlay, portalTarget)
}
