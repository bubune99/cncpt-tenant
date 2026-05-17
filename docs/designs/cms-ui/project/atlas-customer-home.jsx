// Atlas Customer — D1: Dashboard home / overview
// Lifecycle ribbon + hand-set greeting + at-a-glance + recent orders + section cards

function CustomerHome({ store }) {
  const { SfChrome, AcctSide, Lifecycle, Icons, NotifDrawer } = window;

  const recent = [
    { id: '#4821', when: 'Today · 09:14',  items: 2, total: '$53.66',  status: 'Processing', cls: 'pill-solid-accent', img: 2, isNew: true },
    { id: '#4702', when: '28 Apr',         items: 1, total: '$32.00',  status: 'Delivered',  cls: 'pill-solid-moss',   img: 1 },
    { id: '#4621', when: '14 Apr',         items: 3, total: '$92.20',  status: 'Delivered',  cls: 'pill-solid-moss',   img: 3 },
  ];

  return (
    <div className="page-frame">
      <SfChrome active="account" store={store} bellOpen={true} />
      <NotifDrawer open={true} tab="all" />

      <div className="acct-body">
        <AcctSide active="overview" />

        <div className="acct-main">
          {/* ── Page head ───────────────────────────────── */}
          <div className="acct-head">
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="crumbs">
                <a href="#">{store.name}</a><span className="sep">/</span>
                <span className="here">Account</span>
              </div>
              <h1>Welcome back, <span className="i">Maya.</span></h1>
              <div className="sub">Tuesday, 16 May · your 14th order is on its way.</div>
            </div>
            <div className="right">
              <a href="#" className="btn btn-ghost btn-sm">Order help</a>
              <a href="#" className="btn btn-solid btn-sm">Continue shopping →</a>
            </div>
          </div>

          {/* ── Lifecycle + greeting + at-a-glance ──────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 18, marginTop: 18 }}>

            {/* Left column: lifecycle + bricks */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Lifecycle ribbon */}
              <div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
                  <span className="eyebrow">With {store.name} · since Mar 2024</span>
                  <span className="fig" style={{ fontSize: 11, marginLeft: 'auto' }}>3 more orders to VIP →</span>
                </div>
                <Lifecycle current="loyal" />
              </div>

              {/* Bricks */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                <div className="brick">
                  <span className="lbl">store credit</span>
                  <span className="val accent">$24.50</span>
                  <span className="delta">from return #4488</span>
                </div>
                <div className="brick">
                  <span className="lbl">loyalty pts</span>
                  <span className="val">612</span>
                  <span className="delta">88 to next reward</span>
                </div>
                <div className="brick">
                  <span className="lbl">active subs</span>
                  <span className="val">2</span>
                  <span className="delta">next ships 24 May</span>
                </div>
                <div className="brick">
                  <span className="lbl">open orders</span>
                  <span className="val">1</span>
                  <span className="delta up">in transit</span>
                </div>
              </div>
            </div>

            {/* Right column: greeting */}
            <div className="greeting">
              <div className="from">
                <span className="seal">M</span>
                <span>A note from Marisol</span>
              </div>
              <p>
                Hi Maya — saw your order come through this morning. We're
                hand-packing the Dahlia tee now, should be on the truck by
                lunch. Tucked in a little something for your fourteenth.
              </p>
              <div className="sign">Marisol —</div>
            </div>

          </div>

          {/* ── Recent orders ───────────────────────────── */}
          <div style={{ marginTop: 24 }}>
            <div className="sect-row">
              <h2 className="sect">Recent orders <span className="meta">last 90 days</span></h2>
              <a href="#" className="more">See all 14 →</a>
            </div>
            <div className="card bare" style={{ background: 'var(--wl-surface)', border: '1px solid var(--wl-rule)', borderRadius: 'var(--wl-radius)', padding: '4px 16px' }}>
              <table className="tbl">
                <thead>
                  <tr>
                    <th style={{ width: 80 }}>Order</th>
                    <th style={{ width: 140 }}>Placed</th>
                    <th style={{ width: 140 }}>Items</th>
                    <th>Status</th>
                    <th className="num" style={{ width: 90 }}>Total</th>
                    <th style={{ width: 90 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((o) => (
                    <tr key={o.id}>
                      <td>
                        <span className="mono" style={{ fontWeight: 600 }}>{o.id}</span>
                        {o.isNew && <span className="pill pill-out-accent" style={{ marginLeft: 8 }}>NEW</span>}
                      </td>
                      <td><span className="fig" style={{ fontSize: 13 }}>{o.when}</span></td>
                      <td>
                        <div className="order-row-items">
                          {Array.from({ length: Math.min(o.img, 2) }).map((_, i) => (
                            <div key={i} className="thumb"></div>
                          ))}
                          {o.img > 2 && <div className="thumb more">+{o.img - 2}</div>}
                        </div>
                      </td>
                      <td>
                        <span className={'pill ' + o.cls}>
                          <span className="dot"></span>{o.status}
                        </span>
                      </td>
                      <td className="num">{o.total}</td>
                      <td><a href="#" style={{ fontFamily: 'var(--wl-font-mono)', fontSize: 11, color: 'var(--wl-accent)', textDecoration: 'none' }}>View →</a></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Three-up: subs / wishlist / returns preview ─── */}
          <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>

            {/* Subscriptions */}
            <div className="card">
              <div className="sect-row" style={{ marginBottom: 8 }}>
                <h2 className="sect" style={{ fontSize: 17 }}>Subscriptions</h2>
                <a href="#" className="more">manage →</a>
              </div>
              <div style={{ paddingTop: 4 }}>
                <div style={{ paddingBottom: 10, borderBottom: '1px solid var(--wl-rule-soft)', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                    <span className="display" style={{ fontSize: 15 }}>Marigold tea · monthly</span>
                    <span className="mono" style={{ fontSize: 12 }}>$18/mo</span>
                  </div>
                  <div className="fig" style={{ fontSize: 12, marginTop: 2 }}>ships 24 May · 8 days</div>
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                    <span className="display" style={{ fontSize: 15 }}>Studio letter · annual</span>
                    <span className="mono" style={{ fontSize: 12 }}>$48/yr</span>
                  </div>
                  <div className="fig" style={{ fontSize: 12, marginTop: 2 }}>renews 14 Mar 2026</div>
                </div>
              </div>
            </div>

            {/* Wishlist preview */}
            <div className="card">
              <div className="sect-row" style={{ marginBottom: 8 }}>
                <h2 className="sect" style={{ fontSize: 17 }}>Wishlist <span className="meta">8</span></h2>
                <a href="#" className="more">view all →</a>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 5 }}>
                {['', '', 'OOS', ''].map((tag, i) => (
                  <div key={i} style={{
                    aspectRatio: '1', position: 'relative',
                    background: 'repeating-linear-gradient(45deg, var(--wl-surface-2) 0 6px, var(--wl-surface-3) 6px 12px)',
                    border: '1px solid var(--wl-rule)', borderRadius: 4,
                  }}>
                    {tag && <span style={{
                      position: 'absolute', top: 4, left: 4,
                      background: 'var(--wl-text)', color: 'var(--wl-bg)',
                      fontFamily: 'var(--wl-font-mono)', fontSize: 8,
                      letterSpacing: '.08em', padding: '1px 4px', borderRadius: 2,
                    }}>{tag}</span>}
                  </div>
                ))}
              </div>
              <div className="fig" style={{ fontSize: 12, marginTop: 10 }}>1 item back in stock — Moss tote</div>
            </div>

            {/* Returns / help */}
            <div className="card">
              <div className="sect-row" style={{ marginBottom: 8 }}>
                <h2 className="sect" style={{ fontSize: 17 }}>Returns</h2>
                <a href="#" className="more">start a return →</a>
              </div>
              <div className="fig" style={{ fontSize: 13, lineHeight: 1.5 }}>
                No open returns. Items from the last 30 days are eligible — that includes order
                <span className="mono" style={{ color: 'var(--wl-accent)', fontStyle: 'normal' }}> #4702</span>.
              </div>
              <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                <a href="#" className="btn btn-sm btn-ghost">Track a return</a>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

Object.assign(window, { CustomerHome });
