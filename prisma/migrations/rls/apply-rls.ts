#!/usr/bin/env npx tsx
/**
 * Apply RLS Migration Script
 *
 * Reads and executes the RLS SQL migration against the database.
 * Uses the pg Pool directly (not Prisma) to ensure we have full
 * DDL control for ALTER TABLE and CREATE POLICY statements.
 *
 * Usage:
 *   npx tsx prisma/migrations/rls/apply-rls.ts
 *   npx tsx prisma/migrations/rls/apply-rls.ts --rollback
 */

import { readFileSync } from "fs"
import { join } from "path"
import { Pool } from "pg"

const isRollback = process.argv.includes("--rollback")

async function main() {
  const DATABASE_URL = process.env.DATABASE_URL
  if (!DATABASE_URL) {
    console.error("ERROR: DATABASE_URL environment variable is required")
    process.exit(1)
  }

  const sqlFile = isRollback
    ? "001_enable_rls_rollback.sql"
    : "001_enable_rls.sql"

  const sqlPath = join(__dirname, sqlFile)
  const sql = readFileSync(sqlPath, "utf-8")

  console.log(`\n${isRollback ? "Rolling back" : "Applying"} RLS migration...`)
  console.log(`SQL file: ${sqlFile}`)

  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  })

  try {
    const client = await pool.connect()

    try {
      // Execute the full SQL as a single transaction
      await client.query("BEGIN")
      await client.query(sql)
      await client.query("COMMIT")

      console.log(`\nRLS migration ${isRollback ? "rolled back" : "applied"} successfully.`)

      // Verify: list tables with RLS status
      const result = await client.query(`
        SELECT tablename, rowsecurity
        FROM pg_tables
        WHERE schemaname = 'public'
        ORDER BY tablename
      `)

      const rlsTables = result.rows.filter((r) => r.rowsecurity)
      console.log(`\nTables with RLS enabled: ${rlsTables.length}`)
      for (const row of rlsTables) {
        console.log(`  - ${row.tablename}`)
      }

      if (!isRollback) {
        // Verify policies exist
        const policies = await client.query(`
          SELECT schemaname, tablename, policyname
          FROM pg_policies
          WHERE schemaname = 'public'
          ORDER BY tablename, policyname
        `)
        console.log(`\nRLS policies created: ${policies.rows.length}`)
      }
    } catch (err) {
      await client.query("ROLLBACK")
      throw err
    } finally {
      client.release()
    }
  } finally {
    await pool.end()
  }
}

main().catch((err) => {
  console.error("Migration failed:", err)
  process.exit(1)
})
