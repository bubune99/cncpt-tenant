/**
 * CLI Domains Domain — list / add / verify / primary / remove / status
 *
 * Calls into lib/cms/domains/core which has the auth-free shared logic.
 * The CLI is privileged by virtue of running with the platform's
 * DATABASE_URL + VERCEL_API_TOKEN, so it skips per-user authorization
 * checks. Don't expose this CLI over a network surface.
 */

import {
  heading,
  table,
  success,
  error,
  warn,
  info,
  label,
  dim,
  confirm,
  formatDate,
  truncate,
  c,
  sym,
  type ParsedArgs,
} from "./utils"

import {
  listDomainsForSubdomain,
  addCustomDomain,
  removeCustomDomain,
  verifyDomain,
  setPrimaryDomain,
  getDnsRecordsForDomain,
} from "@/lib/cms/domains/core"

const STATUS_COLORS: Record<string, (s: string) => string> = {
  active: (s) => `${c.green}${s}${c.reset}`,
  pending: (s) => `${c.yellow}${s}${c.reset}`,
  verifying: (s) => `${c.yellow}${s}${c.reset}`,
  provisioning: (s) => `${c.yellow}${s}${c.reset}`,
  error: (s) => `${c.red}${s}${c.reset}`,
}

function colorStatus(s: string): string {
  return (STATUS_COLORS[s] ?? ((x) => x))(s)
}

export async function handleDomains(action: string, args: ParsedArgs) {
  // Verify subdomain exists for any action that needs it. Everything except
  // help requires a subdomain as the first positional, so do this once.
  const requireSubdomain = async (
    pos: number,
    usage: string,
  ): Promise<string | null> => {
    const name = args.positional[pos]
    if (!name) {
      error(`Usage: ${usage}`)
      return null
    }
    const { prisma } = await import("@/lib/cms/db")
    const sub = await prisma.subdomain.findUnique({
      where: { subdomain: name },
    })
    if (!sub) {
      error(`Subdomain not found: ${name}`)
      info(`Run \`pnpm tenant subdomains list\` to see available subdomains.`)
      return null
    }
    return name
  }

  switch (action) {
    case "list": {
      const sub = await requireSubdomain(0, "tenant domains list <subdomain>")
      if (!sub) return

      const enrich = args.flags["no-vercel"] !== true
      const domains = await listDomainsForSubdomain(sub, {
        enrichWithVercelStatus: enrich,
      })

      if (domains.length === 0) {
        heading(`Domains for ${sub}`)
        info(`No custom domains attached.`)
        info(`Add one with: \`pnpm tenant domains add ${sub} <domain>\``)
        return
      }

      heading(`Domains for ${sub}`)
      table(
        ["Domain", "Primary", "Status", "SSL", "Verified at", "Vercel"],
        domains.map((d) => [
          d.domain,
          d.is_primary ? `${c.green}${sym.check}${c.reset}` : dim("·"),
          colorStatus(d.status),
          colorStatus(d.ssl_status),
          formatDate(d.verified_at),
          d.vercel_status
            ? d.vercel_status.verified
              ? `${c.green}verified${c.reset}`
              : `${c.yellow}pending${c.reset}`
            : dim("—"),
        ]),
      )
      break
    }

    case "add": {
      const sub = await requireSubdomain(
        0,
        "tenant domains add <subdomain> <domain> [--project <vercel_project_id>]",
      )
      if (!sub) return

      const domain = args.positional[1]
      if (!domain) {
        error(`Usage: tenant domains add ${sub} <domain>`)
        return
      }

      const vercelProjectId = args.flags.project as string | undefined

      info(`Attaching ${domain} to ${sub}...`)
      const result = await addCustomDomain(sub, domain, { vercelProjectId })
      if (!result.success) {
        error(result.error)
        return
      }

      success(`Added ${domain} to ${sub}`)
      label("ID", result.data.id)
      label("Status", result.data.status)
      label("Primary", result.data.is_primary ? "yes" : "no")
      if (result.data.verification_value) {
        label("Verification type", result.data.verification_type ?? "—")
        label("Verification value", result.data.verification_value)
      }

      // DNS instructions
      console.log()
      heading("DNS records to add at your registrar")
      const records = getDnsRecordsForDomain(domain, sub)
      table(
        ["Type", "Name", "Value", "Note"],
        records.map((r) => [r.type, r.name, r.value, r.note]),
      )

      console.log()
      info(
        `After DNS propagates (usually 1–48 hours), run:\n  pnpm tenant domains verify ${sub} ${domain}`,
      )
      break
    }

    case "verify": {
      const sub = await requireSubdomain(
        0,
        "tenant domains verify <subdomain> <domain>",
      )
      if (!sub) return

      const domain = args.positional[1]
      if (!domain) {
        error(`Usage: tenant domains verify ${sub} <domain>`)
        return
      }

      info(`Verifying ${domain}...`)
      const result = await verifyDomain(sub, domain)
      if (!result.success) {
        error(result.error)
        return
      }

      if (result.data.verified) {
        success(`${domain} is verified — DNS + SSL ready, mapped in Edge Config`)
      } else {
        warn(`${domain} not yet verified`)
        if (result.data.status.misconfigured) {
          warn("DNS is misconfigured. Confirm the records at your registrar.")
        } else {
          info("DNS may still be propagating. Re-run verify in a few minutes.")
        }
      }

      label("Verified", String(result.data.status.verified))
      label("SSL ready", String(result.data.status.sslReady))
      if (result.data.status.misconfigured)
        label("Misconfigured", String(result.data.status.misconfigured))
      break
    }

    case "primary": {
      const sub = await requireSubdomain(
        0,
        "tenant domains primary <subdomain> <domain>",
      )
      if (!sub) return

      const domain = args.positional[1]
      if (!domain) {
        error(`Usage: tenant domains primary ${sub} <domain>`)
        return
      }

      const result = await setPrimaryDomain(sub, domain)
      if (!result.success) {
        error(result.error)
        return
      }
      success(`${domain} is now the primary domain for ${sub}`)
      break
    }

    case "remove": {
      const sub = await requireSubdomain(
        0,
        "tenant domains remove <subdomain> <domain> [--yes]",
      )
      if (!sub) return

      const domain = args.positional[1]
      if (!domain) {
        error(`Usage: tenant domains remove ${sub} <domain>`)
        return
      }

      const skipConfirm = args.flags.yes === true || args.flags.y === true
      if (!skipConfirm) {
        const ok = await confirm(
          `Remove ${domain} from ${sub}? This detaches from Vercel + Edge Config + DB.`,
          false,
        )
        if (!ok) {
          info("Cancelled.")
          return
        }
      }

      const result = await removeCustomDomain(sub, domain)
      if (!result.success) {
        error(result.error)
        return
      }
      success(`Removed ${domain} from ${sub}`)
      break
    }

    case "status": {
      const sub = await requireSubdomain(
        0,
        "tenant domains status <subdomain>",
      )
      if (!sub) return

      const domains = await listDomainsForSubdomain(sub, {
        enrichWithVercelStatus: true,
      })

      heading(`Domain status for ${sub}`)
      if (domains.length === 0) {
        info("No custom domains attached.")
        return
      }

      for (const d of domains) {
        console.log()
        label("Domain", d.domain + (d.is_primary ? " (primary)" : ""))
        label("Status", colorStatus(d.status))
        label("SSL", colorStatus(d.ssl_status))
        label("Verified at", formatDate(d.verified_at))
        if (d.verification_type) {
          label("Verification", `${d.verification_type}: ${truncate(d.verification_value || "", 40)}`)
        }
        if (d.vercel_status) {
          label(
            "Vercel",
            d.vercel_status.verified
              ? `${c.green}verified${c.reset}`
              : `${c.yellow}pending${c.reset} ${d.vercel_status.misconfigured ? `${c.red}(misconfigured)${c.reset}` : ""}`,
          )
        }
      }
      break
    }

    case "dns-records": {
      const sub = await requireSubdomain(
        0,
        "tenant domains dns-records <subdomain> <domain>",
      )
      if (!sub) return

      const domain = args.positional[1]
      if (!domain) {
        error(`Usage: tenant domains dns-records ${sub} <domain>`)
        return
      }

      const records = getDnsRecordsForDomain(domain, sub)
      heading(`DNS records for ${domain} → ${sub}`)
      table(
        ["Type", "Name", "Value", "Note"],
        records.map((r) => [r.type, r.name, r.value, r.note]),
      )
      break
    }

    default: {
      error(`Unknown action: ${action}`)
      info(
        `Available: list, add, verify, primary, remove, status, dns-records`,
      )
      info(`Run \`pnpm tenant domains help\` for details.`)
    }
  }
}
