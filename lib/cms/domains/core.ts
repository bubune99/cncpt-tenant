/**
 * Custom-domain core operations — shared between server actions, CLI, and AI tools.
 *
 * These functions DO NOT perform auth. Callers are responsible for verifying
 * ownership/permissions BEFORE invoking. The three known callers each handle
 * auth differently:
 *
 *   - app/domain-actions.ts wraps with `getCurrentUser()` + ownership check
 *   - scripts/tenant.ts (CLI) is privileged by virtue of running with the
 *     server's DATABASE_URL + VERCEL_API_TOKEN
 *   - lib/ai/tools/dashboard/domain-tools.ts gates by the chat session's
 *     authenticated user owning the target subdomain
 *
 * Side effects:
 *   - Reads/writes the `custom_domains` table (lazy-creates if missing)
 *   - Calls the Vercel REST API to attach/detach/verify the domain on the
 *     platform's Vercel project
 *   - Writes `domain:<host>` → `<subdomain>` mapping to Vercel Edge Config
 *     when a domain is verified, so the middleware lookupCustomDomain can
 *     resolve the tenant in <15ms at the edge.
 */

import { getVercelAPI, type DomainStatus } from "@/lib/vercel"
import { sql } from "@/lib/neon"
import {
  syncDomainToEdgeConfig,
  removeDomainFromEdgeConfig,
} from "@/lib/edge-config"

// Main Vercel project that owns the platform deployment. Custom domains are
// attached here so all subdomain-routed traffic flows through middleware.
const VERCEL_PROJECT_ID =
  process.env.VERCEL_PROJECT_ID ||
  process.env.VERCEL_PROJECT_NAME ||
  "cncpt-tenant"

const DOMAIN_REGEX =
  /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/

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

export type DomainsResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

// ---------------------------------------------------------------------------
// Schema bootstrap
// ---------------------------------------------------------------------------

let tableEnsured = false
async function ensureDomainsTableExists() {
  if (tableEnsured) return
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
  tableEnsured = true
}

function rowToDomainInfo(row: Record<string, unknown>): DomainInfo {
  return {
    id: row.id as string,
    domain: row.domain as string,
    subdomain: row.subdomain as string,
    is_primary: row.is_primary as boolean,
    status: row.status as DomainInfo["status"],
    ssl_status: row.ssl_status as DomainInfo["ssl_status"],
    verification_type: row.verification_type as DomainInfo["verification_type"],
    verification_value: row.verification_value as string | null,
    created_at:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : (row.created_at as string),
    verified_at:
      row.verified_at instanceof Date
        ? row.verified_at.toISOString()
        : (row.verified_at as string | null),
  }
}

async function resolveProjectId(
  subdomain: string,
  override?: string,
): Promise<string> {
  if (override) return override
  try {
    const repoConnection = await sql`
      SELECT vercel_project_id FROM repository_connections WHERE subdomain = ${subdomain}
    `
    if (repoConnection[0]?.vercel_project_id) {
      return repoConnection[0].vercel_project_id as string
    }
  } catch {
    // table may not exist on older deployments — fall through to platform default
  }
  return VERCEL_PROJECT_ID
}

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------

export async function listDomainsForSubdomain(
  subdomain: string,
  options: { enrichWithVercelStatus?: boolean } = {},
): Promise<DomainInfo[]> {
  await ensureDomainsTableExists()

  const rows = await sql`
    SELECT * FROM custom_domains
    WHERE subdomain = ${subdomain}
    ORDER BY is_primary DESC, created_at DESC
  `
  const enrich = options.enrichWithVercelStatus !== false
  if (!enrich) return rows.map(rowToDomainInfo)

  const out: DomainInfo[] = []
  for (const row of rows) {
    const projectId = (row.vercel_project_id as string) || VERCEL_PROJECT_ID
    let vercelStatus: DomainStatus | undefined
    if (projectId) {
      try {
        const vercel = getVercelAPI()
        vercelStatus = await vercel.getDomainStatus(
          projectId,
          row.domain as string,
        )
      } catch {
        // best-effort; don't fail the list if a single domain status check errors
      }
    }
    out.push({ ...rowToDomainInfo(row), vercel_status: vercelStatus })
  }
  return out
}

export async function getDomain(
  subdomain: string,
  domain: string,
): Promise<DomainInfo | null> {
  await ensureDomainsTableExists()
  const rows = await sql`
    SELECT * FROM custom_domains
    WHERE subdomain = ${subdomain} AND domain = ${domain.toLowerCase()}
    LIMIT 1
  `
  return rows.length > 0 ? rowToDomainInfo(rows[0]) : null
}

// ---------------------------------------------------------------------------
// Write
// ---------------------------------------------------------------------------

export async function addCustomDomain(
  subdomain: string,
  domain: string,
  options: { vercelProjectId?: string } = {},
): Promise<DomainsResult<DomainInfo>> {
  if (!DOMAIN_REGEX.test(domain)) {
    return { success: false, error: "Invalid domain format" }
  }

  await ensureDomainsTableExists()

  const lowered = domain.toLowerCase()
  const existing = await sql`
    SELECT id FROM custom_domains WHERE domain = ${lowered}
  `
  if (existing.length > 0) {
    return { success: false, error: "Domain already registered" }
  }

  const projectId = await resolveProjectId(subdomain, options.vercelProjectId)
  let verificationType: string | null = null
  let verificationValue: string | null = null

  // Best-effort Vercel attach. If the API errors (token scope, network), we
  // still record the row in our DB so admins can retry verification later.
  try {
    const vercel = getVercelAPI()
    const vercelDomain = await vercel.addDomain(projectId, lowered)
    if (vercelDomain.verification && vercelDomain.verification.length > 0) {
      verificationType = vercelDomain.verification[0].type
      verificationValue = vercelDomain.verification[0].value
    }
  } catch (e) {
    console.error("[domains.core] Vercel addDomain failed:", e)
  }

  const existingDomains = await sql`
    SELECT COUNT(*)::int as count FROM custom_domains WHERE subdomain = ${subdomain}
  `
  const isPrimary = (existingDomains[0].count as number) === 0

  const result = await sql`
    INSERT INTO custom_domains (
      subdomain, domain, is_primary, status, ssl_status,
      verification_type, verification_value, vercel_project_id
    ) VALUES (
      ${subdomain}, ${lowered}, ${isPrimary}, 'pending', 'pending',
      ${verificationType}, ${verificationValue}, ${projectId || null}
    )
    RETURNING *
  `
  return { success: true, data: rowToDomainInfo(result[0]) }
}

export async function removeCustomDomain(
  subdomain: string,
  domain: string,
): Promise<DomainsResult<true>> {
  await ensureDomainsTableExists()
  const lowered = domain.toLowerCase()

  const domainRecord = await sql`
    SELECT vercel_project_id FROM custom_domains WHERE subdomain = ${subdomain} AND domain = ${lowered}
  `
  if (domainRecord.length === 0) {
    return { success: false, error: "Domain not found for this subdomain" }
  }

  const projectId =
    (domainRecord[0]?.vercel_project_id as string) || VERCEL_PROJECT_ID

  // Best-effort Vercel detach. We always proceed to clean up DB + Edge Config
  // even if Vercel detach errors, otherwise a partial state strands the row.
  if (projectId) {
    try {
      const vercel = getVercelAPI()
      await vercel.removeDomain(projectId, lowered)
    } catch (e) {
      console.error("[domains.core] Vercel removeDomain failed:", e)
    }
  }

  await removeDomainFromEdgeConfig(lowered)

  await sql`
    DELETE FROM custom_domains WHERE subdomain = ${subdomain} AND domain = ${lowered}
  `

  return { success: true, data: true }
}

export async function verifyDomain(
  subdomain: string,
  domain: string,
): Promise<DomainsResult<{ verified: boolean; status: DomainStatus }>> {
  await ensureDomainsTableExists()
  const lowered = domain.toLowerCase()

  const domainRecord = await sql`
    SELECT vercel_project_id FROM custom_domains WHERE subdomain = ${subdomain} AND domain = ${lowered}
  `
  if (domainRecord.length === 0) {
    return { success: false, error: "Domain not found for this subdomain" }
  }

  const projectId =
    (domainRecord[0]?.vercel_project_id as string) || VERCEL_PROJECT_ID
  if (!projectId) {
    return {
      success: false,
      error: "Vercel project not configured. Set VERCEL_PROJECT_ID.",
    }
  }

  const vercel = getVercelAPI()

  try {
    await vercel.verifyDomain(projectId, lowered)
  } catch {
    // Often DNS hasn't propagated yet — getDomainStatus below tells us truth.
  }

  const status = await vercel.getDomainStatus(projectId, lowered)

  const newStatus = status.verified ? "active" : "verifying"
  const sslStatus = status.sslReady ? "active" : "pending"
  await sql`
    UPDATE custom_domains
    SET status = ${newStatus},
        ssl_status = ${sslStatus},
        verified_at = ${status.verified ? new Date().toISOString() : null}
    WHERE subdomain = ${subdomain} AND domain = ${lowered}
  `

  // Push hostname → subdomain mapping to Edge Config only after Vercel
  // confirms verification, so the middleware lookup never resolves a
  // half-configured domain.
  if (status.verified) {
    await syncDomainToEdgeConfig(lowered, subdomain)
  }

  return {
    success: true,
    data: { verified: status.verified, status },
  }
}

export async function setPrimaryDomain(
  subdomain: string,
  domain: string,
): Promise<DomainsResult<true>> {
  await ensureDomainsTableExists()
  const lowered = domain.toLowerCase()

  const existing = await sql`
    SELECT id FROM custom_domains WHERE subdomain = ${subdomain} AND domain = ${lowered}
  `
  if (existing.length === 0) {
    return { success: false, error: "Domain not found for this subdomain" }
  }

  await sql`UPDATE custom_domains SET is_primary = false WHERE subdomain = ${subdomain}`
  await sql`UPDATE custom_domains SET is_primary = true WHERE subdomain = ${subdomain} AND domain = ${lowered}`

  return { success: true, data: true }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Generate the DNS records a tenant needs to set at their registrar.
 * Apex (e.g. `mybrand.com`) → A record to Vercel anycast IP + CNAME for www.
 * Subdomain (e.g. `shop.mybrand.com`) → single CNAME.
 *
 * Identical contract to lib/ai/tools/dashboard/domain-tools.ts so callers
 * can pick whichever import is closer.
 */
export function getDnsRecordsForDomain(domain: string, subdomain: string) {
  const platformDomain =
    process.env.NEXT_PUBLIC_ROOT_DOMAIN || "cncptweb.com"
  const isApex = !domain.includes(".") || domain.split(".").length === 2

  if (isApex) {
    return [
      {
        type: "A",
        name: "@",
        value: "76.76.21.21",
        note: "Points the apex domain to Vercel's edge network",
      },
      {
        type: "CNAME",
        name: "www",
        value: `${subdomain}.${platformDomain}`,
        note: "Points the www subdomain to your tenant",
      },
    ] as const
  }

  return [
    {
      type: "CNAME",
      name: domain.split(".")[0],
      value: `${subdomain}.${platformDomain}`,
      note: "Points the subdomain to your tenant",
    },
  ] as const
}
