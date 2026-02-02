"use client"

import Link from "next/link"
import { useUser } from "@stackframe/stack"
import { useState, useEffect, useRef } from "react"
import { motion, useScroll, useTransform, useInView, AnimatePresence } from "framer-motion"
import { ThemeToggle } from "@/components/theme-toggle"

export const dynamic = "force-dynamic"

// Feature data
const features = [
  {
    title: "Visual Page Builder",
    description: "Drag-and-drop editor with 40+ components. Build stunning pages without writing code.",
    gradient: "from-blue-800 to-blue-600",
  },
  {
    title: "Product Management",
    description: "Inventory tracking, variants, bulk operations. Everything you need to run your store.",
    gradient: "from-orange-600 to-orange-500",
  },
  {
    title: "Content & Blog",
    description: "Rich editor with SEO tools, scheduling, categories. Publish content that ranks.",
    gradient: "from-emerald-600 to-teal-500",
  },
  {
    title: "Email Marketing",
    description: "Beautiful campaigns, automation, analytics. Turn visitors into loyal customers.",
    gradient: "from-blue-700 to-blue-500",
  },
  {
    title: "AI Assistant",
    description: "Generate copy, optimize content, answer questions. Your intelligent co-pilot.",
    gradient: "from-orange-500 to-amber-500",
  },
  {
    title: "Analytics",
    description: "Real-time insights, conversion tracking, customer journeys. Make data-driven decisions.",
    gradient: "from-gray-700 to-gray-600",
  },
]

const stats = [
  { value: "99.9%", label: "Uptime SLA" },
  { value: "<100ms", label: "Global Latency" },
  { value: "50+", label: "Integrations" },
  { value: "24/7", label: "Support" },
]

export default function HomePage() {
  const user = useUser()
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const heroRef = useRef<HTMLDivElement>(null)
  const featuresRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(featuresRef, { once: true, margin: "-100px" })

  const { scrollYProgress } = useScroll()
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0])
  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (heroRef.current) {
        const rect = heroRef.current.getBoundingClientRect()
        setMousePosition({
          x: (e.clientX - rect.left - rect.width / 2) / 50,
          y: (e.clientY - rect.top - rect.height / 2) / 50,
        })
      }
    }
    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-800 dark:text-white overflow-x-hidden">
      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-600/10 dark:bg-blue-600/20 rounded-full blur-[150px] opacity-50" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-orange-500/10 dark:bg-orange-500/20 rounded-full blur-[150px] opacity-40" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDAsMCwwLDAuMDMpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] dark:bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDMpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-60" />
      </div>

      {/* Navigation */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-0 left-0 right-0 z-50"
      >
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between rounded-2xl border border-gray-200 dark:border-white/[0.08] bg-white/80 dark:bg-white/[0.02] backdrop-blur-xl px-6 py-3">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative w-9 h-9">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-800 to-orange-500 rounded-lg opacity-80 group-hover:opacity-100 transition-opacity" />
                <div className="absolute inset-[2px] bg-white dark:bg-gray-900 rounded-[6px] flex items-center justify-center">
                  <span className="text-sm font-bold bg-gradient-to-r from-blue-800 to-orange-500 dark:from-blue-400 dark:to-orange-400 bg-clip-text text-transparent">C</span>
                </div>
              </div>
              <span className="text-lg font-semibold tracking-tight text-gray-900 dark:text-white">CNCPT</span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {["Demo", "Pricing", "Book Call"].map((item) => (
                <Link
                  key={item}
                  href={item === "Demo" ? "/demo" : item === "Pricing" ? "/pricing" : "/book"}
                  className="px-4 py-2 text-sm text-gray-600 dark:text-white/60 hover:text-gray-900 dark:hover:text-white transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.05]"
                >
                  {item}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              <ThemeToggle />
              {user ? (
                <Link
                  href="/dashboard"
                  className="px-5 py-2.5 text-sm font-medium bg-blue-800 dark:bg-white text-white dark:text-gray-900 rounded-xl hover:bg-blue-700 dark:hover:bg-white/90 transition-colors"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="hidden sm:block px-4 py-2 text-sm text-gray-600 dark:text-white/60 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/register"
                    className="px-5 py-2.5 text-sm font-medium bg-blue-800 dark:bg-white text-white dark:text-gray-900 rounded-xl hover:bg-blue-700 dark:hover:bg-white/90 transition-colors"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <motion.section
        ref={heroRef}
        style={{ opacity: heroOpacity, scale: heroScale }}
        className="relative min-h-screen flex items-center justify-center pt-32 pb-20 px-6"
      >
        <div className="max-w-7xl mx-auto w-full">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 dark:border-white/[0.1] bg-gray-50 dark:bg-white/[0.03] mb-8"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-sm text-gray-600 dark:text-white/60">Now with AI-powered content generation</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6"
            >
              <span className="block text-gray-900 dark:text-white">The CMS that</span>
              <span className="block bg-gradient-to-r from-blue-800 via-blue-600 to-orange-500 dark:from-blue-400 dark:via-blue-300 dark:to-orange-400 bg-clip-text text-transparent">
                grows with you
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-lg sm:text-xl text-gray-600 dark:text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed"
            >
              Build websites, manage products, publish content, and run marketing campaigns.
              One platform, unlimited possibilities.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link
                href="/register"
                className="group relative px-8 py-4 text-base font-medium rounded-xl overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-800 to-orange-500 transition-transform group-hover:scale-105" />
                <div className="absolute inset-[1px] bg-white dark:bg-gray-900 rounded-[10px] transition-opacity group-hover:opacity-0" />
                <span className="relative bg-gradient-to-r from-blue-800 to-orange-500 dark:from-blue-400 dark:to-orange-400 bg-clip-text text-transparent group-hover:text-white transition-colors">
                  Start free trial
                </span>
              </Link>
              <Link
                href="/demo"
                className="group px-8 py-4 text-base font-medium rounded-xl border border-gray-200 dark:border-white/[0.1] hover:border-gray-300 dark:hover:border-white/[0.2] bg-gray-50 dark:bg-white/[0.02] hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5 text-gray-500 dark:text-white/60 group-hover:text-gray-700 dark:group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                <span className="text-gray-700 dark:text-white/80 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">Explore demo</span>
              </Link>
            </motion.div>
          </div>

          {/* Floating Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
            style={{
              transform: `perspective(1000px) rotateX(${mousePosition.y * 0.5}deg) rotateY(${mousePosition.x * 0.5}deg)`,
            }}
            className="relative mx-auto max-w-5xl"
          >
            {/* Glow effect */}
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-600/10 via-orange-500/10 to-blue-500/10 dark:from-blue-600/20 dark:via-orange-500/20 dark:to-blue-500/20 rounded-3xl blur-2xl opacity-60" />

            {/* Dashboard mockup */}
            <div className="relative rounded-2xl border border-gray-200 dark:border-white/[0.1] bg-gray-50 dark:bg-gray-800 overflow-hidden shadow-2xl">
              {/* Browser chrome */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02]">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-gray-300 dark:bg-white/10" />
                  <div className="w-3 h-3 rounded-full bg-gray-300 dark:bg-white/10" />
                  <div className="w-3 h-3 rounded-full bg-gray-300 dark:bg-white/10" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="px-4 py-1 rounded-md bg-gray-100 dark:bg-white/[0.05] text-xs text-gray-500 dark:text-white/40">
                    app.cncptweb.com/admin
                  </div>
                </div>
              </div>

              {/* Dashboard content */}
              <div className="flex">
                {/* Sidebar */}
                <div className="w-48 border-r border-gray-200 dark:border-white/[0.06] p-4 hidden sm:block bg-white dark:bg-transparent">
                  <div className="space-y-1">
                    {["Dashboard", "Products", "Orders", "Content", "Analytics"].map((item, i) => (
                      <div
                        key={item}
                        className={`px-3 py-2 rounded-lg text-sm ${i === 0 ? "bg-blue-50 dark:bg-white/[0.08] text-blue-800 dark:text-white" : "text-gray-500 dark:text-white/40"}`}
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Main content */}
                <div className="flex-1 p-6 bg-gray-50 dark:bg-transparent">
                  {/* Stats row */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {[
                      { label: "Revenue", value: "$12,450", change: "+12.5%", up: true },
                      { label: "Orders", value: "89", change: "+8.2%", up: true },
                      { label: "Visitors", value: "2,847", change: "+24.1%", up: true },
                      { label: "Conversion", value: "3.2%", change: "-0.4%", up: false },
                    ].map((stat, i) => (
                      <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.8 + i * 0.1 }}
                        className="p-4 rounded-xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02]"
                      >
                        <div className="text-xs text-gray-500 dark:text-white/40 mb-1">{stat.label}</div>
                        <div className="text-xl font-semibold text-gray-900 dark:text-white">{stat.value}</div>
                        <div className={`text-xs ${stat.up ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}>
                          {stat.change}
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Chart placeholder */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 1.2 }}
                    className="rounded-xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] p-4"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm text-gray-600 dark:text-white/60">Revenue Overview</span>
                      <div className="flex gap-2">
                        {["7d", "30d", "90d"].map((period, i) => (
                          <button
                            key={period}
                            className={`px-2 py-1 text-xs rounded ${i === 1 ? "bg-gray-100 dark:bg-white/[0.1] text-gray-900 dark:text-white" : "text-gray-400 dark:text-white/40"}`}
                          >
                            {period}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-end gap-1 h-32">
                      {[40, 65, 45, 80, 55, 90, 75, 85, 60, 95, 70, 88].map((h, i) => (
                        <motion.div
                          key={i}
                          initial={{ height: 0 }}
                          animate={{ height: `${h}%` }}
                          transition={{ duration: 0.6, delay: 1.4 + i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                          className="flex-1 bg-gradient-to-t from-blue-600/60 to-orange-400/60 rounded-sm"
                        />
                      ))}
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Stats Section */}
      <section className="relative py-24 px-6 border-y border-gray-200 dark:border-white/[0.06]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-0 md:divide-x divide-gray-200 dark:divide-white/[0.06]">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="text-center md:px-8"
              >
                <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-white/60 bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-500 dark:text-white/40">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section ref={featuresRef} id="features" className="relative py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 text-gray-900 dark:text-white">
              Everything you need.
              <br />
              <span className="text-gray-400 dark:text-white/40">Nothing you don&apos;t.</span>
            </h2>
            <p className="text-lg text-gray-600 dark:text-white/50 max-w-2xl mx-auto">
              A complete toolkit for building and scaling your online presence.
              Thoughtfully designed, obsessively refined.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="group relative p-6 rounded-2xl border border-gray-200 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.02] hover:bg-gray-100 dark:hover:bg-white/[0.04] transition-all duration-300 overflow-hidden"
              >
                {/* Gradient orb */}
                <div className={`absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br ${feature.gradient} rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-500`} />

                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feature.gradient} mb-4`}>
                  <div className="w-6 h-6 bg-white/20 rounded-lg" />
                </div>

                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600 dark:text-white/50 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Visual Feature Showcase */}
      <section className="relative py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-400 text-sm mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 dark:bg-orange-400" />
                Visual Page Builder
              </div>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 text-gray-900 dark:text-white">
                Build pages
                <br />
                <span className="text-gray-400 dark:text-white/40">visually</span>
              </h2>
              <p className="text-lg text-gray-600 dark:text-white/50 mb-8 leading-relaxed">
                Drag and drop components, customize styles, and publish instantly.
                No code required. Your creativity, your rules.
              </p>
              <ul className="space-y-4">
                {["40+ pre-built components", "Custom CSS & animations", "Mobile-responsive preview", "One-click publish"].map((item, i) => (
                  <motion.li
                    key={item}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.2 + i * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-800 to-orange-500 flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-gray-700 dark:text-white/70">{item}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-600/10 to-orange-500/10 dark:from-blue-600/20 dark:to-orange-500/20 rounded-3xl blur-2xl opacity-40" />
              <div className="relative rounded-2xl border border-gray-200 dark:border-white/[0.1] bg-white dark:bg-gray-800 overflow-hidden p-4">
                {/* Page builder mockup */}
                <div className="flex gap-4">
                  <div className="w-32 space-y-2 shrink-0">
                    <div className="text-xs text-gray-500 dark:text-white/40 mb-3">Components</div>
                    {["Hero", "Features", "Pricing", "CTA", "Footer"].map((comp, i) => (
                      <motion.div
                        key={comp}
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.3, delay: 0.4 + i * 0.05 }}
                        className="p-2 rounded-lg border border-gray-200 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.02] text-xs text-gray-600 dark:text-white/60 cursor-grab hover:border-orange-500/30 hover:bg-orange-500/5 transition-all"
                      >
                        {comp}
                      </motion.div>
                    ))}
                  </div>
                  <div className="flex-1 space-y-3">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: 0.5 }}
                      className="h-24 rounded-xl border-2 border-dashed border-orange-500/30 bg-orange-500/5 flex items-center justify-center"
                    >
                      <div className="text-center">
                        <div className="h-4 w-32 bg-gray-200 dark:bg-white/10 rounded mb-2 mx-auto" />
                        <div className="h-2 w-20 bg-gray-100 dark:bg-white/5 rounded mx-auto" />
                      </div>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: 0.6 }}
                      className="h-16 rounded-xl border border-gray-200 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.02] flex items-center px-4 gap-3"
                    >
                      <div className="w-8 h-8 rounded bg-gray-200 dark:bg-white/10" />
                      <div className="flex-1 space-y-1">
                        <div className="h-2 w-24 bg-gray-200 dark:bg-white/10 rounded" />
                        <div className="h-2 w-16 bg-gray-100 dark:bg-white/5 rounded" />
                      </div>
                    </motion.div>
                    <div className="grid grid-cols-3 gap-2">
                      {[1, 2, 3].map((n) => (
                        <motion.div
                          key={n}
                          initial={{ opacity: 0, y: 10 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.3, delay: 0.7 + n * 0.1 }}
                          className="aspect-square rounded-lg border border-gray-200 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.02]"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            {/* Background glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-orange-500/20 to-blue-500/20 dark:from-blue-600/30 dark:via-orange-500/30 dark:to-blue-500/30 blur-3xl opacity-30" />

            <div className="relative rounded-3xl border border-gray-200 dark:border-white/[0.1] bg-white dark:bg-white/[0.02] backdrop-blur-sm p-12 md:p-16">
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 text-gray-900 dark:text-white">
                Ready to build something
                <br />
                <span className="bg-gradient-to-r from-blue-800 via-blue-600 to-orange-500 dark:from-blue-400 dark:via-blue-300 dark:to-orange-400 bg-clip-text text-transparent">
                  extraordinary?
                </span>
              </h2>
              <p className="text-lg text-gray-600 dark:text-white/50 mb-10 max-w-xl mx-auto">
                Start your free trial today. No credit card required.
                Cancel anytime.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/register"
                  className="px-8 py-4 text-base font-medium bg-blue-800 dark:bg-white text-white dark:text-gray-900 rounded-xl hover:bg-blue-700 dark:hover:bg-white/90 transition-colors"
                >
                  Start free trial
                </Link>
                <Link
                  href="/book"
                  className="px-8 py-4 text-base font-medium rounded-xl border border-gray-200 dark:border-white/[0.1] hover:border-gray-300 dark:hover:border-white/[0.2] bg-gray-50 dark:bg-white/[0.02] hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-all text-gray-700 dark:text-white"
                >
                  Book a demo
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-16 px-6 border-t border-gray-200 dark:border-white/[0.06]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
            <div className="col-span-2">
              <Link href="/" className="flex items-center gap-3 mb-4">
                <div className="relative w-8 h-8">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-800 to-orange-500 rounded-lg opacity-80" />
                  <div className="absolute inset-[2px] bg-white dark:bg-gray-900 rounded-[5px] flex items-center justify-center">
                    <span className="text-xs font-bold bg-gradient-to-r from-blue-800 to-orange-500 dark:from-blue-400 dark:to-orange-400 bg-clip-text text-transparent">C</span>
                  </div>
                </div>
                <span className="text-lg font-semibold text-gray-900 dark:text-white">CNCPT</span>
              </Link>
              <p className="text-sm text-gray-500 dark:text-white/40 max-w-xs">
                The all-in-one platform for building and managing your online business.
              </p>
            </div>

            {[
              { title: "Product", links: [
                { name: "Demo", href: "/demo" },
                { name: "Pricing", href: "/pricing" },
                { name: "Get Started", href: "/register" },
              ]},
              { title: "Company", links: [
                { name: "Book Call", href: "/book" },
                { name: "About", href: "#" },
                { name: "Contact", href: "#" },
              ]},
              { title: "Legal", links: [
                { name: "Privacy", href: "#" },
                { name: "Terms", href: "#" },
              ]},
            ].map((section) => (
              <div key={section.title}>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">{section.title}</h4>
                <ul className="space-y-3">
                  {section.links.map((link) => (
                    <li key={link.name}>
                      <Link
                        href={link.href}
                        className="text-sm text-gray-500 dark:text-white/40 hover:text-gray-900 dark:hover:text-white transition-colors"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-gray-200 dark:border-white/[0.06]">
            <p className="text-sm text-gray-400 dark:text-white/30">
              &copy; {new Date().getFullYear()} CNCPT Web. All rights reserved.
            </p>
            <div className="flex items-center gap-4 mt-4 md:mt-0">
              {["Twitter", "GitHub", "Discord"].map((social) => (
                <Link
                  key={social}
                  href="#"
                  className="text-sm text-gray-400 dark:text-white/30 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  {social}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
