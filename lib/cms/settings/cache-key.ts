/**
 * Cache keys for lib/cms/settings: one entry per site and group, so a cached group read for one
 * site is never served to another. Check: lib/cms/settings/cache-key.assert.ts
 */
export function settingsCacheKey(tenantId: number | null, group: string): string {
  return `${tenantId ?? "platform"}:${group}`
}

export function keysForGroup(keys: Iterable<string>, group: string): string[] {
  return [...keys].filter((k) => k.slice(k.indexOf(":") + 1) === group)
}
