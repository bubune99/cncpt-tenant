// Atlas Analytics — chart primitives (inline SVG)
// All charts assume a parent with a sized container.
// They use viewBox so they scale to whatever they're put in.

// ─────────────────────────────────────────────
// Sparkline — small inline trend line
// ─────────────────────────────────────────────
function Sparkline({ data, color = 'var(--accent)', area = true, height = 28, animated = false }) {
  const w = 100, h = height;
  const max = Math.max(...data), min = Math.min(...data);
  const range = max - min || 1;
  const stepX = w / (data.length - 1);
  const points = data.map((v, i) => [i * stepX, h - ((v - min) / range) * (h - 4) - 2]);
  const linePath = 'M ' + points.map(p => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' L ');
  const areaPath = linePath + ` L ${w} ${h} L 0 ${h} Z`;
  const last = points[points.length - 1];
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      {area && <path d={areaPath} fill={color} fillOpacity="0.12" />}
      <path d={linePath} fill="none" stroke={color} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      <circle cx={last[0]} cy={last[1]} r="2" fill={color} />
    </svg>
  );
}

// ─────────────────────────────────────────────
// Line / area chart — full-size with axis labels
// ─────────────────────────────────────────────
function LineChart({ series, xLabels, yTicks, height = 200, area = true, dotted, showAxis = true, animated = false, padding = { t: 8, r: 8, b: 18, l: 28 } }) {
  // series: [{ name, color, data: [...] }, ...]
  // xLabels: array same length as data
  const w = 400, h = height;
  const p = padding;
  const innerW = w - p.l - p.r;
  const innerH = h - p.t - p.b;
  const allVals = series.flatMap(s => s.data);
  const max = Math.max(...allVals), min = 0; // anchor at 0
  const range = max - min || 1;
  const len = series[0].data.length;
  const stepX = innerW / (len - 1);

  const yTickVals = yTicks || [0, max * 0.25, max * 0.5, max * 0.75, max].map(v => Math.round(v));

  const pathFor = (d, asArea) => {
    const points = d.map((v, i) => [p.l + i * stepX, p.t + innerH - ((v - min) / range) * innerH]);
    const linePath = 'M ' + points.map(pt => `${pt[0].toFixed(1)} ${pt[1].toFixed(1)}`).join(' L ');
    if (!asArea) return linePath;
    return linePath + ` L ${p.l + innerW} ${p.t + innerH} L ${p.l} ${p.t + innerH} Z`;
  };

  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      {/* y gridlines */}
      {showAxis && yTickVals.map((v, i) => {
        const y = p.t + innerH - ((v - min) / range) * innerH;
        return (
          <g key={i}>
            <line x1={p.l} x2={p.l + innerW} y1={y} y2={y} className="chart-grid" />
            <text x={p.l - 4} y={y + 3} textAnchor="end" className="chart-axis">{v >= 1000 ? (v/1000).toFixed(1) + 'k' : v}</text>
          </g>
        );
      })}
      {/* x baseline */}
      {showAxis && <line x1={p.l} x2={p.l + innerW} y1={p.t + innerH} y2={p.t + innerH} className="chart-x-line" />}

      {/* areas */}
      {area && series.map((s, si) => (
        <path key={si} d={pathFor(s.data, true)} fill={s.color} fillOpacity={si === 0 ? 0.12 : 0.06} />
      ))}
      {/* lines */}
      {series.map((s, si) => (
        <path key={si} d={pathFor(s.data, false)}
          fill="none" stroke={s.color}
          strokeWidth="1.5" vectorEffect="non-scaling-stroke"
          strokeDasharray={dotted && si > 0 ? '3 3' : undefined}
        />
      ))}
      {/* x-axis labels */}
      {showAxis && xLabels.map((l, i) => {
        const skip = Math.ceil(xLabels.length / 6);
        if (i % skip !== 0 && i !== xLabels.length - 1) return null;
        return (
          <text key={i} x={p.l + i * stepX} y={h - 4} textAnchor="middle" className="chart-axis">{l}</text>
        );
      })}
    </svg>
  );
}

// ─────────────────────────────────────────────
// Bar chart — vertical, grouped or single series
// ─────────────────────────────────────────────
function BarChart({ data, xLabels, color = 'var(--accent)', height = 200, padding = { t: 8, r: 8, b: 18, l: 28 } }) {
  // data: [v1, v2, ...]
  const w = 400, h = height;
  const p = padding;
  const innerW = w - p.l - p.r;
  const innerH = h - p.t - p.b;
  const max = Math.max(...data);
  const barW = innerW / data.length;
  const gap = barW * 0.18;
  const yTicks = [0, Math.round(max * 0.5), max];

  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      {yTicks.map((v, i) => {
        const y = p.t + innerH - (v / max) * innerH;
        return (
          <g key={i}>
            <line x1={p.l} x2={p.l + innerW} y1={y} y2={y} className="chart-grid" />
            <text x={p.l - 4} y={y + 3} textAnchor="end" className="chart-axis">{v >= 1000 ? (v/1000).toFixed(1) + 'k' : v}</text>
          </g>
        );
      })}
      <line x1={p.l} x2={p.l + innerW} y1={p.t + innerH} y2={p.t + innerH} className="chart-x-line" />
      {data.map((v, i) => {
        const hh = (v / max) * innerH;
        return (
          <rect key={i}
            x={p.l + i * barW + gap / 2}
            y={p.t + innerH - hh}
            width={barW - gap}
            height={hh}
            fill={color}
            rx="1"
          />
        );
      })}
      {xLabels.map((l, i) => {
        const skip = Math.ceil(xLabels.length / 8);
        if (i % skip !== 0 && i !== xLabels.length - 1) return null;
        return (
          <text key={i} x={p.l + i * barW + barW / 2} y={h - 4} textAnchor="middle" className="chart-axis">{l}</text>
        );
      })}
    </svg>
  );
}

// ─────────────────────────────────────────────
// Donut — segmented circle
// ─────────────────────────────────────────────
function Donut({ segments, size = 140, stroke = 18 }) {
  // segments: [{ name, value, color }, ...]
  const total = segments.reduce((a, s) => a + s.value, 0);
  const r = (size / 2) - stroke / 2;
  const c = 2 * Math.PI * r;
  let acc = 0;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} style={{ width: '100%', height: '100%' }}>
      <circle cx={size/2} cy={size/2} r={r}
        fill="none" stroke="var(--paper-3)" strokeWidth={stroke} />
      {segments.map((s, i) => {
        const len = (s.value / total) * c;
        const dash = `${len} ${c - len}`;
        const offset = -acc;
        acc += len;
        return (
          <circle key={i}
            cx={size/2} cy={size/2} r={r}
            fill="none" stroke={s.color}
            strokeWidth={stroke}
            strokeDasharray={dash}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${size/2} ${size/2})`}
            strokeLinecap="butt"
          />
        );
      })}
    </svg>
  );
}

// ─────────────────────────────────────────────
// Mini chart icons for the widget palette
// ─────────────────────────────────────────────
function MiniLine() {
  return (
    <svg viewBox="0 0 60 28" style={{ width: '90%', height: '85%' }}>
      <path d="M 2 22 L 12 14 L 22 18 L 32 8 L 42 12 L 58 4"
        fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="58" cy="4" r="1.6" fill="currentColor" />
    </svg>
  );
}
function MiniArea() {
  return (
    <svg viewBox="0 0 60 28" style={{ width: '90%', height: '85%' }}>
      <path d="M 2 22 L 12 14 L 22 18 L 32 8 L 42 12 L 58 4 L 58 26 L 2 26 Z"
        fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}
function MiniBar() {
  return (
    <svg viewBox="0 0 60 28" style={{ width: '90%', height: '85%' }}>
      {[18, 10, 14, 6, 12, 4, 9].map((v, i) => (
        <rect key={i} x={2 + i * 8} y={26 - v} width="5" height={v} fill="currentColor" />
      ))}
    </svg>
  );
}
function MiniDonut() {
  return (
    <svg viewBox="0 0 28 28" style={{ width: '85%', height: '85%' }}>
      <circle cx="14" cy="14" r="9" fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="5" />
      <circle cx="14" cy="14" r="9" fill="none" stroke="currentColor" strokeWidth="5"
        strokeDasharray="30 60" transform="rotate(-90 14 14)" />
    </svg>
  );
}
function MiniKpi() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 2 }}>
      <div style={{ fontFamily: 'Spectral, serif', fontSize: 18, lineHeight: 1, color: 'currentColor' }}>$24k</div>
      <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 7, color: 'currentColor', opacity: .6, letterSpacing: '.08em' }}>+12%</div>
    </div>
  );
}
function MiniTable() {
  return (
    <svg viewBox="0 0 60 28" style={{ width: '90%', height: '85%' }}>
      {[6, 11, 16, 21].map((y, i) => (
        <g key={i}>
          <rect x="2" y={y} width="20" height="3" fill="currentColor" fillOpacity={i === 0 ? 0.5 : 0.25} />
          <rect x="26" y={y} width="14" height="3" fill="currentColor" fillOpacity={i === 0 ? 0.5 : 0.25} />
          <rect x="44" y={y} width="14" height="3" fill="currentColor" fillOpacity={i === 0 ? 0.5 : 0.25} />
        </g>
      ))}
    </svg>
  );
}
function MiniFunnel() {
  return (
    <svg viewBox="0 0 60 28" style={{ width: '90%', height: '85%' }}>
      <rect x="2" y="3"  width="56" height="4" fill="currentColor" fillOpacity="0.7" />
      <rect x="8" y="9"  width="44" height="4" fill="currentColor" fillOpacity="0.55" />
      <rect x="16" y="15" width="28" height="4" fill="currentColor" fillOpacity="0.4" />
      <rect x="22" y="21" width="16" height="4" fill="currentColor" fillOpacity="0.25" />
    </svg>
  );
}
function MiniFeed() {
  return (
    <svg viewBox="0 0 60 28" style={{ width: '90%', height: '85%' }}>
      {[4, 10, 16, 22].map((y, i) => (
        <g key={i}>
          <circle cx="6" cy={y + 2} r="1.5" fill="currentColor" />
          <rect x="12" y={y + 0.5} width={30 + i * 4} height="3" fill="currentColor" fillOpacity="0.4" />
        </g>
      ))}
    </svg>
  );
}
function MiniHeat() {
  return (
    <svg viewBox="0 0 60 28" style={{ width: '90%', height: '85%' }}>
      {[0, 1, 2, 3].map(r =>
        [0, 1, 2, 3, 4, 5, 6, 7].map(c => {
          const v = Math.abs(Math.sin(r * 1.7 + c * 0.9));
          return <rect key={r + '-' + c} x={2 + c * 7} y={2 + r * 6} width="6" height="5" fill="currentColor" fillOpacity={0.15 + v * 0.75} />;
        })
      )}
    </svg>
  );
}
function MiniMap() {
  return (
    <svg viewBox="0 0 60 28" style={{ width: '85%', height: '85%' }}>
      <path d="M 4 14 Q 12 4 24 8 T 44 6 Q 54 8 56 18 T 30 24 Q 14 22 4 14 Z"
        fill="currentColor" fillOpacity="0.18" stroke="currentColor" strokeWidth="1" />
      <circle cx="18" cy="13" r="1.5" fill="currentColor" />
      <circle cx="34" cy="11" r="2.5" fill="currentColor" />
      <circle cx="46" cy="16" r="1.8" fill="currentColor" />
    </svg>
  );
}

// ─────────────────────────────────────────────
// Shared demo data
// ─────────────────────────────────────────────
const ANALYTICS_DATA = {
  revenue30: [
    520, 480, 610, 690, 590, 720, 840, 760, 690, 880,
    920, 870, 980, 1040, 960, 880, 1120, 1180, 1080, 1240,
    1320, 1290, 1380, 1420, 1480, 1380, 1520, 1640, 1580, 1720,
  ],
  prevRevenue30: [
    420, 480, 510, 540, 520, 580, 620, 590, 540, 610,
    640, 680, 720, 740, 720, 760, 800, 780, 740, 820,
    860, 880, 900, 940, 960, 1020, 1080, 1100, 1080, 1140,
  ],
  ordersDays: [
    14, 12, 18, 22, 19, 24, 28, 24, 19, 28,
    32, 30, 36, 38, 34, 30, 41, 44, 38, 46,
    49, 47, 52, 54, 56, 52, 58, 62, 60, 66,
  ],
  channels: [
    { name: 'Direct',     value: 4820, color: '#1a1410', pct: 38 },
    { name: 'Newsletter', value: 3210, color: '#8b2c1f', pct: 25 },
    { name: 'Organic',    value: 2240, color: '#b58730', pct: 18 },
    { name: 'Social',     value: 1680, color: '#4f5e3a', pct: 13 },
    { name: 'Referral',   value:  860, color: '#2a4a73', pct:  6 },
  ],
  topProducts: [
    { name: 'Marigold quilted jacket', sku: 'JKT-MQ-*', units: 142, rev: 21016, pct: 100 },
    { name: 'Dahlia tee',              sku: 'SHIRT-DAH', units: 218, rev: 6976,  pct: 47 },
    { name: 'Marigold dye kit',        sku: 'KIT-DYE-MAR', units: 96, rev: 4608, pct: 32 },
    { name: 'Marigold dye field guide',sku: 'PDF-DYE-GUIDE', units: 218, rev: 5232, pct: 36 },
    { name: 'Indigo scarf',            sku: 'SCRF-IND', units: 64, rev: 3072,  pct: 21 },
    { name: 'Moss towel',              sku: 'TWL-MSS', units: 102, rev: 1836,  pct: 12 },
  ],
  funnel: [
    { label: 'Visits',       v: 12402, color: 's2', pct: 100 },
    { label: 'Product view', v:  6840, color: 's1', pct: 55 },
    { label: 'Add to cart',  v:  1420, color: 's3', pct: 12 },
    { label: 'Checkout',     v:   480, color: 's4', pct: 3.9 },
    { label: 'Purchase',     v:   228, color: 's5', pct: 1.84 },
  ],
  activity: [
    { kind: 'order',    text: 'Order #4827 · $158.00 · Marigold jacket M', when: '2m',  cls: 'moss' },
    { kind: 'order',    text: 'Order #4826 · $48.00 · Dye kit',           when: '5m',  cls: 'moss' },
    { kind: 'stock',    text: 'Marigold jacket M-MAR went out of stock',  when: '12m', cls: 'accent' },
    { kind: 'sign',     text: '4 new newsletter subscribers',             when: '18m', cls: 'gold' },
    { kind: 'order',    text: 'Order #4825 · $24.00 · Field guide PDF',   when: '24m', cls: 'moss' },
    { kind: 'review',   text: 'Sara L. left a 5★ review on Dahlia tee',   when: '38m', cls: 'ink' },
    { kind: 'order',    text: 'Order #4824 · $218 · Studio essentials box', when: '52m', cls: 'moss' },
  ],
  alerts: [
    { title: 'Marigold jacket · M-Marigold sold out', sub: '3rd time in 30d · 41 sold last batch', bar: '', cta: 'restock' },
    { title: 'Newsletter unsubscribes up 22%', sub: '412 in last 7d · vs 338 prior 7d', bar: 'gold', cta: 'investigate' },
    { title: '3 abandoned carts above $200', sub: 'Last 24h · total $846 · save & email?', bar: 'gold', cta: 'recover' },
    { title: 'Series 06 newsletter scheduled', sub: 'Sat 17 May 09:00 · 4,820 recipients', bar: 'moss', cta: 'review' },
  ],
  days: ['Apr 17','18','19','20','21','22','23','24','25','26','27','28','29','30','May 1','2','3','4','5','6','7','8','9','10','11','12','13','14','15','16'],
};

Object.assign(window, {
  Sparkline, LineChart, BarChart, Donut,
  MiniLine, MiniArea, MiniBar, MiniDonut, MiniKpi, MiniTable, MiniFunnel, MiniFeed, MiniHeat, MiniMap,
  ANALYTICS_DATA,
});
