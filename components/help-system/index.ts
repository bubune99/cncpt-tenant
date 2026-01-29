/**
 * Help System
 *
 * Provides contextual help mode and guided walkthroughs for the dashboard.
 *
 * Usage:
 * 1. Wrap your app with <HelpProvider>
 * 2. Add data-help-key="key.name" to elements you want to be helpable
 * 3. Add content for those keys in default-content.ts
 * 4. Users can press Ctrl+Q to enter help mode
 */

export { HelpProvider, useHelp, useHelpOptional } from './help-provider'
export { HelpOverlay } from './help-overlay'
export { HelpMessageBar } from './help-message-bar'
export { HelpTooltip } from './help-tooltip'
export { getDefaultContent, defaultHelpContent } from './default-content'

export type {
  HelpContent,
  HelpModeState,
  HelpTour,
  HelpContextValue,
  HelpProviderProps,
  JoyrideStep,
  JoyrideOptions,
  RegisteredElement,
  DefaultContentRegistry,
  WithHelpProps,
  HelpContentUpdateEvent,
} from './types'
