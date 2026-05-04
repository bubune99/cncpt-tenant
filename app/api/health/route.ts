import { NextResponse } from "next/server"

/**
 * Health check endpoint.
 *
 * Returns a small JSON payload that external uptime monitors (UptimeRobot,
 * Better Uptime, Vercel monitoring, etc.) can hit cheaply to confirm the
 * application is reachable and serving from the expected commit.
 *
 * Intentionally:
 *  - Does NOT touch the database. A DB-touching endpoint would conflate
 *    "app is up" with "DB is up" and could amplify outages by hammering a
 *    struggling DB. If you want a DB-aware probe, add /api/health/db
 *    separately so consumers can choose which signal they want.
 *  - Does NOT auth-gate. Health checks are public by convention.
 *  - Sets Cache-Control: no-store so probes always hit the origin and never
 *    a stale CDN copy.
 */
export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET() {
  const commit = process.env.VERCEL_GIT_COMMIT_SHA
  const region = process.env.VERCEL_REGION ?? null
  const env = process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown"

  return NextResponse.json(
    {
      ok: true,
      version: typeof commit === "string" && commit.length >= 7 ? commit.slice(0, 7) : "dev",
      env,
      region,
      ts: Date.now(),
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  )
}
