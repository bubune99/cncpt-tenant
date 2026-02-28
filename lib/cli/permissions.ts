/**
 * CLI Permissions Domain — CMS RBAC roles, assignments, overrides
 */

import {
  heading, table, success, error, warn, info, label, dim,
  requireUser, formatDate, c, sym,
  type ParsedArgs,
} from './utils'

export async function handlePermissions(action: string, args: ParsedArgs) {
  const { prisma, runAsSuperAdmin } = await import('@/lib/cms/db')
  const {
    PERMISSIONS, PERMISSION_GROUPS, BUILT_IN_ROLES,
    getUserPermissions, hasPermission: checkPerm,
    assignRole, removeRole,
    grantPermission, denyPermission, removePermissionOverride,
    seedBuiltInRoles,
  } = await import('@/lib/cms/permissions')

  switch (action) {
    case 'list': {
      heading('Permission Groups')
      for (const [group, data] of Object.entries(PERMISSION_GROUPS)) {
        console.log(`\n  ${c.bold}${data.label}${c.reset} ${dim(`(${group})`)}`)
        for (const perm of data.permissions) {
          console.log(`    ${sym.bullet} ${c.cyan}${perm.key}${c.reset} ${dim(perm.label)}`)
        }
      }
      console.log()
      break
    }

    case 'roles': {
      const subAction = args.positional[0]

      if (subAction === 'get') {
        const roleName = args.positional[1]
        if (!roleName) { error('Usage: tenant permissions roles get <name>'); return }

        const role = await prisma.role.findUnique({
          where: { name: roleName },
          include: { _count: { select: { assignments: true } } },
        })
        if (!role) { error(`Role not found: ${roleName}`); return }

        heading(`Role: ${role.displayName}`)
        label('ID', role.id)
        label('Name', role.name)
        label('Display Name', role.displayName)
        label('Description', role.description)
        label('System', role.isSystem ? 'Yes' : 'No')
        label('Position', role.position)
        label('Users', role._count.assignments)
        label('Created', formatDate(role.createdAt))

        const perms = role.permissions as string[]
        console.log(`\n  ${c.bold}Permissions (${perms.length}):${c.reset}`)
        for (const p of perms) {
          console.log(`    ${sym.bullet} ${c.cyan}${p}${c.reset}`)
        }
        console.log()
        break
      }

      if (subAction === 'create') {
        const roleName = args.positional[1]
        if (!roleName) { error('Usage: tenant permissions roles create <name> --display "Name" --perms "p1,p2"'); return }

        const displayName = args.flags.display as string || roleName
        const permsStr = args.flags.perms as string || ''
        const permissions = permsStr ? permsStr.split(',').map(p => p.trim()) : []

        const existing = await prisma.role.findUnique({ where: { name: roleName } })
        if (existing) { error(`Role already exists: ${roleName}`); return }

        const role = await prisma.role.create({
          data: {
            name: roleName,
            displayName,
            description: (args.flags.description as string) || null,
            permissions,
            isSystem: false,
          },
        })

        success(`Created role: ${role.displayName} (${role.name})`)
        label('Permissions', permissions.join(', ') || 'none')
        break
      }

      if (subAction === 'edit') {
        const roleName = args.positional[1]
        if (!roleName) { error('Usage: tenant permissions roles edit <name> --add "perm" --remove "perm"'); return }

        const role = await prisma.role.findUnique({ where: { name: roleName } })
        if (!role) { error(`Role not found: ${roleName}`); return }

        const perms = new Set(role.permissions as string[])

        if (args.flags.add) {
          const toAdd = (args.flags.add as string).split(',').map(p => p.trim())
          for (const p of toAdd) perms.add(p)
          info(`Adding: ${toAdd.join(', ')}`)
        }

        if (args.flags.remove) {
          const toRemove = (args.flags.remove as string).split(',').map(p => p.trim())
          for (const p of toRemove) perms.delete(p)
          info(`Removing: ${toRemove.join(', ')}`)
        }

        if (args.flags.display) {
          await prisma.role.update({
            where: { name: roleName },
            data: { displayName: args.flags.display as string },
          })
        }

        await prisma.role.update({
          where: { name: roleName },
          data: { permissions: Array.from(perms) },
        })

        success(`Updated role: ${roleName}`)
        label('Permissions', Array.from(perms).join(', '))
        break
      }

      // Default: list all roles
      const roles = await prisma.role.findMany({
        orderBy: { position: 'asc' },
        include: { _count: { select: { assignments: true } } },
      })

      heading('CMS Roles')
      table(
        ['Name', 'Display Name', 'System', 'Permissions', 'Users'],
        roles.map(r => [
          r.name,
          r.displayName,
          r.isSystem ? 'Yes' : 'No',
          (r.permissions as string[]).length,
          r._count.assignments,
        ])
      )
      break
    }

    case 'assign': {
      const email = args.positional[0]
      const roleName = args.positional[1]
      if (!email || !roleName) { error('Usage: tenant permissions assign <email> <role-name>'); return }

      const user = await requireUser(email)
      const role = await prisma.role.findUnique({ where: { name: roleName } })
      if (!role) { error(`Role not found: ${roleName}`); return }

      try {
        await assignRole({ userId: user.id, roleId: role.id })
        success(`Assigned ${role.displayName} to ${email}`)
      } catch (e: any) {
        if (e.code === 'P2002') warn('Role already assigned to this user')
        else throw e
      }
      break
    }

    case 'unassign': {
      const email = args.positional[0]
      const roleName = args.positional[1]
      if (!email || !roleName) { error('Usage: tenant permissions unassign <email> <role-name>'); return }

      const user = await requireUser(email)
      const role = await prisma.role.findUnique({ where: { name: roleName } })
      if (!role) { error(`Role not found: ${roleName}`); return }

      try {
        await removeRole({ userId: user.id, roleId: role.id })
        success(`Removed ${role.displayName} from ${email}`)
      } catch (e: any) {
        if (e.code === 'P2025') warn('Role not assigned to this user')
        else throw e
      }
      break
    }

    case 'grant': {
      const email = args.positional[0]
      const permission = args.positional[1]
      if (!email || !permission) { error('Usage: tenant permissions grant <email> <permission>'); return }

      const user = await requireUser(email)
      const reason = args.flags.reason as string || 'CLI grant'

      await grantPermission({ userId: user.id, permission, reason })
      success(`Granted ${permission} to ${email}`)
      break
    }

    case 'deny': {
      const email = args.positional[0]
      const permission = args.positional[1]
      if (!email || !permission) { error('Usage: tenant permissions deny <email> <permission>'); return }

      const user = await requireUser(email)
      const reason = args.flags.reason as string || 'CLI deny'

      await denyPermission({ userId: user.id, permission, reason })
      success(`Denied ${permission} for ${email}`)
      break
    }

    case 'clear': {
      const email = args.positional[0]
      const permission = args.positional[1]
      if (!email || !permission) { error('Usage: tenant permissions clear <email> <permission>'); return }

      const user = await requireUser(email)
      await removePermissionOverride({ userId: user.id, permission })
      success(`Cleared override for ${permission} on ${email}`)
      break
    }

    case 'check': {
      const email = args.positional[0]
      const permission = args.positional[1]
      if (!email || !permission) { error('Usage: tenant permissions check <email> <permission>'); return }

      const user = await requireUser(email)

      // CMS permission check
      const result = await checkPerm(user.id, permission)

      heading(`Permission Check: ${email} ${sym.arrow} ${permission}`)

      if (result.allowed) {
        console.log(`\n  ${c.bgGreen}${c.white} ALLOWED ${c.reset}`)
      } else {
        console.log(`\n  ${c.bgRed}${c.white} DENIED ${c.reset}`)
      }

      if (result.source) {
        label('Source', `${result.source.type}${result.source.name ? ` (${result.source.name})` : ''}`)
      }
      if (result.reason) label('Reason', result.reason)

      // Team permission check if --team flag provided
      const teamSlug = args.flags.team as string
      if (teamSlug) {
        const { hasTeamPermission, getEffectivePermissions } = await import('@/lib/team-utils')
        const { sql } = await import('@/lib/neon')

        const teamRows = await sql`
          SELECT tm.role, tm.custom_permissions, t.name
          FROM team_members tm
          JOIN teams t ON t.id = tm.team_id AND t.deleted_at IS NULL
          WHERE tm.user_id = ${user.id} AND t.slug = ${teamSlug}
        `

        if (teamRows.length > 0) {
          const tm = teamRows[0]
          const perms = getEffectivePermissions(tm.role, tm.custom_permissions || [])
          const teamAllowed = hasTeamPermission(perms, permission)

          console.log(`\n  ${c.bold}Team Check (${tm.name}):${c.reset}`)
          if (teamAllowed) {
            console.log(`  ${c.bgGreen}${c.white} ALLOWED ${c.reset} via team role: ${tm.role}`)
          } else {
            console.log(`  ${c.bgRed}${c.white} DENIED ${c.reset} — not in team permissions for ${tm.role}`)
          }
        } else {
          warn(`User is not a member of team: ${teamSlug}`)
        }
      }

      console.log()
      break
    }

    case 'seed': {
      info('Seeding built-in roles...')
      await seedBuiltInRoles()
      success('Built-in roles seeded')

      const roles = await prisma.role.findMany({
        where: { isSystem: true },
        orderBy: { position: 'asc' },
      })
      for (const r of roles) {
        console.log(`  ${sym.check} ${r.displayName} ${dim(`(${(r.permissions as string[]).length} perms)`)}`)
      }
      break
    }

    case 'dump': {
      const email = args.positional[0]
      if (!email) { error('Usage: tenant permissions dump <email>'); return }

      const user = await requireUser(email)
      const userPerms = await getUserPermissions(user.id)

      heading(`Permission Dump: ${email}`)

      if (!userPerms) { error('Could not load permissions'); return }

      // CMS roles
      console.log(`\n  ${c.bold}CMS Roles:${c.reset}`)
      if (userPerms.roles.length === 0) {
        console.log(`    ${dim('(none)')}`)
      }
      for (const role of userPerms.roles) {
        console.log(`    ${sym.bullet} ${role.displayName} ${dim(`(${role.name})`)}`)
        for (const p of role.permissions) {
          console.log(`      ${c.cyan}${p}${c.reset}`)
        }
      }

      // Overrides
      console.log(`\n  ${c.bold}Overrides:${c.reset}`)
      if (userPerms.overrides.length === 0) {
        console.log(`    ${dim('(none)')}`)
      }
      for (const o of userPerms.overrides) {
        const typeColor = o.type === 'GRANT' ? c.green : c.red
        console.log(`    ${typeColor}${o.type}${c.reset} ${o.permission} ${o.reason ? dim(`(${o.reason})`) : ''}`)
      }

      // Effective permissions
      const effective = Array.from(userPerms.permissions).sort()
      console.log(`\n  ${c.bold}Effective Permissions (${effective.length}):${c.reset}`)
      for (const p of effective) {
        console.log(`    ${c.green}${sym.check}${c.reset} ${p}`)
      }

      // Team permissions
      const { sql } = await import('@/lib/neon')
      const { getEffectivePermissions } = await import('@/lib/team-utils')

      const teamRows = await sql`
        SELECT tm.role, tm.custom_permissions, t.name, t.slug
        FROM team_members tm
        JOIN teams t ON t.id = tm.team_id AND t.deleted_at IS NULL
        WHERE tm.user_id = ${user.id}
        ORDER BY t.name
      `

      if (teamRows.length > 0) {
        console.log(`\n  ${c.bold}Team Permissions:${c.reset}`)
        for (const tm of teamRows) {
          const perms = getEffectivePermissions(tm.role, tm.custom_permissions || [])
          console.log(`\n    ${c.bold}${tm.name}${c.reset} ${dim(`(${tm.slug})`)} — ${tm.role}`)
          for (const p of perms.sort()) {
            console.log(`      ${c.green}${sym.check}${c.reset} ${p}`)
          }
        }
      }

      console.log()
      break
    }

    default:
      error(`Unknown action: ${action}`)
      info('Run: pnpm tenant help permissions')
  }
}
