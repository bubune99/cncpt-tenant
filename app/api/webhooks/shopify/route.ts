/**
 * Shopify Webhook Handler
 *
 * Receives webhook events from Shopify, verifies HMAC signature,
 * and processes product/order events via the sync utility.
 *
 * POST /api/webhooks/shopify
 *
 * Shopify sends webhooks with:
 * - X-Shopify-Topic: the event topic (e.g., "products/create")
 * - X-Shopify-Hmac-Sha256: HMAC signature for verification
 * - X-Shopify-Shop-Domain: the shop domain
 * - X-Shopify-API-Version: the API version
 *
 * Environment: SHOPIFY_WEBHOOK_SECRET
 */

import { NextRequest, NextResponse } from "next/server"
import { createHmac, timingSafeEqual } from "crypto"

export const dynamic = "force-dynamic"

/* ------------------------------------------------------------------ */
/*  HMAC Verification                                                  */
/* ------------------------------------------------------------------ */

function verifyShopifyHmac(
  rawBody: string,
  hmacHeader: string,
  secret: string
): boolean {
  try {
    const computedHmac = createHmac("sha256", secret)
      .update(rawBody, "utf8")
      .digest("base64")

    const computedBuffer = Buffer.from(computedHmac, "base64")
    const receivedBuffer = Buffer.from(hmacHeader, "base64")

    if (computedBuffer.length !== receivedBuffer.length) {
      return false
    }

    return timingSafeEqual(computedBuffer, receivedBuffer)
  } catch {
    return false
  }
}

/* ------------------------------------------------------------------ */
/*  Shopify Webhook Payload Types                                      */
/* ------------------------------------------------------------------ */

interface ShopifyWebhookProduct {
  id: number
  admin_graphql_api_id: string
  title: string
  handle: string
  status: string
  variants: {
    id: number
    admin_graphql_api_id: string
    title: string
    price: string
    sku: string | null
  }[]
}

interface ShopifyWebhookOrder {
  id: number
  admin_graphql_api_id: string
  name: string
  email: string
  financial_status: string
  fulfillment_status: string | null
  total_price: string
  currency: string
  created_at: string
  updated_at: string
  line_items: {
    id: number
    title: string
    quantity: number
    price: string
    variant_id: number | null
  }[]
}

/* ------------------------------------------------------------------ */
/*  Topic Handlers                                                     */
/* ------------------------------------------------------------------ */

async function handleProductCreate(payload: ShopifyWebhookProduct) {
  const { syncProductById } = await import(
    "@/lib/cms/commerce/sync/shopify-sync"
  )
  const result = await syncProductById(payload.admin_graphql_api_id)
  console.log(
    `[shopify-webhook] products/create: ${payload.title} (${payload.admin_graphql_api_id}) -> ${result.action}${result.error ? ` (${result.error})` : ""}`
  )
}

async function handleProductUpdate(payload: ShopifyWebhookProduct) {
  const { syncProductById } = await import(
    "@/lib/cms/commerce/sync/shopify-sync"
  )
  const result = await syncProductById(payload.admin_graphql_api_id)
  console.log(
    `[shopify-webhook] products/update: ${payload.title} (${payload.admin_graphql_api_id}) -> ${result.action}${result.error ? ` (${result.error})` : ""}`
  )
}

async function handleProductDelete(payload: ShopifyWebhookProduct) {
  const { markProductDeleted } = await import(
    "@/lib/cms/commerce/sync/shopify-sync"
  )
  const deleted = await markProductDeleted(payload.admin_graphql_api_id)
  console.log(
    `[shopify-webhook] products/delete: ${payload.admin_graphql_api_id} -> ${deleted ? "archived" : "not found"}`
  )
}

async function handleOrderCreate(payload: ShopifyWebhookOrder) {
  // Foundation: log the order reference. Full order sync is deferred.
  console.log(
    `[shopify-webhook] orders/create: ${payload.name} (${payload.admin_graphql_api_id}) ` +
      `status=${payload.financial_status} total=${payload.total_price} ${payload.currency}`
  )

  // Future: Create a local Order record mapped via Shopify order GID
  // For now, store a reference in the Setting table as a simple audit trail
  try {
    const { prisma } = await import("@/lib/cms/db")
    await prisma.setting.upsert({
      where: {
        tenantId_key: {
          tenantId: 0,
          key: `shopify.order.${payload.admin_graphql_api_id}`,
        },
      },
      update: {
        value: JSON.stringify({
          name: payload.name,
          email: payload.email,
          financialStatus: payload.financial_status,
          fulfillmentStatus: payload.fulfillment_status,
          totalPrice: payload.total_price,
          currency: payload.currency,
          updatedAt: payload.updated_at,
        }),
      },
      create: {
        key: `shopify.order.${payload.admin_graphql_api_id}`,
        value: JSON.stringify({
          name: payload.name,
          email: payload.email,
          financialStatus: payload.financial_status,
          fulfillmentStatus: payload.fulfillment_status,
          totalPrice: payload.total_price,
          currency: payload.currency,
          createdAt: payload.created_at,
        }),
        group: "commerce",
      },
    })
  } catch (error) {
    console.error("[shopify-webhook] Failed to store order reference:", error)
  }
}

async function handleOrderUpdated(payload: ShopifyWebhookOrder) {
  console.log(
    `[shopify-webhook] orders/updated: ${payload.name} (${payload.admin_graphql_api_id}) ` +
      `status=${payload.financial_status} fulfillment=${payload.fulfillment_status}`
  )

  // Update the stored order reference
  try {
    const { prisma } = await import("@/lib/cms/db")
    const key = `shopify.order.${payload.admin_graphql_api_id}`
    const existing = await prisma.setting.findFirst({ where: { key } })
    if (existing) {
      await prisma.setting.update({
        where: { id: existing.id },
        data: {
          value: JSON.stringify({
            name: payload.name,
            email: payload.email,
            financialStatus: payload.financial_status,
            fulfillmentStatus: payload.fulfillment_status,
            totalPrice: payload.total_price,
            currency: payload.currency,
            updatedAt: payload.updated_at,
          }),
        },
      })
    }
  } catch (error) {
    console.error("[shopify-webhook] Failed to update order reference:", error)
  }
}

function handleAppUninstalled(shopDomain: string) {
  console.warn(
    `[shopify-webhook] app/uninstalled: Shopify app was uninstalled from ${shopDomain}. ` +
      `Admin API access has been revoked. Manual cleanup may be required.`
  )
  // Future: Clear cached tokens, disable sync, notify admin
}

/* ------------------------------------------------------------------ */
/*  POST Handler                                                       */
/* ------------------------------------------------------------------ */

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.SHOPIFY_WEBHOOK_SECRET

  if (!webhookSecret) {
    console.error(
      "[shopify-webhook] SHOPIFY_WEBHOOK_SECRET not configured"
    )
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    )
  }

  // Read raw body for HMAC verification
  const rawBody = await request.text()

  // Extract Shopify headers
  const hmacHeader = request.headers.get("x-shopify-hmac-sha256")
  const topic = request.headers.get("x-shopify-topic")
  const shopDomain = request.headers.get("x-shopify-shop-domain") ?? "unknown"

  if (!hmacHeader) {
    return NextResponse.json(
      { error: "Missing HMAC signature" },
      { status: 401 }
    )
  }

  if (!topic) {
    return NextResponse.json(
      { error: "Missing webhook topic" },
      { status: 400 }
    )
  }

  // Verify HMAC signature
  if (!verifyShopifyHmac(rawBody, hmacHeader, webhookSecret)) {
    console.error(
      `[shopify-webhook] HMAC verification failed for topic=${topic} shop=${shopDomain}`
    )
    return NextResponse.json(
      { error: "Invalid HMAC signature" },
      { status: 401 }
    )
  }

  // Parse the payload
  let payload: unknown
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload" },
      { status: 400 }
    )
  }

  console.log(
    `[shopify-webhook] Received ${topic} from ${shopDomain}`
  )

  // Respond immediately with 200, then process asynchronously
  // Shopify expects a response within 5 seconds
  // We use waitUntil-style processing via a non-blocking promise
  const processingPromise = (async () => {
    try {
      switch (topic) {
        case "products/create":
          await handleProductCreate(payload as ShopifyWebhookProduct)
          break

        case "products/update":
          await handleProductUpdate(payload as ShopifyWebhookProduct)
          break

        case "products/delete":
          await handleProductDelete(payload as ShopifyWebhookProduct)
          break

        case "orders/create":
          await handleOrderCreate(payload as ShopifyWebhookOrder)
          break

        case "orders/updated":
          await handleOrderUpdated(payload as ShopifyWebhookOrder)
          break

        case "app/uninstalled":
          handleAppUninstalled(shopDomain)
          break

        default:
          console.log(
            `[shopify-webhook] Unhandled topic: ${topic}`
          )
      }
    } catch (error) {
      console.error(
        `[shopify-webhook] Error processing ${topic}:`,
        error
      )
    }
  })()

  // On Vercel/Edge, we should use waitUntil if available
  // Otherwise the processing runs inline before the response
  try {
    // @ts-expect-error -- waitUntil is available in Vercel serverless runtime
    if (typeof globalThis.waitUntil === "function") {
      // @ts-expect-error
      globalThis.waitUntil(processingPromise)
    } else {
      // Fallback: await inline (still fast for single-product syncs)
      await processingPromise
    }
  } catch {
    // If waitUntil fails, the processing promise is still running
    await processingPromise
  }

  return NextResponse.json({ received: true })
}

/* ------------------------------------------------------------------ */
/*  GET — Health check                                                 */
/* ------------------------------------------------------------------ */

export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Shopify webhook endpoint is active",
    topics: [
      "products/create",
      "products/update",
      "products/delete",
      "orders/create",
      "orders/updated",
      "app/uninstalled",
    ],
  })
}
