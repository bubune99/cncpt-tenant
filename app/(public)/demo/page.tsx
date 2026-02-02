"use client"

import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { useEffect, useState } from "react"
import { ArrowRight, Play, Calendar, Sparkles } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { rootDomain, protocol } from "@/lib/utils"
import { useTheme } from "next-themes"

// Demo page now directly links to the built-in demo subdomain
// which provides a read-only view of the CMS backend

export default function DemoPage() {
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Build the demo URL
  const demoUrl = `${protocol}://demo.${rootDomain}/admin`

  const handleDemoClick = () => {
    setIsRedirecting(true)
    window.location.href = demoUrl
  }

  if (isRedirecting) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-white/60">Loading demo...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-800 dark:text-white">
      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-600/10 dark:bg-blue-600/20 rounded-full blur-[150px] opacity-50" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-orange-500/10 dark:bg-orange-500/20 rounded-full blur-[150px] opacity-40" />
      </div>

      {/* Navigation */}
      <header className="relative z-50 py-6 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center group">
            {mounted && (
              <Image
                src={resolvedTheme === "dark" ? "/CNCPT_Web_logo_white.png" : "/CNCPT_Web_logo_navy.png"}
                alt="CNCPT Web"
                width={140}
                height={40}
                className="h-9 w-auto"
                priority
              />
            )}
            {!mounted && (
              <div className="h-9 w-[140px] bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            )}
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link href="/pricing" className="text-sm text-gray-600 dark:text-white/60 hover:text-gray-900 dark:hover:text-white transition-colors">Pricing</Link>
            <Link href="/book" className="text-sm text-gray-600 dark:text-white/60 hover:text-gray-900 dark:hover:text-white transition-colors">Book Call</Link>
            <ThemeToggle />
            <Link href="/register" className="px-5 py-2.5 text-sm font-medium bg-blue-800 dark:bg-white text-white dark:text-gray-900 rounded-xl hover:bg-blue-700 dark:hover:bg-white/90 transition-colors">
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative pt-20 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 dark:border-white/[0.1] bg-gray-50 dark:bg-white/[0.03] mb-8">
              <Sparkles className="w-4 h-4 text-orange-500 dark:text-orange-400" />
              <span className="text-sm text-gray-600 dark:text-white/60">Interactive Demo</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 text-gray-900 dark:text-white">
              See CNCPT CMS
              <br />
              <span className="bg-gradient-to-r from-blue-800 via-blue-600 to-orange-500 dark:from-blue-400 dark:via-blue-300 dark:to-orange-400 bg-clip-text text-transparent">
                in action
              </span>
            </h1>

            <p className="text-lg text-gray-600 dark:text-white/50 max-w-xl mx-auto mb-10">
              Experience the full power of our CMS platform. Start a free trial
              to explore all features with your own data.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Options */}
      <section className="relative pb-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Live Demo */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative group"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-800 to-orange-500 rounded-2xl blur opacity-25 group-hover:opacity-40 transition-opacity" />
              <div className="relative p-8 rounded-2xl border border-gray-200 dark:border-white/[0.1] bg-white dark:bg-gray-800 h-full">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-800 to-orange-500 flex items-center justify-center mb-6">
                  <Play className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">Try Live Demo</h2>
                <p className="text-gray-600 dark:text-white/50 mb-6 leading-relaxed">
                  Explore the full CMS experience instantly. No sign-up required.
                  Browse products, pages, blog, and all features in read-only mode.
                </p>
                <ul className="space-y-3 mb-8">
                  {[
                    "No sign-up required",
                    "Explore all CMS features",
                    "Sample data included",
                    "Start in seconds",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-sm text-gray-600 dark:text-white/70">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
                      {item}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={handleDemoClick}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-800 dark:bg-white text-white dark:text-gray-900 rounded-xl font-medium hover:bg-blue-700 dark:hover:bg-white/90 transition-colors"
                >
                  Open live demo
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>

            {/* Book Demo */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="relative"
            >
              <div className="p-8 rounded-2xl border border-gray-200 dark:border-white/[0.1] bg-gray-50 dark:bg-white/[0.02] h-full">
                <div className="w-14 h-14 rounded-xl bg-gray-100 dark:bg-white/[0.05] border border-gray-200 dark:border-white/[0.1] flex items-center justify-center mb-6">
                  <Calendar className="w-6 h-6 text-gray-500 dark:text-white/60" />
                </div>
                <h2 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">Book a Live Demo</h2>
                <p className="text-gray-600 dark:text-white/50 mb-6 leading-relaxed">
                  Want a personalized walkthrough? Schedule a 30-minute call
                  and we&apos;ll show you exactly how CNCPT can work for your business.
                </p>
                <ul className="space-y-3 mb-8">
                  {[
                    "Personalized walkthrough",
                    "Q&A with our team",
                    "Custom use-case discussion",
                    "Free consultation",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-sm text-gray-600 dark:text-white/70">
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-500 dark:bg-orange-400" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/book"
                  className="inline-flex items-center gap-2 px-6 py-3 border border-gray-200 dark:border-white/[0.1] text-gray-700 dark:text-white rounded-xl font-medium hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-colors"
                >
                  Schedule call
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CMS Preview */}
      <section className="relative py-20 px-6 border-t border-gray-200 dark:border-white/[0.06]">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">What you&apos;ll get</h2>
            <p className="text-gray-600 dark:text-white/50">A complete CMS with everything built-in.</p>
          </motion.div>

          {/* Feature Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                title: "Visual Page Builder",
                desc: "Drag-and-drop editor with 40+ components",
                gradient: "from-blue-800 to-blue-600",
              },
              {
                title: "Product Management",
                desc: "Inventory, variants, pricing, bulk operations",
                gradient: "from-orange-600 to-orange-500",
              },
              {
                title: "Blog & Content",
                desc: "Rich editor, categories, SEO tools",
                gradient: "from-emerald-600 to-teal-500",
              },
              {
                title: "Email Marketing",
                desc: "Campaigns, automation, analytics",
                gradient: "from-blue-700 to-blue-500",
              },
              {
                title: "AI Assistant",
                desc: "Content generation, optimization, chat",
                gradient: "from-orange-500 to-amber-500",
              },
              {
                title: "Analytics Dashboard",
                desc: "Real-time insights and reporting",
                gradient: "from-gray-700 to-gray-600",
              },
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-5 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.02] hover:bg-gray-100 dark:hover:bg-white/[0.04] transition-colors"
              >
                <div className={`inline-flex p-2.5 rounded-lg bg-gradient-to-br ${feature.gradient} mb-4`}>
                  <div className="w-5 h-5 bg-white/20 rounded" />
                </div>
                <h3 className="font-semibold mb-1 text-gray-900 dark:text-white">{feature.title}</h3>
                <p className="text-sm text-gray-600 dark:text-white/50">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="relative py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-600/10 via-orange-500/10 to-blue-500/10 dark:from-blue-600/20 dark:via-orange-500/20 dark:to-blue-500/20 rounded-3xl blur-2xl opacity-40" />
            <div className="relative rounded-2xl border border-gray-200 dark:border-white/[0.1] bg-white dark:bg-gray-800 overflow-hidden">
              {/* Browser chrome */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.02]">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-gray-300 dark:bg-white/10" />
                  <div className="w-3 h-3 rounded-full bg-gray-300 dark:bg-white/10" />
                  <div className="w-3 h-3 rounded-full bg-gray-300 dark:bg-white/10" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="px-4 py-1 rounded-md bg-gray-100 dark:bg-white/[0.05] text-xs text-gray-500 dark:text-white/40">
                    yoursite.cncptweb.com/admin
                  </div>
                </div>
              </div>

              {/* Dashboard mockup */}
              <div className="flex">
                {/* Sidebar */}
                <div className="w-52 border-r border-gray-200 dark:border-white/[0.06] p-4 hidden md:block bg-gray-50 dark:bg-transparent">
                  <div className="space-y-1">
                    {["Dashboard", "Products", "Orders", "Pages", "Blog", "Media", "Analytics", "Settings"].map((item, i) => (
                      <div
                        key={item}
                        className={`px-3 py-2 rounded-lg text-sm ${i === 0 ? "bg-blue-50 dark:bg-white/[0.08] text-blue-800 dark:text-white" : "text-gray-500 dark:text-white/40"}`}
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Main */}
                <div className="flex-1 p-6 bg-white dark:bg-transparent">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <div className="h-6 w-32 bg-gray-200 dark:bg-white/10 rounded mb-1" />
                      <div className="h-4 w-48 bg-gray-100 dark:bg-white/5 rounded" />
                    </div>
                    <div className="h-9 w-24 bg-orange-500/20 rounded-lg" />
                  </div>

                  <div className="grid grid-cols-4 gap-4 mb-6">
                    {[1, 2, 3, 4].map((n) => (
                      <div key={n} className="p-4 rounded-xl border border-gray-200 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.02]">
                        <div className="h-3 w-16 bg-gray-200 dark:bg-white/10 rounded mb-2" />
                        <div className="h-6 w-20 bg-gray-300 dark:bg-white/20 rounded mb-1" />
                        <div className="h-3 w-12 bg-emerald-500/30 rounded" />
                      </div>
                    ))}
                  </div>

                  <div className="rounded-xl border border-gray-200 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.02] p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="h-4 w-32 bg-gray-200 dark:bg-white/10 rounded" />
                      <div className="flex gap-2">
                        {[1, 2, 3].map((n) => (
                          <div key={n} className="h-6 w-12 bg-gray-100 dark:bg-white/5 rounded" />
                        ))}
                      </div>
                    </div>
                    <div className="flex items-end gap-1 h-32">
                      {[40, 65, 45, 80, 55, 90, 75, 85, 60, 95, 70, 88].map((h, i) => (
                        <div
                          key={i}
                          className="flex-1 bg-gradient-to-t from-blue-600/60 to-orange-400/60 rounded-sm"
                          style={{ height: `${h}%` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">Ready to try it yourself?</h2>
            <p className="text-gray-600 dark:text-white/50 mb-8">
              Start your free trial and experience the full CMS in minutes.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-8 py-4 bg-blue-800 dark:bg-white text-white dark:text-gray-900 rounded-xl font-medium hover:bg-blue-700 dark:hover:bg-white/90 transition-colors"
            >
              Start free trial
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-12 px-6 border-t border-gray-200 dark:border-white/[0.06]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <Link href="/" className="flex items-center">
            {mounted && (
              <Image
                src={resolvedTheme === "dark" ? "/CNCPT_Web_logo_white.png" : "/CNCPT_Web_logo_navy.png"}
                alt="CNCPT Web"
                width={100}
                height={30}
                className="h-7 w-auto"
              />
            )}
            {!mounted && (
              <div className="h-7 w-[100px] bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            )}
          </Link>
          <p className="text-sm text-gray-400 dark:text-white/30">
            &copy; {new Date().getFullYear()} CNCPT Web. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
