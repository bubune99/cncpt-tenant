"use server"

/**
 * Admin Server Actions
 * Form actions for the admin panel
 */

import { revalidatePath } from "next/cache"
import {
  approveClient,
  suspendClient,
  reactivateClient,
  changeClientTier,
  extendTrial,
  cancelClient,
  updateClient,
  bulkExtendTrial,
  bulkChangeStatus,
  bulkChangeTier,
} from "@/lib/clients"
import {
  createTier,
  updateTier,
  deleteTier,
  toggleTierActive,
} from "@/lib/tiers"
import type { FormState, ClientStatus } from "@/types/admin"

// ============================================
// CLIENT ACTIONS
// ============================================

/**
 * Approve a pending client
 */
export async function approveClientAction(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  try {
    const clientId = formData.get("clientId") as string
    const adminUserId = formData.get("adminUserId") as string
    const tierId = formData.get("tierId") as string | null

    if (!clientId || !adminUserId) {
      return { success: false, message: "Missing required fields" }
    }

    await approveClient(clientId, adminUserId, tierId || undefined)
    revalidatePath("/admin")
    revalidatePath("/admin/clients")

    return { success: true, message: "Client approved successfully" }
  } catch (error) {
    console.error("[admin-actions] Error approving client:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to approve client",
    }
  }
}

/**
 * Suspend a client
 */
export async function suspendClientAction(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  try {
    const clientId = formData.get("clientId") as string
    const adminUserId = formData.get("adminUserId") as string
    const reason = formData.get("reason") as string

    if (!clientId || !adminUserId) {
      return { success: false, message: "Missing required fields" }
    }

    await suspendClient(clientId, adminUserId, reason || "No reason provided")
    revalidatePath("/admin")
    revalidatePath("/admin/clients")
    revalidatePath(`/admin/clients/${clientId}`)

    return { success: true, message: "Client suspended successfully" }
  } catch (error) {
    console.error("[admin-actions] Error suspending client:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to suspend client",
    }
  }
}

/**
 * Reactivate a suspended client
 */
export async function reactivateClientAction(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  try {
    const clientId = formData.get("clientId") as string
    const adminUserId = formData.get("adminUserId") as string

    if (!clientId || !adminUserId) {
      return { success: false, message: "Missing required fields" }
    }

    await reactivateClient(clientId, adminUserId)
    revalidatePath("/admin")
    revalidatePath("/admin/clients")
    revalidatePath(`/admin/clients/${clientId}`)

    return { success: true, message: "Client reactivated successfully" }
  } catch (error) {
    console.error("[admin-actions] Error reactivating client:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to reactivate client",
    }
  }
}

/**
 * Extend a client's trial
 */
export async function extendTrialAction(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  try {
    const clientId = formData.get("clientId") as string
    const adminUserId = formData.get("adminUserId") as string
    const days = parseInt(formData.get("days") as string, 10)

    if (!clientId || !adminUserId || isNaN(days) || days <= 0) {
      return { success: false, message: "Missing or invalid fields" }
    }

    await extendTrial(clientId, days, adminUserId)
    revalidatePath("/admin")
    revalidatePath("/admin/clients")
    revalidatePath(`/admin/clients/${clientId}`)

    return { success: true, message: `Trial extended by ${days} days` }
  } catch (error) {
    console.error("[admin-actions] Error extending trial:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to extend trial",
    }
  }
}

/**
 * Change a client's tier
 */
export async function changeClientTierAction(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  try {
    const clientId = formData.get("clientId") as string
    const adminUserId = formData.get("adminUserId") as string
    const tierId = formData.get("tierId") as string

    if (!clientId || !adminUserId || !tierId) {
      return { success: false, message: "Missing required fields" }
    }

    await changeClientTier(clientId, tierId, adminUserId)
    revalidatePath("/admin")
    revalidatePath("/admin/clients")
    revalidatePath(`/admin/clients/${clientId}`)

    return { success: true, message: "Client tier updated successfully" }
  } catch (error) {
    console.error("[admin-actions] Error changing tier:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to change tier",
    }
  }
}

/**
 * Cancel a client
 */
export async function cancelClientAction(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  try {
    const clientId = formData.get("clientId") as string
    const adminUserId = formData.get("adminUserId") as string
    const reason = formData.get("reason") as string

    if (!clientId || !adminUserId) {
      return { success: false, message: "Missing required fields" }
    }

    await cancelClient(clientId, adminUserId, reason || undefined)
    revalidatePath("/admin")
    revalidatePath("/admin/clients")
    revalidatePath(`/admin/clients/${clientId}`)

    return { success: true, message: "Client cancelled successfully" }
  } catch (error) {
    console.error("[admin-actions] Error cancelling client:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to cancel client",
    }
  }
}

/**
 * Update client information
 */
export async function updateClientAction(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  try {
    const clientId = formData.get("clientId") as string

    if (!clientId) {
      return { success: false, message: "Missing client ID" }
    }

    const data = {
      companyName: formData.get("companyName") as string | undefined,
      contactEmail: formData.get("contactEmail") as string | undefined,
      contactName: formData.get("contactName") as string | undefined,
      phone: formData.get("phone") as string | undefined,
      website: formData.get("website") as string | undefined,
      notes: formData.get("notes") as string | undefined,
    }

    // Filter out undefined values
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== undefined && v !== null && v !== "")
    )

    await updateClient(clientId, cleanData)
    revalidatePath("/admin/clients")
    revalidatePath(`/admin/clients/${clientId}`)

    return { success: true, message: "Client updated successfully" }
  } catch (error) {
    console.error("[admin-actions] Error updating client:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to update client",
    }
  }
}

// ============================================
// BULK ACTIONS
// ============================================

/**
 * Bulk action on multiple clients
 */
export async function bulkClientAction(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  try {
    const action = formData.get("action") as string
    const adminUserId = formData.get("adminUserId") as string
    const clientIdsJson = formData.get("clientIds") as string

    if (!action || !adminUserId || !clientIdsJson) {
      return { success: false, message: "Missing required fields" }
    }

    const clientIds = JSON.parse(clientIdsJson) as string[]

    if (clientIds.length === 0) {
      return { success: false, message: "No clients selected" }
    }

    let result

    switch (action) {
      case "extend_trial": {
        const days = parseInt(formData.get("days") as string, 10)
        if (isNaN(days) || days <= 0) {
          return { success: false, message: "Invalid number of days" }
        }
        result = await bulkExtendTrial(clientIds, days, adminUserId)
        break
      }
      case "change_status": {
        const status = formData.get("status") as ClientStatus
        const reason = formData.get("reason") as string
        result = await bulkChangeStatus(clientIds, status, adminUserId, reason)
        break
      }
      case "change_tier": {
        const tierId = formData.get("tierId") as string
        if (!tierId) {
          return { success: false, message: "No tier selected" }
        }
        result = await bulkChangeTier(clientIds, tierId, adminUserId)
        break
      }
      default:
        return { success: false, message: "Unknown action" }
    }

    revalidatePath("/admin")
    revalidatePath("/admin/clients")

    const successCount = result.successful.length
    const failCount = result.failed.length

    if (failCount === 0) {
      return { success: true, message: `Successfully updated ${successCount} clients` }
    } else if (successCount === 0) {
      return { success: false, message: `Failed to update all ${failCount} clients` }
    } else {
      return {
        success: true,
        message: `Updated ${successCount} clients, ${failCount} failed`,
      }
    }
  } catch (error) {
    console.error("[admin-actions] Error in bulk action:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to perform bulk action",
    }
  }
}

// ============================================
// TIER ACTIONS
// ============================================

/**
 * Create a new subscription tier
 */
export async function createTierAction(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  try {
    const name = formData.get("name") as string
    const displayName = formData.get("displayName") as string
    const description = formData.get("description") as string
    const priceMonthly = parseFloat(formData.get("priceMonthly") as string)
    const priceYearly = formData.get("priceYearly")
      ? parseFloat(formData.get("priceYearly") as string)
      : undefined
    const trialDays = parseInt(formData.get("trialDays") as string, 10) || 14
    const featuresJson = formData.get("features") as string
    const limitsJson = formData.get("limits") as string

    if (!name || !displayName || isNaN(priceMonthly)) {
      return { success: false, message: "Missing required fields" }
    }

    const features = featuresJson ? JSON.parse(featuresJson) : []
    const limits = limitsJson ? JSON.parse(limitsJson) : {
      storage_gb: 5,
      pages: 10,
      posts: 100,
      custom_domains: 1,
      team_members: 1,
    }

    await createTier({
      name,
      displayName,
      description,
      priceMonthly,
      priceYearly,
      trialDays,
      features,
      limits,
    })

    revalidatePath("/admin/tiers")

    return { success: true, message: "Tier created successfully" }
  } catch (error) {
    console.error("[admin-actions] Error creating tier:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to create tier",
    }
  }
}

/**
 * Update a subscription tier
 */
export async function updateTierAction(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  try {
    const tierId = formData.get("tierId") as string

    if (!tierId) {
      return { success: false, message: "Missing tier ID" }
    }

    const displayName = formData.get("displayName") as string | undefined
    const description = formData.get("description") as string | undefined
    const priceMonthlyStr = formData.get("priceMonthly") as string
    const priceYearlyStr = formData.get("priceYearly") as string
    const trialDaysStr = formData.get("trialDays") as string
    const featuresJson = formData.get("features") as string
    const limitsJson = formData.get("limits") as string
    const isActiveStr = formData.get("isActive") as string

    const data: Record<string, unknown> = {}

    if (displayName) data.displayName = displayName
    if (description !== undefined) data.description = description
    if (priceMonthlyStr) data.priceMonthly = parseFloat(priceMonthlyStr)
    if (priceYearlyStr) data.priceYearly = parseFloat(priceYearlyStr)
    if (trialDaysStr) data.trialDays = parseInt(trialDaysStr, 10)
    if (featuresJson) data.features = JSON.parse(featuresJson)
    if (limitsJson) data.limits = JSON.parse(limitsJson)
    if (isActiveStr !== null) data.isActive = isActiveStr === "true"

    await updateTier(tierId, data)
    revalidatePath("/admin/tiers")

    return { success: true, message: "Tier updated successfully" }
  } catch (error) {
    console.error("[admin-actions] Error updating tier:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to update tier",
    }
  }
}

/**
 * Delete a subscription tier
 */
export async function deleteTierAction(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  try {
    const tierId = formData.get("tierId") as string

    if (!tierId) {
      return { success: false, message: "Missing tier ID" }
    }

    await deleteTier(tierId)
    revalidatePath("/admin/tiers")

    return { success: true, message: "Tier deleted successfully" }
  } catch (error) {
    console.error("[admin-actions] Error deleting tier:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to delete tier",
    }
  }
}

/**
 * Toggle tier active status
 */
export async function toggleTierActiveAction(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  try {
    const tierId = formData.get("tierId") as string

    if (!tierId) {
      return { success: false, message: "Missing tier ID" }
    }

    await toggleTierActive(tierId)
    revalidatePath("/admin/tiers")

    return { success: true, message: "Tier status toggled successfully" }
  } catch (error) {
    console.error("[admin-actions] Error toggling tier:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to toggle tier status",
    }
  }
}
