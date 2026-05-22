// Atlas Customer — D7: Returns & D8: Loyalty
// Two related pages bundled together.

function CustomerReturns({ store }) {
  const { SfChrome, AcctSide } = window;

  const eligible = [
    { ord: '#4702', when: '28 Apr · 18d left',  nm: 'Marigold cap',          v: 'One size · Moss',     price: '$32.00', deadline: '14 days remaining' },
  ];

  const history = [
    { id: 'R-0088', ord: '#4488', when: '24 Mar', nm: 'Heritage hoodie',  reason: 'Too small',         outcome: 'Refunded · $24.50 store credit', cls: 'pill-out' },
    { id: 'R-0067', ord: '#4225', when: '02 Feb', nm: 'Field journal',    reason: 'Damaged in transit', outcome: 'Replaced',                       cls: 'pill-solid-moss' },
  ];

  return (
    <div className="page-frame">
      <SfChrome active="account" store={store} />

      <div className="acct-body">
        <AcctSide active="returns" />

        <div className="acct-main">
          <div className="acct-head">
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="crumbs">
                <a href="#">Account</a><span className="sep">/</span>
                <span className="here">Returns</span>
              </div>
              <h1>Returns & <span className="i">exchanges</span></h1>
              <div className="sub">30-day return window · we cover the label · $24.50 in store credit on hand</div>
            </div>
            <div className="right">
              <a href="#" className="btn btn-ghost btn-sm">Return policy</a>
              <a href="#" className="btn btn-solid btn-sm">Start a return →</a>
            </div>
          </div>

          {/* ── Open returns banner (none) + eligible items ── */}
          <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: '1fr 280px', gap: 18 }}>
            <div>
              <div className="sect-row">
                <h2 className="sect" style={{ fontSize: 18 }}>Eligible to return <span className="meta">1 item</span></h2>
                <span className="fig" style={{ fontSize: 12, marginLeft: 'auto' }}>items delivered in the last 30 days</span>
              </div>

              {eligible.map((e) => (
                <div key={e.ord} className="card" style={{ display: 'grid', gridTemplateColumns: '72px 1fr auto', gap: 14, alignItems: 'center' }}>
                  <div style={{
                    width: 72, height: 72, borderRadius: 'var(--wl-radius-sm)',
                    border: '1px solid var(--wl-rule)',
                    background: 'repeating-linear-gradient(45deg, var(--wl-surface-2) 0 6px, var(--wl-surface-3) 6px 12px)',
                  }}></div>
                  <div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                      <span className="display" style={{ fontSize: 16 }}>{e.nm}</span>
                      <span className="mono" style={{ fontSize: 11, color: 'var(--wl-text-soft)' }}>from {e.ord}</span>
                    </div>
                    <div className="fig" style={{ fontSize: 12 }}>{e.v} · delivered {e.when}</div>
                    <div style={{ marginTop: 6, display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span className="pill pill-out-accent">{e.deadline}</span>
                      <span className="mono" style={{ fontSize: 12 }}>{e.price}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <a href="#" className="btn btn-sm">Return</a>
                    <a href="#" className="btn btn-sm btn-ghost">Exchange</a>
                  </div>
                </div>
              ))}

              {/* Why return / how it works */}
              <div className="card tinted" style={{ marginTop: 14 }}>
                <div className="eyebrow-accent" style={{ marginBottom: 8 }}>How returns work</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                  {[
                    ['1', 'Pick the item', 'Choose what to send back, tell us why.'],
                    ['2', 'Print the label', 'We email a prepaid USPS label. Drop at any blue box.'],
                    ['3', 'Refund or credit', 'Refund to original payment, or +10% as store credit.'],
                  ].map(([n, t, d]) => (
                    <div key={n}>
                      <div style={{
                        width: 22, height: 22, borderRadius: '50%',
                        background: 'var(--wl-accent)', color: 'var(--wl-accent-fg)',
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: 'var(--wl-font-mono)', fontSize: 11, fontWeight: 600,
                        marginBottom: 8,
                      }}>{n}</div>
                      <div className="display" style={{ fontSize: 14 }}>{t}</div>
                      <div className="fig" style={{ fontSize: 12, lineHeight: 1.4, marginTop: 2 }}>{d}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* History */}
              <div className="sect-row" style={{ marginTop: 22 }}>
                <h2 className="sect" style={{ fontSize: 18 }}>Past returns <span className="meta">2</span></h2>
              </div>
              <div className="card bare" style={{ background: 'var(--wl-surface)', border: '1px solid var(--wl-rule)', borderRadius: 'var(--wl-radius)', padding: '4px 16px' }}>
                <table className="tbl">
                  <thead>
                    <tr>
                      <th style={{ width: 90 }}>Return</th>
                      <th style={{ width: 90 }}>Order</th>
                      <th style={{ width: 90 }}>Date</th>
                      <th>Item / reason</th>
                      <th style={{ width: 170 }}>Outcome</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((r) => (
                      <tr key={r.id}>
                        <td><span className="mono" style={{ fontWeight: 600 }}>{r.id}</span></td>
                        <td><span className="mono" style={{ color: 'var(--wl-text-soft)' }}>{r.ord}</span></td>
                        <td><span className="fig" style={{ fontSize: 13 }}>{r.when}</span></td>
                        <td>
                          <div className="display" style={{ fontSize: 14 }}>{r.nm}</div>
                          <div className="fig" style={{ fontSize: 11.5 }}>{r.reason}</div>
                        </td>
                        <td><span className={'pill ' + r.cls}>{r.outcome}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="card" style={{ background: 'var(--wl-accent)', color: 'var(--wl-accent-fg)', border: 0 }}>
                <div className="eyebrow" style={{ color: 'var(--wl-accent-fg)', opacity: .8 }}>Store credit balance</div>
                <div className="display" style={{ fontSize: 36, color: 'var(--wl-accent-fg)', marginTop: 6, marginBottom: 6 }}>$24.50</div>
                <div className="fig" style={{ color: 'var(--wl-accent-fg)', opacity: .85, fontSize: 12 }}>from return R-0088 · no expiry</div>
                <a href="#" className="btn btn-sm" style={{ marginTop: 12, background: 'var(--wl-accent-fg)', color: 'var(--wl-accent)', borderColor: 'transparent', width: '100%', justifyContent: 'center' }}>
                  Apply to next order
                </a>
              </div>

              <div className="card tinted">
                <div className="eyebrow" style={{ marginBottom: 8 }}>Need help?</div>
                <div className="fig" style={{ fontSize: 13, lineHeight: 1.5, marginBottom: 10 }}>
                  Marisol replies to returns within a day. Send a photo if something arrived damaged.
                </div>
                <a href="#" className="btn btn-sm" style={{ width: '100%', justifyContent: 'center' }}>Email the studio</a>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   D8: Loyalty & store credit
   ───────────────────────────────────────────────────────────── */
function CustomerLoyalty({ store }) {
  const { SfChrome, AcctSide } = window;

  const rewards = [
    { pts: 200,  nm: 'Free shipping',              desc: 'One order, any size',           avail: true },
    { pts: 500,  nm: '$5 off',                     desc: 'Code at checkout · stackable',  avail: true },
    { pts: 700,  nm: 'Hand-poured candle',         desc: 'no. 4 — cardamom',              avail: false, locked: '88 pts away' },
    { pts: 1200, nm: 'Studio tour invitation',     desc: 'Once a season · Brooklyn',      avail: false, locked: '588 pts away' },
    { pts: 2000, nm: 'A custom dye-batch tee',     desc: 'Marisol picks colours with you', avail: false, locked: '1,388 pts away' },
  ];

  const activity = [
    ['16 May', 'Order #4821 placed',           '+54 pts',  'earn'],
    ['28 Apr', 'Order #4702 delivered',        '+32 pts',  'earn'],
    ['14 Apr', 'Redeemed: $5 off',             '−500 pts', 'spend'],
    ['14 Apr', 'Order #4621 placed',           '+92 pts',  'earn'],
    ['22 Mar', 'Return R-0088',                '+0 pts',   'note',  '$24.50 credit issued'],
    ['18 Mar', 'Birthday bonus',               '+100 pts', 'gift'],
  ];

  return (
    <div className="page-frame">
      <SfChrome active="account" store={store} />

      <div className="acct-body">
        <AcctSide active="loyalty" />

        <div className="acct-main">
          <div className="acct-head">
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="crumbs">
                <a href="#">Account</a><span className="sep">/</span>
                <span className="here">Loyalty & credit</span>
              </div>
              <h1>Studio <span className="i">loyalty.</span></h1>
              <div className="sub">Every dollar earns a point. Marisol tops it up on birthdays and milestone orders.</div>
            </div>
            <div className="right">
              <a href="#" className="btn btn-ghost btn-sm">How it works</a>
            </div>
          </div>

          {/* ── Hero: tier + points + credit ────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 18, marginTop: 18 }}>
            <div className="card" style={{ padding: 22 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
                <div>
                  <div className="eyebrow-accent">Your tier</div>
                  <div className="display" style={{ fontSize: 42, marginTop: 4, lineHeight: 1 }}>Loyal <span className="display-i" style={{ color: 'var(--wl-text-soft)' }}>·  yr 2</span></div>
                  <div className="fig" style={{ fontSize: 13, marginTop: 6 }}>14 orders · since 14 Mar 2024</div>
                </div>
                <div style={{
                  width: 84, height: 84, borderRadius: '50%',
                  background: 'var(--wl-accent)', color: 'var(--wl-accent-fg)',
                  border: '4px solid var(--wl-surface-2)',
                  display: 'inline-flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--wl-font-display)',
                }}>
                  <span style={{ fontSize: 11, opacity: .8, letterSpacing: '.12em' }}>YR</span>
                  <span style={{ fontSize: 30, lineHeight: 1, fontWeight: 600 }}>02</span>
                </div>
              </div>

              <div className="eyebrow" style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
                <span>Progress to VIP</span><span style={{ color: 'var(--wl-accent)', letterSpacing: '.04em' }}>3 orders to go</span>
              </div>
              <div className="loy-bar" style={{ height: 10 }}><div className="fill" style={{ width: '78%' }}></div></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontFamily: 'var(--wl-font-mono)', fontSize: 9.5, letterSpacing: '.1em', color: 'var(--wl-text-faint)' }}>
                <span>NEW</span><span>REPEAT</span><span>REGULAR</span><span style={{ color: 'var(--wl-accent)', fontWeight: 700 }}>LOYAL</span><span>VIP</span>
              </div>

              <div className="card tinted" style={{ marginTop: 18, padding: '14px 16px' }}>
                <div className="eyebrow-accent" style={{ marginBottom: 6 }}>VIP unlocks</div>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 13, fontFamily: 'var(--wl-font-body)' }}>
                  <li style={{ display: 'flex', gap: 6 }}>
                    <span style={{ color: 'var(--wl-accent)' }}>✓</span> Free shipping always
                  </li>
                  <li style={{ display: 'flex', gap: 6 }}>
                    <span style={{ color: 'var(--wl-accent)' }}>✓</span> First look at new drops
                  </li>
                  <li style={{ display: 'flex', gap: 6 }}>
                    <span style={{ color: 'var(--wl-accent)' }}>✓</span> 2× points on subscriptions
                  </li>
                  <li style={{ display: 'flex', gap: 6 }}>
                    <span style={{ color: 'var(--wl-accent)' }}>✓</span> Custom dye-batch invite
                  </li>
                </ul>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="card" style={{ padding: 18 }}>
                <div className="eyebrow">Points balance</div>
                <div className="display" style={{ fontSize: 44, color: 'var(--wl-accent)', marginTop: 4, marginBottom: 2, lineHeight: 1 }}>612</div>
                <div className="fig" style={{ fontSize: 12 }}>88 to your next reward</div>
                <div style={{ borderTop: '1px solid var(--wl-rule-soft)', marginTop: 12, paddingTop: 10 }}>
                  <div className="eyebrow">Store credit</div>
                  <div className="display" style={{ fontSize: 24, marginTop: 2 }}>$24.50</div>
                  <div className="fig" style={{ fontSize: 11 }}>from return R-0088</div>
                </div>
              </div>
              <div className="card tinted">
                <div className="eyebrow" style={{ marginBottom: 6 }}>Earn faster</div>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', fontSize: 12.5, lineHeight: 1.6, fontFamily: 'var(--wl-font-body)', color: 'var(--wl-text-soft)' }}>
                  <li><b style={{ color: 'var(--wl-text)' }}>+1 pt</b> per dollar spent</li>
                  <li><b style={{ color: 'var(--wl-text)' }}>+25 pts</b> for a product review</li>
                  <li><b style={{ color: 'var(--wl-text)' }}>+100 pts</b> on your birthday</li>
                  <li><b style={{ color: 'var(--wl-text)' }}>+250 pts</b> referring a friend</li>
                </ul>
              </div>
            </div>
          </div>

          {/* ── Rewards row ──────────────────────────── */}
          <div className="sect-row" style={{ marginTop: 22 }}>
            <h2 className="sect" style={{ fontSize: 18 }}>Redeem points</h2>
            <span className="fig" style={{ fontSize: 12, marginLeft: 'auto' }}>2 available now</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
            {rewards.map((r) => (
              <div key={r.nm} className="card" style={{ padding: 14, opacity: r.avail ? 1 : 0.62, position: 'relative' }}>
                <div className="mono" style={{ fontSize: 10, letterSpacing: '.1em', color: r.avail ? 'var(--wl-accent)' : 'var(--wl-text-faint)' }}>{r.pts} PTS</div>
                <div className="display" style={{ fontSize: 15, marginTop: 6, lineHeight: 1.15 }}>{r.nm}</div>
                <div className="fig" style={{ fontSize: 11.5, marginTop: 3, lineHeight: 1.35 }}>{r.desc}</div>
                {r.avail
                  ? <a href="#" className="btn btn-sm btn-accent" style={{ width: '100%', justifyContent: 'center', marginTop: 10, padding: '4px 8px', fontSize: 11 }}>Redeem</a>
                  : <div className="mono" style={{ fontSize: 10, color: 'var(--wl-text-faint)', marginTop: 10, letterSpacing: '.04em' }}>🔒 {r.locked}</div>
                }
              </div>
            ))}
          </div>

          {/* ── Activity log ────────────────────────── */}
          <div className="sect-row" style={{ marginTop: 22 }}>
            <h2 className="sect" style={{ fontSize: 18 }}>Activity</h2>
            <a href="#" className="more">full ledger →</a>
          </div>
          <div className="card bare" style={{ background: 'var(--wl-surface)', border: '1px solid var(--wl-rule)', borderRadius: 'var(--wl-radius)', padding: '4px 16px' }}>
            <table className="tbl">
              <tbody>
                {activity.map(([when, what, pts, kind, note], i) => (
                  <tr key={i}>
                    <td style={{ width: 80 }}><span className="fig" style={{ fontSize: 13 }}>{when}</span></td>
                    <td>
                      <div style={{ fontSize: 13 }}>{what}</div>
                      {note && <div className="fig" style={{ fontSize: 11 }}>{note}</div>}
                    </td>
                    <td className="num" style={{
                      width: 100,
                      color: kind === 'earn' || kind === 'gift' ? 'var(--wl-success)' : kind === 'spend' ? 'var(--wl-accent)' : 'var(--wl-text-soft)',
                      fontWeight: 600,
                    }}>{pts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </div>
  );
}

Object.assign(window, { CustomerReturns, CustomerLoyalty });
