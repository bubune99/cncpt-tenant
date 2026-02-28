"use client"

import { useCallback, useEffect, useRef } from "react"
import { useEditor } from "./editor-context"

/**
 * Hook for external code editor components to interface with the visual editor.
 *
 * Provides a clean API contract:
 * - `source`: The current JSX string (reactive)
 * - `applyJSX`: Push JSX edits back to the visual editor
 * - `getSource`: Get current JSX on demand
 * - `onBlocksChange`: Subscribe to block changes
 */
export function useCodeEditorBridge() {
  const {
    jsxSource,
    setBlocksFromJSX,
    getJSXSource,
    state,
  } = useEditor()

  const listenersRef = useRef<Set<(jsx: string) => void>>(new Set())

  // Notify listeners when blocks change
  useEffect(() => {
    listenersRef.current.forEach((callback) => {
      callback(jsxSource)
    })
  }, [jsxSource])

  const applyJSX = useCallback((jsx: string): { success: boolean; errors: string[] } => {
    return setBlocksFromJSX(jsx)
  }, [setBlocksFromJSX])

  const getSource = useCallback((): string => {
    return getJSXSource()
  }, [getJSXSource])

  const onBlocksChange = useCallback((callback: (jsx: string) => void): (() => void) => {
    listenersRef.current.add(callback)
    callback(jsxSource)
    return () => {
      listenersRef.current.delete(callback)
    }
  }, [jsxSource])

  return {
    source: jsxSource,
    applyJSX,
    getSource,
    onBlocksChange,
    syncDirection: state.jsxSyncDirection,
    isDirty: state.hasUnsavedChanges,
  }
}
