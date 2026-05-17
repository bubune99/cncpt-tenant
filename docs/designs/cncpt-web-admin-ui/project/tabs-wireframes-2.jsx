/* TABS — WIREFRAMES (Part 2): Permission Overrides, Shipped (Feedback),
   Analytics, Activity Log, Platform Settings. */

/* -------------------- Permission Overrides -------------------- */
const Tab_Overrides = () => {
  const overrides = [
    { who: USERS[1], perm: "designer.dtf", label: "DTF Gang Sheet", grantedBy: "Sam Ariza", when: "12m ago", expires: "Jun 4 (14d trial)", reason: "Project deadline", state: "active" },
    { who: USERS[8], perm: "designer.dtf", label: "DTF Gang Sheet", grantedBy: "Sam Ariza", when: "2h ago", expires: "Jul 1 (30d)", reason: "Campaign launch", state: "active" },
    { who: USERS[7], perm: "api.live_keys", label: "API Live Keys", grantedBy: "Maya Patel", when: "yesterday", expires: "no expiry", reason: "Production webhooks", state: "active" },
    { who: USERS[2], perm: "admin.feedback", label: "Read Feedback", grantedBy: "Sam Ariza", when: "3d ago", expires: "no expiry", reason: "Customer Success role", state: "active" },
    { who: USERS[0], perm: "team.remove", label: "Remove Team Members", grantedBy: "Sam Ariza", when: "5d ago", expires: "no expiry", reason: "Owner of multiple subdomains", state: "active" },
    { who: USERS[5], perm: "designer.dtf", label: "DTF Gang Sheet", grantedBy: "Sam Ariza", when: "8d ago", expires: "May 14 (expired)", reason: "Trial after suspension lifted", state: "expired" },
    { who: USERS[3], perm: "designer.export.pdf", label: "PDF Export (high-res)", grantedBy: "Maya Patel", when: "2w ago", expires: "no expiry", reason: "Customer goodwill", state: "active" },
    { who: USERS[4], perm: "api.create_keys", label: "Create API Keys", grantedBy: "Sam Ariza", when: "3w ago", expires: "no expiry", reason: "Plugin development", state: "active" },
    { who: USERS[6], perm: "designer.ai_suggest", label: "AI Suggestions", grantedBy: "Sam Ariza", when: "1mo ago", expires: "May 1 (revoked)", reason: "Reset after suspension", state: "revoked" },
  ];
  return (
    <div className="adm-board dirH">
      <DirH_Sidebar active="overrides" role="super" />
      <div className="dirH__main">
        <DirH_Top crumbs={["Admin", "Permission Overrides"]} right={
          <>
            <button className="btn btn--secondary btn--xs"><Icon name="download" size={12} /> Audit log CSV</button>
            <button className="btn btn--primary btn--xs"><Icon name="plus" size={12} /> Grant override</button>
          </>
        } />

        <div style={{ padding: "16px 20px 0", background: "#fff", borderBottom: "1px solid var(--br-border)", flexShrink: 0 }}>
          <div className="row between" style={{ alignItems: "flex-end", marginBottom: 14 }}>
            <div className="col" style={{ gap: 2 }}>
              <h2 style={{ margin: 0, fontSize: 19, fontWeight: 700, letterSpacing: "-0.01em" }}>Permission Overrides</h2>
              <p className="muted" style={{ margin: 0, fontSize: 12.5 }}>Explicit grants beyond a user's tier/role · use sparingly · auto-audited</p>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 14 }}>
            {[
              { l: "Active overrides", v: "84", d: "across 62 users", i: "shield-check", tone: "blue" },
              { l: "Expiring in 7 days", v: "12", d: "review soon", i: "clock", tone: "amber" },
              { l: "Granted this week", v: "9", d: "+3 vs last", i: "trending-up", tone: "violet" },
              { l: "Auto-revoked / 30d", v: "18", d: "trial expirations", i: "shield-off", tone: "slate" },
            ].map((k) => (
              <div className="card" key={k.l} style={{ padding: 12 }}>
                <div className="row between">
                  <span className="muted" style={{ fontSize: 11.5 }}>{k.l}</span>
                  <Icon name={k.i} size={13} style={{ color: { blue:"#1d4ed8", amber:"#a16207", violet:"#7e22ce", slate:"#475569" }[k.tone] }} />
                </div>
                <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em", marginTop: 4 }}>{k.v}</div>
                <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>{k.d}</div>
              </div>
            ))}
          </div>
          <div className="row" style={{ gap: 8, paddingBottom: 14, flexWrap: "wrap" }}>
            <div className="row" style={{ background: "var(--br-surface)", border: "1px solid var(--br-border)", borderRadius: 7, padding: "6px 10px", minWidth: 260, gap: 6 }}>
              <Icon name="search" size={13} style={{ color: "var(--br-text-secondary)" }} />
              <span style={{ fontSize: 12.5, color: "var(--br-text-secondary)" }}>Search user, permission key…</span>
            </div>
            <button className="btn btn--secondary btn--xs"><Icon name="shield" size={12} /> Permission: any <Icon name="chevron-down" size={11} /></button>
            <button className="btn btn--secondary btn--xs"><Icon name="user" size={12} /> Granted by: any <Icon name="chevron-down" size={11} /></button>
            <button className="btn btn--secondary btn--xs"><Icon name="activity" size={12} /> State: active <Icon name="chevron-down" size={11} /></button>
            <button className="btn btn--secondary btn--xs"><Icon name="clock" size={12} /> Expires: any <Icon name="chevron-down" size={11} /></button>
          </div>
        </div>

        <div style={{ flex: 1, overflow: "auto", background: "#fff" }}>
          <table className="dirH-table">
            <thead>
              <tr>
                {["User", "Permission", "Granted by", "When", "Expires", "Reason", "State", ""].map((h, i) => <th key={i}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {overrides.map((o, i) => (
                <tr key={i}>
                  <td>
                    <div className="row" style={{ gap: 8 }}>
                      <div className={"avatar avatar--xs avatar--" + o.who.avatarKind}>{initials(o.who.name)}</div>
                      <div className="col" style={{ gap: 0 }}>
                        <span style={{ fontWeight: 500 }}>{o.who.name}</span>
                        <span className="muted" style={{ fontSize: 10.5 }}>{o.who.tenant} · {o.who.tier}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="col" style={{ gap: 0 }}>
                      <span style={{ fontWeight: 500 }}>{o.label}</span>
                      <span className="muted mono" style={{ fontSize: 10.5 }}>{o.perm}</span>
                    </div>
                  </td>
                  <td>{o.grantedBy}</td>
                  <td className="muted">{o.when}</td>
                  <td>
                    <span className="row" style={{ gap: 4, fontSize: 11.5 }}>
                      <Icon name="clock" size={11} style={{ color: o.expires.includes("expired") || o.expires.includes("revoked") ? "#dc2626" : o.expires === "no expiry" ? "#475569" : "#a16207" }} />
                      {o.expires}
                    </span>
                  </td>
                  <td className="muted" style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.reason}</td>
                  <td>
                    <span className={"pill " + ({ active: "pill--green", expired: "pill--slate", revoked: "pill--rose" })[o.state]} style={{ fontSize: 10.5 }}>
                      <span className="dot" />{o.state}
                    </span>
                  </td>
                  <td>
                    <div className="row" style={{ gap: 4 }}>
                      <button className="btn btn--ghost btn--xs">Extend</button>
                      <button className="btn btn--ghost btn--xs" style={{ color: "#b91c1c" }}>Revoke</button>
                    </div>
                  </td>
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

/* -------------------- Feedback · Shipped -------------------- */
const Tab_Shipped = () => {
  const releases = [
    { ver: "v2.40", date: "May 12 · 4 days ago", items: [
      { id: "f_206", topic: "Mobile preview QR share", from: USERS[5], csat: 5, sent: "positive", users: 1840, tags: ["mobile","feature-req"] },
      { id: "f_188", topic: "Color picker contrast (a11y)", from: USERS[4], csat: 4, sent: "positive", users: 320, tags: ["a11y","designer"] },
      { id: "f_178", topic: "Bulk variation editor speed", from: USERS[2], csat: 5, sent: "positive", users: 612, tags: ["bulk","perf"] },
    ]},
    { ver: "v2.39", date: "Apr 28 · 18 days ago", items: [
      { id: "f_166", topic: "Permission request workflow", from: USERS[8], csat: 4, sent: "positive", users: 1108, tags: ["permissions"] },
      { id: "f_162", topic: "Designer auto-save reliability", from: USERS[0], csat: 5, sent: "positive", users: 4218, tags: ["designer","reliability"] },
    ]},
    { ver: "v2.38", date: "Apr 14 · 32 days ago", items: [
      { id: "f_141", topic: "Tier comparison page on signup", from: USERS[3], csat: 4, sent: "positive", users: 1290, tags: ["onboarding"] },
      { id: "f_137", topic: "API key naming + revocation UX", from: USERS[7], csat: 5, sent: "positive", users: 78, tags: ["api"] },
    ]},
  ];

  return (
    <div className="adm-board dirH">
      <DirH_Sidebar active="fb-shipped" role="super" />
      <div className="dirH__main">
        <DirH_Top crumbs={["Admin", "Feedback", "Shipped"]} right={
          <>
            <span className="muted" style={{ fontSize: 11 }}>NPS Δ this release</span>
            <span style={{ fontWeight: 600, fontSize: 12, color: "#10b981" }}>+4.2</span>
            <button className="btn btn--secondary btn--xs"><Icon name="rss" size={12} /> Customer changelog</button>
          </>
        } />

        <div style={{ padding: "16px 20px 0", background: "#fff", borderBottom: "1px solid var(--br-border)", flexShrink: 0 }}>
          <div className="row between" style={{ alignItems: "flex-end", marginBottom: 14 }}>
            <div className="col" style={{ gap: 2 }}>
              <h2 style={{ margin: 0, fontSize: 19, fontWeight: 700, letterSpacing: "-0.01em" }}>Shipped feedback</h2>
              <p className="muted" style={{ margin: 0, fontSize: 12.5 }}>Resolved items grouped by release · customer reactions automatically tracked</p>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 14 }}>
            {[
              { l: "Shipped · 30d", v: "32", d: "across 4 releases", i: "rocket", tone: "violet" },
              { l: "Avg resolution time", v: "8.4d", d: "−1.2d vs Q1", i: "timer", tone: "green" },
              { l: "Customer follow-ups", v: "61%", d: "of resolved items", i: "message-circle", tone: "blue" },
              { l: "NPS lift", v: "+4.2", d: "since v2.38", i: "trending-up", tone: "amber" },
            ].map((k) => (
              <div className="card" key={k.l} style={{ padding: 12 }}>
                <div className="row between">
                  <span className="muted" style={{ fontSize: 11.5 }}>{k.l}</span>
                  <Icon name={k.i} size={13} style={{ color: { violet:"#7e22ce", green:"#15803d", blue:"#1d4ed8", amber:"#a16207" }[k.tone] }} />
                </div>
                <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em", marginTop: 4 }}>{k.v}</div>
                <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>{k.d}</div>
              </div>
            ))}
          </div>
          <div className="row" style={{ gap: 8, paddingBottom: 14, flexWrap: "wrap" }}>
            <button className="btn btn--secondary btn--xs"><Icon name="rocket" size={12} /> Release: all <Icon name="chevron-down" size={11} /></button>
            <button className="btn btn--secondary btn--xs"><Icon name="tag" size={12} /> Tag: any <Icon name="chevron-down" size={11} /></button>
            <button className="btn btn--secondary btn--xs"><Icon name="smile" size={12} /> Sentiment: any <Icon name="chevron-down" size={11} /></button>
            <div style={{ flex: 1 }} />
            <span className="muted" style={{ fontSize: 11.5 }}>Showing 8 items · 3 releases</span>
          </div>
        </div>

        <div style={{ flex: 1, overflow: "auto", padding: 20, background: "var(--br-surface)" }}>
          {releases.map((r) => (
            <div key={r.ver} style={{ marginBottom: 18 }}>
              {/* Release header */}
              <div className="row" style={{ gap: 10, marginBottom: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--gr-blue-purple)", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon name="rocket" size={14} />
                </div>
                <div className="col" style={{ gap: 0 }}>
                  <strong style={{ fontSize: 14 }}>{r.ver}</strong>
                  <span className="muted" style={{ fontSize: 11.5 }}>{r.date} · {r.items.length} items resolved</span>
                </div>
                <div style={{ flex: 1 }} />
                <button className="btn btn--ghost btn--xs"><Icon name="file-text" size={12} /> Release notes</button>
              </div>

              <div className="col" style={{ gap: 8 }}>
                {r.items.map((it) => (
                  <div key={it.id} className="card" style={{ padding: 0 }}>
                    <div style={{ padding: 14 }}>
                      <div className="row between" style={{ marginBottom: 6 }}>
                        <div className="row" style={{ gap: 8 }}>
                          <span className="muted mono" style={{ fontSize: 10.5 }}>FB-{it.id.replace("f_","")}</span>
                          <span className="pill pill--green" style={{ fontSize: 10.5 }}><Icon name="check" size={11} /> shipped</span>
                          {it.tags.map((t) => <span key={t} className="tag-sm">#{t}</span>)}
                        </div>
                        <div className="row" style={{ gap: 6 }}>
                          <span className={"pill " + ({ positive: "pill--green", neutral: "pill--slate", negative: "pill--rose" })[it.sent]} style={{ fontSize: 10.5 }}>
                            <Icon name={it.sent === "positive" ? "smile" : it.sent === "negative" ? "frown" : "meh"} size={11} />
                            CSAT {it.csat}
                          </span>
                          <span className="pill" style={{ fontSize: 10.5 }}><Icon name="users" size={11} /> {it.users.toLocaleString()} affected</span>
                        </div>
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{it.topic}</div>
                      <div className="row between" style={{ marginTop: 8 }}>
                        <div className="row" style={{ gap: 6 }}>
                          <div className={"avatar avatar--xs avatar--" + it.from.avatarKind}>{initials(it.from.name)}</div>
                          <span className="muted" style={{ fontSize: 11.5 }}>Originally raised by <strong style={{ color: "var(--br-text)", fontWeight: 500 }}>{it.from.name}</strong></span>
                        </div>
                        <div className="row" style={{ gap: 6 }}>
                          <button className="btn btn--ghost btn--xs"><Icon name="message-square" size={11} /> 3 thank-you replies</button>
                          <button className="btn btn--ghost btn--xs"><Icon name="arrow-up-right" size={11} /> Open</button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <DirH_ActivityRail />
    </div>
  );
};

/* -------------------- Analytics -------------------- */
const Tab_Analytics = () => {
  // Pretend chart data
  const mau = [38, 42, 41, 48, 52, 58, 55, 63, 70, 74, 78, 84, 89, 95];
  const max1 = Math.max(...mau);
  const signups = [12, 14, 11, 18, 22, 19, 26, 24, 28, 33, 29, 36, 32, 38];
  const max2 = Math.max(...signups);
  const cohort = [
    { l: "Apr W1", v: [100, 88, 78, 72, 67, 64] },
    { l: "Apr W2", v: [100, 86, 76, 70, 65, null] },
    { l: "Apr W3", v: [100, 89, 80, 73, null, null] },
    { l: "Apr W4", v: [100, 91, 82, null, null, null] },
    { l: "May W1", v: [100, 92, null, null, null, null] },
    { l: "May W2", v: [100, null, null, null, null, null] },
  ];

  return (
    <div className="adm-board dirH">
      <DirH_Sidebar active="analytics" role="super" />
      <div className="dirH__main">
        <DirH_Top crumbs={["Admin", "Analytics"]} right={
          <>
            <button className="btn btn--secondary btn--xs"><Icon name="calendar" size={12} /> Last 14 days <Icon name="chevron-down" size={11} /></button>
            <button className="btn btn--secondary btn--xs"><Icon name="download" size={12} /> Export</button>
          </>
        } />
        <div className="dirH__page" style={{ padding: "16px 20px" }}>
          <div className="row between" style={{ alignItems: "flex-end", marginBottom: 14 }}>
            <div className="col" style={{ gap: 2 }}>
              <h2 style={{ margin: 0, fontSize: 19, fontWeight: 700, letterSpacing: "-0.01em" }}>Analytics</h2>
              <p className="muted" style={{ margin: 0, fontSize: 12.5 }}>Platform-wide health · all tenants & tiers</p>
            </div>
            <div className="row" style={{ gap: 4 }}>
              {["Growth", "Engagement", "Revenue", "Feedback"].map((t, i) => (
                <button key={t} style={{
                  border: 0, background: i === 0 ? "var(--br-primary)" : "transparent",
                  color: i === 0 ? "#fff" : "var(--br-text-secondary)",
                  padding: "5px 12px", borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
                }}>{t}</button>
              ))}
            </div>
          </div>

          {/* KPI row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 14 }}>
            {[
              { l: "MAU", v: "8,942", d: "+12.4%", trend: "up", i: "users", tone: "blue" },
              { l: "New signups · 14d", v: "342", d: "+28", trend: "up", i: "user-plus", tone: "green" },
              { l: "Designs created · 14d", v: "84.2k", d: "+9%", trend: "up", i: "palette", tone: "violet" },
              { l: "Activation rate", v: "63%", d: "+2pp", trend: "up", i: "zap", tone: "amber" },
            ].map((k) => (
              <div className="card" key={k.l} style={{ padding: 14 }}>
                <div className="row between">
                  <span className="muted" style={{ fontSize: 11.5 }}>{k.l}</span>
                  <Icon name={k.i} size={13} style={{ color: { blue:"#1d4ed8", green:"#15803d", violet:"#7e22ce", amber:"#a16207" }[k.tone] }} />
                </div>
                <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", marginTop: 6 }}>{k.v}</div>
                <span className="pill pill--green" style={{ fontSize: 10.5, marginTop: 4 }}>
                  <Icon name="trending-up" size={11} /> {k.d}
                </span>
              </div>
            ))}
          </div>

          {/* Two big charts */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
            <div className="card">
              <div className="card__head">
                <h3 className="card__title">Monthly active users</h3>
                <div className="row" style={{ gap: 4 }}>
                  <button className="btn btn--ghost btn--xs">Daily</button>
                  <button className="btn btn--ghost btn--xs" style={{ background: "var(--br-surface)", color: "var(--br-text)" }}>Weekly</button>
                </div>
              </div>
              <div style={{ padding: "8px 16px 16px" }}>
                <svg width="100%" height="160" viewBox="0 0 400 160" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="mauGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {[40, 80, 120].map((y) => <line key={y} x1="0" y1={y} x2="400" y2={y} stroke="#f1f5f9" strokeWidth="1" />)}
                  <path d={"M " + mau.map((v, i) => (i * (400 / (mau.length - 1))) + " " + (150 - (v / max1) * 130)).join(" L ") + " L 400 160 L 0 160 Z"} fill="url(#mauGrad)" />
                  <path d={"M " + mau.map((v, i) => (i * (400 / (mau.length - 1))) + " " + (150 - (v / max1) * 130)).join(" L ")} fill="none" stroke="#3b82f6" strokeWidth="2" />
                  {mau.map((v, i) => <circle key={i} cx={i * (400 / (mau.length - 1))} cy={150 - (v / max1) * 130} r="2.5" fill="#3b82f6" />)}
                </svg>
                <div className="row between muted" style={{ fontSize: 10.5, marginTop: 4 }}>
                  <span>May 3</span><span>May 16</span>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card__head">
                <h3 className="card__title">New signups</h3>
                <span className="muted" style={{ fontSize: 11.5 }}>by tenant tier</span>
              </div>
              <div style={{ padding: "8px 16px 16px" }}>
                <div className="row" style={{ alignItems: "flex-end", gap: 4, height: 160 }}>
                  {signups.map((v, i) => {
                    const h = (v / max2) * 100;
                    return (
                      <div key={i} className="col" style={{ flex: 1, gap: 1, justifyContent: "flex-end", height: "100%" }}>
                        <div style={{ background: "#a855f7", height: (h * 0.18) + "%", borderRadius: "3px 3px 0 0" }} />
                        <div style={{ background: "#0ea5e9", height: (h * 0.22) + "%" }} />
                        <div style={{ background: "#3b82f6", height: (h * 0.45) + "%" }} />
                        <div style={{ background: "#94a3b8", height: (h * 0.15) + "%", borderRadius: "0 0 3px 3px" }} />
                      </div>
                    );
                  })}
                </div>
                <div className="row" style={{ gap: 14, marginTop: 10, fontSize: 11, flexWrap: "wrap" }}>
                  {[
                    { c: "#94a3b8", l: "Free" }, { c: "#3b82f6", l: "Starter" }, { c: "#0ea5e9", l: "Business" }, { c: "#a855f7", l: "DTF Pro" },
                  ].map((g) => (
                    <span key={g.l} className="row" style={{ gap: 5 }}>
                      <span style={{ width: 8, height: 8, borderRadius: 2, background: g.c }} /><span className="muted">{g.l}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Cohort + tier breakdown */}
          <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 14 }}>
            <div className="card">
              <div className="card__head">
                <h3 className="card__title">Retention cohort · weekly</h3>
                <span className="muted" style={{ fontSize: 11.5 }}>% returning by week since signup</span>
              </div>
              <div className="card__body">
                <table style={{ width: "100%", fontSize: 11.5, borderCollapse: "separate", borderSpacing: 4 }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left", color: "var(--br-text-secondary)", fontWeight: 500, padding: "2px 6px" }}>Cohort</th>
                      {["W0","W1","W2","W3","W4","W5"].map((w) => (
                        <th key={w} style={{ textAlign: "center", color: "var(--br-text-secondary)", fontWeight: 500, padding: "2px 6px" }}>{w}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {cohort.map((c) => (
                      <tr key={c.l}>
                        <td style={{ padding: 0, color: "var(--br-text-secondary)" }}>{c.l}</td>
                        {c.v.map((v, i) => (
                          <td key={i} style={{ padding: 0 }}>
                            {v === null ? <div style={{ height: 26, background: "var(--br-surface)", borderRadius: 4 }} /> :
                              <div style={{
                                height: 26, borderRadius: 4, textAlign: "center", lineHeight: "26px",
                                background: "rgba(59,130,246," + (v / 100) + ")",
                                color: v > 50 ? "#fff" : "var(--br-text)",
                                fontVariantNumeric: "tabular-nums",
                                fontWeight: 500,
                              }}>{v}</div>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card">
              <div className="card__head"><h3 className="card__title">Tier distribution</h3></div>
              <div className="card__body">
                {[
                  { l: "Free", pct: 34, n: "4,218", c: "#94a3b8" },
                  { l: "Starter", pct: 46, n: "5,740", c: "#3b82f6" },
                  { l: "Business", pct: 10, n: "1,290", c: "#0ea5e9" },
                  { l: "DTF Pro", pct: 9, n: "1,108", c: "#a855f7" },
                  { l: "Enterprise", pct: 1, n: "52", c: "#f59e0b" },
                ].map((t) => (
                  <div key={t.l} style={{ padding: "5px 0" }}>
                    <div className="row between" style={{ fontSize: 12 }}>
                      <span style={{ fontWeight: 500 }}>{t.l}</span>
                      <span className="muted mono" style={{ fontSize: 11 }}>{t.n} · {t.pct}%</span>
                    </div>
                    <div style={{ height: 6, marginTop: 5, background: "#f1f5f9", borderRadius: 9999, overflow: "hidden" }}>
                      <div style={{ width: t.pct + "%", height: "100%", background: t.c }} />
                    </div>
                  </div>
                ))}
                <div style={{ borderTop: "1px solid var(--br-border)", marginTop: 10, paddingTop: 10 }}>
                  <div className="row between" style={{ fontSize: 11.5 }}>
                    <span className="muted">Paid conversion</span>
                    <strong>20.4%</strong>
                  </div>
                  <div className="row between" style={{ fontSize: 11.5, marginTop: 4 }}>
                    <span className="muted">Avg time to paid</span>
                    <strong>11 days</strong>
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

/* -------------------- Activity Log -------------------- */
const Tab_ActivityLog = () => {
  const events = [
    { t: "10:42 · just now", actor: USERS[0], action: "exported gang-sheet 32-tile PDF", target: "designer", icon: "download", scope: "user", ip: "203.0.113.42" },
    { t: "10:41", actor: { name: "system", avatarKind: "slate" }, action: "new signup", target: "Priya S. · daydream.io", icon: "user-plus", scope: "system", ip: "—" },
    { t: "10:40", actor: { name: "Sam Ariza", avatarKind: "orange" }, action: "changed tier", target: "Felix Kovac · Starter → DTF Pro", icon: "credit-card", scope: "admin", ip: "10.0.4.18" },
    { t: "10:32", actor: USERS[2], action: "credits topped up", target: "+5,000", icon: "sparkles", scope: "user", ip: "203.0.113.91" },
    { t: "10:18", actor: { name: "Sam Ariza", avatarKind: "orange" }, action: "granted permission override", target: "Jonas B. · designer.dtf", icon: "shield", scope: "admin", ip: "10.0.4.18" },
    { t: "10:02", actor: USERS[8], action: "requested DTF Pro permission", target: "permission request", icon: "shield", scope: "user", ip: "198.51.100.7" },
    { t: "09:51", actor: USERS[3], action: "left feedback CSAT 1", target: "billing — credits expired", icon: "frown", scope: "user", ip: "198.51.100.44" },
    { t: "09:42", actor: USERS[4], action: "designs exported (bulk)", target: "240 designs", icon: "download", scope: "user", ip: "203.0.113.18" },
    { t: "09:31", actor: { name: "system", avatarKind: "slate" }, action: "subdomain orphaned", target: "craftshop.cncpt-designer.com", icon: "globe", scope: "system", ip: "—" },
    { t: "09:18", actor: USERS[7], action: "API key revoked", target: "wh_live_***f4a2", icon: "key", scope: "user", ip: "203.0.113.5" },
    { t: "09:04", actor: { name: "Sam Ariza", avatarKind: "orange" }, action: "suspended user", target: "Owen Reilly · policy violation", icon: "ban", scope: "admin", ip: "10.0.4.18" },
    { t: "08:48", actor: { name: "system", avatarKind: "slate" }, action: "credit balance reached zero", target: "Diego R.", icon: "sparkles", scope: "system", ip: "—" },
    { t: "08:33", actor: USERS[0], action: "invited team member", target: "designer@northgear.co", icon: "user-plus", scope: "user", ip: "203.0.113.42" },
    { t: "08:12", actor: USERS[2], action: "invited 2 designers", target: "studio44 team", icon: "user-plus", scope: "user", ip: "203.0.113.91" },
    { t: "Yesterday 18:21", actor: USERS[0], action: "created subdomain", target: "northgear-dev.cncpt-designer.com", icon: "globe", scope: "user", ip: "203.0.113.42" },
  ];
  return (
    <div className="adm-board dirH">
      <DirH_Sidebar active="activity" role="super" />
      <div className="dirH__main">
        <DirH_Top crumbs={["Admin", "Activity Log"]} right={
          <>
            <button className="btn btn--secondary btn--xs"><Icon name="download" size={12} /> Export CSV</button>
            <button className="btn btn--secondary btn--xs"><Icon name="rss" size={12} /> Webhook</button>
          </>
        } />

        <div style={{ padding: "16px 20px 0", background: "#fff", borderBottom: "1px solid var(--br-border)", flexShrink: 0 }}>
          <div className="row between" style={{ alignItems: "flex-end", marginBottom: 14 }}>
            <div className="col" style={{ gap: 2 }}>
              <h2 style={{ margin: 0, fontSize: 19, fontWeight: 700, letterSpacing: "-0.01em" }}>Activity Log</h2>
              <p className="muted" style={{ margin: 0, fontSize: 12.5 }}>Append-only audit log · 7 years retention · 184,212 events / 30d</p>
            </div>
          </div>
          <div className="row" style={{ gap: 8, paddingBottom: 14, flexWrap: "wrap" }}>
            <div className="row" style={{ background: "var(--br-surface)", border: "1px solid var(--br-border)", borderRadius: 7, padding: "6px 10px", minWidth: 260, gap: 6 }}>
              <Icon name="search" size={13} style={{ color: "var(--br-text-secondary)" }} />
              <span style={{ fontSize: 12.5, color: "var(--br-text-secondary)" }}>Search actor, action, target…</span>
            </div>
            <button className="btn btn--secondary btn--xs"><Icon name="user" size={12} /> Actor: any <Icon name="chevron-down" size={11} /></button>
            <button className="btn btn--secondary btn--xs"><Icon name="zap" size={12} /> Action: any <Icon name="chevron-down" size={11} /></button>
            <button className="btn btn--secondary btn--xs"><Icon name="building-2" size={12} /> Tenant: any <Icon name="chevron-down" size={11} /></button>
            <button className="btn btn--secondary btn--xs"><Icon name="shield" size={12} /> Scope: any <Icon name="chevron-down" size={11} /></button>
            <button className="btn btn--secondary btn--xs"><Icon name="calendar" size={12} /> Last 24h <Icon name="chevron-down" size={11} /></button>
            <button className="btn btn--ghost btn--xs"><Icon name="bookmark" size={12} /> Saved views</button>
          </div>
        </div>

        <div style={{ flex: 1, overflow: "auto", background: "#fff" }}>
          <table className="dirH-table">
            <thead>
              <tr>
                {["", "Time", "Actor", "Action", "Target", "Scope", "IP", ""].map((h, i) => <th key={i}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {events.map((e, i) => (
                <tr key={i}>
                  <td style={{ width: 32 }}>
                    <div style={{
                      width: 22, height: 22, borderRadius: 5,
                      background: { user:"#dbeafe", admin:"#fef3c7", system:"#e2e8f0" }[e.scope],
                      color: { user:"#1d4ed8", admin:"#a16207", system:"#475569" }[e.scope],
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                    }}><Icon name={e.icon} size={12} /></div>
                  </td>
                  <td className="mono muted" style={{ fontSize: 11, whiteSpace: "nowrap" }}>{e.t}</td>
                  <td>
                    <div className="row" style={{ gap: 6 }}>
                      <div className={"avatar avatar--xs avatar--" + (e.actor.avatarKind || "slate")}>{e.actor.name === "system" ? "S" : initials(e.actor.name)}</div>
                      <span>{e.actor.name}</span>
                    </div>
                  </td>
                  <td><strong style={{ fontWeight: 500 }}>{e.action}</strong></td>
                  <td className="muted">{e.target}</td>
                  <td>
                    <span className={"pill " + ({ user: "pill--blue", admin: "pill--amber", system: "pill--slate" })[e.scope]} style={{ fontSize: 10.5 }}>
                      {e.scope}
                    </span>
                  </td>
                  <td className="mono muted" style={{ fontSize: 11 }}>{e.ip}</td>
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

/* -------------------- Platform Settings -------------------- */
const Tab_Settings = () => {
  const sections = [
    { id: "general", label: "General", icon: "settings", on: true },
    { id: "auth", label: "Authentication", icon: "key-round" },
    { id: "email", label: "Email & Notifications", icon: "mail" },
    { id: "billing", label: "Billing & Payments", icon: "credit-card" },
    { id: "api", label: "API & Webhooks", icon: "code" },
    { id: "flags", label: "Feature Flags", icon: "flag" },
    { id: "branding", label: "Default Branding", icon: "paint-bucket" },
    { id: "legal", label: "Legal & Compliance", icon: "scale" },
    { id: "danger", label: "Danger Zone", icon: "alert-triangle", danger: true },
  ];
  return (
    <div className="adm-board dirH">
      <DirH_Sidebar active="platform" role="super" />
      <div className="dirH__main">
        <DirH_Top crumbs={["Admin", "Platform Settings"]} right={
          <>
            <span className="muted" style={{ fontSize: 11 }}>Unsaved changes</span>
            <button className="btn btn--ghost btn--xs">Discard</button>
            <button className="btn btn--primary btn--xs"><Icon name="save" size={12} /> Save changes</button>
          </>
        } />

        <div className="dirH__page" style={{ display: "grid", gridTemplateColumns: "240px 1fr", padding: 0, minHeight: 0 }}>
          {/* Section nav */}
          <div style={{ background: "#fff", borderRight: "1px solid var(--br-border)", padding: "16px 8px", overflow: "auto" }}>
            <div className="eyebrow" style={{ padding: "2px 12px 8px" }}>Configuration</div>
            {sections.map((s) => (
              <button key={s.id} className={"dirH__nav-item " + (s.on ? "is-active" : "")} style={{ width: "100%", color: s.danger ? "#b91c1c" : undefined }}>
                <Icon name={s.icon} size={13} />
                <span>{s.label}</span>
                {s.danger ? null : <Icon name="chevron-right" size={11} style={{ marginLeft: "auto", color: "#cbd5e1" }} />}
              </button>
            ))}
            <div style={{ borderTop: "1px solid var(--br-border)", marginTop: 12, paddingTop: 12, padding: "12px 12px 0" }}>
              <div className="muted" style={{ fontSize: 11 }}>Platform version</div>
              <div className="mono" style={{ fontSize: 11.5, marginTop: 2 }}>cncpt v2.40.3</div>
              <div className="muted" style={{ fontSize: 10.5, marginTop: 6 }}>last deploy 4d ago</div>
            </div>
          </div>

          {/* Settings body */}
          <div style={{ overflow: "auto", background: "var(--br-surface)" }}>
            <div style={{ padding: "20px 24px" }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, letterSpacing: "-0.01em" }}>General</h2>
              <p className="muted" style={{ margin: "2px 0 0", fontSize: 12.5 }}>Platform identity, regional defaults, and operational basics.</p>
            </div>
            <div style={{ padding: "0 24px 24px" }}>
              {/* Identity */}
              <div className="card" style={{ marginBottom: 14 }}>
                <div className="card__head"><h3 className="card__title">Platform identity</h3></div>
                <div className="card__body" style={{ display: "grid", gridTemplateColumns: "200px 1fr", rowGap: 14, columnGap: 18, padding: 18 }}>
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 500 }}>Platform name</div>
                    <div className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>Shown in nav & emails</div>
                  </div>
                  <div className="row" style={{ background: "#fff", border: "1px solid var(--br-border)", borderRadius: 6, padding: "7px 10px", fontSize: 12.5, gap: 6 }}>
                    CNCPT Designer
                  </div>

                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 500 }}>Marketing URL</div>
                    <div className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>Where "Back to site" links go</div>
                  </div>
                  <div className="row" style={{ background: "#fff", border: "1px solid var(--br-border)", borderRadius: 6, padding: "7px 10px", fontSize: 12.5, gap: 6 }}>
                    <span className="mono">https://cncpt-designer.com</span>
                  </div>

                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 500 }}>Logo</div>
                    <div className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>SVG · max 200×60</div>
                  </div>
                  <div className="row" style={{ gap: 10 }}>
                    <div style={{ width: 64, height: 36, borderRadius: 6, background: "var(--gr-blue-purple)", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                      <Icon name="palette" size={16} />
                    </div>
                    <button className="btn btn--secondary btn--xs"><Icon name="upload" size={12} /> Upload</button>
                    <button className="btn btn--ghost btn--xs">Reset</button>
                  </div>

                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 500 }}>Default locale</div>
                    <div className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>New tenants inherit this</div>
                  </div>
                  <div className="row between" style={{ background: "#fff", border: "1px solid var(--br-border)", borderRadius: 6, padding: "7px 10px", fontSize: 12.5 }}>
                    <span>English (United States)</span><Icon name="chevron-down" size={12} style={{ color: "#94a3b8" }} />
                  </div>

                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 500 }}>Default timezone</div>
                    <div className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>For new tenants & reports</div>
                  </div>
                  <div className="row between" style={{ background: "#fff", border: "1px solid var(--br-border)", borderRadius: 6, padding: "7px 10px", fontSize: 12.5 }}>
                    <span>America / New_York · UTC−5</span><Icon name="chevron-down" size={12} style={{ color: "#94a3b8" }} />
                  </div>
                </div>
              </div>

              {/* Toggles card */}
              <div className="card" style={{ marginBottom: 14 }}>
                <div className="card__head"><h3 className="card__title">Operations</h3></div>
                <div className="card__body card__body--flush">
                  {[
                    { l: "Allow self-service signups", d: "Off blocks /signup — invites still work", on: true },
                    { l: "Auto-approve permission trials < 14 days", d: "Reduces queue noise for low-risk grants", on: false },
                    { l: "Public status page", d: "status.cncpt-designer.com", on: true },
                    { l: "Read-only mode", d: "Drops all writes platform-wide — for incidents only", on: false, warn: true },
                  ].map((s, i) => (
                    <div key={i} className="row between" style={{ padding: "13px 18px", borderBottom: "1px solid var(--br-border)" }}>
                      <div className="col" style={{ gap: 2 }}>
                        <div className="row" style={{ gap: 6 }}>
                          <span style={{ fontSize: 12.5, fontWeight: 500 }}>{s.l}</span>
                          {s.warn ? <span className="pill pill--rose" style={{ fontSize: 10 }}><Icon name="alert-triangle" size={10} /> use w/ care</span> : null}
                        </div>
                        <span className="muted" style={{ fontSize: 11.5 }}>{s.d}</span>
                      </div>
                      <span style={{ width: 32, height: 18, borderRadius: 9999, background: s.on ? "var(--br-primary)" : "#cbd5e1", position: "relative", display: "inline-block", flexShrink: 0 }}>
                        <span style={{ position: "absolute", top: 2, left: s.on ? 16 : 2, width: 14, height: 14, borderRadius: 9999, background: "#fff" }} />
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Defaults / quotas */}
              <div className="card" style={{ marginBottom: 14 }}>
                <div className="card__head">
                  <h3 className="card__title">New-tenant defaults</h3>
                  <button className="btn btn--ghost btn--xs">Preview signup flow <Icon name="arrow-up-right" size={11} /></button>
                </div>
                <div className="card__body" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, padding: 18 }}>
                  {[
                    { l: "Starting tier", v: "Free" },
                    { l: "Starting credits", v: "100" },
                    { l: "Max teams", v: "1" },
                    { l: "Trial length", v: "14 days" },
                    { l: "Default designer theme", v: "Brand blue" },
                    { l: "Default product set", v: "Apparel (3 SKUs)" },
                  ].map((m) => (
                    <div key={m.l} className="row between" style={{ padding: "8px 0", fontSize: 12.5, borderBottom: "1px solid var(--br-border)" }}>
                      <span className="muted">{m.l}</span>
                      <span className="row" style={{ gap: 5 }}><strong>{m.v}</strong><Icon name="pencil" size={11} style={{ color: "#94a3b8" }} /></span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Danger zone */}
              <div className="card" style={{ borderColor: "#fecaca" }}>
                <div className="card__head" style={{ background: "#fef2f2", borderBottom: "1px solid #fecaca" }}>
                  <h3 className="card__title" style={{ color: "#991b1b" }}><Icon name="alert-triangle" size={13} /> Danger zone</h3>
                </div>
                <div className="card__body card__body--flush">
                  {[
                    { l: "Rotate platform encryption key", d: "Re-encrypts all tenant secrets — 12–18 min · no downtime", cta: "Rotate" },
                    { l: "Force log-out all sessions", d: "Invalidates every JWT across all tenants", cta: "Sign everyone out" },
                    { l: "Purge soft-deleted tenants", d: "Permanently removes 14 tenants past 30-day retention", cta: "Purge 14" },
                  ].map((d, i) => (
                    <div key={i} className="row between" style={{ padding: "12px 18px", borderBottom: "1px solid var(--br-border)" }}>
                      <div className="col" style={{ gap: 1 }}>
                        <span style={{ fontSize: 12.5, fontWeight: 500 }}>{d.l}</span>
                        <span className="muted" style={{ fontSize: 11.5 }}>{d.d}</span>
                      </div>
                      <button className="btn btn--danger btn--xs">{d.cta}</button>
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

Object.assign(window, { Tab_Overrides, Tab_Shipped, Tab_Analytics, Tab_ActivityLog, Tab_Settings });
