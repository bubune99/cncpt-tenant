/**
 * Theme Color Utilities
 *
 * Converts hex colors from branding settings into CSS variable overrides.
 * The site's globals.css uses OKLch color space, but we inject hex colors
 * directly as CSS custom property overrides since they take precedence
 * in the cascade.
 */

/**
 * Convert a hex color string to HSL components.
 * Used to determine lightness for automatic foreground color selection.
 */
export function hexToHsl(hex: string): { h: number; s: number; l: number } {
  // Remove # prefix
  hex = hex.replace('#', '')

  // Handle shorthand hex (e.g., #fff)
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2]
  }

  const r = parseInt(hex.slice(0, 2), 16) / 255
  const g = parseInt(hex.slice(2, 4), 16) / 255
  const b = parseInt(hex.slice(4, 6), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      case b:
        h = ((r - g) / d + 4) / 6
        break
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  }
}

/**
 * Determine whether a foreground color should be white or black
 * based on the background color's perceived lightness.
 */
function contrastForeground(hex: string): string {
  const { l } = hexToHsl(hex)
  return l > 50 ? '#000000' : '#ffffff'
}

/**
 * Generate CSS variable overrides from branding settings.
 *
 * Returns a CSS string to inject into a <style> tag. The overrides
 * apply to both :root (light mode) and .dark (dark mode) so the
 * branding colors are consistent regardless of theme.
 *
 * Variables overridden:
 *   --primary, --primary-foreground
 *   --accent, --accent-foreground
 *   --sidebar-primary, --sidebar-primary-foreground
 *   --ring (set to primary for focus rings)
 */
export function generateThemeCss(
  primaryColor?: string,
  accentColor?: string
): string {
  if (!primaryColor && !accentColor) return ''

  const lightRules: string[] = []
  const darkRules: string[] = []

  if (primaryColor) {
    const fg = contrastForeground(primaryColor)

    // Light mode: primary is the brand color
    lightRules.push(`--primary: ${primaryColor}`)
    lightRules.push(`--primary-foreground: ${fg}`)
    lightRules.push(`--sidebar-primary: ${primaryColor}`)
    lightRules.push(`--sidebar-primary-foreground: ${fg}`)
    lightRules.push(`--ring: ${primaryColor}`)

    // Dark mode: same brand color for consistency
    darkRules.push(`--primary: ${primaryColor}`)
    darkRules.push(`--primary-foreground: ${fg}`)
    darkRules.push(`--sidebar-primary: ${primaryColor}`)
    darkRules.push(`--sidebar-primary-foreground: ${fg}`)
    darkRules.push(`--ring: ${primaryColor}`)
  }

  if (accentColor) {
    const fg = contrastForeground(accentColor)

    lightRules.push(`--accent: ${accentColor}`)
    lightRules.push(`--accent-foreground: ${fg}`)
    lightRules.push(`--sidebar-accent: ${accentColor}`)
    lightRules.push(`--sidebar-accent-foreground: ${fg}`)

    darkRules.push(`--accent: ${accentColor}`)
    darkRules.push(`--accent-foreground: ${fg}`)
    darkRules.push(`--sidebar-accent: ${accentColor}`)
    darkRules.push(`--sidebar-accent-foreground: ${fg}`)
  }

  const parts: string[] = []

  if (lightRules.length > 0) {
    parts.push(`:root { ${lightRules.join('; ')} }`)
  }

  if (darkRules.length > 0) {
    parts.push(`.dark { ${darkRules.join('; ')} }`)
  }

  return parts.join('\n')
}
