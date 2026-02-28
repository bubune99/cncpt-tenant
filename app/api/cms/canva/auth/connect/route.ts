/**
 * Canva OAuth Connect
 *
 * GET /api/canva/auth/connect — Initiates OAuth 2.0 + PKCE flow.
 * Generates PKCE challenge, stores verifier in session cookie, redirects to Canva.
 */

import { NextRequest, NextResponse } from "next/server"
import { requireAuth, handleAuthError } from "@/lib/cms/permissions/middleware"
import {
  generatePKCE,
  generateState,
  getAuthorizationUrl,
} from "@/lib/cms/canva/client"

export async function GET(request: NextRequest) {
  try {
    await requireAuth()

    const { codeVerifier, codeChallenge } = await generatePKCE()
    const state = generateState()

    const authUrl = getAuthorizationUrl(state, codeChallenge)

    // Store PKCE verifier and state in secure httpOnly cookies
    const response = NextResponse.redirect(authUrl)

    response.cookies.set("canva_code_verifier", codeVerifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600, // 10 minutes
      path: "/",
    })

    response.cookies.set("canva_oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600,
      path: "/",
    })

    return response
  } catch (error) {
    return handleAuthError(error)
  }
}
