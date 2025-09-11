import { getAllSubdomains } from "@/lib/subdomains"
import type { Metadata } from "next"
import { AdminDashboard } from "./dashboard"
import { rootDomain } from "@/lib/utils"
import { stackServerApp } from "@/stack"
import { getUserWithRole } from "@/lib/auth-utils"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: `Admin Dashboard | ${rootDomain}`,
  description: `Manage subdomains for ${rootDomain}`,
}

export default async function AdminPage() {
  try {
    const user = await stackServerApp.getUser()

    if (!user) {
      redirect("/login?redirect=/admin")
    }

    const userWithRole = await getUserWithRole(user.id)

    if (!userWithRole || !userWithRole.isAdmin) {
      // User is not an admin, redirect to regular dashboard
      redirect("/dashboard")
    }

    const tenants = await getAllSubdomains()

    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <AdminDashboard tenants={tenants} />
      </div>
    )
  } catch (error) {
    console.error("[v0] Admin page auth error:", error)
    redirect("/login?redirect=/admin")
  }
}
