import { sql } from "@/lib/neon"

export interface GitHubConnection {
  id: number
  user_id: number
  github_user_id: number
  github_username: string
  access_token: string
  avatar_url?: string
  created_at: string
}

export interface GitHubRepository {
  id: number
  name: string
  full_name: string
  html_url: string
  description?: string
  private: boolean
  default_branch: string
}

export interface RepositoryConnection {
  id: number
  subdomain: string
  github_connection_id: number
  repository_name: string
  repository_full_name: string
  repository_url: string
  branch: string
  build_command?: string
  output_directory: string
  deployment_status: string
  vercel_project_id?: string
  vercel_deployment_url?: string
}

export async function getGitHubConnection(userId: number): Promise<GitHubConnection | null> {
  try {
    const result = await sql`
      SELECT * FROM github_connections 
      WHERE user_id = ${userId} 
      ORDER BY created_at DESC 
      LIMIT 1
    `
    return result[0] || null
  } catch (error) {
    console.error("Error fetching GitHub connection:", error)
    return null
  }
}

export async function createGitHubConnection(
  userId: number,
  githubData: {
    github_user_id: number
    github_username: string
    access_token: string
    avatar_url?: string
  },
): Promise<GitHubConnection> {
  const result = await sql`
    INSERT INTO github_connections (
      user_id, github_user_id, github_username, access_token, avatar_url
    ) VALUES (
      ${userId}, ${githubData.github_user_id}, ${githubData.github_username}, 
      ${githubData.access_token}, ${githubData.avatar_url}
    )
    ON CONFLICT (user_id, github_user_id) 
    DO UPDATE SET 
      access_token = EXCLUDED.access_token,
      avatar_url = EXCLUDED.avatar_url,
      updated_at = NOW()
    RETURNING *
  `
  return result[0]
}

export async function fetchGitHubRepositories(accessToken: string): Promise<GitHubRepository[]> {
  try {
    const response = await fetch("https://api.github.com/user/repos?sort=updated&per_page=100", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "SubdomainPlatform/1.0",
      },
    })

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`)
    }

    const repos = await response.json()
    return repos.map((repo: any) => ({
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      html_url: repo.html_url,
      description: repo.description,
      private: repo.private,
      default_branch: repo.default_branch,
    }))
  } catch (error) {
    console.error("Error fetching GitHub repositories:", error)
    throw error
  }
}

export async function getRepositoryConnection(subdomain: string): Promise<RepositoryConnection | null> {
  try {
    const result = await sql`
      SELECT rc.*, gc.github_username
      FROM repository_connections rc
      JOIN github_connections gc ON rc.github_connection_id = gc.id
      WHERE rc.subdomain = ${subdomain}
    `
    return result[0] || null
  } catch (error) {
    console.error("Error fetching repository connection:", error)
    return null
  }
}

export async function createRepositoryConnection(data: {
  subdomain: string
  github_connection_id: number
  repository_name: string
  repository_full_name: string
  repository_url: string
  branch?: string
  build_command?: string
  output_directory?: string
}): Promise<RepositoryConnection> {
  const result = await sql`
    INSERT INTO repository_connections (
      subdomain, github_connection_id, repository_name,
      repository_full_name, repository_url, branch,
      build_command, output_directory
    ) VALUES (
      ${data.subdomain}, ${data.github_connection_id}, ${data.repository_name},
      ${data.repository_full_name}, ${data.repository_url}, ${data.branch || "main"},
      ${data.build_command}, ${data.output_directory || "dist"}
    )
    ON CONFLICT (subdomain)
    DO UPDATE SET
      github_connection_id = EXCLUDED.github_connection_id,
      repository_name = EXCLUDED.repository_name,
      repository_full_name = EXCLUDED.repository_full_name,
      repository_url = EXCLUDED.repository_url,
      branch = EXCLUDED.branch,
      build_command = EXCLUDED.build_command,
      output_directory = EXCLUDED.output_directory,
      updated_at = NOW()
    RETURNING *
  `
  return result[0]
}
