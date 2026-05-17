/* TENANT — Team & Permissions
   Screens: Members list, Roles & Permissions (toggles), Per-subdomain overrides,
   Invite modal overlay, Remove-member confirm overlay, Activity log. */

/* ─── Members list ─── */
const Tnt_Members = ({ modal = null }) => (
  <TntBoard modal={modal}>
    <Tnt_Sidebar active="members" />
    <div className="dirH__main">
      <Tnt_Top
        crumbs={["Northgear", "Team", "Members"]}
        right={
          <>
            <button className="btn btn--secondary btn--xs"><Icon name="filter" size={12} /> Filter</button>
            <button className="btn btn--secondary btn--xs"><Icon name="download" size={12} /> Export</button>
            <button className="btn btn--primary btn--xs"><Icon name="user-plus" size={12} /> Invite</button>
          </>
        }
      />
      <div className="dirH__page" style={{ padding: "20px 24px", overflow: "auto" }}>
        <div className="tnt__page-h">
          <div>
            <h1>Members</h1>
            <div className="sub">7 members and 2 pending invitations across your workspace.</div>
          </div>
          <div className="row" style={{ gap: 8 }}>
            <span className="pill" style={{ fontSize: 11 }}><span className="dot"></span> 6 of 15 seats used</span>
            <span className="pill pill--amber" style={{ fontSize: 11 }}><Icon name="shield-alert" size={11} /> 2 without 2FA</span>
          </div>
        </div>

        {/* Pending invitations */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card__head">
            <h3 className="card__title">Pending invitations</h3>
            <span className="muted" style={{ fontSize: 11 }}>2</span>
          </div>
          <div>
            {[
              { email: "alex.r@partner.io",     role: "Editor",  by: "Maya",  exp: "Expires in 6d" },
              { email: "design@studio-bear.com",role: "Marketing", by: "Mei", exp: "Expires in 2d" },
            ].map((iv, i) => (
              <div key={i} className="row" style={{ padding: "10px 16px", borderBottom: i === 0 ? "1px solid var(--br-border)" : "none", gap: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: 9999, background: "#eff6ff", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon name="mail" size={14} style={{ color: "var(--br-primary)" }} />
                </div>
                <div className="col" style={{ flex: 1, gap: 1 }}>
                  <strong style={{ fontSize: 12.5 }}>{iv.email}</strong>
                  <span className="muted" style={{ fontSize: 11 }}>Invited by {iv.by} as {iv.role} · {iv.exp}</span>
                </div>
                <span className={"role-chip " + (iv.role === "Editor" ? "role-chip--editor" : "role-chip--custom")}
                      style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10.5, fontWeight: 500, padding: "2px 7px", borderRadius: 4, background: iv.role === "Editor" ? "#ede9fe" : "#ccfbf1", color: iv.role === "Editor" ? "#6d28d9" : "#115e59" }}>
                  {iv.role}
                </span>
                <button className="btn btn--ghost btn--xs">Resend</button>
                <button className="btn btn--ghost btn--xs" style={{ color: "#b91c1c" }}>Revoke</button>
              </div>
            ))}
          </div>
        </div>

        {/* Members table */}
        <div className="card">
          <div className="card__head">
            <h3 className="card__title">All members</h3>
            <div className="row" style={{ gap: 6 }}>
              <div className="dirH__search" style={{ margin: 0, padding: "3px 8px" }}><Icon name="search" size={12} /><span className="dirH__search-q">Search members</span></div>
            </div>
          </div>
          <div style={{ overflow: "auto" }}>
            <table className="dirH-table">
              <thead>
                <tr>
                  <th style={{ width: 28 }}><input type="checkbox" /></th>
                  <th>Member</th>
                  <th>Role</th>
                  <th>Site access</th>
                  <th>2FA</th>
                  <th>Last active</th>
                  <th style={{ width: 60 }}></th>
                </tr>
              </thead>
              <tbody>
                {TNT_TEAM.map((m, i) => {
                  const roleColor = m.role === "Owner" ? "owner" : m.role === "Admin" ? "admin" : m.role === "Editor" ? "editor" : m.role === "Viewer" ? "viewer" : "custom";
                  return (
                    <tr key={m.id}>
                      <td><input type="checkbox" /></td>
                      <td>
                        <div className="row" style={{ gap: 9 }}>
                          <div className={"avatar avatar--sm avatar--" + m.avatar}>{initials(m.name)}</div>
                          <div className="col" style={{ gap: 0 }}>
                            <span style={{ fontWeight: 500 }}>{m.name}</span>
                            <span className="muted" style={{ fontSize: 11 }}>{m.email}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10.5, fontWeight: 500,
                          padding: "2px 7px", borderRadius: 4,
                          background: roleColor === "owner" ? "#fef3c7" : roleColor === "admin" ? "#dbeafe" : roleColor === "editor" ? "#ede9fe" : roleColor === "viewer" ? "#f1f5f9" : "#ccfbf1",
                          color: roleColor === "owner" ? "#92400e" : roleColor === "admin" ? "#1d4ed8" : roleColor === "editor" ? "#6d28d9" : roleColor === "viewer" ? "#475569" : "#115e59",
                        }}>
                          {roleColor === "owner" ? <Icon name="crown" size={10} /> : roleColor === "custom" ? <Icon name="wand-2" size={10} /> : null}
                          {m.role}
                        </span>
                      </td>
                      <td>
                        {m.sites.length === TNT_SITES.length
                          ? <span className="row" style={{ gap: 5, fontSize: 11.5 }}><Icon name="globe" size={11} style={{ color: "var(--br-text-secondary)" }} /> All sites</span>
                          : (
                            <div className="row" style={{ gap: 4, flexWrap: "wrap" }}>
                              {m.sites.map(sub => <span key={sub} className="tag-sm" style={{ fontSize: 10 }}>{sub}</span>)}
                            </div>
                          )}
                      </td>
                      <td>
                        {m.twoFA
                          ? <span className="row" style={{ gap: 4, fontSize: 11 }}><Icon name="shield-check" size={11} style={{ color: "#10b981" }} /> On</span>
                          : <span className="row" style={{ gap: 4, fontSize: 11, color: "#92400e" }}><Icon name="shield-alert" size={11} /> Off</span>
                        }
                      </td>
                      <td className="muted" style={{ fontSize: 11 }}>{m.lastActive}</td>
                      <td>
                        <button className="iconbtn iconbtn--sm iconbtn--ghost"><Icon name="more-horizontal" size={13} /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
    {!modal && <Tnt_AIDock topic="general" collapsed />}
  </TntBoard>
);

/* ─── Roles & Permissions ─── */
const Tnt_RolesPermissions = () => {
  const roles = TNT_ROLES; // ordered list
  return (
    <TntBoard>
      <Tnt_Sidebar active="roles" />
      <div className="dirH__main">
        <Tnt_Top
          crumbs={["Northgear", "Team", "Roles & Permissions"]}
          right={
            <>
              <button className="btn btn--secondary btn--xs"><Icon name="history" size={12} /> Audit log</button>
              <button className="btn btn--secondary btn--xs"><Icon name="copy" size={12} /> Duplicate role</button>
              <button className="btn btn--primary btn--xs"><Icon name="plus" size={12} /> New custom role</button>
            </>
          }
        />
        <div className="dirH__page" style={{ padding: "20px 24px", overflow: "auto" }}>
          <div className="tnt__page-h">
            <div>
              <h1>Roles &amp; Permissions</h1>
              <div className="sub">Toggle what each role can do. Custom roles let you fine-tune access for marketing, devs, contractors, and more.</div>
            </div>
          </div>

          {/* Role cards */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card__head">
              <h3 className="card__title">Roles</h3>
              <span className="muted" style={{ fontSize: 11 }}>3 built-in · 2 custom · 1 read-only</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 0 }}>
              {roles.map((r, i) => (
                <div key={r.key} style={{
                  padding: 14, borderRight: i < roles.length - 1 ? "1px solid var(--br-border)" : "none",
                  display: "flex", flexDirection: "column", gap: 6,
                }}>
                  <div className="row" style={{ gap: 6 }}>
                    <span style={{
                      width: 22, height: 22, borderRadius: 5,
                      background: r.color === "owner" ? "#fef3c7" : r.color === "admin" ? "#dbeafe" : r.color === "editor" ? "#ede9fe" : r.color === "custom" ? "#ccfbf1" : "#f1f5f9",
                      color: r.color === "owner" ? "#92400e" : r.color === "admin" ? "#1d4ed8" : r.color === "editor" ? "#6d28d9" : r.color === "custom" ? "#115e59" : "#475569",
                      display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}>
                      <Icon name={r.color === "owner" ? "crown" : r.color === "custom" ? "wand-2" : r.color === "viewer" ? "eye" : "shield"} size={12} />
                    </span>
                    <strong style={{ fontSize: 13 }}>{r.key}</strong>
                    {!r.builtin ? <span className="pill pill--violet" style={{ fontSize: 9.5, padding: "0px 5px" }}>Custom</span> : null}
                  </div>
                  <span className="muted" style={{ fontSize: 11, lineHeight: 1.4 }}>{r.desc}</span>
                  <div className="row between" style={{ marginTop: "auto", paddingTop: 4 }}>
                    <span className="muted" style={{ fontSize: 11 }}>{r.count} member{r.count === 1 ? "" : "s"}</span>
                    <button className="btn btn--ghost btn--xs"><Icon name="settings-2" size={11} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Permission toggles */}
          <div className="card">
            <div className="card__head">
              <div>
                <h3 className="card__title">Permissions matrix</h3>
                <div className="muted" style={{ fontSize: 11 }}>Toggle on/off per role. Owners always have everything.</div>
              </div>
              <div className="row" style={{ gap: 6 }}>
                <button className="btn btn--ghost btn--xs"><Icon name="rotate-ccw" size={11} /> Reset to default</button>
              </div>
            </div>

            {/* Header row */}
            <div className="tnt__perm-row" style={{ background: "var(--br-surface)", borderBottom: "1px solid var(--br-border)" }}>
              <div className="head-cell" style={{ textAlign: "left" }}>Capability</div>
              {["Admin","Editor","Marketing","Developer","Viewer"].map(r => <div key={r} className="head-cell">{r}</div>)}
            </div>

            {/* Groups */}
            {TNT_PERMS.map((grp) => (
              <React.Fragment key={grp.group}>
                <div className="row" style={{ padding: "10px 14px", background: "#fafafa", borderBottom: "1px solid var(--br-border)", gap: 8 }}>
                  <Icon name={grp.icon} size={13} style={{ color: "var(--br-primary)" }} />
                  <strong style={{ fontSize: 12 }}>{grp.group}</strong>
                  <span className="muted" style={{ fontSize: 11 }}>{grp.items.length} permissions</span>
                </div>
                {grp.items.map(p => (
                  <div key={p.key} className="tnt__perm-row">
                    <div className="col" style={{ gap: 2 }}>
                      <span className="tnt__perm-name">{p.label}</span>
                      <span className="tnt__perm-desc">{p.desc}</span>
                    </div>
                    {["Admin","Editor","Marketing","Developer","Viewer"].map(r => (
                      <div key={r} className="toggle-cell">
                        <div className={"tnt__toggle " + (p.roles[r] ? "is-on" : "")}></div>
                      </div>
                    ))}
                  </div>
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
      <Tnt_AIDock topic="permissions" />
    </TntBoard>
  );
};

/* ─── Per-subdomain access overrides ─── */
const Tnt_PerSiteAccess = () => (
  <TntBoard>
    <Tnt_Sidebar active="roles" />
    <div className="dirH__main">
      <Tnt_Top
        crumbs={["Northgear", "Team", "Roles & Permissions", "Per-site overrides"]}
        right={
          <>
            <button className="btn btn--secondary btn--xs"><Icon name="filter" size={12} /> Show only overrides</button>
            <button className="btn btn--primary btn--xs"><Icon name="plus" size={12} /> Add override</button>
          </>
        }
      />
      <div className="tnt__tabs">
        {[
          { id: "roles",    l: "Roles & Permissions", i: "shield-check" },
          { id: "override", l: "Per-site overrides",  i: "globe", on: true },
          { id: "api",      l: "API tokens",          i: "key" },
          { id: "audit",    l: "Audit log",           i: "history" },
        ].map(t => <button key={t.id} className={"tnt__tab " + (t.on ? "is-on" : "")}><Icon name={t.i} size={13} /> {t.l}</button>)}
      </div>
      <div className="dirH__page" style={{ padding: "20px 24px", overflow: "auto" }}>
        <div className="tnt__page-h">
          <div>
            <h1>Per-site access overrides</h1>
            <div className="sub">By default, a role applies to every site. Override a member's role on a specific subdomain here.</div>
          </div>
        </div>

        <div className="tnt__banner tnt__banner--info" style={{ marginBottom: 16 }}>
          <Icon name="info" size={16} />
          <div className="tnt__banner-row">
            <span><b>Reading the matrix:</b><span className="sub"> the chip shows that member's <em>effective</em> role on the site. A blue dot means it's overridden from the workspace default.</span></span>
          </div>
        </div>

        <div className="card">
          <div className="card__head">
            <h3 className="card__title">Access matrix</h3>
            <span className="muted" style={{ fontSize: 11 }}>7 members × 3 sites</span>
          </div>
          <div style={{ overflow: "auto" }}>
            <table className="tnt__matrix">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Workspace role</th>
                  {TNT_SITES.map(s => <th key={s.sub} style={{ textAlign: "center" }}>
                    <div className="col" style={{ alignItems: "center", gap: 1 }}>
                      <span>{s.title}</span>
                      <span className="mono" style={{ fontSize: 9.5, fontWeight: 400, color: "var(--br-text-secondary)", textTransform: "none", letterSpacing: 0 }}>{s.sub}.cncpt.app</span>
                    </div>
                  </th>)}
                </tr>
              </thead>
              <tbody>
                {TNT_TEAM.map(m => {
                  const overrides = {
                    "m4": { "northgear": "none" }, // diego only sees atlas
                    "m6": { "northgear": "viewer", "atlas-journal": "none" }, // tomas dev → viewer on prod
                    "m3": { "atlas-journal": "viewer" }, // aisha viewer on atlas
                  };
                  const defaultLevel = m.role.toLowerCase();
                  const ov = overrides[m.id] || {};
                  const roleChip = (lvl, isOv) => {
                    const map = {
                      owner: "role-chip--owner",
                      admin: "role-chip--admin",
                      editor: "role-chip--editor",
                      viewer: "role-chip--viewer",
                      marketing: "role-chip--custom",
                      developer: "role-chip--custom",
                      none: "role-chip--none",
                    };
                    return (
                      <span className={"role-chip " + (map[lvl] || "role-chip--editor")}>
                        {isOv ? <span style={{ width: 5, height: 5, borderRadius: 9999, background: "#3b82f6", display: "inline-block" }}></span> : null}
                        {lvl === "none" ? "No access" : (lvl[0].toUpperCase() + lvl.slice(1))}
                      </span>
                    );
                  };
                  return (
                    <tr key={m.id}>
                      <td>
                        <div className="row" style={{ gap: 8 }}>
                          <div className={"avatar avatar--xs avatar--" + m.avatar}>{initials(m.name)}</div>
                          <div className="col"><span style={{ fontWeight: 500 }}>{m.name}</span><span className="muted" style={{ fontSize: 10.5 }}>{m.email}</span></div>
                        </div>
                      </td>
                      <td>
                        <span className={"role-chip role-chip--" + (m.role === "Owner" ? "owner" : m.role === "Admin" ? "admin" : m.role === "Editor" ? "editor" : m.role === "Viewer" ? "viewer" : "custom")}>
                          {m.role}
                        </span>
                      </td>
                      {TNT_SITES.map(s => {
                        const isOv = ov[s.sub] !== undefined;
                        const lvl = isOv ? ov[s.sub] : defaultLevel;
                        return <td key={s.sub} className="center">{roleChip(lvl, isOv)}</td>;
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
    <Tnt_AIDock topic="permissions" collapsed />
  </TntBoard>
);

/* ─── Invite modal overlay ─── */
const Tnt_InviteModal = () => (
  <div className="tnt__modal-wrap">
    <div className="tnt__modal tnt__modal--wide">
      <div className="tnt__modal-head">
        <div className="tnt__modal-icon tnt__modal-icon--info"><Icon name="user-plus" size={18} /></div>
        <div className="col" style={{ flex: 1, gap: 2 }}>
          <h3 className="tnt__modal-title">Invite a team member</h3>
          <p className="tnt__modal-sub">They'll get an email link that expires in 7 days.</p>
        </div>
        <button className="iconbtn iconbtn--sm iconbtn--ghost"><Icon name="x" size={13} /></button>
      </div>
      <div className="tnt__modal-body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div className="tnt__field">
          <span className="tnt__field-label">Email address</span>
          <div className="tnt__input tnt__input--focused">
            <span style={{ flex: 1 }}>diego@partner.io</span>
            <Icon name="check-circle" size={14} style={{ color: "#10b981" }} />
          </div>
          <span className="tnt__field-hint">You can add multiple emails separated by commas.</span>
        </div>

        <div className="tnt__field">
          <span className="tnt__field-label">Role</span>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
            {[
              { k: "Admin",     d: "Everything except billing",        on: false },
              { k: "Editor",    d: "Edit and publish content",         on: true  },
              { k: "Marketing", d: "Campaigns & announcements",         on: false, custom: true },
              { k: "Developer", d: "DNS, hosting, API keys",            on: false, custom: true },
              { k: "Viewer",    d: "Read-only access",                  on: false },
              { k: "Custom…",   d: "Pick exact permissions",            on: false },
            ].map(r => (
              <div key={r.k} style={{
                padding: "10px 11px", borderRadius: 8,
                border: "1.5px solid " + (r.on ? "var(--br-primary)" : "var(--br-border)"),
                background: r.on ? "#eff6ff" : "#fff",
                cursor: "pointer",
                display: "flex", flexDirection: "column", gap: 3,
              }}>
                <div className="row" style={{ gap: 5 }}>
                  <strong style={{ fontSize: 12 }}>{r.k}</strong>
                  {r.custom ? <span className="pill pill--violet" style={{ fontSize: 9, padding: "0 4px" }}>Custom</span> : null}
                  {r.on ? <Icon name="check" size={12} style={{ color: "var(--br-primary)", marginLeft: "auto" }} /> : null}
                </div>
                <span className="muted" style={{ fontSize: 10.5, lineHeight: 1.4 }}>{r.d}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="tnt__field">
          <span className="tnt__field-label">Site access</span>
          <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
            {[
              { l: "All sites", on: false },
              { l: "Northgear", on: true },
              { l: "Atlas Journal", on: true },
              { l: "Northgear · Beta", on: false },
            ].map(c => (
              <span key={c.l} style={{
                padding: "5px 11px", fontSize: 12, borderRadius: 6,
                background: c.on ? "#eff6ff" : "#fff",
                border: "1px solid " + (c.on ? "var(--br-primary)" : "var(--br-border)"),
                color: c.on ? "var(--br-primary)" : "var(--br-text)",
                fontWeight: c.on ? 600 : 500,
                display: "inline-flex", alignItems: "center", gap: 5,
              }}>
                {c.on ? <Icon name="check" size={11} /> : null} {c.l}
              </span>
            ))}
          </div>
          <span className="tnt__field-hint">Diego will only see the sites you grant. You can override their role per site after invite.</span>
        </div>

        <div className="tnt__field">
          <span className="tnt__field-label">Personal note (optional)</span>
          <textarea className="tnt__textarea" defaultValue="Welcome Diego — you'll have Editor access on Atlas Journal. Ping me if you need anything!"></textarea>
        </div>
      </div>
      <div className="tnt__modal-foot">
        <button className="btn btn--ghost btn--xs"><Icon name="copy" size={11} /> Copy invite link</button>
        <span style={{ flex: 1 }}></span>
        <button className="btn btn--secondary btn--xs">Cancel</button>
        <button className="btn btn--primary btn--xs">Send invitation</button>
      </div>
    </div>
  </div>
);

/* ─── Remove member confirm ─── */
const Tnt_RemoveModal = () => (
  <div className="tnt__modal-wrap">
    <div className="tnt__modal">
      <div className="tnt__modal-head">
        <div className="tnt__modal-icon tnt__modal-icon--danger"><Icon name="user-minus" size={18} /></div>
        <div className="col" style={{ flex: 1, gap: 2 }}>
          <h3 className="tnt__modal-title">Remove Diego Ramírez from Northgear?</h3>
          <p className="tnt__modal-sub">They'll lose access to all sites immediately. Their drafts and comments will be preserved and attributed to a deactivated user.</p>
        </div>
      </div>
      <div className="tnt__modal-body" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div className="tnt__banner tnt__banner--warn">
          <Icon name="alert-triangle" size={16} />
          <div className="tnt__banner-row">
            <span><b>Diego owns 2 active items.</b><span className="sub"> Reassign before removing so nothing falls through the cracks:</span></span>
            <div className="col" style={{ gap: 6, marginTop: 6, fontSize: 11.5 }}>
              <div className="row" style={{ gap: 8 }}>
                <Icon name="message-square" size={12} />
                <span>Support ticket <span className="mono">#3076</span> — Wrong size shipped</span>
                <button className="btn btn--ghost btn--xs" style={{ marginLeft: "auto" }}>Reassign to…</button>
              </div>
              <div className="row" style={{ gap: 8 }}>
                <Icon name="send" size={12} />
                <span>Draft campaign — <em>Atlas Journal · Issue 02</em></span>
                <button className="btn btn--ghost btn--xs" style={{ marginLeft: "auto" }}>Reassign to…</button>
              </div>
            </div>
          </div>
        </div>

        <div className="tnt__field">
          <span className="tnt__field-label">Type <span className="mono">REMOVE DIEGO</span> to confirm</span>
          <div className="tnt__input">
            <span className="tnt__input--placeholder" style={{ flex: 1 }}>Type to continue…</span>
          </div>
        </div>
      </div>
      <div className="tnt__modal-foot">
        <button className="btn btn--secondary btn--xs">Cancel</button>
        <button className="btn btn--danger btn--xs" disabled style={{ opacity: 0.6 }}>Remove member</button>
      </div>
    </div>
  </div>
);

/* ─── Activity log ─── */
const Tnt_ActivityLog = () => (
  <TntBoard>
    <Tnt_Sidebar active="activity" />
    <div className="dirH__main">
      <Tnt_Top
        crumbs={["Northgear", "Team", "Activity log"]}
        right={
          <>
            <button className="btn btn--secondary btn--xs"><Icon name="filter" size={12} /> Filter</button>
            <button className="btn btn--secondary btn--xs"><Icon name="download" size={12} /> Export CSV</button>
          </>
        }
      />
      <div className="dirH__page" style={{ padding: "20px 24px", overflow: "auto" }}>
        <div className="tnt__page-h">
          <div>
            <h1>Activity log</h1>
            <div className="sub">Every action taken in your workspace, retained for 90 days.</div>
          </div>
          <div className="row" style={{ gap: 6 }}>
            <span className="pill" style={{ fontSize: 11 }}>All members</span>
            <span className="pill" style={{ fontSize: 11 }}>All sites</span>
            <span className="pill" style={{ fontSize: 11 }}>Last 7 days</span>
          </div>
        </div>

        <div className="card">
          {[
            { who: TNT_TEAM[0], a: "rotated API key", t: "prod-stripe", time: "2:42 PM",  d: "Today",     i: "key",       tone: "amber" },
            { who: TNT_TEAM[1], a: "published banner", t: "Summer Sale — 25% off",  time: "1:18 PM",  d: "Today",     i: "megaphone", tone: "blue" },
            { who: TNT_TEAM[5], a: "edited DNS record", t: "CNAME shop · northgear-beta", time: "12:04 PM", d: "Today", i: "globe",     tone: "amber" },
            { who: TNT_TEAM[2], a: "replied to ticket", t: "#3076 — Wrong size shipped", time: "11:32 AM", d: "Today", i: "message-square", tone: "blue" },
            { who: TNT_TEAM[0], a: "invited",           t: "diego@partner.io as Editor",  time: "10:15 AM", d: "Today", i: "user-plus", tone: "violet" },
            { who: TNT_TEAM[1], a: "approved comment",  t: "Atlas Journal — Issue 01",    time: "4:48 PM",  d: "Yesterday", i: "check-circle", tone: "ok" },
            { who: TNT_TEAM[4], a: "scheduled campaign", t: "Loyalty: early access drop",  time: "2:11 PM", d: "Yesterday", i: "send", tone: "blue" },
            { who: TNT_TEAM[0], a: "changed role",       t: "Aisha Brown · Editor → Marketing", time: "1:05 PM", d: "Yesterday", i: "shield-check", tone: "violet" },
            { who: TNT_TEAM[3], a: "uploaded asset",     t: "atlas-cover-issue-02.jpg",     time: "10:48 AM", d: "Yesterday", i: "image", tone: "blue" },
            { who: TNT_TEAM[6], a: "viewed analytics",   t: "Northgear · 30 day report",    time: "9:21 AM",  d: "Yesterday", i: "bar-chart-3", tone: "slate" },
            { who: TNT_TEAM[0], a: "updated billing",    t: "Switched payment method · Visa •••• 4242", time: "3:36 PM", d: "May 14", i: "credit-card", tone: "ok" },
            { who: TNT_TEAM[5], a: "created subdomain",  t: "northgear-beta.cncpt.app",     time: "10:02 AM", d: "May 14", i: "globe-2", tone: "violet" },
          ].map((e, i, arr) => {
            const showDate = i === 0 || arr[i - 1].d !== e.d;
            return (
              <React.Fragment key={i}>
                {showDate ? <div style={{ padding: "10px 16px", background: "var(--br-surface)", fontSize: 10.5, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--br-text-secondary)" }}>{e.d}</div> : null}
                <div className="tnt__act-row">
                  <div className={"avatar avatar--sm avatar--" + e.who.avatar}>{initials(e.who.name)}</div>
                  <div className="tnt__act-body" style={{ flex: 1 }}>
                    <strong style={{ fontSize: 12.5 }}>{e.who.name}</strong> <span style={{ fontSize: 12 }}>{e.a}</span> <span style={{ fontSize: 12 }}>{e.t.match(/^#|^v?\d|\.cncpt/) || e.t.match(/^prod-|^atlas-/) ? <span className="mono" style={{ fontSize: 11 }}>{e.t}</span> : <span style={{ color: "var(--br-text-secondary)" }}>{e.t}</span>}</span>
                  </div>
                  <span className="tnt__act-time" style={{ minWidth: 60, textAlign: "right" }}>{e.time}</span>
                  <div className="tnt__act-icon"><Icon name={e.i} size={12} /></div>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
    <Tnt_AIDock topic="general" collapsed />
  </TntBoard>
);
