import { requireAuth } from "@/lib/auth"
import { getUserSubdomains } from "@/app/actions"
import { DashboardSidebar } from "./dashboard-sidebar"
import { DashboardContent } from "./dashboard-content"

export default async function DashboardPage() {
  const user = await requireAuth()
  const subdomains = await getUserSubdomains()

  return (
    <div className="min-h-screen bg-background flex">
      <DashboardSidebar user={user} subdomains={subdomains} />
      <DashboardContent user={user} subdomains={subdomains} />
    </div>
  )
}
