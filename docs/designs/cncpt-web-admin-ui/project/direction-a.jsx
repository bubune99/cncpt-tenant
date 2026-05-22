/* Direction A — "Refined Classic": light, blue, conventional sidebar + content */

const DirA_Sidebar = ({ active = "users", role = "super" }) => {
  const superNav = [
    { h: "Manage" },
    { id: "users", label: "Users", icon: "users", badge: 3 },
    { id: "teams", label: "Teams", icon: "building-2" },
    { id: "tenants", label: "Tenants & Subdomains", icon: "globe" },
    { id: "tiers", label: "Subscription Tiers", icon: "credit-card" },
    { id: "credits", label: "AI Credits", icon: "sparkles" },
    { id: "overrides", label: "Permission Overrides", icon: "wand-2" },
    { h: "Operations" },
    { id: "feedback", label: "Feedback", icon: "message-square", badge: 12, badgeKind: "red" },
    { id: "activity", label: "Activity Log", icon: "history" },
    { id: "analytics", label: "Analytics", icon: "bar-chart-3" },
    { h: "Settings" },
    { id: "platform", label: "Platform Settings", icon: "settings" },
  ];
  const tenantNav = [
    { h: "Manage" },
    { id: "users", label: "Team Members", icon: "users", badge: 2 },
    { id: "designers", label: "Designers", icon: "palette" },
    { id: "permissions", label: "Permissions", icon: "shield" },
    { id: "credits", label: "Credits & Usage", icon: "sparkles" },
    { h: "Operations" },
    { id: "feedback", label: "Customer Feedback", icon: "message-square", badge: 4, badgeKind: "blue" },
    { id: "activity", label: "Activity", icon: "history" },
    { h: "Settings" },
    { id: "branding", label: "Branding", icon: "paint-bucket" },
    { id: "billing", label: "Billing", icon: "credit-card" },
  ];
  const items = role === "super" ? superNav : tenantNav;
  return (
    <aside className="dirA__rail">
      <div className="dirA__brand">
        <div className="dirA__brand-mark"><Icon name="palette" size={16} /></div>
        <div className="col" style={{ gap: 0 }}>
          <div className="dirA__brand-name">CNCPT Admin</div>
          <div className="dirA__brand-sub">cncpt-designer.com</div>
        </div>
      </div>
      <div className="dirA__role-switch">
        <button className={role === "super" ? "is-on" : ""}>Super Admin</button>
        <button className={role === "tenant" ? "is-on" : ""}>Tenant</button>
      </div>
      <nav className="dirA__nav">
        {items.map((it, i) =>
          it.h ? (
            <div className="dirA__nav-h" key={"h" + i}>{it.h}</div>
          ) : (
            <button
              key={it.id}
              className={"dirA__nav-item " + (active === it.id ? "is-active" : "")}
            >
              <Icon name={it.icon} size={15} />
              <span>{it.label}</span>
              {it.badge ? (
                <span className={"badge " + (it.badgeKind === "blue" ? "badge--blue" : "")}>{it.badge}</span>
              ) : null}
            </button>
          )
        )}
      </nav>
    </aside>
  );
};

const DirA_Topbar = ({ title, sub, right }) => (
  <header className="dirA__top">
    <div className="col" style={{ gap: 0 }}>
      <div style={{ fontWeight: 600, fontSize: 13.5 }}>{title}</div>
      {sub ? <div className="muted" style={{ fontSize: 11.5 }}>{sub}</div> : null}
    </div>
    <div className="dirA__search">
      <Icon name="search" size={14} />
      <span className="dirA__search-q">Search users, subdomains, feedback…</span>
      <span className="kbd">⌘K</span>
    </div>
    {right ?? (
      <>
        <button className="iconbtn"><Icon name="bell" size={14} /></button>
        <button className="iconbtn"><Icon name="life-buoy" size={14} /></button>
        <div className="avatar avatar--orange">SA</div>
      </>
    )}
  </header>
);

/* ---------------- A1 — Home (super admin) ---------------- */
const DirA_Home = () => (
  <div className="adm-board dirA">
    <DirA_Sidebar active="" role="super" />
    <div className="dirA__main">
      <DirA_Topbar title="Platform overview" sub="What needs you, right now" />
      <div className="dirA__page">
        {/* KPI strip */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 18 }}>
          {[
            { label: "Active users", v: PLATFORM_KPIS.users.v, d: PLATFORM_KPIS.users.d, trend: "up", icon: "users", tone: "blue" },
            { label: "Tenants", v: PLATFORM_KPIS.tenants.v, d: PLATFORM_KPIS.tenants.d, trend: "up", icon: "building-2", tone: "green" },
            { label: "MRR", v: PLATFORM_KPIS.mrr.v, d: PLATFORM_KPIS.mrr.d, trend: "up", icon: "credit-card", tone: "violet" },
            { label: "AI credits / mo", v: PLATFORM_KPIS.credits.v, d: PLATFORM_KPIS.credits.d, trend: "down", icon: "sparkles", tone: "amber" },
          ].map((k) => (
            <div className="card" key={k.label} style={{ padding: 14 }}>
              <div className="row between">
                <span className="muted" style={{ fontSize: 11.5 }}>{k.label}</span>
                <div className={"halo halo-" + k.tone} style={{
                  width: 28, height: 28, borderRadius: 7,
                  background: ({blue:"#dbeafe",green:"#dcfce7",violet:"#ede9fe",amber:"#fef3c7"})[k.tone],
                  color: ({blue:"#1d4ed8",green:"#15803d",violet:"#7e22ce",amber:"#a16207"})[k.tone],
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Icon name={k.icon} size={14} />
                </div>
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", marginTop: 8 }}>{k.v}</div>
              <div className={"pill " + (k.trend === "up" ? "pill--green" : "pill--rose")} style={{ marginTop: 6, fontSize: 10.5 }}>
                <Icon name={k.trend === "up" ? "trending-up" : "trending-down"} size={11} /> {k.d}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16 }}>
          {/* Attention queue */}
          <div className="card">
            <div className="card__head">
              <div className="row" style={{ gap: 8 }}>
                <h3 className="card__title">Attention queue</h3>
                <span className="pill pill--rose">{ATTENTION.length} items</span>
              </div>
              <button className="btn btn--ghost btn--xs">View all <Icon name="arrow-right" size={12} /></button>
            </div>
            <div className="card__body card__body--flush">
              {ATTENTION.map((a, i) => (
                <div key={i} style={{
                  display: "grid", gridTemplateColumns: "30px 1fr auto",
                  alignItems: "center", gap: 10,
                  padding: "11px 16px",
                  borderBottom: i < ATTENTION.length - 1 ? "1px solid var(--br-border)" : "0",
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 7,
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    background: ({request:"#fef3c7",feedback:"#dbeafe",subdomain:"#fee2e2",credits:"#fef3c7",tier:"#ede9fe"})[a.kind],
                    color: ({request:"#a16207",feedback:"#1d4ed8",subdomain:"#b91c1c",credits:"#a16207",tier:"#7e22ce"})[a.kind],
                  }}>
                    <Icon name={({request:"shield",feedback:"message-square",subdomain:"globe",credits:"sparkles",tier:"crown"})[a.kind]} size={14} />
                  </div>
                  <div className="col" style={{ gap: 1 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 500 }}>
                      {a.label}
                      {a.who ? (
                        <span className="muted" style={{ fontWeight: 400 }}> · {a.who.name}</span>
                      ) : null}
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

          {/* Activity */}
          <div className="card">
            <div className="card__head">
              <h3 className="card__title">Recent activity</h3>
              <button className="iconbtn iconbtn--ghost"><Icon name="refresh-cw" size={13} /></button>
            </div>
            <div className="card__body" style={{ padding: "8px 0" }}>
              {ACTIVITY.slice(0, 6).map((e, i) => (
                <div key={i} style={{
                  display: "grid", gridTemplateColumns: "26px 1fr auto",
                  alignItems: "flex-start", gap: 10,
                  padding: "8px 16px",
                }}>
                  <div className={"avatar avatar--xs avatar--" + e.who.avatarKind}>{initials(e.who.name)}</div>
                  <div className="col" style={{ gap: 1 }}>
                    <div style={{ fontSize: 12 }}>
                      <strong style={{ fontWeight: 600 }}>{e.who.name}</strong>{" "}
                      <span className="muted">{e.action}</span>{" "}
                      <span>{e.target}</span>
                    </div>
                    {e.who2 ? <div className="muted" style={{ fontSize: 11 }}>by {e.who2}</div> : null}
                  </div>
                  <span className="muted" style={{ fontSize: 11 }}>{e.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick action grid */}
        <div className="card" style={{ marginTop: 16 }}>
          <div className="card__head">
            <h3 className="card__title">Quick actions</h3>
            <span className="muted" style={{ fontSize: 11.5 }}>Common admin operations</span>
          </div>
          <div className="card__body" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
            {[
              { i: "user-plus", l: "Invite user" },
              { i: "shield", l: "Grant permission" },
              { i: "credit-card", l: "Change tier" },
              { i: "sparkles", l: "Top up credits" },
              { i: "globe", l: "Reassign subdomain" },
              { i: "ban", l: "Suspend user" },
              { i: "key", l: "Issue API key" },
              { i: "message-square", l: "Reply to feedback" },
            ].map((a) => (
              <button key={a.l} className="btn btn--secondary" style={{ justifyContent: "flex-start", padding: "10px 12px" }}>
                <Icon name={a.i} size={14} /> {a.l}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

/* ---------------- A2 — User detail ---------------- */
const DirA_UserDetail = () => {
  const u = USERS[0];
  return (
    <div className="adm-board dirA">
      <DirA_Sidebar active="users" role="super" />
      <div className="dirA__main">
        <DirA_Topbar title="Users" sub="Maya Patel · maya@northgear.co" />
        <div className="dirA__page">
          {/* Breadcrumb */}
          <div className="row" style={{ fontSize: 12, marginBottom: 12 }}>
            <span className="muted">Users</span>
            <Icon name="chevron-right" size={12} style={{ color: "#94a3b8" }} />
            <span style={{ fontWeight: 500 }}>{u.name}</span>
          </div>

          {/* Profile header */}
          <div className="card" style={{ marginBottom: 14 }}>
            <div style={{ padding: "18px 18px", display: "flex", gap: 16 }}>
              <div className={"avatar avatar--lg avatar--" + u.avatarKind}>{initials(u.name)}</div>
              <div className="col" style={{ gap: 4, flex: 1 }}>
                <div className="row" style={{ gap: 8 }}>
                  <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, letterSpacing: "-0.01em" }}>{u.name}</h2>
                  <span className="pill pill--green"><span className="dot" />Active</span>
                  <span className="pill pill--violet"><Icon name="crown" size={11} /> {u.tier}</span>
                  <span className="pill"><Icon name="building-2" size={11} /> {u.tenant}</span>
                </div>
                <div className="muted" style={{ fontSize: 12.5 }}>
                  {u.email} · joined {u.joined} · last active {u.lastActive}
                </div>
              </div>
              <div className="row" style={{ gap: 6 }}>
                <button className="btn btn--secondary"><Icon name="mail" size={14} /> Email</button>
                <button className="btn btn--secondary"><Icon name="log-in" size={14} /> Impersonate</button>
                <button className="btn btn--secondary"><Icon name="key-round" size={14} /> Reset password</button>
                <button className="btn btn--danger"><Icon name="ban" size={14} /> Suspend</button>
              </div>
            </div>
            {/* Tabs */}
            <div style={{ display: "flex", gap: 0, padding: "0 6px", borderTop: "1px solid var(--br-border)" }}>
              {["Overview","Permissions","Subdomains","AI Credits","Activity","Notes"].map((t, i) => (
                <button key={t} style={{
                  border: 0, background: "transparent", padding: "10px 14px",
                  fontSize: 12.5, fontWeight: 500, color: i === 1 ? "var(--br-primary)" : "var(--br-text-secondary)",
                  borderBottom: i === 1 ? "2px solid var(--br-primary)" : "2px solid transparent",
                  marginBottom: -1,
                }}>{t}</button>
              ))}
            </div>
          </div>

          {/* Permissions tab content */}
          <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 14 }}>
            <div className="card">
              <div className="card__head">
                <div className="col" style={{ gap: 2 }}>
                  <h3 className="card__title">Permissions</h3>
                  <p className="card__sub">Inherited from tier · overrides shown with orange marker</p>
                </div>
                <div className="row" style={{ gap: 6 }}>
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
                        padding: "8px 16px", background: "var(--br-surface)",
                        fontSize: 10.5, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase",
                        color: "var(--br-text-secondary)",
                      }}>{g}</div>
                      {rows.map((p) => (
                        <div key={p.key} className="row between" style={{ padding: "10px 16px", borderBottom: "1px solid var(--br-border)" }}>
                          <div className="col" style={{ gap: 2 }}>
                            <div className="row" style={{ gap: 6, fontSize: 12.5 }}>
                              <span>{p.label}</span>
                              {p.scope === "override" ? (
                                <span className="pill pill--amber" style={{ fontSize: 10 }}>override</span>
                              ) : (
                                <span className="muted" style={{ fontSize: 10.5 }}>{p.scope}</span>
                              )}
                            </div>
                            <span className="muted mono" style={{ fontSize: 10.5 }}>{p.key}</span>
                          </div>
                          <div className="row" style={{ gap: 8 }}>
                            <button className={"toggle " + (p.on ? "is-on" : "")} style={{
                              width: 30, height: 17, padding: 0, borderRadius: 9999, border: 0,
                              background: p.on ? "var(--br-primary)" : "#cbd5e1", position: "relative",
                            }}>
                              <span style={{
                                position: "absolute", top: 2, left: p.on ? 15 : 2,
                                width: 13, height: 13, borderRadius: 9999, background: "#fff",
                              }} />
                            </button>
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
                <div className="card__head"><h3 className="card__title">AI Credits</h3><a className="muted" style={{ fontSize: 11.5 }}>Adjust →</a></div>
                <div className="card__body" style={{ paddingTop: 6 }}>
                  <div style={{ fontSize: 26, fontWeight: 700 }}>{u.credits.toLocaleString()} <span className="muted" style={{ fontSize: 12, fontWeight: 400 }}>credits</span></div>
                  <div style={{ height: 6, borderRadius: 9999, background: "#f1f5f9", overflow: "hidden", marginTop: 8 }}>
                    <div style={{ width: "62%", height: "100%", background: "var(--gr-blue-purple)" }} />
                  </div>
                  <div className="row between muted" style={{ fontSize: 11, marginTop: 4 }}>
                    <span>5,200 used this cycle</span>
                    <span>Resets Jun 1</span>
                  </div>
                </div>
              </div>
              <div className="card">
                <div className="card__head"><h3 className="card__title">Subdomains owned</h3></div>
                <div className="card__body card__body--flush">
                  {SUBDOMAINS.filter((s) => s.owner?.id === u.id).concat([{ sub: "northgear-dev", owner: u, teams: 1, traffic: "—", health: "ok" }]).map((s, i) => (
                    <div key={i} className="row between" style={{ padding: "11px 16px", borderBottom: "1px solid var(--br-border)" }}>
                      <div className="col" style={{ gap: 2 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 500 }}>{s.sub}.cncpt-designer.com</div>
                        <div className="muted" style={{ fontSize: 11 }}>{s.teams} teams · {s.traffic}</div>
                      </div>
                      <button className="btn btn--ghost btn--xs">Manage <Icon name="arrow-right" size={11} /></button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="card">
                <div className="card__head"><h3 className="card__title">Recent activity</h3></div>
                <div className="card__body" style={{ paddingTop: 6 }}>
                  {ACTIVITY.slice(0, 4).map((e, i) => (
                    <div key={i} className="row" style={{ alignItems: "flex-start", gap: 8, padding: "6px 0" }}>
                      <div style={{
                        width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                        background: "#f1f5f9", color: "#475569",
                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                      }}><Icon name={e.icon} size={11} /></div>
                      <div className="col" style={{ gap: 0, flex: 1 }}>
                        <div style={{ fontSize: 12 }}>
                          <span className="muted">{e.action}</span> {e.target}
                        </div>
                        <span className="muted" style={{ fontSize: 10.5 }}>{e.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ---------------- A3 — Bulk action ---------------- */
const DirA_Bulk = () => {
  const selected = new Set(["u_002", "u_004", "u_007", "u_009"]);
  return (
    <div className="adm-board dirA">
      <DirA_Sidebar active="users" role="super" />
      <div className="dirA__main">
        <DirA_Topbar title="Users" sub={USERS.length + " users in platform"} />
        <div className="dirA__page" style={{ paddingBottom: 88 }}>
          {/* Filters */}
          <div className="row" style={{ gap: 8, marginBottom: 12 }}>
            <div className="dirA__search" style={{ flex: 0, minWidth: 280 }}>
              <Icon name="search" size={14} />
              <span className="dirA__search-q">Search users…</span>
            </div>
            <button className="btn btn--secondary btn--xs"><Icon name="filter" size={12} /> Tier: any</button>
            <button className="btn btn--secondary btn--xs"><Icon name="filter" size={12} /> Status: any</button>
            <button className="btn btn--secondary btn--xs"><Icon name="filter" size={12} /> Tenant: any</button>
            <button className="btn btn--secondary btn--xs"><Icon name="filter" size={12} /> Last active: any</button>
            <div style={{ flex: 1 }} />
            <button className="btn btn--secondary"><Icon name="download" size={13} /> Export</button>
            <button className="btn btn--primary"><Icon name="user-plus" size={13} /> Invite user</button>
          </div>

          {/* Table */}
          <div className="card" style={{ overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, fontSize: 12.5 }}>
              <thead>
                <tr>
                  {["", "User", "Tenant", "Role", "Tier", "Credits", "Status", "Last active", ""].map((h, i) => (
                    <th key={i} style={{
                      textAlign: "left", padding: "10px 12px",
                      fontSize: 10.5, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase",
                      color: "var(--br-text-secondary)", background: "var(--br-surface)",
                      borderBottom: "1px solid var(--br-border)",
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {USERS.map((u) => {
                  const sel = selected.has(u.id);
                  return (
                    <tr key={u.id} style={{ background: sel ? "#eff6ff" : "transparent" }}>
                      <td style={{ padding: "10px 12px", borderBottom: "1px solid var(--br-border)", width: 32 }}>
                        <span style={{
                          width: 16, height: 16, borderRadius: 4,
                          border: "1px solid " + (sel ? "var(--br-primary)" : "#cbd5e1"),
                          background: sel ? "var(--br-primary)" : "#fff",
                          display: "inline-flex", alignItems: "center", justifyContent: "center",
                        }}>{sel ? <Icon name="check" size={11} style={{ color: "#fff" }} /> : null}</span>
                      </td>
                      <td style={{ padding: "10px 12px", borderBottom: "1px solid var(--br-border)" }}>
                        <div className="row">
                          <div className={"avatar avatar--sm avatar--" + u.avatarKind}>{initials(u.name)}</div>
                          <div className="col" style={{ gap: 1 }}>
                            <div style={{ fontWeight: 500 }}>{u.name}</div>
                            <div className="muted" style={{ fontSize: 11 }}>{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "10px 12px", borderBottom: "1px solid var(--br-border)" }}>
                        <span className="mono" style={{ fontSize: 11.5 }}>{u.tenant}</span>
                      </td>
                      <td style={{ padding: "10px 12px", borderBottom: "1px solid var(--br-border)" }}>{u.role}</td>
                      <td style={{ padding: "10px 12px", borderBottom: "1px solid var(--br-border)" }}>
                        <span className={"pill " + (u.tier === "DTF Pro" ? "pill--violet" : u.tier === "Business" ? "pill--blue" : "")} style={{ fontSize: 10.5 }}>{u.tier}</span>
                      </td>
                      <td style={{ padding: "10px 12px", borderBottom: "1px solid var(--br-border)", fontVariantNumeric: "tabular-nums" }}>{u.credits.toLocaleString()}</td>
                      <td style={{ padding: "10px 12px", borderBottom: "1px solid var(--br-border)" }}>
                        <span className={"pill " + (u.status === "active" ? "pill--green" : u.status === "suspended" ? "pill--rose" : "pill--slate")}>
                          <span className="dot" />{u.status}
                        </span>
                      </td>
                      <td style={{ padding: "10px 12px", borderBottom: "1px solid var(--br-border)", color: "var(--br-text-secondary)" }}>{u.lastActive}</td>
                      <td style={{ padding: "10px 12px", borderBottom: "1px solid var(--br-border)" }}>
                        <button className="iconbtn iconbtn--sm iconbtn--ghost"><Icon name="more-horizontal" size={13} /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bulk action bar */}
        <div style={{
          position: "absolute", bottom: 20, left: "calc(232px + 50%)", transform: "translateX(-50%)",
          background: "#0f172a", color: "#fff", borderRadius: 12,
          padding: "9px 9px 9px 16px", display: "flex", alignItems: "center", gap: 8,
          boxShadow: "0 12px 28px -6px rgba(15,23,42,0.4), 0 8px 16px -8px rgba(15,23,42,0.4)",
          minWidth: 720,
        }}>
          <span style={{ fontSize: 12.5, fontWeight: 500 }}>
            <span style={{
              background: "#1d4ed8", padding: "2px 7px", borderRadius: 9999,
              marginRight: 8, fontVariantNumeric: "tabular-nums",
            }}>4</span>
            selected
          </span>
          <span style={{ opacity: 0.4 }}>·</span>
          <button className="btn btn--xs" style={{ background: "rgba(255,255,255,0.08)", color: "#fff", borderColor: "transparent" }}>
            <Icon name="shield" size={12} /> Grant permission
          </button>
          <button className="btn btn--xs" style={{ background: "rgba(255,255,255,0.08)", color: "#fff", borderColor: "transparent" }}>
            <Icon name="crown" size={12} /> Change tier
          </button>
          <button className="btn btn--xs" style={{ background: "rgba(255,255,255,0.08)", color: "#fff", borderColor: "transparent" }}>
            <Icon name="sparkles" size={12} /> Top up credits
          </button>
          <button className="btn btn--xs" style={{ background: "rgba(255,255,255,0.08)", color: "#fff", borderColor: "transparent" }}>
            <Icon name="mail" size={12} /> Email
          </button>
          <button className="btn btn--xs" style={{ background: "rgba(255,255,255,0.08)", color: "#fff", borderColor: "transparent" }}>
            <Icon name="ban" size={12} /> Suspend
          </button>
          <span style={{ opacity: 0.4 }}>·</span>
          <button className="btn btn--xs" style={{ background: "transparent", color: "#94a3b8" }}>Clear</button>
        </div>
      </div>
    </div>
  );
};

/* ---------------- A4 — Feedback ---------------- */
const DirA_Feedback = () => {
  const f = FEEDBACK[3];
  return (
    <div className="adm-board dirA">
      <DirA_Sidebar active="feedback" role="super" />
      <div className="dirA__main">
        <DirA_Topbar title="Feedback" sub="42 open · 8 high priority · NPS 47" />
        <div className="dirA__page" style={{ padding: 0, display: "grid", gridTemplateColumns: "1fr 1.2fr", height: "100%" }}>
          {/* Left: list */}
          <div className="col" style={{ borderRight: "1px solid var(--br-border)", minWidth: 0, overflow: "hidden" }}>
            {/* Tabs */}
            <div className="row" style={{ borderBottom: "1px solid var(--br-border)", padding: "0 14px", background: "#fff", gap: 0 }}>
              {[
                { l: "Inbox", n: 12, on: true },
                { l: "Triaged", n: 8 },
                { l: "In progress", n: 6 },
                { l: "Shipped", n: 32 },
                { l: "All", n: 124 },
              ].map((t) => (
                <button key={t.l} style={{
                  border: 0, background: "transparent", padding: "11px 12px",
                  fontSize: 12, fontWeight: 500, color: t.on ? "var(--br-primary)" : "var(--br-text-secondary)",
                  borderBottom: t.on ? "2px solid var(--br-primary)" : "2px solid transparent",
                  marginBottom: -1,
                }}>{t.l} <span className="muted" style={{ fontSize: 11 }}>{t.n}</span></button>
              ))}
              <div style={{ flex: 1 }} />
              <button className="btn btn--secondary btn--xs"><Icon name="filter" size={12} /> Filters</button>
            </div>
            {/* List */}
            <div style={{ overflow: "auto", background: "#fff", flex: 1 }}>
              {FEEDBACK.map((it, i) => {
                const active = it.id === f.id;
                return (
                  <div key={it.id} style={{
                    padding: "12px 14px", borderBottom: "1px solid var(--br-border)",
                    background: active ? "#eff6ff" : "transparent",
                    borderLeft: active ? "3px solid var(--br-primary)" : "3px solid transparent",
                    cursor: "pointer",
                  }}>
                    <div className="row between">
                      <div className="row">
                        <div className={"avatar avatar--sm avatar--" + it.from.avatarKind}>{initials(it.from.name)}</div>
                        <div className="col" style={{ gap: 1 }}>
                          <div style={{ fontSize: 12.5, fontWeight: 600 }}>{it.from.name} <span className="muted" style={{ fontWeight: 400 }}>· {it.from.tenant}</span></div>
                          <div className="row" style={{ gap: 6, fontSize: 11.5 }}>
                            <span style={{ fontWeight: 500 }}>{it.topic}</span>
                          </div>
                        </div>
                      </div>
                      <div className="col" style={{ alignItems: "flex-end", gap: 3 }}>
                        <span className="muted" style={{ fontSize: 11 }}>{it.time}</span>
                        <div className="row" style={{ gap: 4 }}>
                          {it.priority === "high" ? <span className="pill pill--rose" style={{ fontSize: 10 }}><Icon name="alert-triangle" size={10} /> high</span> : null}
                          <span className={"pill " + ({ negative: "pill--rose", positive: "pill--green", neutral: "pill--slate" })[it.sentiment]} style={{ fontSize: 10 }}>
                            <Icon name={it.sentiment === "positive" ? "smile" : it.sentiment === "negative" ? "frown" : "meh"} size={10} />
                            CSAT {it.csat}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="muted" style={{ fontSize: 11.5, marginTop: 6, lineHeight: 1.45, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{it.excerpt}</div>
                    <div className="row" style={{ gap: 4, marginTop: 7 }}>
                      {it.tags.map((t) => <span key={t} className="tag-sm">#{t}</span>)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: detail */}
          <div className="col" style={{ background: "var(--br-surface)", overflow: "auto" }}>
            <div style={{ padding: "16px 22px 0" }}>
              <div className="row between">
                <div className="col" style={{ gap: 4 }}>
                  <div className="row" style={{ gap: 6 }}>
                    <span className="muted" style={{ fontSize: 11.5 }}>FB-{f.id.replace("f_","")}</span>
                    <span className="pill pill--rose" style={{ fontSize: 10.5 }}><Icon name="alert-triangle" size={11} /> High priority</span>
                    <span className="pill pill--blue" style={{ fontSize: 10.5 }}>{f.shipStatus}</span>
                  </div>
                  <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, letterSpacing: "-0.01em" }}>{f.topic}</h2>
                </div>
                <div className="row" style={{ gap: 6 }}>
                  <button className="btn btn--secondary btn--xs"><Icon name="link-2" size={12} /> Copy link</button>
                  <button className="btn btn--secondary btn--xs"><Icon name="external-link" size={12} /> Open user</button>
                  <button className="iconbtn iconbtn--sm"><Icon name="more-horizontal" size={13} /></button>
                </div>
              </div>

              {/* Meta strip */}
              <div className="row" style={{ gap: 14, marginTop: 14, marginBottom: 14, flexWrap: "wrap" }}>
                {[
                  { l: "Sentiment", v: "Negative", c: "pill--rose", i: "frown" },
                  { l: "CSAT", v: f.csat + "/5", c: "pill--rose", i: "star" },
                  { l: "NPS", v: f.nps, c: "pill--rose", i: "gauge" },
                  { l: "Channel", v: f.channel, c: "pill--slate", i: "inbox" },
                  { l: "Replies", v: f.replies, c: "pill--slate", i: "message-circle" },
                ].map((m) => (
                  <div key={m.l} className="col" style={{ gap: 3 }}>
                    <span className="eyebrow">{m.l}</span>
                    <span className={"pill " + m.c} style={{ alignSelf: "flex-start" }}>
                      <Icon name={m.i} size={11} /> {m.v}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Customer card */}
            <div style={{ padding: "0 22px" }}>
              <div className="card" style={{ marginBottom: 14 }}>
                <div style={{ padding: 14, display: "flex", gap: 12 }}>
                  <div className={"avatar avatar--lg avatar--" + f.from.avatarKind}>{initials(f.from.name)}</div>
                  <div className="col" style={{ gap: 3, flex: 1 }}>
                    <div className="row" style={{ gap: 6 }}>
                      <strong style={{ fontSize: 13.5 }}>{f.from.name}</strong>
                      <span className="pill pill--violet" style={{ fontSize: 10.5 }}><Icon name="crown" size={10} /> {f.from.tier}</span>
                      <span className="pill" style={{ fontSize: 10.5 }}><Icon name="building-2" size={10} /> {f.from.tenant}</span>
                    </div>
                    <div className="muted" style={{ fontSize: 11.5 }}>{f.from.email}</div>
                    <div className="row" style={{ gap: 14, marginTop: 4, fontSize: 11.5 }}>
                      <span><strong>2.4k</strong> <span className="muted">designs created</span></span>
                      <span><strong>$2,180</strong> <span className="muted">LTV</span></span>
                      <span><strong>14 mo</strong> <span className="muted">tenure</span></span>
                    </div>
                  </div>
                  <button className="btn btn--secondary btn--xs"><Icon name="arrow-up-right" size={12} /> Open profile</button>
                </div>
              </div>

              {/* Message */}
              <div className="card" style={{ marginBottom: 14 }}>
                <div className="card__body" style={{ padding: 16, fontSize: 13.5, lineHeight: 1.6 }}>
                  <p style={{ margin: 0 }}>{f.excerpt}</p>
                  <p style={{ margin: "10px 0 0", color: "var(--br-text-secondary)" }}>
                    "We're a $1.2M Shopify store and our weekend traffic spikes regularly hit the limit.
                    Can we get a higher rate-limit tier, or at least exponential backoff in the webhook
                    queue? Right now retries just stack up and we have to manually re-fire them in the
                    admin."
                  </p>
                  <div className="row" style={{ gap: 6, marginTop: 12 }}>
                    {f.tags.map((t) => <span key={t} className="tag-sm">#{t}</span>)}
                  </div>
                </div>
              </div>

              {/* Triage panel */}
              <div className="card" style={{ marginBottom: 14 }}>
                <div className="card__head"><h3 className="card__title">Triage</h3></div>
                <div className="card__body" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {[
                    { l: "Status", v: "In progress", icon: "circle-dot" },
                    { l: "Priority", v: "High", icon: "alert-triangle" },
                    { l: "Assignee", v: "Eng · Webhooks team", icon: "users" },
                    { l: "Ship status", v: "ETA: v2.41 (Jun 4)", icon: "rocket" },
                    { l: "Linked ticket", v: "WH-218", icon: "external-link" },
                    { l: "Affected users", v: "14 tenants", icon: "users" },
                  ].map((m) => (
                    <div key={m.l} className="row between" style={{ padding: "8px 0", borderBottom: "1px solid var(--br-border)" }}>
                      <span className="muted" style={{ fontSize: 11.5 }}>{m.l}</span>
                      <span className="row" style={{ gap: 5, fontSize: 12 }}><Icon name={m.icon} size={12} /> {m.v}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reply composer */}
              <div className="card" style={{ marginBottom: 18 }}>
                <div className="card__head">
                  <h3 className="card__title">Reply to Tomás</h3>
                  <div className="row" style={{ gap: 5 }}>
                    <button className="btn btn--ghost btn--xs"><Icon name="sparkles" size={12} /> Draft with AI</button>
                    <button className="btn btn--ghost btn--xs"><Icon name="files" size={12} /> Templates</button>
                  </div>
                </div>
                <div style={{ padding: 14, fontSize: 13, color: "var(--br-text-secondary)", lineHeight: 1.55 }}>
                  Hi Tomás — thanks for the detail. We've prioritized this for the v2.41 release (Jun 4)
                  and bumped your tenant to the 200/min tier in the meantime. I'll loop back once the
                  exponential-backoff queue is live…
                </div>
                <div className="row between" style={{ padding: "10px 14px", borderTop: "1px solid var(--br-border)" }}>
                  <div className="row" style={{ gap: 5 }}>
                    <button className="iconbtn iconbtn--sm iconbtn--ghost"><Icon name="paperclip" size={13} /></button>
                    <button className="iconbtn iconbtn--sm iconbtn--ghost"><Icon name="image" size={13} /></button>
                    <button className="iconbtn iconbtn--sm iconbtn--ghost"><Icon name="link" size={13} /></button>
                  </div>
                  <div className="row" style={{ gap: 6 }}>
                    <button className="btn btn--secondary btn--xs">Save draft</button>
                    <button className="btn btn--primary btn--xs"><Icon name="send" size={12} /> Send & resolve</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { DirA_Home, DirA_UserDetail, DirA_Bulk, DirA_Feedback });
