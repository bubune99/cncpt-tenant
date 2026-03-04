"use client"

import { useUser } from "@stackframe/stack"
import { useState, useEffect } from "react"
import { useTheme } from "next-themes"

import { Navbar } from "@/components/landing/navbar"
import { HeroSection } from "@/components/landing/hero-section"
import { LogoMarquee } from "@/components/landing/logo-marquee"
import { StatsSection } from "@/components/landing/stats-section"
import { FeaturesSection } from "@/components/landing/features-section"
import { TestimonialsLanding } from "@/components/landing/testimonials-section"
import { CTASection } from "@/components/landing/cta-section"
import { Footer } from "@/components/landing/footer"

export const dynamic = "force-dynamic"

export default function HomePage() {
  const user = useUser()
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Navbar user={user} mounted={mounted} resolvedTheme={resolvedTheme} />
      <HeroSection />
      <LogoMarquee />
      <StatsSection />
      <FeaturesSection />
      <TestimonialsLanding />
      <CTASection />
      <Footer mounted={mounted} resolvedTheme={resolvedTheme} />
    </div>
  )
}
