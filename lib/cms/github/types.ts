/**
 * GitHub Integration Types
 */

import type { Block } from "@/lib/cms/block-editor/types"

/** Authentication type for GitHub connection */
export type GitHubAuthType = "pat" | "oauth"

/** Connection configuration */
export interface GitHubConnectionConfig {
  authType: GitHubAuthType
  accessToken: string
  refreshToken?: string
  tokenExpiry?: Date
  owner: string
  repo: string
  branch: string
  componentPath: string
}

/** File content from GitHub */
export interface GitHubFileContent {
  path: string
  content: string
  sha: string
  size: number
  encoding: string
  url: string
}

/** File info (without content) */
export interface GitHubFileInfo {
  path: string
  sha: string
  size: number
  type: "file" | "dir"
  url: string
}

/** Repository info */
export interface GitHubRepoInfo {
  owner: string
  repo: string
  fullName: string
  description: string | null
  defaultBranch: string
  private: boolean
  url: string
}

/** Branch info */
export interface GitHubBranchInfo {
  name: string
  sha: string
  protected: boolean
}

/** Commit info */
export interface GitHubCommitInfo {
  sha: string
  message: string
  author: {
    name: string
    email: string
    date: string
  }
  url: string
}

/** Pull request info */
export interface GitHubPullRequest {
  number: number
  title: string
  body: string
  state: "open" | "closed" | "merged"
  head: {
    ref: string
    sha: string
  }
  base: {
    ref: string
    sha: string
  }
  url: string
  htmlUrl: string
}

/** Result of a pull operation */
export interface PullResult {
  success: boolean
  blocks?: Block[]
  componentName?: string
  filePath?: string
  sha?: string
  errors?: string[]
  warnings?: string[]
}

/** Result of a push operation */
export interface PushResult {
  success: boolean
  sha?: string
  url?: string
  commitUrl?: string
  errors?: string[]
}

/** Sync status for a file */
export type SyncStatus =
  | "synced"           // Local and remote are identical
  | "local_changes"    // Local has uncommitted changes
  | "remote_changes"   // Remote has new commits
  | "conflict"         // Both have changes
  | "untracked"        // Not yet synced

/** Synced file info (stored in database) */
export interface SyncedFileInfo {
  id: string
  connectionId: string
  pageId?: string
  filePath: string
  sha: string
  status: SyncStatus
  lastSyncedAt: Date
  localHash?: string
  remoteHash?: string
}

/** Result of sync status check */
export interface SyncStatusResult {
  file: SyncedFileInfo
  status: SyncStatus
  localBlocks?: Block[]
  remoteBlocks?: Block[]
  diff?: {
    added: number
    removed: number
    modified: number
  }
}

/** Options for pull operation */
export interface PullOptions {
  /** Create page if it doesn't exist */
  createPage?: boolean
  /** Overwrite local changes without confirmation */
  force?: boolean
  /** Custom component name (defaults to file name) */
  componentName?: string
}

/** Options for push operation */
export interface PushOptions {
  /** Commit message */
  message: string
  /** Create file if it doesn't exist */
  createFile?: boolean
  /** Create branch if it doesn't exist */
  createBranch?: boolean
  /** Force push (overwrite remote changes) */
  force?: boolean
}

/** Options for sync operation */
export interface SyncOptions {
  /** Strategy for handling conflicts */
  conflictStrategy?: "prefer-local" | "prefer-remote" | "manual"
  /** Create new files for added blocks */
  createNew?: boolean
  /** Delete files for removed blocks */
  deleteRemoved?: boolean
  /** Commit message template */
  messageTemplate?: string
}

/** OAuth callback data */
export interface OAuthCallbackData {
  code: string
  state: string
  installationId?: string
}

/** OAuth token response */
export interface OAuthTokenResponse {
  accessToken: string
  tokenType: string
  scope: string
  refreshToken?: string
  expiresIn?: number
}
