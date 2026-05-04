/**
 * Blog Categories API
 *
 * GET /api/blog/categories - List all categories (tenant-scoped)
 * POST /api/blog/categories - Create a new category (tenant-scoped)
 */

import { NextRequest, NextResponse } from 'next/server'
import { listCategories, createCategory } from '@/lib/cms/blog'
import { withTenant, withTenantAuth } from '@/lib/cms/api/tenant'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  return withTenant(request, async (tenant) => {
    try {
      const { searchParams } = new URL(request.url)

      const options = {
        parentId: searchParams.has('parentId')
          ? searchParams.get('parentId') || null
          : undefined,
        search: searchParams.get('search') || undefined,
        limit: parseInt(searchParams.get('limit') || '100'),
        offset: parseInt(searchParams.get('offset') || '0'),
        tenantId: tenant.tenantId,
      }

      const result = await listCategories(options)
      return NextResponse.json(result)
    } catch (error) {
      console.error('List categories error:', error)
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to list categories' },
        { status: 500 }
      )
    }
  })
}

export async function POST(request: NextRequest) {
  return withTenantAuth(request, 'edit', async (tenant) => {
    try {
      const body = await request.json()

      if (!body.name) {
        return NextResponse.json(
          { error: 'Category name is required' },
          { status: 400 }
        )
      }

      body.tenantId = tenant.tenantId
      const category = await createCategory(body)
      return NextResponse.json(category, { status: 201 })
    } catch (error) {
      console.error('Create category error:', error)
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to create category' },
        { status: 500 }
      )
    }
  })
}
