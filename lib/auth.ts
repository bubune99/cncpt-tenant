import { StackServerApp } from "@stackframe/stack"

export const stackServerApp = new StackServerApp({
  tokenStore: "nextjs-cookie",
})

// Keep the User interface for compatibility
export interface User {
  id: string
  email: string
  name: string
  created_at: string
}

// Get current user from Stack Auth
export async function getCurrentUser(): Promise<User | null> {
  const user = await stackServerApp.getUser()

  if (!user) {
    return null
  }

  return {
    id: user.id,
    email: user.primaryEmail || "",
    name: user.displayName || "",
    created_at: user.createdAtMillis ? new Date(user.createdAtMillis).toISOString() : new Date().toISOString(),
  }
}

// Require authentication - redirect to login if not authenticated
export async function requireAuth(redirectToTeam = false): Promise<User> {
  const user = await getCurrentUser()
  if (!user) {
    // Stack Auth will handle the redirect to sign-in
    throw new Error("Authentication required")
  }

  // If redirectToTeam is true, redirect to user's default team
  if (redirectToTeam) {
    const defaultTeam = await getDefaultTeamForUser(user.id)
    if (defaultTeam) {
      const { redirect } = await import("next/navigation")
      redirect(`/teams/${defaultTeam}`)
    }
  }

  return user
}

export async function getDefaultTeamForUser(userId: string): Promise<string | null> {
  const { sql } = await import("@/lib/neon")
  const result = await sql`
    SELECT subdomain FROM subdomains 
    WHERE user_id = ${userId} 
    ORDER BY created_at ASC 
    LIMIT 1
  `

  return result[0]?.subdomain || null
}
