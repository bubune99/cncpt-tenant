"use client";

/**
 * Puck Help Mode Context
 *
 * Provides help mode state that can be shared between the Puck editor header
 * and the AI chat plugin. When help mode is active, the AI focuses on
 * explaining components rather than making changes.
 */

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface HelpModeContextValue {
  /** Whether help mode is currently active */
  helpMode: boolean;
  /** Toggle help mode on/off */
  toggleHelpMode: () => void;
  /** Set help mode explicitly */
  setHelpMode: (value: boolean) => void;
  /** Component type that user requested help for */
  helpTarget?: {
    componentId: string;
    componentType: string;
  };
  /** Set the help target (component user wants help with) */
  setHelpTarget: (target: { componentId: string; componentType: string } | undefined) => void;
}

const HelpModeContext = createContext<HelpModeContextValue | null>(null);

export function HelpModeProvider({ children }: { children: ReactNode }) {
  const [helpMode, setHelpModeState] = useState(false);
  const [helpTarget, setHelpTarget] = useState<{ componentId: string; componentType: string } | undefined>();

  const toggleHelpMode = useCallback(() => {
    setHelpModeState((prev) => !prev);
    // Clear help target when toggling off
    if (helpMode) {
      setHelpTarget(undefined);
    }
  }, [helpMode]);

  const setHelpMode = useCallback((value: boolean) => {
    setHelpModeState(value);
    if (!value) {
      setHelpTarget(undefined);
    }
  }, []);

  return (
    <HelpModeContext.Provider
      value={{
        helpMode,
        toggleHelpMode,
        setHelpMode,
        helpTarget,
        setHelpTarget,
      }}
    >
      {children}
    </HelpModeContext.Provider>
  );
}

/**
 * Hook to access help mode context
 * Must be used within a HelpModeProvider
 */
export function useHelpMode() {
  const context = useContext(HelpModeContext);
  if (!context) {
    throw new Error("useHelpMode must be used within a HelpModeProvider");
  }
  return context;
}

/**
 * Hook that returns help mode state with a fallback for when provider isn't available
 * Useful for the AI chat plugin which might be used outside the provider
 */
export function useHelpModeOptional() {
  const context = useContext(HelpModeContext);
  return context ?? {
    helpMode: false,
    toggleHelpMode: () => {},
    setHelpMode: () => {},
    helpTarget: undefined,
    setHelpTarget: () => {},
  };
}
