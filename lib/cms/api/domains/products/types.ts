/**
 * Products Domain Types
 *
 * DTOs and input types for the Products API.
 * Matches the shape returned by /api/admin/products routes.
 */

import type { ListParams } from "../../types"

/* ------------------------------------------------------------------ */
/*  DTOs                                                               */
/* ------------------------------------------------------------------ */

export interface ProductImageDto {
  id: string
  url: string
  alt: string | null
  position: number
}

export interface ProductVariantDto {
  id: string
  title: string
  sku: string | null
  price: number
  compareAtPrice: number | null
  stock: number
  options: Record<string, string>
  stripepriceId: string | null
}

export interface ProductCategoryDto {
  id: string
  name: string
  slug: string
}

/** Shape returned by product list and detail endpoints */
export interface ProductDto {
  id: string
  title: string
  slug: string
  description: string | null
  basePrice: number
  compareAtPrice: number | null
  status: string
  featured: boolean
  type: string
  sku: string | null
  barcode: string | null
  costPrice: number | null
  taxable: boolean
  requiresShipping: boolean
  weight: number | null
  stock: number
  stripeProductId: string | null
  metaTitle: string | null
  metaDescription: string | null
  images: ProductImageDto[]
  variants: ProductVariantDto[]
  categories: ProductCategoryDto[]
  createdAt: string
  updatedAt: string
}

/* ------------------------------------------------------------------ */
/*  Inputs                                                             */
/* ------------------------------------------------------------------ */

export interface CreateProductInput {
  title: string
  slug: string
  description?: string
  basePrice: number
  compareAtPrice?: number
  status?: string
  featured?: boolean
  type?: string
  sku?: string
  barcode?: string
  costPrice?: number
  taxable?: boolean
  requiresShipping?: boolean
  weight?: number
  stock?: number
  metaTitle?: string
  metaDescription?: string
  categoryIds?: string[]
}

export interface UpdateProductInput {
  title?: string
  slug?: string
  description?: string | null
  basePrice?: number
  compareAtPrice?: number | null
  status?: string
  featured?: boolean
  type?: string
  sku?: string | null
  barcode?: string | null
  costPrice?: number | null
  taxable?: boolean
  requiresShipping?: boolean
  weight?: number | null
  stock?: number
  metaTitle?: string | null
  metaDescription?: string | null
  categoryIds?: string[]
}

/* ------------------------------------------------------------------ */
/*  Query Params                                                       */
/* ------------------------------------------------------------------ */

export interface ListProductsParams extends ListParams {
  status?: "draft" | "active" | "archived"
  featured?: boolean
  type?: string
  category?: string
}
