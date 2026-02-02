/**
 * Demo Mode Configuration
 *
 * The "demo" subdomain allows unauthenticated users to explore the CMS backend
 * in a read-only mode with sample data.
 */

export const DEMO_SUBDOMAIN = "demo";

/**
 * Check if a subdomain is the demo subdomain
 */
export function isDemoSubdomain(subdomain: string | undefined | null): boolean {
  return subdomain?.toLowerCase() === DEMO_SUBDOMAIN;
}

/**
 * Demo mode settings
 */
export const DEMO_CONFIG = {
  // Allow viewing but not editing
  readOnly: true,
  // Sample site name for demo
  siteName: "CNCPT Demo Store",
  // Sample site description
  siteDescription: "Explore the full CNCPT CMS experience with this interactive demo.",
  // Demo email (not real)
  contactEmail: "demo@cncptweb.com",
};

/**
 * Demo user object returned for unauthenticated demo access
 */
export const DEMO_USER = {
  id: "demo-user",
  displayName: "Demo User",
  primaryEmail: "demo@cncptweb.com",
  isDemo: true,
};
