/**
 * Environment Variables Import API
 *
 * POST /api/env/import - Import environment variables from .env format
 */

import { NextRequest, NextResponse } from 'next/server'
import { importEnvVars, clearEnvCache } from '@/lib/cms/env'
import { stackServerApp } from '@/lib/cms/stack'
import { isSuperAdmin } from '@/lib/super-admin'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const user = await stackServerApp.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const isAdmin = await isSuperAdmin(user.id)
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden: platform admin access required' }, { status: 403 })
    }
    const body = await request.json()
    const { envString, overwrite = false } = body

    if (!envString || typeof envString !== 'string') {
      return NextResponse.json(
        { error: 'envString is required and must be a string' },
        { status: 400 }
      )
    }

    const result = await importEnvVars(envString, overwrite)

    // Clear cache after import
    clearEnvCache()

    return NextResponse.json(result)
  } catch (error) {
    console.error('Import env vars error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to import environment variables' },
      { status: 500 }
    )
  }
}
