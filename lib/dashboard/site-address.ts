/**
 * A client site's address rules, used by POST /api/dashboard/subdomain and the New client site panel.
 * Check: lib/dashboard/site-address.assert.ts
 */

const ADDRESS_RE = /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/

export const RESERVED_ADDRESSES = [
  "www", "app", "api", "admin", "dashboard", "mail", "email", "ftp", "blog", "shop",
  "store", "help", "support", "docs", "dev", "staging", "test", "demo",
]

export function checkAddress(address: string): { valid: boolean; error?: string } {
  if (!address) return { valid: false, error: "An address is required" }
  if (address.length < 3) return { valid: false, error: "The address must be at least 3 characters" }
  if (address.length > 63) return { valid: false, error: "The address must be at most 63 characters" }
  if (!ADDRESS_RE.test(address)) {
    return { valid: false, error: "Use lowercase letters, numbers and hyphens, not starting or ending with a hyphen" }
  }
  if (RESERVED_ADDRESSES.includes(address)) return { valid: false, error: "That address is reserved" }
  return { valid: true }
}

/** A suggested address from the site's name: "Acme Coffee Co." -> "acme-coffee-co". */
export function addressFromName(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 63)
    .replace(/-+$/g, "")
}
