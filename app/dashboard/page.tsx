"use client"

import { useState, useEffect } from "react"
import { getUserSubdomains } from "@/app/actions"
import { DashboardSidebar } from "./dashboard-sidebar"
import { DashboardContent } from "./dashboard-content"
import { useUser } from "@stackframe/stack"

export const dynamic = "force-dynamic"

interface DashboardPageProps {
  user?: any
  subdomains?: any[]
}

export default function DashboardPage({ user: initialUser, subdomains: initialSubdomains }: DashboardPageProps = {}) {
  const [activeSection, setActiveSection] = useState("overview")
  const [selectedSubdomain, setSelectedSubdomain] = useState<string | null>(null)
  const [isClient, setIsClient] = useState(false)
  const [stackAuthError, setStackAuthError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [subdomains, setSubdomains] = useState(initialSubdomains || [])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const stackUser = useUser()

  useEffect(() => {
    let mounted = true

    const loadUser = async () => {
      try {
        if (mounted) {
          setUser(stackUser)
          setStackAuthError(null)
        }
      } catch (err: any) {
        console.error("[v0] Stack Auth error:", err)
        if (mounted) {
          if (err.message?.includes("Too Many")) {
            setStackAuthError("Rate limit exceeded. Please wait a moment and refresh the page.")
          } else {
            setStackAuthError("Authentication service temporarily unavailable.")
          }
        }
      }
    }

    loadUser()
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Listen for navigation events from child components
  useEffect(() => {
    const handleNavigate = (event: CustomEvent) => {
      setActiveSection(event.detail)
    }
    window.addEventListener('navigate-to-section', handleNavigate as EventListener)
    return () => {
      window.removeEventListener('navigate-to-section', handleNavigate as EventListener)
    }
  }, [])

  useEffect(() => {
    if (isClient && user && !initialSubdomains) {
      loadSubdomains()
    } else if (initialSubdomains) {
      setSelectedSubdomain(initialSubdomains && initialSubdomains.length > 0 ? initialSubdomains[0]?.subdomain : null)
    }
    if (isClient && (user || stackAuthError)) {
      setLoading(false)
    }
  }, [user, initialSubdomains, isClient, stackAuthError])

  const loadSubdomains = async () => {
    try {
      if (!user?.id) {
        console.log("[v0] No user ID available, skipping subdomain load")
        setSubdomains([])
        setSelectedSubdomain(null)
        return
      }

      const userSubdomains = await getUserSubdomains()
      console.log("[v0] Loaded subdomains:", userSubdomains)
      setSubdomains(Array.isArray(userSubdomains) ? userSubdomains : [])
      setSelectedSubdomain(userSubdomains && userSubdomains.length > 0 ? userSubdomains[0].subdomain : null)
    } catch (err) {
      console.error("[v0] Dashboard subdomain loading error:", err)
      setError("Failed to load subdomains")
      setSubdomains([])
      setSelectedSubdomain(null)
    }
  }

  if (!isClient || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (stackAuthError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Service Temporarily Unavailable</h1>
          <p className="text-muted-foreground mb-6">{stackAuthError}</p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full"
          >
            Refresh Page
          </button>
        </div>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-6">{error || "You need to be signed in to access the dashboard."}</p>
          <div className="space-y-3">
            <a
              href="/login"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full"
            >
              Sign In
            </a>
            <a
              href="/register"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 w-full"
            >
              Create Account
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex">
      <DashboardSidebar
        user={user}
        subdomains={subdomains}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        selectedSubdomain={selectedSubdomain}
        setSelectedSubdomain={setSelectedSubdomain}
      />
      <DashboardContent
        user={user}
        subdomains={subdomains}
        activeSection={activeSection}
        selectedSubdomain={selectedSubdomain}
      />
    </div>
  )
}
