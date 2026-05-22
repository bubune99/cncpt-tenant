// Atlas Editors — Customer editor
// Maya Rodriguez · the dossier · orders, notes, lifecycle

const { Chrome } = window;

function CustomerEditor() {
  const { Crumbs, EditorTabs, Sec, SaveBar } = window;

  const orders = [
    { id: '#4821', when: 'today 09:14',  items: 2, total: '$53.66',  status: 'NEW',     cls: 'pill-solid-accent', sel: true },
    { id: '#4702', when: '28 Apr',       items: 1, total: '$32.00',  status: 'SHIPPED', cls: 'pill-solid-moss',   sel: false },
    { id: '#4621', when: '14 Apr',       items: 3, total: '$92.20',  status: 'SHIPPED', cls: 'pill-solid-moss',   sel: false },
    { id: '#4488', when: '24 Mar',       items: 2, total: '$48.00',  status: 'SHIPPED', cls: 'pill-solid-moss',   sel: false },
    { id: '#4402', when: '11 Mar',       items: 1, total: '$28.00',  status: 'SHIPPED', cls: 'pill-solid-moss',   sel: false },
    { id: '#4288', when: '14 Feb',       items: 4, total: '$112.40', status: 'SHIPPED', cls: 'pill-solid-moss',   sel: false },
    { id: '#4140', when: '22 Jan',       items: 1, total: '$32.00',  status: 'SHIPPED', cls: 'pill-solid-moss',   sel: false },
  ];

  return (
    <Chrome section="customers">
      <Crumbs items={[['CMS'], ['Customers', '#'], ['Loyal', '#'], ['Maya Rodriguez']]} />

      <div className="editor-head">
        <div style={{ flex: 1, minWidth: 0, display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          <span className="avatar" style={{ width: 60, height: 60, background: '#c8443a', fontSize: 22, flexShrink: 0, marginTop: 6 }}>MR</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="eyebrow">Customer · loyal · since Mar 2024</div>
            <h1>Maya <span className="display-i">Rodriguez</span></h1>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginTop: 6 }}>
              <span className="mono" style={{ fontSize: 12, color: 'var(--ink-soft)' }}>maya.r@hey.com</span>
              <span className="pill pill-solid-moss">LOYAL · 14 orders</span>
              <span className="fig" style={{ fontSize: 13 }}>last seen <span style={{ color: 'var(--accent)' }}>4 minutes ago · placed #4821</span></span>
            </div>
          </div>
        </div>
        <div className="actions">
          <button className="btn"><span className="kbd">M</span>Message</button>
          <button className="btn"><span className="kbd">T</span>Tag</button>
          <button className="btn btn-solid"><span className="kbd">⏎</span>Open #4821</button>
        </div>
      </div>

      <EditorTabs
        items={[['Overview', null, true], ['Orders', 14], ['Notes', 3], ['Activity', null], ['Comms', 22], ['Segments', 4]]}
        right={<><span>customer id · c_8j2k1a</span></>}
      />

      <div className="editor-body">
        {/* LEFT — stats, orders, notes */}
        <div className="editor-col" style={{ overflow: 'auto', paddingRight: 4 }}>

          <div>
            <Sec n="§1" h="At a glance" meta="lifetime" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
              <div className="brick">
                <div className="l">lifetime value</div>
                <div className="v accent" style={{ fontSize: 26 }}>$612</div>
                <div className="d">top 14% of roster</div>
              </div>
              <div className="brick">
                <div className="l">orders</div>
                <div className="v">14</div>
                <div className="d">1 every 32 days</div>
              </div>
              <div className="brick">
                <div className="l">avg basket</div>
                <div className="v">$43.71</div>
                <div className="d">↑ from $38</div>
              </div>
              <div className="brick">
                <div className="l">retention</div>
                <div className="v">14 mo</div>
                <div className="d">no gaps</div>
              </div>
              <div className="brick">
                <div className="l">churn risk</div>
                <div className="v" style={{ color: 'var(--moss)' }}>low</div>
                <div className="d">healthy cadence</div>
              </div>
            </div>

            {/* Cadence sparkline */}
            <div style={{ marginTop: 14, borderTop: '1px solid var(--rule)', paddingTop: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span className="eyebrow-ink">Order cadence — 14 months</span>
                <span className="fig" style={{ fontSize: 12 }}>each bar = one month · height = spend</span>
              </div>
              <svg viewBox="0 0 700 70" className="spark" style={{ marginTop: 6 }}>
                <line x1="0" x2="700" y1="60" y2="60" stroke="var(--rule)" />
                {[18, 0, 32, 28, 0, 48, 22, 0, 92, 38, 0, 48, 32, 54].map((v, i) => (
                  <rect key={i} x={i * 48 + 4} y={60 - v * 0.5} width={28} height={v * 0.5} fill={i === 13 ? 'var(--accent)' : 'var(--ink)'} />
                ))}
                <text x="700" y="58" fontFamily="Geist Mono" fontSize="9" fill="var(--ink-soft)" textAnchor="end">now</text>
              </svg>
            </div>
          </div>

          <div>
            <Sec n="§2" h="Orders" meta="14 lifetime · showing 7"
              right={<a href="#" style={{ color: 'var(--accent)' }}>see all →</a>} />
            <table className="tbl">
              <thead>
                <tr>
                  <th style={{ width: 70 }}>Order</th>
                  <th style={{ width: 130 }}>Placed</th>
                  <th className="num" style={{ width: 50 }}>Items</th>
                  <th className="num" style={{ width: 80 }}>Total</th>
                  <th style={{ width: 100 }}>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className={o.sel ? 'sel' : ''} style={o.sel ? { background: 'var(--paper-2)' } : {}}>
                    <td><span className="mono accent">{o.id}</span></td>
                    <td><span className="meta">{o.when}</span></td>
                    <td className="num">{o.items}</td>
                    <td className="num">{o.total}</td>
                    <td><span className={'pill ' + o.cls}>{o.status}</span></td>
                    <td><span className="fig" style={{ fontSize: 11 }}>→ open</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
            <Sec n="§3" h="Notes & activity" meta="internal" right="+ note" />
            <div className="tl">
              <div className="tl-item now">
                <div className="when">09:14 · today</div>
                <div className="what"><b>Placed order #4821</b> · Dahlia tee M (last in stock) + Marigold cap <span className="fig">— $53.66</span></div>
              </div>
              <div className="tl-item">
                <div className="when">09:10 · today</div>
                <div className="what">Viewed <span className="mono" style={{ fontSize: 11 }}>/shop/dahlia-tee</span> · 4 min on page · added M to cart</div>
              </div>
              <div className="tl-item">
                <div className="when">12 May · Marisol</div>
                <div className="what"><b>Note:</b> <span className="fig">"Asked over email about a tote bag in moss — promised to email when restocked. Set Klaviyo flow."</span></div>
              </div>
              <div className="tl-item">
                <div className="when">28 Apr</div>
                <div className="what">Opened "Marigold spring" newsletter · clicked Dahlia tee link</div>
              </div>
              <div className="tl-item">
                <div className="when">22 Mar · Marisol</div>
                <div className="what"><b>Note:</b> <span className="fig">"Repeat customer, very kind — packed her #4488 with a hand-written note."</span></div>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT — contact, addresses, segments */}
        <div className="editor-col" style={{ overflow: 'auto' }}>
          <div>
            <Sec h="Contact" />
            <div className="field"><span className="lbl">email</span><span className="val mono">maya.r@hey.com</span></div>
            <div className="field"><span className="lbl">phone</span><span className="val mono">+1 718 555 0142</span></div>
            <div className="field"><span className="lbl">birthday</span><span className="val">— not given —</span></div>
            <div className="field"><span className="lbl">pronouns</span><span className="val">she/her</span></div>
          </div>

          <div>
            <Sec h="Addresses" meta="1 saved" right="+ add" />
            <div style={{ fontSize: 13, lineHeight: 1.5, padding: '6px 0', borderBottom: '1px solid var(--rule-soft)' }}>
              <div className="mono" style={{ fontSize: 10, color: 'var(--accent)', letterSpacing: '.1em' }}>DEFAULT · SHIPPING + BILLING</div>
              318 Bedford Ave, Apt 4B<br/>
              Brooklyn, NY 11211<br/>
              <span className="fig" style={{ fontSize: 11 }}>used on all 14 orders</span>
            </div>
          </div>

          <div>
            <Sec h="Segments" meta="4 of 12" right="manage" />
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <span className="pill pill-solid-moss">LOYAL</span>
              <span className="pill pill-out">Brooklyn locals</span>
              <span className="pill pill-out">Thursday newsletter</span>
              <span className="pill pill-out">Repeat · 6mo+</span>
              <span className="pill pill-out-accent">⚑ M-tee waitlist</span>
            </div>
          </div>

          <div>
            <Sec h="Marketing" />
            <div className="field"><span className="lbl">newsletter</span><span className="val">Subscribed · Thursday letter</span></div>
            <div className="field"><span className="lbl">sms</span><span className="val fig">opted out</span></div>
            <div className="field"><span className="lbl">consent</span><span className="val">explicit · 14 Mar 2024</span></div>
            <div className="field"><span className="lbl">last sent</span><span className="val">"Marigold spring" · 28 Apr · opened</span></div>
            <div className="field"><span className="lbl">open rate</span><span className="val accent" style={{ fontWeight: 500 }}>64% (22 of 34)</span></div>
          </div>

          <div>
            <Sec h="Lifecycle" />
            <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', padding: '8px 0 4px' }}>
              {['lead', 'first', 'repeat', 'loyal', 'vip'].map((s, i) => {
                const cur = i === 3;
                const past = i < 3;
                return (
                  <div key={s} style={{ textAlign: 'center', flex: 1, position: 'relative' }}>
                    <div style={{
                      width: 14, height: 14, borderRadius: '50%', margin: '0 auto',
                      background: cur ? 'var(--accent)' : past ? 'var(--ink)' : 'var(--paper)',
                      border: '1px solid var(--ink)',
                    }}></div>
                    <div className="mono" style={{ fontSize: 9, marginTop: 4, letterSpacing: '.08em', textTransform: 'uppercase', color: cur ? 'var(--accent)' : past ? 'var(--ink)' : 'var(--ink-faint)' }}>{s}</div>
                    {i < 4 && <div style={{ position: 'absolute', top: 7, left: '60%', right: '-40%', height: 1, background: past || cur ? 'var(--ink)' : 'var(--rule)' }}></div>}
                  </div>
                );
              })}
            </div>
            <div className="fig" style={{ fontSize: 12, marginTop: 6 }}>3 more orders · $200 more spend · VIP threshold</div>
          </div>
        </div>
      </div>

      <SaveBar
        savedAt="profile up to date"
        hints={[['M', 'message'], ['T', 'tag'], ['E', 'export'], ['B', 'block'], ['⏎', 'open last order']]}
      />
    </Chrome>
  );
}

Object.assign(window, { CustomerEditor });
