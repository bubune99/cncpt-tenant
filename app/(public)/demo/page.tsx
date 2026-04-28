"use client"

import Link from "next/link"
import Image from "next/image"
import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { Bell, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { DEMO_SUBDOMAINS, DEMO_USER } from "@/lib/demo-dashboard-mock"
import { DemoBanner } from "./demo-banner"
import { DemoSidebar } from "./demo-sidebar"
import { DemoContent } from "./demo-content"
import { DemoToastProvider, useDemoToast } from "./demo-toast"

/**
 * Public demo dashboard.
 *
 * Renders a static, read-only clone of the admin dashboard layout for
 * unauthenticated visitors. Mock data only — no DB calls, no auth, no
 * tenant resolution. Visitors can scroll, click around, see what the
 * real product looks like, and convert via the "Sign up" CTA.
 *
 * Lives under `app/(public)/demo` so it inherits the public layout and
 * is never auth-gated. The `app/dashboard/layout.tsx` server-side gate
 * does NOT apply here.
 */
export default function PublicDemoDashboardPage() {
  return (
    <DemoToastProvider>
      <DemoDashboardShell />
    </DemoToastProvider>
  )
}

function DemoDashboardShell() {
  const [activeSection, setActiveSection] = useState("overview")
  const [selectedSubdomain, setSelectedSubdomain] = useState(
    DEMO_SUBDOMAINS[0]?.subdomain ?? "",
  )

  return (
    <div data-public-demo-dashboard className="min-h-screen bg-background">
      <DemoBanner />
      <div className="flex">
        <DemoSidebar
          subdomains={DEMO_SUBDOMAINS}
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          selectedSubdomain={selectedSubdomain}
          onSubdomainChange={setSelectedSubdomain}
          user={DEMO_USER}
        />
        <div className="flex-1 flex flex-col min-h-screen">
          <DemoTopHeader />
          <DemoContent
            user={DEMO_USER}
            subdomains={DEMO_SUBDOMAINS}
            activeSection={activeSection}
            selectedSubdomain={selectedSubdomain}
          />
        </div>
      </div>
    </div>
  )
}

function DemoTopHeader() {
  const [mounted, setMounted] = useState(false)
  const { resolvedTheme } = useTheme()
  const { showDemoToast } = useDemoToast()

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-30">
      <div className="px-6 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center" aria-label="CNCPT Web home">
          {mounted ? (
            <Image
              src={
                resolvedTheme === "dark"
                  ? "/CNCPT_Web_logo_white.png"
                  : "/CNCPT_Web_logo_navy.png"
              }
              alt="CNCPT Web"
              width={120}
              height={32}
              className="h-8 w-auto"
              priority
            />
          ) : (
            <div className="h-8 w-[120px] bg-muted rounded animate-pulse" />
          )}
        </Link>

        <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
          <Sparkles className="w-4 h-4 text-orange-500" />
          <span>Demo mode — no signup required</span>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            aria-label="Notifications (disabled in demo)"
            disabled
            onClick={() => showDemoToast()}
          >
            <Bell className="w-4 h-4" />
          </Button>
          <Button asChild className="ml-1">
            <Link href="/register">Sign up to use this for real</Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
