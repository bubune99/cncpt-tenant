// Direction B · STAGE — Spatial canvas / live control room.
// Dark navy + dot grid + floating cards + cyan/amber accents + minimap.

const STAGE_W = 1240;
const STAGE_H = 820;

function StageChrome({ section, breadcrumb, children, liveCount }) {
  return (
    <div className="stage" style={{ width: STAGE_W, height: STAGE_H, position: 'relative', overflow: 'hidden' }}>
      {/* Top bar */}
      <header style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 44,
        display: 'flex', alignItems: 'center', padding: '0 18px',
        background: 'rgba(13,22,34,.85)', borderBottom: '1px solid rgba(232,226,210,.1)',
        backdropFilter: 'blur(8px)', zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 22, height: 22, background: '#4dd8ff', color: '#0d1622',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700, fontFamily: "'Geist Mono', monospace",
          }}>◆</div>
          <span className="mono" style={{ fontSize: 12, letterSpacing: '.08em' }}>STAGE</span>
          <span className="mono stage-dim" style={{ fontSize: 11 }}>·</span>
          <span className="mono stage-dim" style={{ fontSize: 12 }}>{breadcrumb}</span>
        </div>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'rgba(232,226,210,.07)', padding: '5px 14px', borderRadius: 999,
            border: '1px solid rgba(232,226,210,.12)', width: 340,
          }}>
            <span className="mono stage-dim" style={{ fontSize: 12 }}>⌘K</span>
            <span className="mono stage-dim" style={{ fontSize: 12 }}>Jump, search, or run a command…</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span className="mono" style={{ fontSize: 11, color: '#4dd8ff', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 6, height: 6, background: '#4dd8ff', borderRadius: '50%', boxShadow: '0 0 6px #4dd8ff' }}></span>
            LIVE · {liveCount || '47 viewers'}
          </span>
          <div style={{
            width: 26, height: 26, borderRadius: '50%', background: '#ffc54a', color: '#0d1622',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700,
          }}>MC</div>
        </div>
      </header>

      {/* Left dock */}
      <aside style={{
        position: 'absolute', top: 44, bottom: 0, left: 0, width: 56,
        borderRight: '1px solid rgba(232,226,210,.1)',
        display: 'flex', flexDirection: 'column', padding: '14px 0', gap: 4, alignItems: 'center',
      }}>
        {[
          ['◎', 'Stage', 'dashboard'],
          ['◫', 'Pages', 'pages'],
          ['◊', 'Orders', 'orders'],
          ['▢', 'Products', 'products'],
          ['◯', 'People', 'customers'],
          ['☷', 'Journal', 'blog'],
          ['◳', 'Pulse', 'analytics'],
          ['⚙', 'Setup', 'settings'],
        ].map(([icon, label, key]) => (
          <div key={key} title={label} style={{
            width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16,
            background: key === section ? 'rgba(77,216,255,.15)' : 'transparent',
            border: key === section ? '1px solid rgba(77,216,255,.4)' : '1px solid transparent',
            color: key === section ? '#4dd8ff' : 'rgba(232,226,210,.55)',
            borderRadius: 8,
          }}>{icon}</div>
        ))}
      </aside>

      {/* Canvas area */}
      <main style={{ position: 'absolute', top: 44, left: 56, right: 0, bottom: 0, overflow: 'hidden' }}>
        {children}
      </main>

      {/* Minimap */}
      <div style={{
        position: 'absolute', bottom: 14, right: 14,
        width: 140, height: 88,
        background: 'rgba(13,22,34,.9)', border: '1px solid rgba(232,226,210,.18)', borderRadius: 8,
        padding: 6, zIndex: 5,
      }}>
        <div className="mono stage-dim" style={{ fontSize: 9, letterSpacing: '.1em', marginBottom: 4 }}>MINIMAP</div>
        <svg viewBox="0 0 130 65" style={{ width: '100%', height: 65 }}>
          <rect x="6" y="6" width="36" height="22" fill="rgba(77,216,255,.18)" stroke="#4dd8ff" strokeWidth=".5" />
          <rect x="48" y="6" width="28" height="14" fill="rgba(255,197,74,.18)" stroke="#ffc54a" strokeWidth=".5" />
          <rect x="80" y="6" width="44" height="34" fill="rgba(232,226,210,.08)" stroke="rgba(232,226,210,.4)" strokeWidth=".5" />
          <rect x="6" y="34" width="24" height="22" fill="rgba(232,226,210,.08)" stroke="rgba(232,226,210,.4)" strokeWidth=".5" />
          <rect x="36" y="26" width="38" height="32" fill="rgba(232,226,210,.08)" stroke="rgba(232,226,210,.4)" strokeWidth=".5" />
          <rect x="78" y="44" width="46" height="14" fill="rgba(232,226,210,.08)" stroke="rgba(232,226,210,.4)" strokeWidth=".5" />
          {/* viewport */}
          <rect x="4" y="4" width="60" height="40" fill="none" stroke="#4dd8ff" strokeWidth="1" />
        </svg>
      </div>

      {/* Bottom-left zoom controls */}
      <div style={{
        position: 'absolute', bottom: 14, left: 70,
        display: 'flex', gap: 0, background: 'rgba(13,22,34,.9)',
        border: '1px solid rgba(232,226,210,.18)', borderRadius: 8, overflow: 'hidden', zIndex: 5,
      }}>
        {['−', '100%', '+', '⊡'].map((c, i) => (
          <div key={i} className="mono" style={{
            padding: '4px 10px', fontSize: 12,
            borderRight: i < 3 ? '1px solid rgba(232,226,210,.12)' : 'none',
            color: 'rgba(232,226,210,.7)',
          }}>{c}</div>
        ))}
      </div>
    </div>
  );
}

// Floating card primitive
function StageFloatingCard({ x, y, w, h, children, variant = 'default', label, badge }) {
  const cls = variant === 'warm' ? 'stage-card-warm' : variant === 'cyan' ? 'stage-card-cyan' : 'stage-card';
  return (
    <div className={cls} style={{
      position: 'absolute', left: x, top: y, width: w, height: h, padding: 14, overflow: 'hidden',
    }}>
      {(label || badge) && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          {label && <div className="mono" style={{ fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(232,226,210,.55)' }}>{label}</div>}
          {badge}
        </div>
      )}
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// 01 · DASHBOARD — Control room
// ═══════════════════════════════════════════════════════════
function StageDashboard() {
  return (
    <StageChrome section="dashboard" breadcrumb="Stage / Today" liveCount="47 viewers · 3 in cart">
      {/* Big revenue card */}
      <StageFloatingCard x={20} y={20} w={360} h={170} label="REV · TODAY" variant="cyan"
        badge={<span className="stage-pill">live</span>}>
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 58, fontWeight: 600, letterSpacing: '-0.03em', lineHeight: 1 }}>
          $4,820<span className="stage-dim" style={{ fontSize: 22 }}>.40</span>
        </div>
        <div className="mono stage-cyan" style={{ fontSize: 12, marginTop: 6 }}>▲ +18% vs Tuesday last week</div>
        <svg viewBox="0 0 320 50" style={{ width: '100%', height: 50, marginTop: 4 }}>
          <path d="M0,40 L40,35 L80,28 L120,32 L160,18 L200,22 L240,12 L280,18 L320,8" fill="none" stroke="#4dd8ff" strokeWidth="1.5" />
          <circle cx="320" cy="8" r="3" fill="#4dd8ff" />
        </svg>
      </StageFloatingCard>

      {/* Orders queue */}
      <StageFloatingCard x={400} y={20} w={290} h={290} label="ORDERS / QUEUE"
        badge={<span className="stage-pill-amber">12 NEW</span>}>
        {[
          ['#4821', 'Maya R.', '$48', 'NEW', '#ffc54a', '4m ago'],
          ['#4820', 'Edwin L.', '$112', 'PAID', '#4dd8ff', '21m'],
          ['#4819', 'Sun-Hee', '$74', 'PACKED', '', '2h'],
          ['#4818', 'Theo M.', '$192', 'SHIP', '', '5h'],
          ['#4817', 'Léa B.', '$58', 'SHIP', '', '8h'],
        ].map(([id, who, amt, st, color, ago], i) => (
          <div key={i} style={{
            display: 'grid', gridTemplateColumns: '46px 1fr auto auto',
            gap: 8, padding: '7px 0', alignItems: 'center',
            borderBottom: i < 4 ? '1px solid rgba(232,226,210,.08)' : 'none',
          }}>
            <span className="mono stage-dim" style={{ fontSize: 11 }}>{id}</span>
            <span style={{ fontSize: 13 }}>{who}</span>
            <span className="mono" style={{ fontSize: 12 }}>{amt}</span>
            <span className="mono" style={{ fontSize: 10, color: color || 'rgba(232,226,210,.5)' }}>{st}</span>
          </div>
        ))}
      </StageFloatingCard>

      {/* Live storefront */}
      <StageFloatingCard x={710} y={20} w={460} h={170} label="STOREFRONT · LIVE">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ flex: 1 }}>
            <div className="mono stage-dim" style={{ fontSize: 11 }}>RIGHT NOW</div>
            <div style={{ fontSize: 48, fontWeight: 600, fontFamily: "'Space Grotesk', sans-serif", lineHeight: 1 }}>47</div>
            <div className="mono stage-cyan" style={{ fontSize: 12 }}>viewers · 3 in cart · 1 checking out</div>
          </div>
          <div style={{ flex: 1.4, padding: '6px 0' }}>
            {[
              ['/shop/dahlia-tee', 14, 'M-size only'],
              ['/shop/marigold-cap', 9, ''],
              ['/posts/dye-pot', 7, 'on featured'],
              ['/shop', 5, ''],
            ].map(([p, n, note], i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, padding: '3px 0', fontSize: 11 }} className="mono">
                <div>{p} {note && <span className="stage-amber">· {note}</span>}</div>
                <div>{n}</div>
              </div>
            ))}
          </div>
        </div>
      </StageFloatingCard>

      {/* Things on your plate */}
      <StageFloatingCard x={710} y={210} w={220} h={300} label="ON YOUR PLATE" variant="warm">
        <div style={{ fontSize: 56, fontWeight: 600, fontFamily: "'Space Grotesk', sans-serif", lineHeight: 1 }}>5</div>
        <div className="mono stage-amber" style={{ fontSize: 11, marginBottom: 12 }}>actions today</div>
        {[
          ['● Restock dahlia tee M', 'urgent'],
          ['● Approve newsletter draft', 'today'],
          ['● Pack #4821, #4820', 'today'],
          ['● Reply customer #cs-22', '19h old'],
          ['● Review Demetrius post', 'review'],
        ].map(([t, when], i) => (
          <div key={i} style={{ padding: '4px 0', fontSize: 11, lineHeight: 1.4 }}>
            <div>{t}</div>
            <div className="mono stage-amber" style={{ fontSize: 10, marginLeft: 10 }}>{when}</div>
          </div>
        ))}
      </StageFloatingCard>

      {/* Best sellers heatcard */}
      <StageFloatingCard x={940} y={210} w={230} h={300} label="HOT · 7D">
        {[
          ['Dahlia tee', 42, '$1,344', '#ff5b22'],
          ['Marigold cap', 28, '$453', '#ffc54a'],
          ['Indigo scarf', 14, '$672', '#4dd8ff'],
          ['Ash totebag', 11, '$308', 'rgba(232,226,210,.4)'],
        ].map(([name, qty, rev, col], i) => (
          <div key={i} style={{ padding: '8px 0', borderBottom: i < 3 ? '1px solid rgba(232,226,210,.08)' : 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12 }}>{name}</span>
              <span className="mono" style={{ fontSize: 11 }}>{rev}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <div style={{ flex: 1, height: 3, background: 'rgba(232,226,210,.08)' }}>
                <div style={{ width: (qty / 42) * 100 + '%', height: 3, background: col }}></div>
              </div>
              <span className="mono stage-dim" style={{ fontSize: 10 }}>{qty} sold</span>
            </div>
          </div>
        ))}
      </StageFloatingCard>

      {/* Stock alert */}
      <StageFloatingCard x={20} y={210} w={360} h={150}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span style={{ width: 8, height: 8, background: '#ff5b22', borderRadius: '50%', boxShadow: '0 0 6px #ff5b22' }}></span>
          <div className="mono" style={{ fontSize: 11, color: '#ff5b22', letterSpacing: '.1em' }}>STOCK ALERT</div>
        </div>
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 22, fontWeight: 500, lineHeight: 1.2 }}>
          Dahlia tee · M sold out — <span className="stage-amber">3rd time this month</span>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button style={{ padding: '6px 12px', background: '#4dd8ff', color: '#0d1622', border: 'none', fontFamily: 'inherit', fontWeight: 600, fontSize: 11, letterSpacing: '.05em' }}>RESTOCK · 50</button>
          <button style={{ padding: '6px 12px', background: 'transparent', color: '#e8e2d2', border: '1px solid rgba(232,226,210,.3)', fontFamily: 'inherit', fontSize: 11 }}>Hide variant</button>
          <button style={{ padding: '6px 12px', background: 'transparent', color: '#e8e2d2', border: '1px solid rgba(232,226,210,.3)', fontFamily: 'inherit', fontSize: 11 }}>Snooze</button>
        </div>
      </StageFloatingCard>

      {/* Drafts breathing */}
      <StageFloatingCard x={20} y={380} w={360} h={150} label="DRAFTS BREATHING">
        {[
          ['Notes from the dye-pot', 'Marisol', 92],
          ['How we photograph a tee', 'Léa', 67],
          ['Field report: Lagos', 'Demetrius', 41],
        ].map(([t, who, pct], i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 50px 60px', gap: 8, padding: '6px 0', alignItems: 'center', fontSize: 12 }}>
            <div>{t} <span className="stage-dim" style={{ fontSize: 11 }}>· {who}</span></div>
            <div style={{ height: 3, background: 'rgba(232,226,210,.1)' }}>
              <div style={{ height: 3, width: pct + '%', background: '#4dd8ff' }}></div>
            </div>
            <div className="mono stage-cyan" style={{ fontSize: 10 }}>{pct}%</div>
          </div>
        ))}
      </StageFloatingCard>

      {/* Spatial annotation note */}
      <div style={{
        position: 'absolute', left: 400, top: 350, width: 280,
        fontFamily: "'Caveat', cursive", color: '#ffc54a', fontSize: 22, transform: 'rotate(-2deg)',
        opacity: .85,
      }}>
        ← drag any card to rearrange
      </div>
      <svg style={{ position: 'absolute', left: 405, top: 320, width: 80, height: 40 }}>
        <path d="M0,30 Q30,10 70,5" fill="none" stroke="#ffc54a" strokeWidth="1.5" />
        <path d="M65,3 L72,5 L67,11" fill="none" stroke="#ffc54a" strokeWidth="1.5" />
      </svg>
    </StageChrome>
  );
}

// ═══════════════════════════════════════════════════════════
// 02 · PAGES — Site graph
// ═══════════════════════════════════════════════════════════
function StagePagesIndex() {
  // Node positions: a sitemap as a graph
  const nodes = [
    { id: 'home', label: '/', title: 'Home', x: 580, y: 80, primary: true },
    { id: 'about', label: '/about', title: 'About', x: 250, y: 200 },
    { id: 'contact', label: '/contact', title: 'Contact', x: 90, y: 320 },
    { id: 'studio', label: '/studio-rentals', title: 'Studio rentals', x: 130, y: 460, draft: true },
    { id: 'shop', label: '/shop', title: 'Shop', x: 580, y: 240, hot: true },
    { id: 'cats', label: '/categories', title: 'Categories', x: 460, y: 380 },
    { id: 'events', label: '/events-rentals', title: 'Events & rentals', x: 710, y: 380 },
    { id: 'blog', label: '/posts', title: 'Blog index', x: 920, y: 240 },
    { id: 'demo', label: '/demo-animation', title: 'Animation demo', x: 980, y: 400, draft: true },
    { id: 'privacy', label: '/legal/privacy', title: 'Privacy', x: 300, y: 600 },
    { id: 'terms', label: '/legal/terms', title: 'Terms', x: 470, y: 600 },
    { id: 'faqs', label: '/faqs', title: 'FAQs', x: 760, y: 580 },
  ];
  const edges = [
    ['home', 'about'], ['home', 'shop'], ['home', 'blog'], ['home', 'contact'],
    ['about', 'studio'], ['contact', 'studio'],
    ['shop', 'cats'], ['shop', 'events'],
    ['blog', 'demo'],
    ['home', 'privacy'], ['home', 'terms'], ['home', 'faqs'],
  ];
  const byId = Object.fromEntries(nodes.map(n => [n.id, n]));

  return (
    <StageChrome section="pages" breadcrumb="Pages / Sitemap view">
      {/* Header bar */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '14px 22px 0' }}>
        <div>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 28, fontWeight: 600, margin: 0, letterSpacing: '-0.02em' }}>
            Sitemap <span className="stage-cyan">·</span> <span className="stage-dim" style={{ fontWeight: 400 }}>12 pages, 11 published</span>
          </h1>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {['Graph', 'List', 'Tree'].map((t, i) => (
            <span key={t} className="mono" style={{
              fontSize: 11, padding: '4px 10px', borderRadius: 4,
              background: i === 0 ? 'rgba(77,216,255,.15)' : 'transparent',
              color: i === 0 ? '#4dd8ff' : 'rgba(232,226,210,.55)',
              border: i === 0 ? '1px solid rgba(77,216,255,.3)' : '1px solid rgba(232,226,210,.12)',
            }}>{t}</span>
          ))}
          <button style={{ background: '#4dd8ff', color: '#0d1622', border: 'none', padding: '5px 12px', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 12, letterSpacing: '.05em' }}>+ NEW PAGE</button>
        </div>
      </div>

      {/* Graph canvas */}
      <svg style={{ position: 'absolute', left: 0, top: 60, width: '100%', height: '100%' }}>
        {edges.map(([from, to], i) => {
          const f = byId[from], t = byId[to];
          return <line key={i} x1={f.x} y1={f.y} x2={t.x} y2={t.y} stroke="rgba(232,226,210,.18)" strokeWidth="1" strokeDasharray={t.draft ? '4 4' : ''} />;
        })}
      </svg>

      {nodes.map((n) => (
        <div key={n.id} style={{
          position: 'absolute', left: n.x - 80, top: n.y + 60 - 26, width: 160,
          background: n.primary ? 'rgba(77,216,255,.12)' : n.hot ? 'rgba(255,197,74,.1)' : 'rgba(20,32,50,.92)',
          border: n.primary ? '1px solid #4dd8ff'
            : n.draft ? '1px dashed rgba(232,226,210,.45)'
            : n.hot ? '1px solid rgba(255,197,74,.5)'
            : '1px solid rgba(232,226,210,.18)',
          borderRadius: 10, padding: '8px 10px',
        }}>
          <div className="mono stage-dim" style={{ fontSize: 9, letterSpacing: '.05em' }}>{n.label}</div>
          <div style={{ fontSize: 13, fontWeight: 500, fontFamily: "'Space Grotesk', sans-serif", marginTop: 1 }}>
            {n.title}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            <span className="mono" style={{ fontSize: 9, color: n.draft ? '#ffc54a' : n.hot ? '#ffc54a' : '#4dd8ff' }}>
              {n.draft ? '◌ DRAFT' : n.hot ? '◉ HOT · 412/d' : '● LIVE'}
            </span>
            {n.primary && <span className="mono stage-dim" style={{ fontSize: 9 }}>HOME</span>}
          </div>
        </div>
      ))}

      {/* Legend / right panel */}
      <div style={{ position: 'absolute', right: 170, top: 80, width: 200 }}>
        <div className="stage-card" style={{ padding: 12 }}>
          <div className="mono stage-dim" style={{ fontSize: 10, letterSpacing: '.12em', marginBottom: 8 }}>FILTER</div>
          {[
            ['● Published', 11, '#4dd8ff'],
            ['◌ Drafts', 1, '#ffc54a'],
            ['◉ Hot pages', 1, '#ffc54a'],
            ['⚠ Broken links', 0, '#ff5b22'],
          ].map(([k, n, c], i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 12 }}>
              <span style={{ color: c }}>{k}</span><span className="mono stage-dim">{n}</span>
            </div>
          ))}
        </div>
      </div>
    </StageChrome>
  );
}

// ═══════════════════════════════════════════════════════════
// 03 · ORDERS — Spatial board with status zones
// ═══════════════════════════════════════════════════════════
function StageOrders() {
  const lanes = [
    { title: 'NEW', count: 12, color: '#ffc54a', x: 16,
      cards: [
        { id: '#4821', who: 'Maya Rodriguez', amt: '$48.20', items: 2, age: '4m', flag: 'M-tee' },
        { id: '#4820', who: 'Edwin Lacroix', amt: '$112.00', items: 3, age: '21m' },
        { id: '#4819', who: 'Sun-Hee Park', amt: '$74.50', items: 2, age: '2h' },
      ]},
    { title: 'PACKED', count: 8, color: '#4dd8ff', x: 292,
      cards: [
        { id: '#4818', who: 'Theo Mensah', amt: '$192.40', items: 4, age: '5h', flag: 'expedite' },
        { id: '#4815', who: 'Aria Singh', amt: '$66.00', items: 2, age: '7h' },
        { id: '#4814', who: 'Owen Pham', amt: '$28.00', items: 1, age: '9h' },
      ]},
    { title: 'SHIPPED', count: 19, color: 'rgba(232,226,210,.5)', x: 568,
      cards: [
        { id: '#4817', who: 'Léa Bourgeois', amt: '$58.00', items: 2, age: 'yesterday', tracking: 'DHL · 3 days' },
        { id: '#4812', who: 'Jonas Berg', amt: '$220.00', items: 5, age: '14 May', tracking: 'USPS · in transit' },
      ]},
    { title: 'ISSUE', count: 2, color: '#ff5b22', x: 844,
      cards: [
        { id: '#4816', who: 'Ivy Tanaka', amt: '$220.00', items: 4, age: '14 May', flag: 'RETURN' },
        { id: '#4811', who: 'Sasha Volkov', amt: '$96.00', items: 2, age: '12 May', flag: 'ADDR FAIL' },
      ]},
  ];

  return (
    <StageChrome section="orders" breadcrumb="Orders / Board" liveCount="3 placed in last 10m">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '14px 22px 6px' }}>
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 28, fontWeight: 600, margin: 0, letterSpacing: '-0.02em' }}>
          Orders <span className="stage-dim" style={{ fontSize: 16, fontWeight: 400 }}>· this week · 41 of 94 fulfilled</span>
        </h1>
        <div style={{ display: 'flex', gap: 6 }}>
          {['Board', 'Ledger', 'Map'].map((t, i) => (
            <span key={t} className="mono" style={{
              fontSize: 11, padding: '4px 10px',
              background: i === 0 ? 'rgba(77,216,255,.15)' : 'transparent',
              color: i === 0 ? '#4dd8ff' : 'rgba(232,226,210,.55)',
              border: '1px solid ' + (i === 0 ? 'rgba(77,216,255,.3)' : 'rgba(232,226,210,.12)'),
              borderRadius: 4,
            }}>{t}</span>
          ))}
        </div>
      </div>

      {/* Lanes */}
      {lanes.map((lane) => (
        <div key={lane.title} style={{ position: 'absolute', top: 70, left: lane.x, width: 260, bottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 4px 8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 8, height: 8, background: lane.color, borderRadius: '50%', boxShadow: `0 0 6px ${lane.color}` }}></span>
              <span className="mono" style={{ fontSize: 12, letterSpacing: '.1em', color: lane.color }}>{lane.title}</span>
              <span className="mono stage-dim" style={{ fontSize: 11 }}>{lane.count}</span>
            </div>
            <span className="mono stage-dim" style={{ fontSize: 14 }}>＋</span>
          </div>
          <div style={{ borderTop: `1px solid ${lane.color}`, opacity: .35 }}></div>
          <div style={{ padding: '10px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {lane.cards.map((c) => (
              <div key={c.id} className="stage-card" style={{ padding: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <div className="mono" style={{ fontSize: 11, color: lane.color }}>{c.id}</div>
                  <div className="mono stage-dim" style={{ fontSize: 10 }}>{c.age}</div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 500, marginTop: 4 }}>{c.who}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                  <span className="stage-dim" style={{ fontSize: 11 }}>{c.items} items</span>
                  <span className="mono" style={{ fontSize: 11 }}>{c.amt}</span>
                </div>
                {c.flag && (
                  <div className="mono" style={{ fontSize: 9, color: '#ff5b22', marginTop: 6, letterSpacing: '.05em' }}>
                    ⚑ {c.flag}
                  </div>
                )}
                {c.tracking && (
                  <div className="mono stage-dim" style={{ fontSize: 9, marginTop: 6 }}>↗ {c.tracking}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Floating peek */}
      <div className="stage-card-cyan" style={{
        position: 'absolute', bottom: 110, right: 170, width: 260, padding: 14,
      }}>
        <div className="mono stage-cyan" style={{ fontSize: 10, letterSpacing: '.12em', marginBottom: 6 }}>PEEK · #4821</div>
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 600 }}>Maya Rodriguez</div>
        <div className="stage-dim" style={{ fontSize: 12 }}>Brooklyn NY · placed 09:14 EST</div>
        <div style={{ borderTop: '1px solid rgba(232,226,210,.15)', marginTop: 8, paddingTop: 8 }}>
          {[['Dahlia tee · M', '$32.00'], ['Marigold cap', '$16.20']].map(([k, v], i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '2px 0' }}>
              <span>{k}</span><span className="mono">{v}</span>
            </div>
          ))}
        </div>
        <button style={{ width: '100%', marginTop: 10, background: '#4dd8ff', color: '#0d1622', border: 'none', padding: '7px', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 12, letterSpacing: '.05em' }}>PACK & SHIP →</button>
      </div>
    </StageChrome>
  );
}

// ═══════════════════════════════════════════════════════════
// 04 · PRODUCTS — Floating catalog with peek editor
// ═══════════════════════════════════════════════════════════
function StageProducts() {
  const products = [
    { name: 'Dahlia tee', price: '$32', color: '#c8443a', stock: 18, x: 16, y: 0, sel: true },
    { name: 'Marigold cap', price: '$16.20', color: '#e7a23b', stock: 22, x: 200, y: 20 },
    { name: 'Indigo scarf', price: '$48', color: '#3a4a8b', stock: 7, x: 380, y: 0 },
    { name: 'Ash totebag', price: '$28', color: '#88857a', stock: 41, x: 16, y: 220 },
    { name: 'Bone mug', price: '$22', color: '#e6dbc7', stock: 4, x: 200, y: 240 },
    { name: 'Linen apron', price: '$54', color: '#c4b8a0', stock: 12, x: 380, y: 220 },
  ];

  return (
    <StageChrome section="products" breadcrumb="Products / Catalog">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '14px 22px 8px' }}>
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 28, fontWeight: 600, margin: 0, letterSpacing: '-0.02em' }}>
          Catalog <span className="stage-dim" style={{ fontSize: 16, fontWeight: 400 }}>· 104 SKUs · 6 on the table</span>
        </h1>
        <button style={{ background: '#4dd8ff', color: '#0d1622', border: 'none', padding: '6px 14px', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 12, letterSpacing: '.05em' }}>+ NEW PRODUCT</button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 14, padding: '0 22px 8px', borderBottom: '1px solid rgba(232,226,210,.08)' }}>
        {['All · 104', 'Apparel · 38', 'Accessories · 24', 'Home goods · 18', 'Low stock · 7'].map((t, i) => (
          <span key={t} className="mono" style={{
            fontSize: 11, padding: '6px 0', borderBottom: i === 0 ? '2px solid #4dd8ff' : 'none',
            color: i === 0 ? '#4dd8ff' : i === 4 ? '#ff5b22' : 'rgba(232,226,210,.55)',
          }}>{t}</span>
        ))}
      </div>

      {/* Product grid */}
      <div style={{ position: 'absolute', top: 110, left: 22, width: 580, height: 420 }}>
        {products.map((p, i) => (
          <div key={p.name} className={p.sel ? 'stage-card-cyan' : 'stage-card'} style={{
            position: 'absolute', left: p.x, top: p.y, width: 170, height: 200,
            padding: 0, overflow: 'hidden',
          }}>
            <div style={{ height: 100, background: p.color, position: 'relative' }}>
              {p.stock < 10 && (
                <span style={{
                  position: 'absolute', top: 8, right: 8,
                  fontFamily: "'Geist Mono', monospace", fontSize: 9,
                  background: '#ff5b22', color: '#fafaf7', padding: '2px 6px',
                  letterSpacing: '.05em',
                }}>LOW · {p.stock}</span>
              )}
              {p.sel && (
                <span style={{
                  position: 'absolute', bottom: 8, left: 8,
                  fontFamily: "'Geist Mono', monospace", fontSize: 9,
                  background: '#4dd8ff', color: '#0d1622', padding: '2px 6px',
                  letterSpacing: '.05em',
                }}>SELECTED</span>
              )}
            </div>
            <div style={{ padding: '10px 12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 600 }}>{p.name}</div>
                <div className="mono" style={{ fontSize: 13, color: '#ffc54a' }}>{p.price}</div>
              </div>
              <div className="mono stage-dim" style={{ fontSize: 10, marginTop: 4 }}>
                {p.stock} in stock
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Peek editor for selected product */}
      <div className="stage-card" style={{
        position: 'absolute', top: 110, right: 170, width: 290, padding: 14, maxHeight: 430,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div className="mono stage-cyan" style={{ fontSize: 10, letterSpacing: '.12em' }}>EDIT · DAHLIA TEE</div>
          <span className="mono stage-dim" style={{ fontSize: 10 }}>SHIRT-DAH-M</span>
        </div>
        <div style={{ height: 70, background: '#c8443a', marginTop: 8 }}></div>

        <div style={{ marginTop: 10, fontSize: 12 }}>
          <div style={{ padding: '6px 0', borderBottom: '1px solid rgba(232,226,210,.1)', display: 'flex', justifyContent: 'space-between' }}>
            <span className="stage-dim">Title</span><span>Dahlia tee</span>
          </div>
          <div style={{ padding: '6px 0', borderBottom: '1px solid rgba(232,226,210,.1)', display: 'flex', justifyContent: 'space-between' }}>
            <span className="stage-dim">Price</span><span className="mono">$32.00</span>
          </div>
          <div style={{ padding: '6px 0', borderBottom: '1px solid rgba(232,226,210,.1)' }}>
            <div className="stage-dim" style={{ marginBottom: 4 }}>Variants</div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {[['M', 0, true], ['L', 6], ['XL', 12]].map(([s, q, oos], i) => (
                <span key={i} className="mono" style={{
                  fontSize: 10, padding: '3px 8px',
                  background: oos ? 'rgba(255,91,34,.15)' : 'rgba(232,226,210,.06)',
                  border: '1px solid ' + (oos ? '#ff5b22' : 'rgba(232,226,210,.18)'),
                  color: oos ? '#ff5b22' : '#e8e2d2',
                }}>{s} · {q}{oos && ' OOS'}</span>
              ))}
            </div>
          </div>
          <div style={{ padding: '6px 0', borderBottom: '1px solid rgba(232,226,210,.1)', display: 'flex', justifyContent: 'space-between' }}>
            <span className="stage-dim">Category</span><span>Apparel / Tees</span>
          </div>
          <div style={{ padding: '6px 0' }}>
            <div className="stage-dim">7-day pulse</div>
            <svg viewBox="0 0 240 24" style={{ width: '100%', marginTop: 2 }}>
              <path d="M0,20 L34,18 L68,14 L102,16 L136,8 L170,10 L204,4 L240,2" fill="none" stroke="#4dd8ff" strokeWidth="1.2" />
            </svg>
            <div className="mono" style={{ fontSize: 10, marginTop: 2 }}>
              <span className="stage-cyan">+42 sold · $1,344</span>
            </div>
          </div>
        </div>
      </div>
    </StageChrome>
  );
}

// ═══════════════════════════════════════════════════════════
// 05 · CUSTOMERS — Spatial clusters / cohorts
// ═══════════════════════════════════════════════════════════
function StageCustomers() {
  // Customers laid out in a 2D space: x = frequency, y = recency (or simulated)
  const cust = [
    { init: 'SP', name: 'Sun-Hee P.', x: 720, y: 100, size: 64, val: 1140, orders: 22, cohort: 'vip' },
    { init: 'IT', name: 'Ivy T.',     x: 590, y: 160, size: 56, val: 880,  orders: 18, cohort: 'vip' },
    { init: 'MR', name: 'Maya R.',    x: 460, y: 220, size: 48, val: 612,  orders: 14, cohort: 'loyal' },
    { init: 'EL', name: 'Edwin L.',   x: 340, y: 280, size: 40, val: 418,  orders: 9,  cohort: 'loyal' },
    { init: 'TM', name: 'Theo M.',    x: 220, y: 360, size: 32, val: 348,  orders: 6,  cohort: 'reg' },
    { init: 'DO', name: 'Demetrius',  x: 180, y: 440, size: 28, val: 192,  orders: 4,  cohort: 'reg' },
    { init: 'LB', name: 'Léa B.',     x: 100, y: 480, size: 24, val: 108,  orders: 3,  cohort: 'new' },
    { init: 'JN', name: 'Jonas N.',   x: 60,  y: 380, size: 22, val: 76,   orders: 2,  cohort: 'new' },
  ];
  const colorFor = (c) => c === 'vip' ? '#ffc54a' : c === 'loyal' ? '#4dd8ff' : c === 'reg' ? '#e8e2d2' : 'rgba(232,226,210,.45)';

  return (
    <StageChrome section="customers" breadcrumb="People / Cohort map">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '14px 22px 6px' }}>
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 28, fontWeight: 600, margin: 0, letterSpacing: '-0.02em' }}>
          People <span className="stage-dim" style={{ fontSize: 16, fontWeight: 400 }}>· 2,847 on the books · plotted by spend × frequency</span>
        </h1>
        <div style={{ display: 'flex', gap: 6 }}>
          {['Map', 'Cards', 'List'].map((t, i) => (
            <span key={t} className="mono" style={{
              fontSize: 11, padding: '4px 10px', borderRadius: 4,
              background: i === 0 ? 'rgba(77,216,255,.15)' : 'transparent',
              color: i === 0 ? '#4dd8ff' : 'rgba(232,226,210,.55)',
              border: '1px solid ' + (i === 0 ? 'rgba(77,216,255,.3)' : 'rgba(232,226,210,.12)'),
            }}>{t}</span>
          ))}
        </div>
      </div>

      {/* Axes labels */}
      <div style={{ position: 'absolute', left: 28, bottom: 100, transform: 'rotate(-90deg)', transformOrigin: 'left bottom' }} className="mono stage-dim">
        SPEND ↑
      </div>
      <div style={{ position: 'absolute', left: '50%', bottom: 22 }} className="mono stage-dim">
        FREQUENCY →
      </div>

      {/* Quadrants */}
      <svg style={{ position: 'absolute', left: 50, top: 70, width: 800, height: 540 }}>
        <line x1="0" x2="800" y1="270" y2="270" stroke="rgba(232,226,210,.08)" strokeDasharray="2 4" />
        <line x1="400" x2="400" y1="0" y2="540" stroke="rgba(232,226,210,.08)" strokeDasharray="2 4" />
        <text x="608" y="40" className="mono" fill="rgba(255,197,74,.6)" fontSize="10" letterSpacing="2">★ VIP</text>
        <text x="40" y="40" className="mono" fill="rgba(77,216,255,.6)" fontSize="10" letterSpacing="2">NEW HIGH-SPEND</text>
        <text x="608" y="510" className="mono" fill="rgba(232,226,210,.4)" fontSize="10" letterSpacing="2">REGULARS</text>
        <text x="40" y="510" className="mono" fill="rgba(232,226,210,.35)" fontSize="10" letterSpacing="2">NEW / DORMANT</text>
      </svg>

      {/* Bubble plot */}
      {cust.map((c, i) => (
        <div key={i} style={{
          position: 'absolute', left: 50 + c.x - c.size / 2, top: 70 + c.y - c.size / 2,
          width: c.size, height: c.size, borderRadius: '50%',
          background: `radial-gradient(circle at 30% 30%, ${colorFor(c.cohort)}, ${colorFor(c.cohort)}40 65%, transparent)`,
          border: `1px solid ${colorFor(c.cohort)}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: "'Geist Mono', monospace", fontSize: c.size > 40 ? 13 : 11, color: '#0d1622',
          fontWeight: 600,
        }}>
          {c.init}
        </div>
      ))}

      {/* Peek panel for selected */}
      <div className="stage-card-cyan" style={{
        position: 'absolute', top: 110, right: 170, width: 280, padding: 14,
      }}>
        <div className="mono stage-cyan" style={{ fontSize: 10, letterSpacing: '.12em', marginBottom: 6 }}>PEEK · MAYA R.</div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{
            width: 42, height: 42, borderRadius: '50%', background: '#4dd8ff', color: '#0d1622',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700,
          }}>MR</div>
          <div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 600 }}>Maya Rodriguez</div>
            <div className="stage-dim" style={{ fontSize: 11 }}>Brooklyn NY · since Mar 2024</div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12 }}>
          <div className="stage-card-warm" style={{ padding: 8 }}>
            <div className="mono stage-amber" style={{ fontSize: 9, letterSpacing: '.1em' }}>LIFETIME</div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 22, fontWeight: 600 }}>$612</div>
          </div>
          <div className="stage-card" style={{ padding: 8 }}>
            <div className="mono stage-dim" style={{ fontSize: 9, letterSpacing: '.1em' }}>ORDERS</div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 22, fontWeight: 600 }}>14</div>
          </div>
        </div>
        <div className="mono stage-dim" style={{ fontSize: 11, marginTop: 10, lineHeight: 1.5 }}>
          buys dahlia tees, avg basket $44,
          last order 4m ago · pays via Apple Pay.
        </div>
      </div>

      {/* Cohort legend */}
      <div style={{ position: 'absolute', bottom: 60, right: 170, display: 'flex', gap: 14 }}>
        {[['VIP', '#ffc54a', 188], ['Loyal', '#4dd8ff', 412], ['Regular', '#e8e2d2', 1184], ['New', 'rgba(232,226,210,.45)', 1063]].map(([k, c, n]) => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 8, height: 8, background: c, borderRadius: '50%' }}></span>
            <span className="mono" style={{ fontSize: 10, color: c }}>{k} · {n}</span>
          </div>
        ))}
      </div>
    </StageChrome>
  );
}

// ═══════════════════════════════════════════════════════════
// 06 · BLOG — Kanban swim lanes
// ═══════════════════════════════════════════════════════════
function StageBlog() {
  const lanes = [
    { title: 'IDEAS', color: 'rgba(232,226,210,.5)', x: 16, cards: [
      { t: 'Lookbook · Autumn capsule', who: 'Marisol', age: '3d' },
      { t: 'Interview: dye-pot weavers', who: 'Léa', age: '1w' },
    ]},
    { title: 'DRAFTS', color: '#ffc54a', x: 252, cards: [
      { t: 'Spring shipping schedule', who: 'Marisol', age: '2d', pct: 42 },
      { t: 'How we photograph a tee', who: 'Léa', age: '5d', pct: 67 },
    ]},
    { title: 'IN REVIEW', color: '#4dd8ff', x: 488, cards: [
      { t: 'Field report: Lagos textile market', who: 'Demetrius', age: '12d', pct: 92, badge: 'edits' },
    ]},
    { title: 'SCHEDULED', color: '#4dd8ff', x: 724, cards: [
      { t: 'Why we stopped sizing by S/M/L', who: 'Theo', when: 'Thu 09:00', pct: 100 },
    ]},
    { title: 'LIVE', color: '#4dd8ff', x: 960, cards: [
      { t: 'Notes from the dye-pot', who: 'Marisol', when: 'Tue · 2.1k', pct: 100, hot: true },
      { t: 'A year of marigold', who: 'Marisol', when: '8 May · 1.4k', pct: 100 },
    ]},
  ];

  return (
    <StageChrome section="blog" breadcrumb="Journal / Pipeline">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '14px 22px 8px' }}>
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 28, fontWeight: 600, margin: 0, letterSpacing: '-0.02em' }}>
          Journal pipeline <span className="stage-dim" style={{ fontSize: 16, fontWeight: 400 }}>· 8 in motion · 3 late</span>
        </h1>
        <button style={{ background: '#4dd8ff', color: '#0d1622', border: 'none', padding: '6px 14px', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 12, letterSpacing: '.05em' }}>+ NEW DRAFT</button>
      </div>

      {lanes.map((lane) => (
        <div key={lane.title} style={{ position: 'absolute', top: 70, left: lane.x, width: 220, bottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 4px 8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 6, height: 6, background: lane.color, borderRadius: '50%' }}></span>
              <span className="mono" style={{ fontSize: 11, letterSpacing: '.12em', color: lane.color }}>{lane.title}</span>
              <span className="mono stage-dim" style={{ fontSize: 10 }}>{lane.cards.length}</span>
            </div>
            <span className="mono stage-dim" style={{ fontSize: 12 }}>＋</span>
          </div>
          <div style={{ borderTop: `1px solid ${lane.color}`, opacity: .4 }}></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '10px 0' }}>
            {lane.cards.map((c, i) => (
              <div key={i} className={c.hot ? 'stage-card-warm' : 'stage-card'} style={{ padding: 10 }}>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 500, lineHeight: 1.3 }}>
                  {c.t}
                </div>
                <div className="stage-dim" style={{ fontSize: 11, marginTop: 4 }}>
                  by {c.who} · {c.age || c.when}
                </div>
                {c.pct !== undefined && c.pct < 100 && (
                  <div style={{ marginTop: 6, height: 2, background: 'rgba(232,226,210,.1)' }}>
                    <div style={{ height: 2, background: lane.color, width: c.pct + '%' }}></div>
                  </div>
                )}
                {c.badge && (
                  <div className="mono" style={{ fontSize: 9, color: '#ff5b22', marginTop: 6, letterSpacing: '.05em' }}>
                    ⚑ {c.badge.toUpperCase()}
                  </div>
                )}
                {c.hot && (
                  <div className="mono stage-amber" style={{ fontSize: 9, marginTop: 6, letterSpacing: '.1em' }}>
                    ◉ TRENDING · +312 views/h
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </StageChrome>
  );
}

// ═══════════════════════════════════════════════════════════
// 07 · ANALYTICS — Pulse / multi-panel
// ═══════════════════════════════════════════════════════════
function StageAnalytics() {
  return (
    <StageChrome section="analytics" breadcrumb="Pulse / Last 30 days" liveCount="47 viewers right now">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '14px 22px 8px' }}>
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 28, fontWeight: 600, margin: 0, letterSpacing: '-0.02em' }}>
          Pulse <span className="stage-dim" style={{ fontSize: 16, fontWeight: 400 }}>· last 30 days · ending Tue</span>
        </h1>
        <div className="mono" style={{ fontSize: 11, display: 'flex', gap: 4 }}>
          {['7D', '30D', '90D', 'YTD'].map((p, i) => (
            <span key={p} style={{
              padding: '4px 10px', borderRadius: 4,
              background: i === 1 ? 'rgba(77,216,255,.15)' : 'transparent',
              color: i === 1 ? '#4dd8ff' : 'rgba(232,226,210,.55)',
              border: '1px solid ' + (i === 1 ? 'rgba(77,216,255,.3)' : 'rgba(232,226,210,.12)'),
            }}>{p}</span>
          ))}
        </div>
      </div>

      {/* KPI strip */}
      <div style={{ position: 'absolute', top: 70, left: 16, right: 170, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {[
          ['REVENUE', '$48,206', '+18%', '#4dd8ff', [40, 38, 42, 35, 44, 50, 48, 52, 58, 60]],
          ['ORDERS', '412', '+12%', '#4dd8ff', [30, 32, 28, 35, 38, 36, 42, 40, 44, 46]],
          ['VISITORS', '52,084', '+24%', '#ffc54a', [22, 28, 32, 30, 38, 42, 40, 48, 52, 58]],
          ['CONVERSION', '1.84%', '−0.3pp', '#ff5b22', [30, 32, 35, 30, 28, 30, 28, 25, 24, 22]],
        ].map(([k, v, d, c, pts], i) => (
          <div key={k} className="stage-card" style={{ padding: 14 }}>
            <div className="mono stage-dim" style={{ fontSize: 10, letterSpacing: '.12em' }}>{k}</div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 32, fontWeight: 600, lineHeight: 1, marginTop: 4 }}>{v}</div>
            <div className="mono" style={{ fontSize: 10, color: c, marginTop: 2 }}>{d.startsWith('-') || d.startsWith('−') ? '▼' : '▲'} {d}</div>
            <svg viewBox="0 0 140 28" style={{ width: '100%', marginTop: 6 }}>
              <polyline points={pts.map((p, j) => `${j * 14},${28 - p * 0.4}`).join(' ')} fill="none" stroke={c} strokeWidth="1.2" />
            </svg>
          </div>
        ))}
      </div>

      {/* Main chart */}
      <div className="stage-card" style={{ position: 'absolute', top: 240, left: 16, width: 700, height: 280, padding: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div className="mono stage-dim" style={{ fontSize: 10, letterSpacing: '.12em' }}>REVENUE × ORDERS · DAILY</div>
          <div style={{ display: 'flex', gap: 14, fontSize: 11 }} className="mono">
            <span className="stage-cyan">▬ revenue</span>
            <span className="stage-amber">- - orders</span>
          </div>
        </div>
        <svg viewBox="0 0 680 200" style={{ width: '100%', marginTop: 10 }}>
          <defs>
            <linearGradient id="cyangrad" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#4dd8ff" stopOpacity=".25" />
              <stop offset="100%" stopColor="#4dd8ff" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[40, 80, 120, 160].map((y) => <line key={y} x1="0" x2="680" y1={y} y2={y} stroke="rgba(232,226,210,.06)" />)}
          <path d="M0,150 C30,140 60,90 100,120 S180,160 240,100 S320,130 400,80 S480,90 560,40 S640,80 680,30" fill="none" stroke="#4dd8ff" strokeWidth="2" />
          <path d="M0,150 C30,140 60,90 100,120 S180,160 240,100 S320,130 400,80 S480,90 560,40 S640,80 680,30 L680,200 L0,200 Z" fill="url(#cyangrad)" />
          <path d="M0,170 C40,165 80,150 120,160 S200,170 280,140 S380,150 460,120 S560,130 640,100 S680,90 680,85" fill="none" stroke="#ffc54a" strokeWidth="1.5" strokeDasharray="4 4" />
          <line x1="380" x2="380" y1="0" y2="200" stroke="#ffc54a" strokeDasharray="2 2" opacity=".5" />
          <text x="386" y="14" className="mono" fontSize="10" fill="#ffc54a">◉ dahlia launch · May 6</text>
        </svg>
      </div>

      {/* Right column */}
      <div style={{ position: 'absolute', top: 240, right: 170, width: 280 }}>
        <div className="stage-card" style={{ padding: 12 }}>
          <div className="mono stage-dim" style={{ fontSize: 10, letterSpacing: '.12em', marginBottom: 8 }}>RIGHT NOW · LIVE</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 48, fontWeight: 600, lineHeight: 1 }}>47</span>
            <span className="mono stage-cyan" style={{ fontSize: 11 }}>● viewers</span>
          </div>
          {/* mini map of visitors */}
          <svg viewBox="0 0 250 90" style={{ width: '100%', marginTop: 8 }}>
            <path d="M5,40 Q40,30 80,40 T160,38 Q200,30 245,45" fill="none" stroke="rgba(232,226,210,.1)" />
            {[
              [40, 35, 8], [70, 50, 5], [110, 30, 6], [140, 55, 4], [180, 40, 3], [200, 60, 2], [60, 65, 4], [120, 70, 3],
            ].map(([x, y, r], i) => (
              <circle key={i} cx={x} cy={y} r={r} fill="rgba(77,216,255,.4)" />
            ))}
          </svg>
          <div className="mono stage-dim" style={{ fontSize: 10, marginTop: 4 }}>NA · 28 · EU · 12 · ASIA · 7</div>
        </div>

        <div className="stage-card" style={{ padding: 12, marginTop: 12 }}>
          <div className="mono stage-dim" style={{ fontSize: 10, letterSpacing: '.12em', marginBottom: 8 }}>SOURCES · 30D</div>
          {[['Organic', 64, '#4dd8ff'], ['Direct', 18, '#ffc54a'], ['Instagram', 11, '#ff5b22'], ['Email', 5, 'rgba(232,226,210,.5)'], ['Other', 2, 'rgba(232,226,210,.3)']].map(([k, v, c], i) => (
            <div key={k} style={{ padding: '4px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                <span style={{ color: c }}>{k}</span><span className="mono">{v}%</span>
              </div>
              <div style={{ height: 2, background: 'rgba(232,226,210,.08)', marginTop: 3 }}>
                <div style={{ height: 2, background: c, width: v + '%' }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </StageChrome>
  );
}

// ═══════════════════════════════════════════════════════════
// 08 · SETTINGS — Floating modules
// ═══════════════════════════════════════════════════════════
function StageSettings() {
  const modules = [
    { x: 20,  y: 0,   w: 280, h: 130, title: 'Storefront identity', sub: 'Studio Marigold · marigold.shop', accent: '#4dd8ff', state: 'CONNECTED', icon: '◆' },
    { x: 316, y: 0,   w: 220, h: 130, title: 'Domain & DNS', sub: 'studio-marigold.com', accent: '#4dd8ff', state: 'HEALTHY', icon: '◯' },
    { x: 552, y: 0,   w: 240, h: 130, title: 'Payments', sub: 'Stripe · USD · 4 methods', accent: '#4dd8ff', state: 'CONNECTED', icon: '◊' },
    { x: 808, y: 0,   w: 220, h: 130, title: 'Shipping', sub: '3 zones · 7 rate cards', accent: '#ffc54a', state: 'ATTENTION', icon: '▢' },

    { x: 20,  y: 146, w: 240, h: 140, title: 'Tax', sub: 'TaxJar · US, CA, EU', accent: '#4dd8ff', state: 'CONNECTED', icon: '%' },
    { x: 276, y: 146, w: 220, h: 140, title: 'Email & notifications', sub: '12 templates', accent: '#4dd8ff', state: 'OK', icon: '✉' },
    { x: 512, y: 146, w: 240, h: 140, title: 'Team & roles', sub: '4 members · 2 invites', accent: '#4dd8ff', state: 'OK', icon: '◯◯' },
    { x: 768, y: 146, w: 260, h: 140, title: 'Integrations', sub: 'Klaviyo · Shopify · Canva +1', accent: '#4dd8ff', state: '4/18', icon: '⊞' },

    { x: 20,  y: 302, w: 280, h: 130, title: 'Legal & compliance', sub: 'GDPR · CCPA · cookie banner', accent: '#ff5b22', state: 'REVIEW', icon: '§' },
    { x: 316, y: 302, w: 240, h: 130, title: 'Backups & exports', sub: 'last backup Tue 04:00', accent: '#4dd8ff', state: 'HEALTHY', icon: '⤓' },
    { x: 572, y: 302, w: 260, h: 130, title: 'Plugins & modules', sub: '6 active · 0 with updates', accent: '#4dd8ff', state: 'UP TO DATE', icon: '⊟' },
    { x: 848, y: 302, w: 180, h: 130, title: 'Webhooks', sub: '4 endpoints · 0 failing', accent: '#4dd8ff', state: 'OK', icon: '⟿' },
  ];

  return (
    <StageChrome section="settings" breadcrumb="Setup / All modules">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '14px 22px 8px' }}>
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 28, fontWeight: 600, margin: 0, letterSpacing: '-0.02em' }}>
          Setup <span className="stage-dim" style={{ fontSize: 16, fontWeight: 400 }}>· 12 modules · 1 needs attention · 1 under review</span>
        </h1>
        <div className="mono stage-dim" style={{ fontSize: 11 }}>drag to rearrange · ⌘K to search</div>
      </div>

      <div style={{ position: 'absolute', top: 64, left: 16, right: 170, height: 460 }}>
        {modules.map((m) => (
          <div key={m.title} className="stage-card" style={{
            position: 'absolute', left: m.x, top: m.y, width: m.w, height: m.h,
            padding: 12, borderLeft: `3px solid ${m.accent}`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ fontSize: 22, color: m.accent }}>{m.icon}</div>
              <span className="mono" style={{
                fontSize: 9, padding: '2px 6px', letterSpacing: '.1em',
                color: m.accent, border: `1px solid ${m.accent}`,
              }}>{m.state}</span>
            </div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 600, marginTop: 8 }}>
              {m.title}
            </div>
            <div className="stage-dim" style={{ fontSize: 11, marginTop: 2 }}>{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Spatial annotation */}
      <div style={{
        position: 'absolute', right: 200, bottom: 230, transform: 'rotate(2deg)',
        fontFamily: "'Caveat', cursive", color: '#ffc54a', fontSize: 22, opacity: .85,
      }}>
        each module is a card —<br />pin the ones you live in
      </div>
    </StageChrome>
  );
}

window.StagePages = {
  Dashboard: StageDashboard,
  Pages: StagePagesIndex,
  Orders: StageOrders,
  Products: StageProducts,
  Customers: StageCustomers,
  Blog: StageBlog,
  Analytics: StageAnalytics,
  Settings: StageSettings,
};
