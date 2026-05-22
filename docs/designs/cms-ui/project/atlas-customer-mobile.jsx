// Atlas Customer — D3: Mobile companion
// Two screens side-by-side: home + order detail

function MobilePhone({ label, children }) {
  return (
    <div>
      <div className="phone">
        <div className="phone-status">
          <span>9:41</span>
          <span style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
            <svg width="16" height="10" viewBox="0 0 18 12" fill="currentColor"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5" width="3" height="7" rx="1"/><rect x="10" y="2" width="3" height="10" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></svg>
            <svg width="14" height="10" viewBox="0 0 16 12" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M1 4.5 8 11l7-6.5"/><path d="M3 3.5C4.5 2 6 1 8 1s3.5 1 5 2.5"/></svg>
            <svg width="22" height="10" viewBox="0 0 24 12" fill="none" stroke="currentColor" strokeWidth="1"><rect x="1" y="1" width="20" height="10" rx="2.5"/><rect x="3" y="3" width="14" height="6" rx="1" fill="currentColor"/><path d="M22 4v4" strokeWidth="1.5"/></svg>
          </span>
        </div>
        {children}
      </div>
      <div className="phone-label">{label}</div>
    </div>
  );
}

function MbTabbar({ active }) {
  const { Icons } = window;
  const tabs = [
    ['shop', 'Shop', Icons.bag],
    ['acct', 'Account', Icons.user],
    ['bag', 'Bag', Icons.bag],
  ];
  return (
    <div className="mb-tabbar">
      {[
        ['home', 'Shop', Icons.home],
        ['acct', 'Account', Icons.user],
        ['bag', 'Bag', Icons.bag],
      ].map(([key, label, icon]) => (
        <div key={key} className={'tab' + (key === active ? ' on' : '')}>
          {icon}
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}

function CustomerMobile({ store }) {
  const { Icons, Lifecycle } = window;

  return (
    <div className="phones">
      {/* ── Phone 1: Account home ─────────── */}
      <MobilePhone label={<>Account home · <b>overview</b></>}>
        <div className="phone-body" style={{ background: 'var(--wl-bg)' }}>

          {/* Top app bar */}
          <div className="mb-topbar">
            <span className="ic">{Icons.back}</span>
            <span className="ttl" style={{ flex: 1 }}>Account</span>
            <span className="ic">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>
              </svg>
            </span>
          </div>

          {/* Hero */}
          <div className="mb-pad" style={{ paddingBottom: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <span style={{
                width: 44, height: 44, borderRadius: '50%',
                background: 'var(--wl-accent)', color: 'var(--wl-accent-fg)',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--wl-font-display)', fontSize: 18, fontWeight: 500,
              }}>M</span>
              <div>
                <div className="display" style={{ fontSize: 20, lineHeight: 1.1 }}>Hi, <span className="display-i">Maya</span></div>
                <div className="mono" style={{ fontSize: 11, color: 'var(--wl-text-faint)', marginTop: 2 }}>LOYAL · 14 ORDERS · SINCE MAR 2024</div>
              </div>
            </div>

            {/* Mini lifecycle */}
            <div style={{
              background: 'var(--wl-surface)',
              border: '1px solid var(--wl-rule)',
              borderRadius: 'var(--wl-radius)',
              padding: 12,
            }}>
              <div className="eyebrow" style={{ marginBottom: 8, color: 'var(--wl-text-soft)' }}>3 orders to VIP</div>
              <div className="loy-bar"><div className="fill" style={{ width: '78%' }}></div></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontFamily: 'var(--wl-font-mono)', fontSize: 9.5, color: 'var(--wl-text-faint)', letterSpacing: '.1em' }}>
                <span>NEW</span><span>REPEAT</span><span>REGULAR</span><span style={{ color: 'var(--wl-accent)', fontWeight: 600 }}>LOYAL</span><span>VIP</span>
              </div>
            </div>

            {/* Bricks */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12 }}>
              <div className="brick" style={{ padding: '10px 12px' }}>
                <span className="lbl">store credit</span>
                <span className="val accent" style={{ fontSize: 22 }}>$24.50</span>
              </div>
              <div className="brick" style={{ padding: '10px 12px' }}>
                <span className="lbl">loyalty pts</span>
                <span className="val" style={{ fontSize: 22 }}>612</span>
              </div>
            </div>

            {/* Greeting (compact) */}
            <div className="greeting" style={{ marginTop: 12, padding: '14px 14px 14px 16px' }}>
              <div className="from" style={{ marginBottom: 6 }}>
                <span className="seal">M</span>
                <span>A note from Marisol</span>
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.4 }}>
                Hi Maya — hand-packing your Dahlia tee now. Tucked in a little
                something for your fourteenth.
              </p>
              <div className="sign" style={{ fontSize: 17, marginTop: 6 }}>Marisol —</div>
            </div>

            {/* Recent order strip */}
            <div className="sect-row" style={{ marginTop: 16, marginBottom: 8 }}>
              <h2 className="sect" style={{ fontSize: 16 }}>Recent <span className="meta">14</span></h2>
              <a href="#" className="more">all →</a>
            </div>

            <div style={{
              background: 'var(--wl-surface)',
              border: '1px solid var(--wl-rule)',
              borderRadius: 'var(--wl-radius)',
              padding: 12,
              marginBottom: 12,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span className="mono" style={{ fontSize: 12, fontWeight: 600 }}>#4821</span>
                <span className="pill pill-solid-accent"><span className="dot"></span>IN TRANSIT</span>
              </div>
              <div className="display" style={{ fontSize: 15, lineHeight: 1.2 }}>Arriving <span className="display-i">Friday, 18 May</span></div>
              <div className="fig" style={{ fontSize: 12, marginTop: 4 }}>Dahlia tee + Marigold cap · $53.66</div>
              <div style={{ marginTop: 10 }}>
                <div className="loy-bar" style={{ height: 4 }}><div className="fill" style={{ width: '65%', background: 'var(--wl-success)' }}></div></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontFamily: 'var(--wl-font-mono)', fontSize: 8.5, color: 'var(--wl-text-faint)', letterSpacing: '.08em' }}>
                  <span>PLACED</span><span>PACKED</span><span style={{ color: 'var(--wl-success)', fontWeight: 600 }}>SHIPPED</span><span>DELIVERED</span>
                </div>
              </div>
            </div>

            <div style={{
              background: 'var(--wl-surface)',
              border: '1px solid var(--wl-rule)',
              borderRadius: 'var(--wl-radius)',
              padding: '10px 12px',
              marginBottom: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div>
                <span className="mono" style={{ fontSize: 12 }}>#4702</span>
                <div className="display" style={{ fontSize: 14, marginTop: 2 }}>Marigold cap</div>
              </div>
              <span className="pill pill-solid-moss"><span className="dot"></span>DELIVERED</span>
            </div>

          </div>

          <MbTabbar active="acct" />
        </div>
      </MobilePhone>

      {/* ── Phone 2: Order detail / tracking ───────────────── */}
      <MobilePhone label={<>Order detail · <b>tracking</b></>}>
        <div className="phone-body" style={{ background: 'var(--wl-bg)' }}>

          <div className="mb-topbar">
            <span className="ic">{Icons.back}</span>
            <span className="ttl" style={{ flex: 1 }}>Order #4821</span>
            <span className="ic">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>
              </svg>
            </span>
          </div>

          <div className="mb-pad" style={{ paddingBottom: 0 }}>
            {/* Tracking hero */}
            <div style={{
              background: 'var(--wl-surface)',
              border: '1px solid var(--wl-rule)',
              borderRadius: 'var(--wl-radius)',
              padding: 16,
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0,
                height: 3, background: 'var(--wl-accent)',
              }}></div>
              <div className="eyebrow-accent" style={{ marginTop: 6 }}>In transit</div>
              <div className="display" style={{ fontSize: 26, marginTop: 6, lineHeight: 1.1 }}>
                Arriving <span className="display-i">Fri 18 May</span>
              </div>
              <div className="fig" style={{ fontSize: 13, marginTop: 4 }}>by 8pm · USPS priority</div>

              {/* Vertical timeline */}
              <div style={{ marginTop: 18, textAlign: 'left' }}>
                {[
                  ['Placed',    '09:14 EST · today', 'done'],
                  ['Paid',      '09:14 EST · today', 'done'],
                  ['Packed',    '11:08 EST · today', 'done'],
                  ['Shipped',   'in transit',         'now'],
                  ['Delivered', 'est. Fri 18 May',    'future'],
                ].map(([nm, when, state], i, arr) => (
                  <div key={nm} style={{
                    display: 'grid', gridTemplateColumns: '24px 1fr',
                    gap: 10, alignItems: 'flex-start',
                    paddingBottom: i === arr.length - 1 ? 0 : 12,
                    position: 'relative',
                  }}>
                    {i < arr.length - 1 && (
                      <div style={{
                        position: 'absolute', left: 11, top: 14, bottom: -2,
                        width: 2, background: state === 'done' || state === 'now' ? 'var(--wl-success)' : 'var(--wl-rule)',
                      }}></div>
                    )}
                    <div style={{
                      width: 14, height: 14, borderRadius: '50%',
                      background: state === 'done' ? 'var(--wl-success)' :
                                  state === 'now'  ? 'var(--wl-accent)' : 'var(--wl-bg)',
                      border: '2px solid ' + (
                        state === 'done' ? 'var(--wl-success)' :
                        state === 'now'  ? 'var(--wl-accent)' : 'var(--wl-rule)'
                      ),
                      marginTop: 2, marginLeft: 5,
                      boxShadow: state === 'now' ? '0 0 0 4px var(--wl-accent-soft)' : 'none',
                      zIndex: 2, position: 'relative',
                    }}></div>
                    <div>
                      <div style={{
                        fontFamily: 'var(--wl-font-mono)', fontSize: 11,
                        letterSpacing: '.1em', textTransform: 'uppercase',
                        color: state === 'future' ? 'var(--wl-text-faint)' : 'var(--wl-text)',
                        fontWeight: state === 'now' ? 600 : 500,
                      }}>{nm}</div>
                      <div className="fig" style={{ fontSize: 12, marginTop: 1 }}>{when}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Items */}
            <h2 className="sect" style={{ fontSize: 15, marginTop: 18, marginBottom: 8 }}>Items <span className="meta">2</span></h2>
            <div style={{
              background: 'var(--wl-surface)',
              border: '1px solid var(--wl-rule)',
              borderRadius: 'var(--wl-radius)',
              padding: '4px 12px',
              marginBottom: 12,
            }}>
              {[
                ['Dahlia tee', 'M · Brick', '$32.00'],
                ['Marigold cap', 'One size · Moss', '$18.00'],
              ].map(([nm, v, p]) => (
                <div key={nm} style={{
                  display: 'grid', gridTemplateColumns: '48px 1fr auto',
                  gap: 10, alignItems: 'center',
                  padding: '10px 0',
                  borderBottom: nm === 'Marigold cap' ? 0 : '1px solid var(--wl-rule-soft)',
                }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 'var(--wl-radius-sm)',
                    border: '1px solid var(--wl-rule)',
                    background: 'repeating-linear-gradient(45deg, var(--wl-surface-2) 0 5px, var(--wl-surface-3) 5px 10px)',
                  }}></div>
                  <div>
                    <div className="display" style={{ fontSize: 14 }}>{nm}</div>
                    <div className="mono" style={{ fontSize: 10.5, color: 'var(--wl-text-soft)' }}>{v}</div>
                  </div>
                  <div className="mono" style={{ fontSize: 12.5 }}>{p}</div>
                </div>
              ))}
            </div>

            {/* Buttons */}
            <a href="#" className="btn btn-accent" style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }}>
              Track package
            </a>
            <a href="#" className="btn" style={{ width: '100%', justifyContent: 'center', marginBottom: 14 }}>
              Get help with this order
            </a>
          </div>

          <MbTabbar active="acct" />
        </div>
      </MobilePhone>
    </div>
  );
}

Object.assign(window, { CustomerMobile });
