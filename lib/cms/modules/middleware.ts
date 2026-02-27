/**
 * Module Gating Middleware
 *
 * HOF that wraps API route handlers to check if a module is enabled.
 * Composable with existing withPermission middleware.
 *
 * Usage:
 *   export const GET = withModule('commerce', handler)
 *   export const GET = withModule('commerce', withPermission('products.view', handler))
 */

import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { isModuleEnabled } from "./registry"

export function withModule<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  T extends (request: NextRequest, ...args: any[]) => Promise<NextResponse>,
>(moduleSlug: string, handler: T): T {
  const wrapped = async (
    request: NextRequest,
    ...args: Parameters<T> extends [NextRequest, ...infer R] ? R : never[]
  ) => {
    const enabled = await isModuleEnabled(moduleSlug)
    if (!enabled) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "MODULE_DISABLED",
            message: "This feature is not enabled",
          },
        },
        { status: 404 }
      )
    }
    return handler(request, ...args)
  }

  return wrapped as unknown as T
}
