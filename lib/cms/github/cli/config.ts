/**
 * CLI Configuration Management
 *
 * Handles loading and saving the .cncptrc.json config file.
 */

import fs from "fs"
import path from "path"
import os from "os"

export interface CLIConfig {
  token: string
  repo: string
  branch: string
  componentPath: string
  // Optional settings
  apiUrl?: string
  pageIdMapping?: Record<string, string>
}

const CONFIG_FILE = ".cncptrc.json"
const GLOBAL_CONFIG_FILE = path.join(os.homedir(), ".cncptrc.json")

/**
 * Find the config file, checking local then global
 */
function findConfigPath(): string | null {
  // Check current directory
  const localPath = path.join(process.cwd(), CONFIG_FILE)
  if (fs.existsSync(localPath)) {
    return localPath
  }

  // Check home directory
  if (fs.existsSync(GLOBAL_CONFIG_FILE)) {
    return GLOBAL_CONFIG_FILE
  }

  return null
}

/**
 * Load configuration from file
 */
export function loadConfig(): CLIConfig | null {
  const configPath = findConfigPath()
  if (!configPath) {
    return null
  }

  try {
    const content = fs.readFileSync(configPath, "utf-8")
    return JSON.parse(content) as CLIConfig
  } catch (error) {
    console.error(`Error reading config: ${error}`)
    return null
  }
}

/**
 * Save configuration to file
 */
export function saveConfig(config: CLIConfig, global = false): void {
  const configPath = global ? GLOBAL_CONFIG_FILE : path.join(process.cwd(), CONFIG_FILE)

  // Create a sanitized version for saving (mask token)
  const toSave = {
    ...config,
  }

  fs.writeFileSync(configPath, JSON.stringify(toSave, null, 2))
}

/**
 * Delete configuration file
 */
export function deleteConfig(global = false): void {
  const configPath = global ? GLOBAL_CONFIG_FILE : path.join(process.cwd(), CONFIG_FILE)

  if (fs.existsSync(configPath)) {
    fs.unlinkSync(configPath)
  }
}

/**
 * Check if configuration exists
 */
export function hasConfig(): boolean {
  return findConfigPath() !== null
}

/**
 * Get the path to the config file
 */
export function getConfigPath(): string | null {
  return findConfigPath()
}

/**
 * Validate configuration
 */
export function validateConfig(config: Partial<CLIConfig>): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!config.token) {
    errors.push("Missing required field: token")
  }

  if (!config.repo) {
    errors.push("Missing required field: repo")
  } else if (!config.repo.includes("/")) {
    errors.push("Invalid repo format. Expected: owner/repo")
  }

  if (!config.branch) {
    errors.push("Missing required field: branch")
  }

  if (!config.componentPath) {
    errors.push("Missing required field: componentPath")
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Create default configuration
 */
export function createDefaultConfig(partial: Partial<CLIConfig>): CLIConfig {
  return {
    token: partial.token || "",
    repo: partial.repo || "",
    branch: partial.branch || "main",
    componentPath: partial.componentPath || "src/components/blocks",
    apiUrl: partial.apiUrl,
    pageIdMapping: partial.pageIdMapping || {},
  }
}
