"use client";

import { StackClientApp } from "@stackframe/stack";

// Check for required environment variables
const projectId = process.env.NEXT_PUBLIC_STACK_PROJECT_ID;
const publishableClientKey = process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY;

if (!projectId || !publishableClientKey) {
  console.warn(
    "[Stack Auth] Missing environment variables. Set NEXT_PUBLIC_STACK_PROJECT_ID and NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY"
  );
}

export const stackClientApp = new StackClientApp({
  projectId: projectId || "",
  publishableClientKey: publishableClientKey || "",
  tokenStore: "nextjs-cookie",
  urls: {
    afterSignIn: "/admin",
    afterSignUp: "/admin",
    afterSignOut: "/",
    home: "/",
    signIn: "/handler/sign-in",
    signUp: "/handler/sign-up",
  },
});
