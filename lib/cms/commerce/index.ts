/**
 * Commerce Provider Factory
 *
 * Follows the IEmailProvider / getProvider() pattern from src/lib/email/.
 * Reads commerce provider settings from the database, creates and caches the provider.
 */

import type { ICommerceProvider, CommerceProviderConfig } from "./types"
import { GenericProvider } from "./providers/generic"

// Re-export types
export type {
  ICommerceProvider,
  CommerceProduct,
  CommerceVariant,
  CommerceCollection,
  CommerceCart,
  CommerceCartLineItem,
  CommerceImage,
  CommerceMoney,
  CommerceProviderConfig,
  ShopifyConfig,
  StripeCommerceConfig,
  SaleorConfig,
} from "./types"

/* ------------------------------------------------------------------ */
/*  Singleton Cache                                                    */
/* ------------------------------------------------------------------ */

let cachedProvider: ICommerceProvider | null = null
let cachedProviderName: string | null = null

/**
 * Get the configured commerce provider.
 *
 * Reads `commerce.provider` from the Setting table.
 * Defaults to `GenericProvider` (CMS internal products via Prisma).
 */
export async function getCommerceProvider(): Promise<ICommerceProvider> {
  const config = await loadCommerceConfig()

  // Return cached instance if provider hasn't changed
  if (cachedProvider && cachedProviderName === config.provider) {
    return cachedProvider
  }

  cachedProvider = createProvider(config)
  cachedProviderName = config.provider
  return cachedProvider
}

/** Clear the cached provider (for testing or config changes) */
export function clearCommerceProviderCache(): void {
  cachedProvider = null
  cachedProviderName = null
}

/* ------------------------------------------------------------------ */
/*  Config Loading                                                     */
/* ------------------------------------------------------------------ */

async function loadCommerceConfig(): Promise<CommerceProviderConfig> {
  try {
    // 1. Try module config (CmsModule.config for slug="commerce")
    const { getModuleConfig } = await import("../modules/registry")
    const moduleConfig = await getModuleConfig("commerce")
    if (moduleConfig?.provider) {
      return moduleConfig as unknown as CommerceProviderConfig
    }

    // 2. Fallback to Setting table (existing behavior)
    const { prisma } = await import("../db")
    const setting = await prisma.setting.findUnique({
      where: { key: "commerce.provider" },
    })

    if (setting?.value) {
      const parsed =
        typeof setting.value === "string"
          ? JSON.parse(setting.value)
          : setting.value
      return parsed as CommerceProviderConfig
    }

    // 3. Fallback to env vars for Shopify
    if (process.env.SHOPIFY_STORE_DOMAIN) {
      return {
        provider: "shopify",
        config: {
          storeDomain: process.env.SHOPIFY_STORE_DOMAIN,
          storefrontAccessToken:
            process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN || "",
          apiVersion: process.env.SHOPIFY_API_VERSION || "2024-01",
        },
      }
    }

    return { provider: "generic" }
  } catch {
    // Default to generic on any error
    return { provider: "generic" }
  }
}

/* ------------------------------------------------------------------ */
/*  Provider Factory                                                   */
/* ------------------------------------------------------------------ */

function createProvider(config: CommerceProviderConfig): ICommerceProvider {
  switch (config.provider) {
    case "shopify": {
      // Lazy import to avoid bundling Shopify code when not used
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { ShopifyProvider } = require("./providers/shopify") as typeof import("./providers/shopify")
      return new ShopifyProvider(config.config)
    }

    case "stripe":
    case "generic":
    default:
      return new GenericProvider()
  }
}
