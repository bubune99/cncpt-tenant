/**
 * Environment Variables API
 *
 * GET /api/env - Get all environment variables (masked)
 * PUT /api/env - Set an environment variable
 * DELETE /api/env - Delete an environment variable
 * POST /api/env/import - Import from .env format
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  getAllEnvVars,
  getEnvVarsByCategory,
  setEnvVar,
  deleteEnvVar,
  validateEnvVar,
  getEnvHealth,
  clearEnvCache,
} from '../../../lib/env'
import type { EnvCategory } from '../../../lib/env/types'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') as EnvCategory | null
    const healthCheck = searchParams.get('health') === 'true'

    if (healthCheck) {
      const health = await getEnvHealth()
      return NextResponse.json(health)
    }

    let variables
    if (category) {
      variables = await getEnvVarsByCategory(category)
    } else {
      variables = await getAllEnvVars()
    }

    return NextResponse.json({ variables })
  } catch (error) {
    console.error('Get env vars error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get environment variables' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { key, value } = body

    if (!key) {
      return NextResponse.json(
        { error: 'Environment variable key is required' },
        { status: 400 }
      )
    }

    if (value === undefined || value === null) {
      return NextResponse.json(
        { error: 'Environment variable value is required' },
        { status: 400 }
      )
    }

    // Validate
    const validation = validateEnvVar(key, value)
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.message },
        { status: 400 }
      )
    }

    // Store
    await setEnvVar(key, value)

    // Clear cache for related systems
    clearEnvCache()

    return NextResponse.json({
      success: true,
      message: `${key} has been updated`,
    })
  } catch (error) {
    console.error('Set env var error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to set environment variable' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { key } = body

    if (!key) {
      return NextResponse.json(
        { error: 'Environment variable key is required' },
        { status: 400 }
      )
    }

    await deleteEnvVar(key)
    clearEnvCache()

    return NextResponse.json({
      success: true,
      message: `${key} has been deleted`,
    })
  } catch (error) {
    console.error('Delete env var error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete environment variable' },
      { status: 500 }
    )
  }
}
