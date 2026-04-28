import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { stackServerApp } from "@/stack"

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Manage your CNCPT Web sites, settings, and team.",
  robots: {
    index: false,
    follow: false,
  },
}

/**
 * Server-side auth gate for /dashboard and all sub-routes.
 *
 * Previously /dashboard returned 200 with a client-side login overlay,
 * leaking the layout to unauthenticated visitors and producing a flash
 * of authed UI before the overlay mounted. Use Stack Auth's server app
 * to read the session cookie and redirect to the sign-in handler if no
 * user is present. The handler will return the visitor here on success.
 */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await stackServerApp.getUser()
  if (!user) {
    redirect("/handler/sign-in?after_auth_return_to=/dashboard")
  }
  return <>{children}</>
}
