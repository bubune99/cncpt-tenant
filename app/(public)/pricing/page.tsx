"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { useState } from "react"
import { Check, Sparkles, Zap, HelpCircle } from "lucide-react"

const plans = [
  {
    name: "Starter",
    description: "Perfect for small sites and blogs",
    price: 25,
    yearlyPrice: 250,
    popular: false,
    features: [
      { text: "2 team seats", tooltip: "Additional seats $15/mo each" },
      { text: "Custom domain included" },
      { text: "25GB bandwidth/mo", tooltip: "Overage: $15 per 25GB" },
      { text: "1GB site storage", tooltip: "Overage: $3/GB/mo" },
      { text: "3GB media storage", tooltip: "Overage: $1/GB/mo" },
      { text: "300 AI credits/mo", tooltip: "Purchase more anytime" },
      { text: "Email support" },
      { text: "Basic analytics" },
    ],
    cta: "Start free trial",
    href: "/register?plan=starter",
  },
  {
    name: "Growth",
    description: "For growing sites and small teams",
    price: 49,
    yearlyPrice: 490,
    popular: true,
    features: [
      { text: "3 team seats", tooltip: "Additional seats $15/mo each" },
      { text: "Custom domain included" },
      { text: "100GB bandwidth/mo", tooltip: "Overage: $15 per 25GB" },
      { text: "5GB site storage", tooltip: "Overage: $3/GB/mo" },
      { text: "15GB media storage", tooltip: "Overage: $1/GB/mo" },
      { text: "1,500 AI credits/mo", tooltip: "Purchase more anytime" },
      { text: "Email support" },
      { text: "Standard analytics" },
    ],
    cta: "Start free trial",
    href: "/register?plan=growth",
  },
  {
    name: "Pro",
    description: "For professionals and agencies",
    price: 99,
    yearlyPrice: 990,
    popular: false,
    features: [
      { text: "6 team seats", tooltip: "Additional seats $15/mo each" },
      { text: "Custom domain included" },
      { text: "300GB bandwidth/mo", tooltip: "Overage: $15 per 25GB" },
      { text: "30GB site storage", tooltip: "Overage: $3/GB/mo" },
      { text: "75GB media storage", tooltip: "Overage: $1/GB/mo" },
      { text: "7,500 AI credits/mo", tooltip: "Purchase more anytime" },
      { text: "Priority support" },
      { text: "Advanced analytics" },
    ],
    cta: "Start free trial",
    href: "/register?plan=pro",
  },
  {
    name: "Business",
    description: "For high-traffic sites and enterprises",
    price: 349,
    yearlyPrice: 3490,
    popular: false,
    features: [
      { text: "25 team seats", tooltip: "Additional seats $12/mo each" },
      { text: "Custom domain included" },
      { text: "1TB bandwidth/mo", tooltip: "Overage: $15 per 25GB" },
      { text: "300GB site storage", tooltip: "Overage: $3/GB/mo" },
      { text: "750GB media storage", tooltip: "Overage: $1/GB/mo" },
      { text: "75,000 AI credits/mo", tooltip: "Purchase more anytime" },
      { text: "Dedicated support" },
      { text: "Advanced analytics" },
      { text: "Priority feature requests" },
    ],
    cta: "Contact sales",
    href: "/book",
  },
]

const addOns = [
  { name: "Extra Team Seat", price: "$15/mo", note: "$12/mo on Business" },
  { name: "Extra Bandwidth", price: "$15 per 25GB", note: "One-time purchase" },
  { name: "Extra Site Storage", price: "$3/GB/mo", note: "Recurring" },
  { name: "Extra Media Storage", price: "$1/GB/mo", note: "Recurring" },
]

const aiPacks = [
  { name: "Starter Pack", credits: "500", price: "$5" },
  { name: "Growth Pack", credits: "2,200", price: "$15", popular: true },
  { name: "Pro Pack", credits: "5,750", price: "$35" },
  { name: "Enterprise Pack", credits: "18,000", price: "$99" },
]

const faqs = [
  {
    q: "What counts as bandwidth?",
    a: "Bandwidth measures data transferred when visitors view your site. Images, videos, and page content all count. Most small sites use 5-15GB/month."
  },
  {
    q: "What are AI credits used for?",
    a: "AI credits power content generation, image optimization, SEO suggestions, and the AI assistant. One credit roughly equals one AI request."
  },
  {
    q: "Can I change plans anytime?",
    a: "Yes! Upgrade instantly or downgrade at the end of your billing cycle. We'll prorate any changes."
  },
  {
    q: "What happens if I exceed my limits?",
    a: "We'll notify you before you hit limits. You can purchase add-ons or upgrade your plan. We never shut down your site without warning."
  },
  {
    q: "Do unused AI credits roll over?",
    a: "Yes, up to 2x your monthly allocation. Starter can bank up to 600 credits, Growth up to 3,000, and so on."
  },
  {
    q: "Is there a free trial?",
    a: "Yes! All plans include a 7-14 day free trial. No credit card required to start."
  },
]

export default function PricingPage() {
  const [annual, setAnnual] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white">
      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-violet-600/20 rounded-full blur-[150px] opacity-50" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-cyan-600/20 rounded-full blur-[150px] opacity-40" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDMpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-60" />
      </div>

      {/* Navigation */}
      <header className="relative z-50 py-6 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-9 h-9">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500 to-cyan-500 rounded-lg opacity-80 group-hover:opacity-100 transition-opacity" />
              <div className="absolute inset-[2px] bg-[#0a0a0b] rounded-[6px] flex items-center justify-center">
                <span className="text-sm font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">C</span>
              </div>
            </div>
            <span className="text-lg font-semibold tracking-tight">CNCPT</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link href="/demo" className="text-sm text-white/60 hover:text-white transition-colors">Demo</Link>
            <Link href="/book" className="text-sm text-white/60 hover:text-white transition-colors">Book Call</Link>
            <Link href="/register" className="px-5 py-2.5 text-sm font-medium bg-white text-black rounded-xl hover:bg-white/90 transition-colors">
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative pt-16 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Simple, transparent
              <br />
              <span className="bg-gradient-to-r from-violet-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                per-site pricing
              </span>
            </h1>
            <p className="text-lg text-white/50 max-w-xl mx-auto mb-10">
              Everything you need to build and scale. No hidden fees.
              Pay only for what you use.
            </p>
          </motion.div>

          {/* Billing Toggle */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="inline-flex items-center gap-4 p-1.5 rounded-xl border border-white/[0.1] bg-white/[0.02]"
          >
            <button
              onClick={() => setAnnual(false)}
              className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                !annual ? "bg-white text-black" : "text-white/60 hover:text-white"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                annual ? "bg-white text-black" : "text-white/60 hover:text-white"
              }`}
            >
              Annual
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                Save 17%
              </span>
            </button>
          </motion.div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="relative pb-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 + i * 0.1 }}
                className={`relative rounded-2xl border p-6 ${
                  plan.popular
                    ? "border-violet-500/50 bg-violet-500/5"
                    : "border-white/[0.08] bg-white/[0.02]"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-violet-600 to-cyan-600 text-xs font-medium">
                    Most Popular
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-xl font-semibold mb-1">{plan.name}</h3>
                  <p className="text-sm text-white/40">{plan.description}</p>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">
                      ${annual ? Math.round(plan.yearlyPrice / 12) : plan.price}
                    </span>
                    <span className="text-white/40">/mo</span>
                  </div>
                  {annual && (
                    <p className="text-sm text-white/40 mt-1">
                      ${plan.yearlyPrice}/year billed annually
                    </p>
                  )}
                </div>

                <Link
                  href={plan.href}
                  className={`block w-full py-3 rounded-xl text-center text-sm font-medium transition-all mb-6 ${
                    plan.popular
                      ? "bg-gradient-to-r from-violet-600 to-cyan-600 text-white hover:opacity-90"
                      : "border border-white/[0.1] text-white hover:bg-white/[0.05]"
                  }`}
                >
                  {plan.cta}
                </Link>

                <ul className="space-y-3">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-start gap-3 text-sm">
                      <Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                      <span className="text-white/70">{feature.text}</span>
                      {feature.tooltip && (
                        <span className="group relative">
                          <HelpCircle className="w-3.5 h-3.5 text-white/30 cursor-help" />
                          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded bg-white text-black text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            {feature.tooltip}
                          </span>
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Add-ons */}
      <section className="relative py-20 px-6 border-t border-white/[0.06]">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">Add-ons & Overages</h2>
            <p className="text-white/50">Need more? Scale up with flexible add-ons.</p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {addOns.map((addon, i) => (
              <motion.div
                key={addon.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-5 rounded-xl border border-white/[0.08] bg-white/[0.02]"
              >
                <h3 className="font-medium mb-1">{addon.name}</h3>
                <p className="text-2xl font-bold text-white mb-1">{addon.price}</p>
                <p className="text-xs text-white/40">{addon.note}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Credit Packs */}
      <section className="relative py-20 px-6 border-t border-white/[0.06]">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-400 text-sm mb-4">
              <Sparkles className="w-4 h-4" />
              AI Credits
            </div>
            <h2 className="text-3xl font-bold mb-4">AI Credit Packs</h2>
            <p className="text-white/50">Need more AI power? Purchase credits anytime.</p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {aiPacks.map((pack, i) => (
              <motion.div
                key={pack.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`p-5 rounded-xl border ${
                  pack.popular
                    ? "border-violet-500/50 bg-violet-500/5"
                    : "border-white/[0.08] bg-white/[0.02]"
                }`}
              >
                {pack.popular && (
                  <span className="text-xs text-violet-400 font-medium">Best Value</span>
                )}
                <h3 className="font-medium mb-1">{pack.name}</h3>
                <p className="text-3xl font-bold text-white mb-1">{pack.credits}</p>
                <p className="text-sm text-white/40 mb-3">credits</p>
                <p className="text-lg font-semibold text-emerald-400">{pack.price}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="relative py-20 px-6 border-t border-white/[0.06]">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
          </motion.div>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="border border-white/[0.08] rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-white/[0.02] transition-colors"
                >
                  <span className="font-medium">{faq.q}</span>
                  <span className={`text-white/40 transition-transform ${openFaq === i ? "rotate-45" : ""}`}>
                    +
                  </span>
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-4 text-sm text-white/60 leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative rounded-2xl border border-white/[0.1] bg-white/[0.02] p-12 text-center overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-violet-600/20 via-cyan-600/20 to-emerald-600/20 blur-3xl opacity-30" />
            <div className="relative">
              <Zap className="w-12 h-12 text-violet-400 mx-auto mb-6" />
              <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
              <p className="text-white/50 mb-8 max-w-md mx-auto">
                Start your free trial today. No credit card required.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/register"
                  className="px-8 py-4 bg-white text-black rounded-xl font-medium hover:bg-white/90 transition-colors"
                >
                  Start free trial
                </Link>
                <Link
                  href="/book"
                  className="px-8 py-4 border border-white/[0.1] rounded-xl font-medium hover:bg-white/[0.05] transition-colors"
                >
                  Talk to sales
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-12 px-6 border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="relative w-7 h-7">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500 to-cyan-500 rounded-md opacity-80" />
              <div className="absolute inset-[2px] bg-[#0a0a0b] rounded-[4px] flex items-center justify-center">
                <span className="text-xs font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">C</span>
              </div>
            </div>
            <span className="font-semibold">CNCPT</span>
          </Link>
          <p className="text-sm text-white/30">
            &copy; {new Date().getFullYear()} CNCPT Web. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
