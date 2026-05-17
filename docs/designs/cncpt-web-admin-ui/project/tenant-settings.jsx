/* TENANT — Account / Settings
   AI Credits, Billing & plan, Workspace branding (white-label),
   Workspace settings (general), Delete subdomain confirm modal. */

/* ─── AI Credits ─── */
const Tnt_Credits = () => {
  const usage = [
    { l: "AI copy",        v: 52300, c: "#3b82f6", icon: "edit-3"   },
    { l: "Image generation", v: 18400, c: "#06b6d4", icon: "image"    },
    { l: "Translation",    v: 3200,  c: "#a855f7", icon: "languages" },
    { l: "Smart support replies", v: 1100, c: "#10b981", icon: "message-square" },
    { l: "Other",          v: 200,   c: "#94a3b8", icon: "more-horizontal" },
  ];
  const total = 75200;
  return (
    <TntBoard>
      <Tnt_Sidebar active="credits" />
      <div className="dirH__main">
        <Tnt_Top
          crumbs={["Northgear", "Account", "AI Credits"]}
          right={
            <>
              <button className="btn btn--secondary btn--xs"><Icon name="history" size={12} /> Usage history</button>
              <button className="btn btn--primary btn--xs"><Icon name="zap" size={12} /> Top up credits</button>
            </>
          }
        />
        <div className="dirH__page" style={{ padding: "20px 24px", overflow: "auto" }}>
          <div className="tnt__page-h">
            <div>
              <h1>AI Credits</h1>
              <div className="sub">Credits power AI features across CNCPT — copywriting, images, translation, smart replies.</div>
            </div>
            <div className="row" style={{ gap: 8 }}>
              <span className="pill pill--blue"><Icon name="sparkles" size={11} /> 24,800 remaining</span>
              <span className="pill"><Icon name="repeat" size={11} /> Resets May 31</span>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16, marginBottom: 16 }}>
            {/* Pool */}
            <div className="card">
              <div className="card__head"><h3 className="card__title">Monthly credit pool</h3><span className="muted" style={{ fontSize: 11 }}>Growth plan · 100,000 credits/month</span></div>
              <div className="card__body">
                <div className="row between" style={{ marginBottom: 8 }}>
                  <div className="col" style={{ gap: 2 }}>
                    <span style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-0.02em" }}>24,800</span>
                    <span className="muted" style={{ fontSize: 12 }}>of 100,000 remaining · used 75,200 this month</span>
                  </div>
                  <div className="col" style={{ alignItems: "flex-end", gap: 2 }}>
                    <span className="muted" style={{ fontSize: 11 }}>Daily average</span>
                    <strong style={{ fontSize: 16 }}>4,180 / day</strong>
                  </div>
                </div>
                {/* Stacked usage bar */}
                <div style={{ display: "flex", height: 14, borderRadius: 8, overflow: "hidden", background: "var(--br-surface)", border: "1px solid var(--br-border)", marginBottom: 10 }}>
                  {usage.map(u => (
                    <div key={u.l} style={{ width: ((u.v / 100000) * 100) + "%", background: u.c }} title={u.l}></div>
                  ))}
                  <div style={{ flex: 1, background: "transparent" }}></div>
                </div>
                <div className="row" style={{ gap: 14, flexWrap: "wrap" }}>
                  {usage.map(u => (
                    <div key={u.l} className="row" style={{ gap: 6, fontSize: 11.5 }}>
                      <span style={{ width: 10, height: 10, borderRadius: 2, background: u.c }}></span>
                      <span className="muted">{u.l}</span>
                      <strong className="mono">{u.v.toLocaleString()}</strong>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 14, padding: 12, background: "var(--br-surface)", borderRadius: 8 }}>
                  <div className="row between">
                    <div className="col" style={{ gap: 2 }}>
                      <strong style={{ fontSize: 12.5 }}>Auto top-up</strong>
                      <span className="muted" style={{ fontSize: 11 }}>When balance falls below 10,000, add 50,000 credits ($99)</span>
                    </div>
                    <div className="tnt__toggle is-on"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Top consumers */}
            <div className="card">
              <div className="card__head"><h3 className="card__title">Top consumers this month</h3></div>
              <div>
                {[
                  { m: TNT_TEAM[4], v: 24800, p: 33 },
                  { m: TNT_TEAM[2], v: 18900, p: 25 },
                  { m: TNT_TEAM[0], v: 14200, p: 19 },
                  { m: TNT_TEAM[1], v: 9300,  p: 12 },
                  { m: TNT_TEAM[5], v: 6200,  p: 8  },
                ].map(r => (
                  <div key={r.m.id} className="row" style={{ padding: "10px 16px", gap: 10, borderBottom: "1px solid var(--br-border)" }}>
                    <div className={"avatar avatar--sm avatar--" + r.m.avatar}>{initials(r.m.name)}</div>
                    <div className="col" style={{ flex: 1, gap: 3 }}>
                      <div className="row between">
                        <span style={{ fontSize: 12.5, fontWeight: 500 }}>{r.m.name}</span>
                        <span className="mono" style={{ fontSize: 12 }}>{r.v.toLocaleString()}</span>
                      </div>
                      <div style={{ height: 4, background: "var(--br-surface)", borderRadius: 2, overflow: "hidden" }}>
                        <div style={{ width: r.p + "%", height: "100%", background: "linear-gradient(90deg, #3b82f6, #06b6d4)" }}></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent transactions */}
          <div className="card">
            <div className="card__head">
              <h3 className="card__title">Recent activity</h3>
              <div className="row" style={{ gap: 6 }}>
                <button className="btn btn--ghost btn--xs">All</button>
                <button className="btn btn--ghost btn--xs">Top-ups</button>
                <button className="btn btn--ghost btn--xs">Usage</button>
              </div>
            </div>
            <table className="dirH-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Member</th>
                  <th>Action</th>
                  <th>Site</th>
                  <th style={{ textAlign: "right" }}>Credits</th>
                  <th style={{ textAlign: "right" }}>Balance after</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { t: "3 minutes ago",  m: TNT_TEAM[4], a: "Generated 4 product descriptions",  s: "northgear", c: -240, bal: 24800 },
                  { t: "12 minutes ago", m: TNT_TEAM[2], a: "Smart reply · ticket #3081",        s: "northgear", c: -80,  bal: 25040 },
                  { t: "1 hour ago",     m: TNT_TEAM[1], a: "Image gen · hero banner",            s: "northgear", c: -1200, bal: 25120 },
                  { t: "Yesterday",      m: TNT_TEAM[0], a: "Top-up purchased",                   s: null,        c: +50000, bal: 26320 },
                  { t: "Yesterday",      m: TNT_TEAM[4], a: "Translated 12 product pages → FR",   s: "atlas-journal", c: -3200, bal: -23680 },
                ].map((r, i) => (
                  <tr key={i}>
                    <td className="muted" style={{ fontSize: 11.5 }}>{r.t}</td>
                    <td>
                      <div className="row" style={{ gap: 8 }}>
                        <div className={"avatar avatar--xs avatar--" + r.m.avatar}>{initials(r.m.name)}</div>
                        <span style={{ fontSize: 12 }}>{r.m.name}</span>
                      </div>
                    </td>
                    <td style={{ fontSize: 12 }}>{r.a}</td>
                    <td>{r.s ? <span className="tag-sm">{r.s}</span> : <span className="muted">—</span>}</td>
                    <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", color: r.c > 0 ? "#047857" : "var(--br-text)" }}>{r.c > 0 ? "+" : ""}{r.c.toLocaleString()}</td>
                    <td className="mono" style={{ textAlign: "right" }}>{Math.abs(r.bal).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <Tnt_AIDock topic="general" collapsed />
    </TntBoard>
  );
};

/* ─── Billing & subscription tier ─── */
const Tnt_Billing = () => {
  const plans = [
    { k: "Starter", price: "$29",  period: "/mo", desc: "Up to 1 site, 3 team members, 10K credits.", on: false },
    { k: "Growth",  price: "$249", period: "/mo", desc: "Up to 5 sites, 15 team members, 100K credits.", on: true, badge: "Current" },
    { k: "Scale",   price: "$799", period: "/mo", desc: "Unlimited sites, unlimited members, 500K credits, priority support.", on: false, badge: "Recommended" },
  ];
  return (
    <TntBoard>
      <Tnt_Sidebar active="billing" />
      <div className="dirH__main">
        <Tnt_Top
          crumbs={["Northgear", "Account", "Billing & plan"]}
          right={
            <>
              <button className="btn btn--secondary btn--xs"><Icon name="file-text" size={12} /> Invoices</button>
              <button className="btn btn--primary btn--xs"><Icon name="arrow-up" size={12} /> Upgrade plan</button>
            </>
          }
        />
        <div className="dirH__page" style={{ padding: "20px 24px", overflow: "auto" }}>
          <div className="tnt__page-h">
            <div>
              <h1>Billing & plan</h1>
              <div className="sub">Your subscription, payment methods, and invoice history.</div>
            </div>
          </div>

          {/* Plan cards */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card__head">
              <h3 className="card__title">Subscription</h3>
              <div className="row" style={{ gap: 6 }}>
                <span className="tag-sm">Billed monthly</span>
                <button className="btn btn--ghost btn--xs">Switch to yearly · save 20%</button>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 0 }}>
              {plans.map((p, i) => (
                <div key={p.k} style={{
                  padding: 18,
                  borderRight: i < plans.length - 1 ? "1px solid var(--br-border)" : "none",
                  background: p.on ? "linear-gradient(135deg, #eff6ff, #f0fdff)" : "#fff",
                  display: "flex", flexDirection: "column", gap: 10,
                  position: "relative",
                }}>
                  {p.badge ? (
                    <span style={{
                      position: "absolute", top: 12, right: 12,
                      fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 9999,
                      background: p.badge === "Current" ? "var(--br-primary)" : "#fef3c7",
                      color: p.badge === "Current" ? "#fff" : "#92400e",
                    }}>{p.badge}</span>
                  ) : null}
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--br-text-secondary)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>{p.k}</div>
                    <div className="row" style={{ alignItems: "baseline", gap: 4 }}>
                      <span style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em" }}>{p.price}</span>
                      <span className="muted" style={{ fontSize: 12 }}>{p.period}</span>
                    </div>
                  </div>
                  <p className="muted" style={{ fontSize: 11.5, lineHeight: 1.5, margin: 0 }}>{p.desc}</p>
                  <button className={"btn " + (p.on ? "btn--secondary" : "btn--primary") + " btn--xs"} style={{ marginTop: "auto" }}>
                    {p.on ? "Manage plan" : p.k === "Scale" ? "Upgrade to Scale" : "Switch to Starter"}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 16, marginBottom: 16 }}>
            {/* Next invoice */}
            <div className="card">
              <div className="card__head"><h3 className="card__title">Next invoice · June 1, 2026</h3></div>
              <div className="card__body" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { l: "Growth plan · monthly",       v: "$249.00" },
                  { l: "5 additional team seats",     v: "$50.00", muted: "(included up to 15)" },
                  { l: "AI credits · base pool",      v: "Included" },
                  { l: "Last month's overage · 4,200 credits", v: "$8.40" },
                ].map((r, i) => (
                  <div key={i} className="row between" style={{ padding: "4px 0", fontSize: 12.5 }}>
                    <span>{r.l} {r.muted ? <span className="muted">{r.muted}</span> : null}</span>
                    <span style={{ fontFamily: "var(--font-mono)" }}>{r.v}</span>
                  </div>
                ))}
                <div className="row between" style={{ padding: "10px 0 0", borderTop: "1px solid var(--br-border)", fontSize: 14, fontWeight: 700 }}>
                  <span>Total due</span>
                  <span style={{ fontFamily: "var(--font-mono)" }}>$257.40</span>
                </div>
              </div>
            </div>

            {/* Payment method */}
            <div className="card">
              <div className="card__head"><h3 className="card__title">Payment method</h3><button className="btn btn--ghost btn--xs">Update</button></div>
              <div className="card__body">
                <div className="row" style={{ gap: 12, padding: "8px 0" }}>
                  <div style={{ width: 44, height: 30, borderRadius: 5, background: "linear-gradient(135deg,#1a365d,#2c5282)", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800 }}>VISA</div>
                  <div className="col" style={{ gap: 1 }}>
                    <strong style={{ fontSize: 13 }}>Visa ending in 4242</strong>
                    <span className="muted" style={{ fontSize: 11.5 }}>Expires 09/2028 · Maya Patel</span>
                  </div>
                </div>
                <div className="row" style={{ gap: 4, padding: "6px 0", fontSize: 11.5 }}>
                  <Icon name="receipt" size={12} style={{ color: "var(--br-text-secondary)" }} />
                  <span className="muted">Billing email · </span><span>billing@northgear.com</span>
                </div>
                <div className="row" style={{ gap: 4, padding: "6px 0", fontSize: 11.5 }}>
                  <Icon name="map-pin" size={12} style={{ color: "var(--br-text-secondary)" }} />
                  <span className="muted">Billing address · </span><span>Northgear Inc · 38 Front St · Brooklyn, NY 11201</span>
                </div>
                <div className="row" style={{ gap: 4, padding: "6px 0", fontSize: 11.5 }}>
                  <Icon name="hash" size={12} style={{ color: "var(--br-text-secondary)" }} />
                  <span className="muted">VAT / EIN · </span><span className="mono">82-4194501</span>
                </div>
              </div>
            </div>
          </div>

          {/* Invoice history */}
          <div className="card">
            <div className="card__head"><h3 className="card__title">Invoice history</h3><button className="btn btn--ghost btn--xs"><Icon name="download" size={11} /> Export all</button></div>
            <table className="dirH-table">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Date</th>
                  <th>Description</th>
                  <th style={{ textAlign: "right" }}>Amount</th>
                  <th>Status</th>
                  <th style={{ width: 60 }}></th>
                </tr>
              </thead>
              <tbody>
                {[
                  { id: "INV-1042", d: "May 01, 2026", desc: "Growth plan · monthly",              v: "$249.00", s: "Paid" },
                  { id: "INV-1041", d: "Apr 22, 2026", desc: "Top-up · 50,000 credits",            v: "$99.00",  s: "Paid" },
                  { id: "INV-1040", d: "Apr 01, 2026", desc: "Growth plan · monthly + 2,100 overage", v: "$253.20", s: "Paid" },
                  { id: "INV-1039", d: "Mar 01, 2026", desc: "Growth plan · monthly",              v: "$249.00", s: "Paid" },
                  { id: "INV-1038", d: "Feb 01, 2026", desc: "Growth plan · monthly",              v: "$249.00", s: "Paid" },
                ].map(r => (
                  <tr key={r.id}>
                    <td className="mono" style={{ fontSize: 11.5 }}>{r.id}</td>
                    <td>{r.d}</td>
                    <td>{r.desc}</td>
                    <td style={{ textAlign: "right", fontFamily: "var(--font-mono)" }}>{r.v}</td>
                    <td><span className="pill pill--green" style={{ fontSize: 10.5 }}><span className="dot"></span> {r.s}</span></td>
                    <td>
                      <div className="row" style={{ gap: 4, justifyContent: "flex-end" }}>
                        <button className="iconbtn iconbtn--sm iconbtn--ghost"><Icon name="download" size={12} /></button>
                        <button className="iconbtn iconbtn--sm iconbtn--ghost"><Icon name="external-link" size={12} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <Tnt_AIDock topic="general" collapsed />
    </TntBoard>
  );
};

/* ─── Workspace branding (white-label) ─── */
const Tnt_WhiteLabel = () => (
  <TntBoard>
    <Tnt_Sidebar active="branding" />
    <div className="dirH__main">
      <Tnt_Top
        crumbs={["Northgear", "Workspace", "Branding"]}
        right={
          <>
            <button className="btn btn--secondary btn--xs"><Icon name="eye" size={12} /> Preview</button>
            <button className="btn btn--primary btn--xs">Save changes</button>
          </>
        }
      />
      <div className="tnt__tabs">
        {[
          { id: "ws",   l: "Workspace branding", i: "boxes",       on: true },
          { id: "ws2",  l: "Per-site branding",  i: "globe" },
          { id: "wl",   l: "Email templates",     i: "mail" },
          { id: "wl3",  l: "Domain settings",     i: "link" },
        ].map(t => <button key={t.id} className={"tnt__tab " + (t.on ? "is-on" : "")}><Icon name={t.i} size={13} /> {t.l}</button>)}
      </div>
      <div className="dirH__page" style={{ padding: "20px 24px", overflow: "auto" }}>
        <div className="tnt__page-h">
          <div>
            <h1>Workspace branding</h1>
            <div className="sub">Customize the admin dashboard and emails that go out from Northgear.</div>
          </div>
          <span className="pill pill--violet"><Icon name="crown" size={11} /> Available on Growth & Scale</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div className="col" style={{ gap: 16 }}>
            <div className="card">
              <div className="card__head"><h3 className="card__title">Workspace identity</h3></div>
              <div className="card__body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div className="tnt__field">
                  <span className="tnt__field-label">Workspace name</span>
                  <div className="tnt__input"><span style={{ flex: 1 }}>Northgear</span></div>
                </div>
                <div className="tnt__field">
                  <span className="tnt__field-label">Workspace logo</span>
                  <div className="row" style={{ gap: 12 }}>
                    <div style={{ width: 56, height: 56, borderRadius: 12, background: "linear-gradient(135deg, #0F172A, #3B82F6)", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 700 }}>N</div>
                    <div className="col" style={{ flex: 1, gap: 4 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 500 }}>northgear-logo.svg</span>
                      <span className="muted" style={{ fontSize: 11 }}>SVG · 4.2 KB · uploaded May 02</span>
                    </div>
                    <button className="btn btn--secondary btn--xs"><Icon name="upload" size={11} /> Replace</button>
                  </div>
                </div>
                <div className="tnt__field">
                  <span className="tnt__field-label">Favicon</span>
                  <div className="row" style={{ gap: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 6, background: "#0F172A", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700 }}>N</div>
                    <button className="btn btn--ghost btn--xs">Replace</button>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card__head"><h3 className="card__title">Brand colors</h3></div>
              <div className="card__body" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
                {[
                  { l: "Primary",       v: "#0F172A" },
                  { l: "Accent",        v: "#3B82F6" },
                  { l: "Background",    v: "#FFFFFF" },
                  { l: "Text",          v: "#0F172A" },
                ].map(c => (
                  <div key={c.l} className="row" style={{ gap: 10, padding: "8px 0" }}>
                    <div className="tnt__swatch" style={{ background: c.v }}></div>
                    <div className="col" style={{ flex: 1, gap: 1 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 500 }}>{c.l}</span>
                      <span className="mono" style={{ fontSize: 11, color: "var(--br-text-secondary)" }}>{c.v}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="card__head"><h3 className="card__title">Custom domain</h3></div>
              <div className="card__body">
                <div className="tnt__field">
                  <span className="tnt__field-label">Admin URL</span>
                  <div className="tnt__input">
                    <span style={{ flex: 1 }}>admin</span>
                    <span className="tnt__input-suffix">.northgear.com</span>
                  </div>
                  <span className="tnt__field-hint">Your team will access the admin dashboard at <span className="mono">admin.northgear.com</span>.</span>
                </div>
                <div className="row" style={{ gap: 6, marginTop: 10 }}>
                  <span className="pill pill--green" style={{ fontSize: 10.5 }}><span className="dot"></span> DNS verified</span>
                  <span className="pill pill--green" style={{ fontSize: 10.5 }}><span className="dot"></span> SSL active</span>
                </div>
              </div>
            </div>
          </div>

          <div className="col" style={{ gap: 16 }}>
            <div className="card">
              <div className="card__head"><h3 className="card__title">Email sender</h3></div>
              <div className="card__body" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div className="tnt__field">
                  <span className="tnt__field-label">From name</span>
                  <div className="tnt__input"><span style={{ flex: 1 }}>Northgear</span></div>
                </div>
                <div className="tnt__field">
                  <span className="tnt__field-label">From email</span>
                  <div className="tnt__input"><span style={{ flex: 1 }}>noreply@mail.northgear.com</span><span className="pill pill--green" style={{ fontSize: 10 }}><span className="dot"></span> Verified</span></div>
                </div>
                <div className="tnt__field">
                  <span className="tnt__field-label">Reply-to</span>
                  <div className="tnt__input"><span style={{ flex: 1 }}>support@northgear.com</span></div>
                </div>
              </div>
            </div>

            <div className="card" style={{ overflow: "hidden" }}>
              <div className="card__head"><h3 className="card__title">Preview · transactional email</h3></div>
              <div style={{ padding: 16, background: "var(--br-surface)" }}>
                <div style={{ background: "#fff", borderRadius: 8, overflow: "hidden", border: "1px solid var(--br-border)", maxWidth: 380, margin: "0 auto" }}>
                  <div style={{ background: "#0F172A", color: "#fff", padding: "14px 18px", display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 22, height: 22, borderRadius: 5, background: "#3B82F6", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>N</div>
                    <strong style={{ fontSize: 13 }}>Northgear</strong>
                  </div>
                  <div style={{ padding: 18, fontSize: 12.5, lineHeight: 1.6, color: "#1f2937" }}>
                    <strong>Hi Elena,</strong>
                    <p style={{ margin: "6px 0 0" }}>Thanks for your order! We've received order <strong>#N-2841</strong> and will let you know as soon as it ships.</p>
                    <a style={{ display: "inline-block", marginTop: 12, background: "#3B82F6", color: "#fff", padding: "8px 16px", borderRadius: 6, textDecoration: "none", fontSize: 12, fontWeight: 600 }}>View order</a>
                    <p style={{ margin: "14px 0 0", fontSize: 11, color: "#64748b" }}>
                      Questions? Reply to this email or visit <span style={{ color: "#3B82F6" }}>northgear.com/help</span>.
                    </p>
                  </div>
                  <div style={{ background: "#f8fafc", padding: 12, fontSize: 10.5, color: "#94a3b8", textAlign: "center" }}>
                    Northgear Inc · 38 Front St · Brooklyn, NY 11201
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card__head"><h3 className="card__title">Other branding</h3></div>
              <div>
                {[
                  { l: "Hide 'Powered by CNCPT' footer", on: true, d: "Removes the platform badge from your emails and admin." },
                  { l: "Custom email signature",          on: true, d: "Append a signature to all support replies." },
                  { l: "White-label support docs",         on: false, d: "Custom help center under your domain." },
                ].map((r, i) => (
                  <div key={i} className="row" style={{ padding: "12px 16px", borderBottom: i < 2 ? "1px solid var(--br-border)" : "none", gap: 12 }}>
                    <div className="col" style={{ flex: 1, gap: 2 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 500 }}>{r.l}</span>
                      <span className="muted" style={{ fontSize: 11 }}>{r.d}</span>
                    </div>
                    <div className={"tnt__toggle " + (r.on ? "is-on" : "")}></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <Tnt_AIDock topic="branding" />
  </TntBoard>
);

/* ─── Workspace settings (general) ─── */
const Tnt_WorkspaceSettings = () => (
  <TntBoard>
    <Tnt_Sidebar active="settings" />
    <div className="dirH__main">
      <Tnt_Top
        crumbs={["Northgear", "Workspace", "Settings"]}
        right={
          <button className="btn btn--primary btn--xs">Save changes</button>
        }
      />
      <div className="dirH__page" style={{ display: "grid", gridTemplateColumns: "220px 1fr", padding: 0, minHeight: 0 }}>
        <div style={{ borderRight: "1px solid var(--br-border)", background: "#fff", padding: "16px 8px", overflow: "auto" }}>
          {[
            { l: "General",          i: "settings",       on: true },
            { l: "Members & access", i: "users" },
            { l: "Branding",         i: "paintbrush" },
            { l: "Domains & DNS",    i: "globe" },
            { l: "Notifications",    i: "bell" },
            { l: "Security & SSO",   i: "shield-check" },
            { l: "Integrations",     i: "puzzle" },
            { l: "API & webhooks",   i: "key" },
            { l: "Data & exports",   i: "database" },
            { l: "Legal",            i: "scale" },
            { l: "Danger zone",      i: "alert-triangle", danger: true },
          ].map(s => (
            <button key={s.l} className={"dirH__nav-item " + (s.on ? "is-active" : "")} style={{ width: "100%" }}>
              <Icon name={s.i} size={13} /> <span style={{ color: s.danger ? "#b91c1c" : "inherit" }}>{s.l}</span>
            </button>
          ))}
        </div>

        <div style={{ padding: "20px 24px", overflow: "auto" }}>
          <div className="tnt__page-h">
            <div>
              <h1>General</h1>
              <div className="sub">Basic settings that apply to the whole Northgear workspace.</div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card__head"><h3 className="card__title">Workspace identity</h3></div>
            <div className="card__body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="tnt__field">
                <span className="tnt__field-label">Workspace name</span>
                <div className="tnt__input"><span style={{ flex: 1 }}>Northgear</span></div>
              </div>
              <div className="tnt__field">
                <span className="tnt__field-label">Workspace handle</span>
                <div className="tnt__input">
                  <span className="mono" style={{ flex: 1 }}>northgear</span>
                  <span className="tnt__input-suffix">.cncpt.app</span>
                </div>
                <span className="tnt__field-hint">Used for the default subdomain prefix and the API path.</span>
              </div>
              <div className="tnt__field">
                <span className="tnt__field-label">Default timezone</span>
                <div className="tnt__input"><span style={{ flex: 1 }}>America/New_York (UTC−05:00)</span><Icon name="chevron-down" size={12} /></div>
              </div>
              <div className="tnt__field">
                <span className="tnt__field-label">Default language</span>
                <div className="tnt__input"><span style={{ flex: 1 }}>English (United States)</span><Icon name="chevron-down" size={12} /></div>
              </div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card__head"><h3 className="card__title">Member defaults</h3></div>
            <div>
              {[
                { l: "Require 2FA for all members",            on: false, d: "New members must enable 2FA within 7 days of joining." },
                { l: "Allow members to invite others",          on: false, d: "Otherwise only Owners and Admins can send invites." },
                { l: "Auto-join from northgear.com email",      on: true,  d: "Anyone with a @northgear.com email auto-joins as Viewer." },
                { l: "Show all sites to new members by default", on: false, d: "Off: members are added with no site access until granted." },
              ].map((r, i) => (
                <div key={i} className="row" style={{ padding: "12px 16px", borderBottom: i < 3 ? "1px solid var(--br-border)" : "none", gap: 12 }}>
                  <div className="col" style={{ flex: 1, gap: 2 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 500 }}>{r.l}</span>
                    <span className="muted" style={{ fontSize: 11 }}>{r.d}</span>
                  </div>
                  <div className={"tnt__toggle " + (r.on ? "is-on" : "")}></div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card__head"><h3 className="card__title">Integrations · connected</h3><button className="btn btn--ghost btn--xs"><Icon name="plus" size={11} /> Connect new</button></div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 0 }}>
              {[
                { l: "Stripe",   d: "Payments",         i: "credit-card" },
                { l: "Shippo",   d: "Shipping rates",   i: "truck"       },
                { l: "Slack",    d: "Notifications",    i: "hash"        },
                { l: "Google Analytics", d: "Insights", i: "bar-chart-3" },
                { l: "Klaviyo",  d: "Email & SMS",      i: "send"        },
                { l: "Cloudflare", d: "DNS managed",    i: "globe"       },
              ].map((g, i, arr) => (
                <div key={g.l} style={{ padding: 14, borderRight: ((i + 1) % 3) !== 0 ? "1px solid var(--br-border)" : "none", borderBottom: i < 3 ? "1px solid var(--br-border)" : "none", display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 7, background: "var(--br-surface)", border: "1px solid var(--br-border)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon name={g.i} size={14} style={{ color: "var(--br-primary)" }} />
                  </div>
                  <div className="col" style={{ flex: 1, gap: 1 }}>
                    <strong style={{ fontSize: 12.5 }}>{g.l}</strong>
                    <span className="muted" style={{ fontSize: 11 }}>{g.d}</span>
                  </div>
                  <span className="pill pill--green" style={{ fontSize: 10 }}><span className="dot"></span> Connected</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  </TntBoard>
);

/* ─── Delete subdomain confirm modal ─── */
const Tnt_DeleteSubdomainModal = () => (
  <div className="tnt__modal-wrap">
    <div className="tnt__modal tnt__modal--wide">
      <div className="tnt__modal-head">
        <div className="tnt__modal-icon tnt__modal-icon--danger"><Icon name="trash-2" size={18} /></div>
        <div className="col" style={{ flex: 1, gap: 2 }}>
          <h3 className="tnt__modal-title">Delete <span className="mono">northgear-beta.cncpt.app</span>?</h3>
          <p className="tnt__modal-sub">This action will be retained for 30 days, after which all data is permanently erased.</p>
        </div>
      </div>
      <div className="tnt__modal-body" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div className="tnt__banner tnt__banner--err">
          <Icon name="alert-octagon" size={16} />
          <div className="tnt__banner-row">
            <span><b>This will delete:</b></span>
            <div className="col" style={{ gap: 4, marginTop: 4, fontSize: 11.5 }}>
              <div className="row" style={{ gap: 8 }}><Icon name="file-text" size={12} /> 42 pages · 18 blog posts · 6 product collections</div>
              <div className="row" style={{ gap: 8 }}><Icon name="users" size={12} /> 2 members' site-specific roles (workspace access preserved)</div>
              <div className="row" style={{ gap: 8 }}><Icon name="globe" size={12} /> Custom domain <span className="mono">beta.northgear.com</span> mapping</div>
              <div className="row" style={{ gap: 8 }}><Icon name="database" size={12} /> Analytics history (90 days)</div>
            </div>
          </div>
        </div>

        <div className="tnt__field">
          <span className="tnt__field-label">Type <span className="mono">northgear-beta</span> to confirm</span>
          <div className="tnt__input">
            <span className="tnt__input--placeholder" style={{ flex: 1 }}>Type the subdomain to continue…</span>
          </div>
        </div>

        <div className="row" style={{ gap: 8, fontSize: 11.5 }}>
          <input type="checkbox" />
          <span>I understand that <strong>northgear-beta.cncpt.app</strong> will become unreachable immediately.</span>
        </div>
      </div>
      <div className="tnt__modal-foot">
        <span className="row" style={{ gap: 5, fontSize: 11, color: "var(--br-text-secondary)" }}>
          <Icon name="clock" size={11} /> Available to restore for 30 days
        </span>
        <span style={{ flex: 1 }}></span>
        <button className="btn btn--secondary btn--xs">Cancel</button>
        <button className="btn btn--danger btn--xs" disabled style={{ opacity: 0.6 }}>Delete subdomain</button>
      </div>
    </div>
  </div>
);

/* ─── Error banner state (DNS broken) ─── */
const Tnt_DNSErrorState = () => (
  <TntBoard>
    <Tnt_Sidebar active="subdomains" />
    <div className="dirH__main">
      <Tnt_Top crumbs={["Northgear", "Subdomains", "Northgear · Beta", "DNS"]}
        right={
          <>
            <button className="btn btn--secondary btn--xs"><Icon name="rotate-cw" size={12} /> Recheck</button>
            <button className="btn btn--primary btn--xs">Save changes</button>
          </>
        }
      />
      <div className="tnt__tabs">
        {[
          { id: "ov",  l: "Overview",   i: "layout-dashboard" },
          { id: "vis", l: "Visibility", i: "eye" },
          { id: "dns", l: "DNS & domains", i: "globe", on: true },
          { id: "br",  l: "Branding",   i: "paintbrush" },
          { id: "ho",  l: "Hosting",    i: "server" },
        ].map(t => <button key={t.id} className={"tnt__tab " + (t.on ? "is-on" : "")}><Icon name={t.i} size={13} /> {t.l}</button>)}
      </div>
      <div className="dirH__page" style={{ padding: "20px 24px", overflow: "auto" }}>
        <div className="tnt__page-h">
          <div>
            <h1>DNS & domains</h1>
            <div className="sub">Custom domain <span className="mono">beta.northgear.com</span> isn't resolving correctly.</div>
          </div>
        </div>

        <div className="tnt__banner tnt__banner--err" style={{ marginBottom: 16 }}>
          <Icon name="alert-octagon" size={16} />
          <div className="tnt__banner-row">
            <span><b>DNS not propagating — verification failed</b><span className="sub"> · Your registrar has different values than what we expect. CNCPT can't issue an SSL certificate until this is resolved.</span></span>
            <div className="row" style={{ gap: 6, marginTop: 8 }}>
              <button className="btn btn--secondary btn--xs">Recheck now</button>
              <button className="btn btn--secondary btn--xs"><Icon name="sparkles" size={11} /> Ask CNCPT to fix it</button>
              <button className="btn btn--ghost btn--xs">Open guide</button>
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card__head">
            <h3 className="card__title">Required records</h3>
            <span className="row" style={{ gap: 5, fontSize: 11, color: "#b91c1c" }}>
              <span className="tnt__dot tnt__dot--err"></span> 2 records mismatched
            </span>
          </div>
          <table className="tnt__dns">
            <thead><tr><th>Type</th><th>Host</th><th>Expected value</th><th>Found at registrar</th><th>Status</th></tr></thead>
            <tbody>
              <tr>
                <td><span className="tnt__dns-type">A</span></td>
                <td className="is-label">@</td>
                <td>76.76.21.21</td>
                <td style={{ color: "#b91c1c" }}>123.45.67.89</td>
                <td><span className="row" style={{ gap: 5, fontSize: 11 }}><span className="tnt__dot tnt__dot--err"></span> Mismatch</span></td>
              </tr>
              <tr>
                <td><span className="tnt__dns-type">CNAME</span></td>
                <td className="is-label">www</td>
                <td>cname.cncpt.app</td>
                <td style={{ color: "#b91c1c" }}><span className="muted">— not found —</span></td>
                <td><span className="row" style={{ gap: 5, fontSize: 11 }}><span className="tnt__dot tnt__dot--err"></span> Missing</span></td>
              </tr>
              <tr>
                <td><span className="tnt__dns-type">TXT</span></td>
                <td className="is-label">_cncpt-verify</td>
                <td>cncpt-domain-verify=8e3a4b…</td>
                <td>cncpt-domain-verify=8e3a4b…</td>
                <td><span className="row" style={{ gap: 5, fontSize: 11 }}><span className="tnt__dot tnt__dot--ok"></span> Verified</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
    <Tnt_AIDock topic="dns" />
  </TntBoard>
);
