/**
 * Dashboard AI Tools - Domain Management
 *
 * Tools for listing, checking, and troubleshooting custom domains.
 */

import { tool } from "ai"
import { z } from "zod"
import { sql } from "@/lib/neon"

// Helper function to generate DNS records
function getDnsRecordsForDomain(domain: string, subdomain: string) {
  const platformDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "cncpt.io"
  const isApex = !domain.includes(".") || domain.split(".").length === 2

  if (isApex) {
    return [
      {
        type: "A",
        name: "@",
        value: "76.76.21.21",
        note: "Points your domain to our servers",
      },
      {
        type: "CNAME",
        name: "www",
        value: `${subdomain}.${platformDomain}`,
        note: "Points www subdomain to your site",
      },
    ]
  }

  return [
    {
      type: "CNAME",
      name: domain.split(".")[0],
      value: `${subdomain}.${platformDomain}`,
      note: "Points your subdomain to your site",
    },
  ]
}

/**
 * Create domain tools with user context
 */
export function createDomainTools(userId: string) {
  /**
   * List custom domains across all user's subdomains
   */
  const listDomains = tool({
    description:
      "List all custom domains across user's subdomains. Can filter by subdomain or verification status.",
    parameters: z.object({
      subdomain: z
        .string()
        .optional()
        .describe("Filter to domains for a specific subdomain"),
      status: z
        .enum(["verified", "pending", "all"])
        .optional()
        .default("all")
        .describe("Filter by verification status"),
    }),
    execute: async ({ subdomain, status }: { subdomain?: string; status?: "verified" | "pending" | "all" }) => {
      if (!userId) {
        return { error: "User not authenticated" }
      }

      try {
        let domains

        if (subdomain) {
          const ownership = await sql`
            SELECT 1 FROM subdomains WHERE subdomain = ${subdomain} AND user_id = ${userId}
          `
          if (ownership.length === 0) {
            return { error: "Subdomain not found or no access" }
          }

          if (status === "verified") {
            domains = await sql`
              SELECT cd.*, s.emoji
              FROM custom_domains cd
              JOIN subdomains s ON cd.subdomain = s.subdomain
              WHERE cd.subdomain = ${subdomain} AND cd.is_verified = true
              ORDER BY cd.is_primary DESC, cd.created_at DESC
            `
          } else if (status === "pending") {
            domains = await sql`
              SELECT cd.*, s.emoji
              FROM custom_domains cd
              JOIN subdomains s ON cd.subdomain = s.subdomain
              WHERE cd.subdomain = ${subdomain} AND cd.is_verified = false
              ORDER BY cd.created_at DESC
            `
          } else {
            domains = await sql`
              SELECT cd.*, s.emoji
              FROM custom_domains cd
              JOIN subdomains s ON cd.subdomain = s.subdomain
              WHERE cd.subdomain = ${subdomain}
              ORDER BY cd.is_primary DESC, cd.is_verified DESC, cd.created_at DESC
            `
          }
        } else {
          if (status === "verified") {
            domains = await sql`
              SELECT cd.*, s.emoji
              FROM custom_domains cd
              JOIN subdomains s ON cd.subdomain = s.subdomain
              WHERE s.user_id = ${userId} AND cd.is_verified = true
              ORDER BY cd.subdomain, cd.is_primary DESC, cd.created_at DESC
            `
          } else if (status === "pending") {
            domains = await sql`
              SELECT cd.*, s.emoji
              FROM custom_domains cd
              JOIN subdomains s ON cd.subdomain = s.subdomain
              WHERE s.user_id = ${userId} AND cd.is_verified = false
              ORDER BY cd.subdomain, cd.created_at DESC
            `
          } else {
            domains = await sql`
              SELECT cd.*, s.emoji
              FROM custom_domains cd
              JOIN subdomains s ON cd.subdomain = s.subdomain
              WHERE s.user_id = ${userId}
              ORDER BY cd.subdomain, cd.is_primary DESC, cd.is_verified DESC, cd.created_at DESC
            `
          }
        }

        const summary = {
          total: domains.length,
          verified: domains.filter((d) => d.is_verified).length,
          pending: domains.filter((d) => !d.is_verified).length,
          primary: domains.filter((d) => d.is_primary).length,
        }

        return {
          summary,
          domains: domains.map((d) => ({
            domain: d.domain,
            subdomain: d.subdomain,
            emoji: d.emoji,
            isVerified: d.is_verified,
            isPrimary: d.is_primary,
            createdAt: d.created_at,
          })),
        }
      } catch (error) {
        console.error("[domain-tools] listDomains error:", error)
        return { error: "Failed to fetch domains" }
      }
    },
  })

  /**
   * Get detailed domain status and DNS info
   */
  const getDomainStatus = tool({
    description:
      "Get detailed status for a specific domain including verification status and DNS configuration needed.",
    parameters: z.object({
      domain: z.string().describe("The custom domain to check"),
    }),
    execute: async ({ domain }: { domain: string }) => {
      if (!userId) {
        return { error: "User not authenticated" }
      }

      try {
        const domainResult = await sql`
          SELECT cd.*, s.emoji, s.user_id
          FROM custom_domains cd
          JOIN subdomains s ON cd.subdomain = s.subdomain
          WHERE cd.domain = ${domain}
        `

        if (domainResult.length === 0) {
          return { error: "Domain not found" }
        }

        const d = domainResult[0]

        if (d.user_id !== userId) {
          const teamAccess = await sql`
            SELECT 1 FROM team_subdomains ts
            JOIN team_members tm ON ts.team_id = tm.team_id
            WHERE ts.subdomain = ${d.subdomain} AND tm.user_id = ${userId}
          `
          if (teamAccess.length === 0) {
            return { error: "No access to this domain" }
          }
        }

        const dnsRecords = getDnsRecordsForDomain(domain, d.subdomain as string)

        return {
          domain: d.domain,
          subdomain: d.subdomain,
          emoji: d.emoji,
          isVerified: d.is_verified,
          isPrimary: d.is_primary,
          createdAt: d.created_at,
          updatedAt: d.updated_at,
          dnsRecords,
          status: d.is_verified ? "active" : "pending_verification",
          nextSteps: d.is_verified
            ? ["Domain is active and serving traffic"]
            : [
                "Add the DNS records shown above to your domain provider",
                "Wait for DNS propagation (can take up to 48 hours)",
                "Click 'Verify' in the dashboard to check configuration",
              ],
        }
      } catch (error) {
        console.error("[domain-tools] getDomainStatus error:", error)
        return { error: "Failed to fetch domain status" }
      }
    },
  })

  /**
   * Troubleshoot domain configuration issues
   */
  const troubleshootDomain = tool({
    description:
      "Diagnose common domain configuration issues and provide suggested fixes.",
    parameters: z.object({
      domain: z.string().describe("The domain to troubleshoot"),
    }),
    execute: async ({ domain }: { domain: string }) => {
      if (!userId) {
        return { error: "User not authenticated" }
      }

      try {
        const domainResult = await sql`
          SELECT cd.*, s.emoji, s.user_id
          FROM custom_domains cd
          JOIN subdomains s ON cd.subdomain = s.subdomain
          WHERE cd.domain = ${domain}
        `

        if (domainResult.length === 0) {
          return {
            domain,
            found: false,
            issues: [
              {
                type: "not_found",
                severity: "error",
                message: "Domain not found in your account",
                suggestion:
                  "Make sure you've added this domain in the Custom Domains section of your dashboard",
              },
            ],
          }
        }

        const d = domainResult[0]

        if (d.user_id !== userId) {
          const teamAccess = await sql`
            SELECT 1 FROM team_subdomains ts
            JOIN team_members tm ON ts.team_id = tm.team_id
            WHERE ts.subdomain = ${d.subdomain} AND tm.user_id = ${userId}
          `
          if (teamAccess.length === 0) {
            return { error: "No access to this domain" }
          }
        }

        const issues: Array<{
          type: string
          severity: "error" | "warning" | "info"
          message: string
          suggestion: string
        }> = []

        if (!d.is_verified) {
          issues.push({
            type: "not_verified",
            severity: "warning",
            message: "Domain DNS has not been verified",
            suggestion:
              "Add the required DNS records and click Verify in the dashboard. DNS changes can take up to 48 hours to propagate.",
          })
        }

        if (domain.startsWith("www.")) {
          const rootDomain = domain.replace("www.", "")
          const rootExists = await sql`
            SELECT 1 FROM custom_domains
            WHERE domain = ${rootDomain} AND subdomain = ${d.subdomain}
          `
          if (rootExists.length === 0) {
            issues.push({
              type: "missing_root",
              severity: "info",
              message: `Root domain (${rootDomain}) is not configured`,
              suggestion: `Consider adding ${rootDomain} as well so both www and non-www work`,
            })
          }
        }

        if (!domain.startsWith("www.") && !domain.includes(".www.")) {
          const wwwDomain = `www.${domain}`
          const wwwExists = await sql`
            SELECT 1 FROM custom_domains
            WHERE domain = ${wwwDomain} AND subdomain = ${d.subdomain}
          `
          if (wwwExists.length === 0) {
            issues.push({
              type: "missing_www",
              severity: "info",
              message: `WWW subdomain (${wwwDomain}) is not configured`,
              suggestion: `Consider adding ${wwwDomain} as well so both www and non-www work`,
            })
          }
        }

        if (d.is_verified && issues.length === 0) {
          issues.push({
            type: "all_good",
            severity: "info",
            message: "Domain is properly configured and active",
            suggestion: "No issues found. Your domain should be working correctly.",
          })
        }

        return {
          domain,
          subdomain: d.subdomain,
          found: true,
          isVerified: d.is_verified,
          isPrimary: d.is_primary,
          issues,
          dnsRecords: getDnsRecordsForDomain(domain, d.subdomain as string),
        }
      } catch (error) {
        console.error("[domain-tools] troubleshootDomain error:", error)
        return { error: "Failed to troubleshoot domain" }
      }
    },
  })

  /**
   * Get DNS setup instructions
   */
  const getDnsInstructions = tool({
    description:
      "Get step-by-step DNS setup instructions for a domain, optionally customized for a specific provider.",
    parameters: z.object({
      domain: z.string().describe("The domain to get instructions for"),
      provider: z
        .string()
        .optional()
        .describe("DNS provider name (e.g., 'cloudflare', 'namecheap', 'godaddy')"),
    }),
    execute: async ({ domain, provider }: { domain: string; provider?: string }) => {
      const subdomain = "your-subdomain"
      const dnsRecords = getDnsRecordsForDomain(domain, subdomain)

      const genericSteps = [
        "1. Log in to your domain registrar or DNS provider",
        "2. Find the DNS management or DNS records section",
        "3. Add the following DNS records:",
        ...dnsRecords.map(
          (r) => `   - Type: ${r.type}, Name: ${r.name}, Value: ${r.value}`
        ),
        "4. Save your changes",
        "5. Wait for DNS propagation (can take up to 48 hours)",
        "6. Return to your dashboard and click 'Verify'",
      ]

      const providerSpecific: Record<string, string[]> = {
        cloudflare: [
          "1. Log in to Cloudflare dashboard",
          "2. Select your domain",
          "3. Go to DNS > Records",
          "4. Click 'Add record' for each record below:",
          ...dnsRecords.map(
            (r) => `   - Type: ${r.type}, Name: ${r.name}, Content: ${r.value}, Proxy: OFF (DNS only)`
          ),
          "5. Make sure proxy is OFF (gray cloud) for proper SSL",
          "6. Changes apply almost instantly with Cloudflare",
        ],
        namecheap: [
          "1. Log in to Namecheap",
          "2. Go to Domain List > Manage > Advanced DNS",
          "3. Add new records:",
          ...dnsRecords.map(
            (r) => `   - Type: ${r.type}, Host: ${r.name === "@" ? "@" : r.name}, Value: ${r.value}`
          ),
          "4. TTL can be left as Automatic",
          "5. Wait 30 minutes to 48 hours for propagation",
        ],
        godaddy: [
          "1. Log in to GoDaddy",
          "2. Go to My Products > DNS",
          "3. Click 'Add' for each record:",
          ...dnsRecords.map(
            (r) => `   - Type: ${r.type}, Name: ${r.name}, Value: ${r.value}`
          ),
          "4. Click Save",
          "5. Wait up to 48 hours for propagation",
        ],
      }

      return {
        domain,
        dnsRecords,
        instructions: provider && providerSpecific[provider.toLowerCase()]
          ? providerSpecific[provider.toLowerCase()]
          : genericSteps,
        provider: provider || "generic",
        supportedProviders: Object.keys(providerSpecific),
        tips: [
          "DNS propagation can take anywhere from a few minutes to 48 hours",
          "You can check propagation status at dnschecker.org",
          "Make sure to disable any proxy/CDN features when first setting up",
          "If using Cloudflare, ensure the proxy is OFF (gray cloud) initially",
        ],
      }
    },
  })

  return {
    listDomains,
    getDomainStatus,
    troubleshootDomain,
    getDnsInstructions,
  }
}
