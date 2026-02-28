/**
 * CLI Tiers Domain — subscription tier management
 */

import {
  heading, table, success, error, warn, info, label, dim,
  requireUser, formatDate, c, sym,
  type ParsedArgs,
} from './utils'

export async function handleTiers(action: string, args: ParsedArgs) {
  const { prisma } = await import('@/lib/cms/db')
  const { sql } = await import('@/lib/neon')

  switch (action) {
    case 'list': {
      const rows = await sql`
        SELECT st.*,
          (SELECT COUNT(*) FROM teams t WHERE t.tier_id = st.id AND t.deleted_at IS NULL) as team_count
        FROM subscription_tiers st
        ORDER BY st.sort_order ASC, st.price_monthly ASC
      `

      heading('Subscription Tiers')
      table(
        ['Name', 'Display Name', 'Monthly', 'Yearly', 'Active', 'Teams'],
        rows.map((r: any) => [
          r.name,
          r.display_name,
          r.price_monthly ? `$${r.price_monthly}` : dim('free'),
          r.price_yearly ? `$${r.price_yearly}` : dim('-'),
          r.is_active ? `${c.green}Yes${c.reset}` : dim('No'),
          r.team_count,
        ])
      )
      break
    }

    case 'get': {
      const name = args.positional[0]
      if (!name) { error('Usage: tenant tiers get <name>'); return }

      const rows = await sql`SELECT * FROM subscription_tiers WHERE name = ${name}`
      if (rows.length === 0) { error(`Tier not found: ${name}`); return }

      const tier = rows[0] as any

      heading(`Tier: ${tier.display_name}`)
      label('ID', tier.id)
      label('Name', tier.name)
      label('Display Name', tier.display_name)
      label('Description', tier.description)
      label('Monthly Price', tier.price_monthly ? `$${tier.price_monthly}` : 'Free')
      label('Yearly Price', tier.price_yearly ? `$${tier.price_yearly}` : null)
      label('Currency', tier.currency)
      label('Trial Days', tier.trial_days)
      label('Active', tier.is_active ? 'Yes' : 'No')
      label('Sort Order', tier.sort_order)
      label('Created', formatDate(tier.created_at))

      // Limits
      const limits = tier.limits as Record<string, number> || {}
      if (Object.keys(limits).length > 0) {
        console.log(`\n  ${c.bold}Limits:${c.reset}`)
        for (const [k, v] of Object.entries(limits)) {
          const formatted = v === -1 ? 'Unlimited' : String(v)
          console.log(`    ${sym.bullet} ${k}: ${formatted}`)
        }
      }

      // Features
      const features = tier.features as string[] || []
      if (features.length > 0) {
        console.log(`\n  ${c.bold}Features:${c.reset}`)
        for (const f of features) {
          console.log(`    ${c.green}${sym.check}${c.reset} ${f}`)
        }
      }

      // Stripe IDs
      if (tier.stripe_product_id || tier.stripe_price_id_monthly || tier.stripe_price_id_yearly) {
        console.log(`\n  ${c.bold}Stripe:${c.reset}`)
        label('Product ID', tier.stripe_product_id)
        label('Monthly Price ID', tier.stripe_price_id_monthly)
        label('Yearly Price ID', tier.stripe_price_id_yearly)
      }

      // Team count
      const teamRows = await sql`
        SELECT COUNT(*) as count FROM teams WHERE tier_id = ${tier.id} AND deleted_at IS NULL
      `
      label('Teams', teamRows[0].count)

      console.log()
      break
    }

    case 'create': {
      const name = args.positional[0]
      if (!name) { error('Usage: tenant tiers create <name> --display "Name" --price-monthly 29'); return }

      const displayName = (args.flags.display as string) || name
      const priceMonthly = parseFloat(args.flags['price-monthly'] as string || '0')
      const priceYearly = args.flags['price-yearly'] ? parseFloat(args.flags['price-yearly'] as string) : null
      const trialDays = args.flags['trial-days'] ? parseInt(args.flags['trial-days'] as string) : 0
      const description = (args.flags.description as string) || null

      // Check existing
      const existing = await sql`SELECT id FROM subscription_tiers WHERE name = ${name}`
      if (existing.length > 0) { error(`Tier already exists: ${name}`); return }

      // Get max sort order
      const maxOrder = await sql`SELECT COALESCE(MAX(sort_order), 0) as max_order FROM subscription_tiers`
      const sortOrder = (maxOrder[0].max_order as number) + 1

      const defaultLimits = { storage_gb: 5, pages: 50, posts: 100, custom_domains: 1, team_members: 5, subdomains: 3 }
      const defaultFeatures = ['Basic analytics', 'Email support']

      await sql`
        INSERT INTO subscription_tiers (name, display_name, description, price_monthly, price_yearly, currency,
          trial_days, sort_order, is_active, limits, features)
        VALUES (${name}, ${displayName}, ${description}, ${priceMonthly}, ${priceYearly},
          'USD', ${trialDays}, ${sortOrder}, true,
          ${JSON.stringify(defaultLimits)}::jsonb, ${JSON.stringify(defaultFeatures)}::jsonb)
      `

      success(`Created tier: ${displayName} ($${priceMonthly}/mo)`)
      info('Edit limits/features: tenant tiers update ' + name)
      break
    }

    case 'update': {
      const name = args.positional[0]
      if (!name) { error('Usage: tenant tiers update <name> [--display] [--price-monthly] [--price-yearly] [--trial-days] [--description]'); return }

      const existing = await sql`SELECT * FROM subscription_tiers WHERE name = ${name}`
      if (existing.length === 0) { error(`Tier not found: ${name}`); return }

      const updates: string[] = []
      const values: any[] = [name] // $1 = name for WHERE clause

      const addUpdate = (column: string, flag: string, transform?: (v: string) => any) => {
        const value = args.flags[flag]
        if (value !== undefined) {
          const paramIdx = values.length + 1
          updates.push(`${column} = $${paramIdx}`)
          values.push(transform ? transform(value as string) : value)
        }
      }

      addUpdate('display_name', 'display')
      addUpdate('description', 'description')
      addUpdate('price_monthly', 'price-monthly', parseFloat)
      addUpdate('price_yearly', 'price-yearly', parseFloat)
      addUpdate('trial_days', 'trial-days', parseInt)
      addUpdate('currency', 'currency')

      if (updates.length === 0) {
        warn('No update flags provided')
        return
      }

      updates.push('updated_at = NOW()')

      await sql(`UPDATE subscription_tiers SET ${updates.join(', ')} WHERE name = $1`, values)

      success(`Updated tier: ${name}`)
      break
    }

    case 'toggle': {
      const name = args.positional[0]
      if (!name) { error('Usage: tenant tiers toggle <name>'); return }

      const existing = await sql`SELECT id, is_active, display_name FROM subscription_tiers WHERE name = ${name}`
      if (existing.length === 0) { error(`Tier not found: ${name}`); return }

      const newState = !existing[0].is_active
      await sql`UPDATE subscription_tiers SET is_active = ${newState}, updated_at = NOW() WHERE name = ${name}`

      if (newState) {
        success(`Activated tier: ${existing[0].display_name}`)
      } else {
        success(`Deactivated tier: ${existing[0].display_name}`)
      }
      break
    }

    case 'assign': {
      const teamSlug = args.positional[0]
      const tierName = args.positional[1]
      if (!teamSlug || !tierName) { error('Usage: tenant tiers assign <team-slug> <tier-name>'); return }

      const team = await prisma.team.findFirst({ where: { slug: teamSlug, deletedAt: null } })
      if (!team) { error(`Team not found: ${teamSlug}`); return }

      const tierRows = await sql`SELECT id, display_name FROM subscription_tiers WHERE name = ${tierName}`
      if (tierRows.length === 0) { error(`Tier not found: ${tierName}`); return }

      await prisma.team.update({
        where: { id: team.id },
        data: { tierId: tierRows[0].id as string },
      })

      success(`Assigned ${tierRows[0].display_name} tier to ${team.name}`)
      break
    }

    default:
      error(`Unknown action: ${action}`)
      info('Run: pnpm tenant help tiers')
  }
}
