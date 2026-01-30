import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  pool: Pool | undefined
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

  const pool =
    globalForPrisma.pool ??
    new Pool({
      connectionString: DATABASE_URL,
    })

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.pool = pool
  }

  const adapter = new PrismaPg(pool)

  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

export default prisma
