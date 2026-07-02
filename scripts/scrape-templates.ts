#!/usr/bin/env npx tsx
// Load .env BEFORE any imports that touch Prisma
import 'dotenv/config'

/**
 * Template Scraper CLI
 *
 * Fetches open-source Tailwind components from supported sources,
 * runs them through the block editor preprocessing pipeline, and
 * outputs marketplace templates as JSON or inserts them into the DB.
 *
 * Usage:
 *   npx tsx scripts/scrape-templates.ts --source hyperui
 *   npx tsx scripts/scrape-templates.ts --source hyperui --category marketing
 *   npx tsx scripts/scrape-templates.ts --source hyperui --subcategory headers
 *   npx tsx scripts/scrape-templates.ts --source hyperui --dry-run
 *   npx tsx scripts/scrape-templates.ts --source hyperui --limit 10
 *   npx tsx scripts/scrape-templates.ts --source hyperui --output ./output
 *   npx tsx scripts/scrape-templates.ts --source hyperui --db
 *   npx tsx scripts/scrape-templates.ts --list-sources
 *   npx tsx scripts/scrape-templates.ts --source hyperui --list-categories
 *   npx tsx scripts/scrape-templates.ts --source hyperui --include-dark
 *   npx tsx scripts/scrape-templates.ts --source hyperui --min-quality 50
 */

import { resolve, join } from "path"
import { writeFileSync, mkdirSync, existsSync } from "fs"

// ── Argument Parsing (zero dependencies) ──────────────────────────────

interface CLIArgs {
  source?: string
  category?: string
  subcategory?: string
  limit?: number
  dryRun: boolean
  includeDark: boolean
  output?: string
  db: boolean
  listSources: boolean
  listCategories: boolean
  minQuality: number
  verbose: boolean
  help: boolean
}

function parseArgs(argv: string[]): CLIArgs {
  const args: CLIArgs = {
    dryRun: false,
    includeDark: false,
    db: false,
    listSources: false,
    listCategories: false,
    minQuality: 0,
    verbose: false,
    help: false,
  }

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i]
    const next = argv[i + 1]

    switch (arg) {
      case "--source":
      case "-s":
        args.source = next
        i++
        break
      case "--category":
      case "-c":
        args.category = next
        i++
        break
      case "--subcategory":
      case "--sub":
        args.subcategory = next
        i++
        break
      case "--limit":
      case "-l":
        args.limit = parseInt(next, 10)
        i++
        break
      case "--dry-run":
      case "-n":
        args.dryRun = true
        break
      case "--include-dark":
        args.includeDark = true
        break
      case "--output":
      case "-o":
        args.output = next
        i++
        break
      case "--db":
        args.db = true
        break
      case "--list-sources":
        args.listSources = true
        break
      case "--list-categories":
        args.listCategories = true
        break
      case "--min-quality":
        args.minQuality = parseInt(next, 10)
        i++
        break
      case "--verbose":
      case "-v":
        args.verbose = true
        break
      case "--help":
      case "-h":
        args.help = true
        break
    }
  }

  return args
}

// ── Color Helpers (ANSI) ──────────────────────────────────────────────

const isCI = process.env.CI === "true" || process.env.NO_COLOR !== undefined
const c = {
  reset: isCI ? "" : "\x1b[0m",
  bold: isCI ? "" : "\x1b[1m",
  dim: isCI ? "" : "\x1b[2m",
  red: isCI ? "" : "\x1b[31m",
  green: isCI ? "" : "\x1b[32m",
  yellow: isCI ? "" : "\x1b[33m",
  blue: isCI ? "" : "\x1b[34m",
  cyan: isCI ? "" : "\x1b[36m",
  gray: isCI ? "" : "\x1b[90m",
}

function log(msg: string) {
  console.log(msg)
}

function logSuccess(msg: string) {
  console.log(`${c.green}OK${c.reset} ${msg}`)
}

function logError(msg: string) {
  console.error(`${c.red}ERR${c.reset} ${msg}`)
}

function logWarn(msg: string) {
  console.log(`${c.yellow}WARN${c.reset} ${msg}`)
}

function logInfo(msg: string) {
  console.log(`${c.blue}INFO${c.reset} ${msg}`)
}

// ── Help Text ─────────────────────────────────────────────────────────

function printHelp() {
  log(`
${c.bold}Template Scraper CLI${c.reset}
${c.dim}Fetch open-source Tailwind components for the CNCPT marketplace.${c.reset}

${c.bold}USAGE${c.reset}
  npx tsx scripts/scrape-templates.ts [options]

${c.bold}OPTIONS${c.reset}
  --source, -s <name>       Scraper source (e.g., "hyperui") ${c.red}[required]${c.reset}
  --category, -c <cat>      Filter by top-level category
  --subcategory, --sub <sub>  Filter by sub-category slug
  --limit, -l <n>           Max number of templates to scrape
  --dry-run, -n             Preview what would be scraped (no fetching)
  --include-dark            Include dark-theme variants
  --output, -o <dir>        Output directory for JSON files (default: ./scraped-templates)
  --db                      Insert into database via marketplace service
  --min-quality <n>         Minimum quality score to accept (0-100, default: 0)
  --list-sources            List all available scraper sources
  --list-categories         List categories for the given source
  --verbose, -v             Show detailed progress and warnings
  --help, -h                Show this help text

${c.bold}EXAMPLES${c.reset}
  ${c.dim}# Scrape all HyperUI components to JSON${c.reset}
  npx tsx scripts/scrape-templates.ts --source hyperui

  ${c.dim}# Preview marketing components only${c.reset}
  npx tsx scripts/scrape-templates.ts --source hyperui --category marketing --dry-run

  ${c.dim}# Scrape headers and save to database${c.reset}
  npx tsx scripts/scrape-templates.ts --source hyperui --subcategory headers --db

  ${c.dim}# Scrape 5 components with quality filtering${c.reset}
  npx tsx scripts/scrape-templates.ts --source hyperui --limit 5 --min-quality 50

  ${c.dim}# List available sources${c.reset}
  npx tsx scripts/scrape-templates.ts --list-sources
`)
}

// ── Main ──────────────────────────────────────────────────────────────

async function main() {
  const args = parseArgs(process.argv)

  if (args.help) {
    printHelp()
    process.exit(0)
  }

  // Lazy import the scraper registry (so help works without module resolution)
  const { getScraper, getAvailableAdapters } = await import(
    "../lib/cms/marketplace/scrapers/index"
  )

  // --list-sources
  if (args.listSources) {
    log(`\n${c.bold}Available Scraper Sources${c.reset}\n`)
    const adapters = getAvailableAdapters()
    for (const a of adapters) {
      log(`  ${c.cyan}${a.source}${c.reset}  ${a.name}  (${a.license})`)
    }
    log("")
    process.exit(0)
  }

  // Require --source for all other operations
  if (!args.source) {
    logError("Missing required option: --source <name>")
    log(`  Run with --list-sources to see available sources.`)
    log(`  Run with --help for full usage.`)
    process.exit(1)
  }

  // Get the adapter
  let adapter
  try {
    adapter = getScraper(args.source)
  } catch (err) {
    logError((err as Error).message)
    process.exit(1)
  }

  // --list-categories
  if (args.listCategories) {
    log(`\n${c.bold}Categories for ${adapter.name}${c.reset}\n`)
    try {
      const categories = await adapter.getCategories()
      for (const cat of categories) {
        log(`  ${c.bold}${cat.name}${c.reset} (${cat.slug})`)
        for (const sub of cat.subcategories) {
          log(`    ${c.cyan}${sub.slug}${c.reset}  ${sub.name}  ${c.dim}(${sub.componentCount} variants)${c.reset}`)
        }
      }
    } catch (err) {
      logError(`Failed to fetch categories: ${(err as Error).message}`)
      process.exit(1)
    }
    log("")
    process.exit(0)
  }

  // ── Scrape ──────────────────────────────────────────────────────────

  log(`\n${c.bold}Scraping from ${adapter.name}${c.reset}`)
  log(`  Source:    ${adapter.attributionUrl}`)
  log(`  License:   ${adapter.license}`)
  if (args.category) log(`  Category:  ${args.category}`)
  if (args.subcategory) log(`  Subcategory: ${args.subcategory}`)
  if (args.limit) log(`  Limit:     ${args.limit}`)
  if (args.dryRun) log(`  ${c.yellow}DRY RUN -- no HTML will be fetched${c.reset}`)
  log("")

  // Collect all scraped templates
  const scraped: import("../lib/cms/marketplace/scrapers/types").ScrapedTemplate[] = []
  let count = 0

  try {
    for await (const template of adapter.scrape({
      category: args.category,
      subcategory: args.subcategory,
      limit: args.limit,
      dryRun: args.dryRun,
      includeDark: args.includeDark,
    })) {
      count++
      scraped.push(template as any)

      if (args.dryRun) {
        log(
          `  ${c.dim}${count}.${c.reset} ${template.name} ${c.gray}[${template.category}]${c.reset}`
        )
      } else {
        const htmlSize = template.html.length
        const sizeStr = htmlSize > 1024
          ? `${(htmlSize / 1024).toFixed(1)}KB`
          : `${htmlSize}B`
        log(
          `  ${c.dim}${count}.${c.reset} ${c.green}Fetched${c.reset} ${template.name} ${c.gray}(${sizeStr})${c.reset}`
        )
      }
    }
  } catch (err) {
    logError(`Scraping failed: ${(err as Error).message}`)
    if (count === 0) process.exit(1)
    logWarn(`Continuing with ${count} templates scraped before error.`)
  }

  log(`\n${c.bold}Scraped ${count} template(s)${c.reset}`)

  if (args.dryRun) {
    log(`\n${c.dim}Dry run complete. No processing or output.${c.reset}\n`)
    process.exit(0)
  }

  if (count === 0) {
    logWarn("No templates scraped. Nothing to process.")
    process.exit(0)
  }

  // ── Ingest through pipeline ─────────────────────────────────────────

  log(`\n${c.bold}Processing through ingestion pipeline...${c.reset}\n`)

  const { ingestBatch } = await import("../lib/cms/marketplace/ingest")

  const { templates: ingested, report } = await ingestBatch(scraped as any, {
    skipDuplicates: true,
    minQuality: args.minQuality,
    onProgress: (current, total, result) => {
      const status = result.success
        ? `${c.green}OK${c.reset}`
        : `${c.red}FAIL${c.reset}`
      const qualityStr = result.success
        ? `${c.dim}q=${result.quality} blocks=${result.blockCount}${c.reset}`
        : `${c.dim}${result.error}${c.reset}`

      log(`  [${current}/${total}] ${status} ${result.name} ${qualityStr}`)

      if (args.verbose && result.warnings.length > 0) {
        for (const w of result.warnings) {
          log(`    ${c.yellow}> ${w}${c.reset}`)
        }
      }
    },
  })

  // ── Report ──────────────────────────────────────────────────────────

  log(`\n${c.bold}Ingestion Report${c.reset}`)
  log(`  Total:     ${report.total}`)
  log(`  Succeeded: ${c.green}${report.succeeded}${c.reset}`)
  log(`  Failed:    ${c.red}${report.failed}${c.reset}`)
  log(`  Skipped:   ${c.yellow}${report.skipped}${c.reset}`)

  if (report.succeeded === 0) {
    logWarn("No templates passed ingestion. Check --verbose for details.")
    process.exit(0)
  }

  // ── Output to JSON ─────────────────────────────────────────────────

  const outputDir = resolve(args.output ?? "./scraped-templates")
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true })
  }

  // Write individual template JSON files
  for (const t of ingested) {
    const filename = `${t.dbInput.slug}.json`
    const filepath = join(outputDir, filename)
    writeFileSync(filepath, JSON.stringify(t.dbInput, null, 2), "utf-8")
  }

  // Write a manifest file with all templates
  const manifestPath = join(outputDir, "_manifest.json")
  const manifest = {
    source: adapter.source,
    scrapedAt: new Date().toISOString(),
    count: ingested.length,
    templates: ingested.map((t) => ({
      slug: t.dbInput.slug,
      name: t.dbInput.name,
      category: t.dbInput.category,
      quality: t.result.quality,
      blockCount: t.result.blockCount,
      file: `${t.dbInput.slug}.json`,
    })),
  }
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf-8")

  logSuccess(
    `Wrote ${ingested.length} template(s) to ${outputDir}/`
  )
  logInfo(`Manifest: ${manifestPath}`)

  // ── Optional: Insert into database ──────────────────────────────────

  if (args.db) {
    log(`\n${c.bold}Inserting into database...${c.reset}\n`)

    try {
      const { upsertMarketplaceTemplates } = await import(
        "../lib/cms/marketplace/index"
      )

      const dbInputs = ingested.map((t) => t.dbInput)
      const { created, updated } = await upsertMarketplaceTemplates(dbInputs)

      logSuccess(`Database: ${created} created, ${updated} updated`)
    } catch (err) {
      logError(`Database insertion failed: ${(err as Error).message}`)
      logInfo("Templates were still saved as JSON files.")
    }
  }

  log("")
}

// ── Run ───────────────────────────────────────────────────────────────

main().catch((err) => {
  logError(`Unhandled error: ${(err as Error).message}`)
  if ((err as Error).stack) {
    console.error((err as Error).stack)
  }
  process.exit(1)
})
