/* TENANT — Communications hub
   Sub-screens: Support inbox (3-pane), Announcements, Email campaigns,
   Team messages, Customer feedback, Notifications center.

   All share the same `Tnt_Sidebar` chrome; their active item differs. */

/* ─── Support ticket inbox (3-pane) ─── */
const Tnt_SupportInbox = () => {
  const sel = TNT_TICKETS[0];
  return (
    <TntBoard>
      <Tnt_Sidebar active="tickets" />
      <div className="dirH__main">
        <Tnt_Top
          crumbs={["Northgear", "Communications", "Support inbox"]}
          right={
            <>
              <span className="pill pill--rose" style={{ fontSize: 11 }}><Icon name="alarm-clock" size={11} /> 1 SLA at risk</span>
              <button className="btn btn--secondary btn--xs"><Icon name="filter" size={12} /> Filters</button>
              <button className="btn btn--primary btn--xs"><Icon name="plus" size={12} /> New ticket</button>
            </>
          }
        />
        <div className="dirH__page" style={{ display: "grid", gridTemplateColumns: "220px 1.1fr 1.3fr", padding: 0, minHeight: 0 }}>
          {/* Channels rail */}
          <div style={{ background: "#fff", borderRight: "1px solid var(--br-border)", overflow: "auto" }}>
            <div className="eyebrow" style={{ padding: "12px 14px 6px" }}>Channels</div>
            {[
              { l: "All inboxes",       i: "inbox",      n: 28, on: false },
              { l: "Unassigned",        i: "user-x",     n: 9,  on: true },
              { l: "Assigned to me",    i: "user",       n: 6 },
              { l: "Awaiting customer", i: "hourglass",  n: 4 },
              { l: "Closed",            i: "check-circle", n: 218 },
            ].map(c => (
              <div key={c.l} className={"tnt__chan-row " + (c.on ? "is-on" : "")}>
                <div className="tnt__chan-icon"><Icon name={c.i} size={15} /></div>
                <span style={{ flex: 1, fontSize: 12.5, fontWeight: c.on ? 600 : 500 }}>{c.l}</span>
                <span className="muted mono" style={{ fontSize: 11 }}>{c.n}</span>
              </div>
            ))}

            <div className="eyebrow" style={{ padding: "16px 14px 6px" }}>By site</div>
            {[
              { l: "Northgear",       n: 16, dot: "#3b82f6" },
              { l: "Atlas Journal",   n: 9,  dot: "#f59e0b" },
              { l: "Northgear · Beta", n: 3,  dot: "#1E40AF" },
            ].map(c => (
              <div key={c.l} className="tnt__chan-row">
                <div className="tnt__chan-icon" style={{ borderColor: c.dot }}>
                  <span style={{ width: 10, height: 10, borderRadius: 9999, background: c.dot }}></span>
                </div>
                <span style={{ flex: 1, fontSize: 12.5 }}>{c.l}</span>
                <span className="muted mono" style={{ fontSize: 11 }}>{c.n}</span>
              </div>
            ))}

            <div className="eyebrow" style={{ padding: "16px 14px 6px" }}>Tags</div>
            <div style={{ padding: "0 14px 14px", display: "flex", flexDirection: "column", gap: 6 }}>
              {[
                { l: "shipping",   n: 8 },
                { l: "refund",     n: 4 },
                { l: "discount",   n: 2 },
                { l: "account",    n: 6 },
                { l: "wholesale",  n: 1 },
              ].map(t => (
                <div key={t.l} className="row" style={{ fontSize: 11.5, gap: 6 }}>
                  <Icon name="tag" size={11} style={{ color: "var(--br-text-secondary)" }} />
                  <span>#{t.l}</span>
                  <span className="muted mono" style={{ marginLeft: "auto" }}>{t.n}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Ticket list */}
          <div style={{ borderRight: "1px solid var(--br-border)", background: "#fff", display: "flex", flexDirection: "column", minHeight: 0 }}>
            <div className="row between" style={{ padding: "10px 14px", borderBottom: "1px solid var(--br-border)", background: "var(--br-surface)" }}>
              <div className="row" style={{ gap: 6 }}>
                <span style={{ fontSize: 12.5, fontWeight: 600 }}>Unassigned</span>
                <span className="muted mono" style={{ fontSize: 11 }}>9</span>
              </div>
              <button className="btn btn--ghost btn--xs">Sort: priority <Icon name="chevron-down" size={11} /></button>
            </div>
            <div style={{ overflow: "auto", flex: 1 }}>
              {TNT_TICKETS.map((t, i) => {
                const isSel = i === 0;
                const tone = t.priority === "high" ? "#dc2626" : t.priority === "med" ? "#a16207" : "#475569";
                return (
                  <div key={t.id} style={{
                    padding: "11px 14px", borderBottom: "1px solid var(--br-border)",
                    background: isSel ? "#eff6ff" : "transparent",
                    borderLeft: "3px solid " + (isSel ? "var(--br-primary)" : "transparent"),
                    paddingLeft: isSel ? 11 : 14,
                  }}>
                    <div className="row" style={{ gap: 10, alignItems: "flex-start" }}>
                      <div style={{ width: 4, alignSelf: "stretch", borderRadius: 2, background: tone, marginTop: 2, marginBottom: 2 }} />
                      <div className="col" style={{ gap: 3, flex: 1, minWidth: 0 }}>
                        <div className="row" style={{ gap: 6 }}>
                          {t.unread ? <span style={{ width: 6, height: 6, borderRadius: 9999, background: "#3b82f6" }}></span> : null}
                          <span className="mono" style={{ fontSize: 11, color: "var(--br-text-secondary)" }}>{t.id}</span>
                          <span className="tag-sm" style={{ fontSize: 10 }}>{t.site}</span>
                          {t.priority === "high" ? <span className="pill pill--rose" style={{ fontSize: 9.5 }}>High</span> : null}
                        </div>
                        <div style={{ fontSize: 12.5, fontWeight: t.unread ? 600 : 500, lineHeight: 1.3 }}>{t.subject}</div>
                        <div className="muted" style={{ fontSize: 11, lineHeight: 1.4, display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 1, overflow: "hidden" }}>
                          {t.from} · {t.snippet || "—"}
                        </div>
                      </div>
                      <div className="col" style={{ alignItems: "flex-end", gap: 4 }}>
                        <span className="muted" style={{ fontSize: 10.5 }}>{t.time}</span>
                        {t.assignee ? <div className={"avatar avatar--xs avatar--" + t.assignee.avatar}>{initials(t.assignee.name)}</div> : <div className="avatar avatar--xs" style={{ background: "#e2e8f0", color: "#475569" }}>?</div>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Conversation pane */}
          <div style={{ overflow: "auto", background: "var(--br-surface)" }}>
            <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--br-border)", background: "#fff" }}>
              <div className="row" style={{ gap: 6, marginBottom: 4 }}>
                <span className="pill pill--rose" style={{ fontSize: 10.5 }}><Icon name="alarm-clock" size={11} /> High</span>
                <span className="pill" style={{ fontSize: 10.5 }}><Icon name="tag" size={10} /> shipping</span>
                <span className="mono" style={{ fontSize: 11, color: "var(--br-text-secondary)" }}>{sel.id}</span>
              </div>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, letterSpacing: "-0.01em" }}>{sel.subject}</h2>
              <div className="row" style={{ gap: 8, marginTop: 5 }}>
                <span className="muted" style={{ fontSize: 11.5 }}>From <strong style={{ color: "var(--br-text)" }}>{sel.from}</strong> · {sel.site}.cncpt.app · {sel.time} ago</span>
                <span style={{ marginLeft: "auto" }} className="row" >
                  <button className="btn btn--ghost btn--xs"><Icon name="user-plus" size={11} /> Assign</button>
                  <button className="btn btn--ghost btn--xs"><Icon name="moon" size={11} /> Snooze</button>
                  <button className="btn btn--ghost btn--xs"><Icon name="check" size={11} /> Close</button>
                </span>
              </div>
            </div>

            <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
              {/* Customer message */}
              <div className="card">
                <div className="card__body" style={{ display: "flex", gap: 12 }}>
                  <div className="avatar avatar--lg avatar--slate" style={{ fontSize: 13 }}>EK</div>
                  <div className="col" style={{ gap: 5, flex: 1 }}>
                    <div className="row" style={{ gap: 6 }}>
                      <strong style={{ fontSize: 12.5 }}>Elena K.</strong>
                      <span className="muted" style={{ fontSize: 11 }}>elena.k@gmail.com · 8m ago</span>
                    </div>
                    <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.55, color: "var(--br-text)" }}>
                      Hi, my order <strong>#N-2841</strong> hasn't shipped yet — it's been a week and the tracking still says "label created". I emailed customer service two days ago and didn't hear back. Can someone look into this? I need it for next Saturday.
                    </p>
                    <div className="row" style={{ gap: 6, marginTop: 4, flexWrap: "wrap" }}>
                      <span className="tag-sm" style={{ fontSize: 10.5 }}><Icon name="paperclip" size={10} /> order-confirmation.pdf</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI-suggested reply preview */}
              <div className="card" style={{ borderColor: "#bfdbfe", background: "linear-gradient(135deg, rgba(59,130,246,0.04), rgba(6,182,212,0.04))" }}>
                <div className="card__head" style={{ borderColor: "#bfdbfe" }}>
                  <div className="row" style={{ gap: 8 }}>
                    <div style={{ width: 20, height: 20, borderRadius: 5, background: "linear-gradient(135deg, #3b82f6, #06b6d4)", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                      <Icon name="sparkles" size={11} />
                    </div>
                    <strong style={{ fontSize: 12.5, color: "#1d4ed8" }}>Suggested reply</strong>
                  </div>
                  <div className="row" style={{ gap: 6 }}>
                    <button className="btn btn--ghost btn--xs">Regenerate</button>
                    <button className="btn btn--primary btn--xs">Use draft</button>
                  </div>
                </div>
                <div className="card__body" style={{ fontSize: 12.5, lineHeight: 1.55 }}>
                  Hi Elena, I'm so sorry about the delay — I just looked into <span className="mono">#N-2841</span> and it appears the package is still with our fulfillment partner. I've escalated this with our warehouse and we'll expedite the shipment today. You'll get a tracking update within 24 hours. To make up for the inconvenience, I've added a $15 store credit to your account. Let me know if that doesn't show up. — Aisha
                  <div className="row" style={{ gap: 6, marginTop: 10 }}>
                    <span className="tag-sm" style={{ fontSize: 10.5 }}><Icon name="tag" size={10} /> shipping</span>
                    <span className="tag-sm" style={{ fontSize: 10.5 }}><Icon name="gift" size={10} /> $15 store credit</span>
                    <span className="tag-sm" style={{ fontSize: 10.5 }}><Icon name="zap" size={10} /> Action: escalate to warehouse</span>
                  </div>
                </div>
              </div>

              {/* Customer history */}
              <div className="card">
                <div className="card__head"><h3 className="card__title">Customer · Elena K.</h3><button className="btn btn--ghost btn--xs">Open profile <Icon name="arrow-up-right" size={11} /></button></div>
                <div className="card__body" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, fontSize: 12 }}>
                  <div className="col" style={{ gap: 1 }}><span className="muted">Lifetime value</span><strong>$1,284</strong></div>
                  <div className="col" style={{ gap: 1 }}><span className="muted">Orders</span><strong>11</strong></div>
                  <div className="col" style={{ gap: 1 }}><span className="muted">Member since</span><strong>Aug 2024</strong></div>
                  <div className="col" style={{ gap: 1 }}><span className="muted">Prior tickets</span><strong>2 · both resolved</strong></div>
                </div>
              </div>
            </div>

            {/* Reply composer */}
            <div style={{ padding: "12px 18px 18px", borderTop: "1px solid var(--br-border)", background: "#fff" }}>
              <div className="card" style={{ marginTop: 4 }}>
                <div className="card__head" style={{ padding: "8px 12px" }}>
                  <div className="row" style={{ gap: 8 }}>
                    <button className="btn btn--ghost btn--xs is-active" style={{ color: "var(--br-primary)" }}>Reply</button>
                    <button className="btn btn--ghost btn--xs">Internal note</button>
                  </div>
                  <div className="row" style={{ gap: 6 }}>
                    <button className="btn btn--ghost btn--xs"><Icon name="sparkles" size={11} /> AI tone</button>
                    <button className="btn btn--ghost btn--xs"><Icon name="file-text" size={11} /> Template</button>
                  </div>
                </div>
                <div className="card__body" style={{ padding: "10px 12px" }}>
                  <textarea className="tnt__textarea" style={{ width: "100%", border: "0", padding: 0, minHeight: 64 }} defaultValue="Hi Elena, I'm so sorry about the delay — let me look into #N-2841 right now…"></textarea>
                  <div className="row" style={{ marginTop: 8 }}>
                    <button className="iconbtn iconbtn--sm iconbtn--ghost"><Icon name="paperclip" size={13} /></button>
                    <button className="iconbtn iconbtn--sm iconbtn--ghost"><Icon name="smile" size={13} /></button>
                    <button className="iconbtn iconbtn--sm iconbtn--ghost"><Icon name="image" size={13} /></button>
                    <span style={{ flex: 1 }}></span>
                    <button className="btn btn--secondary btn--xs">Save draft</button>
                    <button className="btn btn--primary btn--xs">Send reply <Icon name="send" size={11} /></button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Tnt_AIDock topic="tickets" collapsed />
    </TntBoard>
  );
};

/* ─── Announcements ─── */
const Tnt_Announcements = () => (
  <TntBoard>
    <Tnt_Sidebar active="announce" />
    <div className="dirH__main">
      <Tnt_Top
        crumbs={["Northgear", "Communications", "Announcements"]}
        right={
          <>
            <button className="btn btn--secondary btn--xs"><Icon name="calendar" size={12} /> Schedule</button>
            <button className="btn btn--primary btn--xs"><Icon name="plus" size={12} /> New announcement</button>
          </>
        }
      />
      <div className="dirH__page" style={{ padding: "20px 24px", overflow: "auto" }}>
        <div className="tnt__page-h">
          <div>
            <h1>Announcements</h1>
            <div className="sub">Push banners, top-bars, and modals to your customers across any of your sites.</div>
          </div>
          <div className="row" style={{ gap: 8 }}>
            <span className="pill pill--green"><span className="dot"></span> 1 live</span>
            <span className="pill pill--blue"><span className="dot"></span> 1 scheduled</span>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16 }}>
          {/* Announcements list */}
          <div className="card">
            <div className="card__head">
              <h3 className="card__title">All announcements</h3>
              <div className="row" style={{ gap: 6 }}>
                <button className="btn btn--ghost btn--xs">All</button>
                <button className="btn btn--ghost btn--xs">Live</button>
                <button className="btn btn--ghost btn--xs">Scheduled</button>
                <button className="btn btn--ghost btn--xs">Draft</button>
              </div>
            </div>
            <div>
              {TNT_ANNOUNCE.map((a, i) => (
                <div key={a.id} style={{ padding: "14px 16px", borderBottom: i < TNT_ANNOUNCE.length - 1 ? "1px solid var(--br-border)" : "none" }}>
                  <div className="row between">
                    <div className="col" style={{ gap: 3, flex: 1, minWidth: 0 }}>
                      <div className="row" style={{ gap: 6 }}>
                        <span className="mono" style={{ fontSize: 11, color: "var(--br-text-secondary)" }}>{a.id}</span>
                        <span className={"pill " + (a.status === "Live" ? "pill--green" : a.status === "Scheduled" ? "pill--blue" : "pill--slate")} style={{ fontSize: 10.5 }}>
                          <span className="dot"></span> {a.status}
                        </span>
                        <span className="tag-sm" style={{ fontSize: 10 }}>{a.kind}</span>
                      </div>
                      <strong style={{ fontSize: 13 }}>{a.title}</strong>
                      <span className="muted" style={{ fontSize: 11.5 }}>
                        {a.audience} · {a.sites.join(", ")} · <em>{a.time}</em>
                      </span>
                    </div>
                    <div className="col" style={{ minWidth: 90, alignItems: "flex-end", gap: 1 }}>
                      <span className="muted" style={{ fontSize: 10.5 }}>Reach · Clicks</span>
                      <span style={{ fontSize: 12, fontWeight: 600 }}>{a.reach} · {a.clicks}</span>
                    </div>
                    <button className="iconbtn iconbtn--sm iconbtn--ghost"><Icon name="more-horizontal" size={13} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Live preview */}
          <div className="card">
            <div className="card__head">
              <h3 className="card__title">Live preview</h3>
              <div className="row" style={{ gap: 4 }}>
                <button className="iconbtn iconbtn--sm"><Icon name="monitor" size={12} /></button>
                <button className="iconbtn iconbtn--sm iconbtn--ghost"><Icon name="smartphone" size={12} /></button>
              </div>
            </div>
            <div style={{ padding: 14, background: "var(--br-surface)" }}>
              <div style={{ background: "#fff", borderRadius: 8, overflow: "hidden", border: "1px solid var(--br-border)" }}>
                {/* Banner */}
                <div style={{ background: "linear-gradient(135deg, #0F172A, #3B82F6)", color: "#fff", padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, fontSize: 12, fontWeight: 600 }}>
                  <Icon name="sparkles" size={12} />
                  Summer Sale — 25% off through Sunday
                  <span style={{ background: "#fff", color: "#0F172A", padding: "2px 9px", borderRadius: 9999, fontSize: 11, fontWeight: 700 }}>SUMMER25</span>
                </div>
                {/* fake page chrome */}
                <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.01em" }}>Northgear · Storefront</div>
                  <div style={{ fontSize: 11.5, color: "#475569" }}>Auto-applies the code at checkout. Visible to all visitors on northgear.com.</div>
                </div>
              </div>
            </div>
            <div className="card__body" style={{ borderTop: "1px solid var(--br-border)" }}>
              <div className="row between" style={{ fontSize: 11.5, marginBottom: 6 }}><span className="muted">Live since</span><span>2 days ago</span></div>
              <div className="row between" style={{ fontSize: 11.5, marginBottom: 6 }}><span className="muted">Audience</span><span>All visitors · Northgear</span></div>
              <div className="row between" style={{ fontSize: 11.5, marginBottom: 6 }}><span className="muted">Reach</span><span><strong>12,400</strong> impressions</span></div>
              <div className="row between" style={{ fontSize: 11.5 }}><span className="muted">Click-through</span><span><strong style={{ color: "#047857" }}>3.10%</strong> · 384 clicks</span></div>
              <div className="row" style={{ gap: 6, marginTop: 10 }}>
                <button className="btn btn--secondary btn--xs">Edit</button>
                <button className="btn btn--ghost btn--xs"><Icon name="pause" size={11} /> Pause</button>
                <button className="btn btn--ghost btn--xs" style={{ color: "#b91c1c", marginLeft: "auto" }}><Icon name="trash-2" size={11} /></button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <Tnt_AIDock topic="general" collapsed />
  </TntBoard>
);

/* ─── Email campaigns ─── */
const Tnt_Campaigns = () => (
  <TntBoard>
    <Tnt_Sidebar active="campaigns" />
    <div className="dirH__main">
      <Tnt_Top
        crumbs={["Northgear", "Communications", "Email campaigns"]}
        right={
          <>
            <button className="btn btn--secondary btn--xs"><Icon name="users" size={12} /> Audiences</button>
            <button className="btn btn--secondary btn--xs"><Icon name="file-text" size={12} /> Templates</button>
            <button className="btn btn--primary btn--xs"><Icon name="plus" size={12} /> New campaign</button>
          </>
        }
      />
      <div className="dirH__page" style={{ padding: "20px 24px", overflow: "auto" }}>
        <div className="tnt__page-h">
          <div>
            <h1>Email campaigns</h1>
            <div className="sub">Send newsletters, transactional emails, and automated flows to your customer list.</div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }}>
          {[
            { l: "Subscribers",      v: "8,420", i: "user-plus",     d: "+126 this week", up: true },
            { l: "Avg open rate",    v: "37.2%", i: "mail-open",     d: "+2.1pt vs prev", up: true },
            { l: "Avg click rate",   v: "8.4%",  i: "mouse-pointer", d: "−0.3pt vs prev", up: false },
            { l: "Unsubscribed · 7d", v: "12",   i: "user-minus",    d: "0.14% churn",    up: false },
          ].map(k => (
            <div className="tnt__stat" key={k.l}>
              <div className="tnt__stat-label"><Icon name={k.i} size={12} /> {k.l}</div>
              <div className="tnt__stat-value">{k.v}</div>
              <div className={"tnt__stat-delta " + (k.up ? "tnt__stat-delta--up" : "tnt__stat-delta--down")}>
                <Icon name={k.up ? "arrow-up-right" : "arrow-down-right"} size={12} /> {k.d}
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="card__head">
            <h3 className="card__title">Campaigns</h3>
            <div className="row" style={{ gap: 6 }}>
              <button className="btn btn--ghost btn--xs">All</button>
              <button className="btn btn--ghost btn--xs">Sent</button>
              <button className="btn btn--ghost btn--xs">Scheduled</button>
              <button className="btn btn--ghost btn--xs">Draft</button>
              <button className="btn btn--ghost btn--xs">Automations</button>
            </div>
          </div>
          <table className="dirH-table">
            <thead>
              <tr>
                <th>Campaign</th>
                <th>Status</th>
                <th>Sent to</th>
                <th>Opens</th>
                <th>Clicks</th>
                <th>Revenue</th>
                <th>Last activity</th>
                <th style={{ width: 28 }}></th>
              </tr>
            </thead>
            <tbody>
              {TNT_CAMPAIGNS.map((c, i) => (
                <tr key={c.id} className={i === 0 ? "is-selected" : ""}>
                  <td>
                    <div className="col" style={{ gap: 1 }}>
                      <strong style={{ fontSize: 12.5 }}>{c.title}</strong>
                      <span className="muted mono" style={{ fontSize: 10.5 }}>{c.id}</span>
                    </div>
                  </td>
                  <td>
                    <span className={"pill " + (c.status === "Sent" ? "pill--green" : c.status === "Active" ? "pill--blue" : c.status === "Draft" ? "pill--slate" : "pill--amber")} style={{ fontSize: 10.5 }}>
                      <span className="dot"></span> {c.status}
                    </span>
                  </td>
                  <td className="mono" style={{ fontSize: 12 }}>{c.sent}</td>
                  <td>
                    {typeof c.opens === "number"
                      ? <span>{c.opens.toLocaleString()} <span className="muted">({(c.opens / parseInt(c.sent.replace(/,/g,""))*100).toFixed(1)}%)</span></span>
                      : <span className="muted">—</span>}
                  </td>
                  <td>
                    {typeof c.clicks === "number"
                      ? <span>{c.clicks.toLocaleString()} <span className="muted">({(c.clicks / parseInt(c.sent.replace(/,/g,""))*100).toFixed(1)}%)</span></span>
                      : <span className="muted">—</span>}
                  </td>
                  <td>{i === 0 ? "$4,128" : i === 1 ? "$2,610" : i === 2 ? "$1,840 · MTD" : <span className="muted">—</span>}</td>
                  <td className="muted" style={{ fontSize: 11 }}>{c.time}</td>
                  <td><button className="iconbtn iconbtn--sm iconbtn--ghost"><Icon name="more-horizontal" size={13} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card" style={{ marginTop: 16 }}>
          <div className="card__head">
            <h3 className="card__title">Active automations</h3>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 0 }}>
            {[
              { l: "Welcome series",     d: "3 emails · sent over 7 days",  active: "2,140 active", state: "On" },
              { l: "Abandoned cart",     d: "1 email · 1 hour after abandon", active: "184 active", state: "On" },
              { l: "Win-back · 60 days", d: "1 email · for lapsed customers",  active: "62 active",   state: "Paused" },
            ].map((a, i, arr) => (
              <div key={a.l} style={{ padding: 14, borderRight: i < arr.length - 1 ? "1px solid var(--br-border)" : "none", display: "flex", flexDirection: "column", gap: 6 }}>
                <div className="row" style={{ gap: 6 }}>
                  <Icon name="repeat" size={13} style={{ color: "var(--br-primary)" }} />
                  <strong style={{ fontSize: 13 }}>{a.l}</strong>
                  <span className={"pill " + (a.state === "On" ? "pill--green" : "pill--amber")} style={{ marginLeft: "auto", fontSize: 10.5 }}>
                    <span className="dot"></span> {a.state}
                  </span>
                </div>
                <span className="muted" style={{ fontSize: 11.5, lineHeight: 1.4 }}>{a.d}</span>
                <span className="row" style={{ gap: 4, fontSize: 11, color: "var(--br-text-secondary)", marginTop: "auto" }}>
                  <Icon name="users" size={11} /> {a.active}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
    <Tnt_AIDock topic="general" collapsed />
  </TntBoard>
);

/* ─── Team messages (in-app between team members) ─── */
const Tnt_TeamMessages = () => (
  <TntBoard>
    <Tnt_Sidebar active="team-chat" />
    <div className="dirH__main">
      <Tnt_Top
        crumbs={["Northgear", "Communications", "Team messages"]}
        right={
          <>
            <button className="btn btn--secondary btn--xs"><Icon name="users" size={12} /> Members</button>
            <button className="btn btn--primary btn--xs"><Icon name="edit-3" size={12} /> New message</button>
          </>
        }
      />
      <div className="dirH__page" style={{ display: "grid", gridTemplateColumns: "240px 1fr", padding: 0, minHeight: 0 }}>
        {/* Channels */}
        <div style={{ background: "#fff", borderRight: "1px solid var(--br-border)", overflow: "auto" }}>
          <div className="eyebrow" style={{ padding: "12px 14px 6px" }}>Channels</div>
          {[
            { l: "general",   n: 2, on: false },
            { l: "marketing", n: 0, on: false },
            { l: "dev",       n: 5, on: true },
            { l: "support",   n: 1, on: false },
            { l: "design",    n: 0, on: false },
          ].map(c => (
            <div key={c.l} className={"tnt__chan-row " + (c.on ? "is-on" : "")}>
              <span style={{ fontSize: 13, color: "var(--br-text-secondary)", width: 12 }}>#</span>
              <span style={{ flex: 1, fontSize: 12.5, fontWeight: c.on ? 600 : 500 }}>{c.l}</span>
              {c.n > 0 ? <span style={{ background: "#3b82f6", color: "#fff", fontSize: 10, fontWeight: 600, padding: "1px 6px", borderRadius: 9999, minWidth: 16, textAlign: "center" }}>{c.n}</span> : null}
            </div>
          ))}

          <div className="eyebrow" style={{ padding: "16px 14px 6px" }}>Direct messages</div>
          {TNT_TEAM.slice(0, 5).map(m => (
            <div key={m.id} className="tnt__chan-row">
              <div className={"avatar avatar--sm avatar--" + m.avatar}>{initials(m.name)}</div>
              <span style={{ flex: 1, fontSize: 12.5 }}>{m.name}</span>
              <span style={{ width: 7, height: 7, borderRadius: 9999, background: m.id === "m1" ? "#10b981" : "#cbd5e1" }}></span>
            </div>
          ))}
        </div>

        {/* Conversation */}
        <div style={{ display: "flex", flexDirection: "column", minHeight: 0, background: "#fff" }}>
          <div className="row between" style={{ padding: "12px 18px", borderBottom: "1px solid var(--br-border)" }}>
            <div className="col" style={{ gap: 1 }}>
              <strong style={{ fontSize: 14 }}>#dev</strong>
              <span className="muted" style={{ fontSize: 11 }}>4 members · Maya, Jonas, Tomás, Mei</span>
            </div>
            <div className="row" style={{ gap: 6 }}>
              <button className="btn btn--ghost btn--xs"><Icon name="bell" size={11} /></button>
              <button className="btn btn--ghost btn--xs"><Icon name="pin" size={11} /> 2 pinned</button>
              <button className="iconbtn iconbtn--sm iconbtn--ghost"><Icon name="more-horizontal" size={13} /></button>
            </div>
          </div>

          <div style={{ flex: 1, overflow: "auto", padding: "18px 22px", display: "flex", flexDirection: "column", gap: 14, background: "#fff" }}>
            {[
              { who: TNT_TEAM[5], time: "10:08 AM", text: "Beta build is green. Should I flip the DNS now or wait?" },
              { who: TNT_TEAM[0], time: "10:09 AM", text: "Let's wait until after the morning standup — we should double-check the privacy page first." },
              { who: TNT_TEAM[5], time: "10:11 AM", text: "Cool. I'll prep the cutover doc.", reactions: [{ e: "👍", n: 2 }, { e: "🚀", n: 1 }] },
              { who: TNT_TEAM[1], time: "10:24 AM", text: "Pushed the new hero variant — want a look before we publish?", attach: "northgear-hero-v3.png" },
              { who: TNT_TEAM[0], time: "10:42 AM", text: "Yes! Going to pull it up now." },
            ].map((m, i) => (
              <div key={i} className="row" style={{ alignItems: "flex-start", gap: 10 }}>
                <div className={"avatar avatar--" + m.who.avatar}>{initials(m.who.name)}</div>
                <div className="col" style={{ flex: 1, gap: 3 }}>
                  <div className="row" style={{ gap: 6 }}>
                    <strong style={{ fontSize: 12.5 }}>{m.who.name}</strong>
                    <span className="muted" style={{ fontSize: 11 }}>{m.time}</span>
                  </div>
                  <div style={{ fontSize: 13, lineHeight: 1.55 }}>{m.text}</div>
                  {m.attach ? (
                    <div className="row" style={{ gap: 6, marginTop: 4, padding: "6px 10px", background: "var(--br-surface)", border: "1px solid var(--br-border)", borderRadius: 6, fontSize: 11, alignSelf: "flex-start" }}>
                      <Icon name="image" size={12} style={{ color: "var(--br-primary)" }} /> {m.attach}
                    </div>
                  ) : null}
                  {m.reactions ? (
                    <div className="row" style={{ gap: 4, marginTop: 4 }}>
                      {m.reactions.map((r, j) => (
                        <span key={j} style={{ border: "1px solid var(--br-border)", borderRadius: 9999, padding: "1px 7px", fontSize: 11, background: "#fff" }}>
                          {r.e} {r.n}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>

          {/* Composer */}
          <div style={{ padding: "10px 18px 14px", borderTop: "1px solid var(--br-border)", background: "#fff" }}>
            <div className="tnt__input" style={{ padding: "10px 12px" }}>
              <span style={{ flex: 1, color: "var(--br-text-secondary)" }}>Message #dev…</span>
              <button className="iconbtn iconbtn--sm iconbtn--ghost"><Icon name="paperclip" size={13} /></button>
              <button className="iconbtn iconbtn--sm iconbtn--ghost"><Icon name="at-sign" size={13} /></button>
              <button className="iconbtn iconbtn--sm"><Icon name="send" size={13} /></button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <Tnt_AIDock topic="general" collapsed />
  </TntBoard>
);

/* ─── Customer feedback board ─── */
const Tnt_Feedback = () => (
  <TntBoard>
    <Tnt_Sidebar active="feedback" />
    <div className="dirH__main">
      <Tnt_Top
        crumbs={["Northgear", "Communications", "Feedback board"]}
        right={
          <>
            <button className="btn btn--secondary btn--xs"><Icon name="filter" size={12} /> Filter</button>
            <button className="btn btn--secondary btn--xs"><Icon name="external-link" size={12} /> Public board</button>
          </>
        }
      />
      <div className="dirH__page" style={{ padding: "20px 24px", overflow: "auto" }}>
        <div className="tnt__page-h">
          <div>
            <h1>Customer feedback</h1>
            <div className="sub">Feature requests and ideas from your customers, with voting.</div>
          </div>
          <div className="row" style={{ gap: 8 }}>
            <span className="pill"><span className="dot"></span> 142 total</span>
            <span className="pill pill--blue"><Icon name="trending-up" size={11} /> 22 this week</span>
          </div>
        </div>

        {/* Kanban */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          {[
            { col: "Under review", count: 18, tone: "slate", items: TNT_FEEDBACK.filter(f => f.status === "Under review") },
            { col: "Planned",      count: 5,  tone: "blue",  items: TNT_FEEDBACK.filter(f => f.status === "Planned") },
            { col: "In progress",  count: 3,  tone: "amber", items: TNT_FEEDBACK.filter(f => f.status === "In progress") },
            { col: "Shipped",      count: 38, tone: "green", items: TNT_FEEDBACK.filter(f => f.status === "Shipped") },
          ].map(c => (
            <div key={c.col} className="card" style={{ background: "var(--br-surface)" }}>
              <div className="card__head" style={{ background: "#fff" }}>
                <div className="row" style={{ gap: 6 }}>
                  <span className={"tnt__dot tnt__dot--" + (c.tone === "green" ? "ok" : c.tone === "amber" ? "warn" : "idle")}></span>
                  <strong style={{ fontSize: 12.5 }}>{c.col}</strong>
                  <span className="muted mono" style={{ fontSize: 11 }}>{c.count}</span>
                </div>
                <button className="iconbtn iconbtn--sm iconbtn--ghost"><Icon name="plus" size={12} /></button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: 10 }}>
                {c.items.map(f => (
                  <div key={f.id} className="card" style={{ background: "#fff", padding: 12, display: "flex", flexDirection: "column", gap: 6 }}>
                    <div className="row" style={{ gap: 6, alignItems: "flex-start" }}>
                      <div className="col" style={{ alignItems: "center", padding: "4px 6px", borderRadius: 6, background: "var(--br-surface)", border: "1px solid var(--br-border)", flexShrink: 0 }}>
                        <Icon name="chevron-up" size={11} />
                        <strong style={{ fontSize: 11 }}>{f.votes}</strong>
                      </div>
                      <span style={{ fontSize: 12.5, fontWeight: 500, lineHeight: 1.4 }}>{f.title}</span>
                    </div>
                    <div className="row" style={{ gap: 6, fontSize: 10.5 }}>
                      <span className="tag-sm">{f.site}</span>
                      <span className="muted" style={{ marginLeft: "auto" }}>{f.time} ago</span>
                    </div>
                  </div>
                ))}
                {c.items.length === 0
                  ? <div className="muted" style={{ fontSize: 11, padding: 8, textAlign: "center" }}>No items</div>
                  : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
    <Tnt_AIDock topic="general" collapsed />
  </TntBoard>
);

/* ─── Notifications (the tenant's own platform notifications) ─── */
const Tnt_Notifications = () => (
  <TntBoard>
    <Tnt_Sidebar active="inbox" />
    <div className="dirH__main">
      <Tnt_Top
        crumbs={["Northgear", "Notifications"]}
        right={
          <>
            <button className="btn btn--secondary btn--xs"><Icon name="check-check" size={12} /> Mark all read</button>
            <button className="btn btn--secondary btn--xs"><Icon name="settings" size={12} /> Preferences</button>
          </>
        }
      />
      <div className="dirH__page" style={{ padding: "20px 24px", overflow: "auto" }}>
        <div className="tnt__page-h">
          <div>
            <h1>Notifications</h1>
            <div className="sub">System updates, billing, deployment status, and team activity from CNCPT.</div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 16 }}>
          <div className="card">
            <div className="card__head">
              <div className="row" style={{ gap: 6 }}>
                <button className="btn btn--ghost btn--xs is-active" style={{ color: "var(--br-primary)" }}>All</button>
                <button className="btn btn--ghost btn--xs">Unread <span className="muted">3</span></button>
                <button className="btn btn--ghost btn--xs">Billing</button>
                <button className="btn btn--ghost btn--xs">System</button>
                <button className="btn btn--ghost btn--xs">Team</button>
              </div>
            </div>
            <div>
              {TNT_NOTIFS.map((n, i) => (
                <div key={i} style={{
                  padding: "13px 16px",
                  borderBottom: i < TNT_NOTIFS.length - 1 ? "1px solid var(--br-border)" : "none",
                  background: !n.read ? "linear-gradient(90deg, rgba(59,130,246,0.04), transparent 60%)" : "transparent",
                  display: "flex", gap: 12, alignItems: "flex-start",
                }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: 8,
                    background: n.tone === "ok" ? "#ecfdf5" : n.tone === "warn" ? "#fffbeb" : n.tone === "info" ? "#eff6ff" : "#fef2f2",
                    color: n.tone === "ok" ? "#047857" : n.tone === "warn" ? "#b45309" : n.tone === "info" ? "#1d4ed8" : "#b91c1c",
                    display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    <Icon name={n.icon} size={14} />
                  </div>
                  <div className="col" style={{ flex: 1, gap: 2 }}>
                    <div className="row" style={{ gap: 6 }}>
                      {!n.read ? <span style={{ width: 6, height: 6, borderRadius: 9999, background: "#3b82f6" }}></span> : null}
                      <span style={{ fontSize: 12.5, fontWeight: !n.read ? 600 : 500 }}>{n.title}</span>
                    </div>
                    <span className="muted" style={{ fontSize: 11 }}>{n.time} ago · {n.kind}</span>
                  </div>
                  <div className="row" style={{ gap: 6 }}>
                    {n.kind === "credits" ? <button className="btn btn--primary btn--xs">Top up</button> : null}
                    {n.kind === "billing" ? <button className="btn btn--ghost btn--xs">View invoice</button> : null}
                    {n.kind === "deploy"  ? <button className="btn btn--ghost btn--xs">View build</button> : null}
                    <button className="iconbtn iconbtn--sm iconbtn--ghost"><Icon name="more-horizontal" size={13} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card__head"><h3 className="card__title">Notification preferences</h3></div>
            <div>
              {[
                { l: "Billing & payments",      e: true,  i: true,  s: false },
                { l: "Deployment & build",      e: true,  i: true,  s: true  },
                { l: "Team activity",           e: false, i: true,  s: false },
                { l: "Support ticket updates",  e: true,  i: true,  s: true  },
                { l: "Product announcements",   e: true,  i: false, s: false },
                { l: "Security alerts",         e: true,  i: true,  s: true  },
              ].map((p, i) => (
                <div key={p.l} style={{ padding: "11px 16px", borderBottom: i < 5 ? "1px solid var(--br-border)" : "none", display: "grid", gridTemplateColumns: "1fr auto auto auto", gap: 14, alignItems: "center" }}>
                  <span style={{ fontSize: 12.5, fontWeight: 500 }}>{p.l}</span>
                  {[
                    { l: "Email",  on: p.e },
                    { l: "In-app", on: p.i },
                    { l: "Slack",  on: p.s },
                  ].map(c => (
                    <div key={c.l} className="col" style={{ alignItems: "center", gap: 4 }}>
                      <div className={"tnt__toggle " + (c.on ? "is-on" : "")}></div>
                      <span className="muted" style={{ fontSize: 10 }}>{c.l}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
    <Tnt_AIDock topic="general" collapsed />
  </TntBoard>
);
