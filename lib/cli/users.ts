/**
 * CLI Users Domain — user CRUD, role management, setup wizard
 */

import {
  heading, table, success, error, warn, info, label, dim,
  confirm, ask, select, findUserByEmail, requireUser,
  formatDate, truncate, c, sym,
  type ParsedArgs,
} from './utils'

export async function handleUsers(action: string, args: ParsedArgs) {
  const { prisma, runAsSuperAdmin } = await import('@/lib/cms/db')

  switch (action) {
    case 'list': {
      const roleFilter = args.flags.role as string | undefined
      const users = await runAsSuperAdmin(() =>
        prisma.user.findMany({
          where: roleFilter ? { role: roleFilter as any } : undefined,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true, email: true, name: true, role: true,
            stackAuthId: true, createdAt: true,
          },
        })
      )

      heading('Users')
      table(
        ['Email', 'Name', 'Role', 'Stack Auth', 'Created'],
        users.map(u => [
          u.email,
          truncate(u.name || '', 20),
          u.role,
          u.stackAuthId ? dim('linked') : dim('none'),
          formatDate(u.createdAt),
        ])
      )
      break
    }

    case 'get': {
      const email = args.positional[0]
      if (!email) { error('Usage: tenant users get <email>'); return }

      const user = await runAsSuperAdmin(() =>
        prisma.user.findUnique({
          where: { email },
          include: {
            roleAssignments: { include: { role: true } },
            permissions: true,
          },
        })
      )

      if (!user) { error(`User not found: ${email}`); return }

      heading(`User: ${user.email}`)
      label('ID', user.id)
      label('Email', user.email)
      label('Name', user.name)
      label('Phone', user.phone)
      label('Role', user.role)
      label('Stack Auth ID', user.stackAuthId)
      label('Created', formatDate(user.createdAt))
      label('Updated', formatDate(user.updatedAt))

      // CMS Roles
      if (user.roleAssignments.length > 0) {
        console.log(`\n  ${c.bold}CMS Roles:${c.reset}`)
        for (const ra of user.roleAssignments) {
          console.log(`    ${sym.bullet} ${ra.role.displayName} ${dim(`(${ra.role.name})`)} ${dim(`— ${(ra.role.permissions as string[]).length} perms`)}`)
        }
      }

      // Permission overrides
      if (user.permissions.length > 0) {
        console.log(`\n  ${c.bold}Permission Overrides:${c.reset}`)
        for (const p of user.permissions) {
          const typeColor = p.type === 'GRANT' ? c.green : c.red
          console.log(`    ${typeColor}${p.type}${c.reset} ${p.permission} ${p.reason ? dim(`(${p.reason})`) : ''}`)
        }
      }

      // Teams (via raw SQL since team_members has no tenantId scope)
      const { sql } = await import('@/lib/neon')
      const teamRows = await sql`
        SELECT tm.role, t.name, t.slug
        FROM team_members tm
        JOIN teams t ON t.id = tm.team_id
        WHERE tm.user_id = ${user.id} AND t.deleted_at IS NULL
        ORDER BY t.name
      `
      if (teamRows.length > 0) {
        console.log(`\n  ${c.bold}Teams:${c.reset}`)
        for (const tm of teamRows) {
          console.log(`    ${sym.bullet} ${tm.name} ${dim(`(${tm.slug})`)} — ${tm.role}`)
        }
      }

      // Accessible subdomains
      const subRows = await sql`
        SELECT s.subdomain, 'owner' as access_type
        FROM subdomains s WHERE s.user_id = ${user.id}
        UNION
        SELECT ts.subdomain, ts.access_level as access_type
        FROM team_subdomains ts
        JOIN team_members tm ON tm.team_id = ts.team_id AND tm.user_id = ${user.id}
        JOIN teams t ON t.id = ts.team_id AND t.deleted_at IS NULL
        ORDER BY subdomain
      `
      if (subRows.length > 0) {
        console.log(`\n  ${c.bold}Accessible Subdomains:${c.reset}`)
        for (const s of subRows) {
          console.log(`    ${sym.bullet} ${s.subdomain} ${dim(`(${s.access_type})`)}`)
        }
      }

      // Super admin check
      const saRows = await sql`
        SELECT * FROM super_admins WHERE user_id = ${user.id} AND revoked_at IS NULL
      `
      if (saRows.length > 0) {
        console.log(`\n  ${c.bgRed}${c.white} SUPER ADMIN ${c.reset}`)
        const perms = saRows[0].permissions as string[]
        label('Permissions', perms.includes('*') ? 'ALL' : perms.join(', '))
        label('Granted', formatDate(saRows[0].granted_at))
      }

      console.log()
      break
    }

    case 'create': {
      const email = args.positional[0]
      if (!email) { error('Usage: tenant users create <email> --name "Name" [--role ADMIN]'); return }

      const name = args.flags.name as string || null
      const role = (args.flags.role as string || 'VIEWER').toUpperCase()

      const existing = await findUserByEmail(email)
      if (existing) { error(`User already exists: ${email}`); return }

      const user = await runAsSuperAdmin(() =>
        prisma.user.create({
          data: { email, name, role: role as any },
        })
      )

      success(`Created user: ${user.email} (${user.role})`)
      label('ID', user.id)
      break
    }

    case 'update': {
      const email = args.positional[0]
      if (!email) { error('Usage: tenant users update <email> [--name] [--role] [--phone]'); return }

      const user = await requireUser(email)
      const data: Record<string, any> = {}
      if (args.flags.name) data.name = args.flags.name
      if (args.flags.role) data.role = (args.flags.role as string).toUpperCase()
      if (args.flags.phone) data.phone = args.flags.phone

      if (Object.keys(data).length === 0) {
        warn('No update flags provided (--name, --role, --phone)')
        return
      }

      await runAsSuperAdmin(() =>
        prisma.user.update({ where: { id: user.id }, data })
      )

      success(`Updated user: ${email}`)
      for (const [k, v] of Object.entries(data)) label(k, v)
      break
    }

    case 'delete': {
      const email = args.positional[0]
      if (!email) { error('Usage: tenant users delete <email>'); return }

      const user = await requireUser(email)
      warn(`This will delete user ${email} and cascade to:`)
      console.log(`    ${sym.bullet} Role assignments`)
      console.log(`    ${sym.bullet} Permission overrides`)
      console.log(`    ${sym.bullet} Team memberships`)
      console.log(`    ${sym.bullet} Owned subdomains will be unassigned`)

      const yes = await confirm('Delete this user?')
      if (!yes) { info('Cancelled'); return }

      await runAsSuperAdmin(() =>
        prisma.user.delete({ where: { id: user.id } })
      )
      success(`Deleted user: ${email}`)
      break
    }

    case 'search': {
      const query = args.positional[0]
      if (!query) { error('Usage: tenant users search <query>'); return }

      const users = await runAsSuperAdmin(() =>
        prisma.user.findMany({
          where: {
            OR: [
              { email: { contains: query, mode: 'insensitive' } },
              { name: { contains: query, mode: 'insensitive' } },
            ],
          },
          orderBy: { email: 'asc' },
          select: { email: true, name: true, role: true, createdAt: true },
          take: 25,
        })
      )

      heading(`Search: "${query}"`)
      table(
        ['Email', 'Name', 'Role', 'Created'],
        users.map(u => [u.email, truncate(u.name || '', 25), u.role, formatDate(u.createdAt)])
      )
      break
    }

    case 'setup': {
      const email = args.positional[0]
      if (!email) { error('Usage: tenant users setup <email>'); return }

      info(`Setting up user: ${email}\n`)

      // Step 1: Create or find user
      let user = await findUserByEmail(email)
      if (user) {
        info(`User exists: ${user.email} (${user.role})`)
      } else {
        const name = await ask('Full name:')
        const role = await select('Base role:', ['ADMIN', 'EDITOR', 'VIEWER'])
        user = await runAsSuperAdmin(() =>
          prisma.user.create({
            data: { email, name: name || null, role: role as any },
            select: { id: true, email: true, name: true, role: true, stackAuthId: true, createdAt: true },
          })
        )
        success(`Created user: ${user.email}`)
      }

      // Step 2: Assign CMS roles
      const wantRoles = await confirm('Assign CMS roles?', true)
      if (wantRoles) {
        const roles = await runAsSuperAdmin(() =>
          prisma.role.findMany({ orderBy: { position: 'asc' } })
        )
        if (roles.length === 0) {
          warn('No CMS roles found. Run: tenant permissions seed')
        } else {
          const existingAssignments = await runAsSuperAdmin(() =>
            prisma.roleAssignment.findMany({
              where: { userId: user!.id },
              select: { roleId: true },
            })
          )
          const existingIds = new Set(existingAssignments.map(a => a.roleId))
          const available = roles.filter(r => !existingIds.has(r.id))

          if (available.length === 0) {
            info('User already has all available roles')
          } else {
            const roleName = await select('Select role:', available.map(r => `${r.displayName} (${r.name})`))
            const selected = available.find(r => roleName.includes(r.name))
            if (selected) {
              const { assignRole } = await import('@/lib/cms/permissions')
              await assignRole({ userId: user!.id, roleId: selected.id })
              success(`Assigned role: ${selected.displayName}`)
            }
          }
        }
      }

      // Step 3: Add to team
      const wantTeam = await confirm('Add to a team?')
      if (wantTeam) {
        const teams = await prisma.team.findMany({
          where: { deletedAt: null },
          orderBy: { name: 'asc' },
          select: { id: true, name: true, slug: true },
        })
        if (teams.length === 0) {
          warn('No teams found')
        } else {
          const teamName = await select('Select team:', teams.map(t => `${t.name} (${t.slug})`))
          const selectedTeam = teams.find(t => teamName.includes(t.slug))
          if (selectedTeam) {
            const teamRole = await select('Team role:', ['admin', 'member', 'viewer'])
            try {
              await prisma.teamMember.create({
                data: {
                  teamId: selectedTeam.id,
                  userId: user!.id,
                  email: user!.email,
                  role: teamRole as any,
                  customPermissions: [],
                },
              })
              success(`Added to team: ${selectedTeam.name} as ${teamRole}`)
            } catch (e: any) {
              if (e.code === 'P2002') warn('Already a member of this team')
              else throw e
            }
          }
        }
      }

      // Step 4: Grant subdomain access via team
      const wantSubdomain = await confirm('Grant subdomain access?')
      if (wantSubdomain) {
        const subs = await prisma.subdomain.findMany({
          orderBy: { subdomain: 'asc' },
          select: { subdomain: true },
        })
        if (subs.length === 0) {
          warn('No subdomains found')
        } else {
          const subName = await select('Select subdomain:', subs.map(s => s.subdomain))
          const selectedSub = subs.find(s => subName.includes(s.subdomain))
          if (selectedSub) {
            // Transfer ownership
            const ownership = await confirm('Transfer ownership of this subdomain?')
            if (ownership) {
              await prisma.subdomain.update({
                where: { subdomain: selectedSub.subdomain },
                data: { userId: user!.id },
              })
              success(`Transferred ownership of ${selectedSub.subdomain} to ${email}`)
            }
          }
        }
      }

      console.log()
      success(`Setup complete for ${email}`)
      info(`View full details: pnpm tenant users get ${email}`)
      break
    }

    default:
      error(`Unknown action: ${action}`)
      info('Run: pnpm tenant help users')
  }
}
