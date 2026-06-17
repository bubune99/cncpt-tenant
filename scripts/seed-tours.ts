import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { defaultTours } from '../components/cms/help-system/default-tours'

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: true })
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

async function main() {
  for (const t of defaultTours as any[]) {
    await prisma.helpTour.upsert({
      where: { slug: t.slug },
      update: { title: t.title, description: t.description ?? null, steps: t.steps, isActive: t.isActive ?? true },
      create: { slug: t.slug, title: t.title, description: t.description ?? null, steps: t.steps, isActive: t.isActive ?? true, storeId: null, roles: [] },
    })
    console.log('seeded tour:', t.slug, '-', t.steps.length, 'steps')
  }
  const n = await prisma.helpTour.count()
  console.log('help_tours total rows:', n)
  await pool.end()
}
main().catch((e) => { console.error('SEED ERR', e.message); process.exit(1) })
