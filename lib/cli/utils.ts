/**
 * CLI Utilities — colors, table formatting, prompts, arg parsing
 */

import * as readline from 'readline'

// ANSI colors
export const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
}

export const sym = {
  check: '\u2713',
  cross: '\u2717',
  arrow: '\u2192',
  bullet: '\u2022',
  warning: '\u26A0',
  bar: '\u2502',
  dash: '\u2500',
  corner: '\u2514',
  tee: '\u251C',
}

// Output helpers
export function heading(text: string) {
  console.log(`\n${c.bold}${c.cyan}${text}${c.reset}`)
  console.log(`${c.dim}${sym.dash.repeat(text.length)}${c.reset}`)
}

export function success(text: string) {
  console.log(`${c.green}${sym.check} ${text}${c.reset}`)
}

export function error(text: string) {
  console.error(`${c.red}${sym.cross} ${text}${c.reset}`)
}

export function warn(text: string) {
  console.log(`${c.yellow}${sym.warning}  ${text}${c.reset}`)
}

export function info(text: string) {
  console.log(`${c.blue}${sym.arrow} ${text}${c.reset}`)
}

export function dim(text: string) {
  return `${c.dim}${text}${c.reset}`
}

export function label(key: string, value: string | number | boolean | null | undefined) {
  const v = value === null || value === undefined ? dim('(none)') : String(value)
  console.log(`  ${c.gray}${key}:${c.reset} ${v}`)
}

// String utilities
export function truncate(str: string, len: number): string {
  if (!str) return ''
  return str.length > len ? str.slice(0, len - 1) + '\u2026' : str
}

export function formatDate(date: Date | string | number | null | undefined): string {
  if (!date) return '-'
  const d = date instanceof Date ? date : new Date(date)
  if (isNaN(d.getTime())) return '-'
  return d.toISOString().replace('T', ' ').slice(0, 19)
}

export function pad(str: string, len: number): string {
  // Strip ANSI for length calc
  const stripped = str.replace(/\x1b\[[0-9;]*m/g, '')
  const padding = Math.max(0, len - stripped.length)
  return str + ' '.repeat(padding)
}

// Table formatter
export function table(headers: string[], rows: (string | number | boolean | null | undefined)[][]) {
  if (rows.length === 0) {
    console.log(`\n  ${c.dim}No results${c.reset}\n`)
    return
  }

  // Convert all values to strings
  const strRows = rows.map(row => row.map(v => v === null || v === undefined ? '-' : String(v)))

  // Calculate column widths
  const widths = headers.map((h, i) => {
    const maxData = strRows.reduce((max, row) => Math.max(max, (row[i] || '').length), 0)
    return Math.max(h.length, maxData) + 2
  })

  // Header
  const headerLine = headers.map((h, i) => `${c.bold}${pad(h, widths[i])}${c.reset}`).join('')
  console.log(`\n  ${headerLine}`)
  console.log(`  ${c.dim}${widths.map(w => sym.dash.repeat(w)).join('')}${c.reset}`)

  // Rows
  for (const row of strRows) {
    const line = row.map((v, i) => pad(v, widths[i])).join('')
    console.log(`  ${line}`)
  }

  console.log(`\n  ${c.dim}${strRows.length} row${strRows.length === 1 ? '' : 's'}${c.reset}\n`)
}

// Prompt utilities
const rl = () => readline.createInterface({ input: process.stdin, output: process.stdout })

export async function ask(question: string): Promise<string> {
  const r = rl()
  return new Promise(resolve => {
    r.question(`${c.cyan}? ${c.reset}${question} `, answer => {
      r.close()
      resolve(answer.trim())
    })
  })
}

export async function confirm(question: string, defaultYes = false): Promise<boolean> {
  const hint = defaultYes ? 'Y/n' : 'y/N'
  const answer = await ask(`${question} (${hint})`)
  if (answer === '') return defaultYes
  return answer.toLowerCase().startsWith('y')
}

export async function select(question: string, options: string[]): Promise<string> {
  console.log(`\n${c.cyan}? ${c.reset}${question}`)
  options.forEach((opt, i) => {
    console.log(`  ${c.dim}${i + 1}.${c.reset} ${opt}`)
  })
  const answer = await ask(`Select (1-${options.length})`)
  const idx = parseInt(answer) - 1
  if (idx >= 0 && idx < options.length) return options[idx]
  return options[0]
}

// Arg parser
export interface ParsedArgs {
  positional: string[]
  flags: Record<string, string | boolean>
}

export function parseArgs(argv: string[]): ParsedArgs {
  const positional: string[] = []
  const flags: Record<string, string | boolean> = {}

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg.startsWith('--')) {
      const key = arg.slice(2)
      const next = argv[i + 1]
      if (next && !next.startsWith('--')) {
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

// Lookup a user by email, returns {id, email, name, role} or null
export async function findUserByEmail(email: string) {
  const { prisma, runAsSuperAdmin } = await import('@/lib/cms/db')
  return runAsSuperAdmin(async () => {
    return prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, role: true, stackAuthId: true, createdAt: true },
    })
  })
}

// Require user exists or exit
export async function requireUser(email: string) {
  const user = await findUserByEmail(email)
  if (!user) {
    error(`User not found: ${email}`)
    process.exit(1)
  }
  return user
}
