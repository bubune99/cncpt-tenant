// Atlas Customer — D9: Settings · Addresses + Payment, D10: Profile + Notifications

function CustomerAddrPay({ store }) {
  const { SfChrome, AcctSide } = window;

  return (
    <div className="page-frame">
      <SfChrome active="account" store={store} />

      <div className="acct-body">
        <AcctSide active="addresses" />

        <div className="acct-main">
          <div className="acct-head">
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="crumbs">
                <a href="#">Account</a><span className="sep">/</span>
                <span className="here">Addresses & Payment</span>
              </div>
              <h1>Addresses &amp; <span className="i">payment</span></h1>
              <div className="sub">Where it ships, what it ships on. Set defaults — the bag remembers them.</div>
            </div>
          </div>

          {/* ── Addresses ────────────────────────────── */}
          <div className="sect-row" style={{ marginTop: 18 }}>
            <h2 className="sect" style={{ fontSize: 18 }}>Addresses <span className="meta">3 saved</span></h2>
            <a href="#" className="more">+ Add address</a>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            <div className="ad-card default">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span className="lbl" style={{ marginBottom: 0 }}>Home · default</span>
                <span className="pill pill-solid-accent" style={{ fontSize: 8.5 }}>DEFAULT</span>
              </div>
              <div className="nm">Maya Rodriguez</div>
              <div style={{ fontSize: 13, lineHeight: 1.5 }}>318 Bedford Ave, Apt 4B<br/>Brooklyn, NY 11211<br/>United States<br/><span className="mono" style={{ fontSize: 11, color: 'var(--wl-text-soft)' }}>+1 (917) 555 0142</span></div>
              <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
                <a href="#" className="btn btn-sm btn-ghost">Edit</a>
                <a href="#" className="btn btn-sm btn-ghost">Use for billing</a>
              </div>
              <div className="fig" style={{ fontSize: 11, marginTop: 8 }}>used on 14 orders</div>
            </div>

            <div className="ad-card">
              <div className="lbl">Studio</div>
              <div className="nm">Maya Rodriguez · @ Marigold Studio</div>
              <div style={{ fontSize: 13, lineHeight: 1.5 }}>72 Greenpoint Ave<br/>Brooklyn, NY 11222<br/>United States<br/><span className="mono" style={{ fontSize: 11, color: 'var(--wl-text-soft)' }}>+1 (917) 555 0142</span></div>
              <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
                <a href="#" className="btn btn-sm btn-ghost">Edit</a>
                <a href="#" className="btn btn-sm btn-ghost">Make default</a>
              </div>
              <div className="fig" style={{ fontSize: 11, marginTop: 8 }}>used on 1 order</div>
            </div>

            <div className="ad-card" style={{ borderStyle: 'dashed', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', minHeight: 180, color: 'var(--wl-text-soft)' }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                border: '1.5px solid var(--wl-rule)',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 8,
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5v14"/></svg>
              </div>
              <div className="display" style={{ fontSize: 15, color: 'var(--wl-text)' }}>Add a new address</div>
              <div className="fig" style={{ fontSize: 12, marginTop: 2 }}>shipping or billing</div>
            </div>
          </div>

          {/* ── Payment methods ──────────────────────── */}
          <div className="sect-row" style={{ marginTop: 26 }}>
            <h2 className="sect" style={{ fontSize: 18 }}>Payment methods <span className="meta">2 saved</span></h2>
            <a href="#" className="more">+ Add payment</a>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="pay-card" style={{ border: '1px solid var(--wl-text)' }}>
              <div className="brand-mark" style={{ background: 'linear-gradient(135deg, #1a1f71 0%, #4d4dad 100%)' }}>VISA</div>
              <div style={{ flex: 1 }}>
                <div className="num">•••• •••• •••• 4242</div>
                <div className="exp">expires 09 / 28 · Maya Rodriguez</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                <span className="pill pill-solid-accent" style={{ fontSize: 8.5 }}>DEFAULT</span>
                <a href="#" className="link-arrow" style={{ fontSize: 10 }}>Edit</a>
              </div>
            </div>
            <div className="pay-card">
              <div className="brand-mark" style={{ background: 'linear-gradient(135deg, #e35424 0%, #f7c046 100%)' }}>M/C</div>
              <div style={{ flex: 1 }}>
                <div className="num">•••• •••• •••• 8811</div>
                <div className="exp">expires 02 / 27 · Maya Rodriguez</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                <a href="#" className="link-arrow" style={{ fontSize: 10 }}>Make default</a>
                <a href="#" className="link-arrow" style={{ fontSize: 10, color: 'var(--wl-text-soft)' }}>Remove</a>
              </div>
            </div>

            <div className="pay-card" style={{ background: 'var(--wl-surface-2)' }}>
              <div className="brand-mark" style={{ background: 'linear-gradient(135deg, #003087 0%, #0070ba 100%)' }}>PYPL</div>
              <div style={{ flex: 1 }}>
                <div className="num">maya.r@hey.com</div>
                <div className="exp">linked since 12 Apr 2025</div>
              </div>
              <a href="#" className="link-arrow" style={{ fontSize: 10 }}>Unlink</a>
            </div>

            <div className="pay-card" style={{ borderStyle: 'dashed', justifyContent: 'center', color: 'var(--wl-text-soft)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5v14"/></svg>
              <span className="display" style={{ fontSize: 13.5, color: 'var(--wl-text)' }}>Add card · or connect Apple Pay</span>
            </div>
          </div>

          {/* ── Billing notice ───────────────────────── */}
          <div className="card tinted" style={{ marginTop: 20, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'var(--wl-accent-soft)', color: 'var(--wl-accent)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>Card on file expires in September.</div>
              <div className="fig" style={{ fontSize: 12 }}>Your Marigold tea subscription renews monthly — we'll prompt you before the next charge if the card is past expiry.</div>
            </div>
            <a href="#" className="btn btn-sm">Update Visa</a>
          </div>

        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   D10: Profile + Notifications
   ───────────────────────────────────────────────────────────── */
function CustomerProfile({ store }) {
  const { SfChrome, AcctSide } = window;

  return (
    <div className="page-frame">
      <SfChrome active="account" store={store} />

      <div className="acct-body">
        <AcctSide active="profile" />

        <div className="acct-main">
          <div className="acct-head">
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="crumbs">
                <a href="#">Account</a><span className="sep">/</span>
                <span className="here">Profile & preferences</span>
              </div>
              <h1>Profile &amp; <span className="i">preferences.</span></h1>
              <div className="sub">Who you are, how we reach you, what shows up in your inbox.</div>
            </div>
            <div className="right">
              <a href="#" className="btn btn-ghost btn-sm">Discard</a>
              <a href="#" className="btn btn-solid btn-sm">Save changes</a>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 22, marginTop: 18 }}>

            {/* ── Left: Profile + Notifications stacked ────── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>

              <div className="card">
                <h2 className="sect" style={{ fontSize: 18, marginBottom: 14 }}>Profile</h2>
                <div className="form-grid">
                  <div className="input-row">
                    <label>First name</label>
                    <input className="input" defaultValue="Maya" />
                  </div>
                  <div className="input-row">
                    <label>Last name</label>
                    <input className="input" defaultValue="Rodriguez" />
                  </div>
                  <div className="input-row" style={{ gridColumn: 'span 2' }}>
                    <label>Email · used for order receipts</label>
                    <input className="input" defaultValue="maya.r@hey.com" />
                  </div>
                  <div className="input-row">
                    <label>Phone · for SMS shipping updates</label>
                    <input className="input" defaultValue="+1 (917) 555 0142" />
                  </div>
                  <div className="input-row">
                    <label>Birthday · for the +100 pts bonus</label>
                    <input className="input" defaultValue="18 March" />
                  </div>
                  <div className="input-row" style={{ gridColumn: 'span 2' }}>
                    <label>Password</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input className="input" defaultValue="••••••••••••" style={{ flex: 1 }} />
                      <a href="#" className="btn btn-sm">Change</a>
                    </div>
                    <div className="fig" style={{ fontSize: 11.5, marginTop: 2 }}>last changed 14 Mar 2025</div>
                  </div>
                </div>
              </div>

              <div className="card">
                <h2 className="sect" style={{ fontSize: 18, marginBottom: 6 }}>Notifications</h2>
                <div className="fig" style={{ fontSize: 12, marginBottom: 8 }}>What lands in your inbox, your phone, and the bell at the top of the site.</div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 60px 60px', gap: 0, alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--wl-rule)' }}>
                  <span className="eyebrow" style={{ fontSize: 9.5 }}>Topic</span>
                  <span className="eyebrow" style={{ fontSize: 9.5, textAlign: 'center' }}>Email</span>
                  <span className="eyebrow" style={{ fontSize: 9.5, textAlign: 'center' }}>SMS</span>
                  <span className="eyebrow" style={{ fontSize: 9.5, textAlign: 'center' }}>App</span>
                </div>

                {[
                  ['Order updates',         'Placed, shipped, delivered, delayed.',  true,  true,  true],
                  ['Subscription reminders','3 days before each charge.',            true,  true,  true],
                  ['Back-in-stock alerts',  'Items you asked us to watch.',          true,  false, true],
                  ['New drops & journal',   'Marisol\'s weekly note.',               true,  false, true],
                  ['Promotions',            'Seasonal sales & member offers.',       false, false, false],
                  ['Return status',         'Refund processed, label received.',     true,  true,  false],
                ].map(([nm, desc, em, sms, app]) => (
                  <div key={nm} style={{ display: 'grid', gridTemplateColumns: '1fr 60px 60px 60px', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--wl-rule-soft)' }}>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 500 }}>{nm}</div>
                      <div className="fig" style={{ fontSize: 12, lineHeight: 1.35 }}>{desc}</div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center' }}><span className={'pip' + (em ? ' on' : '')}></span></div>
                    <div style={{ display: 'flex', justifyContent: 'center' }}><span className={'pip' + (sms ? ' on' : '')}></span></div>
                    <div style={{ display: 'flex', justifyContent: 'center' }}><span className={'pip' + (app ? ' on' : '')}></span></div>
                  </div>
                ))}
              </div>

            </div>

            {/* ── Right column: account meta + danger zone ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="card">
                <div className="eyebrow" style={{ marginBottom: 8 }}>Account</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <span style={{
                    width: 52, height: 52, borderRadius: '50%',
                    background: 'var(--wl-accent)', color: 'var(--wl-accent-fg)',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--wl-font-display)', fontSize: 22, fontWeight: 500,
                  }}>M</span>
                  <div>
                    <div className="display" style={{ fontSize: 16 }}>Maya Rodriguez</div>
                    <div className="mono" style={{ fontSize: 10.5, color: 'var(--wl-text-soft)' }}>customer · loyal · since Mar 2024</div>
                  </div>
                </div>
                <a href="#" className="btn btn-sm btn-ghost" style={{ width: '100%', justifyContent: 'center' }}>Change photo</a>
              </div>

              <div className="card">
                <div className="eyebrow" style={{ marginBottom: 8 }}>Connected</div>
                {[
                  ['Apple', 'maya.r@…', true],
                  ['Google', 'not linked', false],
                ].map(([nm, val, on]) => (
                  <div key={nm} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 0', borderBottom: '1px solid var(--wl-rule-soft)',
                  }}>
                    <span style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: on ? 'var(--wl-text)' : 'var(--wl-surface-2)',
                      color: on ? 'var(--wl-bg)' : 'var(--wl-text-faint)',
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'var(--wl-font-display)', fontSize: 12, fontWeight: 600,
                    }}>{nm[0]}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13 }}>{nm}</div>
                      <div className="fig" style={{ fontSize: 11 }}>{val}</div>
                    </div>
                    <a href="#" className="link-arrow" style={{ fontSize: 10 }}>{on ? 'Unlink' : 'Link →'}</a>
                  </div>
                ))}
              </div>

              <div className="card" style={{ borderColor: 'var(--wl-error)' }}>
                <div className="eyebrow-accent" style={{ color: 'var(--wl-error)', marginBottom: 6 }}>Danger zone</div>
                <div className="fig" style={{ fontSize: 12, lineHeight: 1.45, marginBottom: 10 }}>
                  Download a copy of your data, or close your account. We keep order history 7 years for tax reasons.
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <a href="#" className="btn btn-sm btn-ghost" style={{ justifyContent: 'center' }}>Download my data</a>
                  <a href="#" className="btn btn-sm" style={{ justifyContent: 'center', borderColor: 'var(--wl-error)', color: 'var(--wl-error)' }}>Close account</a>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

Object.assign(window, { CustomerAddrPay, CustomerProfile });
