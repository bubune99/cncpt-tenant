// Atlas Customer — Mobile (set 2): orders list, subscription manage, settings

function CustomerMobile2({ store }) {
  const { Icons } = window;

  return (
    <div className="phones">

      {/* ── Phone 3: Orders list ─────────────────────────── */}
      <MobilePhone label={<>Orders · <b>list</b></>}>
        <div className="phone-body" style={{ background: 'var(--wl-bg)' }}>
          <div className="mb-topbar">
            <span className="ic">{Icons.back}</span>
            <span className="ttl" style={{ flex: 1 }}>Orders</span>
            <span className="ic">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M3 6h18M6 12h12M10 18h4"/>
              </svg>
            </span>
          </div>

          {/* Filter chips */}
          <div style={{ padding: '12px 16px 6px', display: 'flex', gap: 6, overflowX: 'auto' }}>
            <span className="chip on">All <span className="ct">14</span></span>
            <span className="chip">In transit <span className="ct">1</span></span>
            <span className="chip">Delivered</span>
            <span className="chip">Returned</span>
          </div>

          {/* Order cards */}
          <div style={{ padding: '6px 16px 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { id: '#4821', when: 'Today',     items: 'Dahlia tee + Marigold cap', total: '$53.66', status: 'IN TRANSIT', cls: 'pill-solid-accent', isNew: true,
                progress: 65, etas: 'arrives Fri 18 May' },
              { id: '#4702', when: '28 Apr',    items: 'Marigold cap',              total: '$32.00', status: 'DELIVERED',  cls: 'pill-solid-moss' },
              { id: '#4621', when: '14 Apr',    items: 'Moss tote + 2 more',        total: '$92.20', status: 'DELIVERED',  cls: 'pill-solid-moss' },
              { id: '#4488', when: '22 Mar',    items: 'Heritage hoodie + 1',       total: '$118.40', status: 'RETURNED',  cls: 'pill-out',  notes: '+$24.50 credit' },
              { id: '#4391', when: '06 Mar',    items: 'Marigold tea',              total: '$18.00', status: 'DELIVERED',  cls: 'pill-solid-moss', notes: 'subscription' },
            ].map((o) => (
              <div key={o.id} style={{
                background: 'var(--wl-surface)',
                border: '1px solid var(--wl-rule)',
                borderRadius: 'var(--wl-radius)',
                padding: '12px 14px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span className="mono" style={{ fontSize: 12, fontWeight: 600 }}>{o.id}</span>
                    {o.isNew && <span className="pill pill-out-accent">NEW</span>}
                  </span>
                  <span className={'pill ' + o.cls}><span className="dot"></span>{o.status}</span>
                </div>
                <div className="display" style={{ fontSize: 14, lineHeight: 1.2 }}>{o.items}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 4 }}>
                  <span className="fig" style={{ fontSize: 11.5 }}>{o.when}{o.notes ? ' · ' + o.notes : ''}</span>
                  <span className="mono" style={{ fontSize: 12 }}>{o.total}</span>
                </div>
                {o.progress && (
                  <div style={{ marginTop: 8 }}>
                    <div className="loy-bar" style={{ height: 4 }}><div className="fill" style={{ width: o.progress + '%', background: 'var(--wl-success)' }}></div></div>
                    <div className="fig" style={{ fontSize: 11, marginTop: 4 }}>{o.etas}</div>
                  </div>
                )}
              </div>
            ))}

            <a href="#" className="btn btn-sm btn-ghost" style={{ justifyContent: 'center', marginTop: 4 }}>Load 9 older orders</a>
          </div>

          <MbTabbar active="acct" />
        </div>
      </MobilePhone>

      {/* ── Phone 4: Subscription manage ─────────────────── */}
      <MobilePhone label={<>Subscription · <b>manage</b></>}>
        <div className="phone-body" style={{ background: 'var(--wl-bg)' }}>
          <div className="mb-topbar">
            <span className="ic">{Icons.back}</span>
            <span className="ttl" style={{ flex: 1 }}>Subscription</span>
          </div>

          <div className="mb-pad" style={{ paddingBottom: 0 }}>
            {/* Hero card */}
            <div style={{
              background: 'var(--wl-surface)',
              border: '1px solid var(--wl-rule)',
              borderRadius: 'var(--wl-radius)',
              padding: 16,
            }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 14 }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 'var(--wl-radius-sm)',
                  border: '1px solid var(--wl-rule)',
                  background: 'repeating-linear-gradient(45deg, var(--wl-surface-2) 0 6px, var(--wl-surface-3) 6px 12px)',
                  flexShrink: 0,
                }}></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="display" style={{ fontSize: 17, lineHeight: 1.15 }}>Marigold tea, loose</div>
                  <div className="fig" style={{ fontSize: 12, marginTop: 2 }}>monthly · 100g tin</div>
                  <span className="pill pill-solid-moss" style={{ marginTop: 6 }}><span className="dot"></span>ACTIVE</span>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--wl-rule-soft)', paddingTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <div className="eyebrow">Next charge</div>
                  <div className="display" style={{ fontSize: 22, marginTop: 4 }}>$18.00</div>
                  <div className="mono" style={{ fontSize: 10, color: 'var(--wl-text-soft)' }}>Visa •••• 4242</div>
                </div>
                <div>
                  <div className="eyebrow">Ships</div>
                  <div className="display" style={{ fontSize: 22, marginTop: 4 }}>24 May</div>
                  <div className="mono" style={{ fontSize: 10, color: 'var(--wl-text-soft)' }}>in 8 days</div>
                </div>
              </div>
            </div>

            {/* Schedule strip */}
            <div className="eyebrow" style={{ marginTop: 16, marginBottom: 6 }}>Schedule</div>
            <div style={{
              background: 'var(--wl-surface)',
              border: '1px solid var(--wl-rule)',
              borderRadius: 'var(--wl-radius)',
              padding: 12,
              display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6,
            }}>
              {[
                ['24 Apr', 'shipped', 'done'],
                ['24 May', 'next',    'now'],
                ['24 Jun', '',        'future'],
                ['24 Jul', '',        'future'],
              ].map(([dt, lbl, state], i) => (
                <div key={i} style={{
                  padding: '8px 6px',
                  borderRadius: 4,
                  background: state === 'now' ? 'var(--wl-accent)' : state === 'done' ? 'var(--wl-surface-2)' : 'transparent',
                  color: state === 'now' ? 'var(--wl-accent-fg)' : 'var(--wl-text)',
                  border: state === 'future' ? '1px dashed var(--wl-rule)' : '1px solid transparent',
                  textAlign: 'center',
                }}>
                  <div className="mono" style={{ fontSize: 11, fontWeight: 600 }}>{dt}</div>
                  <div className="mono" style={{ fontSize: 9, opacity: .75, letterSpacing: '.08em', textTransform: 'uppercase', marginTop: 2 }}>{lbl || '—'}</div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <a href="#" className="btn" style={{ justifyContent: 'space-between' }}>
                <span>Skip 24 May shipment</span><span style={{ color: 'var(--wl-text-soft)' }}>→</span>
              </a>
              <a href="#" className="btn" style={{ justifyContent: 'space-between' }}>
                <span>Swap to honeybush</span><span style={{ color: 'var(--wl-text-soft)' }}>→</span>
              </a>
              <a href="#" className="btn" style={{ justifyContent: 'space-between' }}>
                <span>Change cadence · monthly</span><span style={{ color: 'var(--wl-text-soft)' }}>→</span>
              </a>
              <a href="#" className="btn btn-ghost" style={{ justifyContent: 'space-between' }}>
                <span>Pause subscription</span><span style={{ color: 'var(--wl-text-soft)' }}>→</span>
              </a>
              <a href="#" className="link-arrow" style={{ textAlign: 'center', marginTop: 8, fontSize: 11 }}>Cancel subscription</a>
            </div>
          </div>

          <MbTabbar active="acct" />
        </div>
      </MobilePhone>

      {/* ── Phone 5: Wishlist ────────────────────────────── */}
      <MobilePhone label={<>Wishlist · <b>grid</b></>}>
        <div className="phone-body" style={{ background: 'var(--wl-bg)' }}>
          <div className="mb-topbar">
            <span className="ic">{Icons.back}</span>
            <span className="ttl" style={{ flex: 1 }}>Wishlist · 8</span>
            <span className="ic">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M3 6h18M6 12h12M10 18h4"/>
              </svg>
            </span>
          </div>

          {/* Filter chips */}
          <div style={{ padding: '12px 16px 6px', display: 'flex', gap: 6, overflowX: 'auto' }}>
            <span className="chip on">All <span className="ct">8</span></span>
            <span className="chip">In stock <span className="ct">6</span></span>
            <span className="chip">Sale <span className="ct">1</span></span>
            <span className="chip">Back!</span>
          </div>

          <div className="mb-pad" style={{ paddingTop: 6, paddingBottom: 0 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { nm: 'Moss tote',         v: 'Canvas · large', price: '$58', tag: 'BACK!',     tagCls: 'pill-solid-accent' },
                { nm: 'Heritage hoodie',   v: 'Brick · M',      price: '$92', tag: '',          tagCls: '' },
                { nm: 'Field journal',     v: 'A5 · linen',     price: '$22', tag: 'SALE',      tagCls: 'pill-solid-gold' },
                { nm: 'Wax candle, no. 4', v: 'Cardamom',       price: '$28', tag: '',          tagCls: '' },
                { nm: 'Linen apron',       v: 'Natural',        price: '$48', tag: 'OUT',       tagCls: 'pill-solid-ink', dimmed: true },
                { nm: 'Patch set',         v: '3 pieces',       price: '$14', tag: '',          tagCls: '' },
              ].map((it, i) => (
                <div key={i} className="wish-card" style={{ opacity: it.dimmed ? 0.6 : 1 }}>
                  <div className="ph" style={{ height: 110, position: 'relative' }}>
                    {it.tag && <span className={'pill ' + it.tagCls} style={{ position: 'absolute', top: 6, left: 6, fontSize: 8.5 }}>{it.tag}</span>}
                    <span className="heart" style={{ width: 22, height: 22 }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-7-4.5-9-9c-1-2.5.5-6 4-6 2 0 3 1.5 5 4 2-2.5 3-4 5-4 3.5 0 5 3.5 4 6-2 4.5-9 9-9 9Z"/></svg>
                    </span>
                  </div>
                  <div className="meta" style={{ padding: '8px 10px 10px' }}>
                    <div className="nm" style={{ fontSize: 13 }}>{it.nm}</div>
                    <div className="pr" style={{ fontSize: 11 }}>{it.v}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                      <span className="mono" style={{ fontSize: 12, fontWeight: 600 }}>{it.price}</span>
                      <span style={{ color: 'var(--wl-accent)', fontFamily: 'var(--wl-font-mono)', fontSize: 18, lineHeight: 1 }}>+</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <MbTabbar active="acct" />
        </div>
      </MobilePhone>

    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Mobile set 3: Loyalty, Settings (addr+pay), Profile
   ───────────────────────────────────────────────────────────── */
function CustomerMobile3({ store }) {
  const { Icons } = window;

  return (
    <div className="phones">

      {/* ── Phone 6: Loyalty ─────────────────────────────── */}
      <MobilePhone label={<>Loyalty · <b>tier & rewards</b></>}>
        <div className="phone-body" style={{ background: 'var(--wl-bg)' }}>
          <div className="mb-topbar">
            <span className="ic">{Icons.back}</span>
            <span className="ttl" style={{ flex: 1 }}>Loyalty</span>
          </div>

          {/* Hero tier card */}
          <div className="mb-pad" style={{ paddingBottom: 0 }}>
            <div style={{
              background: 'var(--wl-accent)', color: 'var(--wl-accent-fg)',
              borderRadius: 'var(--wl-radius)', padding: 18,
              position: 'relative', overflow: 'hidden',
            }}>
              <div className="eyebrow" style={{ color: 'var(--wl-accent-fg)', opacity: .75 }}>Your tier</div>
              <div className="display" style={{ fontSize: 32, color: 'var(--wl-accent-fg)', lineHeight: 1.05, marginTop: 4 }}>
                Loyal <span className="display-i" style={{ opacity: .8 }}>· yr 2</span>
              </div>
              <div className="fig" style={{ color: 'var(--wl-accent-fg)', opacity: .85, fontSize: 12, marginTop: 4, fontStyle: 'italic' }}>
                14 orders since Mar 2024
              </div>

              <div style={{ marginTop: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--wl-font-mono)', fontSize: 9.5, opacity: .8, letterSpacing: '.1em', marginBottom: 6 }}>
                  <span>78% TO VIP</span><span>3 ORDERS</span>
                </div>
                <div className="loy-bar" style={{ height: 6, background: 'rgba(255,255,255,.22)' }}>
                  <div className="fill" style={{ width: '78%', background: 'var(--wl-accent-fg)' }}></div>
                </div>
              </div>
            </div>

            {/* Bricks */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12 }}>
              <div className="brick" style={{ padding: '12px 14px' }}>
                <span className="lbl">points</span>
                <span className="val accent">612</span>
                <span className="delta">88 to next reward</span>
              </div>
              <div className="brick" style={{ padding: '12px 14px' }}>
                <span className="lbl">store credit</span>
                <span className="val">$24.50</span>
                <span className="delta">from R-0088</span>
              </div>
            </div>

            {/* Rewards list */}
            <div className="sect-row" style={{ marginTop: 16, marginBottom: 8 }}>
              <h2 className="sect" style={{ fontSize: 15 }}>Redeem <span className="meta">5</span></h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 12 }}>
              {[
                ['200 PTS', 'Free shipping',     'avail'],
                ['500 PTS', '$5 off any order',  'avail'],
                ['700 PTS', 'Hand-poured candle', 'locked'],
                ['1,200 PTS', 'Studio tour',     'locked'],
              ].map(([pts, nm, state], i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 14px',
                  background: 'var(--wl-surface)',
                  border: '1px solid var(--wl-rule)',
                  borderRadius: 'var(--wl-radius)',
                  opacity: state === 'locked' ? 0.62 : 1,
                }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: '50%',
                    background: state === 'avail' ? 'var(--wl-accent-soft)' : 'var(--wl-surface-2)',
                    color: state === 'avail' ? 'var(--wl-accent)' : 'var(--wl-text-faint)',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--wl-font-mono)', fontSize: 9, fontWeight: 700, letterSpacing: '.04em',
                    flexShrink: 0, textAlign: 'center',
                  }}>{pts.split(' ')[0]}</div>
                  <div style={{ flex: 1 }}>
                    <div className="display" style={{ fontSize: 14 }}>{nm}</div>
                    <div className="mono" style={{ fontSize: 10, color: 'var(--wl-text-faint)', letterSpacing: '.06em' }}>{pts}</div>
                  </div>
                  {state === 'avail'
                    ? <a href="#" className="btn btn-sm btn-accent" style={{ padding: '4px 10px', fontSize: 11 }}>Redeem</a>
                    : <span style={{ color: 'var(--wl-text-faint)', fontSize: 14 }}>🔒</span>
                  }
                </div>
              ))}
            </div>
          </div>

          <MbTabbar active="acct" />
        </div>
      </MobilePhone>

      {/* ── Phone 7: Settings · Addresses + Payment ──────── */}
      <MobilePhone label={<>Settings · <b>addresses & pay</b></>}>
        <div className="phone-body" style={{ background: 'var(--wl-bg)' }}>
          <div className="mb-topbar">
            <span className="ic">{Icons.back}</span>
            <span className="ttl" style={{ flex: 1 }}>Addresses & Pay</span>
            <span className="ic" style={{ color: 'var(--wl-accent)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5v14"/></svg>
            </span>
          </div>

          <div className="mb-pad" style={{ paddingBottom: 0 }}>
            <div className="eyebrow" style={{ marginBottom: 8 }}>Addresses · 3</div>

            <div style={{
              background: 'var(--wl-surface)',
              border: '1px solid var(--wl-text)',
              borderRadius: 'var(--wl-radius)',
              padding: '12px 14px',
              marginBottom: 8,
              position: 'relative',
            }}>
              <span className="pill pill-solid-accent" style={{ position: 'absolute', top: 12, right: 12, fontSize: 8.5 }}>DEFAULT</span>
              <div className="mono" style={{ fontSize: 9.5, letterSpacing: '.1em', color: 'var(--wl-text-soft)', textTransform: 'uppercase', marginBottom: 4 }}>HOME</div>
              <div className="display" style={{ fontSize: 15 }}>Maya Rodriguez</div>
              <div style={{ fontSize: 12.5, lineHeight: 1.5, color: 'var(--wl-text-soft)' }}>
                318 Bedford Ave, Apt 4B<br/>Brooklyn, NY 11211
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <a href="#" className="link-arrow" style={{ fontSize: 11 }}>Edit</a>
                <a href="#" className="link-arrow" style={{ fontSize: 11, color: 'var(--wl-text-soft)' }}>Remove</a>
              </div>
            </div>

            <div style={{
              background: 'var(--wl-surface)',
              border: '1px solid var(--wl-rule)',
              borderRadius: 'var(--wl-radius)',
              padding: '12px 14px',
              marginBottom: 14,
            }}>
              <div className="mono" style={{ fontSize: 9.5, letterSpacing: '.1em', color: 'var(--wl-text-soft)', textTransform: 'uppercase', marginBottom: 4 }}>STUDIO</div>
              <div className="display" style={{ fontSize: 15 }}>Marigold Studio</div>
              <div style={{ fontSize: 12.5, lineHeight: 1.5, color: 'var(--wl-text-soft)' }}>
                72 Greenpoint Ave<br/>Brooklyn, NY 11222
              </div>
            </div>

            <div className="eyebrow" style={{ marginBottom: 8 }}>Payment · 3</div>

            <div className="pay-card" style={{ border: '1px solid var(--wl-text)', padding: '10px 12px', marginBottom: 8 }}>
              <div className="brand-mark" style={{ background: 'linear-gradient(135deg, #1a1f71 0%, #4d4dad 100%)', width: 38, height: 26, fontSize: 8 }}>VISA</div>
              <div style={{ flex: 1 }}>
                <div className="num" style={{ fontSize: 12 }}>•••• 4242</div>
                <div className="exp" style={{ fontSize: 10 }}>exp 09/28</div>
              </div>
              <span className="pill pill-solid-accent" style={{ fontSize: 8.5 }}>DEFAULT</span>
            </div>

            <div className="pay-card" style={{ padding: '10px 12px', marginBottom: 8 }}>
              <div className="brand-mark" style={{ background: 'linear-gradient(135deg, #e35424 0%, #f7c046 100%)', width: 38, height: 26, fontSize: 8 }}>M/C</div>
              <div style={{ flex: 1 }}>
                <div className="num" style={{ fontSize: 12 }}>•••• 8811</div>
                <div className="exp" style={{ fontSize: 10 }}>exp 02/27</div>
              </div>
            </div>

            <div className="pay-card" style={{ background: 'var(--wl-surface-2)', padding: '10px 12px', marginBottom: 14 }}>
              <div className="brand-mark" style={{ background: 'linear-gradient(135deg, #003087 0%, #0070ba 100%)', width: 38, height: 26, fontSize: 8 }}>PYPL</div>
              <div style={{ flex: 1 }}>
                <div className="num" style={{ fontSize: 11.5 }}>maya.r@hey.com</div>
                <div className="exp" style={{ fontSize: 10 }}>linked Apr 2025</div>
              </div>
            </div>

            <a href="#" className="btn btn-sm" style={{ width: '100%', justifyContent: 'center', marginBottom: 14 }}>
              + Add payment method
            </a>
          </div>

          <MbTabbar active="acct" />
        </div>
      </MobilePhone>

      {/* ── Phone 8: Notifications preferences ───────────── */}
      <MobilePhone label={<>Settings · <b>notifications</b></>}>
        <div className="phone-body" style={{ background: 'var(--wl-bg)' }}>
          <div className="mb-topbar">
            <span className="ic">{Icons.back}</span>
            <span className="ttl" style={{ flex: 1 }}>Notifications</span>
          </div>

          <div className="mb-pad" style={{ paddingBottom: 0 }}>
            {/* Channel summary */}
            <div style={{
              background: 'var(--wl-surface)',
              border: '1px solid var(--wl-rule)',
              borderRadius: 'var(--wl-radius)',
              padding: 14, marginBottom: 16,
            }}>
              <div className="eyebrow" style={{ marginBottom: 10 }}>How we reach you</div>
              {[
                ['Email', 'maya.r@hey.com',     true],
                ['SMS',   '+1 (917) 555 0142',  true],
                ['Push',  'iPhone · Brooklyn',  true],
              ].map(([nm, val, on]) => (
                <div key={nm} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 0',
                  borderBottom: nm === 'Push' ? 0 : '1px solid var(--wl-rule-soft)',
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{nm}</div>
                    <div className="mono" style={{ fontSize: 10.5, color: 'var(--wl-text-soft)' }}>{val}</div>
                  </div>
                  <span className={'pip' + (on ? ' on' : '')}></span>
                </div>
              ))}
            </div>

            {/* Per-topic */}
            <div className="eyebrow" style={{ marginBottom: 8 }}>What to send</div>

            <div style={{
              background: 'var(--wl-surface)',
              border: '1px solid var(--wl-rule)',
              borderRadius: 'var(--wl-radius)',
              padding: '0 14px',
            }}>
              {[
                ['Order updates',         'Shipping & delivery',        true],
                ['Subscription charges',  '3 days before each charge',  true],
                ['Back in stock',         'Items you\'re watching',     true],
                ['New drops',             'Marisol\'s weekly note',     true],
                ['Promotions',            'Seasonal sales',             false],
                ['Returns',               'Refund processed',           true],
              ].map(([nm, desc, on], i, arr) => (
                <div key={nm} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '11px 0',
                  borderBottom: i === arr.length - 1 ? 0 : '1px solid var(--wl-rule-soft)',
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{nm}</div>
                    <div className="fig" style={{ fontSize: 11.5 }}>{desc}</div>
                  </div>
                  <span className={'pip' + (on ? ' on' : '')}></span>
                </div>
              ))}
            </div>

            <div className="fig" style={{ fontSize: 11.5, marginTop: 12, textAlign: 'center', lineHeight: 1.5 }}>
              You can pause everything for a week if you're travelling.<br/>
              <a href="#" style={{ color: 'var(--wl-accent)', fontFamily: 'var(--wl-font-mono)', fontSize: 11 }}>Pause for 7 days →</a>
            </div>
          </div>

          <MbTabbar active="acct" />
        </div>
      </MobilePhone>

    </div>
  );
}

Object.assign(window, { CustomerMobile2, CustomerMobile3 });
