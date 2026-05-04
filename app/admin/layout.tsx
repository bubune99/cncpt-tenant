import type { Metadata } from "next"
import { requireSuperAdmin } from "@/lib/super-admin"

export const metadata: Metadata = {
  title: "Super Admin",
  description: "Platform administration",
  robots: {
    index: false,
    follow: false,
  },
}

// Force dynamic rendering — every request needs a fresh super-admin check.
export const dynamic = "force-dynamic"

/**
 * Server-side super-admin gate for the entire /admin tree.
 *
 * Previously the only protection was on each underlying API route. The page
 * shells (/admin/clients, /admin/tiers, /admin/feedback) were client
 * components with NO server-side guard. Anyone could load the shell, see UI
 * implying privileged access exists, and probe for misconfigured endpoints.
 *
 * `requireSuperAdmin()` redirects to `/dashboard` for unauthenticated users
 * and non-super-admin users. The /admin/page.tsx and /admin/feedback/page.tsx
 * already call it; this layout makes the guard universal across the route
 * group so /admin/clients and /admin/tiers are also gated.
 */
export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Redirects internally if user is not a platform super admin.
  await requireSuperAdmin()
  return <>{children}</>
}
