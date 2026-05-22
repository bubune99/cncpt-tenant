// Atlas Customer — shared chrome: impersonation bar, storefront top nav, account sidebar.

function ImpersonateBar({ visible = true }) {
  if (!visible) return null;
  return (
    <div className="impersonate-bar">
      <span className="dot"></span>
      <span className="lbl">Viewing storefront as</span>
      <span className="val">Maya Rodriguez · maya.r@hey.com</span>
      <span className="lbl">·</span>
      <span className="val">read-only impersonation</span>
      <span className="right">
        <a href="#">← Back to admin · /customers/maya-rodriguez</a>
        <a href="#">stop session</a>
      </span>
    </div>
  );
}

function SfChrome({ active, store, impersonate = true, bellOpen = false }) {
  const { brand, name, glyph, url } = store;
  return (
    <>
      <ImpersonateBar visible={impersonate} />
      <header className="sf-chrome">
        <a href="#" className="sf-logo">
          <span className="glyph">{glyph}</span>
          <span>{name}</span>
        </a>
        <nav className="sf-nav">
          <a href="#">Shop</a>
          <a href="#">Journal</a>
          <a href="#">About</a>
          <a href="#" className={active === 'account' ? 'on' : ''}>Account</a>
        </nav>
        <div className="sf-right">
          <div className="search">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
            </svg>
            <span>Search</span>
          </div>
          <div className={'icon-btn bell-btn' + (bellOpen ? ' on' : '')} title="Notifications">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
            </svg>
            <span className="pip">3</span>
          </div>
          <div className="icon-btn" title="Bag">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M6 8h12l-1 12H7L6 8z" /><path d="M9 8a3 3 0 0 1 6 0" />
            </svg>
            <span className="pip">2</span>
          </div>
          <div className="acct">
            <span className="av">M</span>
            <span className="nm">Maya</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </div>
        </div>
      </header>
    </>
  );
}

/* ─────────────────────────────────────────────
   Notifications drawer — flyout from the bell icon
   ───────────────────────────────────────────── */
const NOTIFS = [
  {
    id: 'n1', kind: 'order', state: 'unread',
    glyph: '📦', tone: 'accent',
    title: 'Order #4821 has shipped',
    body: 'USPS · arriving Fri 18 May by 8pm. Tracking is live.',
    when: '11:08 · today',
    cta: 'Track →',
  },
  {
    id: 'n2', kind: 'stock', state: 'unread',
    glyph: '✓', tone: 'success',
    title: 'Moss tote is back in stock',
    body: 'You asked us to let you know. 6 left.',
    when: 'yesterday',
    cta: 'Shop now →',
  },
  {
    id: 'n3', kind: 'sub', state: 'unread',
    glyph: '↻', tone: 'gold',
    title: 'Marigold tea ships in 8 days',
    body: 'We\'ll charge $18 on 24 May. Skip or swap?',
    when: '14 May',
    cta: 'Manage →',
  },
  {
    id: 'n4', kind: 'review', state: 'read',
    glyph: '★', tone: 'gold',
    title: 'How did the Marigold cap fit?',
    body: 'A quick review helps the next person.',
    when: '08 May',
    cta: 'Write →',
  },
  {
    id: 'n5', kind: 'order', state: 'read',
    glyph: '✓', tone: 'success',
    title: 'Order #4702 was delivered',
    body: '28 Apr · signed for at front door.',
    when: '28 Apr',
    cta: 'View →',
  },
  {
    id: 'n6', kind: 'editorial', state: 'read',
    glyph: '✎', tone: 'ink',
    title: 'New journal entry from Marisol',
    body: 'On dyeing with marigold petals — a short field note.',
    when: '24 Apr',
    cta: 'Read →',
  },
];

function NotifDrawer({ open = false, tab = 'all' }) {
  if (!open) return null;
  const items = tab === 'unread' ? NOTIFS.filter(n => n.state === 'unread') : NOTIFS;
  const unread = NOTIFS.filter(n => n.state === 'unread').length;
  return (
    <div className="notif-drawer">
      <div className="notif-head">
        <span className="display" style={{ fontSize: 18 }}>Notifications</span>
        <span className="pill pill-out-accent" style={{ marginLeft: 8 }}>{unread} new</span>
        <a href="#" className="notif-action">Mark all read</a>
      </div>
      <div className="notif-tabs">
        <span className={'tab' + (tab === 'all' ? ' on' : '')}>All <span className="ct">{NOTIFS.length}</span></span>
        <span className={'tab' + (tab === 'unread' ? ' on' : '')}>Unread <span className="ct">{unread}</span></span>
        <span className="tab">Orders <span className="ct">2</span></span>
        <span className="tab">Stock <span className="ct">1</span></span>
        <span style={{ marginLeft: 'auto' }}>
          <a href="#" className="notif-action">Settings ⚙</a>
        </span>
      </div>
      <div className="notif-list">
        {items.map((n) => (
          <div key={n.id} className={'notif ' + (n.state === 'unread' ? 'unread' : '')}>
            <span className={'notif-glyph t-' + n.tone}>{n.glyph}</span>
            <div className="notif-body">
              <div className="notif-title">{n.title}</div>
              <div className="notif-text">{n.body}</div>
              <div className="notif-foot">
                <span className="when">{n.when}</span>
                <a href="#" className="cta">{n.cta}</a>
              </div>
            </div>
            {n.state === 'unread' && <span className="unread-dot"></span>}
          </div>
        ))}
      </div>
      <div className="notif-foot-bar">
        <a href="#">See full inbox · 28 →</a>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Account sidebar — left rail of all account pages
   ───────────────────────────────────────────── */
const ACCT_NAV = [
  ['Account', [
    ['overview', 'Overview',       null],
    ['orders',   'Orders',         '14'],
    ['inbox',    'Inbox',          '3'],
    ['subs',     'Subscriptions',  '2'],
    ['wishlist', 'Wishlist',       '8'],
    ['returns',  'Returns',        null],
    ['reviews',  'My reviews',     '6'],
  ]],
  ['Settings', [
    ['addresses',     'Addresses',         '1'],
    ['payment',       'Payment',           '2'],
    ['loyalty',       'Loyalty & credit',  null],
    ['comms',         'Email & SMS',       null],
    ['notifications', 'Notifications',     null],
    ['profile',       'Profile · password', null],
  ]],
];

function AcctSide({ active }) {
  return (
    <aside className="acct-side">
      {ACCT_NAV.map(([groupName, items]) => (
        <React.Fragment key={groupName}>
          <div className="sec-h">{groupName}</div>
          {items.map(([key, label, count]) => (
            <a key={key} href="#" className={key === active ? 'on' : ''}>
              <span>{label}</span>
              {count && <span className="ct">{count}</span>}
              {key === 'orders' && active === 'overview' && <span className="ct" style={{ color: 'var(--wl-accent)' }}>· 1 new</span>}
            </a>
          ))}
        </React.Fragment>
      ))}

      <div className="acct-side-foot">
        <span className="av">M</span>
        <div>
          <div className="nm">Maya Rodriguez</div>
          <div className="em">maya.r@hey.com</div>
        </div>
      </div>
    </aside>
  );
}

/* ─────────────────────────────────────────────
   Lifecycle ribbon — shown to the customer.
   "Where you are with us" — done | now | future
   ───────────────────────────────────────────── */
function Lifecycle({ current = 'loyal' }) {
  const stages = [
    ['new',     'New',         'since Mar 24',  'done'],
    ['repeat',  'Repeat',      'after 3 orders', 'done'],
    ['regular', 'Regular',     'after 6 orders', 'done'],
    ['loyal',   'Loyal',       'you are here',  'now'],
    ['vip',     'VIP',         '3 orders away', 'future'],
  ];
  return (
    <div className="ribbon" aria-label="Your relationship with the shop">
      {stages.map(([key, nm, when, state]) => (
        <div key={key} className={'step ' + (state === 'done' ? 'done' : state === 'now' ? 'now' : '')}>
          <div className="nm">{state === 'done' && '✓ '}{nm}</div>
          <div className="when">{when}</div>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Small icon helpers (lucide-style inline SVG)
   ───────────────────────────────────────────── */
const Icons = {
  pkg: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="m7.5 4.27 9 5.15" /><path d="M21 8 12 13 3 8" /><path d="M21 8v8a2 2 0 0 1-1 1.73l-7 4a2 2 0 0 1-2 0l-7-4A2 2 0 0 1 3 16V8" /><path d="M3.3 7.7 12 12l8.7-4.3" /></svg>,
  truck: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" /><path d="M15 18H9" /><path d="M22 18h-5" /><path d="M19 18a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z" /><path d="M5 18a2 2 0 1 0 4 0 2 2 0 0 0-4 0Z" /><path d="M14 9h4l4 4v5h-2" /></svg>,
  check: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6 9 17l-5-5" /></svg>,
  heart: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 21s-7-4.5-9-9c-1-2.5.5-6 4-6 2 0 3 1.5 5 4 2-2.5 3-4 5-4 3.5 0 5 3.5 4 6-2 4.5-9 9-9 9Z" /></svg>,
  edit: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></svg>,
  plus: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5v14" /></svg>,
  star: <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.9L12 17.8 5.8 21.1 7 14.2 2 9.3l6.9-1L12 2Z" /></svg>,
  bag: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M6 8h12l-1 12H7L6 8z" /><path d="M9 8a3 3 0 0 1 6 0" /></svg>,
  home: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="m3 12 9-9 9 9" /><path d="M5 10v10h14V10" /></svg>,
  user: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>,
  back: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m15 18-6-6 6-6" /></svg>,
};

Object.assign(window, { ImpersonateBar, SfChrome, AcctSide, Lifecycle, Icons, NotifDrawer, NOTIFS });
