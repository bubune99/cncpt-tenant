/**
 * Commerce Binding Resolver
 *
 * Resolves a CommerceBinding from block types to actual commerce data.
 * Used by BlockRenderer for server-side commerce data fetching.
 */

import type { CommerceBinding } from "../block-editor/types"
import type { CommerceProduct, CommerceCollection } from "./types"
import { getCommerceProvider } from "./index"

/* ------------------------------------------------------------------ */
/*  Result Type                                                        */
/* ------------------------------------------------------------------ */

export interface ResolvedBinding {
  product?: CommerceProduct
  products?: CommerceProduct[]
  collection?: CommerceCollection
}

/* ------------------------------------------------------------------ */
/*  Resolver                                                           */
/* ------------------------------------------------------------------ */

/**
 * Resolve a CommerceBinding to actual commerce data.
 *
 * @param binding - The binding from a block's `commerce` field
 * @returns Resolved commerce data (product, products, or collection)
 */
export async function resolveCommerceBinding(
  binding: CommerceBinding
): Promise<ResolvedBinding> {
  const provider = await getCommerceProvider()
  const result: ResolvedBinding = {}

  switch (binding.type) {
    case "product": {
      if (binding.handle) {
        result.product = (await provider.getProduct(binding.handle)) ?? undefined
      }
      break
    }

    case "collection": {
      if (binding.handle) {
        const collection = await provider.getCollection(binding.handle)
        if (collection) {
          result.collection = collection
          result.products = collection.products
        }
      } else {
        // No handle — fetch top products with binding options
        result.products = await provider.getProducts({
          limit: binding.limit ?? 12,
          sortKey: binding.sortKey,
          reverse: binding.reverse,
        })
      }
      break
    }

    case "price": {
      // Price bindings resolve the parent product
      if (binding.handle) {
        result.product = (await provider.getProduct(binding.handle)) ?? undefined
      }
      break
    }

    case "cart":
    case "customer":
    case "checkout":
      // These are client-side concerns — no server resolution needed
      break
  }

  return result
}
