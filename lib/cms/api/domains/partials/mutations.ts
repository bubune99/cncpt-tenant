/**
 * Partials Mutation Hooks
 *
 * Ready-to-wire hooks for partial CRUD forms and action buttons.
 */

"use client"

import { useState, useCallback } from "react"
import { routes } from "../../routes"
import { useApiMutation, useDeleteMutation } from "../../mutations"
import type { MutationResult } from "../../mutations"
import { partialsClient } from "./client"
import type { CreatePartialInput, UpdatePartialInput, PartialDto, PartialCategory } from "./types"

/* ------------------------------------------------------------------ */
/*  Form Defaults                                                      */
/* ------------------------------------------------------------------ */

const DEFAULT_PARTIAL_FORM: CreatePartialInput = {
  name: "",
  slug: "",
  category: "section",
  description: "",
  status: "draft",
}

/**
 * Form state helper for partial create/edit forms.
 */
export function usePartialFormDefaults(initial?: Partial<CreatePartialInput>) {
  const [formData, setFormData] = useState<CreatePartialInput>({
    ...DEFAULT_PARTIAL_FORM,
    ...initial,
  })

  const setField = useCallback(
    <K extends keyof CreatePartialInput>(key: K, value: CreatePartialInput[K]) => {
      setFormData((prev) => ({ ...prev, [key]: value }))
    },
    []
  )

  const handleNameChange = useCallback(
    (name: string) => {
      setFormData((prev) => ({
        ...prev,
        name,
        slug:
          prev.slug === "" || prev.slug === slugify(prev.name)
            ? slugify(name)
            : prev.slug,
      }))
    },
    []
  )

  const resetForm = useCallback(
    (values?: Partial<CreatePartialInput>) => {
      setFormData({ ...DEFAULT_PARTIAL_FORM, ...values })
    },
    []
  )

  return { formData, setFormData, setField, handleNameChange, resetForm }
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

const PARTIALS_CACHE = routes.api.admin.partials.root

/**
 * Create a partial and redirect to the editor.
 */
export function useCreatePartial(): MutationResult<CreatePartialInput, PartialDto> {
  return useApiMutation(
    (input: CreatePartialInput) => partialsClient.create(input),
    {
      successMessage: "Partial created successfully",
      redirectTo: (partial) => routes.admin.partials.editor(partial.id),
      invalidate: [PARTIALS_CACHE],
    }
  )
}

/**
 * Update a partial.
 */
export function useUpdatePartial(
  partialId: string
): MutationResult<UpdatePartialInput, PartialDto> {
  return useApiMutation(
    (input: UpdatePartialInput) => partialsClient.update(partialId, input),
    {
      successMessage: "Partial updated",
      invalidate: [PARTIALS_CACHE],
    }
  )
}

/**
 * Delete a partial with confirmation.
 */
export function useDeletePartial(): MutationResult<string, unknown> {
  return useDeleteMutation((id: string) => partialsClient.delete(id), {
    resourceName: "partial",
    redirectTo: routes.admin.partials.list,
    invalidate: [PARTIALS_CACHE],
  })
}

/**
 * Set a partial as the default for its category.
 */
export function useSetDefaultPartial(): MutationResult<string, { success: boolean; id: string; name: string; category: string }> {
  return useApiMutation(
    (id: string) => partialsClient.setDefault(id),
    {
      successMessage: "Partial set as default",
      invalidate: [PARTIALS_CACHE],
    }
  )
}
