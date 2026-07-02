/**
 * Form Data Fetcher
 *
 * Server-side Prisma query for the FormBlock smart block. Loads an ACTIVE
 * form by slug (or id) and normalizes the admin-builder field shape into
 * the FormDefinition consumed by <DynamicForm>.
 *
 * Tenant scoping: `Form` is a tenant-scoped model, so the Prisma tenant
 * middleware auto-injects `tenantId` into this query as long as the storefront
 * page wraps `resolveSmartBlockData` in `runWithTenant(tenantId, …)`. This
 * mirrors how the commerce fetchers rely on the same middleware.
 */

import { prisma } from '@/lib/cms/db'
import { registerFetcher } from './data-resolver'
import type { FormDefinition, FormField, FormFieldType, FieldOption } from '@/lib/cms/forms/types'

/** Raw field shape stored by the admin form builder (fields Json column). */
interface StoredField {
  id: string
  name?: string
  type: string
  label: string
  placeholder?: string
  required?: boolean
  options?: Array<string | FieldOption>
  [key: string]: unknown
}

function normalizeField(raw: StoredField): FormField {
  const label = raw.label || raw.id
  const options: FieldOption[] | undefined = raw.options?.map((o) =>
    typeof o === 'string' ? { value: o, label: o } : o
  )
  return {
    id: raw.id,
    // The submit API validates body[field.id], so inputs must be keyed by id
    // unless the field explicitly defines a distinct name.
    name: raw.name || raw.id,
    // The admin builder's "toggle" renders as a checkbox on the storefront.
    type: (raw.type === 'toggle' ? 'checkbox' : raw.type) as FormFieldType,
    label,
    placeholder: raw.placeholder,
    options,
    validation: raw.required ? [{ type: 'required', message: `${label} is required` }] : undefined,
  }
}

export interface SerializedForm extends FormDefinition {
  status: string
}

async function fetchForm(args: Record<string, unknown>): Promise<SerializedForm | null> {
  const slug = args.slug as string | undefined
  const id = args.id as string | undefined
  if (!slug && !id) return null

  const form = await prisma.form.findFirst({
    where: {
      status: 'ACTIVE',
      ...(slug ? { slug } : { id }),
    },
  })
  if (!form) return null

  const rawFields = Array.isArray(form.fields) ? (form.fields as unknown as StoredField[]) : []

  return {
    id: form.id,
    name: form.name,
    slug: form.slug,
    description: form.description ?? undefined,
    fields: rawFields.map(normalizeField),
    settings: {
      submitButtonText: form.submitButtonText || 'Submit',
      successMessage: form.successMessage || 'Thank you for your submission!',
      redirectUrl: form.redirectUrl ?? undefined,
      notifyEmails: form.notifyEmails ?? [],
      captchaEnabled: false,
      storeSubmissions: true,
    },
    status: form.status,
    createdAt: form.createdAt.toISOString(),
    updatedAt: form.updatedAt.toISOString(),
  }
}

/** Register all form fetchers with the data resolver. */
export function registerFormFetchers(): void {
  registerFetcher('fetchForm', fetchForm)
}
