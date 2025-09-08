import { type NextRequest, NextResponse } from "next/server"
import { handleGitHubCallback } from "@/app/github-actions"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get("code")
  const state = searchParams.get("state")
  const error = searchParams.get("error")

  if (error) {
    return NextResponse.redirect(new URL("/dashboard?error=github_oauth_denied", request.url))
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL("/dashboard?error=github_oauth_invalid", request.url))
  }

  try {
    await handleGitHubCallback(code, state)
    return NextResponse.redirect(new URL("/dashboard?success=github_connected", request.url))
  } catch (error) {
    console.error("GitHub callback error:", error)
    return NextResponse.redirect(new URL("/dashboard?error=github_oauth_failed", request.url))
  }
}
