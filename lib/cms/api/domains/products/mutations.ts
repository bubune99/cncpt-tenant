/**
 * Products Mutation Hooks
 *
 * Ready-to-wire hooks for product CRUD forms and action buttons.
 *
 * Usage (Create Form):
 *   const { formData, setField } = useProductFormDefaults()
 *   const createProduct = useCreateProduct()
 *
 *   <form onSubmit={(e) => { e.preventDefault(); createProduct.mutate(formData) }}>
 *     <Input value={formData.title} onChange={e => setField('title', e.target.value)} />
 *     <Button disabled={createProduct.isSubmitting}>Create</Button>
 *   </form>
 *
 * Usage (Delete Button):
 *   const deleteProduct = useDeleteProduct()
 *   <Button variant="destructive" onClick={() => deleteProduct.mutate(product.id)}>
 *     Delete
 *   </Button>
 *
 * Usage (Stripe Sync):
 *   const syncStripe = useSyncProductStripe()
 *   <Button onClick={() => syncStripe.mutate(product.id)}>Sync to Stripe</Button>
 */

"use client"

import { useState, useCallback } from "react"
import { routes } from "../../routes"
import { useApiMutation, useDeleteMutation } from "../../mutations"
import type { MutationResult } from "../../mutations"
import { productsClient } from "./client"
import type {
  CreateProductInput,
  UpdateProductInput,
  ProductDto,
} from "./types"

/* ------------------------------------------------------------------ */
/*  Form Defaults                                                      */
/* ------------------------------------------------------------------ */

const DEFAULT_PRODUCT_FORM: CreateProductInput = {
  title: "",
  slug: "",
  description: "",
  basePrice: 0,
  status: "draft",
  featured: false,
  type: "SIMPLE",
  taxable: true,
  requiresShipping: true,
  stock: 0,
}

/**
 * Form state helper for product create/edit forms.
 *
 * Returns controlled form data + typed setters + slug auto-generation.
 *
 * ```tsx
 * const { formData, setField, handleTitleChange } = useProductFormDefaults()
 * <Input value={formData.title} onChange={e => handleTitleChange(e.target.value)} />
 * <Input type="number" value={formData.basePrice}
 *   onChange={e => setField('basePrice', parseInt(e.target.value))} />
 * ```
 */
export function useProductFormDefaults(initial?: Partial<CreateProductInput>) {
  const [formData, setFormData] = useState<CreateProductInput>({
    ...DEFAULT_PRODUCT_FORM,
    ...initial,
  })

  const setField = useCallback(
    <K extends keyof CreateProductInput>(
      key: K,
      value: CreateProductInput[K]
    ) => {
      setFormData((prev) => ({ ...prev, [key]: value }))
    },
    []
  )

  const handleTitleChange = useCallback(
    (title: string) => {
      setFormData((prev) => ({
        ...prev,
        title,
        slug:
          prev.slug === "" || prev.slug === slugify(prev.title)
            ? slugify(title)
            : prev.slug,
      }))
    },
    []
  )

  const resetForm = useCallback(
    (values?: Partial<CreateProductInput>) => {
      setFormData({ ...DEFAULT_PRODUCT_FORM, ...values })
    },
    []
  )

  return { formData, setFormData, setField, handleTitleChange, resetForm }
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

/* ------------------------------------------------------------------ */
/*  Mutation Hooks                                                     */
/* ------------------------------------------------------------------ */

const PRODUCTS_CACHE = routes.api.admin.products.root

/**
 * Create a product and redirect to the edit page.
 */
export function useCreateProduct(): MutationResult<
  CreateProductInput,
  ProductDto
> {
  return useApiMutation(
    (input: CreateProductInput) => productsClient.create(input),
    {
      successMessage: "Product created successfully",
      redirectTo: (product) => routes.admin.products.edit(product.id),
      invalidate: [PRODUCTS_CACHE],
    }
  )
}

/**
 * Update a product. Stays on the current page by default.
 */
export function useUpdateProduct(
  productId: string
): MutationResult<UpdateProductInput, ProductDto> {
  return useApiMutation(
    (input: UpdateProductInput) => productsClient.update(productId, input),
    {
      successMessage: "Product updated",
      invalidate: [PRODUCTS_CACHE],
    }
  )
}

/**
 * Delete a product with confirmation dialog.
 */
export function useDeleteProduct(): MutationResult<string, unknown> {
  return useDeleteMutation((id: string) => productsClient.delete(id), {
    resourceName: "product",
    redirectTo: routes.admin.products.list,
    invalidate: [PRODUCTS_CACHE],
  })
}

/**
 * Sync product to Stripe.
 */
export function useSyncProductStripe(): MutationResult<
  string,
  { stripeProductId: string }
> {
  return useApiMutation(
    (id: string) => productsClient.syncStripe(id),
    {
      successMessage: "Product synced to Stripe",
      invalidate: [PRODUCTS_CACHE],
    }
  )
}
