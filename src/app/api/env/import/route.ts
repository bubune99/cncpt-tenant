/**
 * Environment Variables Import API
 *
 * POST /api/env/import - Import environment variables from .env format
 */

import { NextRequest, NextResponse } from 'next/server'
import { importEnvVars, clearEnvCache } from '../../../../lib/env'

export async function POST(request: NextRequest) {
  try {
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
