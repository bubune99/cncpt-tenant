import { timingSafeEqual } from 'crypto'

/**
 * Cron authorization. Fails CLOSED: with no CRON_SECRET configured every
 * request is rejected. Vercel Cron sends `Authorization: Bearer <CRON_SECRET>`
 * automatically once the env var exists; `x-cron-secret` is accepted for
 * manual triggers. Comparison is constant-time.
 *
 * Set the secret before relying on any schedule:
 *   openssl rand -hex 32 | npx vercel@latest env add CRON_SECRET production
 */
export function isAuthorizedCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false

  const header = request.headers.get('authorization') ?? ''
  const presented = header.startsWith('Bearer ')
    ? header.slice(7)
    : (request.headers.get('x-cron-secret') ?? '')

  const a = Buffer.from(presented)
  const b = Buffer.from(secret)
  return a.length === b.length && timingSafeEqual(a, b)
}
