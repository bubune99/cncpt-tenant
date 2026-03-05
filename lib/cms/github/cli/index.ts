#!/usr/bin/env node
/**
 * GitHub Sync CLI
 *
 * Command-line tool for syncing blocks with GitHub repositories.
 *
 * Usage:
 *   npx cncpt-blocks init           # Initialize connection
 *   npx cncpt-blocks pull [path]    # Pull from GitHub
 *   npx cncpt-blocks push [page]    # Push to GitHub
 *   npx cncpt-blocks status         # Check sync status
 *   npx cncpt-blocks diff [path]    # Show diff
 */

import { Command } from "commander"
import chalk from "chalk"
import ora from "ora"
import inquirer from "inquirer"
import { GitHubClient } from "../client"
import { GitHubSyncService } from "../sync-service"
import { loadConfig, saveConfig, type CLIConfig } from "./config"

const program = new Command()

program
  .name("cncpt-blocks")
  .description("Sync blocks with GitHub repositories")
  .version("1.0.0")

// ============================================================
// Init Command
// ============================================================

program
  .command("init")
  .description("Initialize GitHub connection")
  .option("-t, --token <token>", "GitHub personal access token")
  .option("-r, --repo <repo>", "Repository (owner/repo)")
  .option("-b, --branch <branch>", "Branch name", "main")
  .option("-p, --path <path>", "Component path", "src/components/blocks")
  .action(async (options) => {
    console.log(chalk.bold("\n🔧 Initialize GitHub Sync\n"))

    let config: Partial<CLIConfig> = {}

    // Interactive prompts if options not provided
    if (!options.token) {
      const answers = await inquirer.prompt([
        {
          type: "password",
          name: "token",
          message: "GitHub Personal Access Token:",
          validate: (input) => input.length > 0 || "Token is required",
        },
      ])
      config.token = answers.token
    } else {
      config.token = options.token
    }

    if (!options.repo) {
      const answers = await inquirer.prompt([
        {
          type: "input",
          name: "repo",
          message: "Repository (owner/repo):",
          validate: (input) => {
            return input.includes("/") || "Format: owner/repo"
          },
        },
      ])
      config.repo = answers.repo
    } else {
      config.repo = options.repo
    }

    config.branch = options.branch
    config.componentPath = options.path

    // Test connection
    const spinner = ora("Testing connection...").start()

    try {
      const [owner, repo] = config.repo!.split("/")
      const client = GitHubClient.withPAT(config.token!, owner, repo, config.branch)
      const result = await client.testConnection()

      if (!result.success) {
        spinner.fail(`Connection failed: ${result.error}`)
        process.exit(1)
      }

      // Get repo info
      const repoInfo = await client.getRepo()
      spinner.succeed(`Connected to ${chalk.cyan(repoInfo.fullName)}`)

      // Save config
      saveConfig(config as CLIConfig)
      console.log(chalk.green("\n Configuration saved to .cncptrc.json\n"))

      console.log("Next steps:")
      console.log(`  ${chalk.cyan("cncpt-blocks pull")} - Pull components from GitHub`)
      console.log(`  ${chalk.cyan("cncpt-blocks status")} - Check sync status\n`)
    } catch (error) {
      spinner.fail(`Error: ${error instanceof Error ? error.message : "Unknown error"}`)
      process.exit(1)
    }
  })

// ============================================================
// Pull Command
// ============================================================

program
  .command("pull [path]")
  .description("Pull component(s) from GitHub")
  .option("-a, --all", "Pull all components from configured path")
  .option("-f, --force", "Overwrite local changes")
  .option("--dry-run", "Preview without saving")
  .action(async (path, options) => {
    const config = loadConfig()
    if (!config) {
      console.log(chalk.red("Not initialized. Run `cncpt-blocks init` first."))
      process.exit(1)
    }

    const [owner, repo] = config.repo.split("/")
    const client = GitHubClient.withPAT(config.token, owner, repo, config.branch)
    const sync = new GitHubSyncService(client)

    const spinner = ora("Fetching from GitHub...").start()

    try {
      if (options.all || !path) {
        // Pull all from component path
        const results = await sync.pullDirectory(config.componentPath)
        spinner.stop()

        let success = 0
        let failed = 0

        for (const result of results) {
          if (result.success) {
            success++
            console.log(chalk.green(`✓ ${result.filePath}`))
            if (result.blocks) {
              console.log(chalk.gray(`  ${result.blocks.length} blocks`))
            }
          } else {
            failed++
            console.log(chalk.red(`✗ ${result.filePath}`))
            result.errors?.forEach((e) => console.log(chalk.red(`  ${e}`)))
          }
        }

        console.log(`\n${chalk.green(success)} succeeded, ${chalk.red(failed)} failed\n`)
      } else {
        // Pull single file
        const filePath = path.startsWith("/") ? path : `${config.componentPath}/${path}`
        const result = await sync.pull(filePath)
        spinner.stop()

        if (result.success) {
          console.log(chalk.green(`\n✓ Pulled ${result.filePath}\n`))
          console.log(`Component: ${chalk.cyan(result.componentName)}`)
          console.log(`Blocks: ${result.blocks?.length}`)
          console.log(`SHA: ${result.sha}`)

          if (options.dryRun) {
            console.log(chalk.yellow("\n[Dry run - changes not saved]"))
          }
        } else {
          console.log(chalk.red(`\n✗ Failed to pull ${filePath}\n`))
          result.errors?.forEach((e) => console.log(chalk.red(`  ${e}`)))
        }
      }
    } catch (error) {
      spinner.fail(`Error: ${error instanceof Error ? error.message : "Unknown error"}`)
      process.exit(1)
    }
  })

// ============================================================
// Push Command
// ============================================================

program
  .command("push <path>")
  .description("Push component to GitHub")
  .option("-m, --message <message>", "Commit message")
  .option("-f, --force", "Force push (overwrite remote)")
  .option("--create", "Create file if it doesn't exist")
  .option("--dry-run", "Preview without committing")
  .action(async (path, options) => {
    const config = loadConfig()
    if (!config) {
      console.log(chalk.red("Not initialized. Run `cncpt-blocks init` first."))
      process.exit(1)
    }

    const [owner, repo] = config.repo.split("/")
    const client = GitHubClient.withPAT(config.token, owner, repo, config.branch)
    const sync = new GitHubSyncService(client)

    // For now, we need blocks from somewhere - in real use this would come from the editor/database
    console.log(chalk.yellow("\nNote: Push requires blocks from the editor. Use the admin UI for full functionality.\n"))

    // This is a placeholder - in real implementation, blocks would come from the page store
    console.log(chalk.gray(`Would push to: ${config.componentPath}/${path}`))
    console.log(chalk.gray(`Message: ${options.message || "Update component"}`))

    if (options.dryRun) {
      console.log(chalk.yellow("\n[Dry run - no changes made]"))
    }
  })

// ============================================================
// Status Command
// ============================================================

program
  .command("status")
  .description("Check sync status")
  .option("-v, --verbose", "Show detailed status")
  .action(async (options) => {
    const config = loadConfig()
    if (!config) {
      console.log(chalk.red("Not initialized. Run `cncpt-blocks init` first."))
      process.exit(1)
    }

    const [owner, repo] = config.repo.split("/")
    const client = GitHubClient.withPAT(config.token, owner, repo, config.branch)

    console.log(chalk.bold("\n📊 Sync Status\n"))
    console.log(`Repository: ${chalk.cyan(config.repo)}`)
    console.log(`Branch: ${chalk.cyan(config.branch)}`)
    console.log(`Path: ${chalk.cyan(config.componentPath)}\n`)

    const spinner = ora("Checking status...").start()

    try {
      const files = await client.listFiles(config.componentPath)
      spinner.stop()

      const componentFiles = files.filter(
        (f) => f.type === "file" && (f.path.endsWith(".tsx") || f.path.endsWith(".jsx"))
      )

      console.log(`Found ${chalk.cyan(componentFiles.length)} components:\n`)

      for (const file of componentFiles) {
        console.log(`  ${chalk.gray("○")} ${file.path}`)
        if (options.verbose) {
          console.log(chalk.gray(`    SHA: ${file.sha.substring(0, 7)}`))
        }
      }

      console.log("")
    } catch (error) {
      spinner.fail(`Error: ${error instanceof Error ? error.message : "Unknown error"}`)
      process.exit(1)
    }
  })

// ============================================================
// Diff Command
// ============================================================

program
  .command("diff <path>")
  .description("Show diff between local and remote")
  .action(async (path) => {
    const config = loadConfig()
    if (!config) {
      console.log(chalk.red("Not initialized. Run `cncpt-blocks init` first."))
      process.exit(1)
    }

    const [owner, repo] = config.repo.split("/")
    const client = GitHubClient.withPAT(config.token, owner, repo, config.branch)
    const sync = new GitHubSyncService(client)

    console.log(chalk.yellow("\nNote: Diff requires local blocks from the editor. Use the admin UI for full functionality.\n"))

    // Fetch remote for display
    const spinner = ora("Fetching remote...").start()

    try {
      const filePath = path.startsWith("/") ? path : `${config.componentPath}/${path}`
      const result = await sync.pull(filePath)
      spinner.stop()

      if (result.success) {
        console.log(chalk.bold(`\nRemote: ${filePath}\n`))
        console.log(`Blocks: ${result.blocks?.length}`)
        console.log(`Component: ${result.componentName}`)
        console.log(`SHA: ${result.sha}`)
      } else {
        console.log(chalk.red(`\nCould not fetch: ${filePath}`))
        result.errors?.forEach((e) => console.log(chalk.red(`  ${e}`)))
      }
    } catch (error) {
      spinner.fail(`Error: ${error instanceof Error ? error.message : "Unknown error"}`)
      process.exit(1)
    }
  })

// ============================================================
// Config Command
// ============================================================

program
  .command("config")
  .description("Show current configuration")
  .option("--set <key=value>", "Set a config value")
  .action((options) => {
    const config = loadConfig()

    if (options.set) {
      const [key, value] = options.set.split("=")
      if (config && key && value) {
        (config as Record<string, string>)[key] = value
        saveConfig(config)
        console.log(chalk.green(`Set ${key} = ${value}`))
      }
      return
    }

    if (!config) {
      console.log(chalk.yellow("No configuration found. Run `cncpt-blocks init` first."))
      return
    }

    console.log(chalk.bold("\n⚙️  Configuration\n"))
    console.log(`Repository: ${chalk.cyan(config.repo)}`)
    console.log(`Branch: ${chalk.cyan(config.branch)}`)
    console.log(`Component Path: ${chalk.cyan(config.componentPath)}`)
    console.log(`Token: ${chalk.gray("***" + config.token.slice(-4))}`)
    console.log("")
  })

// Parse and run
program.parse()
