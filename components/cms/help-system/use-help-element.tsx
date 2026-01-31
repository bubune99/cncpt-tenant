'use client'

/**
 * useHelpElement Hook
 *
 * Register a DOM element for help mode highlighting and content.
 * Attach this to any interactive element that should be discoverable.
 */

import { useEffect, useRef, useCallback } from 'react'
import { useHelpOptional } from './help-provider'

interface UseHelpElementOptions {
  /** Unique key identifying this element (e.g., "admin.sidebar.products") */
  key: string
  /** Whether help is disabled for this element */
  disabled?: boolean
}

/**
 * Hook to register an element for help mode
 *
 * @example
 * ```tsx
 * function MyButton() {
 *   const helpRef = useHelpElement({ key: 'myButton' })
 *
 *   return (
 *     <button ref={helpRef}>
 *       Click me
 *     </button>
 *   )
 * }
 * ```
 */
export function useHelpElement<T extends HTMLElement = HTMLElement>({
  key,
  disabled = false,
}: UseHelpElementOptions) {
  const helpContext = useHelpOptional()
  const elementRef = useRef<T | null>(null)

  // Register element on mount, unregister on unmount
  useEffect(() => {
    if (disabled || !helpContext || !elementRef.current) return

    const element = elementRef.current
    helpContext.registerElement(key, element)

    return () => {
      helpContext.unregisterElement(key)
    }
  }, [key, disabled, helpContext])

  // Callback ref to handle dynamic elements
  const setRef = useCallback(
    (node: T | null) => {
      // Unregister old element if switching
      if (elementRef.current && helpContext && !disabled) {
        helpContext.unregisterElement(key)
      }

      elementRef.current = node

      // Register new element
      if (node && helpContext && !disabled) {
        helpContext.registerElement(key, node)
      }
    },
    [key, disabled, helpContext]
  )

  return setRef
}

/**
 * Higher-order component to add help support to any component
 *
 * @example
 * ```tsx
 * const HelpButton = withHelp(Button, 'myButton')
 *
 * // Usage
 * <HelpButton onClick={...}>Click me</HelpButton>
 * ```
 */
export function withHelp<P extends object>(
  Component: React.ComponentType<P & { ref?: React.Ref<HTMLElement> }>,
  helpKey: string
) {
  const WrappedComponent = (props: P) => {
    const helpRef = useHelpElement({ key: helpKey })

    return <Component {...props} ref={helpRef} />
  }

  WrappedComponent.displayName = `withHelp(${Component.displayName || Component.name || 'Component'})`

  return WrappedComponent
}

/**
 * Generate a data attribute object for help elements
 * Use this when you can't use a ref but want to mark elements
 *
 * @example
 * ```tsx
 * <button {...helpDataAttributes('myButton')}>
 *   Click me
 * </button>
 * ```
 */
export function helpDataAttributes(key: string) {
  return {
    'data-help-key': key,
  }
}
