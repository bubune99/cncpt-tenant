// Atlas v2 — Chrome (top bar + sidebar)
// Cleaner labels, drops "Vol/Folio" conceit, keeps editorial chrome.
// Now includes admin notifications: bell + flyout drawer + Inbox nav.

const NAV = [
  ['01', 'Dashboard', 'dashboard', null],
  ['02', 'Pages',     'pages',     null],
  ['03', 'Orders',    'orders',    '12'],
  ['04', 'Products',  'products',  null],
  ['05', 'Customers', 'customers', null],
  ['06', 'Journal',   'journal',   null],
  ['07', 'Analytics', 'analytics', null],
  ['08', 'Settings',  'settings',  null],
];

// ─────────────────────────────────────────────
// Admin notifications — what would actually land in Marisol's inbox
// ─────────────────────────────────────────────
const ADMIN_NOTIFS = [
  {
    id: 'a1', cat: 'STOCK',    tone: 'accent', state: 'unread', kbd: 'R',
    title: 'Dahlia tee · size M is out of stock',
    body: 'Third time this month. Replenishment lead time is 9 days — suppliers reachable now.',
    when: 'just now',  cta: 'Restock →',
  },
  {
    id: 'a2', cat: 'ORDERS',   tone: 'gold',   state: 'unread', kbd: 'P',
    title: '12 orders waiting on fulfillment',
    body: '$234.70 in pending labels. #4818 paid for expedite — pack first.',
    when: '08:42 EST', cta: 'Pack queue →',
  },
  {
    id: 'a3', cat: 'TICKET',   tone: 'accent', state: 'unread', kbd: 'O',
    title: 'Customer ticket · refund · 19h old',
    body: 'cs-22 · Lena Park · "ordered wrong size, want exchange not refund."',
    when: 'yesterday', cta: 'Open →',
  },
  {
    id: 'a4', cat: 'JOURNAL',  tone: 'gold',   state: 'unread', kbd: 'A',
    title: 'Thursday letter scheduled · approve by 09:00',
    body: '2,847 recipients · "Marigold spring · part II" · 4 blocks · 1 image.',
    when: 'today',     cta: 'Approve →',
  },
  {
    id: 'a5', cat: 'PAYMENT',  tone: 'moss',   state: 'read',
    title: 'Stripe payout · $4,820.40 deposited',
    body: 'To Capital One ····8821 · 38 charges from the past 7 days.',
    when: '07:14 EST', cta: 'Ledger →',
  },
  {
    id: 'a6', cat: 'REVIEW',   tone: 'ink',    state: 'read',
    title: 'Demetrius submitted "Lagos field report"',
    body: '92% complete · sitting 12d in review · 1,840 words + 6 photos.',
    when: 'yesterday', cta: 'Review →',
  },
  {
    id: 'a7', cat: 'PAYMENT',  tone: 'accent', state: 'read',
    title: 'Payment failed · order #4815 · $48.00',
    body: 'Card declined · contact retried 2× · customer notified by email.',
    when: '14 May',    cta: 'Resolve →',
  },
  {
    id: 'a8', cat: 'CUSTOMER', tone: 'moss',   state: 'read',
    title: 'Maya Rodriguez reached Loyal',
    body: '14th order since Mar 2024 · $612 lifetime · top 14% of roster.',
    when: '16 May',    cta: 'Open profile →',
  },
];

function NotifDrawerAdmin({ open = false, tab = 'all' }) {
  if (!open) return null;
  const items = tab === 'unread' ? ADMIN_NOTIFS.filter(n => n.state === 'unread') : ADMIN_NOTIFS;
  const unread = ADMIN_NOTIFS.filter(n => n.state === 'unread').length;
  return (
    <div className="adm-drawer">
      <div className="adm-drawer-head">
        <div>
          <div className="eyebrow">Inbox · today</div>
          <div className="display" style={{ fontSize: 22, lineHeight: 1.05, letterSpacing: '-0.02em', marginTop: 2 }}>
            <span className="display-i" style={{ color: 'var(--accent)' }}>{unread}</span> need you
          </div>
        </div>
        <div className="adm-drawer-actions">
          <a href="#" className="adm-action">Mark all read</a>
          <a href="#" className="adm-action">Settings ⚙</a>
        </div>
      </div>

      <div className="adm-drawer-tabs">
        <span className={'adm-tab' + (tab === 'all' ? ' on' : '')}>All <span className="ct">{ADMIN_NOTIFS.length}</span></span>
        <span className={'adm-tab' + (tab === 'unread' ? ' on' : '')}>Unread <span className="ct">{unread}</span></span>
        <span className="adm-tab">Orders <span className="ct">2</span></span>
        <span className="adm-tab">Stock <span className="ct">1</span></span>
        <span className="adm-tab">Payments <span className="ct">2</span></span>
        <span className="adm-tab">Tickets <span className="ct">1</span></span>
      </div>

      <div className="adm-drawer-list">
        {items.map((n) => (
          <div key={n.id} className={'adm-notif ' + (n.state === 'unread' ? 'unread' : '')}>
            <div className="adm-notif-rule">
              <span className={'adm-cat t-' + n.tone}>{n.cat}</span>
              <span className="adm-when">{n.when}</span>
            </div>
            <div className="adm-notif-title">{n.title}</div>
            <div className="adm-notif-body">{n.body}</div>
            <div className="adm-notif-foot">
              <a href="#" className="adm-notif-cta">{n.cta}</a>
              {n.kbd && <span className="adm-kbd"><span className="k">{n.kbd}</span>shortcut</span>}
            </div>
          </div>
        ))}
      </div>

      <div className="adm-drawer-foot">
        <a href="#">Open full inbox →</a>
        <span className="fig" style={{ fontSize: 11, marginLeft: 'auto' }}>auto-archives after 14d</span>
      </div>
    </div>
  );
}

function Chrome({ section, children, notifOpen = false }) {
  return (
    <div className="page-frame">
      {/* Top bar — store + meta + keyboard hints + bell */}
      <div className="topbar">
        <div className="store">
          <span className="store-dot"></span>
          <span>Studio Marigold</span>
          <span className="mono" style={{ fontSize: 11, color: 'var(--ink-faint)', marginLeft: 4 }}>· marigold.shop</span>
        </div>
        <div className="right">
          <span><span className="kbd">⌘K</span>Jump · search · run</span>
          <span><span className="kbd">⌘N</span>New</span>
          <span className={'bell' + (notifOpen ? ' on' : '')} title="Notifications">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
            </svg>
            <span className="bell-pip">4</span>
          </span>
          <span style={{ color: 'var(--ink)' }}>Marisol Cheng</span>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="chrome">
        <aside className="sidebar">
          <div className="meta">
            <div className="eyebrow">Today</div>
            <div className="date">Tuesday, 16 May · 09:14 EST</div>
          </div>

          {/* Quick · Inbox lives above the numbered nav */}
          <div className="nav-h eyebrow" style={{ color: 'var(--ink-faint)', padding: '0 18px 6px' }}>Quick</div>
          <a href="#" className={'inbox-link' + (section === 'inbox' ? ' active' : '')}>
            <span className="n">✦</span>
            <span className="label">Inbox</span>
            <span className="badge">4</span>
          </a>

          <nav className="nav">
            <div className="nav-h eyebrow" style={{ color: 'var(--ink-faint)' }}>Sections</div>
            {NAV.map(([n, label, key, badge]) => (
              <a key={key} href="#" className={key === section ? 'active' : ''}>
                <span className="n">{n}</span>
                <span className="label">{label}</span>
                {badge && <span className="badge">{badge}</span>}
              </a>
            ))}
          </nav>
          <div className="acct">
            <div className="eyebrow" style={{ color: 'var(--ink-faint)', marginBottom: 8 }}>Account</div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span className="initials">MC</span>
              <div>
                <div style={{ fontSize: 13, lineHeight: 1.1 }}>Marisol Cheng</div>
                <div className="fig" style={{ fontSize: 11 }}>admin</div>
              </div>
            </div>
          </div>
        </aside>

        <main className="main">{children}</main>
      </div>

      {/* Notification drawer — anchored to the bell, clipped to frame */}
      <NotifDrawerAdmin open={notifOpen} />
    </div>
  );
}

// Inject admin-drawer + bell styles once, regardless of which HTML hosts us
(function injectAdminNotifStyles() {
  if (document.getElementById('__adm-notif-styles')) return;
  const css = `
    /* Bell in topbar */
    .topbar .right .bell {
      display: inline-flex; align-items: center; gap: 0;
      cursor: pointer; position: relative;
      padding: 4px 6px;
      color: var(--ink-soft);
      border-radius: 2px;
      margin-left: -8px;
    }
    .topbar .right .bell:hover { color: var(--ink); background: var(--paper-2); }
    .topbar .right .bell.on {
      background: var(--ink); color: var(--paper);
    }
    .topbar .right .bell-pip {
      position: absolute;
      top: -2px; right: -3px;
      background: var(--accent); color: var(--paper);
      font-family: 'Geist Mono', monospace; font-size: 8.5px;
      letter-spacing: .02em; font-weight: 600;
      min-width: 14px; height: 14px;
      padding: 0 3px;
      border-radius: 7px;
      display: inline-flex; align-items: center; justify-content: center;
      border: 1.5px solid var(--paper);
      line-height: 1;
    }
    body.no-kbd .topbar .right .bell { display: inline-flex !important; }
    body.no-kbd .topbar .right > span:not(:last-child) { display: none; }
    body.no-kbd .topbar .right .bell.on { display: inline-flex !important; }

    /* Inbox link in sidebar (above the numbered nav) */
    .sidebar .inbox-link {
      display: grid; grid-template-columns: 22px 1fr auto;
      gap: 6px; align-items: baseline;
      padding: 7px 18px;
      color: var(--ink); text-decoration: none;
      font-size: 14px;
      border-left: 3px solid transparent;
      margin-bottom: 4px;
    }
    .sidebar .inbox-link:hover { background: var(--paper-2); }
    .sidebar .inbox-link .n { color: var(--accent); font-family: 'Spectral', serif; font-size: 13px; }
    .sidebar .inbox-link .badge {
      font-family: 'Geist Mono', monospace; font-size: 10px;
      background: var(--accent); color: var(--paper);
      padding: 1px 6px; border-radius: 3px;
    }
    .sidebar .inbox-link.active {
      background: var(--paper-2);
      border-left-color: var(--accent);
    }
    .sidebar .inbox-link.active .label { font-weight: 600; }

    /* Drawer flyout */
    .adm-drawer {
      position: absolute;
      top: 44px; right: 14px;
      width: 420px;
      max-height: 740px;
      background: var(--paper);
      border: 1px solid var(--ink);
      border-radius: 4px;
      box-shadow: 0 18px 56px rgba(0,0,0,.28);
      z-index: 30;
      display: flex; flex-direction: column;
      overflow: hidden;
    }
    .adm-drawer::before {
      content: '';
      position: absolute;
      top: -6px; right: 78px;
      width: 11px; height: 11px;
      background: var(--paper);
      border-top: 1px solid var(--ink);
      border-left: 1px solid var(--ink);
      transform: rotate(45deg);
    }

    .adm-drawer-head {
      display: flex; align-items: flex-start; justify-content: space-between;
      padding: 14px 18px 12px;
      border-bottom: 1px solid var(--ink);
      gap: 12px;
    }
    .adm-drawer-actions {
      display: flex; flex-direction: column; align-items: flex-end;
      gap: 4px;
      padding-top: 4px;
    }
    .adm-action {
      font-family: 'Geist Mono', monospace; font-size: 10px;
      letter-spacing: .04em;
      color: var(--ink-soft); text-decoration: none;
    }
    .adm-action:hover { color: var(--accent); }

    .adm-drawer-tabs {
      display: flex; gap: 12px; flex-wrap: wrap;
      padding: 8px 18px 6px;
      border-bottom: 1px solid var(--rule);
      background: var(--paper-2);
    }
    .adm-tab {
      font-family: 'Geist Mono', monospace; font-size: 10px;
      letter-spacing: .1em; text-transform: uppercase;
      color: var(--ink-soft);
      padding: 3px 0;
      border-bottom: 2px solid transparent;
      cursor: pointer;
    }
    .adm-tab.on { color: var(--accent); border-bottom-color: var(--accent); font-weight: 600; }
    .adm-tab .ct { color: var(--ink-faint); margin-left: 2px; }
    .adm-tab.on .ct { color: var(--accent); opacity: .8; }

    .adm-drawer-list { flex: 1; overflow-y: auto; }

    .adm-notif {
      padding: 12px 18px 14px;
      border-bottom: 1px solid var(--rule-soft);
      cursor: pointer;
      position: relative;
    }
    .adm-notif:hover { background: var(--paper-2); }
    .adm-notif.unread {
      background: linear-gradient(90deg, rgba(139,44,31,.05) 0%, transparent 100%);
    }
    .adm-notif.unread::before {
      content: '';
      position: absolute;
      left: 0; top: 14px; bottom: 14px;
      width: 3px;
      background: var(--accent);
    }

    .adm-notif-rule {
      display: flex; align-items: baseline; justify-content: space-between;
      margin-bottom: 4px;
    }
    .adm-cat {
      font-family: 'Geist Mono', monospace; font-size: 9px;
      letter-spacing: .14em; font-weight: 600;
      padding: 1px 6px;
      border-radius: 2px;
      line-height: 1.5;
    }
    .adm-cat.t-accent { background: var(--accent); color: var(--paper); }
    .adm-cat.t-gold   { background: var(--gold); color: var(--paper); }
    .adm-cat.t-moss   { background: var(--moss); color: var(--paper); }
    .adm-cat.t-ink    { background: var(--ink); color: var(--paper); }

    .adm-when {
      font-family: 'Geist Mono', monospace; font-size: 10px;
      color: var(--ink-faint); letter-spacing: .04em;
    }

    .adm-notif-title {
      font-family: 'Spectral', serif; font-size: 15px; line-height: 1.25;
      font-weight: 500; color: var(--ink);
      letter-spacing: -0.01em;
    }
    .adm-notif-body {
      font-family: 'Spectral', serif; font-style: italic;
      font-size: 12.5px; line-height: 1.45;
      color: var(--ink-soft);
      margin-top: 3px;
    }
    .adm-notif-foot {
      display: flex; align-items: center;
      margin-top: 6px;
      gap: 12px;
    }
    .adm-notif-cta {
      font-family: 'Geist Mono', monospace; font-size: 10.5px;
      color: var(--accent); text-decoration: none;
      letter-spacing: .02em; font-weight: 600;
    }
    .adm-kbd {
      margin-left: auto;
      font-family: 'Geist Mono', monospace; font-size: 9.5px;
      color: var(--ink-faint); letter-spacing: .04em;
    }
    .adm-kbd .k {
      background: var(--ink); color: var(--paper);
      padding: 1px 5px; margin-right: 4px;
      border-radius: 2px;
    }

    .adm-drawer-foot {
      padding: 9px 18px;
      border-top: 1px solid var(--ink);
      background: var(--paper-2);
      display: flex; align-items: center;
    }
    .adm-drawer-foot a {
      font-family: 'Geist Mono', monospace; font-size: 11px;
      color: var(--accent); text-decoration: none;
      letter-spacing: .04em; font-weight: 600;
    }
  `;
  const style = document.createElement('style');
  style.id = '__adm-notif-styles';
  style.textContent = css;
  document.head.appendChild(style);
})();

// Generic page header used by table pages
function PageHead({ kicker, title, titleAccent, sub, actions }) {
  return (
    <div className="main-head">
      <div>
        <div className="eyebrow">{kicker}</div>
        <h1>{title} {titleAccent && <span className="display-i accent">{titleAccent}</span>}</h1>
        <div className="sub">{sub}</div>
      </div>
      <div className="actions">{actions}</div>
    </div>
  );
}

// Filter tabs row
function Tabs({ items, right }) {
  return (
    <div className="tabs">
      {items.map(([label, count, on]) => (
        <span key={label} className={'tab' + (on ? ' on' : '')}>
          {label}{count !== null && count !== undefined && <span className="ct">{count}</span>}
        </span>
      ))}
      {right && <span className="right">{right}</span>}
    </div>
  );
}

// Bottom action bar
function ActionBar({ selected, hints }) {
  return (
    <div className="action-bar">
      {selected !== undefined && <span className="selct">{selected} selected</span>}
      {hints && hints.map(([k, label], i) => (
        <span key={i}><span className="kbd">{k}</span>{label}</span>
      ))}
      <span className="right mono">{(new Date()).toISOString().slice(0,16).replace('T',' ')}</span>
    </div>
  );
}

Object.assign(window, { Chrome, PageHead, Tabs, ActionBar, NotifDrawerAdmin, ADMIN_NOTIFS });
