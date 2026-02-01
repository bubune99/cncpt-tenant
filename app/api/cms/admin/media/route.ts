/**
 * Tenant Media API
 *
 * Handles media uploads, listing, and deletion for multi-tenant storage.
 * All operations are scoped to the authenticated user's subdomain.
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import {
  listTenantMedia,
  uploadTenantMedia,
  deleteTenantMedia,
  getTenantCategories,
  getTenantStorageUsage,
  R2_CONFIG,
  type MediaCategory,
} from '@/lib/cms/r2/client';

// Get subdomain from request headers (set by middleware)
async function getSubdomain(req: NextRequest): Promise<string | null> {
  const headersList = await headers();
  const subdomain = headersList.get('x-subdomain');

  // Also check query param for admin panel usage
  const url = new URL(req.url);
  const querySubdomain = url.searchParams.get('subdomain');

  return subdomain || querySubdomain;
}

/**
 * GET /api/cms/admin/media
 * List media for the current tenant
 *
 * Query params:
 * - category: Filter by category (e.g., 'media/images', 'products')
 * - maxKeys: Max items to return (default 50)
 * - continuationToken: For pagination
 * - stats: If 'true', return storage usage stats instead of media list
 */
export async function GET(req: NextRequest) {
  try {
    if (!R2_CONFIG.isConfigured) {
      return NextResponse.json(
        { error: 'R2 storage is not configured' },
        { status: 503 }
      );
    }

    const subdomain = await getSubdomain(req);
    if (!subdomain) {
      return NextResponse.json(
        { error: 'Subdomain required' },
        { status: 400 }
      );
    }

    const url = new URL(req.url);
    const category = url.searchParams.get('category') as MediaCategory | null;
    const maxKeys = parseInt(url.searchParams.get('maxKeys') || '50', 10);
    const continuationToken = url.searchParams.get('continuationToken') || undefined;
    const stats = url.searchParams.get('stats') === 'true';

    // Return storage stats if requested
    if (stats) {
      const usage = await getTenantStorageUsage(subdomain);
      const categories = await getTenantCategories(subdomain);
      return NextResponse.json({
        success: true,
        usage,
        categories,
      });
    }

    // List media
    const result = await listTenantMedia(subdomain, category || undefined, {
      maxKeys,
      continuationToken,
    });

    return NextResponse.json({
      success: true,
      media: result.media,
      nextToken: result.nextToken,
      hasMore: !!result.nextToken,
    });
  } catch (error) {
    console.error('Error listing media:', error);
    return NextResponse.json(
      { error: 'Failed to list media' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cms/admin/media
 * Upload media for the current tenant
 *
 * Form data:
 * - file: The file to upload
 * - category: Media category (default 'media/images')
 */
export async function POST(req: NextRequest) {
  try {
    if (!R2_CONFIG.isConfigured) {
      return NextResponse.json(
        { error: 'R2 storage is not configured' },
        { status: 503 }
      );
    }

    const subdomain = await getSubdomain(req);
    if (!subdomain) {
      return NextResponse.json(
        { error: 'Subdomain required' },
        { status: 400 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const category = (formData.get('category') as MediaCategory) || 'media/images';

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      'application/pdf',
      'video/mp4',
      'video/webm',
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `File type ${file.type} not allowed` },
        { status: 400 }
      );
    }

    // Check file size (50MB max)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 50MB.' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to R2
    const result = await uploadTenantMedia(
      subdomain,
      buffer,
      file.name,
      category,
      file.type
    );

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      media: result,
    });
  } catch (error) {
    console.error('Error uploading media:', error);
    return NextResponse.json(
      { error: 'Failed to upload media' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/cms/admin/media
 * Delete media for the current tenant
 *
 * Body:
 * - key: The storage key to delete
 */
export async function DELETE(req: NextRequest) {
  try {
    if (!R2_CONFIG.isConfigured) {
      return NextResponse.json(
        { error: 'R2 storage is not configured' },
        { status: 503 }
      );
    }

    const subdomain = await getSubdomain(req);
    if (!subdomain) {
      return NextResponse.json(
        { error: 'Subdomain required' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { key } = body;

    if (!key) {
      return NextResponse.json(
        { error: 'Storage key required' },
        { status: 400 }
      );
    }

    // Delete from R2 (function verifies tenant ownership)
    const success = await deleteTenantMedia(subdomain, key);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete file or unauthorized' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting media:', error);
    return NextResponse.json(
      { error: 'Failed to delete media' },
      { status: 500 }
    );
  }
}
