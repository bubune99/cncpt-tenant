"use client"

/**
 * Workspace Overview (redesign of 2026-11-20; owner: "cncptweb.com/dashboard needs a better walkthrough and
 * re-do to be better designed and to flow better"; mock-up approved with "finish the build").
 *
 * - One primary action, "New client site" (an in-frame panel), and "Take the tour".
 * - "Get your agency running": five steps worked out from stored facts (/api/dashboard/setup-status,
 *   rules in lib/dashboard/setup-guide.ts); each step opens the place to do it. Hide is remembered per browser.
 * - Client site cards: setup progress, Open CMS, Visit, Settings (the site's page).
 * Moved off this screen: activity (the right-hand rail), support (Inbox), AI credits (Billing & credits).
 * Dropped: the "All systems normal" pill, which was fixed text and not a status.
 */

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, ExternalLink, Settings as SettingsIcon, Check, ArrowRight, Compass } from "lucide-react"
import { rootDomain, protocol } from "@/lib/utils"
import { accountGuide, siteSetup, type SiteFacts, type StepId } from "@/lib/dashboard/setup-guide"
import { firstName } from "@/lib/dashboard/greeting"
import { CanvasTour, type TourStop } from "./canvas-tour"
import { CanvasNewSite } from "./canvas-new-site"

interface CanvasOverviewProps {
  user: any
  subdomains: any[]
  selectedSubdomain: string | null
  /** goes up by one each time something outside (the site switcher) asks for the New client site panel */
  newSiteRequest?: number
  /** tells the shell the request was handled, so coming back to the Overview later does not reopen it */
  onNewSiteHandled?: () => void
}

const GUIDE_HIDDEN_KEY = "cncpt:dashboard:guide-hidden"

const TOUR: TourStop[] = [
  { target: "[data-ui='overview.new_site']", title: "Start here", body: "Make a site for each client: name it, pick its address, and it is live at that address right away." },
  { target: "[data-ui='overview.guide']", title: "Your setup, step by step", body: "Each step opens the place to do it and ticks itself off when it is done. Hide it whenever you like; Take the tour shows it again." },
  { target: "[data-ui='overview.sites']", title: "Every client in one place", body: "Open a client's CMS to edit their content, visit the live site, or open Settings for its brand, domain and visibility." },
  { target: ".dirH__nav", title: "Seven places", body: "Client sites, analytics, team, inbox, billing and settings each have one home here. Search (Ctrl K) reaches anything." },
  { target: ".dirH__rrail", title: "What changed", body: "Account activity shows here as it happens: team, roles and settings changes." },
]


function readHidden(): boolean {
  try { return window.localStorage.getItem(GUIDE_HIDDEN_KEY) === "1" } catch { return false }
}
function writeHidden(v: boolean) {
  try { v ? window.localStorage.setItem(GUIDE_HIDDEN_KEY, "1") : window.localStorage.removeItem(GUIDE_HIDDEN_KEY) } catch { /* private mode */ }
}

export function CanvasOverview({ user, subdomains, newSiteRequest = 0, onNewSiteHandled }: CanvasOverviewProps) {
  const router = useRouter()
  const [facts, setFacts] = useState<SiteFacts[] | null>(null)
  const [failed, setFailed] = useState(false)
  const [guideHidden, setGuideHidden] = useState(false)
  const [tourOpen, setTourOpen] = useState(false)
  const [newOpen, setNewOpen] = useState(false)

  // Only the newest request may set the facts (a site created, then the list refreshed, overlaps two loads).
  const loadSeq = useRef(0)
  const load = useCallback(() => {
    const my = ++loadSeq.current
    setFailed(false)
    fetch("/api/dashboard/setup-status")
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d) => { if (my === loadSeq.current) setFacts(Array.isArray(d?.sites) ? d.sites : []) })
      .catch(() => { if (my === loadSeq.current) setFailed(true) })
  }, [])
  useEffect(() => () => { loadSeq.current++ }, [])

  useEffect(() => { setGuideHidden(readHidden()) }, [])
  // The site switcher's "New client site" opens the same panel (the request is held by the shell).
  useEffect(() => {
    if (newSiteRequest > 0) { setNewOpen(true); onNewSiteHandled?.() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newSiteRequest])
  const closeTour = useCallback(() => setTourOpen(false), [])
  useEffect(() => { load() }, [subdomains.length, load])

  const guide = facts ? accountGuide(facts) : null
  const name = firstName(user)
  const email = user?.primaryEmail ?? user?.email ?? ""
  const showGuide = !guideHidden && guide !== null && !guide.complete

  const openSite = (subdomain: string, tab?: string) =>
    window.dispatchEvent(new CustomEvent("open-site", { detail: tab ? { subdomain, tab } : subdomain }))

  const doStep = (id: StepId, site: string | null) => {
    if (id === "site") return setNewOpen(true)
    if (id === "invite") return window.dispatchEvent(new CustomEvent("navigate-to-section", { detail: "team" }))
    if (!site) return
    openSite(site, id === "brand" ? "branding" : id === "domain" ? "dns" : "visibility")
  }

  const startTour = () => {
    if (guideHidden) { setGuideHidden(false); writeHidden(false) }
    // Same commit: the guide is in the DOM before the tour's layout effect measures it.
    setTourOpen(true)
  }

  const subline = guide
    ? guide.complete
      ? `${subdomains.length} client site${subdomains.length === 1 ? "" : "s"}. Everything is set up.`
      : subdomains.length === 0
      ? "Add your first client site to get started."
      : `${subdomains.length} client site${subdomains.length === 1 ? "" : "s"}. ${guide.total - guide.done} setup step${guide.total - guide.done === 1 ? "" : "s"} left.`
    : `${subdomains.length} client site${subdomains.length === 1 ? "" : "s"}.`

  return (
    <div className="dirH__page" style={{ padding: "20px 24px", overflow: "auto" }}>
      <div className="tnt__page-h tnt__ov-head">
        <div>
          <h1>{name ? `Good day, ${name}` : "Overview"}</h1>
          <div className="sub">{subline}</div>
        </div>
        <div className="row" style={{ gap: 8 }}>
          {/* Hiding the guide was one way: nothing visible brought it back (walk 2026-11-22). */}
          {guideHidden && guide !== null && !guide.complete ? (
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => { setGuideHidden(false); writeHidden(false) }} data-ui="overview.guide_show">
              Show setup guide
            </button>
          ) : null}
          <button type="button" className="btn btn--secondary btn--sm" onClick={startTour} data-ui="overview.tour">
            <Compass style={{ width: 13, height: 13 }} /> Take the tour
          </button>
          <button type="button" className="btn btn--primary btn--sm" onClick={() => setNewOpen(true)} data-ui="overview.new_site">
            <Plus style={{ width: 13, height: 13 }} /> New client site
          </button>
        </div>
      </div>

      {failed ? (
        <div className="tnt__banner tnt__banner--warn" style={{ marginBottom: 16 }} role="status">
          <div className="tnt__banner-row"><span><b>Setup status could not be loaded.</b><span className="sub"> The guide and progress are hidden until it loads.</span></span></div>
          <button type="button" className="btn btn--secondary btn--xs" onClick={load}>Try again</button>
        </div>
      ) : null}

      {showGuide && guide ? (
        <section className="card tnt__guide" data-ui="overview.guide" aria-labelledby="ov-guide-h">
          <div className="card__head">
            <h3 className="card__title" id="ov-guide-h">Get your agency running</h3>
            <div className="row" style={{ gap: 10 }}>
              <span className="muted" style={{ fontSize: 11.5 }}>{guide.done} of {guide.total} done</span>
              <button type="button" className="btn btn--ghost btn--xs" onClick={() => { setGuideHidden(true); writeHidden(true) }} data-ui="overview.guide_hide">Hide</button>
            </div>
          </div>
          <div className="tnt__guide-bar" role="progressbar" aria-valuemin={0} aria-valuemax={guide.total} aria-valuenow={guide.done} aria-label="Setup progress">
            <i style={{ width: `${Math.round((guide.done / guide.total) * 100)}%` }} />
          </div>
          <ol className="tnt__guide-steps">
            {guide.steps.map((s, i) => {
              const actionable = !s.done && (s.id === "site" || s.id === "invite" || s.site !== null)
              return (
                <li key={s.id} className={"tnt__guide-step" + (s.done ? " is-done" : "") + (guide.next?.id === s.id ? " is-next" : "")} data-ui={`overview.step.${s.id}`}>
                  <div className="tnt__guide-num" aria-hidden="true">{s.done ? <Check style={{ width: 12, height: 12 }} /> : i + 1}</div>
                  <div className="col" style={{ gap: 2, flex: 1, minWidth: 0 }}>
                    <b>{s.title}{s.done ? <span className="sr-only"> (done)</span> : null}</b>
                    <span className="muted" style={{ fontSize: 11.5 }}>{s.what}</span>
                  </div>
                  {s.done ? (
                    <span className="tnt__guide-done">{s.detail}</span>
                  ) : actionable ? (
                    <button type="button" className={"btn btn--xs " + (guide.next?.id === s.id ? "btn--primary" : "btn--secondary")} onClick={() => doStep(s.id, s.site)} data-ui={`overview.step.${s.id}.do`} aria-label={`${s.title}: ${s.id === "site" ? "New client site" : s.detail}`}>
                      {s.id === "site" ? "New client site" : s.detail} <ArrowRight style={{ width: 11, height: 11 }} />
                    </button>
                  ) : (
                    <span className="muted" style={{ fontSize: 11.5 }}>{s.detail}</span>
                  )}
                </li>
              )
            })}
          </ol>
        </section>
      ) : null}

      <section className="card" data-ui="overview.sites" aria-labelledby="ov-sites-h">
        <div className="card__head">
          <h3 className="card__title" id="ov-sites-h">Your client sites</h3>
          <button type="button" className="btn btn--ghost btn--xs" onClick={() => window.dispatchEvent(new CustomEvent("navigate-to-section", { detail: "sites" }))}>
            All sites <ArrowRight style={{ width: 11, height: 11 }} />
          </button>
        </div>
        {subdomains.length === 0 ? (
          <div className="tnt__empty">
            <div className="tnt__empty-glyph"><Plus /></div>
            <h2 className="tnt__empty-h">Add your first client site</h2>
            <p className="tnt__empty-p">Each client gets their own site, address, brand and access.</p>
            <button type="button" className="btn btn--primary" onClick={() => setNewOpen(true)}>
              <Plus style={{ width: 13, height: 13 }} /> New client site
            </button>
          </div>
        ) : (
          <div className="tnt__site-grid">
            {subdomains.map((s) => {
              const siteUrl = `${protocol}://${s.subdomain}.${rootDomain}`
              const f = facts?.find((x) => x.subdomain === s.subdomain) ?? null
              const setup = f ? siteSetup(f) : null
              const title = f?.title || s.site_title || s.subdomain
              return (
                <div key={s.subdomain} className="tnt__site-card">
                  {/* The name block opens the site's page (walk 2026-11-20: the row did nothing). */}
                  <button
                    type="button"
                    className="tnt__site-card-open"
                    data-ui="overview.open_site"
                    aria-label={`Open ${title}`}
                    onClick={() => window.dispatchEvent(new CustomEvent("open-site", { detail: s.subdomain }))}
                  >
                    <span className="tnt__site-card-mark" aria-hidden="true">{(s.subdomain[0] || "S").toUpperCase()}</span>
                    <span className="col" style={{ gap: 1, minWidth: 0 }}>
                      <strong>{title}</strong>
                      <span className="tnt__site-card-host">{s.subdomain}.{rootDomain}</span>
                    </span>
                  </button>
                  <div className="col" style={{ gap: 5 }}>
                    <span className="muted" style={{ fontSize: 11.5 }}>
                      {setup ? (setup.complete ? "Set up" : `Setup ${setup.done} of ${setup.total}`) : failed ? "Setup —" : "Setup …"}
                    </span>
                    <div className="tnt__guide-bar tnt__guide-bar--sm" aria-hidden="true">
                      <i style={{ width: setup ? `${Math.round((setup.done / setup.total) * 100)}%` : "0%" }} />
                    </div>
                  </div>
                  <div className="row" style={{ gap: 6 }}>
                    <a className="btn btn--primary btn--xs" href={`${siteUrl}/admin`} data-ui="overview.site.cms" aria-label={`Open the CMS for ${title}`}>Open CMS</a>
                    <a className="btn btn--secondary btn--xs" href={siteUrl} target="_blank" rel="noreferrer" data-ui="overview.site.visit" aria-label={`Visit ${title} (opens a new tab)`}>
                      <ExternalLink style={{ width: 11, height: 11 }} /> Visit
                    </a>
                    <button type="button" className="btn btn--ghost btn--xs" onClick={() => openSite(s.subdomain)} data-ui="overview.site.settings" aria-label={`Settings for ${title}`}>
                      <SettingsIcon style={{ width: 11, height: 11 }} /> Settings
                    </button>
                  </div>
                </div>
              )
            })}
            <button type="button" className="tnt__site-card tnt__site-card--add" onClick={() => setNewOpen(true)} data-ui="overview.site.add" aria-label="Add a new client site">
              <Plus style={{ width: 14, height: 14 }} /> New client site
            </button>
          </div>
        )}
      </section>

      <CanvasNewSite
        open={newOpen}
        onOpenChange={setNewOpen}
        defaultEmail={email}
        onCreated={(sub) => {
          window.dispatchEvent(new CustomEvent("sites-changed", { detail: sub }))
          load()
          router.refresh()
        }}
      />
      <CanvasTour stops={TOUR} open={tourOpen} onClose={closeTour} />
    </div>
  )
}
