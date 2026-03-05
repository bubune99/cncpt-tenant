/**
 * GitHub Integration - Main Exports
 */

export { GitHubClient, getOAuthAuthorizationUrl, exchangeCodeForToken, listUserRepos } from "./client"
export { GitHubSyncService } from "./sync-service"
export type {
  GitHubAuthType,
  GitHubConnectionConfig,
  GitHubFileContent,
  GitHubFileInfo,
  GitHubRepoInfo,
  GitHubBranchInfo,
  GitHubCommitInfo,
  GitHubPullRequest,
  PullResult,
  PushResult,
  SyncStatus,
  SyncedFileInfo,
  SyncStatusResult,
  PullOptions,
  PushOptions,
  SyncOptions,
  OAuthCallbackData,
  OAuthTokenResponse,
} from "./types"
