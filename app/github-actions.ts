"use server"

import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { createGitHubConnection, fetchGitHubRepositories, getGitHubConnection } from "@/lib/github"

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET
const GITHUB_REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL + "/api/auth/github/callback"

export async function initiateGitHubOAuth() {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/login")
  }

  if (!GITHUB_CLIENT_ID) {
    throw new Error("GitHub OAuth not configured")
  }

  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    redirect_uri: GITHUB_REDIRECT_URI,
    scope: "repo,user:email",
    state: user.id.toString(),
  })

  redirect(`https://github.com/login/oauth/authorize?${params.toString()}`)
}

export async function handleGitHubCallback(code: string, state: string) {
  const userId = Number.parseInt(state)

  if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
    throw new Error("GitHub OAuth not configured")
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: GITHUB_REDIRECT_URI,
      }),
    })

    const tokenData = await tokenResponse.json()

    if (tokenData.error) {
      throw new Error(tokenData.error_description || "Failed to get access token")
    }

    // Get user info from GitHub
    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        Accept: "application/vnd.github.v3+json",
      },
    })

    const githubUser = await userResponse.json()

    // Store connection in database
    await createGitHubConnection(userId, {
      github_user_id: githubUser.id,
      github_username: githubUser.login,
      access_token: tokenData.access_token,
      avatar_url: githubUser.avatar_url,
    })

    return { success: true }
  } catch (error) {
    console.error("GitHub OAuth error:", error)
    throw error
  }
}

export async function getUserRepositories() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("Not authenticated")
  }

  const connection = await getGitHubConnection(user.id)
  if (!connection) {
    throw new Error("GitHub not connected")
  }

  return await fetchGitHubRepositories(connection.access_token)
}
