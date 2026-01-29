import { getAllSubdomains } from "@/lib/subdomains"
import type { Metadata } from "next"
import { AdminDashboard } from "./dashboard"
import { rootDomain } from "@/lib/utils"
import { requireSuperAdmin } from "@/lib/super-admin"

export const metadata: Metadata = {
  title: `Super Admin Dashboard | ${rootDomain}`,
  description: `Platform administration for ${rootDomain}`,
}

export default async function AdminPage() {
  // This will redirect to /dashboard if not a super admin
  const { user, permissions } = await requireSuperAdmin()

  // Fetch tenants with error handling
  let tenants: Awaited<ReturnType<typeof getAllSubdomains>> = []
  try {
    tenants = await getAllSubdomains()
  } catch (error) {
    console.error("[Admin] Failed to fetch subdomains:", error)
    // Continue with empty list - dashboard will show empty state
  }

  return (
    <AdminDashboard
      tenants={tenants}
      superAdmin={{ userId: user.id, email: user.email, permissions }}
    />
  )
}
