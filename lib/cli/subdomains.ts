/**
 * CLI Subdomains Domain — CRUD, auth config, sharing, stats
 */

import {
  heading, table, success, error, warn, info, label, dim,
  confirm, ask, findUserByEmail, requireUser,
  formatDate, truncate, c, sym,
  type ParsedArgs,
} from './utils'

export async function handleSubdomains(action: string, args: ParsedArgs) {
  const { prisma } = await import('@/lib/cms/db')
  const { sql } = await import('@/lib/neon')

  switch (action) {
    case 'list': {
      const ownerEmail = args.flags.owner as string | undefined
      let ownerFilter: string | undefined
      if (ownerEmail) {
        const owner = await findUserByEmail(ownerEmail)
        if (!owner) { error(`Owner not found: ${ownerEmail}`); return }
        ownerFilter = owner.id
      }

      const subs = await prisma.subdomain.findMany({
        where: ownerFilter ? { userId: ownerFilter } : undefined,
        orderBy: { createdAt: 'desc' },
      })

      // Get owner emails
      const { runAsSuperAdmin } = await import('@/lib/cms/db')
      const ownerIds = [...new Set(subs.map(s => s.userId).filter(Boolean))] as string[]
      const owners = ownerIds.length > 0
        ? await runAsSuperAdmin(() =>
            prisma.user.findMany({
              where: { id: { in: ownerIds } },
              select: { id: true, email: true },
            })
          )
        : []
      const ownerMap = new Map(owners.map(o => [o.id, o.email]))

      heading('Subdomains')
      table(
        ['Subdomain', 'Owner', 'Maintenance', 'Created'],
        subs.map(s => [
          s.subdomain,
          s.userId ? truncate(ownerMap.get(s.userId) || s.userId, 25) : dim('unassigned'),
          s.maintenanceMode ? `${c.yellow}ON${c.reset}` : dim('off'),
          formatDate(s.createdAt),
        ])
      )
      break
    }

    case 'get': {
      const name = args.positional[0]
      if (!name) { error('Usage: tenant subdomains get <subdomain>'); return }

      const sub = await prisma.subdomain.findUnique({ where: { subdomain: name } })
      if (!sub) { error(`Subdomain not found: ${name}`); return }

      heading(`Subdomain: ${sub.subdomain}`)
      label('ID', sub.id)
      label('Subdomain', sub.subdomain)
      label('Maintenance', sub.maintenanceMode ? 'ON' : 'off')
      if (sub.maintenanceMessage) label('Maint. Message', sub.maintenanceMessage)
      label('Created', formatDate(sub.createdAt))

      // Owner
      if (sub.userId) {
        const { runAsSuperAdmin } = await import('@/lib/cms/db')
        const owner = await runAsSuperAdmin(() =>
          prisma.user.findUnique({
            where: { id: sub.userId! },
            select: { email: true, name: true },
          })
        )
        if (owner) label('Owner', `${owner.email} ${owner.name ? dim(`(${owner.name})`) : ''}`)
      } else {
        label('Owner', null)
      }

      // Teams with access
      const teamSubs = await sql`
        SELECT ts.access_level, ts.added_at, t.name, t.slug
        FROM team_subdomains ts
        JOIN teams t ON t.id = ts.team_id AND t.deleted_at IS NULL
        WHERE ts.subdomain = ${name}
        ORDER BY t.name
      `
      if (teamSubs.length > 0) {
        console.log(`\n  ${c.bold}Teams with Access:${c.reset}`)
        for (const ts of teamSubs) {
          console.log(`    ${sym.bullet} ${ts.name} ${dim(`(${ts.slug})`)} — ${ts.access_level}`)
        }
      }

      // Auth config
      try {
        const authRows = await sql`
          SELECT * FROM subdomain_auth_config WHERE subdomain = ${name}
        `
        if (authRows.length > 0) {
          const auth = authRows[0]
          console.log(`\n  ${c.bold}Auth Config:${c.reset}`)
          label('Stack Auth Project', auth.stack_auth_project_id)
          label('Publishable Key', auth.stack_auth_publishable_key ? dim('set') : null)
          label('Secret Key', auth.stack_auth_secret_key ? dim('set') : null)
          label('Social Auth', auth.enable_social_auth ? 'enabled' : 'disabled')
          label('Magic Link', auth.enable_magic_link ? 'enabled' : 'disabled')
          label('Password Auth', auth.enable_password_auth ? 'enabled' : 'disabled')
          if (auth.branding_name) label('Branding Name', auth.branding_name)
          if (auth.branding_primary_color) label('Branding Color', auth.branding_primary_color)
        }
      } catch {
        // subdomain_auth_config table may not exist yet
      }

      console.log()
      break
    }

    case 'create': {
      const name = args.positional[0]
      if (!name) { error('Usage: tenant subdomains create <name> --owner <email>'); return }
      const ownerEmail = args.flags.owner as string
      if (!ownerEmail) { error('--owner <email> is required'); return }

      // Validate name
      if (!/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/.test(name)) {
        error('Invalid subdomain name. Use lowercase letters, numbers, hyphens. 3-63 chars.')
        return
      }

      const reserved = ['www', 'api', 'admin', 'app', 'mail', 'ftp', 'localhost', 'staging', 'production']
      if (reserved.includes(name)) { error(`Reserved subdomain: ${name}`); return }

      const existing = await prisma.subdomain.findUnique({ where: { subdomain: name } })
      if (existing) { error(`Subdomain already exists: ${name}`); return }

      const owner = await requireUser(ownerEmail)

      await prisma.subdomain.create({
        data: {
          subdomain: name,
          userId: owner.id,
        },
      })

      success(`Created subdomain: ${name}`)
      label('Owner', ownerEmail)
      break
    }

    case 'delete': {
      const name = args.positional[0]
      if (!name) { error('Usage: tenant subdomains delete <subdomain>'); return }

      const sub = await prisma.subdomain.findUnique({ where: { subdomain: name } })
      if (!sub) { error(`Subdomain not found: ${name}`); return }

      warn(`This will delete subdomain "${name}" and all tenant-scoped data:`)
      console.log(`    ${sym.bullet} Pages, products, orders, customers`)
      console.log(`    ${sym.bullet} Media, blog posts, settings`)
      console.log(`    ${sym.bullet} Team sharing associations`)
      console.log(`    ${sym.bullet} Auth configuration`)

      const yes = await confirm('Delete this subdomain?')
      if (!yes) { info('Cancelled'); return }

      // Clean up related data
      await sql`DELETE FROM team_subdomains WHERE subdomain = ${name}`
      await sql`DELETE FROM subdomain_auth_config WHERE subdomain = ${name}`
      await prisma.subdomain.delete({ where: { subdomain: name } })

      success(`Deleted subdomain: ${name}`)
      break
    }

    case 'assign': {
      const name = args.positional[0]
      const email = args.positional[1]
      if (!name || !email) { error('Usage: tenant subdomains assign <subdomain> <email>'); return }

      const sub = await prisma.subdomain.findUnique({ where: { subdomain: name } })
      if (!sub) { error(`Subdomain not found: ${name}`); return }

      const user = await requireUser(email)

      await prisma.subdomain.update({
        where: { subdomain: name },
        data: { userId: user.id },
      })

      success(`Transferred ${name} to ${email}`)
      break
    }

    case 'maintenance': {
      const name = args.positional[0]
      const mode = args.positional[1]
      if (!name || !mode) { error('Usage: tenant subdomains maintenance <subdomain> on|off [--msg "..."]'); return }

      const sub = await prisma.subdomain.findUnique({ where: { subdomain: name } })
      if (!sub) { error(`Subdomain not found: ${name}`); return }

      const enabled = mode === 'on'
      const message = args.flags.msg as string || null

      await prisma.subdomain.update({
        where: { subdomain: name },
        data: {
          maintenanceMode: enabled,
          ...(message !== null ? { maintenanceMessage: message } : {}),
        },
      })

      if (enabled) {
        success(`Maintenance mode enabled for ${name}`)
        if (message) label('Message', message)
      } else {
        success(`Maintenance mode disabled for ${name}`)
      }
      break
    }

    case 'auth': {
      const name = args.positional[0]
      if (!name) { error('Usage: tenant subdomains auth <subdomain>'); return }

      const sub = await prisma.subdomain.findUnique({ where: { subdomain: name } })
      if (!sub) { error(`Subdomain not found: ${name}`); return }

      // Check for write flags
      const hasWriteFlags = args.flags['set-project'] || args.flags['set-key'] || args.flags['set-secret'] ||
        args.flags['enable-social'] || args.flags['enable-magic-link'] || args.flags['enable-password'] ||
        args.flags['disable-social'] || args.flags['disable-magic-link'] || args.flags['disable-password']

      if (hasWriteFlags) {
        // Build upsert data
        const updates: Record<string, any> = {}
        if (args.flags['set-project']) updates.stack_auth_project_id = args.flags['set-project']
        if (args.flags['set-key']) updates.stack_auth_publishable_key = args.flags['set-key']
        if (args.flags['set-secret']) updates.stack_auth_secret_key = args.flags['set-secret']
        if (args.flags['enable-social']) updates.enable_social_auth = true
        if (args.flags['disable-social']) updates.enable_social_auth = false
        if (args.flags['enable-magic-link']) updates.enable_magic_link = true
        if (args.flags['disable-magic-link']) updates.enable_magic_link = false
        if (args.flags['enable-password']) updates.enable_password_auth = true
        if (args.flags['disable-password']) updates.enable_password_auth = false

        // Check if exists
        const existing = await sql`SELECT id FROM subdomain_auth_config WHERE subdomain = ${name}`

        if (existing.length > 0) {
          // Build SET clause
          const setClauses: string[] = []
          const values: any[] = []
          for (const [k, v] of Object.entries(updates)) {
            setClauses.push(`${k} = $${values.length + 2}`)
            values.push(v)
          }
          setClauses.push('updated_at = NOW()')

          await sql(`UPDATE subdomain_auth_config SET ${setClauses.join(', ')} WHERE subdomain = $1`, [name, ...values])
        } else {
          // Need at minimum project + key for new config
          if (!updates.stack_auth_project_id || !updates.stack_auth_publishable_key) {
            error('New auth config requires --set-project and --set-key')
            return
          }

          await sql`
            INSERT INTO subdomain_auth_config (subdomain, stack_auth_project_id, stack_auth_publishable_key, stack_auth_secret_key,
              enable_social_auth, enable_magic_link, enable_password_auth)
            VALUES (${name}, ${updates.stack_auth_project_id || ''}, ${updates.stack_auth_publishable_key || ''},
              ${updates.stack_auth_secret_key || null},
              ${updates.enable_social_auth ?? true}, ${updates.enable_magic_link ?? true}, ${updates.enable_password_auth ?? true})
          `
        }

        success(`Updated auth config for ${name}`)
        for (const [k, v] of Object.entries(updates)) {
          if (k.includes('secret') || k.includes('key')) label(k, dim('set'))
          else label(k, v)
        }
      } else {
        // Read mode
        const authRows = await sql`SELECT * FROM subdomain_auth_config WHERE subdomain = ${name}`

        heading(`Auth Config: ${name}`)
        if (authRows.length === 0) {
          info('No auth config found for this subdomain')
          info('Set one: tenant subdomains auth <name> --set-project <id> --set-key <key>')
          return
        }

        const auth = authRows[0]
        label('Stack Auth Project ID', auth.stack_auth_project_id)
        label('Publishable Key', auth.stack_auth_publishable_key ? truncate(auth.stack_auth_publishable_key, 30) : null)
        label('Secret Key', auth.stack_auth_secret_key ? dim('set (hidden)') : dim('not set'))
        label('Base URL', auth.stack_auth_base_url)
        label('Social Auth', auth.enable_social_auth ? 'enabled' : 'disabled')
        label('Magic Link', auth.enable_magic_link ? 'enabled' : 'disabled')
        label('Password Auth', auth.enable_password_auth ? 'enabled' : 'disabled')
        label('Branding Name', auth.branding_name)
        label('Branding Color', auth.branding_primary_color)
        label('Branding Logo', auth.branding_logo_url)
        label('Updated', formatDate(auth.updated_at))
        console.log()
      }
      break
    }

    case 'share': {
      const name = args.positional[0]
      const teamSlug = args.positional[1]
      if (!name || !teamSlug) { error('Usage: tenant subdomains share <subdomain> <team-slug> [--level edit]'); return }

      const sub = await prisma.subdomain.findUnique({ where: { subdomain: name } })
      if (!sub) { error(`Subdomain not found: ${name}`); return }

      const team = await prisma.team.findFirst({ where: { slug: teamSlug, deletedAt: null } })
      if (!team) { error(`Team not found: ${teamSlug}`); return }

      const level = (args.flags.level as string) || 'edit'

      try {
        await prisma.teamSubdomain.create({
          data: {
            teamId: team.id,
            subdomain: name,
            accessLevel: level,
          },
        })
        success(`Shared ${name} with team ${teamSlug} (${level})`)
      } catch (e: any) {
        if (e.code === 'P2002') warn('Subdomain already shared with this team')
        else throw e
      }
      break
    }

    case 'unshare': {
      const name = args.positional[0]
      const teamSlug = args.positional[1]
      if (!name || !teamSlug) { error('Usage: tenant subdomains unshare <subdomain> <team-slug>'); return }

      const team = await prisma.team.findFirst({ where: { slug: teamSlug, deletedAt: null } })
      if (!team) { error(`Team not found: ${teamSlug}`); return }

      const ts = await prisma.teamSubdomain.findUnique({
        where: { teamId_subdomain: { teamId: team.id, subdomain: name } },
      })
      if (!ts) { error(`Subdomain ${name} is not shared with team ${teamSlug}`); return }

      await prisma.teamSubdomain.delete({
        where: { teamId_subdomain: { teamId: team.id, subdomain: name } },
      })

      success(`Removed ${name} from team ${teamSlug}`)
      break
    }

    case 'stats': {
      const name = args.positional[0]
      if (!name) { error('Usage: tenant subdomains stats <subdomain>'); return }

      const sub = await prisma.subdomain.findUnique({ where: { subdomain: name } })
      if (!sub) { error(`Subdomain not found: ${name}`); return }

      const { runWithTenant } = await import('@/lib/cms/db')
      const tenantId = sub.id

      const [pages, products, orders, customers, media, blogPosts] = await runWithTenant(tenantId, () =>
        Promise.all([
          prisma.page.count(),
          prisma.product.count(),
          prisma.order.count(),
          prisma.customer.count(),
          prisma.media.count(),
          prisma.blogPost.count(),
        ])
      )

      heading(`Stats: ${name}`)
      label('Pages', pages)
      label('Products', products)
      label('Orders', orders)
      label('Customers', customers)
      label('Media', media)
      label('Blog Posts', blogPosts)
      console.log()
      break
    }

    case 'seed-pages': {
      const name = args.positional[0]
      if (!name) { error('Usage: tenant subdomains seed-pages <subdomain> [--status PUBLISHED]'); return }

      const sub = await prisma.subdomain.findUnique({ where: { subdomain: name } })
      if (!sub) { error(`Subdomain not found: ${name}`); return }

      const status = ((args.flags.status as string) || 'PUBLISHED').toUpperCase()
      const publishedAt = status === 'PUBLISHED' ? new Date() : null
      const { runWithTenant } = await import('@/lib/cms/db')
      const tenantId = sub.id

      info(`Seeding pages into ${name} (tenant ${tenantId})...`)

      const templatePages = getSeedPages()

      let created = 0
      let updated = 0

      await runWithTenant(tenantId, async () => {
        for (const page of templatePages) {
          const existing = await prisma.page.findFirst({
            where: { OR: [{ slug: page.slug }, { slug: page.slug.replace(/^\//, '') }] },
          })

          if (existing) {
            await prisma.page.update({
              where: { id: existing.id },
              data: {
                title: page.title,
                slug: page.slug,
                content: page.content,
                status: status as any,
                publishedAt,
              },
            })
            updated++
          } else {
            await prisma.page.create({
              data: {
                title: page.title,
                slug: page.slug,
                content: page.content,
                status: status as any,
                publishedAt,
              },
            })
            created++
          }

          console.log(`  ${c.green}${sym.check}${c.reset} ${page.title} ${dim(`(${page.slug})`)}`)
        }
      })

      console.log()
      success(`Seeded ${created + updated} pages (${created} created, ${updated} updated)`)
      info(`View: pnpm tenant subdomains stats ${name}`)
      break
    }

    case 'verify': {
      const name = args.positional[0]
      if (!name) { error('Usage: tenant subdomains verify <subdomain> [--base-url <url>]'); return }

      const sub = await prisma.subdomain.findUnique({ where: { subdomain: name } })
      if (!sub) { error(`Subdomain not found: ${name}`); return }

      const apiKey = process.env.FIRECRAWL_API_KEY
      if (!apiKey) {
        error('FIRECRAWL_API_KEY not set in .env')
        info('Get a key at https://firecrawl.dev')
        return
      }

      // Determine base URL
      const appUrl = (args.flags['base-url'] as string)
        || process.env.NEXT_PUBLIC_APP_URL
        || `https://${name}.localhost:3000`

      // Get seeded pages for this subdomain
      const { runWithTenant } = await import('@/lib/cms/db')
      const pages = await runWithTenant(sub.id, () =>
        prisma.page.findMany({
          where: { status: 'PUBLISHED' },
          select: { title: true, slug: true },
          orderBy: { slug: 'asc' },
        })
      )

      if (pages.length === 0) {
        warn(`No published pages found for ${name}`)
        info(`Seed pages first: pnpm tenant subdomains seed-pages ${name}`)
        return
      }

      heading(`Firecrawl Verification: ${name}`)
      info(`Base URL: ${appUrl}`)
      info(`Pages to verify: ${pages.length}\n`)

      let passed = 0
      let failed = 0

      for (const page of pages) {
        const cleanSlug = page.slug.replace(/^\//, '')
        const pageUrl = cleanSlug === 'home'
          ? appUrl
          : `${appUrl}/${cleanSlug}`

        process.stdout.write(`  ${dim('Scraping')} ${page.title} ${dim(`(${pageUrl})`)} ... `)

        try {
          const resp = await fetch('https://api.firecrawl.dev/v1/scrape', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              url: pageUrl,
              formats: ['markdown'],
              waitFor: 3000,
            }),
          })

          const data = await resp.json() as any

          if (data.success && data.data) {
            const md = data.data.markdown || ''
            const title = data.data.metadata?.title || ''
            const statusCode = data.data.metadata?.statusCode || resp.status

            if (statusCode === 200 && md.length > 50) {
              console.log(`${c.green}${sym.check} OK${c.reset} ${dim(`(${md.length} chars, status ${statusCode})`)}`)
              passed++
            } else if (statusCode === 200) {
              console.log(`${c.yellow}${sym.warning}  THIN${c.reset} ${dim(`(${md.length} chars — page may be empty)`)}`)
              passed++
            } else {
              console.log(`${c.red}${sym.cross} FAIL${c.reset} ${dim(`(status ${statusCode})`)}`)
              failed++
            }
          } else {
            const errMsg = data.error || 'Unknown error'
            console.log(`${c.red}${sym.cross} ERROR${c.reset} ${dim(errMsg)}`)
            failed++
          }
        } catch (err: any) {
          console.log(`${c.red}${sym.cross} ERROR${c.reset} ${dim(err.message)}`)
          failed++
        }
      }

      console.log()
      if (failed === 0) {
        success(`All ${passed} pages verified successfully`)
      } else {
        warn(`${passed} passed, ${failed} failed out of ${pages.length} pages`)
      }
      break
    }

    default:
      error(`Unknown action: ${action}`)
      info('Run: pnpm tenant help subdomains')
  }
}

// --- Seed page templates ---

function bid(): string {
  return Math.random().toString(36).slice(2, 10)
}

function getSeedPages(): Array<{ title: string; slug: string; content: any }> {
  return [
    {
      title: 'Home',
      slug: '/home',
      content: {
        version: '2.0',
        blocks: [
          {
            id: bid(), tag: 'section',
            className: 'min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white px-6',
            children: [
              {
                id: bid(), tag: 'h1',
                className: 'text-5xl md:text-7xl font-bold tracking-tight text-center',
                textContent: 'Welcome to Our Platform',
              },
              {
                id: bid(), tag: 'p',
                className: 'mt-6 text-lg md:text-xl text-slate-300 max-w-2xl text-center',
                textContent: 'Build stunning websites with our modern visual editor. No coding required.',
              },
              {
                id: bid(), tag: 'div',
                className: 'mt-10 flex gap-4',
                children: [
                  {
                    id: bid(), tag: 'a',
                    className: 'px-8 py-3 bg-white text-slate-900 font-semibold rounded-lg hover:bg-slate-100 transition-colors',
                    textContent: 'Get Started',
                    attrs: { href: '/signup' },
                  },
                  {
                    id: bid(), tag: 'a',
                    className: 'px-8 py-3 border border-slate-500 text-white font-semibold rounded-lg hover:bg-white/10 transition-colors',
                    textContent: 'Learn More',
                    attrs: { href: '/about' },
                  },
                ],
              },
            ],
          },
          {
            id: bid(), tag: 'section',
            className: 'py-24 px-6 bg-white',
            children: [
              {
                id: bid(), tag: 'div',
                className: 'max-w-6xl mx-auto text-center',
                children: [
                  {
                    id: bid(), tag: 'h2',
                    className: 'text-3xl md:text-4xl font-bold text-slate-900',
                    textContent: 'Everything You Need',
                  },
                  {
                    id: bid(), tag: 'p',
                    className: 'mt-4 text-lg text-slate-600 max-w-2xl mx-auto',
                    textContent: 'A complete platform for building, managing, and scaling your online presence.',
                  },
                  {
                    id: bid(), tag: 'div',
                    className: 'mt-16 grid grid-cols-1 md:grid-cols-3 gap-8',
                    children: [
                      featureCard('Visual Editor', 'Drag and drop blocks to build beautiful pages without writing a single line of code.'),
                      featureCard('E-Commerce', 'Sell products online with built-in payment processing, inventory, and order management.'),
                      featureCard('Analytics', 'Track your visitors, conversions, and revenue with real-time analytics dashboards.'),
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    },
    {
      title: 'About',
      slug: '/about',
      content: {
        version: '2.0',
        blocks: [
          {
            id: bid(), tag: 'section',
            className: 'py-24 px-6 bg-white',
            children: [
              {
                id: bid(), tag: 'div',
                className: 'max-w-4xl mx-auto',
                children: [
                  {
                    id: bid(), tag: 'h1',
                    className: 'text-4xl md:text-5xl font-bold text-slate-900',
                    textContent: 'About Us',
                  },
                  {
                    id: bid(), tag: 'p',
                    className: 'mt-6 text-lg text-slate-600 leading-relaxed',
                    textContent: 'We are building the next generation of website creation tools. Our mission is to empower everyone to create professional websites without technical barriers.',
                  },
                  {
                    id: bid(), tag: 'p',
                    className: 'mt-4 text-lg text-slate-600 leading-relaxed',
                    textContent: 'Founded with the belief that great design should be accessible to all, our platform combines powerful visual editing with enterprise-grade infrastructure.',
                  },
                ],
              },
            ],
          },
          {
            id: bid(), tag: 'section',
            className: 'py-24 px-6 bg-slate-50',
            children: [
              {
                id: bid(), tag: 'div',
                className: 'max-w-6xl mx-auto',
                children: [
                  {
                    id: bid(), tag: 'h2',
                    className: 'text-3xl font-bold text-slate-900 text-center',
                    textContent: 'Our Values',
                  },
                  {
                    id: bid(), tag: 'div',
                    className: 'mt-12 grid grid-cols-1 md:grid-cols-2 gap-8',
                    children: [
                      valueCard('Simplicity', 'We believe powerful tools should be easy to use. Every feature is designed with clarity in mind.'),
                      valueCard('Quality', 'We hold ourselves to the highest standards. Every pixel, every interaction, every line of code matters.'),
                      valueCard('Innovation', 'We push boundaries to create tools that were not possible before. The future of web creation starts here.'),
                      valueCard('Community', 'We build for and with our users. Your feedback shapes our roadmap and drives our decisions.'),
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    },
    {
      title: 'Contact',
      slug: '/contact',
      content: {
        version: '2.0',
        blocks: [
          {
            id: bid(), tag: 'section',
            className: 'py-24 px-6 bg-white',
            children: [
              {
                id: bid(), tag: 'div',
                className: 'max-w-2xl mx-auto',
                children: [
                  {
                    id: bid(), tag: 'h1',
                    className: 'text-4xl md:text-5xl font-bold text-slate-900 text-center',
                    textContent: 'Contact Us',
                  },
                  {
                    id: bid(), tag: 'p',
                    className: 'mt-4 text-lg text-slate-600 text-center',
                    textContent: 'Have a question or want to get in touch? We would love to hear from you.',
                  },
                  {
                    id: bid(), tag: 'form',
                    className: 'mt-12 space-y-6',
                    children: [
                      formField('Name', 'text', 'Your full name'),
                      formField('Email', 'email', 'your@email.com'),
                      {
                        id: bid(), tag: 'div',
                        className: 'flex flex-col',
                        children: [
                          { id: bid(), tag: 'label', className: 'text-sm font-medium text-slate-700 mb-2', textContent: 'Message' },
                          {
                            id: bid(), tag: 'textarea',
                            className: 'px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent min-h-[120px]',
                            attrs: { placeholder: 'How can we help?', name: 'message' },
                          },
                        ],
                      },
                      {
                        id: bid(), tag: 'button',
                        className: 'w-full px-8 py-3 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 transition-colors',
                        textContent: 'Send Message',
                        attrs: { type: 'submit' },
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    },
    {
      title: 'Pricing',
      slug: '/pricing',
      content: {
        version: '2.0',
        blocks: [
          {
            id: bid(), tag: 'section',
            className: 'py-24 px-6 bg-white',
            children: [
              {
                id: bid(), tag: 'div',
                className: 'max-w-6xl mx-auto text-center',
                children: [
                  { id: bid(), tag: 'h1', className: 'text-4xl md:text-5xl font-bold text-slate-900', textContent: 'Simple, Transparent Pricing' },
                  { id: bid(), tag: 'p', className: 'mt-4 text-lg text-slate-600', textContent: 'Choose the plan that fits your needs. Upgrade or downgrade at any time.' },
                  {
                    id: bid(), tag: 'div',
                    className: 'mt-16 grid grid-cols-1 md:grid-cols-3 gap-8',
                    children: [
                      pricingCard('Starter', '$29', '/month', ['5 pages', '1 subdomain', 'Basic analytics', 'Email support'], false),
                      pricingCard('Pro', '$99', '/month', ['Unlimited pages', '10 subdomains', 'Advanced analytics', 'Priority support', 'Custom domains'], true),
                      pricingCard('Enterprise', '$299', '/month', ['Everything in Pro', 'Unlimited subdomains', 'Dedicated support', 'SLA guarantee', 'Custom integrations'], false),
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    },
    {
      title: 'Terms of Service',
      slug: '/terms',
      content: {
        version: '2.0',
        blocks: [
          {
            id: bid(), tag: 'section',
            className: 'py-24 px-6 bg-white',
            children: [
              {
                id: bid(), tag: 'div',
                className: 'max-w-3xl mx-auto prose prose-slate',
                children: [
                  { id: bid(), tag: 'h1', className: 'text-4xl font-bold text-slate-900', textContent: 'Terms of Service' },
                  { id: bid(), tag: 'p', className: 'mt-4 text-slate-500', textContent: 'Last updated: January 2026' },
                  { id: bid(), tag: 'h2', className: 'text-2xl font-semibold text-slate-900 mt-12', textContent: '1. Acceptance of Terms' },
                  { id: bid(), tag: 'p', className: 'mt-4 text-slate-600 leading-relaxed', textContent: 'By accessing and using this platform, you accept and agree to be bound by the terms and provision of this agreement.' },
                  { id: bid(), tag: 'h2', className: 'text-2xl font-semibold text-slate-900 mt-12', textContent: '2. Use License' },
                  { id: bid(), tag: 'p', className: 'mt-4 text-slate-600 leading-relaxed', textContent: 'Permission is granted to temporarily use this platform for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title.' },
                  { id: bid(), tag: 'h2', className: 'text-2xl font-semibold text-slate-900 mt-12', textContent: '3. Disclaimer' },
                  { id: bid(), tag: 'p', className: 'mt-4 text-slate-600 leading-relaxed', textContent: 'The materials on this platform are provided on an "as is" basis. We make no warranties, expressed or implied, and hereby disclaim all other warranties.' },
                ],
              },
            ],
          },
        ],
      },
    },
    {
      title: 'Privacy Policy',
      slug: '/privacy',
      content: {
        version: '2.0',
        blocks: [
          {
            id: bid(), tag: 'section',
            className: 'py-24 px-6 bg-white',
            children: [
              {
                id: bid(), tag: 'div',
                className: 'max-w-3xl mx-auto prose prose-slate',
                children: [
                  { id: bid(), tag: 'h1', className: 'text-4xl font-bold text-slate-900', textContent: 'Privacy Policy' },
                  { id: bid(), tag: 'p', className: 'mt-4 text-slate-500', textContent: 'Last updated: January 2026' },
                  { id: bid(), tag: 'h2', className: 'text-2xl font-semibold text-slate-900 mt-12', textContent: 'Information We Collect' },
                  { id: bid(), tag: 'p', className: 'mt-4 text-slate-600 leading-relaxed', textContent: 'We collect information you provide directly to us, such as when you create an account, make a purchase, or contact us for support.' },
                  { id: bid(), tag: 'h2', className: 'text-2xl font-semibold text-slate-900 mt-12', textContent: 'How We Use Your Information' },
                  { id: bid(), tag: 'p', className: 'mt-4 text-slate-600 leading-relaxed', textContent: 'We use the information we collect to provide, maintain, and improve our services, to process transactions, and to send you technical notices and support messages.' },
                  { id: bid(), tag: 'h2', className: 'text-2xl font-semibold text-slate-900 mt-12', textContent: 'Data Security' },
                  { id: bid(), tag: 'p', className: 'mt-4 text-slate-600 leading-relaxed', textContent: 'We take reasonable measures to help protect information about you from loss, theft, misuse, unauthorized access, disclosure, alteration, and destruction.' },
                ],
              },
            ],
          },
        ],
      },
    },
  ]
}

function featureCard(title: string, description: string) {
  return {
    id: bid(), tag: 'div' as const,
    className: 'p-8 rounded-xl bg-slate-50 text-left',
    children: [
      { id: bid(), tag: 'h3' as const, className: 'text-xl font-semibold text-slate-900', textContent: title },
      { id: bid(), tag: 'p' as const, className: 'mt-3 text-slate-600', textContent: description },
    ],
  }
}

function valueCard(title: string, description: string) {
  return {
    id: bid(), tag: 'div' as const,
    className: 'p-6 rounded-lg border border-slate-200',
    children: [
      { id: bid(), tag: 'h3' as const, className: 'text-lg font-semibold text-slate-900', textContent: title },
      { id: bid(), tag: 'p' as const, className: 'mt-2 text-slate-600', textContent: description },
    ],
  }
}

function formField(labelText: string, type: string, placeholder: string) {
  return {
    id: bid(), tag: 'div' as const,
    className: 'flex flex-col',
    children: [
      { id: bid(), tag: 'label' as const, className: 'text-sm font-medium text-slate-700 mb-2', textContent: labelText },
      {
        id: bid(), tag: 'input' as const,
        className: 'px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent',
        attrs: { type, placeholder, name: labelText.toLowerCase() },
      },
    ],
  }
}

function pricingCard(name: string, price: string, period: string, features: string[], featured: boolean) {
  return {
    id: bid(), tag: 'div' as const,
    className: `p-8 rounded-xl ${featured ? 'bg-slate-900 text-white ring-2 ring-slate-900' : 'bg-slate-50 text-slate-900'} flex flex-col`,
    children: [
      { id: bid(), tag: 'h3' as const, className: 'text-xl font-semibold', textContent: name },
      {
        id: bid(), tag: 'div' as const, className: 'mt-4 flex items-baseline',
        children: [
          { id: bid(), tag: 'span' as const, className: 'text-4xl font-bold', textContent: price },
          { id: bid(), tag: 'span' as const, className: `ml-1 ${featured ? 'text-slate-400' : 'text-slate-500'}`, textContent: period },
        ],
      },
      {
        id: bid(), tag: 'ul' as const, className: 'mt-8 space-y-3 flex-1',
        children: features.map(f => ({
          id: bid(), tag: 'li' as const,
          className: `flex items-center ${featured ? 'text-slate-300' : 'text-slate-600'}`,
          textContent: f,
        })),
      },
      {
        id: bid(), tag: 'a' as const,
        className: `mt-8 block text-center px-6 py-3 rounded-lg font-semibold ${featured ? 'bg-white text-slate-900 hover:bg-slate-100' : 'bg-slate-900 text-white hover:bg-slate-800'} transition-colors`,
        textContent: 'Get Started',
        attrs: { href: '/signup' },
      },
    ],
  }
}
