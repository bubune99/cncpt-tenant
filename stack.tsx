import "server-only"
import { StackServerApp } from "@stackframe/stack"

console.log("[v0] Stack Auth Environment Variables:")
console.log("[v0] NEXT_PUBLIC_STACK_PROJECT_ID:", process.env.NEXT_PUBLIC_STACK_PROJECT_ID ? "✓ Set" : "✗ Missing")
console.log(
  "[v0] NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY:",
  process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY ? "✓ Set" : "✗ Missing",
)
console.log("[v0] STACK_SECRET_SERVER_KEY:", process.env.STACK_SECRET_SERVER_KEY ? "✓ Set" : "✗ Missing")

if (!process.env.NEXT_PUBLIC_STACK_PROJECT_ID) {
  throw new Error("NEXT_PUBLIC_STACK_PROJECT_ID environment variable is required")
}

if (!process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY) {
  throw new Error("NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY environment variable is required")
}

if (!process.env.STACK_SECRET_SERVER_KEY) {
  throw new Error("STACK_SECRET_SERVER_KEY environment variable is required")
}

export const stackServerApp = new StackServerApp({
  tokenStore: "nextjs-cookie",
  projectId: process.env.NEXT_PUBLIC_STACK_PROJECT_ID,
  publishableClientKey: process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY,
  secretServerKey: process.env.STACK_SECRET_SERVER_KEY,
  urls: {
    afterSignIn: "/auth-redirect",
    afterSignUp: "/auth-redirect",
    signIn: "/login",
  },
})
