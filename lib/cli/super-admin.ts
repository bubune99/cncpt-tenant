/**
 * CLI Super Admin Domain — grant, revoke, check super admin status
 */

import {
  heading, table, success, error, warn, info, label, dim,
  confirm, findUserByEmail, requireUser,
  formatDate, c, sym,
  type ParsedArgs,
} from './utils'

export async function handleSuperAdmin(action: string, args: ParsedArgs) {
  const { sql } = await import('@/lib/neon')

  switch (action) {
    case 'list': {
      const rows = await sql`
        SELECT user_id, email, granted_by, granted_at, revoked_at, permissions
        FROM super_admins
        WHERE revoked_at IS NULL
        ORDER BY granted_at DESC
      `

      heading('Super Admins')

      // Also check env var
      const envEmails = process.env.SUPER_ADMIN_EMAILS?.split(',').map(e => e.trim()).filter(Boolean) || []
      if (envEmails.length > 0) {
        console.log(`  ${c.dim}Env (SUPER_ADMIN_EMAILS): ${envEmails.join(', ')}${c.reset}\n`)
      }

      table(
        ['Email', 'User ID', 'Granted By', 'Granted At', 'Permissions'],
        rows.map((r: any) => [
          r.email,
          r.user_id,
          r.granted_by || dim('system'),
          formatDate(r.granted_at),
          (r.permissions as string[]).includes('*') ? 'ALL' : (r.permissions as string[]).join(', '),
        ])
      )
      break
    }

    case 'grant': {
      const email = args.positional[0]
      if (!email) { error('Usage: tenant super-admin grant <email> [--perms "p1,p2"]'); return }

      // Find or note user
      const user = await findUserByEmail(email)

      const permsStr = args.flags.perms as string
      const permissions = permsStr ? permsStr.split(',').map(p => p.trim()) : ['*']
      const userId = user?.id || email // Use email as fallback ID if user doesn't exist

      // Check if already super admin
      const existing = await sql`
        SELECT id FROM super_admins WHERE email = ${email} AND revoked_at IS NULL
      `
      if (existing.length > 0) {
        warn(`${email} is already a super admin`)
        return
      }

      await sql`
        INSERT INTO super_admins (user_id, email, granted_by, granted_at, permissions)
        VALUES (${userId}, ${email}, ${'CLI'}, NOW(), ${JSON.stringify(permissions)}::jsonb)
      `

      success(`Granted super admin to ${email}`)
      label('Permissions', permissions.includes('*') ? 'ALL' : permissions.join(', '))
      if (!user) warn(`Note: No User record found for ${email}. Create one: pnpm tenant users create ${email}`)
      break
    }

    case 'revoke': {
      const email = args.positional[0]
      if (!email) { error('Usage: tenant super-admin revoke <email>'); return }

      const existing = await sql`
        SELECT id, email FROM super_admins WHERE email = ${email} AND revoked_at IS NULL
      `
      if (existing.length === 0) { error(`${email} is not a super admin`); return }

      const yes = await confirm(`Revoke super admin for ${email}?`)
      if (!yes) { info('Cancelled'); return }

      await sql`
        UPDATE super_admins SET revoked_at = NOW() WHERE email = ${email} AND revoked_at IS NULL
      `

      success(`Revoked super admin for ${email}`)
      break
    }

    case 'check': {
      const email = args.positional[0]
      if (!email) { error('Usage: tenant super-admin check <email>'); return }

      heading(`Super Admin Check: ${email}`)

      // Check DB
      const dbRows = await sql`
        SELECT user_id, email, granted_at, permissions
        FROM super_admins
        WHERE email = ${email} AND revoked_at IS NULL
      `

      // Check env
      const envEmails = process.env.SUPER_ADMIN_EMAILS?.split(',').map(e => e.trim()).filter(Boolean) || []
      const inEnv = envEmails.includes(email)

      if (dbRows.length > 0) {
        console.log(`\n  ${c.bgGreen}${c.white} SUPER ADMIN ${c.reset} ${dim('(database)')}`)
        const perms = dbRows[0].permissions as string[]
        label('Permissions', perms.includes('*') ? 'ALL' : perms.join(', '))
        label('Granted', formatDate(dbRows[0].granted_at))
      } else if (inEnv) {
        console.log(`\n  ${c.bgYellow}${c.white} SUPER ADMIN ${c.reset} ${dim('(env: SUPER_ADMIN_EMAILS)')}`)
        label('Permissions', 'ALL (implicit from env)')
      } else {
        console.log(`\n  ${c.dim}Not a super admin${c.reset}`)
      }

      // Also check CMS super_admin role
      const user = await findUserByEmail(email)
      if (user) {
        const { getUserPermissions } = await import('@/lib/cms/permissions')
        const perms = await getUserPermissions(user.id)
        if (perms?.permissions.has('*')) {
          console.log(`\n  ${c.bold}Also has CMS super_admin role${c.reset} ${dim('(via role assignment)')}`)
        }
      }

      console.log()
      break
    }

    default:
      error(`Unknown action: ${action}`)
      info('Run: pnpm tenant help super-admin')
  }
}
