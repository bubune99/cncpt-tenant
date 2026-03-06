#!/usr/bin/env npx tsx
/**
 * CMS CLI — Unified command-line interface for managing CMS content
 *
 * This is the CMS-specific CLI for managing pages, blocks, partials, etc.
 * For platform-level management (subdomains, teams, tiers), use `pnpm tenant`.
 *
 * Usage:
 *   pnpm cms <domain> <action> [args] [flags]
 *   npx tsx scripts/cms.ts <domain> <action> [args] [flags]
 *
 * Examples:
 *   pnpm cms help
 *   pnpm cms pages list
 *   pnpm cms blocks tree my-page
 *   pnpm cms --tenant my-site pages list
 */

import "dotenv/config"
import {
  parseArgs, closeRL, error, info, c,
  resolveTenantId, autoDetectTenant,
} from "@/lib/cms/cli/utils"
import { isMultiTenant } from "@/lib/cms/cli/validation"
import { printHelp } from "@/lib/cms/cli/help"
import { handlePages } from "@/lib/cms/cli/pages"
import { handlePartials } from "@/lib/cms/cli/partials"
import { handleBlocks } from "@/lib/cms/cli/blocks"
import { handleRoutes, handleLinks } from "@/lib/cms/cli/routes"
import { handleUsers } from "@/lib/cms/cli/users"
import { handleRoles } from "@/lib/cms/cli/roles"
import { handlePermissions } from "@/lib/cms/cli/permissions-cli"
import { handleImport } from "@/lib/cms/cli/import-cli"

async function main() {
  // Skip node and script path: argv[0]=node, argv[1]=script
  const rawArgs = process.argv.slice(2)
  const { positional, flags } = parseArgs(rawArgs)

  const domain = positional[0]
  const action = positional[1]
  const args = positional.slice(2)

  // Help
  if (!domain || domain === "help" || flags.help) {
    printHelp(action || (positional[1] as string))
    return
  }

  // Domain-specific --help
  if (action === "help" || flags.help) {
    printHelp(domain)
    return
  }

  if (!action) {
    printHelp(domain)
    return
  }

  // ── Resolve global --tenant flag ──────────────────────────────
  let tenantId: number | null = null

  const multiTenant = await isMultiTenant()
  if (typeof flags.tenant === "string") {
    const resolved = await resolveTenantId(flags.tenant)
    tenantId = resolved.id
    info(`Tenant: ${resolved.label}`)
    delete flags.tenant  // Don't pass to domain handlers as a flag
  } else if (multiTenant) {
    // Auto-detect if only one tenant exists
    const auto = await autoDetectTenant()
    if (auto) {
      tenantId = auto.id
      info(`Tenant: ${auto.label}`)
    }
    // If auto returns null and no --tenant flag, domain handlers that need it will error via validation
  }

  // Inject tenantId into flags for domain handlers to consume
  if (tenantId !== null) {
    flags._tenantId = String(tenantId)
  }

  // Route to domain handler
  switch (domain) {
    case "pages":
      await handlePages(action, args, flags)
      break
    case "partials":
      await handlePartials(action, args, flags)
      break
    case "blocks":
      await handleBlocks(action, args, flags)
      break
    case "routes":
      await handleRoutes(action, args, flags)
      break
    case "links":
      await handleLinks(action, args, flags)
      break
    case "users":
      await handleUsers(action, args, flags)
      break
    case "roles":
      await handleRoles(action, args, flags)
      break
    case "permissions":
      await handlePermissions(action, args, flags)
      break
    case "import":
      // For import, the "action" is actually the first arg (the path)
      await handleImport([action, ...args], flags)
      break
    default:
      error(`Unknown domain: ${domain}`)
      info(`Run ${c.cyan("cms help")} for a list of all commands.`)
  }
}

main()
  .catch((e) => {
    error(`Fatal: ${e.message}`)
    if (process.env.DEBUG) console.error(e.stack)
    process.exit(1)
  })
  .finally(() => {
    closeRL()
    // Give Prisma a moment to close connections
    setTimeout(() => process.exit(0), 100)
  })
