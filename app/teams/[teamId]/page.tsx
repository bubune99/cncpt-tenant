import { requireAuth } from "@/lib/auth"
import { sql } from "@/lib/neon"
import { notFound } from "next/navigation"
import { TeamDashboard } from "./team-dashboard"

interface TeamPageProps {
  params: Promise<{ teamId: string }>
}

export default async function TeamPage({ params }: TeamPageProps) {
  const { teamId } = await params
  const user = await requireAuth()

  // Verify user has access to this team
  const teamResult = await sql`
    SELECT * FROM subdomains 
    WHERE subdomain = ${teamId} AND user_id = ${user.id}
  `

  if (teamResult.length === 0) {
    notFound()
  }

  const team = teamResult[0]

  return <TeamDashboard user={user} team={team} />
}
