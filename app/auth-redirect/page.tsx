import { redirect } from "next/navigation"
import { stackServerApp } from "@/stack"
import { getUserWithRole, getRedirectPath } from "@/lib/auth-utils"

interface AuthRedirectPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function AuthRedirectPage({ searchParams }: AuthRedirectPageProps) {
  const params = await searchParams
  const intendedPath = typeof params.redirect === "string" ? params.redirect : undefined

  // Get current user from Stack Auth
  const user = await stackServerApp.getUser()

  if (!user) {
    // No user found, redirect to login
    redirect("/login")
  }

  // Get user role information
  const userWithRole = await getUserWithRole(user.id)

  if (!userWithRole) {
    // Error getting user role, redirect to login
    redirect("/login")
  }

  // Determine redirect path based on role
  const redirectPath = getRedirectPath(userWithRole.isAdmin, intendedPath)

  console.log(`[v0] Redirecting user ${userWithRole.email} (admin: ${userWithRole.isAdmin}) to ${redirectPath}`)

  redirect(redirectPath)
}
