/**
 * The plans CNCPT sells: one list for the public Pricing page and the dashboard's Billing page.
 * Moved verbatim from app/(public)/pricing/page.tsx on 2026-11-22; prices agree with
 * scripts/tiers-match-pricing.mjs (asserted in plans.assert.ts).
 */

export interface PlanFeature { text: string; tooltip?: string }
export interface Plan {
  name: string
  slug: string
  description: string
  price: number
  yearlyPrice: number
  popular: boolean
  features: PlanFeature[]
  cta: string
  href: string
}

export const PLANS: readonly Plan[] = [
  {
    name: "Starter",
    slug: "starter",
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
    slug: "growth",
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
    slug: "pro",
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
    slug: "business",
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

/** The plan whose slug or display name is `name` (any case); undefined for a plan no longer sold, such as Free. */
export function planFor(name: string | null | undefined): Plan | undefined {
  const n = (name ?? "").trim().toLowerCase()
  return n ? PLANS.find((p) => p.slug === n || p.name.toLowerCase() === n) : undefined
}

/** The monthly figure a plan shows: billed yearly, its yearly price over 12, rounded to the dollar. */
export function monthlyShown(plan: Pick<Plan, "price" | "yearlyPrice">, annual: boolean): number {
  return annual ? Math.round(plan.yearlyPrice / 12) : plan.price
}

/** How much of a limit is used, 0 to 100; 0 when there is no limit to measure against (0 or unlimited, -1). */
export function usagePercent(used: number, limit: number): number {
  return limit > 0 ? Math.min(100, (used / limit) * 100) : 0
}
