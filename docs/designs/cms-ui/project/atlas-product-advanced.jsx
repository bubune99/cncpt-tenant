// Atlas Product Editor — advanced frames
// F4 type morph · F5 custom fields · F6 variants+fields · F7 bundle · F8 digital · F9 pricing
// Plus the App that renders everything.

const {
  Chrome, Crumbs, EditorTabs, Sec, SaveBar, CompactHead, FrameLabel,
  ProductMasthead, SIZES, COLORS, VARIANTS, STORY,
  DesignMemo, ProductSpreadsheet, ProductMatrix, ProductMedia,
  TWEAK_DEFAULTS, ACCENT_OPTIONS, FONT_OPTIONS,
} = window;

// ─────────────────────────────────────────────
// Second design memo — advanced systems
// ─────────────────────────────────────────────
function DesignMemo2() {
  return (
    <div style={{
      background: 'var(--paper)', border: '1px solid var(--ink)',
      borderRadius: 'var(--r)', padding: '28px 32px', margin: '40px auto 0',
      maxWidth: 1200, boxShadow: '0 12px 40px rgba(0,0,0,.12)'
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 32 }}>
        <div>
          <div className="eyebrow">Design memo · ii</div>
          <div className="display" style={{ fontSize: 26, lineHeight: 1.05, marginTop: 6 }}>
            Beyond <span className="display-i accent">variants.</span>
          </div>
          <div className="fig" style={{ fontSize: 12, marginTop: 8 }}>Marisol → product, 16 May</div>
        </div>

        <div style={{ borderLeft: '1px solid var(--rule)', paddingLeft: 28 }}>
          <p className="display-i" style={{ fontSize: 15, lineHeight: 1.5, color: 'var(--ink-soft)', margin: '0 0 14px' }}>
            The variant grid solves the table problem. The next layer up is the <i>shape</i> of the editor itself —
            digital downloads need a license-key pool, bundles compose other products, subscriptions have cadence,
            and every product type wants its own custom fields hanging off variants. Four principles below.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 32px', marginTop: 12 }}>
            <div style={{ display: 'flex', gap: 10 }}>
              <span className="mono" style={{ fontSize: 11, color: 'var(--accent)', minWidth: 22 }}>01</span>
              <div style={{ fontSize: 13.5, lineHeight: 1.5 }}>
                <b>Type reshapes the editor.</b> Tabs, fields, even the sidebar render off product type.
                You don't toggle a "this is a bundle" checkbox — you pick BUNDLE and the chrome morphs.
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <span className="mono" style={{ fontSize: 11, color: 'var(--accent)', minWidth: 22 }}>02</span>
              <div style={{ fontSize: 13.5, lineHeight: 1.5 }}>
                <b>Custom fields are global, attached per product.</b> Define "Material" once with options;
                attach it to jackets, sweaters, bags. Values live on variants — so each Marigold-M can be a different fabric weight.
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <span className="mono" style={{ fontSize: 11, color: 'var(--accent)', minWidth: 22 }}>03</span>
              <div style={{ fontSize: 13.5, lineHeight: 1.5 }}>
                <b>Bundles are containers, not products.</b> Inventory is constrained by the lowest-stock child.
                Price is sum-of-parts unless you set a fixed override. Editing the bundle is composing a shelf.
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <span className="mono" style={{ fontSize: 11, color: 'var(--accent)', minWidth: 22 }}>04</span>
              <div style={{ fontSize: 13.5, lineHeight: 1.5 }}>
                <b>Pricing is a stack, not a number.</b> Base, quantity tier, sale window, promo code, member tier —
                all coexist. The editor surfaces them as layers you can read at a glance, with calc'd final on the side.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// PRODUCT TYPES — schema-aligned
// ─────────────────────────────────────────────
const PRODUCT_TYPES = [
  {
    kind: 'SIMPLE', name: 'Simple',
    glyph: 's',
    desc: 'Single SKU. No variants, no options.',
    tabs: ['Detail', 'Media', 'Inventory', 'Pricing', 'Channels', 'SEO'],
    newTabs: [],
  },
  {
    kind: 'VARIABLE', name: 'Variable',
    glyph: 'v',
    desc: 'Multiple variants from options like size and color.',
    tabs: ['Detail', 'Media', 'Variants', 'Inventory', 'Pricing', 'Channels', 'SEO'],
    newTabs: ['Variants'],
  },
  {
    kind: 'DIGITAL', name: 'Digital',
    glyph: 'd',
    desc: 'Downloadable file or license-key product. No shipping.',
    tabs: ['Detail', 'Files', 'Licenses', 'Delivery', 'Pricing', 'Channels', 'SEO'],
    newTabs: ['Files', 'Licenses', 'Delivery'],
  },
  {
    kind: 'SERVICE', name: 'Service',
    glyph: 't',
    desc: 'Bookable appointment or consultation with capacity.',
    tabs: ['Detail', 'Media', 'Schedule', 'Capacity', 'Pricing', 'Channels', 'SEO'],
    newTabs: ['Schedule', 'Capacity'],
  },
  {
    kind: 'SUBSCRIPTION', name: 'Subscription',
    glyph: 'r',
    desc: 'Recurring billing with interval, trial, and lifecycle.',
    tabs: ['Detail', 'Media', 'Billing', 'Lifecycle', 'Pricing', 'Channels', 'SEO'],
    newTabs: ['Billing', 'Lifecycle'],
  },
  {
    kind: 'BUNDLE', name: 'Bundle',
    glyph: 'b',
    desc: 'Multiple products together. Inventory derived from contents.',
    tabs: ['Detail', 'Media', 'Contents', 'Pricing', 'Channels', 'SEO'],
    newTabs: ['Contents'],
  },
];

// ─────────────────────────────────────────────
// Frame 4 — TYPE MORPH (Detail tab)
// ─────────────────────────────────────────────
function ProductTypeMorph() {
  const active = 'VARIABLE';

  return (
    <Chrome section="products">
      <Crumbs items={[['CMS'], ['Catalog', '#'], ['Apparel', '#'], ['Jackets', '#'], ['Marigold quilted jacket']]} />
      <ProductMasthead />
      <EditorTabs
        items={[
          ['Detail', null, true],
          ['Media', 14, false],
          ['Variants', 20, false],
          ['Inventory', null, false],
          ['Pricing', null, false],
          ['Channels', 3, false],
          ['SEO', null, false],
        ]}
        right={<><span>last edited 14 May · Marisol</span></>}
      />

      <div style={{ paddingTop: 10, display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'auto' }}>
        <Sec n="§1" h="Product type" meta="the foundation — reshapes every other tab"
          right={<span><span style={{ color: 'var(--ink)' }}>currently: </span><span className="pill pill-solid-accent">VARIABLE</span></span>} />

        <div className="type-strip">
          {PRODUCT_TYPES.map(t => (
            <div key={t.kind} className={'type-card' + (t.kind === active ? ' on' : '')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="glyph">{t.glyph}</span>
                <div style={{ minWidth: 0 }}>
                  <div className="kind">{t.kind}</div>
                  <div className="name">{t.name}</div>
                </div>
              </div>
              <div className="desc">{t.desc}</div>
              <div className="tabs-mini">
                {t.tabs.map(tab => {
                  const isNew = t.newTabs.includes(tab);
                  return <span key={tab} className={isNew ? 'new' : ''}>{isNew ? '+ ' : '· '}{tab}</span>;
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="type-callout">
          <div>
            <div className="lbl-mono">Currently editing</div>
            <div className="v"><b>VARIABLE</b> — 5 sizes × 4 colors = 20 variants. The Variants tab holds the spreadsheet; Inventory is per-variant.</div>
          </div>
          <div>
            <div className="lbl-mono">Type-specific config</div>
            <div className="v" style={{ fontFamily: 'Geist, sans-serif', fontSize: 13 }}>
              <span className="pill pill-out" style={{ marginRight: 4 }}>Size</span>
              <span className="pill pill-out" style={{ marginRight: 4 }}>Color</span>
              <span className="pill pill-out-soft">+ add option</span>
              <div className="fig" style={{ fontSize: 11, marginTop: 4 }}>option definitions live here</div>
            </div>
          </div>
          <div>
            <div className="lbl-mono">Stripe sync</div>
            <div className="v" style={{ fontSize: 13 }}>
              20 prices in sync · last 14 May 09:12
              <div className="fig" style={{ fontSize: 11, marginTop: 4 }}>each variant = own Stripe price</div>
            </div>
          </div>
        </div>

        <div className="migration-note">
          <span className="head">If you switched to BUNDLE</span>
          The 20 variants would be archived (preserved for old orders), the <b>Variants</b> and <b>Inventory</b> tabs would close, and a new <b>Contents</b> tab would open where you compose what's in the box. Inventory becomes derived from the lowest-stock child. <span className="fig">— irreversible without manual cleanup</span>
        </div>

        <div style={{ marginTop: 18 }}>
          <Sec h="Detail" meta="the fields that always live here regardless of type" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 20px' }}>
            <div className="field"><span className="lbl">title</span><span className="val">Marigold quilted jacket</span></div>
            <div className="field"><span className="lbl">slug</span><span className="val mono">/shop/marigold-quilted-jacket</span></div>
            <div className="field"><span className="lbl">category</span><span className="val">Apparel › Jackets</span></div>
            <div className="field"><span className="lbl">vendor</span><span className="val">Studio Marigold</span></div>
            <div className="field"><span className="lbl">tags</span><span className="val">
              <span className="pill pill-out" style={{ marginRight: 3 }}>quilted</span>
              <span className="pill pill-out" style={{ marginRight: 3 }}>marigold</span>
              <span className="pill pill-out">winter</span>
            </span></div>
            <div className="field"><span className="lbl">status</span><span className="val"><span className="pill pill-solid-ink">PUBLISHED</span></span></div>
          </div>
        </div>
      </div>

      <SaveBar
        savedAt="autosaved · 20 variants ready"
        hints={[['⌘S', 'save'], ['T', 'change type'], ['D', 'duplicate'], ['H', 'hide']]}
      />
    </Chrome>
  );
}

// ─────────────────────────────────────────────
// Custom field library (schema-aligned)
// ─────────────────────────────────────────────
const FIELD_TYPES = [
  { kind: 'TEXT',       tg: 'txt',  short: 'Aa', name: 'Text' },
  { kind: 'NUMBER',     tg: 'num',  short: '#',  name: 'Number' },
  { kind: 'BOOLEAN',    tg: 'bool', short: '◯',  name: 'Toggle' },
  { kind: 'SELECT',     tg: 'sel',  short: '▾',  name: 'Select' },
  { kind: 'MULTISELECT',tg: 'multi',short: '☰',  name: 'Multi' },
  { kind: 'COLOR',      tg: 'col',  short: '◐',  name: 'Color' },
  { kind: 'IMAGE',      tg: 'img',  short: '▣',  name: 'Image' },
  { kind: 'DATE',       tg: 'date', short: '◫',  name: 'Date' },
  { kind: 'URL',        tg: 'url',  short: '↗',  name: 'URL' },
  { kind: 'TEXTAREA',   tg: 'area', short: '¶',  name: 'Long' },
];

// Saved field instances (the library — global, reusable)
const SAVED_FIELDS = [
  { slug: 'material',          name: 'Material',          kind: 'SELECT',      tg: 'sel',   cfg: '3 options · Quilted cotton, Heavy linen, Wool blend', used: 14, attached: true },
  { slug: 'fabric_weight_gsm', name: 'Fabric weight',     kind: 'NUMBER',      tg: 'num',   cfg: 'gsm · range 80–600 · default 240', used: 22, attached: true },
  { slug: 'care_icons',        name: 'Care icons',        kind: 'MULTISELECT', tg: 'multi', cfg: '6 options · wash cold, line dry, no bleach…', used: 38, attached: true },
  { slug: 'hand_dyed',         name: 'Hand-dyed',         kind: 'BOOLEAN',     tg: 'bool',  cfg: 'default off · enables batch note', used: 9,  attached: true },
  { slug: 'origin',            name: 'Country of origin', kind: 'SELECT',      tg: 'sel',   cfg: '3 options · USA, Portugal, India', used: 41, attached: true },
  { slug: 'studio_swatch',     name: 'Studio swatch',     kind: 'IMAGE',       tg: 'img',   cfg: 'square · 600px min', used: 4, attached: false },
  { slug: 'release_date',      name: 'Release date',      kind: 'DATE',        tg: 'date',  cfg: 'iso · default null', used: 11, attached: false },
  { slug: 'care_pdf',          name: 'Care label PDF',    kind: 'URL',         tg: 'url',   cfg: 'pdf only · default empty', used: 6, attached: false },
];

// ─────────────────────────────────────────────
// Frame 5 — CUSTOM FIELDS · library + attached + new
// ─────────────────────────────────────────────
function ProductCustomFields() {
  const attached = SAVED_FIELDS.filter(f => f.attached);
  const unattached = SAVED_FIELDS.filter(f => !f.attached);

  return (
    <Chrome section="products">
      <Crumbs items={[['CMS'], ['Catalog', '#'], ['Apparel', '#'], ['Jackets', '#'], ['Marigold quilted jacket']]} />
      <ProductMasthead />
      <EditorTabs
        items={[
          ['Detail', null, false],
          ['Media', 14, false],
          ['Variants', 20, false],
          ['Fields', 5, true],
          ['Inventory', null, false],
          ['Pricing', null, false],
          ['Channels', 3, false],
          ['SEO', null, false],
        ]}
        right={<><span>last edited 14 May · Marisol</span></>}
      />

      <div className="ss-toolbar" style={{ paddingTop: 12 }}>
        <div className="group">
          <span className="lbl-mono">Library scope</span>
          <span className="chip on">Global</span>
          <span className="chip dash">This product only</span>
        </div>
        <div className="group" style={{ marginLeft: 'auto' }}>
          <span className="lbl-mono">Preview</span>
          <span className="chip">↗ open in Variants grid</span>
        </div>
      </div>

      <div className="cf-cols">
        {/* LEFT — field type palette + saved field library */}
        <div className="cf-col">
          <Sec h="Field types" meta="drag to attach · or click +" />
          <div className="cf-palette">
            {FIELD_TYPES.map(ft => (
              <div key={ft.kind} className="cf-type" title={ft.kind}>
                <span className={'tg ' + ft.tg}>{ft.short}</span>
                <span>{ft.name}</span>
              </div>
            ))}
          </div>

          <div className="cf-saved">
            <div className="lbl-mono" style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: 'var(--ink-soft)', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 4, padding: '0 4px' }}>
              Saved fields <span style={{ color: 'var(--ink-faint)' }}>· 8</span>
            </div>
            <div className="scroll" style={{ maxHeight: 360 }}>
              {SAVED_FIELDS.map(f => (
                <div key={f.slug} className={'cf-saved-row' + (f.attached ? ' placed' : '')}>
                  <span className="grip">⋮⋮</span>
                  <span className={'tg ' + f.tg}>{FIELD_TYPES.find(ft => ft.kind === f.kind).short}</span>
                  <span className="name">{f.name}</span>
                  <span className="used">{f.used}p</span>
                </div>
              ))}
            </div>
            <button className="btn btn-ghost btn-sm" style={{ marginTop: 6, width: '100%', justifyContent: 'center' }}>+ new saved field</button>
          </div>
        </div>

        {/* MIDDLE — attached to this product (sortable, columns toggle) */}
        <div className="cf-col middle">
          <Sec h="Attached to this product" meta={attached.length + ' fields · column order = grid order'}
            right={<span><span className="mono" style={{ fontSize: 10, color: 'var(--ink-soft)' }}>drag rows to reorder</span></span>} />
          <div className="cf-attached">
            {/* Header row */}
            <div className="cf-row" style={{ background: 'var(--paper-3)', borderBottom: '1px solid var(--ink)', padding: '6px 12px', fontFamily: 'Geist Mono, monospace', fontSize: 9.5, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ink-soft)' }}>
              <span></span>
              <span>type</span>
              <span>field</span>
              <span>config</span>
              <span style={{ textAlign: 'left' }}>required</span>
              <span style={{ textAlign: 'left' }}>show in grid</span>
              <span></span>
            </div>
            {attached.map((f, i) => (
              <div key={f.slug} className="cf-row">
                <span className="grip">⋮⋮</span>
                <span className={'tg ' + f.tg}>{FIELD_TYPES.find(ft => ft.kind === f.kind).short}</span>
                <div className="name-block">
                  <div className="name">{f.name}</div>
                  <div className="slug">{f.slug}</div>
                </div>
                <div className="cfg">{f.cfg}</div>
                <span className={'cf-toggle' + (i === 0 || i === 4 ? ' on' : '')}>
                  <span className="pip"></span>{i === 0 || i === 4 ? 'req' : 'opt'}
                </span>
                <span className="cf-toggle on">
                  <span className="pip"></span>shown
                </span>
                <span style={{ color: 'var(--ink-faint)', cursor: 'pointer', textAlign: 'center' }}>×</span>
              </div>
            ))}
          </div>

          <div className="cf-drop-hint">
            ⇩ drop a field from the library — or use the type palette above
          </div>

          <div style={{ marginTop: 8, padding: '8px 12px', background: 'var(--paper-2)', border: '1px solid var(--rule)', borderRadius: 'var(--r-sm)', fontSize: 11.5, color: 'var(--ink-soft)', display: 'flex', justifyContent: 'space-between' }}>
            <span><span className="mono" style={{ fontSize: 10 }}>VALUES PER VARIANT</span> — each of the 20 variants gets its own value for each field. <span style={{ fontStyle: 'italic', fontFamily: 'Spectral, serif' }}>So Marigold-M can be 320 gsm and Rust-XL can be 280 gsm.</span></span>
          </div>
        </div>

        {/* RIGHT — new field editor (in progress) */}
        <div className="cf-col">
          <Sec h="New field" meta="in progress — unsaved" />
          <div className="cf-new">
            <div className="h"><span className="accent-bar"></span>Yarn weight</div>

            <div className="input-row">
              <span className="lbl">Type</span>
              <span className="val" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="tg sel">▾</span> Select
              </span>
            </div>
            <div className="input-row">
              <span className="lbl">Slug</span>
              <span className="val mono">yarn_weight</span>
            </div>
            <div className="input-row">
              <span className="lbl">Description</span>
              <span className="val" style={{ fontFamily: 'Spectral, serif', fontStyle: 'italic', fontSize: 12.5 }}>For knitwear & sweaters. Drives recommended care.</span>
            </div>

            <div className="lbl-mono" style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ink-soft)', margin: '12px 0 4px' }}>
              Options <span style={{ color: 'var(--ink-faint)' }}>· 5</span>
            </div>
            <div className="opt-row">
              <span className="grip">⋮⋮</span><span className="sw-mini" style={{ background: '#efe7d8' }}></span>
              <input defaultValue="Lace" /><input className="slug" defaultValue="lace" /><span className="x">×</span>
            </div>
            <div className="opt-row">
              <span className="grip">⋮⋮</span><span className="sw-mini" style={{ background: '#d4a017' }}></span>
              <input defaultValue="Fingering" /><input className="slug" defaultValue="fingering" /><span className="x">×</span>
            </div>
            <div className="opt-row">
              <span className="grip">⋮⋮</span><span className="sw-mini" style={{ background: '#b58730' }}></span>
              <input defaultValue="DK" /><input className="slug" defaultValue="dk" /><span className="x">×</span>
            </div>
            <div className="opt-row">
              <span className="grip">⋮⋮</span><span className="sw-mini" style={{ background: '#8b2c1f' }}></span>
              <input defaultValue="Worsted" /><input className="slug" defaultValue="worsted" /><span className="x">×</span>
            </div>
            <div className="opt-row">
              <span className="grip">⋮⋮</span><span className="sw-mini" style={{ background: '#4f5e3a' }}></span>
              <input defaultValue="Bulky" /><input className="slug" defaultValue="bulky" /><span className="x">×</span>
            </div>
            <div style={{ marginTop: 4, fontSize: 11, color: 'var(--accent)', cursor: 'pointer', paddingLeft: 20 }}>+ add option</div>

            <div className="input-row" style={{ marginTop: 12 }}>
              <span className="lbl">Default</span>
              <span className="val mono">DK</span>
            </div>

            <div style={{ display: 'flex', gap: 6, marginTop: 14 }}>
              <button className="btn btn-accent btn-sm" style={{ flex: 1, justifyContent: 'center' }}>Save & attach</button>
              <button className="btn btn-ghost btn-sm">Cancel</button>
            </div>
          </div>
        </div>
      </div>

      <SaveBar
        savedAt="5 fields attached · 1 unsaved new field"
        hints={[['⌘S', 'save field'], ['N', 'new'], ['↑↓', 'reorder'], ['del', 'detach']]}
      />
    </Chrome>
  );
}

// ─────────────────────────────────────────────
// Custom field VALUES per variant — story
// ─────────────────────────────────────────────
const VARIANT_FIELD_VALUES = {
  // Map by variant.sku → { slug: value }
  // Bone: Heavy linen, 280 gsm, USA, no hand-dye
  // Marigold: Quilted cotton, 320 gsm, USA, hand-dyed
  // Moss: Wool blend, 380 gsm, Portugal, no hand-dye
  // Rust: Quilted cotton, 320 gsm, Portugal, hand-dyed
};
// Default-fill by color (saves typing 20 entries)
function valuesFor(v) {
  const byColor = {
    Bone:     { material: 'Heavy linen',    weight: 280, care: ['cold', 'flat'],         hand: false, origin: 'USA' },
    Marigold: { material: 'Quilted cotton', weight: 320, care: ['cold', 'line', 'noBleach'], hand: true, origin: 'USA' },
    Moss:     { material: 'Wool blend',     weight: 380, care: ['cold', 'flat', 'noBleach'], hand: false, origin: 'Portugal' },
    Rust:     { material: 'Quilted cotton', weight: 320, care: ['cold', 'line'],           hand: true,  origin: 'Portugal' },
  };
  return byColor[v.color];
}

// Care icon shorthand mapping
const CARE_ICONS = {
  cold: 'wash cold',
  line: 'line dry',
  flat: 'dry flat',
  noBleach: 'no bleach',
  warm: 'iron warm',
  no_iron: 'no iron',
};

// ─────────────────────────────────────────────
// Frame 6 — VARIANTS GRID + CUSTOM FIELDS
// ─────────────────────────────────────────────
function ProductVariantsWithFields() {
  // Active cell: Marigold-M material — dropdown open
  const activeSku = 'JKT-MQ-M-MAR';

  return (
    <Chrome section="products">
      <Crumbs items={[['CMS'], ['Catalog', '#'], ['Apparel', '#'], ['Jackets', '#'], ['Marigold quilted jacket']]} />
      <ProductMasthead />
      <EditorTabs
        items={[
          ['Detail', null, false],
          ['Media', 14, false],
          ['Variants', 20, true],
          ['Fields', 5, false],
          ['Inventory', null, false],
          ['Pricing', null, false],
          ['Channels', 3, false],
          ['SEO', null, false],
        ]}
        right={<><span>last edited 14 May · Marisol</span></>}
      />

      <div className="ss-toolbar">
        <div className="group">
          <span className="lbl-mono">Filter</span>
          <span className="chip dash">+ filter</span>
        </div>
        <div className="group">
          <span className="lbl-mono">Sort</span>
          <span className="chip">color → size</span>
        </div>
        <div className="group">
          <span className="lbl-mono">Columns</span>
          <span className="chip">11 visible</span>
          <span className="chip">stock <span className="cf-col-marker">core</span></span>
          <span className="chip on">material <span className="cf-col-marker" style={{ color: 'var(--paper)' }}>FIELD</span></span>
        </div>
        <div className="group" style={{ marginLeft: 'auto' }}>
          <span className="lbl-mono">View</span>
          <div className="view-switch">
            <button className="on">List</button>
            <button>Matrix</button>
            <button>Cards</button>
          </div>
        </div>
      </div>

      <div className="ss-wrap">
        <table className="ss">
          <colgroup>
            <col style={{ width: 28 }} />
            <col style={{ width: 42 }} />
            <col style={{ width: 102 }} />
            <col style={{ width: 112 }} />
            <col style={{ width: 66 }} />
            <col style={{ width: 50 }} />
            <col style={{ width: 124 }} />
            <col style={{ width: 60 }} />
            <col style={{ width: 130 }} />
            <col style={{ width: 60 }} />
            <col style={{ width: 90 }} />
          </colgroup>
          <thead>
            <tr>
              <th className="ck"><input type="checkbox" readOnly /></th>
              <th>Sz</th>
              <th>Color</th>
              <th>SKU</th>
              <th className="num">Price</th>
              <th className="num">Stock</th>
              <th>Material <span className="cf-col-marker">FIELD</span></th>
              <th className="num">Wt gsm <span className="cf-col-marker">FIELD</span></th>
              <th>Care icons <span className="cf-col-marker">FIELD</span></th>
              <th>Dyed <span className="cf-col-marker">FIELD</span></th>
              <th>Origin <span className="cf-col-marker">FIELD</span></th>
            </tr>
          </thead>
          <tbody>
            {VARIANTS.map((v, i) => {
              const isActive = v.sku === activeSku;
              const vals = valuesFor(v);
              return (
                <tr key={v.sku}>
                  <td className="ck"><input type="checkbox" readOnly /></td>
                  <td style={{ fontWeight: 500 }}>{v.sz}</td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 12, height: 12, background: v.hex, border: '1px solid var(--rule)', borderRadius: 2 }}></span>
                      {v.color}
                    </span>
                  </td>
                  <td className="mono" style={{ color: 'var(--ink-soft)', fontSize: 11 }}>{v.sku}</td>
                  <td className="num">${v.price}</td>
                  <td className="num" style={{ color: v.stock === 0 ? 'var(--accent)' : v.stock < 10 ? 'var(--gold)' : 'var(--ink)', fontWeight: v.stock === 0 ? 600 : 400 }}>{v.stock}</td>
                  <td className={isActive ? 'active-cell' : ''}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      {vals.material}
                      <span style={{ color: 'var(--ink-faint)', fontSize: 10 }}>▾</span>
                    </span>
                    {isActive && (
                      <div className="ss-dd" style={{ top: '100%', left: 0, marginTop: 2 }}>
                        <div className="opt on">Quilted cotton <span className="check">✓</span></div>
                        <div className="opt">Heavy linen</div>
                        <div className="opt">Wool blend</div>
                        <div style={{ borderTop: '1px solid var(--rule)', marginTop: 4, paddingTop: 4 }}>
                          <div className="opt" style={{ color: 'var(--accent)', fontSize: 11 }}>+ new option</div>
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="num">{vals.weight}</td>
                  <td>
                    {vals.care.slice(0, 3).map(c => (
                      <span key={c} className="cell-chip">{c === 'cold' ? '❄' : c === 'line' ? '▤' : c === 'flat' ? '▬' : c === 'noBleach' ? '⊘' : '◯'} {CARE_ICONS[c].split(' ')[0]}</span>
                    ))}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span style={{
                      display: 'inline-block', width: 14, height: 14, borderRadius: 2,
                      background: vals.hand ? 'var(--accent)' : 'var(--paper)',
                      border: '1px solid ' + (vals.hand ? 'var(--accent)' : 'var(--rule)'),
                      color: 'var(--paper)', fontFamily: 'Geist Mono, monospace', fontSize: 10,
                      lineHeight: '13px', textAlign: 'center'
                    }}>{vals.hand ? '✓' : ''}</span>
                  </td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11.5 }}>
                      <span style={{ fontSize: 11 }}>{vals.origin === 'USA' ? '🇺🇸' : vals.origin === 'Portugal' ? '🇵🇹' : '🇮🇳'}</span>
                      {vals.origin}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <SaveBar
        savedAt="cell selected · Marigold-M material → opening dropdown"
        hints={[['⌘S', 'save'], ['↵', 'edit'], ['⌘⇧F', 'find'], ['⌘D', 'fill down'], ['Esc', 'close']]}
      />
    </Chrome>
  );
}

// ─────────────────────────────────────────────
// Frame 7 — BUNDLE composer
// ─────────────────────────────────────────────
function ProductBundle() {
  const items = [
    { sku: 'JKT-MQ-M-MAR', name: 'Marigold quilted jacket', meta: 'M · Marigold', type: 'VARIABLE', price: 158, qty: 1, stock: 0, hex: '#d4a017' },
    { sku: 'SHIRT-DAH-M',  name: 'Dahlia tee',              meta: 'M · Marigold', type: 'VARIABLE', price: 32,  qty: 1, stock: 0, hex: '#d4a017' },
    { sku: 'KIT-DYE-MAR',  name: 'Marigold dye kit',        meta: 'Single batch', type: 'SIMPLE',   price: 48,  qty: 1, stock: 24, hex: '#b58730' },
    { sku: 'PDF-DYE-GUIDE',name: 'Marigold dye field guide',meta: 'PDF · v2.1.4', type: 'DIGITAL',  price: 24,  qty: 1, stock: Infinity, hex: '#4f5e3a' },
  ];

  const sumRetail = items.reduce((a, b) => a + b.price * b.qty, 0);
  const bundlePrice = 218;
  const savings = sumRetail - bundlePrice;
  const savingsPct = Math.round((savings / sumRetail) * 100);

  return (
    <Chrome section="products">
      <Crumbs items={[['CMS'], ['Catalog', '#'], ['Bundles', '#'], ['Studio essentials box']]} />

      <CompactHead
        kicker="Bundle · 4 items · holiday curation"
        title="Studio essentials box"
        sku="BOX-STUDIO-01"
        pills={<>
          <span className="pill pill-solid-ink">PUBLISHED</span>
          <span className="pill pill-solid-accent">⚑ STOCK = 0</span>
          <span className="pill pill-out">BUNDLE</span>
        </>}
        stats="42 sold in 30d · limited by jacket M-Marigold"
        actions={<>
          <button className="btn"><span className="kbd">D</span>Duplicate</button>
          <button className="btn"><span className="kbd">⌘S</span>Save</button>
          <button className="btn btn-accent"><span className="kbd">R</span>Restock jacket</button>
        </>}
      />

      <EditorTabs
        items={[
          ['Detail', null, false],
          ['Media', 4, false],
          ['Contents', 4, true],
          ['Pricing', null, false],
          ['Channels', 2, false],
          ['SEO', null, false],
        ]}
        right={<><span>last edited 13 May · Marisol</span></>}
      />

      <div className="bundle-wrap" style={{ paddingTop: 12 }}>
        {/* LEFT — items */}
        <div className="bundle-col">
          <Sec h="Contents" meta="drag to reorder · click thumb to swap variant"
            right={<span><span className="mono" style={{ fontSize: 10 }}>4 items · 4 SKUs</span></span>} />
          <div className="bundle-list">
            {/* Header */}
            <div className="bundle-row" style={{ background: 'var(--paper-3)', borderBottom: '1px solid var(--ink)', padding: '6px 14px', fontFamily: 'Geist Mono, monospace', fontSize: 9.5, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ink-soft)' }}>
              <span></span><span></span><span>Product</span>
              <span style={{ textAlign: 'center' }}>Quantity</span>
              <span className="num">Retail</span>
              <span className="num">Subtotal</span>
              <span></span>
            </div>
            {items.map((it, i) => (
              <div key={it.sku} className="bundle-row">
                <span className="grip">⋮⋮</span>
                <div className="thumb" style={{ background: it.hex + '22 repeating-linear-gradient(45deg, rgba(26,20,16,.04) 0 6px, transparent 6px 12px)' }}>
                  <span style={{ background: it.hex, width: 6, height: 6, borderRadius: 50, display: 'inline-block' }}></span>
                </div>
                <div>
                  <div className="name">{it.name}</div>
                  <div className="meta">
                    <span className="type-pill">{it.type}</span>
                    {it.meta} · <span style={{ color: it.stock === 0 ? 'var(--accent)' : it.stock === Infinity ? 'var(--moss)' : 'var(--ink-soft)' }}>
                      stock {it.stock === Infinity ? '∞' : it.stock}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <span className="qty-stepper">
                    <button>−</button>
                    <input defaultValue={it.qty} readOnly />
                    <button>+</button>
                  </span>
                </div>
                <span className="num">${it.price}.00</span>
                <span className="num" style={{ fontWeight: 500 }}>${(it.price * it.qty)}.00</span>
                <span style={{ color: 'var(--ink-faint)', cursor: 'pointer', textAlign: 'center' }}>×</span>
              </div>
            ))}
            <div className="bundle-drop">
              ⇩ drop a product here — or <span style={{ color: 'var(--accent)', fontStyle: 'normal', fontWeight: 500 }}>search the catalog ⌘K</span>
            </div>
          </div>

          <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div style={{ background: 'var(--paper-2)', border: '1px solid var(--rule)', borderRadius: 'var(--r-sm)', padding: 12 }}>
              <div className="lbl-mono" style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: 6 }}>Customer choices</div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, padding: '3px 0' }}>
                <input type="checkbox" defaultChecked readOnly /> Let customer pick variants for VARIABLE items
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, padding: '3px 0', color: 'var(--ink-soft)' }}>
                <input type="checkbox" readOnly /> Allow substitutions if out of stock
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, padding: '3px 0', color: 'var(--ink-soft)' }}>
                <input type="checkbox" readOnly /> Include gift wrap option
              </label>
            </div>
            <div style={{ background: 'var(--paper-2)', border: '1px solid var(--rule)', borderRadius: 'var(--r-sm)', padding: 12 }}>
              <div className="lbl-mono" style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: 6 }}>Inventory rules</div>
              <div style={{ fontSize: 12.5, lineHeight: 1.5, fontFamily: 'Spectral, serif', fontStyle: 'italic', color: 'var(--ink-soft)' }}>
                Bundle stock = min(child stock).
                <div style={{ marginTop: 4, fontStyle: 'normal', fontFamily: 'Geist Mono, monospace', fontSize: 11, color: 'var(--accent)' }}>
                  limit: jacket M-Marigold · 0 on hand
                </div>
                <div style={{ marginTop: 6, fontFamily: 'Geist, sans-serif', fontStyle: 'normal', color: 'var(--ink-soft)', fontSize: 11.5 }}>
                  Selling the bundle <b>reserves</b> 1 of each child.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT — pricing summary */}
        <div className="bundle-col">
          <Sec h="Pricing" meta="bundle math" />
          <div className="summary-card">
            <div className="lbl-mono" style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: 6 }}>
              Sum of children
            </div>
            {items.map(it => (
              <div key={it.sku} className="row" style={{ fontSize: 12 }}>
                <span className="fig" style={{ fontStyle: 'italic', fontSize: 11.5 }}>{it.name}</span>
                <span className="v">${it.price * it.qty}.00</span>
              </div>
            ))}
            <div className="row" style={{ borderTop: '1px solid var(--rule-soft)', marginTop: 4, paddingTop: 6, fontWeight: 500 }}>
              <span>Retail total</span><span className="v">${sumRetail}.00</span>
            </div>

            <div style={{ marginTop: 12 }}>
              <div className="lbl-mono" style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ink-soft)' }}>Price mode</div>
              <div className="mode-toggle">
                <button className="on">FIXED</button>
                <button>CALCULATED</button>
              </div>
            </div>

            <div className="row big">
              <span>Bundle price</span>
              <span className="v accent">${bundlePrice}.00</span>
            </div>

            <div className="row savings">
              <span>Customer saves</span>
              <span className="v">${savings}.00 · {savingsPct}%</span>
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <Sec h="Status" />
            <div className="field"><span className="lbl">state</span><span className="val"><span className="pill pill-solid-ink">PUBLISHED</span></span></div>
            <div className="field"><span className="lbl">visible</span><span className="val accent">temporarily unavailable</span></div>
            <div className="field"><span className="lbl">backorder</span><span className="val">show "notify me"</span></div>
            <div className="field"><span className="lbl">stripe</span><span className="val mono">prod_RZab… · synced</span></div>
          </div>
        </div>
      </div>

      <SaveBar
        savedAt="autosaved · bundle limited by jacket M-Marigold"
        hints={[['⌘S', 'save'], ['⌘K', 'add item'], ['↑↓', 'reorder'], ['del', 'remove']]}
      />
    </Chrome>
  );
}

// ─────────────────────────────────────────────
// Frame 8 — DIGITAL product editor (Files & Licenses)
// ─────────────────────────────────────────────
function ProductDigital() {
  const keys = [
    { key: 'MAR-9F2K-7Q4N-WD3X', status: 'ac', email: 'sara.l@studio.co',     act: 2, when: '14 May 12:08' },
    { key: 'MAR-8E1L-6P3M-XC2W', status: 'ac', email: 'marcus@bywire.studio', act: 1, when: '14 May 11:21' },
    { key: 'MAR-7D0J-5N2L-VB1V', status: 'as', email: 'order #4821 · pending', act: 0, when: '14 May 09:14' },
    { key: 'MAR-6C9H-4M1K-UA0U', status: 'as', email: 'order #4818',           act: 0, when: '13 May 21:42' },
    { key: 'MAR-5B8G-3L0J-TZ9T', status: 'rv', email: 'refunded · #4801',      act: 1, when: '11 May 16:00' },
    { key: 'MAR-4A7F-2K9I-SY8S', status: 'av', email: '—',                     act: 0, when: '—' },
    { key: 'MAR-3Z6E-1J8H-RX7R', status: 'av', email: '—',                     act: 0, when: '—' },
    { key: 'MAR-2Y5D-0I7G-QW6Q', status: 'av', email: '—',                     act: 0, when: '—' },
  ];

  return (
    <Chrome section="products">
      <Crumbs items={[['CMS'], ['Catalog', '#'], ['Digital', '#'], ['Marigold dye field guide']]} />

      <CompactHead
        kicker="Digital · PDF · 84pp"
        title="Marigold dye field guide"
        sku="PDF-DYE-GUIDE"
        pills={<>
          <span className="pill pill-solid-ink">PUBLISHED</span>
          <span className="pill pill-out">DIGITAL</span>
          <span className="pill pill-solid-moss">v2.1.4</span>
        </>}
        stats="218 sold · 12 license keys assigned in 24h"
        actions={<>
          <button className="btn"><span className="kbd">U</span>Upload new version</button>
          <button className="btn"><span className="kbd">⌘S</span>Save</button>
          <button className="btn btn-accent"><span className="kbd">G</span>Generate 100 keys</button>
        </>}
      />

      <EditorTabs
        items={[
          ['Detail', null, false],
          ['Files', 1, true],
          ['Licenses', 200, true],
          ['Delivery', null, false],
          ['Pricing', null, false],
          ['Channels', 2, false],
          ['SEO', null, false],
        ]}
        right={<><span>last edited 14 May · Marisol</span></>}
      />

      <div className="digital-wrap" style={{ paddingTop: 12 }}>
        {/* LEFT — file card, versions, license keys */}
        <div className="digital-col left">
          <Sec h="Master file" meta="the file customers download or reference" />
          <div className="file-card">
            <div className="file-icon">PDF</div>
            <div className="meta">
              <div className="name">marigold-dye-guide-v2.1.4.pdf</div>
              <div className="submeta">
                18.4 MB · 84 pages · uploaded 14 May by Marisol<br/>
                <span style={{ color: 'var(--ink-faint)' }}>sha256 · a4f9…3e21d</span>
              </div>
              <div className="actions">
                <button className="btn btn-sm"><span className="kbd">P</span>Preview</button>
                <button className="btn btn-sm">Replace</button>
                <button className="btn btn-sm">Copy URL</button>
                <button className="btn btn-sm btn-ghost">Download</button>
              </div>
            </div>
          </div>

          <div className="lbl-mono" style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ink-soft)', marginTop: 14, marginBottom: 4 }}>
            Version history
          </div>
          <div className="version-list">
            <div className="v-item curr">
              <span>v2.1.4</span><span>· current — fixed dye-bath times</span><span className="when">14 May 2025</span>
            </div>
            <div className="v-item">
              <span>v2.1.3</span><span className="when" style={{ gridColumn: '2/4', textAlign: 'right' }}>· typo pass · 28 Apr 2025</span>
            </div>
            <div className="v-item">
              <span>v2.0.0</span><span className="when" style={{ gridColumn: '2/4', textAlign: 'right' }}>· major rewrite · 14 Mar 2025</span>
            </div>
          </div>

          <div style={{ marginTop: 18 }}>
            <Sec h="License keys" meta="200 total · pool for serialized delivery"
              right={<span><span className="mono" style={{ fontSize: 10 }}>+ generate · ↓ export csv · revoke selected</span></span>} />
            <div className="key-pool">
              <div className="key-stat av">
                <div className="l"><span className="dot"></span>Available</div>
                <div className="v">134</div>
              </div>
              <div className="key-stat as">
                <div className="l"><span className="dot"></span>Assigned</div>
                <div className="v">58</div>
              </div>
              <div className="key-stat ac">
                <div className="l"><span className="dot"></span>Activated</div>
                <div className="v">6</div>
              </div>
              <div className="key-stat rv">
                <div className="l"><span className="dot"></span>Revoked</div>
                <div className="v">2</div>
              </div>
            </div>

            <div className="key-grid">
              <table className="key-list">
                <thead>
                  <tr>
                    <th style={{ width: 24 }}><input type="checkbox" readOnly /></th>
                    <th style={{ width: 170 }}>Key</th>
                    <th style={{ width: 100 }}>Status</th>
                    <th>Assigned to</th>
                    <th style={{ width: 60, textAlign: 'right' }}>Activ.</th>
                    <th style={{ width: 110 }}>When</th>
                    <th style={{ width: 28 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {keys.map(k => (
                    <tr key={k.key}>
                      <td><input type="checkbox" readOnly /></td>
                      <td style={{ fontWeight: 500 }}>{k.key}</td>
                      <td><span className={'key-status ' + k.status}>
                        {k.status === 'av' ? 'Available' : k.status === 'as' ? 'Assigned' : k.status === 'ac' ? 'Activated' : 'Revoked'}
                      </span></td>
                      <td style={{ fontFamily: 'Spectral, serif', fontStyle: k.email === '—' ? 'italic' : 'normal', color: k.email === '—' ? 'var(--ink-faint)' : 'var(--ink)' }}>{k.email}</td>
                      <td style={{ textAlign: 'right', color: 'var(--ink-soft)' }}>{k.act}/∞</td>
                      <td style={{ color: 'var(--ink-soft)' }}>{k.when}</td>
                      <td style={{ color: 'var(--ink-faint)', cursor: 'pointer', textAlign: 'center' }}>⋯</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ padding: '8px 12px', background: 'var(--paper-3)', borderTop: '1px solid var(--rule)', display: 'flex', justifyContent: 'space-between', fontFamily: 'Geist Mono, monospace', fontSize: 10, color: 'var(--ink-soft)', letterSpacing: '.04em' }}>
                <span>showing 8 of 200 · sorted activation desc</span>
                <span>‹ 1 2 3 4 5 … 25 ›</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT — delivery rules */}
        <div className="digital-col right">
          <Sec h="Delivery" meta="post-purchase rules" />

          <div className="field"><span className="lbl">deliver</span><span className="val">Automatic — on payment</span></div>
          <div className="field"><span className="lbl">method</span><span className="val">Email + customer portal</span></div>
          <div className="field"><span className="lbl">max d/loads</span><span className="val mono">5 per buyer</span></div>
          <div className="field"><span className="lbl">link expires</span><span className="val mono">30 days from purchase</span></div>
          <div className="field"><span className="lbl">use keys</span><span className="val"><span className="pill pill-solid-accent">YES</span> 1 per order</span></div>
          <div className="field"><span className="lbl">max activ.</span><span className="val mono fig" style={{ fontStyle: 'italic' }}>unlimited per key</span></div>

          <div style={{ marginTop: 18 }}>
            <Sec h="Email template" />
            <div className="input-row">
              <span className="lbl">on purchase</span>
              <span className="val">"Dye guide delivery · v3" <span className="fig" style={{ fontSize: 11 }}>· last edited 12 May</span></span>
            </div>
          </div>

          <div style={{ marginTop: 14 }}>
            <Sec h="Stripe sync" />
            <div className="field"><span className="lbl">product</span><span className="val mono">prod_RXyz12kQp</span></div>
            <div className="field"><span className="lbl">price</span><span className="val mono">price_1RXabc · $24.00</span></div>
            <div className="field"><span className="lbl">last sync</span><span className="val fig">14 May 09:12</span></div>
          </div>

          <div style={{ marginTop: 14, padding: 10, background: 'var(--paper-2)', border: '1px solid var(--rule)', borderRadius: 'var(--r-sm)', fontFamily: 'Spectral, serif', fontStyle: 'italic', fontSize: 12, color: 'var(--ink-soft)', lineHeight: 1.4 }}>
            Tip: when key pool drops below <span style={{ fontStyle: 'normal', fontFamily: 'Geist Mono, monospace', fontSize: 11 }}>20</span>, you'll get a notification to refill.
          </div>
        </div>
      </div>

      <SaveBar
        savedAt="autosaved · pool healthy (134 available)"
        hints={[['⌘S', 'save'], ['G', 'generate'], ['U', 'upload'], ['E', 'export csv']]}
      />
    </Chrome>
  );
}

// ─────────────────────────────────────────────
// Frame 9 — PRICING STACK (Pricing tab)
// ─────────────────────────────────────────────
function ProductPricing() {
  return (
    <Chrome section="products">
      <Crumbs items={[['CMS'], ['Catalog', '#'], ['Apparel', '#'], ['Jackets', '#'], ['Marigold quilted jacket']]} />
      <ProductMasthead extra="base $148 · live sale ends 31 May · 3 codes attached" />
      <EditorTabs
        items={[
          ['Detail', null, false],
          ['Media', 14, false],
          ['Variants', 20, false],
          ['Fields', 5, false],
          ['Inventory', null, false],
          ['Pricing', null, true],
          ['Channels', 3, false],
          ['SEO', null, false],
        ]}
        right={<><span>last edited 14 May · Marisol</span></>}
      />

      <div className="pricing-cols" style={{ paddingTop: 12 }}>
        {/* LEFT — base + tier pricing */}
        <div className="pricing-col">

          <div>
            <Sec h="Base price" meta="per variant · USD" right="margins calc'd from cost" />
            <table className="tier-table">
              <thead>
                <tr>
                  <th>Variant scope</th>
                  <th className="num">Price</th>
                  <th className="num">Cost</th>
                  <th className="num">Margin</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>All XS–L</td>
                  <td className="num price-big">$148.00</td>
                  <td className="num fig" style={{ fontStyle: 'italic' }}>$52.40</td>
                  <td className="num"><span className="accent">$95.60 · 65%</span></td>
                </tr>
                <tr>
                  <td>XL <span className="fig" style={{ fontStyle: 'italic', fontSize: 11 }}>· surcharge</span></td>
                  <td className="num price-big">$158.00</td>
                  <td className="num fig" style={{ fontStyle: 'italic' }}>$56.20</td>
                  <td className="num"><span className="accent">$101.80 · 64%</span></td>
                </tr>
              </tbody>
            </table>
            <div style={{ marginTop: 6, fontSize: 11, color: 'var(--ink-soft)', fontFamily: 'Spectral, serif', fontStyle: 'italic' }}>
              Override per-variant in the Variants grid — these are the defaults.
            </div>
          </div>

          <div>
            <Sec h="Tier pricing" meta="wholesale & quantity breaks"
              right={<span><span className="cf-toggle on" style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10 }}><span className="pip"></span>enabled</span></span>} />
            <table className="tier-table">
              <thead>
                <tr>
                  <th>Qty range</th>
                  <th className="num">Per-unit</th>
                  <th className="num">Save</th>
                  <th>Requires</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><span className="mono">1 – 9</span></td>
                  <td className="num price-big">$148.00</td>
                  <td className="num save">—</td>
                  <td className="fig" style={{ fontStyle: 'italic', fontSize: 12 }}>retail · all customers</td>
                </tr>
                <tr>
                  <td><span className="mono">10 – 49</span></td>
                  <td className="num price-big">$132.00</td>
                  <td className="num save">−$16 / 11%</td>
                  <td><span className="pill pill-out-soft">B2B</span></td>
                </tr>
                <tr>
                  <td><span className="mono">50 +</span></td>
                  <td className="num price-big">$118.00</td>
                  <td className="num save">−$30 / 20%</td>
                  <td><span className="pill pill-out-soft">B2B</span> · <span className="pill pill-out-soft">approval</span></td>
                </tr>
                <tr style={{ background: 'var(--paper-2)' }}>
                  <td colSpan={4} style={{ textAlign: 'center', color: 'var(--accent)', fontSize: 12, padding: '8px 10px', cursor: 'pointer' }}>
                    + add tier
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div>
            <Sec h="Member pricing" meta="loyalty tiers — overrides tier table" />
            <div className="member-row">
              <span className="badge gold">★</span>
              <div>
                <div className="label">Studio Vault</div>
                <div className="fig" style={{ fontSize: 11 }}>top 5% by lifetime spend · 124 members</div>
              </div>
              <span className="mono" style={{ fontSize: 12, textAlign: 'right' }}>−15% off base</span>
              <span className="cf-toggle on"><span className="pip"></span></span>
            </div>
            <div className="member-row">
              <span className="badge silver">○</span>
              <div>
                <div className="label">Studio Insider</div>
                <div className="fig" style={{ fontSize: 11 }}>newsletter subscribers · 4,820</div>
              </div>
              <span className="mono" style={{ fontSize: 12, textAlign: 'right' }}>−10% off base</span>
              <span className="cf-toggle on"><span className="pip"></span></span>
            </div>
            <div className="member-row" style={{ opacity: .65 }}>
              <span className="badge">✕</span>
              <div>
                <div className="label">Wholesale partners</div>
                <div className="fig" style={{ fontSize: 11 }}>handled via Tier pricing above</div>
              </div>
              <span className="mono" style={{ fontSize: 11, textAlign: 'right', color: 'var(--ink-soft)' }}>disabled here</span>
              <span className="cf-toggle"><span className="pip"></span></span>
            </div>
          </div>
        </div>

        {/* RIGHT — sale schedule + linked promos */}
        <div className="pricing-col">

          <div className="schedule-card">
            <div className="head">
              <div className="h2">Sale schedule</div>
              <span className="pill pill-solid-accent">LIVE NOW</span>
            </div>
            <div className="field" style={{ borderBottom: 'none', padding: '4px 0' }}>
              <span className="lbl">compare-at</span>
              <span className="val mono" style={{ textDecoration: 'line-through', color: 'var(--ink-soft)' }}>$148.00</span>
            </div>
            <div className="field" style={{ borderBottom: 'none', padding: '4px 0' }}>
              <span className="lbl">sale price</span>
              <span className="val mono accent" style={{ fontSize: 16, fontWeight: 500 }}>$128.00</span>
            </div>
            <div className="field" style={{ borderBottom: 'none', padding: '4px 0' }}>
              <span className="lbl">window</span>
              <span className="val">22 May → 31 May 2025 <span className="fig" style={{ fontSize: 11 }}>· 9 days remain</span></span>
            </div>

            <div className="lbl-mono" style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ink-soft)', marginTop: 10, marginBottom: 4 }}>
              May 2025
            </div>
            <div className="cal-strip">
              {[18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31].map((d, i) => {
                const cls = d < 22 ? 'past' : d === 26 ? 'sale today' : d >= 22 && d <= 31 ? 'sale' : '';
                return (
                  <div key={d} className={'cal-cell ' + cls}>
                    <span className="d">{d}</span>
                    <span>{d === 26 ? 'today' : d === 22 ? 'start' : d === 31 ? 'end' : ''}</span>
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: 12, padding: 8, background: 'rgba(181, 135, 48, .12)', borderRadius: 2, fontSize: 11.5, color: 'var(--ink)', fontFamily: 'Spectral, serif', fontStyle: 'italic' }}>
              <b style={{ fontStyle: 'normal' }}>Up next:</b> Memorial Day · 24–27 May · <span className="mono" style={{ fontSize: 11 }}>$118</span> · <span style={{ color: 'var(--gold)' }}>scheduled</span>
            </div>
          </div>

          <div>
            <Sec h="Discount codes" meta="3 codes apply to this product"
              right={<span><span className="mono" style={{ fontSize: 10 }}>+ link existing · + new</span></span>} />

            <div style={{ border: '1px solid var(--rule)', borderRadius: 'var(--r-sm)', background: 'var(--paper)' }}>
              <div className="promo-row" style={{ background: 'var(--paper-3)', borderBottom: '1px solid var(--ink)', padding: '6px 10px', fontFamily: 'Geist Mono, monospace', fontSize: 9.5, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ink-soft)' }}>
                <span></span><span>Code</span><span style={{ textAlign: 'right' }}>Value</span><span style={{ textAlign: 'right' }}>Used</span><span></span>
              </div>
              <div className="promo-row">
                <span className="icon pct">%</span>
                <div>
                  <div className="code">WELCOME10</div>
                  <div className="desc">first order · all customers</div>
                </div>
                <span className="val">−10%</span>
                <span className="val fig" style={{ fontStyle: 'italic' }}>1,204</span>
                <span style={{ color: 'var(--ink-faint)', cursor: 'pointer', textAlign: 'center' }}>⋯</span>
              </div>
              <div className="promo-row">
                <span className="icon pct">%</span>
                <div>
                  <div className="code">SPRING25</div>
                  <div className="desc">jackets only · expires 1 Jun</div>
                </div>
                <span className="val">−25%</span>
                <span className="val fig" style={{ fontStyle: 'italic' }}>89</span>
                <span style={{ color: 'var(--ink-faint)', cursor: 'pointer', textAlign: 'center' }}>⋯</span>
              </div>
              <div className="promo-row">
                <span className="icon fix">$</span>
                <div>
                  <div className="code">DYE20</div>
                  <div className="desc">apparel + dye kit bundle · stacks</div>
                </div>
                <span className="val">−$20</span>
                <span className="val fig" style={{ fontStyle: 'italic' }}>342</span>
                <span style={{ color: 'var(--ink-faint)', cursor: 'pointer', textAlign: 'center' }}>⋯</span>
              </div>
            </div>

            <div style={{ marginTop: 10, padding: 10, background: 'var(--paper-2)', border: '1px solid var(--rule)', borderRadius: 'var(--r-sm)', fontSize: 11.5, lineHeight: 1.45 }}>
              <div className="lbl-mono" style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: 4 }}>Stacking rules</div>
              <div style={{ fontFamily: 'Spectral, serif', fontStyle: 'italic', color: 'var(--ink-soft)' }}>
                Sale &amp; member discounts auto-apply. One code per order unless code is marked stackable. Tier pricing replaces base — sale still applies to tier.
              </div>
            </div>
          </div>
        </div>
      </div>

      <SaveBar
        savedAt="autosaved · sale live · 3 codes attached"
        hints={[['⌘S', 'save'], ['S', 'schedule sale'], ['C', '+ code'], ['T', '+ tier']]}
      />
    </Chrome>
  );
}

// ─────────────────────────────────────────────
// Register on window
// ─────────────────────────────────────────────
Object.assign(window, {
  DesignMemo2,
  ProductTypeMorph, ProductCustomFields, ProductVariantsWithFields,
  ProductBundle, ProductDigital, ProductPricing,
});

// ─────────────────────────────────────────────
// App + render — uses everything from window
// ─────────────────────────────────────────────
function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  React.useEffect(() => {
    document.documentElement.style.setProperty('--accent', t.accent);
    document.documentElement.style.setProperty('--display-font', `'${t.displayFont}'`);
    document.body.classList.toggle('no-italic-headlines', !t.italicHeadlines);
    document.body.classList.toggle('no-kbd', !t.showKbd);
  }, [t.accent, t.displayFont, t.italicHeadlines, t.showKbd]);

  return (
    <>
      <DesignMemo />

      <section style={{ marginTop: 14 }}>
        <FrameLabel n="F1" name="Variants · spreadsheet"
          desc="Full-width grid with Excel-style drag-fill, multi-row select, column filters & sort. Bulk-action bar appears when rows are selected." />
        <ProductSpreadsheet />
      </section>

      <section style={{ marginTop: 14 }}>
        <FrameLabel n="F2" name="Variants · matrix"
          desc="Same data, crosstab layout — size × color. Range-select cells across rows and columns; drag fill works in 2D. Right for products that vary in two dimensions." />
        <ProductMatrix />
      </section>

      <section style={{ marginTop: 14 }}>
        <FrameLabel n="F3" name="Media · bulk assign"
          desc="Variant rows × image slots. Library on top; drop images on a color-group header to fill an entire row of variants at once." />
        <ProductMedia />
      </section>

      <DesignMemo2 />

      <section style={{ marginTop: 14 }}>
        <FrameLabel n="F4" name="Type · the editor reshapes"
          desc="Product type isn't a checkbox — it picks the chrome. The 6 types in your schema each unlock different tabs. Active type sits on top of its own configuration." />
        <ProductTypeMorph />
      </section>

      <section style={{ marginTop: 14 }}>
        <FrameLabel n="F5" name="Custom fields · the input toolbox"
          desc="A global library of typed fields (10 types from the schema), attached per product, with column order & required flags. Values live per-variant — Marigold-M can be 320 gsm while Rust-XL is 280 gsm." />
        <ProductCustomFields />
      </section>

      <section style={{ marginTop: 14 }}>
        <FrameLabel n="F6" name="Variants · with custom field columns"
          desc="The spreadsheet from F1 extended with the 5 fields attached in F5. Each column type renders its own inline editor — Material opens a dropdown, Care icons render chips, Hand-dyed is a checkbox." />
        <ProductVariantsWithFields />
      </section>

      <section style={{ marginTop: 14 }}>
        <FrameLabel n="F7" name="Bundle · composing a shelf"
          desc="BUNDLE-type product. Drag products in, set quantities, pick fixed or calculated pricing. Stock is min(children). The bundle is sold out because the M-Marigold jacket is." />
        <ProductBundle />
      </section>

      <section style={{ marginTop: 14 }}>
        <FrameLabel n="F8" name="Digital · files & license keys"
          desc="DIGITAL-type product. Master file with version history, a keyed serial pool with 4 status states, and post-purchase delivery rules on the right rail." />
        <ProductDigital />
      </section>

      <section style={{ marginTop: 14 }}>
        <FrameLabel n="F9" name="Pricing · the stack"
          desc="Base, quantity tiers, sale schedule, linked discount codes, and member tiers — all on one screen. The calendar makes the sale window obvious; stacking rules are stated plainly." />
        <ProductPricing />
      </section>

      <footer style={{ paddingTop: 50, marginTop: 30, borderTop: '1px solid var(--ink)', textAlign: 'center' }}>
        <div className="eyebrow" style={{ marginBottom: 4 }}>Colophon</div>
        <div className="display-i" style={{ fontSize: 14, color: 'var(--ink-soft)' }}>
          CMS · Atlas v2 · Product editor explorations · 9 frames + 2 memos · set in {t.displayFont} &amp; Geist
        </div>
      </footer>

      <TweaksPanel title="Product editor">
        <TweakSection label="Color" />
        <TweakColor
          label="Accent"
          value={t.accent}
          options={ACCENT_OPTIONS}
          onChange={(v) => setTweak('accent', v)}
        />

        <TweakSection label="Type" />
        <TweakRadio
          label="Display font"
          value={t.displayFont}
          options={FONT_OPTIONS}
          onChange={(v) => setTweak('displayFont', v)}
        />
        <TweakToggle
          label="Italic accent on headlines"
          value={t.italicHeadlines}
          onChange={(v) => setTweak('italicHeadlines', v)}
        />

        <TweakSection label="Chrome" />
        <TweakToggle
          label="Keyboard hints visible"
          value={t.showKbd}
          onChange={(v) => setTweak('showKbd', v)}
        />
      </TweaksPanel>
    </>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
