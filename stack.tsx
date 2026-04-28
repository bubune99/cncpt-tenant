import "server-only"
import { StackServerApp } from "@stackframe/stack"

/**
 * Stack Auth server app — this is the SDK-side configuration.
 *
 * OAUTH PROVIDERS (Google, GitHub, etc.)
 * --------------------------------------
 * Stack Auth reads enabled OAuth providers from the project config in the
 * Stack Auth dashboard, NOT from this file. The SDK constructor does not
 * accept an `oauthProviders` option — `StackHandler` and `<SignIn />` /
 * `<SignUp />` automatically render Google + GitHub buttons once they are
 * enabled in the dashboard.
 *
 * To enable Google + GitHub on /handler/sign-in (Fix #7), an OWNER must do
 * the following one-time dashboard config (this CANNOT be done from code):
 *
 * 1. Go to https://app.stack-auth.com → select the cncptweb.com project.
 * 2. Auth Methods → toggle ON:
 *    - Google
 *    - GitHub
 * 3. For Google:
 *    a. In Google Cloud Console (console.cloud.google.com) create an OAuth
 *       2.0 Client ID (type: Web application).
 *    b. Authorized redirect URI: https://api.stack-auth.com/api/v1/auth/oauth/callback/google
 *       (Stack Auth shows the exact URL in the provider config panel.)
 *    c. Paste Client ID + Client Secret into the Stack Auth Google provider.
 * 4. For GitHub:
 *    a. github.com → Settings → Developer settings → OAuth Apps → New.
 *    b. Authorization callback URL: https://api.stack-auth.com/api/v1/auth/oauth/callback/github
 *    c. Paste Client ID + Client Secret into the Stack Auth GitHub provider.
 * 5. Save. The /handler/sign-in page will start showing the buttons within
 *    a minute (no redeploy needed).
 *
 * No environment variables are required on the Vercel side — Stack Auth
 * holds the OAuth credentials server-side. The existing
 * NEXT_PUBLIC_STACK_PROJECT_ID / STACK_SECRET_SERVER_KEY pair is sufficient.
 */
export const stackServerApp = new StackServerApp({
  tokenStore: "nextjs-cookie",
  urls: {
    afterSignIn: "/dashboard",
    afterSignUp: "/dashboard",
  },
})
