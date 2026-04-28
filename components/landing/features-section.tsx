import { BentoGrid, BentoCard } from "@/components/ui/bento-grid"
import {
  LayoutDashboard,
  ShoppingBag,
  FileText,
  Mail,
  Sparkles,
  BarChart3,
} from "lucide-react"

const features = [
  {
    Icon: LayoutDashboard,
    name: "Visual Page Builder",
    description: "Drag-and-drop editor with 40+ components. Build stunning pages without writing code.",
    href: "/demo",
    cta: "Try the editor",
    tourId: "home-feature-page-builder",
    ctaTourId: "home-feature-page-builder-cta",
    className: "lg:row-start-1 lg:row-end-3 lg:col-start-1 lg:col-end-2",
    background: (
      <div className="absolute inset-0 bg-gradient-to-br from-[#1e3a5f]/10 to-transparent" />
    ),
  },
  {
    Icon: ShoppingBag,
    name: "Product Management",
    description: "Inventory tracking, variants, bulk operations. Everything you need to run your store.",
    href: "/register",
    cta: "Get started",
    tourId: "home-feature-products",
    ctaTourId: "home-feature-products-cta",
    className: "lg:col-start-2 lg:col-end-3",
    background: (
      <div className="absolute inset-0 bg-gradient-to-br from-[#c2410c]/10 to-transparent" />
    ),
  },
  {
    Icon: FileText,
    name: "Content & Blog",
    description: "Rich editor with SEO tools, scheduling, categories. Publish content that ranks.",
    href: "/register",
    cta: "Get started",
    tourId: "home-feature-blog",
    ctaTourId: "home-feature-blog-cta",
    className: "lg:col-start-3 lg:col-end-4",
    background: (
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent" />
    ),
  },
  {
    Icon: Mail,
    name: "Email Marketing",
    description: "Beautiful campaigns, automation, analytics. Turn visitors into loyal customers.",
    href: "/register",
    cta: "Get started",
    tourId: "home-feature-email",
    ctaTourId: "home-feature-email-cta",
    className: "lg:col-start-2 lg:col-end-3",
    background: (
      <div className="absolute inset-0 bg-gradient-to-br from-[#1e3a5f]/10 to-transparent" />
    ),
  },
  {
    Icon: Sparkles,
    name: "AI Assistant",
    description: "Generate copy, optimize content, answer questions. Your intelligent co-pilot.",
    href: "/register",
    cta: "Get started",
    tourId: "home-feature-ai",
    ctaTourId: "home-feature-ai-cta",
    className: "lg:col-start-3 lg:col-end-4",
    background: (
      <div className="absolute inset-0 bg-gradient-to-br from-[#c2410c]/10 to-transparent" />
    ),
  },
  {
    Icon: BarChart3,
    name: "Analytics",
    description: "Real-time insights, conversion tracking, customer journeys. Make data-driven decisions.",
    href: "/register",
    cta: "Get started",
    tourId: "home-feature-analytics",
    ctaTourId: "home-feature-analytics-cta",
    className: "lg:row-start-3 lg:col-start-1 lg:col-end-4",
    background: (
      <div className="absolute inset-0 bg-gradient-to-r from-[#1e3a5f]/5 via-transparent to-[#c2410c]/5" />
    ),
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="py-32 px-6" data-tour-id="home-features">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 text-foreground">
            Everything you need.
            <br />
            <span className="text-muted-foreground">Nothing you don&apos;t.</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A complete toolkit for building and scaling your online presence.
            Thoughtfully designed, obsessively refined.
          </p>
        </div>

        <BentoGrid className="lg:grid-rows-3 auto-rows-[18rem]">
          {features.map((feature) => (
            <BentoCard key={feature.name} {...feature} />
          ))}
        </BentoGrid>
      </div>
    </section>
  )
}
