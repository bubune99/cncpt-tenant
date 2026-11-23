/**
 * The database names five enum types in snake_case (customer_lifecycle_stage …) while the schema named them in
 * PascalCase with no @@map, so Prisma asked Postgres for a type that does not exist: creating a customer failed on
 * every site with 'type "public.CustomerLifecycleStage" does not exist' (staging, 2026-11-23; production has the same
 * database). Compared all 68 schema enums with the database's 68 enum types: 63 matched, these 5 did not.
 * Run from the repo root: node_modules/.bin/tsx lib/cms/db/enum-map.assert.ts
 */
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const schema = readFileSync("prisma/cms/schema.prisma", "utf8")
const enumBody = (name: string) => schema.match(new RegExp(`\\nenum ${name} \\{([\\s\\S]*?)\\n\\}`))?.[1] ?? ""

const EXPECTED: Record<string, string> = {
  CustomerLifecycleStage: "customer_lifecycle_stage",
  PricingTierType: "pricing_tier_type",
  DistributionChannel: "distribution_channel",
  ChannelPublishStatus: "channel_publish_status",
  LoyaltyActivityType: "loyalty_activity_type",
}

let n = 0
for (const [name, dbName] of Object.entries(EXPECTED)) {
  const body = enumBody(name)
  assert.ok(body, `enum ${name} is in the schema`)
  assert.match(body, new RegExp(`@@map\\("${dbName}"\\)`), `enum ${name} maps to the database type ${dbName}`)
  n++
  console.log(`ok ${n} - ${name} -> ${dbName}`)
}
console.log(`${n} checks passed`)
