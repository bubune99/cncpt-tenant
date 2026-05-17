// Direction C · CONSOLE — Brutalist operator deck.
// JetBrains Mono everywhere, hard 1px lines, hot accents, [keyboard hints].

const CONSOLE_W = 1240;
const CONSOLE_H = 820;

function ConsoleChrome({ section, command, children, tag = 'CMS_CONSOLE' }) {
  return (
    <div className="console" style={{ width: CONSOLE_W, height: CONSOLE_H, position: 'relative', overflow: 'hidden' }}>
      {/* Top system bar */}
      <div style={{
        height: 28, borderBottom: '2px solid #0a0a0a',
        display: 'flex', alignItems: 'center', fontSize: 11,
        padding: '0 12px', gap: 18, background: '#0a0a0a', color: '#fafaf7',
      }}>
        <span style={{ background: '#f4ed37', color: '#0a0a0a', padding: '2px 6px', letterSpacing: '.08em', fontWeight: 700 }}>
          {tag}
        </span>
        <span>v2.4.1</span>
        <span>·</span>
        <span>UPTIME 14d 6h 22m</span>
        <span>·</span>
        <span style={{ color: '#f4ed37' }}>● HEALTHY</span>
        <span>·</span>
        <span>STORE: studio-marigold.com</span>
        <span style={{ flex: 1 }}></span>
        <span>op: marisol.cheng</span>
        <span>·</span>
        <span>{new Date().toISOString().slice(0,16).replace('T',' ')} UTC</span>
      </div>

      {/* Command line */}
      <div style={{
        height: 32, display: 'flex', alignItems: 'center', padding: '0 12px', gap: 8,
        borderBottom: '1px solid #0a0a0a', background: '#fafaf7', fontSize: 12,
      }}>
        <span style={{ color: '#ff5b22', fontWeight: 700 }}>▶</span>
        <span style={{ color: 'rgba(10,10,10,.5)' }}>cms://</span>
        <span style={{ fontWeight: 700 }}>{command}</span>
        <span style={{ flex: 1 }}></span>
        <span className="console-dim">[⌘K] PALETTE</span>
        <span className="console-dim">[?] HELP</span>
        <span className="console-dim">[ESC] BACK</span>
      </div>

      {/* Two-pane: nav + main */}
      <div style={{ display: 'flex', height: CONSOLE_H - 60 }}>
        {/* Left nav */}
        <aside style={{ width: 180, borderRight: '1px solid #0a0a0a', padding: '10px 0', fontSize: 12 }}>
          <div style={{ padding: '0 10px 6px', fontSize: 10, letterSpacing: '.15em' }} className="console-dim">// MODULES</div>
          {[
            ['DECK',     '01', 'dashboard'],
            ['PAGES',    '02', 'pages'],
            ['ORDERS',   '03', 'orders'],
            ['PRODUCTS', '04', 'products'],
            ['PEOPLE',   '05', 'customers'],
            ['JOURNAL',  '06', 'blog'],
            ['PULSE',    '07', 'analytics'],
            ['SYSTEM',   '08', 'settings'],
          ].map(([label, n, key]) => (
            <div key={key} style={{
              display: 'flex', justifyContent: 'space-between', padding: '5px 10px',
              background: key === section ? '#f4ed37' : 'transparent',
              borderLeft: key === section ? '3px solid #0a0a0a' : '3px solid transparent',
              fontWeight: key === section ? 700 : 400,
            }}>
              <span><span className="console-dim">[{n}]</span> {label}</span>
              {key === section && <span>◀</span>}
            </div>
          ))}
          <div style={{ padding: '14px 10px 6px', fontSize: 10, letterSpacing: '.15em' }} className="console-dim">// INBOX</div>
          <div style={{ padding: '0 10px' }}>
            <div style={{ background: '#ff5b22', color: '#fafaf7', padding: '4px 8px', fontSize: 11, marginBottom: 4 }}>
              ! 12 ORDERS PENDING
            </div>
            <div style={{ border: '1px solid #0a0a0a', padding: '4px 8px', fontSize: 11, marginBottom: 4 }}>
              ⚠ STOCK · DAHLIA·M = 0
            </div>
            <div style={{ border: '1px solid #0a0a0a', padding: '4px 8px', fontSize: 11, marginBottom: 4 }}>
              ↪ DRAFT REVIEW · 1
            </div>
            <div className="console-dim" style={{ fontSize: 10, marginTop: 6 }}>+ 4 more</div>
          </div>
        </aside>

        {/* Main */}
        <main style={{ flex: 1, padding: '12px 16px', overflow: 'hidden' }}>{children}</main>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// 01 · DASHBOARD — Operator deck
// ═══════════════════════════════════════════════════════════
function ConsoleDashboard() {
  return (
    <ConsoleChrome section="dashboard" command="deck/today">
      {/* Hero stat strip */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 0, border: '2px solid #0a0a0a' }}>
        <div style={{ padding: 16, borderRight: '1px solid #0a0a0a', background: '#f4ed37' }}>
          <div style={{ fontSize: 10, letterSpacing: '.1em' }}>// REVENUE_TODAY</div>
          <div className="display" style={{ fontSize: 72, lineHeight: 1, letterSpacing: '-0.04em' }}>$4,820</div>
          <div style={{ fontSize: 11, marginTop: 4 }}>▲ +18% &nbsp;|&nbsp; 09:00 → NOW &nbsp;|&nbsp; 38 ORDERS</div>
        </div>
        {[
          ['ORDERS_PENDING', '12', '4h oldest', '#ff5b22'],
          ['CART_NOW', '3', '47 viewing', null],
          ['STOCK_ALERTS', '1', 'DAHLIA·M', '#ff5b22'],
        ].map(([k, v, sub, c], i) => (
          <div key={k} style={{ padding: 12, borderRight: i < 2 ? '1px solid #0a0a0a' : 'none' }}>
            <div style={{ fontSize: 10, letterSpacing: '.1em' }}>// {k}</div>
            <div className="display" style={{ fontSize: 44, lineHeight: 1, color: c || '#0a0a0a' }}>{v}</div>
            <div style={{ fontSize: 10, marginTop: 2 }} className="console-dim">{sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 0, marginTop: 14 }}>
        {/* Action queue */}
        <div style={{ borderTop: '1px solid #0a0a0a', borderRight: '1px solid #0a0a0a', borderBottom: '1px solid #0a0a0a', borderLeft: '2px solid #0a0a0a' }}>
          <div style={{ background: '#0a0a0a', color: '#fafaf7', padding: '6px 10px', fontSize: 11, letterSpacing: '.1em', display: 'flex', justifyContent: 'space-between' }}>
            <span>// ACTION_QUEUE</span>
            <span>5 ITEMS · 1 URGENT</span>
          </div>
          {[
            ['1', 'URGENT', 'Restock dahlia tee · M variant', '0 left · 3rd time/mo', '#ff5b22', '[R]', 'estock'],
            ['2', 'TODAY', 'Approve newsletter draft', 'Sched Thu 09:00 · 2,847 recipients', '#f4ed37', '[A]', 'pprove'],
            ['3', 'TODAY', 'Pack orders #4821 #4820 #4819', '$234.70 total · expedite #4818', '#f4ed37', '[P]', 'ack'],
            ['4', 'WAIT 19h', 'Reply customer ticket #cs-22', 'Refund req · Léa B.', null, '[O]', 'pen'],
            ['5', 'REVIEW', 'Demetrius · Field report Lagos', '92% complete · last edit 12d ago', null, '[V]', 'iew'],
          ].map(([n, p, t, sub, c, k1, k2]) => (
            <div key={n} style={{ display: 'grid', gridTemplateColumns: '24px 80px 1fr 80px', borderTop: '1px solid #0a0a0a', alignItems: 'stretch' }}>
              <div style={{ borderRight: '1px solid #0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, background: '#f4ed37', fontWeight: 700 }}>{n}</div>
              <div style={{ borderRight: '1px solid #0a0a0a', padding: '6px 8px', background: c || 'transparent', color: c === '#0a0a0a' ? '#fafaf7' : '#0a0a0a', fontSize: 10, letterSpacing: '.08em', display: 'flex', alignItems: 'center' }}>{p}</div>
              <div style={{ padding: '6px 10px' }}>
                <div style={{ fontSize: 13 }}>{t}</div>
                <div style={{ fontSize: 10 }} className="console-dim">{sub}</div>
              </div>
              <div style={{ borderLeft: '1px solid #0a0a0a', display: 'flex', alignItems: 'center', padding: '0 10px', fontSize: 11 }}>
                <span style={{ background: '#0a0a0a', color: '#fafaf7', padding: '1px 5px', marginRight: 4 }}>{k1}</span>
                <span>{k2}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Right: live + chart */}
        <div style={{ borderTop: '1px solid #0a0a0a', borderRight: '2px solid #0a0a0a', borderBottom: '1px solid #0a0a0a', borderLeft: 0 }}>
          <div style={{ background: '#0a0a0a', color: '#fafaf7', padding: '6px 10px', fontSize: 11, letterSpacing: '.1em' }}>
            // STOREFRONT_LIVE
          </div>
          <div style={{ padding: 12, borderBottom: '1px solid #0a0a0a' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span className="display" style={{ fontSize: 56, lineHeight: 1 }}>47</span>
              <span style={{ fontSize: 11 }}>VIEWERS · 3 IN CART · 1 CHECKOUT</span>
            </div>
            {/* ASCII-style sparkline */}
            <div style={{ marginTop: 8, fontSize: 12, letterSpacing: '.1em' }}>
              {'▁▂▃▄▅▅▆▇█▇▆▅▆▇'} <span className="console-dim">(15 min)</span>
            </div>
          </div>
          <div style={{ padding: 12 }}>
            <div style={{ fontSize: 10, letterSpacing: '.1em', marginBottom: 6 }}>// PAGES_RIGHT_NOW</div>
            {[
              ['/shop/dahlia-tee', 14, '[14]'],
              ['/shop/marigold-cap', 9, '[ 9]'],
              ['/posts/dye-pot', 7, '[ 7]'],
              ['/shop', 5, '[ 5]'],
              ['/about', 3, '[ 3]'],
            ].map(([p, n, bar], i) => (
              <div key={p} style={{ display: 'grid', gridTemplateColumns: '1fr auto', fontSize: 11, padding: '2px 0' }}>
                <span>{p}</span>
                <span>{bar} {'█'.repeat(Math.floor(n / 2))}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom log */}
      <div style={{ border: '1px solid #0a0a0a', borderLeftWidth: 2, marginTop: 14, fontSize: 11 }}>
        <div style={{ background: '#0a0a0a', color: '#fafaf7', padding: '4px 10px', letterSpacing: '.1em', display: 'flex', justifyContent: 'space-between' }}>
          <span>// EVENT_LOG · tail -f</span>
          <span>● STREAMING</span>
        </div>
        {[
          ['09:14:22', 'ORDER_NEW', '#4821 · Maya R. · $48.20 · 2 items'],
          ['09:12:08', 'STOCK_ZERO', 'SHIRT-DAH-M · variant disabled in cart'],
          ['09:08:01', 'ORDER_PAID', '#4820 · Edwin L. · $112.00'],
          ['09:02:44', 'POST_PUBLISH', 'notes-from-the-dye-pot · 2.1k views/d'],
        ].map(([t, ev, msg], i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '90px 140px 1fr', padding: '4px 10px', borderTop: i ? '1px solid rgba(10,10,10,.2)' : 'none' }}>
            <span className="console-dim">{t}</span>
            <span style={{ background: ev === 'STOCK_ZERO' ? '#ff5b22' : ev === 'ORDER_NEW' ? '#f4ed37' : 'transparent', padding: '0 6px', display: 'inline-block', width: 'fit-content', letterSpacing: '.05em', color: ev === 'STOCK_ZERO' ? '#fafaf7' : '#0a0a0a' }}>{ev}</span>
            <span>{msg}</span>
          </div>
        ))}
      </div>
    </ConsoleChrome>
  );
}

// ═══════════════════════════════════════════════════════════
// 02 · PAGES — Directory listing
// ═══════════════════════════════════════════════════════════
function ConsolePagesIndex() {
  const rows = [
    ['/',                  'Home',                '755', 'PUB', '6 May',  '12,402', '1.84%', false],
    ['/about',             'About us',            '755', 'PUB', '2 May',  '2,108',  '0.92%', false],
    ['/contact',           'Contact',             '755', 'PUB', '14 Apr', '1,440',  '0.41%', false],
    ['/studio-rentals',    'Studio rentals',      '644', 'DRF', '12 May', '—',      '—',     true],
    ['/shop',              'Shop index',          '755', 'PUB', '8 May',  '8,820',  '3.21%', false],
    ['/categories',        'Categories',          '755', 'PUB', '8 May',  '2,402',  '1.18%', false],
    ['/events-rentals',    'Events & rentals',    '755', 'PUB', '9 May',  '320',    '0.20%', false],
    ['/posts',             'Blog index',          '755', 'PUB', '11 May', '4,418',  '0.88%', false],
    ['/demo-animation',    'Animation demo',      '644', 'DRF', '15 May', '—',      '—',     true],
    ['/legal/privacy',     'Privacy policy',      '755', 'PUB', '1 Apr',  '402',    '0.04%', false],
    ['/legal/terms',       'Terms of service',    '755', 'PUB', '1 Apr',  '188',    '0.02%', false],
    ['/faqs',              'FAQs',                '755', 'PUB', '20 Apr', '1,202',  '0.18%', false],
  ];

  return (
    <ConsoleChrome section="pages" command="pages/ls -la">
      {/* Heading */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
        <h1 className="display" style={{ fontSize: 36, margin: 0, letterSpacing: '-0.02em' }}>
          PAGES <span className="console-dim" style={{ fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}>// 12 entries · 11 PUB · 1 DRF</span>
        </h1>
        <div style={{ display: 'flex', gap: 0 }}>
          {[['[/]', 'Search', false], ['[N]', '+ New page', true]].map(([k, label, hot], i) => (
            <span key={i} style={{
              padding: '6px 10px', fontSize: 12,
              background: hot ? '#0a0a0a' : 'transparent',
              color: hot ? '#fafaf7' : '#0a0a0a',
              border: '1px solid #0a0a0a',
              marginLeft: i > 0 ? -1 : 0,
            }}>
              <span style={{ background: hot ? '#f4ed37' : '#0a0a0a', color: hot ? '#0a0a0a' : '#fafaf7', padding: '0 4px', marginRight: 6, fontWeight: 700 }}>{k}</span>
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Filter strip */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #0a0a0a', fontSize: 11, marginBottom: 0 }}>
        {[['ALL', 12, true], ['PUBLISHED', 11, false], ['DRAFT', 1, false], ['ARCHIVED', 0, false], ['BROKEN', 0, false]].map(([t, n, sel], i) => (
          <span key={t} style={{
            padding: '5px 12px',
            background: sel ? '#f4ed37' : 'transparent',
            fontWeight: sel ? 700 : 400,
            borderRight: i < 4 ? '1px solid rgba(10,10,10,.2)' : 'none',
          }}>{t} [{n}]</span>
        ))}
        <span style={{ flex: 1 }}></span>
        <span className="console-dim" style={{ padding: '5px 12px' }}>sort: edited ↓</span>
      </div>

      {/* Table */}
      <div style={{ border: '1px solid #0a0a0a', borderTop: 0, fontSize: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '40px 220px 1fr 60px 60px 80px 110px 80px', background: '#0a0a0a', color: '#fafaf7', padding: '6px 0', letterSpacing: '.08em', fontSize: 10 }}>
          <span style={{ padding: '0 8px' }}>#</span>
          <span style={{ padding: '0 8px' }}>SLUG</span>
          <span style={{ padding: '0 8px' }}>TITLE</span>
          <span style={{ padding: '0 8px' }}>PERM</span>
          <span style={{ padding: '0 8px' }}>ST</span>
          <span style={{ padding: '0 8px' }}>EDITED</span>
          <span style={{ padding: '0 8px' }}>VISITS/30D</span>
          <span style={{ padding: '0 8px' }}>CVR</span>
        </div>
        {rows.map(([slug, title, perm, st, ed, v, cvr, draft], i) => (
          <div key={slug} style={{
            display: 'grid', gridTemplateColumns: '40px 220px 1fr 60px 60px 80px 110px 80px',
            borderTop: i ? '1px solid rgba(10,10,10,.15)' : 'none',
            padding: '6px 0', alignItems: 'center',
            background: draft ? 'rgba(255,91,34,.06)' : 'transparent',
          }}>
            <span style={{ padding: '0 8px' }} className="console-dim">{String(i + 1).padStart(2, '0')}</span>
            <span style={{ padding: '0 8px' }}>{slug}</span>
            <span style={{ padding: '0 8px', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 500 }}>{title}</span>
            <span style={{ padding: '0 8px' }} className="console-dim">{perm}</span>
            <span style={{ padding: '0 8px' }}>
              <span style={{
                background: draft ? '#ff5b22' : '#0a0a0a',
                color: '#fafaf7', padding: '1px 5px', fontSize: 10, letterSpacing: '.08em',
              }}>{st}</span>
            </span>
            <span style={{ padding: '0 8px' }} className="console-dim">{ed}</span>
            <span style={{ padding: '0 8px' }}>{v}</span>
            <span style={{ padding: '0 8px' }}>{cvr}</span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="console-dim" style={{ fontSize: 11, marginTop: 10, display: 'flex', gap: 16 }}>
        <span><span style={{ background: '#0a0a0a', color: '#fafaf7', padding: '0 4px' }}>[J/K]</span> move</span>
        <span><span style={{ background: '#0a0a0a', color: '#fafaf7', padding: '0 4px' }}>[E]</span> edit</span>
        <span><span style={{ background: '#0a0a0a', color: '#fafaf7', padding: '0 4px' }}>[D]</span> duplicate</span>
        <span><span style={{ background: '#0a0a0a', color: '#fafaf7', padding: '0 4px' }}>[X]</span> archive</span>
        <span><span style={{ background: '#0a0a0a', color: '#fafaf7', padding: '0 4px' }}>[P]</span> preview</span>
      </div>
    </ConsoleChrome>
  );
}

// ═══════════════════════════════════════════════════════════
// 03 · ORDERS — Manifest with action stamps
// ═══════════════════════════════════════════════════════════
function ConsoleOrders() {
  const rows = [
    ['#4821', 'NEW',     'Maya Rodriguez',    'Brooklyn NY',   '09:14',   2, '$48.20',  '#ffc54a', 'PACK'],
    ['#4820', 'PAID',    'Edwin Lacroix',     'Montréal QC',   '08:02',   3, '$112.00', null,      'PACK'],
    ['#4819', 'PACKED',  'Sun-Hee Park',      'Vancouver BC',  'yest 22:48', 2, '$74.50',  null,      'SHIP'],
    ['#4818', 'SHIPPED', 'Theo Mensah',       'Boston MA',     'yest 17:31', 4, '$192.40', null,      '↗ DHL'],
    ['#4817', 'SHIPPED', 'Léa Bourgeois',     'Bordeaux FR',   '14 May',  2, '$58.00',  null,      '↗ USPS'],
    ['#4816', 'RETURN!', 'Ivy Tanaka',        'Osaka JP',      '14 May',  4, '$220.00', '#ff5b22', 'REFUND'],
    ['#4815', 'PACKED',  'Aria Singh',        'Mumbai IN',     '13 May',  2, '$66.00',  null,      'SHIP'],
    ['#4814', 'PACKED',  'Owen Pham',         'Toronto ON',    '13 May',  1, '$28.00',  null,      'SHIP'],
  ];
  return (
    <ConsoleChrome section="orders" command="orders/queue --sort=age">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
        <h1 className="display" style={{ fontSize: 36, margin: 0, letterSpacing: '-0.02em' }}>
          ORDERS <span className="console-dim" style={{ fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}>// 94 wk · 12 NEW · 2 RETURN</span>
        </h1>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 11 }}>
          <span style={{ background: '#ff5b22', color: '#fafaf7', padding: '4px 8px', letterSpacing: '.08em' }}>1 URGENT</span>
          <span style={{ background: '#f4ed37', padding: '4px 8px', letterSpacing: '.08em' }}>4 NEW</span>
        </div>
      </div>

      {/* Status filter */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #0a0a0a', fontSize: 11 }}>
        {[['ALL', 94, false], ['NEW', 12, true], ['PAID', 41, false], ['PACKED', 18, false], ['SHIPPED', 19, false], ['RETURN', 2, false], ['REFUND', 2, false]].map(([t, n, sel], i) => (
          <span key={t} style={{
            padding: '5px 12px',
            background: sel ? '#f4ed37' : 'transparent',
            fontWeight: sel ? 700 : 400,
            borderRight: '1px solid rgba(10,10,10,.2)',
          }}>{t} [{n}]</span>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 0 }}>
        {/* Manifest */}
        <div style={{ border: '1px solid #0a0a0a', borderTop: 0 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '60px 70px 1fr 100px 70px 80px 70px', background: '#0a0a0a', color: '#fafaf7', padding: '6px 0', letterSpacing: '.08em', fontSize: 10 }}>
            {['ID', 'STATE', 'CUSTOMER', 'PLACED', 'ITEMS', 'TOTAL', 'ACT'].map((h, i) => <span key={h} style={{ padding: '0 8px' }}>{h}</span>)}
          </div>
          {rows.map(([id, st, who, place, when, items, total, color, act], i) => (
            <div key={id} style={{
              display: 'grid', gridTemplateColumns: '60px 70px 1fr 100px 70px 80px 70px',
              borderTop: i ? '1px solid rgba(10,10,10,.15)' : 'none',
              padding: '8px 0', alignItems: 'center', fontSize: 12,
              background: st === 'RETURN!' ? 'rgba(255,91,34,.08)' : st === 'NEW' ? 'rgba(244,237,55,.18)' : 'transparent',
              borderLeft: i === 0 ? '3px solid #ff5b22' : '3px solid transparent',
            }}>
              <span style={{ padding: '0 8px' }} className="">{id}</span>
              <span style={{ padding: '0 8px' }}>
                <span style={{
                  background: color || '#0a0a0a',
                  color: color === '#f4ed37' || color === '#ffc54a' ? '#0a0a0a' : '#fafaf7',
                  padding: '1px 5px', fontSize: 10, letterSpacing: '.05em',
                }}>{st}</span>
              </span>
              <span style={{ padding: '0 8px' }}>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 500 }}>{who}</div>
                <div className="console-dim" style={{ fontSize: 10 }}>{place}</div>
              </span>
              <span style={{ padding: '0 8px' }} className="console-dim">{when}</span>
              <span style={{ padding: '0 8px' }}>{items}</span>
              <span style={{ padding: '0 8px' }}>{total}</span>
              <span style={{ padding: '0 8px' }}>
                <span style={{ background: '#0a0a0a', color: '#fafaf7', padding: '2px 6px', fontSize: 10 }}>{act}</span>
              </span>
            </div>
          ))}
        </div>

        {/* Detail */}
        <div style={{ border: '1px solid #0a0a0a', borderTop: 0, borderLeft: 0 }}>
          <div style={{ background: '#0a0a0a', color: '#fafaf7', padding: '6px 10px', fontSize: 11, letterSpacing: '.1em', display: 'flex', justifyContent: 'space-between' }}>
            <span>// DETAIL · #4821</span>
            <span>NEW · 4m ago</span>
          </div>
          <div style={{ padding: 12, fontSize: 12 }}>
            <div className="display" style={{ fontSize: 26, lineHeight: 1, letterSpacing: '-0.02em' }}>Maya Rodriguez</div>
            <div className="console-dim" style={{ fontSize: 11, marginBottom: 12 }}>maya.r@hey.com · order #14 · since Mar 2024</div>

            <div style={{ border: '1px solid #0a0a0a', borderLeftWidth: 2 }}>
              <div style={{ background: '#f4ed37', padding: '4px 10px', fontSize: 10, letterSpacing: '.08em' }}>LINE ITEMS</div>
              {[
                ['SHIRT-DAH-M', 'Dahlia tee · M', 1, '$32.00'],
                ['CAP-MAR-OS',  'Marigold cap',   1, '$16.20'],
              ].map(([sku, name, qty, p], i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '110px 1fr 30px 60px', padding: '6px 8px', borderTop: i ? '1px solid rgba(10,10,10,.15)' : 'none', fontSize: 11 }}>
                  <span className="console-dim">{sku}</span><span>{name}</span><span>×{qty}</span><span>{p}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', fontSize: 11, marginTop: 8 }}>
              <span className="console-dim">subtotal</span><span>$48.20</span>
              <span className="console-dim">shipping</span><span>FREE</span>
              <span style={{ fontWeight: 700, borderTop: '2px solid #0a0a0a', paddingTop: 4, marginTop: 4 }}>TOTAL</span>
              <span style={{ fontWeight: 700, borderTop: '2px solid #0a0a0a', paddingTop: 4, marginTop: 4 }}>$48.20</span>
            </div>

            <div className="console-dim" style={{ fontSize: 11, marginTop: 10 }}>
              // SHIP_TO
            </div>
            <div style={{ fontSize: 12, lineHeight: 1.4 }}>
              241 Withers St, Apt 3<br />Brooklyn NY 11211 · USA
            </div>

            <div style={{ display: 'flex', gap: 0, marginTop: 14 }}>
              <button style={{ flex: 1, background: '#0a0a0a', color: '#fafaf7', border: 'none', padding: '8px', fontFamily: 'inherit', fontSize: 12, letterSpacing: '.05em' }}>
                <span style={{ background: '#f4ed37', color: '#0a0a0a', padding: '0 4px', marginRight: 6 }}>[P]</span>
                PACK &amp; SHIP →
              </button>
              <button style={{ background: 'transparent', color: '#0a0a0a', border: '1px solid #0a0a0a', borderLeft: 0, padding: '8px 12px', fontFamily: 'inherit', fontSize: 11 }}>REFUND</button>
            </div>
          </div>
        </div>
      </div>
    </ConsoleChrome>
  );
}

// ═══════════════════════════════════════════════════════════
// 04 · PRODUCTS — SKU registry
// ═══════════════════════════════════════════════════════════
function ConsoleProducts() {
  const rows = [
    ['SHIRT-DAH-M',  '#c8443a', 'Dahlia tee',       'Apparel/Tees', '$32.00',  0, 'OOS',  '#ff5b22', '42/wk',  '↑'],
    ['SHIRT-DAH-L',  '#c8443a', 'Dahlia tee · L',   'Apparel/Tees', '$32.00',  6, 'LOW',  '#ffc54a', '12/wk',  '·'],
    ['SHIRT-DAH-XL', '#c8443a', 'Dahlia tee · XL',  'Apparel/Tees', '$32.00', 12, 'OK',   null,     ' 8/wk',  '·'],
    ['CAP-MAR-OS',   '#e7a23b', 'Marigold cap',     'Accessories',  '$16.20', 22, 'OK',   null,     '28/wk',  '↑'],
    ['SCRF-IND-OS',  '#3a4a8b', 'Indigo scarf',     'Accessories',  '$48.00',  7, 'LOW',  '#ffc54a', '14/wk',  '·'],
    ['TOTE-ASH-L',   '#88857a', 'Ash totebag',      'Accessories',  '$28.00', 41, 'OK',   null,     '11/wk',  '↓'],
    ['MUG-BON-OS',   '#e6dbc7', 'Bone ceramic mug', 'Home',         '$22.00',  4, 'LOW',  '#ffc54a', ' 6/wk',  '·'],
    ['APRN-LIN-OS',  '#c4b8a0', 'Linen apron',      'Home',         '$54.00', 12, 'OK',   null,     ' 4/wk',  '·'],
  ];
  return (
    <ConsoleChrome section="products" command="products/registry">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
        <h1 className="display" style={{ fontSize: 36, margin: 0, letterSpacing: '-0.02em' }}>
          PRODUCTS <span className="console-dim" style={{ fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}>// 104 SKU · 7 LOW · 1 OOS</span>
        </h1>
        <div style={{ display: 'flex', gap: 6, fontSize: 11 }}>
          <span style={{ background: '#ff5b22', color: '#fafaf7', padding: '4px 8px' }}>1 OOS</span>
          <span style={{ background: '#f4ed37', padding: '4px 8px' }}>7 LOW</span>
          <span style={{ background: '#0a0a0a', color: '#fafaf7', padding: '4px 8px' }}>[N] + NEW</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #0a0a0a', fontSize: 11 }}>
        {[['ALL', 104, true], ['APPAREL', 38], ['ACCESSORIES', 24], ['HOME', 18], ['LOW STOCK', 7], ['DRAFTS', 6]].map(([t, n, sel], i) => (
          <span key={t} style={{
            padding: '5px 12px',
            background: sel ? '#f4ed37' : 'transparent',
            fontWeight: sel ? 700 : 400,
            borderRight: '1px solid rgba(10,10,10,.2)',
          }}>{t} [{n}]</span>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 0 }}>
        {/* Registry */}
        <div style={{ border: '1px solid #0a0a0a', borderTop: 0 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '24px 130px 1fr 110px 60px 60px 70px 30px', background: '#0a0a0a', color: '#fafaf7', padding: '6px 0', fontSize: 10, letterSpacing: '.08em' }}>
            {['', 'SKU', 'NAME', 'CAT', '$', 'QTY', 'PACE', ''].map((h, i) => <span key={i} style={{ padding: '0 6px' }}>{h}</span>)}
          </div>
          {rows.map(([sku, color, name, cat, price, qty, st, c, pace, trend], i) => (
            <div key={sku} style={{
              display: 'grid', gridTemplateColumns: '24px 130px 1fr 110px 60px 60px 70px 30px',
              borderTop: i ? '1px solid rgba(10,10,10,.15)' : 'none',
              padding: '6px 0', alignItems: 'center', fontSize: 11,
              background: i === 0 ? 'rgba(244,237,55,.18)' : 'transparent',
              borderLeft: i === 0 ? '3px solid #0a0a0a' : '3px solid transparent',
            }}>
              <span style={{ width: 14, height: 14, background: color, border: '1px solid #0a0a0a', marginLeft: 6 }}></span>
              <span style={{ padding: '0 6px' }}>{sku}</span>
              <span style={{ padding: '0 6px', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 500 }}>{name}</span>
              <span style={{ padding: '0 6px' }} className="console-dim">{cat}</span>
              <span style={{ padding: '0 6px' }}>{price}</span>
              <span style={{ padding: '0 6px', fontWeight: c === '#ff5b22' ? 700 : 400, color: c === '#ff5b22' ? '#ff5b22' : '#0a0a0a' }}>{qty}</span>
              <span style={{ padding: '0 6px' }}>{pace}</span>
              <span style={{ padding: '0 6px', color: trend === '↑' ? '#0a0a0a' : trend === '↓' ? 'rgba(10,10,10,.5)' : 'transparent' }}>{trend}</span>
            </div>
          ))}
        </div>

        {/* Detail editor */}
        <div style={{ border: '1px solid #0a0a0a', borderTop: 0, borderLeft: 0 }}>
          <div style={{ background: '#0a0a0a', color: '#fafaf7', padding: '6px 10px', fontSize: 11, letterSpacing: '.1em', display: 'flex', justifyContent: 'space-between' }}>
            <span>// EDIT · SHIRT-DAH-M</span>
            <span style={{ background: '#ff5b22', padding: '0 5px' }}>OOS</span>
          </div>
          <div style={{ display: 'flex', gap: 10, padding: 12 }}>
            <div style={{ width: 80, height: 80, background: '#c8443a', border: '1px solid #0a0a0a' }}></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 22, fontWeight: 600, lineHeight: 1 }}>Dahlia tee</div>
              <div className="console-dim" style={{ fontSize: 11 }}>Apparel / Tees · created 12 Apr</div>
              <div style={{ fontSize: 22, marginTop: 4 }}>$32.00 <span className="console-dim" style={{ fontSize: 11 }}>· cost $9.40 · margin 71%</span></div>
            </div>
          </div>

          <div style={{ padding: '0 12px 12px', fontSize: 11 }}>
            <div style={{ fontSize: 10, letterSpacing: '.1em', marginBottom: 4 }}>// VARIANTS</div>
            {[['M', 0, 'OOS', '#ff5b22'], ['L', 6, 'LOW', '#f4ed37'], ['XL', 12, 'OK', null]].map(([s, q, st, c], i) => (
              <div key={s} style={{ display: 'grid', gridTemplateColumns: '40px 70px 60px 1fr', padding: '4px 0', borderTop: '1px solid rgba(10,10,10,.15)' }}>
                <span>{s}</span>
                <span>qty: {q}</span>
                <span style={{ background: c || 'transparent', color: c === '#ff5b22' ? '#fafaf7' : '#0a0a0a', padding: '0 5px', width: 'fit-content' }}>{st}</span>
                <span className="console-dim">pace {[42, 12, 8][i]}/wk</span>
              </div>
            ))}

            <div style={{ fontSize: 10, letterSpacing: '.1em', marginTop: 10, marginBottom: 4 }}>// PERFORMANCE 30D</div>
            <div style={{ letterSpacing: '.05em' }}>
              SOLD ███████████████████ 168 · REV $5,376
            </div>
            <div style={{ letterSpacing: '.05em' }}>
              VIEW ████████████████████████ 8,402
            </div>
            <div style={{ letterSpacing: '.05em' }}>
              CART ██████████ 412
            </div>

            <div style={{ display: 'flex', gap: 0, marginTop: 12 }}>
              <button style={{ flex: 1, background: '#0a0a0a', color: '#fafaf7', border: 'none', padding: '8px', fontFamily: 'inherit', fontSize: 11, letterSpacing: '.05em' }}>
                <span style={{ background: '#f4ed37', color: '#0a0a0a', padding: '0 4px', marginRight: 6 }}>[R]</span>
                RESTOCK · ORDER 50 UNITS
              </button>
            </div>
          </div>
        </div>
      </div>
    </ConsoleChrome>
  );
}

// ═══════════════════════════════════════════════════════════
// 05 · CUSTOMERS — People registry
// ═══════════════════════════════════════════════════════════
function ConsoleCustomers() {
  const rows = [
    ['SP', '#e7a23b', 'Sun-Hee Park',    'Vancouver BC', 22, '$1,140', 'Nov 2023', 'VIP',     '#f4ed37', '↑'],
    ['IT', '#3a4a8b', 'Ivy Tanaka',      'Osaka JP',     18, '$880',   'Aug 2024', 'VIP',     '#f4ed37', '↑'],
    ['MR', '#c8443a', 'Maya Rodriguez',  'Brooklyn NY',  14, '$612',   'Mar 2024', 'LOYAL',   '#4dd8ff', '↑'],
    ['EL', '#3a4a8b', 'Edwin Lacroix',   'Montréal QC',   9, '$418',   'Apr 2024', 'LOYAL',   '#4dd8ff', '·'],
    ['TM', '#5a7f4e', 'Theo Mensah',     'Boston MA',     6, '$348',   'Jan 2025', 'REG',     null,      '↑'],
    ['DO', '#88857a', 'Demetrius Okafor','Lagos NG',      4, '$192',   'Mar 2025', 'REG',     null,      '·'],
    ['LB', '#8b2c1f', 'Léa Bourgeois',   'Bordeaux FR',   3, '$108',   'Feb 2025', 'NEW',     null,      '↑'],
    ['SV', '#1a1410', 'Sasha Volkov',    'Berlin DE',     0, '$0',     '15 May',   'CART',    '#ff5b22', '!'],
  ];
  return (
    <ConsoleChrome section="customers" command="people/registry">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
        <h1 className="display" style={{ fontSize: 36, margin: 0, letterSpacing: '-0.02em' }}>
          PEOPLE <span className="console-dim" style={{ fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}>// 2,847 records · 188 VIP · 18 NEW(7d)</span>
        </h1>
        <div style={{ display: 'flex', gap: 6, fontSize: 11 }}>
          <span style={{ background: '#0a0a0a', color: '#fafaf7', padding: '4px 8px' }}>[/] SEARCH</span>
          <span style={{ background: '#0a0a0a', color: '#fafaf7', padding: '4px 8px' }}>[E] EXPORT CSV</span>
          <span style={{ background: '#f4ed37', padding: '4px 8px' }}>[S] + SEGMENT</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #0a0a0a', fontSize: 11 }}>
        {[['ALL', 2847], ['VIP', 188, true], ['LOYAL 5+', 412], ['REG', 1184], ['NEW 7d', 18], ['ABANDONED', 64], ['CART_NOW', 3]].map(([t, n, sel], i) => (
          <span key={t} style={{
            padding: '5px 12px',
            background: sel ? '#f4ed37' : 'transparent',
            fontWeight: sel ? 700 : 400,
            borderRight: '1px solid rgba(10,10,10,.2)',
          }}>{t} [{n}]</span>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 0 }}>
        <div style={{ border: '1px solid #0a0a0a', borderTop: 0 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '36px 1fr 130px 50px 80px 80px 60px', background: '#0a0a0a', color: '#fafaf7', padding: '6px 0', fontSize: 10, letterSpacing: '.08em' }}>
            {['', 'NAME', 'LOCATION', 'ORD', 'LTV', 'SINCE', 'CLASS'].map((h) => <span key={h} style={{ padding: '0 8px' }}>{h}</span>)}
          </div>
          {rows.map(([init, color, name, place, ord, ltv, since, cls, badgeColor, trend], i) => (
            <div key={name} style={{
              display: 'grid', gridTemplateColumns: '36px 1fr 130px 50px 80px 80px 60px',
              borderTop: i ? '1px solid rgba(10,10,10,.15)' : 'none',
              padding: '8px 0', alignItems: 'center', fontSize: 12,
              background: i === 2 ? 'rgba(244,237,55,.18)' : 'transparent',
              borderLeft: i === 2 ? '3px solid #0a0a0a' : '3px solid transparent',
            }}>
              <span style={{ marginLeft: 6 }}>
                <span style={{ display: 'inline-block', width: 26, height: 26, background: color, color: '#fafaf7', textAlign: 'center', lineHeight: '26px', fontSize: 11, fontWeight: 700, border: '1px solid #0a0a0a' }}>{init}</span>
              </span>
              <span style={{ padding: '0 8px' }}>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 500 }}>{name} {trend === '!' && <span style={{ color: '#ff5b22' }}>● in cart now</span>} {trend === '↑' && <span className="console-dim">↑</span>}</div>
              </span>
              <span style={{ padding: '0 8px' }} className="console-dim">{place}</span>
              <span style={{ padding: '0 8px' }}>{ord}</span>
              <span style={{ padding: '0 8px' }}>{ltv}</span>
              <span style={{ padding: '0 8px' }} className="console-dim">{since}</span>
              <span style={{ padding: '0 8px' }}>
                <span style={{ background: badgeColor || 'transparent', color: badgeColor === '#ff5b22' ? '#fafaf7' : '#0a0a0a', border: !badgeColor ? '1px solid rgba(10,10,10,.3)' : 'none', padding: '1px 5px', fontSize: 10, letterSpacing: '.05em' }}>{cls}</span>
              </span>
            </div>
          ))}
        </div>

        {/* Detail */}
        <div style={{ border: '1px solid #0a0a0a', borderTop: 0, borderLeft: 0 }}>
          <div style={{ background: '#0a0a0a', color: '#fafaf7', padding: '6px 10px', fontSize: 11, letterSpacing: '.1em', display: 'flex', justifyContent: 'space-between' }}>
            <span>// PROFILE · MR.0042</span>
            <span style={{ background: '#4dd8ff', color: '#0a0a0a', padding: '0 5px' }}>LOYAL</span>
          </div>
          <div style={{ padding: 12 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <span style={{ width: 50, height: 50, background: '#c8443a', color: '#fafaf7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 18, border: '1px solid #0a0a0a' }}>MR</span>
              <div>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 22, fontWeight: 600, lineHeight: 1 }}>Maya Rodriguez</div>
                <div className="console-dim" style={{ fontSize: 11 }}>maya.r@hey.com · since Mar 2024</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0, marginTop: 12, border: '1px solid #0a0a0a' }}>
              {[['LTV', '$612'], ['ORDERS', '14'], ['AVG BASKET', '$44']].map(([k, v], i) => (
                <div key={k} style={{ padding: 8, borderRight: i < 2 ? '1px solid #0a0a0a' : 'none' }}>
                  <div style={{ fontSize: 9, letterSpacing: '.1em' }}>// {k}</div>
                  <div className="display" style={{ fontSize: 24, lineHeight: 1 }}>{v}</div>
                </div>
              ))}
            </div>

            <div style={{ fontSize: 10, letterSpacing: '.1em', marginTop: 14, marginBottom: 4 }}>// LAST_3_ORDERS</div>
            <div style={{ fontSize: 11 }}>
              {[['#4821', 'TODAY', '$48.20', 'NEW'], ['#4612', '23 APR', '$56.00', 'SHIPPED'], ['#4458', '12 MAR', '$96.40', 'SHIPPED']].map(([id, when, t, st]) => (
                <div key={id} style={{ display: 'grid', gridTemplateColumns: '70px 80px 80px 1fr', padding: '3px 0', borderTop: '1px solid rgba(10,10,10,.15)' }}>
                  <span>{id}</span><span className="console-dim">{when}</span><span>{t}</span><span style={{ background: st === 'NEW' ? '#f4ed37' : 'transparent', padding: '0 5px', fontSize: 10, width: 'fit-content' }}>{st}</span>
                </div>
              ))}
            </div>

            <div style={{ fontSize: 10, letterSpacing: '.1em', marginTop: 14, marginBottom: 4 }}>// BEHAVIOR</div>
            <div style={{ fontSize: 11, lineHeight: 1.5 }}>
              ▸ buys dahlia tees in M (3×) <br />
              ▸ pays via apple pay (100%) <br />
              ▸ opens emails (94%) · clicks (28%) <br />
              ▸ last visit 4m ago · viewing /shop
            </div>

            <div style={{ display: 'flex', gap: 0, marginTop: 12 }}>
              <button style={{ flex: 1, background: '#0a0a0a', color: '#fafaf7', border: 'none', padding: '8px', fontFamily: 'inherit', fontSize: 11, letterSpacing: '.05em' }}>
                <span style={{ background: '#f4ed37', color: '#0a0a0a', padding: '0 4px', marginRight: 6 }}>[M]</span>
                MESSAGE
              </button>
              <button style={{ background: 'transparent', color: '#0a0a0a', border: '1px solid #0a0a0a', borderLeft: 0, padding: '8px 12px', fontFamily: 'inherit', fontSize: 11 }}>+ TAG</button>
            </div>
          </div>
        </div>
      </div>
    </ConsoleChrome>
  );
}

// ═══════════════════════════════════════════════════════════
// 06 · BLOG — Pipeline status board
// ═══════════════════════════════════════════════════════════
function ConsoleBlog() {
  const rows = [
    ['POST.001', 'LIVE',     'Notes from the dye-pot',     'Marisol',  '12 min', 'Tue', '2.1k',    100, '#0a0a0a', 'TREND'],
    ['POST.002', 'LIVE',     'A year of marigold',          'Marisol',  ' 6 min', '8 May','1.4k',    100, '#0a0a0a', ''],
    ['POST.003', 'LIVE',     'Why we stopped sizing',       'Theo',     ' 8 min', '8 May','1.1k',    100, '#0a0a0a', ''],
    ['POST.004', 'SCHED',    'Spring shipping schedule',    'Marisol',  ' 2 min', 'Thu 09:00', '—',  100, '#f4ed37', ''],
    ['POST.005', 'REVIEW',   'Field report · Lagos market', 'Demetrius','14 min', '—',    '—',       92, '#4dd8ff', 'EDITS'],
    ['POST.006', 'DRAFT',    'How we photograph a tee',     'Léa',      ' 9 min', '—',    '—',       67, null,      ''],
    ['POST.007', 'DRAFT',    'Behind the marigold supply',  'Marisol',  '11 min', '—',    '—',       42, null,      'LATE'],
    ['POST.008', 'IDEA',     'Interview: dye-pot weavers',  'Léa',      '—',      '—',    '—',       12, null,      ''],
  ];
  return (
    <ConsoleChrome section="blog" command="journal/pipeline">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
        <h1 className="display" style={{ fontSize: 36, margin: 0, letterSpacing: '-0.02em' }}>
          JOURNAL <span className="console-dim" style={{ fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}>// 8 entries · 3 LIVE · 1 SCHED · 2 DRAFT</span>
        </h1>
        <span style={{ background: '#f4ed37', padding: '4px 8px', fontSize: 11 }}>[N] + NEW DRAFT</span>
      </div>

      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #0a0a0a', fontSize: 11 }}>
        {[['ALL', 8, true], ['LIVE', 3], ['SCHEDULED', 1], ['REVIEW', 1], ['DRAFT', 2], ['IDEA', 1]].map(([t, n, sel], i) => (
          <span key={t} style={{
            padding: '5px 12px',
            background: sel ? '#f4ed37' : 'transparent',
            fontWeight: sel ? 700 : 400,
            borderRight: '1px solid rgba(10,10,10,.2)',
          }}>{t} [{n}]</span>
        ))}
      </div>

      <div style={{ border: '1px solid #0a0a0a', borderTop: 0 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '90px 70px 1.5fr 100px 70px 90px 70px 140px 70px', background: '#0a0a0a', color: '#fafaf7', padding: '6px 0', fontSize: 10, letterSpacing: '.08em' }}>
          {['ID', 'STATE', 'TITLE', 'AUTHOR', 'READ', 'WHEN', 'VIEWS', 'PROGRESS', 'FLAG'].map((h) => <span key={h} style={{ padding: '0 8px' }}>{h}</span>)}
        </div>
        {rows.map(([id, st, title, author, read, when, views, pct, c, flag], i) => (
          <div key={id} style={{
            display: 'grid', gridTemplateColumns: '90px 70px 1.5fr 100px 70px 90px 70px 140px 70px',
            borderTop: i ? '1px solid rgba(10,10,10,.15)' : 'none',
            padding: '7px 0', alignItems: 'center', fontSize: 12,
          }}>
            <span style={{ padding: '0 8px' }} className="console-dim">{id}</span>
            <span style={{ padding: '0 8px' }}>
              <span style={{
                background: c || 'transparent',
                color: c === '#0a0a0a' ? '#fafaf7' : '#0a0a0a',
                border: !c ? '1px solid rgba(10,10,10,.4)' : 'none',
                padding: '1px 5px', fontSize: 10, letterSpacing: '.05em',
              }}>{st}</span>
            </span>
            <span style={{ padding: '0 8px', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 500 }}>{title}</span>
            <span style={{ padding: '0 8px' }} className="console-dim">{author}</span>
            <span style={{ padding: '0 8px' }}>{read}</span>
            <span style={{ padding: '0 8px' }} className="console-dim">{when}</span>
            <span style={{ padding: '0 8px' }}>{views}</span>
            <span style={{ padding: '0 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ flex: 1, height: 3, background: '#0a0a0a', opacity: 0.1 }}>
                <span style={{ display: 'block', height: '100%', width: pct + '%', background: c || '#0a0a0a', opacity: 1 }}></span>
              </span>
              <span style={{ fontSize: 10 }} className="console-dim">{pct}%</span>
            </span>
            <span style={{ padding: '0 8px' }}>
              {flag === 'TREND' && <span style={{ background: '#ff5b22', color: '#fafaf7', padding: '1px 5px', fontSize: 10 }}>◉ TREND</span>}
              {flag === 'LATE' && <span style={{ background: '#ff5b22', color: '#fafaf7', padding: '1px 5px', fontSize: 10 }}>⚑ LATE</span>}
              {flag === 'EDITS' && <span style={{ border: '1px solid #0a0a0a', padding: '1px 5px', fontSize: 10 }}>edits</span>}
            </span>
          </div>
        ))}
      </div>

      {/* Pipeline summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 0, marginTop: 14, border: '1px solid #0a0a0a' }}>
        {[['IDEAS', 1, null], ['DRAFTS', 2, '#f4ed37'], ['REVIEW', 1, null], ['SCHED', 1, null], ['LIVE', 3, '#0a0a0a']].map(([t, n, c], i) => (
          <div key={t} style={{ padding: 10, borderRight: i < 4 ? '1px solid #0a0a0a' : 'none', background: c === '#f4ed37' ? '#f4ed37' : c === '#0a0a0a' ? '#0a0a0a' : 'transparent', color: c === '#0a0a0a' ? '#fafaf7' : '#0a0a0a' }}>
            <div style={{ fontSize: 10, letterSpacing: '.1em' }}>// {t}</div>
            <div className="display" style={{ fontSize: 28, lineHeight: 1 }}>{n}</div>
          </div>
        ))}
      </div>
    </ConsoleChrome>
  );
}

// ═══════════════════════════════════════════════════════════
// 07 · ANALYTICS — Operator pulse
// ═══════════════════════════════════════════════════════════
function ConsoleAnalytics() {
  return (
    <ConsoleChrome section="analytics" command="pulse/30d">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
        <h1 className="display" style={{ fontSize: 36, margin: 0, letterSpacing: '-0.02em' }}>
          PULSE <span className="console-dim" style={{ fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}>// last 30d · streaming</span>
        </h1>
        <div style={{ display: 'flex', gap: 0, fontSize: 11 }}>
          {[['7D'], ['30D', true], ['90D'], ['YTD'], ['ALL']].map(([p, sel], i) => (
            <span key={p} style={{
              padding: '4px 10px', border: '1px solid #0a0a0a',
              marginLeft: i ? -1 : 0,
              background: sel ? '#0a0a0a' : 'transparent',
              color: sel ? '#fafaf7' : '#0a0a0a',
            }}>{p}</span>
          ))}
        </div>
      </div>

      {/* KPI grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0, border: '2px solid #0a0a0a' }}>
        {[
          ['REVENUE', '$48,206', '+18%', '#0a0a0a', 'vs prior 30d', '▁▂▃▃▄▅▅▆▇▇█▇▆▆▇█'],
          ['ORDERS', '412', '+12%', '#0a0a0a', '13.7/day avg', '▂▃▃▄▃▄▅▅▆▆▇▇▆▇▇█'],
          ['VISITORS', '52,084', '+24%', '#f4ed37', 'organic 64%', '▁▁▂▃▃▄▄▅▆▆▆▇▇█▇█'],
          ['CVR', '1.84%', '−0.3pp', '#ff5b22', 'mobile drag', '▆▆▅▅▄▅▄▄▃▃▃▃▂▂▃▂'],
        ].map(([k, v, d, c, sub, spark], i) => (
          <div key={k} style={{ padding: 12, borderRight: i < 3 ? '1px solid #0a0a0a' : 'none', background: c === '#f4ed37' ? '#f4ed37' : 'transparent' }}>
            <div style={{ fontSize: 10, letterSpacing: '.1em' }}>// {k}</div>
            <div className="display" style={{ fontSize: 36, lineHeight: 1, color: c === '#ff5b22' ? '#ff5b22' : '#0a0a0a' }}>{v}</div>
            <div style={{ fontSize: 11, marginTop: 2 }}>
              <span style={{ color: c === '#ff5b22' ? '#ff5b22' : '#0a0a0a' }}>{d.startsWith('−') ? '▼' : '▲'} {d}</span>
              <span className="console-dim"> · {sub}</span>
            </div>
            <div style={{ marginTop: 4, fontSize: 12, letterSpacing: '.06em' }}>{spark}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 0, marginTop: 14 }}>
        {/* Main chart */}
        <div style={{ border: '1px solid #0a0a0a', borderLeftWidth: 2 }}>
          <div style={{ background: '#0a0a0a', color: '#fafaf7', padding: '6px 10px', fontSize: 11, letterSpacing: '.1em', display: 'flex', justifyContent: 'space-between' }}>
            <span>// REVENUE × ORDERS · DAILY</span>
            <span><span style={{ color: '#f4ed37' }}>▬</span> rev &nbsp;<span style={{ color: '#fafaf7' }}>┄</span> orders</span>
          </div>
          <div style={{ padding: 10 }}>
            <svg viewBox="0 0 700 200" style={{ width: '100%' }}>
              {[40, 80, 120, 160].map((y) => <line key={y} x1="0" x2="700" y1={y} y2={y} stroke="rgba(10,10,10,.1)" />)}
              {Array.from({ length: 30 }, (_, j) => {
                const x = j * 23;
                const h = 30 + Math.sin(j / 4) * 25 + Math.cos(j / 2) * 12 + j * 1.8;
                return <rect key={j} x={x + 4} y={180 - h} width={16} height={h} fill="#0a0a0a" />;
              })}
              <path d="M0,170 L23,165 L46,160 L69,155 L92,140 L115,142 L138,130 L161,120 L184,118 L207,108 L230,100 L253,108 L276,90 L299,80 L322,82 L345,68 L368,70 L391,62 L414,60 L437,52 L460,55 L483,42 L506,48 L529,40 L552,38 L575,30 L598,32 L621,28 L644,25 L667,22 L690,20"
                fill="none" stroke="#ff5b22" strokeWidth="2.5" />
              {/* annotation */}
              <line x1="345" x2="345" y1="0" y2="200" stroke="#ff5b22" strokeDasharray="3 3" opacity=".5" />
              <rect x="350" y="6" width="160" height="14" fill="#ff5b22" />
              <text x="354" y="16" fontFamily="JetBrains Mono" fontSize="10" fill="#fafaf7" letterSpacing="1">◉ DAHLIA LAUNCH · MAY 6</text>
            </svg>
          </div>
        </div>

        {/* Side stats */}
        <div style={{ borderTop: '1px solid #0a0a0a', borderRight: '2px solid #0a0a0a', borderBottom: '1px solid #0a0a0a' }}>
          <div style={{ background: '#0a0a0a', color: '#fafaf7', padding: '6px 10px', fontSize: 11, letterSpacing: '.1em' }}>// SOURCES</div>
          {[['ORGANIC', 64, '#0a0a0a'], ['DIRECT', 18, '#0a0a0a'], ['IG', 11, '#ff5b22'], ['EMAIL', 5, '#0a0a0a'], ['OTHER', 2, '#0a0a0a']].map(([k, v, c], i) => (
            <div key={k} style={{ display: 'grid', gridTemplateColumns: '90px 60px 1fr', padding: '6px 10px', borderTop: i ? '1px solid rgba(10,10,10,.15)' : 'none', fontSize: 11, alignItems: 'center' }}>
              <span>{k}</span>
              <span>{v}%</span>
              <span>{'█'.repeat(Math.floor(v / 3))}</span>
            </div>
          ))}

          <div style={{ background: '#f4ed37', padding: '6px 10px', fontSize: 11, letterSpacing: '.1em', borderTop: '2px solid #0a0a0a' }}>// LIVE NOW</div>
          <div style={{ padding: 10 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span className="display" style={{ fontSize: 48, lineHeight: 1 }}>47</span>
              <span style={{ fontSize: 11 }}>viewers · 3 in cart</span>
            </div>
            <div style={{ marginTop: 6, fontSize: 11 }}>
              <div>NA · 28 ████████████████████████████</div>
              <div>EU · 12 ████████████</div>
              <div>ASIA · 7 ███████</div>
            </div>
          </div>
        </div>
      </div>
    </ConsoleChrome>
  );
}

// ═══════════════════════════════════════════════════════════
// 08 · SETTINGS — System config
// ═══════════════════════════════════════════════════════════
function ConsoleSettings() {
  const groups = [
    ['CORE', [
      ['STOREFRONT', 'Studio Marigold · marigold.shop', 'OK', null],
      ['DOMAIN', 'studio-marigold.com · renews 03/05/27', 'OK', null],
      ['IDENTITY', 'logo · palette · tagline', 'OK', null],
    ]],
    ['COMMERCE', [
      ['PAYMENTS', 'stripe · USD · 4 methods', 'OK', null],
      ['SHIPPING', '3 zones · 7 rate cards', 'ATTN', '#f4ed37'],
      ['TAX', 'taxjar · US, CA, EU', 'OK', null],
      ['INVENTORY', 'auto-decrement · low-stock alerts on', 'OK', null],
    ]],
    ['COMMS', [
      ['EMAIL', '12 transactional templates · sender hello@', 'OK', null],
      ['NOTIFY', 'slack #orders · sms low-stock', 'OK', null],
      ['NEWSLETTER', 'klaviyo · 2,847 subscribers', 'OK', null],
    ]],
    ['TEAM & ACCESS', [
      ['TEAM', '4 members · 2 invites pending', 'OK', null],
      ['ROLES', 'admin, editor, fulfillment, viewer', 'OK', null],
      ['SSO', 'google workspace · marigold.shop', 'OK', null],
    ]],
    ['EXTENSIONS', [
      ['INTEGRATIONS', 'klaviyo · shopify · canva +1', '4/18', null],
      ['WEBHOOKS', '4 endpoints · 0 failing', 'OK', null],
      ['API KEYS', '3 active · 0 expired', 'OK', null],
    ]],
    ['SYSTEM', [
      ['BACKUPS', 'auto · last Tue 04:00 · 14 days kept', 'OK', null],
      ['LEGAL', 'GDPR · CCPA · cookie banner', 'REVIEW', '#ff5b22'],
      ['LOGS', 'audit log 30d · streaming on', 'OK', null],
    ]],
  ];
  return (
    <ConsoleChrome section="settings" command="system/config">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
        <h1 className="display" style={{ fontSize: 36, margin: 0, letterSpacing: '-0.02em' }}>
          SYSTEM <span className="console-dim" style={{ fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}>// 19 modules · 1 ATTN · 1 REVIEW</span>
        </h1>
        <span className="console-dim" style={{ fontSize: 11 }}>[/] SEARCH · [↑↓] NAV · [ENTER] OPEN</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 0, border: '1px solid #0a0a0a' }}>
        {groups.map((g, gi) => (
          <div key={g[0]} style={{
            borderRight: gi % 2 === 0 ? '1px solid #0a0a0a' : 'none',
            borderBottom: gi < 4 ? '1px solid #0a0a0a' : 'none',
          }}>
            <div style={{ background: '#0a0a0a', color: '#fafaf7', padding: '6px 12px', fontSize: 11, letterSpacing: '.1em' }}>
              // GROUP_{String(gi + 1).padStart(2, '0')} · {g[0]}
            </div>
            {g[1].map(([k, sub, st, c], i) => (
              <div key={k} style={{
                display: 'grid', gridTemplateColumns: '110px 1fr 70px 30px',
                padding: '8px 12px', borderTop: i ? '1px solid rgba(10,10,10,.1)' : 'none',
                alignItems: 'center', fontSize: 12,
                background: c ? (c === '#ff5b22' ? 'rgba(255,91,34,.06)' : 'rgba(244,237,55,.12)') : 'transparent',
              }}>
                <span style={{ fontWeight: 700, letterSpacing: '.05em' }}>{k}</span>
                <span className="console-dim" style={{ fontSize: 11 }}>{sub}</span>
                <span>
                  <span style={{
                    background: c || 'transparent',
                    color: c === '#ff5b22' ? '#fafaf7' : '#0a0a0a',
                    border: !c ? '1px solid rgba(10,10,10,.3)' : 'none',
                    padding: '1px 6px', fontSize: 10, letterSpacing: '.05em',
                  }}>{st}</span>
                </span>
                <span className="console-dim">→</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div style={{ marginTop: 12, fontSize: 11, display: 'flex', justifyContent: 'space-between' }} className="console-dim">
        <span>// SYSTEM HEALTH · ALL GREEN · uptime 14d 6h · last deploy Tue 03:14</span>
        <span>v2.4.1 · build #842 · region us-east-1</span>
      </div>
    </ConsoleChrome>
  );
}

window.ConsolePages = {
  Dashboard: ConsoleDashboard,
  Pages: ConsolePagesIndex,
  Orders: ConsoleOrders,
  Products: ConsoleProducts,
  Customers: ConsoleCustomers,
  Blog: ConsoleBlog,
  Analytics: ConsoleAnalytics,
  Settings: ConsoleSettings,
};
