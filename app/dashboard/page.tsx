"use client"

import { useState, useEffect, useRef, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { getUserSubdomains } from "@/app/actions"
import { useUser } from "@stackframe/stack"
import { HelpProvider } from "@/components/help-system"
import { DashboardChat } from "@/components/dashboard-chat"
import { SpotlightHostClient } from "@/components/cms/spotlight/SpotlightHostClient"
import { AgentNavRail } from "@/components/cms/admin/agent-nav-rail"
import { CanvasShell } from "./canvas/canvas-shell"

export const dynamic = "force-dynamic"

export default function DashboardPage() {
  const searchParams = useSearchParams()
  const [activeSection, setActiveSection] = useState(() => searchParams.get("section") || "overview")
  const [selectedSubdomain, setSelectedSubdomain] = useState<string | null>(null)
  const [stackAuthError, setStackAuthError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [subdomains, setSubdomains] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const hasLoadedSubdomains = useRef(false)
  const [announcements, setAnnouncements] = useState<Array<{ id: number; title: string; message: string; type: string }>>([])

  const stackUser = useUser()

  // Sync Stack Auth user to local state
  useEffect(() => {
    if (stackUser) {
      setUser(stackUser)
      setStackAuthError(null)
    }
  }, [stackUser])

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

  // Fetch active announcements
  useEffect(() => {
    fetch("/api/admin/announcements")
      .then(r => r.ok ? r.json() : { announcements: [] })
      .then(data => setAnnouncements(data.announcements || []))
      .catch(() => {})
  }, [])

  // Load subdomains once we have a user — loading stays true until fetch completes
  useEffect(() => {
    if (!user || hasLoadedSubdomains.current) return
    hasLoadedSubdomains.current = true
    loadSubdomains()
  }, [user])

  const loadSubdomains = async () => {
    try {
      const userSubdomains = await getUserSubdomains()
      setSubdomains(Array.isArray(userSubdomains) ? userSubdomains : [])
      setSelectedSubdomain(userSubdomains?.[0]?.subdomain ?? null)
    } catch (err) {
      console.error("Dashboard subdomain loading error:", err)
      setError("Failed to load subdomains")
      setSubdomains([])
      setSelectedSubdomain(null)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
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
          <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          <div className="w-16 h-16 bg-destructive/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
    <HelpProvider>
      {announcements.length > 0 && (
        <div className="fixed top-0 left-0 right-0 z-50">
          {announcements.slice(0, 1).map((a) => (
            <div key={a.id} className={`px-4 py-2 text-center text-sm ${
              a.type === 'warning' ? 'bg-yellow-500 text-yellow-950' :
              a.type === 'error' ? 'bg-red-500 text-white' :
              'bg-blue-500 text-white'
            }`}>
              <strong>{a.title}:</strong> {a.message}
            </div>
          ))}
        </div>
      )}
      <div className="min-h-screen bg-background">
        <CanvasShell
          user={user}
          subdomains={subdomains}
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          selectedSubdomain={selectedSubdomain}
          setSelectedSubdomain={setSelectedSubdomain}
        />
        <DashboardChat />
        {/* Assistant nav/fill execution layer for the dashboard chat. */}
        <AgentNavRail />
        <SpotlightHostClient />
      </div>
    </HelpProvider>
  )
}
