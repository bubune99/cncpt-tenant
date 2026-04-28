"use client"

import Link from "next/link"
import Image from "next/image"
import { ThemeToggle } from "@/components/theme-toggle"
import { motion } from "framer-motion"

interface NavbarProps {
  user: any
  mounted: boolean
  resolvedTheme: string | undefined
}

export function Navbar({ user, mounted, resolvedTheme }: NavbarProps) {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-0 left-0 right-0 z-50"
      data-tour-id="home-navbar"
    >
      <div className="mx-auto max-w-7xl px-6 py-4">
        <div className="flex items-center justify-between rounded-2xl border border-border bg-background/80 backdrop-blur-xl px-6 py-3">
          <Link href="/" className="flex items-center group" data-tour-id="home-navbar-logo">
            {mounted ? (
              <Image
                src={resolvedTheme === "dark" ? "/CNCPT_Web_logo_white.png" : "/CNCPT_Web_logo_navy.png"}
                alt="CNCPT Web"
                width={140}
                height={40}
                className="h-9 w-auto"
                priority
              />
            ) : (
              <div className="h-9 w-[140px] bg-muted rounded animate-pulse" />
            )}
          </Link>

          <nav className="hidden md:flex items-center gap-1" data-tour-id="home-navbar-links">
            {[
              { name: "Demo", href: "/demo", tourId: "home-nav-demo" },
              { name: "Pricing", href: "/pricing", tourId: "home-nav-pricing" },
              { name: "Book Call", href: "/book", tourId: "home-nav-book" },
            ].map((item) => (
              <Link
                key={item.name}
                href={item.href}
                data-tour-id={item.tourId}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            {user ? (
              <Link
                href="/dashboard"
                data-tour-id="home-nav-dashboard"
                className="px-5 py-2.5 text-sm font-medium bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  data-tour-id="home-nav-signin"
                  className="hidden sm:block px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  data-tour-id="home-nav-getstarted"
                  className="px-5 py-2.5 text-sm font-medium bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.header>
  )
}
