import { redirect } from "next/navigation"
import { stackServerApp } from "@/stack"
import { getUserWithRole, getRedirectPath } from "@/lib/auth-utils"

interface AuthRedirectPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function AuthRedirectPage({ searchParams }: AuthRedirectPageProps) {
  const params = await searchParams
  const intendedPath = typeof params.redirect === "string" ? params.redirect : undefined

  console.log("[v0] Auth redirect page accessed with params:", params)

  try {
    // Get current user from Stack Auth
    const user = await stackServerApp.getUser()

    if (!user) {
      console.log("[v0] No user found, redirecting to login")
      redirect("/login")
    }

    console.log(`[v0] User found: ${user.primaryEmail} (ID: ${user.id})`)

    // Get user role information
    const userWithRole = await getUserWithRole(user.id)

    if (!userWithRole) {
      console.log("[v0] Error getting user role, redirecting to login")
      redirect("/login")
    }

    // Determine redirect path based on role
    const redirectPath = getRedirectPath(userWithRole.isAdmin, intendedPath)

    console.log(`[v0] Redirecting user ${userWithRole.email} (admin: ${userWithRole.isAdmin}) to ${redirectPath}`)

    redirect(redirectPath)
  } catch (error) {
    console.error("[v0] Error in auth redirect:", error)
    redirect("/login?error=auth_failed")
  }
}
