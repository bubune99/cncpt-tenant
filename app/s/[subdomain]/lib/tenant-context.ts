/**
 * Tenant Context Utilities
 *
 * Shared utilities for getting tenant data and checking maintenance mode
 * in subdomain routes.
 */

import { getTenantData } from '@/lib/tenant';
import { cookies } from 'next/headers';

export interface TenantContext {
  id: number;
  subdomain: string;
  userId: string | null;
  emoji: string;
  maintenanceMode: boolean;
  maintenanceMessage: string | null;
}

/**
 * Get full tenant context including maintenance mode status
 */
export async function getTenantContext(subdomain: string): Promise<TenantContext | null> {
  const tenantData = await getTenantData(subdomain);

  if (!tenantData) {
    return null;
  }

  return {
    id: tenantData.id,
    subdomain: tenantData.subdomain,
    userId: tenantData.userId ?? null,
    emoji: tenantData.emoji || '🏠',
    maintenanceMode: tenantData.maintenanceMode ?? false,
    maintenanceMessage: tenantData.maintenanceMsg ?? null,
  };
}

/**
 * Check if the current user can bypass maintenance mode
 * Returns true if:
 * - User is the site owner
 * - User has ?bypass=maintenance in URL (stored in cookie)
 */
export async function canBypassMaintenance(
  tenantContext: TenantContext,
  currentUserId?: string | null
): Promise<boolean> {
  // Site owner can always bypass
  if (currentUserId && tenantContext.userId === currentUserId) {
    return true;
  }

  // Check for bypass cookie
  const cookieStore = await cookies();
  const bypassCookie = cookieStore.get(`maintenance_bypass_${tenantContext.subdomain}`);

  return bypassCookie?.value === 'true';
}

/**
 * Check if the site should show maintenance mode
 */
export async function shouldShowMaintenance(
  tenantContext: TenantContext,
  currentUserId?: string | null
): Promise<boolean> {
  if (!tenantContext.maintenanceMode) {
    return false;
  }

  const canBypass = await canBypassMaintenance(tenantContext, currentUserId);
  return !canBypass;
}
