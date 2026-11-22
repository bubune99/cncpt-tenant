/** The Client sites list: narrowing by name and ordering (asserted by site-list.assert.ts). */
export type SiteSort = "newest" | "oldest" | "name"
export const SORT_LABEL: Record<SiteSort, string> = { newest: "Newest first", oldest: "Oldest first", name: "Name A–Z" }
const ORDER: SiteSort[] = ["newest", "oldest", "name"]
export const nextSort = (s: SiteSort): SiteSort => ORDER[(ORDER.indexOf(s) + 1) % ORDER.length]

interface SiteLike { subdomain: string; site_title?: string | null; created_at?: string | null }
const title = (s: SiteLike) => (s.site_title || s.subdomain).toLowerCase()
const time = (s: SiteLike) => { const t = s.created_at ? Date.parse(s.created_at) : NaN; return Number.isFinite(t) ? t : null }

export function visibleSites<T extends SiteLike>(sites: T[], query: string, sort: SiteSort): T[] {
  const q = query.trim().toLowerCase()
  const kept = q ? sites.filter((s) => title(s).includes(q) || s.subdomain.toLowerCase().includes(q)) : sites.slice()
  return kept.sort((a, b) => {
    if (sort === "name") return title(a).localeCompare(title(b))
    const ta = time(a), tb = time(b)
    if (ta === null || tb === null) return ta === null ? (tb === null ? 0 : 1) : -1
    return sort === "newest" ? tb - ta : ta - tb
  })
}
