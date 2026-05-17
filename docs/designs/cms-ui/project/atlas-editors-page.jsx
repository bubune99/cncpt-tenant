// Atlas Editors — Page editor (rev 2)
// Magazine-style preview · highlighted settings panel on the right.
// Page content is built in the dedicated page builder — this surface is
// for status / SEO / scheduling / metadata · plus an at-a-glance preview.

const { Chrome } = window;

function PageEditor() {
  const { Crumbs, EditorTabs, Sec, SaveBar } = window;

  return (
    <Chrome section="pages">
      <Crumbs items={[['CMS'], ['Pages', '#'], ['Storefront', '#'], ['Home /']]} />

      <div className="editor-head">
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="eyebrow">Page · Storefront · Landing</div>
          <h1>Home — <span className="display-i">Studio Marigold</span></h1>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginTop: 6 }}>
            <span className="mono" style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
              marigold.shop<span style={{ color: 'var(--ink)' }}>/</span>
            </span>
            <span className="pill pill-solid-ink">PUBLISHED</span>
            <span className="fig" style={{ fontSize: 12 }}>v23 · last edited 6 May by Marisol</span>
          </div>
        </div>
        <div className="actions">
          <button className="btn"><span className="kbd">B</span>Open builder</button>
          <button className="btn"><span className="kbd">⌘P</span>Preview</button>
          <button className="btn btn-accent"><span className="kbd">⌘⏎</span>Publish changes</button>
        </div>
      </div>

      <EditorTabs
        items={[['Overview', null, true], ['SEO', null], ['Schedule', null], ['Access', null], ['Versions', 23], ['Activity', null]]}
        right={<><span>content lives in the page builder</span><span>· this surface = settings + preview</span></>}
      />

      <div className="editor-body" style={{ gridTemplateColumns: '1fr 360px' }}>
        {/* LEFT — magazine-style preview */}
        <div className="editor-col" style={{ overflow: 'hidden' }}>
          <Sec
            h="Preview"
            meta="rendered · 6 May · v23 live"
            right={<>
              <span className="mono" style={{ background: 'var(--ink)', color: 'var(--paper)', padding: '1px 6px', marginRight: 6 }}>desktop</span>
              <span style={{ marginRight: 8 }}>tablet</span>
              <span>mobile</span>
            </>}
          />

          <div style={{
            flex: 1, minHeight: 0, overflow: 'auto',
            background: 'var(--paper-2)',
            border: '1px solid var(--rule)',
            borderRadius: 'var(--r-sm)',
            padding: '22px 28px 28px',
            position: 'relative',
          }}>
            {/* Faux browser bar */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              paddingBottom: 10, marginBottom: 16, borderBottom: '1px solid var(--rule-soft)',
            }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--rule)' }}></span>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--rule)' }}></span>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--rule)' }}></span>
              <span className="mono" style={{ fontSize: 11, color: 'var(--ink-soft)', marginLeft: 6 }}>
                marigold.shop / <span style={{ color: 'var(--ink-faint)' }}>↻</span>
              </span>
              <span className="mono" style={{ fontSize: 10, color: 'var(--ink-faint)', marginLeft: 'auto' }}>1440 × auto</span>
            </div>

            {/* Magazine masthead */}
            <div style={{ borderBottom: '1px solid var(--ink)', paddingBottom: 10, marginBottom: 14, display: 'flex', alignItems: 'baseline', gap: 16 }}>
              <div className="display" style={{ fontSize: 28, letterSpacing: '-0.02em', lineHeight: 1 }}>Studio Marigold</div>
              <div className="fig" style={{ fontSize: 12 }}>est. 2023 · Brooklyn</div>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 16, fontFamily: 'Geist Mono, monospace', fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--ink-soft)' }}>
                <span>Shop</span><span>Journal</span><span>About</span><span>Cart · 0</span>
              </div>
            </div>

            {/* Hero block */}
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: -20, top: 2, fontFamily: 'Geist Mono', fontSize: 9, color: 'var(--ink-faint)', letterSpacing: '.1em' }}>§1</span>
              <div className="display-i" style={{ fontSize: 13, color: 'var(--accent)' }}>Spring 2025</div>
              <div className="display" style={{ fontSize: 44, letterSpacing: '-0.03em', lineHeight: 1.02, margin: '4px 0 6px' }}>
                Small textiles,<br/><span className="display-i">big intentions.</span>
              </div>
              <div className="fig" style={{ fontSize: 14, maxWidth: 480, lineHeight: 1.4 }}>
                Hand-dyed apparel from a small studio in Brooklyn, made in batches of fifty or fewer.
              </div>
              <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                <span style={{ background: 'var(--ink)', color: 'var(--paper)', fontSize: 11, padding: '5px 12px', fontFamily: 'Geist Mono', letterSpacing: '.05em' }}>SHOP SPRING →</span>
                <span style={{ border: '1px solid var(--ink)', fontSize: 11, padding: '5px 12px', fontFamily: 'Geist Mono', letterSpacing: '.05em' }}>READ THE JOURNAL</span>
              </div>

              <div className="ph-box" style={{ height: 180, marginTop: 14, position: 'relative' }}>
                hero · marigold-field-02.jpg
                <span className="fig" style={{ position: 'absolute', bottom: 6, right: 10, fontSize: 11, color: 'var(--ink-soft)' }}>fig. 1 — the dye-pot in May</span>
              </div>
            </div>

            {/* Featured grid */}
            <div style={{ marginTop: 22, position: 'relative' }}>
              <span style={{ position: 'absolute', left: -20, top: 2, fontFamily: 'Geist Mono', fontSize: 9, color: 'var(--ink-faint)', letterSpacing: '.1em' }}>§2</span>
              <div style={{ display: 'flex', alignItems: 'baseline', borderBottom: '1px solid var(--ink)', paddingBottom: 4, marginBottom: 10 }}>
                <span className="display" style={{ fontSize: 18 }}>New this week</span>
                <span className="fig" style={{ fontSize: 12, marginLeft: 10 }}>· 6 new SKUs · auto-pulled</span>
                <span className="display-i accent" style={{ fontSize: 12, marginLeft: 'auto' }}>see the shop →</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {[
                  ['#c8443a', 'Dahlia tee',    '$32'],
                  ['#e7a23b', 'Marigold cap',  '$16'],
                  ['#3a4a8b', 'Indigo scarf',  '$48'],
                  ['#4f5e3a', 'Moss towel',    '$18'],
                ].map(([c, n, p]) => (
                  <div key={n}>
                    <div style={{ background: c, height: 70, borderRadius: 'var(--r-sm)', border: '1px solid var(--rule)' }}></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 11 }}>
                      <span>{n}</span><span className="mono">{p}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Editorial pull */}
            <div style={{ marginTop: 22, position: 'relative', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
              <span style={{ position: 'absolute', left: -20, top: 2, fontFamily: 'Geist Mono', fontSize: 9, color: 'var(--ink-faint)', letterSpacing: '.1em' }}>§3</span>
              <div>
                <div className="eyebrow" style={{ fontSize: 10 }}>From the journal</div>
                <div className="display-i" style={{ fontSize: 22, letterSpacing: '-0.01em', lineHeight: 1.2, marginTop: 4 }}>
                  "A year of marigold — what a single flower taught us about patience."
                </div>
                <div className="fig" style={{ fontSize: 12, marginTop: 6 }}>Marisol Cheng · 8 May · 12 min</div>
              </div>
              <div className="ph-box" style={{ height: 130 }}>journal · dye-pot-03.jpg</div>
            </div>

            <div className="fig" style={{ fontSize: 11, textAlign: 'center', marginTop: 26, paddingTop: 12, borderTop: '1px solid var(--rule-soft)' }}>
              · 3 more sections below — newsletter, about, footer — ·
            </div>
          </div>
        </div>

        {/* RIGHT — highlighted settings panel */}
        <div className="editor-col" style={{
          overflow: 'auto',
          background: 'var(--paper-3)',
          border: '1px solid var(--ink)',
          borderRadius: 'var(--r-sm)',
          padding: '16px 18px',
          boxShadow: 'inset 3px 0 0 var(--accent), 0 2px 0 rgba(0,0,0,.04)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
            <span className="eyebrow">Editing · settings</span>
            <span className="mono" style={{ fontSize: 9, color: 'var(--ink-soft)', letterSpacing: '.1em' }}>v23 → v24 draft</span>
          </div>
          <div className="display-i" style={{ fontSize: 13, color: 'var(--ink-soft)', marginBottom: 12, lineHeight: 1.35 }}>
            Content is edited in the <a href="#" style={{ color: 'var(--accent)' }}>page builder →</a>. This panel handles everything else.
          </div>

          <div>
            <Sec h="Page" />
            <div className="input-row">
              <span className="lbl">title</span>
              <span className="val">Home — Studio Marigold</span>
            </div>
            <div className="input-row">
              <span className="lbl">slug</span>
              <span className="val mono">/ (root)</span>
            </div>
            <div className="input-row">
              <span className="lbl">template</span>
              <span className="val">Landing · 1-col wide</span>
            </div>
            <div className="field"><span className="lbl">parent</span><span className="val fig">— root —</span></div>
          </div>

          <div style={{ marginTop: 14 }}>
            <Sec h="Status" meta="public · indexed" />
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <span className="pill pill-solid-ink">PUBLISHED</span>
              <span className="pill pill-out">indexed</span>
              <span className="pill pill-out">sitemap on</span>
            </div>
            <div className="field" style={{ marginTop: 6 }}><span className="lbl">visible</span><span className="val">Yes · since 12 Apr 2025</span></div>
            <div className="field"><span className="lbl">scheduled</span><span className="val fig">— none —</span></div>
            <div className="field"><span className="lbl">access</span><span className="val">Public</span></div>
            <div className="field"><span className="lbl">redirect</span><span className="val fig">— none —</span></div>
          </div>

          <div style={{ marginTop: 14 }}>
            <Sec h="Search & social" meta="SEO" />
            <div className="input-row">
              <span className="lbl">meta title</span>
              <span className="val mono">Studio Marigold — small textiles, big intentions</span>
            </div>
            <div className="input-row">
              <span className="lbl">meta description</span>
              <span className="val area" style={{ fontSize: 12 }}>Hand-dyed apparel and homewares from a small studio in Brooklyn. Shop the spring marigold collection.</span>
            </div>
            <div className="field" style={{ marginTop: 4 }}>
              <span className="lbl">og image</span>
              <span className="val mono">hero-marigold-2.jpg</span>
            </div>
            <div className="field"><span className="lbl">canonical</span><span className="val mono">marigold.shop/</span></div>
            <div className="field"><span className="lbl">score</span><span className="val accent" style={{ fontWeight: 500 }}>good · 8 / 10</span></div>
          </div>

          <div style={{ marginTop: 14 }}>
            <Sec h="At a glance" meta="last 30 days" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              <div className="brick" style={{ padding: '6px 8px' }}>
                <div className="l">visits</div>
                <div className="v" style={{ fontSize: 18 }}>12,402</div>
              </div>
              <div className="brick" style={{ padding: '6px 8px' }}>
                <div className="l">cvr</div>
                <div className="v" style={{ fontSize: 18 }}>1.84%</div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 14 }}>
            <Sec h="Activity" />
            <div className="tl" style={{ paddingLeft: 14 }}>
              <div className="tl-item now" style={{ padding: '2px 0 6px' }}>
                <div className="when">6 May · published v23</div>
                <div className="what fig" style={{ fontSize: 12 }}>Marisol — hero replaced</div>
              </div>
              <div className="tl-item" style={{ padding: '2px 0 6px' }}>
                <div className="when">2 May · v22</div>
                <div className="what fig" style={{ fontSize: 12 }}>Léa — newsletter block</div>
              </div>
              <div className="tl-item" style={{ padding: '2px 0 6px' }}>
                <div className="when">14 Apr · v21</div>
                <div className="what fig" style={{ fontSize: 12 }}>Marisol — first publish</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <SaveBar
        savedAt="v23 live · settings up to date"
        hints={[['⌘S', 'save settings'], ['B', 'open builder'], ['⌘P', 'preview'], ['⌘⏎', 'publish']]}
      />
    </Chrome>
  );
}

Object.assign(window, { PageEditor });
