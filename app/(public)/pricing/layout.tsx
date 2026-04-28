import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Simple, transparent pricing for CNCPT Web. Start free, scale as you grow — choose the plan that fits your team and your traffic.",
  alternates: {
    canonical: "https://cncptweb.com/pricing",
  },
  openGraph: {
    title: "Pricing | CNCPT Web",
    description:
      "Simple, transparent pricing for CNCPT Web. Start free, scale as you grow.",
    url: "https://cncptweb.com/pricing",
    type: "website",
  },
}

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
