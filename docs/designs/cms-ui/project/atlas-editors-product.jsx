// Atlas Editors — Product editor
// Dahlia tee · variants, inventory, pricing, channels

const { Chrome } = window;

function ProductEditor() {
  const { Crumbs, EditorTabs, Sec, SaveBar } = window;

  const variants = [
    { sel: false, sz: 'XS', color: '#c8443a', sku: 'SHIRT-DAH-XS', price: '$32.00', cost: '$11.40', stock: 8,  status: 'IN STOCK', cls: 'pill-solid-ink',    pace: 12 },
    { sel: false, sz: 'S',  color: '#c8443a', sku: 'SHIRT-DAH-S',  price: '$32.00', cost: '$11.40', stock: 14, status: 'IN STOCK', cls: 'pill-solid-ink',    pace: 22 },
    { sel: true,  sz: 'M',  color: '#c8443a', sku: 'SHIRT-DAH-M',  price: '$32.00', cost: '$11.40', stock: 0,  status: 'SOLD OUT', cls: 'pill-solid-accent', pace: 168 },
    { sel: false, sz: 'L',  color: '#c8443a', sku: 'SHIRT-DAH-L',  price: '$32.00', cost: '$11.40', stock: 6,  status: 'LOW',      cls: 'pill-solid-gold',   pace: 42 },
    { sel: false, sz: 'XL', color: '#c8443a', sku: 'SHIRT-DAH-XL', price: '$32.00', cost: '$11.40', stock: 12, status: 'IN STOCK', cls: 'pill-solid-ink',    pace: 28 },
  ];

  return (
    <Chrome section="products">
      <Crumbs items={[['CMS'], ['Catalog', '#'], ['Apparel', '#'], ['Tees', '#'], ['Dahlia tee']]} />

      <div className="editor-head">
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="eyebrow">Product · Apparel / Tees · 5 variants</div>
          <input className="title-input" defaultValue="Dahlia tee" />
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginTop: 6 }}>
            <span className="mono" style={{ fontSize: 12, color: 'var(--ink-soft)' }}>SHIRT-DAH-*</span>
            <span className="pill pill-solid-ink">PUBLISHED</span>
            <span className="pill pill-solid-accent">⚑ M SOLD OUT</span>
            <span className="fig" style={{ fontSize: 12 }}>168 sold in 30d · trending ↑</span>
          </div>
        </div>
        <div className="actions">
          <button className="btn"><span className="kbd">D</span>Duplicate</button>
          <button className="btn"><span className="kbd">⌘S</span>Save</button>
          <button className="btn btn-accent"><span className="kbd">R</span>Restock M</button>
        </div>
      </div>

      <EditorTabs
        items={[['Detail', null, true], ['Media', 6], ['Variants', 5], ['Inventory', null], ['Pricing', null], ['SEO', null], ['Channels', 3]]}
        right={<><span>last edited 6 May · Marisol</span></>}
      />

      <div className="editor-body">
        {/* LEFT — media + description + variants + inventory */}
        <div className="editor-col" style={{ overflow: 'auto', paddingRight: 4 }}>

          <div>
            <Sec n="§1" h="Media" meta="6 images · 1 video"
              right={<span><span className="mono" style={{ background: 'var(--ink)', color: 'var(--paper)', padding: '1px 5px', marginRight: 4 }}>+</span>upload</span>} />
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gridTemplateRows: '120px 120px', gap: 6 }}>
              <div className="ph-box" style={{ gridRow: 'span 2', position: 'relative' }}>
                hero · dahlia-tee-01.jpg
                <span className="pill pill-solid-ink" style={{ position: 'absolute', top: 8, left: 8 }}>COVER</span>
              </div>
              <div className="ph-box">flat · 02</div>
              <div className="ph-box">model · 03</div>
              <div className="ph-box">detail · 04</div>
              <div className="ph-box">flat · 05</div>
              <div className="ph-box">video · 30s</div>
              <div className="ph-box" style={{ borderStyle: 'dashed', color: 'var(--ink-faint)' }}>+ add</div>
            </div>
          </div>

          <div>
            <Sec n="§2" h="Description" meta="customer-facing copy" right="markdown" />
            <div className="input-row">
              <span className="lbl">short / list summary</span>
              <span className="val">A relaxed-fit cotton tee, hand-dyed with marigold petals in our Brooklyn studio. Each one is a little different.</span>
            </div>
            <div className="input-row">
              <span className="lbl">long / product page</span>
              <span className="val area" style={{ minHeight: 90, lineHeight: 1.45 }}>
                Cut from 240gsm midweight cotton jersey, ring-spun, OEKO-TEX certified. Pre-shrunk. Dyed in 12-gallon batches with marigold petals from our partner farm in Hudson Valley — expect subtle variation between pieces, especially between the first and last cut of a batch. Wash cold inside-out. Will fade beautifully over years if you let it.
              </span>
            </div>
          </div>

          <div>
            <Sec n="§3" h="Variants" meta="5 sizes · 1 colour" right="+ option (size / color / …)" />
            <table className="tbl">
              <thead>
                <tr>
                  <th style={{ width: 28 }}><input type="checkbox" /></th>
                  <th style={{ width: 38 }}>Sz</th>
                  <th style={{ width: 24 }}></th>
                  <th>SKU</th>
                  <th className="num" style={{ width: 60 }}>Price</th>
                  <th className="num" style={{ width: 60 }}>Cost</th>
                  <th className="num" style={{ width: 50 }}>Stock</th>
                  <th style={{ width: 90 }}>Status</th>
                  <th className="num" style={{ width: 50 }}>30d</th>
                </tr>
              </thead>
              <tbody>
                {variants.map((v) => (
                  <tr key={v.sku} className={v.sel ? 'sel' : ''} style={v.sel ? { background: 'var(--paper-2)' } : {}}>
                    <td><input type="checkbox" defaultChecked={v.sel} /></td>
                    <td className="name" style={{ fontSize: 13 }}>{v.sz}</td>
                    <td><span style={{ display: 'inline-block', width: 16, height: 16, background: v.color, border: '1px solid var(--rule)', borderRadius: 'var(--r-sm)' }}></span></td>
                    <td><span className="mono" style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{v.sku}</span></td>
                    <td className="num">{v.price}</td>
                    <td className="num fig" style={{ fontStyle: 'italic' }}>{v.cost}</td>
                    <td className="num" style={{ color: v.stock === 0 ? 'var(--accent)' : v.stock < 10 ? 'var(--gold)' : 'var(--ink)', fontWeight: v.stock === 0 ? 600 : 400 }}>{v.stock}</td>
                    <td><span className={'pill ' + v.cls}>{v.status}</span></td>
                    <td className="num">{v.pace}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
            <Sec n="§4" h="Inventory · M variant" meta="selected" right="last counted 14 May" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              <div className="brick">
                <div className="l">on hand</div>
                <div className="v accent" style={{ fontSize: 26 }}>0</div>
                <div className="d">sold out · 3 days</div>
              </div>
              <div className="brick">
                <div className="l">incoming</div>
                <div className="v">50</div>
                <div className="d">PO #2-204 · ETA 22 May</div>
              </div>
              <div className="brick">
                <div className="l">30d pace</div>
                <div className="v">168<span className="fig" style={{ fontSize: 13 }}> / mo</span></div>
                <div className="d">↑ 3.2× prior</div>
              </div>
              <div className="brick">
                <div className="l">cover</div>
                <div className="v" style={{ color: 'var(--accent)' }}>0d</div>
                <div className="d">re-order trigger ≤ 10</div>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT — pricing, status, taxonomy */}
        <div className="editor-col" style={{ overflow: 'auto' }}>
          <div>
            <Sec h="Pricing" meta="usd · all variants" />
            <div className="field"><span className="lbl">price</span><span className="val mono">$32.00</span></div>
            <div className="field"><span className="lbl">compare at</span><span className="val fig">— none —</span></div>
            <div className="field"><span className="lbl">cost</span><span className="val mono">$11.40</span></div>
            <div className="field"><span className="lbl">margin</span><span className="val accent" style={{ fontWeight: 500 }}>$20.60 · 64%</span></div>
            <div className="field"><span className="lbl">tax</span><span className="val">Apparel · US standard</span></div>
            <div className="field"><span className="lbl">discounts</span><span className="val">WELCOME10 · NEW20</span></div>
          </div>

          <div>
            <Sec h="Status" />
            <div className="field"><span className="lbl">state</span><span className="val"><span className="pill pill-solid-ink">PUBLISHED</span></span></div>
            <div className="field"><span className="lbl">visible</span><span className="val">Yes · since 12 Apr 2025</span></div>
            <div className="field"><span className="lbl">sold out</span><span className="val accent">show "notify me"</span></div>
          </div>

          <div>
            <Sec h="Taxonomy" />
            <div className="field"><span className="lbl">category</span><span className="val">Apparel › Tees</span></div>
            <div className="field"><span className="lbl">collections</span><span className="val">Spring '25 · Best-sellers</span></div>
            <div className="field"><span className="lbl">tags</span><span className="val">
              <span style={{ display: 'inline-flex', gap: 4, flexWrap: 'wrap' }}>
                <span className="pill pill-out">marigold</span>
                <span className="pill pill-out">cotton</span>
                <span className="pill pill-out">bestseller</span>
              </span>
            </span></div>
            <div className="field"><span className="lbl">vendor</span><span className="val">Studio Marigold</span></div>
          </div>

          <div>
            <Sec h="Channels" meta="3 of 5 on" right="manage" />
            {[
              ['Storefront',  true,  'marigold.shop · main'],
              ['Newsletter',  true,  'Klaviyo · auto-pull'],
              ['Instagram',   true,  'IG Shop · synced'],
              ['Etsy',        false, 'paused — out of stock'],
              ['Wholesale',   false, 'not yet'],
            ].map(([name, on, sub]) => (
              <div key={name} className="field" style={{ gridTemplateColumns: '14px 1fr auto' }}>
                <span style={{ width: 10, height: 10, background: on ? 'var(--moss)' : 'var(--rule)', borderRadius: '50%', display: 'inline-block', marginTop: 4 }}></span>
                <span className="val" style={{ fontSize: 13 }}>
                  {name}
                  <div className="fig" style={{ fontSize: 11 }}>{sub}</div>
                </span>
                <span className="mono" style={{ fontSize: 10, color: 'var(--ink-soft)' }}>{on ? 'ON' : 'OFF'}</span>
              </div>
            ))}
          </div>

          <div>
            <Sec h="SEO" right="preview" />
            <div className="input-row">
              <span className="lbl">title</span>
              <span className="val mono">Dahlia tee — hand-dyed cotton, made in Brooklyn</span>
            </div>
            <div className="input-row">
              <span className="lbl">slug</span>
              <span className="val mono">/shop/dahlia-tee</span>
            </div>
          </div>
        </div>
      </div>

      <SaveBar
        savedAt="autosaved · M variant flagged for restock"
        hints={[['⌘S', 'save'], ['R', 'restock'], ['D', 'duplicate'], ['H', 'hide'], ['X', 'archive']]}
      />
    </Chrome>
  );
}

Object.assign(window, { ProductEditor });
