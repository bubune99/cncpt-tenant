/**
 * Run schema fix migration
 */

import { Client } from "pg"
import * as fs from "fs"
import * as path from "path"

// Load environment variables
const envFiles = [".env.local", ".env"]
for (const envFile of envFiles) {
  const envPath = path.join(process.cwd(), envFile)
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
    console.log(`Loaded environment from ${envFile}`)
    break
  }
}

async function run() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  })

  await client.connect()
  console.log("Connected to database")

  const sql = fs.readFileSync(path.join(__dirname, "fix-subdomains-schema.sql"), "utf-8")
  console.log("Running schema fix...")

  try {
    await client.query(sql)
    console.log("Schema fix completed!")

    // Show final schema
    const schema = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'subdomains'
      ORDER BY ordinal_position
    `)
    console.log("\nSubdomains table columns:")
    for (const row of schema.rows) {
      console.log(`  - ${row.column_name}: ${row.data_type}`)
    }
  } catch (err: any) {
    console.error("Error:", err.message)
  }

  await client.end()
}

run()
