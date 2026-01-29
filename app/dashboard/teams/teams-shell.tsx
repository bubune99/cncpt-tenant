"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardSidebar } from "@/app/dashboard/dashboard-sidebar"
import { useUser } from "@stackframe/stack"
import { getUserSubdomains } from "@/app/actions"
import { HelpProvider } from "@/components/help-system"
import { Loader2 } from "lucide-react"

export function TeamsShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const stackUser = useUser()
  const [user, setUser] = useState<any>(null)
  const [subdomains, setSubdomains] = useState<any[]>([])
  const [selectedSubdomain, setSelectedSubdomain] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (stackUser) {
      setUser(stackUser)
    }
  }, [stackUser])

  useEffect(() => {
    async function loadSubdomains() {
      if (!user?.id) return
      try {
        const userSubdomains = await getUserSubdomains()
        setSubdomains(Array.isArray(userSubdomains) ? userSubdomains : [])
        setSelectedSubdomain(userSubdomains?.[0]?.subdomain || null)
      } catch (err) {
        console.error("Failed to load subdomains:", err)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      loadSubdomains()
    } else {
      setLoading(false)
    }
  }, [user])

  if (loading || !stackUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    router.push("/login")
    return null
  }

  return (
    <HelpProvider>
      <div className="min-h-screen bg-background flex">
        <DashboardSidebar
          user={user}
          subdomains={subdomains}
          activeSection="teams"
          setActiveSection={(section) => {
            if (section !== "teams") {
              router.push("/dashboard")
              setTimeout(() => {
                window.dispatchEvent(new CustomEvent('navigate-to-section', { detail: section }))
              }, 100)
            }
          }}
          selectedSubdomain={selectedSubdomain}
          setSelectedSubdomain={setSelectedSubdomain}
        />
        <main className="flex-1 bg-gray-50">
          <div className="container mx-auto px-6 py-8">
            {children}
          </div>
        </main>
      </div>
    </HelpProvider>
  )
}
