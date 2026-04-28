"use client"

import Link from "next/link"
import { HeroGeometric } from "@/components/ui/shape-landing-hero"
import { motion } from "framer-motion"
import { Play } from "lucide-react"

export function HeroSection() {
  return (
    <section className="relative">
      <HeroGeometric
        badge="Now with AI-powered content generation"
        title1="The CMS that"
        title2="grows with you"
      >
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.2 }}
          className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          Build websites, manage products, publish content, and run marketing campaigns.
          One platform, unlimited possibilities.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.4 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link
            href="/register"
            className="group relative px-10 py-4 text-base font-semibold rounded-xl overflow-hidden text-white shadow-lg shadow-[#1e3a5f]/30 hover:shadow-xl hover:shadow-[#c2410c]/30 transition-shadow"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#1e3a5f] to-[#c2410c] transition-transform group-hover:scale-105" />
            <span className="relative">
              Start free trial
            </span>
          </Link>
          <Link
            href="/demo"
            className="group px-8 py-4 text-base font-medium rounded-xl border border-border hover:border-border/80 bg-muted/50 hover:bg-muted transition-all flex items-center justify-center gap-2"
          >
            <Play className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
            <span className="text-foreground/80 group-hover:text-foreground transition-colors">Explore demo</span>
          </Link>
        </motion.div>
      </HeroGeometric>
    </section>
  )
}
