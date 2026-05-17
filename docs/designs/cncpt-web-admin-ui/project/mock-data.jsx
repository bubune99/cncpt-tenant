/* Shared mock data + tiny helpers for all 3 directions */

const Icon = ({ name, size, className, style }) => (
  <i
    data-lucide={name}
    className={className}
    style={{ width: size ?? 14, height: size ?? 14, ...(style || {}) }}
  />
);

// Always re-render Lucide whenever something mounts
function useLucide(deps = []) {
  React.useEffect(() => {
    if (window.lucide && window.lucide.createIcons) {
      window.lucide.createIcons();
    }
  });
}

const initials = (name) =>
  name.split(/\s+/).slice(0, 2).map((s) => s[0]).join("").toUpperCase();

const USERS = [
  { id: "u_001", name: "Maya Patel", email: "maya@northgear.co", role: "Tenant Admin", tenant: "northgear", tier: "DTF Pro", credits: 8400, status: "active", lastActive: "2m ago", joined: "Mar 14, 2025", avatarKind: "orange", flag: null },
  { id: "u_002", name: "Jonas Becker", email: "jonas@printlab.io", role: "Designer", tenant: "printlab", tier: "Starter", credits: 1200, status: "active", lastActive: "12m ago", joined: "Jan 02, 2026", avatarKind: "purple", flag: "permission_request" },
  { id: "u_003", name: "Aisha Brown", email: "aisha@studio44.com", role: "Tenant Admin", tenant: "studio44", tier: "Business", credits: 22100, status: "active", lastActive: "1h ago", joined: "Nov 20, 2024", avatarKind: "green", flag: null },
  { id: "u_004", name: "Diego Ramírez", email: "diego@inktide.shop", role: "Designer", tenant: "inktide", tier: "Starter", credits: 0, status: "active", lastActive: "3h ago", joined: "Apr 02, 2026", avatarKind: "slate", flag: "low_credits" },
  { id: "u_005", name: "Mei Chen", email: "mei@mojothreads.com", role: "Designer", tenant: "mojothreads", tier: "DTF Pro", credits: 5630, status: "active", lastActive: "5h ago", joined: "Oct 11, 2025", avatarKind: "orange", flag: null },
  { id: "u_006", name: "Owen Reilly", email: "owen@craftshop.uk", role: "Designer", tenant: "craftshop", tier: "Business", credits: 14210, status: "suspended", lastActive: "4d ago", joined: "Jul 17, 2024", avatarKind: "purple", flag: "suspended" },
  { id: "u_007", name: "Priya Singh", email: "priya@daydream.io", role: "Designer", tenant: "daydream", tier: "Starter", credits: 800, status: "active", lastActive: "1d ago", joined: "Feb 28, 2026", avatarKind: "green", flag: null },
  { id: "u_008", name: "Tomás Silva", email: "tomas@hexapress.co", role: "Tenant Admin", tenant: "hexapress", tier: "Business", credits: 9800, status: "active", lastActive: "30m ago", joined: "Sep 01, 2025", avatarKind: "slate", flag: null },
  { id: "u_009", name: "Hana Yamada", email: "hana@artery.shop", role: "Designer", tenant: "artery", tier: "DTF Pro", credits: 3200, status: "active", lastActive: "2d ago", joined: "Dec 09, 2025", avatarKind: "orange", flag: "permission_request" },
  { id: "u_010", name: "Felix Kovac", email: "felix@bunnyprint.io", role: "Designer", tenant: "bunnyprint", tier: "Starter", credits: 12, status: "deactivated", lastActive: "21d ago", joined: "Aug 22, 2024", avatarKind: "purple", flag: null },
];

const FEEDBACK = [
  { id: "f_201", from: USERS[0], topic: "DTF gang sheet export", sentiment: "negative", csat: 2, nps: 4, channel: "in-app", excerpt: "Gang sheet PDF download fails when more than 40 tiles are placed — have to retry 3 times.", tags: ["bug","dtf","export"], status: "triaged", priority: "high", shipStatus: "in-progress", time: "12m ago", replies: 1 },
  { id: "f_202", from: USERS[2], topic: "Bulk variation editor", sentiment: "positive", csat: 5, nps: 9, channel: "email", excerpt: "Drag-to-fill is incredible. Saved my team probably 6 hours this week alone.", tags: ["praise","bulk"], status: "new", priority: "low", shipStatus: "n/a", time: "1h ago", replies: 0 },
  { id: "f_203", from: USERS[4], topic: "Color picker contrast", sentiment: "neutral", csat: 3, nps: 6, channel: "in-app", excerpt: "Color picker swatches are too small on the designer side panel — hard to tell navy from black.", tags: ["a11y","designer"], status: "triaged", priority: "med", shipStatus: "planned", time: "3h ago", replies: 2 },
  { id: "f_204", from: USERS[7], topic: "API rate limit", sentiment: "negative", csat: 2, nps: 3, channel: "in-app", excerpt: "Webhook retries are getting throttled at 60/min — our Shopify webhooks back up every Black Friday.", tags: ["api","perf"], status: "in-progress", priority: "high", shipStatus: "in-progress", time: "5h ago", replies: 4 },
  { id: "f_205", from: USERS[3], topic: "AI credits expiring", sentiment: "negative", csat: 1, nps: 2, channel: "email", excerpt: "Didn't know credits expire monthly. Lost 4k credits and the bill was already paid. Refund please.", tags: ["billing","credits"], status: "new", priority: "high", shipStatus: "n/a", time: "6h ago", replies: 0 },
  { id: "f_206", from: USERS[5], topic: "Mobile preview", sentiment: "positive", csat: 5, nps: 10, channel: "in-app", excerpt: "Mobile preview mode is gorgeous. Wish I could share a QR code from the canvas.", tags: ["mobile","feature-req"], status: "shipped", priority: "low", shipStatus: "shipped", time: "1d ago", replies: 1 },
  { id: "f_207", from: USERS[6], topic: "WooCommerce sync", sentiment: "negative", csat: 2, nps: 3, channel: "support", excerpt: "Sync stops silently when SKU contains a slash. Had to manually re-run for 200 products.", tags: ["bug","woo"], status: "in-progress", priority: "med", shipStatus: "in-progress", time: "1d ago", replies: 3 },
  { id: "f_208", from: USERS[8], topic: "DTF Pro permission ask", sentiment: "neutral", csat: 4, nps: 7, channel: "in-app", excerpt: "Can I get DTF Pro access for the team for next week's job? Happy to upgrade after.", tags: ["request","permissions"], status: "new", priority: "med", shipStatus: "n/a", time: "2d ago", replies: 0 },
];

const PERMISSIONS = [
  { key: "designer.canvas", label: "Designer Canvas", group: "Designer", on: true, scope: "default" },
  { key: "designer.dtf", label: "DTF Gang Sheet", group: "Designer", on: true, scope: "tier" },
  { key: "designer.ai_suggest", label: "AI Suggestions", group: "Designer", on: true, scope: "tier" },
  { key: "designer.export.png", label: "PNG Export", group: "Designer", on: true, scope: "default" },
  { key: "designer.export.pdf", label: "PDF Export (high-res)", group: "Designer", on: true, scope: "tier" },
  { key: "billing.invoices", label: "View Invoices", group: "Billing", on: true, scope: "role" },
  { key: "billing.change_plan", label: "Change Plan", group: "Billing", on: false, scope: "role" },
  { key: "team.invite", label: "Invite Team Members", group: "Team", on: true, scope: "role" },
  { key: "team.remove", label: "Remove Team Members", group: "Team", on: false, scope: "override" },
  { key: "api.create_keys", label: "Create API Keys", group: "API", on: true, scope: "tier" },
  { key: "api.live_keys", label: "Issue Live Keys", group: "API", on: false, scope: "tier" },
  { key: "admin.feedback", label: "Read Feedback", group: "Admin", on: false, scope: "role" },
];

const ACTIVITY = [
  { who: USERS[0], action: "tier changed", target: "Starter → DTF Pro", who2: "Felix Kovac", time: "2m ago", icon: "credit-card", tone: "blue" },
  { who: USERS[2], action: "credits topped up", target: "+5,000", who2: "Mei Chen", time: "8m ago", icon: "sparkles", tone: "violet" },
  { who: USERS[7], action: "subdomain reassigned", target: "hexapress.cncpt → Tomás Silva", who2: null, time: "14m ago", icon: "globe", tone: "amber" },
  { who: USERS[8], action: "permission requested", target: "DTF Gang Sheet", who2: null, time: "32m ago", icon: "shield", tone: "amber" },
  { who: USERS[5], action: "suspended", target: "policy violation: bulk export abuse", who2: null, time: "1h ago", icon: "ban", tone: "rose" },
  { who: USERS[3], action: "left feedback", target: "AI credits expiring", who2: null, time: "6h ago", icon: "message-square", tone: "blue" },
];

const SUBDOMAINS = [
  { sub: "northgear", owner: USERS[0], teams: 2, traffic: "12.4k/mo", health: "ok" },
  { sub: "printlab", owner: USERS[1], teams: 1, traffic: "3.1k/mo", health: "ok" },
  { sub: "studio44", owner: USERS[2], teams: 4, traffic: "27.8k/mo", health: "ok" },
  { sub: "inktide", owner: USERS[3], teams: 0, traffic: "—", health: "warn" },
  { sub: "mojothreads", owner: USERS[4], teams: 1, traffic: "8.0k/mo", health: "ok" },
  { sub: "craftshop", owner: null, teams: 0, traffic: "—", health: "warn" },
];

const PLATFORM_KPIS = {
  users: { v: "12,408", d: "+184", trend: "up" },
  tenants: { v: "1,072", d: "+27", trend: "up" },
  mrr: { v: "$48.2k", d: "+4.1%", trend: "up" },
  credits: { v: "2.8M", d: "−112k", trend: "down" },
};

const ATTENTION = [
  { kind: "request", label: "Permission request", who: USERS[1], detail: "wants DTF Gang Sheet access", time: "14m" },
  { kind: "feedback", label: "High-priority feedback", who: USERS[3], detail: "billing refund — AI credits expiring", time: "6h" },
  { kind: "subdomain", label: "Subdomain orphaned", who: null, detail: "craftshop has no owner — assign?", time: "1d" },
  { kind: "credits", label: "Low credits", who: USERS[3], detail: "0 credits, paid Starter plan", time: "2d" },
  { kind: "tier", label: "Tier upgrade pending", who: USERS[8], detail: "DTF Pro requested for next week", time: "2d" },
];

Object.assign(window, {
  Icon, useLucide, initials,
  USERS, FEEDBACK, PERMISSIONS, ACTIVITY, SUBDOMAINS,
  PLATFORM_KPIS, ATTENTION,
});
