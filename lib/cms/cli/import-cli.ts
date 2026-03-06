/**
 * CLI — Import Domain
 * Wrapper that delegates to the existing import-project.ts pipeline
 */

import { resolve } from "path"
import { existsSync } from "fs"
import {
  c, sym, heading, success, error, warn, info,
  ask, confirm, select, closeRL, prisma, table, formatDate, truncate,
} from "./utils"
import { scanDirectory } from "../project-import/fs-scanner"
import { resolveProject } from "../project-import/resolver"
import { parseProject } from "../project-import/parser"
import { seedProject, type SeedOptions } from "../project-import/seeder"
import { countBlocks } from "../block-editor/tree-utils"
import { buildDependencyManifest } from "../block-editor/dependency-context"

export async function handleImport(args: string[], flags: Record<string, string | boolean>) {
  const projectPath = args[0]

  if (!projectPath) {
    // Interactive walkthrough
    await importInteractive()
    return
  }

  // Direct mode
  const absPath = resolve(projectPath)
  if (!existsSync(absPath)) {
    error(`Path not found: ${absPath}`)
    return
  }

  const scanOnly = flags.scan === true

  // Scan
  info(`Scanning ${c.cyan(absPath)}...`)
  const manifest = scanDirectory(absPath)
  const resolved = resolveProject(manifest)
  const { components, pages, errors: parseErrors } = parseProject(resolved)

  if (scanOnly) {
    heading("Scan Results")
    console.log(`  ${c.bold("Pages:")}      ${pages.length}`)
    console.log(`  ${c.bold("Components:")} ${components.length}`)
    console.log(`  ${c.bold("Assets:")}     ${manifest.assets.length}`)
    console.log(`  ${c.bold("Styles:")}     ${manifest.styles.length}`)
    console.log(`  ${c.bold("Layout:")}     ${manifest.layouts.length > 0 ? c.green("detected") : c.dim("none")}`)

    if (pages.length > 0) {
      console.log(`\n  ${c.bold("Pages:")}`)
      for (const p of pages) {
        const slug = resolved.pageSlugs.get(p.file.path) || ""
        const blocks = countBlocks(p.blocks)
        console.log(`    ${sym.arrow} ${c.cyan(`/${slug}`)} ${c.dim(`(${blocks} blocks)`)}`)
      }
    }

    if (components.length > 0) {
      console.log(`\n  ${c.bold("Components:")}`)
      for (const comp of components) {
        console.log(`    ${sym.arrow} ${c.cyan(comp.file.exportName || comp.file.path)}`)
      }
    }

    if (parseErrors.length > 0) {
      console.log(`\n  ${c.bold(c.yellow("Warnings:"))}`)
      for (const err of parseErrors) console.log(`    ${sym.warn} ${err}`)
    }

    // Dependency context preview
    if (pages.length > 0) {
      const pageDeps = pages.map((p) => ({
        page: p,
        deps: buildDependencyManifest(p.file, resolved.componentMap),
      }))
      const pagesWithDeps = pageDeps.filter(
        ({ deps }) => Object.keys(deps.components).length > 0 || (deps.unresolved && deps.unresolved.length > 0)
      )

      if (pagesWithDeps.length > 0) {
        console.log(`\n  ${c.bold("Dependency Context:")}`)
        for (const { page, deps } of pagesWithDeps) {
          const slug = resolved.pageSlugs.get(page.file.path) || ""
          const compEntries = Object.entries(deps.components)
          const externals = deps.unresolved || []

          console.log(`    ${c.cyan(page.file.path)} ${c.dim(`(${slug})`)}:`)

          if (compEntries.length > 0) {
            const compSummaries = compEntries.map(([name, dep]) => {
              const variantCount = dep.variants ? Object.values(dep.variants).reduce((sum, v) => sum + Object.keys(v).length, 0) : 0
              return variantCount > 0 ? `${name} ${c.dim(`(${variantCount} variants)`)}` : name
            })
            console.log(`      ${c.bold("Components:")} ${compSummaries.join(", ")}`)
          }

          if (externals.length > 0) {
            console.log(`      ${c.bold("External:")} ${externals.join(", ")}`)
          }
        }
      }
    }

    console.log()
    return
  }

  // Full import
  const seedOptions: SeedOptions = {
    status: (typeof flags.status === "string" && flags.status.toUpperCase() === "PUBLISHED") ? "PUBLISHED" : "DRAFT",
    ...(typeof flags.prefix === "string" ? { slugPrefix: flags.prefix } : {}),
  }

  info(`Importing ${pages.length} pages + ${components.length} components...`)
  const result = await seedProject(resolved, components, pages, seedOptions)
  result.errors.push(...parseErrors)

  heading("Import Complete")
  console.log(`  ${c.bold("Pages created:")}  ${result.pages.length}`)
  console.log(`  ${c.bold("Partials created:")} ${result.partials.length}`)
  if (result.errors.length > 0) {
    console.log(`\n  ${c.bold(c.yellow("Warnings:"))}`)
    for (const err of result.errors) console.log(`    ${sym.warn} ${err}`)
  }
  success("Import complete!")
}

// -- Interactive Walkthrough -------------------------------------------------

async function importInteractive() {
  heading("Project Import Walkthrough")
  console.log(c.dim("  Import a React/Next.js project into the CMS.\n"))

  // Step 1: Path
  const pathInput = await ask("Project path")
  if (!pathInput) { error("No path provided."); closeRL(); return }

  const absPath = resolve(pathInput)
  if (!existsSync(absPath)) { error(`Path not found: ${absPath}`); closeRL(); return }

  // Step 2: Scan
  info(`Scanning ${c.cyan(absPath)}...`)
  const manifest = scanDirectory(absPath)
  const resolved = resolveProject(manifest)
  const { components, pages, errors: parseErrors } = parseProject(resolved)

  // Step 3: Review
  heading("Scan Results")
  console.log(`  Found ${c.bold(String(pages.length))} pages and ${c.bold(String(components.length))} components\n`)

  if (pages.length > 0) {
    for (let i = 0; i < pages.length; i++) {
      const p = pages[i]
      const slug = resolved.pageSlugs.get(p.file.path) || ""
      const blocks = countBlocks(p.blocks)
      console.log(`  ${c.cyan(String(i + 1).padStart(3))}. /${slug} ${c.dim(`(${blocks} blocks)`)}`)
    }
  }

  if (pages.length === 0) {
    warn("No pages found. Nothing to import.")
    closeRL()
    return
  }

  // Step 4: Select pages
  console.log(`\n  Enter page numbers to import, ${c.cyan("a")} for all, or ${c.cyan("q")} to quit.`)
  const selection = await ask("Pages", "a")

  if (selection.toLowerCase() === "q") { info("Cancelled."); closeRL(); return }

  let selectedPages = pages
  if (selection.toLowerCase() !== "a") {
    const indices = selection.split(/[,\s]+/).map((s) => parseInt(s, 10) - 1).filter((n) => n >= 0 && n < pages.length)
    if (indices.length === 0) { error("No valid page numbers."); closeRL(); return }
    selectedPages = indices.map((i) => pages[i])
  }

  // Step 5: Options
  const statusChoice = await select("Page status?", [
    { label: "Draft (edit before publishing)", value: "DRAFT" },
    { label: "Published (live immediately)", value: "PUBLISHED" },
  ])

  const prefix = await ask("Slug prefix (leave empty for none)")

  // Step 6: Confirm
  heading("Confirm Import")
  console.log(`  ${c.bold("Pages:")}  ${selectedPages.length}`)
  console.log(`  ${c.bold("Status:")} ${statusChoice}`)
  if (prefix) console.log(`  ${c.bold("Prefix:")} ${prefix}`)

  const ok = await confirm("Proceed with import?")
  if (!ok) { info("Cancelled."); closeRL(); return }

  // Step 7: Execute
  info("Importing...")
  const seedOptions: SeedOptions = {
    status: statusChoice as "DRAFT" | "PUBLISHED",
    ...(prefix ? { slugPrefix: prefix } : {}),
  }

  const result = await seedProject(resolved, components, selectedPages, seedOptions)
  result.errors.push(...parseErrors)

  heading("Import Complete")
  console.log(`  ${c.bold("Pages created:")}    ${result.pages.length}`)
  console.log(`  ${c.bold("Partials created:")} ${result.partials.length}`)
  if (result.errors.length > 0) {
    console.log(`\n  ${c.bold(c.yellow("Warnings:"))}`)
    for (const err of result.errors) console.log(`    ${sym.warn} ${err}`)
  }
  success("Import complete!")
  closeRL()
}
