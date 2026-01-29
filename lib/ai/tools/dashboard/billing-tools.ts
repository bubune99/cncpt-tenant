/**
 * Dashboard AI Tools - Billing & Subscription
 *
 * Tools for checking subscription status, usage, and plan information.
 */

import { tool } from "ai"
import { z } from "zod"
import { sql } from "@/lib/neon"

// Plan definitions
const PLANS = {
  free: {
    name: "Free",
    price: 0,
    limits: {
      subdomains: 1,
      customDomains: 0,
      teamMembers: 0,
      storage: "100MB",
    },
    features: ["1 subdomain", "Basic analytics", "Community support"],
  },
  pro: {
    name: "Pro",
    price: 19,
    limits: {
      subdomains: 5,
      customDomains: 3,
      teamMembers: 5,
      storage: "5GB",
    },
    features: [
      "5 subdomains",
      "3 custom domains",
      "Team collaboration (5 members)",
      "Priority support",
      "Advanced analytics",
    ],
  },
  enterprise: {
    name: "Enterprise",
    price: 99,
    limits: {
      subdomains: -1,
      customDomains: -1,
      teamMembers: -1,
      storage: "50GB",
    },
    features: [
      "Unlimited subdomains",
      "Unlimited custom domains",
      "Unlimited team members",
      "Dedicated support",
      "Custom integrations",
      "SLA guarantee",
    ],
  },
}

/**
 * Create billing tools with user context
 */
export function createBillingTools(userId: string) {
  /**
   * Get current billing status and subscription info
   */
  const getBillingStatus = tool({
    description:
      "Get the user's current subscription plan, usage statistics, and billing information.",
    parameters: z.object({}),
    execute: async () => {
      if (!userId) {
        return { error: "User not authenticated" }
      }

      try {
        const subdomainCount = await sql`
          SELECT COUNT(*) as count FROM subdomains WHERE user_id = ${userId}
        `

        const domainCount = await sql`
          SELECT COUNT(*) as count FROM custom_domains cd
          JOIN subdomains s ON cd.subdomain = s.subdomain
          WHERE s.user_id = ${userId}
        `

        const teamCount = await sql`
          SELECT COUNT(DISTINCT t.id) as count FROM teams t
          WHERE t.owner_id = ${userId} AND t.deleted_at IS NULL
        `

        const subs = parseInt(subdomainCount[0]?.count || "0")
        const domains = parseInt(domainCount[0]?.count || "0")
        const teams = parseInt(teamCount[0]?.count || "0")

        let currentPlan = "free"
        if (subs > 5 || domains > 3 || teams > 1) {
          currentPlan = "enterprise"
        } else if (subs > 1 || domains > 0 || teams > 0) {
          currentPlan = "pro"
        }

        const plan = PLANS[currentPlan as keyof typeof PLANS]
        const limits = plan.limits

        return {
          plan: {
            id: currentPlan,
            name: plan.name,
            price: plan.price,
            billingPeriod: "monthly",
          },
          usage: {
            subdomains: {
              used: subs,
              limit: limits.subdomains === -1 ? "unlimited" : limits.subdomains,
              percentage:
                limits.subdomains === -1
                  ? 0
                  : Math.round((subs / limits.subdomains) * 100),
            },
            customDomains: {
              used: domains,
              limit: limits.customDomains === -1 ? "unlimited" : limits.customDomains,
              percentage:
                limits.customDomains === -1
                  ? 0
                  : limits.customDomains === 0
                    ? 100
                    : Math.round((domains / limits.customDomains) * 100),
            },
            teams: {
              used: teams,
              limit: limits.teamMembers === -1 ? "unlimited" : 1,
            },
          },
          features: plan.features,
          recommendations:
            currentPlan === "free" && (subs > 0 || domains > 0)
              ? ["Consider upgrading to Pro for more subdomains and custom domains"]
              : [],
        }
      } catch (error) {
        console.error("[billing-tools] getBillingStatus error:", error)
        return { error: "Failed to fetch billing status" }
      }
    },
  })

  /**
   * Get detailed usage statistics
   */
  const getUsageStats = tool({
    description: "Get detailed resource usage statistics.",
    parameters: z.object({}),
    execute: async () => {
      if (!userId) {
        return { error: "User not authenticated" }
      }

      try {
        const subdomains = await sql`
          SELECT subdomain, created_at FROM subdomains
          WHERE user_id = ${userId}
          ORDER BY created_at DESC
        `

        const domains = await sql`
          SELECT cd.domain, cd.subdomain, cd.is_verified, cd.created_at
          FROM custom_domains cd
          JOIN subdomains s ON cd.subdomain = s.subdomain
          WHERE s.user_id = ${userId}
          ORDER BY cd.created_at DESC
        `

        const teamsOwned = await sql`
          SELECT t.name, t.created_at,
            (SELECT COUNT(*) FROM team_members WHERE team_id = t.id) as member_count
          FROM teams t
          WHERE t.owner_id = ${userId} AND t.deleted_at IS NULL
        `

        const teamMemberships = await sql`
          SELECT t.name, tm.role, tm.created_at
          FROM team_members tm
          JOIN teams t ON tm.team_id = t.id
          WHERE tm.user_id = ${userId} AND t.owner_id != ${userId} AND t.deleted_at IS NULL
        `

        const totalMembers = teamsOwned.reduce(
          (sum, t) => sum + parseInt(t.member_count || "0"),
          0
        )

        return {
          subdomains: {
            count: subdomains.length,
            list: subdomains.map((s) => ({
              name: s.subdomain,
              createdAt: s.created_at,
            })),
          },
          customDomains: {
            total: domains.length,
            verified: domains.filter((d) => d.is_verified).length,
            pending: domains.filter((d) => !d.is_verified).length,
            list: domains.map((d) => ({
              domain: d.domain,
              subdomain: d.subdomain,
              isVerified: d.is_verified,
            })),
          },
          teams: {
            owned: teamsOwned.length,
            memberOf: teamMemberships.length,
            totalMembersManaged: totalMembers,
            ownedList: teamsOwned.map((t) => ({
              name: t.name,
              memberCount: parseInt(t.member_count || "0"),
            })),
            membershipList: teamMemberships.map((t) => ({
              name: t.name,
              role: t.role,
            })),
          },
        }
      } catch (error) {
        console.error("[billing-tools] getUsageStats error:", error)
        return { error: "Failed to fetch usage stats" }
      }
    },
  })

  /**
   * Compare available plans
   */
  const comparePlans = tool({
    description: "Get a comparison of all available subscription plans with features and pricing.",
    parameters: z.object({}),
    execute: async () => {
      return {
        plans: Object.entries(PLANS).map(([id, plan]) => ({
          id,
          name: plan.name,
          price: plan.price,
          priceLabel: plan.price === 0 ? "Free" : `$${plan.price}/month`,
          limits: {
            subdomains:
              plan.limits.subdomains === -1 ? "Unlimited" : plan.limits.subdomains,
            customDomains:
              plan.limits.customDomains === -1
                ? "Unlimited"
                : plan.limits.customDomains,
            teamMembers:
              plan.limits.teamMembers === -1 ? "Unlimited" : plan.limits.teamMembers,
            storage: plan.limits.storage,
          },
          features: plan.features,
        })),
        recommendation:
          "Most users find the Pro plan offers the best value with support for teams and custom domains.",
      }
    },
  })

  /**
   * Explain billing concepts
   */
  const explainBilling = tool({
    description: "Explain billing concepts, upgrade process, or answer billing-related questions.",
    parameters: z.object({
      topic: z
        .string()
        .describe(
          "The billing topic to explain (e.g., 'upgrade', 'limits', 'payment', 'cancel')"
        ),
    }),
    execute: async ({ topic }: { topic: string }) => {
      const explanations: Record<
        string,
        { title: string; explanation: string; steps?: string[] }
      > = {
        upgrade: {
          title: "How to Upgrade Your Plan",
          explanation:
            "Upgrading your plan gives you access to more subdomains, custom domains, and team features.",
          steps: [
            "Go to Dashboard > Billing",
            "Click on the plan you want to upgrade to",
            "Enter your payment information",
            "Your new features will be available immediately",
          ],
        },
        downgrade: {
          title: "How to Downgrade Your Plan",
          explanation:
            "You can downgrade at any time. Your current features will remain until the end of your billing period.",
          steps: [
            "Go to Dashboard > Billing",
            "Click 'Manage Subscription'",
            "Select a lower plan",
            "Changes take effect at the end of your current billing period",
          ],
        },
        limits: {
          title: "Understanding Plan Limits",
          explanation:
            "Each plan has limits on subdomains, custom domains, and team members. When you reach a limit, you'll need to upgrade or remove resources to add more.",
          steps: [
            "Free: 1 subdomain, no custom domains, no teams",
            "Pro: 5 subdomains, 3 custom domains, 5 team members",
            "Enterprise: Unlimited everything",
          ],
        },
        payment: {
          title: "Payment & Billing",
          explanation:
            "We accept all major credit cards. Billing occurs monthly on the anniversary of your upgrade date.",
          steps: [
            "Payments are processed securely via Stripe",
            "You'll receive an email receipt for each payment",
            "You can update payment methods in the billing portal",
          ],
        },
        cancel: {
          title: "Canceling Your Subscription",
          explanation:
            "You can cancel anytime. You'll keep access to your current plan features until the end of your billing period.",
          steps: [
            "Go to Dashboard > Billing",
            "Click 'Manage Subscription'",
            "Click 'Cancel Subscription'",
            "Your data is preserved if you resubscribe later",
          ],
        },
        trial: {
          title: "Free Trial Information",
          explanation:
            "New Pro subscriptions include a 14-day free trial. You won't be charged until the trial ends.",
          steps: [
            "Start your trial by upgrading to Pro",
            "Full access to Pro features during trial",
            "Cancel anytime before trial ends to avoid charges",
            "Automatic billing after 14 days if not canceled",
          ],
        },
      }

      const normalized = topic.toLowerCase().replace(/[^a-z]/g, "")
      const match = Object.keys(explanations).find(
        (key) => normalized.includes(key) || key.includes(normalized)
      )

      if (match) {
        return explanations[match]
      }

      return {
        title: "Billing Help",
        explanation: `I can help explain billing topics like: ${Object.keys(explanations).join(", ")}. What would you like to know more about?`,
        availableTopics: Object.keys(explanations),
      }
    },
  })

  return {
    getBillingStatus,
    getUsageStats,
    comparePlans,
    explainBilling,
  }
}
