// Make subscription_tiers match the public Pricing page (owner, inbox 66a569a3 and ffc4cbbc).
// Dry run by default; pass --apply to write. Prices: app/(public)/pricing/page.tsx.
// Run from a folder whose .env holds DATABASE_URL: node scripts/tiers-match-pricing.mjs [--apply]
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL)
const apply = process.argv.includes("--apply")

const AI = (n) => ({ ai_credits_monthly: n, ai_credits_rollover_cap: n * 2 })
const PLANS = [
  { name: "starter", display: "Starter", desc: "Perfect for small sites and blogs", m: 25, y: 250, sort: 1, trial: 7,
    limits: { subdomains: 3, team_members: 2, storage_gb: 1, custom_domains: 1, pages: -1, posts: -1, ...AI(300) } },
  { name: "growth", display: "Growth", desc: "For growing sites and small teams", m: 49, y: 490, sort: 2, trial: 14,
    limits: { subdomains: 10, team_members: 3, storage_gb: 5, custom_domains: 10, pages: -1, posts: -1, ...AI(1500) } },
  { name: "pro", display: "Pro", desc: "For professionals and agencies", m: 99, y: 990, sort: 3, trial: 14,
    limits: { subdomains: 25, team_members: 6, storage_gb: 30, custom_domains: 25, pages: -1, posts: -1, ...AI(7500) } },
  { name: "business", display: "Business", desc: "For high-traffic sites and enterprises", m: 349, y: 3490, sort: 4, trial: 14,
    limits: { subdomains: -1, team_members: 25, storage_gb: 300, custom_domains: -1, pages: -1, posts: -1, ai_features: "*", ...AI(75000) } },
]
const RETIRE = ["free", "enterprise", "professional"]

const before = await sql`SELECT name, price_monthly, is_active, limits FROM subscription_tiers ORDER BY sort_order`
console.log("before:", before.map((r) => `${r.name} $${r.price_monthly} ${r.is_active ? "on" : "off"} sites=${r.limits?.subdomains}`).join(" | "))

for (const p of PLANS) {
  const [old] = await sql`SELECT limits FROM subscription_tiers WHERE name = ${p.name}`
  // keep the AI feature list a plan already has, unless this plan sets one
  const limits = { ai_features: old?.limits?.ai_features ?? ["chat", "content_rewrite", "content_summarize", "seo_meta"], ...p.limits }
  console.log(`${old ? "update" : "insert"} ${p.name}: $${p.m}/mo $${p.y}/yr, sites ${p.limits.subdomains}, seats ${p.limits.team_members}`)
  if (!apply) continue
  if (old) {
    await sql`UPDATE subscription_tiers SET display_name=${p.display}, description=${p.desc}, price_monthly=${p.m}, price_yearly=${p.y},
      limits=${JSON.stringify(limits)}::jsonb, trial_days=${p.trial}, sort_order=${p.sort}, is_active=true, updated_at=now() WHERE name=${p.name}`
  } else {
    await sql`INSERT INTO subscription_tiers (name, display_name, description, price_monthly, price_yearly, currency, features, limits, trial_days, sort_order, is_active)
      VALUES (${p.name}, ${p.display}, ${p.desc}, ${p.m}, ${p.y}, 'usd', '[]'::jsonb, ${JSON.stringify(limits)}::jsonb, ${p.trial}, ${p.sort}, true)`
  }
}
console.log(`retire (is_active=false): ${RETIRE.join(", ")}`)
if (apply) await sql`UPDATE subscription_tiers SET is_active=false, updated_at=now() WHERE name = ANY(${RETIRE})`
console.log(apply ? "applied" : "dry run: nothing written (pass --apply)")
