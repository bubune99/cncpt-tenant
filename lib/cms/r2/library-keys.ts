/**
 * What the shared stock-image library may list. Each site's uploads live under tenants/<subdomain>/
 * (uploadTenantMedia) and are listed only through that site's own media routes, never here.
 * Check: lib/cms/r2/library-keys.assert.ts
 */
const PRIVATE_ROOTS = ["tenants"]

function root(path: string): string {
  return path.replace(/^\/+/, "").split("/")[0].toLowerCase()
}

export function isLibraryKey(key: string): boolean {
  return !PRIVATE_ROOTS.includes(root(key))
}

export function isLibraryCategory(category: string): boolean {
  return !PRIVATE_ROOTS.includes(root(category))
}
