"use client";

/**
 * Skip to Content Link
 *
 * A hidden-by-default link that becomes visible on keyboard focus,
 * allowing keyboard users to skip past navigation to main content.
 * WCAG 2.1 AA requirement (2.4.1 Bypass Blocks).
 */
export function SkipToContent() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-background focus:text-foreground focus:border focus:border-ring focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:text-sm focus:font-medium"
    >
      Skip to main content
    </a>
  );
}
