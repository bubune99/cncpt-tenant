/* TABS — WIREFRAMES (Part 1): Admin Inbox, Teams, Tenants & Subdomains,
   Subscription Tiers, AI Credits. Same hybrid chrome (sidebar + top + activity rail). */

/* -------------------- Admin Inbox -------------------- */
const Tab_AdminInbox = () => {
  const groups = [
    { id: "all", label: "All", n: 18, icon: "inbox", on: true },
    { id: "perm", label: "Permission requests", n: 5, icon: "shield" },
    { id: "fb", label: "Escalated feedback", n: 3, icon: "message-square" },
    { id: "credits", label: "Low credits", n: 4, icon: "sparkles" },
    { id: "tier", label: "Tier requests", n: 2, icon: "crown" },
    { id: "subd", label: "Orphan subdomains", n: 2, icon: "globe" },
    { id: "billing", label: "Billing issues", n: 2, icon: "credit-card" },
  ];
  const tasks = [
    { id: "t1", kind: "perm", title: "DTF Gang Sheet — access requested", who: USERS[1], note: "Project deadline next Tuesday", time: "14m", priority: "high", actionable: true },
    { id: "t2", kind: "fb", title: "Billing refund — AI credits expired", who: USERS[3], note: "CSAT 1 · expired 4,000 credits silently", time: "1h", priority: "high", sla: "due in 3h" },
    { id: "t3", kind: "subd", title: "craftshop.cncpt-designer.com orphaned", who: null, note: "No owner since Owen R. was suspended", time: "1d", priority: "med" },
    { id: "t4", kind: "credits", title: "Diego R. · 0 credits, paid Starter", who: USERS[3], note: "Last topped up 32 days ago", time: "2d", priority: "med" },
    { id: "t5", kind: "tier", title: "DTF Pro upgrade pending approval", who: USERS[8], note: "Trial requested for upcoming campaign", time: "2d", priority: "low" },
    { id: "t6", kind: "perm", title: "API Live Keys — access requested", who: USERS[7], note: "Wants production webhook keys", time: "2d", priority: "med" },
    { id: "t7", kind: "billing", title: "Failed charge — northgear · $89.00", who: USERS[0], note: "Card expired · auto-retry in 24h", time: "3d", priority: "high", sla: "auto-retry" },
    { id: "t8", kind: "fb", title: "WooCommerce sync silently failing", who: USERS[6], note: "Affects 14 tenants · linked WH-218", time: "3d", priority: "med" },
    { id: "t9", kind: "subd", title: "northgear-dev.cncpt — TTL expired", who: USERS[0], note: "Dev subdomain, no traffic 30d", time: "4d", priority: "low" },
    { id: "t10", kind: "credits", title: "studio44 — credit pool at 12%", who: USERS[2], note: "Team of 4 designers on shared pool", time: "5d", priority: "low" },
  ];
  const sel = tasks[0];

  return (
    <div className="adm-board dirH">
      <DirH_Sidebar active="inbox" role="super" />
      <div className="dirH__main">
        <DirH_Top crumbs={["Admin", "Admin Inbox"]} right={
          <>
            <span className="muted" style={{ fontSize: 11 }}>SLA</span>
            <span style={{ fontWeight: 600, fontSize: 12 }}>2 due in 3h</span>
            <button className="btn btn--secondary btn--xs"><Icon name="filter" size={12} /> Filters</button>
            <button className="btn btn--secondary btn--xs"><Icon name="check-check" size={12} /> Bulk resolve</button>
          </>
        } />
        <div className="dirH__page" style={{ display: "grid", gridTemplateColumns: "210px 1fr 1.2fr", padding: 0, minHeight: 0 }}>
          {/* Categories */}
          <div style={{ background: "#fff", borderRight: "1px solid var(--br-border)", padding: "12px 8px", overflow: "auto" }}>
            <div className="eyebrow" style={{ padding: "4px 10px 6px" }}>Queues</div>
            {groups.map((g) => (
              <button key={g.id} className={"dirH__nav-item " + (g.on ? "is-active" : "")} style={{ width: "100%" }}>
                <Icon name={g.icon} size={13} />
                <span>{g.label}</span>
                <span className="badge">{g.n}</span>
              </button>
            ))}
            <div className="eyebrow" style={{ padding: "16px 10px 6px" }}>Saved</div>
            {[
              { l: "Due today", n: 4, i: "alarm-clock" },
              { l: "Assigned to me", n: 6, i: "user-circle" },
              { l: "Snoozed", n: 3, i: "moon" },
            ].map((s) => (
              <button key={s.l} className="dirH__nav-item" style={{ width: "100%" }}>
                <Icon name={s.i} size={13} /><span>{s.l}</span><span className="badge">{s.n}</span>
              </button>
            ))}
          </div>

          {/* List */}
          <div style={{ borderRight: "1px solid var(--br-border)", background: "#fff", display: "flex", flexDirection: "column", minHeight: 0 }}>
            <div className="row between" style={{ padding: "10px 14px", borderBottom: "1px solid var(--br-border)", background: "var(--br-surface)" }}>
              <div className="row" style={{ gap: 6 }}>
                <span style={{ fontSize: 12.5, fontWeight: 600 }}>All tasks</span>
                <span className="muted mono" style={{ fontSize: 11 }}>18</span>
              </div>
              <div className="row" style={{ gap: 4 }}>
                <button className="btn btn--ghost btn--xs">Sort: priority <Icon name="chevron-down" size={11} /></button>
              </div>
            </div>
            <div style={{ overflow: "auto", flex: 1 }}>
              {tasks.map((t, i) => {
                const isSel = t.id === sel.id;
                const icon = { perm:"shield", fb:"message-square", subd:"globe", credits:"sparkles", tier:"crown", billing:"credit-card" }[t.kind];
                const tone = { high:"#dc2626", med:"#a16207", low:"#475569" }[t.priority];
                return (
                  <div key={t.id} style={{
                    padding: "11px 14px", borderBottom: "1px solid var(--br-border)",
                    background: isSel ? "#eff6ff" : "transparent",
                    borderLeft: "3px solid " + (isSel ? "var(--br-primary)" : "transparent"),
                  }}>
                    <div className="row" style={{ gap: 10, alignItems: "flex-start" }}>
                      <div style={{ width: 4, alignSelf: "stretch", borderRadius: 2, background: tone, marginTop: 2, marginBottom: 2 }} />
                      <div className="col" style={{ gap: 3, flex: 1, minWidth: 0 }}>
                        <div className="row" style={{ gap: 6 }}>
                          <Icon name={icon} size={12} style={{ color: tone }} />
                          <span style={{ fontSize: 12.5, fontWeight: 600, lineHeight: 1.3 }}>{t.title}</span>
                        </div>
                        <div className="row" style={{ gap: 6 }}>
                          {t.who ? <div className={"avatar avatar--xs avatar--" + t.who.avatarKind}>{initials(t.who.name)}</div> : null}
                          <span className="muted" style={{ fontSize: 11, lineHeight: 1.35 }}>{t.note}</span>
                        </div>
                      </div>
                      <div className="col" style={{ alignItems: "flex-end", gap: 4 }}>
                        <span className="muted" style={{ fontSize: 10.5 }}>{t.time} ago</span>
                        {t.sla ? <span className="pill pill--rose" style={{ fontSize: 10 }}><Icon name="alarm-clock" size={10} /> {t.sla}</span> : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detail */}
          <div style={{ overflow: "auto", background: "var(--br-surface)" }}>
            <div style={{ padding: "16px 20px" }}>
              <div className="row" style={{ gap: 6, marginBottom: 4 }}>
                <span className="pill pill--rose" style={{ fontSize: 10.5 }}><Icon name="alert-triangle" size={11} /> High</span>
                <span className="pill pill--amber" style={{ fontSize: 10.5 }}><Icon name="shield" size={11} /> Permission request</span>
                <span className="muted mono" style={{ fontSize: 11 }}>TASK-{sel.id.toUpperCase()}</span>
              </div>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, letterSpacing: "-0.01em" }}>{sel.title}</h2>
              <p className="muted" style={{ fontSize: 12, margin: "4px 0 0" }}>Opened {sel.time} ago · last activity 6m ago</p>
            </div>
            <div style={{ padding: "0 20px 16px" }}>
              <div className="card" style={{ marginBottom: 12 }}>
                <div style={{ padding: 14, display: "flex", gap: 12 }}>
                  <div className={"avatar avatar--lg avatar--" + sel.who.avatarKind}>{initials(sel.who.name)}</div>
                  <div className="col" style={{ gap: 3, flex: 1 }}>
                    <div className="row" style={{ gap: 6 }}>
                      <strong style={{ fontSize: 13.5 }}>{sel.who.name}</strong>
                      <span className="pill" style={{ fontSize: 10.5 }}><Icon name="crown" size={10} /> {sel.who.tier}</span>
                      <span className="pill" style={{ fontSize: 10.5 }}><Icon name="building-2" size={10} /> {sel.who.tenant}</span>
                    </div>
                    <div className="muted" style={{ fontSize: 11.5 }}>{sel.who.email}</div>
                    <div className="row" style={{ gap: 14, marginTop: 3, fontSize: 11.5 }}>
                      <span><strong>1,840</strong> <span className="muted">designs</span></span>
                      <span><strong>$640</strong> <span className="muted">LTV</span></span>
                      <span><strong>4 mo</strong> <span className="muted">tenure</span></span>
                    </div>
                  </div>
                  <button className="btn btn--secondary btn--xs"><Icon name="arrow-up-right" size={11} /> Open profile</button>
                </div>
              </div>

              <div className="card" style={{ marginBottom: 12 }}>
                <div className="card__head"><h3 className="card__title">Request details</h3></div>
                <div className="card__body" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {[
                    { l: "Permission", v: "designer.dtf · DTF Gang Sheet" },
                    { l: "Current tier", v: "Starter" },
                    { l: "Required tier", v: "DTF Pro" },
                    { l: "Reason", v: "Project deadline next Tuesday" },
                    { l: "Duration requested", v: "14 days trial" },
                    { l: "Auto-revoke", v: "Yes · Jun 4" },
                  ].map((m) => (
                    <div key={m.l} className="row between" style={{ padding: "5px 0", fontSize: 12, borderBottom: "1px solid var(--br-border)" }}>
                      <span className="muted">{m.l}</span><span>{m.v}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card" style={{ marginBottom: 12 }}>
                <div className="card__head"><h3 className="card__title">Related signals</h3></div>
                <div className="card__body" style={{ paddingTop: 6 }}>
                  {[
                    "Jonas viewed the DTF gang-sheet documentation 4 times this week",
                    "Tenant printlab has 2 other designers — no DTF Pro users yet",
                    "Last 3 permission requests from printlab were approved",
                  ].map((r, i) => (
                    <div key={i} className="row" style={{ gap: 8, padding: "5px 0", fontSize: 12 }}>
                      <Icon name="circle" size={6} style={{ color: "#94a3b8" }} />
                      <span className="muted">{r}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
                <button className="btn btn--primary btn--xs"><Icon name="check" size={12} /> Approve · 14d trial</button>
                <button className="btn btn--secondary btn--xs"><Icon name="crown" size={12} /> Upgrade tier instead</button>
                <button className="btn btn--secondary btn--xs"><Icon name="message-square" size={12} /> Reply with template</button>
                <button className="btn btn--ghost btn--xs"><Icon name="moon" size={12} /> Snooze</button>
                <button className="btn btn--danger btn--xs"><Icon name="x" size={12} /> Decline</button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <DirH_ActivityRail />
    </div>
  );
};

/* -------------------- Teams -------------------- */
const Tab_Teams = () => {
  const teams = [
    { name: "Northgear Apparel", tenant: "northgear", owner: USERS[0], members: 6, designers: 4, plan: "DTF Pro", mrr: "$249/mo", created: "Mar 2025", health: "ok", credits: "8.4k / 10k" },
    { name: "Northgear Dev",     tenant: "northgear", owner: USERS[0], members: 2, designers: 1, plan: "Free",    mrr: "$0",      created: "Jun 2025", health: "warn", credits: "—" },
    { name: "Printlab Studio",   tenant: "printlab",  owner: USERS[1], members: 3, designers: 2, plan: "Starter", mrr: "$29/mo",  created: "Jan 2026", health: "ok", credits: "1.2k / 2k" },
    { name: "Studio 44",         tenant: "studio44",  owner: USERS[2], members: 9, designers: 6, plan: "Business",mrr: "$149/mo", created: "Nov 2024", health: "ok", credits: "22.1k / 30k" },
    { name: "Inktide",           tenant: "inktide",   owner: USERS[3], members: 2, designers: 1, plan: "Starter", mrr: "$29/mo",  created: "Apr 2026", health: "alert", credits: "0 / 2k" },
    { name: "Mojo Threads",      tenant: "mojothreads",owner: USERS[4],members: 4, designers: 3, plan: "DTF Pro", mrr: "$249/mo", created: "Oct 2025", health: "ok", credits: "5.6k / 10k" },
    { name: "Hexapress Print",   tenant: "hexapress", owner: USERS[7], members: 5, designers: 3, plan: "Business",mrr: "$149/mo", created: "Sep 2025", health: "ok", credits: "9.8k / 30k" },
    { name: "Daydream",          tenant: "daydream",  owner: USERS[6], members: 3, designers: 2, plan: "Starter", mrr: "$29/mo",  created: "Feb 2026", health: "ok", credits: "800 / 2k" },
    { name: "Artery",            tenant: "artery",    owner: USERS[8], members: 4, designers: 3, plan: "DTF Pro", mrr: "$249/mo", created: "Dec 2025", health: "warn", credits: "3.2k / 10k" },
  ];
  return (
    <div className="adm-board dirH">
      <DirH_Sidebar active="teams" role="super" />
      <div className="dirH__main">
        <DirH_Top crumbs={["Admin", "Teams"]} right={
          <>
            <button className="btn btn--secondary btn--xs"><Icon name="download" size={12} /> Export</button>
            <button className="btn btn--primary btn--xs"><Icon name="plus" size={12} /> New team</button>
          </>
        } />

        <div style={{ padding: "16px 20px 0", background: "#fff", borderBottom: "1px solid var(--br-border)", flexShrink: 0 }}>
          <div className="row between" style={{ alignItems: "flex-end", marginBottom: 14 }}>
            <div className="col" style={{ gap: 2 }}>
              <h2 style={{ margin: 0, fontSize: 19, fontWeight: 700, letterSpacing: "-0.01em" }}>Teams</h2>
              <p className="muted" style={{ margin: 0, fontSize: 12.5 }}>1,072 teams across 980 tenants · 38 created this week</p>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 14 }}>
            {[
              { l: "Total teams", v: "1,072", d: "+38 / 7d", tone: "blue", i: "users" },
              { l: "Active (≥1 design / 7d)", v: "742", d: "69%", tone: "green", i: "activity" },
              { l: "Avg members per team", v: "4.2", d: "+0.3", tone: "violet", i: "user" },
              { l: "Teams without owner", v: "6", d: "needs review", tone: "amber", i: "alert-triangle" },
            ].map((k) => (
              <div className="card" key={k.l} style={{ padding: 12 }}>
                <div className="row between">
                  <span className="muted" style={{ fontSize: 11.5 }}>{k.l}</span>
                  <Icon name={k.i} size={13} style={{ color: { blue:"#1d4ed8", green:"#15803d", violet:"#7e22ce", amber:"#a16207" }[k.tone] }} />
                </div>
                <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em", marginTop: 4 }}>{k.v}</div>
                <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>{k.d}</div>
              </div>
            ))}
          </div>
          <div className="row" style={{ gap: 8, paddingBottom: 14, flexWrap: "wrap" }}>
            <div className="row" style={{ background: "var(--br-surface)", border: "1px solid var(--br-border)", borderRadius: 7, padding: "6px 10px", minWidth: 260, gap: 6 }}>
              <Icon name="search" size={13} style={{ color: "var(--br-text-secondary)" }} />
              <span style={{ fontSize: 12.5, color: "var(--br-text-secondary)" }}>Search teams, tenants, owners…</span>
            </div>
            <button className="btn btn--secondary btn--xs"><Icon name="crown" size={12} /> Plan: any <Icon name="chevron-down" size={11} /></button>
            <button className="btn btn--secondary btn--xs"><Icon name="building-2" size={12} /> Tenant: any <Icon name="chevron-down" size={11} /></button>
            <button className="btn btn--secondary btn--xs"><Icon name="users" size={12} /> Size: any <Icon name="chevron-down" size={11} /></button>
            <button className="btn btn--secondary btn--xs"><Icon name="activity" size={12} /> Health: any <Icon name="chevron-down" size={11} /></button>
            <div style={{ flex: 1 }} />
            <button className="btn btn--ghost btn--xs"><Icon name="layout-grid" size={12} /> Grid</button>
            <button className="btn btn--ghost btn--xs" style={{ background: "var(--br-surface)", color: "var(--br-text)" }}><Icon name="rows-3" size={12} /> Table</button>
          </div>
        </div>

        <div style={{ flex: 1, overflow: "auto", background: "#fff" }}>
          <table className="dirH-table">
            <thead>
              <tr>
                {["Team", "Tenant", "Owner", "Members", "Plan", "MRR", "Credits", "Health", "Created", ""].map((h, i) => <th key={i}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {teams.map((t, i) => (
                <tr key={i}>
                  <td>
                    <div className="row" style={{ gap: 8 }}>
                      <div style={{ width: 22, height: 22, borderRadius: 5, background: "var(--gr-blue-purple)", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 600 }}>
                        {t.name.split(" ").slice(0,2).map(w=>w[0]).join("")}
                      </div>
                      <span style={{ fontWeight: 500 }}>{t.name}</span>
                    </div>
                  </td>
                  <td className="mono" style={{ fontSize: 11.5 }}>{t.tenant}</td>
                  <td>
                    <div className="row" style={{ gap: 6 }}>
                      <div className={"avatar avatar--xs avatar--" + t.owner.avatarKind}>{initials(t.owner.name)}</div>
                      <span>{t.owner.name}</span>
                    </div>
                  </td>
                  <td><span style={{ fontVariantNumeric: "tabular-nums" }}>{t.members}</span> <span className="muted" style={{ fontSize: 10.5 }}>({t.designers} designers)</span></td>
                  <td><span className={"pill " + (t.plan === "DTF Pro" ? "pill--violet" : t.plan === "Business" ? "pill--blue" : t.plan === "Free" ? "pill--slate" : "")} style={{ fontSize: 10.5 }}>{t.plan}</span></td>
                  <td className="mono" style={{ fontSize: 11.5 }}>{t.mrr}</td>
                  <td className="mono" style={{ fontSize: 11.5 }}>{t.credits}</td>
                  <td>
                    <span className={"pill " + ({ ok:"pill--green", warn:"pill--amber", alert:"pill--rose" })[t.health]} style={{ fontSize: 10.5 }}>
                      <span className="dot" />{t.health === "ok" ? "healthy" : t.health === "warn" ? "watch" : "needs attention"}
                    </span>
                  </td>
                  <td className="muted">{t.created}</td>
                  <td><button className="iconbtn iconbtn--sm iconbtn--ghost"><Icon name="more-horizontal" size={12} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <DirH_ActivityRail />
    </div>
  );
};

/* -------------------- Tenants & Subdomains -------------------- */
const Tab_Tenants = () => {
  const rows = [
    { sub: "northgear", custom: "northgear.com", owner: USERS[0], teams: 2, users: 12, plan: "DTF Pro", mrr: "$249", ssl: "ok", traffic: "12.4k", health: "ok", created: "Mar 2025" },
    { sub: "printlab", custom: null, owner: USERS[1], teams: 1, users: 3, plan: "Starter", mrr: "$29", ssl: "ok", traffic: "3.1k", health: "ok", created: "Jan 2026" },
    { sub: "studio44", custom: "studio44.design", owner: USERS[2], teams: 4, users: 18, plan: "Business", mrr: "$149", ssl: "ok", traffic: "27.8k", health: "ok", created: "Nov 2024" },
    { sub: "inktide", custom: null, owner: USERS[3], teams: 0, users: 2, plan: "Starter", mrr: "$29", ssl: "ok", traffic: "—", health: "warn", created: "Apr 2026" },
    { sub: "mojothreads", custom: null, owner: USERS[4], teams: 1, users: 4, plan: "DTF Pro", mrr: "$249", ssl: "ok", traffic: "8.0k", health: "ok", created: "Oct 2025" },
    { sub: "craftshop", custom: "craftshop.uk", owner: null, teams: 0, users: 0, plan: "Business", mrr: "$149", ssl: "expired", traffic: "—", health: "alert", created: "Jul 2024" },
    { sub: "hexapress", custom: "hexapress.co", owner: USERS[7], teams: 1, users: 5, plan: "Business", mrr: "$149", ssl: "ok", traffic: "18.2k", health: "ok", created: "Sep 2025" },
    { sub: "daydream", custom: null, owner: USERS[6], teams: 1, users: 3, plan: "Starter", mrr: "$29", ssl: "ok", traffic: "920", health: "ok", created: "Feb 2026" },
    { sub: "artery", custom: null, owner: USERS[8], teams: 1, users: 4, plan: "DTF Pro", mrr: "$249", ssl: "renewing", traffic: "4.2k", health: "warn", created: "Dec 2025" },
    { sub: "bunnyprint", custom: null, owner: null, teams: 0, users: 1, plan: "Free", mrr: "$0", ssl: "ok", traffic: "—", health: "alert", created: "Aug 2024" },
  ];

  return (
    <div className="adm-board dirH">
      <DirH_Sidebar active="tenants" role="super" />
      <div className="dirH__main">
        <DirH_Top crumbs={["Admin", "Tenants & Subdomains"]} right={
          <>
            <button className="btn btn--secondary btn--xs"><Icon name="download" size={12} /> Export</button>
            <button className="btn btn--primary btn--xs"><Icon name="plus" size={12} /> New tenant</button>
          </>
        } />

        <div style={{ padding: "16px 20px 0", background: "#fff", borderBottom: "1px solid var(--br-border)", flexShrink: 0 }}>
          <div className="row between" style={{ alignItems: "flex-end", marginBottom: 14 }}>
            <div className="col" style={{ gap: 2 }}>
              <h2 style={{ margin: 0, fontSize: 19, fontWeight: 700, letterSpacing: "-0.01em" }}>Tenants & Subdomains</h2>
              <p className="muted" style={{ margin: 0, fontSize: 12.5 }}>980 tenants · 1,144 subdomains · 218 with custom domains</p>
            </div>
          </div>

          {/* Alert banner */}
          <div style={{
            background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px",
            display: "flex", alignItems: "center", gap: 10, marginBottom: 14,
          }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: "#fee2e2", color: "#b91c1c", display: "inline-flex", alignItems: "center", justifyContent: "center" }}><Icon name="alert-triangle" size={14} /></div>
            <div className="col" style={{ gap: 1, flex: 1 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: "#991b1b" }}>2 subdomains need attention</div>
              <div className="muted" style={{ fontSize: 11.5 }}>
                <strong>craftshop</strong> — orphaned, SSL expired ·  <strong>bunnyprint</strong> — no owner, 1 user remains
              </div>
            </div>
            <button className="btn btn--secondary btn--xs">Review <Icon name="arrow-right" size={11} /></button>
          </div>

          <div className="row" style={{ gap: 8, paddingBottom: 14, flexWrap: "wrap" }}>
            <div className="row" style={{ background: "var(--br-surface)", border: "1px solid var(--br-border)", borderRadius: 7, padding: "6px 10px", minWidth: 260, gap: 6 }}>
              <Icon name="search" size={13} style={{ color: "var(--br-text-secondary)" }} />
              <span style={{ fontSize: 12.5, color: "var(--br-text-secondary)" }}>Search subdomain, custom domain, owner…</span>
            </div>
            <button className="btn btn--secondary btn--xs"><Icon name="crown" size={12} /> Plan: any <Icon name="chevron-down" size={11} /></button>
            <button className="btn btn--secondary btn--xs"><Icon name="globe" size={12} /> Custom domain: any <Icon name="chevron-down" size={11} /></button>
            <button className="btn btn--secondary btn--xs"><Icon name="lock" size={12} /> SSL: any <Icon name="chevron-down" size={11} /></button>
            <button className="btn btn--secondary btn--xs"><Icon name="activity" size={12} /> Health: any <Icon name="chevron-down" size={11} /></button>
            <button className="btn btn--secondary btn--xs"><Icon name="user-x" size={12} /> Orphans only</button>
          </div>
        </div>

        <div style={{ flex: 1, overflow: "auto", background: "#fff" }}>
          <table className="dirH-table">
            <thead>
              <tr>
                {["Subdomain", "Custom domain", "Owner", "Plan", "Teams", "Users", "MRR", "Traffic /mo", "SSL", "Health", ""].map((h, i) => <th key={i}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.sub}>
                  <td>
                    <div className="col" style={{ gap: 0 }}>
                      <span style={{ fontWeight: 500 }}>{r.sub}</span>
                      <span className="muted mono" style={{ fontSize: 10.5 }}>{r.sub}.cncpt-designer.com</span>
                    </div>
                  </td>
                  <td>
                    {r.custom
                      ? <span className="row" style={{ gap: 4 }}><Icon name="globe" size={11} style={{ color: "#15803d" }} /> <span className="mono" style={{ fontSize: 11.5 }}>{r.custom}</span></span>
                      : <span className="muted" style={{ fontSize: 11.5 }}>—</span>}
                  </td>
                  <td>
                    {r.owner
                      ? <div className="row" style={{ gap: 6 }}><div className={"avatar avatar--xs avatar--" + r.owner.avatarKind}>{initials(r.owner.name)}</div><span>{r.owner.name}</span></div>
                      : <span className="pill pill--rose" style={{ fontSize: 10.5 }}><Icon name="user-x" size={10} /> orphan</span>}
                  </td>
                  <td><span className={"pill " + (r.plan === "DTF Pro" ? "pill--violet" : r.plan === "Business" ? "pill--blue" : r.plan === "Free" ? "pill--slate" : "")} style={{ fontSize: 10.5 }}>{r.plan}</span></td>
                  <td style={{ fontVariantNumeric: "tabular-nums" }}>{r.teams}</td>
                  <td style={{ fontVariantNumeric: "tabular-nums" }}>{r.users}</td>
                  <td className="mono" style={{ fontSize: 11.5 }}>{r.mrr}</td>
                  <td className="mono" style={{ fontSize: 11.5 }}>{r.traffic}</td>
                  <td>
                    <span className={"pill " + ({ ok:"pill--green", expired:"pill--rose", renewing:"pill--amber" })[r.ssl]} style={{ fontSize: 10.5 }}>
                      <Icon name={r.ssl === "ok" ? "shield-check" : r.ssl === "expired" ? "shield-off" : "shield"} size={10} />
                      {r.ssl}
                    </span>
                  </td>
                  <td><span className={"pill " + ({ ok:"pill--green", warn:"pill--amber", alert:"pill--rose" })[r.health]} style={{ fontSize: 10.5 }}><span className="dot" />{r.health}</span></td>
                  <td><button className="iconbtn iconbtn--sm iconbtn--ghost"><Icon name="more-horizontal" size={12} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <DirH_ActivityRail />
    </div>
  );
};

/* -------------------- Subscription Tiers -------------------- */
const Tab_Tiers = () => {
  const tiers = [
    { name: "Free", price: "$0", color: "#94a3b8", users: 4218, mrr: "$0", limits: ["1 team", "100 designs/mo", "100 AI credits"], cta: "—" },
    { name: "Starter", price: "$29/mo", color: "#3b82f6", users: 5740, mrr: "$16.6k", limits: ["1 team", "1,000 designs/mo", "2,000 AI credits"], cta: "Active" },
    { name: "DTF Pro", price: "$249/mo", color: "#a855f7", users: 1108, mrr: "$27.6k", limits: ["3 teams", "Unlimited designs", "10,000 AI credits", "DTF gang sheet"], cta: "Active" },
    { name: "Business", price: "$149/mo", color: "#0ea5e9", users: 1290, mrr: "$19.2k", limits: ["10 teams", "Unlimited designs", "30,000 AI credits", "API access"], cta: "Active" },
    { name: "Enterprise", price: "Custom", color: "#f59e0b", users: 52, mrr: "$48.4k", limits: ["Unlimited", "SLA + SSO", "Dedicated CSM", "Custom contracts"], cta: "Active" },
  ];
  const features = [
    { l: "Teams", v: ["1", "1", "3", "10", "Unlimited"] },
    { l: "Designs / mo", v: ["100", "1,000", "Unlimited", "Unlimited", "Unlimited"] },
    { l: "AI credits / mo", v: ["100", "2,000", "10,000", "30,000", "Custom"] },
    { l: "DTF Gang Sheet", v: ["—", "—", "✓", "✓", "✓"] },
    { l: "Custom domain", v: ["—", "—", "✓", "✓", "✓"] },
    { l: "API access", v: ["—", "—", "—", "✓", "✓"] },
    { l: "Webhooks", v: ["—", "—", "—", "✓", "✓"] },
    { l: "SSO / SAML", v: ["—", "—", "—", "—", "✓"] },
    { l: "Dedicated CSM", v: ["—", "—", "—", "—", "✓"] },
    { l: "SLA", v: ["—", "—", "—", "99.5%", "99.95%"] },
  ];
  return (
    <div className="adm-board dirH">
      <DirH_Sidebar active="tiers" role="super" />
      <div className="dirH__main">
        <DirH_Top crumbs={["Admin", "Subscription Tiers"]} right={
          <>
            <button className="btn btn--secondary btn--xs"><Icon name="history" size={12} /> Pricing history</button>
            <button className="btn btn--primary btn--xs"><Icon name="plus" size={12} /> New tier</button>
          </>
        } />
        <div className="dirH__page" style={{ padding: "16px 20px" }}>
          <div className="row between" style={{ alignItems: "flex-end", marginBottom: 14 }}>
            <div className="col" style={{ gap: 2 }}>
              <h2 style={{ margin: 0, fontSize: 19, fontWeight: 700, letterSpacing: "-0.01em" }}>Subscription Tiers</h2>
              <p className="muted" style={{ margin: 0, fontSize: 12.5 }}>5 active tiers · $111.8k MRR total · 12,408 paying & free users</p>
            </div>
            <div className="row" style={{ gap: 14 }}>
              <span className="muted" style={{ fontSize: 11 }}>MRR</span><span style={{ fontWeight: 600 }}>$111.8k</span>
              <span className="muted" style={{ fontSize: 11 }}>ARPU</span><span style={{ fontWeight: 600 }}>$9.01</span>
              <span className="muted" style={{ fontSize: 11 }}>Churn 30d</span><span style={{ fontWeight: 600 }}>2.4%</span>
            </div>
          </div>

          {/* Tier cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 18 }}>
            {tiers.map((t) => (
              <div key={t.name} style={{ background: "#fff", border: "1px solid var(--br-border)", borderRadius: 10, overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
                <div style={{ height: 4, background: t.color }} />
                <div style={{ padding: 14 }}>
                  <div className="row between">
                    <div className="row" style={{ gap: 6 }}>
                      <span style={{ width: 10, height: 10, borderRadius: 9999, background: t.color }} />
                      <strong style={{ fontSize: 13.5 }}>{t.name}</strong>
                    </div>
                    <button className="iconbtn iconbtn--sm iconbtn--ghost"><Icon name="more-horizontal" size={12} /></button>
                  </div>
                  <div style={{ marginTop: 6, fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em" }}>{t.price}</div>
                  <div className="row" style={{ gap: 12, marginTop: 8, fontSize: 11.5 }}>
                    <div className="col" style={{ gap: 0 }}>
                      <span className="muted">Users</span>
                      <strong style={{ fontVariantNumeric: "tabular-nums" }}>{t.users.toLocaleString()}</strong>
                    </div>
                    <div className="col" style={{ gap: 0 }}>
                      <span className="muted">MRR</span>
                      <strong style={{ fontVariantNumeric: "tabular-nums" }}>{t.mrr}</strong>
                    </div>
                  </div>
                  <div style={{ borderTop: "1px solid var(--br-border)", marginTop: 10, paddingTop: 10 }}>
                    {t.limits.map((l, i) => (
                      <div key={i} className="row" style={{ gap: 6, fontSize: 11.5, padding: "2px 0" }}>
                        <Icon name="check" size={11} style={{ color: t.color }} />
                        <span>{l}</span>
                      </div>
                    ))}
                  </div>
                  <button className="btn btn--secondary btn--xs" style={{ width: "100%", marginTop: 10, justifyContent: "center" }}>
                    <Icon name="settings" size={12} /> Edit tier
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1.7fr 1fr", gap: 14 }}>
            {/* Feature matrix */}
            <div className="card">
              <div className="card__head"><h3 className="card__title">Feature matrix</h3><button className="btn btn--ghost btn--xs">Edit features <Icon name="pencil" size={11} /></button></div>
              <div className="card__body card__body--flush">
                <table className="dirH-table" style={{ tableLayout: "fixed" }}>
                  <thead>
                    <tr>
                      <th style={{ width: "26%" }}>Feature</th>
                      {tiers.map((t) => <th key={t.name} style={{ textAlign: "center" }}>{t.name}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {features.map((f) => (
                      <tr key={f.l}>
                        <td><span style={{ fontWeight: 500 }}>{f.l}</span></td>
                        {f.v.map((v, i) => (
                          <td key={i} style={{ textAlign: "center", color: v === "—" ? "#cbd5e1" : "var(--br-text)", fontVariantNumeric: "tabular-nums" }}>{v}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Movement / migrations */}
            <div className="col" style={{ gap: 14 }}>
              <div className="card">
                <div className="card__head"><h3 className="card__title">Recent migrations · 7d</h3></div>
                <div className="card__body card__body--flush">
                  {[
                    { from: "Starter", to: "DTF Pro", n: 18, dir: "up" },
                    { from: "Starter", to: "Business", n: 9, dir: "up" },
                    { from: "DTF Pro", to: "Business", n: 4, dir: "up" },
                    { from: "DTF Pro", to: "Starter", n: 3, dir: "down" },
                    { from: "Business", to: "DTF Pro", n: 2, dir: "down" },
                  ].map((m, i) => (
                    <div key={i} className="row between" style={{ padding: "9px 16px", borderBottom: "1px solid var(--br-border)", fontSize: 12.5 }}>
                      <div className="row" style={{ gap: 6 }}>
                        <span className="muted">{m.from}</span>
                        <Icon name="arrow-right" size={11} style={{ color: "#94a3b8" }} />
                        <strong>{m.to}</strong>
                      </div>
                      <div className="row" style={{ gap: 6 }}>
                        <span className="mono" style={{ fontVariantNumeric: "tabular-nums" }}>{m.n}</span>
                        <Icon name={m.dir === "up" ? "trending-up" : "trending-down"} size={11} style={{ color: m.dir === "up" ? "#10b981" : "#dc2626" }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="card">
                <div className="card__head"><h3 className="card__title">Pending tier changes</h3></div>
                <div className="card__body card__body--flush">
                  {[
                    { who: USERS[8], change: "Starter → DTF Pro", when: "Jun 1" },
                    { who: USERS[3], change: "downgrade Starter → Free", when: "Jun 5" },
                    { who: USERS[5], change: "Business → DTF Pro", when: "Jun 12" },
                  ].map((c, i) => (
                    <div key={i} className="row between" style={{ padding: "9px 16px", borderBottom: "1px solid var(--br-border)" }}>
                      <div className="row" style={{ gap: 6 }}>
                        <div className={"avatar avatar--xs avatar--" + c.who.avatarKind}>{initials(c.who.name)}</div>
                        <div className="col" style={{ gap: 0 }}>
                          <span style={{ fontSize: 12, fontWeight: 500 }}>{c.who.name}</span>
                          <span className="muted" style={{ fontSize: 11 }}>{c.change}</span>
                        </div>
                      </div>
                      <span className="muted" style={{ fontSize: 11 }}>{c.when}</span>
                    </div>
                  ))}
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

/* -------------------- AI Credits -------------------- */
const Tab_Credits = () => {
  const top = [
    { who: USERS[2], used: 22100, cap: 30000, plan: "Business" },
    { who: USERS[7], used: 9800, cap: 30000, plan: "Business" },
    { who: USERS[0], used: 8400, cap: 10000, plan: "DTF Pro" },
    { who: USERS[4], used: 5630, cap: 10000, plan: "DTF Pro" },
    { who: USERS[8], used: 3200, cap: 10000, plan: "DTF Pro" },
    { who: USERS[1], used: 1200, cap: 2000, plan: "Starter" },
    { who: USERS[6], used: 800, cap: 2000, plan: "Starter" },
    { who: USERS[3], used: 0, cap: 2000, plan: "Starter" },
  ];
  // Spark data — 14 days of usage
  const spark = [42, 38, 55, 61, 48, 52, 70, 81, 76, 88, 92, 79, 84, 95];
  const max = Math.max(...spark);

  return (
    <div className="adm-board dirH">
      <DirH_Sidebar active="credits" role="super" />
      <div className="dirH__main">
        <DirH_Top crumbs={["Admin", "AI Credits"]} right={
          <>
            <button className="btn btn--secondary btn--xs"><Icon name="download" size={12} /> Export usage</button>
            <button className="btn btn--primary btn--xs"><Icon name="sparkles" size={12} /> Bulk top-up</button>
          </>
        } />
        <div className="dirH__page" style={{ padding: "16px 20px" }}>
          <div className="row between" style={{ alignItems: "flex-end", marginBottom: 14 }}>
            <div className="col" style={{ gap: 2 }}>
              <h2 style={{ margin: 0, fontSize: 19, fontWeight: 700, letterSpacing: "-0.01em" }}>AI Credits</h2>
              <p className="muted" style={{ margin: 0, fontSize: 12.5 }}>2.8M credits consumed in the last 30 days · 112k under last month</p>
            </div>
          </div>

          {/* KPIs + spark */}
          <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
            <div className="card" style={{ padding: 14 }}>
              <div className="row between">
                <span className="muted" style={{ fontSize: 11.5 }}>Consumption · last 14 days</span>
                <div className="row" style={{ gap: 6 }}>
                  <span className="pill pill--rose" style={{ fontSize: 10.5 }}><Icon name="trending-down" size={11} /> −4%</span>
                </div>
              </div>
              <div className="row" style={{ alignItems: "flex-end", gap: 4, marginTop: 12, height: 88 }}>
                {spark.map((v, i) => (
                  <div key={i} style={{ flex: 1, background: "var(--gr-blue-purple)", borderRadius: "3px 3px 0 0", height: (v / max) * 100 + "%", opacity: 0.4 + (v / max) * 0.6 }} />
                ))}
              </div>
              <div className="row between muted" style={{ fontSize: 10.5, marginTop: 6 }}>
                <span>May 3</span><span>May 16</span>
              </div>
            </div>
            {[
              { l: "Credits issued / mo", v: "3.2M", d: "+8%", i: "sparkles", tone: "violet" },
              { l: "Credits consumed / mo", v: "2.8M", d: "−4%", i: "activity", tone: "blue" },
              { l: "Expiring in 7 days", v: "186k", d: "across 248 users", i: "clock", tone: "amber" },
            ].map((k) => (
              <div className="card" key={k.l} style={{ padding: 14 }}>
                <div className="row between">
                  <span className="muted" style={{ fontSize: 11.5 }}>{k.l}</span>
                  <Icon name={k.i} size={13} style={{ color: { violet:"#7e22ce", blue:"#1d4ed8", amber:"#a16207" }[k.tone] }} />
                </div>
                <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", marginTop: 6 }}>{k.v}</div>
                <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>{k.d}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 14 }}>
            {/* Top consumers */}
            <div className="card">
              <div className="card__head">
                <div className="row">
                  <h3 className="card__title">Top consumers · this cycle</h3>
                  <span className="muted" style={{ fontSize: 11.5 }}>resets Jun 1</span>
                </div>
                <button className="btn btn--ghost btn--xs">All users <Icon name="arrow-right" size={11} /></button>
              </div>
              <div className="card__body card__body--flush">
                {top.map((t, i) => {
                  const pct = Math.round((t.used / t.cap) * 100);
                  const tone = pct >= 90 ? "#dc2626" : pct >= 70 ? "#a16207" : "#1d4ed8";
                  return (
                    <div key={t.who.id} style={{ padding: "10px 16px", borderBottom: "1px solid var(--br-border)" }}>
                      <div className="row between">
                        <div className="row" style={{ gap: 8 }}>
                          <div className={"avatar avatar--xs avatar--" + t.who.avatarKind}>{initials(t.who.name)}</div>
                          <div className="col" style={{ gap: 0 }}>
                            <span style={{ fontSize: 12.5, fontWeight: 500 }}>{t.who.name}</span>
                            <span className="muted" style={{ fontSize: 11 }}>{t.who.tenant} · {t.plan}</span>
                          </div>
                        </div>
                        <div className="row" style={{ gap: 8 }}>
                          <span className="mono" style={{ fontSize: 12, fontVariantNumeric: "tabular-nums" }}>{t.used.toLocaleString()} / {t.cap.toLocaleString()}</span>
                          <span className="pill" style={{ fontSize: 10.5, color: tone, borderColor: "transparent", background: pct >= 90 ? "#ffe4e6" : pct >= 70 ? "#fef3c7" : "#dbeafe" }}>{pct}%</span>
                          <button className="btn btn--secondary btn--xs">Top up</button>
                        </div>
                      </div>
                      <div style={{ height: 4, marginTop: 8, background: "#f1f5f9", borderRadius: 9999, overflow: "hidden" }}>
                        <div style={{ width: pct + "%", height: "100%", background: tone, opacity: 0.8 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="col" style={{ gap: 14 }}>
              {/* Low balance alerts */}
              <div className="card">
                <div className="card__head">
                  <h3 className="card__title">Low balance alerts</h3>
                  <span className="pill pill--rose" style={{ fontSize: 10 }}>4</span>
                </div>
                <div className="card__body card__body--flush">
                  {[
                    { who: USERS[3], left: 0, plan: "Starter", days: 14 },
                    { who: USERS[9], left: 12, plan: "Starter", days: 5 },
                    { who: USERS[6], left: 200, plan: "Starter", days: 8 },
                    { who: USERS[1], left: 60, plan: "Starter", days: 9 },
                  ].map((a, i) => (
                    <div key={i} className="row between" style={{ padding: "9px 16px", borderBottom: "1px solid var(--br-border)" }}>
                      <div className="row" style={{ gap: 6 }}>
                        <div className={"avatar avatar--xs avatar--" + a.who.avatarKind}>{initials(a.who.name)}</div>
                        <div className="col" style={{ gap: 0 }}>
                          <span style={{ fontSize: 12, fontWeight: 500 }}>{a.who.name}</span>
                          <span className="muted" style={{ fontSize: 11 }}>{a.left} left · {a.plan}</span>
                        </div>
                      </div>
                      <button className="btn btn--secondary btn--xs">Top up</button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top-up rules */}
              <div className="card">
                <div className="card__head">
                  <h3 className="card__title">Auto top-up rules</h3>
                  <button className="btn btn--ghost btn--xs"><Icon name="plus" size={11} /> Rule</button>
                </div>
                <div className="card__body card__body--flush">
                  {[
                    { trigger: "Balance < 10%", action: "Refill 2,000 credits", scope: "Starter only" },
                    { trigger: "Expiring in 3d", action: "Notify owner", scope: "All plans" },
                    { trigger: "Balance = 0", action: "Pause AI features", scope: "Free only" },
                  ].map((r, i) => (
                    <div key={i} style={{ padding: "10px 16px", borderBottom: "1px solid var(--br-border)" }}>
                      <div className="row between">
                        <div className="col" style={{ gap: 1 }}>
                          <span style={{ fontSize: 12, fontWeight: 500 }}>{r.trigger} → <span style={{ color: "var(--br-primary)" }}>{r.action}</span></span>
                          <span className="muted" style={{ fontSize: 11 }}>{r.scope}</span>
                        </div>
                        <span style={{ width: 28, height: 16, borderRadius: 9999, background: "var(--br-primary)", position: "relative", display: "inline-block" }}>
                          <span style={{ position: "absolute", top: 2, left: 14, width: 12, height: 12, borderRadius: 9999, background: "#fff" }} />
                        </span>
                      </div>
                    </div>
                  ))}
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

Object.assign(window, { Tab_AdminInbox, Tab_Teams, Tab_Tenants, Tab_Tiers, Tab_Credits });
