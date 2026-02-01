import type { Metadata } from "next"
import { rootDomain } from "@/lib/utils"
import { requireSuperAdmin } from "@/lib/super-admin"
import { FeedbackDashboard } from "./feedback-dashboard"

export const metadata: Metadata = {
  title: `Feedback Management | ${rootDomain}`,
  description: `Manage user feedback for ${rootDomain}`,
}

export default async function FeedbackPage() {
  // This will redirect to /dashboard if not a super admin
  const { user } = await requireSuperAdmin()

  return <FeedbackDashboard adminUserId={user.id} />
}
