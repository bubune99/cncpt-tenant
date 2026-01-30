/**
 * Database Migration Runner
 * Runs SQL migrations against the Neon database
 *
 * Usage: npx tsx scripts/run-migrations.ts
 */

import { Client } from "pg"
import * as fs from "fs"
import * as path from "path"

// Load environment variables from .env.local or .env
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
    console.log(`📁 Loaded environment from ${envFile}`)
    break
  }
}

async function runMigrations() {
  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    console.error("ERROR: DATABASE_URL environment variable is not set")
    console.log("Please set DATABASE_URL in your .env.local file")
    process.exit(1)
  }

  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
  })

  await client.connect()
  console.log("🔌 Connected to database")

  const migrations = [
    "seed-tiers.sql",
    "ai-credits-schema.sql",
    "create-user-overrides-table.sql",
  ]

  console.log("")
  console.log("🚀 Starting database migrations...")
  console.log("")

  for (const migration of migrations) {
    const filePath = path.join(__dirname, migration)

    if (!fs.existsSync(filePath)) {
      console.error(`❌ Migration file not found: ${migration}`)
      continue
    }

    console.log(`📦 Running: ${migration}`)

    try {
      const sqlContent = fs.readFileSync(filePath, "utf-8")

      // Execute the entire SQL file as one transaction
      await client.query(sqlContent)

      console.log(`  ✅ Completed: ${migration}`)
    } catch (error: any) {
      console.error(`  ❌ Error in ${migration}: ${error.message}`)
    }

    console.log("")
  }

  // Verify tables were created
  console.log("📊 Verifying tables...")

  const tables = [
    "subscription_tiers",
    "webhook_events",
    "ai_credit_balances",
    "ai_credit_transactions",
    "ai_credit_packs",
    "ai_feature_costs",
    "ai_model_tiers",
    "user_overrides",
    "credit_grants",
  ]

  for (const table of tables) {
    try {
      const result = await client.query(`SELECT COUNT(*) as count FROM ${table}`)
      console.log(`  ✅ ${table}: ${result.rows[0]?.count || 0} rows`)
    } catch (e: any) {
      if (e.message?.includes("does not exist")) {
        console.log(`  ⚠️  ${table}: table not created`)
      } else {
        console.log(`  ❌ ${table}: ${e.message?.slice(0, 50)}`)
      }
    }
  }

  // Show subscription tiers
  console.log("")
  console.log("📋 Subscription Tiers:")
  try {
    const result = await client.query(`SELECT name, display_name, price_monthly FROM subscription_tiers ORDER BY sort_order`)
    for (const tier of result.rows) {
      console.log(`  • ${tier.display_name}: $${tier.price_monthly}/mo`)
    }
  } catch (e) {
    console.log("  Could not fetch tiers")
  }

  // Show credit packs
  console.log("")
  console.log("💰 Credit Packs:")
  try {
    const result = await client.query(`SELECT name, display_name, credits, bonus_credits, price_cents FROM ai_credit_packs ORDER BY sort_order`)
    for (const pack of result.rows) {
      const total = (pack.credits || 0) + (pack.bonus_credits || 0)
      console.log(`  • ${pack.display_name}: ${total} credits ($${(pack.price_cents / 100).toFixed(2)})`)
    }
  } catch (e) {
    console.log("  Could not fetch credit packs")
  }

  await client.end()
  console.log("")
  console.log("✨ Migration complete!")
}

runMigrations().catch(console.error)
