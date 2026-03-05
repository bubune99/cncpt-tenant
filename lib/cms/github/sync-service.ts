/**
 * GitHub Sync Service
 *
 * Handles bidirectional synchronization between the block editor and GitHub.
 * Uses the Block SDK for conversion and diff operations.
 */

import { GitHubClient } from "./client"
import type {
  PullResult,
  PushResult,
  SyncStatus,
  SyncStatusResult,
  SyncedFileInfo,
  PullOptions,
  PushOptions,
  SyncOptions,
} from "./types"

import {
  fromJSX,
  fromReactComponent,
  toReactComponent,
  validate,
  diff,
  patch,
  formatDiffSummary,
  type Block,
  type DiffResult,
} from "@/lib/cms/blocks-sdk"

export class GitHubSyncService {
  private client: GitHubClient
  private syncedFiles: Map<string, SyncedFileInfo> = new Map()

  constructor(client: GitHubClient) {
    this.client = client
  }

  // ============================================================
  // Pull Operations (GitHub -> Blocks)
  // ============================================================

  /**
   * Pull a component from GitHub and convert to blocks
   */
  async pull(filePath: string, options: PullOptions = {}): Promise<PullResult> {
    try {
      // Fetch file from GitHub
      const file = await this.client.getFileContent(filePath)

      // Parse the React component to blocks
      const { blocks, componentName, errors } = fromReactComponent(file.content)

      if (errors.length > 0 && blocks.length === 0) {
        return {
          success: false,
          errors,
          filePath,
        }
      }

      // Validate the parsed blocks
      const validation = validate(blocks)
      const warnings = [
        ...errors,
        ...validation.warnings.map((w) => w.message),
      ]

      if (!validation.valid) {
        return {
          success: false,
          errors: validation.errors.map((e) => e.message),
          warnings,
          filePath,
        }
      }

      // Update sync tracking
      this.updateSyncedFile(filePath, {
        sha: file.sha,
        status: "synced",
        lastSyncedAt: new Date(),
      })

      return {
        success: true,
        blocks,
        componentName: options.componentName || componentName || generateNameFromPath(filePath),
        filePath,
        sha: file.sha,
        warnings: warnings.length > 0 ? warnings : undefined,
      }
    } catch (error: unknown) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : "Unknown error"],
        filePath,
      }
    }
  }

  /**
   * Pull all components from a directory
   */
  async pullDirectory(dirPath: string, options: PullOptions = {}): Promise<PullResult[]> {
    const results: PullResult[] = []

    try {
      const files = await this.client.listFiles(dirPath)
      const componentFiles = files.filter(
        (f) => f.type === "file" && (f.path.endsWith(".tsx") || f.path.endsWith(".jsx"))
      )

      for (const file of componentFiles) {
        const result = await this.pull(file.path, options)
        results.push(result)
      }
    } catch (error: unknown) {
      results.push({
        success: false,
        errors: [error instanceof Error ? error.message : "Failed to list directory"],
        filePath: dirPath,
      })
    }

    return results
  }

  // ============================================================
  // Push Operations (Blocks -> GitHub)
  // ============================================================

  /**
   * Push blocks to GitHub as a React component
   */
  async push(
    blocks: Block[],
    filePath: string,
    options: PushOptions
  ): Promise<PushResult> {
    try {
      // Validate blocks before push
      const validation = validate(blocks, { strict: true })
      if (!validation.valid) {
        return {
          success: false,
          errors: validation.errors.map((e) => `${e.path}: ${e.message}`),
        }
      }

      // Convert blocks to React component
      const componentName = generateNameFromPath(filePath)
      const componentCode = toReactComponent(blocks, {
        name: componentName,
        exportType: "default",
        includeImports: true,
      })

      // Get existing file SHA if it exists
      let sha: string | undefined
      const syncedFile = this.syncedFiles.get(filePath)
      if (syncedFile) {
        sha = syncedFile.sha
      } else if (!options.createFile) {
        // Check if file exists
        const exists = await this.client.fileExists(filePath)
        if (exists) {
          const existing = await this.client.getFileContent(filePath)
          sha = existing.sha
        }
      }

      // Commit to GitHub
      const commit = await this.client.createOrUpdateFile(
        filePath,
        componentCode,
        options.message,
        sha
      )

      // Update sync tracking
      this.updateSyncedFile(filePath, {
        sha: commit.sha,
        status: "synced",
        lastSyncedAt: new Date(),
      })

      return {
        success: true,
        sha: commit.sha,
        url: commit.url,
        commitUrl: commit.url,
      }
    } catch (error: unknown) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : "Unknown error"],
      }
    }
  }

  // ============================================================
  // Sync Status Operations
  // ============================================================

  /**
   * Check sync status for a file
   */
  async checkStatus(
    filePath: string,
    localBlocks?: Block[]
  ): Promise<SyncStatusResult> {
    const syncedFile = this.syncedFiles.get(filePath) || {
      id: filePath,
      connectionId: "",
      filePath,
      sha: "",
      status: "untracked" as SyncStatus,
      lastSyncedAt: new Date(),
    }

    try {
      // Get remote file
      const remoteFile = await this.client.getFileContent(filePath)
      const { blocks: remoteBlocks } = fromReactComponent(remoteFile.content)

      // Compare SHAs for quick check
      if (syncedFile.sha === remoteFile.sha && !localBlocks) {
        return {
          file: { ...syncedFile, status: "synced" },
          status: "synced",
        }
      }

      // If we have local blocks, do a detailed diff
      if (localBlocks) {
        const changes = diff(localBlocks, remoteBlocks)

        let status: SyncStatus = "synced"
        if (changes.hasConflicts) {
          status = "conflict"
        } else if (changes.hasChanges) {
          // Check if local or remote changed
          if (syncedFile.sha !== remoteFile.sha) {
            status = "remote_changes"
          } else {
            status = "local_changes"
          }
        }

        return {
          file: { ...syncedFile, status },
          status,
          localBlocks,
          remoteBlocks,
          diff: {
            added: changes.added.length,
            removed: changes.removed.length,
            modified: changes.modified.length,
          },
        }
      }

      // Remote changed
      return {
        file: { ...syncedFile, status: "remote_changes" },
        status: "remote_changes",
        remoteBlocks,
      }
    } catch (error: unknown) {
      // File doesn't exist on remote
      if (error && typeof error === "object" && "status" in error && error.status === 404) {
        return {
          file: { ...syncedFile, status: "untracked" },
          status: "untracked",
          localBlocks,
        }
      }
      throw error
    }
  }

  /**
   * Get diff between local blocks and remote file
   */
  async getDiff(filePath: string, localBlocks: Block[]): Promise<DiffResult | null> {
    try {
      const remoteFile = await this.client.getFileContent(filePath)
      const { blocks: remoteBlocks } = fromReactComponent(remoteFile.content)

      return diff(localBlocks, remoteBlocks)
    } catch (error: unknown) {
      if (error && typeof error === "object" && "status" in error && error.status === 404) {
        return null // File doesn't exist
      }
      throw error
    }
  }

  /**
   * Get human-readable diff summary
   */
  async getDiffSummary(filePath: string, localBlocks: Block[]): Promise<string> {
    const changes = await this.getDiff(filePath, localBlocks)
    if (!changes) {
      return "File does not exist on remote."
    }
    return formatDiffSummary(changes)
  }

  // ============================================================
  // Bidirectional Sync
  // ============================================================

  /**
   * Sync a file bidirectionally
   */
  async sync(
    filePath: string,
    localBlocks: Block[],
    options: SyncOptions = {}
  ): Promise<{ success: boolean; blocks: Block[]; errors?: string[] }> {
    const strategy = options.conflictStrategy || "manual"

    try {
      // Get remote blocks
      let remoteBlocks: Block[] = []
      let remoteSha: string | undefined

      try {
        const remoteFile = await this.client.getFileContent(filePath)
        const parsed = fromReactComponent(remoteFile.content)
        remoteBlocks = parsed.blocks
        remoteSha = remoteFile.sha
      } catch (error: unknown) {
        if (!(error && typeof error === "object" && "status" in error && error.status === 404)) {
          throw error
        }
        // File doesn't exist, push local
      }

      // If no remote, just push local
      if (remoteBlocks.length === 0) {
        const pushResult = await this.push(localBlocks, filePath, {
          message: options.messageTemplate || `Sync: Create ${filePath}`,
          createFile: true,
        })

        if (!pushResult.success) {
          return { success: false, blocks: localBlocks, errors: pushResult.errors }
        }
        return { success: true, blocks: localBlocks }
      }

      // Diff local vs remote
      const changes = diff(localBlocks, remoteBlocks)

      if (!changes.hasChanges) {
        return { success: true, blocks: localBlocks }
      }

      // Handle conflicts
      if (changes.hasConflicts) {
        if (strategy === "manual") {
          return {
            success: false,
            blocks: localBlocks,
            errors: ["Conflicts detected. Use prefer-local or prefer-remote strategy, or resolve manually."],
          }
        }
      }

      // Merge changes
      const mergedBlocks = patch(localBlocks, changes, {
        strategy: strategy === "manual" ? "prefer-local" : strategy,
      })

      // Push merged result
      const pushResult = await this.push(mergedBlocks, filePath, {
        message: options.messageTemplate || `Sync: Update ${filePath}`,
      })

      if (!pushResult.success) {
        return { success: false, blocks: mergedBlocks, errors: pushResult.errors }
      }

      return { success: true, blocks: mergedBlocks }
    } catch (error: unknown) {
      return {
        success: false,
        blocks: localBlocks,
        errors: [error instanceof Error ? error.message : "Unknown error"],
      }
    }
  }

  // ============================================================
  // Sync Tracking
  // ============================================================

  /**
   * Update synced file tracking info
   */
  private updateSyncedFile(filePath: string, updates: Partial<SyncedFileInfo>): void {
    const existing = this.syncedFiles.get(filePath) || {
      id: filePath,
      connectionId: "",
      filePath,
      sha: "",
      status: "untracked" as SyncStatus,
      lastSyncedAt: new Date(),
    }

    this.syncedFiles.set(filePath, { ...existing, ...updates })
  }

  /**
   * Get all synced files
   */
  getSyncedFiles(): SyncedFileInfo[] {
    return Array.from(this.syncedFiles.values())
  }

  /**
   * Load synced files from external source (e.g., database)
   */
  loadSyncedFiles(files: SyncedFileInfo[]): void {
    for (const file of files) {
      this.syncedFiles.set(file.filePath, file)
    }
  }

  /**
   * Clear sync tracking
   */
  clearSyncTracking(): void {
    this.syncedFiles.clear()
  }
}

// ============================================================
// Helper Functions
// ============================================================

function generateNameFromPath(filePath: string): string {
  const fileName = filePath.split("/").pop() || "Component"
  const baseName = fileName.replace(/\.(tsx?|jsx?)$/, "")

  // Handle index files
  if (baseName === "index" || baseName === "page") {
    const parts = filePath.split("/")
    return parts[parts.length - 2] || "Component"
  }

  // Convert to PascalCase
  return baseName
    .split(/[-_\s]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join("")
}
