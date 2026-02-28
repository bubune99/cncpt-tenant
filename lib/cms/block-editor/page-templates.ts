import type { Block } from "./types"
import { generateId } from "./tree-utils"

export interface PageTemplate {
  id: string
  name: string
  description: string
  category: "landing" | "section" | "page" | "component" | "header" | "footer"
  blocks: () => Block[]
}

function b(
  tag: Block["tag"],
  className: string,
  opts?: { text?: string; attrs?: Record<string, string>; children?: Block[]; animation?: Block["animation"] }
): Block {
  return {
    id: generateId(),
    tag,
    className,
    textContent: opts?.text,
    attrs: opts?.attrs,
    children: opts?.children,
    animation: opts?.animation,
  }
}

export const PAGE_TEMPLATES: PageTemplate[] = [
  // ====== HEADERS ======
  {
    id: "navbar-simple",
    name: "Simple Navbar",
    description: "Clean navbar with logo and navigation links",
    category: "header",
    blocks: () => [
      b("nav", "w-full py-4 px-6 flex items-center justify-between bg-slate-950 border-b border-white/10", {
        children: [
          b("a", "text-xl font-bold text-white", { text: "Logo", attrs: { href: "#" } }),
          b("div", "flex items-center gap-8", {
            children: [
              b("a", "text-sm text-white/70 hover:text-white transition-colors", { text: "Features", attrs: { href: "#" } }),
              b("a", "text-sm text-white/70 hover:text-white transition-colors", { text: "Pricing", attrs: { href: "#" } }),
              b("a", "text-sm text-white/70 hover:text-white transition-colors", { text: "About", attrs: { href: "#" } }),
              b("button", "rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 transition-colors", { text: "Get Started" }),
            ],
          }),
        ],
      }),
    ],
  },
  {
    id: "navbar-centered",
    name: "Centered Navbar",
    description: "Navbar with centered logo and side navigation",
    category: "header",
    blocks: () => [
      b("nav", "w-full py-4 px-6 flex items-center justify-between bg-white border-b border-gray-200", {
        children: [
          b("div", "flex items-center gap-6", {
            children: [
              b("a", "text-sm text-gray-600 hover:text-gray-900 transition-colors", { text: "Products", attrs: { href: "#" } }),
              b("a", "text-sm text-gray-600 hover:text-gray-900 transition-colors", { text: "Solutions", attrs: { href: "#" } }),
            ],
          }),
          b("a", "text-2xl font-bold text-gray-900", { text: "Brand", attrs: { href: "#" } }),
          b("div", "flex items-center gap-6", {
            children: [
              b("a", "text-sm text-gray-600 hover:text-gray-900 transition-colors", { text: "Pricing", attrs: { href: "#" } }),
              b("a", "text-sm text-gray-600 hover:text-gray-900 transition-colors", { text: "Contact", attrs: { href: "#" } }),
            ],
          }),
        ],
      }),
    ],
  },

  // ====== HERO SECTIONS ======
  {
    id: "hero-centered",
    name: "Centered Hero",
    description: "Full-width hero with centered headline, subtext, and CTA buttons",
    category: "section",
    blocks: () => [
      b("section", "w-full min-h-[80vh] flex flex-col items-center justify-center px-6 py-24 bg-slate-950 text-center", {
        animation: { type: "fadeIn", trigger: "onMount", duration: 0.6 },
        children: [
          b("p", "text-sm font-semibold uppercase tracking-widest text-blue-400 mb-4", { text: "Introducing Our Platform" }),
          b("h1", "text-5xl md:text-7xl font-bold tracking-tight text-white max-w-4xl text-balance", {
            text: "Build beautiful pages at the speed of thought",
            animation: { type: "slideUp", trigger: "onMount", duration: 0.7, delay: 0.1 },
          }),
          b("p", "text-lg md:text-xl text-white/60 max-w-2xl mt-6 leading-relaxed", {
            text: "A visual page builder that lets AI and humans collaborate. Drag blocks, edit Tailwind classes, export production-ready React code.",
          }),
          b("div", "flex items-center gap-4 mt-10", {
            children: [
              b("button", "rounded-lg bg-blue-600 px-8 py-3.5 text-sm font-semibold text-white hover:bg-blue-500 transition-colors shadow-lg shadow-blue-600/25", { text: "Get Started" }),
              b("button", "rounded-lg border border-white/20 bg-white/5 px-8 py-3.5 text-sm font-semibold text-white hover:bg-white/10 transition-colors", { text: "Learn More" }),
            ],
          }),
        ],
      }),
    ],
  },
  {
    id: "features-grid",
    name: "Features Grid",
    description: "3-column feature cards with icons, titles, and descriptions",
    category: "section",
    blocks: () => [
      b("section", "w-full py-24 px-6 bg-slate-900", {
        children: [
          b("div", "max-w-6xl mx-auto", {
            children: [
              b("h2", "text-3xl md:text-4xl font-bold text-white text-center mb-4", { text: "Everything you need" }),
              b("p", "text-lg text-white/60 text-center max-w-2xl mx-auto mb-16", { text: "Powerful features that make building pages a breeze." }),
              b("div", "grid grid-cols-1 md:grid-cols-3 gap-8", {
                children: [
                  featureCard("Lightning Fast", "Build pages in seconds with AI assistance and pre-built blocks.", "1"),
                  featureCard("Fully Customizable", "Every Tailwind class is editable. Full creative control over every detail.", "2"),
                  featureCard("Export Ready", "Export clean React code with Tailwind CSS, ready for production.", "3"),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  },
  {
    id: "pricing-cards",
    name: "Pricing Section",
    description: "3-tier pricing cards with feature lists and CTAs",
    category: "section",
    blocks: () => [
      b("section", "w-full py-24 px-6 bg-slate-950", {
        children: [
          b("div", "max-w-6xl mx-auto", {
            children: [
              b("h2", "text-3xl md:text-4xl font-bold text-white text-center mb-4", { text: "Simple pricing" }),
              b("p", "text-lg text-white/60 text-center max-w-2xl mx-auto mb-16", { text: "Choose the plan that works for you." }),
              b("div", "grid grid-cols-1 md:grid-cols-3 gap-8", {
                children: [
                  pricingCard("Starter", "$0", "Free forever", ["5 pages", "Basic blocks", "JSON export"], false),
                  pricingCard("Pro", "$19", "per month", ["Unlimited pages", "AI assistant", "React export", "Animations"], true),
                  pricingCard("Team", "$49", "per month", ["Everything in Pro", "Collaboration", "Custom domains", "Priority support"], false),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  },
  {
    id: "testimonials",
    name: "Testimonials",
    description: "Customer testimonials in a grid layout with avatars",
    category: "section",
    blocks: () => [
      b("section", "w-full py-24 px-6 bg-slate-900", {
        children: [
          b("div", "max-w-6xl mx-auto", {
            children: [
              b("h2", "text-3xl font-bold text-white text-center mb-16", { text: "Loved by builders" }),
              b("div", "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", {
                children: [
                  testimonialCard("Sarah Chen", "Designer", "This tool has completely changed how I prototype. I can go from idea to production in hours, not days."),
                  testimonialCard("Marcus Rodriguez", "Developer", "The AI understands exactly what I want. The exported code is clean, readable, and production-ready."),
                  testimonialCard("Emily Park", "Founder", "We replaced three tools with this one page builder. The ROI has been incredible for our small team."),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  },
  {
    id: "contact-form",
    name: "Contact Form",
    description: "Clean contact form with inputs and a submit button",
    category: "section",
    blocks: () => [
      b("section", "w-full py-24 px-6 bg-slate-950", {
        children: [
          b("div", "max-w-xl mx-auto", {
            children: [
              b("h2", "text-3xl font-bold text-white text-center mb-2", { text: "Get in touch" }),
              b("p", "text-white/60 text-center mb-10", { text: "We would love to hear from you. Send us a message." }),
              b("form", "flex flex-col gap-4", {
                children: [
                  b("div", "grid grid-cols-1 md:grid-cols-2 gap-4", {
                    children: [
                      b("input", "w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-blue-500 focus:outline-none transition-colors", { attrs: { type: "text", placeholder: "First name" } }),
                      b("input", "w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-blue-500 focus:outline-none transition-colors", { attrs: { type: "text", placeholder: "Last name" } }),
                    ],
                  }),
                  b("input", "w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-blue-500 focus:outline-none transition-colors", { attrs: { type: "email", placeholder: "Email address" } }),
                  b("textarea", "w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-blue-500 focus:outline-none transition-colors min-h-[120px] resize-none", { attrs: { placeholder: "Your message..." } }),
                  b("button", "w-full rounded-lg bg-blue-600 py-3.5 text-sm font-semibold text-white hover:bg-blue-500 transition-colors shadow-lg shadow-blue-600/25", { text: "Send Message" }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  },
  {
    id: "footer",
    name: "Footer",
    description: "Multi-column footer with links, logo, and copyright",
    category: "section",
    blocks: () => [
      b("footer", "w-full py-16 px-6 bg-slate-950 border-t border-white/10", {
        children: [
          b("div", "max-w-6xl mx-auto", {
            children: [
              b("div", "grid grid-cols-2 md:grid-cols-4 gap-8 mb-12", {
                children: [
                  footerColumn("Product", ["Features", "Pricing", "Changelog", "Docs"]),
                  footerColumn("Company", ["About", "Blog", "Careers", "Contact"]),
                  footerColumn("Resources", ["Community", "Help Center", "API Docs", "Status"]),
                  footerColumn("Legal", ["Privacy", "Terms", "Security", "Cookies"]),
                ],
              }),
              b("div", "flex flex-col md:flex-row items-center justify-between pt-8 border-t border-white/10", {
                children: [
                  b("p", "text-sm text-white/40", { text: "2026 Your Company. All rights reserved." }),
                  b("div", "flex items-center gap-6 mt-4 md:mt-0", {
                    children: [
                      b("a", "text-sm text-white/40 hover:text-white transition-colors", { text: "Twitter", attrs: { href: "#" } }),
                      b("a", "text-sm text-white/40 hover:text-white transition-colors", { text: "GitHub", attrs: { href: "#" } }),
                      b("a", "text-sm text-white/40 hover:text-white transition-colors", { text: "Discord", attrs: { href: "#" } }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  },
]

// -- Helper builders --

function featureCard(title: string, desc: string, num: string): Block {
  return b("div", "rounded-xl border border-white/10 bg-white/5 p-6 hover:bg-white/[0.08] transition-colors", {
    animation: { type: "slideUp", trigger: "inView", duration: 0.5, delay: parseFloat(num) * 0.1 },
    children: [
      b("div", "flex items-center justify-center w-10 h-10 rounded-lg bg-blue-600/20 text-blue-400 text-sm font-bold mb-4", { text: num }),
      b("h3", "text-lg font-semibold text-white mb-2", { text: title }),
      b("p", "text-sm text-white/60 leading-relaxed", { text: desc }),
    ],
  })
}

function pricingCard(name: string, price: string, period: string, features: string[], highlighted: boolean): Block {
  const border = highlighted ? "border-blue-500" : "border-white/10"
  const bg = highlighted ? "bg-blue-600/10" : "bg-white/5"
  const ring = highlighted ? "ring-1 ring-blue-500/50" : ""
  return b("div", `rounded-xl border ${border} ${bg} ${ring} p-8 flex flex-col`, {
    children: [
      b("h3", "text-lg font-semibold text-white mb-1", { text: name }),
      b("div", "flex items-baseline gap-1 mb-1", {
        children: [
          b("span", "text-4xl font-bold text-white", { text: price }),
        ],
      }),
      b("p", "text-sm text-white/40 mb-6", { text: period }),
      b("ul", "flex flex-col gap-3 mb-8 flex-1", {
        children: features.map((f) =>
          b("li", "flex items-center gap-2 text-sm text-white/70", { text: `- ${f}` })
        ),
      }),
      b("button", `w-full rounded-lg py-3 text-sm font-semibold transition-colors ${highlighted ? "bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-600/25" : "border border-white/20 bg-white/5 text-white hover:bg-white/10"}`, { text: "Get started" }),
    ],
  })
}

function testimonialCard(name: string, role: string, quote: string): Block {
  return b("div", "rounded-xl border border-white/10 bg-white/5 p-6", {
    animation: { type: "fadeIn", trigger: "inView", duration: 0.5 },
    children: [
      b("p", "text-sm text-white/70 leading-relaxed mb-6", { text: `"${quote}"` }),
      b("div", "flex items-center gap-3", {
        children: [
          b("div", "w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600", {}),
          b("div", "flex flex-col", {
            children: [
              b("span", "text-sm font-semibold text-white", { text: name }),
              b("span", "text-xs text-white/40", { text: role }),
            ],
          }),
        ],
      }),
    ],
  })
}

function footerColumn(title: string, links: string[]): Block {
  return b("div", "flex flex-col gap-3", {
    children: [
      b("h4", "text-sm font-semibold text-white mb-1", { text: title }),
      ...links.map((link) =>
        b("a", "text-sm text-white/40 hover:text-white transition-colors", { text: link, attrs: { href: "#" } })
      ),
    ],
  })
}

// ====== FULL PAGE TEMPLATES ======
// These are added to PAGE_TEMPLATES at the end

const FULL_PAGE_TEMPLATES: PageTemplate[] = [
  {
    id: "landing-complete",
    name: "Complete Landing Page",
    description: "Full landing page with hero, features, pricing, testimonials, and footer",
    category: "page",
    blocks: () => [
      // Navbar
      ...PAGE_TEMPLATES.find(t => t.id === "navbar-simple")!.blocks(),
      // Hero
      ...PAGE_TEMPLATES.find(t => t.id === "hero-centered")!.blocks(),
      // Features
      ...PAGE_TEMPLATES.find(t => t.id === "features-grid")!.blocks(),
      // Pricing
      ...PAGE_TEMPLATES.find(t => t.id === "pricing-cards")!.blocks(),
      // Testimonials
      ...PAGE_TEMPLATES.find(t => t.id === "testimonials")!.blocks(),
      // Footer
      ...PAGE_TEMPLATES.find(t => t.id === "footer")!.blocks(),
    ],
  },
  {
    id: "saas-landing",
    name: "SaaS Landing Page",
    description: "Modern SaaS landing with hero, features, and CTA sections",
    category: "page",
    blocks: () => [
      // Navbar
      ...PAGE_TEMPLATES.find(t => t.id === "navbar-simple")!.blocks(),
      // Hero
      ...PAGE_TEMPLATES.find(t => t.id === "hero-centered")!.blocks(),
      // Features
      ...PAGE_TEMPLATES.find(t => t.id === "features-grid")!.blocks(),
      // CTA Section
      b("section", "w-full py-24 px-6 bg-blue-600", {
        children: [
          b("div", "max-w-3xl mx-auto text-center", {
            children: [
              b("h2", "text-3xl md:text-4xl font-bold text-white mb-4", { text: "Ready to get started?" }),
              b("p", "text-lg text-white/80 mb-8", { text: "Join thousands of teams already using our platform." }),
              b("button", "rounded-lg bg-white px-8 py-4 text-sm font-semibold text-blue-600 hover:bg-gray-100 transition-colors shadow-lg", { text: "Start Free Trial" }),
            ],
          }),
        ],
      }),
      // Footer
      ...PAGE_TEMPLATES.find(t => t.id === "footer")!.blocks(),
    ],
  },
]

// Add full page templates to the main array
PAGE_TEMPLATES.push(...FULL_PAGE_TEMPLATES)
