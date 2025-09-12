import { stackServerApp } from "@/stack"
import { sql } from "@/lib/neon"

export interface UserWithRole {
  id: string
  email: string
  displayName: string | null
  isAdmin: boolean
}

// Check if user is admin based on email or database role
export async function checkUserRole(userId: string): Promise<{ isAdmin: boolean }> {
  try {
    // First check if user exists in admin_users table
    const adminCheck = await sql`
      SELECT user_id FROM admin_users WHERE user_id = ${userId}
    `

    if (adminCheck.length > 0) {
      return { isAdmin: true }
    }

    // Fallback: check if user email is in admin list (you can configure this)
    const user = await stackServerApp.getUser({ userId })
    const adminEmails = process.env.ADMIN_EMAILS?.split(",") || []

    if (user && adminEmails.includes(user.primaryEmail || "")) {
      // Add to admin_users table for future checks
      await sql`
        INSERT INTO admin_users (user_id, email) 
        VALUES (${userId}, ${user.primaryEmail})
        ON CONFLICT (user_id) DO NOTHING
      `
      return { isAdmin: true }
    }

    return { isAdmin: false }
  } catch (error) {
    console.error("[v0] Error checking user role:", error)
    return { isAdmin: false }
  }
}

// Get user with role information
export async function getUserWithRole(userId: string): Promise<UserWithRole | null> {
  try {
    const user = await stackServerApp.getUser({ userId })
    if (!user) {
      console.log(`[v0] No user found for ID: ${userId}`)
      return null
    }

    const { isAdmin } = await checkUserRole(userId)

    console.log(`[v0] User ${user.primaryEmail} role check: admin=${isAdmin}`)

    return {
      id: user.id,
      email: user.primaryEmail || "",
      displayName: user.displayName,
      isAdmin,
    }
  } catch (error) {
    console.error("[v0] Error getting user with role:", error)
    return null
  }
}

// Redirect users based on their role after login
export function getRedirectPath(isAdmin: boolean, intendedPath?: string): string {
  // If user has an intended path and it's not restricted, use it
  if (intendedPath && !intendedPath.startsWith("/admin")) {
    return intendedPath
  }

  // Admin users go to admin dashboard, regular users go to user dashboard
  return isAdmin ? "/admin" : "/dashboard"
}
