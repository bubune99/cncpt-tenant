// Direction A · ATLAS — Editorial map / magazine spread.
// Warm paper, serif display, hairline rules, folio numbers, marginalia.

const ATLAS_W = 1240;
const ATLAS_H = 820;

// ───────── Atomic helpers ─────────
function AtlasChrome({ folio, section, children }) {
  // Magazine spread: left margin index, main content area.
  return (
    <div className="atlas" style={{ width: ATLAS_W, height: ATLAS_H, position: 'relative', overflow: 'hidden' }}>
      {/* Top folio bar */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '14px 36px', borderBottom: '1px solid rgba(26,20,16,.25)' }}>
        <div className="atlas-eyebrow">CMS / Atlas Edition</div>
        <div style={{ flex: 1, textAlign: 'center' }} className="display-i" >— Tuesday, May 16 — Vol. 7 · No. 04 —</div>
        <div className="atlas-eyebrow">Folio {folio}</div>
      </div>
      <div style={{ display: 'flex', height: ATLAS_H - 51 }}>
        {/* Left index margin */}
        <aside style={{ width: 168, padding: '24px 18px 24px 36px', borderRight: '1px solid rgba(26,20,16,.18)' }}>
          <div className="atlas-eyebrow" style={{ marginBottom: 12 }}>Contents</div>
          {[
            ['01', 'Front page', 'dashboard'],
            ['02', 'Pages', 'pages'],
            ['03', 'Orders', 'orders'],
            ['04', 'Products', 'products'],
            ['05', 'Customers', 'customers'],
            ['06', 'Editorial', 'blog'],
            ['07', 'Almanac', 'analytics'],
            ['08', 'Appendix', 'settings'],
          ].map(([n, label, key]) => (
            <div key={key} style={{
              display: 'flex', gap: 8, padding: '6px 0', fontSize: 13,
              borderTop: '1px solid rgba(26,20,16,.12)',
              color: key === section ? '#8b2c1f' : '#1a1410',
              fontWeight: key === section ? 600 : 400,
            }}>
              <span className="mono" style={{ fontSize: 10, opacity: .55, marginTop: 2 }}>{n}</span>
              <span>{label}</span>
              {key === section && <span style={{ marginLeft: 'auto' }} className="display-i atlas-accent">↳</span>}
            </div>
          ))}
          <div className="atlas-eyebrow" style={{ marginTop: 28, marginBottom: 8 }}>Account</div>
          <div style={{ fontSize: 13 }}>Marisol Cheng</div>
          <div className="display-i" style={{ fontSize: 12, color: 'rgba(26,20,16,.55)' }}>Editor-in-chief</div>
        </aside>
        {/* Main column */}
        <main style={{ flex: 1, padding: '24px 36px', overflow: 'hidden' }}>{children}</main>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// 01 · DASHBOARD — Front page
// ═══════════════════════════════════════════════════════════
function AtlasDashboard() {
  return (
    <AtlasChrome folio="A1" section="dashboard">
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
        <div className="atlas-eyebrow">The Front Page</div>
        <div className="atlas-fig" style={{ fontSize: 13 }}>updated 6 min. ago — auto</div>
      </div>
      <h1 className="display" style={{ fontSize: 88, lineHeight: 1, margin: '4px 0 6px', letterSpacing: '-0.035em' }}>
        Tuesday <span className="display-i atlas-accent">Morning.</span>
      </h1>
      <p className="display-i" style={{ fontSize: 22, margin: 0, color: 'rgba(26,20,16,.75)', maxWidth: 720 }}>
        Twelve orders waiting on you, three drafts close to ready, and the dahlia tee just sold out — again.
      </p>
      <div style={{ height: 1, background: '#1a1410', margin: '20px 0' }}></div>

      {/* Two-column body */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 32 }}>
        {/* Lead story = today's revenue */}
        <div>
          <div className="atlas-eyebrow">Lede · Revenue today</div>
          <div className="display" style={{ fontSize: 96, lineHeight: 1, marginTop: 6, letterSpacing: '-0.04em' }}>
            $4,820<span className="display-i" style={{ fontSize: 36, color: 'rgba(26,20,16,.55)' }}>.40</span>
          </div>
          <div className="display-i" style={{ fontSize: 16, color: 'rgba(26,20,16,.65)' }}>
            up <span className="atlas-accent">+18%</span> on this hour last Tuesday
          </div>
          {/* hand-drawn-ish sparkline */}
          <svg viewBox="0 0 600 80" style={{ width: '100%', marginTop: 12 }}>
            <path d="M0,60 C40,55 60,70 90,52 S150,30 200,45 S280,55 330,30 S420,10 480,22 S560,40 600,18" fill="none" stroke="#8b2c1f" strokeWidth="1.5" />
            <path d="M0,60 C40,55 60,70 90,52 S150,30 200,45 S280,55 330,30 S420,10 480,22 S560,40 600,18 L600,80 L0,80 Z" fill="rgba(139,44,31,.08)" />
          </svg>
          <div style={{ display: 'flex', justifyContent: 'space-between' }} className="mono atlas-fig">
            <span>08:00</span><span>11:00</span><span>14:00</span><span>17:00</span><span>now</span>
          </div>

          <div style={{ borderTop: '1px solid rgba(26,20,16,.25)', marginTop: 22, paddingTop: 14 }}>
            <div className="atlas-eyebrow">In the wings</div>
            <ol style={{ paddingLeft: 18, fontSize: 14, lineHeight: 1.65, margin: '8px 0 0' }}>
              <li><b>3 product drafts</b> from yesterday — needs imagery <span className="display-i atlas-fig">· half-finished</span></li>
              <li><b>2 customer enquiries</b> sitting in the inbox <span className="display-i atlas-fig">· oldest: 19h</span></li>
              <li><b>Newsletter</b> scheduled for Thursday at 09:00 <span className="display-i atlas-fig">· 2,847 recipients</span></li>
            </ol>
          </div>
        </div>

        {/* Right column — sidebars */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ background: '#f5efe2', padding: 16, border: '1px solid rgba(26,20,16,.2)' }}>
            <div className="atlas-eyebrow">Awaiting you</div>
            <div className="display" style={{ fontSize: 56, lineHeight: 1, marginTop: 4 }}>12</div>
            <div className="display-i" style={{ fontSize: 14, marginBottom: 10, color: 'rgba(26,20,16,.65)' }}>orders, oldest 4h ago</div>
            <div style={{ fontSize: 12, paddingTop: 8, borderTop: '1px solid rgba(26,20,16,.2)' }}>
              {['#4821 · Maya R.', '#4820 · Edwin L.', '#4819 · Sun-Hee P.'].map((x, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                  <span>{x}</span>
                  <span className="mono atlas-fig">$48.20</span>
                </div>
              ))}
              <div className="display-i atlas-accent" style={{ marginTop: 6 }}>9 more →</div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid #1a1410', borderBottom: '1px solid #1a1410', padding: '14px 0' }}>
            <div className="atlas-eyebrow">Of note</div>
            <p className="display-i" style={{ fontSize: 16, lineHeight: 1.4, margin: '6px 0 0' }}>
              "Dahlia tee" sold out in <b className="atlas-accent">size M</b>. Restock or hide variant?
            </p>
            <div style={{ fontSize: 12, marginTop: 8, color: '#8b2c1f' }}>→ Resolve · Snooze · Hide</div>
          </div>

          <div>
            <div className="atlas-eyebrow">Almanac · this week</div>
            <table style={{ width: '100%', fontSize: 13, marginTop: 6, borderCollapse: 'collapse' }}>
              <tbody>
                {[['Visitors', '12,402', '+8%'], ['Orders', '94', '+12%'], ['Avg. basket', '$54.10', '−3%'], ['Returns', '2', '—']].map(([k, v, d], i) => (
                  <tr key={i} style={{ borderTop: '1px solid rgba(26,20,16,.18)' }}>
                    <td style={{ padding: '6px 0' }}>{k}</td>
                    <td className="mono" style={{ padding: '6px 0', textAlign: 'right' }}>{v}</td>
                    <td className="display-i atlas-accent" style={{ padding: '6px 0', textAlign: 'right', width: 50 }}>{d}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AtlasChrome>
  );
}

// ═══════════════════════════════════════════════════════════
// 02 · PAGES — Site as a book's table of contents
// ═══════════════════════════════════════════════════════════
function AtlasPagesIndex() {
  const chapters = [
    {
      ch: 'I', title: 'Storefront', count: 4,
      pages: [
        ['Home', '/', '6 May', 'PUBLISHED'],
        ['About us', '/about', '2 May', 'PUBLISHED'],
        ['Contact', '/contact', '14 Apr', 'PUBLISHED'],
        ['Studio rentals', '/studio-rentals', '12 May', 'DRAFT'],
      ],
    },
    {
      ch: 'II', title: 'Catalog', count: 3,
      pages: [
        ['Shop index', '/shop', '8 May', 'PUBLISHED'],
        ['Categories', '/categories', '8 May', 'PUBLISHED'],
        ['Events & rentals', '/events-rentals', '9 May', 'PUBLISHED'],
      ],
    },
    {
      ch: 'III', title: 'Editorial', count: 2,
      pages: [
        ['Blog index', '/posts', '11 May', 'PUBLISHED'],
        ['Demo · animations', '/demo-animation', '15 May', 'DRAFT'],
      ],
    },
    {
      ch: 'IV', title: 'Legal & service', count: 3,
      pages: [
        ['Privacy policy', '/legal/privacy', '1 Apr', 'PUBLISHED'],
        ['Terms of service', '/legal/terms', '1 Apr', 'PUBLISHED'],
        ['FAQs', '/faqs', '20 Apr', 'PUBLISHED'],
      ],
    },
  ];
  return (
    <AtlasChrome folio="A2" section="pages">
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <div>
          <div className="atlas-eyebrow">Section II</div>
          <h1 className="display" style={{ fontSize: 64, lineHeight: 1, margin: '4px 0', letterSpacing: '-0.03em' }}>
            The Pages.
          </h1>
          <div className="display-i" style={{ fontSize: 16, color: 'rgba(26,20,16,.65)' }}>
            Twelve pages across four chapters. Eleven published, one in draft.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={{ background: 'transparent', border: '1px solid #1a1410', padding: '8px 14px', fontFamily: 'inherit', fontSize: 13, cursor: 'pointer' }}>Search ⌘K</button>
          <button style={{ background: '#1a1410', color: '#efe7d8', border: 'none', padding: '8px 14px', fontFamily: 'inherit', fontSize: 13, cursor: 'pointer' }} className="display-i">+ New page</button>
        </div>
      </div>
      <div style={{ height: 1, background: '#1a1410', margin: '16px 0' }}></div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 36, rowGap: 18 }}>
        {chapters.map((c) => (
          <div key={c.ch}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 4 }}>
              <span className="display" style={{ fontSize: 36, color: '#8b2c1f' }}>{c.ch}</span>
              <span className="display" style={{ fontSize: 22 }}>{c.title}</span>
              <span className="display-i" style={{ fontSize: 13, color: 'rgba(26,20,16,.55)' }}>· {c.count} pages</span>
            </div>
            {c.pages.map(([title, slug, date, status]) => (
              <div key={slug} style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto auto',
                alignItems: 'baseline',
                gap: 10,
                padding: '8px 0',
                borderTop: '1px solid rgba(26,20,16,.18)',
              }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 500 }}>{title}</div>
                  <div className="mono" style={{ fontSize: 11, color: 'rgba(26,20,16,.55)' }}>{slug}</div>
                </div>
                <div className="display-i" style={{ fontSize: 12, color: 'rgba(26,20,16,.55)' }}>{date}</div>
                <div style={{
                  fontSize: 10, letterSpacing: '.12em',
                  fontFamily: "'Geist Mono', monospace",
                  color: status === 'DRAFT' ? '#8b2c1f' : '#1a1410',
                  border: status === 'DRAFT' ? '1px solid #8b2c1f' : 'none',
                  padding: status === 'DRAFT' ? '2px 6px' : '0',
                }}>
                  {status === 'PUBLISHED' ? '●' : ''} {status}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </AtlasChrome>
  );
}

// ═══════════════════════════════════════════════════════════
// 03 · ORDERS — Manifest / ledger
// ═══════════════════════════════════════════════════════════
function AtlasOrders() {
  const rows = [
    ['#4821', 'Maya Rodriguez', 'Brooklyn NY', '$48.20', 'today, 09:14', 'NEW', true],
    ['#4820', 'Edwin Lacroix', 'Montréal QC', '$112.00', 'today, 08:02', 'PAID', false],
    ['#4819', 'Sun-Hee Park', 'Vancouver BC', '$74.50', 'yesterday', 'PACKED', false],
    ['#4818', 'Theo Mensah', 'Boston MA', '$192.40', 'yesterday', 'SHIPPED', false],
    ['#4817', 'Léa Bourgeois', 'Bordeaux FR', '$58.00', '14 May', 'SHIPPED', false],
    ['#4816', 'Ivy Tanaka', 'Osaka JP', '$220.00', '14 May', 'RETURNED', false],
  ];
  return (
    <AtlasChrome folio="A3" section="orders">
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <div>
          <div className="atlas-eyebrow">Section III · The Manifest</div>
          <h1 className="display" style={{ fontSize: 64, lineHeight: 1, margin: '4px 0' }}>Orders.</h1>
        </div>
        <div className="display-i" style={{ fontSize: 14, color: 'rgba(26,20,16,.65)' }}>
          94 this week · <span className="atlas-accent">12 awaiting you</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 12, marginTop: 14, fontSize: 12 }} className="mono">
        {['All · 94', 'New · 12', 'Paid · 41', 'Packed · 18', 'Shipped · 19', 'Returned · 4'].map((t, i) => (
          <span key={t} style={{
            padding: '4px 10px',
            borderBottom: i === 1 ? '2px solid #8b2c1f' : '1px solid rgba(26,20,16,.18)',
            color: i === 1 ? '#8b2c1f' : '#1a1410',
            fontWeight: i === 1 ? 600 : 400,
          }}>{t}</span>
        ))}
      </div>
      <div style={{ height: 1, background: '#1a1410', marginTop: 10 }}></div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.55fr 1fr', gap: 28, marginTop: 14 }}>
        {/* Left: the ledger */}
        <div>
          {rows.map(([id, name, place, total, when, status, active]) => (
            <div key={id} style={{
              display: 'grid',
              gridTemplateColumns: '60px 1fr auto auto',
              alignItems: 'baseline',
              gap: 12,
              padding: '14px 12px',
              borderTop: '1px solid rgba(26,20,16,.2)',
              background: active ? '#f5efe2' : 'transparent',
              borderLeft: active ? '3px solid #8b2c1f' : '3px solid transparent',
            }}>
              <div className="mono" style={{ fontSize: 13, color: active ? '#8b2c1f' : '#1a1410' }}>{id}</div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 500 }}>{name}</div>
                <div className="display-i" style={{ fontSize: 13, color: 'rgba(26,20,16,.6)' }}>{place} · {when}</div>
              </div>
              <div className="mono" style={{ fontSize: 14 }}>{total}</div>
              <div style={{
                fontSize: 10, letterSpacing: '.1em',
                fontFamily: "'Geist Mono', monospace",
                color: ['NEW', 'RETURNED'].includes(status) ? '#8b2c1f' : 'rgba(26,20,16,.7)',
              }}>{status}</div>
            </div>
          ))}
        </div>

        {/* Right: receipt-style detail */}
        <div style={{ background: '#f5efe2', padding: 18, border: '1px solid #1a1410' }}>
          <div className="atlas-eyebrow">Now reading</div>
          <div className="display" style={{ fontSize: 32, marginTop: 4, letterSpacing: '-0.02em' }}>#4821 — Maya R.</div>
          <div className="display-i" style={{ fontSize: 13, color: 'rgba(26,20,16,.65)' }}>Placed Tue 16 May, 09:14 EST</div>
          <div style={{ height: 1, borderTop: '1px dashed rgba(26,20,16,.4)', margin: '12px 0' }}></div>
          <div style={{ fontSize: 13 }}>
            {[
              ['Dahlia tee · M', '$32.00'],
              ['Marigold cap', '$16.20'],
            ].map(([k, v], i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                <span>{k}</span><span className="mono">{v}</span>
              </div>
            ))}
            <div style={{ borderTop: '1px solid #1a1410', marginTop: 6, paddingTop: 6, display: 'flex', justifyContent: 'space-between' }}>
              <span className="display">Subtotal</span><span className="mono">$48.20</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }} className="display-i atlas-fig"><span>shipping</span><span>standard · free</span></div>
          </div>
          <div style={{ marginTop: 14, fontSize: 12 }}>
            <div className="atlas-eyebrow" style={{ marginBottom: 4 }}>Ship to</div>
            <div>Maya Rodriguez<br />241 Withers St, Apt 3<br />Brooklyn NY 11211</div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button style={{ flex: 1, background: '#1a1410', color: '#efe7d8', border: 'none', padding: '10px', fontFamily: 'inherit', fontSize: 13, cursor: 'pointer' }} className="display-i">Pack & ship →</button>
            <button style={{ background: 'transparent', border: '1px solid #1a1410', padding: '10px 14px', fontFamily: 'inherit', fontSize: 13, cursor: 'pointer' }}>Refund</button>
          </div>
        </div>
      </div>
    </AtlasChrome>
  );
}

// ═══════════════════════════════════════════════════════════
// 04 · PRODUCTS — Museum catalog
// ═══════════════════════════════════════════════════════════
function AtlasProducts() {
  const swatches = [
    ['Dahlia tee', '$32.00', 'SHIRT-DAH-M', '#c8443a', 18, 'M, L, XL'],
    ['Marigold cap', '$16.20', 'CAP-MAR-OS', '#e7a23b', 22, 'one size'],
    ['Indigo scarf', '$48.00', 'SCRF-IND-OS', '#3a4a8b', 7, 'one size'],
    ['Ash totebag', '$28.00', 'TOTE-ASH-L', '#88857a', 41, 'L'],
    ['Bone ceramic mug', '$22.00', 'MUG-BON-OS', '#e6dbc7', 4, 'one size'],
    ['Linen apron', '$54.00', 'APRN-LIN-OS', '#c4b8a0', 12, 'S, M, L'],
  ];
  return (
    <AtlasChrome folio="A4" section="products">
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <div>
          <div className="atlas-eyebrow">Section IV · Specimens</div>
          <h1 className="display" style={{ fontSize: 64, lineHeight: 1, margin: '4px 0' }}>
            The <span className="display-i atlas-accent">catalog</span>.
          </h1>
          <div className="display-i" style={{ fontSize: 15, color: 'rgba(26,20,16,.65)' }}>
            104 active SKUs across 12 categories — sorted by hand.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <span className="mono" style={{ fontSize: 11, border: '1px solid rgba(26,20,16,.3)', padding: '4px 8px' }}>Grid</span>
          <span className="mono" style={{ fontSize: 11, color: 'rgba(26,20,16,.5)' }}>· List</span>
          <button style={{ background: '#1a1410', color: '#efe7d8', border: 'none', padding: '8px 14px', fontFamily: 'inherit', fontSize: 13, cursor: 'pointer' }} className="display-i">+ New specimen</button>
        </div>
      </div>
      <div style={{ height: 1, background: '#1a1410', margin: '14px 0' }}></div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 22 }}>
        {swatches.map(([name, price, sku, color, stock, sizes], i) => (
          <div key={sku} style={{ borderTop: '1px solid #1a1410', paddingTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }} className="mono atlas-fig">
              <span>Plate {String(i + 1).padStart(2, '0')}</span>
              <span>{sku}</span>
            </div>
            <div style={{
              height: 130,
              background: color,
              marginTop: 8,
              position: 'relative',
              border: '1px solid rgba(26,20,16,.3)',
            }}>
              <span style={{
                position: 'absolute', bottom: 6, right: 8,
                fontFamily: "'Geist Mono', monospace", fontSize: 10,
                color: 'rgba(255,255,255,.8)',
              }}>{color}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 8 }}>
              <div className="display" style={{ fontSize: 22, letterSpacing: '-0.02em' }}>{name}</div>
              <div className="display" style={{ fontSize: 20, color: '#8b2c1f' }}>{price}</div>
            </div>
            <div className="display-i" style={{ fontSize: 13, color: 'rgba(26,20,16,.65)' }}>
              {stock < 10 ? <><span className="atlas-accent">{stock} left</span> · </> : <>{stock} on hand · </>}
              {sizes}
            </div>
          </div>
        ))}
      </div>
    </AtlasChrome>
  );
}

// ═══════════════════════════════════════════════════════════
// 05 · CUSTOMERS — Roster
// ═══════════════════════════════════════════════════════════
function AtlasCustomers() {
  const cust = [
    ['Maya', 'Rodriguez', 'MR', '#c8443a', 'Brooklyn NY', 14, '$612', 'Mar 2024'],
    ['Edwin', 'Lacroix', 'EL', '#3a4a8b', 'Montréal QC', 9, '$418', 'Apr 2024'],
    ['Sun-Hee', 'Park', 'SP', '#e7a23b', 'Vancouver BC', 22, '$1,140', 'Nov 2023'],
    ['Theo', 'Mensah', 'TM', '#5a7f4e', 'Boston MA', 6, '$348', 'Jan 2025'],
    ['Léa', 'Bourgeois', 'LB', '#8b2c1f', 'Bordeaux FR', 3, '$108', 'Feb 2025'],
    ['Ivy', 'Tanaka', 'IT', '#3a4a8b', 'Osaka JP', 18, '$880', 'Aug 2024'],
    ['Demetrius', 'Okafor', 'DO', '#88857a', 'Lagos NG', 4, '$192', 'Mar 2025'],
  ];
  return (
    <AtlasChrome folio="A5" section="customers">
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <div>
          <div className="atlas-eyebrow">Section V · The Roster</div>
          <h1 className="display" style={{ fontSize: 64, lineHeight: 1, margin: '4px 0' }}>Customers.</h1>
          <div className="display-i" style={{ fontSize: 15, color: 'rgba(26,20,16,.65)' }}>
            2,847 people on the books · 412 in the loyal cohort · 18 new this week
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 22, marginTop: 14, fontSize: 13 }}>
        {[['All', 2847], ['Loyal · 5+ orders', 412], ['VIP · $500+', 188], ['Lapsed', 64], ['New (7d)', 18]].map(([label, count], i) => (
          <div key={label} style={{ borderLeft: i > 0 ? '1px solid rgba(26,20,16,.2)' : 'none', paddingLeft: i > 0 ? 22 : 0 }}>
            <div className="atlas-eyebrow">{label}</div>
            <div className="display" style={{ fontSize: 24, marginTop: 2 }}>{count.toLocaleString()}</div>
          </div>
        ))}
      </div>
      <div style={{ height: 1, background: '#1a1410', margin: '16px 0' }}></div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0 32px' }}>
        {cust.map(([first, last, init, color, place, orders, total, since], i) => (
          <div key={i} style={{ display: 'flex', gap: 14, padding: '14px 0', borderTop: '1px solid rgba(26,20,16,.2)', alignItems: 'center' }}>
            <div style={{
              width: 44, height: 44, borderRadius: '50%',
              background: color, color: '#f5efe2',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: "'Spectral', serif", fontSize: 18, fontWeight: 500,
              flexShrink: 0, border: '1px solid #1a1410',
            }}>{init}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="display" style={{ fontSize: 20, lineHeight: 1.1 }}>
                {first} <span className="display-i">{last}</span>
              </div>
              <div className="display-i" style={{ fontSize: 13, color: 'rgba(26,20,16,.6)' }}>{place} · with us since {since}</div>
            </div>
            <div style={{ textAlign: 'right', minWidth: 100 }}>
              <div className="display" style={{ fontSize: 18, color: '#8b2c1f' }}>{total}</div>
              <div className="mono atlas-fig" style={{ fontSize: 11 }}>{orders} orders</div>
            </div>
          </div>
        ))}
      </div>
    </AtlasChrome>
  );
}

// ═══════════════════════════════════════════════════════════
// 06 · BLOG — Editorial pipeline
// ═══════════════════════════════════════════════════════════
function AtlasBlog() {
  const posts = [
    ['Notes from the dye-pot: a year of marigold', 'Marisol Cheng', '12 min read', 'PUBLISHED', 'Tuesday'],
    ['Why we stopped sizing by S/M/L', 'Theo Mensah', '6 min read', 'PUBLISHED', '8 May'],
    ['Field report: Lagos textile market', 'Demetrius Okafor', '14 min read', 'IN REVIEW', '—'],
    ['Spring shipping schedule', 'Marisol Cheng', '2 min read', 'DRAFT', '—'],
    ['How we photograph a tee', 'Léa Bourgeois', '9 min read', 'DRAFT', '—'],
  ];
  return (
    <AtlasChrome folio="A6" section="blog">
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <div>
          <div className="atlas-eyebrow">Section VI · Editorial</div>
          <h1 className="display" style={{ fontSize: 64, lineHeight: 1, margin: '4px 0' }}>The <span className="display-i">Journal</span>.</h1>
        </div>
        <button style={{ background: '#1a1410', color: '#efe7d8', border: 'none', padding: '8px 14px', fontFamily: 'inherit', fontSize: 13, cursor: 'pointer' }} className="display-i">+ New article</button>
      </div>
      <div style={{ height: 1, background: '#1a1410', margin: '14px 0' }}></div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 32 }}>
        {/* Featured */}
        <div>
          <div className="atlas-eyebrow">This week's feature</div>
          <h2 className="display" style={{ fontSize: 48, lineHeight: 1.05, margin: '6px 0 8px', letterSpacing: '-0.02em' }}>
            Notes from the <span className="display-i atlas-accent">dye-pot</span>: a year of marigold.
          </h2>
          <div className="display-i" style={{ fontSize: 15, color: 'rgba(26,20,16,.65)' }}>
            By Marisol Cheng · 12 min · published Tuesday
          </div>
          <p style={{ fontSize: 14, lineHeight: 1.65, marginTop: 12, columnCount: 2, columnGap: 22, color: 'rgba(26,20,16,.85)' }}>
            A year ago we replaced our synthetic yellows with hand-pressed marigold petals from a co-op in Guanajuato. The colors weren't what we expected. Neither were the smells. Twelve months on, here's everything we got wrong, and the four small machines we built to get it right.
          </p>
          <div style={{ display: 'flex', gap: 22, marginTop: 14, fontSize: 13 }}>
            <span><b className="display">2,104</b> <span className="display-i atlas-fig">views</span></span>
            <span><b className="display">48</b> <span className="display-i atlas-fig">comments</span></span>
            <span><b className="display">11</b> <span className="display-i atlas-fig">shares</span></span>
          </div>

          <div style={{ height: 1, background: '#1a1410', margin: '22px 0 12px' }}></div>
          <div className="atlas-eyebrow">Up next on the bench</div>
          {posts.slice(1).map(([title, author, read, status, when], i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 10, padding: '10px 0', borderTop: '1px solid rgba(26,20,16,.18)', alignItems: 'baseline' }}>
              <div>
                <div style={{ fontSize: 15 }}>{title}</div>
                <div className="display-i" style={{ fontSize: 12, color: 'rgba(26,20,16,.6)' }}>by {author} · {read}</div>
              </div>
              <div className="display-i atlas-fig" style={{ fontSize: 12 }}>{when}</div>
              <div className="mono" style={{
                fontSize: 10, letterSpacing: '.1em',
                color: status === 'DRAFT' ? '#8b2c1f' : status === 'IN REVIEW' ? '#1a1410' : 'rgba(26,20,16,.55)',
                border: status !== 'PUBLISHED' ? '1px solid currentColor' : 'none',
                padding: status !== 'PUBLISHED' ? '2px 6px' : 0,
              }}>{status}</div>
            </div>
          ))}
        </div>

        {/* Right: column inches sidebar */}
        <div>
          <div style={{ background: '#f5efe2', padding: 16, border: '1px solid rgba(26,20,16,.2)' }}>
            <div className="atlas-eyebrow">By section</div>
            {[['Process notes', 18], ['Field reports', 11], ['Looks & lookbooks', 24], ['Shop news', 14]].map(([k, v], i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderTop: i ? '1px solid rgba(26,20,16,.18)' : 'none', fontSize: 14 }}>
                <span>{k}</span><span className="mono">{v}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 18 }}>
            <div className="atlas-eyebrow">Pipeline</div>
            <div className="display-i" style={{ fontSize: 13, color: 'rgba(26,20,16,.7)', marginTop: 6 }}>
              "Cadence has slipped a little. <span className="atlas-accent">3 drafts</span> have been sitting more than 10 days. Consider a Friday review."
            </div>
          </div>
          <div style={{ marginTop: 18 }}>
            <div className="atlas-eyebrow">Most-read this month</div>
            <ol style={{ fontSize: 13, paddingLeft: 18, marginTop: 6, lineHeight: 1.7 }}>
              <li>Notes from the dye-pot <span className="display-i atlas-fig">· 2.1k</span></li>
              <li>Why we stopped sizing <span className="display-i atlas-fig">· 1.4k</span></li>
              <li>How a marigold becomes yellow <span className="display-i atlas-fig">· 1.1k</span></li>
            </ol>
          </div>
        </div>
      </div>
    </AtlasChrome>
  );
}

// ═══════════════════════════════════════════════════════════
// 07 · ANALYTICS — Almanac
// ═══════════════════════════════════════════════════════════
function AtlasAnalytics() {
  return (
    <AtlasChrome folio="A7" section="analytics">
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <div>
          <div className="atlas-eyebrow">Section VII</div>
          <h1 className="display" style={{ fontSize: 64, lineHeight: 1, margin: '4px 0' }}>
            The <span className="display-i atlas-accent">Almanac</span>.
          </h1>
          <div className="display-i" style={{ fontSize: 15, color: 'rgba(26,20,16,.65)' }}>
            What is going on, in long form. Last 30 days · ending Tuesday.
          </div>
        </div>
        <div className="mono" style={{ fontSize: 11, display: 'flex', gap: 4 }}>
          {['7d', '30d', '90d', 'YTD'].map((p, i) => (
            <span key={p} style={{ padding: '4px 8px', border: '1px solid #1a1410', background: i === 1 ? '#1a1410' : 'transparent', color: i === 1 ? '#efe7d8' : '#1a1410' }}>{p}</span>
          ))}
        </div>
      </div>
      <div style={{ height: 1, background: '#1a1410', margin: '14px 0' }}></div>

      {/* Big four numbers like newspaper subheads */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
        {[
          ['Revenue', '$48,206', '+18%', 'on prior 30d'],
          ['Orders', '412', '+12%', 'avg 13.7 / day'],
          ['Visitors', '52,084', '+24%', 'organic share 64%'],
          ['Conversion', '1.84%', '−0.3pp', 'mobile dragging it'],
        ].map(([k, v, delta, sub], i) => (
          <div key={k} style={{ borderTop: '1px solid #1a1410', paddingTop: 10 }}>
            <div className="atlas-eyebrow">{k}</div>
            <div className="display" style={{ fontSize: 42, lineHeight: 1.1, marginTop: 4, letterSpacing: '-0.02em' }}>{v}</div>
            <div className="display-i" style={{ fontSize: 13, color: 'rgba(26,20,16,.65)' }}>
              <span className={delta.startsWith('-') || delta.startsWith('−') ? '' : 'atlas-accent'}>{delta}</span> <span>{sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Main story chart */}
      <div style={{ marginTop: 24, borderTop: '1px solid #1a1410', paddingTop: 14 }}>
        <div className="atlas-eyebrow">The story of these 30 days</div>
        <div className="display-i" style={{ fontSize: 14, color: 'rgba(26,20,16,.65)', marginBottom: 6 }}>
          revenue (—) and orders (- - -), daily
        </div>
        <svg viewBox="0 0 1100 200" style={{ width: '100%' }}>
          {[0, 50, 100, 150, 200].map((y) => <line key={y} x1="0" x2="1100" y1={y} y2={y} stroke="rgba(26,20,16,.1)" />)}
          <path d="M0,150 C30,140 60,90 100,120 S180,160 240,100 S320,130 400,80 S500,90 580,40 S680,80 760,60 S860,30 940,50 S1040,80 1100,40"
            fill="none" stroke="#8b2c1f" strokeWidth="1.8" />
          <path d="M0,170 C40,165 80,150 120,160 S200,170 280,140 S380,150 460,120 S560,130 640,100 S740,110 820,80 S920,90 1000,70 S1080,80 1100,75"
            fill="none" stroke="#1a1410" strokeWidth="1.2" strokeDasharray="4 4" />
          {/* annotation */}
          <line x1="580" x2="580" y1="40" y2="200" stroke="rgba(26,20,16,.4)" strokeDasharray="2 2" />
          <text x="586" y="22" fontFamily="Spectral" fontStyle="italic" fontSize="13" fill="#8b2c1f">Dahlia tee launch — May 6</text>
        </svg>
        <div style={{ display: 'flex', justifyContent: 'space-between' }} className="mono atlas-fig">
          <span>Apr 17</span><span>Apr 24</span><span>May 1</span><span>May 8</span><span>May 15</span>
        </div>
      </div>

      {/* Two sidenotes */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28, marginTop: 18 }}>
        <div>
          <div className="atlas-eyebrow">Where they come from</div>
          {[['Organic search', '64%', 100], ['Direct', '18%', 28], ['Instagram', '11%', 17], ['Newsletter', '5%', 8], ['Other', '2%', 3]].map(([k, v, w], i) => (
            <div key={k} style={{ padding: '6px 0', borderTop: '1px solid rgba(26,20,16,.18)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span>{k}</span><span className="mono">{v}</span>
              </div>
              <div style={{ height: 2, background: 'rgba(26,20,16,.1)', marginTop: 4 }}>
                <div style={{ height: 2, background: '#8b2c1f', width: w + '%' }}></div>
              </div>
            </div>
          ))}
        </div>
        <div>
          <div className="atlas-eyebrow">Notes from the editor</div>
          <p className="display-i" style={{ fontSize: 14, lineHeight: 1.6, marginTop: 8 }}>
            The dye-pot piece is doing the heavy lifting on organic — three new product pages now rank in the top 10 for "natural dyed apron". Mobile conversion is still flat; the cart drawer is the suspect.
          </p>
        </div>
      </div>
    </AtlasChrome>
  );
}

// ═══════════════════════════════════════════════════════════
// 08 · SETTINGS — Appendix
// ═══════════════════════════════════════════════════════════
function AtlasSettings() {
  const apps = [
    ['§A', 'Storefront identity', 'Name, logo, palette, tagline', '4 fields'],
    ['§B', 'Domain & DNS', 'studio-marigold.com · auto-renews 3 May 2027', 'healthy'],
    ['§C', 'Payments', 'Stripe · USD · 4 saved methods', 'connected'],
    ['§D', 'Shipping', '3 zones · 7 rate cards', 'edit'],
    ['§E', 'Taxes', 'Auto via TaxJar · US, CA, EU', 'connected'],
    ['§F', 'Email & notifications', '12 templates · sender hello@', 'edit'],
    ['§G', 'Team & roles', '4 members · 2 invites pending', 'edit'],
    ['§H', 'Integrations', 'Klaviyo · Shopify · WooCommerce · Canva', '4 of 18 active'],
    ['§I', 'Legal & compliance', 'GDPR, CCPA, cookie banner', 'review'],
    ['§J', 'Backups & exports', 'Last backup: Tue 04:00', 'healthy'],
  ];
  return (
    <AtlasChrome folio="A8" section="settings">
      <div>
        <div className="atlas-eyebrow">Section VIII</div>
        <h1 className="display" style={{ fontSize: 64, lineHeight: 1, margin: '4px 0' }}>The <span className="display-i">Appendix</span>.</h1>
        <div className="display-i" style={{ fontSize: 15, color: 'rgba(26,20,16,.65)' }}>
          The machinery of the shop. Open the chapter you need.
        </div>
      </div>
      <div style={{ height: 1, background: '#1a1410', margin: '14px 0' }}></div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 36 }}>
        {apps.map(([n, title, desc, badge], i) => (
          <div key={n} style={{
            display: 'grid',
            gridTemplateColumns: '46px 1fr auto',
            alignItems: 'baseline',
            gap: 10,
            padding: '12px 0',
            borderTop: '1px solid rgba(26,20,16,.2)',
          }}>
            <div className="display atlas-accent" style={{ fontSize: 22, lineHeight: 1 }}>{n}</div>
            <div>
              <div className="display" style={{ fontSize: 22, letterSpacing: '-0.01em' }}>{title}</div>
              <div className="display-i" style={{ fontSize: 13, color: 'rgba(26,20,16,.65)', marginTop: 2 }}>{desc}</div>
            </div>
            <div className="mono" style={{
              fontSize: 10, letterSpacing: '.1em',
              padding: '3px 8px',
              border: '1px solid rgba(26,20,16,.5)',
              color: badge === 'healthy' || badge === 'connected' ? '#1a1410' : '#8b2c1f',
            }}>{badge.toUpperCase()}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid #1a1410', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div className="atlas-eyebrow">Colophon</div>
        <div className="display-i" style={{ fontSize: 13, color: 'rgba(26,20,16,.65)' }}>
          Set in Spectral &amp; Geist · CMS v 2.4.1 · last deploy Tue 03:14 EST
        </div>
      </div>
    </AtlasChrome>
  );
}

// Export to window
window.AtlasPages = {
  Dashboard: AtlasDashboard,
  Pages: AtlasPagesIndex,
  Orders: AtlasOrders,
  Products: AtlasProducts,
  Customers: AtlasCustomers,
  Blog: AtlasBlog,
  Analytics: AtlasAnalytics,
  Settings: AtlasSettings,
};
