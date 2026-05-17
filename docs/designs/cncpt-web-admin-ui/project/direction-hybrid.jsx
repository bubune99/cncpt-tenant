/* HYBRID — Refined Classic chrome + compact Inbox sidebar + global scrollable Activity rail.
   Feedback supports both Inbox view and Triage Board view (toggle on the page). */

const DirH_Sidebar = ({ active = "users", role = "super" }) => {
  const superNav = [
    { id: "home", label: "Overview", icon: "layout-dashboard" },
    { id: "inbox", label: "Admin Inbox", icon: "inbox", badge: 18, badgeKind: "hot" },
    { h: "Manage", openable: true },
    { id: "users", label: "Users", icon: "users", badge: "12.4k" },
    { id: "teams", label: "Teams", icon: "building-2", badge: "1,072" },
    { id: "tenants", label: "Tenants & Subdomains", icon: "globe" },
    { id: "tiers", label: "Subscription Tiers", icon: "credit-card" },
    { id: "credits", label: "AI Credits", icon: "sparkles" },
    { id: "overrides", label: "Permission Overrides", icon: "wand-2" },
    { h: "Feedback", openable: true },
    { id: "fb-inbox", label: "Inbox", icon: "message-square", badge: 12, badgeKind: "hot" },
    { id: "fb-board", label: "Triage Board", icon: "kanban-square", badge: 6, badgeKind: "blue" },
    { id: "fb-shipped", label: "Shipped", icon: "rocket" },
    { h: "Insights", openable: true },
    { id: "analytics", label: "Analytics", icon: "bar-chart-3" },
    { id: "activity", label: "Activity Log", icon: "history" },
    { h: "Settings" },
    { id: "platform", label: "Platform Settings", icon: "settings" },
  ];
  const tenantNav = [
    { id: "home", label: "Overview", icon: "layout-dashboard" },
    { id: "inbox", label: "Inbox", icon: "inbox", badge: 4, badgeKind: "blue" },
    { h: "Manage" },
    { id: "users", label: "Team Members", icon: "users", badge: 12 },
    { id: "designers", label: "Designers", icon: "palette" },
    { id: "permissions", label: "Permissions", icon: "shield" },
    { id: "credits", label: "Credits & Usage", icon: "sparkles" },
    { h: "Customer Feedback" },
    { id: "fb-inbox", label: "Inbox", icon: "message-square", badge: 4 },
    { id: "fb-board", label: "Triage Board", icon: "kanban-square" },
    { h: "Settings" },
    { id: "branding", label: "Branding", icon: "paint-bucket" },
    { id: "billing", label: "Billing", icon: "credit-card" },
  ];
  const items = role === "super" ? superNav : tenantNav;

  return (
    <aside className="dirH__rail">
      <div className="dirH__brand">
        <div className="dirH__brand-mark"><Icon name="palette" size={14} /></div>
        <div className="col" style={{ gap: 0 }}>
          <div className="dirH__brand-name">CNCPT Admin</div>
        </div>
        <Icon name="chevrons-up-down" size={12} className="dirH__brand-chev" />
      </div>
      <div className="dirH__search">
        <Icon name="search" size={13} />
        <span className="dirH__search-q">Search…</span>
        <span className="kbd">⌘K</span>
      </div>
      <div className="dirH__role-switch">
        <button className={role === "super" ? "is-on" : ""}>Super Admin</button>
        <button className={role === "tenant" ? "is-on" : ""}>Tenant</button>
      </div>
      <nav className="dirH__nav">
        {items.map((it, i) =>
          it.h ? (
            <div className="dirH__nav-h" key={"h" + i}>
              <Icon name="chevron-down" size={11} />
              {it.h}
            </div>
          ) : (
            <button key={it.id} className={"dirH__nav-item " + (active === it.id ? "is-active" : "")}>
              <Icon name={it.icon} size={14} />
              <span>{it.label}</span>
              {it.badge !== undefined ? (
                <span className={"badge " + (it.badgeKind === "hot" ? "is-hot" : it.badgeKind === "blue" ? "is-blue" : "")}>
                  {it.badge}
                </span>
              ) : null}
            </button>
          )
        )}
      </nav>
      <div className="dirH__rail-foot">
        <div className="avatar avatar--sm avatar--orange">SA</div>
        <div className="col">
          <div style={{ fontSize: 12, fontWeight: 500 }}>Sam Ariza</div>
          <div className="muted" style={{ fontSize: 10.5 }}>super admin</div>
        </div>
        <button className="iconbtn iconbtn--sm iconbtn--ghost"><Icon name="more-horizontal" size={13} /></button>
      </div>
    </aside>
  );
};

const DirH_Top = ({ crumbs = [], right }) => (
  <header className="dirH__top">
    <div className="dirH__crumbs">
      {crumbs.map((c, i) => (
        <React.Fragment key={i}>
          <span className={i === crumbs.length - 1 ? "dirH__crumb-active" : "muted"}>{c}</span>
          {i < crumbs.length - 1 ? <Icon name="chevron-right" size={12} /> : null}
        </React.Fragment>
      ))}
    </div>
    <div style={{ flex: 1 }} />
    {right ?? (
      <>
        <button className="iconbtn iconbtn--sm iconbtn--ghost"><Icon name="bell" size={13} /></button>
        <button className="iconbtn iconbtn--sm iconbtn--ghost"><Icon name="life-buoy" size={13} /></button>
      </>
    )}
  </header>
);

/* Persistent right Activity rail — stays across pages */
const DirH_ActivityRail = ({ activeTab = "activity" }) => {
  const tabs = [
    { id: "activity", label: "Activity" },
    { id: "queue", label: "Queue", n: 5 },
    { id: "mentions", label: "Mentions", n: 2 },
  ];
  const events = [
    { t: "just now", who: "Maya Patel", text: "exported gang-sheet 32-tile PDF", icon: "download", c: "#475569", kind: "user" },
    { t: "1m ago", who: "system", text: "new signup · daydream.io", icon: "user-plus", c: "#10b981", kind: "system" },
    { t: "2m ago", who: "Felix K.", text: "tier changed Starter → DTF Pro", who2: "by Sam", icon: "credit-card", c: "#1d4ed8", kind: "user" },
    { t: "8m ago", who: "Aisha B.", text: "credits topped up +5,000", icon: "sparkles", c: "#9333ea", kind: "user" },
    { t: "14m ago", who: "Jonas B.", text: "requested DTF Gang Sheet access", icon: "shield", c: "#a16207", kind: "user", actionable: true },
    { t: "32m ago", who: "Hana Y.", text: "requested DTF Pro permission", icon: "shield", c: "#a16207", kind: "user", actionable: true },
    { t: "1h ago", who: "Diego R.", text: "left feedback · CSAT 1 · billing", icon: "frown", c: "#dc2626", kind: "user" },
    { t: "1h ago", who: "Mei C.", text: "designs exported (bulk · 240)", icon: "download", c: "#475569", kind: "user" },
    { t: "2h ago", who: "system", text: "subdomain craftshop orphaned", icon: "globe", c: "#dc2626", kind: "system", actionable: true },
    { t: "3h ago", who: "Tomás S.", text: "API key revoked", icon: "key", c: "#475569", kind: "user" },
    { t: "5h ago", who: "Owen R.", text: "suspended · policy violation", icon: "ban", c: "#dc2626", kind: "user" },
    { t: "6h ago", who: "Diego R.", text: "credit balance reached 0", icon: "sparkles", c: "#a16207", kind: "system" },
    { t: "1d ago", who: "Priya S.", text: "joined · daydream tenant", icon: "user-plus", c: "#10b981", kind: "user" },
    { t: "1d ago", who: "Aisha B.", text: "invited 2 designers", icon: "user-plus", c: "#10b981", kind: "user" },
    { t: "2d ago", who: "Maya P.", text: "subdomain northgear-dev created", icon: "globe", c: "#a16207", kind: "user" },
  ];
  return (
    <aside className="dirH__rrail">
      <div className="dirH__rrail-h">
        <span className="live-dot" />
        <h3>Live activity</h3>
        <div style={{ flex: 1 }} />
        <button className="iconbtn iconbtn--sm iconbtn--ghost"><Icon name="filter" size={12} /></button>
        <button className="iconbtn iconbtn--sm iconbtn--ghost"><Icon name="panel-right-close" size={12} /></button>
      </div>
      <div className="dirH__rrail-tabs">
        {tabs.map((t) => (
          <button key={t.id} className={t.id === activeTab ? "is-on" : ""}>
            {t.label}{t.n !== undefined ? <span className="muted" style={{ marginLeft: 4, fontVariantNumeric: "tabular-nums" }}>{t.n}</span> : null}
          </button>
        ))}
      </div>
      <div className="dirH__rrail-body">
        <div style={{ position: "relative", padding: "10px 16px 12px 28px" }}>
          <div style={{ position: "absolute", left: 21, top: 14, bottom: 14, width: 1, background: "var(--br-border)" }} />
          {events.map((e, i) => (
            <div key={i} style={{ position: "relative", padding: "7px 0" }}>
              <div style={{
                position: "absolute", left: -13, top: 9,
                width: 11, height: 11, borderRadius: 9999, background: "#fff",
                border: "2px solid " + e.c,
              }} />
              <div style={{ fontSize: 11.5, color: "var(--br-text)", lineHeight: 1.45 }}>
                <strong style={{ fontWeight: 600 }}>{e.who}</strong> <span className="muted">{e.text}</span>
                {e.who2 ? <span className="muted"> · {e.who2}</span> : null}
              </div>
              <div className="row between" style={{ marginTop: 3 }}>
                <span className="muted" style={{ fontSize: 10.5 }}>{e.t}</span>
                {e.actionable ? (
                  <button className="btn btn--ghost btn--xs" style={{ padding: "2px 7px", fontSize: 10.5 }}>
                    Review <Icon name="arrow-right" size={10} />
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};

/* ---------------- H1 — Home / Overview ---------------- */
const DirH_Home = () => (
  <div className="adm-board dirH">
    <DirH_Sidebar active="home" role="super" />
    <div className="dirH__main">
      <DirH_Top crumbs={["Admin", "Overview"]} right={
        <>
          <button className="btn btn--secondary btn--xs"><Icon name="user-plus" size={12} /> Invite</button>
          <button className="iconbtn iconbtn--sm iconbtn--ghost"><Icon name="bell" size={13} /></button>
          <button className="iconbtn iconbtn--sm iconbtn--ghost"><Icon name="life-buoy" size={13} /></button>
        </>
      } />
      <div className="dirH__page" style={{ padding: "18px 20px" }}>
        {/* KPI strip */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }}>
          {[
            { label: "Active users", v: PLATFORM_KPIS.users.v, d: PLATFORM_KPIS.users.d, trend: "up", icon: "users", tone: "blue" },
            { label: "Tenants", v: PLATFORM_KPIS.tenants.v, d: PLATFORM_KPIS.tenants.d, trend: "up", icon: "building-2", tone: "green" },
            { label: "MRR", v: PLATFORM_KPIS.mrr.v, d: PLATFORM_KPIS.mrr.d, trend: "up", icon: "credit-card", tone: "violet" },
            { label: "AI credits / mo", v: PLATFORM_KPIS.credits.v, d: PLATFORM_KPIS.credits.d, trend: "down", icon: "sparkles", tone: "amber" },
          ].map((k) => (
            <div className="card" key={k.label} style={{ padding: 14 }}>
              <div className="row between">
                <span className="muted" style={{ fontSize: 11.5 }}>{k.label}</span>
                <div style={{
                  width: 26, height: 26, borderRadius: 6,
                  background: ({blue:"#dbeafe",green:"#dcfce7",violet:"#ede9fe",amber:"#fef3c7"})[k.tone],
                  color: ({blue:"#1d4ed8",green:"#15803d",violet:"#7e22ce",amber:"#a16207"})[k.tone],
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                }}><Icon name={k.icon} size={13} /></div>
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", marginTop: 6 }}>{k.v}</div>
              <div className={"pill " + (k.trend === "up" ? "pill--green" : "pill--rose")} style={{ marginTop: 6, fontSize: 10.5 }}>
                <Icon name={k.trend === "up" ? "trending-up" : "trending-down"} size={11} /> {k.d}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 14 }}>
          {/* Needs you */}
          <div className="card">
            <div className="card__head">
              <div className="row">
                <h3 className="card__title">Needs you</h3>
                <span className="pill pill--rose" style={{ fontSize: 10.5 }}>{ATTENTION.length}</span>
              </div>
              <button className="btn btn--ghost btn--xs">Open Inbox <Icon name="arrow-right" size={11} /></button>
            </div>
            <div className="card__body card__body--flush">
              {ATTENTION.map((a, i) => (
                <div key={i} style={{
                  display: "grid", gridTemplateColumns: "26px 1fr auto",
                  alignItems: "center", gap: 10,
                  padding: "10px 16px",
                  borderBottom: i < ATTENTION.length - 1 ? "1px solid var(--br-border)" : "0",
                }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: 6,
                    background: ({request:"#fef3c7",feedback:"#dbeafe",subdomain:"#fee2e2",credits:"#fef3c7",tier:"#ede9fe"})[a.kind],
                    color: ({request:"#a16207",feedback:"#1d4ed8",subdomain:"#b91c1c",credits:"#a16207",tier:"#7e22ce"})[a.kind],
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                  }}><Icon name={({request:"shield",feedback:"message-square",subdomain:"globe",credits:"sparkles",tier:"crown"})[a.kind]} size={12} /></div>
                  <div className="col" style={{ gap: 1 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 500 }}>
                      {a.label}
                      {a.who ? <span className="muted" style={{ fontWeight: 400 }}> · {a.who.name}</span> : null}
                    </div>
                    <div className="muted" style={{ fontSize: 11.5 }}>{a.detail}</div>
                  </div>
                  <div className="row" style={{ gap: 6 }}>
                    <span className="muted" style={{ fontSize: 11 }}>{a.time}</span>
                    <button className="btn btn--secondary btn--xs">Resolve</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick actions */}
          <div className="card">
            <div className="card__head"><h3 className="card__title">Quick actions</h3></div>
            <div className="card__body" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[
                { i: "user-plus", l: "Invite user" },
                { i: "shield", l: "Grant permission" },
                { i: "crown", l: "Change tier" },
                { i: "sparkles", l: "Top up credits" },
                { i: "globe", l: "Reassign subdomain" },
                { i: "message-square", l: "Reply to feedback" },
              ].map((a) => (
                <button key={a.l} className="btn btn--secondary" style={{ justifyContent: "flex-start", padding: "9px 11px" }}>
                  <Icon name={a.i} size={13} /> {a.l}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Feedback pulse */}
        <div className="card" style={{ marginTop: 14 }}>
          <div className="card__head">
            <div className="row">
              <h3 className="card__title">Feedback pulse · 7d</h3>
              <span className="muted" style={{ fontSize: 11.5 }}>NPS 47 · CSAT 3.8 · avg response 4.2h</span>
            </div>
            <button className="btn btn--ghost btn--xs">Open Triage <Icon name="arrow-right" size={11} /></button>
          </div>
          <div className="card__body" style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8 }}>
            {[
              { l: "Bugs", n: 38, t: "neg", pct: 86 },
              { l: "Performance", n: 14, t: "neg", pct: 72 },
              { l: "Billing", n: 9, t: "neg", pct: 88 },
              { l: "Designer UX", n: 22, t: "mix", pct: 55 },
              { l: "Praise", n: 18, t: "pos", pct: 12 },
              { l: "Feature reqs", n: 23, t: "neu", pct: 34 },
            ].map((c) => (
              <div key={c.l} style={{ background: "var(--br-surface)", border: "1px solid var(--br-border)", borderRadius: 7, padding: 10 }}>
                <div className="row between">
                  <span style={{ fontSize: 11.5, fontWeight: 500 }}>{c.l}</span>
                  <span className="muted mono" style={{ fontSize: 11 }}>{c.n}</span>
                </div>
                <div style={{ height: 4, marginTop: 7, background: "#e2e8f0", borderRadius: 9999, overflow: "hidden" }}>
                  <div style={{ width: c.pct + "%", height: "100%", background: c.t === "neg" ? "#ef4444" : c.t === "pos" ? "#10b981" : c.t === "mix" ? "#a855f7" : "#94a3b8" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
    <DirH_ActivityRail />
  </div>
);

/* ---------------- H2 — Users (compact rows + spacious filter bar) ---------------- */
const DirH_Users = () => {
  const selected = new Set(["u_002", "u_004", "u_007", "u_009"]);
  return (
    <div className="adm-board dirH">
      <DirH_Sidebar active="users" role="super" />
      <div className="dirH__main">
        <DirH_Top crumbs={["Admin", "Users"]} right={
          <>
            <button className="btn btn--secondary btn--xs"><Icon name="download" size={12} /> Export</button>
            <button className="btn btn--primary btn--xs"><Icon name="user-plus" size={12} /> Invite user</button>
          </>
        } />

        {/* Page header */}
        <div style={{ padding: "16px 20px 0", background: "#fff", borderBottom: "1px solid var(--br-border)", flexShrink: 0 }}>
          <div className="row between" style={{ alignItems: "flex-end", marginBottom: 14 }}>
            <div className="col" style={{ gap: 2 }}>
              <h2 style={{ margin: 0, fontSize: 19, fontWeight: 700, letterSpacing: "-0.01em" }}>Users</h2>
              <p className="muted" style={{ margin: 0, fontSize: 12.5 }}>12,408 total · 11,902 active · 184 new in 30d</p>
            </div>
          </div>
          {/* Spacious filter bar */}
          <div className="row" style={{ gap: 8, paddingBottom: 14, flexWrap: "wrap" }}>
            <div className="row" style={{
              background: "var(--br-surface)", border: "1px solid var(--br-border)",
              borderRadius: 7, padding: "6px 10px", minWidth: 280, gap: 6,
            }}>
              <Icon name="search" size={13} style={{ color: "var(--br-text-secondary)" }} />
              <span style={{ fontSize: 12.5, color: "var(--br-text-secondary)" }}>Search by name, email, tenant…</span>
            </div>
            <button className="btn btn--secondary btn--xs"><Icon name="users" size={12} /> Role: any <Icon name="chevron-down" size={11} /></button>
            <button className="btn btn--secondary btn--xs"><Icon name="crown" size={12} /> Tier: any <Icon name="chevron-down" size={11} /></button>
            <button className="btn btn--secondary btn--xs"><Icon name="activity" size={12} /> Status: any <Icon name="chevron-down" size={11} /></button>
            <button className="btn btn--secondary btn--xs"><Icon name="building-2" size={12} /> Tenant: any <Icon name="chevron-down" size={11} /></button>
            <button className="btn btn--secondary btn--xs"><Icon name="clock" size={12} /> Last active: any <Icon name="chevron-down" size={11} /></button>
            <button className="btn btn--secondary btn--xs"><Icon name="sparkles" size={12} /> Credits: any <Icon name="chevron-down" size={11} /></button>
            <button className="btn btn--ghost btn--xs"><Icon name="plus" size={11} /> Add filter</button>
            <div style={{ flex: 1 }} />
            <button className="btn btn--ghost btn--xs"><Icon name="bookmark" size={12} /> Saved views <Icon name="chevron-down" size={11} /></button>
            <button className="btn btn--ghost btn--xs"><Icon name="sliders-horizontal" size={12} /> Columns</button>
          </div>
        </div>

        {/* Active filter chips strip */}
        <div className="row" style={{
          padding: "8px 20px", gap: 6,
          background: "var(--br-surface)", borderBottom: "1px solid var(--br-border)",
          flexShrink: 0, fontSize: 11.5,
        }}>
          <span className="muted" style={{ fontWeight: 500 }}>Active filters:</span>
          {[
            { l: "Tier", v: "Starter", c: "#1d4ed8" },
            { l: "Last active", v: "> 7 days", c: "#7e22ce" },
            { l: "Status", v: "active", c: "#15803d" },
          ].map((c) => (
            <span key={c.l} style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              background: "#fff", border: "1px solid var(--br-border)",
              borderRadius: 5, padding: "2px 6px 2px 8px",
            }}>
              <span style={{ width: 6, height: 6, borderRadius: 9999, background: c.c }} />
              <span className="muted">{c.l}:</span>
              <strong style={{ fontWeight: 600 }}>{c.v}</strong>
              <Icon name="x" size={11} style={{ color: "#94a3b8" }} />
            </span>
          ))}
          <button className="btn btn--ghost btn--xs">Clear all</button>
          <div style={{ flex: 1 }} />
          <span className="muted">Showing 1–18 of <strong style={{ color: "var(--br-text)" }}>74</strong> matches</span>
        </div>

        {/* Compact table */}
        <div style={{ flex: 1, overflow: "auto", background: "#fff", paddingBottom: 80 }}>
          <table className="dirH-table">
            <thead>
              <tr>
                {["", "User", "Tenant", "Role", "Tier", "Credits", "Status", "Last active", ""].map((h, i) => (
                  <th key={i}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {USERS.concat(USERS.slice(0, 6).map((u, i) => ({ ...u, id: u.id + "_b" + i }))).map((u) => {
                const sel = selected.has(u.id);
                return (
                  <tr key={u.id} className={sel ? "is-selected" : ""}>
                    <td style={{ width: 32 }}>
                      <span style={{
                        width: 14, height: 14, borderRadius: 3,
                        border: "1.5px solid " + (sel ? "var(--br-primary)" : "#cbd5e1"),
                        background: sel ? "var(--br-primary)" : "#fff",
                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                      }}>{sel ? <Icon name="check" size={10} style={{ color: "#fff" }} /> : null}</span>
                    </td>
                    <td>
                      <div className="row" style={{ gap: 8 }}>
                        <div className={"avatar avatar--xs avatar--" + u.avatarKind}>{initials(u.name)}</div>
                        <div className="col" style={{ gap: 0 }}>
                          <div style={{ fontWeight: 500 }}>{u.name}</div>
                          <div className="muted" style={{ fontSize: 10.5 }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="mono" style={{ fontSize: 11.5 }}>{u.tenant}</td>
                    <td>{u.role}</td>
                    <td>
                      <span className={"pill " + (u.tier === "DTF Pro" ? "pill--violet" : u.tier === "Business" ? "pill--blue" : "")} style={{ fontSize: 10.5 }}>{u.tier}</span>
                    </td>
                    <td style={{ fontVariantNumeric: "tabular-nums" }}>{u.credits.toLocaleString()}</td>
                    <td>
                      <span className={"pill " + (u.status === "active" ? "pill--green" : u.status === "suspended" ? "pill--rose" : "pill--slate")} style={{ fontSize: 10.5 }}>
                        <span className="dot" />{u.status}
                      </span>
                    </td>
                    <td className="muted">{u.lastActive}</td>
                    <td><button className="iconbtn iconbtn--sm iconbtn--ghost"><Icon name="more-horizontal" size={12} /></button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Sticky bulk action bar */}
        <div style={{
          position: "absolute", bottom: 18, left: "calc(50% - 152px)", transform: "translateX(-50%)",
          background: "#0f172a", color: "#fff", borderRadius: 12,
          padding: "8px 8px 8px 14px", display: "flex", alignItems: "center", gap: 6,
          boxShadow: "0 12px 28px -6px rgba(15,23,42,0.4), 0 8px 16px -8px rgba(15,23,42,0.4)",
          minWidth: 760,
        }}>
          <span style={{ fontSize: 12.5, fontWeight: 500 }}>
            <span style={{
              background: "#1d4ed8", padding: "1.5px 7px", borderRadius: 9999, marginRight: 8,
              fontVariantNumeric: "tabular-nums",
            }}>4</span>selected
          </span>
          <span style={{ opacity: 0.4 }}>·</span>
          {[
            { i: "shield", l: "Grant permission" },
            { i: "crown", l: "Change tier" },
            { i: "sparkles", l: "Top up credits" },
            { i: "mail", l: "Email" },
            { i: "tag", l: "Add tag" },
            { i: "ban", l: "Suspend" },
          ].map((a) => (
            <button key={a.l} className="btn btn--xs" style={{ background: "rgba(255,255,255,0.08)", color: "#fff", borderColor: "transparent" }}>
              <Icon name={a.i} size={12} /> {a.l}
            </button>
          ))}
          <span style={{ opacity: 0.4, marginLeft: 4 }}>·</span>
          <button className="btn btn--xs" style={{ background: "transparent", color: "#94a3b8" }}>Clear</button>
        </div>
      </div>
      <DirH_ActivityRail />
    </div>
  );
};

/* ---------------- H3 — User Detail (Permissions tab) ---------------- */
const DirH_UserDetail = () => {
  const u = USERS[0];
  return (
    <div className="adm-board dirH">
      <DirH_Sidebar active="users" role="super" />
      <div className="dirH__main">
        <DirH_Top crumbs={["Admin", "Users", u.name]} right={
          <>
            <span className="kbd">J</span><span className="muted" style={{ fontSize: 11 }}>prev</span>
            <span className="kbd">K</span><span className="muted" style={{ fontSize: 11 }}>next</span>
            <span className="muted" style={{ fontSize: 11 }}> · </span>
            <button className="btn btn--secondary btn--xs"><Icon name="mail" size={12} /> Email</button>
            <button className="btn btn--secondary btn--xs"><Icon name="log-in" size={12} /> Impersonate</button>
            <button className="btn btn--secondary btn--xs"><Icon name="more-horizontal" size={12} /></button>
          </>
        } />

        <div className="dirH__page" style={{ padding: "16px 20px" }}>
          {/* Profile header card */}
          <div className="card" style={{ marginBottom: 14 }}>
            <div style={{ padding: "16px 18px", display: "flex", gap: 14 }}>
              <div className={"avatar avatar--lg avatar--" + u.avatarKind}>{initials(u.name)}</div>
              <div className="col" style={{ gap: 4, flex: 1 }}>
                <div className="row" style={{ gap: 7 }}>
                  <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, letterSpacing: "-0.01em" }}>{u.name}</h2>
                  <span className="pill pill--green" style={{ fontSize: 10.5 }}><span className="dot" /> Active</span>
                  <span className="pill pill--violet" style={{ fontSize: 10.5 }}><Icon name="crown" size={11} /> {u.tier}</span>
                  <span className="pill" style={{ fontSize: 10.5 }}><Icon name="building-2" size={11} /> {u.tenant}</span>
                  <span className="pill" style={{ fontSize: 10.5 }}><Icon name="user-circle" size={11} /> {u.role}</span>
                </div>
                <div className="muted" style={{ fontSize: 12 }}>{u.email} · joined {u.joined} · last active {u.lastActive}</div>
              </div>
              <div className="col" style={{ gap: 4, alignItems: "flex-end" }}>
                <div className="row" style={{ gap: 14, fontSize: 11.5 }}>
                  <span><strong style={{ fontWeight: 600, fontSize: 14 }}>2,418</strong> <span className="muted">designs</span></span>
                  <span><strong style={{ fontWeight: 600, fontSize: 14 }}>$2.1k</strong> <span className="muted">LTV</span></span>
                  <span><strong style={{ fontWeight: 600, fontSize: 14 }}>118k</strong> <span className="muted">API/mo</span></span>
                </div>
                <div className="row" style={{ gap: 5, marginTop: 2 }}>
                  <button className="btn btn--secondary btn--xs"><Icon name="key-round" size={12} /> Reset pwd</button>
                  <button className="btn btn--danger btn--xs"><Icon name="ban" size={12} /> Suspend</button>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", padding: "0 6px", borderTop: "1px solid var(--br-border)" }}>
              {["Overview","Permissions","Subdomains","AI Credits","Activity","Notes"].map((t, i) => (
                <button key={t} style={{
                  border: 0, background: "transparent",
                  padding: "9px 14px", fontSize: 12.5, fontWeight: 500,
                  color: i === 1 ? "var(--br-primary)" : "var(--br-text-secondary)",
                  borderBottom: i === 1 ? "2px solid var(--br-primary)" : "2px solid transparent",
                  marginBottom: -1, cursor: "pointer", fontFamily: "inherit",
                }}>{t}</button>
              ))}
            </div>
          </div>

          {/* Permissions content */}
          <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 14 }}>
            <div className="card">
              <div className="card__head">
                <div className="col" style={{ gap: 2 }}>
                  <h3 className="card__title">Permissions</h3>
                  <p className="card__sub">Inherited from <strong>DTF Pro</strong> tier · explicit overrides marked with orange</p>
                </div>
                <div className="row" style={{ gap: 5 }}>
                  <button className="btn btn--secondary btn--xs"><Icon name="copy" size={12} /> Clone from…</button>
                  <button className="btn btn--primary btn--xs"><Icon name="plus" size={12} /> Add override</button>
                </div>
              </div>
              <div className="card__body card__body--flush">
                {["Designer","Billing","Team","API","Admin"].map((g) => {
                  const rows = PERMISSIONS.filter((p) => p.group === g);
                  return (
                    <div key={g}>
                      <div style={{
                        padding: "7px 16px", background: "var(--br-surface)",
                        fontSize: 10.5, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase",
                        color: "var(--br-text-secondary)",
                      }}>{g}</div>
                      {rows.map((p, i) => (
                        <div key={p.key} className="row between" style={{
                          padding: "9px 16px",
                          borderBottom: "1px solid var(--br-border)",
                        }}>
                          <div className="col" style={{ gap: 1 }}>
                            <div className="row" style={{ gap: 6, fontSize: 12.5 }}>
                              <span>{p.label}</span>
                              {p.scope === "override" ? <span className="pill pill--amber" style={{ fontSize: 10 }}>override</span> : null}
                            </div>
                            <span className="muted mono" style={{ fontSize: 10.5 }}>{p.key}</span>
                          </div>
                          <div className="row" style={{ gap: 8 }}>
                            <span className="muted" style={{ fontSize: 10.5 }}>{p.scope === "override" ? "explicit" : "from " + p.scope}</span>
                            <span style={{
                              width: 28, height: 16, borderRadius: 9999,
                              background: p.on ? "var(--br-primary)" : "#cbd5e1",
                              position: "relative", display: "inline-block",
                            }}>
                              <span style={{ position: "absolute", top: 2, left: p.on ? 14 : 2, width: 12, height: 12, borderRadius: 9999, background: "#fff" }} />
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="col" style={{ gap: 14 }}>
              <div className="card">
                <div className="card__head"><h3 className="card__title">AI Credits</h3><button className="btn btn--ghost btn--xs">Adjust <Icon name="arrow-right" size={11} /></button></div>
                <div className="card__body" style={{ paddingTop: 6 }}>
                  <div style={{ fontSize: 24, fontWeight: 700 }}>{u.credits.toLocaleString()} <span className="muted" style={{ fontSize: 12, fontWeight: 400 }}>credits</span></div>
                  <div style={{ height: 6, borderRadius: 9999, background: "#f1f5f9", overflow: "hidden", marginTop: 8 }}>
                    <div style={{ width: "62%", height: "100%", background: "var(--gr-blue-purple)" }} />
                  </div>
                  <div className="row between muted" style={{ fontSize: 11, marginTop: 5 }}>
                    <span>5,200 used this cycle</span><span>Resets Jun 1</span>
                  </div>
                </div>
              </div>
              <div className="card">
                <div className="card__head"><h3 className="card__title">Subdomains owned</h3><span className="muted" style={{ fontSize: 11.5 }}>2</span></div>
                <div className="card__body card__body--flush">
                  {[
                    { sub: "northgear", teams: 2, traffic: "12.4k/mo" },
                    { sub: "northgear-dev", teams: 1, traffic: "—" },
                  ].map((s) => (
                    <div key={s.sub} className="row between" style={{ padding: "10px 16px", borderBottom: "1px solid var(--br-border)" }}>
                      <div className="col" style={{ gap: 1 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 500 }}>{s.sub}.cncpt-designer.com</div>
                        <div className="muted" style={{ fontSize: 11 }}>{s.teams} teams · {s.traffic}</div>
                      </div>
                      <button className="btn btn--ghost btn--xs">Manage <Icon name="arrow-right" size={11} /></button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="card">
                <div className="card__head">
                  <h3 className="card__title">Recent feedback</h3>
                  <span className="pill pill--rose" style={{ fontSize: 10 }}>1 open</span>
                </div>
                <div className="card__body" style={{ paddingTop: 6 }}>
                  <div style={{ fontSize: 12 }}>
                    <strong style={{ fontWeight: 600 }}>DTF gang sheet export</strong> <span className="muted">· 12m ago</span>
                  </div>
                  <p className="muted" style={{ fontSize: 11.5, margin: "5px 0 0", lineHeight: 1.4 }}>
                    Gang sheet PDF download fails when more than 40 tiles are placed — have to retry 3 times.
                  </p>
                  <div className="row" style={{ gap: 5, marginTop: 8 }}>
                    <span className="pill pill--rose" style={{ fontSize: 10 }}>CSAT 2</span>
                    <span className="pill" style={{ fontSize: 10 }}>in-progress</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <DirH_ActivityRail />
    </div>
  );
};

/* ---------------- H4 — Feedback (with view toggle: Inbox vs Board) ---------------- */
const DirH_Feedback = ({ view = "inbox" }) => {
  const f = FEEDBACK[3];

  const InboxView = () => (
    <div className="dirH__page" style={{ display: "grid", gridTemplateColumns: "1fr 1.15fr", padding: 0 }}>
      {/* Left list */}
      <div style={{ borderRight: "1px solid var(--br-border)", display: "flex", flexDirection: "column", minWidth: 0, background: "#fff" }}>
        <div className="row" style={{ padding: "0 14px", borderBottom: "1px solid var(--br-border)", background: "#fff" }}>
          {[
            { l: "All", n: 124 },
            { l: "New", n: 12, on: true },
            { l: "Triaged", n: 8 },
            { l: "In progress", n: 6 },
            { l: "Mine", n: 4 },
          ].map((t) => (
            <button key={t.l} style={{
              border: 0, background: "transparent",
              padding: "10px 12px", fontSize: 12, fontWeight: 500,
              color: t.on ? "var(--br-primary)" : "var(--br-text-secondary)",
              borderBottom: t.on ? "2px solid var(--br-primary)" : "2px solid transparent",
              marginBottom: -1, cursor: "pointer", fontFamily: "inherit",
            }}>{t.l} <span className="muted" style={{ fontSize: 11 }}>{t.n}</span></button>
          ))}
          <div style={{ flex: 1 }} />
          <button className="btn btn--ghost btn--xs"><Icon name="filter" size={12} /> Filters</button>
        </div>
        <div style={{ overflow: "auto", flex: 1 }}>
          {FEEDBACK.map((it) => {
            const active = it.id === f.id;
            return (
              <div key={it.id} style={{
                padding: "11px 14px",
                borderBottom: "1px solid var(--br-border)",
                background: active ? "#eff6ff" : "transparent",
                borderLeft: active ? "3px solid var(--br-primary)" : "3px solid transparent",
              }}>
                <div className="row between">
                  <div className="row" style={{ gap: 8 }}>
                    <div className={"avatar avatar--xs avatar--" + it.from.avatarKind}>{initials(it.from.name)}</div>
                    <div className="col" style={{ gap: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{it.from.name} <span className="muted" style={{ fontWeight: 400 }}>· {it.from.tenant}</span></div>
                      <div style={{ fontSize: 12, fontWeight: 500 }}>{it.topic}</div>
                    </div>
                  </div>
                  <div className="col" style={{ alignItems: "flex-end", gap: 3 }}>
                    <span className="muted" style={{ fontSize: 10.5 }}>{it.time}</span>
                    <div className="row" style={{ gap: 4 }}>
                      {it.priority === "high" ? <span className="pill pill--rose" style={{ fontSize: 10 }}><Icon name="alert-triangle" size={10} /> high</span> : null}
                      <span className={"pill " + ({ negative: "pill--rose", positive: "pill--green", neutral: "pill--slate" })[it.sentiment]} style={{ fontSize: 10 }}>
                        <Icon name={it.sentiment === "positive" ? "smile" : it.sentiment === "negative" ? "frown" : "meh"} size={10} />
                        CSAT {it.csat}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="muted" style={{
                  fontSize: 11.5, marginTop: 5, lineHeight: 1.45,
                  display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                }}>{it.excerpt}</div>
                <div className="row" style={{ gap: 4, marginTop: 6 }}>
                  {it.tags.map((t) => <span key={t} className="tag-sm">#{t}</span>)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {/* Detail */}
      <div style={{ overflow: "auto", background: "var(--br-surface)" }}>
        <div style={{ padding: "16px 20px 0" }}>
          <div className="row" style={{ gap: 6, marginBottom: 4 }}>
            <span className="muted mono" style={{ fontSize: 11 }}>FB-{f.id.replace("f_","")}</span>
            <span className="pill pill--rose" style={{ fontSize: 10.5 }}><Icon name="alert-triangle" size={11} /> High</span>
            <span className="pill pill--blue" style={{ fontSize: 10.5 }}>in-progress · v2.41</span>
          </div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, letterSpacing: "-0.01em" }}>{f.topic}</h2>

          <div className="row" style={{ gap: 14, marginTop: 12, marginBottom: 14 }}>
            {[
              { l: "Sentiment", v: "Negative", c: "pill--rose", i: "frown" },
              { l: "CSAT", v: f.csat + "/5", c: "pill--rose", i: "star" },
              { l: "NPS", v: f.nps, c: "pill--rose", i: "gauge" },
              { l: "Channel", v: f.channel, c: "pill--slate", i: "inbox" },
              { l: "Replies", v: f.replies, c: "pill--slate", i: "message-circle" },
            ].map((m) => (
              <div key={m.l} className="col" style={{ gap: 3 }}>
                <span className="eyebrow">{m.l}</span>
                <span className={"pill " + m.c} style={{ alignSelf: "flex-start", fontSize: 11 }}>
                  <Icon name={m.i} size={11} /> {m.v}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ padding: "0 20px 18px" }}>
          <div className="card" style={{ marginBottom: 12 }}>
            <div style={{ padding: 14, display: "flex", gap: 12 }}>
              <div className={"avatar avatar--lg avatar--" + f.from.avatarKind}>{initials(f.from.name)}</div>
              <div className="col" style={{ gap: 3, flex: 1 }}>
                <div className="row" style={{ gap: 6 }}>
                  <strong style={{ fontSize: 13.5 }}>{f.from.name}</strong>
                  <span className="pill pill--violet" style={{ fontSize: 10.5 }}><Icon name="crown" size={10} /> {f.from.tier}</span>
                  <span className="pill" style={{ fontSize: 10.5 }}><Icon name="building-2" size={10} /> {f.from.tenant}</span>
                </div>
                <div className="muted" style={{ fontSize: 11.5 }}>{f.from.email}</div>
                <div className="row" style={{ gap: 14, marginTop: 3, fontSize: 11.5 }}>
                  <span><strong>2.4k</strong> <span className="muted">designs</span></span>
                  <span><strong>$2,180</strong> <span className="muted">LTV</span></span>
                  <span><strong>14 mo</strong> <span className="muted">tenure</span></span>
                </div>
              </div>
              <button className="btn btn--secondary btn--xs"><Icon name="arrow-up-right" size={11} /> Open profile</button>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 12 }}>
            <div className="card__body" style={{ padding: 16, fontSize: 13, lineHeight: 1.6 }}>
              <p style={{ margin: 0 }}>{f.excerpt}</p>
              <p style={{ margin: "10px 0 0", color: "var(--br-text-secondary)" }}>
                We're a $1.2M Shopify store and our weekend traffic spikes regularly hit the limit.
                Can we get a higher rate-limit tier, or at least exponential backoff in the webhook queue?
              </p>
              <div className="row" style={{ gap: 5, marginTop: 12 }}>
                {f.tags.map((t) => <span key={t} className="tag-sm">#{t}</span>)}
              </div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 12 }}>
            <div className="card__head"><h3 className="card__title">Triage</h3></div>
            <div className="card__body" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                { l: "Status", v: "In progress" }, { l: "Priority", v: "High" },
                { l: "Assignee", v: "Eng · Webhooks" }, { l: "Ship", v: "v2.41 · Jun 4" },
                { l: "Linked ticket", v: "WH-218" }, { l: "Affected", v: "14 tenants" },
              ].map((m) => (
                <div key={m.l} className="row between" style={{ padding: "5px 0", fontSize: 12, borderBottom: "1px solid var(--br-border)" }}>
                  <span className="muted">{m.l}</span><span>{m.v}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card__head">
              <h3 className="card__title">Reply</h3>
              <div className="row" style={{ gap: 5 }}>
                <button className="btn btn--ghost btn--xs"><Icon name="sparkles" size={12} /> Draft with AI</button>
                <button className="btn btn--ghost btn--xs"><Icon name="files" size={12} /> Templates</button>
              </div>
            </div>
            <div style={{ padding: 14, fontSize: 12.5, color: "var(--br-text-secondary)", lineHeight: 1.55 }}>
              Hi Tomás — thanks for the detail. We've prioritized this for the v2.41 release (Jun 4)
              and bumped your tenant to the 200/min tier in the meantime…
            </div>
            <div className="row between" style={{ padding: "8px 14px", borderTop: "1px solid var(--br-border)" }}>
              <div className="row" style={{ gap: 4 }}>
                <button className="iconbtn iconbtn--sm iconbtn--ghost"><Icon name="paperclip" size={12} /></button>
                <button className="iconbtn iconbtn--sm iconbtn--ghost"><Icon name="image" size={12} /></button>
              </div>
              <div className="row" style={{ gap: 6 }}>
                <button className="btn btn--secondary btn--xs">Save draft</button>
                <button className="btn btn--primary btn--xs"><Icon name="send" size={11} /> Send & resolve</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const BoardView = () => {
    const cols = [
      { id: "new", title: "New", color: "#94a3b8", count: 12, items: FEEDBACK.filter(x => x.status === "new") },
      { id: "triaged", title: "Triaged", color: "#3b82f6", count: 8, items: FEEDBACK.filter(x => x.status === "triaged") },
      { id: "in_progress", title: "In progress", color: "#a855f7", count: 6, items: FEEDBACK.filter(x => x.status === "in-progress") },
      { id: "shipped", title: "Shipped", color: "#10b981", count: 32, items: FEEDBACK.filter(x => x.status === "shipped") },
    ];
    return (
      <div style={{ overflow: "auto", padding: 14, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, background: "var(--br-surface)", flex: 1, minHeight: 0 }}>
        {cols.map((col) => (
          <div key={col.id} style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
            <div className="row between" style={{ padding: "0 4px" }}>
              <div className="row" style={{ gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: 9999, background: col.color }} />
                <span style={{ fontSize: 12.5, fontWeight: 600 }}>{col.title}</span>
                <span className="muted mono" style={{ fontSize: 11 }}>{col.count}</span>
              </div>
              <button className="iconbtn iconbtn--sm iconbtn--ghost"><Icon name="plus" size={12} /></button>
            </div>
            <div className="col" style={{ gap: 8 }}>
              {col.items.map((it) => (
                <div key={it.id} style={{
                  background: "#fff", border: "1px solid var(--br-border)", borderRadius: 8, padding: 10,
                  display: "flex", flexDirection: "column", gap: 6,
                }}>
                  <div className="row between">
                    <span className="muted mono" style={{ fontSize: 10.5 }}>FB-{it.id.replace("f_","")}</span>
                    <span style={{
                      width: 8, height: 8, borderRadius: 9999,
                      background: it.priority === "high" ? "#ef4444" : it.priority === "med" ? "#f59e0b" : "#a1a1aa",
                    }} />
                  </div>
                  <div style={{ fontSize: 12.5, fontWeight: 500, lineHeight: 1.3 }}>{it.topic}</div>
                  <div className="muted" style={{ fontSize: 11, lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{it.excerpt}</div>
                  <div className="row between" style={{ marginTop: 2 }}>
                    <div className="row" style={{ gap: 4 }}>
                      <div className={"avatar avatar--xs avatar--" + it.from.avatarKind}>{initials(it.from.name)}</div>
                      <span className="muted" style={{ fontSize: 10.5 }}>{it.from.tenant}</span>
                    </div>
                    <span className={"pill " + ({ negative: "pill--rose", positive: "pill--green", neutral: "pill--slate" })[it.sentiment]} style={{ fontSize: 10 }}>
                      <Icon name={it.sentiment === "positive" ? "smile" : it.sentiment === "negative" ? "frown" : "meh"} size={9} />
                      {it.csat}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="adm-board dirH">
      <DirH_Sidebar active={view === "board" ? "fb-board" : "fb-inbox"} role="super" />
      <div className="dirH__main">
        <DirH_Top crumbs={["Admin", "Feedback", view === "board" ? "Triage Board" : "Inbox"]} right={
          <>
            <div className="row" style={{ gap: 8, marginRight: 4 }}>
              <span className="muted" style={{ fontSize: 11 }}>NPS</span><span style={{ fontWeight: 600, fontSize: 12 }}>47</span>
              <span className="muted" style={{ fontSize: 11 }}>CSAT</span><span style={{ fontWeight: 600, fontSize: 12 }}>3.8</span>
              <span className="muted" style={{ fontSize: 11 }}>Resp.</span><span style={{ fontWeight: 600, fontSize: 12 }}>4.2h</span>
            </div>
            {/* View toggle */}
            <div style={{
              display: "flex", background: "var(--br-surface)", border: "1px solid var(--br-border)",
              borderRadius: 6, padding: 2, gap: 2,
            }}>
              <button style={{
                border: 0, padding: "4px 10px", borderRadius: 4, fontSize: 11.5, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
                background: view === "inbox" ? "#fff" : "transparent",
                color: view === "inbox" ? "var(--br-text)" : "var(--br-text-secondary)",
                boxShadow: view === "inbox" ? "var(--shadow-sm)" : "none",
                display: "inline-flex", alignItems: "center", gap: 5,
              }}><Icon name="inbox" size={11} /> Inbox</button>
              <button style={{
                border: 0, padding: "4px 10px", borderRadius: 4, fontSize: 11.5, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
                background: view === "board" ? "#fff" : "transparent",
                color: view === "board" ? "var(--br-text)" : "var(--br-text-secondary)",
                boxShadow: view === "board" ? "var(--shadow-sm)" : "none",
                display: "inline-flex", alignItems: "center", gap: 5,
              }}><Icon name="kanban-square" size={11} /> Board</button>
            </div>
            <button className="btn btn--ghost btn--xs"><Icon name="filter" size={12} /> Filter</button>
          </>
        } />
        {view === "board" ? <BoardView /> : <InboxView />}
      </div>
      <DirH_ActivityRail />
    </div>
  );
};

const DirH_FeedbackBoard = () => <DirH_Feedback view="board" />;

Object.assign(window, {
  DirH_Home, DirH_Users, DirH_UserDetail, DirH_Feedback, DirH_FeedbackBoard,
  DirH_Sidebar, DirH_Top, DirH_ActivityRail,
});
