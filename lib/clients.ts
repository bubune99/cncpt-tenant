/**
 * Platform Client Management Functions
 * CRUD operations for managing platform clients and their lifecycle
 */

import { sql } from "@/lib/neon"
import type {
  PlatformClient,
  ClientStatus,
  ClientFilters,
  ClientStats,
  PaginatedClients,
  CreateClientInput,
  UpdateClientInput,
  ActivityAction,
  CreateActivityLogInput,
  ActivityLogEntry,
  BulkOperationResult,
  SubscriptionTier,
  TierLimits,
} from "@/types/admin"

// ============================================
// HELPER FUNCTIONS
// ============================================

function mapRowToClient(row: Record<string, unknown>): PlatformClient {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    companyName: row.company_name as string,
    contactEmail: row.contact_email as string,
    contactName: row.contact_name as string | null,
    phone: row.phone as string | null,
    website: row.website as string | null,
    status: row.status as ClientStatus,
    tierId: row.tier_id as string | null,
    tier: row.tier_name ? {
      id: row.tier_id as string,
      name: row.tier_name as string,
      displayName: row.tier_display_name as string,
      description: row.tier_description as string | null,
      priceMonthly: parseFloat(row.tier_price_monthly as string || '0'),
      priceYearly: row.tier_price_yearly ? parseFloat(row.tier_price_yearly as string) : null,
      currency: row.tier_currency as string || 'USD',
      features: (row.tier_features as string[]) || [],
      limits: (row.tier_limits as TierLimits) || { storage_gb: 0, pages: 0, posts: 0, custom_domains: 0, team_members: 0 },
      trialDays: row.tier_trial_days as number || 14,
      sortOrder: row.tier_sort_order as number || 0,
      isActive: row.tier_is_active as boolean ?? true,
      stripePriceIdMonthly: null,
      stripePriceIdYearly: null,
      stripeProductId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } : undefined,
    trialStartedAt: row.trial_started_at ? new Date(row.trial_started_at as string) : null,
    trialEndsAt: row.trial_ends_at ? new Date(row.trial_ends_at as string) : null,
    stripeCustomerId: row.stripe_customer_id as string | null,
    stripeSubscriptionId: row.stripe_subscription_id as string | null,
    subdomain: row.subdomain as string | null,
    cmsProvisioned: row.cms_provisioned as boolean,
    cmsProvisionedAt: row.cms_provisioned_at ? new Date(row.cms_provisioned_at as string) : null,
    cmsInstanceUrl: row.cms_instance_url as string | null,
    notes: row.notes as string | null,
    requestMessage: row.request_message as string | null,
    requestedTierId: row.requested_tier_id as string | null,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
    approvedAt: row.approved_at ? new Date(row.approved_at as string) : null,
    approvedBy: row.approved_by as string | null,
    suspendedAt: row.suspended_at ? new Date(row.suspended_at as string) : null,
    suspendedBy: row.suspended_by as string | null,
    suspensionReason: row.suspension_reason as string | null,
    cancelledAt: row.cancelled_at ? new Date(row.cancelled_at as string) : null,
    cancelledBy: row.cancelled_by as string | null,
    cancellationReason: row.cancellation_reason as string | null,
  }
}

function mapRowToActivityLog(row: Record<string, unknown>): ActivityLogEntry {
  return {
    id: row.id as string,
    clientId: row.client_id as string,
    action: row.action as ActivityAction,
    performedBy: row.performed_by as string,
    performedByEmail: row.performed_by_email as string | null,
    previousValue: row.previous_value as Record<string, unknown> | null,
    newValue: row.new_value as Record<string, unknown> | null,
    notes: row.notes as string | null,
    ipAddress: row.ip_address as string | null,
    userAgent: row.user_agent as string | null,
    createdAt: new Date(row.created_at as string),
  }
}

// ============================================
// READ OPERATIONS
// ============================================

/**
 * Get all clients with optional filtering and pagination
 */
export async function getAllClients(filters?: ClientFilters): Promise<PaginatedClients> {
  try {
    const page = filters?.page || 1
    const limit = filters?.limit || 20
    const offset = (page - 1) * limit
    const sortBy = filters?.sortBy || 'createdAt'
    const sortOrder = filters?.sortOrder || 'desc'

    // Map sortBy to column names
    const sortColumnMap: Record<string, string> = {
      createdAt: 'c.created_at',
      companyName: 'c.company_name',
      status: 'c.status',
      trialEndsAt: 'c.trial_ends_at',
      updatedAt: 'c.updated_at',
    }
    const sortColumn = sortColumnMap[sortBy] || 'c.created_at'

    // Build the query based on filters
    let rows
    let countRows

    if (filters?.search && filters?.status && filters.status !== 'all' && filters?.tierId && filters.tierId !== 'all') {
      const searchPattern = `%${filters.search}%`
      rows = await sql`
        SELECT c.*,
          t.name as tier_name, t.display_name as tier_display_name,
          t.description as tier_description, t.price_monthly as tier_price_monthly,
          t.features as tier_features, t.limits as tier_limits
        FROM platform_clients c
        LEFT JOIN subscription_tiers t ON c.tier_id = t.id
        WHERE (c.company_name ILIKE ${searchPattern}
          OR c.contact_email ILIKE ${searchPattern}
          OR c.subdomain ILIKE ${searchPattern})
          AND c.status = ${filters.status}
          AND c.tier_id = ${filters.tierId}
        ORDER BY ${sql.unsafe(sortColumn)} ${sql.unsafe(sortOrder.toUpperCase())}
        LIMIT ${limit} OFFSET ${offset}
      `
      countRows = await sql`
        SELECT COUNT(*) as count FROM platform_clients c
        WHERE (c.company_name ILIKE ${searchPattern}
          OR c.contact_email ILIKE ${searchPattern}
          OR c.subdomain ILIKE ${searchPattern})
          AND c.status = ${filters.status}
          AND c.tier_id = ${filters.tierId}
      `
    } else if (filters?.search && filters?.status && filters.status !== 'all') {
      const searchPattern = `%${filters.search}%`
      rows = await sql`
        SELECT c.*,
          t.name as tier_name, t.display_name as tier_display_name,
          t.description as tier_description, t.price_monthly as tier_price_monthly,
          t.features as tier_features, t.limits as tier_limits
        FROM platform_clients c
        LEFT JOIN subscription_tiers t ON c.tier_id = t.id
        WHERE (c.company_name ILIKE ${searchPattern}
          OR c.contact_email ILIKE ${searchPattern}
          OR c.subdomain ILIKE ${searchPattern})
          AND c.status = ${filters.status}
        ORDER BY ${sql.unsafe(sortColumn)} ${sql.unsafe(sortOrder.toUpperCase())}
        LIMIT ${limit} OFFSET ${offset}
      `
      countRows = await sql`
        SELECT COUNT(*) as count FROM platform_clients c
        WHERE (c.company_name ILIKE ${searchPattern}
          OR c.contact_email ILIKE ${searchPattern}
          OR c.subdomain ILIKE ${searchPattern})
          AND c.status = ${filters.status}
      `
    } else if (filters?.search && filters?.tierId && filters.tierId !== 'all') {
      const searchPattern = `%${filters.search}%`
      rows = await sql`
        SELECT c.*,
          t.name as tier_name, t.display_name as tier_display_name,
          t.description as tier_description, t.price_monthly as tier_price_monthly,
          t.features as tier_features, t.limits as tier_limits
        FROM platform_clients c
        LEFT JOIN subscription_tiers t ON c.tier_id = t.id
        WHERE (c.company_name ILIKE ${searchPattern}
          OR c.contact_email ILIKE ${searchPattern}
          OR c.subdomain ILIKE ${searchPattern})
          AND c.tier_id = ${filters.tierId}
        ORDER BY ${sql.unsafe(sortColumn)} ${sql.unsafe(sortOrder.toUpperCase())}
        LIMIT ${limit} OFFSET ${offset}
      `
      countRows = await sql`
        SELECT COUNT(*) as count FROM platform_clients c
        WHERE (c.company_name ILIKE ${searchPattern}
          OR c.contact_email ILIKE ${searchPattern}
          OR c.subdomain ILIKE ${searchPattern})
          AND c.tier_id = ${filters.tierId}
      `
    } else if (filters?.status && filters.status !== 'all' && filters?.tierId && filters.tierId !== 'all') {
      rows = await sql`
        SELECT c.*,
          t.name as tier_name, t.display_name as tier_display_name,
          t.description as tier_description, t.price_monthly as tier_price_monthly,
          t.features as tier_features, t.limits as tier_limits
        FROM platform_clients c
        LEFT JOIN subscription_tiers t ON c.tier_id = t.id
        WHERE c.status = ${filters.status}
          AND c.tier_id = ${filters.tierId}
        ORDER BY ${sql.unsafe(sortColumn)} ${sql.unsafe(sortOrder.toUpperCase())}
        LIMIT ${limit} OFFSET ${offset}
      `
      countRows = await sql`
        SELECT COUNT(*) as count FROM platform_clients c
        WHERE c.status = ${filters.status}
          AND c.tier_id = ${filters.tierId}
      `
    } else if (filters?.search) {
      const searchPattern = `%${filters.search}%`
      rows = await sql`
        SELECT c.*,
          t.name as tier_name, t.display_name as tier_display_name,
          t.description as tier_description, t.price_monthly as tier_price_monthly,
          t.features as tier_features, t.limits as tier_limits
        FROM platform_clients c
        LEFT JOIN subscription_tiers t ON c.tier_id = t.id
        WHERE c.company_name ILIKE ${searchPattern}
          OR c.contact_email ILIKE ${searchPattern}
          OR c.subdomain ILIKE ${searchPattern}
        ORDER BY ${sql.unsafe(sortColumn)} ${sql.unsafe(sortOrder.toUpperCase())}
        LIMIT ${limit} OFFSET ${offset}
      `
      countRows = await sql`
        SELECT COUNT(*) as count FROM platform_clients c
        WHERE c.company_name ILIKE ${searchPattern}
          OR c.contact_email ILIKE ${searchPattern}
          OR c.subdomain ILIKE ${searchPattern}
      `
    } else if (filters?.status && filters.status !== 'all') {
      rows = await sql`
        SELECT c.*,
          t.name as tier_name, t.display_name as tier_display_name,
          t.description as tier_description, t.price_monthly as tier_price_monthly,
          t.features as tier_features, t.limits as tier_limits
        FROM platform_clients c
        LEFT JOIN subscription_tiers t ON c.tier_id = t.id
        WHERE c.status = ${filters.status}
        ORDER BY ${sql.unsafe(sortColumn)} ${sql.unsafe(sortOrder.toUpperCase())}
        LIMIT ${limit} OFFSET ${offset}
      `
      countRows = await sql`
        SELECT COUNT(*) as count FROM platform_clients c
        WHERE c.status = ${filters.status}
      `
    } else if (filters?.tierId && filters.tierId !== 'all') {
      rows = await sql`
        SELECT c.*,
          t.name as tier_name, t.display_name as tier_display_name,
          t.description as tier_description, t.price_monthly as tier_price_monthly,
          t.features as tier_features, t.limits as tier_limits
        FROM platform_clients c
        LEFT JOIN subscription_tiers t ON c.tier_id = t.id
        WHERE c.tier_id = ${filters.tierId}
        ORDER BY ${sql.unsafe(sortColumn)} ${sql.unsafe(sortOrder.toUpperCase())}
        LIMIT ${limit} OFFSET ${offset}
      `
      countRows = await sql`
        SELECT COUNT(*) as count FROM platform_clients c
        WHERE c.tier_id = ${filters.tierId}
      `
    } else {
      rows = await sql`
        SELECT c.*,
          t.name as tier_name, t.display_name as tier_display_name,
          t.description as tier_description, t.price_monthly as tier_price_monthly,
          t.features as tier_features, t.limits as tier_limits
        FROM platform_clients c
        LEFT JOIN subscription_tiers t ON c.tier_id = t.id
        ORDER BY ${sql.unsafe(sortColumn)} ${sql.unsafe(sortOrder.toUpperCase())}
        LIMIT ${limit} OFFSET ${offset}
      `
      countRows = await sql`SELECT COUNT(*) as count FROM platform_clients`
    }

    const total = parseInt(countRows[0].count as string, 10)

    return {
      clients: rows.map(mapRowToClient),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  } catch (error) {
    console.error("[clients] Error fetching clients:", error)
    throw new Error("Failed to fetch clients")
  }
}

/**
 * Get a single client by ID
 */
export async function getClientById(clientId: string): Promise<PlatformClient | null> {
  try {
    const rows = await sql`
      SELECT c.*,
        t.name as tier_name, t.display_name as tier_display_name,
        t.description as tier_description, t.price_monthly as tier_price_monthly,
        t.price_yearly as tier_price_yearly, t.currency as tier_currency,
        t.features as tier_features, t.limits as tier_limits,
        t.trial_days as tier_trial_days, t.sort_order as tier_sort_order,
        t.is_active as tier_is_active
      FROM platform_clients c
      LEFT JOIN subscription_tiers t ON c.tier_id = t.id
      WHERE c.id = ${clientId}
    `
    if (rows.length === 0) return null
    return mapRowToClient(rows[0])
  } catch (error) {
    console.error("[clients] Error fetching client by ID:", error)
    throw new Error("Failed to fetch client")
  }
}

/**
 * Get client by subdomain
 */
export async function getClientBySubdomain(subdomain: string): Promise<PlatformClient | null> {
  try {
    const rows = await sql`
      SELECT c.*,
        t.name as tier_name, t.display_name as tier_display_name,
        t.description as tier_description, t.price_monthly as tier_price_monthly,
        t.features as tier_features, t.limits as tier_limits
      FROM platform_clients c
      LEFT JOIN subscription_tiers t ON c.tier_id = t.id
      WHERE c.subdomain = ${subdomain}
    `
    if (rows.length === 0) return null
    return mapRowToClient(rows[0])
  } catch (error) {
    console.error("[clients] Error fetching client by subdomain:", error)
    throw new Error("Failed to fetch client")
  }
}

/**
 * Get client statistics
 */
export async function getClientStats(): Promise<ClientStats> {
  try {
    const now = new Date()
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const rows = await sql`
      SELECT
        COUNT(*) FILTER (WHERE true) as total,
        COUNT(*) FILTER (WHERE status = 'pending_approval') as pending_approval,
        COUNT(*) FILTER (WHERE status = 'trial') as trial,
        COUNT(*) FILTER (WHERE status = 'active') as active,
        COUNT(*) FILTER (WHERE status = 'suspended') as suspended,
        COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled,
        COUNT(*) FILTER (
          WHERE status = 'trial'
          AND trial_ends_at IS NOT NULL
          AND trial_ends_at <= ${weekFromNow.toISOString()}
          AND trial_ends_at > ${now.toISOString()}
        ) as trial_expiring_this_week,
        COUNT(*) FILTER (WHERE created_at >= ${startOfMonth.toISOString()}) as new_this_month
      FROM platform_clients
    `

    return {
      total: parseInt(rows[0].total as string, 10),
      pendingApproval: parseInt(rows[0].pending_approval as string, 10),
      trial: parseInt(rows[0].trial as string, 10),
      active: parseInt(rows[0].active as string, 10),
      suspended: parseInt(rows[0].suspended as string, 10),
      cancelled: parseInt(rows[0].cancelled as string, 10),
      trialExpiringThisWeek: parseInt(rows[0].trial_expiring_this_week as string, 10),
      newThisMonth: parseInt(rows[0].new_this_month as string, 10),
    }
  } catch (error) {
    console.error("[clients] Error fetching client stats:", error)
    // Return zeros if table doesn't exist yet
    return {
      total: 0,
      pendingApproval: 0,
      trial: 0,
      active: 0,
      suspended: 0,
      cancelled: 0,
      trialExpiringThisWeek: 0,
      newThisMonth: 0,
    }
  }
}

// ============================================
// WRITE OPERATIONS
// ============================================

/**
 * Create a new client (typically from access request)
 */
export async function createClient(data: CreateClientInput): Promise<PlatformClient> {
  try {
    const rows = await sql`
      INSERT INTO platform_clients (
        user_id,
        company_name,
        contact_email,
        contact_name,
        phone,
        website,
        request_message,
        requested_tier_id,
        status
      ) VALUES (
        ${data.userId},
        ${data.companyName},
        ${data.contactEmail},
        ${data.contactName || null},
        ${data.phone || null},
        ${data.website || null},
        ${data.requestMessage || null},
        ${data.requestedTierId || null},
        'pending_approval'
      )
      RETURNING *
    `
    return mapRowToClient(rows[0])
  } catch (error) {
    console.error("[clients] Error creating client:", error)
    throw new Error("Failed to create client")
  }
}

/**
 * Update client information
 */
export async function updateClient(
  clientId: string,
  data: UpdateClientInput
): Promise<PlatformClient> {
  try {
    const rows = await sql`
      UPDATE platform_clients SET
        company_name = COALESCE(${data.companyName ?? null}, company_name),
        contact_email = COALESCE(${data.contactEmail ?? null}, contact_email),
        contact_name = COALESCE(${data.contactName ?? null}, contact_name),
        phone = COALESCE(${data.phone ?? null}, phone),
        website = COALESCE(${data.website ?? null}, website),
        tier_id = COALESCE(${data.tierId ?? null}, tier_id),
        subdomain = COALESCE(${data.subdomain ?? null}, subdomain),
        notes = COALESCE(${data.notes ?? null}, notes),
        updated_at = NOW()
      WHERE id = ${clientId}
      RETURNING *
    `
    if (rows.length === 0) {
      throw new Error("Client not found")
    }
    return mapRowToClient(rows[0])
  } catch (error) {
    console.error("[clients] Error updating client:", error)
    if (error instanceof Error) throw error
    throw new Error("Failed to update client")
  }
}

/**
 * Approve a pending client - starts their trial
 */
export async function approveClient(
  clientId: string,
  adminUserId: string,
  tierId?: string
): Promise<PlatformClient> {
  try {
    // Get the tier to determine trial days
    let trialDays = 14
    if (tierId) {
      const tierRows = await sql`
        SELECT trial_days FROM subscription_tiers WHERE id = ${tierId}
      `
      if (tierRows.length > 0) {
        trialDays = tierRows[0].trial_days as number
      }
    }

    const now = new Date()
    const trialEnds = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000)

    const rows = await sql`
      UPDATE platform_clients SET
        status = 'trial',
        tier_id = COALESCE(${tierId ?? null}, requested_tier_id, tier_id),
        trial_started_at = ${now.toISOString()},
        trial_ends_at = ${trialEnds.toISOString()},
        approved_at = ${now.toISOString()},
        approved_by = ${adminUserId},
        updated_at = NOW()
      WHERE id = ${clientId}
        AND status = 'pending_approval'
      RETURNING *
    `

    if (rows.length === 0) {
      throw new Error("Client not found or not in pending status")
    }

    // Log the activity
    await logClientActivity({
      clientId,
      action: 'approved',
      performedBy: adminUserId,
      newValue: { status: 'trial', tierId, trialEnds: trialEnds.toISOString() },
    })

    return mapRowToClient(rows[0])
  } catch (error) {
    console.error("[clients] Error approving client:", error)
    if (error instanceof Error) throw error
    throw new Error("Failed to approve client")
  }
}

/**
 * Suspend a client
 */
export async function suspendClient(
  clientId: string,
  adminUserId: string,
  reason: string
): Promise<PlatformClient> {
  try {
    // Get current status for logging
    const current = await getClientById(clientId)
    if (!current) throw new Error("Client not found")

    const rows = await sql`
      UPDATE platform_clients SET
        status = 'suspended',
        suspended_at = NOW(),
        suspended_by = ${adminUserId},
        suspension_reason = ${reason},
        updated_at = NOW()
      WHERE id = ${clientId}
        AND status NOT IN ('cancelled', 'suspended')
      RETURNING *
    `

    if (rows.length === 0) {
      throw new Error("Client not found or already suspended/cancelled")
    }

    await logClientActivity({
      clientId,
      action: 'suspended',
      performedBy: adminUserId,
      previousValue: { status: current.status },
      newValue: { status: 'suspended', reason },
    })

    return mapRowToClient(rows[0])
  } catch (error) {
    console.error("[clients] Error suspending client:", error)
    if (error instanceof Error) throw error
    throw new Error("Failed to suspend client")
  }
}

/**
 * Reactivate a suspended client
 */
export async function reactivateClient(
  clientId: string,
  adminUserId: string
): Promise<PlatformClient> {
  try {
    const current = await getClientById(clientId)
    if (!current) throw new Error("Client not found")

    // Determine what status to restore to
    let newStatus: ClientStatus = 'active'
    if (current.trialEndsAt && new Date(current.trialEndsAt) > new Date()) {
      newStatus = 'trial'
    }

    const rows = await sql`
      UPDATE platform_clients SET
        status = ${newStatus},
        suspended_at = NULL,
        suspended_by = NULL,
        suspension_reason = NULL,
        updated_at = NOW()
      WHERE id = ${clientId}
        AND status = 'suspended'
      RETURNING *
    `

    if (rows.length === 0) {
      throw new Error("Client not found or not suspended")
    }

    await logClientActivity({
      clientId,
      action: 'reactivated',
      performedBy: adminUserId,
      previousValue: { status: 'suspended' },
      newValue: { status: newStatus },
    })

    return mapRowToClient(rows[0])
  } catch (error) {
    console.error("[clients] Error reactivating client:", error)
    if (error instanceof Error) throw error
    throw new Error("Failed to reactivate client")
  }
}

/**
 * Change client's subscription tier
 */
export async function changeClientTier(
  clientId: string,
  tierId: string,
  adminUserId: string
): Promise<PlatformClient> {
  try {
    const current = await getClientById(clientId)
    if (!current) throw new Error("Client not found")

    const rows = await sql`
      UPDATE platform_clients SET
        tier_id = ${tierId},
        updated_at = NOW()
      WHERE id = ${clientId}
      RETURNING *
    `

    if (rows.length === 0) {
      throw new Error("Client not found")
    }

    await logClientActivity({
      clientId,
      action: 'tier_changed',
      performedBy: adminUserId,
      previousValue: { tierId: current.tierId },
      newValue: { tierId },
    })

    return mapRowToClient(rows[0])
  } catch (error) {
    console.error("[clients] Error changing client tier:", error)
    if (error instanceof Error) throw error
    throw new Error("Failed to change client tier")
  }
}

/**
 * Extend a client's trial period
 */
export async function extendTrial(
  clientId: string,
  days: number,
  adminUserId: string
): Promise<PlatformClient> {
  try {
    const current = await getClientById(clientId)
    if (!current) throw new Error("Client not found")

    // Calculate new trial end date
    const currentEnd = current.trialEndsAt || new Date()
    const baseDate = new Date(Math.max(currentEnd.getTime(), Date.now()))
    const newTrialEnd = new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000)

    const rows = await sql`
      UPDATE platform_clients SET
        status = 'trial',
        trial_ends_at = ${newTrialEnd.toISOString()},
        updated_at = NOW()
      WHERE id = ${clientId}
      RETURNING *
    `

    if (rows.length === 0) {
      throw new Error("Client not found")
    }

    await logClientActivity({
      clientId,
      action: 'trial_extended',
      performedBy: adminUserId,
      previousValue: { trialEndsAt: current.trialEndsAt?.toISOString() },
      newValue: { trialEndsAt: newTrialEnd.toISOString(), daysAdded: days },
    })

    return mapRowToClient(rows[0])
  } catch (error) {
    console.error("[clients] Error extending trial:", error)
    if (error instanceof Error) throw error
    throw new Error("Failed to extend trial")
  }
}

/**
 * Cancel a client
 */
export async function cancelClient(
  clientId: string,
  adminUserId: string,
  reason?: string
): Promise<PlatformClient> {
  try {
    const current = await getClientById(clientId)
    if (!current) throw new Error("Client not found")

    const rows = await sql`
      UPDATE platform_clients SET
        status = 'cancelled',
        cancelled_at = NOW(),
        cancelled_by = ${adminUserId},
        cancellation_reason = ${reason || null},
        updated_at = NOW()
      WHERE id = ${clientId}
      RETURNING *
    `

    if (rows.length === 0) {
      throw new Error("Client not found")
    }

    await logClientActivity({
      clientId,
      action: 'cancelled',
      performedBy: adminUserId,
      previousValue: { status: current.status },
      newValue: { status: 'cancelled', reason },
    })

    return mapRowToClient(rows[0])
  } catch (error) {
    console.error("[clients] Error cancelling client:", error)
    if (error instanceof Error) throw error
    throw new Error("Failed to cancel client")
  }
}

// ============================================
// BULK OPERATIONS
// ============================================

/**
 * Bulk extend trial for multiple clients
 */
export async function bulkExtendTrial(
  clientIds: string[],
  days: number,
  adminUserId: string
): Promise<BulkOperationResult> {
  const result: BulkOperationResult = {
    successful: [],
    failed: [],
    totalProcessed: clientIds.length,
  }

  for (const clientId of clientIds) {
    try {
      await extendTrial(clientId, days, adminUserId)
      result.successful.push(clientId)
    } catch (error) {
      result.failed.push({
        clientId,
        reason: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  return result
}

/**
 * Bulk change status for multiple clients
 */
export async function bulkChangeStatus(
  clientIds: string[],
  status: ClientStatus,
  adminUserId: string,
  reason?: string
): Promise<BulkOperationResult> {
  const result: BulkOperationResult = {
    successful: [],
    failed: [],
    totalProcessed: clientIds.length,
  }

  for (const clientId of clientIds) {
    try {
      if (status === 'suspended') {
        await suspendClient(clientId, adminUserId, reason || 'Bulk suspension')
      } else if (status === 'cancelled') {
        await cancelClient(clientId, adminUserId, reason)
      } else {
        await sql`
          UPDATE platform_clients SET
            status = ${status},
            updated_at = NOW()
          WHERE id = ${clientId}
        `
        await logClientActivity({
          clientId,
          action: 'status_changed',
          performedBy: adminUserId,
          newValue: { status },
        })
      }
      result.successful.push(clientId)
    } catch (error) {
      result.failed.push({
        clientId,
        reason: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  return result
}

/**
 * Bulk change tier for multiple clients
 */
export async function bulkChangeTier(
  clientIds: string[],
  tierId: string,
  adminUserId: string
): Promise<BulkOperationResult> {
  const result: BulkOperationResult = {
    successful: [],
    failed: [],
    totalProcessed: clientIds.length,
  }

  for (const clientId of clientIds) {
    try {
      await changeClientTier(clientId, tierId, adminUserId)
      result.successful.push(clientId)
    } catch (error) {
      result.failed.push({
        clientId,
        reason: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  return result
}

// ============================================
// ACTIVITY LOG
// ============================================

/**
 * Log a client activity
 */
export async function logClientActivity(data: CreateActivityLogInput): Promise<void> {
  try {
    await sql`
      INSERT INTO client_activity_log (
        client_id,
        action,
        performed_by,
        performed_by_email,
        previous_value,
        new_value,
        notes,
        ip_address,
        user_agent
      ) VALUES (
        ${data.clientId},
        ${data.action},
        ${data.performedBy},
        ${data.performedByEmail || null},
        ${data.previousValue ? JSON.stringify(data.previousValue) : null},
        ${data.newValue ? JSON.stringify(data.newValue) : null},
        ${data.notes || null},
        ${data.ipAddress || null},
        ${data.userAgent || null}
      )
    `
  } catch (error) {
    console.error("[clients] Error logging activity:", error)
    // Don't throw - logging shouldn't break the main operation
  }
}

/**
 * Get activity log for a client
 */
export async function getClientActivityLog(
  clientId: string,
  limit = 50
): Promise<ActivityLogEntry[]> {
  try {
    const rows = await sql`
      SELECT * FROM client_activity_log
      WHERE client_id = ${clientId}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `
    return rows.map(mapRowToActivityLog)
  } catch (error) {
    console.error("[clients] Error fetching activity log:", error)
    return []
  }
}
