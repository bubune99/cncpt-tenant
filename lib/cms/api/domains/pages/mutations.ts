/**
 * Pages Mutation Hooks
 *
 * Ready-to-wire hooks for page CRUD forms and action buttons.
 *
 * Usage (Create Form):
 *   const { formData, setField, resetForm } = usePageFormDefaults()
 *   const createPage = useCreatePage()
 *
 *   <form onSubmit={(e) => { e.preventDefault(); createPage.mutate(formData) }}>
 *     <Input value={formData.title} onChange={e => setField('title', e.target.value)} />
 *     <Button disabled={createPage.isSubmitting}>Create</Button>
 *   </form>
 *
 * Usage (Delete Button):
 *   const deletePage = useDeletePage()
 *   <Button variant="destructive" onClick={() => deletePage.mutate(page.id)}>Delete</Button>
 *
 * Usage (Status Toggle):
 *   const updatePage = useUpdatePage(page.id)
 *   <Button onClick={() => updatePage.mutate({ status: 'published' })}>Publish</Button>
 */

"use client"

import { useState, useCallback } from "react"
import { routes } from "../../routes"
import { useApiMutation, useDeleteMutation } from "../../mutations"
import type { MutationResult } from "../../mutations"
import { pagesClient } from "./client"
import type { CreatePageInput, UpdatePageInput, PageDto } from "./types"

/* ------------------------------------------------------------------ */
/*  Form Defaults                                                      */
/* ------------------------------------------------------------------ */

const DEFAULT_PAGE_FORM: CreatePageInput = {
  title: "",
  slug: "",
  status: "draft",
  metaTitle: "",
  metaDescription: "",
  parentId: undefined,
}

/**
 * Form state helper for page create/edit forms.
 *
 * Returns controlled form data + typed setters + slug auto-generation.
 *
 * ```tsx
 * const { formData, setField, handleTitleChange } = usePageFormDefaults()
 * <Input value={formData.title} onChange={e => handleTitleChange(e.target.value)} />
 * <Input value={formData.slug} onChange={e => setField('slug', e.target.value)} />
 * ```
 */
export function usePageFormDefaults(initial?: Partial<CreatePageInput>) {
  const [formData, setFormData] = useState<CreatePageInput>({
    ...DEFAULT_PAGE_FORM,
    ...initial,
  })

  const setField = useCallback(
    <K extends keyof CreatePageInput>(key: K, value: CreatePageInput[K]) => {
      setFormData((prev) => ({ ...prev, [key]: value }))
    },
    []
  )

  const handleTitleChange = useCallback(
    (title: string) => {
      setFormData((prev) => ({
        ...prev,
        title,
        // Auto-generate slug only if user hasn't manually set one
        slug:
          prev.slug === "" || prev.slug === slugify(prev.title)
            ? slugify(title)
            : prev.slug,
      }))
    },
    []
  )

  const resetForm = useCallback(
    (values?: Partial<CreatePageInput>) => {
      setFormData({ ...DEFAULT_PAGE_FORM, ...values })
    },
    []
  )

  return { formData, setFormData, setField, handleTitleChange, resetForm }
}

function slugify(text: string): string {
  const slug = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
  return slug ? `/${slug}` : ""
}

/* ------------------------------------------------------------------ */
/*  Mutation Hooks                                                     */
/* ------------------------------------------------------------------ */

const PAGES_CACHE = routes.api.admin.pages.root

/**
 * Create a page and redirect to the editor.
 *
 * ```tsx
 * const createPage = useCreatePage()
 * <Button onClick={() => createPage.mutate(formData)} disabled={createPage.isSubmitting}>
 *   Create Page
 * </Button>
 * ```
 */
export function useCreatePage(): MutationResult<CreatePageInput, PageDto> {
  return useApiMutation(
    (input: CreatePageInput) => pagesClient.create(input),
    {
      successMessage: "Page created successfully",
      redirectTo: (page) => routes.admin.pages.editor(page.id),
      invalidate: [PAGES_CACHE],
    }
  )
}

/**
 * Update a page. Stays on the current page by default.
 *
 * ```tsx
 * const updatePage = useUpdatePage(page.id)
 * <Button onClick={() => updatePage.mutate({ status: 'published' })}>Publish</Button>
 * ```
 */
export function useUpdatePage(
  pageId: string
): MutationResult<UpdatePageInput, PageDto> {
  return useApiMutation(
    (input: UpdatePageInput) => pagesClient.update(pageId, input),
    {
      successMessage: "Page updated",
      invalidate: [PAGES_CACHE],
    }
  )
}

/**
 * Delete a page with confirmation dialog.
 *
 * ```tsx
 * const deletePage = useDeletePage()
 * <Button variant="destructive" onClick={() => deletePage.mutate(page.id)}>Delete</Button>
 * ```
 */
export function useDeletePage(): MutationResult<string, unknown> {
  return useDeleteMutation((id: string) => pagesClient.delete(id), {
    resourceName: "page",
    redirectTo: routes.admin.pages.list,
    invalidate: [PAGES_CACHE],
  })
}
