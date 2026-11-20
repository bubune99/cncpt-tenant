/**
 * The workspace's setup guide ("Get your agency running") and each client site's setup checklist.
 * Pure: the facts come from /api/dashboard/setup-status, which reads them from the database.
 * Check: lib/dashboard/setup-guide.assert.ts
 */

export interface SiteFacts {
  subdomain: string
  title: string | null
  /** a logo or a brand color is stored for the site */
  branded: boolean
  /** the connected custom domain, if any */
  customDomain: string | null
  /** subdomain_settings.visibility; a site without settings is public */
  visibility: string
  /** people other than the owner who can open this site's CMS */
  collaborators: number
  /** a site the platform has disabled; the guide does not point at it */
  disabled?: boolean
}

export type SiteItemId = "brand" | "domain" | "invite" | "public"
export interface SiteItem { id: SiteItemId; label: string; done: boolean }
export interface SiteSetup { items: SiteItem[]; done: number; total: number; complete: boolean }

export function siteSetup(f: SiteFacts): SiteSetup {
  const items: SiteItem[] = [
    { id: "brand", label: "Brand applied (logo or colors)", done: f.branded },
    { id: "domain", label: "Custom domain connected", done: Boolean(f.customDomain) },
    { id: "invite", label: "Client invited to edit", done: f.collaborators > 0 },
    { id: "public", label: "Site is public", done: f.visibility === "public" },
  ]
  const done = items.filter((i) => i.done).length
  return { items, done, total: items.length, complete: done === items.length }
}

export type StepId = "site" | SiteItemId
export interface GuideStep {
  id: StepId
  title: string
  what: string
  done: boolean
  /** what has been done, or what to do next */
  detail: string
  /** the site this step points at (the first one that still needs it), or null */
  site: string | null
}
export interface Guide { steps: GuideStep[]; done: number; total: number; complete: boolean; next: GuideStep | null }

const STEPS: { id: StepId; title: string; what: string }[] = [
  { id: "site", title: "Add a client site", what: "Name it and give it its address." },
  { id: "brand", title: "Put their brand on it", what: "Add the logo and brand colors." },
  { id: "domain", title: "Connect their domain", what: "Point the client's own domain at the site." },
  { id: "invite", title: "Invite your client", what: "Give them access to edit their own content." },
  { id: "public", title: "Make it public", what: "Open the site to visitors." },
]

const name = (f: SiteFacts) => f.title || f.subdomain

export function accountGuide(all: SiteFacts[]): Guide {
  const sites = all.filter((s) => !s.disabled)
  const setups = sites.map((s) => ({ s, setup: siteSetup(s) }))
  const steps: GuideStep[] = STEPS.map((st) => {
    if (st.id === "site") {
      const done = sites.length > 0
      return { ...st, done, site: null, detail: done ? `${sites.length} site${sites.length === 1 ? "" : "s"}` : "Start here" }
    }
    if (sites.length === 0) return { ...st, done: false, site: null, detail: "After your first site" }
    const has = setups.find((x) => x.setup.items.find((i) => i.id === st.id)?.done)
    const lacks = setups.find((x) => !x.setup.items.find((i) => i.id === st.id)?.done)
    return has
      ? { ...st, done: true, site: has.s.subdomain, detail: `Done on ${name(has.s)}` }
      : { ...st, done: false, site: lacks ? lacks.s.subdomain : null, detail: lacks ? `Next: ${name(lacks.s)}` : "" }
  })
  const done = steps.filter((s) => s.done).length
  return { steps, done, total: steps.length, complete: done === steps.length, next: steps.find((s) => !s.done) ?? null }
}
