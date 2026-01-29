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

  const tenants = await getAllSubdomains()

  return (
    <AdminDashboard
      tenants={tenants}
      superAdmin={{ userId: user.id, email: user.email, permissions }}
    />
  )
}
