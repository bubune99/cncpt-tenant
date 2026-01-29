/**
 * Help System Types
 *
 * Type definitions for the help mode and walkthrough system
 */

// Joyride Step type (defined locally to avoid requiring the package at build time)
export interface JoyrideStep {
  target: string | HTMLElement
  content: React.ReactNode
  title?: string
  placement?:
    | 'top'
    | 'top-start'
    | 'top-end'
    | 'bottom'
    | 'bottom-start'
    | 'bottom-end'
    | 'left'
    | 'left-start'
    | 'left-end'
    | 'right'
    | 'right-start'
    | 'right-end'
    | 'center'
    | 'auto'
  disableBeacon?: boolean
  disableOverlayClose?: boolean
  spotlightClicks?: boolean
  styles?: object
  floaterProps?: object
}

// Help content for a single UI element
export interface HelpContent {
  id?: string
  elementKey: string
  title: string
  summary: string
  details?: string
  mediaUrl?: string
  mediaType?: 'VIDEO' | 'IMAGE' | 'LOTTIE'
  relatedKeys?: string[]
  tourId?: string
  storeId?: string | null
  createdBy?: 'SYSTEM' | 'MANUAL' | 'AI'
}

// Registered element in the help system
export interface RegisteredElement {
  key: string
  element: HTMLElement
  rect: DOMRect
}

// Help mode state
export interface HelpModeState {
  isActive: boolean
  selectedElement: RegisteredElement | null
  visibleElements: RegisteredElement[]
  content: HelpContent | null
  isLoading: boolean
}

// Walkthrough tour
export interface HelpTour {
  id: string
  slug: string
  title: string
  description?: string
  steps: JoyrideStep[]
  options?: JoyrideOptions
  route?: string
  roles?: string[]
  storeId?: string | null
  isActive: boolean
}

// Joyride options subset we support
export interface JoyrideOptions {
  continuous?: boolean
  scrollToFirstStep?: boolean
  showProgress?: boolean
  showSkipButton?: boolean
  disableOverlayClose?: boolean
  spotlightClicks?: boolean
}

// Help system context value
export interface HelpContextValue {
  // Help mode
  helpMode: HelpModeState
  toggleHelpMode: () => void
  enterHelpMode: () => void
  exitHelpMode: () => void

  // Element registration
  registerElement: (key: string, element: HTMLElement) => void
  unregisterElement: (key: string) => void

  // Content
  selectElement: (key: string) => void
  clearSelection: () => void
  getContent: (key: string) => Promise<HelpContent | null>

  // Content updates (for AI tool integration)
  onContentUpdated: (event: HelpContentUpdateEvent) => void
  recentUpdates: HelpContentUpdateEvent[]

  // Walkthrough
  isWalkthroughActive: boolean
  startWalkthrough: (tourSlug?: string) => void
  stopWalkthrough: () => void
  availableTours: HelpTour[]
}

// Default content registry (code-based fallback)
export type DefaultContentRegistry = Record<string, Omit<HelpContent, 'elementKey'>>

// Props for the help provider
export interface HelpProviderProps {
  children: React.ReactNode
  defaultContent?: DefaultContentRegistry
  storeId?: string
  disabled?: boolean
}

// Props for elements that use help
export interface WithHelpProps {
  helpKey?: string
  helpTitle?: string
  helpSummary?: string
}

// Help content update event (from AI tools or socket)
export interface HelpContentUpdateEvent {
  elementKey: string
  action: 'created' | 'updated' | 'deleted'
  title?: string
  summary?: string
  source: 'ai' | 'admin'
  timestamp: number
}
