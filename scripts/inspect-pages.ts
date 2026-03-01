import { readFileSync } from 'fs'
import { resolve } from 'path'

// Load .env
try {
  const envFile = readFileSync(resolve(process.cwd(), '.env'), 'utf-8')
  for (const line of envFile.split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const eq = t.indexOf('=')
    if (eq === -1) continue
    const k = t.slice(0, eq).trim()
    const v = t.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
    if (!process.env[k]) process.env[k] = v
  }
} catch {}

async function main() {
  const { prisma, runWithTenant } = await import('@/lib/cms/db')
  const pages = await runWithTenant(9, () => prisma.page.findMany({
    select: { id: true, title: true, slug: true, status: true, content: true, headerMode: true, footerMode: true },
    take: 3,
  }))

  for (const p of pages) {
    console.log('--- Page:', p.title, '---')
    console.log('Slug:', JSON.stringify(p.slug))
    console.log('Status:', p.status)
    console.log('headerMode:', p.headerMode)
    console.log('footerMode:', p.footerMode)
    const c = p.content as any
    if (c) {
      console.log('Content keys:', Object.keys(c).sort().join(', '))
      console.log('version:', c.version)
      console.log('has blocks:', Array.isArray(c.blocks))
      console.log('blocks count:', c.blocks?.length)
      console.log('layout:', JSON.stringify(c.layout))
      if (c.blocks?.length > 0) {
        const b = c.blocks[0]
        console.log('First block keys:', Object.keys(b).sort().join(', '))
        console.log('First block:', JSON.stringify(b, null, 2).substring(0, 500))
      }
    } else {
      console.log('Content: null')
    }
    console.log()
  }

  // Also dump full content of one page
  if (pages.length > 0) {
    console.log('=== FULL CONTENT OF FIRST PAGE ===')
    console.log(JSON.stringify(pages[0].content, null, 2)?.substring(0, 2000))
  }

  await (prisma as any).$disconnect?.()
  setTimeout(() => process.exit(0), 100)
}
main().catch(console.error)
