/**
 * Media API
 *
 * GET /api/cms/media - List media with filters (tenant-scoped)
 * POST /api/cms/media - Upload new media (tenant-scoped)
 *
 * All endpoints require authentication and tenant context.
 * Tenant is resolved from x-subdomain header or subdomain query parameter.
 */

import { NextRequest, NextResponse } from 'next/server'
import { listMedia, createMedia, getMediaStats } from '@/lib/cms/media'
import { processUpload, generatePresignedUrl, validateFile } from '@/lib/cms/media/upload'
import type { MediaFilters, MediaType } from '@/lib/cms/media/types'
import { stackServerApp } from '@/lib/cms/stack'
import { rateLimitCheck, RATE_LIMIT_PRESETS } from '@/lib/cms/rate-limit'
import {
  resolveTenantContext,
  getSubdomainFromRequest,
  getTenantIdBySubdomain,
  validateTenantOwnership,
  tenantRequiredResponse,
  tenantAccessDeniedResponse,
  type TenantContext,
} from '@/lib/cms/media/tenant'

export const dynamic = 'force-dynamic'

/**
 * Resolve tenant context, returning an error response if resolution fails.
 * This is a convenience wrapper for the route handlers.
 */
async function requireTenant(
  request: NextRequest,
  userId: string
): Promise<TenantContext | NextResponse> {
  const subdomain = await getSubdomainFromRequest(request)
  if (!subdomain) {
    return tenantRequiredResponse()
  }

  const owns = await validateTenantOwnership(userId, subdomain)
  if (!owns) {
    return tenantAccessDeniedResponse()
  }

  const tenantId = await getTenantIdBySubdomain(subdomain)
  if (!tenantId) {
    return tenantRequiredResponse()
  }

  return { subdomain, tenantId }
}

export async function GET(request: NextRequest) {
  try {
    // Auth check
    const user = await stackServerApp.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Resolve tenant context
    const tenantResult = await requireTenant(request, user.id)
    if (tenantResult instanceof NextResponse) return tenantResult
    const tenant = tenantResult

    const { searchParams } = new URL(request.url)

    // Parse filters from query params
    const filters: MediaFilters = {
      tenantId: tenant.tenantId,
      folderId: searchParams.get('folderId') || undefined,
      type: (searchParams.get('type') as MediaType) || undefined,
      search: searchParams.get('search') || undefined,
      tagIds: searchParams.get('tagIds')?.split(',').filter(Boolean) || undefined,
      includeDeleted: searchParams.get('includeDeleted') === 'true',
      page: parseInt(searchParams.get('page') || '1'),
      limit: Math.min(parseInt(searchParams.get('limit') || '50'), 100),
      sortBy: (searchParams.get('sortBy') as MediaFilters['sortBy']) || 'createdAt',
      sortOrder: (searchParams.get('sortOrder') as MediaFilters['sortOrder']) || 'desc',
    }

    // Handle special "recent" filter
    if (searchParams.get('recent') === 'true') {
      filters.sortBy = 'createdAt'
      filters.sortOrder = 'desc'
    }

    // Handle "null" folderId for root level
    if (searchParams.get('folderId') === 'null') {
      filters.folderId = null
    }

    // Check if stats are requested
    if (searchParams.get('stats') === 'true') {
      const stats = await getMediaStats(tenant.tenantId)
      return NextResponse.json(stats)
    }

    const result = await listMedia(filters)

    return NextResponse.json(result)
  } catch (error) {
    console.error('List media error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to list media' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const user = await stackServerApp.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Resolve tenant context
    const tenantResult = await requireTenant(request, user.id)
    if (tenantResult instanceof NextResponse) return tenantResult
    const tenant = tenantResult

    const contentType = request.headers.get('content-type') || ''

    // Handle presigned URL request
    if (contentType.includes('application/json')) {
      const body = await request.json()

      if (body.action === 'presign') {
        // Rate limit presign requests
        const presignLimited = await rateLimitCheck(request, RATE_LIMIT_PRESETS.presign)
        if (presignLimited) return presignLimited

        const { filename, mimeType, size } = body

        if (!filename || !mimeType || !size) {
          return NextResponse.json(
            { error: 'Missing required fields: filename, mimeType, size' },
            { status: 400 }
          )
        }

        // Validate file
        const validation = validateFile({ name: filename, type: mimeType, size })
        if (!validation.valid) {
          return NextResponse.json({ error: validation.error }, { status: 400 })
        }

        // Generate tenant-scoped presigned URL
        const presignedData = await generatePresignedUrl(filename, mimeType, size, {
          subdomain: tenant.subdomain,
          tenantId: tenant.tenantId,
        })

        return NextResponse.json(presignedData)
      }

      // Handle direct metadata creation (after upload to storage)
      if (body.action === 'complete') {
        // Rate limit upload completion requests
        const uploadLimited = await rateLimitCheck(request, RATE_LIMIT_PRESETS.upload)
        if (uploadLimited) return uploadLimited

        const {
          filename,
          originalName,
          mimeType,
          size,
          url,
          key,
          bucket,
          provider,
          width,
          height,
          folderId,
          alt,
          caption,
          title,
          tagIds,
        } = body

        // Verify the storage key belongs to this tenant (if tenant-scoped)
        if (key && key.startsWith('tenants/')) {
          const sanitizedSubdomain = tenant.subdomain.toLowerCase().replace(/[^a-z0-9-]/g, '')
          const expectedPrefix = `tenants/${sanitizedSubdomain}/`
          if (!key.startsWith(expectedPrefix)) {
            return NextResponse.json(
              { error: 'Access denied: storage key does not belong to this tenant' },
              { status: 403 }
            )
          }
        }

        const media = await createMedia({
          filename,
          originalName,
          mimeType,
          size,
          url,
          key,
          bucket,
          provider,
          width,
          height,
          folderId,
          alt,
          caption,
          title,
          tagIds,
          uploadedById: user.id,
          tenantId: tenant.tenantId,
        })

        return NextResponse.json(media, { status: 201 })
      }

      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // Handle multipart form data upload (for local storage or small files)
    if (contentType.includes('multipart/form-data')) {
      // Rate limit upload requests
      const uploadLimited = await rateLimitCheck(request, RATE_LIMIT_PRESETS.upload)
      if (uploadLimited) return uploadLimited

      const formData = await request.formData()
      const file = formData.get('file') as File

      if (!file) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 })
      }

      // Validate file
      const validation = validateFile({
        name: file.name,
        type: file.type,
        size: file.size,
      })

      if (!validation.valid) {
        return NextResponse.json({ error: validation.error }, { status: 400 })
      }

      // Get optional metadata from form
      const folderId = formData.get('folderId') as string | null
      const alt = formData.get('alt') as string | null
      const caption = formData.get('caption') as string | null
      const title = formData.get('title') as string | null
      const tagIds = (formData.get('tagIds') as string)?.split(',').filter(Boolean)

      // Generate tenant-scoped presigned URL and upload
      const presignedData = await generatePresignedUrl(file.name, file.type, file.size, {
        subdomain: tenant.subdomain,
        tenantId: tenant.tenantId,
      })

      // Upload file to storage
      const arrayBuffer = await file.arrayBuffer()
      const uploadResponse = await fetch(presignedData.uploadUrl, {
        method: 'PUT',
        body: arrayBuffer,
        headers: {
          'Content-Type': file.type,
          'Content-Length': file.size.toString(),
        },
      })

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file to storage')
      }

      // Create media record with tenant scoping
      const media = await processUpload(
        presignedData.key.split('/').pop()!,
        file.name,
        file.type,
        file.size,
        presignedData.publicUrl,
        presignedData.key,
        presignedData.bucket,
        presignedData.provider,
        {
          folderId: folderId || undefined,
          alt: alt || undefined,
          caption: caption || undefined,
          title: title || undefined,
          tagIds,
        },
        user.id,
        tenant.tenantId
      )

      return NextResponse.json(media, { status: 201 })
    }

    return NextResponse.json({ error: 'Invalid content type' }, { status: 400 })
  } catch (error) {
    console.error('Upload media error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to upload media' },
      { status: 500 }
    )
  }
}
