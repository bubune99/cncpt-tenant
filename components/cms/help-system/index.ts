/**
 * Help System
 *
 * A comprehensive help mode and walkthrough system for the CMS.
 *
 * Features:
 * - Help Mode: Press Ctrl+Q to highlight all interactive elements
 * - Click any highlighted element to see contextual help
 * - Walkthrough tours powered by react-joyride
 * - Database-driven content with code fallbacks
 * - Multi-tenant support for store-specific training
 *
 * @example
 * ```tsx
 * // Wrap your app with the provider
 * import { HelpProvider } from '@/components/cms/help-system'
 *
 * function App() {
 *   return (
 *     <HelpProvider>
 *       <YourApp />
 *     </HelpProvider>
 *   )
 * }
 *
 * // Register elements for help
 * import { useHelpElement } from '@/components/cms/help-system'
 *
 * function MyButton() {
 *   const helpRef = useHelpElement({ key: 'admin.myButton' })
 *   return <button ref={helpRef}>Click me</button>
 * }
 * ```
 */

// Main provider
export { HelpProvider, useHelp, useHelpOptional } from './help-provider'

// Element registration hook
export { useHelpElement, withHelp, helpDataAttributes } from './use-help-element'

// AI tool integration hook
export { useHelpToolHandler } from './use-help-tool-handler'

// UI components
export { HelpOverlay } from './help-overlay'
export { HelpMessageBar } from './help-message-bar'
export { HelpTooltip } from './help-tooltip'

// Walkthrough
export { WalkthroughProvider, useWalkthrough } from './walkthrough-provider'

// AI Walkthrough integration
export {
  useAIWalkthrough,
  AIWalkthroughHandler,
  isWalkthroughAction,
} from './use-ai-walkthrough'
export type { AIWalkthroughAction, AIWalkthroughResult } from './use-ai-walkthrough'

// Default content
export { defaultHelpContent, getDefaultContent } from './default-content'

// Help key registry
export {
  helpKeyRegistry,
  getAllHelpKeys,
  getHelpKeysByCategory,
  getHelpCategories,
  isValidHelpKey,
  getHelpKeyDefinition,
  getHelpKeysSummary,
  getAIGuidance,
  categoryGuidance,
} from './help-key-registry'
export type { HelpKeyDefinition } from './help-key-registry'

// Default tours
export { defaultTours, seedDefaultTours } from './default-tours'

// Types
export type {
  HelpContent,
  HelpTour,
  HelpContextValue,
  HelpModeState,
  HelpProviderProps,
  RegisteredElement,
  DefaultContentRegistry,
  WithHelpProps,
  JoyrideOptions,
  HelpContentUpdateEvent,
} from './types'
