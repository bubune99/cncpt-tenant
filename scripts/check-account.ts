/**
 * Check account data - subdomains, settings, admins
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
        const idx = trimmed.indexOf("=")
        if (idx > 0) {
          const key = trimmed.slice(0, idx)
          const value = trimmed.slice(idx + 1).replace(/^["']|["']$/g, "")
          if (!process.env[key]) process.env[key] = value
        }
      }
    }
    break
  }
}

async function run() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  })

  await client.connect()
  console.log("Connected to database\n")

  // Get all subdomains
  console.log("=== All Subdomains ===")
  const subdomains = await client.query(`
    SELECT id, subdomain, user_id, site_name, contact_email, created_at, onboarding_completed
    FROM subdomains
    ORDER BY created_at DESC
    LIMIT 20
  `)

  if (subdomains.rows.length === 0) {
    console.log("No subdomains found")
  } else {
    for (const row of subdomains.rows) {
      console.log(`  ${row.id}: ${row.subdomain}`)
      console.log(`     User: ${row.user_id}`)
      console.log(`     Site: ${row.site_name || "(no name)"}`)
      console.log(`     Email: ${row.contact_email || "(no email)"}`)
      console.log(`     Created: ${row.created_at}`)
      console.log(`     Onboarding: ${row.onboarding_completed}`)
      console.log("")
    }
  }

  // Get tenant settings
  console.log("\n=== Tenant Settings ===")
  const settings = await client.query(`
    SELECT id, subdomain, site_name, contact_email, created_at
    FROM tenant_settings
    ORDER BY created_at DESC
    LIMIT 10
  `)

  if (settings.rows.length === 0) {
    console.log("No tenant settings found")
  } else {
    for (const row of settings.rows) {
      console.log(`  ${row.subdomain}: ${row.site_name || "(no name)"}`)
    }
  }

  // Check super admins
  console.log("\n=== Super Admins ===")
  const admins = await client.query(`
    SELECT user_id, user_email, granted_at
    FROM super_admins
    WHERE revoked_at IS NULL
    LIMIT 10
  `)

  if (admins.rows.length === 0) {
    console.log("No super admins found")
  } else {
    for (const row of admins.rows) {
      console.log(`  ${row.user_email} (${row.user_id})`)
    }
  }

  // Check user overrides
  console.log("\n=== User Overrides ===")
  const overrides = await client.query(`
    SELECT user_id, user_email, unlimited_subdomains, unlimited_ai_credits, bypass_payment
    FROM user_overrides
    WHERE revoked_at IS NULL
    LIMIT 10
  `)

  if (overrides.rows.length === 0) {
    console.log("No active overrides found")
  } else {
    for (const row of overrides.rows) {
      console.log(`  ${row.user_email || row.user_id}:`)
      console.log(`     Unlimited subdomains: ${row.unlimited_subdomains}`)
      console.log(`     Unlimited AI credits: ${row.unlimited_ai_credits}`)
      console.log(`     Bypass payment: ${row.bypass_payment}`)
    }
  }

  await client.end()
}

run().catch(console.error)
