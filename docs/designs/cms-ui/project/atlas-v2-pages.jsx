// Atlas v2 — 8 page mockups
// Mid-fi: real labels, real numbers, table density, kanban for orders.

const { Chrome, PageHead, Tabs, ActionBar } = window;

// ─────────────────────────────────────────────
// 01 · DASHBOARD
// ─────────────────────────────────────────────
function Dashboard() {
  return (
    <Chrome section="dashboard" notifOpen={true}>
      <div className="main-head">
        <div>
          <div className="eyebrow">Dashboard</div>
          <h1>Tuesday <span className="display-i accent">morning.</span></h1>
          <div className="sub">Twelve orders waiting on you. Dahlia tee sold out in M — third time this month.</div>
        </div>
        <div className="actions">
          <button className="btn"><span className="kbd">⌘K</span>Search</button>
          <button className="btn btn-solid"><span className="kbd">⌘N</span>New</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.55fr 1fr', gap: 32 }}>
        {/* Left column */}
        <div>
          <div className="eyebrow-ink">Revenue today</div>
          <div className="display" style={{ fontSize: 80, lineHeight: 1, letterSpacing: '-0.035em', marginTop: 4 }}>
            $4,820<span className="display-i" style={{ fontSize: 32, color: 'var(--ink-soft)' }}>.40</span>
          </div>
          <div className="display-i" style={{ fontSize: 15, color: 'var(--ink-soft)' }}>
            <span className="accent">+18%</span> on this hour last Tuesday · 38 orders so far
          </div>

          <svg viewBox="0 0 600 70" className="spark" style={{ marginTop: 10 }}>
            <path d="M0,55 C40,50 60,62 90,48 S150,28 200,42 S280,52 330,28 S420,8 480,20 S560,38 600,16" fill="none" stroke="var(--accent)" strokeWidth="1.5" />
            <path d="M0,55 C40,50 60,62 90,48 S150,28 200,42 S280,52 330,28 S420,8 480,20 S560,38 600,16 L600,70 L0,70 Z" fill="rgba(139,44,31,.08)" />
            <circle cx="600" cy="16" r="2.5" fill="var(--accent)" />
          </svg>
          <div style={{ display: 'flex', justifyContent: 'space-between' }} className="mono fig">
            <span style={{ fontSize: 11 }}>08:00</span><span style={{ fontSize: 11 }}>11:00</span><span style={{ fontSize: 11 }}>14:00</span><span style={{ fontSize: 11 }}>17:00</span><span style={{ fontSize: 11 }}>now</span>
          </div>

          {/* Action list — borrowing Console's priority + keyboard hints */}
          <div style={{ borderTop: '1px solid var(--ink)', marginTop: 22, paddingTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
              <div className="eyebrow-ink">On your plate · 5 items</div>
              <div className="fig" style={{ fontSize: 12 }}>1 urgent · 2 today · 2 wait</div>
            </div>
            {[
              ['URGENT', 'Restock dahlia tee · M variant', '0 left · 3rd time this month', 'pill-solid-accent', 'R'],
              ['TODAY',  'Pack orders #4821 #4820 #4819', '$234.70 · expedite #4818',      'pill-solid-gold',   'P'],
              ['TODAY',  'Approve Thursday newsletter',   '2,847 recipients · 09:00 send', 'pill-solid-gold',   'A'],
              ['WAIT',   'Reply customer ticket #cs-22',  'Refund request · 19h old',      'pill-out',          'O'],
              ['REVIEW', "Demetrius · Lagos field report",'92% complete · sitting 12d',    'pill-out',          'V'],
            ].map(([p, t, sub, cls, k], i) => (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: '70px 1fr 24px',
                gap: 12, padding: '10px 0', alignItems: 'baseline',
                borderTop: i ? '1px solid var(--rule-soft)' : 'none',
              }}>
                <span className={'pill ' + cls}>{p}</span>
                <div>
                  <div style={{ fontSize: 14 }}>{t}</div>
                  <div className="fig" style={{ fontSize: 12 }}>{sub}</div>
                </div>
                <span className="mono" style={{ fontSize: 10, background: 'var(--ink)', color: 'var(--paper)', padding: '1px 5px' }}>{k}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Orders queue */}
          <div className="panel" style={{ padding: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <div className="eyebrow-ink">Orders awaiting</div>
              <span className="pill pill-solid-accent">12 NEW</span>
            </div>
            <div className="display" style={{ fontSize: 44, lineHeight: 1, marginTop: 2 }}>12</div>
            <div className="fig" style={{ fontSize: 13, marginBottom: 8 }}>oldest placed 4h ago</div>
            <div style={{ borderTop: '1px solid var(--rule)', paddingTop: 6, fontSize: 12 }}>
              {[['#4821', 'Maya R.', '$48.20', '4m'], ['#4820', 'Edwin L.', '$112.00', '21m'], ['#4819', 'Sun-Hee P.', '$74.50', '2h']].map((r) => (
                <div key={r[0]} style={{ display: 'grid', gridTemplateColumns: '50px 1fr 60px 30px', padding: '4px 0', gap: 4 }}>
                  <span className="mono accent">{r[0]}</span>
                  <span>{r[1]}</span>
                  <span className="mono num" style={{ textAlign: 'right' }}>{r[2]}</span>
                  <span className="fig" style={{ fontSize: 11, textAlign: 'right' }}>{r[3]}</span>
                </div>
              ))}
              <div style={{ fontSize: 12, marginTop: 4 }}><span className="display-i accent">9 more →</span></div>
            </div>
          </div>

          {/* Of note */}
          <div style={{ borderTop: '1px solid var(--ink)', borderBottom: '1px solid var(--ink)', padding: '12px 0' }}>
            <div className="eyebrow-ink">Of note</div>
            <p className="display-i" style={{ fontSize: 15, margin: '6px 0 0', lineHeight: 1.35 }}>
              "Dahlia tee" sold out in <b className="accent">size M</b>. Restock 50, hide variant, or snooze?
            </p>
            <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
              <button className="btn" style={{ padding: '5px 10px', fontSize: 11 }}><span className="kbd">R</span>Restock</button>
              <button className="btn" style={{ padding: '5px 10px', fontSize: 11 }}>Hide</button>
              <button className="btn" style={{ padding: '5px 10px', fontSize: 11 }}>Snooze</button>
            </div>
          </div>

          {/* Week stats */}
          <div>
            <div className="eyebrow-ink" style={{ marginBottom: 6 }}>This week</div>
            <table className="tbl" style={{ fontSize: 12 }}>
              <tbody>
                {[['Visitors', '12,402', '+8%'], ['Orders', '94', '+12%'], ['Avg. basket', '$54.10', '−3%'], ['Returns', '2', '—'], ['Conversion', '1.84%', '−0.3pp']].map(([k, v, d], i) => (
                  <tr key={i}>
                    <td style={{ padding: '6px 0', borderBottom: '1px solid var(--rule-soft)' }}>{k}</td>
                    <td className="num" style={{ padding: '6px 0', borderBottom: '1px solid var(--rule-soft)' }}>{v}</td>
                    <td className="display-i" style={{ padding: '6px 0', borderBottom: '1px solid var(--rule-soft)', textAlign: 'right', color: d.startsWith('−') ? 'var(--ink-soft)' : 'var(--accent)', width: 60, fontSize: 12 }}>{d}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Chrome>
  );
}

// ─────────────────────────────────────────────
// 02 · PAGES — Table view + Grouped (chapter map) view
// ─────────────────────────────────────────────
const PAGES_DATA = [
  { ch: 'I',   title: 'Storefront', sub: 'home & landing surfaces', pages: [
    { name: 'Home',             slug: '/',                edited: '6 May',  editor: 'Marisol', status: 'PUBLISHED', sCls: 'pill-solid-ink',    depth: 0, visits: '12,402', cvr: '1.84%', type: 'Landing', sel: true },
    { name: 'About us',         slug: '/about',           edited: '2 May',  editor: 'Marisol', status: 'PUBLISHED', sCls: 'pill-solid-ink',    depth: 1, visits: '2,108',  cvr: '0.92%', type: 'Page' },
    { name: 'Studio rentals',   slug: '/studio-rentals',  edited: '12 May', editor: 'Léa',     status: 'DRAFT',     sCls: 'pill-out-accent',   depth: 2, visits: '—',      cvr: '—',     type: 'Page' },
    { name: 'Contact',          slug: '/contact',         edited: '14 Apr', editor: 'Marisol', status: 'PUBLISHED', sCls: 'pill-solid-ink',    depth: 1, visits: '1,440',  cvr: '0.41%', type: 'Page' },
  ]},
  { ch: 'II',  title: 'Catalog', sub: 'shop & product browsing', pages: [
    { name: 'Shop index',       slug: '/shop',            edited: '8 May',  editor: 'Marisol', status: 'PUBLISHED', sCls: 'pill-solid-ink',    depth: 0, visits: '8,820',  cvr: '3.21%', type: 'Catalog' },
    { name: 'Categories',       slug: '/categories',      edited: '8 May',  editor: 'Marisol', status: 'PUBLISHED', sCls: 'pill-solid-ink',    depth: 1, visits: '2,402',  cvr: '1.18%', type: 'Catalog' },
    { name: 'Events & rentals', slug: '/events-rentals',  edited: '9 May',  editor: 'Léa',     status: 'PUBLISHED', sCls: 'pill-solid-ink',    depth: 1, visits: '320',    cvr: '0.20%', type: 'Page' },
  ]},
  { ch: 'III', title: 'Editorial', sub: 'journal & long-form pieces', pages: [
    { name: 'Blog index',       slug: '/posts',           edited: '11 May', editor: 'Marisol', status: 'PUBLISHED', sCls: 'pill-solid-ink',    depth: 0, visits: '4,418',  cvr: '0.88%', type: 'Index' },
    { name: 'Animation demo',   slug: '/demo-animation',  edited: '15 May', editor: 'Theo',    status: 'DRAFT',     sCls: 'pill-out-accent',   depth: 1, visits: '—',      cvr: '—',     type: 'Page' },
  ]},
  { ch: 'IV',  title: 'Legal & service', sub: 'policies, support, & footer', pages: [
    { name: 'FAQs',             slug: '/faqs',            edited: '20 Apr', editor: 'Theo',    status: 'PUBLISHED', sCls: 'pill-solid-ink',    depth: 0, visits: '1,202',  cvr: '0.18%', type: 'Page' },
    { name: 'Privacy policy',   slug: '/legal/privacy',   edited: '1 Apr',  editor: 'admin',   status: 'PUBLISHED', sCls: 'pill-solid-ink',    depth: 0, visits: '402',    cvr: '0.04%', type: 'Legal' },
    { name: 'Terms of service', slug: '/legal/terms',     edited: '1 Apr',  editor: 'admin',   status: 'PUBLISHED', sCls: 'pill-solid-ink',    depth: 0, visits: '188',    cvr: '0.02%', type: 'Legal' },
  ]},
];

function PagesTable() {
  const flat = PAGES_DATA.flatMap(c => c.pages);
  return (
    <>
      <table className="tbl" style={{ marginTop: 0 }}>
        <thead>
          <tr>
            <th className="check"><input type="checkbox" /></th>
            <th>Title</th>
            <th>Slug</th>
            <th style={{ width: 80 }}>Type</th>
            <th className="sort" style={{ width: 80 }}>Edited</th>
            <th style={{ width: 90 }}>Editor</th>
            <th style={{ width: 100 }}>Status</th>
            <th className="num" style={{ width: 90 }}>Visits 30d</th>
            <th className="num" style={{ width: 60 }}>CVR</th>
          </tr>
        </thead>
        <tbody>
          {flat.map((p) => (
            <tr key={p.slug} className={p.sel ? 'sel' : ''}>
              <td className="check"><input type="checkbox" defaultChecked={p.sel} /></td>
              <td className="name">{p.name}</td>
              <td><span className="mono" style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{p.slug}</span></td>
              <td><span className="fig" style={{ fontSize: 12 }}>{p.type}</span></td>
              <td><span className="meta">{p.edited}</span></td>
              <td><span className="meta">{p.editor}</span></td>
              <td><span className={'pill ' + p.sCls}>{p.status}</span></td>
              <td className="num">{p.visits}</td>
              <td className="num">{p.cvr}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <ActionBar
        selected={1}
        hints={[['↑↓', 'move'], ['E', 'edit'], ['D', 'duplicate'], ['X', 'archive'], ['P', 'preview']]}
      />
    </>
  );
}

function PagesMap() {
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 36, rowGap: 0 }}>
        {PAGES_DATA.map((c) => (
          <div key={c.ch} style={{ marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, paddingBottom: 6, borderBottom: '1px solid var(--ink)' }}>
              <span className="display accent" style={{ fontSize: 28, lineHeight: 1 }}>{c.ch}</span>
              <span className="display" style={{ fontSize: 22, lineHeight: 1 }}>{c.title}</span>
              <span className="fig" style={{ fontSize: 13 }}>· {c.pages.length} pages</span>
              <span className="fig" style={{ fontSize: 12, marginLeft: 'auto' }}>{c.sub}</span>
            </div>
            {c.pages.map((p) => (
              <div key={p.slug} style={{
                display: 'grid', gridTemplateColumns: '1fr 88px',
                alignItems: 'baseline', gap: 8,
                padding: '8px 0', borderBottom: '1px solid var(--rule-soft)',
                background: p.sel ? 'var(--paper-2)' : 'transparent',
                borderLeft: p.sel ? '3px solid var(--accent)' : '3px solid transparent',
                paddingLeft: p.sel ? 6 : 9,
              }}>
                <div style={{ minWidth: 0, display: 'flex', alignItems: 'baseline', gap: 4 }}>
                  {/* Hierarchy indent */}
                  {p.depth > 0 && (
                    <span style={{ paddingLeft: (p.depth - 1) * 14, color: 'var(--ink-faint)', fontFamily: 'Geist Mono, monospace', fontSize: 12 }}>
                      {'│ '.repeat(Math.max(0, p.depth - 1))}└─
                    </span>
                  )}
                  <span style={{ marginLeft: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: p.depth === 0 ? 500 : 400 }}>{p.name}</span>
                    {' '}
                    <span className="mono" style={{ fontSize: 11, color: 'var(--ink-soft)' }}>{p.slug}</span>
                  </span>
                  <span className="meta" style={{ marginLeft: 'auto', whiteSpace: 'nowrap', paddingLeft: 8 }}>{p.edited}</span>
                </div>
                <div style={{ justifySelf: 'end' }}>
                  <span className={'pill ' + p.sCls}>{p.status}</span>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
      <ActionBar
        selected={1}
        hints={[['↑↓', 'move'], ['Enter', 'open'], ['N', 'new child'], ['G', 'regroup']]}
      />
    </>
  );
}

function Pages() {
  const [view, setView] = React.useState('table');
  return (
    <Chrome section="pages">
      <PageHead
        kicker="Pages"
        title="The"
        titleAccent="pages."
        sub="Twelve pages across four sections · eleven published · two drafts in flight"
        actions={<>
          <span className="mono fig" style={{ fontSize: 11 }}>view:</span>
          <button className={'btn' + (view === 'table' ? ' btn-solid' : '')} style={{ padding: '5px 10px', fontSize: 11 }} onClick={() => setView('table')}>Table</button>
          <button className={'btn' + (view === 'map' ? ' btn-solid' : '')} style={{ padding: '5px 10px', fontSize: 11 }} onClick={() => setView('map')}>Map</button>
          <button className="btn"><span className="kbd">/</span>Search</button>
          <button className="btn btn-solid"><span className="kbd">N</span>+ New page</button>
        </>}
      />
      {view === 'table' && (
        <Tabs
          items={[['All', 12, true], ['Published', 11], ['Drafts', 2], ['Archived', 0], ['Broken links', 0]]}
          right={<><span style={{ color: 'var(--ink-soft)', fontSize: 11 }}>sort: edited ↓</span></>}
        />
      )}
      {view === 'table' ? <PagesTable /> : <PagesMap />}
    </Chrome>
  );
}

// ─────────────────────────────────────────────
// 03 · ORDERS — Board (kanban) + Ledger (table) views
// ─────────────────────────────────────────────
const ORDERS_LANES = [
  { title: 'New', italic: '12 awaiting', cards: [
    { id: '#4821', who: 'Maya Rodriguez',  where: 'Brooklyn NY', amt: '$48.20',  items: 2, age: '4m',   flag: 'M-tee', sel: true },
    { id: '#4820', who: 'Edwin Lacroix',   where: 'Montréal QC', amt: '$112.00', items: 3, age: '21m' },
    { id: '#4819', who: 'Sun-Hee Park',    where: 'Vancouver BC',amt: '$74.50',  items: 2, age: '2h' },
    { id: '#4815', who: 'Aria Singh',      where: 'Mumbai IN',   amt: '$66.00',  items: 2, age: '3h' },
  ]},
  { title: 'Packed', italic: '8 ready', cards: [
    { id: '#4818', who: 'Theo Mensah',     where: 'Boston MA',   amt: '$192.40', items: 4, age: '5h',   flag: 'expedite' },
    { id: '#4814', who: 'Owen Pham',       where: 'Toronto ON',  amt: '$28.00',  items: 1, age: '9h' },
    { id: '#4813', who: 'Hana Wei',        where: 'Seattle WA',  amt: '$118.00', items: 3, age: 'yest' },
  ]},
  { title: 'Shipped', italic: '19 in transit', cards: [
    { id: '#4817', who: 'Léa Bourgeois',   where: 'Bordeaux FR', amt: '$58.00',  items: 2, age: 'yest', track: 'USPS · 3d' },
    { id: '#4812', who: 'Jonas Berg',      where: 'Oslo NO',     amt: '$220.00', items: 5, age: '14 May', track: 'DHL · in transit' },
  ]},
  { title: 'Issue', italic: '2 stuck', alert: true, cards: [
    { id: '#4816', who: 'Ivy Tanaka',      where: 'Osaka JP',    amt: '$220.00', items: 4, age: '14 May', flag: 'RETURN req.' },
    { id: '#4811', who: 'Sasha Volkov',    where: 'Berlin DE',   amt: '$96.00',  items: 2, age: '12 May', flag: 'address invalid' },
  ]},
];

const ORDERS_FLAT = [
  { id: '#4821', who: 'Maya Rodriguez',   email: 'maya.r@hey.com',      where: 'Brooklyn NY',   when: 'today 09:14', items: 2, total: '$48.20',  status: 'NEW',     sCls: 'pill-solid-accent', flag: 'M-tee',         sel: true },
  { id: '#4820', who: 'Edwin Lacroix',    email: 'edwin@lacroix.ca',    where: 'Montréal QC',   when: 'today 08:02', items: 3, total: '$112.00', status: 'PAID',    sCls: 'pill-solid-gold',   flag: '' },
  { id: '#4819', who: 'Sun-Hee Park',     email: 'sunhee.p@hey.com',    where: 'Vancouver BC',  when: 'yesterday',   items: 2, total: '$74.50',  status: 'PACKED',  sCls: 'pill-solid-ink',    flag: '' },
  { id: '#4818', who: 'Theo Mensah',      email: 'theo.m@gmail.com',    where: 'Boston MA',     when: 'yesterday',   items: 4, total: '$192.40', status: 'PACKED',  sCls: 'pill-solid-ink',    flag: 'expedite' },
  { id: '#4817', who: 'Léa Bourgeois',    email: 'lea@bourgeois.fr',    where: 'Bordeaux FR',   when: '14 May',      items: 2, total: '$58.00',  status: 'SHIPPED', sCls: 'pill-solid-moss',   flag: 'USPS · 3d' },
  { id: '#4816', who: 'Ivy Tanaka',       email: 'ivy@studio-it.jp',    where: 'Osaka JP',      when: '14 May',      items: 4, total: '$220.00', status: 'RETURN',  sCls: 'pill-solid-accent', flag: 'return req' },
  { id: '#4815', who: 'Aria Singh',       email: 'aria@studio.in',      where: 'Mumbai IN',     when: '13 May',      items: 2, total: '$66.00',  status: 'NEW',     sCls: 'pill-solid-accent', flag: '' },
  { id: '#4814', who: 'Owen Pham',        email: 'owen@pham.ca',        where: 'Toronto ON',    when: '13 May',      items: 1, total: '$28.00',  status: 'PACKED',  sCls: 'pill-solid-ink',    flag: '' },
  { id: '#4813', who: 'Hana Wei',         email: 'h.wei@hey.com',       where: 'Seattle WA',    when: '13 May',      items: 3, total: '$118.00', status: 'PACKED',  sCls: 'pill-solid-ink',    flag: '' },
  { id: '#4812', who: 'Jonas Berg',       email: 'j.berg@nrk.no',       where: 'Oslo NO',       when: '12 May',      items: 5, total: '$220.00', status: 'SHIPPED', sCls: 'pill-solid-moss',   flag: 'DHL · in transit' },
  { id: '#4811', who: 'Sasha Volkov',     email: 's.volkov@yandex.ru',  where: 'Berlin DE',     when: '12 May',      items: 2, total: '$96.00',  status: 'STUCK',   sCls: 'pill-solid-accent', flag: 'addr invalid' },
];

function OrdersBoard() {
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0, alignItems: 'flex-start' }}>
        {ORDERS_LANES.map((lane, i) => (
          <div key={lane.title} style={{
            padding: '0 14px',
            borderLeft: i ? '1px solid var(--rule)' : 'none',
          }}>
            <div className="kbn-lane-h">
              <span className="display" style={{ fontSize: 22 }}>
                {lane.alert && <span className="accent">⚑ </span>}{lane.title}
              </span>
              <span className="fig" style={{ fontSize: 13, marginLeft: 'auto' }}>{lane.italic}</span>
            </div>

            {lane.cards.map((c) => (
              <div key={c.id} className={'kbn-card' + (c.sel ? ' sel' : '') + (lane.alert ? ' alert' : '')}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                  <span className="mono accent" style={{ fontSize: 12 }}>{c.id}</span>
                  <span className="fig" style={{ fontSize: 11 }}>{c.age}</span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{c.who}</div>
                <div className="fig" style={{ fontSize: 12 }}>{c.where}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 8, paddingTop: 6, borderTop: '1px solid var(--rule-soft)' }}>
                  <span className="fig" style={{ fontSize: 11 }}>{c.items} items</span>
                  <span className="mono" style={{ fontSize: 12 }}>{c.amt}</span>
                </div>
                {c.flag && <div className="mono" style={{ fontSize: 10, color: 'var(--accent)', marginTop: 6, letterSpacing: '.05em' }}>⚑ {c.flag}</div>}
                {c.track && <div className="fig" style={{ fontSize: 11, marginTop: 6 }}>↗ {c.track}</div>}
              </div>
            ))}

            {lane.title === 'New' && <div className="display-i accent" style={{ fontSize: 12, paddingTop: 4 }}>+ 8 more →</div>}
            {lane.title === 'Packed' && <div className="display-i accent" style={{ fontSize: 12, paddingTop: 4 }}>+ 5 more →</div>}
            {lane.title === 'Shipped' && <div className="display-i accent" style={{ fontSize: 12, paddingTop: 4 }}>+ 17 more →</div>}
          </div>
        ))}
      </div>
      <ActionBar
        selected={1}
        hints={[['↑↓ →', 'move card'], ['Enter', 'open'], ['P', 'pack & ship'], ['R', 'refund']]}
      />
    </>
  );
}

function OrdersLedger() {
  return (
    <>
      <Tabs
        items={[['All', 94, true], ['New', 12], ['Paid', 41], ['Packed', 18], ['Shipped', 19], ['Issue', 4]]}
        right={<><span style={{ color: 'var(--ink-soft)', fontSize: 11 }}>sort: placed ↓</span></>}
      />
      <table className="tbl" style={{ marginTop: 0 }}>
        <thead>
          <tr>
            <th className="check"><input type="checkbox" /></th>
            <th style={{ width: 70 }}>Order</th>
            <th>Customer</th>
            <th style={{ width: 140 }}>Location</th>
            <th className="sort" style={{ width: 110 }}>Placed</th>
            <th className="num" style={{ width: 50 }}>Items</th>
            <th className="num" style={{ width: 80 }}>Total</th>
            <th style={{ width: 90 }}>Status</th>
            <th style={{ width: 130 }}>Flag</th>
          </tr>
        </thead>
        <tbody>
          {ORDERS_FLAT.map((o) => (
            <tr key={o.id} className={o.sel ? 'sel' : ''}>
              <td className="check"><input type="checkbox" defaultChecked={o.sel} /></td>
              <td><span className="mono accent">{o.id}</span></td>
              <td>
                <div className="name">{o.who}</div>
                <div className="mono" style={{ fontSize: 11, color: 'var(--ink-soft)' }}>{o.email}</div>
              </td>
              <td><span className="fig" style={{ fontSize: 12 }}>{o.where}</span></td>
              <td><span className="meta">{o.when}</span></td>
              <td className="num">{o.items}</td>
              <td className="num">{o.total}</td>
              <td><span className={'pill ' + o.sCls}>{o.status}</span></td>
              <td>{o.flag && <span className="fig" style={{ fontSize: 11 }}>⚑ {o.flag}</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <ActionBar
        selected={1}
        hints={[['↑↓', 'move'], ['Enter', 'open'], ['P', 'pack & ship'], ['R', 'refund'], ['F', 'flag']]}
      />
    </>
  );
}

function Orders() {
  const [view, setView] = React.useState('board');
  return (
    <Chrome section="orders">
      <PageHead
        kicker="Orders"
        title="The"
        titleAccent={view === 'board' ? 'board.' : 'ledger.'}
        sub="94 this week · 41 fulfilled · 12 awaiting you · 2 stuck"
        actions={<>
          <span className="mono fig" style={{ fontSize: 11 }}>view:</span>
          <button className={'btn' + (view === 'board' ? ' btn-solid' : '')} style={{ padding: '5px 10px', fontSize: 11 }} onClick={() => setView('board')}>Board</button>
          <button className={'btn' + (view === 'ledger' ? ' btn-solid' : '')} style={{ padding: '5px 10px', fontSize: 11 }} onClick={() => setView('ledger')}>Ledger</button>
          <button className="btn btn-solid"><span className="kbd">N</span>+ Order</button>
        </>}
      />
      {view === 'board' ? <OrdersBoard /> : <OrdersLedger />}
    </Chrome>
  );
}

// ─────────────────────────────────────────────
// 04 · PRODUCTS
// ─────────────────────────────────────────────
function Products() {
  const rows = [
    [true,  '#c8443a', 'Dahlia tee · M',     'SHIRT-DAH-M', 'Apparel / Tees', '$32.00',  0, 'OUT OF STOCK', 'pill-solid-accent', '168', '↑'],
    [false, '#c8443a', 'Dahlia tee · L',     'SHIRT-DAH-L', 'Apparel / Tees', '$32.00',  6, 'LOW STOCK',    'pill-solid-gold',   '42', '·'],
    [false, '#c8443a', 'Dahlia tee · XL',    'SHIRT-DAH-XL','Apparel / Tees', '$32.00', 12, 'IN STOCK',     'pill-solid-ink',    '28', '·'],
    [false, '#e7a23b', 'Marigold cap',       'CAP-MAR-OS',  'Accessories',    '$16.20', 22, 'IN STOCK',     'pill-solid-ink',    '92', '↑'],
    [false, '#3a4a8b', 'Indigo scarf',       'SCRF-IND-OS', 'Accessories',    '$48.00',  7, 'LOW STOCK',    'pill-solid-gold',   '54', '·'],
    [false, '#88857a', 'Ash totebag',        'TOTE-ASH-L',  'Accessories',    '$28.00', 41, 'IN STOCK',     'pill-solid-ink',    '34', '↓'],
    [false, '#e6dbc7', 'Bone ceramic mug',   'MUG-BON-OS',  'Home',           '$22.00',  4, 'LOW STOCK',    'pill-solid-gold',   '18', '·'],
    [false, '#c4b8a0', 'Linen apron · S',    'APRN-LIN-S',  'Home',           '$54.00',  8, 'IN STOCK',     'pill-solid-ink',    '14', '·'],
    [false, '#c4b8a0', 'Linen apron · M',    'APRN-LIN-M',  'Home',           '$54.00', 12, 'IN STOCK',     'pill-solid-ink',    '12', '·'],
    [false, '#4f5e3a', 'Moss hand-towel',    'TOWEL-MOS-OS','Home',           '$18.00', 28, 'IN STOCK',     'pill-solid-ink',    ' 8', '·'],
  ];
  return (
    <Chrome section="products">
      <PageHead
        kicker="Catalog"
        title="The"
        titleAccent="catalog."
        sub="104 active SKUs · 7 low · 1 sold out · 6 drafts"
        actions={<>
          <button className="btn"><span className="kbd">/</span>Search</button>
          <button className="btn btn-solid"><span className="kbd">N</span>+ New product</button>
        </>}
      />
      <Tabs
        items={[['All', 104, true], ['Apparel', 38], ['Accessories', 24], ['Home', 18], ['Low stock', 7], ['Drafts', 6]]}
        right={<><span style={{ color: 'var(--ink-soft)', fontSize: 11 }}>sort: pace ↓</span></>}
      />

      <table className="tbl" style={{ marginTop: 0 }}>
        <thead>
          <tr>
            <th className="check"><input type="checkbox" /></th>
            <th style={{ width: 22 }}></th>
            <th>Product</th>
            <th style={{ width: 120 }}>SKU</th>
            <th style={{ width: 140 }}>Category</th>
            <th className="num" style={{ width: 70 }}>Price</th>
            <th className="num" style={{ width: 60 }}>Stock</th>
            <th style={{ width: 130 }}>Status</th>
            <th className="num sort" style={{ width: 70 }}>30d</th>
            <th className="num" style={{ width: 36 }}>Δ</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([sel, color, name, sku, cat, price, stock, status, statusCls, pace, trend], i) => (
            <tr key={sku} className={sel ? 'sel' : ''}>
              <td className="check"><input type="checkbox" defaultChecked={sel} /></td>
              <td><span style={{ display: 'inline-block', width: 18, height: 18, background: color, border: '1px solid var(--rule)', borderRadius: 'var(--r-sm)' }}></span></td>
              <td className="name">{name}</td>
              <td><span className="mono" style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{sku}</span></td>
              <td><span className="fig" style={{ fontSize: 12 }}>{cat}</span></td>
              <td className="num">{price}</td>
              <td className="num" style={{ color: stock === 0 ? 'var(--accent)' : stock < 10 ? 'var(--gold)' : 'var(--ink)', fontWeight: stock === 0 ? 600 : 400 }}>{stock}</td>
              <td><span className={'pill ' + statusCls}>{status}</span></td>
              <td className="num">{pace}</td>
              <td className="num" style={{ color: trend === '↑' ? 'var(--accent)' : trend === '↓' ? 'var(--ink-faint)' : 'var(--ink-faint)' }}>{trend}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <ActionBar
        selected={1}
        hints={[['↑↓', 'move'], ['E', 'edit'], ['D', 'duplicate'], ['R', 'restock'], ['X', 'archive']]}
      />
    </Chrome>
  );
}

// ─────────────────────────────────────────────
// 05 · CUSTOMERS
// ─────────────────────────────────────────────
function Customers() {
  const rows = [
    [false, 'SP', '#e7a23b', 'Sun-Hee Park',     'sunhee.p@hey.com',     'Vancouver BC',  22, '$1,140', '4m ago',     'Nov 2023', 'VIP',    'pill-solid-gold'],
    [false, 'IT', '#3a4a8b', 'Ivy Tanaka',       'ivy@studio-it.jp',     'Osaka JP',      18, '$880',   '2d ago',     'Aug 2024', 'VIP',    'pill-solid-gold'],
    [true,  'MR', '#c8443a', 'Maya Rodriguez',   'maya.r@hey.com',       'Brooklyn NY',   14, '$612',   '4m ago · viewing /shop', 'Mar 2024', 'LOYAL', 'pill-solid-moss'],
    [false, 'EL', '#3a4a8b', 'Edwin Lacroix',    'edwin@lacroix.ca',     'Montréal QC',    9, '$418',   '21m ago',    'Apr 2024', 'LOYAL',  'pill-solid-moss'],
    [false, 'TM', '#4f5e3a', 'Theo Mensah',      'theo.m@gmail.com',     'Boston MA',      6, '$348',   'yesterday',  'Jan 2025', 'REG',    'pill-out'],
    [false, 'DO', '#88857a', 'Demetrius Okafor', 'd.okafor@studio.ng',   'Lagos NG',       4, '$192',   '3d ago',     'Mar 2025', 'REG',    'pill-out'],
    [false, 'LB', '#8b2c1f', 'Léa Bourgeois',    'lea@bourgeois.fr',     'Bordeaux FR',    3, '$108',   '6d ago',     'Feb 2025', 'NEW',    'pill-out'],
    [false, 'JN', '#1a1410', 'Jonas Berg',       'j.berg@nrk.no',        'Oslo NO',        2, '$76',    '8d ago',     'Mar 2025', 'NEW',    'pill-out'],
    [false, 'SV', '#1a1410', 'Sasha Volkov',     's.volkov@yandex.ru',   'Berlin DE',      0, '$0',     'in cart now','15 May',   'CART',   'pill-solid-accent'],
  ];
  return (
    <Chrome section="customers">
      <PageHead
        kicker="People"
        title="The"
        titleAccent="roster."
        sub="2,847 on the books · 188 VIP · 412 loyal · 18 new this week"
        actions={<>
          <button className="btn"><span className="kbd">/</span>Search</button>
          <button className="btn"><span className="kbd">E</span>Export</button>
          <button className="btn btn-solid"><span className="kbd">S</span>+ Segment</button>
        </>}
      />
      <Tabs
        items={[['All', 2847, true], ['VIP', 188], ['Loyal', 412], ['Regular', 1184], ['New 7d', 18], ['Lapsed', 64], ['In cart', 3]]}
        right={<><span style={{ color: 'var(--ink-soft)', fontSize: 11 }}>sort: LTV ↓</span></>}
      />

      <table className="tbl" style={{ marginTop: 0 }}>
        <thead>
          <tr>
            <th className="check"><input type="checkbox" /></th>
            <th style={{ width: 30 }}></th>
            <th>Customer</th>
            <th style={{ width: 130 }}>Location</th>
            <th className="num" style={{ width: 60 }}>Orders</th>
            <th className="num sort" style={{ width: 80 }}>LTV</th>
            <th style={{ width: 170 }}>Last seen</th>
            <th style={{ width: 80 }}>Since</th>
            <th style={{ width: 80 }}>Tier</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([sel, init, color, name, email, place, orders, ltv, last, since, tier, tierCls], i) => (
            <tr key={name} className={sel ? 'sel' : ''}>
              <td className="check"><input type="checkbox" defaultChecked={sel} /></td>
              <td>
                <span style={{
                  display: 'inline-flex', width: 28, height: 28, background: color, color: 'var(--paper)',
                  alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'Spectral', fontSize: 12, fontWeight: 500,
                  borderRadius: '50%', border: '1px solid var(--ink)',
                }}>{init}</span>
              </td>
              <td>
                <div className="name">{name}</div>
                <div className="mono" style={{ fontSize: 11, color: 'var(--ink-soft)' }}>{email}</div>
              </td>
              <td><span className="fig" style={{ fontSize: 12 }}>{place}</span></td>
              <td className="num">{orders}</td>
              <td className="num accent" style={{ fontWeight: 500 }}>{ltv}</td>
              <td><span className="meta">{last}</span></td>
              <td><span className="meta">{since}</span></td>
              <td><span className={'pill ' + tierCls}>{tier}</span></td>
            </tr>
          ))}
        </tbody>
      </table>

      <ActionBar
        selected={1}
        hints={[['↑↓', 'move'], ['Enter', 'open'], ['M', 'message'], ['T', 'tag'], ['E', 'export']]}
      />
    </Chrome>
  );
}

// ─────────────────────────────────────────────
// 06 · JOURNAL (Blog)
// ─────────────────────────────────────────────
function Journal() {
  const rows = [
    [false, 'Notes from the dye-pot: a year of marigold',  'Marisol Cheng',   '12 min', 'Tue',       '2,104', 100, 'LIVE',      'pill-solid-moss', 'trending'],
    [false, 'Why we stopped sizing by S/M/L',              'Theo Mensah',     '8 min',  '8 May',     '1,418', 100, 'LIVE',      'pill-solid-moss', ''],
    [false, 'A year of marigold',                          'Marisol Cheng',   '6 min',  '8 May',     '1,402', 100, 'LIVE',      'pill-solid-moss', ''],
    [false, 'Spring shipping schedule',                    'Marisol Cheng',   '2 min',  'Thu 09:00', '—',     100, 'SCHEDULED', 'pill-solid-gold', ''],
    [true,  'Field report: Lagos textile market',          'Demetrius Okafor','14 min', '—',         '—',      92, 'IN REVIEW', 'pill-solid-ink',  '2 edits'],
    [false, 'How we photograph a tee',                     'Léa Bourgeois',   '9 min',  '—',         '—',      67, 'DRAFT',     'pill-out-accent', ''],
    [false, 'Behind the marigold supply',                  'Marisol Cheng',   '11 min', '—',         '—',      42, 'DRAFT',     'pill-out-accent', '12d old'],
    [false, 'Interview: dye-pot weavers',                  'Léa Bourgeois',   '—',      '—',         '—',      12, 'IDEA',      'pill-out',        ''],
  ];
  return (
    <Chrome section="journal">
      <PageHead
        kicker="Journal · Editorial pipeline"
        title="The"
        titleAccent="journal."
        sub="Eight pieces in motion · three live · one trending · two drafts sitting more than a week"
        actions={<>
          <button className="btn btn-solid"><span className="kbd">N</span>+ New draft</button>
        </>}
      />
      <Tabs
        items={[['All', 8, true], ['Live', 3], ['Scheduled', 1], ['In review', 1], ['Drafts', 2], ['Ideas', 1]]}
        right={<><span style={{ color: 'var(--ink-soft)', fontSize: 11 }}>sort: state ↓</span></>}
      />

      <table className="tbl" style={{ marginTop: 0 }}>
        <thead>
          <tr>
            <th className="check"><input type="checkbox" /></th>
            <th>Title</th>
            <th style={{ width: 140 }}>Author</th>
            <th className="num" style={{ width: 60 }}>Read</th>
            <th style={{ width: 90 }}>Published / due</th>
            <th className="num" style={{ width: 80 }}>Views 7d</th>
            <th style={{ width: 130 }}>Progress</th>
            <th style={{ width: 100 }}>Status</th>
            <th style={{ width: 90 }}>Flag</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([sel, title, author, read, when, views, pct, status, statusCls, flag], i) => (
            <tr key={title} className={sel ? 'sel' : ''}>
              <td className="check"><input type="checkbox" defaultChecked={sel} /></td>
              <td className="name">{title}</td>
              <td><span className="fig" style={{ fontSize: 12 }}>{author}</span></td>
              <td className="num" style={{ fontSize: 12 }}>{read}</td>
              <td><span className="meta">{when}</span></td>
              <td className="num">{views}</td>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ flex: 1, height: 3, background: 'var(--rule-soft)' }}>
                    <div style={{ height: 3, background: pct === 100 ? 'var(--moss)' : pct >= 70 ? 'var(--ink)' : 'var(--accent)', width: pct + '%' }}></div>
                  </div>
                  <span className="mono" style={{ fontSize: 10, color: 'var(--ink-soft)', minWidth: 28 }}>{pct}%</span>
                </div>
              </td>
              <td><span className={'pill ' + statusCls}>{status}</span></td>
              <td>
                {flag === 'trending' && <span className="pill pill-solid-accent">◉ TRENDING</span>}
                {flag === '12d old' && <span className="pill pill-out-accent">⚑ {flag}</span>}
                {flag && flag !== 'trending' && flag !== '12d old' && <span className="fig" style={{ fontSize: 11 }}>{flag}</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <ActionBar
        selected={1}
        hints={[['↑↓', 'move'], ['Enter', 'open'], ['P', 'publish'], ['S', 'schedule'], ['A', 'archive']]}
      />
    </Chrome>
  );
}

// ─────────────────────────────────────────────
// 07 · ANALYTICS
// ─────────────────────────────────────────────
function Analytics() {
  return (
    <Chrome section="analytics">
      <PageHead
        kicker="Analytics · 30 days ending Tuesday"
        title="The"
        titleAccent="almanac."
        sub="What is going on, in long form."
        actions={<>
          <button className="btn"><span className="kbd">1</span>7d</button>
          <button className="btn btn-solid"><span className="kbd">2</span>30d</button>
          <button className="btn"><span className="kbd">3</span>90d</button>
          <button className="btn"><span className="kbd">4</span>YTD</button>
        </>}
      />

      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
        {[
          ['Revenue', '$48,206', '+18%', 'on prior 30d', false],
          ['Orders', '412', '+12%', 'avg 13.7 / day', false],
          ['Visitors', '52,084', '+24%', 'organic 64%', false],
          ['Conversion', '1.84%', '−0.3pp', 'mobile dragging', true],
        ].map(([k, v, delta, sub, neg]) => (
          <div key={k} style={{ borderTop: '1px solid var(--ink)', paddingTop: 10 }}>
            <div className="eyebrow-ink">{k}</div>
            <div className="display" style={{ fontSize: 40, lineHeight: 1.05, letterSpacing: '-0.02em' }}>{v}</div>
            <div className="fig" style={{ fontSize: 13 }}>
              <span style={{ color: neg ? 'var(--ink-soft)' : 'var(--accent)' }}>{delta}</span> {sub}
            </div>
          </div>
        ))}
      </div>

      {/* Main chart */}
      <div style={{ marginTop: 20, borderTop: '1px solid var(--ink)', paddingTop: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
          <div>
            <div className="eyebrow-ink">Story of these 30 days</div>
            <div className="fig" style={{ fontSize: 13 }}>revenue (solid) and orders (dashed), daily</div>
          </div>
          <div style={{ display: 'flex', gap: 14, fontSize: 11 }} className="mono">
            <span style={{ color: 'var(--accent)' }}>▬ revenue</span>
            <span style={{ color: 'var(--ink-soft)' }}>┄ orders</span>
          </div>
        </div>
        <svg viewBox="0 0 1100 180" className="spark">
          {[0, 45, 90, 135, 180].map((y) => <line key={y} x1="0" x2="1100" y1={y} y2={y} stroke="var(--rule-soft)" />)}
          <path d="M0,135 C30,125 60,80 100,110 S180,145 240,90 S320,118 400,72 S500,82 580,36 S680,72 760,54 S860,28 940,46 S1040,72 1100,36"
            fill="none" stroke="var(--accent)" strokeWidth="1.8" />
          <path d="M0,135 C30,125 60,80 100,110 S180,145 240,90 S320,118 400,72 S500,82 580,36 S680,72 760,54 S860,28 940,46 S1040,72 1100,36 L1100,180 L0,180 Z"
            fill="rgba(139,44,31,.06)" />
          <path d="M0,155 C40,150 80,135 120,145 S200,155 280,125 S380,135 460,108 S560,118 640,90 S740,100 820,72 S920,82 1000,62 S1080,72 1100,68"
            fill="none" stroke="var(--ink)" strokeWidth="1.2" strokeDasharray="4 4" />
          <line x1="580" x2="580" y1="0" y2="180" stroke="var(--accent)" strokeDasharray="2 3" opacity=".5" />
          <text x="586" y="20" fontFamily="Spectral" fontStyle="italic" fontSize="13" fill="var(--accent)">— Dahlia tee launch, May 6</text>
        </svg>
        <div style={{ display: 'flex', justifyContent: 'space-between' }} className="fig">
          <span style={{ fontSize: 11 }}>Apr 17</span><span style={{ fontSize: 11 }}>Apr 24</span><span style={{ fontSize: 11 }}>May 1</span><span style={{ fontSize: 11 }}>May 8</span><span style={{ fontSize: 11 }}>May 15</span>
        </div>
      </div>

      {/* Two-column footer */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28, marginTop: 16 }}>
        <div>
          <div className="eyebrow-ink" style={{ marginBottom: 6 }}>Where they come from</div>
          <table className="tbl" style={{ fontSize: 12 }}>
            <tbody>
              {[['Organic search', '64%', '+8pp', 100], ['Direct', '18%', '−2pp', 28], ['Instagram', '11%', '+3pp', 17], ['Newsletter', '5%', '—', 8], ['Other', '2%', '—', 3]].map(([k, v, d, w], i) => (
                <tr key={k}>
                  <td style={{ padding: '5px 0', borderBottom: '1px solid var(--rule-soft)' }}>{k}</td>
                  <td className="num" style={{ padding: '5px 0', borderBottom: '1px solid var(--rule-soft)', width: 60 }}>{v}</td>
                  <td className="fig" style={{ padding: '5px 0', borderBottom: '1px solid var(--rule-soft)', textAlign: 'right', width: 50 }}>{d}</td>
                  <td style={{ padding: '5px 0', borderBottom: '1px solid var(--rule-soft)', width: 100 }}>
                    <div style={{ height: 2, background: 'var(--rule-soft)' }}>
                      <div style={{ height: 2, background: 'var(--accent)', width: w + '%' }}></div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div>
          <div className="eyebrow-ink" style={{ marginBottom: 6 }}>Top pages — 30 days</div>
          <table className="tbl" style={{ fontSize: 12 }}>
            <tbody>
              {[['/shop', '8,820', '+18%'], ['/shop/dahlia-tee', '4,402', '+412%'], ['/posts/dye-pot', '2,104', 'new'], ['/about', '2,108', '−4%'], ['/shop/marigold-cap', '1,818', '+22%']].map(([k, v, d], i) => (
                <tr key={k}>
                  <td style={{ padding: '5px 0', borderBottom: '1px solid var(--rule-soft)' }}><span className="mono" style={{ fontSize: 12 }}>{k}</span></td>
                  <td className="num" style={{ padding: '5px 0', borderBottom: '1px solid var(--rule-soft)', width: 80 }}>{v}</td>
                  <td className="fig" style={{ padding: '5px 0', borderBottom: '1px solid var(--rule-soft)', textAlign: 'right', width: 60, color: d.startsWith('−') ? 'var(--ink-soft)' : 'var(--accent)' }}>{d}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Chrome>
  );
}

// ─────────────────────────────────────────────
// 08 · SETTINGS
// ─────────────────────────────────────────────
function Settings() {
  const groups = [
    ['Storefront', [
      ['Identity',         'Studio Marigold · marigold.shop',           'OK',     'pill-solid-moss'],
      ['Domain & DNS',     'studio-marigold.com · renews 03 May 2027',  'OK',     'pill-solid-moss'],
      ['Theme & palette',  'Atlas · oxblood · cream',                   'OK',     'pill-solid-moss'],
    ]],
    ['Commerce', [
      ['Payments',         'Stripe · USD · 4 saved methods',            'OK',     'pill-solid-moss'],
      ['Shipping',         '3 zones · 7 rate cards',                    'ATTN',   'pill-solid-gold'],
      ['Tax',              'TaxJar · US, CA, EU',                       'OK',     'pill-solid-moss'],
      ['Inventory',        'auto-decrement · low-stock at 10',          'OK',     'pill-solid-moss'],
    ]],
    ['Communications', [
      ['Email templates',  '12 transactional · sender hello@',          'OK',     'pill-solid-moss'],
      ['Notifications',    'Slack #orders · SMS low-stock',             'OK',     'pill-solid-moss'],
      ['Newsletter',       'Klaviyo · 2,847 subscribers',               'OK',     'pill-solid-moss'],
    ]],
    ['Team & Access', [
      ['Team members',     '4 active · 2 invites pending',              'OK',     'pill-solid-moss'],
      ['Roles',            'admin · editor · fulfillment · viewer',     'OK',     'pill-solid-moss'],
      ['Single sign-on',   'Google · marigold.shop domain',             'OK',     'pill-solid-moss'],
    ]],
    ['Extensions', [
      ['Integrations',     'Klaviyo · Shopify · Canva · WooCommerce',   '4 / 18', 'pill-out'],
      ['Webhooks',         '4 endpoints · 0 failing in 24h',            'OK',     'pill-solid-moss'],
      ['API keys',         '3 active · 0 expired',                      'OK',     'pill-solid-moss'],
    ]],
    ['System', [
      ['Backups',          'Auto · last Tue 04:00 · 14d retention',     'OK',     'pill-solid-moss'],
      ['Legal & cookies',  'GDPR · CCPA · cookie banner',               'REVIEW', 'pill-solid-accent'],
      ['Audit log',        '30 days · streaming on',                    'OK',     'pill-solid-moss'],
    ]],
  ];

  return (
    <Chrome section="settings">
      <PageHead
        kicker="Settings"
        title="The"
        titleAccent="machinery."
        sub="Nineteen modules across six groups · one needs attention · one under review"
        actions={<>
          <button className="btn"><span className="kbd">/</span>Search</button>
        </>}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 32, rowGap: 4 }}>
        {groups.map(([title, items], i) => (
          <div key={title} style={{ marginBottom: 4 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, paddingBottom: 4, marginTop: i < 2 ? 0 : 14, borderBottom: '1px solid var(--ink)' }}>
              <span className="display" style={{ fontSize: 22 }}>{title}</span>
              <span className="fig" style={{ fontSize: 13 }}>· {items.length} modules</span>
            </div>
            {items.map(([name, desc, status, statusCls], j) => (
              <div key={name} style={{
                display: 'grid', gridTemplateColumns: '1fr 90px 20px',
                gap: 10, padding: '8px 0', borderBottom: '1px solid var(--rule-soft)', alignItems: 'baseline',
              }}>
                <div>
                  <div className="name-sm" style={{ fontSize: 14, fontWeight: 500 }}>{name}</div>
                  <div className="fig" style={{ fontSize: 12 }}>{desc}</div>
                </div>
                <span className={'pill ' + statusCls} style={{ justifySelf: 'end' }}>{status}</span>
                <span className="fig" style={{ textAlign: 'right', fontSize: 14 }}>→</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      <ActionBar
        hints={[['↑↓', 'navigate'], ['Enter', 'open module']]}
      />
    </Chrome>
  );
}

Object.assign(window, { Dashboard, Pages, Orders, Products, Customers, Journal, Analytics, Settings });
