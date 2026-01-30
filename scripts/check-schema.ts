/**
 * Check database schema
 */

import { Client } from "pg"
import * as fs from "fs"
import * as path from "path"

// Load environment variables
const envPath = path.join(process.cwd(), ".env")
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf-8")
  for (const line of content.split("\n")) {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith("#")) {
      const [key, ...valueParts] = trimmed.split("=")
      const value = valueParts.join("=").replace(/^["']|["']$/g, "")
      if (key && !process.env[key]) {
        process.env[key] = value
      }
    }
  }
}

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  })
  await client.connect()

  // Check subdomains table structure
  const result = await client.query(`
    SELECT column_name, data_type, udt_name
    FROM information_schema.columns
    WHERE table_name = 'subdomains'
    ORDER BY ordinal_position
  `)

  console.log("Subdomains table columns:")
  for (const row of result.rows) {
    console.log(`  ${row.column_name}: ${row.udt_name}`)
  }

  // Check if subdomains table has id column and its type
  const idCol = result.rows.find((r: any) => r.column_name === "id")
  if (idCol) {
    console.log(`\nID column type: ${idCol.udt_name}`)
  } else {
    console.log("\nNo 'id' column found in subdomains table")
  }

  await client.end()
}

main().catch(console.error)
