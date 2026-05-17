// Atlas Analytics Dashboard — exploration
// F1 view · F2 edit mode · F3 widget config · F4 query builder · F5 templates
// Plus the App that renders everything.

const {
  Chrome,
  Sparkline, LineChart, BarChart, Donut,
  MiniLine, MiniArea, MiniBar, MiniDonut, MiniKpi, MiniTable, MiniFunnel, MiniFeed, MiniHeat, MiniMap,
  ANALYTICS_DATA,
} = window;

const DATA = ANALYTICS_DATA;

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
// Shared inline helpers
// ─────────────────────────────────────────────
function Crumbs({ items }) {
  return (
    <div className="crumbs">
      {items.map(([label, href], i) => {
        const isLast = i === items.length - 1;
        return (
          <React.Fragment key={i}>
            {i > 0 && <span className="sep">/</span>}
            {isLast ? <span className="here">{label}</span> : <a href={href || '#'}>{label}</a>}
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
// Dashboard masthead
// ─────────────────────────────────────────────
function DashHead({ title, subtitle, pills, actions }) {
  return (
    <div className="dash-head">
      <div className="title-block">
        <div className="eyebrow">Dashboard · Studio Marigold · storefront</div>
        <div className="title">{title}</div>
        <div className="meta-row">
          {subtitle && <span className="fig" style={{ fontSize: 13 }}>{subtitle}</span>}
          {pills}
        </div>
      </div>
      <div className="actions">{actions}</div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Common filter strip
// ─────────────────────────────────────────────
function FilterStrip({ editing }) {
  return (
    <div className="filter-strip">
      <span className="lbl-mono">Range</span>
      <span className="chip on">last 30 days <span className="x">▾</span></span>
      <span className="chip">vs prev period</span>

      <span className="lbl-mono" style={{ marginLeft: 10 }}>Filter</span>
      <span className="chip">channel = all</span>
      <span className="chip">device = all</span>
      <span className="chip dash">+ filter</span>

      <span style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
        <span className="lbl-mono">Compare</span>
        <span className="seg">
          <button className={editing ? '' : 'on'}>Period</button>
          <button>Year</button>
          <button>—</button>
        </span>
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────
// REUSABLE WIDGETS — render dashboard tiles
// ─────────────────────────────────────────────
function KpiWidget({ title, value, delta, deltaDir = 'up', sparkData, sparkColor, ctx }) {
  return (
    <>
      <div className="w-head">
        <span className="title">{title}</span>
        <span className="right">
          <span className="badge">30d</span>
          <span className="more">⋯</span>
        </span>
      </div>
      <div className="kpi-big">{value}</div>
      <div className="kpi-delta">
        <span className={'v ' + (deltaDir === 'down' ? 'down' : '')}>
          {deltaDir === 'down' ? '↓' : '↑'} {delta}
        </span>
        <span>vs prev 30d</span>
        {ctx && <span style={{ marginLeft: 'auto', color: 'var(--ink-faint)' }}>{ctx}</span>}
      </div>
      <div className="kpi-spark">
        <Sparkline data={sparkData} color={sparkColor || 'var(--accent)'} />
      </div>
    </>
  );
}

function RevenueWidget({ withConfig }) {
  return (
    <>
      <div className="w-head">
        <span className="title">Revenue</span>
        <span className="sub">last 30 days · daily</span>
        <span className="right">
          <span className="badge">$28,940</span>
          <span style={{ color: 'var(--moss)' }}>+24%</span>
          <span className="more">⋯</span>
        </span>
      </div>
      <div className="chart-canvas">
        <LineChart
          series={[
            { name: 'this period', color: 'var(--accent)', data: DATA.revenue30 },
            { name: 'prev period',  color: 'var(--ink-faint)', data: DATA.prevRevenue30 },
          ]}
          xLabels={DATA.days}
          dotted
          height={170}
        />
      </div>
      <div className="legend">
        <span className="it"><span className="sw" style={{ background: 'var(--accent)' }}></span>this period · $28,940</span>
        <span className="it"><span className="sw" style={{ background: 'var(--ink-faint)' }}></span>prev 30d · $23,380</span>
        {withConfig && (
          <span style={{ marginLeft: 'auto', color: 'var(--accent)', cursor: 'pointer', fontSize: 10 }}>
            ↗ open data source
          </span>
        )}
      </div>
    </>
  );
}

function OrdersBarWidget() {
  return (
    <>
      <div className="w-head">
        <span className="title">Orders / day</span>
        <span className="right">
          <span className="badge">1,124</span>
          <span style={{ color: 'var(--moss)' }}>+18%</span>
          <span className="more">⋯</span>
        </span>
      </div>
      <div className="chart-canvas">
        <BarChart data={DATA.ordersDays} xLabels={DATA.days} height={170} color="var(--accent)" />
      </div>
    </>
  );
}

function ChannelsWidget() {
  return (
    <>
      <div className="w-head">
        <span className="title">By channel</span>
        <span className="right"><span className="badge">5 sources</span><span className="more">⋯</span></span>
      </div>
      <div style={{ display: 'flex', gap: 12, flex: 1, minHeight: 0 }}>
        <div style={{ width: 130, position: 'relative', flexShrink: 0 }}>
          <Donut segments={DATA.channels} size={130} stroke={20} />
          <div className="donut-center">
            <div className="v">12.8k</div>
            <div className="l">visits</div>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4 }}>
          {DATA.channels.map(c => (
            <div key={c.name} style={{ display: 'flex', alignItems: 'baseline', gap: 6, fontSize: 11.5 }}>
              <span style={{ width: 10, height: 10, background: c.color, borderRadius: 2, flexShrink: 0 }}></span>
              <span style={{ fontFamily: 'Spectral, serif' }}>{c.name}</span>
              <span style={{ marginLeft: 'auto', fontFamily: 'Geist Mono, monospace', fontSize: 10.5, color: 'var(--ink-soft)' }}>{c.value}</span>
              <span className="mono" style={{ fontSize: 10, color: 'var(--ink-faint)', minWidth: 24, textAlign: 'right' }}>{c.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function TopProductsWidget() {
  return (
    <>
      <div className="w-head">
        <span className="title">Top products</span>
        <span className="sub">by revenue</span>
        <span className="right"><span className="badge">6 of 142</span><span className="more">⋯</span></span>
      </div>
      <div className="w-table">
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th className="num">Units</th>
              <th className="num">Revenue</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {DATA.topProducts.map(p => (
              <tr key={p.sku}>
                <td>
                  <div style={{ fontFamily: 'Spectral, serif', fontSize: 13, lineHeight: 1.1 }}>{p.name}</div>
                  <div className="mono" style={{ fontSize: 9.5, color: 'var(--ink-soft)', letterSpacing: '.02em', marginTop: 1 }}>{p.sku}</div>
                </td>
                <td className="num">{p.units}</td>
                <td className="num">${p.rev.toLocaleString()}</td>
                <td style={{ width: 80, paddingLeft: 8 }}>
                  <span className="mini-bar" style={{ width: p.pct + '%' }}></span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function FunnelWidget() {
  return (
    <>
      <div className="w-head">
        <span className="title">Conversion funnel</span>
        <span className="sub">visits → purchase · 30d</span>
        <span className="right">
          <span className="badge">1.84%</span>
          <span style={{ color: 'var(--moss)' }}>+0.3pp</span>
        </span>
      </div>
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        {DATA.funnel.map((f, i) => (
          <div key={f.label} className="funnel-row">
            <span className="label">{f.label}</span>
            <div className="bar-track">
              <div className={'bar-fill ' + f.color} style={{ width: f.pct + '%' }}></div>
            </div>
            <span className="v">{f.v.toLocaleString()}</span>
            <span className="pct">{f.pct}%</span>
          </div>
        ))}
      </div>
    </>
  );
}

function ActivityWidget() {
  return (
    <>
      <div className="w-head">
        <span className="title">Live activity</span>
        <span className="sub">last hour</span>
        <span className="right">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--moss)' }}>
            <span style={{ width: 6, height: 6, borderRadius: 50, background: 'var(--moss)', display: 'inline-block' }}></span>
            live
          </span>
        </span>
      </div>
      <div className="w-feed">
        {DATA.activity.map((a, i) => (
          <div key={i} className="w-feed-item">
            <span className={'dot ' + a.cls}></span>
            <span style={{ fontFamily: 'Spectral, serif', fontSize: 12.5 }}>{a.text}</span>
            <span className="when">{a.when}</span>
          </div>
        ))}
      </div>
    </>
  );
}

function AlertsWidget() {
  return (
    <>
      <div className="w-head">
        <span className="title">Needs attention</span>
        <span className="right"><span className="badge">4</span><span className="more">⋯</span></span>
      </div>
      <div style={{ flex: 1, minHeight: 0, overflow: 'auto', marginTop: 2 }}>
        {DATA.alerts.map((a, i) => (
          <div key={i} className="w-alert-item">
            <span className={'bar ' + (a.bar || '')}></span>
            <div>
              <div className="title-line">{a.title}</div>
              <div className="sub">{a.sub}</div>
            </div>
            <span className="cta">{a.cta} →</span>
          </div>
        ))}
      </div>
    </>
  );
}

function HeatmapWidget() {
  // 7 days × 24 hours — visits intensity
  const rows = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const get = (r, c) => {
    // Peak Tue-Thu midday and evenings 19-22
    const eve = c >= 19 && c <= 22 ? 2 : 0;
    const mid = c >= 11 && c <= 14 ? 1 : 0;
    const day = r >= 2 && r <= 4 ? 1 : 0;
    const wknd = (r === 0 || r === 6) && c >= 10 && c <= 14 ? 2 : 0;
    const noise = (r * 7 + c * 3) % 5;
    const v = Math.min(5, Math.max(0, eve + mid + day + wknd + (noise > 3 ? 1 : 0)));
    return v;
  };
  return (
    <>
      <div className="w-head">
        <span className="title">Visits · hour × day</span>
        <span className="sub">Eastern · last 30d</span>
        <span className="right"><span className="badge">peak Tue 20:00</span></span>
      </div>
      <div className="heat-grid" style={{ gridTemplateRows: 'auto repeat(7, 1fr)' }}>
        <span></span>
        {Array.from({ length: 24 }, (_, c) => (
          <span key={c} className="heat-col-lbl">{c % 4 === 0 ? c : ''}</span>
        ))}
        {rows.map((r, ri) => (
          <React.Fragment key={r}>
            <span className="heat-row-lbl">{r}</span>
            {Array.from({ length: 24 }, (_, c) => {
              const v = get(ri, c);
              return <span key={c} className={'heat-cell' + (v > 0 ? ' l' + v : '')}></span>;
            })}
          </React.Fragment>
        ))}
      </div>
    </>
  );
}

// ─────────────────────────────────────────────
// 0. Design memo
// ─────────────────────────────────────────────
function DesignMemo() {
  return (
    <div style={{
      background: 'var(--paper)', border: '1px solid var(--ink)',
      borderRadius: 'var(--r)', padding: '28px 32px', margin: '24px auto 0',
      maxWidth: 1200, boxShadow: '0 12px 40px rgba(0, 0, 0, .12)'
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr 1fr', gap: 32 }}>
        <div>
          <div className="eyebrow">Design memo</div>
          <div className="display" style={{ fontSize: 26, lineHeight: 1.05, marginTop: 6 }}>
            View <span className="display-i accent">vs.</span> edit.
          </div>
          <div className="fig" style={{ fontSize: 12, marginTop: 8 }}>Marisol → product, 16 May</div>
        </div>

        <div style={{ borderLeft: '1px solid var(--rule)', paddingLeft: 24 }}>
          <div className="eyebrow-ink">Reading the problem</div>
          <p className="display-i" style={{ fontSize: 15, lineHeight: 1.5, color: 'var(--ink-soft)', marginTop: 6 }}>
            Dashboards default to read-only because reads happen 100× per edit. But the read should never
            feel like a dead end — when a number is surprising, you want to drill, swap the viz,
            change the breakdown, or compose the answer yourself. The same surface needs to handle
            both modes without compromising either.
          </p>
          <p className="display-i" style={{ fontSize: 15, lineHeight: 1.5, color: 'var(--ink-soft)' }}>
            And every dashboard is a layout problem: same data, eight ways. A KPI strip for Monday standup;
            a single hero chart for the screen on the wall; a tabular grind for the quarterly report.
            One dashboard per use; not one dashboard to rule them all.
          </p>
        </div>

        <div style={{ borderLeft: '1px solid var(--rule)', paddingLeft: 24 }}>
          <div className="eyebrow-ink">My take</div>
          <div style={{ fontSize: 14, lineHeight: 1.55, marginTop: 8 }}>
            <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
              <span className="mono" style={{ fontSize: 11, color: 'var(--accent)', minWidth: 22 }}>01</span>
              <span><b>Read first, edit fluidly.</b> Default view is clean; an "Edit" toggle reveals the grid,
              drag handles and widget palette without leaving the page. Same DOM, more chrome.</span>
            </div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
              <span className="mono" style={{ fontSize: 11, color: 'var(--accent)', minWidth: 22 }}>02</span>
              <span><b>Every widget is two surfaces.</b> The tile (small, dense) and the configuration
              panel (slid in from the right) — viz type, metric, dimension, filters, comparison. No modals.</span>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <span className="mono" style={{ fontSize: 11, color: 'var(--accent)', minWidth: 22 }}>03</span>
              <span><b>Behind every metric is a query.</b> Pick from a schema, drag fields into roles
              (metric, dimension, filter) — same data model whether you composed it or grabbed a template.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// F1 — VIEW (read-only dashboard)
// ─────────────────────────────────────────────
function DashboardView() {
  return (
    <Chrome section="analytics">
      <Crumbs items={[['CMS'], ['Analytics', '#'], ['Storefront overview']]} />

      <DashHead
        title={<>Storefront overview <span className="display-i accent">· 30 days.</span></>}
        subtitle="snapshot · auto-refresh 5 min · last sync 09:14"
        pills={<>
          <span className="pill pill-solid-ink">SHARED · TEAM</span>
          <span className="pill pill-out">v12 · auto</span>
        </>}
        actions={<>
          <button className="btn"><span className="kbd">⌘P</span>Export</button>
          <button className="btn"><span className="kbd">S</span>Schedule</button>
          <button className="btn btn-accent"><span className="kbd">E</span>Edit</button>
        </>}
      />

      <FilterStrip />

      <div className="dash-grid">
        {/* KPI strip — 4 across */}
        <div className="widget w-3 h-2">
          <KpiWidget title="Revenue · 30d" value="$28,940" delta="24.0%" sparkData={DATA.revenue30}
            sparkColor="var(--accent)" ctx="$0.96k/d" />
        </div>
        <div className="widget w-3 h-2">
          <KpiWidget title="Orders" value="1,124" delta="18.2%" sparkData={DATA.ordersDays}
            sparkColor="var(--moss)" ctx="37/d" />
        </div>
        <div className="widget w-3 h-2">
          <KpiWidget title="AOV" value="$25.74" delta="4.8%" sparkData={[22,23,21,24,25,24,26,25,27,26]}
            sparkColor="var(--gold)" />
        </div>
        <div className="widget w-3 h-2">
          <KpiWidget title="Conv. rate" value="1.84%" delta="0.3pp" sparkData={[1.4,1.5,1.6,1.5,1.7,1.6,1.8,1.7,1.85,1.84]}
            sparkColor="var(--indigo)" />
        </div>

        {/* Hero row: revenue chart + channels donut */}
        <div className="widget w-8 h-3">
          <RevenueWidget />
        </div>
        <div className="widget w-4 h-3">
          <ChannelsWidget />
        </div>

        {/* Lower: top products + funnel + alerts */}
        <div className="widget w-5 h-3">
          <TopProductsWidget />
        </div>
        <div className="widget w-4 h-3">
          <FunnelWidget />
        </div>
        <div className="widget w-3 h-3">
          <AlertsWidget />
        </div>
      </div>

      <SaveBar
        savedAt="viewing · auto-refresh in 4:32"
        hints={[['E', 'edit'], ['⌘K', 'jump'], ['⌘P', 'export PDF'], ['R', 'refresh'], ['F', 'fullscreen']]}
      />
    </Chrome>
  );
}

// ─────────────────────────────────────────────
// F2 — EDIT MODE (grid, palette, drag handles)
// ─────────────────────────────────────────────
const WIDGET_TYPES = [
  { kind: 'KPI',      label: 'KPI',       desc: 'single number + spark',  glyph: MiniKpi },
  { kind: 'LINE',     label: 'Line',      desc: 'over time',              glyph: MiniLine },
  { kind: 'AREA',     label: 'Area',      desc: 'stacked or single',      glyph: MiniArea },
  { kind: 'BAR',      label: 'Bar',       desc: 'categorical',            glyph: MiniBar },
  { kind: 'DONUT',    label: 'Donut',     desc: 'breakdown',              glyph: MiniDonut },
  { kind: 'TABLE',    label: 'Table',     desc: 'top-N · sortable',       glyph: MiniTable },
  { kind: 'FUNNEL',   label: 'Funnel',    desc: 'step conversion',        glyph: MiniFunnel },
  { kind: 'FEED',     label: 'Feed',      desc: 'live events',            glyph: MiniFeed },
  { kind: 'HEAT',     label: 'Heatmap',   desc: 'time × intensity',       glyph: MiniHeat },
  { kind: 'MAP',      label: 'Map',       desc: 'geographic',             glyph: MiniMap },
];

function DashboardEdit() {
  return (
    <Chrome section="analytics">
      <Crumbs items={[['CMS'], ['Analytics', '#'], ['Storefront overview', '#'], ['Editing']]} />

      <DashHead
        title={<>Storefront overview <span className="display-i accent">· editing.</span></>}
        subtitle="drag to rearrange · drag corners to resize · drop new widgets from palette →"
        pills={<>
          <span className="pill pill-solid-accent">EDITING</span>
          <span className="pill pill-out">v12 → v13 draft</span>
          <span className="pill pill-out-soft">9 widgets · 12-col grid</span>
        </>}
        actions={<>
          <button className="btn"><span className="kbd">⌘Z</span>Undo</button>
          <button className="btn btn-ghost">Discard</button>
          <button className="btn btn-accent"><span className="kbd">⌘S</span>Save layout</button>
        </>}
      />

      <FilterStrip editing />

      <div className="dash-grid editing" style={{ paddingRight: 280, marginRight: -28 }}>
        {/* Top KPI strip */}
        <div className="widget editing w-3 h-2">
          <span className="drag-h">▸ drag · KPI 3×2</span>
          <KpiWidget title="Revenue · 30d" value="$28,940" delta="24.0%" sparkData={DATA.revenue30}
            sparkColor="var(--accent)" ctx="$0.96k/d" />
        </div>
        <div className="widget editing w-3 h-2">
          <span className="drag-h">▸ drag · KPI</span>
          <KpiWidget title="Orders" value="1,124" delta="18.2%" sparkData={DATA.ordersDays}
            sparkColor="var(--moss)" ctx="37/d" />
        </div>
        <div className="widget editing w-3 h-2">
          <span className="drag-h">▸ drag · KPI</span>
          <KpiWidget title="AOV" value="$25.74" delta="4.8%" sparkData={[22,23,21,24,25,24,26,25,27,26]}
            sparkColor="var(--gold)" />
        </div>
        <div className="widget editing w-3 h-2">
          <span className="drag-h">▸ drag · KPI</span>
          <KpiWidget title="Conv. rate" value="1.84%" delta="0.3pp" sparkData={[1.4,1.5,1.6,1.5,1.7,1.6,1.8,1.7,1.85,1.84]}
            sparkColor="var(--indigo)" />
        </div>

        {/* Selected: revenue chart */}
        <div className="widget editing sel w-8 h-3">
          <span className="drag-h">▸ Selected · LINE · 8×3</span>
          <RevenueWidget />
          <div className="resize-h"></div>
        </div>
        <div className="widget editing w-4 h-3">
          <span className="drag-h">▸ drag · DONUT</span>
          <ChannelsWidget />
        </div>

        {/* Lower row, with one empty slot */}
        <div className="widget editing w-5 h-3">
          <span className="drag-h">▸ drag · TABLE</span>
          <TopProductsWidget />
        </div>
        <div className="widget editing w-4 h-3">
          <span className="drag-h">▸ drag · FUNNEL</span>
          <FunnelWidget />
        </div>
        <div className="widget empty w-3 h-3">
          + drop widget · 3 × 3
        </div>
      </div>

      {/* Floating palette */}
      <div className="widget-palette">
        <div className="wp-head">
          <span className="h">Add widget</span>
          <span className="esc"><span className="kbd">⎋</span>close</span>
        </div>
        <div className="wp-body">
          <div style={{
            fontFamily: 'Spectral, serif', fontStyle: 'italic', fontSize: 13,
            color: 'var(--ink-soft)', marginBottom: 10, lineHeight: 1.4,
          }}>
            Drag a tile onto the grid — or click to land it in the next empty slot.
          </div>

          <div className="wp-grid">
            {WIDGET_TYPES.map(wt => {
              const Glyph = wt.glyph;
              return (
                <div key={wt.kind} className={'wp-tile' + (wt.kind === 'HEAT' ? ' featured' : '')}>
                  <div className="icon-frame"><Glyph /></div>
                  <div className="label">{wt.label}</div>
                  <div className="desc">{wt.desc}</div>
                </div>
              );
            })}
          </div>

          <div className="sec" style={{ marginTop: 4 }}>
            <span className="h" style={{ fontSize: 14 }}>From templates</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{
              padding: 8, background: 'var(--paper-2)',
              border: '1px solid var(--rule)', borderRadius: 'var(--r-sm)',
              fontSize: 12, cursor: 'grab',
            }}>
              <div style={{ fontFamily: 'Spectral, serif', fontSize: 13 }}>Top 10 SKUs by revenue</div>
              <div className="fig" style={{ fontSize: 11 }}>table · 6 × 4 default</div>
            </div>
            <div style={{
              padding: 8, background: 'var(--paper-2)',
              border: '1px solid var(--rule)', borderRadius: 'var(--r-sm)',
              fontSize: 12, cursor: 'grab',
            }}>
              <div style={{ fontFamily: 'Spectral, serif', fontSize: 13 }}>Inventory · low stock</div>
              <div className="fig" style={{ fontSize: 11 }}>alert list · 3 × 3</div>
            </div>
            <div style={{
              padding: 8, background: 'var(--paper-2)',
              border: '1px solid var(--rule)', borderRadius: 'var(--r-sm)',
              fontSize: 12, cursor: 'grab',
            }}>
              <div style={{ fontFamily: 'Spectral, serif', fontSize: 13 }}>Customer cohorts</div>
              <div className="fig" style={{ fontSize: 11 }}>heatmap · 8 × 4</div>
            </div>
          </div>
        </div>
      </div>

      <SaveBar
        savedAt="1 widget selected · LINE · 8×3 · dragging from palette"
        hints={[['⌘S', 'save'], ['⌘Z', 'undo'], ['del', 'remove'], ['⌘D', 'duplicate'], ['esc', 'exit']]}
      />
    </Chrome>
  );
}

// ─────────────────────────────────────────────
// F3 — WIDGET CONFIGURATION
// ─────────────────────────────────────────────
function DashboardConfig() {
  return (
    <Chrome section="analytics">
      <Crumbs items={[['CMS'], ['Analytics', '#'], ['Storefront overview', '#'], ['Configure widget']]} />

      <DashHead
        title={<>Revenue <span className="display-i accent">· configure.</span></>}
        subtitle="editing widget · live preview · changes apply immediately"
        pills={<>
          <span className="pill pill-solid-accent">EDITING</span>
          <span className="pill pill-out">LINE · 8 × 3</span>
        </>}
        actions={<>
          <button className="btn btn-ghost">Reset</button>
          <button className="btn"><span className="kbd">⌘D</span>Duplicate</button>
          <button className="btn btn-accent"><span className="kbd">⌘S</span>Done</button>
        </>}
      />

      <div className="config-wrap">
        {/* LEFT — live preview */}
        <div className="config-stage">
          <div className="preview-banner">
            <span className="h">Live preview · 8 × 3 tile</span>
            <span className="meta">renders on update · 28ms · cached</span>
          </div>

          <div className="widget-isolate">
            <div className="w-head">
              <span className="title">Revenue</span>
              <span className="sub">last 30 days · daily · vs prev period</span>
              <span className="right">
                <span className="badge">$28,940</span>
                <span style={{ color: 'var(--moss)' }}>+24%</span>
              </span>
            </div>
            <div className="chart-canvas">
              <LineChart
                series={[
                  { name: 'this period', color: 'var(--accent)', data: DATA.revenue30 },
                  { name: 'prev period',  color: 'var(--ink-faint)', data: DATA.prevRevenue30 },
                ]}
                xLabels={DATA.days}
                dotted
                height={260}
              />
            </div>
            <div className="legend">
              <span className="it"><span className="sw" style={{ background: 'var(--accent)' }}></span>this period · $28,940</span>
              <span className="it"><span className="sw" style={{ background: 'var(--ink-faint)' }}></span>prev 30d · $23,380</span>
              <span style={{ marginLeft: 'auto', fontFamily: 'Geist Mono, monospace', fontSize: 10, color: 'var(--ink-soft)' }}>30 points · daily</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 14, marginTop: 12, fontSize: 11, color: 'var(--ink-soft)' }}>
            <span><b style={{ color: 'var(--ink)' }}>Bounds</b> · y-axis 0 → 1.8k</span>
            <span><b style={{ color: 'var(--ink)' }}>Aggregation</b> · sum(daily)</span>
            <span><b style={{ color: 'var(--ink)' }}>Refresh</b> · 5m</span>
            <span style={{ marginLeft: 'auto' }}>↗ <span className="accent">view full data · jump to query</span></span>
          </div>
        </div>

        {/* RIGHT — inspector */}
        <div className="config-inspector">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
            <span className="eyebrow">Widget · LINE</span>
            <span className="mono" style={{ fontSize: 9, color: 'var(--ink-soft)', letterSpacing: '.1em' }}>cell B-2 · 8 × 3</span>
          </div>

          <div className="cfg-section">
            <div className="h">Title <span className="help">visible on the tile</span></div>
            <div className="input-row" style={{ padding: 0 }}>
              <span className="val" style={{ fontSize: 14 }}>Revenue</span>
            </div>
            <div className="input-row">
              <span className="lbl">Subtitle</span>
              <span className="val" style={{ fontSize: 13, fontStyle: 'italic', fontFamily: 'Spectral, serif' }}>last 30 days · daily</span>
            </div>
          </div>

          <div className="cfg-section">
            <div className="h">Visualization <span className="help">5 types available for this data</span></div>
            <div className="viz-picker">
              <span className="viz-opt on" title="Line"><MiniLine /></span>
              <span className="viz-opt" title="Area"><MiniArea /></span>
              <span className="viz-opt" title="Bar"><MiniBar /></span>
              <span className="viz-opt" title="KPI"><MiniKpi /></span>
            </div>
          </div>

          <div className="cfg-section">
            <div className="h">Data · query</div>
            <div style={{ marginBottom: 6 }}>
              <div className="lbl" style={{
                fontFamily: 'Geist Mono, monospace', fontSize: 9.5,
                color: 'var(--ink-soft)', letterSpacing: '.1em', textTransform: 'uppercase',
                marginBottom: 4,
              }}>Metric</div>
              <span className="field-chip">
                <span className="tag met">Σ</span>
                sum(orders.total_cents) / 100
                <span className="x">▾</span>
              </span>
            </div>
            <div style={{ marginBottom: 6 }}>
              <div className="lbl" style={{
                fontFamily: 'Geist Mono, monospace', fontSize: 9.5,
                color: 'var(--ink-soft)', letterSpacing: '.1em', textTransform: 'uppercase',
                marginBottom: 4,
              }}>Group by</div>
              <span className="field-chip">
                <span className="tag dim">▭</span>
                date_trunc('day', orders.created_at)
                <span className="x">▾</span>
              </span>
              <span className="field-chip dash">+ breakdown</span>
            </div>
            <div>
              <div className="lbl" style={{
                fontFamily: 'Geist Mono', fontSize: 9.5,
                color: 'var(--ink-soft)', letterSpacing: '.1em', textTransform: 'uppercase',
                marginBottom: 4,
              }}>Filters · 2</div>
              <div className="filter-row">
                <span className="ctrl">orders.status</span>
                <span className="op">=</span>
                <span className="ctrl">'paid'</span>
                <span className="x">×</span>
              </div>
              <div className="filter-row">
                <span className="ctrl">orders.test</span>
                <span className="op">=</span>
                <span className="ctrl">false</span>
                <span className="x">×</span>
              </div>
              <span className="field-chip dash" style={{ marginTop: 4 }}>+ filter</span>
            </div>
          </div>

          <div className="cfg-section">
            <div className="h">Comparison</div>
            <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
              <span className="chip on" style={{ borderRadius: 'var(--r-sm)' }}>prev period</span>
              <span className="chip" style={{ borderRadius: 'var(--r-sm)' }}>prev year</span>
              <span className="chip" style={{ borderRadius: 'var(--r-sm)' }}>—</span>
            </div>
            <div style={{ fontFamily: 'Spectral, serif', fontStyle: 'italic', fontSize: 11.5, color: 'var(--ink-soft)' }}>
              Comparison line dashed · same y-axis · delta surfaced in header
            </div>
          </div>

          <div className="cfg-section">
            <div className="h">Style</div>
            <div className="field" style={{ padding: '4px 0' }}>
              <span className="lbl">color</span>
              <span className="val" style={{ display: 'flex', gap: 4 }}>
                <span style={{ width: 18, height: 18, borderRadius: 2, background: 'var(--accent)', border: '2px solid var(--ink)' }}></span>
                <span style={{ width: 18, height: 18, borderRadius: 2, background: 'var(--moss)', border: '1px solid var(--rule)' }}></span>
                <span style={{ width: 18, height: 18, borderRadius: 2, background: 'var(--gold)', border: '1px solid var(--rule)' }}></span>
                <span style={{ width: 18, height: 18, borderRadius: 2, background: 'var(--indigo)', border: '1px solid var(--rule)' }}></span>
              </span>
            </div>
            <div className="field" style={{ padding: '4px 0' }}>
              <span className="lbl">fill</span>
              <span className="val mono" style={{ fontSize: 11 }}>area · 12%</span>
            </div>
            <div className="field" style={{ padding: '4px 0' }}>
              <span className="lbl">y-axis</span>
              <span className="val mono" style={{ fontSize: 11 }}>auto · start at 0</span>
            </div>
            <div className="field" style={{ padding: '4px 0' }}>
              <span className="lbl">x-axis</span>
              <span className="val mono" style={{ fontSize: 11 }}>daily · every 5d</span>
            </div>
          </div>

          <div className="cfg-section">
            <div className="h">Drill</div>
            <div style={{ fontSize: 12, color: 'var(--ink-soft)', fontFamily: 'Spectral, serif', fontStyle: 'italic' }}>
              Click a point opens <span style={{ color: 'var(--accent)', fontStyle: 'normal' }}>orders</span> for that day, filtered.
            </div>
          </div>
        </div>
      </div>

      <SaveBar
        savedAt="changes apply live · 28ms · undo to discard"
        hints={[['⌘S', 'done'], ['⌘Z', 'undo'], ['Q', 'open query'], ['esc', 'cancel']]}
      />
    </Chrome>
  );
}

// ─────────────────────────────────────────────
// F4 — QUERY BUILDER
// ─────────────────────────────────────────────
function DashboardQuery() {
  return (
    <Chrome section="analytics">
      <Crumbs items={[['CMS'], ['Analytics', '#'], ['Storefront overview', '#'], ['Revenue', '#'], ['Query']]} />

      <DashHead
        title={<>Behind the number <span className="display-i accent">— query.</span></>}
        subtitle="drag fields into roles · preview updates live · save as data source for reuse"
        pills={<>
          <span className="pill pill-out">DRAFT QUERY · revenue_daily</span>
          <span className="pill pill-out-soft">28ms · 30 rows</span>
        </>}
        actions={<>
          <button className="btn"><span className="kbd">⌘E</span>Open as SQL</button>
          <button className="btn"><span className="kbd">⌘D</span>Duplicate</button>
          <button className="btn btn-accent"><span className="kbd">⌘S</span>Save data source</button>
        </>}
      />

      <div className="qb-wrap">
        {/* LEFT — schema browser */}
        <div className="qb-col">
          <Sec h="Schema" meta="storefront · 14 tables"
            right={<span className="mono" style={{ fontSize: 10 }}>+ join</span>} />
          <div className="scroll schema-tree">
            <div className="schema-table on">
              <div className="schema-table-head">
                <span style={{ color: 'var(--accent)' }}>▾</span> orders
                <span className="ct">12 cols · 4,820 rows</span>
              </div>
              <div className="schema-cols">
                <div className="schema-col"><span className="tg dim">#</span><span>id</span><span className="used">PK</span></div>
                <div className="schema-col"><span className="tg tim">t</span><span>created_at</span><span className="used">used 8×</span></div>
                <div className="schema-col"><span className="tg met">Σ</span><span>total_cents</span><span className="used">used 14×</span></div>
                <div className="schema-col"><span className="tg met">Σ</span><span>tax_cents</span></div>
                <div className="schema-col"><span className="tg met">Σ</span><span>shipping_cents</span></div>
                <div className="schema-col"><span className="tg dim">↗</span><span>customer_id</span></div>
                <div className="schema-col"><span className="tg txt">A</span><span>status</span><span className="used">enum</span></div>
                <div className="schema-col"><span className="tg txt">A</span><span>channel</span></div>
                <div className="schema-col"><span className="tg txt">A</span><span>currency</span></div>
                <div className="schema-col"><span className="tg bool">Y</span><span>test</span></div>
              </div>
            </div>

            <div className="schema-table">
              <div className="schema-table-head">
                <span>▸</span> order_items
                <span className="ct">8 cols</span>
              </div>
            </div>
            <div className="schema-table">
              <div className="schema-table-head">
                <span>▸</span> products
                <span className="ct">22 cols · 142 rows</span>
              </div>
            </div>
            <div className="schema-table">
              <div className="schema-table-head">
                <span>▸</span> variants
                <span className="ct">11 cols · 318 rows</span>
              </div>
            </div>
            <div className="schema-table">
              <div className="schema-table-head">
                <span>▸</span> customers
                <span className="ct">9 cols · 2,184 rows</span>
              </div>
            </div>
            <div className="schema-table">
              <div className="schema-table-head">
                <span>▸</span> sessions
                <span className="ct">15 cols · 12,402 rows</span>
              </div>
            </div>
            <div className="schema-table">
              <div className="schema-table-head">
                <span>▸</span> page_views
                <span className="ct">7 cols · 89k rows</span>
              </div>
            </div>
          </div>
        </div>

        {/* CENTER — query canvas + SQL preview */}
        <div className="qb-col">
          <Sec h="Query · revenue_daily" meta="drag fields into a role · order matters" />
          <div className="qb-canvas">
            <div className="qb-zone">
              <div className="head">
                <span className="h">From</span>
                <span className="help">primary table</span>
              </div>
              <span className="field-chip">
                <span className="tag" style={{ background: 'var(--ink)' }}>T</span>
                orders
                <span className="x">▾</span>
              </span>
              <span className="field-chip dash">+ join</span>
            </div>

            <div className="qb-zone">
              <div className="head">
                <span className="h">Metric · Σ</span>
                <span className="help">numeric · aggregated</span>
              </div>
              <span className="field-chip">
                <span className="tag met">Σ</span>
                <span style={{ fontFamily: 'Geist Mono, monospace' }}>SUM</span>
                <span style={{ color: 'var(--ink-soft)' }}>(</span>
                orders.total_cents
                <span style={{ color: 'var(--ink-soft)' }}>) / 100</span>
                <span className="x">▾</span>
              </span>
              <span className="field-chip dash">+ metric</span>
            </div>

            <div className="qb-zone">
              <div className="head">
                <span className="h">Group by · ▭</span>
                <span className="help">becomes x-axis · time or category</span>
              </div>
              <span className="field-chip">
                <span className="tag dim">▭</span>
                <span style={{ fontFamily: 'Geist Mono, monospace' }}>date_trunc</span>
                <span style={{ color: 'var(--ink-soft)' }}>('day',</span>
                orders.created_at
                <span style={{ color: 'var(--ink-soft)' }}>)</span>
                <span className="x">▾</span>
              </span>
              <span className="field-chip dash">+ breakdown</span>
            </div>

            <div className="qb-zone">
              <div className="head">
                <span className="h">Filters · ⚑</span>
                <span className="help">applied before aggregation</span>
              </div>
              <div className="filter-row">
                <span className="ctrl">orders.created_at</span>
                <span className="op">≥</span>
                <span className="ctrl">now() − 30d</span>
                <span className="x">×</span>
              </div>
              <div className="filter-row">
                <span className="ctrl">orders.status</span>
                <span className="op">=</span>
                <span className="ctrl">'paid'</span>
                <span className="x">×</span>
              </div>
              <div className="filter-row">
                <span className="ctrl">orders.test</span>
                <span className="op">=</span>
                <span className="ctrl">false</span>
                <span className="x">×</span>
              </div>
              <span className="field-chip dash" style={{ marginTop: 4 }}>+ filter</span>
            </div>

            <div className="sql-card">
              <span className="cmt">-- revenue_daily · auto-generated</span><br/>
              <span className="kw">SELECT</span><br/>
              {'  '}<span className="fn">date_trunc</span>(<span className="str">'day'</span>, orders.created_at) <span className="kw">AS</span> day,<br/>
              {'  '}<span className="fn">SUM</span>(orders.total_cents) / 100.0 <span className="kw">AS</span> revenue<br/>
              <span className="kw">FROM</span> orders<br/>
              <span className="kw">WHERE</span> orders.created_at <span className="kw">≥</span> <span className="fn">now</span>() <span className="kw">-</span> <span className="str">interval '30 day'</span><br/>
              {'  '}<span className="kw">AND</span> orders.status <span className="kw">=</span> <span className="str">'paid'</span><br/>
              {'  '}<span className="kw">AND</span> orders.test <span className="kw">=</span> <span className="str">false</span><br/>
              <span className="kw">GROUP BY</span> 1 <span className="kw">ORDER BY</span> 1
            </div>
          </div>
        </div>

        {/* RIGHT — result preview */}
        <div className="qb-col">
          <Sec h="Result" meta="30 rows · 28ms"
            right={<span className="mono" style={{ fontSize: 10 }}>↓ export · cache</span>} />
          <div className="scroll" style={{
            border: '1px solid var(--rule)', borderRadius: 'var(--r-sm)',
            background: 'var(--paper)',
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr>
                  <th style={{
                    textAlign: 'left', padding: '6px 10px',
                    fontFamily: 'Geist Mono, monospace', fontSize: 9.5,
                    letterSpacing: '.1em', textTransform: 'uppercase',
                    color: 'var(--ink-soft)', background: 'var(--paper-3)',
                    borderBottom: '1px solid var(--ink)', position: 'sticky', top: 0,
                  }}>day</th>
                  <th style={{
                    textAlign: 'right', padding: '6px 10px',
                    fontFamily: 'Geist Mono, monospace', fontSize: 9.5,
                    letterSpacing: '.1em', textTransform: 'uppercase',
                    color: 'var(--ink-soft)', background: 'var(--paper-3)',
                    borderBottom: '1px solid var(--ink)', position: 'sticky', top: 0,
                  }}>revenue</th>
                </tr>
              </thead>
              <tbody>
                {DATA.revenue30.map((v, i) => (
                  <tr key={i}>
                    <td style={{
                      padding: '4px 10px', fontFamily: 'Geist Mono, monospace',
                      fontSize: 10.5, color: 'var(--ink-soft)',
                      borderBottom: '1px solid var(--rule-soft)',
                    }}>{DATA.days[i]}</td>
                    <td style={{
                      padding: '4px 10px', textAlign: 'right',
                      fontFamily: 'Geist Mono, monospace', fontSize: 11,
                      borderBottom: '1px solid var(--rule-soft)',
                    }}>${v}.00</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{
            marginTop: 12, padding: 12,
            background: 'var(--paper-2)', border: '1px solid var(--rule)',
            borderRadius: 'var(--r-sm)',
          }}>
            <div className="eyebrow-ink" style={{ marginBottom: 4 }}>Save as data source</div>
            <div className="fig" style={{ fontSize: 12, marginBottom: 8, lineHeight: 1.4 }}>
              Save this query as a reusable source. Any widget can subscribe; updates propagate.
            </div>
            <div className="field" style={{ padding: '5px 0' }}>
              <span className="lbl">name</span>
              <span className="val mono">revenue_daily</span>
            </div>
            <div className="field" style={{ padding: '5px 0' }}>
              <span className="lbl">cache</span>
              <span className="val">5 min · refresh on dashboard load</span>
            </div>
            <div className="field" style={{ padding: '5px 0' }}>
              <span className="lbl">used by</span>
              <span className="val accent" style={{ fontSize: 12.5 }}>3 widgets · 1 alert</span>
            </div>
          </div>
        </div>
      </div>

      <SaveBar
        savedAt="draft query · 30 rows returned in 28ms"
        hints={[['⌘S', 'save'], ['⌘E', 'edit SQL'], ['R', 'run'], ['⌘⏎', 'apply']]}
      />
    </Chrome>
  );
}

// ─────────────────────────────────────────────
// F5 — TEMPLATES & SAVED DASHBOARDS
// ─────────────────────────────────────────────
function DashboardTemplates() {
  return (
    <Chrome section="analytics">
      <Crumbs items={[['CMS'], ['Analytics', '#'], ['Library']]} />

      <DashHead
        title={<>Dashboards <span className="display-i accent">— library.</span></>}
        subtitle="six saved · four templates · one screen per question"
        pills={<>
          <span className="pill pill-solid-ink">6 SAVED</span>
          <span className="pill pill-out">4 TEMPLATES</span>
        </>}
        actions={<>
          <button className="btn"><span className="kbd">⌘O</span>Open shared</button>
          <button className="btn btn-accent"><span className="kbd">N</span>New from blank</button>
        </>}
      />

      <div className="templ-wrap">
        <Sec h="Templates" meta="ready-to-go · pick one and customize"
          right={<span className="mono" style={{ fontSize: 10 }}>+ submit your own</span>} />
        <div className="templ-grid">
          {/* Template 1 — Storefront overview */}
          <div className="templ-card on">
            <div className="head">
              <div className="h">Storefront <span className="i">overview</span></div>
              <span className="pill pill-solid-accent">IN USE</span>
            </div>
            <div className="desc">Revenue, orders, AOV, conversion and channels at a glance. The default daily-standup dashboard.</div>
            <div className="thumb">
              <div className="t k"></div><div className="t k"></div><div className="t k"></div><div className="t k"></div>
              <div className="t l" style={{ gridColumn: 'span 3' }}></div><div className="t d"></div>
              <div className="t" style={{ gridColumn: 'span 2' }}></div><div className="t b"></div><div className="t"></div>
            </div>
            <div className="meta-row">
              <span><b>9</b> widgets · <b>3</b> sources</span>
              <span>opened <b>142×</b> · this month</span>
            </div>
          </div>

          {/* Template 2 — Product detail */}
          <div className="templ-card">
            <div className="head">
              <div className="h">Product <span className="i">deep-dive</span></div>
              <span className="pill pill-out-soft">USE</span>
            </div>
            <div className="desc">One product, every angle. Sales trend, inventory, customer breakdown, returns, reviews — variant-level grids.</div>
            <div className="thumb">
              <div className="t l" style={{ gridColumn: 'span 4' }}></div>
              <div className="t k"></div><div className="t k"></div><div className="t b"></div><div className="t d"></div>
              <div className="t" style={{ gridColumn: 'span 2' }}></div><div className="t" style={{ gridColumn: 'span 2' }}></div>
            </div>
            <div className="meta-row">
              <span><b>12</b> widgets · <b>5</b> sources</span>
              <span>opened <b>38×</b></span>
            </div>
          </div>

          {/* Template 3 — Marketing */}
          <div className="templ-card">
            <div className="head">
              <div className="h">Marketing <span className="i">channels</span></div>
              <span className="pill pill-out-soft">USE</span>
            </div>
            <div className="desc">Email, social, SEO. Per-channel attribution with funnel breakdowns and content-level tables.</div>
            <div className="thumb">
              <div className="t b"></div><div className="t b"></div><div className="t k"></div><div className="t k"></div>
              <div className="t" style={{ gridColumn: 'span 2' }}></div><div className="t l" style={{ gridColumn: 'span 2' }}></div>
              <div className="t d" style={{ gridColumn: 'span 4' }}></div>
            </div>
            <div className="meta-row">
              <span><b>8</b> widgets · <b>4</b> sources</span>
              <span>opened <b>26×</b></span>
            </div>
          </div>

          {/* Template 4 — Inventory */}
          <div className="templ-card">
            <div className="head">
              <div className="h">Inventory <span className="i">health</span></div>
              <span className="pill pill-out-soft">USE</span>
            </div>
            <div className="desc">Stock levels, sell-through rate, reorder thresholds, and a warning list of variants about to go sold-out.</div>
            <div className="thumb">
              <div className="t k"></div><div className="t k"></div><div className="t k"></div><div className="t k"></div>
              <div className="t d" style={{ gridColumn: 'span 4' }}></div>
              <div className="t" style={{ gridColumn: 'span 2' }}></div><div className="t l" style={{ gridColumn: 'span 2' }}></div>
            </div>
            <div className="meta-row">
              <span><b>11</b> widgets · <b>4</b> sources</span>
              <span>opened <b>52×</b></span>
            </div>
          </div>

          {/* Template 5 — Customer */}
          <div className="templ-card">
            <div className="head">
              <div className="h">Customer <span className="i">cohorts</span></div>
              <span className="pill pill-out-soft">USE</span>
            </div>
            <div className="desc">Retention by signup month, lifetime value buckets, top spenders and at-risk segments. Heatmap-heavy.</div>
            <div className="thumb">
              <div className="t" style={{ gridColumn: 'span 4' }}></div>
              <div className="t l" style={{ gridColumn: 'span 4', height: 38 }}></div>
              <div className="t k"></div><div className="t k"></div><div className="t k"></div><div className="t k"></div>
            </div>
            <div className="meta-row">
              <span><b>10</b> widgets · <b>3</b> sources</span>
              <span>opened <b>14×</b></span>
            </div>
          </div>

          {/* Template 6 — Quarterly */}
          <div className="templ-card">
            <div className="head">
              <div className="h">Quarterly <span className="i">report</span></div>
              <span className="pill pill-out-soft">USE</span>
            </div>
            <div className="desc">Print-friendly · 3 pages · big numbers, narrative copy slots, and a "story so far" comparison to last quarter.</div>
            <div className="thumb">
              <div className="t l" style={{ gridColumn: 'span 4', height: 22 }}></div>
              <div className="t" style={{ gridColumn: 'span 4' }}></div>
              <div className="t" style={{ gridColumn: 'span 2' }}></div><div className="t" style={{ gridColumn: 'span 2' }}></div>
            </div>
            <div className="meta-row">
              <span><b>6</b> widgets · <b>2</b> sources</span>
              <span>opened <b>4×</b></span>
            </div>
          </div>
        </div>

        <Sec h="Your saved dashboards" meta="6 dashboards · pinned first"
          right={<span><span className="mono" style={{ fontSize: 10 }}>⌘O open · ⌘D duplicate · star to pin</span></span>} />

        <div style={{
          background: 'var(--paper-2)', border: '1px solid var(--rule)',
          borderRadius: 'var(--r-sm)', overflow: 'hidden',
        }}>
          {/* Header */}
          <div className="saved-row" style={{
            background: 'var(--paper-3)', borderBottom: '1px solid var(--ink)',
            padding: '6px 10px', fontFamily: 'Geist Mono, monospace', fontSize: 9.5,
            letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ink-soft)',
          }}>
            <span></span><span>Dashboard</span><span>Audience</span><span>Updated</span><span style={{ textAlign: 'right' }}>Widgets</span><span></span>
          </div>
          <div className="saved-row">
            <span className="icon" style={{ color: 'var(--accent)' }}>★</span>
            <div>
              <div className="name">Storefront overview</div>
              <div className="sub">/analytics · default · auto-refresh</div>
            </div>
            <span className="num"><span className="pill pill-solid-ink">TEAM</span></span>
            <span className="num fig">2m ago</span>
            <span className="num">9</span>
            <span style={{ color: 'var(--ink-faint)', textAlign: 'center' }}>⋯</span>
          </div>
          <div className="saved-row">
            <span className="icon" style={{ color: 'var(--accent)' }}>★</span>
            <div>
              <div className="name">Marigold jacket · live</div>
              <div className="sub">/analytics/product/jkt-mq · in-season</div>
            </div>
            <span className="num"><span className="pill pill-out">PERSONAL</span></span>
            <span className="num fig">14m</span>
            <span className="num">12</span>
            <span style={{ color: 'var(--ink-faint)', textAlign: 'center' }}>⋯</span>
          </div>
          <div className="saved-row">
            <span className="icon">◯</span>
            <div>
              <div className="name">Marketing · spring '25 campaign</div>
              <div className="sub">scheduled report · weekly to founders@</div>
            </div>
            <span className="num"><span className="pill pill-out">SHARED · 3</span></span>
            <span className="num fig">yesterday</span>
            <span className="num">8</span>
            <span style={{ color: 'var(--ink-faint)', textAlign: 'center' }}>⋯</span>
          </div>
          <div className="saved-row">
            <span className="icon">◯</span>
            <div>
              <div className="name">Inventory health · weekly</div>
              <div className="sub">snapshot · last week's totals</div>
            </div>
            <span className="num"><span className="pill pill-solid-ink">TEAM</span></span>
            <span className="num fig">3d</span>
            <span className="num">11</span>
            <span style={{ color: 'var(--ink-faint)', textAlign: 'center' }}>⋯</span>
          </div>
          <div className="saved-row">
            <span className="icon">◯</span>
            <div>
              <div className="name">Journal · article performance</div>
              <div className="sub">unread time, scroll-depth, share rate</div>
            </div>
            <span className="num"><span className="pill pill-out">PERSONAL</span></span>
            <span className="num fig">2 weeks</span>
            <span className="num">6</span>
            <span style={{ color: 'var(--ink-faint)', textAlign: 'center' }}>⋯</span>
          </div>
          <div className="saved-row" style={{ opacity: .6 }}>
            <span className="icon">◯</span>
            <div>
              <div className="name">Holiday box · post-mortem</div>
              <div className="sub">archived · Q4 2024</div>
            </div>
            <span className="num"><span className="pill pill-out-soft">ARCHIVED</span></span>
            <span className="num fig">Jan</span>
            <span className="num">14</span>
            <span style={{ color: 'var(--ink-faint)', textAlign: 'center' }}>⋯</span>
          </div>
        </div>
      </div>

      <SaveBar
        savedAt="6 dashboards · 2 pinned · 1 archived"
        hints={[['⌘O', 'open'], ['N', 'new'], ['⌘D', 'duplicate'], ['F', 'find'], ['⌘⌫', 'archive']]}
      />
    </Chrome>
  );
}

// ─────────────────────────────────────────────
// Register
// ─────────────────────────────────────────────
Object.assign(window, {
  DesignMemo, DashboardView, DashboardEdit, DashboardConfig, DashboardQuery, DashboardTemplates,
  TWEAK_DEFAULTS, ACCENT_OPTIONS, FONT_OPTIONS,
});

// ─────────────────────────────────────────────
// App
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
        <FrameLabel n="F1" name="View · the read"
          desc="Default state — clean, dense, readable. KPI strip on top, hero chart with comparison line, channel breakdown donut, top-products table, conversion funnel, alerts. Read-only; everything else is a click away." />
        <DashboardView />
      </section>

      <section style={{ marginTop: 14 }}>
        <FrameLabel n="F2" name="Edit · the rearrangement"
          desc="Edit mode flips the surface. The 12-column grid becomes visible, every widget gets a drag handle and a resize corner, an empty slot reads 'drop widget here'. The widget palette slides in from the right with chartable types and saved snippets." />
        <DashboardEdit />
      </section>

      <section style={{ marginTop: 14 }}>
        <FrameLabel n="F3" name="Configure · the widget"
          desc="One widget, all the levers. Live preview on the left, configuration on the right — title, viz type, metric, dimension, filters, comparison, color & axes, drill destination. No modal; everything edits in place." />
        <DashboardConfig />
      </section>

      <section style={{ marginTop: 14 }}>
        <FrameLabel n="F4" name="Query · the data behind it"
          desc="Drill into the metric. Schema browser on the left, query canvas in the middle (From, Metric, Group by, Filter zones), SQL preview at the bottom, result preview on the right. Save the query as a reusable data source." />
        <DashboardQuery />
      </section>

      <section style={{ marginTop: 14 }}>
        <FrameLabel n="F5" name="Library · templates & saved"
          desc="The catch-all home — six pre-built templates with annotated thumbnails, plus the user's saved dashboards listed in a table. Pin, archive, duplicate, share. The starting point for every new dashboard." />
        <DashboardTemplates />
      </section>

      <footer style={{ paddingTop: 50, marginTop: 30, borderTop: '1px solid var(--ink)', textAlign: 'center' }}>
        <div className="eyebrow" style={{ marginBottom: 4 }}>Colophon</div>
        <div className="display-i" style={{ fontSize: 14, color: 'var(--ink-soft)' }}>
          CMS · Atlas v2 · Analytics dashboard explorations · 5 frames + 1 memo · set in {t.displayFont} &amp; Geist
        </div>
      </footer>

      <TweaksPanel title="Analytics dashboard">
        <TweakSection label="Color" />
        <TweakColor label="Accent" value={t.accent} options={ACCENT_OPTIONS}
          onChange={(v) => setTweak('accent', v)} />
        <TweakSection label="Type" />
        <TweakRadio label="Display font" value={t.displayFont} options={FONT_OPTIONS}
          onChange={(v) => setTweak('displayFont', v)} />
        <TweakToggle label="Italic accent on headlines" value={t.italicHeadlines}
          onChange={(v) => setTweak('italicHeadlines', v)} />
        <TweakSection label="Chrome" />
        <TweakToggle label="Keyboard hints visible" value={t.showKbd}
          onChange={(v) => setTweak('showKbd', v)} />
      </TweaksPanel>
    </>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
