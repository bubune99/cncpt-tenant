import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/neon"
import {
  syncUserToDb,
  syncUserToCms,
  handleUserDeletion,
  recordSignIn,
} from "@/lib/auth-sync"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

// =============================================================================
// TYPES
// =============================================================================

interface StackAuthWebhookPayload {
  type: string
  data: {
    id: string
    primary_email: string | null
    primary_email_verified: boolean
    display_name: string | null
    profile_image_url: string | null
    signed_up_at_millis: number
    has_password: boolean
    client_metadata: Record<string, unknown>
    server_metadata: Record<string, unknown>
    // For update events, may include previous data
    [key: string]: unknown
  }
}

// =============================================================================
// WEBHOOK SIGNATURE VERIFICATION
// =============================================================================

/**
 * Verify the Stack Auth webhook signature.
 *
 * Stack Auth uses SVIX for webhook delivery, which signs payloads with
 * HMAC-SHA256. The signature is in the `svix-signature` header.
 *
 * If STACK_AUTH_WEBHOOK_SECRET is not set, verification is skipped
 * (development mode). In production, always set this env var.
 */
async function verifyWebhookSignature(
  request: NextRequest,
  body: string
): Promise<boolean> {
  const secret = process.env.STACK_AUTH_WEBHOOK_SECRET

  // In development, skip verification if no secret is configured
  if (!secret) {
    console.warn(
      "[stack-auth-webhook] No STACK_AUTH_WEBHOOK_SECRET set — skipping signature verification. Set this in production!"
    )
    return true
  }

  const svixId = request.headers.get("svix-id")
  const svixTimestamp = request.headers.get("svix-timestamp")
  const svixSignature = request.headers.get("svix-signature")

  if (!svixId || !svixTimestamp || !svixSignature) {
    console.error("[stack-auth-webhook] Missing svix headers")
    return false
  }

  // Check timestamp is within 5 minutes (replay protection)
  const timestamp = parseInt(svixTimestamp, 10)
  const now = Math.floor(Date.now() / 1000)
  if (Math.abs(now - timestamp) > 300) {
    console.error("[stack-auth-webhook] Timestamp too old or too far in the future")
    return false
  }

  try {
    // SVIX signs: `${svixId}.${svixTimestamp}.${body}`
    const signedContent = `${svixId}.${svixTimestamp}.${body}`

    // Secret is base64 encoded with "whsec_" prefix
    const secretBytes = Uint8Array.from(
      atob(secret.startsWith("whsec_") ? secret.slice(6) : secret),
      (c) => c.charCodeAt(0)
    )

    const key = await crypto.subtle.importKey(
      "raw",
      secretBytes,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    )

    const signatureBytes = await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(signedContent)
    )

    const expectedSignature = btoa(
      String.fromCharCode(...new Uint8Array(signatureBytes))
    )

    // svix-signature can contain multiple signatures separated by spaces
    // Each is prefixed with "v1,"
    const signatures = svixSignature.split(" ")
    for (const sig of signatures) {
      const sigValue = sig.startsWith("v1,") ? sig.slice(3) : sig
      if (sigValue === expectedSignature) {
        return true
      }
    }

    console.error("[stack-auth-webhook] Signature mismatch")
    return false
  } catch (error) {
    console.error("[stack-auth-webhook] Signature verification error:", error)
    return false
  }
}

// =============================================================================
// IDEMPOTENCY
// =============================================================================

/**
 * Check if a webhook event has already been processed.
 * Uses the webhook_events table for deduplication.
 */
async function isEventProcessed(eventId: string): Promise<boolean> {
  try {
    const rows = await sql`
      SELECT 1 FROM webhook_events WHERE event_id = ${eventId} AND status = 'processed'
    `
    return rows.length > 0
  } catch {
    // Table might not exist yet — treat as not processed
    return false
  }
}

/**
 * Mark a webhook event as processed.
 */
async function markEventProcessed(
  eventId: string,
  eventType: string,
  error?: string
): Promise<void> {
  try {
    await sql`
      INSERT INTO webhook_events (event_id, event_type, status, error_message)
      VALUES (
        ${eventId},
        ${eventType},
        ${error ? "failed" : "processed"},
        ${error || null}
      )
      ON CONFLICT (event_id) DO UPDATE SET
        status = EXCLUDED.status,
        error_message = EXCLUDED.error_message,
        processed_at = NOW()
    `
  } catch (err) {
    console.error("[stack-auth-webhook] Failed to mark event:", err)
  }
}

// =============================================================================
// EVENT HANDLERS
// =============================================================================

async function handleUserCreated(data: StackAuthWebhookPayload["data"]): Promise<void> {
  console.log(`[stack-auth-webhook] user.created: ${data.id} (${data.primary_email})`)

  // Sync to platform users table
  await syncUserToDb({
    id: data.id,
    primaryEmail: data.primary_email,
    displayName: data.display_name,
    profileImageUrl: data.profile_image_url,
    signedUpAt: new Date(data.signed_up_at_millis),
  })

  // Sync to CMS User model
  try {
    await syncUserToCms({
      id: data.id,
      primaryEmail: data.primary_email,
      displayName: data.display_name,
      profileImageUrl: data.profile_image_url,
      signedUpAt: new Date(data.signed_up_at_millis),
    })
  } catch (error) {
    // CMS sync failure is non-fatal — the use-auth hook will retry on next login
    console.warn(
      `[stack-auth-webhook] CMS sync failed for new user ${data.id}:`,
      error instanceof Error ? error.message : error
    )
  }

  // Initialize AI credit balance (auto-creates on first access)
  try {
    const { getUserCreditBalance } = await import("@/lib/ai-credits")
    await getUserCreditBalance(data.id)
  } catch (error) {
    console.warn(`[stack-auth-webhook] Credit init failed for ${data.id}:`, error)
  }
}

async function handleUserUpdated(data: StackAuthWebhookPayload["data"]): Promise<void> {
  console.log(`[stack-auth-webhook] user.updated: ${data.id} (${data.primary_email})`)

  // Update platform users table
  await syncUserToDb({
    id: data.id,
    primaryEmail: data.primary_email,
    displayName: data.display_name,
    profileImageUrl: data.profile_image_url,
    signedUpAt: new Date(data.signed_up_at_millis),
  })

  // Update CMS User model
  try {
    await syncUserToCms({
      id: data.id,
      primaryEmail: data.primary_email,
      displayName: data.display_name,
      profileImageUrl: data.profile_image_url,
    })
  } catch (error) {
    console.warn(
      `[stack-auth-webhook] CMS sync failed for updated user ${data.id}:`,
      error instanceof Error ? error.message : error
    )
  }
}

async function handleUserDeleted(data: StackAuthWebhookPayload["data"]): Promise<void> {
  console.log(`[stack-auth-webhook] user.deleted: ${data.id}`)

  await handleUserDeletion(data.id)

  // Also handle CMS User — soft delete by removing stackAuthId link
  try {
    const { prisma } = await import("@/lib/cms/db")
    const cmsUser = await prisma.user.findUnique({
      where: { stackAuthId: data.id },
    })
    if (cmsUser) {
      await prisma.user.update({
        where: { stackAuthId: data.id },
        data: { stackAuthId: null },
      })
      console.log(`[stack-auth-webhook] CMS user ${cmsUser.id} unlinked from deleted Stack Auth account`)
    }
  } catch (error) {
    console.warn(
      `[stack-auth-webhook] CMS cleanup failed for deleted user ${data.id}:`,
      error instanceof Error ? error.message : error
    )
  }
}

async function handleUserSignedIn(
  data: StackAuthWebhookPayload["data"],
  request: NextRequest
): Promise<void> {
  console.log(`[stack-auth-webhook] user.signed_in: ${data.id}`)

  const ipAddress =
    request.headers.get("x-forwarded-for")?.split(",")[0] ||
    request.headers.get("x-real-ip") ||
    undefined

  // Ensure user exists locally (JIT provisioning)
  try {
    await syncUserToDb({
      id: data.id,
      primaryEmail: data.primary_email,
      displayName: data.display_name,
      profileImageUrl: data.profile_image_url,
      signedUpAt: new Date(data.signed_up_at_millis),
    })
  } catch (error) {
    console.error(`[stack-auth-webhook] Failed to ensure user ${data.id}:`, error)
  }

  // Record the sign-in
  await recordSignIn(data.id, ipAddress)

  // Apply any pending credit grants
  try {
    const { applyPendingCreditGrants } = await import("@/lib/ai-credits")
    const result = await applyPendingCreditGrants(data.id)
    if (result.applied > 0) {
      console.log(
        `[stack-auth-webhook] Applied ${result.applied} credit grants (${result.totalCredits} credits) for user ${data.id}`
      )
    }
  } catch (error) {
    console.warn(`[stack-auth-webhook] Credit grant application failed:`, error)
  }
}

// =============================================================================
// ROUTE HANDLER
// =============================================================================

export async function POST(request: NextRequest) {
  let rawBody: string
  let payload: StackAuthWebhookPayload

  try {
    rawBody = await request.text()
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    )
  }

  // Verify webhook signature
  const isValid = await verifyWebhookSignature(request, rawBody)
  if (!isValid) {
    return NextResponse.json(
      { error: "Invalid webhook signature" },
      { status: 401 }
    )
  }

  // Extract event info
  const eventType = payload.type
  const eventId =
    request.headers.get("svix-id") ||
    `${eventType}-${payload.data?.id}-${Date.now()}`

  // Check idempotency
  if (await isEventProcessed(eventId)) {
    console.log(`[stack-auth-webhook] Event ${eventId} already processed, skipping`)
    return NextResponse.json({ received: true, duplicate: true })
  }

  console.log(
    `[stack-auth-webhook] Processing event: ${eventType} (${eventId})`
  )

  let error: string | undefined

  try {
    switch (eventType) {
      case "user.created":
        await handleUserCreated(payload.data)
        break

      case "user.updated":
        await handleUserUpdated(payload.data)
        break

      case "user.deleted":
        await handleUserDeleted(payload.data)
        break

      case "user.signed_in":
        await handleUserSignedIn(payload.data, request)
        break

      default:
        console.log(`[stack-auth-webhook] Unhandled event type: ${eventType}`)
    }
  } catch (err) {
    error = err instanceof Error ? err.message : "Unknown error"
    console.error(`[stack-auth-webhook] Error processing ${eventType}:`, err)
  }

  // Record event for idempotency tracking
  await markEventProcessed(eventId, eventType, error)

  if (error) {
    return NextResponse.json(
      { received: true, error },
      { status: 500 }
    )
  }

  return NextResponse.json({ received: true })
}

/**
 * GET handler — health check for the webhook endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    endpoint: "/api/webhooks/stack-auth",
    events: [
      "user.created",
      "user.updated",
      "user.deleted",
      "user.signed_in",
    ],
    signatureVerification: !!process.env.STACK_AUTH_WEBHOOK_SECRET,
  })
}
