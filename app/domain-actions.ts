"use server"

/**
 * Domain server actions — auth wrappers around lib/cms/domains/core.
 *
 * Every public server action verifies the caller is authenticated, then
 * delegates to the auth-free core function and triggers a route revalidation
 * so the dashboard UI re-renders with fresh data.
 *
 * For non-server-action callers (CLI, AI tools), import from
 * `@/lib/cms/domains/core` directly and handle authorization at the call
 * site.
 */

import { getCurrentUser } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import {
  type DomainInfo,
  listDomainsForSubdomain,
  addCustomDomain as coreAddDomain,
  removeCustomDomain as coreRemoveDomain,
  verifyDomain as coreVerifyDomain,
  setPrimaryDomain as coreSetPrimary,
} from "@/lib/cms/domains/core"
import type { DomainStatus } from "@/lib/vercel"

export type { DomainInfo } from "@/lib/cms/domains/core"

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------

export async function getDomainsForSubdomain(
  subdomain: string,
): Promise<DomainInfo[]> {
  const user = await getCurrentUser()
  if (!user) throw new Error("Not authenticated")
  return listDomainsForSubdomain(subdomain, { enrichWithVercelStatus: true })
}

// ---------------------------------------------------------------------------
// Write
// ---------------------------------------------------------------------------

export async function addCustomDomain(
  subdomain: string,
  domain: string,
  vercelProjectId?: string,
): Promise<{ success: boolean; domain?: DomainInfo; error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { success: false, error: "Not authenticated" }

  const result = await coreAddDomain(subdomain, domain, { vercelProjectId })
  if (!result.success) return { success: false, error: result.error }

  revalidatePath("/dashboard")
  return { success: true, domain: result.data }
}

export async function removeCustomDomain(
  subdomain: string,
  domain: string,
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { success: false, error: "Not authenticated" }

  const result = await coreRemoveDomain(subdomain, domain)
  if (!result.success) return { success: false, error: result.error }

  revalidatePath("/dashboard")
  return { success: true }
}

export async function verifyDomainDns(
  subdomain: string,
  domain: string,
): Promise<{ success: boolean; status?: DomainStatus; error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { success: false, error: "Not authenticated" }

  const result = await coreVerifyDomain(subdomain, domain)
  if (!result.success) return { success: false, error: result.error }

  revalidatePath("/dashboard")
  return { success: true, status: result.data.status }
}

export async function setPrimaryDomain(
  subdomain: string,
  domain: string,
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { success: false, error: "Not authenticated" }

  const result = await coreSetPrimary(subdomain, domain)
  if (!result.success) return { success: false, error: result.error }

  revalidatePath("/dashboard")
  return { success: true }
}

export async function refreshDomainStatuses(
  subdomain: string,
): Promise<DomainInfo[]> {
  return getDomainsForSubdomain(subdomain)
}
