// Atlas Editors — Order editor (rev 2)
// Per-line-item sub-fulfillment · configurable product with attachments
// Order-level kanban still moves the whole order; this surface tracks the parts.

const { Chrome } = window;

// Sub-task row for a line item
function SubSteps({ steps }) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
      {steps.map(([label, state, hint], i) => {
        const done = state === 'done';
        const active = state === 'active';
        return (
          <span key={i} style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '3px 8px 3px 6px',
            border: '1px solid ' + (done ? 'var(--ink)' : active ? 'var(--accent)' : 'var(--rule)'),
            background: done ? 'var(--ink)' : active ? 'var(--paper)' : 'transparent',
            color: done ? 'var(--paper)' : active ? 'var(--accent)' : 'var(--ink-soft)',
            borderRadius: 'var(--r-sm)',
            fontFamily: 'Geist Mono, monospace', fontSize: 10, letterSpacing: '.05em',
          }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 12, height: 12,
              border: '1px solid ' + (done ? 'var(--paper)' : active ? 'var(--accent)' : 'var(--rule)'),
              background: done ? 'var(--paper)' : 'transparent',
              color: done ? 'var(--ink)' : 'transparent',
              fontSize: 9, lineHeight: 1, borderRadius: 2,
            }}>{done ? '✓' : ''}</span>
            <span style={{ textTransform: 'uppercase' }}>{label}</span>
            {hint && <span style={{ fontStyle: 'italic', textTransform: 'none', fontFamily: 'Spectral, serif', color: 'inherit', opacity: .8, marginLeft: 2 }}>{hint}</span>}
          </span>
        );
      })}
    </div>
  );
}

// Attachment pill
function Attach({ name, size, kind }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '3px 8px',
      background: 'var(--paper)', border: '1px solid var(--rule)',
      borderRadius: 'var(--r-sm)', fontSize: 11,
    }}>
      <span style={{
        fontFamily: 'Geist Mono', fontSize: 8, padding: '1px 4px',
        background: 'var(--ink)', color: 'var(--paper)', letterSpacing: '.05em',
      }}>{kind}</span>
      <span className="mono" style={{ fontSize: 11 }}>{name}</span>
      <span className="fig" style={{ fontSize: 10 }}>{size}</span>
      <span style={{ color: 'var(--accent)', fontSize: 10, marginLeft: 2 }}>↓</span>
    </span>
  );
}

function OrderEditor() {
  const { Crumbs, EditorTabs, Sec, SaveBar } = window;

  // 3 items with progressive fulfillment states
  const items = [
    {
      sku: 'APRN-CUST-M', color: '#c4b8a0',
      name: 'Custom embroidered apron · M',
      qty: 1, price: '$84.00', sub: '$84.00',
      kind: 'CONFIGURABLE',
      configurable: true,
      options: [
        ['Size', 'M'],
        ['Body', 'Linen natural'],
        ['Embroidery', '"Bedford St. Café"'],
        ['Thread', 'Forest moss · #4f5e3a'],
        ['Placement', 'Front chest · 4cm'],
      ],
      attachments: [
        { name: 'cafe-logo.svg',       size: '12 kb',  kind: 'SVG' },
        { name: 'brand-reference.pdf', size: '2.4 mb', kind: 'PDF' },
        { name: 'hem-spec.png',        size: '480 kb', kind: 'IMG' },
      ],
      steps: [
        ['Pick blank',     'done',   '— shelf B-4'],
        ['Confirm spec',   'done',   '— customer ok'],
        ['Embroider',      'active', '— in progress · 18 min'],
        ['QC',             'pending'],
        ['Pack',           'pending'],
      ],
      note: 'Customer asked for tight stitch on the "C" — see attached brand-reference p.2',
    },
    {
      sku: 'SHIRT-DAH-M', color: '#c8443a',
      name: 'Dahlia tee · M',
      qty: 1, price: '$32.00', sub: '$32.00',
      kind: 'STANDARD',
      steps: [
        ['Pick',    'done',    '— shelf A-1'],
        ['Inspect', 'pending'],
        ['Pack',    'pending'],
      ],
      flag: 'LOW STOCK · 0 left after this',
    },
    {
      sku: 'CAP-MAR-OS', color: '#e7a23b',
      name: 'Marigold cap',
      qty: 1, price: '$16.20', sub: '$16.20',
      kind: 'STANDARD',
      steps: [
        ['Pick',    'done', '— shelf C-2'],
        ['Inspect', 'done'],
        ['Pack',    'done', '— bagged'],
      ],
    },
  ];

  // Aggregate counts
  const allSteps = items.flatMap(it => it.steps);
  const done = allSteps.filter(s => s[1] === 'done').length;
  const total = allSteps.length;

  return (
    <Chrome section="orders">
      <Crumbs items={[['CMS'], ['Orders', '#'], ['#4821']]} />

      <div className="editor-head">
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="eyebrow">Order · placed 09:14 EST · today · includes custom work</div>
          <h1>
            <span className="mono accent" style={{ fontSize: 30, fontWeight: 400, marginRight: 12 }}>#4821</span>
            Maya <span className="display-i">Rodriguez</span>
          </h1>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginTop: 8 }}>
            <span className="pill pill-solid-accent">IN PROGRESS</span>
            <span className="pill pill-solid-moss">PAID · $173.94</span>
            <span className="pill pill-out-accent">⚑ HAS CUSTOM WORK</span>
            <span className="fig" style={{ fontSize: 13 }}>3 items · 1 of 3 fully packed · ships Brooklyn NY 11211</span>
          </div>
        </div>
        <div className="actions">
          <button className="btn"><span className="kbd">P</span>Print all slips</button>
          <button className="btn"><span className="kbd">S</span>Split shipment</button>
          <button className="btn btn-accent" disabled style={{ opacity: .5 }}><span className="kbd">⏎</span>Ship · waiting</button>
        </div>
      </div>

      <EditorTabs
        items={[['Order', null, true], ['Fulfillment', `${done}/${total}`], ['Customer', null], ['Notes', 1], ['Timeline', 12]]}
        right={<><span>placed 09:14 · 4m ago</span><span>· custom work · 18 min in</span></>}
      />

      <div className="editor-body">
        {/* LEFT — items with per-line sub-fulfillment */}
        <div className="editor-col" style={{ overflow: 'auto', paddingRight: 4 }}>

          {/* Aggregate progress bar */}
          <div style={{
            border: '1px solid var(--ink)', borderRadius: 'var(--r-sm)',
            padding: '10px 14px', background: 'var(--paper-2)',
          }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
              <span className="eyebrow-ink">Fulfillment</span>
              <span className="display" style={{ fontSize: 22, lineHeight: 1 }}>
                {done}<span className="fig" style={{ fontSize: 14 }}> / {total} sub-tasks</span>
              </span>
              <span className="fig" style={{ fontSize: 12, marginLeft: 'auto' }}>ready to ship when all complete</span>
            </div>
            <div style={{ display: 'flex', gap: 3, marginTop: 8 }}>
              {items.map((it, i) => (
                <div key={i} style={{ flex: it.steps.length, display: 'flex', gap: 2 }}>
                  {it.steps.map((s, j) => (
                    <div key={j} style={{
                      flex: 1, height: 6,
                      background: s[1] === 'done' ? 'var(--ink)' : s[1] === 'active' ? 'var(--accent)' : 'var(--rule)',
                    }}></div>
                  ))}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 0, marginTop: 4 }}>
              {items.map((it, i) => (
                <div key={i} style={{ flex: it.steps.length, fontFamily: 'Geist Mono', fontSize: 9, letterSpacing: '.05em', color: 'var(--ink-soft)' }}>
                  item {i + 1} · {it.steps.filter(s => s[1] === 'done').length}/{it.steps.length}
                </div>
              ))}
            </div>
          </div>

          <div>
            <Sec n="§1" h="Line items" meta="3 items · check off as you go"
              right={<span><span className="mono" style={{ background: 'var(--ink)', color: 'var(--paper)', padding: '1px 5px', marginRight: 4 }}>+</span>add line</span>} />

            {items.map((it, idx) => {
              const itDone = it.steps.filter(s => s[1] === 'done').length === it.steps.length;
              const itActive = it.steps.some(s => s[1] === 'active');
              return (
                <div key={it.sku} style={{
                  border: '1px solid ' + (itActive ? 'var(--accent)' : itDone ? 'var(--rule)' : 'var(--rule)'),
                  borderLeft: '3px solid ' + (itDone ? 'var(--moss)' : itActive ? 'var(--accent)' : 'var(--ink)'),
                  background: itDone ? 'var(--paper-2)' : 'var(--paper)',
                  borderRadius: 'var(--r-sm)',
                  padding: '12px 14px',
                  marginBottom: 8,
                  opacity: itDone ? .82 : 1,
                }}>
                  {/* Header row */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <span style={{ display: 'inline-block', width: 36, height: 36, background: it.color, border: '1px solid var(--rule)', borderRadius: 'var(--r-sm)', flexShrink: 0, marginTop: 2 }}></span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                        <span className="mono" style={{ fontSize: 10, color: 'var(--ink-faint)', letterSpacing: '.1em' }}>{`#${idx + 1}`}</span>
                        <span className="name" style={{ fontSize: 14 }}>{it.name}</span>
                        <span className={'pill ' + (it.configurable ? 'pill-solid-accent' : 'pill-out')} style={{ fontSize: 9 }}>{it.kind}</span>
                        {itDone && <span className="pill pill-solid-moss" style={{ fontSize: 9 }}>✓ READY</span>}
                      </div>
                      <div className="mono" style={{ fontSize: 11, color: 'var(--ink-soft)', marginTop: 2 }}>{it.sku}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 18, alignItems: 'baseline', flexShrink: 0 }}>
                      <span className="fig" style={{ fontSize: 12 }}>qty {it.qty}</span>
                      <span className="mono" style={{ fontSize: 13 }}>{it.sub}</span>
                    </div>
                  </div>

                  {/* Flag */}
                  {it.flag && (
                    <div className="mono" style={{ fontSize: 10, color: 'var(--accent)', letterSpacing: '.05em', marginTop: 6, paddingLeft: 48 }}>⚑ {it.flag}</div>
                  )}

                  {/* Configuration */}
                  {it.configurable && (
                    <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--rule-soft)', paddingLeft: 48 }}>
                      <div className="eyebrow-ink" style={{ fontSize: 9, marginBottom: 4 }}>Customer configuration</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '2px 16px' }}>
                        {it.options.map(([k, v]) => (
                          <div key={k} style={{ display: 'flex', gap: 8, fontSize: 12, padding: '2px 0' }}>
                            <span className="mono" style={{ fontSize: 10, color: 'var(--ink-soft)', letterSpacing: '.08em', textTransform: 'uppercase', width: 80, flexShrink: 0 }}>{k}</span>
                            <span>{v}</span>
                          </div>
                        ))}
                      </div>

                      <div className="eyebrow-ink" style={{ fontSize: 9, marginTop: 8, marginBottom: 4 }}>Attachments · {it.attachments.length}</div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {it.attachments.map((a) => <Attach key={a.name} {...a} />)}
                      </div>

                      {it.note && (
                        <div style={{ marginTop: 8, padding: '6px 8px', background: 'var(--paper-2)', borderLeft: '2px solid var(--accent)', fontSize: 12, fontStyle: 'italic', fontFamily: 'Spectral, serif', color: 'var(--ink-soft)' }}>
                          {it.note}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Sub-fulfillment steps */}
                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--rule-soft)', paddingLeft: 48 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span className="eyebrow-ink" style={{ fontSize: 9 }}>Sub-fulfillment · check off as you complete</span>
                      <span className="mono" style={{ fontSize: 10, color: 'var(--ink-soft)' }}>
                        {it.steps.filter(s => s[1] === 'done').length} / {it.steps.length}
                      </span>
                    </div>
                    <SubSteps steps={it.steps} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Totals */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', marginTop: 4 }}>
            <div></div>
            <div>
              {[
                ['Subtotal', '$132.20'],
                ['Custom embroidery · APRN-CUST-M', '$24.00'],
                ['Shipping · USPS GA · 3d', '$6.00'],
                ['Tax · NY 8.875%', '$11.74'],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--rule-soft)', fontSize: 13 }}>
                  <span style={{ color: 'var(--ink-soft)' }}>{k}</span>
                  <span className="mono num">{v}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0 0', fontSize: 14, fontWeight: 500 }}>
                <span>Total</span>
                <span className="mono accent" style={{ fontSize: 18 }}>$173.94</span>
              </div>
              <div className="fig" style={{ fontSize: 12, textAlign: 'right' }}>captured Stripe · 09:14 EST</div>
            </div>
          </div>

        </div>

        {/* RIGHT — customer + addresses + ship */}
        <div className="editor-col" style={{ overflow: 'auto' }}>
          <div>
            <Sec h="Customer" right={<a href="#" style={{ color: 'var(--accent)' }}>open dossier →</a>} />
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
              <span className="avatar" style={{ width: 38, height: 38, background: '#c8443a', fontSize: 13 }}>MR</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>Maya Rodriguez</div>
                <div className="mono" style={{ fontSize: 11, color: 'var(--ink-soft)' }}>maya.r@hey.com</div>
              </div>
              <span className="pill pill-solid-moss" style={{ marginLeft: 'auto' }}>LOYAL</span>
            </div>
            <div className="field"><span className="lbl">since</span><span className="val">Mar 2024 · 14 mo</span></div>
            <div className="field"><span className="lbl">orders</span><span className="val">14 · this is #14</span></div>
            <div className="field"><span className="lbl">ltv</span><span className="val accent" style={{ fontWeight: 500 }}>$612</span></div>
            <div className="field"><span className="lbl">phone</span><span className="val mono">+1 718 555 0142</span></div>
          </div>

          <div>
            <Sec h="Ship to" right={<a href="#" style={{ color: 'var(--accent)', fontSize: 11 }}>edit</a>} />
            <div style={{ fontSize: 13, lineHeight: 1.5 }}>
              Maya Rodriguez<br/>
              Bedford St. Café · c/o Maya<br/>
              318 Bedford Ave, Apt 4B<br/>
              Brooklyn, NY 11211
            </div>
            <div className="fig" style={{ fontSize: 12, marginTop: 6 }}>verified · USPS deliverable · zone 2</div>
          </div>

          <div>
            <Sec h="Shipping method" />
            <div className="field"><span className="lbl">carrier</span><span className="val">USPS Ground Advantage</span></div>
            <div className="field"><span className="lbl">eta</span><span className="val">3 business days · Fri 19 May</span></div>
            <div className="field"><span className="lbl">label</span><span className="val fig">— not generated yet —</span></div>
            <div style={{ marginTop: 6 }}>
              <button className="btn btn-sm" disabled style={{ opacity: .5 }}>Generate label (ship when ready)</button>
            </div>
          </div>

          <div>
            <Sec h="Notes" right="+ note" />
            <div className="block" style={{ padding: '8px 10px' }}>
              <div className="b-head">
                <span className="b-kind">MARISOL · 09:15</span>
              </div>
              <div className="b-preview" style={{ fontSize: 12 }}>Embroidery is the bottleneck — Léa will run the machine after 11. Tee + cap can pack now and be set aside.</div>
            </div>
          </div>

          <div>
            <Sec h="Tags" right="+ tag" />
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <span className="pill pill-out">repeat customer</span>
              <span className="pill pill-out-accent">⚑ custom-work</span>
              <span className="pill pill-out">brooklyn</span>
            </div>
          </div>
        </div>
      </div>

      <SaveBar
        savedAt={`${done} of ${total} sub-tasks complete · auto-syncs to board`}
        hints={[['Space', 'check off step'], ['⌘⏎', 'mark item ready'], ['P', 'print'], ['S', 'split'], ['N', 'note']]}
      />
    </Chrome>
  );
}

Object.assign(window, { OrderEditor });
