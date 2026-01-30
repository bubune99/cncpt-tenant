import { neon, NeonQueryFunction } from "@neondatabase/serverless"

// Create a no-op SQL function for when DATABASE_URL is not set
const noopSql = (() => {
  console.warn("[neon] DATABASE_URL not set, database queries will fail")
  return Promise.resolve([])
}) as unknown as NeonQueryFunction<false, false>

// Only create the real connection if DATABASE_URL is available
const sql: NeonQueryFunction<false, false> = process.env.DATABASE_URL
  ? neon(process.env.DATABASE_URL)
  : noopSql

export { sql }
