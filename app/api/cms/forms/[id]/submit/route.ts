/**
 * Form Submit API
 *
 * POST /api/forms/[id]/submit - Submit a form (public endpoint)
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/cms/db'
import { headers } from 'next/headers'
import { sendFormNotification } from '@/lib/cms/forms/notifications'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await request.json()
    const headersList = await headers()

    // Find form by ID or slug
    const form = await prisma.form.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
        status: 'ACTIVE',
      },
    })

    if (!form) {
      return NextResponse.json(
        { error: 'Form not found or not active' },
        { status: 404 }
      )
    }

    // Validate required fields
    const fields = form.fields as Array<{
      id: string
      type: string
      label: string
      required?: boolean
      validation?: {
        pattern?: string
        minLength?: number
        maxLength?: number
      }
    }>

    const errors: Record<string, string> = {}

    for (const field of fields) {
      const value = body[field.id]

      // Check required
      if (field.required && (!value || (typeof value === 'string' && !value.trim()))) {
        errors[field.id] = `${field.label} is required`
        continue
      }

      // Skip further validation if empty and not required
      if (!value) continue

      // Email validation
      if (field.type === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(value)) {
          errors[field.id] = 'Please enter a valid email address'
        }
      }

      // Phone validation
      if (field.type === 'phone') {
        const phoneRegex = /^[\d\s\-+()]+$/
        if (!phoneRegex.test(value)) {
          errors[field.id] = 'Please enter a valid phone number'
        }
      }

      // Custom pattern validation
      if (field.validation?.pattern) {
        const regex = new RegExp(field.validation.pattern)
        if (!regex.test(value)) {
          errors[field.id] = `${field.label} format is invalid`
        }
      }

      // Min/max length
      if (typeof value === 'string') {
        if (field.validation?.minLength && value.length < field.validation.minLength) {
          errors[field.id] = `${field.label} must be at least ${field.validation.minLength} characters`
        }
        if (field.validation?.maxLength && value.length > field.validation.maxLength) {
          errors[field.id] = `${field.label} must be at most ${field.validation.maxLength} characters`
        }
      }
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ error: 'Validation failed', errors }, { status: 400 })
    }

    // Create submission
    const submission = await prisma.formSubmission.create({
      data: {
        formId: form.id,
        data: body,
        ipAddress: headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || null,
        userAgent: headersList.get('user-agent') || null,
        referrer: headersList.get('referer') || null,
      },
    })

    // Update submission count
    await prisma.form.update({
      where: { id: form.id },
      data: { submissionCount: { increment: 1 } },
    })

    // Send notification emails if configured
    if (form.notifyEmails && (form.notifyEmails as string[]).length > 0) {
      // Send in background - don't block response
      sendFormNotification({
        formId: form.id,
        formName: form.name,
        submissionId: submission.id,
        submissionData: body,
        notifyEmails: form.notifyEmails as string[],
        fields,
      }).catch((err) => {
        console.error('Error sending form notification:', err)
      })
    }

    return NextResponse.json({
      success: true,
      message: form.successMessage || 'Thank you for your submission!',
      redirectUrl: form.redirectUrl || null,
    })
  } catch (error) {
    console.error('Form submission error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to submit form' },
      { status: 500 }
    )
  }
}
