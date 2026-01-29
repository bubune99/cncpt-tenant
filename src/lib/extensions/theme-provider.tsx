'use client';

/**
 * Theme Provider
 *
 * Provides theme context and injects client theme CSS variables.
 */

import React, { createContext, useContext, useEffect, useMemo } from 'react';
import clientConfig from '../../../client.config';

type Theme = typeof clientConfig.theme;

interface ThemeContextValue {
  theme: Theme;
  colors: Theme['colors'];
  fonts: Theme['fonts'];
  radius: Theme['radius'];
  darkMode: Theme['darkMode'];
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * Hook to access theme values
 */
export function useClientTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useClientTheme must be used within ClientThemeProvider');
  }
  return context;
}

/**
 * Generate CSS variables from theme config
 */
function generateCssVariables(theme: Theme): string {
  const vars: string[] = [];

  // Colors
  if (theme.colors) {
    Object.entries(theme.colors).forEach(([key, value]) => {
      if (value) {
        vars.push(`--client-color-${key}: ${value};`);
      }
    });
  }

  // Fonts
  if (theme.fonts) {
    Object.entries(theme.fonts).forEach(([key, value]) => {
      if (value) {
        vars.push(`--client-font-${key}: ${value};`);
      }
    });
  }

  // Radius
  if (theme.radius) {
    Object.entries(theme.radius).forEach(([key, value]) => {
      if (value) {
        vars.push(`--client-radius-${key}: ${value};`);
      }
    });
  }

  // Custom CSS variables
  if (theme.cssVariables) {
    Object.entries(theme.cssVariables).forEach(([key, value]) => {
      if (value) {
        vars.push(`${key}: ${value};`);
      }
    });
  }

  return vars.join('\n');
}

interface ClientThemeProviderProps {
  children: React.ReactNode;
}

/**
 * Theme Provider Component
 *
 * Wrap your app with this to enable client theming.
 */
export function ClientThemeProvider({ children }: ClientThemeProviderProps) {
  const theme = clientConfig.theme;

  // Inject CSS variables
  useEffect(() => {
    const cssVars = generateCssVariables(theme);
    if (cssVars) {
      const style = document.createElement('style');
      style.id = 'client-theme-vars';
      style.textContent = `:root {\n${cssVars}\n}`;

      // Remove existing if any
      const existing = document.getElementById('client-theme-vars');
      if (existing) {
        existing.remove();
      }

      document.head.appendChild(style);

      return () => {
        style.remove();
      };
    }
  }, [theme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      colors: theme.colors,
      fonts: theme.fonts,
      radius: theme.radius,
      darkMode: theme.darkMode,
    }),
    [theme]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}
