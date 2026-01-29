/**
 * Client Theme Configuration
 *
 * Override default theme values here. These will be merged with the core theme.
 */

export const clientTheme = {
  // Brand colors
  colors: {
    primary: undefined,      // e.g., '#3b82f6'
    secondary: undefined,    // e.g., '#64748b'
    accent: undefined,       // e.g., '#f59e0b'
    background: undefined,   // e.g., '#ffffff'
    foreground: undefined,   // e.g., '#0f172a'
  },

  // Typography
  fonts: {
    heading: undefined,      // e.g., 'Inter, sans-serif'
    body: undefined,         // e.g., 'Inter, sans-serif'
    mono: undefined,         // e.g., 'JetBrains Mono, monospace'
  },

  // Border radius
  radius: {
    sm: undefined,           // e.g., '0.25rem'
    md: undefined,           // e.g., '0.5rem'
    lg: undefined,           // e.g., '1rem'
    full: undefined,         // e.g., '9999px'
  },

  // Custom CSS variables (will be injected into :root)
  cssVariables: {
    // '--custom-var': 'value',
  },
};

export type ClientTheme = typeof clientTheme;
