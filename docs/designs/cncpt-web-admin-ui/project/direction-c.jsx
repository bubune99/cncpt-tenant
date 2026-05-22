/* Direction C — "Cockpit" : dark, split-view, AI co-pilot, real-time ops */

const DirC_Sidebar = ({ active = "users" }) => {
  const items = [
    { id: "home", icon: "layout-dashboard" },
    { id: "users", icon: "users", warn: true },
    { id: "permissions", icon: "shield" },
    { id: "tenants", icon: "globe" },
    { id: "credits", icon: "sparkles" },
    { id: "feedback", icon: "message-square", warn: true },
    { id: "activity", icon: "history" },
    { id: "analytics", icon: "bar-chart-3" },
  ];
  return (
    <aside className="dirC__rail">
      <div className="dirC__rail-brand"><Icon name="palette" size={18} /></div>
      {items.map((it) => (
        <button key={it.id} className={"dirC__rail-item " + (active === it.id ? "is-active" : "")}>
          <Icon name={it.icon} size={17} />
          {it.warn ? <span className="dot-warn" /> : null}
        </button>
      ))}
      <div className="dirC__rail-spacer" />
      <button className="dirC__rail-item"><Icon name="settings" size={17} /></button>
      <div className="avatar avatar--orange" style={{ marginTop: 6 }}>SA</div>
    </aside>
  );
};

const DirC_Topbar = ({ title, sub, right }) => (
  <header className="dirC__topbar">
    <div className="col" style={{ gap: 0 }}>
      <div style={{ fontWeight: 600, fontSize: 13.5, color: "#fff" }}>{title}</div>
      {sub ? <div style={{ color: "#64748b", fontSize: 11.5 }}>{sub}</div> : null}
    </div>
    <div style={{ flex: 1 }} />
    <span className="dirC__pulse"><span className="ping" />Live · 142 active sessions</span>
    <div style={{ width: 1, height: 22, background: "rgba(255,255,255,0.08)", margin: "0 4px" }} />
    <div className="row" style={{
      gap: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 7, padding: "5px 10px", minWidth: 340, color: "#94a3b8", fontSize: 12,
    }}>
      <Icon name="command" size={13} />
      <span style={{ flex: 1 }}>Run command · find user, grant perm, set tier…</span>
      <span className="kbd">⌘K</span>
    </div>
    {right ?? (
      <>
        <button className="iconbtn iconbtn--ghost"><Icon name="bell" size={14} /></button>
      </>
    )}
  </header>
);

const DirC_Copilot = ({ text, action, secondary, icon = "sparkles" }) => (
  <div className="dirC__copilot">
    <div className="dirC__copilot-icon"><Icon name={icon} size={15} /></div>
    <div className="col" style={{ gap: 1, flex: 1 }}>
      <div style={{ fontSize: 12, color: "#e9d5ff", fontWeight: 500 }}>Co-pilot suggestion</div>
      <div style={{ fontSize: 12.5, color: "#e2e8f0" }}>{text}</div>
    </div>
    {secondary ? (
      <button className="btn btn--xs" style={{ background: "transparent", color: "#cbd5e1", border: "1px solid rgba(255,255,255,0.10)" }}>{secondary}</button>
    ) : null}
    <button className="btn btn--xs" style={{ background: "rgba(255,255,255,0.10)", color: "#fff", border: "1px solid rgba(255,255,255,0.10)" }}>{action} <Icon name="arrow-right" size={11} /></button>
    <button className="iconbtn iconbtn--ghost iconbtn--sm" style={{ color: "#94a3b8" }}><Icon name="x" size={12} /></button>
  </div>
);

/* ---------------- C1 — Home (Mission control) ---------------- */
const DirC_Home = () => (
  <div className="adm-board dirC">
    <DirC_Sidebar active="home" />
    <div className="dirC__main">
      <DirC_Topbar title="Mission control" sub="Sun · May 16 · 03:14 PM" />
      <DirC_Copilot
        text={<>12 Starter users are at <strong>0 credits</strong> for over 7 days — likely churn risk. <span style={{ color:"#94a3b8" }}>Send a top-up offer?</span></>}
        action="Send offer"
        secondary="Dismiss all"
      />
      <div style={{ padding: 16, overflow: "auto", display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 14, flex: 1, minHeight: 0 }}>
        {/* Left column */}
        <div className="col" style={{ gap: 14, minWidth: 0 }}>
          {/* KPI band */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
            {[
              { l: "Active sessions", v: "142", d: "live", c: "#10b981" },
              { l: "Signups · 24h", v: "67", d: "+18%", c: "#3b82f6" },
              { l: "MRR", v: "$48.2k", d: "+4.1%", c: "#a855f7" },
              { l: "Credits burn /hr", v: "11.2k", d: "−7%", c: "#f59e0b" },
            ].map((k) => (
              <div className="card" key={k.l} style={{ padding: 12 }}>
                <div className="row between">
                  <span style={{ fontSize: 10.5, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.06 }}>{k.l}</span>
                  <span style={{ fontSize: 10.5, color: k.c, fontWeight: 600 }}>{k.d}</span>
                </div>
                <div style={{ fontSize: 22, fontWeight: 700, color: "#fff", marginTop: 6, letterSpacing: "-0.02em" }}>{k.v}</div>
                {/* sparkline */}
                <svg viewBox="0 0 120 28" width="100%" height="22" style={{ marginTop: 4 }}>
                  <path d="M0 22 L12 18 L24 20 L36 14 L48 16 L60 10 L72 12 L84 6 L96 8 L108 4 L120 6"
                    fill="none" stroke={k.c} strokeWidth="1.5" />
                </svg>
              </div>
            ))}
          </div>

          {/* Action queue with side actions */}
          <div className="card">
            <div className="card__head">
              <div className="row">
                <h3 className="card__title" style={{ color: "#fff" }}>Action queue</h3>
                <span className="pill pill--rose" style={{ fontSize: 10.5 }}>{ATTENTION.length} need you</span>
              </div>
              <div className="row" style={{ gap: 6 }}>
                <button className="btn btn--ghost btn--xs"><Icon name="filter" size={11} /></button>
                <button className="btn btn--ghost btn--xs"><Icon name="check-check" size={11} /> Resolve all</button>
              </div>
            </div>
            <div className="card__body card__body--flush">
              {ATTENTION.map((a, i) => (
                <div key={i} style={{
                  display: "grid", gridTemplateColumns: "28px 1fr auto",
                  alignItems: "center", gap: 12,
                  padding: "11px 14px",
                  borderBottom: i < ATTENTION.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "0",
                }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: 7,
                    background: ({request:"rgba(245,158,11,0.18)",feedback:"rgba(59,130,246,0.18)",subdomain:"rgba(244,63,94,0.18)",credits:"rgba(245,158,11,0.18)",tier:"rgba(168,85,247,0.18)"})[a.kind],
                    color: ({request:"#fcd34d",feedback:"#93c5fd",subdomain:"#fda4af",credits:"#fcd34d",tier:"#d8b4fe"})[a.kind],
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                  }}><Icon name={({request:"shield",feedback:"message-square",subdomain:"globe",credits:"sparkles",tier:"crown"})[a.kind]} size={13} /></div>
                  <div className="col" style={{ gap: 1 }}>
                    <div style={{ fontSize: 12.5, color: "#e2e8f0" }}>
                      <span style={{ fontWeight: 500 }}>{a.label}</span>
                      {a.who ? <span style={{ color: "#64748b" }}> · {a.who.name}</span> : null}
                    </div>
                    <div style={{ fontSize: 11.5, color: "#94a3b8" }}>{a.detail}</div>
                  </div>
                  <div className="row" style={{ gap: 6 }}>
                    <span style={{ color: "#64748b", fontSize: 11 }}>{a.time}</span>
                    <button className="btn btn--xs" style={{ background: "rgba(59,130,246,0.18)", color: "#93c5fd", border: "1px solid rgba(59,130,246,0.25)" }}>Resolve</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* World map / heatmap stub */}
          <div className="card">
            <div className="card__head">
              <h3 className="card__title" style={{ color: "#fff" }}>Active sessions worldwide</h3>
              <div className="row" style={{ gap: 6 }}>
                <span className="pill pill--blue" style={{ fontSize: 10.5 }}>NA · 62</span>
                <span className="pill pill--violet" style={{ fontSize: 10.5 }}>EU · 51</span>
                <span className="pill pill--green" style={{ fontSize: 10.5 }}>APAC · 24</span>
              </div>
            </div>
            <div className="card__body" style={{ padding: 16, height: 180, background: "radial-gradient(ellipse at center, rgba(59,130,246,0.10), transparent 70%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {/* Dot grid map placeholder */}
              <svg viewBox="0 0 480 140" width="100%" height="140">
                {Array.from({ length: 18 }).map((_, r) =>
                  Array.from({ length: 60 }).map((_, c) => {
                    const cx = 4 + c * 8;
                    const cy = 4 + r * 7;
                    // crude "land" pattern
                    const land =
                      (c > 6 && c < 22 && r > 2 && r < 10 && Math.random() > 0.4) ||
                      (c > 24 && c < 32 && r > 1 && r < 8 && Math.random() > 0.5) ||
                      (c > 30 && c < 42 && r > 6 && r < 14 && Math.random() > 0.45) ||
                      (c > 42 && c < 56 && r > 3 && r < 11 && Math.random() > 0.4);
                    return land ? (
                      <circle key={r + "_" + c} cx={cx} cy={cy} r="1.6" fill="rgba(148,163,184,0.35)" />
                    ) : null;
                  })
                )}
                {[
                  { x: 80, y: 50, r: 7, c: "#3b82f6" },
                  { x: 120, y: 60, r: 5, c: "#3b82f6" },
                  { x: 220, y: 40, r: 9, c: "#a855f7" },
                  { x: 250, y: 55, r: 4, c: "#a855f7" },
                  { x: 360, y: 70, r: 5, c: "#10b981" },
                  { x: 400, y: 85, r: 6, c: "#10b981" },
                ].map((d, i) => (
                  <g key={i}>
                    <circle cx={d.x} cy={d.y} r={d.r * 2} fill={d.c} opacity="0.15" />
                    <circle cx={d.x} cy={d.y} r={d.r} fill={d.c} />
                  </g>
                ))}
              </svg>
            </div>
          </div>
        </div>

        {/* Right column: live feed + sentiment */}
        <div className="col" style={{ gap: 14, minWidth: 0 }}>
          <div className="card">
            <div className="card__head">
              <h3 className="card__title" style={{ color: "#fff" }}>Live activity</h3>
              <span className="dirC__pulse" style={{ padding: "2px 7px" }}><span className="ping" />streaming</span>
            </div>
            <div className="card__body card__body--flush" style={{ maxHeight: 290, overflow: "hidden" }}>
              {[
                { t: "just now", who: "Maya P.", text: "exported gang-sheet 32-tile PDF", icon: "download", c: "#94a3b8" },
                { t: "1s ago", who: "system", text: "new signup · daydream.io", icon: "user-plus", c: "#10b981" },
                { t: "3s ago", who: "Aisha B.", text: "tier upgraded · Business → DTF Pro", icon: "crown", c: "#a855f7" },
                { t: "8s ago", who: "Diego R.", text: "credit balance hit 0", icon: "sparkles", c: "#f59e0b" },
                { t: "11s ago", who: "Felix K.", text: "API key revoked by tenant admin", icon: "key", c: "#94a3b8" },
                { t: "16s ago", who: "Hana Y.", text: "permission request · DTF Gang Sheet", icon: "shield", c: "#fcd34d" },
                { t: "21s ago", who: "Mei C.", text: "left feedback · CSAT 5", icon: "smile", c: "#10b981" },
                { t: "29s ago", who: "Owen R.", text: "session ended · suspended", icon: "ban", c: "#fda4af" },
                { t: "34s ago", who: "Priya S.", text: "designer opened · printlab", icon: "palette", c: "#94a3b8" },
              ].map((e, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "24px 1fr auto", alignItems: "center", gap: 10, padding: "8px 14px" }}>
                  <span style={{ width: 22, height: 22, borderRadius: 6, background: "rgba(255,255,255,0.04)", color: e.c, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon name={e.icon} size={11} />
                  </span>
                  <div style={{ fontSize: 12, color: "#cbd5e1" }}>
                    <strong style={{ color: "#fff", fontWeight: 600 }}>{e.who}</strong> <span style={{ color: "#94a3b8" }}>{e.text}</span>
                  </div>
                  <span style={{ fontSize: 11, color: "#64748b" }}>{e.t}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card__head">
              <h3 className="card__title" style={{ color: "#fff" }}>Sentiment pulse · 7d</h3>
              <span style={{ color: "#94a3b8", fontSize: 11 }}>156 signals</span>
            </div>
            <div className="card__body" style={{ padding: 16 }}>
              {[
                { l: "Praise", pct: 32, c: "#10b981" },
                { l: "Neutral", pct: 36, c: "#94a3b8" },
                { l: "Critical", pct: 26, c: "#f59e0b" },
                { l: "Blocking", pct: 6, c: "#ef4444" },
              ].map((s) => (
                <div key={s.l} style={{ marginBottom: 10 }}>
                  <div className="row between" style={{ fontSize: 11.5, color: "#cbd5e1", marginBottom: 4 }}>
                    <span>{s.l}</span>
                    <span className="mono" style={{ color: "#94a3b8" }}>{s.pct}%</span>
                  </div>
                  <div style={{ height: 6, background: "rgba(255,255,255,0.04)", borderRadius: 9999, overflow: "hidden" }}>
                    <div style={{ width: s.pct + "%", height: "100%", background: s.c }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

/* ---------------- C2 — User detail (split, drag perms) ---------------- */
const DirC_UserDetail = () => {
  const u = USERS[0];
  // Permission groups visualised as droppable buckets
  const granted = PERMISSIONS.filter(p => p.on).slice(0, 6);
  const denied = PERMISSIONS.filter(p => !p.on).concat([
    { key: "designer.batch_export", label: "Batch Export", group: "Designer", scope: "tier" },
    { key: "admin.users_read", label: "Read Users", group: "Admin", scope: "role" },
  ]);
  return (
    <div className="adm-board dirC">
      <DirC_Sidebar active="users" />
      <div className="dirC__main">
        <DirC_Topbar title="Users" sub="10 / 12,408" />
        <DirC_Copilot
          icon="wand-2"
          text={<>Maya's <strong>tier</strong> (DTF Pro) suggests she should also have <strong>Batch Export</strong> — currently denied.</>}
          action="Grant override"
        />
        <div className="dirC__split dirC__split--3">
          {/* Left: user list */}
          <div className="dirC__pane">
            <div className="dirC__pane-h">
              <h3>Users</h3>
              <button className="btn btn--ghost btn--xs"><Icon name="filter" size={11} style={{ color: "#94a3b8" }} /></button>
            </div>
            <div style={{ overflow: "auto", flex: 1 }}>
              {USERS.map((x) => (
                <div key={x.id} style={{
                  padding: "9px 12px",
                  borderLeft: x.id === u.id ? "2px solid #3b82f6" : "2px solid transparent",
                  background: x.id === u.id ? "rgba(59,130,246,0.08)" : "transparent",
                  display: "grid", gridTemplateColumns: "24px 1fr auto", alignItems: "center", gap: 8,
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                }}>
                  <div className={"avatar avatar--xs avatar--" + x.avatarKind}>{initials(x.name)}</div>
                  <div className="col" style={{ gap: 0, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: x.id === u.id ? 600 : 500, color: "#e2e8f0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{x.name}</div>
                    <div style={{ fontSize: 10.5, color: "#64748b" }}>{x.tier}</div>
                  </div>
                  {x.flag ? <span style={{ width: 7, height: 7, borderRadius: 9999, background: x.flag === "suspended" ? "#ef4444" : "#f59e0b" }} /> : null}
                </div>
              ))}
            </div>
          </div>

          {/* Middle: drag-drop permission buckets */}
          <div className="dirC__pane">
            <div style={{ padding: 16 }}>
              <div className="row" style={{ gap: 14 }}>
                <div className={"avatar avatar--lg avatar--" + u.avatarKind}>{initials(u.name)}</div>
                <div className="col" style={{ gap: 3, flex: 1 }}>
                  <div className="row" style={{ gap: 7 }}>
                    <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: "#fff", letterSpacing: "-0.01em" }}>{u.name}</h2>
                    <span className="pill pill--green" style={{ fontSize: 10.5 }}><span className="dot" /> online</span>
                    <span className="pill pill--violet" style={{ fontSize: 10.5 }}><Icon name="crown" size={10} /> {u.tier}</span>
                  </div>
                  <div className="row" style={{ gap: 8, color: "#64748b", fontSize: 11.5 }}>
                    <span>{u.email}</span>
                    <span>·</span>
                    <span>{u.tenant}.cncpt-designer.com</span>
                    <span>·</span>
                    <span>since {u.joined}</span>
                  </div>
                </div>
                <div className="row" style={{ gap: 5 }}>
                  <button className="iconbtn iconbtn--sm"><Icon name="mail" size={12} /></button>
                  <button className="iconbtn iconbtn--sm"><Icon name="log-in" size={12} /></button>
                  <button className="btn btn--secondary btn--xs"><Icon name="more-horizontal" size={12} /></button>
                </div>
              </div>

              {/* Quick stats */}
              <div style={{
                display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 1,
                marginTop: 14, borderRadius: 8, overflow: "hidden",
                background: "rgba(255,255,255,0.06)",
              }}>
                {[
                  { l: "Designs", v: "2,418" },
                  { l: "API calls / mo", v: "118k" },
                  { l: "Credits", v: u.credits.toLocaleString() },
                  { l: "LTV", v: "$2.1k" },
                ].map((s) => (
                  <div key={s.l} style={{ background: "rgba(15,23,42,0.7)", padding: 10 }}>
                    <div style={{ fontSize: 10.5, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.06 }}>{s.l}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginTop: 3 }}>{s.v}</div>
                  </div>
                ))}
              </div>

              {/* Permission buckets */}
              <div style={{ marginTop: 20 }}>
                <div className="row between" style={{ marginBottom: 8 }}>
                  <h3 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#fff" }}>Permissions</h3>
                  <span style={{ fontSize: 11, color: "#64748b" }}>drag chips between buckets to grant/revoke</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {/* Granted */}
                  <div style={{
                    border: "1px dashed rgba(16,185,129,0.30)",
                    background: "rgba(16,185,129,0.05)",
                    borderRadius: 10, padding: 10, minHeight: 220,
                  }}>
                    <div className="row between" style={{ marginBottom: 8 }}>
                      <span style={{ color: "#6ee7b7", fontSize: 11.5, fontWeight: 600, letterSpacing: 0.04, textTransform: "uppercase" }}>
                        <Icon name="check-circle-2" size={12} style={{ marginRight: 4, verticalAlign: "-2px" }} /> Granted
                      </span>
                      <span className="muted" style={{ fontSize: 11 }}>{granted.length}</span>
                    </div>
                    <div className="col" style={{ gap: 6 }}>
                      {granted.map((p) => (
                        <div key={p.key} style={{
                          background: "rgba(15,23,42,0.6)",
                          border: "1px solid rgba(16,185,129,0.20)",
                          borderRadius: 6, padding: "6px 8px",
                          display: "flex", alignItems: "center", gap: 7,
                          cursor: "grab",
                        }}>
                          <Icon name="grip-vertical" size={11} style={{ color: "#475569" }} />
                          <div className="col" style={{ gap: 0, flex: 1 }}>
                            <div style={{ fontSize: 12, color: "#fff" }}>{p.label}</div>
                            <div style={{ fontSize: 10.5, color: "#64748b" }} className="mono">{p.key}</div>
                          </div>
                          <span style={{ fontSize: 10, color: "#94a3b8" }}>{p.scope}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Denied */}
                  <div style={{
                    border: "1px dashed rgba(244,63,94,0.25)",
                    background: "rgba(244,63,94,0.05)",
                    borderRadius: 10, padding: 10, minHeight: 220,
                  }}>
                    <div className="row between" style={{ marginBottom: 8 }}>
                      <span style={{ color: "#fda4af", fontSize: 11.5, fontWeight: 600, letterSpacing: 0.04, textTransform: "uppercase" }}>
                        <Icon name="x-circle" size={12} style={{ marginRight: 4, verticalAlign: "-2px" }} /> Denied
                      </span>
                      <span className="muted" style={{ fontSize: 11 }}>{denied.length}</span>
                    </div>
                    <div className="col" style={{ gap: 6 }}>
                      {denied.map((p, i) => (
                        <div key={p.key} style={{
                          background: "rgba(15,23,42,0.6)",
                          border: i === 0 ? "1px solid rgba(168,85,247,0.40)" : "1px solid rgba(244,63,94,0.18)",
                          borderRadius: 6, padding: "6px 8px",
                          display: "flex", alignItems: "center", gap: 7,
                          cursor: "grab",
                          boxShadow: i === 0 ? "0 0 0 3px rgba(168,85,247,0.10)" : "none",
                        }}>
                          <Icon name="grip-vertical" size={11} style={{ color: "#475569" }} />
                          <div className="col" style={{ gap: 0, flex: 1 }}>
                            <div style={{ fontSize: 12, color: "#fff" }}>{p.label}</div>
                            <div style={{ fontSize: 10.5, color: "#64748b" }} className="mono">{p.key}</div>
                          </div>
                          {i === 0 ? (
                            <span style={{ fontSize: 9.5, color: "#c4b5fd", background: "rgba(168,85,247,0.20)", padding: "1px 5px", borderRadius: 9999 }}>suggested</span>
                          ) : (
                            <span style={{ fontSize: 10, color: "#94a3b8" }}>{p.scope}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: activity ticker */}
          <div className="dirC__pane">
            <div className="dirC__pane-h">
              <h3>Activity</h3>
              <span className="muted" style={{ fontSize: 11 }}>last 24h</span>
            </div>
            <div style={{ padding: "10px 14px", overflow: "auto" }}>
              {[
                { t: "2m", text: "Tier changed Starter → DTF Pro", icon: "credit-card", c: "#93c5fd" },
                { t: "1h", text: "Exported 1.2k designs", icon: "download", c: "#94a3b8" },
                { t: "3h", text: "Invited 2 designers", icon: "user-plus", c: "#6ee7b7" },
                { t: "5h", text: "Credits topped up +5k", icon: "sparkles", c: "#d8b4fe" },
                { t: "1d", text: "Left feedback FB-218", icon: "message-square", c: "#93c5fd" },
                { t: "1d", text: "Created subdomain northgear-dev", icon: "globe", c: "#fcd34d" },
                { t: "2d", text: "Updated billing card ····4729", icon: "credit-card", c: "#cbd5e1" },
                { t: "3d", text: "API key issued · pk_live_…", icon: "key", c: "#94a3b8" },
                { t: "1w", text: "Signed in from new device", icon: "log-in", c: "#cbd5e1" },
              ].map((e, i) => (
                <div key={i} className="row" style={{ alignItems: "flex-start", gap: 8, padding: "6px 0" }}>
                  <span style={{ width: 22, height: 22, borderRadius: 6, background: "rgba(255,255,255,0.04)", color: e.c, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon name={e.icon} size={11} />
                  </span>
                  <div className="col" style={{ gap: 1, flex: 1 }}>
                    <div style={{ fontSize: 11.5, color: "#cbd5e1" }}>{e.text}</div>
                    <div style={{ fontSize: 10.5, color: "#64748b" }}>{e.t} ago</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ---------------- C3 — Bulk action via segments ---------------- */
const DirC_Bulk = () => (
  <div className="adm-board dirC">
    <DirC_Sidebar active="users" />
    <div className="dirC__main">
      <DirC_Topbar title="Operate · Users" sub="define a cohort, apply an action" />
      <DirC_Copilot
        icon="zap"
        text={<>Cohort matches <strong>74 users</strong>. Cost preview: <strong>+370,000 credits</strong> · <strong>$0</strong> billing impact (tier unchanged).</>}
        action="Stage action"
        secondary="Recalculate"
      />
      <div className="dirC__split dirC__split--2">
        {/* Left: cohort builder + results */}
        <div className="dirC__pane">
          <div style={{ padding: 16 }}>
            <div className="row between" style={{ marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#fff" }}>Cohort builder</h3>
              <div className="row" style={{ gap: 6 }}>
                <button className="btn btn--secondary btn--xs"><Icon name="save" size={12} /> Save segment</button>
                <button className="btn btn--secondary btn--xs"><Icon name="play" size={12} /> Run</button>
              </div>
            </div>

            {/* Filter chips */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, padding: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8 }}>
              {[
                { l: "tier", op: "=", v: "Starter" },
                { l: "credits", op: "<", v: "1000" },
                { l: "last_active", op: ">", v: "7 days" },
                { l: "status", op: "=", v: "active" },
              ].map((c) => (
                <span key={c.l} style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  background: "rgba(59,130,246,0.10)", border: "1px solid rgba(59,130,246,0.25)",
                  color: "#cbd5e1", padding: "4px 8px 4px 6px", borderRadius: 5, fontSize: 12,
                }}>
                  <span style={{ color: "#93c5fd", fontWeight: 600 }}>{c.l}</span>
                  <span style={{ color: "#64748b" }}>{c.op}</span>
                  <span className="mono">{c.v}</span>
                  <Icon name="x" size={11} style={{ color: "#64748b", marginLeft: 3 }} />
                </span>
              ))}
              <button className="btn btn--ghost btn--xs" style={{ background: "transparent", color: "#94a3b8" }}><Icon name="plus" size={11} /> Add filter</button>
            </div>

            {/* Result count + visual */}
            <div className="row" style={{ gap: 16, marginTop: 14, marginBottom: 12 }}>
              <div className="col" style={{ gap: 2 }}>
                <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.06 }}>Matched</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>74 <span style={{ fontSize: 12, color: "#64748b", fontWeight: 400 }}>of 12,408 users</span></div>
              </div>
              <div style={{ flex: 1, height: 38, background: "rgba(255,255,255,0.04)", borderRadius: 6, position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", padding: "0 8px", gap: 1 }}>
                  {Array.from({ length: 120 }).map((_, i) => (
                    <span key={i} style={{ width: 2, height: i % 7 === 0 ? 20 : 12, background: i < 8 ? "#3b82f6" : "rgba(255,255,255,0.10)", borderRadius: 9999 }} />
                  ))}
                </div>
                <span style={{ position: "absolute", top: 6, right: 8, fontSize: 10.5, color: "#93c5fd" }}>0.6% of base</span>
              </div>
            </div>

            {/* Result list */}
            <div style={{ border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, overflow: "hidden" }}>
              {USERS.slice(0, 6).map((u, i) => (
                <div key={u.id} style={{
                  display: "grid", gridTemplateColumns: "16px 28px 1fr auto auto",
                  alignItems: "center", gap: 10,
                  padding: "8px 12px",
                  borderBottom: i < 5 ? "1px solid rgba(255,255,255,0.04)" : "0",
                  background: "rgba(15,23,42,0.4)",
                }}>
                  <span style={{
                    width: 14, height: 14, borderRadius: 3,
                    border: "1.5px solid #3b82f6", background: "#3b82f6",
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                  }}><Icon name="check" size={10} style={{ color: "#fff" }} /></span>
                  <div className={"avatar avatar--xs avatar--" + u.avatarKind}>{initials(u.name)}</div>
                  <div className="col" style={{ gap: 0, minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: "#fff", fontWeight: 500 }}>{u.name}</div>
                    <div style={{ fontSize: 10.5, color: "#64748b" }}>{u.email}</div>
                  </div>
                  <span style={{ fontSize: 11.5, color: "#94a3b8" }} className="mono">{u.credits} cr</span>
                  <span style={{ fontSize: 11, color: "#64748b" }}>{u.lastActive}</span>
                </div>
              ))}
              <div style={{ padding: "8px 12px", color: "#64748b", fontSize: 11.5, textAlign: "center", background: "rgba(15,23,42,0.4)" }}>+ 68 more</div>
            </div>
          </div>
        </div>

        {/* Right: action composer */}
        <div className="dirC__pane" style={{ background: "rgba(8,12,28,0.5)" }}>
          <div style={{ padding: 16 }}>
            <div className="row between" style={{ marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#fff" }}>Action</h3>
              <div className="row" style={{ gap: 4 }}>
                <button className="btn btn--ghost btn--xs"><Icon name="history" size={11} /> History</button>
              </div>
            </div>

            {/* Action picker */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              {[
                { l: "Top up credits", i: "sparkles", on: true },
                { l: "Change tier", i: "crown" },
                { l: "Grant permission", i: "shield" },
                { l: "Send message", i: "mail" },
                { l: "Suspend", i: "ban" },
                { l: "Add tag", i: "tag" },
              ].map((a) => (
                <button key={a.l} style={{
                  display: "flex", alignItems: "center", gap: 7,
                  padding: "8px 10px", borderRadius: 7,
                  background: a.on ? "rgba(59,130,246,0.15)" : "rgba(255,255,255,0.03)",
                  border: "1px solid " + (a.on ? "rgba(59,130,246,0.40)" : "rgba(255,255,255,0.06)"),
                  color: a.on ? "#93c5fd" : "#cbd5e1", fontSize: 12, fontWeight: 500,
                }}>
                  <Icon name={a.i} size={13} />
                  {a.l}
                </button>
              ))}
            </div>

            {/* Selected action form */}
            <div style={{ marginTop: 14, padding: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8 }}>
              <div className="row between" style={{ marginBottom: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>Top up credits · per user</span>
                <span className="pill pill--blue" style={{ fontSize: 10.5 }}>74 recipients</span>
              </div>
              <div className="row" style={{ gap: 6 }}>
                {[1000, 2500, 5000, 10000].map((v, i) => (
                  <button key={v} style={{
                    flex: 1, padding: "9px 4px", borderRadius: 6,
                    background: i === 2 ? "rgba(59,130,246,0.20)" : "rgba(15,23,42,0.6)",
                    border: "1px solid " + (i === 2 ? "#3b82f6" : "rgba(255,255,255,0.08)"),
                    color: i === 2 ? "#fff" : "#cbd5e1", fontSize: 12.5, fontWeight: 600,
                  }}>+{v.toLocaleString()}</button>
                ))}
                <button style={{ padding: "9px 10px", borderRadius: 6, background: "rgba(15,23,42,0.6)", border: "1px solid rgba(255,255,255,0.08)", color: "#94a3b8", fontSize: 12 }}>
                  <Icon name="more-horizontal" size={12} />
                </button>
              </div>
              <div style={{ marginTop: 12 }}>
                <div className="row between" style={{ marginBottom: 5 }}>
                  <span style={{ fontSize: 11.5, color: "#94a3b8" }}>Reason · audit log</span>
                </div>
                <div style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, padding: "7px 10px", fontSize: 12, color: "#cbd5e1" }}>
                  Re-engagement: low-credit Starter users
                </div>
              </div>
              <div className="row between" style={{ marginTop: 12 }}>
                <div className="col" style={{ gap: 1 }}>
                  <span style={{ fontSize: 11, color: "#64748b" }}>Email recipient?</span>
                  <span style={{ fontSize: 11.5, color: "#cbd5e1" }}>"You've got 5,000 extra credits on us."</span>
                </div>
                <button className={"toggle is-on"} style={{ width: 30, height: 17, padding: 0, borderRadius: 9999, border: 0, background: "#3b82f6", position: "relative" }}>
                  <span style={{ position: "absolute", top: 2, left: 15, width: 13, height: 13, borderRadius: 9999, background: "#fff" }} />
                </button>
              </div>
            </div>

            {/* Impact preview */}
            <div style={{ marginTop: 14 }}>
              <div className="eyebrow">Impact preview</div>
              <div style={{ marginTop: 6, padding: 12, background: "rgba(15,23,42,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8 }}>
                <div className="row between" style={{ fontSize: 12, color: "#cbd5e1", padding: "4px 0" }}>
                  <span>Credits granted</span><span className="mono" style={{ color: "#fff", fontWeight: 600 }}>+370,000</span>
                </div>
                <div className="row between" style={{ fontSize: 12, color: "#cbd5e1", padding: "4px 0" }}>
                  <span>Estimated cost (cogs)</span><span className="mono" style={{ color: "#fff", fontWeight: 600 }}>$118.40</span>
                </div>
                <div className="row between" style={{ fontSize: 12, color: "#cbd5e1", padding: "4px 0" }}>
                  <span>Billing impact</span><span className="mono" style={{ color: "#6ee7b7", fontWeight: 600 }}>none</span>
                </div>
                <div className="row between" style={{ fontSize: 12, color: "#cbd5e1", padding: "4px 0" }}>
                  <span>Affected tenants</span><span className="mono" style={{ color: "#fff", fontWeight: 600 }}>61</span>
                </div>
              </div>
            </div>

            <div className="row" style={{ gap: 8, marginTop: 14 }}>
              <button className="btn btn--secondary" style={{ flex: 1 }}>Save as draft</button>
              <button className="btn btn--primary" style={{ flex: 1 }}><Icon name="zap" size={13} /> Stage</button>
            </div>
            <div style={{ fontSize: 10.5, color: "#64748b", textAlign: "center", marginTop: 8 }}>
              Staged actions require a second admin's review before they fire
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

/* ---------------- C4 — Feedback ops (clusters + detail) ---------------- */
const DirC_Feedback = () => {
  const f = FEEDBACK[3];
  return (
    <div className="adm-board dirC">
      <DirC_Sidebar active="feedback" />
      <div className="dirC__main">
        <DirC_Topbar title="Feedback ops" sub="124 open · NPS 47 · avg response 4.2h" />
        <DirC_Copilot
          icon="message-square"
          text={<>3 unresolved threads about <strong>webhook rate limit</strong> across 14 tenants — group into one investigation?</>}
          action="Group threads"
          secondary="View cluster"
        />
        <div className="dirC__split dirC__split--3">
          {/* Left: clusters */}
          <div className="dirC__pane">
            <div className="dirC__pane-h">
              <h3>Clusters</h3>
              <button className="btn btn--ghost btn--xs"><Icon name="sliders-horizontal" size={11} style={{ color: "#94a3b8" }} /></button>
            </div>
            <div style={{ padding: "8px 10px", overflow: "auto" }}>
              {[
                { l: "Webhook rate limit", n: 14, t: "neg", on: true, csat: 2.1 },
                { l: "AI credits expiring", n: 9, t: "neg", csat: 1.8 },
                { l: "DTF gang sheet export bug", n: 7, t: "neg", csat: 2.4 },
                { l: "Color picker contrast", n: 6, t: "mix", csat: 3.0 },
                { l: "Bulk variation editor", n: 12, t: "pos", csat: 4.7 },
                { l: "Mobile preview", n: 8, t: "pos", csat: 4.6 },
                { l: "Permission requests · DTF", n: 11, t: "neu", csat: 3.5 },
                { l: "Onboarding clarity", n: 5, t: "mix", csat: 3.2 },
              ].map((c) => (
                <button key={c.l} style={{
                  width: "100%", textAlign: "left",
                  padding: 10, marginBottom: 6, borderRadius: 7,
                  background: c.on ? "rgba(59,130,246,0.12)" : "rgba(255,255,255,0.03)",
                  border: "1px solid " + (c.on ? "rgba(59,130,246,0.30)" : "rgba(255,255,255,0.06)"),
                  display: "flex", flexDirection: "column", gap: 6,
                  color: "inherit",
                }}>
                  <div className="row between">
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: "#fff" }}>{c.l}</span>
                    <span style={{ fontSize: 11, color: "#94a3b8" }} className="mono">{c.n}</span>
                  </div>
                  <div className="row between">
                    <div style={{ width: 90, height: 4, background: "rgba(255,255,255,0.05)", borderRadius: 9999, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: (c.csat / 5 * 100) + "%", background: c.t === "neg" ? "#ef4444" : c.t === "pos" ? "#10b981" : "#a855f7" }} />
                    </div>
                    <span style={{ fontSize: 10.5, color: "#94a3b8" }}>CSAT {c.csat.toFixed(1)}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Middle: thread */}
          <div className="dirC__pane">
            <div style={{ padding: "14px 16px" }}>
              <div className="row" style={{ gap: 8, marginBottom: 4 }}>
                <span className="muted mono" style={{ fontSize: 11 }}>CLUSTER-014</span>
                <span className="pill pill--rose" style={{ fontSize: 10.5 }}>14 threads</span>
                <span className="pill pill--blue" style={{ fontSize: 10.5 }}>in progress · v2.41</span>
              </div>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#fff", letterSpacing: "-0.01em" }}>Webhook rate limit</h2>
              <div className="muted" style={{ fontSize: 11.5, marginTop: 4 }}>14 customers · avg CSAT 2.1 · first reported 11d ago</div>

              {/* Stats */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginTop: 14 }}>
                {[
                  { l: "Affected tenants", v: "14" },
                  { l: "MRR at risk", v: "$8.4k" },
                  { l: "First seen", v: "11d ago" },
                  { l: "Last echo", v: "6m ago" },
                ].map((s) => (
                  <div key={s.l} style={{ padding: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8 }}>
                    <div style={{ fontSize: 10.5, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.06 }}>{s.l}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginTop: 3 }}>{s.v}</div>
                  </div>
                ))}
              </div>

              {/* Thread list */}
              <div style={{ marginTop: 16 }}>
                <div className="row between" style={{ marginBottom: 6 }}>
                  <span className="eyebrow">Threads in this cluster</span>
                  <button className="btn btn--ghost btn--xs"><Icon name="filter" size={11} /></button>
                </div>
                <div className="col" style={{ gap: 8 }}>
                  {FEEDBACK.filter(x => x.tags.includes("api") || x.tags.includes("perf") || x.topic.toLowerCase().includes("rate")).concat(FEEDBACK.slice(0, 2)).slice(0, 4).map((it, i) => (
                    <div key={it.id + i} style={{
                      padding: 11, borderRadius: 8,
                      background: i === 0 ? "rgba(59,130,246,0.10)" : "rgba(255,255,255,0.03)",
                      border: "1px solid " + (i === 0 ? "rgba(59,130,246,0.30)" : "rgba(255,255,255,0.06)"),
                    }}>
                      <div className="row between">
                        <div className="row">
                          <div className={"avatar avatar--xs avatar--" + it.from.avatarKind}>{initials(it.from.name)}</div>
                          <span style={{ fontSize: 12, color: "#fff", fontWeight: 500 }}>{it.from.name}</span>
                          <span style={{ fontSize: 11, color: "#64748b" }}>· {it.from.tenant}</span>
                        </div>
                        <div className="row" style={{ gap: 5 }}>
                          <span className={"pill " + ({negative:"pill--rose",positive:"pill--green",neutral:"pill--slate"})[it.sentiment]} style={{ fontSize: 10 }}>
                            CSAT {it.csat}
                          </span>
                          <span style={{ fontSize: 11, color: "#64748b" }}>{it.time}</span>
                        </div>
                      </div>
                      <div style={{ fontSize: 12, color: "#cbd5e1", marginTop: 5, lineHeight: 1.45, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{it.excerpt}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right: take action */}
          <div className="dirC__pane">
            <div className="dirC__pane-h">
              <h3>Take action</h3>
              <span className="pill pill--blue" style={{ fontSize: 10 }}>WH-218</span>
            </div>
            <div style={{ padding: 14 }}>
              {/* Quick replies */}
              <div className="eyebrow" style={{ marginBottom: 6 }}>Reply to cluster</div>
              <div className="col" style={{ gap: 6, marginBottom: 14 }}>
                {[
                  "Thanks — fix is in v2.41 (ETA Jun 4). I'll loop back.",
                  "Bumped your rate-limit tier to 200/min in the meantime.",
                  "Compose custom reply…",
                ].map((t, i) => (
                  <button key={i} style={{
                    textAlign: "left", padding: "7px 9px", borderRadius: 6,
                    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                    color: "#cbd5e1", fontSize: 11.5,
                  }}>{t}</button>
                ))}
              </div>

              <div className="eyebrow" style={{ marginBottom: 6 }}>Mass action</div>
              <div className="col" style={{ gap: 6, marginBottom: 14 }}>
                <button className="btn btn--secondary" style={{ justifyContent: "flex-start" }}><Icon name="zap" size={12} /> Temp-raise rate limit · 14 tenants</button>
                <button className="btn btn--secondary" style={{ justifyContent: "flex-start" }}><Icon name="sparkles" size={12} /> Apply credit for downtime</button>
                <button className="btn btn--secondary" style={{ justifyContent: "flex-start" }}><Icon name="megaphone" size={12} /> Post status-page update</button>
              </div>

              <div className="eyebrow" style={{ marginBottom: 6 }}>Status & ownership</div>
              <div style={{ padding: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8 }}>
                <div className="row between" style={{ padding: "4px 0", fontSize: 12 }}>
                  <span style={{ color: "#94a3b8" }}>Status</span>
                  <span className="pill pill--blue">in progress</span>
                </div>
                <div className="row between" style={{ padding: "4px 0", fontSize: 12 }}>
                  <span style={{ color: "#94a3b8" }}>Assignee</span>
                  <span style={{ color: "#fff" }}>Eng · Webhooks</span>
                </div>
                <div className="row between" style={{ padding: "4px 0", fontSize: 12 }}>
                  <span style={{ color: "#94a3b8" }}>Ship version</span>
                  <span className="mono" style={{ color: "#fff" }}>v2.41 · Jun 4</span>
                </div>
                <div className="row between" style={{ padding: "4px 0", fontSize: 12 }}>
                  <span style={{ color: "#94a3b8" }}>Linked ticket</span>
                  <span className="mono" style={{ color: "#93c5fd" }}>WH-218 ↗</span>
                </div>
              </div>

              <button className="btn btn--primary" style={{ width: "100%", marginTop: 14 }}>
                <Icon name="check" size={13} /> Resolve cluster · notify 14 tenants
              </button>
              <div style={{ fontSize: 10.5, color: "#64748b", textAlign: "center", marginTop: 6 }}>
                Triggers a follow-up CSAT request 24h after ship
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { DirC_Home, DirC_UserDetail, DirC_Bulk, DirC_Feedback });
