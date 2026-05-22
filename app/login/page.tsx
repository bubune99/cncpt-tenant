import { SignIn } from "@stackframe/stack"

/**
 * Validate a post-auth redirect target to prevent open-redirect phishing.
 *
 * Stack Auth's `afterSignIn` performs a client-side window.location.assign on
 * the value we hand it. Without validation, an attacker could craft a link
 * like /login?redirect=https://evil.example.com that auths the user on the
 * real site, then bounces them to a phishing page that looks like cncptweb.
 *
 * Rules:
 * - Must be a relative path (`/foo`, never `//attacker.com`).
 * - Cannot start with `//` (protocol-relative, treated as absolute).
 * - Cannot contain a backslash (some browsers treat `/\evil.com` as host).
 */
function safeRedirectPath(raw: string | undefined): string {
  if (!raw) return "/dashboard"
  if (typeof raw !== "string") return "/dashboard"
  if (!raw.startsWith("/")) return "/dashboard"
  if (raw.startsWith("//")) return "/dashboard"
  if (raw.includes("\\")) return "/dashboard"
  // Reject anything that decodes to a protocol/host
  try {
    const u = new URL(raw, "https://placeholder.invalid")
    if (u.origin !== "https://placeholder.invalid") return "/dashboard"
  } catch {
    return "/dashboard"
  }
  return raw
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>
}) {
  const { redirect } = await searchParams
  const afterAuth = safeRedirectPath(redirect)

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50" data-tour-id="login-page">
      <div data-tour-id="login-stack-container">
        <SignIn afterSignIn={afterAuth} afterSignUp={afterAuth} />
      </div>
    </div>
  )
}
