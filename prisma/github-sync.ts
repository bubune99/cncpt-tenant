#!/usr/bin/env npx tsx
/**
 * GitHub Sync CLI Tool
 *
 * Manages bidirectional synchronization between the block editor and GitHub repositories.
 *
 * Usage:
 *   npx tsx prisma/github-sync.ts setup --repo owner/repo --token ghp_xxx
 *   npx tsx prisma/github-sync.ts pull --path src/components/hero.tsx
 *   npx tsx prisma/github-sync.ts push --page "home" --message "Update hero"
 *   npx tsx prisma/github-sync.ts status
 *   npx tsx prisma/github-sync.ts diff --page "home"
 *
 * Environment Variables:
 *   GITHUB_TOKEN - Personal access token (alternative to --token flag)
 */

import * as fs from "fs"
import * as path from "path"
import { prisma } from "@/lib/cms/db"

// Config file path
const CONFIG_PATH = path.join(process.cwd(), ".github-sync.json")

interface SyncConfig {
  owner: string
  repo: string
  branch: string
  componentPath: string
  token?: string // Encrypted or from env
}

interface SyncedFile {
  filePath: string
  pageId?: string
  sha: string
  status: string
  lastSyncedAt: string
}

interface ConfigFile {
  connection: SyncConfig
  files: SyncedFile[]
}

// ============================================================
// CLI Commands
// ============================================================

async function setup(args: string[]): Promise<void> {
  const repoArg = getArg(args, "--repo")
  const tokenArg = getArg(args, "--token") || process.env.GITHUB_TOKEN
  const branchArg = getArg(args, "--branch") || "main"
  const pathArg = getArg(args, "--path") || "src/components"

  if (!repoArg) {
    console.error("Error: --repo is required (format: owner/repo)")
    process.exit(1)
  }

  if (!tokenArg) {
    console.error("Error: --token is required or set GITHUB_TOKEN environment variable")
    process.exit(1)
  }

  const [owner, repo] = repoArg.split("/")
  if (!owner || !repo) {
    console.error("Error: Invalid repo format. Use owner/repo")
    process.exit(1)
  }

  // Test connection
  console.log(`Testing connection to ${owner}/${repo}...`)

  try {
    const { GitHubClient } = await import("@/lib/cms/github/client")
    const client = GitHubClient.withPAT(tokenArg, owner, repo, branchArg)
    const result = await client.testConnection()

    if (!result.success) {
      console.error(`Connection failed: ${result.error}`)
      process.exit(1)
    }

    // Get repo info
    const repoInfo = await client.getRepo()
    console.log(`Connected to: ${repoInfo.fullName}`)
    console.log(`Default branch: ${repoInfo.defaultBranch}`)
    console.log(`Private: ${repoInfo.private ? "Yes" : "No"}`)

    // Save config
    const config: ConfigFile = {
      connection: {
        owner,
        repo,
        branch: branchArg,
        componentPath: pathArg,
        // Don't save token in file - use env var
      },
      files: [],
    }

    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2))
    console.log(`\nConfiguration saved to ${CONFIG_PATH}`)
    console.log(`\nNote: Set GITHUB_TOKEN environment variable for authentication.`)
    console.log(`      Do NOT commit .github-sync.json with tokens!`)
  } catch (error) {
    console.error(`Setup failed: ${(error as Error).message}`)
    process.exit(1)
  }
}

async function pull(args: string[]): Promise<void> {
  const config = loadConfig()
  const filePath = getArg(args, "--path")
  const all = args.includes("--all")
  const pageId = getArg(args, "--page")
  const force = args.includes("--force")

  if (!filePath && !all) {
    console.error("Error: --path or --all is required")
    process.exit(1)
  }

  const token = process.env.GITHUB_TOKEN
  if (!token) {
    console.error("Error: GITHUB_TOKEN environment variable is required")
    process.exit(1)
  }

  try {
    const { GitHubClient } = await import("@/lib/cms/github/client")
    const { GitHubSyncService } = await import("@/lib/cms/github/sync-service")

    const client = GitHubClient.withPAT(
      token,
      config.connection.owner,
      config.connection.repo,
      config.connection.branch
    )
    const syncService = new GitHubSyncService(client)

    if (all) {
      // Pull all components from configured path
      console.log(`Pulling all components from ${config.connection.componentPath}...`)
      const results = await syncService.pullDirectory(config.connection.componentPath)

      let successCount = 0
      let failCount = 0

      for (const result of results) {
        if (result.success) {
          console.log(`  + ${result.filePath} (${result.blocks?.length || 0} blocks)`)
          successCount++

          // Update config file
          updateSyncedFile(config, result.filePath!, {
            filePath: result.filePath!,
            sha: result.sha!,
            status: "synced",
            lastSyncedAt: new Date().toISOString(),
          })
        } else {
          console.error(`  x ${result.filePath}: ${result.errors?.join(", ")}`)
          failCount++
        }
      }

      console.log(`\nPulled ${successCount} files, ${failCount} failed.`)
      saveConfig(config)
    } else {
      // Pull single file
      console.log(`Pulling ${filePath}...`)
      const result = await syncService.pull(filePath!)

      if (result.success) {
        console.log(`Success! Pulled ${result.blocks?.length || 0} blocks.`)
        console.log(`Component name: ${result.componentName}`)

        if (result.warnings?.length) {
          console.log(`Warnings:`)
          result.warnings.forEach(w => console.log(`  - ${w}`))
        }

        // Update config file
        updateSyncedFile(config, filePath!, {
          filePath: filePath!,
          pageId,
          sha: result.sha!,
          status: "synced",
          lastSyncedAt: new Date().toISOString(),
        })
        saveConfig(config)

        // Output blocks as JSON for piping
        if (args.includes("--json")) {
          console.log(JSON.stringify({
            blocks: result.blocks,
            componentName: result.componentName,
          }, null, 2))
        }
      } else {
        console.error(`Failed: ${result.errors?.join(", ")}`)
        process.exit(1)
      }
    }
  } catch (error) {
    console.error(`Pull failed: ${(error as Error).message}`)
    process.exit(1)
  }
}

async function push(args: string[]): Promise<void> {
  const config = loadConfig()
  const pageSlug = getArg(args, "--page")
  const filePath = getArg(args, "--path")
  const message = getArg(args, "--message") || `Update from block editor`
  const all = args.includes("--all")

  if (!pageSlug && !filePath && !all) {
    console.error("Error: --page, --path, or --all is required")
    process.exit(1)
  }

  const token = process.env.GITHUB_TOKEN
  if (!token) {
    console.error("Error: GITHUB_TOKEN environment variable is required")
    process.exit(1)
  }

  try {
    const { GitHubClient } = await import("@/lib/cms/github/client")
    const { GitHubSyncService } = await import("@/lib/cms/github/sync-service")

    const client = GitHubClient.withPAT(
      token,
      config.connection.owner,
      config.connection.repo,
      config.connection.branch
    )
    const syncService = new GitHubSyncService(client)

    if (pageSlug) {
      // Get page from database
      const page = await prisma.page.findFirst({
        where: { slug: pageSlug },
      })

      if (!page) {
        console.error(`Page not found: ${pageSlug}`)
        process.exit(1)
      }

      // Get file path from config or generate one
      const syncedFile = config.files.find(f => f.pageId === page.id)
      const targetPath = filePath || syncedFile?.filePath ||
        `${config.connection.componentPath}/${pageSlug}.tsx`

      // Parse blocks from page content
      const content = page.content as { blocks?: unknown[] }
      const blocks = content?.blocks || []

      console.log(`Pushing page "${pageSlug}" to ${targetPath}...`)
      const result = await syncService.push(blocks as never[], targetPath, {
        message: `${message} - ${pageSlug}`,
        createFile: true,
      })

      if (result.success) {
        console.log(`Success! Committed: ${result.sha?.slice(0, 7)}`)
        console.log(`URL: ${result.url}`)

        // Update config
        updateSyncedFile(config, targetPath, {
          filePath: targetPath,
          pageId: page.id,
          sha: result.sha!,
          status: "synced",
          lastSyncedAt: new Date().toISOString(),
        })
        saveConfig(config)
      } else {
        console.error(`Failed: ${result.errors?.join(", ")}`)
        process.exit(1)
      }
    }
  } catch (error) {
    console.error(`Push failed: ${(error as Error).message}`)
    process.exit(1)
  }
}

async function status(args: string[]): Promise<void> {
  const config = loadConfig()
  const verbose = args.includes("--verbose") || args.includes("-v")

  console.log(`Repository: ${config.connection.owner}/${config.connection.repo}`)
  console.log(`Branch: ${config.connection.branch}`)
  console.log(`Component path: ${config.connection.componentPath}`)
  console.log(``)
  console.log(`Synced files: ${config.files.length}`)
  console.log(``)

  if (config.files.length === 0) {
    console.log("No files synced yet. Use 'pull' to sync from GitHub.")
    return
  }

  console.log("Files:")
  for (const file of config.files) {
    const statusIcon = file.status === "synced" ? "~" :
                       file.status === "local_changes" ? "M" :
                       file.status === "remote_changes" ? "U" :
                       file.status === "conflict" ? "!" : "?"

    console.log(`  [${statusIcon}] ${file.filePath}`)
    if (verbose) {
      console.log(`      SHA: ${file.sha.slice(0, 7)}`)
      console.log(`      Last sync: ${file.lastSyncedAt}`)
      if (file.pageId) console.log(`      Page ID: ${file.pageId}`)
    }
  }

  console.log(``)
  console.log("Legend: [~] synced, [M] local changes, [U] remote changes, [!] conflict")
}

async function diffCommand(args: string[]): Promise<void> {
  const config = loadConfig()
  const pageSlug = getArg(args, "--page")
  const filePath = getArg(args, "--path")

  if (!pageSlug && !filePath) {
    console.error("Error: --page or --path is required")
    process.exit(1)
  }

  const token = process.env.GITHUB_TOKEN
  if (!token) {
    console.error("Error: GITHUB_TOKEN environment variable is required")
    process.exit(1)
  }

  try {
    const { GitHubClient } = await import("@/lib/cms/github/client")
    const { GitHubSyncService } = await import("@/lib/cms/github/sync-service")

    const client = GitHubClient.withPAT(
      token,
      config.connection.owner,
      config.connection.repo,
      config.connection.branch
    )
    const syncService = new GitHubSyncService(client)

    let targetPath = filePath
    let localBlocks: unknown[] = []

    if (pageSlug) {
      const page = await prisma.page.findFirst({
        where: { slug: pageSlug },
      })

      if (!page) {
        console.error(`Page not found: ${pageSlug}`)
        process.exit(1)
      }

      const syncedFile = config.files.find(f => f.pageId === page.id)
      targetPath = syncedFile?.filePath || filePath

      if (!targetPath) {
        console.error("Error: File path not found. Specify --path or sync the page first.")
        process.exit(1)
      }

      const content = page.content as { blocks?: unknown[] }
      localBlocks = content?.blocks || []
    }

    console.log(`Comparing local vs remote: ${targetPath}`)
    const summary = await syncService.getDiffSummary(targetPath!, localBlocks as never[])
    console.log(summary)
  } catch (error) {
    console.error(`Diff failed: ${(error as Error).message}`)
    process.exit(1)
  }
}

async function resolve(args: string[]): Promise<void> {
  const pageSlug = getArg(args, "--page")
  const strategy = getArg(args, "--strategy") || "prefer-local"

  if (!pageSlug) {
    console.error("Error: --page is required")
    process.exit(1)
  }

  if (!["prefer-local", "prefer-remote"].includes(strategy)) {
    console.error("Error: --strategy must be 'prefer-local' or 'prefer-remote'")
    process.exit(1)
  }

  console.log(`Resolving conflicts for page "${pageSlug}" using strategy: ${strategy}`)
  console.log("Note: Full conflict resolution requires the sync operation.")
  console.log(`Run: npx tsx prisma/github-sync.ts sync --page ${pageSlug} --strategy ${strategy}`)
}

// ============================================================
// Helper Functions
// ============================================================

function loadConfig(): ConfigFile {
  if (!fs.existsSync(CONFIG_PATH)) {
    console.error("Error: No configuration found. Run 'setup' first.")
    process.exit(1)
  }

  return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"))
}

function saveConfig(config: ConfigFile): void {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2))
}

function updateSyncedFile(config: ConfigFile, filePath: string, file: SyncedFile): void {
  const index = config.files.findIndex(f => f.filePath === filePath)
  if (index >= 0) {
    config.files[index] = file
  } else {
    config.files.push(file)
  }
}

function getArg(args: string[], flag: string): string | undefined {
  const index = args.indexOf(flag)
  if (index >= 0 && args[index + 1] && !args[index + 1].startsWith("--")) {
    return args[index + 1]
  }
  return undefined
}

function printHelp(): void {
  console.log(`
GitHub Sync CLI
===============

Manages bidirectional synchronization between the block editor and GitHub.

COMMANDS:
  setup     Configure GitHub connection
  pull      Pull components from GitHub to blocks
  push      Push blocks to GitHub as components
  status    Show sync status
  diff      Show differences between local and remote
  resolve   Resolve sync conflicts

SETUP:
  npx tsx prisma/github-sync.ts setup --repo owner/repo --token ghp_xxx [--branch main] [--path src/components]

PULL:
  npx tsx prisma/github-sync.ts pull --path src/components/hero.tsx
  npx tsx prisma/github-sync.ts pull --all
  npx tsx prisma/github-sync.ts pull --path src/components/hero.tsx --json

PUSH:
  npx tsx prisma/github-sync.ts push --page home --message "Update hero section"
  npx tsx prisma/github-sync.ts push --page home --path src/components/home.tsx
  npx tsx prisma/github-sync.ts push --all --message "Sync all pages"

STATUS:
  npx tsx prisma/github-sync.ts status
  npx tsx prisma/github-sync.ts status --verbose

DIFF:
  npx tsx prisma/github-sync.ts diff --page home
  npx tsx prisma/github-sync.ts diff --path src/components/hero.tsx

RESOLVE:
  npx tsx prisma/github-sync.ts resolve --page home --strategy prefer-local
  npx tsx prisma/github-sync.ts resolve --page home --strategy prefer-remote

ENVIRONMENT:
  GITHUB_TOKEN    Personal Access Token for GitHub authentication

FILES:
  .github-sync.json    Local configuration and sync state (add to .gitignore)
`)
}

// ============================================================
// Main
// ============================================================

async function main(): Promise<void> {
  const args = process.argv.slice(2)
  const command = args[0]

  if (!command || command === "--help" || command === "-h") {
    printHelp()
    process.exit(0)
  }

  try {
    switch (command) {
      case "setup":
        await setup(args.slice(1))
        break
      case "pull":
        await pull(args.slice(1))
        break
      case "push":
        await push(args.slice(1))
        break
      case "status":
        await status(args.slice(1))
        break
      case "diff":
        await diffCommand(args.slice(1))
        break
      case "resolve":
        await resolve(args.slice(1))
        break
      default:
        console.error(`Unknown command: ${command}`)
        printHelp()
        process.exit(1)
    }
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((error) => {
  console.error("Fatal error:", error.message)
  process.exit(1)
})
