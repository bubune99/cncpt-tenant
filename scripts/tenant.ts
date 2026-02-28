#!/usr/bin/env tsx
/**
 * tenant CLI — cncpt-tenant platform management
 *
 * Usage: pnpm tenant <domain> <action> [args] [flags]
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'

// Load .env before anything else
try {
  const envPath = resolve(process.cwd(), '.env')
  const envFile = readFileSync(envPath, 'utf-8')
  for (const line of envFile.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '')
    if (!process.env[key]) {
      process.env[key] = val
    }
  }
} catch {
  // .env not found — rely on existing env vars
}

import { parseArgs, error, c } from '@/lib/cli/utils'
import { showHelp } from '@/lib/cli/help'

async function main() {
  const argv = process.argv.slice(2)
  const { positional, flags } = parseArgs(argv)

  const domain = positional[0]
  const action = positional[1]
  const rest = parseArgs(argv.slice(2))

  // Help routing
  if (!domain || domain === 'help') {
    showHelp(positional[1])
    return
  }

  if (flags.help) {
    showHelp(domain)
    return
  }

  if (!action) {
    if (domain === 'help') { showHelp(); return }
    showHelp(domain)
    return
  }

  // Route to domain handlers
  try {
    switch (domain) {
      case 'users': {
        const { handleUsers } = await import('@/lib/cli/users')
        await handleUsers(action, rest)
        break
      }
      case 'subdomains': {
        const { handleSubdomains } = await import('@/lib/cli/subdomains')
        await handleSubdomains(action, rest)
        break
      }
      case 'teams': {
        const { handleTeams } = await import('@/lib/cli/teams')
        await handleTeams(action, rest)
        break
      }
      case 'permissions': {
        const { handlePermissions } = await import('@/lib/cli/permissions')
        await handlePermissions(action, rest)
        break
      }
      case 'super-admin': {
        const { handleSuperAdmin } = await import('@/lib/cli/super-admin')
        await handleSuperAdmin(action, rest)
        break
      }
      case 'tiers': {
        const { handleTiers } = await import('@/lib/cli/tiers')
        await handleTiers(action, rest)
        break
      }
      default:
        error(`Unknown domain: ${domain}`)
        console.log(`\n  Available: ${c.bold}users${c.reset}, ${c.bold}subdomains${c.reset}, ${c.bold}teams${c.reset}, ${c.bold}permissions${c.reset}, ${c.bold}super-admin${c.reset}, ${c.bold}tiers${c.reset}`)
        console.log(`  Run ${c.dim}pnpm tenant help${c.reset} for full reference\n`)
    }
  } catch (err: any) {
    if (err.code === 'P1001' || err.code === 'P1003') {
      error('Cannot connect to database. Check DATABASE_URL in .env')
    } else if (err.message?.includes('DATABASE_URL')) {
      error('DATABASE_URL not configured. Set it in .env')
    } else {
      error(err.message || 'Unknown error')
      if (process.env.DEBUG) console.error(err)
    }
    process.exit(1)
  }
}

main()
  .catch(() => {
    // Errors already handled in main()
  })
  .finally(async () => {
    // Graceful shutdown — disconnect Prisma pool
    try {
      const { prisma } = await import('@/lib/cms/db')
      await (prisma as any).$disconnect?.()
    } catch {}
    // Force exit to prevent hanging connections
    setTimeout(() => process.exit(0), 100)
  })
