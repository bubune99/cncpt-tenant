/**
 * Feature Gating Middleware for API Routes
 *
 * HOF that wraps API route handlers to check if a feature is enabled.
 * Works with both module-level ("commerce") and sub-feature ("commerce.reviews") keys.
 *
 * Usage:
 *   export const GET = withFeature('commerce', handler)
 *   export const GET = withFeature('commerce.reviews', handler)
 *   export const GET = withFeature(['commerce', 'blog'], handler) // requires ALL
 */

import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { hasFeature, hasAllFeatures } from "./resolver"
import { getCurrentTenant } from "../db/tenant-context"

type RouteHandler = (
  request: NextRequest,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ...args: any[]
) => Promise<NextResponse>

/**
 * Wrap an API handler to require one or more features.
 *
 * Returns 403 if the feature is disabled for the current tenant.
 */
export function withFeature<T extends RouteHandler>(
  featureKey: string | string[],
  handler: T
): T {
  const wrapped = async (
    request: NextRequest,
    ...args: unknown[]
  ): Promise<NextResponse> => {
    const tenantId = getCurrentTenant()

    let allowed: boolean
    if (Array.isArray(featureKey)) {
      allowed = await hasAllFeatures(featureKey, tenantId ?? undefined)
    } else {
      allowed = await hasFeature(featureKey, tenantId ?? undefined)
    }

    if (!allowed) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "FEATURE_DISABLED",
            message: `This feature is not enabled for your site.`,
            feature: featureKey,
          },
        },
        { status: 403 }
      )
    }

    return handler(request, ...args)
  }

  return wrapped as unknown as T
}

/**
 * Lighter-weight check for use inside existing handlers.
 * Throws a structured error that can be caught and returned as JSON.
 */
export async function requireFeature(
  featureKey: string,
  tenantId?: number
): Promise<void> {
  const allowed = await hasFeature(featureKey, tenantId)
  if (!allowed) {
    const error = new Error(`Feature "${featureKey}" is not enabled`) as Error & {
      code: string
      status: number
    }
    error.code = "FEATURE_DISABLED"
    error.status = 403
    throw error
  }
}
