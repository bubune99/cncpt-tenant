/* TENANT — Overview / Home + Subdomain views (list, create, detail-with-tabs, empty state). */

/* ────────────────────────────────────────────────────────────────
 * Overview / Home
 * ──────────────────────────────────────────────────────────────── */

const Tnt_Overview = () => {
  const kpis = [
    { l: "Revenue · 7d",       v: "$12,840",  d: "+18%", up: true, bars: [4,6,5,7,8,7,9], icon: "trending-up" },
    { l: "Orders · 7d",        v: "164",      d: "+12%", up: true, bars: [3,4,4,6,5,7,7], icon: "shopping-bag" },
    { l: "Visitors · 7d",      v: "8,341",    d: "−3%",  up: false, bars: [6,7,5,6,5,4,5], icon: "users" },
    { l: "Conversion",         v: "1.96%",    d: "+0.3pt", up: true, bars: [2,3,3,4,4,5,6], icon: "percent" },
  ];
  return (
    <TntBoard>
      <Tnt_Sidebar active="overview" />
      <div className="dirH__main">
        <Tnt_Top
          crumbs={["Northgear", "Overview"]}
          right={
            <>
              <button className="btn btn--secondary btn--xs"><Icon name="calendar" size={12} /> Last 7 days</button>
              <button className="btn btn--secondary btn--xs"><Icon name="external-link" size={12} /> Visit storefront</button>
              <button className="btn btn--primary btn--xs"><Icon name="plus" size={12} /> New subdomain</button>
            </>
          }
        />
        <div className="dirH__page" style={{ padding: "20px 24px", overflow: "auto" }}>
          <div className="tnt__page-h">
            <div>
              <h1>Good morning, Maya</h1>
              <div className="sub">Here's what's happening across your 3 sites today.</div>
            </div>
            <div className="row" style={{ gap: 8 }}>
              <span className="pill pill--green"><span className="dot"></span> All systems normal</span>
              <span className="pill pill--blue"><Icon name="sparkles" size={11} /> 24,800 credits</span>
            </div>
          </div>

          {/* Banner — onboarding nudge */}
          <div className="tnt__banner tnt__banner--info" style={{ marginBottom: 16 }}>
            <Icon name="info" size={16} />
            <div className="tnt__banner-row">
              <span><b>Finish setting up beta.northgear.com</b><span className="sub"> — DNS is verified. Add a privacy page and choose a launch date to flip to Public.</span></span>
            </div>
            <button className="btn btn--secondary btn--xs">Open checklist</button>
            <button className="iconbtn iconbtn--sm iconbtn--ghost"><Icon name="x" size={12} /></button>
          </div>

          {/* KPI strip */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }}>
            {kpis.map(k => (
              <div className="tnt__stat" key={k.l}>
                <div className="tnt__stat-label"><Icon name={k.icon} size={12} /> {k.l}</div>
                <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-end" }}>
                  <div className="tnt__stat-value">{k.v}</div>
                  <div className="tnt__bars" style={{ width: 64 }}>
                    {k.bars.map((h, i) => <span key={i} style={{ height: (h*3) + "px" }}></span>)}
                  </div>
                </div>
                <div className={"tnt__stat-delta " + (k.up ? "tnt__stat-delta--up" : "tnt__stat-delta--down")}>
                  <Icon name={k.up ? "arrow-up-right" : "arrow-down-right"} size={12} /> {k.d} vs prev. 7d
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16 }}>
            {/* Sites overview */}
            <div className="card">
              <div className="card__head">
                <h3 className="card__title">Your sites</h3>
                <button className="btn btn--ghost btn--xs">Manage all <Icon name="arrow-right" size={11} /></button>
              </div>
              <div>
                {TNT_SITES.map(s => (
                  <div key={s.sub} className="row" style={{ gap: 12, padding: "12px 16px", borderBottom: "1px solid var(--br-border)", alignItems: "center" }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 8,
                      background: "linear-gradient(135deg," + s.branding.primary + "," + s.branding.accent + ")",
                      color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center",
                      fontWeight: 700, fontSize: 14, flexShrink: 0,
                    }}>{s.title[0]}</div>
                    <div className="col" style={{ gap: 1, flex: 1 }}>
                      <div className="row" style={{ gap: 6 }}>
                        <strong style={{ fontSize: 13 }}>{s.title}</strong>
                        <span className={"pill pill--" + (s.visibility === "Public" ? "green" : "amber")} style={{ fontSize: 10 }}>
                          <span className="dot"></span> {s.visibility}
                        </span>
                      </div>
                      <div className="mono" style={{ fontSize: 11, color: "var(--br-text-secondary)" }}>{s.customDomain ?? s.host}</div>
                    </div>
                    <div className="col" style={{ minWidth: 90, alignItems: "flex-end" }}>
                      <span style={{ fontSize: 12, fontWeight: 600 }}>{s.traffic}</span>
                      <span className="muted" style={{ fontSize: 10.5 }}>visitors</span>
                    </div>
                    <div className="col" style={{ minWidth: 80, alignItems: "flex-end" }}>
                      <span className="pill" style={{ fontSize: 10.5 }}>
                        <span className={"tnt__dot " + (s.deploy === "Live" ? "tnt__dot--ok" : "tnt__dot--warn")}></span>
                        {s.deploy}
                      </span>
                    </div>
                    <button className="iconbtn iconbtn--sm iconbtn--ghost"><Icon name="chevron-right" size={13} /></button>
                  </div>
                ))}
                <div className="row" style={{ padding: "10px 16px", gap: 6 }}>
                  <button className="btn btn--ghost btn--xs"><Icon name="plus" size={12} /> Add subdomain</button>
                </div>
              </div>
            </div>

            {/* Activity */}
            <div className="card">
              <div className="card__head">
                <h3 className="card__title">Team activity</h3>
                <button className="btn btn--ghost btn--xs">Full log</button>
              </div>
              <div>
                {TNT_ACTIVITY.slice(0, 6).map((a, i) => (
                  <div className="tnt__act-row" key={i}>
                    <div className={"avatar avatar--xs avatar--" + a.who.avatar}>{initials(a.who.name)}</div>
                    <div className="tnt__act-body">
                      <strong>{a.who.name.split(" ")[0]}</strong> {a.text}
                      {a.target ? <> · <span className="mono" style={{ fontSize: 10.5 }}>{a.target}</span></> : null}
                      <div className="tnt__act-time">{a.time} ago</div>
                    </div>
                    <div className="tnt__act-icon"><Icon name={a.icon} size={12} /></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Lower row — communications + credits */}
          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16, marginTop: 16 }}>
            <div className="card">
              <div className="card__head">
                <h3 className="card__title">Customer support · open</h3>
                <span className="pill pill--rose"><Icon name="alarm-clock" size={11} /> 2 SLA at risk</span>
              </div>
              <div>
                {TNT_TICKETS.filter(t => t.status === "open").slice(0, 4).map(t => (
                  <div key={t.id} className="row" style={{ padding: "10px 16px", borderBottom: "1px solid var(--br-border)", gap: 10 }}>
                    <span className={"tnt__dot tnt__dot--" + (t.priority === "high" ? "err" : t.priority === "med" ? "warn" : "idle")}></span>
                    <span className="mono" style={{ fontSize: 11, color: "var(--br-text-secondary)", width: 44 }}>{t.id}</span>
                    <div className="col" style={{ flex: 1, gap: 1, minWidth: 0 }}>
                      <span style={{ fontSize: 12.5, fontWeight: t.unread ? 600 : 500 }}>{t.subject}</span>
                      <span className="muted" style={{ fontSize: 11 }}>{t.from} · {t.site}.cncpt.app</span>
                    </div>
                    <span className="muted" style={{ fontSize: 11 }}>{t.time}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="card__head">
                <h3 className="card__title">AI credits this month</h3>
                <span className="muted" style={{ fontSize: 11 }}>resets May 31</span>
              </div>
              <div className="card__body">
                <div className="row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
                  <span className="tnt__stat-value" style={{ fontSize: 28 }}>24,800</span>
                  <span className="muted" style={{ fontSize: 11.5 }}>of 100,000</span>
                </div>
                <div style={{ height: 8, background: "var(--br-surface)", borderRadius: 4, overflow: "hidden", marginBottom: 12 }}>
                  <div style={{ width: "75%", height: "100%", background: "linear-gradient(90deg, #3b82f6, #06b6d4)" }}></div>
                </div>
                <div className="row" style={{ gap: 14, fontSize: 11 }}>
                  <span><strong>52,300</strong> <span className="muted">AI copy</span></span>
                  <span><strong>18,400</strong> <span className="muted">image gen</span></span>
                  <span><strong>4,500</strong> <span className="muted">other</span></span>
                </div>
                <div className="row" style={{ gap: 6, marginTop: 12 }}>
                  <button className="btn btn--primary btn--xs"><Icon name="zap" size={12} /> Top up 50,000</button>
                  <button className="btn btn--ghost btn--xs">Usage details</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Tnt_AIDock topic="general" />
    </TntBoard>
  );
};

/* ────────────────────────────────────────────────────────────────
 * Subdomain views
 * ──────────────────────────────────────────────────────────────── */

const Tnt_Subdomains = () => (
  <TntBoard>
    <Tnt_Sidebar active="subdomains" />
    <div className="dirH__main">
      <Tnt_Top
        crumbs={["Northgear", "Subdomains"]}
        right={
          <>
            <button className="btn btn--secondary btn--xs"><Icon name="filter" size={12} /> Filter</button>
            <button className="btn btn--primary btn--xs"><Icon name="plus" size={12} /> Create subdomain</button>
          </>
        }
      />
      <div className="dirH__page" style={{ padding: "20px 24px", overflow: "auto" }}>
        <div className="tnt__page-h">
          <div>
            <h1>Subdomains</h1>
            <div className="sub">Manage the sites in your Northgear workspace.</div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card__head">
            <div className="row" style={{ gap: 8 }}>
              <h3 className="card__title">3 sites</h3>
              <span className="muted" style={{ fontSize: 11 }}>1 private · 2 public</span>
            </div>
            <div className="row" style={{ gap: 6 }}>
              <button className="btn btn--ghost btn--xs"><Icon name="arrow-up-down" size={12} /> Sort</button>
              <button className="btn btn--ghost btn--xs"><Icon name="grid-3x3" size={12} /> Grid</button>
            </div>
          </div>
          <div>
            {TNT_SITES.map(s => (
              <div key={s.sub} style={{ padding: "16px 18px", borderBottom: "1px solid var(--br-border)", display: "grid", gridTemplateColumns: "1.6fr 1fr 1fr 1fr auto", gap: 18, alignItems: "center" }}>
                <div className="row" style={{ gap: 12 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 10,
                    background: "linear-gradient(135deg," + s.branding.primary + "," + s.branding.accent + ")",
                    color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 700, fontSize: 17, flexShrink: 0,
                  }}>{s.title[0]}</div>
                  <div className="col" style={{ gap: 2 }}>
                    <div className="row" style={{ gap: 6 }}>
                      <strong style={{ fontSize: 13.5 }}>{s.title}</strong>
                      <span className={"pill pill--" + (s.visibility === "Public" ? "green" : "amber")} style={{ fontSize: 10.5 }}>
                        <span className="dot"></span> {s.visibility}
                      </span>
                    </div>
                    <div className="mono" style={{ fontSize: 11, color: "var(--br-text-secondary)" }}>
                      {s.customDomain ? <><strong style={{ color: "var(--br-text)" }}>{s.customDomain}</strong> · </> : null}{s.host}
                    </div>
                  </div>
                </div>

                <div className="col" style={{ gap: 1 }}>
                  <span className="muted" style={{ fontSize: 10.5 }}>Traffic · 30d</span>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{s.traffic}</span>
                </div>
                <div className="col" style={{ gap: 1 }}>
                  <span className="muted" style={{ fontSize: 10.5 }}>Deployment</span>
                  <span className="row" style={{ gap: 4, fontSize: 12, fontWeight: 500 }}>
                    <span className={"tnt__dot " + (s.deploy === "Live" ? "tnt__dot--ok" : "tnt__dot--warn")}></span> {s.deploy}
                  </span>
                </div>
                <div className="col" style={{ gap: 1 }}>
                  <span className="muted" style={{ fontSize: 10.5 }}>Custom domain</span>
                  <span style={{ fontSize: 11.5, fontFamily: "var(--font-mono)" }}>{s.customDomain ?? <span className="muted">— not set —</span>}</span>
                </div>

                <div className="row" style={{ gap: 6 }}>
                  <button className="btn btn--secondary btn--xs">Manage</button>
                  <button className="iconbtn iconbtn--sm"><Icon name="external-link" size={12} /></button>
                  <button className="iconbtn iconbtn--sm iconbtn--ghost"><Icon name="more-horizontal" size={13} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card__head">
            <h3 className="card__title">Recently deleted</h3>
            <span className="muted" style={{ fontSize: 11 }}>Retained for 30 days</span>
          </div>
          <div className="card__body" style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px" }}>
            <div className="tnt__act-icon" style={{ width: 28, height: 28, background: "#fff3" }}><Icon name="archive" size={12} /></div>
            <div className="col" style={{ flex: 1, gap: 1 }}>
              <span style={{ fontSize: 12.5, fontWeight: 500 }}>winter-pop-up</span>
              <span className="muted" style={{ fontSize: 11 }}>Deleted by Jonas Becker · May 02 · 22 days left to restore</span>
            </div>
            <button className="btn btn--secondary btn--xs"><Icon name="rotate-ccw" size={12} /> Restore</button>
          </div>
        </div>
      </div>
    </div>
    <Tnt_AIDock topic="general" collapsed />
  </TntBoard>
);

/* Empty state — first time a tenant lands on Subdomains with nothing */
const Tnt_SubdomainsEmpty = () => (
  <TntBoard>
    <Tnt_Sidebar active="subdomains" />
    <div className="dirH__main">
      <Tnt_Top crumbs={["Northgear", "Subdomains"]} />
      <div className="dirH__page" style={{ padding: "20px 24px", overflow: "auto" }}>
        <div className="tnt__page-h">
          <div>
            <h1>Subdomains</h1>
            <div className="sub">Manage the sites in your Northgear workspace.</div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 16 }}>
          <div className="tnt__empty">
            <div className="tnt__empty-glyph"><Icon name="globe" size={28} /></div>
            <h2 className="tnt__empty-h">Spin up your first site</h2>
            <p className="tnt__empty-p">
              Your workspace can host any number of subdomains — for storefronts, blogs,
              landing pages, or staging environments. Each gets its own DNS, branding, and access.
            </p>
            <div className="row" style={{ gap: 8 }}>
              <button className="btn btn--primary"><Icon name="plus" size={13} /> Create subdomain</button>
              <button className="btn btn--secondary"><Icon name="link" size={13} /> Connect existing domain</button>
            </div>
          </div>
        </div>

        {/* Helper templates */}
        <div className="card">
          <div className="card__head">
            <h3 className="card__title">Or start from a template</h3>
            <span className="muted" style={{ fontSize: 11 }}>Pre-configured visibility, pages, and branding</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, padding: 16 }}>
            {[
              { i: "shopping-bag", l: "Storefront",      d: "Product catalog, checkout, customer accounts." },
              { i: "book-open",    l: "Blog or Journal", d: "Posts, authors, taxonomy, RSS feed." },
              { i: "globe-2",      l: "Landing page",    d: "Single page, capture form, analytics ready." },
            ].map(t => (
              <div key={t.l} className="card" style={{ cursor: "pointer", padding: 14, border: "1px solid var(--br-border)", display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: "#eff6ff", color: "var(--br-primary)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon name={t.i} size={16} />
                </div>
                <strong style={{ fontSize: 13 }}>{t.l}</strong>
                <span className="muted" style={{ fontSize: 11.5, lineHeight: 1.45 }}>{t.d}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
    <Tnt_AIDock topic="create" />
  </TntBoard>
);

/* ─── Subdomain detail (tabs: Overview / Visibility / DNS / Branding / Hosting) */

const Tnt_SubdomainDetail = ({ tab = "overview" }) => {
  const s = TNT_SITES[0];
  const tabs = [
    { id: "overview",   l: "Overview",   i: "layout-dashboard" },
    { id: "visibility", l: "Visibility", i: "eye" },
    { id: "dns",        l: "DNS & domains", i: "globe" },
    { id: "branding",   l: "Branding",   i: "paintbrush" },
    { id: "hosting",    l: "Hosting",    i: "server" },
    { id: "danger",     l: "Danger zone", i: "alert-triangle" },
  ];

  return (
    <TntBoard>
      <Tnt_Sidebar active="subdomains" />
      <div className="dirH__main">
        <Tnt_Top
          crumbs={["Northgear", "Subdomains", s.title]}
          right={
            <>
              <span className={"pill pill--" + (s.visibility === "Public" ? "green" : "amber")} style={{ fontSize: 11 }}>
                <span className="dot"></span> {s.visibility}
              </span>
              <button className="btn btn--secondary btn--xs"><Icon name="external-link" size={12} /> Visit</button>
              <button className="btn btn--primary btn--xs">Save changes</button>
            </>
          }
        />
        <div className="tnt__tabs">
          {tabs.map(t => (
            <button key={t.id} className={"tnt__tab " + (t.id === tab ? "is-on" : "")}>
              <Icon name={t.i} size={13} /> {t.l}
            </button>
          ))}
        </div>
        <div className="dirH__page" style={{ padding: "20px 24px", overflow: "auto" }}>
          {tab === "dns" ? <Tnt_DNSPanel site={s} /> : null}
          {tab === "branding" ? <Tnt_BrandingPanel site={s} /> : null}
          {tab === "overview" ? <Tnt_SubOverviewPanel site={s} /> : null}
          {tab === "visibility" ? <Tnt_VisibilityPanel site={s} /> : null}
          {tab === "hosting" ? <Tnt_HostingPanel site={s} /> : null}
          {tab === "danger" ? <Tnt_DangerZonePanel site={s} /> : null}
        </div>
      </div>
      <Tnt_AIDock topic={tab === "dns" ? "dns" : tab === "branding" ? "branding" : "general"} />
    </TntBoard>
  );
};

/* Sub-panels under the subdomain detail */

const Tnt_SubOverviewPanel = ({ site }) => (
  <>
    <div className="tnt__page-h">
      <div>
        <h1>{site.title}</h1>
        <div className="sub mono" style={{ fontFamily: "var(--font-mono)" }}>{site.host}{site.customDomain ? " · " + site.customDomain : ""}</div>
      </div>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }}>
      {[
        { l: "Visitors · 30d",  v: site.traffic, i: "users" },
        { l: "Orders · 30d",    v: "642",        i: "shopping-bag" },
        { l: "Revenue · 30d",   v: "$48,210",    i: "dollar-sign" },
        { l: "Status",          v: site.deploy,  i: "rocket" },
      ].map(k => (
        <div className="tnt__stat" key={k.l}>
          <div className="tnt__stat-label"><Icon name={k.i} size={12} /> {k.l}</div>
          <div className="tnt__stat-value">{k.v}</div>
        </div>
      ))}
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16 }}>
      <div className="card">
        <div className="card__head"><h3 className="card__title">Setup checklist</h3><span className="muted" style={{ fontSize: 11 }}>4 of 6 complete</span></div>
        <div>
          {[
            { l: "Custom domain connected", ok: true },
            { l: "DNS records verified", ok: true },
            { l: "Branding applied (logo + colors)", ok: true },
            { l: "Payment provider connected", ok: true },
            { l: "Privacy & Terms pages added", ok: false },
            { l: "Set launch date and flip to Public", ok: false },
          ].map((x, i) => (
            <div key={i} className="row" style={{ padding: "9px 16px", borderBottom: "1px solid var(--br-border)", gap: 10 }}>
              <span style={{
                width: 18, height: 18, borderRadius: 9999,
                background: x.ok ? "#10b981" : "#fff",
                border: x.ok ? "1px solid #10b981" : "1.5px dashed #cbd5e1",
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                color: "#fff",
              }}>{x.ok ? <Icon name="check" size={11} /> : null}</span>
              <span style={{ fontSize: 12.5, color: x.ok ? "var(--br-text-secondary)" : "var(--br-text)", textDecoration: x.ok ? "line-through" : "none" }}>{x.l}</span>
              {!x.ok ? <button className="btn btn--ghost btn--xs" style={{ marginLeft: "auto" }}>Resolve <Icon name="arrow-right" size={11} /></button> : null}
            </div>
          ))}
        </div>
      </div>
      <div className="card">
        <div className="card__head"><h3 className="card__title">Recent deploys</h3></div>
        <div>
          {[
            { v: "v124", c: "Update homepage hero", who: "Jonas", time: "2h ago", ok: true },
            { v: "v123", c: "Fix checkout typo",    who: "Maya",  time: "yesterday", ok: true },
            { v: "v122", c: "Add discount code",    who: "Mei",   time: "2d ago", ok: true },
            { v: "v121", c: "Build failed",         who: "Tomás", time: "3d ago", ok: false },
          ].map((d, i) => (
            <div key={i} className="row" style={{ padding: "9px 16px", borderBottom: "1px solid var(--br-border)", gap: 10, fontSize: 12 }}>
              <span className={"tnt__dot " + (d.ok ? "tnt__dot--ok" : "tnt__dot--err")}></span>
              <span className="mono" style={{ width: 38, color: "var(--br-text-secondary)" }}>{d.v}</span>
              <span style={{ flex: 1 }}>{d.c}</span>
              <span className="muted" style={{ fontSize: 11 }}>{d.who} · {d.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </>
);

const Tnt_VisibilityPanel = ({ site }) => (
  <>
    <div className="tnt__page-h">
      <div>
        <h1>Visibility</h1>
        <div className="sub">Control who can see this site and what visitors land on.</div>
      </div>
    </div>
    <div className="card" style={{ marginBottom: 16 }}>
      <div className="card__head"><h3 className="card__title">Mode</h3></div>
      <div className="card__body" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
        {[
          { k: "Public",     d: "Live and indexed by search engines.", i: "globe", on: site.visibility === "Public" },
          { k: "Private",    d: "Only signed-in workspace members can see this site.", i: "lock", on: site.visibility === "Private" },
          { k: "Coming soon", d: "A launch page appears for visitors; team can preview live content.", i: "rocket", on: false },
        ].map(m => (
          <div key={m.k} style={{
            padding: 14, borderRadius: 10,
            border: "1.5px solid " + (m.on ? "var(--br-primary)" : "var(--br-border)"),
            background: m.on ? "#eff6ff" : "#fff",
            cursor: "pointer", display: "flex", flexDirection: "column", gap: 6,
          }}>
            <div className="row" style={{ gap: 8 }}>
              <Icon name={m.i} size={14} style={{ color: m.on ? "var(--br-primary)" : "var(--br-text-secondary)" }} />
              <strong style={{ fontSize: 13 }}>{m.k}</strong>
              {m.on ? <span className="pill pill--blue" style={{ marginLeft: "auto", fontSize: 10 }}>Current</span> : null}
            </div>
            <span className="muted" style={{ fontSize: 11.5, lineHeight: 1.45 }}>{m.d}</span>
          </div>
        ))}
      </div>
    </div>

    <div className="card" style={{ marginBottom: 16 }}>
      <div className="card__head"><h3 className="card__title">Search engine indexing</h3></div>
      <div className="card__body" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {[
          { l: "Allow search engines to index", on: true, d: "Adds the sitemap.xml and removes robots.txt blocks." },
          { l: "Show in Google Shopping",       on: true, d: "Syncs your product catalog to Google Merchant Center." },
          { l: "Set canonical to custom domain",on: true, d: "Tells search engines northgear.com is the primary URL." },
        ].map((r, i) => (
          <div key={i} className="row between" style={{ padding: "6px 0" }}>
            <div className="col" style={{ gap: 2 }}>
              <span style={{ fontSize: 12.5, fontWeight: 500 }}>{r.l}</span>
              <span className="muted" style={{ fontSize: 11.5 }}>{r.d}</span>
            </div>
            <div className={"tnt__toggle " + (r.on ? "is-on" : "")}></div>
          </div>
        ))}
      </div>
    </div>

    <div className="card">
      <div className="card__head"><h3 className="card__title">Password protection</h3><span className="muted" style={{ fontSize: 11 }}>Add an extra gate above the storefront</span></div>
      <div className="card__body">
        <div className="row" style={{ gap: 12 }}>
          <div className="col" style={{ flex: 1, gap: 5 }}>
            <span className="tnt__field-label">Site password</span>
            <div className="tnt__input">••••••••<span className="tnt__input-suffix">Last rotated 8d ago</span></div>
          </div>
          <div className="col" style={{ gap: 5, width: 180 }}>
            <span className="tnt__field-label">Bypass for IPs</span>
            <div className="tnt__input">3 allowed</div>
          </div>
        </div>
      </div>
    </div>
  </>
);

const Tnt_DNSPanel = ({ site }) => (
  <>
    <div className="tnt__page-h">
      <div>
        <h1>DNS & domains</h1>
        <div className="sub">Connect <span className="mono">{site.customDomain}</span> to <span className="mono">{site.host}</span>.</div>
      </div>
      <div className="row" style={{ gap: 6 }}>
        <button className="btn btn--secondary btn--xs"><Icon name="rotate-cw" size={12} /> Recheck</button>
        <button className="btn btn--secondary btn--xs"><Icon name="download" size={12} /> Export zone</button>
        <button className="btn btn--primary btn--xs"><Icon name="plus" size={12} /> Add record</button>
      </div>
    </div>

    <div className="tnt__banner tnt__banner--ok" style={{ marginBottom: 16 }}>
      <Icon name="shield-check" size={16} />
      <div className="tnt__banner-row">
        <span><b>DNS verified for {site.customDomain}</b><span className="sub"> · SSL issued by Let's Encrypt · auto-renews every 60 days</span></span>
      </div>
      <span className="pill pill--green" style={{ fontSize: 11 }}><span className="dot"></span> Healthy</span>
    </div>

    <div className="card" style={{ marginBottom: 16 }}>
      <div className="card__head">
        <h3 className="card__title">Records for {site.customDomain}</h3>
        <span className="muted" style={{ fontSize: 11 }}>Managed by Cloudflare · last sync 4m ago</span>
      </div>
      <div style={{ overflow: "auto" }}>
        <table className="tnt__dns">
          <thead>
            <tr>
              <th style={{ width: 70 }}>Type</th>
              <th style={{ width: 130 }}>Host</th>
              <th>Value</th>
              <th style={{ width: 60 }}>TTL</th>
              <th style={{ width: 110 }}>Status</th>
              <th style={{ width: 36 }}></th>
            </tr>
          </thead>
          <tbody>
            {[
              { t: "A",     h: "@",      v: "76.76.21.21",                                          ttl: "Auto", ok: "ok"   },
              { t: "A",     h: "@",      v: "76.76.21.22",                                          ttl: "Auto", ok: "ok"   },
              { t: "CNAME", h: "www",    v: "cname.cncpt.app",                                      ttl: "Auto", ok: "ok"   },
              { t: "CNAME", h: "shop",   v: "northgear.cncpt.app",                                  ttl: "Auto", ok: "ok"   },
              { t: "MX",    h: "@",      v: "10 mx1.improvmx.com",                                  ttl: "1h",   ok: "ok"   },
              { t: "MX",    h: "@",      v: "20 mx2.improvmx.com",                                  ttl: "1h",   ok: "ok"   },
              { t: "TXT",   h: "@",      v: "v=spf1 include:_spf.cncpt.app include:improvmx.com ~all", ttl: "1h",   ok: "ok"   },
              { t: "TXT",   h: "_dmarc", v: "v=DMARC1; p=quarantine; rua=mailto:postmaster@northgear.com", ttl: "1h", ok: "ok"   },
              { t: "TXT",   h: "cncpt._domainkey", v: "v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQ…",   ttl: "1h",   ok: "ok"   },
              { t: "TXT",   h: "@",      v: "cncpt-domain-verify=8e3a4b…d7c2",                       ttl: "1h",   ok: "ok"   },
              { t: "CNAME", h: "blog",   v: "atlas-journal.cncpt.app",                              ttl: "Auto", ok: "warn" },
            ].map((r, i) => (
              <tr key={i}>
                <td><span className="tnt__dns-type">{r.t}</span></td>
                <td className="is-label">{r.h}</td>
                <td style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 360 }}>{r.v}</td>
                <td>{r.ttl}</td>
                <td>
                  <span className="row" style={{ gap: 5, fontSize: 11 }}>
                    <span className={"tnt__dot " + (r.ok === "ok" ? "tnt__dot--ok" : "tnt__dot--warn")}></span>
                    {r.ok === "ok" ? "Verified" : "Propagating"}
                  </span>
                </td>
                <td><button className="iconbtn iconbtn--sm iconbtn--ghost"><Icon name="more-horizontal" size={13} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      <div className="card">
        <div className="card__head"><h3 className="card__title">SSL certificate</h3><span className="pill pill--green" style={{ fontSize: 10.5 }}>Active</span></div>
        <div className="card__body" style={{ fontSize: 12, display: "flex", flexDirection: "column", gap: 8 }}>
          <div className="row between"><span className="muted">Issued by</span><span>Let's Encrypt</span></div>
          <div className="row between"><span className="muted">Expires</span><span className="mono">Jul 14, 2026</span></div>
          <div className="row between"><span className="muted">Auto-renew</span><span><span className="tnt__dot tnt__dot--ok"></span> Enabled</span></div>
          <div className="row between"><span className="muted">SANs</span><span>{site.customDomain}, www.{site.customDomain}</span></div>
        </div>
      </div>
      <div className="card">
        <div className="card__head"><h3 className="card__title">Email authentication</h3></div>
        <div className="card__body" style={{ fontSize: 12, display: "flex", flexDirection: "column", gap: 8 }}>
          <div className="row between"><span>SPF</span><span className="pill pill--green" style={{ fontSize: 10.5 }}><span className="dot"></span> Pass</span></div>
          <div className="row between"><span>DKIM</span><span className="pill pill--green" style={{ fontSize: 10.5 }}><span className="dot"></span> Pass</span></div>
          <div className="row between"><span>DMARC</span><span className="pill pill--amber" style={{ fontSize: 10.5 }}><span className="dot"></span> Quarantine</span></div>
          <div className="muted" style={{ fontSize: 11.5, marginTop: 4 }}>Tip: switch DMARC policy to <em>reject</em> once you've verified your sending sources.</div>
        </div>
      </div>
    </div>
  </>
);

const Tnt_BrandingPanel = ({ site }) => (
  <>
    <div className="tnt__page-h">
      <div>
        <h1>Branding</h1>
        <div className="sub">Logo, colors, and typography for <strong>{site.title}</strong>.</div>
      </div>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 16 }}>
      <div className="col" style={{ gap: 16 }}>
        <div className="card">
          <div className="card__head"><h3 className="card__title">Logo</h3></div>
          <div className="card__body" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {[{ l: "Light background", bg: "#fff", fg: site.branding.primary },{ l: "Dark background", bg: "#0f172a", fg: "#fff" }].map(s => (
              <div key={s.l} className="col" style={{ gap: 6 }}>
                <div style={{
                  height: 110, borderRadius: 10, border: "1px dashed var(--br-border)",
                  display: "flex", alignItems: "center", justifyContent: "center", background: s.bg,
                }}>
                  <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.03em", color: s.fg }}>{site.title}</div>
                </div>
                <div className="row between"><span className="muted" style={{ fontSize: 11 }}>{s.l}</span><button className="btn btn--ghost btn--xs"><Icon name="upload" size={11} /> Replace</button></div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card__head"><h3 className="card__title">Colors</h3></div>
          <div className="card__body" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { l: "Primary",    v: site.branding.primary },
              { l: "Accent",     v: site.branding.accent },
              { l: "Background", v: "#FFFFFF" },
              { l: "Text",       v: "#0F172A" },
            ].map(c => (
              <div key={c.l} className="row" style={{ gap: 12 }}>
                <div className="tnt__swatch" style={{ background: c.v }}></div>
                <div className="col" style={{ flex: 1, gap: 1 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 500 }}>{c.l}</span>
                  <span className="mono" style={{ fontSize: 11, color: "var(--br-text-secondary)" }}>{c.v}</span>
                </div>
                <button className="btn btn--ghost btn--xs">Edit</button>
              </div>
            ))}
            <button className="btn btn--secondary btn--xs" style={{ alignSelf: "flex-start" }}><Icon name="sparkles" size={12} /> Generate palette from logo</button>
          </div>
        </div>

        <div className="card">
          <div className="card__head"><h3 className="card__title">Typography</h3></div>
          <div className="card__body" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div className="row between"><span style={{ fontSize: 12 }}>Headings</span><span style={{ fontSize: 12 }}>Inter Display · 700</span></div>
            <div className="row between"><span style={{ fontSize: 12 }}>Body</span><span style={{ fontSize: 12 }}>Inter · 400</span></div>
            <div className="row between"><span style={{ fontSize: 12 }}>Mono</span><span style={{ fontSize: 12 }}>JetBrains Mono · 400</span></div>
            <button className="btn btn--ghost btn--xs" style={{ alignSelf: "flex-start" }}><Icon name="type" size={12} /> Change fonts</button>
          </div>
        </div>
      </div>

      {/* Live preview */}
      <div className="card" style={{ overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div className="card__head"><h3 className="card__title">Preview</h3><div className="row" style={{ gap: 4 }}><button className="iconbtn iconbtn--sm"><Icon name="monitor" size={12} /></button><button className="iconbtn iconbtn--sm iconbtn--ghost"><Icon name="tablet" size={12} /></button><button className="iconbtn iconbtn--sm iconbtn--ghost"><Icon name="smartphone" size={12} /></button></div></div>
        <div style={{ flex: 1, padding: 16, background: "var(--br-surface)" }}>
          <div style={{ background: "#fff", borderRadius: 10, overflow: "hidden", border: "1px solid var(--br-border)", boxShadow: "var(--shadow-sm)" }}>
            <div style={{ height: 28, background: site.branding.primary, display: "flex", alignItems: "center", padding: "0 14px", color: "#fff", fontSize: 12, fontWeight: 600 }}>
              <span>{site.title}</span>
              <span style={{ marginLeft: "auto", display: "flex", gap: 14, fontSize: 11, fontWeight: 400, opacity: 0.85 }}>
                <span>Shop</span><span>Journal</span><span>About</span>
              </span>
            </div>
            <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em", color: site.branding.primary, lineHeight: 1.05 }}>Built for what's next.</div>
              <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.55, maxWidth: 360 }}>
                Northgear gear, made for the long route. Free shipping on orders over $75 through Sunday.
              </div>
              <div className="row" style={{ gap: 8 }}>
                <span style={{ background: site.branding.accent, color: "#fff", padding: "8px 14px", borderRadius: 6, fontSize: 12, fontWeight: 600 }}>Shop the sale</span>
                <span style={{ border: "1px solid var(--br-border)", padding: "8px 14px", borderRadius: 6, fontSize: 12, color: site.branding.primary, fontWeight: 500 }}>Browse all</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginTop: 6 }}>
                {[1,2,3].map(i => (
                  <div key={i} style={{ aspectRatio: "4/5", borderRadius: 6, background: "linear-gradient(135deg, " + site.branding.primary + "22, " + site.branding.accent + "22)" }}></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </>
);

const Tnt_HostingPanel = ({ site }) => (
  <>
    <div className="tnt__page-h">
      <div>
        <h1>Hosting</h1>
        <div className="sub">Deployment, performance, and infrastructure.</div>
      </div>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }}>
      {[
        { l: "Region",        v: "us-east-1",    i: "map-pin" },
        { l: "Edge nodes",    v: "248 PoPs",     i: "radio-tower" },
        { l: "Avg TTFB · 7d", v: "42ms",         i: "gauge" },
        { l: "Uptime · 30d",  v: "99.99%",       i: "activity" },
      ].map(k => (
        <div className="tnt__stat" key={k.l}>
          <div className="tnt__stat-label"><Icon name={k.i} size={12} /> {k.l}</div>
          <div className="tnt__stat-value">{k.v}</div>
        </div>
      ))}
    </div>
    <div className="card" style={{ marginBottom: 16 }}>
      <div className="card__head"><h3 className="card__title">Deployments</h3><button className="btn btn--secondary btn--xs"><Icon name="rocket" size={12} /> Deploy now</button></div>
      <div>
        {[
          { v: "v124", c: "Update homepage hero copy", b: "main",    who: "Jonas", t: "2h ago", s: "Live", ok: true,  ms: "847ms build · 12 routes" },
          { v: "v123", c: "Fix checkout typo",         b: "main",    who: "Maya",  t: "yesterday", s: "Live", ok: true, ms: "812ms build" },
          { v: "v122", c: "Add discount code SUMMER25",b: "main",    who: "Mei",   t: "2d ago", s: "Live", ok: true, ms: "830ms build" },
          { v: "v121", c: "Build failed: missing env",  b: "preview", who: "Tomás", t: "3d ago", s: "Failed", ok: false, ms: "" },
        ].map(d => (
          <div key={d.v} className="row" style={{ padding: "12px 16px", gap: 12, borderBottom: "1px solid var(--br-border)" }}>
            <span className={"tnt__dot " + (d.ok ? "tnt__dot--ok" : "tnt__dot--err")}></span>
            <div className="col" style={{ flex: 1, gap: 2 }}>
              <div className="row" style={{ gap: 6 }}>
                <span className="mono" style={{ fontSize: 11, color: "var(--br-text-secondary)" }}>{d.v}</span>
                <strong style={{ fontSize: 12.5 }}>{d.c}</strong>
                <span className="tag-sm">{d.b}</span>
              </div>
              <span className="muted" style={{ fontSize: 11 }}>{d.who} · {d.t} {d.ms ? <>· <span className="mono">{d.ms}</span></> : null}</span>
            </div>
            <span className={"pill " + (d.ok ? "pill--green" : "pill--rose")} style={{ fontSize: 10.5 }}>{d.s}</span>
            <button className="btn btn--ghost btn--xs">View build</button>
          </div>
        ))}
      </div>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      <div className="card">
        <div className="card__head"><h3 className="card__title">Performance · last 24h</h3></div>
        <div className="card__body">
          <div className="row between" style={{ fontSize: 12, marginBottom: 8 }}><span className="muted">P50 TTFB</span><span><strong>38ms</strong></span></div>
          <div className="row between" style={{ fontSize: 12, marginBottom: 8 }}><span className="muted">P95 TTFB</span><span><strong>112ms</strong></span></div>
          <div className="row between" style={{ fontSize: 12, marginBottom: 8 }}><span className="muted">Cache hit rate</span><span><strong>94.2%</strong></span></div>
          <div className="row between" style={{ fontSize: 12 }}><span className="muted">Errors</span><span><strong style={{ color: "#047857" }}>0.02%</strong></span></div>
        </div>
      </div>
      <div className="card">
        <div className="card__head"><h3 className="card__title">Environment variables</h3><button className="btn btn--ghost btn--xs"><Icon name="plus" size={11} /> Add</button></div>
        <div>
          {[
            { k: "STRIPE_PUBLIC_KEY",   m: "production" },
            { k: "STRIPE_SECRET_KEY",   m: "production" },
            { k: "SHIPPO_API_TOKEN",    m: "all" },
            { k: "NEXT_PUBLIC_SITE_URL", m: "all" },
          ].map(v => (
            <div key={v.k} className="row" style={{ padding: "9px 16px", borderBottom: "1px solid var(--br-border)", gap: 10 }}>
              <span className="mono" style={{ fontSize: 11.5, flex: 1 }}>{v.k}</span>
              <span className="tag-sm">{v.m}</span>
              <button className="iconbtn iconbtn--sm iconbtn--ghost"><Icon name="eye" size={12} /></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  </>
);

const Tnt_DangerZonePanel = ({ site }) => (
  <>
    <div className="tnt__page-h">
      <div>
        <h1>Danger zone</h1>
        <div className="sub">Destructive actions for <strong>{site.title}</strong>. These can't be undone.</div>
      </div>
    </div>
    {[
      { l: "Transfer ownership",         d: "Move this subdomain to another workspace member.", b: "Transfer", danger: false },
      { l: "Reset all branding & content", d: "Clear pages, products, and reset branding to defaults.", b: "Reset", danger: true },
      { l: "Delete this subdomain",       d: "Permanently delete this subdomain and all of its data. Retained for 30 days, then erased.", b: "Delete", danger: true },
    ].map((r, i) => (
      <div key={i} className="card" style={{ marginBottom: 12, borderColor: r.danger ? "#fecaca" : "var(--br-border)" }}>
        <div className="card__body" style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div className="col" style={{ flex: 1, gap: 2 }}>
            <strong style={{ fontSize: 13.5 }}>{r.l}</strong>
            <span className="muted" style={{ fontSize: 11.5 }}>{r.d}</span>
          </div>
          <button className={"btn btn--xs " + (r.danger ? "btn--danger" : "btn--secondary")}>{r.b}</button>
        </div>
      </div>
    ))}
  </>
);

/* ─── Create Subdomain Wizard ─── */
const Tnt_SubdomainCreate = () => (
  <TntBoard>
    <Tnt_Sidebar active="subdomains" />
    <div className="dirH__main">
      <Tnt_Top
        crumbs={["Northgear", "Subdomains", "New"]}
        right={
          <>
            <button className="btn btn--ghost btn--xs">Save draft</button>
            <button className="btn btn--secondary btn--xs">Cancel</button>
            <button className="btn btn--primary btn--xs">Continue <Icon name="arrow-right" size={12} /></button>
          </>
        }
      />
      <div className="dirH__page" style={{ padding: "20px 24px", overflow: "auto" }}>
        <div className="tnt__page-h">
          <div>
            <h1>Create a subdomain</h1>
            <div className="sub">Spin up a new site under your Northgear workspace.</div>
          </div>
          <div className="tnt__steps">
            <span className="tnt__step is-done"><span className="tnt__step-n"><Icon name="check" size={10} /></span> Basics</span>
            <Icon name="chevron-right" size={12} className="tnt__step-arrow" />
            <span className="tnt__step is-on"><span className="tnt__step-n">2</span> Domain & DNS</span>
            <Icon name="chevron-right" size={12} className="tnt__step-arrow" />
            <span className="tnt__step"><span className="tnt__step-n">3</span> Branding</span>
            <Icon name="chevron-right" size={12} className="tnt__step-arrow" />
            <span className="tnt__step"><span className="tnt__step-n">4</span> Team access</span>
            <Icon name="chevron-right" size={12} className="tnt__step-arrow" />
            <span className="tnt__step"><span className="tnt__step-n">5</span> Review</span>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 18 }}>
          <div className="card">
            <div className="card__head"><h3 className="card__title">Domain & DNS</h3><span className="muted" style={{ fontSize: 11 }}>You can change this later</span></div>
            <div className="card__body" style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              <div className="tnt__field">
                <span className="tnt__field-label">Subdomain</span>
                <div className="tnt__input tnt__input--focused">
                  <span style={{ flex: 1 }}>northgear-shop</span>
                  <span className="tnt__input-suffix">.cncpt.app</span>
                </div>
                <span className="tnt__field-hint">Visitors will reach this site at <span className="mono">northgear-shop.cncpt.app</span>.</span>
              </div>

              <div className="tnt__field">
                <span className="tnt__field-label">Custom domain (optional)</span>
                <div className="tnt__input">
                  <span className="tnt__input--placeholder" style={{ flex: 1 }}>shop.northgear.com</span>
                  <span className="pill pill--blue" style={{ fontSize: 10 }}><Icon name="sparkles" size={10} /> AI suggested</span>
                </div>
                <span className="tnt__field-hint">We'll generate the DNS records for you once you click <em>Verify</em>.</span>
              </div>

              <div className="tnt__field">
                <span className="tnt__field-label">DNS records to add to your registrar</span>
                <div className="card" style={{ background: "var(--br-surface)" }}>
                  <table className="tnt__dns">
                    <thead>
                      <tr><th>Type</th><th>Host</th><th>Value</th><th>TTL</th></tr>
                    </thead>
                    <tbody>
                      <tr><td><span className="tnt__dns-type">A</span></td><td className="is-label">shop</td><td>76.76.21.21</td><td>Auto</td></tr>
                      <tr><td><span className="tnt__dns-type">CNAME</span></td><td className="is-label">www.shop</td><td>cname.cncpt.app</td><td>Auto</td></tr>
                      <tr><td><span className="tnt__dns-type">TXT</span></td><td className="is-label">_cncpt-verify</td><td>cncpt-domain-verify=8e3a4b…</td><td>1h</td></tr>
                    </tbody>
                  </table>
                </div>
                <div className="row" style={{ gap: 6, marginTop: 6 }}>
                  <button className="btn btn--secondary btn--xs"><Icon name="copy" size={11} /> Copy records</button>
                  <button className="btn btn--secondary btn--xs"><Icon name="rotate-cw" size={11} /> Verify</button>
                  <span className="row" style={{ gap: 5, fontSize: 11, color: "var(--br-text-secondary)", marginLeft: "auto" }}>
                    <span className="tnt__dot tnt__dot--idle"></span> Waiting for first check
                  </span>
                </div>
              </div>

              <div className="tnt__field">
                <span className="tnt__field-label">Visibility on launch</span>
                <div className="row" style={{ gap: 8 }}>
                  {[
                    { l: "Public",      on: false },
                    { l: "Private",     on: true },
                    { l: "Coming soon", on: false },
                  ].map(o => (
                    <span key={o.l} style={{
                      padding: "5px 11px", fontSize: 12, borderRadius: 6,
                      background: o.on ? "#eff6ff" : "#fff",
                      border: "1px solid " + (o.on ? "var(--br-primary)" : "var(--br-border)"),
                      color: o.on ? "var(--br-primary)" : "var(--br-text)",
                      fontWeight: o.on ? 600 : 500,
                    }}>{o.l}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="col" style={{ gap: 14 }}>
            <div className="tnt__banner tnt__banner--info">
              <Icon name="sparkles" size={16} />
              <div className="tnt__banner-row">
                <span><b>Ask CNCPT for help</b><span className="sub"> · Not sure about DNS? The assistant in the bottom-right will walk you through it, and can copy the records directly into Cloudflare, Namecheap, or GoDaddy for you.</span></span>
              </div>
            </div>
            <div className="card">
              <div className="card__head"><h3 className="card__title">What you'll get</h3></div>
              <div className="card__body">
                {[
                  "Auto-provisioned SSL certificate",
                  "Global CDN with 248 edge nodes",
                  "Automatic SPF, DKIM, and DMARC setup",
                  "Branded transactional emails",
                  "Per-site analytics and uptime alerts",
                ].map((x, i) => (
                  <div key={i} className="row" style={{ padding: "4px 0", gap: 8, fontSize: 12 }}>
                    <Icon name="check" size={12} style={{ color: "#10b981" }} /> {x}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <Tnt_AIDock topic="dns" />
  </TntBoard>
);
