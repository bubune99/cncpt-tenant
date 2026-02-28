/**
 * ThemeInjector - Server Component
 *
 * Fetches branding settings from the database and injects CSS variable
 * overrides via a <style> tag. This allows admin-configured primary and
 * accent colors to override the defaults defined in globals.css.
 *
 * Because this is a React Server Component, it runs on the server and
 * does not add any client-side JavaScript. The CSS is rendered inline
 * in the initial HTML response.
 */

import { getBrandingSettings } from '../lib/settings'
import { generateThemeCss } from '../lib/theme/color-utils'

export async function ThemeInjector() {
  let css = ''

  try {
    const branding = await getBrandingSettings()
    css = generateThemeCss(branding.primaryColor, branding.accentColor)
  } catch {
    // If the database is unavailable (e.g., during build), skip injection.
    // The site will use the default CSS variable values from globals.css.
    return null
  }

  if (!css) return null

  return (
    <style
      id="theme-overrides"
      dangerouslySetInnerHTML={{ __html: css }}
    />
  )
}
