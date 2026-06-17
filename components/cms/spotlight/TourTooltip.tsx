'use client'

import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, X } from 'lucide-react'
import { SPOTLIGHT_TOOLTIP_Z } from './z-index'
import type { SpotlightStep } from './types'

interface TourTooltipProps {
  step: SpotlightStep | null
  stepIndex: number
  totalSteps: number
  onNext?: () => void
  onPrev?: () => void
  onClose?: () => void
}

type Position = 'top' | 'bottom' | 'left' | 'right'

const TOOLTIP_GAP = 12
const TOOLTIP_MAX_WIDTH = 360

function resolvePosition(
  rect: DOMRect | undefined,
  preferred: Position | 'auto' | undefined
): Position {
  if (!rect) return 'bottom'
  if (preferred && preferred !== 'auto') return preferred

  // Auto: prefer bottom, flip if near viewport edge
  const spaceBelow = window.innerHeight - rect.bottom
  const spaceAbove = rect.top
  const spaceRight = window.innerWidth - rect.right
  const spaceLeft = rect.left

  if (spaceBelow >= 160) return 'bottom'
  if (spaceAbove >= 160) return 'top'
  if (spaceRight >= TOOLTIP_MAX_WIDTH + TOOLTIP_GAP) return 'right'
  if (spaceLeft >= TOOLTIP_MAX_WIDTH + TOOLTIP_GAP) return 'left'
  return 'bottom'
}

function getTooltipStyle(
  rect: DOMRect | undefined,
  position: Position,
  padding: number
): React.CSSProperties {
  if (!rect) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }

  // ─── See `./z-index.ts` for the full stacking-context audit. ──────────
  // Tooltip sits above the SVG cutout overlay so users can interact with
  // the mini-chat over the dim mask.
  const base: React.CSSProperties = {
    position: 'fixed',
    zIndex: SPOTLIGHT_TOOLTIP_Z,
    maxWidth: TOOLTIP_MAX_WIDTH,
  }

  const cx = rect.x + rect.width / 2
  const cy = rect.y + rect.height / 2

  switch (position) {
    case 'bottom':
      return {
        ...base,
        top: rect.bottom + padding + TOOLTIP_GAP,
        left: cx,
        transform: 'translateX(-50%)',
      }
    case 'top':
      return {
        ...base,
        bottom: window.innerHeight - rect.top + padding + TOOLTIP_GAP,
        left: cx,
        transform: 'translateX(-50%)',
      }
    case 'right':
      return {
        ...base,
        top: cy,
        left: rect.right + padding + TOOLTIP_GAP,
        transform: 'translateY(-50%)',
      }
    case 'left':
      return {
        ...base,
        top: cy,
        right: window.innerWidth - rect.left + padding + TOOLTIP_GAP,
        transform: 'translateY(-50%)',
      }
  }
}

const slideVariants: Record<Position, Variants> = {
  bottom: {
    initial: { opacity: 0, y: -8 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 },
  },
  top: {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 8 },
  },
  right: {
    initial: { opacity: 0, x: -8 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -8 },
  },
  left: {
    initial: { opacity: 0, x: 8 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 8 },
  },
}

export function TourTooltip({
  step,
  stepIndex,
  totalSteps,
  onNext,
  onPrev,
  onClose,
}: TourTooltipProps) {
  const [position, setPosition] = useState<Position>('bottom')

  useEffect(() => {
    if (!step) return
    setPosition(resolvePosition(step.rect, step.tooltip?.position))
  }, [step, step?.rect, step?.tooltip?.position])

  const padding = step?.padding ?? 8
  const tooltipStyle = getTooltipStyle(step?.rect, position, padding)
  const isLast = stepIndex >= totalSteps - 1

  // Portal target — guarded for SSR. We mount once on the client so the
  // tooltip escapes any ancestor stacking context (admin sidebar's
  // transform/translate, drawer's backdrop-blur, etc.).
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null)
  useEffect(() => {
    if (typeof document === 'undefined') return
    setPortalTarget(document.body)
  }, [])

  if (!portalTarget) return null

  const content = (
    <AnimatePresence mode="wait">
      {step?.tooltip && (
        <motion.div
          key={step.id}
          variants={slideVariants[position]}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.2, ease: 'easeOut' }}
          style={{
            ...tooltipStyle,
            pointerEvents: 'auto',
          }}
          data-spotlight-tooltip
        >
          <div
            className="rounded-lg p-4 text-sm text-white relative"
            style={{
              background: 'rgba(15, 23, 42, 0.95)',
              border: '1px solid rgba(59, 130, 246, 0.4)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
            }}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-2 right-2 p-1 rounded hover:bg-white/10 transition-colors"
              aria-label="Close tour"
            >
              <X size={14} className="text-white/50" />
            </button>

            {/* Tooltip content */}
            <p className="pr-6 leading-relaxed text-white">
              {step.tooltip.content}
            </p>

            {/* Optional image */}
            {step.tooltip.image && (
              <img
                src={step.tooltip.image}
                alt=""
                className="mt-3 rounded w-full object-cover"
                style={{ maxHeight: 160 }}
              />
            )}

            {/* Optional card caption */}
            {step.card?.caption && (
              <p className="mt-2 text-xs text-white/50">
                {step.card.caption}
              </p>
            )}

            {/* Footer: step counter + navigation */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
              <span className="text-xs text-white/40">
                {stepIndex + 1} / {totalSteps}
              </span>

              <div className="flex items-center gap-1">
                <button
                  onClick={onPrev}
                  disabled={stepIndex <= 0}
                  className="p-1.5 rounded hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="Previous step"
                >
                  <ChevronLeft size={14} className="text-white/70" />
                </button>
                <button
                  onClick={isLast ? onClose : onNext}
                  className="px-3 py-1 rounded bg-white/10 hover:bg-white/20 transition-colors text-xs font-medium text-white"
                  aria-label={isLast ? 'Done' : 'Next step'}
                >
                  {isLast ? 'Done' : 'Next'}
                </button>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded hover:bg-white/10 transition-colors text-xs text-white/50"
                  aria-label="Skip tour"
                >
                  Skip
                </button>
              </div>
            </div>          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  return createPortal(content, portalTarget)
}
