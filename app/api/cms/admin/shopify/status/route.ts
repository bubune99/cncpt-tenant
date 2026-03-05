/**
 * Shopify Connection Status API
 *
 * Admin-only endpoint to check Shopify integration status.
 *
 * GET /api/cms/admin/shopify/status
 *
 * Returns:
 * - connected: whether the Admin API token works
 * - shopName: the Shopify shop name
 * - productCount: total products in Shopify
 * - lastSyncAt: last successful sync timestamp
 * - storefrontConnected: whether the Storefront API works
 */

import { NextRequest, NextResponse } from "next/server"
import {
  withPermission,
  type AuthContext,
} from "@/lib/cms/permissions/middleware"
import { PERMISSIONS } from "@/lib/cms/permissions"
import { prisma, getCurrentTenant } from "@/lib/cms/db"
import { createShopifyAdminClient } from "@/lib/cms/commerce/providers/shopify-admin"

export const dynamic = "force-dynamic"

export const GET = withPermission(
  PERMISSIONS.PRODUCTS_VIEW,
  async (_request: NextRequest, _context: AuthContext) => {
    const status: {
      connected: boolean
      shopName: string | null
      shopEmail: string | null
      shopDomain: string | null
      productCount: number | null
      lastSyncAt: string | null
      localProductCount: number
      storefrontConnected: boolean
      adminConfigured: boolean
      errors: string[]
    } = {
      connected: false,
      shopName: null,
      shopEmail: null,
      shopDomain: null,
      productCount: null,
      lastSyncAt: null,
      localProductCount: 0,
      storefrontConnected: false,
      adminConfigured: false,
      errors: [],
    }

    // Check Admin API connection
    const adminClient = createShopifyAdminClient()

    if (!adminClient) {
      status.errors.push(
        "Admin API not configured. Set SHOPIFY_STORE_DOMAIN and SHOPIFY_ADMIN_ACCESS_TOKEN."
      )
    } else {
      status.adminConfigured = true

      try {
        const shopInfo = await adminClient.getShopInfo()
        status.connected = true
        status.shopName = shopInfo.name
        status.shopEmail = shopInfo.email
        status.shopDomain = shopInfo.primaryDomain.url

        // Get product count from Shopify
        try {
          status.productCount = await adminClient.getProductCount()
        } catch (error) {
          status.errors.push(
            `Failed to get product count: ${error instanceof Error ? error.message : String(error)}`
          )
        }
      } catch (error) {
        status.errors.push(
          `Admin API connection failed: ${error instanceof Error ? error.message : String(error)}`
        )
      }
    }

    // Check Storefront API connection
    try {
      const storeDomain = process.env.SHOPIFY_STORE_DOMAIN
      const storefrontToken = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN
      const apiVersion = process.env.SHOPIFY_API_VERSION || "2024-01"

      if (storeDomain && storefrontToken) {
        const res = await fetch(
          `https://${storeDomain}/api/${apiVersion}/graphql.json`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Shopify-Storefront-Access-Token": storefrontToken,
            },
            body: JSON.stringify({ query: "{ shop { name } }" }),
          }
        )
        if (res.ok) {
          const json = await res.json()
          if (json.data?.shop?.name) {
            status.storefrontConnected = true
          }
        }
      }
    } catch {
      // Storefront API check is non-critical
    }

    // Get last sync time from settings
    try {
      const tenantId = getCurrentTenant()
      const syncSetting = await prisma.setting.findFirst({
        where: {
          key: "shopify.lastSyncAt",
          tenantId: tenantId ?? undefined,
        },
      })
      status.lastSyncAt = syncSetting?.value ?? null
    } catch {
      // Non-critical
    }

    // Get local product count (synced from Shopify)
    try {
      const tenantId = getCurrentTenant()
      status.localProductCount = await prisma.product.count({
        where: {
          shopifyProductId: { not: null },
          tenantId: tenantId ?? undefined,
        },
      })
    } catch {
      // Non-critical
    }

    return NextResponse.json(status)
  }
)
