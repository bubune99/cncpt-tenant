/* TENANT — shared shell: sidebar, topbar, AI helper dock, and tenant mock data.
   Reuses <Icon>, <initials>, USERS from mock-data.jsx. */

/* ────────────────────────────────────────────────────────────────
 * Tenant mock data
 * ──────────────────────────────────────────────────────────────── */

// Active tenant ("Northgear" — a fictional general-commerce brand running 3 sites)
const TNT_TENANT = {
  name: "Northgear",
  plan: "Growth",
  members: 12,
  subdomains: 3,
};

const TNT_SITES = [
  { sub: "northgear", title: "Northgear", host: "northgear.cncpt.app", customDomain: "northgear.com", visibility: "Public", traffic: "12.4k / mo", health: "ok", deploy: "Live", branding: { name: "Northgear", primary: "#0F172A", accent: "#3B82F6" } },
  { sub: "atlas-journal", title: "Atlas Journal", host: "atlas-journal.cncpt.app", customDomain: null, visibility: "Public", traffic: "3.1k / mo", health: "ok", deploy: "Live", branding: { name: "Atlas", primary: "#7C2D12", accent: "#F59E0B" } },
  { sub: "northgear-beta", title: "Northgear · Beta", host: "northgear-beta.cncpt.app", customDomain: "beta.northgear.com", visibility: "Private", traffic: "—", health: "warn", deploy: "Building", branding: { name: "Northgear Beta", primary: "#1E40AF", accent: "#06B6D4" } },
];

const TNT_TEAM = [
  { id: "m1", name: "Maya Patel", email: "maya@northgear.com", role: "Owner", avatar: "orange", joined: "Mar 14, 2024", lastActive: "now", twoFA: true, sites: ["northgear", "atlas-journal", "northgear-beta"] },
  { id: "m2", name: "Jonas Becker", email: "jonas@northgear.com", role: "Admin", avatar: "purple", joined: "Apr 02, 2024", lastActive: "12m ago", twoFA: true, sites: ["northgear", "atlas-journal"] },
  { id: "m3", name: "Aisha Brown", email: "aisha@northgear.com", role: "Editor", avatar: "green", joined: "May 18, 2024", lastActive: "1h ago", twoFA: false, sites: ["northgear"] },
  { id: "m4", name: "Diego Ramírez", email: "diego@partner.io", role: "Editor", avatar: "slate", joined: "Aug 11, 2024", lastActive: "3h ago", twoFA: true, sites: ["atlas-journal"] },
  { id: "m5", name: "Mei Chen", email: "mei@northgear.com", role: "Marketing", avatar: "orange", joined: "Sep 02, 2024", lastActive: "yesterday", twoFA: false, sites: ["northgear", "atlas-journal", "northgear-beta"] },
  { id: "m6", name: "Tomás Silva", email: "tomas@northgear.com", role: "Developer", avatar: "purple", joined: "Oct 22, 2024", lastActive: "5d ago", twoFA: true, sites: ["northgear-beta"] },
  { id: "m7", name: "Priya Singh", email: "priya@northgear.com", role: "Viewer", avatar: "green", joined: "Jan 09, 2025", lastActive: "2w ago", twoFA: false, sites: ["northgear"] },
];

const TNT_ROLES = [
  { key: "Owner", color: "owner", desc: "Full control, billing, ownership transfer", count: 1, builtin: true },
  { key: "Admin", color: "admin", desc: "Manage members, settings, and all content", count: 1, builtin: true },
  { key: "Editor", color: "editor", desc: "Edit content, products, and orders", count: 2, builtin: true },
  { key: "Marketing", color: "custom", desc: "Custom · campaigns, announcements, no billing", count: 1, builtin: false },
  { key: "Developer", color: "custom", desc: "Custom · DNS, hosting, API keys", count: 1, builtin: false },
  { key: "Viewer", color: "viewer", desc: "Read-only access to dashboards and content", count: 1, builtin: true },
];

// Granular permissions grouped by domain — toggled per role.
// `roles` maps the role key to whether that permission is enabled.
const TNT_PERMS = [
  { group: "Content & Storefront", icon: "layout-grid", items: [
    { key: "content.read",    label: "View content",             desc: "Browse pages, posts, products, collections.", roles: { Owner:true, Admin:true, Editor:true, Marketing:true, Developer:true, Viewer:true } },
    { key: "content.write",   label: "Edit content",             desc: "Create and edit pages, posts, products.", roles: { Owner:true, Admin:true, Editor:true, Marketing:true, Developer:false, Viewer:false } },
    { key: "content.publish", label: "Publish content",          desc: "Make changes live on the storefront.", roles: { Owner:true, Admin:true, Editor:true, Marketing:false, Developer:false, Viewer:false } },
    { key: "content.delete",  label: "Delete content",           desc: "Remove pages, posts, or products permanently.", roles: { Owner:true, Admin:true, Editor:false, Marketing:false, Developer:false, Viewer:false } },
  ]},
  { group: "Team & Permissions", icon: "users", items: [
    { key: "team.invite", label: "Invite members",  desc: "Send invitations to new team members.", roles: { Owner:true, Admin:true, Editor:false, Marketing:false, Developer:false, Viewer:false } },
    { key: "team.remove", label: "Remove members",  desc: "Remove members from this workspace.", roles: { Owner:true, Admin:true, Editor:false, Marketing:false, Developer:false, Viewer:false } },
    { key: "team.role",   label: "Change roles",     desc: "Promote or demote team members.", roles: { Owner:true, Admin:false, Editor:false, Marketing:false, Developer:false, Viewer:false } },
    { key: "team.roles_edit", label: "Edit custom roles", desc: "Create or modify role permission templates.", roles: { Owner:true, Admin:false, Editor:false, Marketing:false, Developer:false, Viewer:false } },
  ]},
  { group: "Domains & Subdomains", icon: "globe", items: [
    { key: "domain.add",    label: "Add subdomain",      desc: "Create new subdomains under your workspace.", roles: { Owner:true, Admin:true, Editor:false, Marketing:false, Developer:true, Viewer:false } },
    { key: "domain.dns",    label: "Manage DNS",         desc: "Edit A, CNAME, MX, TXT records.", roles: { Owner:true, Admin:true, Editor:false, Marketing:false, Developer:true, Viewer:false } },
    { key: "domain.delete", label: "Delete subdomains",  desc: "Permanently delete a subdomain and its data.", roles: { Owner:true, Admin:false, Editor:false, Marketing:false, Developer:false, Viewer:false } },
  ]},
  { group: "Communications", icon: "send", items: [
    { key: "comms.tickets",    label: "Reply to support tickets", desc: "Respond to customer support tickets.", roles: { Owner:true, Admin:true, Editor:true, Marketing:true, Developer:false, Viewer:false } },
    { key: "comms.announce",   label: "Publish announcements",    desc: "Push banners and announcements to customers.", roles: { Owner:true, Admin:true, Editor:false, Marketing:true, Developer:false, Viewer:false } },
    { key: "comms.broadcast",  label: "Send email campaigns",     desc: "Send mass emails to your customer list.", roles: { Owner:true, Admin:true, Editor:false, Marketing:true, Developer:false, Viewer:false } },
  ]},
  { group: "Billing & AI Credits", icon: "credit-card", items: [
    { key: "billing.view",   label: "View invoices",     desc: "See past invoices and payment history.", roles: { Owner:true, Admin:true, Editor:false, Marketing:false, Developer:false, Viewer:false } },
    { key: "billing.change", label: "Change plan",        desc: "Upgrade, downgrade, or cancel the subscription.", roles: { Owner:true, Admin:false, Editor:false, Marketing:false, Developer:false, Viewer:false } },
    { key: "credits.spend",  label: "Spend AI credits",   desc: "Use AI features that consume credits.", roles: { Owner:true, Admin:true, Editor:true, Marketing:true, Developer:true, Viewer:false } },
  ]},
];

// Customer support tickets the tenant has received from their customers.
const TNT_TICKETS = [
  { id: "#3081", subject: "Order #N-2841 hasn't shipped yet", from: "elena.k@gmail.com", site: "northgear", priority: "high", status: "open", assignee: TNT_TEAM[2], time: "8m", unread: true, snippet: "It's been a week and the tracking still says label created. Can someone look into this?" },
  { id: "#3079", subject: "Discount code SUMMER25 not working at checkout", from: "marc.l@outlook.com", site: "northgear", priority: "med", status: "open", assignee: TNT_TEAM[2], time: "32m", unread: true, snippet: "Trying to use SUMMER25 but it says invalid. Coupon page says it's still active." },
  { id: "#3078", subject: "Returns policy question", from: "ji.h@protonmail.com", site: "atlas-journal", priority: "low", status: "open", assignee: null, time: "1h", unread: false, snippet: "Hi, do you accept returns on personalized notebooks?" },
  { id: "#3076", subject: "Wrong size shipped — exchange?", from: "tara.s@gmail.com", site: "northgear", priority: "med", status: "open", assignee: TNT_TEAM[4], time: "3h", unread: false },
  { id: "#3074", subject: "Account locked, can't reset password", from: "p.demir@gmail.com", site: "northgear", priority: "high", status: "open", assignee: null, time: "5h", unread: false },
  { id: "#3070", subject: "Loving the new collection 💚", from: "rin@yahoo.co.jp", site: "northgear", priority: "low", status: "closed", assignee: TNT_TEAM[4], time: "yesterday", unread: false },
  { id: "#3068", subject: "Issue with B2B invoice download", from: "ops@vendor.co", site: "northgear", priority: "med", status: "closed", assignee: TNT_TEAM[1], time: "yesterday", unread: false },
];

const TNT_FEEDBACK = [
  { id: "FB-241", title: "Add a 'save for later' on product page", site: "northgear", votes: 48, status: "Planned", from: "Customer", time: "2h" },
  { id: "FB-237", title: "Faster mobile checkout flow", site: "northgear", votes: 36, status: "Under review", from: "Customer", time: "yesterday" },
  { id: "FB-234", title: "Gift wrap option at checkout", site: "northgear", votes: 22, status: "In progress", from: "Customer", time: "3d" },
  { id: "FB-228", title: "Multi-language storefront", site: "atlas-journal", votes: 19, status: "Under review", from: "Customer", time: "5d" },
  { id: "FB-220", title: "Add Apple Pay to express checkout", site: "northgear", votes: 12, status: "Shipped", from: "Customer", time: "1w" },
];

const TNT_NOTIFS = [
  { kind: "billing", icon: "credit-card", title: "Invoice paid — $249 · Growth plan",         time: "12m",  read: false, tone: "ok" },
  { kind: "system",  icon: "cloud-cog",   title: "Scheduled maintenance · Sun May 19, 02:00–04:00 UTC", time: "1h",   read: false, tone: "info" },
  { kind: "credits", icon: "sparkles",    title: "AI credits at 25% — top up to avoid interruption",  time: "3h",   read: false, tone: "warn" },
  { kind: "dns",     icon: "globe",       title: "DNS verified for beta.northgear.com",               time: "yesterday", read: true, tone: "ok" },
  { kind: "team",    icon: "user-plus",   title: "Jonas Becker accepted your invite",                 time: "yesterday", read: true, tone: "info" },
  { kind: "deploy",  icon: "rocket",      title: "northgear-beta build finished with 2 warnings",     time: "2d",  read: true, tone: "warn" },
  { kind: "system",  icon: "bell",        title: "New product release: Customer Segments (beta)",     time: "4d",  read: true, tone: "info" },
];

const TNT_ANNOUNCE = [
  { id: "AN-014", title: "Summer Sale — 25% off through Sunday",   sites: ["northgear"],                kind: "Banner", audience: "All visitors",       status: "Live", reach: "12,400", clicks: 384, time: "Live since 2d" },
  { id: "AN-012", title: "Free shipping over $75 — limited time",  sites: ["northgear","atlas-journal"], kind: "Top bar", audience: "Returning customers", status: "Scheduled", reach: "—", clicks: 0, time: "Starts May 22" },
  { id: "AN-009", title: "We're hiring designers!",                sites: ["atlas-journal"],            kind: "Modal",   audience: "All visitors",       status: "Draft", reach: "—", clicks: 0, time: "Last edited 3d ago" },
];

const TNT_CAMPAIGNS = [
  { id: "C-038", title: "Spring restock newsletter",          status: "Sent",    sent: "8,420", opens: 3128, clicks: 712, time: "Sent May 10" },
  { id: "C-037", title: "Loyalty members: early access drop", status: "Sent",    sent: "1,240", opens: 821,  clicks: 314, time: "Sent May 06" },
  { id: "C-036", title: "Abandoned cart — recover (auto)",    status: "Active",  sent: "—",     opens: "—",  clicks: "—", time: "Running" },
  { id: "C-035", title: "Atlas Journal — Issue 02 preview",   status: "Draft",   sent: "—",     opens: "—",  clicks: "—", time: "Last edited yesterday" },
];

const TNT_TEAM_MSGS = [
  { id: "tm1", from: TNT_TEAM[1], channel: "#general",      preview: "Pushed the new hero variant — want a look before we publish?", time: "4m",  unread: true },
  { id: "tm2", from: TNT_TEAM[5], channel: "#dev",          preview: "Beta build is green. Should I flip the DNS now or wait?", time: "16m", unread: true },
  { id: "tm3", from: TNT_TEAM[4], channel: "#marketing",    preview: "Drafted the Summer Sale subject lines — link inside.", time: "1h",  unread: false },
  { id: "tm4", from: TNT_TEAM[2], channel: "DM · Maya",     preview: "Quick Q on the returns flow before I reply to ticket #3078.", time: "2h",  unread: false },
];

const TNT_ACTIVITY = [
  { who: TNT_TEAM[1], text: "published 'Summer Sale' banner",              target: "northgear",      time: "12m", icon: "megaphone",     tone: "blue" },
  { who: TNT_TEAM[2], text: "replied to ticket #3076",                     target: null,             time: "32m", icon: "message-square", tone: "blue" },
  { who: TNT_TEAM[5], text: "edited DNS · added CNAME 'shop'",             target: "northgear-beta", time: "1h",  icon: "globe",        tone: "amber" },
  { who: TNT_TEAM[0], text: "invited diego@partner.io as Editor",          target: null,             time: "3h",  icon: "user-plus",    tone: "violet" },
  { who: TNT_TEAM[4], text: "scheduled campaign 'Loyalty: early access'",  target: null,             time: "yesterday", icon: "send",  tone: "blue" },
  { who: TNT_TEAM[0], text: "rotated API key 'prod-stripe'",               target: null,             time: "yesterday", icon: "key",   tone: "amber" },
  { who: TNT_TEAM[1], text: "updated brand palette",                       target: "atlas-journal",  time: "2d",  icon: "paintbrush",   tone: "violet" },
];

/* ────────────────────────────────────────────────────────────────
 * Tenant chrome: Sidebar + Topbar + AI Helper Dock
 * ──────────────────────────────────────────────────────────────── */

const Tnt_Sidebar = ({ active = "overview", currentSite }) => {
  const site = currentSite || TNT_SITES[0];
  const nav = [
    { id: "overview",  label: "Overview",      icon: "layout-dashboard" },
    { id: "inbox",     label: "Notifications", icon: "bell",   badge: 3, badgeKind: "blue" },
    { h: "Sites" },
    { id: "subdomains", label: "Subdomains",   icon: "globe", badge: 3 },
    { id: "branding",   label: "Branding",     icon: "paintbrush" },
    { id: "domains",    label: "Custom domains", icon: "link" },
    { id: "hosting",    label: "Hosting",      icon: "server" },
    { h: "Team" },
    { id: "members",     label: "Members",      icon: "users",   badge: 7 },
    { id: "roles",       label: "Roles & Permissions", icon: "shield-check" },
    { id: "activity",    label: "Activity log",  icon: "history" },
    { h: "Communications" },
    { id: "tickets",     label: "Support inbox", icon: "message-square", badge: 5, badgeKind: "hot" },
    { id: "announce",    label: "Announcements", icon: "megaphone" },
    { id: "campaigns",   label: "Email campaigns", icon: "send" },
    { id: "team-chat",   label: "Team messages", icon: "messages-square", badge: 2, badgeKind: "blue" },
    { id: "feedback",    label: "Feedback board", icon: "lightbulb" },
    { h: "Account" },
    { id: "credits",     label: "AI Credits",   icon: "sparkles" },
    { id: "billing",     label: "Billing & plan", icon: "credit-card" },
    { id: "settings",    label: "Workspace settings", icon: "settings" },
  ];

  return (
    <aside className="dirH__rail">
      <div className="dirH__brand">
        <div className="dirH__brand-mark"><Icon name="boxes" size={14} /></div>
        <div className="col" style={{ gap: 0 }}>
          <div className="dirH__brand-name">{TNT_TENANT.name}</div>
          <div className="muted" style={{ fontSize: 10, lineHeight: 1 }}>{TNT_TENANT.plan} plan</div>
        </div>
        <Icon name="chevrons-up-down" size={12} className="dirH__brand-chev" />
      </div>

      <div className="tnt__site-switch">
        <div className="tnt__site-mark">{site.title[0]}</div>
        <div className="col" style={{ flex: 1, minWidth: 0 }}>
          <span className="tnt__site-name">{site.title}</span>
          <span className="tnt__site-host">{site.host}</span>
        </div>
        <Icon name="chevrons-up-down" size={12} style={{ color: "var(--br-text-secondary)" }} />
      </div>

      <div className="dirH__search">
        <Icon name="search" size={13} />
        <span className="dirH__search-q">Search workspace…</span>
        <span className="kbd">⌘K</span>
      </div>

      <nav className="dirH__nav">
        {nav.map((it, i) =>
          it.h ? (
            <div className="dirH__nav-h" key={"h" + i}>
              <Icon name="chevron-down" size={11} />
              {it.h}
            </div>
          ) : (
            <button key={it.id} className={"dirH__nav-item " + (active === it.id ? "is-active" : "")}>
              <Icon name={it.icon} size={14} />
              <span>{it.label}</span>
              {it.badge !== undefined ? (
                <span className={"badge " + (it.badgeKind === "hot" ? "is-hot" : it.badgeKind === "blue" ? "is-blue" : "")}>
                  {it.badge}
                </span>
              ) : null}
            </button>
          )
        )}
      </nav>

      <div className="dirH__rail-foot">
        <div className="avatar avatar--sm avatar--orange">{initials(TNT_TEAM[0].name)}</div>
        <div className="col">
          <div style={{ fontSize: 12, fontWeight: 500 }}>{TNT_TEAM[0].name}</div>
          <div className="muted" style={{ fontSize: 10.5 }}>Owner</div>
        </div>
        <button className="iconbtn iconbtn--sm iconbtn--ghost"><Icon name="more-horizontal" size={13} /></button>
      </div>
    </aside>
  );
};

const Tnt_Top = ({ crumbs = [], right }) => (
  <header className="dirH__top">
    <div className="dirH__crumbs">
      {crumbs.map((c, i) => (
        <React.Fragment key={i}>
          <span className={i === crumbs.length - 1 ? "dirH__crumb-active" : "muted"}>{c}</span>
          {i < crumbs.length - 1 ? <Icon name="chevron-right" size={12} /> : null}
        </React.Fragment>
      ))}
    </div>
    <div style={{ flex: 1 }} />
    {right ?? (
      <>
        <button className="iconbtn iconbtn--sm iconbtn--ghost"><Icon name="bell" size={13} /></button>
        <button className="iconbtn iconbtn--sm iconbtn--ghost"><Icon name="life-buoy" size={13} /></button>
        <div className="avatar avatar--sm avatar--orange" style={{ marginLeft: 4 }}>{initials(TNT_TEAM[0].name)}</div>
      </>
    )}
  </header>
);

/*  AI helper dock — the small contextual assistant that helps users fill out DNS,
    permissions, branding, and other complex forms. Lives in the bottom-right.
    Pass `topic` to render a contextual conversation appropriate to the screen. */

const Tnt_AIDock = ({ topic = "general", collapsed = false }) => {
  const scripts = {
    general: [
      { who: "ai", text: <>Hey Maya — I noticed you're managing <strong>3 sites</strong>. Want me to surface anything that needs attention this morning?</> },
      { who: "me", text: "What's open?" },
      { who: "ai", text: <>Two high-priority support tickets are unassigned, and your AI credit pool is at <strong>25%</strong>. I can draft replies and queue a top-up for you.</> },
    ],
    dns: [
      { who: "ai", text: <>To point <span className="mono">beta.northgear.com</span> at this workspace, you'll need two records.</> },
      { who: "ai", text: <>Add an <strong>A record</strong> at <span className="mono">@</span> pointing to <span className="mono">76.76.21.21</span>, and a <strong>CNAME</strong> for <span className="mono">www</span> to <span className="mono">cname.cncpt.app</span>.</> },
      { who: "me", text: "Can you generate the SPF + DKIM too?" },
      { who: "ai", text: <>Yes — I'll add the email auth records when you click apply.</> },
    ],
    permissions: [
      { who: "ai", text: <>Want me to walk through the differences between <strong>Editor</strong> and your custom <strong>Marketing</strong> role?</> },
      { who: "ai", text: <>Marketing can publish announcements and send campaigns. Editor cannot, but can edit and publish content.</> },
    ],
    branding: [
      { who: "ai", text: <>I can pull color recommendations from your uploaded logo. Want a 4-color palette generated from <strong>atlas-journal-logo.svg</strong>?</> },
    ],
    tickets: [
      { who: "ai", text: <>Ticket <strong>#3081</strong> looks urgent — week-old order, no movement. Want me to draft a reply that asks for the order email and apologises proactively?</> },
    ],
    invite: [
      { who: "ai", text: <>Adding a designer? The <strong>Editor</strong> role is the closest fit. I can also create a <em>Contractor</em> role limited to one site if you want.</> },
    ],
    create: [
      { who: "ai", text: <>What's this site for? I'll suggest sensible defaults for visibility, hosting region, and starter pages.</> },
    ],
  };
  const msgs = scripts[topic] || scripts.general;
  const suggests = {
    general:    ["Draft a daily summary", "Anything from customers?", "Top up credits"],
    dns:        ["Use email auth defaults", "Test propagation", "Open DNS docs"],
    permissions:["Create a new role", "Show audit trail", "Explain Owner vs Admin"],
    branding:   ["Generate from logo", "Apply across all sites", "Run accessibility check"],
    tickets:    ["Draft an apology reply", "Refund and respond", "Bulk-assign to Aisha"],
    invite:     ["Make this a Contractor", "Set per-site access", "Send & copy link"],
    create:     ["Apply Northgear branding", "Make it Private at first", "Set up custom domain"],
  }[topic] || ["What can you do?"];

  if (collapsed) {
    return (
      <div className="tnt__ai-dock tnt__ai-dock--collapsed">
        <div className="tnt__ai-dock-head">
          <div className="tnt__ai-dock-mark"><Icon name="sparkles" size={13} /></div>
          <div className="tnt__ai-dock-title">Ask CNCPT</div>
          <span className="kbd" style={{ marginLeft: "auto" }}>⌘J</span>
        </div>
      </div>
    );
  }

  return (
    <div className="tnt__ai-dock">
      <div className="tnt__ai-dock-head">
        <div className="tnt__ai-dock-mark"><Icon name="sparkles" size={13} /></div>
        <div className="col" style={{ gap: 1, flex: 1 }}>
          <span className="tnt__ai-dock-title">Ask CNCPT</span>
          <span style={{ fontSize: 10, color: "var(--br-text-secondary)" }}>Contextual help for this screen</span>
        </div>
        <button className="iconbtn iconbtn--sm iconbtn--ghost"><Icon name="minus" size={12} /></button>
      </div>
      <div className="tnt__ai-dock-body">
        {msgs.map((m, i) => (
          <div key={i} className={"tnt__ai-msg " + (m.who === "me" ? "tnt__ai-msg--me" : "")}>
            {m.who === "ai" ? <div className="tnt__ai-msg-icon"><Icon name="sparkles" size={10} /></div> : null}
            <div className="tnt__ai-msg-text">{m.text}</div>
          </div>
        ))}
        <div className="tnt__ai-suggest-row">
          {suggests.map((s, i) => <button key={i} className="tnt__ai-suggest">{s}</button>)}
        </div>
      </div>
      <div className="tnt__ai-input">
        <Icon name="message-circle" size={13} style={{ color: "var(--br-text-secondary)" }} />
        <span className="tnt__ai-input-q">Ask anything…</span>
        <button className="iconbtn iconbtn--sm"><Icon name="arrow-up" size={12} /></button>
      </div>
    </div>
  );
};

/* Tiny helper — a flat "Tenant board" wrapper that gives the dirH grid + adds the .tnt class */
const TntBoard = ({ children, modal }) => (
  <div className="adm-board dirH tnt" style={{ position: "relative" }}>
    {children}
    {modal /* optional overlay */}
  </div>
);
