/**
 * Mock data for the public /demo dashboard preview.
 *
 * Renders a believable read-only snapshot of the admin dashboard for
 * unauthenticated visitors. No DB, no auth, no real tenant — purely
 * static so prospects can explore the product before signing up.
 *
 * Kept separate from `lib/demo-data.ts` (which powers the in-product
 * `demo.cncptweb.com` read-only tenant) and `lib/demo.ts` (which
 * gates the demo subdomain). This file is just for the marketing
 * `/demo` route.
 */

export interface DemoSubdomain {
  id: string
  subdomain: string
  site_title: string
  created_at: string
  status: "active" | "draft"
  visitsThisMonth: number
  ordersThisMonth: number
  revenueThisMonth: number
}

export const DEMO_SUBDOMAINS: ReadonlyArray<DemoSubdomain> = [
  {
    id: "demo-acme-clothing",
    subdomain: "acme-clothing",
    site_title: "Acme Clothing Co.",
    created_at: "2025-09-12T10:00:00Z",
    status: "active",
    visitsThisMonth: 12500,
    ordersThisMonth: 184,
    revenueThisMonth: 14820,
  },
  {
    id: "demo-luxe-fitness",
    subdomain: "luxe-fitness",
    site_title: "Luxe Fitness Studio",
    created_at: "2025-11-03T09:30:00Z",
    status: "active",
    visitsThisMonth: 4800,
    ordersThisMonth: 52,
    revenueThisMonth: 3140,
  },
  {
    id: "demo-your-startup",
    subdomain: "your-startup",
    site_title: "Your Startup",
    created_at: "2026-02-18T15:45:00Z",
    status: "active",
    visitsThisMonth: 240,
    ordersThisMonth: 11,
    revenueThisMonth: 460,
  },
]

export const DEMO_USER = {
  name: "Demo User",
  displayName: "Demo User",
  email: "demo@cncptweb.com",
  primaryEmail: "demo@cncptweb.com",
} as const

export const DEMO_METRICS = {
  revenue: 18420,
  revenueChange: 12.4, // percent vs last month
  orders: 247,
  ordersChange: 8.1,
  customers: 89,
  customersChange: 22.3,
  conversionRate: 3.2,
  conversionRateChange: 0.4,
} as const

export interface DemoActivity {
  id: string
  type: "order" | "page" | "domain" | "team"
  text: string
  timeAgo: string
}

export const DEMO_RECENT_ACTIVITY: ReadonlyArray<DemoActivity> = [
  { id: "a1", type: "order", text: "New order #1247 — $89.00 from Sarah J.", timeAgo: "2 min ago" },
  { id: "a2", type: "page", text: "Page \"Spring Collection\" published on acme-clothing", timeAgo: "18 min ago" },
  { id: "a3", type: "team", text: "Maya Chen accepted your team invite", timeAgo: "1 hr ago" },
  { id: "a4", type: "domain", text: "Custom domain shop.acmeclothing.com verified", timeAgo: "3 hr ago" },
  { id: "a5", type: "order", text: "New order #1246 — $42.50 from Marcus T.", timeAgo: "5 hr ago" },
  { id: "a6", type: "page", text: "Blog post \"5 Tips for Better Workouts\" published on luxe-fitness", timeAgo: "yesterday" },
]

// Twelve months of bar-chart data for visits — drives the "visits over
// time" chart in the demo overview. Numbers are believable, not real.
export const DEMO_VISITS_BARS: ReadonlyArray<number> = [
  4200, 6800, 5900, 8400, 7100, 9500, 8200, 11200, 9800, 12500, 10800, 13900,
]

export const DEMO_TRAFFIC_SOURCES: ReadonlyArray<{ label: string; pct: number }> = [
  { label: "Direct", pct: 38 },
  { label: "Organic Search", pct: 27 },
  { label: "Social", pct: 19 },
  { label: "Referral", pct: 11 },
  { label: "Email", pct: 5 },
]
