/**
 * GitHub API Client
 *
 * Wraps Octokit for GitHub API operations.
 * Supports both Personal Access Token (CLI) and OAuth (UI) authentication.
 */

import { Octokit } from "@octokit/rest"
import type {
  GitHubConnectionConfig,
  GitHubFileContent,
  GitHubFileInfo,
  GitHubRepoInfo,
  GitHubBranchInfo,
  GitHubCommitInfo,
  GitHubPullRequest,
  OAuthTokenResponse,
} from "./types"

export class GitHubClient {
  private octokit: Octokit
  private config: GitHubConnectionConfig

  constructor(config: GitHubConnectionConfig) {
    this.config = config
    this.octokit = new Octokit({
      auth: config.accessToken,
    })
  }

  // ============================================================
  // Static Factory Methods
  // ============================================================

  /**
   * Create a client with a Personal Access Token (for CLI)
   */
  static withPAT(token: string, owner: string, repo: string, branch = "main"): GitHubClient {
    return new GitHubClient({
      authType: "pat",
      accessToken: token,
      owner,
      repo,
      branch,
      componentPath: "src/components",
    })
  }

  /**
   * Create a client with OAuth token (for UI)
   */
  static withOAuth(
    accessToken: string,
    owner: string,
    repo: string,
    branch = "main",
    refreshToken?: string,
    tokenExpiry?: Date
  ): GitHubClient {
    return new GitHubClient({
      authType: "oauth",
      accessToken,
      refreshToken,
      tokenExpiry,
      owner,
      repo,
      branch,
      componentPath: "src/components",
    })
  }

  // ============================================================
  // Repository Operations
  // ============================================================

  /**
   * Get repository info
   */
  async getRepo(): Promise<GitHubRepoInfo> {
    const { data } = await this.octokit.repos.get({
      owner: this.config.owner,
      repo: this.config.repo,
    })

    return {
      owner: data.owner.login,
      repo: data.name,
      fullName: data.full_name,
      description: data.description,
      defaultBranch: data.default_branch,
      private: data.private,
      url: data.html_url,
    }
  }

  /**
   * List branches
   */
  async listBranches(): Promise<GitHubBranchInfo[]> {
    const { data } = await this.octokit.repos.listBranches({
      owner: this.config.owner,
      repo: this.config.repo,
      per_page: 100,
    })

    return data.map((branch) => ({
      name: branch.name,
      sha: branch.commit.sha,
      protected: branch.protected,
    }))
  }

  /**
   * Get branch info
   */
  async getBranch(branch?: string): Promise<GitHubBranchInfo> {
    const { data } = await this.octokit.repos.getBranch({
      owner: this.config.owner,
      repo: this.config.repo,
      branch: branch || this.config.branch,
    })

    return {
      name: data.name,
      sha: data.commit.sha,
      protected: data.protected,
    }
  }

  /**
   * Create a new branch
   */
  async createBranch(name: string, fromBranch?: string): Promise<GitHubBranchInfo> {
    // Get the SHA of the source branch
    const source = await this.getBranch(fromBranch)

    // Create the new branch
    await this.octokit.git.createRef({
      owner: this.config.owner,
      repo: this.config.repo,
      ref: `refs/heads/${name}`,
      sha: source.sha,
    })

    return this.getBranch(name)
  }

  // ============================================================
  // File Operations
  // ============================================================

  /**
   * List files in a directory
   */
  async listFiles(path: string = ""): Promise<GitHubFileInfo[]> {
    const { data } = await this.octokit.repos.getContent({
      owner: this.config.owner,
      repo: this.config.repo,
      path,
      ref: this.config.branch,
    })

    if (!Array.isArray(data)) {
      throw new Error(`Path '${path}' is a file, not a directory`)
    }

    return data.map((item) => ({
      path: item.path,
      sha: item.sha,
      size: item.size || 0,
      type: item.type === "dir" ? "dir" : "file",
      url: item.html_url || "",
    }))
  }

  /**
   * Get file content
   */
  async getFileContent(path: string): Promise<GitHubFileContent> {
    const { data } = await this.octokit.repos.getContent({
      owner: this.config.owner,
      repo: this.config.repo,
      path,
      ref: this.config.branch,
    })

    if (Array.isArray(data)) {
      throw new Error(`Path '${path}' is a directory, not a file`)
    }

    if (data.type !== "file" || !("content" in data)) {
      throw new Error(`Cannot read content of ${data.type}`)
    }

    const content = Buffer.from(data.content, "base64").toString("utf-8")

    return {
      path: data.path,
      content,
      sha: data.sha,
      size: data.size,
      encoding: data.encoding,
      url: data.html_url || "",
    }
  }

  /**
   * Check if a file exists
   */
  async fileExists(path: string): Promise<boolean> {
    try {
      await this.octokit.repos.getContent({
        owner: this.config.owner,
        repo: this.config.repo,
        path,
        ref: this.config.branch,
      })
      return true
    } catch (error: unknown) {
      if (error && typeof error === "object" && "status" in error && error.status === 404) {
        return false
      }
      throw error
    }
  }

  /**
   * Create or update a file
   */
  async createOrUpdateFile(
    path: string,
    content: string,
    message: string,
    sha?: string
  ): Promise<GitHubCommitInfo> {
    // If sha not provided, try to get it (for updates)
    let fileSha = sha
    if (!fileSha) {
      try {
        const existing = await this.getFileContent(path)
        fileSha = existing.sha
      } catch (error: unknown) {
        // File doesn't exist, that's fine for create
        if (error && typeof error === "object" && "status" in error && error.status !== 404) {
          throw error
        }
      }
    }

    const { data } = await this.octokit.repos.createOrUpdateFileContents({
      owner: this.config.owner,
      repo: this.config.repo,
      path,
      message,
      content: Buffer.from(content).toString("base64"),
      branch: this.config.branch,
      sha: fileSha,
    })

    return {
      sha: data.commit.sha,
      message: data.commit.message || message,
      author: {
        name: data.commit.author?.name || "Unknown",
        email: data.commit.author?.email || "",
        date: data.commit.author?.date || new Date().toISOString(),
      },
      url: data.commit.html_url || "",
    }
  }

  /**
   * Delete a file
   */
  async deleteFile(path: string, message: string, sha?: string): Promise<GitHubCommitInfo> {
    // Get SHA if not provided
    let fileSha = sha
    if (!fileSha) {
      const existing = await this.getFileContent(path)
      fileSha = existing.sha
    }

    const { data } = await this.octokit.repos.deleteFile({
      owner: this.config.owner,
      repo: this.config.repo,
      path,
      message,
      sha: fileSha,
      branch: this.config.branch,
    })

    return {
      sha: data.commit.sha,
      message: data.commit.message || message,
      author: {
        name: data.commit.author?.name || "Unknown",
        email: data.commit.author?.email || "",
        date: data.commit.author?.date || new Date().toISOString(),
      },
      url: data.commit.html_url || "",
    }
  }

  // ============================================================
  // Pull Request Operations
  // ============================================================

  /**
   * Create a pull request
   */
  async createPullRequest(
    title: string,
    head: string,
    base: string,
    body?: string
  ): Promise<GitHubPullRequest> {
    const { data } = await this.octokit.pulls.create({
      owner: this.config.owner,
      repo: this.config.repo,
      title,
      head,
      base,
      body,
    })

    return {
      number: data.number,
      title: data.title,
      body: data.body || "",
      state: data.state as "open" | "closed",
      head: {
        ref: data.head.ref,
        sha: data.head.sha,
      },
      base: {
        ref: data.base.ref,
        sha: data.base.sha,
      },
      url: data.url,
      htmlUrl: data.html_url,
    }
  }

  /**
   * List pull requests
   */
  async listPullRequests(state: "open" | "closed" | "all" = "open"): Promise<GitHubPullRequest[]> {
    const { data } = await this.octokit.pulls.list({
      owner: this.config.owner,
      repo: this.config.repo,
      state,
      per_page: 30,
    })

    return data.map((pr) => ({
      number: pr.number,
      title: pr.title,
      body: pr.body || "",
      state: pr.state as "open" | "closed",
      head: {
        ref: pr.head.ref,
        sha: pr.head.sha,
      },
      base: {
        ref: pr.base.ref,
        sha: pr.base.sha,
      },
      url: pr.url,
      htmlUrl: pr.html_url,
    }))
  }

  // ============================================================
  // Commit Operations
  // ============================================================

  /**
   * List recent commits
   */
  async listCommits(path?: string, perPage = 30): Promise<GitHubCommitInfo[]> {
    const { data } = await this.octokit.repos.listCommits({
      owner: this.config.owner,
      repo: this.config.repo,
      sha: this.config.branch,
      path,
      per_page: perPage,
    })

    return data.map((commit) => ({
      sha: commit.sha,
      message: commit.commit.message,
      author: {
        name: commit.commit.author?.name || "Unknown",
        email: commit.commit.author?.email || "",
        date: commit.commit.author?.date || "",
      },
      url: commit.html_url,
    }))
  }

  /**
   * Get a specific commit
   */
  async getCommit(sha: string): Promise<GitHubCommitInfo> {
    const { data } = await this.octokit.repos.getCommit({
      owner: this.config.owner,
      repo: this.config.repo,
      ref: sha,
    })

    return {
      sha: data.sha,
      message: data.commit.message,
      author: {
        name: data.commit.author?.name || "Unknown",
        email: data.commit.author?.email || "",
        date: data.commit.author?.date || "",
      },
      url: data.html_url,
    }
  }

  // ============================================================
  // Utility Methods
  // ============================================================

  /**
   * Get the current configuration
   */
  getConfig(): GitHubConnectionConfig {
    return { ...this.config }
  }

  /**
   * Update configuration
   */
  setConfig(updates: Partial<GitHubConnectionConfig>): void {
    this.config = { ...this.config, ...updates }
    if (updates.accessToken) {
      this.octokit = new Octokit({ auth: updates.accessToken })
    }
  }

  /**
   * Test the connection
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      await this.getRepo()
      return { success: true }
    } catch (error: unknown) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }
}

// ============================================================
// OAuth Helpers
// ============================================================

/**
 * Generate OAuth authorization URL
 */
export function getOAuthAuthorizationUrl(
  clientId: string,
  redirectUri: string,
  state: string,
  scopes: string[] = ["repo"]
): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: scopes.join(" "),
    state,
  })
  return `https://github.com/login/oauth/authorize?${params}`
}

/**
 * Exchange OAuth code for access token
 */
export async function exchangeCodeForToken(
  clientId: string,
  clientSecret: string,
  code: string,
  redirectUri: string
): Promise<OAuthTokenResponse> {
  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
    }),
  })

  if (!response.ok) {
    throw new Error(`OAuth token exchange failed: ${response.statusText}`)
  }

  const data = await response.json()

  if (data.error) {
    throw new Error(`OAuth error: ${data.error_description || data.error}`)
  }

  return {
    accessToken: data.access_token,
    tokenType: data.token_type,
    scope: data.scope,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
  }
}

/**
 * List repositories accessible to the authenticated user
 */
export async function listUserRepos(accessToken: string): Promise<GitHubRepoInfo[]> {
  const octokit = new Octokit({ auth: accessToken })

  const { data } = await octokit.repos.listForAuthenticatedUser({
    per_page: 100,
    sort: "updated",
  })

  return data.map((repo) => ({
    owner: repo.owner.login,
    repo: repo.name,
    fullName: repo.full_name,
    description: repo.description,
    defaultBranch: repo.default_branch,
    private: repo.private,
    url: repo.html_url,
  }))
}
