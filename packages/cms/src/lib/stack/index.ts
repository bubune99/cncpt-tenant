import "server-only";
import { StackServerApp } from "@stackframe/stack";

// Stack Auth requires these env vars:
// - NEXT_PUBLIC_STACK_PROJECT_ID
// - NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY
// - STACK_SECRET_SERVER_KEY

const requiredEnvVars = [
  'NEXT_PUBLIC_STACK_PROJECT_ID',
  'NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY',
  'STACK_SECRET_SERVER_KEY',
];

const missingEnvVars = requiredEnvVars.filter(
  (envVar) => !process.env[envVar]
);

if (missingEnvVars.length > 0) {
  console.error(
    `[Stack Auth] Missing required environment variables: ${missingEnvVars.join(', ')}`
  );
}

export const stackServerApp = new StackServerApp({
  tokenStore: "nextjs-cookie",
});
