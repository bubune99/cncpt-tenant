import "server-only"
import { StackServerApp } from "@stackframe/stack"

export const stackServerApp = new StackServerApp({
  tokenStore: "nextjs-cookie",
  baseUrl:
    process.env.NEXT_PUBLIC_APP_URL ||
    (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"),
  urls: {
    afterSignIn: "/dashboard",
    afterSignUp: "/dashboard",
    signIn: "/login",
  },
})
