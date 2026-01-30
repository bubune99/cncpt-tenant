import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Check if DATABASE_URL is available
const DATABASE_URL = process.env.DATABASE_URL

function createPrismaClient(): PrismaClient {
  if (!DATABASE_URL) {
    console.warn("[prisma] DATABASE_URL not set - database queries will fail")
    // Return a proxy that throws helpful errors on any database operation
    return new Proxy({} as PrismaClient, {
      get(target, prop) {
        if (prop === "then" || prop === "$connect" || prop === "$disconnect") {
          return undefined
        }
        // For any model access, return a proxy that throws on method calls
        return new Proxy(
          {},
          {
            get(_, method) {
              return () => {
                throw new Error(
                  `[prisma] Cannot execute ${String(prop)}.${String(method)}() - DATABASE_URL is not configured. Please set DATABASE_URL in your environment variables.`
                )
              }
            },
          }
        )
      },
    })
  }

  // Use standard Prisma client without adapter
  // Prisma 7.x uses DATABASE_URL from environment automatically
  const client = new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  })

  // Cache client in all environments
  globalForPrisma.prisma = client

  return client
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

export default prisma
