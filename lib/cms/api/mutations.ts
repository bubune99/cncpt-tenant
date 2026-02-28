/**
 * Mutation Hook Factory
 *
 * Generic mutation hooks that handle the full create/update/delete lifecycle:
 * - Loading state (isSubmitting)
 * - Error handling with toast notifications
 * - SWR cache revalidation
 * - Optional router redirect on success
 *
 * Matches the existing pattern: useState + fetch + toast + router.push
 *
 * Usage:
 *   const createPage = useApiMutation(pagesClient.create, {
 *     successMessage: 'Page created',
 *     redirectTo: (result) => routes.admin.pages.editor(result.id),
 *     invalidate: [routes.api.admin.pages.root],
 *   })
 *
 *   <Button onClick={() => createPage.mutate(formData)} disabled={createPage.isSubmitting}>
 *     {createPage.isSubmitting ? <Loader2 /> : <Save />} Create
 *   </Button>
 */

"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useSWRConfig } from "swr"
import { ApiClientError } from "./client"

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface MutationOptions<TInput, TResult> {
  /** Toast message on success. Set to `false` to suppress. */
  successMessage?: string | false
  /** Toast message on error. Set to `false` to suppress (still logs to console). */
  errorMessage?: string | false
  /** Redirect after success. Can be a string or a function that receives the result. */
  redirectTo?: string | ((result: TResult) => string)
  /** SWR cache keys to revalidate after success (prefix-matched). */
  invalidate?: string[]
  /** Called after successful mutation with the result. */
  onSuccess?: (result: TResult, input: TInput) => void | Promise<void>
  /** Called after failed mutation with the error. */
  onError?: (error: Error, input: TInput) => void
}

export interface MutationResult<TInput, TResult> {
  /** Execute the mutation */
  mutate: (input: TInput) => Promise<TResult | undefined>
  /** Whether the mutation is in flight */
  isSubmitting: boolean
  /** The last error, if any */
  error: Error | null
  /** Reset error state */
  reset: () => void
}

/* ------------------------------------------------------------------ */
/*  Generic Mutation Hook                                              */
/* ------------------------------------------------------------------ */

/**
 * Generic mutation hook. Wraps any async function with loading/error/toast/redirect.
 *
 * ```tsx
 * const deletePage = useApiMutation(
 *   (id: string) => pagesClient.delete(id),
 *   { successMessage: 'Page deleted', redirectTo: routes.admin.pages.list }
 * )
 * ```
 */
export function useApiMutation<TInput, TResult>(
  mutationFn: (input: TInput) => Promise<TResult>,
  options: MutationOptions<TInput, TResult> = {}
): MutationResult<TInput, TResult> {
  const router = useRouter()
  const { mutate: swrMutate } = useSWRConfig()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const mutate = useCallback(
    async (input: TInput): Promise<TResult | undefined> => {
      setIsSubmitting(true)
      setError(null)

      try {
        const result = await mutationFn(input)

        // Toast success
        if (options.successMessage !== false) {
          toast.success(options.successMessage ?? "Success")
        }

        // Invalidate SWR caches
        if (options.invalidate?.length) {
          for (const key of options.invalidate) {
            // Revalidate all keys that start with the given prefix
            await swrMutate(
              (cacheKey: string) =>
                typeof cacheKey === "string" && cacheKey.startsWith(key),
              undefined,
              { revalidate: true }
            )
          }
        }

        // Callback
        if (options.onSuccess) {
          await options.onSuccess(result, input)
        }

        // Redirect
        if (options.redirectTo) {
          const target =
            typeof options.redirectTo === "function"
              ? options.redirectTo(result)
              : options.redirectTo
          router.push(target)
        }

        return result
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error(String(err))
        setError(error)

        // Toast error
        if (options.errorMessage !== false) {
          const message =
            options.errorMessage ??
            (err instanceof ApiClientError ? err.message : "An error occurred")
          toast.error(message)
        }

        // Callback
        if (options.onError) {
          options.onError(error, input)
        }

        console.error("[Mutation Error]", error)
        return undefined
      } finally {
        setIsSubmitting(false)
      }
    },
    [mutationFn, options, router, swrMutate]
  )

  const reset = useCallback(() => setError(null), [])

  return { mutate, isSubmitting, error, reset }
}

/* ------------------------------------------------------------------ */
/*  Convenience: Delete with Confirmation                              */
/* ------------------------------------------------------------------ */

export interface DeleteMutationOptions {
  /** The resource name for the confirm dialog, e.g. "page", "product" */
  resourceName: string
  /** Toast message on success */
  successMessage?: string
  /** Redirect after delete */
  redirectTo?: string
  /** SWR keys to invalidate */
  invalidate?: string[]
  /** Callback after successful delete */
  onSuccess?: () => void | Promise<void>
}

/**
 * Delete mutation with window.confirm() built in.
 *
 * ```tsx
 * const deletePage = useDeleteMutation(
 *   (id: string) => pagesClient.delete(id),
 *   { resourceName: 'page', redirectTo: routes.admin.pages.list }
 * )
 *
 * <Button variant="destructive" onClick={() => deletePage.mutate(page.id)}>
 *   Delete
 * </Button>
 * ```
 */
export function useDeleteMutation<TId = string>(
  deleteFn: (id: TId) => Promise<unknown>,
  options: DeleteMutationOptions
): MutationResult<TId, unknown> {
  const wrappedFn = useCallback(
    async (id: TId) => {
      const confirmed = window.confirm(
        `Are you sure you want to delete this ${options.resourceName}? This action cannot be undone.`
      )
      if (!confirmed) {
        throw new DeleteCancelledError()
      }
      return deleteFn(id)
    },
    [deleteFn, options.resourceName]
  )

  return useApiMutation(wrappedFn, {
    successMessage:
      options.successMessage ??
      `${capitalize(options.resourceName)} deleted successfully`,
    errorMessage: false, // Handle cancel silently
    redirectTo: options.redirectTo,
    invalidate: options.invalidate,
    onSuccess: options.onSuccess,
    onError: (err) => {
      // Don't toast on user cancellation
      if (!(err instanceof DeleteCancelledError)) {
        toast.error(
          err instanceof ApiClientError
            ? err.message
            : `Failed to delete ${options.resourceName}`
        )
      }
    },
  })
}

class DeleteCancelledError extends Error {
  constructor() {
    super("Delete cancelled by user")
    this.name = "DeleteCancelledError"
  }
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
