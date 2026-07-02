/**
 * CLI Teams Domain — team management, members, invitations
 */

import {
  heading, table, success, error, warn, info, label, dim,
  confirm, ask, requireUser,
  formatDate, truncate, c, sym,
  type ParsedArgs,
} from './utils'

export async function handleTeams(action: string, args: ParsedArgs) {
  const { prisma } = await import('@/lib/cms/db')

  switch (action) {
    case 'list': {
      const teams = await prisma.team.findMany({
        where: { deletedAt: null },
        orderBy: { name: 'asc' },
        include: {
          _count: { select: { members: true, subdomains: true, invitations: true } },
          tier: true,
        },
      })

      // Get owner emails
      const { runAsSuperAdmin } = await import('@/lib/cms/db')
      const ownerIds = [...new Set(teams.map(t => t.ownerId).filter(Boolean))] as string[]
      const owners = ownerIds.length > 0
        ? await runAsSuperAdmin(() =>
            prisma.user.findMany({
              where: { id: { in: ownerIds } },
              select: { id: true, email: true },
            })
          )
        : []
      const ownerMap = new Map(owners.map(o => [o.id, o.email]))

      heading('Teams')
      table(
        ['Name', 'Slug', 'Owner', 'Members', 'Subdomains', 'Tier'],
        teams.map(t => [
          t.name,
          t.slug,
          t.ownerId ? truncate(ownerMap.get(t.ownerId) || t.ownerId, 25) : dim('none'),
          t._count.members,
          t._count.subdomains,
          t.tier?.displayName || dim('none'),
        ])
      )
      break
    }

    case 'get': {
      const slug = args.positional[0]
      if (!slug) { error('Usage: tenant teams get <slug>'); return }

      const team = await prisma.team.findFirst({
        where: { slug, deletedAt: null },
        include: {
          members: { orderBy: { createdAt: 'asc' } },
          invitations: { where: { acceptedAt: null, declinedAt: null }, orderBy: { createdAt: 'desc' } },
          subdomains: { orderBy: { subdomain: 'asc' } },
          tier: true,
        },
      })

      if (!team) { error(`Team not found: ${slug}`); return }

      heading(`Team: ${team.name}`)
      label('ID', team.id)
      label('Name', team.name)
      label('Slug', team.slug)
      label('Description', team.description)
      label('Logo', team.logoUrl)
      label('Owner ID', team.ownerId)
      label('Tier', team.tier?.displayName || null)
      label('Billing Email', team.billingEmail)
      label('Stripe Customer', team.stripeCustomerId)
      label('Created', formatDate(team.createdAt))

      // Members
      if (team.members.length > 0) {
        console.log(`\n  ${c.bold}Members (${team.members.length}):${c.reset}`)
        for (const m of team.members) {
          const roleColor = m.role === 'owner' ? c.yellow : m.role === 'admin' ? c.cyan : c.reset
          console.log(`    ${sym.bullet} ${m.userId} ${roleColor}${m.role}${c.reset}`)
        }
      }

      // Invitations
      if (team.invitations.length > 0) {
        console.log(`\n  ${c.bold}Pending Invitations (${team.invitations.length}):${c.reset}`)
        for (const inv of team.invitations) {
          console.log(`    ${sym.bullet} ${inv.email} ${dim(`as ${inv.role}`)} ${dim(`— expires ${formatDate(inv.expiresAt)}`)}`)
        }
      }

      // Subdomains
      if (team.subdomains.length > 0) {
        console.log(`\n  ${c.bold}Subdomains (${team.subdomains.length}):${c.reset}`)
        for (const s of team.subdomains) {
          console.log(`    ${sym.bullet} ${s.subdomain} ${dim(`(${s.accessLevel})`)}`)
        }
      }

      console.log()
      break
    }

    case 'create': {
      const name = args.positional[0]
      if (!name) { error('Usage: tenant teams create <name> --owner <email>'); return }
      const ownerEmail = args.flags.owner as string
      if (!ownerEmail) { error('--owner <email> is required'); return }

      const owner = await requireUser(ownerEmail)

      // Generate slug from name
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

      const existing = await prisma.team.findFirst({ where: { slug, deletedAt: null } })
      if (existing) { error(`Team with slug "${slug}" already exists`); return }

      const team = await prisma.team.create({
        data: {
          name,
          slug,
          ownerId: owner.id,
          settings: {},
        },
      })

      // Add owner as team member
      await prisma.teamMember.create({
        data: {
          teamId: team.id,
          userId: owner.id,
          role: 'owner',
          customPermissions: [],
        },
      })

      success(`Created team: ${name} (${slug})`)
      label('ID', team.id)
      label('Owner', ownerEmail)
      break
    }

    case 'delete': {
      const slug = args.positional[0]
      if (!slug) { error('Usage: tenant teams delete <slug>'); return }

      const team = await prisma.team.findFirst({
        where: { slug, deletedAt: null },
        include: { _count: { select: { members: true, subdomains: true } } },
      })
      if (!team) { error(`Team not found: ${slug}`); return }

      warn(`This will soft-delete team "${team.name}":`)
      console.log(`    ${sym.bullet} ${team._count.members} members`)
      console.log(`    ${sym.bullet} ${team._count.subdomains} shared subdomains`)

      const yes = await confirm('Delete this team?')
      if (!yes) { info('Cancelled'); return }

      await prisma.team.update({
        where: { id: team.id },
        data: { deletedAt: new Date() },
      })

      success(`Soft-deleted team: ${team.name}`)
      break
    }

    case 'add-member': {
      const slug = args.positional[0]
      const email = args.positional[1]
      if (!slug || !email) { error('Usage: tenant teams add-member <slug> <email> [--role admin]'); return }

      const team = await prisma.team.findFirst({ where: { slug, deletedAt: null } })
      if (!team) { error(`Team not found: ${slug}`); return }

      const user = await requireUser(email)
      const role = (args.flags.role as string) || 'member'

      if (!['owner', 'admin', 'member', 'viewer'].includes(role)) {
        error(`Invalid role: ${role}. Must be owner, admin, member, or viewer`)
        return
      }

      try {
        await prisma.teamMember.create({
          data: {
            teamId: team.id,
            userId: user.id,
            role: role as any,
            customPermissions: [],
          },
        })
        success(`Added ${email} to ${team.name} as ${role}`)
      } catch (e: any) {
        if (e.code === 'P2002') warn('User is already a member of this team')
        else throw e
      }
      break
    }

    case 'remove-member': {
      const slug = args.positional[0]
      const email = args.positional[1]
      if (!slug || !email) { error('Usage: tenant teams remove-member <slug> <email>'); return }

      const team = await prisma.team.findFirst({ where: { slug, deletedAt: null } })
      if (!team) { error(`Team not found: ${slug}`); return }

      const user = await requireUser(email)

      const member = await prisma.teamMember.findUnique({
        where: { teamId_userId: { teamId: team.id, userId: user.id } },
      })
      if (!member) { error(`${email} is not a member of ${slug}`); return }

      if (member.role === 'owner') {
        warn('Cannot remove team owner. Transfer ownership first.')
        return
      }

      await prisma.teamMember.delete({
        where: { teamId_userId: { teamId: team.id, userId: user.id } },
      })

      success(`Removed ${email} from ${team.name}`)
      break
    }

    case 'set-role': {
      const slug = args.positional[0]
      const email = args.positional[1]
      const role = args.positional[2]
      if (!slug || !email || !role) { error('Usage: tenant teams set-role <slug> <email> <role>'); return }

      if (!['owner', 'admin', 'member', 'viewer'].includes(role)) {
        error(`Invalid role: ${role}. Must be owner, admin, member, or viewer`)
        return
      }

      const team = await prisma.team.findFirst({ where: { slug, deletedAt: null } })
      if (!team) { error(`Team not found: ${slug}`); return }

      const user = await requireUser(email)

      const member = await prisma.teamMember.findUnique({
        where: { teamId_userId: { teamId: team.id, userId: user.id } },
      })
      if (!member) { error(`${email} is not a member of ${slug}`); return }

      await prisma.teamMember.update({
        where: { teamId_userId: { teamId: team.id, userId: user.id } },
        data: { role: role as any },
      })

      success(`Set ${email}'s role to ${role} in ${team.name}`)
      break
    }

    case 'invite': {
      const slug = args.positional[0]
      const email = args.positional[1]
      if (!slug || !email) { error('Usage: tenant teams invite <slug> <email> [--role member]'); return }

      const team = await prisma.team.findFirst({ where: { slug, deletedAt: null } })
      if (!team) { error(`Team not found: ${slug}`); return }

      const role = (args.flags.role as string) || 'member'
      const crypto = await import('crypto')
      const token = crypto.randomBytes(32).toString('hex')
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

      try {
        await prisma.teamInvitation.create({
          data: {
            teamId: team.id,
            email,
            role: role as any,
            token,
            expiresAt,
            invitedBy: team.ownerId,
          },
        })
        success(`Invited ${email} to ${team.name} as ${role}`)
        label('Token', token)
        label('Expires', formatDate(expiresAt))
      } catch (e: any) {
        if (e.code === 'P2002') warn('Invitation already pending for this email')
        else throw e
      }
      break
    }

    case 'invitations': {
      const slug = args.positional[0]
      if (!slug) { error('Usage: tenant teams invitations <slug>'); return }

      const team = await prisma.team.findFirst({ where: { slug, deletedAt: null } })
      if (!team) { error(`Team not found: ${slug}`); return }

      const invitations = await prisma.teamInvitation.findMany({
        where: { teamId: team.id, acceptedAt: null, declinedAt: null },
        orderBy: { createdAt: 'desc' },
      })

      heading(`Pending Invitations: ${team.name}`)
      table(
        ['Email', 'Role', 'Created', 'Expires'],
        invitations.map(i => [
          i.email,
          i.role,
          formatDate(i.createdAt),
          formatDate(i.expiresAt),
        ])
      )
      break
    }

    case 'cancel-invite': {
      const slug = args.positional[0]
      const email = args.positional[1]
      if (!slug || !email) { error('Usage: tenant teams cancel-invite <slug> <email>'); return }

      const team = await prisma.team.findFirst({ where: { slug, deletedAt: null } })
      if (!team) { error(`Team not found: ${slug}`); return }

      const inv = await prisma.teamInvitation.findUnique({
        where: { teamId_email: { teamId: team.id, email } },
      })
      if (!inv) { error(`No pending invitation for ${email}`); return }

      await prisma.teamInvitation.delete({
        where: { id: inv.id },
      })

      success(`Cancelled invitation for ${email}`)
      break
    }

    default:
      error(`Unknown action: ${action}`)
      info('Run: pnpm tenant help teams')
  }
}
