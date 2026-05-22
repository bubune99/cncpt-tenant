// Atlas Customer — D2: Order detail / tracking
// Full tracking + items + addresses + actions

function CustomerOrder({ store }) {
  const { SfChrome, AcctSide, Icons } = window;

  const items = [
    { nm: 'Dahlia tee — heritage cotton',  v: 'Color: Brick · Size: M',          qty: 1, price: '$32.00' },
    { nm: 'Marigold cap',                  v: 'One size · Moss',                  qty: 1, price: '$18.00' },
  ];

  const trackingSteps = [
    ['placed',    'Placed',     '09:14 EST', 'done'],
    ['paid',      'Paid',       '09:14 EST', 'done'],
    ['packed',    'Packed',     '11:08 EST', 'done'],
    ['shipped',   'In transit', 'tracking →', 'now'],
    ['delivered', 'Delivered',  'est. 18 May', 'future'],
  ];

  return (
    <div className="page-frame">
      <SfChrome active="account" store={store} />

      <div className="acct-body">
        <AcctSide active="orders" />

        <div className="acct-main">
          {/* ── Order head ─────────────────────────────── */}
          <div className="acct-head">
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="crumbs">
                <a href="#">Account</a><span className="sep">/</span>
                <a href="#">Orders</a><span className="sep">/</span>
                <span className="here">#4821</span>
              </div>
              <h1>Order <span className="i">#4821</span></h1>
              <div className="sub">
                Placed Tuesday 16 May at 9:14 EST · 2 items · paid with Visa <span className="mono" style={{ fontStyle: 'normal' }}>•••• 4242</span>
              </div>
            </div>
            <div className="right">
              <a href="#" className="btn btn-ghost btn-sm">Get help</a>
              <a href="#" className="btn btn-sm">Print receipt</a>
              <a href="#" className="btn btn-solid btn-sm">Track package →</a>
            </div>
          </div>

          {/* ── Status + tracking timeline ─────────────── */}
          <div className="od-tracking" style={{ marginTop: 18 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <div>
                <div className="eyebrow-accent">In transit · arriving</div>
                <div className="display" style={{ fontSize: 24, marginTop: 4 }}>
                  Friday, 18 May <span className="display-i" style={{ color: 'var(--wl-text-soft)' }}>· by 8pm</span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="eyebrow">USPS · priority</div>
                <div className="mono" style={{ fontSize: 13, marginTop: 4 }}>9405 5118 9956 0420 1473 21</div>
                <a href="#" style={{ fontFamily: 'var(--wl-font-mono)', fontSize: 11, color: 'var(--wl-accent)', textDecoration: 'none' }}>open carrier site →</a>
              </div>
            </div>

            <div className="timeline">
              {trackingSteps.map(([key, nm, when, state]) => (
                <div key={key} className={'step ' + (state === 'done' ? 'done' : state === 'now' ? 'now' : '')}>
                  <div className="ring"></div>
                  <div className="nm">{nm}</div>
                  <div className="when">{when}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Items + summary ──────────────────────── */}
          <div style={{ marginTop: 22, display: 'grid', gridTemplateColumns: '1fr 280px', gap: 18 }}>

            {/* Items */}
            <div className="card">
              <div className="sect-row" style={{ marginBottom: 4 }}>
                <h2 className="sect" style={{ fontSize: 18 }}>Items <span className="meta">2</span></h2>
                <span className="fig" style={{ fontSize: 12, marginLeft: 'auto' }}>shipping in one parcel</span>
              </div>
              {items.map((it) => (
                <div key={it.nm} className="od-item">
                  <div className="ph"></div>
                  <div>
                    <div className="title">{it.nm}</div>
                    <div className="v">{it.v}</div>
                    <div style={{ marginTop: 6, display: 'flex', gap: 6 }}>
                      <a href="#" className="btn btn-sm btn-ghost">Buy again</a>
                      <a href="#" className="btn btn-sm btn-ghost">Leave a review</a>
                    </div>
                  </div>
                  <div className="qty">× {it.qty}</div>
                  <div className="price">{it.price}</div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div>
              <div className="card" style={{ padding: '14px 16px' }}>
                <div className="eyebrow" style={{ marginBottom: 10 }}>Summary</div>
                {[
                  ['Subtotal',  '$50.00'],
                  ['Shipping',  '$5.00'],
                  ['Tax',       '$4.16'],
                  ['Loyalty −', '−$5.50'],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: 13 }}>
                    <span style={{ color: 'var(--wl-text-soft)' }}>{k}</span>
                    <span className="mono">{v}</span>
                  </div>
                ))}
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  padding: '10px 0 2px', marginTop: 4,
                  borderTop: '1px solid var(--wl-rule)',
                }}>
                  <span className="display" style={{ fontSize: 16 }}>Total</span>
                  <span className="display" style={{ fontSize: 18, color: 'var(--wl-accent)' }}>$53.66</span>
                </div>
              </div>
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <a href="#" className="btn btn-sm" style={{ justifyContent: 'center' }}>Request return</a>
                <a href="#" className="btn btn-sm btn-ghost" style={{ justifyContent: 'center' }}>Re-order all items</a>
              </div>
            </div>
          </div>

          {/* ── Addresses ────────────────────────────── */}
          <div style={{ marginTop: 22, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="ad-card default">
              <div className="lbl">Shipping to</div>
              <div className="nm">Maya Rodriguez</div>
              <div>318 Bedford Ave, Apt 4B<br/>Brooklyn, NY 11211<br/>United States</div>
              <span className="default-flag">Default · used on 14 orders</span>
            </div>
            <div className="ad-card">
              <div className="lbl">Billing</div>
              <div className="nm">Maya Rodriguez</div>
              <div>318 Bedford Ave, Apt 4B<br/>Brooklyn, NY 11211<br/>United States</div>
              <div className="fig" style={{ fontSize: 12, marginTop: 6 }}>same as shipping</div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

Object.assign(window, { CustomerOrder });
