/**
 * Platform Admin Types
 * Types for managing platform clients, subscription tiers, and admin operations
 */

// ============================================
// CLIENT STATUS & TYPES
// ============================================

export type ClientStatus =
  | 'pending_approval'
  | 'trial'
  | 'active'
  | 'suspended'
  | 'cancelled'

export const CLIENT_STATUS_LABELS: Record<ClientStatus, string> = {
  pending_approval: 'Pending Approval',
  trial: 'Trial',
  active: 'Active',
  suspended: 'Suspended',
  cancelled: 'Cancelled',
}

export const CLIENT_STATUS_COLORS: Record<ClientStatus, string> = {
  pending_approval: 'bg-yellow-100 text-yellow-800',
  trial: 'bg-blue-100 text-blue-800',
  active: 'bg-green-100 text-green-800',
  suspended: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800',
}

// ============================================
// SUBSCRIPTION TIER TYPES
// ============================================

export interface TierLimits {
  storage_gb: number      // -1 = unlimited
  pages: number           // -1 = unlimited
  posts: number           // -1 = unlimited
  custom_domains: number  // -1 = unlimited
  team_members: number    // -1 = unlimited
}

export interface SubscriptionTier {
  id: string
  name: string
  displayName: string
  description: string | null
  priceMonthly: number
  priceYearly: number | null
  currency: string
  features: string[]
  limits: TierLimits
  trialDays: number
  sortOrder: number
  isActive: boolean
  stripePriceIdMonthly: string | null
  stripePriceIdYearly: string | null
  stripeProductId: string | null
  createdAt: Date
  updatedAt: Date
}

export interface CreateTierInput {
  name: string
  displayName: string
  description?: string
  priceMonthly: number
  priceYearly?: number
  currency?: string
  features: string[]
  limits: TierLimits
  trialDays?: number
  sortOrder?: number
  isActive?: boolean
}

export interface UpdateTierInput {
  displayName?: string
  description?: string
  priceMonthly?: number
  priceYearly?: number
  currency?: string
  features?: string[]
  limits?: Partial<TierLimits>
  trialDays?: number
  sortOrder?: number
  isActive?: boolean
  stripePriceIdMonthly?: string
  stripePriceIdYearly?: string
  stripeProductId?: string
}

// ============================================
// PLATFORM CLIENT TYPES
// ============================================

export interface PlatformClient {
  id: string
  userId: string
  companyName: string
  contactEmail: string
  contactName: string | null
  phone: string | null
  website: string | null
  status: ClientStatus
  tierId: string | null
  tier?: SubscriptionTier
  trialStartedAt: Date | null
  trialEndsAt: Date | null
  stripeCustomerId: string | null
  stripeSubscriptionId: string | null
  subdomain: string | null
  cmsProvisioned: boolean
  cmsProvisionedAt: Date | null
  cmsInstanceUrl: string | null
  notes: string | null
  requestMessage: string | null
  requestedTierId: string | null
  requestedTier?: SubscriptionTier
  createdAt: Date
  updatedAt: Date
  approvedAt: Date | null
  approvedBy: string | null
  suspendedAt: Date | null
  suspendedBy: string | null
  suspensionReason: string | null
  cancelledAt: Date | null
  cancelledBy: string | null
  cancellationReason: string | null
}

export interface CreateClientInput {
  userId: string
  companyName: string
  contactEmail: string
  contactName?: string
  phone?: string
  website?: string
  requestMessage?: string
  requestedTierId?: string
}

export interface UpdateClientInput {
  companyName?: string
  contactEmail?: string
  contactName?: string
  phone?: string
  website?: string
  tierId?: string
  subdomain?: string
  notes?: string
}

// ============================================
// CLIENT FILTERS & STATS
// ============================================

export interface ClientFilters {
  search?: string
  status?: ClientStatus | 'all'
  tierId?: string | 'all'
  page?: number
  limit?: number
  sortBy?: 'createdAt' | 'companyName' | 'status' | 'trialEndsAt' | 'updatedAt'
  sortOrder?: 'asc' | 'desc'
}

export interface ClientStats {
  total: number
  pendingApproval: number
  trial: number
  active: number
  suspended: number
  cancelled: number
  trialExpiringThisWeek: number
  newThisMonth: number
}

export interface PaginatedClients {
  clients: PlatformClient[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// ============================================
// ACTIVITY LOG TYPES
// ============================================

export type ActivityAction =
  | 'created'
  | 'approved'
  | 'status_changed'
  | 'tier_changed'
  | 'trial_extended'
  | 'suspended'
  | 'reactivated'
  | 'cancelled'
  | 'note_added'
  | 'subdomain_assigned'
  | 'cms_provisioned'
  | 'info_updated'

export interface ActivityLogEntry {
  id: string
  clientId: string
  action: ActivityAction
  performedBy: string
  performedByEmail: string | null
  previousValue: Record<string, unknown> | null
  newValue: Record<string, unknown> | null
  notes: string | null
  ipAddress: string | null
  userAgent: string | null
  createdAt: Date
}

export interface CreateActivityLogInput {
  clientId: string
  action: ActivityAction
  performedBy: string
  performedByEmail?: string
  previousValue?: Record<string, unknown>
  newValue?: Record<string, unknown>
  notes?: string
  ipAddress?: string
  userAgent?: string
}

// ============================================
// BULK OPERATION TYPES
// ============================================

export type BulkAction =
  | 'extend_trial'
  | 'change_status'
  | 'change_tier'
  | 'suspend'
  | 'reactivate'

export interface BulkOperationResult {
  successful: string[]  // client IDs
  failed: Array<{
    clientId: string
    reason: string
  }>
  totalProcessed: number
}

export interface BulkExtendTrialInput {
  clientIds: string[]
  days: number
}

export interface BulkChangeStatusInput {
  clientIds: string[]
  status: ClientStatus
  reason?: string
}

export interface BulkChangeTierInput {
  clientIds: string[]
  tierId: string
}

// ============================================
// SERVER ACTION RESULT TYPES
// ============================================

export interface ActionResult<T = unknown> {
  success: boolean
  message: string
  data?: T
  error?: string
}

export interface FormState {
  success: boolean
  message: string
  errors?: Record<string, string[]>
}

// ============================================
// UTILITY TYPES
// ============================================

export function isTrialExpiringSoon(client: PlatformClient, daysThreshold = 7): boolean {
  if (client.status !== 'trial' || !client.trialEndsAt) return false
  const now = new Date()
  const trialEnd = new Date(client.trialEndsAt)
  const daysRemaining = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  return daysRemaining <= daysThreshold && daysRemaining > 0
}

export function isTrialExpired(client: PlatformClient): boolean {
  if (client.status !== 'trial' || !client.trialEndsAt) return false
  return new Date(client.trialEndsAt) < new Date()
}

export function getTrialDaysRemaining(client: PlatformClient): number | null {
  if (!client.trialEndsAt) return null
  const now = new Date()
  const trialEnd = new Date(client.trialEndsAt)
  return Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
}

export function formatLimit(value: number): string {
  if (value === -1) return 'Unlimited'
  return value.toString()
}
