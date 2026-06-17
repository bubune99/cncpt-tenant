/** Spotlight Engine types — custom SVG overlay layer */

/**
 * Render mode for the spotlight system:
 * - "overlay": Full dark SVG mask with cutout hole (tutorial mode — immersive, focuses attention)
 * - "transparent": Lightweight floating icon/indicator that glides to targets (demo mode — non-intrusive)
 */
export type SpotlightRenderMode = 'overlay' | 'transparent'

/** Icon presets for transparent mode */
export type GuideIcon = 'pointer' | 'click' | 'type' | 'scroll' | 'look' | 'sparkle' | 'custom'

export interface SpotlightStep {
  id: string
  /** CSS selector for the target element */
  target: string
  /** Measured bounding rect (populated by SpotlightEngine.measureTarget) */
  rect?: DOMRect
  /** Tooltip content anchored to the spotlight */
  tooltip?: {
    content: string
    position?: 'top' | 'bottom' | 'left' | 'right' | 'auto'
    image?: string
  }
  /** Card overlay content inside the spotlight area */
  card?: {
    image?: string
    caption?: string
    animation?: 'fadeIn' | 'pulse' | 'none'
  }
  /** Animation type for the spotlight cutout transition */
  transition?: 'spring' | 'tween' | 'instant'
  /** Padding around the target element in px */
  padding?: number
  /** Override render mode for this specific step (otherwise uses engine default) */
  renderMode?: SpotlightRenderMode
  /** Icon to show in transparent mode (defaults to context-aware auto-selection) */
  guideIcon?: GuideIcon
  /** Custom SVG path or image URL for the guide icon (when guideIcon is "custom") */
  customIcon?: string
}

export interface SpotlightQueue {
  steps: SpotlightStep[]
  currentIndex: number
}

export interface SpotlightConfig {
  /** Default padding around target elements (px) */
  defaultPadding?: number
  /** Default animation type */
  defaultTransition?: 'spring' | 'tween' | 'instant'
  /** Default render mode */
  defaultRenderMode?: SpotlightRenderMode
  /** Whether to scroll target into view automatically */
  autoScroll?: boolean
  /** Scroll behavior when auto-scrolling */
  scrollBehavior?: 'smooth' | 'instant'
  /** Callback fired when the queue changes */
  onChange?: (queue: SpotlightQueue) => void
}
