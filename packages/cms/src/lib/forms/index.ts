/**
 * Form Builder Library
 *
 * Provides form creation, validation, and submission handling
 */

import { prisma } from '../db'
import type {
  FormField,
  FormDefinition,
  FormSettings,
  ValidationRule,
  FieldCondition,
  FormSubmissionData,
  FormSubmissionResponse,
} from './types'
import { DEFAULT_FORM_SETTINGS } from './types'

/**
 * Create a new form
 */
export async function createForm(
  name: string,
  fields: FormField[],
  settings?: Partial<FormSettings>
): Promise<FormDefinition> {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

  const form = await prisma.form.create({
    data: {
      name,
      slug,
      fields: fields as any,
      submitButtonText: settings?.submitButtonText || DEFAULT_FORM_SETTINGS.submitButtonText,
      successMessage: settings?.successMessage || DEFAULT_FORM_SETTINGS.successMessage,
      redirectUrl: settings?.redirectUrl,
      notifyEmails: settings?.notifyEmails || [],
      status: 'ACTIVE',
    },
  })

  return {
    id: form.id,
    name: form.name,
    slug: form.slug,
    description: form.description || undefined,
    fields: form.fields as unknown as FormField[],
    settings: {
      submitButtonText: form.submitButtonText,
      successMessage: form.successMessage || DEFAULT_FORM_SETTINGS.successMessage,
      redirectUrl: form.redirectUrl || undefined,
      notifyEmails: form.notifyEmails,
      captchaEnabled: false,
      storeSubmissions: true,
    },
    createdAt: form.createdAt.toISOString(),
    updatedAt: form.updatedAt.toISOString(),
  }
}

/**
 * Get form by ID or slug
 */
export async function getForm(idOrSlug: string): Promise<FormDefinition | null> {
  const form = await prisma.form.findFirst({
    where: {
      OR: [{ id: idOrSlug }, { slug: idOrSlug }],
    },
  })

  if (!form) return null

  return {
    id: form.id,
    name: form.name,
    slug: form.slug,
    description: form.description || undefined,
    fields: form.fields as unknown as FormField[],
    settings: {
      submitButtonText: form.submitButtonText,
      successMessage: form.successMessage || DEFAULT_FORM_SETTINGS.successMessage,
      redirectUrl: form.redirectUrl || undefined,
      notifyEmails: form.notifyEmails,
      captchaEnabled: false,
      storeSubmissions: true,
    },
    createdAt: form.createdAt.toISOString(),
    updatedAt: form.updatedAt.toISOString(),
  }
}

/**
 * Update a form
 */
export async function updateForm(
  id: string,
  data: {
    name?: string
    description?: string
    fields?: FormField[]
    settings?: Partial<FormSettings>
    status?: 'DRAFT' | 'ACTIVE' | 'ARCHIVED'
  }
): Promise<FormDefinition> {
  const updateData: any = {}

  if (data.name) updateData.name = data.name
  if (data.description !== undefined) updateData.description = data.description
  if (data.fields) updateData.fields = data.fields
  if (data.status) updateData.status = data.status
  if (data.settings) {
    if (data.settings.submitButtonText) updateData.submitButtonText = data.settings.submitButtonText
    if (data.settings.successMessage) updateData.successMessage = data.settings.successMessage
    if (data.settings.redirectUrl !== undefined) updateData.redirectUrl = data.settings.redirectUrl
    if (data.settings.notifyEmails) updateData.notifyEmails = data.settings.notifyEmails
  }

  const form = await prisma.form.update({
    where: { id },
    data: updateData,
  })

  return {
    id: form.id,
    name: form.name,
    slug: form.slug,
    description: form.description || undefined,
    fields: form.fields as unknown as FormField[],
    settings: {
      submitButtonText: form.submitButtonText,
      successMessage: form.successMessage || DEFAULT_FORM_SETTINGS.successMessage,
      redirectUrl: form.redirectUrl || undefined,
      notifyEmails: form.notifyEmails,
      captchaEnabled: false,
      storeSubmissions: true,
    },
    createdAt: form.createdAt.toISOString(),
    updatedAt: form.updatedAt.toISOString(),
  }
}

/**
 * Delete a form
 */
export async function deleteForm(id: string): Promise<void> {
  await prisma.form.delete({ where: { id } })
}

/**
 * Validate form data against field definitions
 */
export function validateFormData(
  fields: FormField[],
  data: Record<string, any>
): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {}

  for (const field of fields) {
    const value = data[field.name]

    // Check conditions - skip validation if field shouldn't be shown
    if (field.conditions && field.conditions.length > 0) {
      const shouldShow = field.conditions.every((condition) =>
        evaluateCondition(condition, data)
      )
      if (!shouldShow) continue
    }

    // Validate each rule
    if (field.validation) {
      for (const rule of field.validation) {
        const error = validateRule(rule, value, field)
        if (error) {
          errors[field.name] = error
          break // Only show first error per field
        }
      }
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}

/**
 * Evaluate a field condition
 */
function evaluateCondition(
  condition: FieldCondition,
  data: Record<string, any>
): boolean {
  const value = data[condition.field]

  switch (condition.operator) {
    case 'equals':
      return value === condition.value
    case 'notEquals':
      return value !== condition.value
    case 'contains':
      return String(value || '').includes(String(condition.value))
    case 'notContains':
      return !String(value || '').includes(String(condition.value))
    case 'isEmpty':
      return value === undefined || value === null || value === ''
    case 'isNotEmpty':
      return value !== undefined && value !== null && value !== ''
    default:
      return true
  }
}

/**
 * Validate a single rule
 */
function validateRule(
  rule: ValidationRule,
  value: any,
  field: FormField
): string | null {
  switch (rule.type) {
    case 'required':
      if (value === undefined || value === null || value === '' ||
          (Array.isArray(value) && value.length === 0)) {
        return rule.message
      }
      break

    case 'minLength':
      if (typeof value === 'string' && value.length < (rule.value as number)) {
        return rule.message
      }
      break

    case 'maxLength':
      if (typeof value === 'string' && value.length > (rule.value as number)) {
        return rule.message
      }
      break

    case 'min':
      if (typeof value === 'number' && value < (rule.value as number)) {
        return rule.message
      }
      break

    case 'max':
      if (typeof value === 'number' && value > (rule.value as number)) {
        return rule.message
      }
      break

    case 'pattern':
      if (value && !new RegExp(rule.value as string).test(String(value))) {
        return rule.message
      }
      break

    case 'email':
      if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value))) {
        return rule.message
      }
      break

    case 'url':
      if (value) {
        try {
          new URL(String(value))
        } catch {
          return rule.message
        }
      }
      break
  }

  return null
}

/**
 * Submit form data
 */
export async function submitForm(
  submission: FormSubmissionData
): Promise<FormSubmissionResponse> {
  const form = await getForm(submission.formId)

  if (!form) {
    return {
      success: false,
      message: 'Form not found',
    }
  }

  // Validate data
  const validation = validateFormData(form.fields, submission.data)

  if (!validation.valid) {
    return {
      success: false,
      message: 'Validation failed',
      errors: validation.errors,
    }
  }

  // Store submission
  const formSubmission = await prisma.formSubmission.create({
    data: {
      formId: form.id,
      data: submission.data,
      ipAddress: submission.metadata?.ipAddress,
      userAgent: submission.metadata?.userAgent,
      referrer: submission.metadata?.referrer,
    },
  })

  // Update submission count
  await prisma.form.update({
    where: { id: form.id },
    data: { submissionCount: { increment: 1 } },
  })

  // TODO: Send notification emails if configured
  // This would integrate with your email service

  return {
    success: true,
    message: form.settings.successMessage,
    submissionId: formSubmission.id,
    redirectUrl: form.settings.redirectUrl,
  }
}

/**
 * Get form submissions
 */
export async function getFormSubmissions(
  formId: string,
  options?: {
    limit?: number
    offset?: number
    starred?: boolean
    read?: boolean
  }
): Promise<{
  submissions: Array<{
    id: string
    data: Record<string, any>
    createdAt: string
    read: boolean
    starred: boolean
  }>
  total: number
}> {
  const where: any = { formId }

  if (options?.starred !== undefined) {
    where.starred = options.starred
  }
  if (options?.read !== undefined) {
    where.read = options.read
  }

  const [submissions, total] = await Promise.all([
    prisma.formSubmission.findMany({
      where,
      take: options?.limit || 50,
      skip: options?.offset || 0,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.formSubmission.count({ where }),
  ])

  return {
    submissions: submissions.map((s: (typeof submissions)[number]) => ({
      id: s.id,
      data: s.data as Record<string, any>,
      createdAt: s.createdAt.toISOString(),
      read: s.read,
      starred: s.starred,
    })),
    total,
  }
}

/**
 * Mark submission as read
 */
export async function markSubmissionRead(
  submissionId: string,
  read = true
): Promise<void> {
  await prisma.formSubmission.update({
    where: { id: submissionId },
    data: { read },
  })
}

/**
 * Star/unstar submission
 */
export async function starSubmission(
  submissionId: string,
  starred = true
): Promise<void> {
  await prisma.formSubmission.update({
    where: { id: submissionId },
    data: { starred },
  })
}

/**
 * Delete submission
 */
export async function deleteSubmission(submissionId: string): Promise<void> {
  await prisma.formSubmission.delete({
    where: { id: submissionId },
  })
}

export * from './types'
