/**
 * Canva OAuth Callback
 *
 * GET /api/canva/auth/callback — Handles OAuth redirect from Canva.
 * Exchanges authorization code for tokens, stores encrypted tokens,
 * fetches user info, redirects back to media library.
 */

import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/cms/permissions/middleware"
import {
  exchangeCodeForTokens,
  getCanvaUser,
  storeCanvaConnection,
} from "@/lib/cms/canva/client"

export async function GET(request: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  const redirectUrl = `${baseUrl}/admin/media`

  try {
    const context = await requireAuth()

    const { searchParams } = new URL(request.url)
    const code = searchParams.get("code")
    const state = searchParams.get("state")
    const error = searchParams.get("error")

    // Handle denied or errored flows
    if (error) {
      const errorDesc = searchParams.get("error_description") || "Authorization denied"
      return NextResponse.redirect(
        `${redirectUrl}?canva_error=${encodeURIComponent(errorDesc)}`
      )
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${redirectUrl}?canva_error=${encodeURIComponent("Missing authorization code")}`
      )
    }

    // Verify state matches
    const storedState = request.cookies.get("canva_oauth_state")?.value
    if (!storedState || storedState !== state) {
      return NextResponse.redirect(
        `${redirectUrl}?canva_error=${encodeURIComponent("Invalid OAuth state")}`
      )
    }

    // Retrieve PKCE verifier
    const codeVerifier = request.cookies.get("canva_code_verifier")?.value
    if (!codeVerifier) {
      return NextResponse.redirect(
        `${redirectUrl}?canva_error=${encodeURIComponent("Missing PKCE verifier")}`
      )
    }

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code, codeVerifier)

    // Fetch Canva user info
    let userInfo
    try {
      userInfo = await getCanvaUser(tokens.access_token)
    } catch {
      // Non-critical — proceed without user info
    }

    // Store encrypted connection
    await storeCanvaConnection(context.user.id, tokens, userInfo)

    // Clear PKCE cookies and redirect
    const response = NextResponse.redirect(
      `${redirectUrl}?canva_connected=true`
    )
    response.cookies.delete("canva_code_verifier")
    response.cookies.delete("canva_oauth_state")

    return response
  } catch (error) {
    console.error("[canva] OAuth callback error:", error)
    return NextResponse.redirect(
      `${redirectUrl}?canva_error=${encodeURIComponent("Connection failed")}`
    )
  }
}
