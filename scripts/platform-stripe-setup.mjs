#!/usr/bin/env node
/**
 * Platform Stripe setup — creates Products + monthly Prices for the active
 * subscription tiers and writes the resulting ids back to subscription_tiers.
 *
 * ⚠️  GATED ON OWNER CONFIRMATION. This is NOT run automatically. It creates
 *     LIVE/TEST Stripe objects on whatever account STRIPE_SECRET_KEY points to.
 *     Run it only once the platform Stripe account is confirmed.
 *
 * Safety:
 * - Skips any tier that already has a stripe_product_id (won't duplicate /
 *   overwrite the existing `pro` tier's product/price).
 * - Dry-run by default. Pass --apply to actually create objects.
 *
 * Usage:
 *   node scripts/platform-stripe-setup.mjs            # dry run (prints plan)
 *   node scripts/platform-stripe-setup.mjs --apply    # create + persist ids
 *
 * Requires: STRIPE_SECRET_KEY, DATABASE_URL in env (.env loaded automatically).
 */

import "dotenv/config"
import Stripe from "stripe"
import { neon } from "@neondatabase/serverless"

const APPLY = process.argv.includes("--apply")

async function main() {
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error("Missing STRIPE_SECRET_KEY — platform Stripe account not configured.")
    process.exit(1)
  }
  if (!process.env.DATABASE_URL) {
    console.error("Missing DATABASE_URL.")
    process.exit(1)
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2025-02-24.acacia" })
  const sql = neon(process.env.DATABASE_URL)

  const tiers = await sql`
    SELECT id, name, display_name, price_monthly, currency, stripe_product_id, stripe_price_id_monthly
    FROM subscription_tiers
    WHERE is_active = true AND price_monthly > 0
    ORDER BY sort_order
  `

  console.log(`Mode: ${APPLY ? "APPLY (will create Stripe objects)" : "DRY RUN"}`)
  console.log(`Active paid tiers: ${tiers.length}\n`)

  for (const t of tiers) {
    const price = Number(t.price_monthly)
    if (t.stripe_product_id && t.stripe_price_id_monthly) {
      console.log(`SKIP  ${t.name} — already has product=${t.stripe_product_id} price=${t.stripe_price_id_monthly}`)
      continue
    }

    console.log(`PLAN  ${t.name} (${t.display_name}) $${price}/mo`)
    if (!APPLY) continue

    const product = t.stripe_product_id
      ? await stripe.products.retrieve(t.stripe_product_id)
      : await stripe.products.create({
          name: `CNCPT ${t.display_name}`,
          metadata: { tier: t.name },
        })

    const priceObj = await stripe.prices.create({
      product: product.id,
      unit_amount: Math.round(price * 100),
      currency: (t.currency || "USD").toLowerCase(),
      recurring: { interval: "month" },
      metadata: { tier: t.name },
    })

    await sql`
      UPDATE subscription_tiers
      SET stripe_product_id = ${product.id},
          stripe_price_id_monthly = ${priceObj.id},
          updated_at = NOW()
      WHERE id = ${t.id}
    `
    console.log(`  CREATED product=${product.id} price=${priceObj.id} → persisted`)
  }

  console.log("\nDone.")
  if (!APPLY) console.log("Re-run with --apply to create the objects above.")
}

main().catch((e) => {
  console.error("ERROR:", e.message)
  process.exit(1)
})
