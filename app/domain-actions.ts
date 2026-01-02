"use server"

import { getCurrentUser } from "@/lib/auth"
import { getVercelAPI, type DomainStatus } from "@/lib/vercel"
import { sql } from "@/lib/neon"
import { revalidatePath } from "next/cache"

export interface DomainInfo {
  id: string
  domain: string
  subdomain: string
  is_primary: boolean
  status: "pending" | "verifying" | "active" | "error"
  ssl_status: "pending" | "provisioning" | "active" | "error"
  verification_type: "cname" | "txt" | null
  verification_value: string | null
  created_at: string
  verified_at: string | null
  vercel_status?: DomainStatus
}

// Helper to ensure custom_domains table exists (uses subdomain name as key)
async function ensureDomainsTableExists() {
  await sql`
    CREATE TABLE IF NOT EXISTS custom_domains (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      subdomain VARCHAR(255) NOT NULL,
      domain VARCHAR(255) NOT NULL UNIQUE,
      is_primary BOOLEAN DEFAULT false,
      status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'verifying', 'active', 'error')),
      ssl_status VARCHAR(50) DEFAULT 'pending' CHECK (ssl_status IN ('pending', 'provisioning', 'active', 'error')),
      verification_type VARCHAR(50),
      verification_value TEXT,
      vercel_project_id VARCHAR(255),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      verified_at TIMESTAMP WITH TIME ZONE
    )
  `

  await sql`
    CREATE INDEX IF NOT EXISTS idx_custom_domains_subdomain ON custom_domains(subdomain)
  `
}

// Get all domains for a subdomain
export async function getDomainsForSubdomain(subdomain: string): Promise<DomainInfo[]> {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("Not authenticated")
  }

  try {
    await ensureDomainsTableExists()

    const domains = await sql`
      SELECT * FROM custom_domains
      WHERE subdomain = ${subdomain}
      ORDER BY is_primary DESC, created_at DESC
    `

    // Enrich with Vercel status if project exists
    const enrichedDomains: DomainInfo[] = []

    for (const domain of domains) {
      let vercelStatus: DomainStatus | undefined

      if (domain.vercel_project_id) {
        try {
          const vercel = getVercelAPI()
          vercelStatus = await vercel.getDomainStatus(domain.vercel_project_id, domain.domain)
        } catch (e) {
          console.error(`Failed to get Vercel status for ${domain.domain}:`, e)
        }
      }

      enrichedDomains.push({
        id: domain.id,
        domain: domain.domain,
        subdomain: domain.subdomain,
        is_primary: domain.is_primary,
        status: domain.status,
        ssl_status: domain.ssl_status,
        verification_type: domain.verification_type,
        verification_value: domain.verification_value,
        created_at: domain.created_at,
        verified_at: domain.verified_at,
        vercel_status: vercelStatus,
      })
    }

    return enrichedDomains
  } catch (error) {
    console.error("Failed to get domains:", error)
    throw error
  }
}

// Add a new custom domain
export async function addCustomDomain(
  subdomain: string,
  domain: string,
  vercelProjectId?: string
): Promise<{ success: boolean; domain?: DomainInfo; error?: string }> {
  const user = await getCurrentUser()
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  // Validate domain format
  const domainRegex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/
  if (!domainRegex.test(domain)) {
    return { success: false, error: "Invalid domain format" }
  }

  try {
    await ensureDomainsTableExists()

    // Check if domain already exists
    const existing = await sql`
      SELECT id FROM custom_domains WHERE domain = ${domain.toLowerCase()}
    `
    if (existing.length > 0) {
      return { success: false, error: "Domain already registered" }
    }

    let projectId = vercelProjectId
    let verificationType = null
    let verificationValue = null

    // If no projectId provided, try to get from repository_connections
    if (!projectId) {
      const repoConnection = await sql`
        SELECT vercel_project_id FROM repository_connections WHERE subdomain = ${subdomain}
      `
      projectId = repoConnection[0]?.vercel_project_id
    }

    // If we have a Vercel project, add the domain there
    if (projectId) {
      try {
        const vercel = getVercelAPI()
        const vercelDomain = await vercel.addDomain(projectId, domain.toLowerCase())

        if (vercelDomain.verification && vercelDomain.verification.length > 0) {
          verificationType = vercelDomain.verification[0].type
          verificationValue = vercelDomain.verification[0].value
        }
      } catch (e) {
        console.error("Failed to add domain to Vercel:", e)
        // Continue anyway - domain will need to be added to Vercel later
      }
    }

    // Determine if this is the first domain (make it primary)
    const existingDomains = await sql`
      SELECT COUNT(*) as count FROM custom_domains WHERE subdomain = ${subdomain}
    `
    const isPrimary = existingDomains[0].count === 0

    // Store in database
    const result = await sql`
      INSERT INTO custom_domains (
        subdomain, domain, is_primary, status, ssl_status,
        verification_type, verification_value, vercel_project_id
      ) VALUES (
        ${subdomain}, ${domain.toLowerCase()}, ${isPrimary}, 'pending', 'pending',
        ${verificationType}, ${verificationValue}, ${projectId || null}
      )
      RETURNING *
    `

    revalidatePath("/dashboard")

    return {
      success: true,
      domain: {
        id: result[0].id,
        domain: result[0].domain,
        subdomain: result[0].subdomain,
        is_primary: result[0].is_primary,
        status: result[0].status,
        ssl_status: result[0].ssl_status,
        verification_type: result[0].verification_type,
        verification_value: result[0].verification_value,
        created_at: result[0].created_at,
        verified_at: result[0].verified_at,
      },
    }
  } catch (error) {
    console.error("Failed to add domain:", error)
    return { success: false, error: error instanceof Error ? error.message : "Failed to add domain" }
  }
}

// Remove a custom domain
export async function removeCustomDomain(
  subdomain: string,
  domain: string
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser()
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  try {
    // Get the domain record to find vercel_project_id
    const domainRecord = await sql`
      SELECT vercel_project_id FROM custom_domains WHERE subdomain = ${subdomain} AND domain = ${domain}
    `

    if (domainRecord[0]?.vercel_project_id) {
      const vercel = getVercelAPI()
      try {
        await vercel.removeDomain(domainRecord[0].vercel_project_id, domain)
      } catch (e) {
        console.error("Failed to remove domain from Vercel:", e)
        // Continue anyway to clean up database
      }
    }

    // Remove from database
    await sql`
      DELETE FROM custom_domains WHERE subdomain = ${subdomain} AND domain = ${domain}
    `

    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    console.error("Failed to remove domain:", error)
    return { success: false, error: error instanceof Error ? error.message : "Failed to remove domain" }
  }
}

// Verify domain DNS configuration
export async function verifyDomainDns(
  subdomain: string,
  domain: string
): Promise<{ success: boolean; status?: DomainStatus; error?: string }> {
  const user = await getCurrentUser()
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  try {
    // Get the domain record
    const domainRecord = await sql`
      SELECT vercel_project_id FROM custom_domains WHERE subdomain = ${subdomain} AND domain = ${domain}
    `

    if (!domainRecord[0]?.vercel_project_id) {
      return { success: false, error: "Vercel project not configured for this domain" }
    }

    const vercel = getVercelAPI()
    const projectId = domainRecord[0].vercel_project_id

    // Trigger verification
    try {
      await vercel.verifyDomain(projectId, domain)
    } catch (e) {
      // Verification might fail if DNS not yet propagated
      console.log("Verification attempt:", e)
    }

    // Get updated status
    const status = await vercel.getDomainStatus(projectId, domain)

    // Update database
    const newStatus = status.verified ? "active" : "verifying"
    const sslStatus = status.sslReady ? "active" : "pending"

    await sql`
      UPDATE custom_domains
      SET
        status = ${newStatus},
        ssl_status = ${sslStatus},
        verified_at = ${status.verified ? new Date().toISOString() : null}
      WHERE subdomain = ${subdomain} AND domain = ${domain}
    `

    revalidatePath("/dashboard")
    return { success: true, status }
  } catch (error) {
    console.error("Failed to verify domain:", error)
    return { success: false, error: error instanceof Error ? error.message : "Failed to verify domain" }
  }
}

// Set primary domain
export async function setPrimaryDomain(
  subdomain: string,
  domain: string
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser()
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  try {
    // Remove primary from all other domains for this subdomain
    await sql`
      UPDATE custom_domains SET is_primary = false WHERE subdomain = ${subdomain}
    `

    // Set this domain as primary
    await sql`
      UPDATE custom_domains SET is_primary = true WHERE subdomain = ${subdomain} AND domain = ${domain}
    `

    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    console.error("Failed to set primary domain:", error)
    return { success: false, error: error instanceof Error ? error.message : "Failed to set primary domain" }
  }
}

// Refresh all domain statuses
export async function refreshDomainStatuses(subdomain: string): Promise<DomainInfo[]> {
  return getDomainsForSubdomain(subdomain)
}
