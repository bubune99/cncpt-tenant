/**
 * CMS CLI Shared Utilities
 * Table formatting, interactive prompts, colors, Prisma client accessor
 *
 * This mirrors the nextjs-cms CLI utils but with tenant-appropriate imports.
 */

import { createInterface } from "readline"
import { prisma } from "../db"

export { prisma }

// ── ANSI Colors ────────────────────────────────────────────────────

export const c = {
  reset: "\x1b[0m",
  bold: (s: string) => `\x1b[1m${s}\x1b[0m`,
  dim: (s: string) => `\x1b[2m${s}\x1b[0m`,
  red: (s: string) => `\x1b[31m${s}\x1b[0m`,
  green: (s: string) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s: string) => `\x1b[33m${s}\x1b[0m`,
  blue: (s: string) => `\x1b[34m${s}\x1b[0m`,
  magenta: (s: string) => `\x1b[35m${s}\x1b[0m`,
  cyan: (s: string) => `\x1b[36m${s}\x1b[0m`,
  white: (s: string) => `\x1b[37m${s}\x1b[0m`,
  bgRed: (s: string) => `\x1b[41m${s}\x1b[0m`,
  bgGreen: (s: string) => `\x1b[42m${s}\x1b[0m`,
  bgYellow: (s: string) => `\x1b[43m${s}\x1b[0m`,
}

// ── Symbols ────────────────────────────────────────────────────────

export const sym = {
  check: c.green("✓"),
  cross: c.red("✗"),
  arrow: c.cyan("→"),
  dot: c.dim("·"),
  warn: c.yellow("⚠"),
  info: c.blue("ℹ"),
  tree: "├──",
  treeLast: "└──",
  treePipe: "│  ",
  treeSpace: "   ",
}

// ── Table Formatting ───────────────────────────────────────────────

interface Column {
  key: string
  label: string
  width?: number
  align?: "left" | "right"
  format?: (value: unknown) => string
}

function pad(str: string, width: number, align: "left" | "right" = "left"): string {
  // Strip ANSI codes for length calculation
  const raw = str.replace(/\x1b\[[0-9;]*m/g, "")
  const diff = width - raw.length
  if (diff <= 0) return str.slice(0, width + (str.length - raw.length))
  return align === "right" ? " ".repeat(diff) + str : str + " ".repeat(diff)
}

export function table(columns: Column[], rows: Record<string, unknown>[]): string {
  // Calculate column widths
  const widths = columns.map((col) => {
    const headerLen = col.label.length
    const maxDataLen = rows.reduce((max, row) => {
      const val = col.format ? col.format(row[col.key]) : String(row[col.key] ?? "")
      const raw = val.replace(/\x1b\[[0-9;]*m/g, "")
      return Math.max(max, raw.length)
    }, 0)
    return col.width || Math.min(Math.max(headerLen, maxDataLen) + 2, 50)
  })

  const lines: string[] = []

  // Header
  const header = columns.map((col, i) => c.bold(pad(col.label, widths[i]))).join("  ")
  lines.push(header)
  lines.push(c.dim("─".repeat(widths.reduce((a, b) => a + b, 0) + (columns.length - 1) * 2)))

  // Rows
  for (const row of rows) {
    const line = columns
      .map((col, i) => {
        const val = col.format ? col.format(row[col.key]) : String(row[col.key] ?? "")
        return pad(val, widths[i], col.align)
      })
      .join("  ")
    lines.push(line)
  }

  if (rows.length === 0) {
    lines.push(c.dim("  (no results)"))
  }

  return lines.join("\n")
}

// ── Interactive Prompts ────────────────────────────────────────────

let rl: ReturnType<typeof createInterface> | null = null

function getRL() {
  if (!rl) {
    rl = createInterface({ input: process.stdin, output: process.stdout })
  }
  return rl
}

export function closeRL() {
  if (rl) {
    rl.close()
    rl = null
  }
}

export function ask(prompt: string, defaultValue?: string): Promise<string> {
  const suffix = defaultValue ? c.dim(` [${defaultValue}]`) : ""
  return new Promise((resolve) => {
    getRL().question(`${prompt}${suffix}: `, (answer) => {
      resolve(answer.trim() || defaultValue || "")
    })
  })
}

export async function confirm(prompt: string, defaultYes = true): Promise<boolean> {
  const hint = defaultYes ? "Y/n" : "y/N"
  const answer = await ask(`${prompt} ${c.dim(`(${hint})`)}`)
  if (!answer) return defaultYes
  return answer.toLowerCase().startsWith("y")
}

export async function select(
  prompt: string,
  options: { label: string; value: string }[]
): Promise<string> {
  console.log(`\n${prompt}`)
  for (let i = 0; i < options.length; i++) {
    console.log(`  ${c.cyan(String(i + 1))}. ${options[i].label}`)
  }
  const answer = await ask(`\nChoice ${c.dim(`(1-${options.length})`)}`)
  const idx = parseInt(answer, 10) - 1
  if (idx >= 0 && idx < options.length) return options[idx].value
  return options[0].value
}

// ── Output Helpers ─────────────────────────────────────────────────

export function heading(text: string) {
  console.log(`\n${c.bold(c.cyan(text))}`)
  console.log(c.dim("─".repeat(text.length + 4)))
}

export function success(msg: string) {
  console.log(`${sym.check} ${msg}`)
}

export function error(msg: string) {
  console.error(`${sym.cross} ${c.red(msg)}`)
}

export function warn(msg: string) {
  console.log(`${sym.warn} ${c.yellow(msg)}`)
}

export function info(msg: string) {
  console.log(`${sym.info} ${msg}`)
}

// ── Argument Parsing ───────────────────────────────────────────────

export function parseArgs(argv: string[]): {
  positional: string[]
  flags: Record<string, string | boolean>
} {
  const positional: string[] = []
  const flags: Record<string, string | boolean> = {}

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg.startsWith("--")) {
      const key = arg.slice(2)
      const next = argv[i + 1]
      if (next && !next.startsWith("--")) {
        flags[key] = next
        i++
      } else {
        flags[key] = true
      }
    } else {
      positional.push(arg)
    }
  }

  return { positional, flags }
}

// ── Stdin Reader ──────────────────────────────────────────────────

/**
 * Read all data from stdin (for piped/heredoc input).
 * Returns null if stdin is a TTY (no piped data).
 */
export function readStdin(): Promise<string | null> {
  if (process.stdin.isTTY) return Promise.resolve(null)
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    process.stdin.on("data", (chunk) => chunks.push(chunk))
    process.stdin.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8").trim()))
    process.stdin.on("error", reject)
  })
}

// ── Block Helpers ──────────────────────────────────────────────────

export function formatStatus(status: string): string {
  switch (status) {
    case "PUBLISHED":
      return c.green("PUBLISHED")
    case "DRAFT":
      return c.yellow("DRAFT")
    case "ARCHIVED":
      return c.dim("ARCHIVED")
    default:
      return status
  }
}

export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str
  return str.slice(0, maxLen - 1) + "…"
}

export function formatDate(date: Date | null): string {
  if (!date) return c.dim("—")
  return date.toISOString().slice(0, 10)
}

// ── Tenant Resolution ─────────────────────────────────────────────

/**
 * Resolve a --tenant argument (numeric ID or subdomain string) to a numeric tenant ID.
 * Errors with a helpful message listing available subdomains if not found.
 */
export async function resolveTenantId(tenantArg: string): Promise<{ id: number; label: string }> {
  // If numeric, look up by ID
  const asNum = parseInt(tenantArg, 10)
  if (!isNaN(asNum) && String(asNum) === tenantArg) {
    try {
      const rows: { id: number; subdomain: string }[] = await prisma.$queryRaw`
        SELECT id, subdomain FROM "Subdomain" WHERE id = ${asNum} LIMIT 1
      `
      if (rows.length > 0) {
        return { id: rows[0].id, label: `${rows[0].subdomain} (id: ${rows[0].id})` }
      }
    } catch {
      // Table may not exist in single-tenant schema
    }
    throw new Error(`Tenant with id ${asNum} not found.`)
  }

  // Otherwise look up by subdomain name
  try {
    const rows: { id: number; subdomain: string }[] = await prisma.$queryRaw`
      SELECT id, subdomain FROM "Subdomain" WHERE subdomain = ${tenantArg} LIMIT 1
    `
    if (rows.length > 0) {
      return { id: rows[0].id, label: `${rows[0].subdomain} (id: ${rows[0].id})` }
    }
  } catch {
    // Table may not exist
  }

  // Not found — list available subdomains
  let hint = ""
  try {
    const all: { subdomain: string }[] = await prisma.$queryRaw`
      SELECT subdomain FROM "Subdomain" ORDER BY subdomain LIMIT 10
    `
    if (all.length > 0) {
      hint = `\nAvailable subdomains: ${all.map((r) => r.subdomain).join(", ")}`
    }
  } catch { /* ignore */ }

  throw new Error(`Tenant "${tenantArg}" not found.${hint}`)
}

/**
 * Auto-detect tenant when multi-tenant schema is present but no --tenant flag given.
 * Returns the tenant if exactly one exists, otherwise throws with instructions.
 */
export async function autoDetectTenant(): Promise<{ id: number; label: string } | null> {
  try {
    const rows: { id: number; subdomain: string }[] = await prisma.$queryRaw`
      SELECT id, subdomain FROM "Subdomain" ORDER BY id LIMIT 2
    `
    if (rows.length === 1) {
      return { id: rows[0].id, label: `${rows[0].subdomain} (id: ${rows[0].id}) [auto-detected]` }
    }
    if (rows.length > 1) {
      const all: { subdomain: string }[] = await prisma.$queryRaw`
        SELECT subdomain FROM "Subdomain" ORDER BY subdomain LIMIT 10
      `
      const names = all.map((r) => r.subdomain).join(", ")
      throw new Error(
        `Multi-tenant schema detected with multiple tenants. Use --tenant <subdomain> to specify which tenant.\nAvailable: ${names}`
      )
    }
  } catch (e) {
    if (e instanceof Error && e.message.includes("Multi-tenant")) throw e
    // Subdomain table doesn't exist — single tenant
  }
  return null
}
