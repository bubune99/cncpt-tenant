/**
 * Storage Status API
 *
 * GET /api/media/storage-status - Check if storage is configured
 */

import { NextResponse } from 'next/server'
import { checkStorageConfig } from '@/lib/media/upload'

export async function GET() {
  try {
    const status = await checkStorageConfig()
    return NextResponse.json(status)
  } catch (error) {
    console.error('Storage status check error:', error)
    return NextResponse.json(
      {
        configured: false,
        provider: 'unknown',
        missingFields: [],
        message: error instanceof Error ? error.message : 'Failed to check storage status',
      },
      { status: 500 }
    )
  }
}
