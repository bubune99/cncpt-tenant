// Atlas Customer — D5: Subscriptions
// Manage recurring shipments — schedule, swap, skip, pause.

function CustomerSubs({ store }) {
  const { SfChrome, AcctSide } = window;

  return (
    <div className="page-frame">
      <SfChrome active="account" store={store} />

      <div className="acct-body">
        <AcctSide active="subs" />

        <div className="acct-main">
          {/* ── Head ─────────────────────────────────── */}
          <div className="acct-head">
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="crumbs">
                <a href="#">Account</a><span className="sep">/</span>
                <span className="here">Subscriptions</span>
              </div>
              <h1>Your <span className="i">subscriptions</span></h1>
              <div className="sub">2 active · next shipment in 8 days · $66 this year on auto-ship</div>
            </div>
            <div className="right">
              <a href="#" className="btn btn-ghost btn-sm">Add a subscription</a>
            </div>
          </div>

          {/* ── Filter chip row ──────────────────────── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16, marginBottom: 14 }}>
            <span className="chip on">Active <span className="ct">2</span></span>
            <span className="chip">Paused <span className="ct">0</span></span>
            <span className="chip">Cancelled <span className="ct">1</span></span>
          </div>

          {/* ── Subscription A: Marigold tea ─────────── */}
          <div className="sub-card">
            <div className="sub-card-top">
              <div className="sub-thumb"></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <h2 className="sect" style={{ fontSize: 22 }}>Marigold tea, loose</h2>
                  <span className="pill pill-solid-moss"><span className="dot"></span>ACTIVE</span>
                </div>
                <div className="fig" style={{ fontSize: 13 }}>monthly · 100g tin · started 14 Mar 2024 · 14 shipments</div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div className="eyebrow">Next charge</div>
                <div className="display" style={{ fontSize: 22, marginTop: 4 }}>$18.00</div>
                <div className="mono" style={{ fontSize: 11, color: 'var(--wl-text-soft)' }}>Visa •••• 4242</div>
              </div>
            </div>

            <div className="sub-schedule">
              {[
                ['24 May', '8 days',   'next',     'now'],
                ['24 Jun', 'in 39d',   '',         'future'],
                ['24 Jul', 'in 69d',   '',         'future'],
                ['24 Apr', '14 May',   'shipped',  'done'],
                ['24 Mar', '14 Apr',   'shipped',  'done'],
              ].map(([dt, when, label, state], i) => (
                <div key={i} className={'sched-pip ' + state}>
                  <div className="dt">{dt}</div>
                  <div className="when">{when}</div>
                  {label && <div className="lbl">{label}</div>}
                </div>
              ))}
            </div>

            <div className="sub-card-foot">
              <div style={{ display: 'flex', gap: 6 }}>
                <a href="#" className="btn btn-sm">Skip next</a>
                <a href="#" className="btn btn-sm">Swap flavour</a>
                <a href="#" className="btn btn-sm btn-ghost">Change cadence</a>
                <a href="#" className="btn btn-sm btn-ghost">Pause</a>
              </div>
              <a href="#" className="link-arrow" style={{ marginLeft: 'auto' }}>Cancel subscription</a>
            </div>
          </div>

          {/* ── Subscription B: Studio letter ────────── */}
          <div className="sub-card" style={{ marginTop: 14 }}>
            <div className="sub-card-top">
              <div className="sub-thumb"></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <h2 className="sect" style={{ fontSize: 22 }}>Studio letter, annual</h2>
                  <span className="pill pill-solid-moss"><span className="dot"></span>ACTIVE</span>
                </div>
                <div className="fig" style={{ fontSize: 13 }}>annual · printed seasonal letter, mailed · started 14 Mar 2024</div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div className="eyebrow">Renews</div>
                <div className="display" style={{ fontSize: 22, marginTop: 4 }}>$48.00</div>
                <div className="mono" style={{ fontSize: 11, color: 'var(--wl-text-soft)' }}>14 Mar 2027</div>
              </div>
            </div>

            <div style={{ padding: '14px 18px 4px', display: 'flex', gap: 16, alignItems: 'baseline' }}>
              <span className="eyebrow">Last delivery</span>
              <span className="display" style={{ fontSize: 14 }}>Spring 2026 — <span className="display-i">"On dyeing with marigold."</span></span>
              <span className="fig" style={{ fontSize: 12, marginLeft: 'auto' }}>4 issues received</span>
            </div>

            <div className="sub-card-foot">
              <div style={{ display: 'flex', gap: 6 }}>
                <a href="#" className="btn btn-sm">Read past issues</a>
                <a href="#" className="btn btn-sm btn-ghost">Gift this</a>
              </div>
              <a href="#" className="link-arrow" style={{ marginLeft: 'auto' }}>Cancel renewal</a>
            </div>
          </div>

          {/* ── Recommended additions ───────────────── */}
          <div style={{ marginTop: 22 }}>
            <div className="sect-row">
              <h2 className="sect" style={{ fontSize: 18 }}>Marisol suggests</h2>
              <span className="fig" style={{ fontSize: 12, marginLeft: 'auto' }}>based on what you've bought</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {[
                ['Wax candle club',     'quarterly',  '$32', 'small batch · hand-poured'],
                ['Heritage seed box',   'seasonal',   '$28', 'four packets · zone-matched'],
                ['Field journal set',   'monthly',    '$14', 'one notebook · letter-pressed'],
              ].map(([nm, cad, pr, desc]) => (
                <div key={nm} className="card">
                  <div style={{
                    height: 84, marginBottom: 10,
                    background: 'repeating-linear-gradient(45deg, var(--wl-surface-2) 0 6px, var(--wl-surface-3) 6px 12px)',
                    borderRadius: 'var(--wl-radius-sm)', border: '1px solid var(--wl-rule)',
                  }}></div>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                    <span className="display" style={{ fontSize: 15 }}>{nm}</span>
                    <span className="mono" style={{ fontSize: 11.5, color: 'var(--wl-accent)' }}>{pr}</span>
                  </div>
                  <div className="fig" style={{ fontSize: 12, marginTop: 2 }}>{cad} · {desc}</div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

Object.assign(window, { CustomerSubs });
