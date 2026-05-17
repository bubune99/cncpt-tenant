/* Direction B — "Inbox Workspace" : Linear-esque, dense, keyboard-first */

const DirB_Sidebar = ({ active = "inbox", role = "super" }) => {
  const superNav = [
    { id: "inbox", label: "Inbox", icon: "inbox", badge: 18, hot: true },
    { id: "my-issues", label: "My queue", icon: "circle-dashed", badge: 6 },
    { h: "Workspace" },
    { id: "users", label: "Users", icon: "users", badge: 12408 },
    { id: "teams", label: "Teams", icon: "building", badge: 1072 },
    { id: "tenants", label: "Tenants", icon: "globe", badge: 1072 },
    { id: "permissions", label: "Permissions", icon: "shield" },
    { id: "credits", label: "Credits", icon: "sparkles" },
    { id: "tiers", label: "Tiers", icon: "credit-card" },
    { h: "Feedback" },
    { id: "feedback", label: "All feedback", icon: "message-square", badge: 124 },
    { id: "triage", label: "Triage board", icon: "kanban-square", badge: 18 },
    { id: "shipped", label: "Shipped", icon: "rocket" },
    { h: "Insights" },
    { id: "analytics", label: "Analytics", icon: "bar-chart-3" },
    { id: "audit", label: "Audit log", icon: "history" },
    { id: "health", label: "Platform health", icon: "activity" },
  ];
  return (
    <aside className="dirB__rail">
      <div className="dirB__brand">
        <div className="dirB__brand-mark"><Icon name="palette" size={13} /></div>
        <span className="dirB__brand-name">CNCPT · admin</span>
        <Icon name="chevrons-up-down" size={12} className="dirB__brand-chev" />
      </div>
      <div style={{ padding: "0 8px" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "5px 8px", borderRadius: 5,
          background: "#f5f5f5", border: "1px solid #ececec",
          fontSize: 12, color: "#71717a",
        }}>
          <Icon name="search" size={12} />
          <span style={{ flex: 1 }}>Search…</span>
          <span className="kbd" style={{ background: "#fff", borderColor: "#ececec" }}>⌘K</span>
        </div>
      </div>
      <nav className="dirB__nav">
        {superNav.map((it, i) =>
          it.h ? (
            <div className="dirB__nav-h" key={"h" + i}>
              <Icon name="chevron-down" size={11} style={{ color: "#a1a1aa" }} />
              {it.h}
            </div>
          ) : (
            <button key={it.id} className={"dirB__nav-item " + (active === it.id ? "is-active" : "")}>
              <Icon name={it.icon} size={14} />
              <span>{it.label}</span>
              {it.badge !== undefined ? (
                <span className="badge" style={ it.hot ? { color: "#dc2626", fontWeight: 600 } : {} }>
                  {typeof it.badge === "number" && it.badge >= 1000 ? (it.badge / 1000).toFixed(1) + "k" : it.badge}
                </span>
              ) : null}
            </button>
          )
        )}
      </nav>
      <div style={{ padding: 10, borderTop: "1px solid #ececec", display: "flex", alignItems: "center", gap: 8 }}>
        <div className="avatar avatar--sm avatar--orange">SA</div>
        <div className="col" style={{ gap: 0, flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 500 }}>Sam Ariza</div>
          <div className="muted" style={{ fontSize: 10.5 }}>super admin</div>
        </div>
        <Icon name="more-horizontal" size={14} style={{ color: "#71717a" }} />
      </div>
    </aside>
  );
};

const DirB_Top = ({ crumbs, right }) => (
  <header className="dirB__top">
    <div className="dirB__crumbs">
      {crumbs.map((c, i) => (
        <React.Fragment key={i}>
          <span className={i === crumbs.length - 1 ? "dirB__crumb-active" : "muted"}>{c}</span>
          {i < crumbs.length - 1 ? <Icon name="chevron-right" size={12} /> : null}
        </React.Fragment>
      ))}
    </div>
    <div style={{ flex: 1 }} />
    {right ?? (
      <>
        <button className="btn btn--ghost btn--xs"><Icon name="filter" size={12} /> Filter</button>
        <button className="btn btn--ghost btn--xs"><Icon name="arrow-down-up" size={12} /> Group</button>
        <button className="btn btn--ghost btn--xs"><Icon name="sliders-horizontal" size={12} /> Display</button>
        <span className="kbd">N</span>
      </>
    )}
  </header>
);

/* ---------------- B1 — Home / Inbox ---------------- */
const DirB_Home = () => {
  const INBOX = [
    { id: "ADM-218", kind: "permission_request", who: USERS[1], summary: "wants access to DTF Gang Sheet", time: "14m", status: "new", prio: "med", tags: ["dtf","tier"] },
    { id: "ADM-217", kind: "feedback", who: USERS[3], summary: "AI credits expiring — wants refund", time: "1h", status: "new", prio: "high", tags: ["billing","credits"] },
    { id: "ADM-216", kind: "alert", who: null, summary: "Subdomain ‘craftshop’ has no owner since Owen was suspended", time: "2h", status: "new", prio: "high", tags: ["subdomain","orphaned"] },
    { id: "ADM-215", kind: "credits_low", who: USERS[3], summary: "0 credits remaining on Starter plan", time: "5h", status: "new", prio: "low", tags: ["credits"] },
    { id: "ADM-214", kind: "feedback", who: USERS[2], summary: "Praise: bulk variation editor saved 6 hours", time: "5h", status: "triaged", prio: "low", tags: ["praise"] },
    { id: "ADM-213", kind: "tier_upgrade", who: USERS[8], summary: "Requested DTF Pro for next week's job", time: "1d", status: "triaged", prio: "med", tags: ["tier"] },
    { id: "ADM-212", kind: "feedback", who: USERS[7], summary: "API rate limit — webhooks throttled", time: "1d", status: "in_progress", prio: "high", tags: ["api","perf"] },
    { id: "ADM-211", kind: "permission_request", who: USERS[8], summary: "wants DTF Pro permission set", time: "2d", status: "triaged", prio: "med", tags: ["dtf"] },
  ];
  const kindMeta = {
    permission_request: { icon: "shield", color: "#a16207", bg: "#fef3c7" },
    feedback: { icon: "message-square", color: "#1d4ed8", bg: "#dbeafe" },
    alert: { icon: "alert-triangle", color: "#b91c1c", bg: "#fee2e2" },
    credits_low: { icon: "sparkles", color: "#9333ea", bg: "#ede9fe" },
    tier_upgrade: { icon: "crown", color: "#7e22ce", bg: "#ede9fe" },
  };
  return (
    <div className="adm-board dirB">
      <DirB_Sidebar active="inbox" role="super" />
      <div className="dirB__main">
        <DirB_Top crumbs={["Admin","Inbox"]} />
        <div className="dirB__filter-bar">
          <span className="dirB__chip dirB__chip--on"><Icon name="circle" size={11} /> Status: open <strong style={{ marginLeft: 4 }}>18</strong></span>
          <span className="dirB__chip"><Icon name="user" size={11} /> Assignee: any</span>
          <span className="dirB__chip"><Icon name="alert-triangle" size={11} /> Priority: any</span>
          <span className="dirB__chip"><Icon name="hash" size={11} /> Type: any</span>
          <div style={{ flex: 1 }} />
          <span className="muted" style={{ fontSize: 11 }}>Sort: priority</span>
          <span className="dirB__chip"><Icon name="sliders-horizontal" size={11} /> Display</span>
        </div>

        <div className="dirB__list">
          {/* Section A: needs you */}
          {[
            { h: "Needs you", count: 4, rows: INBOX.slice(0,4) },
            { h: "Triaged", count: 2, rows: INBOX.slice(4,6) },
            { h: "In progress", count: 2, rows: INBOX.slice(6,8) },
          ].map((sec) => (
            <div key={sec.h}>
              <div style={{
                background: "#fafafa", padding: "6px 14px",
                display: "flex", alignItems: "center", gap: 8,
                fontSize: 11.5, fontWeight: 500, color: "#3f3f46",
                borderBottom: "1px solid #ececec", borderTop: "1px solid #ececec",
              }}>
                <Icon name="chevron-down" size={11} style={{ color: "#71717a" }} />
                {sec.h}
                <span style={{ color: "#a1a1aa", fontVariantNumeric: "tabular-nums" }}>{sec.count}</span>
                <div style={{ flex: 1 }} />
                <button className="btn btn--ghost btn--xs"><Icon name="plus" size={11} /></button>
              </div>
              {sec.rows.map((r) => {
                const km = kindMeta[r.kind];
                return (
                  <div key={r.id} style={{
                    display: "grid",
                    gridTemplateColumns: "20px 88px 22px 22px 1fr auto",
                    alignItems: "center", gap: 10,
                    padding: "8px 14px", borderBottom: "1px solid #f4f4f5",
                    fontSize: 12.5,
                  }}>
                    <span style={{
                      width: 14, height: 14, borderRadius: 3, border: "1.5px solid #d4d4d8", display: "inline-block",
                    }} />
                    <span className="muted mono" style={{ fontSize: 11 }}>{r.id}</span>
                    <span style={{
                      width: 22, height: 22, borderRadius: 5,
                      background: km.bg, color: km.color,
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                    }}><Icon name={km.icon} size={12} /></span>
                    <span style={{
                      width: 12, height: 12, borderRadius: 9999,
                      background: r.prio === "high" ? "#ef4444" : r.prio === "med" ? "#f59e0b" : "#a1a1aa",
                    }} />
                    <div className="row" style={{ minWidth: 0, gap: 8 }}>
                      <span style={{ fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {r.who ? <>{r.who.name} </> : null}
                        <span style={{ fontWeight: 400, color: "#52525b" }}>{r.summary}</span>
                      </span>
                      <div className="row" style={{ gap: 4 }}>
                        {r.tags.map((t) => (
                          <span key={t} className="tag-sm" style={{ background: "#f4f4f5", borderColor: "transparent", color: "#52525b" }}>{t}</span>
                        ))}
                      </div>
                    </div>
                    <div className="row" style={{ gap: 8, color: "#71717a", fontSize: 11 }}>
                      {r.who ? <div className={"avatar avatar--xs avatar--" + r.who.avatarKind}>{initials(r.who.name)}</div> : <span style={{ width: 20 }} />}
                      <span style={{ width: 38, textAlign: "right" }}>{r.time}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ---------------- B2 — User detail (list + detail + activity rail) ---------------- */
const DirB_UserDetail = () => {
  const u = USERS[0];
  return (
    <div className="adm-board dirB">
      <DirB_Sidebar active="users" role="super" />
      <div className="dirB__main">
        <DirB_Top crumbs={["Workspace","Users","Maya Patel"]} right={
          <>
            <span className="kbd">J</span><span className="muted" style={{ fontSize: 11 }}>prev</span>
            <span className="kbd">K</span><span className="muted" style={{ fontSize: 11 }}>next</span>
            <button className="btn btn--ghost btn--xs"><Icon name="x" size={12} /></button>
          </>
        } />
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "220px 1fr 280px", minHeight: 0 }}>
          {/* Left mini list */}
          <div style={{ borderRight: "1px solid #ececec", background: "#fff", overflow: "auto" }}>
            <div style={{ padding: "8px 12px", borderBottom: "1px solid #ececec", display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "#71717a" }}>
              <Icon name="users" size={11} /> Users
              <span style={{ marginLeft: "auto", fontVariantNumeric: "tabular-nums" }}>10</span>
            </div>
            {USERS.map((x, i) => (
              <div key={x.id} style={{
                padding: "8px 12px",
                background: x.id === u.id ? "#f4f4f5" : "transparent",
                borderLeft: x.id === u.id ? "2px solid #18181b" : "2px solid transparent",
                display: "flex", alignItems: "center", gap: 8,
              }}>
                <div className={"avatar avatar--xs avatar--" + x.avatarKind}>{initials(x.name)}</div>
                <div className="col" style={{ gap: 0, minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: x.id === u.id ? 600 : 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{x.name}</div>
                  <div className="muted" style={{ fontSize: 10.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{x.tenant} · {x.role}</div>
                </div>
                {x.flag === "permission_request" ? <span style={{ width: 7, height: 7, borderRadius: 9999, background: "#f59e0b" }} /> : null}
              </div>
            ))}
          </div>

          {/* Detail */}
          <div style={{ overflow: "auto", padding: 22, background: "#fff", minWidth: 0 }}>
            {/* Header */}
            <div className="row" style={{ gap: 14 }}>
              <div className={"avatar avatar--lg avatar--" + u.avatarKind}>{initials(u.name)}</div>
              <div className="col" style={{ gap: 2, flex: 1 }}>
                <div className="row" style={{ gap: 8 }}>
                  <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600, letterSpacing: "-0.01em" }}>{u.name}</h2>
                  <span className="pill pill--green" style={{ fontSize: 10.5 }}><span className="dot" /> active</span>
                </div>
                <div className="muted mono" style={{ fontSize: 11 }}>{u.email}  ·  user_{u.id.replace("u_","")}</div>
              </div>
              <div className="row" style={{ gap: 4 }}>
                <button className="iconbtn iconbtn--sm"><Icon name="mail" size={12} /></button>
                <button className="iconbtn iconbtn--sm"><Icon name="key-round" size={12} /></button>
                <button className="iconbtn iconbtn--sm"><Icon name="log-in" size={12} /></button>
                <button className="btn btn--secondary btn--xs"><Icon name="more-horizontal" size={12} /></button>
              </div>
            </div>

            {/* Property strip */}
            <div style={{
              display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 1,
              marginTop: 14, background: "#ececec",
              borderRadius: 6, overflow: "hidden",
              border: "1px solid #ececec",
            }}>
              {[
                { l: "Tenant", v: u.tenant, i: "globe" },
                { l: "Role", v: u.role, i: "user-circle" },
                { l: "Tier", v: u.tier, i: "crown" },
                { l: "Credits", v: u.credits.toLocaleString(), i: "sparkles" },
                { l: "Joined", v: u.joined, i: "calendar" },
                { l: "Last active", v: u.lastActive, i: "clock" },
              ].map((p) => (
                <div key={p.l} style={{ padding: 10, background: "#fff" }}>
                  <div className="row muted" style={{ gap: 4, fontSize: 10.5, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    <Icon name={p.i} size={10} /> {p.l}
                  </div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, marginTop: 4 }}>{p.v}</div>
                </div>
              ))}
            </div>

            {/* Permissions section */}
            <div style={{ marginTop: 22 }}>
              <div className="row between" style={{ marginBottom: 8 }}>
                <h3 style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>Permissions</h3>
                <div className="row" style={{ gap: 4 }}>
                  <button className="btn btn--ghost btn--xs"><Icon name="copy" size={11} /> Clone</button>
                  <button className="btn btn--ghost btn--xs"><Icon name="plus" size={11} /> Override</button>
                </div>
              </div>
              <div style={{ border: "1px solid #ececec", borderRadius: 6, overflow: "hidden" }}>
                {PERMISSIONS.map((p, i) => (
                  <div key={p.key} style={{
                    display: "grid", gridTemplateColumns: "16px 1fr auto auto",
                    alignItems: "center", gap: 10,
                    padding: "7px 10px",
                    borderBottom: i < PERMISSIONS.length - 1 ? "1px solid #f4f4f5" : "0",
                    fontSize: 12,
                  }}>
                    <span style={{
                      width: 7, height: 7, borderRadius: 9999,
                      background: p.on ? "#10b981" : "#d4d4d8",
                    }} />
                    <div className="col" style={{ gap: 1, minWidth: 0 }}>
                      <span style={{ fontWeight: 500 }}>{p.label}</span>
                      <span className="muted mono" style={{ fontSize: 10.5 }}>{p.key}</span>
                    </div>
                    <span className={"tag-sm " + (p.scope === "override" ? "" : "")} style={p.scope === "override" ? { background: "#fef3c7", color: "#92400e", borderColor: "transparent" } : {}}>{p.scope}</span>
                    <button className={"toggle " + (p.on ? "is-on" : "")} style={{
                      width: 28, height: 16, padding: 0, borderRadius: 9999, border: 0,
                      background: p.on ? "#18181b" : "#d4d4d8", position: "relative", cursor: "pointer",
                    }}>
                      <span style={{ position: "absolute", top: 2, left: p.on ? 14 : 2, width: 12, height: 12, borderRadius: 9999, background: "#fff" }} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Activity rail */}
          <div style={{ borderLeft: "1px solid #ececec", background: "#fafafa", overflow: "auto", padding: 14 }}>
            <h3 style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "#3f3f46", letterSpacing: 0.02 }}>Activity</h3>
            <div style={{ position: "relative", marginTop: 10, paddingLeft: 14 }}>
              <div style={{ position: "absolute", left: 5, top: 6, bottom: 6, width: 1, background: "#e4e4e7" }} />
              {[
                { t: "2m ago", who: "Felix", text: "tier changed Starter → DTF Pro", icon: "credit-card", c: "#1d4ed8" },
                { t: "1h ago", who: "Maya", text: "exported 1,200 designs (bulk)", icon: "download", c: "#475569" },
                { t: "3h ago", who: "Maya", text: "invited 2 designers", icon: "user-plus", c: "#10b981" },
                { t: "1d ago", who: "system", text: "credits topped up +5,000", icon: "sparkles", c: "#9333ea" },
                { t: "2d ago", who: "Maya", text: "left feedback FB-218", icon: "message-square", c: "#1d4ed8" },
                { t: "3d ago", who: "Maya", text: "subdomain northgear-dev created", icon: "globe", c: "#a16207" },
                { t: "1w ago", who: "Maya", text: "signed in from new device", icon: "log-in", c: "#475569" },
              ].map((e, i) => (
                <div key={i} style={{ position: "relative", padding: "6px 0" }}>
                  <div style={{
                    position: "absolute", left: -14, top: 8,
                    width: 11, height: 11, borderRadius: 9999, background: "#fff",
                    border: "2px solid " + e.c,
                  }} />
                  <div style={{ fontSize: 11.5 }}>
                    <strong style={{ fontWeight: 600 }}>{e.who}</strong>{" "}
                    <span className="muted">{e.text}</span>
                  </div>
                  <div className="muted" style={{ fontSize: 10.5 }}>{e.t}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ---------------- B3 — Bulk action ---------------- */
const DirB_Bulk = () => {
  const selected = new Set(["u_001", "u_002", "u_003", "u_004", "u_007", "u_009"]);
  return (
    <div className="adm-board dirB">
      <DirB_Sidebar active="users" role="super" />
      <div className="dirB__main">
        <DirB_Top crumbs={["Workspace","Users"]} right={
          <>
            <button className="btn btn--ghost btn--xs"><Icon name="filter" size={12} /> tier: Starter</button>
            <button className="btn btn--ghost btn--xs"><Icon name="filter" size={12} /> last_active: &gt;30d</button>
            <span className="kbd">⌘\</span>
          </>
        } />
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 360px", minHeight: 0 }}>
          {/* Table */}
          <div style={{ overflow: "auto", background: "#fff" }}>
            <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, fontSize: 12 }}>
              <thead>
                <tr style={{ background: "#fafafa" }}>
                  {["","Name","Email","Tenant","Tier","Credits","Status","Active"].map((h, i) => (
                    <th key={i} style={{
                      textAlign: "left", padding: "7px 10px", fontSize: 10.5, fontWeight: 500,
                      color: "#71717a", borderBottom: "1px solid #ececec",
                      position: "sticky", top: 0, background: "#fafafa",
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {USERS.concat(USERS.slice(0, 4).map(u => ({ ...u, id: u.id + "_b" }))).map((u, i) => {
                  const sel = selected.has(u.id);
                  return (
                    <tr key={u.id} style={{ background: sel ? "#fafafa" : "transparent" }}>
                      <td style={{ padding: "7px 10px", borderBottom: "1px solid #f4f4f5", width: 32 }}>
                        <span style={{
                          width: 14, height: 14, borderRadius: 3,
                          border: "1.5px solid " + (sel ? "#18181b" : "#d4d4d8"),
                          background: sel ? "#18181b" : "#fff",
                          display: "inline-flex", alignItems: "center", justifyContent: "center",
                        }}>{sel ? <Icon name="check" size={10} style={{ color: "#fff" }} /> : null}</span>
                      </td>
                      <td style={{ padding: "7px 10px", borderBottom: "1px solid #f4f4f5" }}>
                        <div className="row" style={{ gap: 7 }}>
                          <div className={"avatar avatar--xs avatar--" + u.avatarKind}>{initials(u.name)}</div>
                          <span style={{ fontWeight: 500 }}>{u.name}</span>
                          {u.flag === "permission_request" ? <span className="tag-sm" style={{ background: "#fef3c7", color: "#92400e", borderColor: "transparent" }}>request</span> : null}
                        </div>
                      </td>
                      <td style={{ padding: "7px 10px", borderBottom: "1px solid #f4f4f5", color: "#52525b" }}>{u.email}</td>
                      <td style={{ padding: "7px 10px", borderBottom: "1px solid #f4f4f5" }} className="mono">{u.tenant}</td>
                      <td style={{ padding: "7px 10px", borderBottom: "1px solid #f4f4f5" }}>{u.tier}</td>
                      <td style={{ padding: "7px 10px", borderBottom: "1px solid #f4f4f5", fontVariantNumeric: "tabular-nums" }}>{u.credits.toLocaleString()}</td>
                      <td style={{ padding: "7px 10px", borderBottom: "1px solid #f4f4f5" }}>
                        <span className={"pill " + (u.status === "active" ? "pill--green" : u.status === "suspended" ? "pill--rose" : "pill--slate")} style={{ fontSize: 10 }}>
                          <span className="dot" />{u.status}
                        </span>
                      </td>
                      <td style={{ padding: "7px 10px", borderBottom: "1px solid #f4f4f5", color: "#71717a" }}>{u.lastActive}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Right rail: bulk action composer */}
          <div style={{ borderLeft: "1px solid #ececec", background: "#fafafa", padding: 16, overflow: "auto" }}>
            <div className="row between" style={{ marginBottom: 12 }}>
              <div className="col" style={{ gap: 2 }}>
                <h3 style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>Bulk action</h3>
                <span className="muted" style={{ fontSize: 11.5 }}>
                  <strong style={{ color: "#18181b" }}>{selected.size}</strong> users selected
                </span>
              </div>
              <button className="btn btn--ghost btn--xs"><Icon name="x" size={12} /></button>
            </div>

            {/* Selected chips */}
            <div className="row" style={{ gap: 5, flexWrap: "wrap", marginBottom: 14 }}>
              {USERS.filter((u) => selected.has(u.id)).map((u) => (
                <span key={u.id} style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  padding: "2px 7px 2px 3px", background: "#fff",
                  border: "1px solid #ececec", borderRadius: 9999,
                  fontSize: 11,
                }}>
                  <div className={"avatar avatar--xs avatar--" + u.avatarKind} style={{ width: 16, height: 16, fontSize: 8 }}>{initials(u.name)}</div>
                  {u.name}
                  <Icon name="x" size={10} style={{ color: "#a1a1aa" }} />
                </span>
              ))}
            </div>

            {/* Action sections */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {/* Permissions */}
              <div style={{ background: "#fff", border: "1px solid #ececec", borderRadius: 8, padding: 12 }}>
                <div className="row between" style={{ marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>Permissions</span>
                  <button className="btn btn--ghost btn--xs">Add <Icon name="plus" size={11} /></button>
                </div>
                <div className="col" style={{ gap: 6 }}>
                  <div className="row between" style={{ padding: "4px 0" }}>
                    <span style={{ fontSize: 12 }}>DTF Gang Sheet</span>
                    <span className="pill pill--green" style={{ fontSize: 10 }}>+ grant</span>
                  </div>
                  <div className="row between" style={{ padding: "4px 0" }}>
                    <span style={{ fontSize: 12 }}>AI Suggestions</span>
                    <span className="pill pill--green" style={{ fontSize: 10 }}>+ grant</span>
                  </div>
                </div>
              </div>

              {/* Tier */}
              <div style={{ background: "#fff", border: "1px solid #ececec", borderRadius: 8, padding: 12 }}>
                <div className="row between" style={{ marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>Tier</span>
                </div>
                <div className="row" style={{ gap: 0, background: "#f4f4f5", borderRadius: 6, padding: 2 }}>
                  {["Starter","Business","DTF Pro"].map((t, i) => (
                    <button key={t} style={{
                      flex: 1, border: 0, background: i === 2 ? "#fff" : "transparent",
                      padding: "5px 8px", fontSize: 11.5, borderRadius: 4,
                      color: i === 2 ? "#18181b" : "#71717a", fontWeight: i === 2 ? 600 : 500,
                      boxShadow: i === 2 ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
                    }}>{t}</button>
                  ))}
                </div>
              </div>

              {/* Credits */}
              <div style={{ background: "#fff", border: "1px solid #ececec", borderRadius: 8, padding: 12 }}>
                <div className="row between" style={{ marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>AI Credits</span>
                </div>
                <div className="row" style={{ gap: 6 }}>
                  <div className="row" style={{ background: "#f4f4f5", borderRadius: 6, padding: "5px 8px", flex: 1 }}>
                    <span style={{ color: "#71717a", fontSize: 12 }}>Top up by</span>
                    <span style={{ marginLeft: "auto", fontWeight: 600 }} className="mono">+5,000</span>
                  </div>
                  <button className="iconbtn iconbtn--sm"><Icon name="chevron-up" size={11} /></button>
                  <button className="iconbtn iconbtn--sm"><Icon name="chevron-down" size={11} /></button>
                </div>
              </div>

              {/* Notify */}
              <div style={{ background: "#fff", border: "1px solid #ececec", borderRadius: 8, padding: 12 }}>
                <div className="row between" style={{ marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>Notify</span>
                  <button className={"toggle is-on"} style={{ width: 28, height: 16, padding: 0, borderRadius: 9999, border: 0, background: "#18181b", position: "relative" }}>
                    <span style={{ position: "absolute", top: 2, left: 14, width: 12, height: 12, borderRadius: 9999, background: "#fff" }} />
                  </button>
                </div>
                <span className="muted" style={{ fontSize: 11.5 }}>Email + in-app: "You've been granted DTF Gang Sheet access."</span>
              </div>

              <div className="row" style={{ gap: 6, marginTop: 6 }}>
                <button className="btn btn--ghost" style={{ flex: 1 }}>Preview diff</button>
                <button className="btn btn--primary" style={{ flex: 1, background: "#18181b", borderColor: "#18181b" }}>
                  <Icon name="check" size={12} /> Apply to 6 users
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ---------------- B4 — Feedback triage (Kanban) ---------------- */
const DirB_Feedback = () => {
  const cols = [
    { id: "new", title: "New", color: "#94a3b8", count: 12, items: FEEDBACK.filter(f => f.status === "new") },
    { id: "triaged", title: "Triaged", color: "#3b82f6", count: 8, items: FEEDBACK.filter(f => f.status === "triaged") },
    { id: "in_progress", title: "In progress", color: "#a855f7", count: 6, items: FEEDBACK.filter(f => f.status === "in-progress") },
    { id: "shipped", title: "Shipped", color: "#10b981", count: 32, items: FEEDBACK.filter(f => f.status === "shipped") },
  ];
  return (
    <div className="adm-board dirB">
      <DirB_Sidebar active="triage" role="super" />
      <div className="dirB__main">
        <DirB_Top crumbs={["Feedback","Triage board"]} right={
          <>
            <div className="row" style={{ gap: 8, marginRight: 6 }}>
              <span className="muted" style={{ fontSize: 11 }}>NPS</span>
              <span style={{ fontWeight: 600, fontSize: 12 }}>47</span>
              <span className="muted" style={{ fontSize: 11 }}>CSAT</span>
              <span style={{ fontWeight: 600, fontSize: 12 }}>3.8</span>
              <span className="muted" style={{ fontSize: 11 }}>Resp. time</span>
              <span style={{ fontWeight: 600, fontSize: 12 }}>4.2h</span>
            </div>
            <button className="btn btn--ghost btn--xs"><Icon name="layout-grid" size={12} /> Board</button>
            <button className="btn btn--ghost btn--xs"><Icon name="list" size={12} /> List</button>
            <button className="btn btn--ghost btn--xs"><Icon name="filter" size={12} /></button>
          </>
        } />
        {/* Sentiment / topic strip */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8,
          padding: "10px 14px", background: "#fafafa", borderBottom: "1px solid #ececec",
        }}>
          {[
            { l: "Bugs", n: 38, t: "neg", pct: 86 },
            { l: "Performance", n: 14, t: "neg", pct: 72 },
            { l: "Billing", n: 9, t: "neg", pct: 88 },
            { l: "Designer UX", n: 22, t: "mix", pct: 55 },
            { l: "Praise", n: 18, t: "pos", pct: 12 },
            { l: "Feature reqs", n: 23, t: "neu", pct: 34 },
          ].map((c) => (
            <div key={c.l} style={{ background: "#fff", border: "1px solid #ececec", borderRadius: 6, padding: 8 }}>
              <div className="row between">
                <span style={{ fontSize: 11, fontWeight: 500 }}>{c.l}</span>
                <span className="muted mono" style={{ fontSize: 10.5 }}>{c.n}</span>
              </div>
              <div style={{ height: 4, marginTop: 6, background: "#f4f4f5", borderRadius: 9999, overflow: "hidden" }}>
                <div style={{
                  width: c.pct + "%", height: "100%",
                  background: c.t === "neg" ? "#ef4444" : c.t === "pos" ? "#10b981" : c.t === "mix" ? "#a855f7" : "#94a3b8",
                }} />
              </div>
            </div>
          ))}
        </div>

        {/* Kanban */}
        <div style={{ flex: 1, overflow: "auto", padding: 14, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, background: "#fafafa", minHeight: 0 }}>
          {cols.map((col) => (
            <div key={col.id} style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
              <div className="row between" style={{ padding: "0 4px" }}>
                <div className="row">
                  <span style={{ width: 8, height: 8, borderRadius: 9999, background: col.color }} />
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{col.title}</span>
                  <span className="muted mono" style={{ fontSize: 11 }}>{col.count}</span>
                </div>
                <button className="iconbtn iconbtn--sm iconbtn--ghost"><Icon name="plus" size={12} /></button>
              </div>
              <div className="col" style={{ gap: 8 }}>
                {col.items.map((it) => (
                  <div key={it.id} style={{
                    background: "#fff", border: "1px solid #ececec", borderRadius: 8, padding: 10,
                    display: "flex", flexDirection: "column", gap: 7,
                  }}>
                    <div className="row between">
                      <span className="muted mono" style={{ fontSize: 10.5 }}>FB-{it.id.replace("f_","")}</span>
                      <span style={{
                        width: 9, height: 9, borderRadius: 9999,
                        background: it.priority === "high" ? "#ef4444" : it.priority === "med" ? "#f59e0b" : "#a1a1aa",
                      }} />
                    </div>
                    <div style={{ fontSize: 12.5, fontWeight: 500, lineHeight: 1.35 }}>{it.topic}</div>
                    <div className="muted" style={{ fontSize: 11, lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{it.excerpt}</div>
                    <div className="row between" style={{ marginTop: 2 }}>
                      <div className="row" style={{ gap: 4 }}>
                        <div className={"avatar avatar--xs avatar--" + it.from.avatarKind}>{initials(it.from.name)}</div>
                        <span className="muted" style={{ fontSize: 10.5 }}>{it.from.tenant}</span>
                      </div>
                      <div className="row" style={{ gap: 5 }}>
                        <span className={"pill " + ({ negative: "pill--rose", positive: "pill--green", neutral: "pill--slate" })[it.sentiment]} style={{ fontSize: 10 }}>
                          <Icon name={it.sentiment === "positive" ? "smile" : it.sentiment === "negative" ? "frown" : "meh"} size={9} />
                          {it.csat}
                        </span>
                        {it.replies > 0 ? (
                          <span className="muted row" style={{ gap: 2, fontSize: 10.5 }}><Icon name="message-circle" size={10} />{it.replies}</span>
                        ) : null}
                      </div>
                    </div>
                    <div className="row" style={{ gap: 3 }}>
                      {it.tags.slice(0,2).map((t) => (
                        <span key={t} className="tag-sm" style={{ background: "#f4f4f5", borderColor: "transparent", color: "#52525b", fontSize: 10 }}>{t}</span>
                      ))}
                    </div>
                  </div>
                ))}
                {col.items.length === 0 ? (
                  <div style={{ border: "1px dashed #e4e4e7", borderRadius: 8, padding: 16, textAlign: "center", color: "#a1a1aa", fontSize: 11 }}>—</div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { DirB_Home, DirB_UserDetail, DirB_Bulk, DirB_Feedback });
