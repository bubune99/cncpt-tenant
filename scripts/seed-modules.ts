#!/usr/bin/env npx tsx
/**
 * Seed CmsModule table with built-in modules.
 *
 * Usage:
 *   npx tsx scripts/seed-modules.ts
 *
 * Safe to run multiple times -- uses upsert so existing modules
 * are updated rather than duplicated.
 */

import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import { BUILT_IN_MODULES } from "../lib/cms/modules/built-in-modules"

async function main() {
  const DATABASE_URL = process.env.DATABASE_URL
  if (!DATABASE_URL) {
    console.error("ERROR: DATABASE_URL environment variable is required")
    process.exit(1)
  }

  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  })

  const adapter = new PrismaPg(pool)
  const prisma = new PrismaClient({ adapter })

  console.log(`Seeding ${BUILT_IN_MODULES.length} built-in modules...\n`)

  for (const mod of BUILT_IN_MODULES) {
    const result = await prisma.cmsModule.upsert({
      where: { slug: mod.slug },
      update: {
        name: mod.name,
        description: mod.description,
        icon: mod.icon,
        version: mod.version,
        manifest: JSON.parse(JSON.stringify(mod.manifest)),
        builtIn: mod.builtIn,
        sortOrder: mod.sortOrder,
        // Don't override enabled -- preserve tenant's choice
      },
      create: {
        slug: mod.slug,
        name: mod.name,
        description: mod.description,
        icon: mod.icon,
        version: mod.version,
        manifest: JSON.parse(JSON.stringify(mod.manifest)),
        enabled: mod.enabled,
        builtIn: mod.builtIn,
        sortOrder: mod.sortOrder,
      },
    })

    console.log(
      `  ${result.enabled ? "[ON] " : "[OFF]"} ${result.slug} (${result.name})`
    )
  }

  console.log("\nDone. Module seed complete.")

  await prisma.$disconnect()
  await pool.end()
}

main().catch((err) => {
  console.error("Seed failed:", err)
  process.exit(1)
})
