// Atlas Product Editor — exploration
// Three frames: spreadsheet variants, matrix variants, media bulk-assign.
// Plus a short memo on the modal-vs-inline question.

const { Chrome } = window;

// ─────────────────────────────────────────────
// Tweak defaults
// ─────────────────────────────────────────────
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#8b2c1f",
  "displayFont": "Spectral",
  "italicHeadlines": true,
  "showKbd": true
}/*EDITMODE-END*/;

const ACCENT_OPTIONS = ['#8b2c1f', '#2a5a5a', '#2a4a73', '#4f5e3a'];
const FONT_OPTIONS = ['Spectral', 'EB Garamond', 'Cormorant Garamond'];

// ─────────────────────────────────────────────
// Inline shared helpers (Crumbs, EditorTabs, Sec, SaveBar)
// ─────────────────────────────────────────────
function Crumbs({ items }) {
  return (
    <div className="crumbs">
      {items.map(([label, href], i) => {
        const isLast = i === items.length - 1;
        return (
          <React.Fragment key={i}>
            {i > 0 && <span className="sep">/</span>}
            {isLast
              ? <span className="here">{label}</span>
              : <a href={href || '#'}>{label}</a>}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function EditorTabs({ items, right }) {
  return (
    <div className="e-tabs">
      {items.map(([label, count, on]) => (
        <span key={label} className={'tab' + (on ? ' on' : '')}>
          {label}{count !== null && count !== undefined && <span className="ct">{count}</span>}
        </span>
      ))}
      {right && <span className="right">{right}</span>}
    </div>
  );
}

function Sec({ n, h, meta, right }) {
  return (
    <div className="sec">
      {n && <span className="n">{n}</span>}
      <span className="h">{h}</span>
      {meta && <span className="meta">· {meta}</span>}
      {right && <span className="right">{right}</span>}
    </div>
  );
}

function SaveBar({ savedAt, hints }) {
  return (
    <div className="action-bar">
      {hints && hints.map(([k, label], i) => (
        <span key={i}><span className="kbd">{k}</span>{label}</span>
      ))}
      <span className="right">
        <span className="savestate">{savedAt || '— autosaved 9:14 EST —'}</span>
      </span>
    </div>
  );
}

// Compact masthead (saves vertical room vs the original editor-head)
function CompactHead({ kicker, title, sku, pills, stats, actions }) {
  return (
    <div className="ed-head-compact">
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="eyebrow">{kicker}</div>
        <div className="title">{title}</div>
        <div className="meta-row">
          <span className="mono" style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{sku}</span>
          {pills}
          {stats && <span className="fig" style={{ fontSize: 12 }}>{stats}</span>}
        </div>
      </div>
      <div className="actions">{actions}</div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Frame label rows (in the outer doc, between frames)
// ─────────────────────────────────────────────
function FrameLabel({ n, name, desc }) {
  return (
    <div className="page-label-row">
      <span className="num">{n}</span>
      <span className="name">{name}</span>
      <span className="desc">— {desc}</span>
    </div>
  );
}

// ─────────────────────────────────────────────
// 0. The design memo — modal vs inline
// ─────────────────────────────────────────────
function DesignMemo() {
  return (
    <div style={{
      background: 'var(--paper)', border: '1px solid var(--ink)',
      borderRadius: 'var(--r)', padding: '28px 32px', margin: '24px auto 0',
      maxWidth: 1200, boxShadow: '0 12px 40px rgba(0,0,0,.12)'
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr 1fr', gap: 32 }}>
        <div>
          <div className="eyebrow">Design memo</div>
          <div className="display" style={{ fontSize: 26, lineHeight: 1.05, marginTop: 6 }}>
            Modal <span className="display-i accent">vs.</span> inline.
          </div>
          <div className="fig" style={{ fontSize: 12, marginTop: 8 }}>Marisol → product, 16 May</div>
        </div>

        <div style={{ borderLeft: '1px solid var(--rule)', paddingLeft: 24 }}>
          <div className="eyebrow-ink">Reading the problem</div>
          <p className="display-i" style={{ fontSize: 15, lineHeight: 1.5, color: 'var(--ink-soft)', marginTop: 6 }}>
            The current two-column is fine for a <i>page</i> editor — title, metadata,
            preview. It struggles for products because the variant table can't breathe; you
            end up scrolling a 5-column grid in a 600px slot when what you actually want
            is a 12-column spreadsheet. The grid is the work; everything else is reference.
          </p>
          <p className="display-i" style={{ fontSize: 15, lineHeight: 1.5, color: 'var(--ink-soft)' }}>
            Modal-only is worse — every edit becomes a round trip. You can't compare
            rows, can't bulk-fill, can't see the matrix.
          </p>
        </div>

        <div style={{ borderLeft: '1px solid var(--rule)', paddingLeft: 24 }}>
          <div className="eyebrow-ink">My take</div>
          <div style={{ fontSize: 14, lineHeight: 1.55, marginTop: 8 }}>
            <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
              <span className="mono" style={{ fontSize: 11, color: 'var(--accent)', minWidth: 22 }}>01</span>
              <span><b>Tabs are workspaces.</b> Each tab owns the canvas. Detail keeps the
              two-column for metadata. <i>Variants</i>, <i>Media</i>, <i>Inventory</i> drop the
              right rail and go full-width grid.</span>
            </div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
              <span className="mono" style={{ fontSize: 11, color: 'var(--accent)', minWidth: 22 }}>02</span>
              <span><b>Inline first, drawer second.</b> Bulk edits happen in the grid (Excel
              fill, multi-select, set-column). Deep edits open a right-side inspector — the
              grid stays visible behind it. Esc to dismiss.</span>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <span className="mono" style={{ fontSize: 11, color: 'var(--accent)', minWidth: 22 }}>03</span>
              <span><b>Modals are for confirmations.</b> Delete-with-orders, archive, publish
              draft, bulk-import. Never for editing an existing row.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Shared data — "Marigold quilted jacket"
// 4 colors × 5 sizes = 20 variants
// ─────────────────────────────────────────────
const SIZES = ['XS', 'S', 'M', 'L', 'XL'];
const COLORS = [
  { name: 'Bone',     hex: '#efe7d8', code: 'BNE' },
  { name: 'Marigold', hex: '#d4a017', code: 'MAR' },
  { name: 'Moss',     hex: '#4f5e3a', code: 'MSS' },
  { name: 'Rust',     hex: '#8b2c1f', code: 'RST' },
];

// Stock & pace stories per (size, color)
const STORY = {
  'XS|Bone':     { stock: 12, pace: 14, status: 'in'  },
  'XS|Marigold': { stock: 3,  pace: 22, status: 'low' },
  'XS|Moss':     { stock: 10, pace: 6,  status: 'in'  },
  'XS|Rust':     { stock: 7,  pace: 11, status: 'low' },

  'S|Bone':      { stock: 14, pace: 12, status: 'in'  },
  'S|Marigold':  { stock: 0,  pace: 34, status: 'out' },
  'S|Moss':      { stock: 16, pace: 9,  status: 'in'  },
  'S|Rust':      { stock: 11, pace: 18, status: 'in'  },

  'M|Bone':      { stock: 18, pace: 14, status: 'in'  },
  'M|Marigold':  { stock: 0,  pace: 41, status: 'out' },
  'M|Moss':      { stock: 21, pace: 11, status: 'in'  },
  'M|Rust':      { stock: 9,  pace: 26, status: 'low' },

  'L|Bone':      { stock: 15, pace: 10, status: 'in'  },
  'L|Marigold':  { stock: 0,  pace: 33, status: 'out' },
  'L|Moss':      { stock: 17, pace: 8,  status: 'in'  },
  'L|Rust':      { stock: 6,  pace: 19, status: 'low' },

  'XL|Bone':     { stock: 8,  pace: 5,  status: 'in'  },
  'XL|Marigold': { stock: 2,  pace: 11, status: 'low' },
  'XL|Moss':     { stock: 7,  pace: 5,  status: 'in'  },
  'XL|Rust':     { stock: 4,  pace: 9,  status: 'low' },
};

function buildVariants() {
  const arr = [];
  let i = 1;
  for (const sz of SIZES) {
    for (const c of COLORS) {
      const s = STORY[sz + '|' + c.name];
      arr.push({
        idx: i++,
        sz, color: c.name, hex: c.hex,
        sku: `JKT-MQ-${sz}-${c.code}`,
        price: (sz === 'XL') ? 158 : 148,
        cost:  (sz === 'XL') ? 56.20 : 52.40,
        stock: s.stock, pace: s.pace, status: s.status,
        wt: sz === 'XS' ? 0.78 : sz === 'S' ? 0.80 : sz === 'M' ? 0.82 : sz === 'L' ? 0.85 : 0.88,
      });
    }
  }
  return arr;
}

const VARIANTS = buildVariants();

// Shared masthead pieces for the product
function ProductMasthead({ extra }) {
  return (
    <CompactHead
      kicker="Product · Apparel / Jackets · 20 variants"
      title="Marigold quilted jacket"
      sku="JKT-MQ-*"
      pills={<>
        <span className="pill pill-solid-ink">PUBLISHED</span>
        <span className="pill pill-solid-accent">⚑ S/M/L MARIGOLD OUT</span>
      </>}
      stats={extra || '142 sold in 30d · trending ↑'}
      actions={<>
        <button className="btn"><span className="kbd">D</span>Duplicate</button>
        <button className="btn"><span className="kbd">⌘S</span>Save</button>
        <button className="btn btn-accent"><span className="kbd">R</span>Restock Marigold</button>
      </>}
    />
  );
}

// ─────────────────────────────────────────────
// Frame 1 — SPREADSHEET (Variants tab)
// ─────────────────────────────────────────────
function ProductSpreadsheet() {
  // Filter active: Color = Marigold. After filter, only Marigold variants visible.
  const visible = VARIANTS.filter(v => v.color === 'Marigold');
  // All visible rows selected. Active cell range = Price column, all 5 rows.
  // User just edited XS-Marigold price 148 → 158, now dragging to fill down.
  const selectedSkus = new Set(visible.map(v => v.sku));
  const rangeRows = new Set(visible.map(v => v.sku));
  const activeSku = 'JKT-MQ-XS-MAR';
  const lastSkuInRange = 'JKT-MQ-XL-MAR';

  return (
    <Chrome section="products">
      <Crumbs items={[['CMS'], ['Catalog', '#'], ['Apparel', '#'], ['Jackets', '#'], ['Marigold quilted jacket']]} />

      <ProductMasthead />

      <EditorTabs
        items={[
          ['Detail', null, false],
          ['Media', 14, false],
          ['Variants', 20, true],
          ['Inventory', null, false],
          ['Pricing', null, false],
          ['Channels', 3, false],
          ['SEO', null, false],
        ]}
        right={<><span>last edited 14 May · Marisol</span></>}
      />

      {/* Toolbar — filters, sort, view switch */}
      <div className="ss-toolbar">
        <div className="group">
          <span className="lbl-mono">Filter</span>
          <span className="chip accent">color = Marigold <span className="x">✕</span></span>
          <span className="chip">stock &lt; 10</span>
          <span className="chip dash">+ filter</span>
        </div>
        <div className="group">
          <span className="lbl-mono">Sort</span>
          <span className="chip">by size ↑</span>
        </div>
        <div className="group">
          <span className="lbl-mono">Group</span>
          <span className="chip">none</span>
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

      {/* Bulk action bar — only shows when rows selected */}
      <div className="bulk-bar">
        <span className="ct"><b>5</b> selected <span style={{ opacity: .6 }}>· all Marigold variants</span></span>
        <span className="sep">│</span>
        <button>⊞ Set price</button>
        <button>⊞ Set stock</button>
        <button>⊞ Set status</button>
        <button>⊞ Tags</button>
        <button>Restock…</button>
        <button>Duplicate</button>
        <span className="sep">│</span>
        <button style={{ borderColor: 'var(--accent-2)', color: 'var(--accent-2)' }}>Delete</button>
        <span className="right">
          <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, opacity: .7 }}>⌘A all · Esc clear</span>
        </span>
      </div>

      {/* The grid */}
      <div className="ss-wrap">
        <table className="ss">
          <colgroup>
            <col style={{ width: 32 }} />
            <col style={{ width: 32 }} />
            <col style={{ width: 42 }} />
            <col style={{ width: 110 }} />
            <col style={{ width: 134 }} />
            <col style={{ width: 78 }} />
            <col style={{ width: 70 }} />
            <col style={{ width: 62 }} />
            <col style={{ width: 56 }} />
            <col style={{ width: 96 }} />
            <col style={{ width: 60 }} />
          </colgroup>
          <thead>
            <tr>
              <th className="ck"><input type="checkbox" defaultChecked readOnly /></th>
              <th className="num">#</th>
              <th>Size <span className="sort">↑</span></th>
              <th>Color</th>
              <th>SKU</th>
              <th className="num">Price</th>
              <th className="num">Cost</th>
              <th className="num">Stock</th>
              <th className="num">Wt</th>
              <th>Status</th>
              <th className="num">30d</th>
            </tr>
          </thead>
          <tbody>
            {visible.concat(VARIANTS.filter(v => v.color !== 'Marigold')).map((v, i) => {
              const inFilter = v.color === 'Marigold';
              const isSel = selectedSkus.has(v.sku);
              const isActive = v.sku === activeSku;
              const inRange = rangeRows.has(v.sku);
              const isLast = v.sku === lastSkuInRange;
              const breakRow = (i === 5); // first non-Marigold row
              const newPrice = isSel ? 158 : v.price;
              return (
                <tr key={v.sku} className={(isSel ? 'sel-row ' : '') + (breakRow ? 'size-break' : '')}
                    style={!inFilter ? { opacity: .42 } : {}}>
                  <td className="ck"><input type="checkbox" defaultChecked={isSel} readOnly /></td>
                  <td className="num" style={{ color: 'var(--ink-faint)' }}>{v.idx}</td>
                  <td style={{ fontWeight: 500 }}>{v.sz}</td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 14, height: 14, background: v.hex, border: '1px solid var(--rule)', borderRadius: 2 }}></span>
                      {v.color}
                    </span>
                  </td>
                  <td className="mono" style={{ color: 'var(--ink-soft)', fontSize: 11.5 }}>{v.sku}</td>
                  <td className={'num' + (isActive ? ' active-cell has-handle' : '') + (inRange && !isActive ? ' in-range' : '') + (isLast ? ' has-handle' : '')}>
                    {inFilter ? '$' + newPrice.toFixed(2) : '$' + v.price.toFixed(2)}
                  </td>
                  <td className="num fig" style={{ fontStyle: 'italic' }}>${v.cost.toFixed(2)}</td>
                  <td className="num" style={{
                    color: v.stock === 0 ? 'var(--accent)' : v.stock < 10 ? 'var(--gold)' : 'var(--ink)',
                    fontWeight: v.stock === 0 ? 600 : 400
                  }}>{v.stock}</td>
                  <td className="num fig" style={{ fontStyle: 'italic', fontSize: 11 }}>{v.wt}</td>
                  <td>
                    <span className={'status-dot ' + (v.status === 'low' ? 'low' : v.status === 'out' ? 'out' : '')}>
                      {v.status === 'out' ? 'Sold out' : v.status === 'low' ? 'Low' : 'In stock'}
                    </span>
                  </td>
                  <td className="num">{v.pace}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Fill-handle tooltip floats near the bottom of the selected range */}
        <div className="fill-tooltip" style={{ top: 240, left: 462 }}>
          fill $158.00 → 4 cells
        </div>
      </div>

      <SaveBar
        savedAt="5 cells changed · autosaved · ⌘Z to undo"
        hints={[['⌘S', 'save'], ['↵', 'edit'], ['⌫', 'clear'], ['⌘D', 'fill down'], ['⌘⇧F', 'find'], ['Esc', 'deselect']]}
      />
    </Chrome>
  );
}

// ─────────────────────────────────────────────
// Frame 2 — MATRIX (Variants tab, matrix view)
// Size × Color crosstab, with range select demonstration
// ─────────────────────────────────────────────
function ProductMatrix() {
  // Active cell: M-Marigold (sold out, hot). Range: all 3 sold-out cells
  // (S/M/L Marigold column) — user wants to set stock = 30 across them.
  const rangeKeys = new Set(['S|Marigold', 'M|Marigold', 'L|Marigold']);
  const activeKey = 'S|Marigold';
  const lastKey = 'L|Marigold';

  // helper: get story
  const get = (sz, color) => STORY[sz + '|' + color];

  // totals per size & per color
  const sizeTotals = SIZES.map(sz => COLORS.reduce((sum, c) => sum + get(sz, c.name).stock, 0));
  const colorTotals = COLORS.map(c => SIZES.reduce((sum, sz) => sum + get(sz, c.name).stock, 0));
  const grand = sizeTotals.reduce((a, b) => a + b, 0);

  return (
    <Chrome section="products">
      <Crumbs items={[['CMS'], ['Catalog', '#'], ['Apparel', '#'], ['Jackets', '#'], ['Marigold quilted jacket']]} />

      <ProductMasthead />

      <EditorTabs
        items={[
          ['Detail', null, false],
          ['Media', 14, false],
          ['Variants', 20, true],
          ['Inventory', null, false],
          ['Pricing', null, false],
          ['Channels', 3, false],
          ['SEO', null, false],
        ]}
        right={<><span>last edited 14 May · Marisol</span></>}
      />

      <div className="ss-toolbar">
        <div className="group">
          <span className="lbl-mono">Showing</span>
          <span className="chip">stock</span>
          <span className="chip dash">price</span>
          <span className="chip dash">pace</span>
          <span className="chip dash">cost</span>
        </div>
        <div className="group">
          <span className="lbl-mono">Cells</span>
          <span className="chip">color → stock heat</span>
        </div>
        <div className="group" style={{ marginLeft: 'auto' }}>
          <span className="lbl-mono">View</span>
          <div className="view-switch">
            <button>List</button>
            <button className="on">Matrix</button>
            <button>Cards</button>
          </div>
        </div>
      </div>

      <div className="bulk-bar">
        <span className="ct"><b>3</b> cells selected <span style={{ opacity: .6 }}>· S/M/L &times; Marigold</span></span>
        <span className="sep">│</span>
        <button>Set stock = 30</button>
        <button>+ PO for these</button>
        <button>Mark restocking</button>
        <button>Open as list</button>
        <span className="right" style={{ fontFamily: 'Spectral, serif', fontStyle: 'italic', fontSize: 13, opacity: .9 }}>
          all three sold out · 108 sold last 30d combined
        </span>
      </div>

      {/* The matrix */}
      <div className="matrix-wrap">
        <div className="matrix">
          {/* Header row */}
          <div className="mx-cell head corner" style={{ minHeight: 44 }}>
            <span style={{ fontFamily: 'Spectral, serif', fontStyle: 'italic', fontSize: 12, textTransform: 'none', letterSpacing: 0, color: 'var(--ink-soft)' }}>
              color × size
            </span>
          </div>
          {SIZES.map(sz => (
            <div key={sz} className="mx-cell head">{sz}</div>
          ))}
          <div className="mx-cell head" style={{ background: 'var(--paper-2)' }}>Total</div>

          {/* Body rows: one per color */}
          {COLORS.map((c, ci) => (
            <React.Fragment key={c.name}>
              <div className="mx-cell row-head">
                <span className="sw" style={{ background: c.hex }}></span>
                <div>
                  <div className="lbl">{c.name}</div>
                  <div className="sub">JKT-MQ-*-{c.code}</div>
                </div>
              </div>
              {SIZES.map(sz => {
                const k = sz + '|' + c.name;
                const s = get(sz, c.name);
                const inRange = rangeKeys.has(k);
                const isActive = k === activeKey;
                const isLast = k === lastKey;
                const price = sz === 'XL' ? 158 : 148;
                const cls = ['mx-cell'];
                if (isActive) cls.push('active');
                else if (inRange) cls.push('in-range');
                if (isLast) cls.push('has-handle');
                else if (isActive) cls.push('has-handle');
                return (
                  <div key={k} className={cls.join(' ')}>
                    <span className="badge-mini">{sz}·{c.code}</span>
                    <div className={'stock-big ' + (s.status === 'out' ? 'out' : s.status === 'low' ? 'low' : '')}>
                      {s.stock}
                    </div>
                    <div className="price-sm">${price}.00 · {s.pace}/mo</div>
                  </div>
                );
              })}
              <div className="mx-cell totals" style={{ alignItems: 'flex-start', justifyContent: 'center' }}>
                <span style={{ fontSize: 20, lineHeight: 1 }}>{colorTotals[ci]}</span>
                <span className="fig" style={{ fontSize: 10 }}>units</span>
              </div>
            </React.Fragment>
          ))}

          {/* Totals row */}
          <div className="mx-cell totals row-head" style={{ minHeight: 50 }}>
            <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: 'var(--ink-soft)', letterSpacing: '.08em', textTransform: 'uppercase' }}>Total / size</span>
          </div>
          {SIZES.map((sz, i) => (
            <div key={sz} className="mx-cell totals" style={{ alignItems: 'center', justifyContent: 'center', minHeight: 50 }}>
              <span style={{ fontSize: 20, lineHeight: 1 }}>{sizeTotals[i]}</span>
              <span className="fig" style={{ fontSize: 10 }}>units</span>
            </div>
          ))}
          <div className="mx-cell totals" style={{ alignItems: 'center', justifyContent: 'center', minHeight: 50, background: 'var(--paper-3)' }}>
            <span style={{ fontSize: 22, lineHeight: 1, fontWeight: 500 }}>{grand}</span>
            <span className="fig" style={{ fontSize: 10 }}>on hand</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 14, padding: '12px 4px 0', fontSize: 12, color: 'var(--ink-soft)', flexWrap: 'wrap' }}>
          <span className="mono" style={{ fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase' }}>Legend</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><span className="status-dot out"></span>Sold out</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><span className="status-dot low"></span>Low (&lt; 10)</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><span className="status-dot"></span>In stock</span>
          <span style={{ marginLeft: 'auto' }} className="fig">Click a cell to inspect · drag the corner handle to fill · click a header to bulk-edit the row or column</span>
        </div>
      </div>

      <SaveBar
        savedAt="autosaved · 1 selection (3 cells)"
        hints={[['⌘S', 'save'], ['↵', 'inspect'], ['⌘D', 'fill'], ['⌘⇧F', 'find'], ['Esc', 'deselect']]}
      />
    </Chrome>
  );
}

// ─────────────────────────────────────────────
// Frame 3 — MEDIA bulk-assign
// Variant rows × image slots. Library strip on top. Bulk panel right.
// ─────────────────────────────────────────────
function ProductMedia() {
  // Library: 10 images. 3 currently selected (about to be bulk-assigned).
  const library = [
    { name: 'jacket-marigold-flat',   sel: true,  assn: 'M·MAR' },
    { name: 'jacket-marigold-model',  sel: true,  assn: 'M·MAR' },
    { name: 'jacket-marigold-detail', sel: true,  assn: 'none' },
    { name: 'jacket-bone-flat',       sel: false, assn: 'BNE' },
    { name: 'jacket-bone-model',      sel: false, assn: 'BNE' },
    { name: 'jacket-moss-flat',       sel: false, assn: 'MSS' },
    { name: 'jacket-moss-model',      sel: false, assn: 'MSS' },
    { name: 'jacket-rust-flat',       sel: false, assn: 'RST' },
    { name: 'jacket-rust-model',      sel: false, assn: 'RST' },
    { name: 'jacket-stack-grouping',  sel: false, assn: 'cover'},
  ];

  // For each color group, what slots are filled (cover / alt1 / alt2 / detail / studio)
  // Marigold has nothing yet (the gap). Others have a coverage pattern.
  function slotsFor(color) {
    if (color === 'Bone')     return ['cover', 'alt', 'alt', 'alt', 'empty'];
    if (color === 'Marigold') return ['missing', 'missing', 'empty', 'empty', 'empty'];
    if (color === 'Moss')     return ['cover', 'alt', 'alt', 'empty', 'empty'];
    if (color === 'Rust')     return ['cover', 'alt', 'empty', 'empty', 'empty'];
    return ['empty', 'empty', 'empty', 'empty', 'empty'];
  }

  return (
    <Chrome section="products">
      <Crumbs items={[['CMS'], ['Catalog', '#'], ['Apparel', '#'], ['Jackets', '#'], ['Marigold quilted jacket']]} />

      <ProductMasthead extra="14 images · 3 selected · Marigold variants need cover" />

      <EditorTabs
        items={[
          ['Detail', null, false],
          ['Media', 14, true],
          ['Variants', 20, false],
          ['Inventory', null, false],
          ['Pricing', null, false],
          ['Channels', 3, false],
          ['SEO', null, false],
        ]}
        right={<><span>last edited 14 May · Marisol</span></>}
      />

      {/* Top: library strip */}
      <div style={{ paddingTop: 10 }}>
        <Sec h="Library" meta="14 images · 1 video"
          right={<span><span className="mono" style={{ background: 'var(--ink)', color: 'var(--paper)', padding: '1px 5px', marginRight: 4 }}>+</span>upload · drag from desktop</span>} />
        <div className="library">
          {library.map((im, i) => (
            <div key={i} className={'lib-tile' + (im.sel ? ' sel' : '')} title={im.name}>
              <span className="ck"></span>
              <span style={{ fontSize: 8.5 }}>{im.name.split('-').slice(-1)[0]}</span>
              <span className={'assn' + (im.assn === 'none' ? ' none' : '')}>
                {im.assn === 'none' ? '— unassigned —' : im.assn}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Body: two-col — left grid, right bulk panel */}
      <div className="media-wrap" style={{ marginTop: 6 }}>
        <div className="media-left">
          <Sec h="Assigned to variants" meta="rows = variants · cols = image slots · drag from library"
            right={<span>
              <span className="chip on" style={{ fontSize: 10 }}>group by color</span>
            </span>} />
          <div className="media-grid">
            <table className="mg-table">
              <colgroup>
                <col style={{ width: 170 }} />
                <col style={{ width: 68 }} />
                <col style={{ width: 68 }} />
                <col style={{ width: 68 }} />
                <col style={{ width: 68 }} />
                <col style={{ width: 68 }} />
                <col />
              </colgroup>
              <thead>
                <tr>
                  <th>Variant</th>
                  <th>Cover</th>
                  <th>Alt 1</th>
                  <th>Alt 2</th>
                  <th>Detail</th>
                  <th>Studio</th>
                  <th>+</th>
                </tr>
              </thead>
              <tbody>
                {COLORS.map((c, ci) => {
                  const isMarigold = c.name === 'Marigold';
                  return (
                    <React.Fragment key={c.name}>
                      {/* Color group header row */}
                      <tr style={{ background: isMarigold ? 'rgba(139, 44, 31, .08)' : 'var(--paper-2)' }}>
                        <td colSpan={7} style={{ padding: '8px 10px', borderBottom: '1px solid var(--ink)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ width: 16, height: 16, background: c.hex, border: '1px solid var(--rule)', borderRadius: 2 }}></span>
                            <span style={{ fontFamily: 'Spectral, serif', fontSize: 15 }}>{c.name}</span>
                            <span className="fig" style={{ fontSize: 11 }}>5 sizes</span>
                            {isMarigold && <span className="pill pill-solid-accent">3 SOLD OUT · NO COVER</span>}
                            <span style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                              {isMarigold ? (
                                <span style={{
                                  display: 'inline-flex', alignItems: 'center', gap: 6,
                                  border: '2px dashed var(--accent)', borderRadius: 3,
                                  padding: '3px 10px', background: 'rgba(139, 44, 31, .1)',
                                  color: 'var(--accent)', fontFamily: 'Geist Mono, monospace',
                                  fontSize: 10, letterSpacing: '.06em', textTransform: 'uppercase'
                                }}>
                                  ⇩ drop 3 images here → fills 5 variants
                                </span>
                              ) : (
                                <span className="chip" style={{ fontSize: 10 }}>assign to all 5</span>
                              )}
                            </span>
                          </div>
                        </td>
                      </tr>
                      {SIZES.map(sz => {
                        const slots = slotsFor(c.name);
                        const rowSel = isMarigold;
                        return (
                          <tr key={sz + '|' + c.name} className={rowSel ? 'sel-row' : ''}>
                            <td>
                              <div className="v-cell">
                                <span className="sw" style={{ background: c.hex }}></span>
                                <div>
                                  <div className="label">{c.name} · {sz}</div>
                                  <div className="sub">JKT-MQ-{sz}-{c.code}</div>
                                </div>
                              </div>
                            </td>
                            {slots.map((slot, j) => (
                              <td key={j}>
                                {slot === 'cover'  && <div className="img-slot cover">flat</div>}
                                {slot === 'alt'    && <div className="img-slot">model</div>}
                                {slot === 'empty'  && <div className="img-slot empty">+</div>}
                                {slot === 'missing'&& (j === 0 ? <div className="img-slot drop-target">drop</div> : <div className="img-slot missing">missing</div>)}
                              </td>
                            ))}
                            <td>
                              <div className="img-slot empty" style={{ borderColor: 'transparent' }}></div>
                            </td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right rail: bulk-assign control */}
        <div className="media-right">
          <Sec h="Bulk assign" meta="3 selected" />

          <div className="input-row">
            <span className="lbl">Use as</span>
            <span className="val mono">
              Cover · Alt 1 · Alt 2 <span style={{ marginLeft: 6, color: 'var(--ink-soft)' }}>(auto-order)</span>
            </span>
          </div>

          <div style={{ marginTop: 10 }}>
            <span className="lbl-mono" style={{ display: 'block', marginBottom: 6 }}>Target variants</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 6px', background: 'rgba(139, 44, 31, .08)', borderRadius: 3, border: '1px solid var(--accent)' }}>
                <input type="checkbox" defaultChecked readOnly />
                <span style={{ fontSize: 13 }}>All <b style={{ color: 'var(--accent)' }}>Marigold</b> <span className="fig" style={{ fontSize: 11 }}>(5)</span></span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 6px' }}>
                <input type="checkbox" readOnly />
                <span style={{ fontSize: 13 }}>All <b>Bone</b> <span className="fig" style={{ fontSize: 11 }}>(5)</span></span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 6px' }}>
                <input type="checkbox" readOnly />
                <span style={{ fontSize: 13 }}>All <b>Moss</b> <span className="fig" style={{ fontSize: 11 }}>(5)</span></span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 6px' }}>
                <input type="checkbox" readOnly />
                <span style={{ fontSize: 13 }}>All <b>Rust</b> <span className="fig" style={{ fontSize: 11 }}>(5)</span></span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 6px' }}>
                <input type="checkbox" readOnly />
                <span style={{ fontSize: 13 }}>All size <b>M</b> <span className="fig" style={{ fontSize: 11 }}>(4)</span></span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 6px', color: 'var(--ink-soft)' }}>
                <input type="checkbox" readOnly />
                <span style={{ fontSize: 13 }}>Specific variants…</span>
              </label>
            </div>
          </div>

          <button className="btn btn-accent" style={{ marginTop: 14, justifyContent: 'center', padding: '10px 14px' }}>
            Assign 3 → 5 variants <span className="kbd">↵</span>
          </button>

          <div style={{ marginTop: 16, padding: '12px 0 0', borderTop: '1px solid var(--rule)' }}>
            <span className="lbl-mono" style={{ display: 'block', marginBottom: 8 }}>Coverage</span>
            {[
              ['Cover',   17, 20, 'Marigold (3) missing'],
              ['Alt 1',   12, 20, '8 missing'],
              ['Alt 2',    4, 20, 'optional'],
              ['Detail',   1, 20, 'optional'],
              ['Studio',   0, 20, 'optional'],
            ].map(([slot, have, total, note]) => {
              const pct = (have / total) * 100;
              const isShort = slot === 'Cover' && have < total;
              return (
                <div key={slot} style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                    <span>{slot} <span className="fig" style={{ fontSize: 11 }}>{note}</span></span>
                    <span className="mono" style={{ fontSize: 11, color: isShort ? 'var(--accent)' : 'var(--ink-soft)' }}>{have}/{total}</span>
                  </div>
                  <div style={{ height: 4, background: 'var(--rule-soft)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ width: pct + '%', height: '100%', background: isShort ? 'var(--accent)' : 'var(--moss)' }}></div>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 14, padding: 10, background: 'var(--paper-2)', border: '1px solid var(--rule)', borderRadius: 'var(--r-sm)', fontFamily: 'Spectral, serif', fontStyle: 'italic', fontSize: 12, color: 'var(--ink-soft)', lineHeight: 1.4 }}>
            Auto-match by filename detected: <span style={{ fontStyle: 'normal', fontFamily: 'Geist Mono, monospace', fontSize: 11 }}>*-marigold-*</span> → Marigold variants. Apply for all 14 images?
            <button className="btn btn-sm" style={{ display: 'block', marginTop: 6, borderColor: 'var(--ink)' }}>Run auto-match</button>
          </div>
        </div>
      </div>

      <SaveBar
        savedAt="3 selected · ready to assign"
        hints={[['⌘S', 'save'], ['A', 'assign'], ['G', 'auto-match'], ['Esc', 'clear']]}
      />
    </Chrome>
  );
}

// Register everything for downstream files
Object.assign(window, {
  // shared helpers
  Crumbs, EditorTabs, Sec, SaveBar, CompactHead, FrameLabel,
  ProductMasthead,
  // shared data
  SIZES, COLORS, STORY, VARIANTS,
  // frames
  DesignMemo, ProductSpreadsheet, ProductMatrix, ProductMedia,
  // tweak config
  TWEAK_DEFAULTS, ACCENT_OPTIONS, FONT_OPTIONS,
});
