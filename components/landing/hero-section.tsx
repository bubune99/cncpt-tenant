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
            className="group relative px-8 py-4 text-base font-medium rounded-xl overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#1e3a5f] to-[#c2410c] transition-transform group-hover:scale-105" />
            <div className="absolute inset-[1px] bg-background rounded-[10px] transition-opacity group-hover:opacity-0" />
            <span className="relative bg-gradient-to-r from-[#1e3a5f] to-[#c2410c] dark:from-blue-400 dark:to-orange-400 bg-clip-text text-transparent group-hover:text-white transition-colors">
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
