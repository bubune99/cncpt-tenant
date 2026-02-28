/**
 * CLI Help System
 */

import { c, sym } from './utils'

const DOMAINS: Record<string, { desc: string; commands: string[] }> = {
  users: {
    desc: 'User management — CRUD, roles, setup wizard',
    commands: [
      'list [--role <ROLE>]                         List users',
      'get <email>                                  Full user detail',
      'create <email> --name "Name" [--role ROLE]   Create user',
      'update <email> [--name] [--role]             Update user',
      'delete <email>                               Delete user',
      'search <query>                               Search by email/name',
      'setup <email>                                Interactive setup wizard',
    ],
  },
  subdomains: {
    desc: 'Subdomain management — CRUD, auth config, sharing, seeding',
    commands: [
      'list [--owner <email>]                       List subdomains',
      'get <subdomain>                              Full subdomain detail',
      'create <name> --owner <email>                Create subdomain',
      'delete <subdomain>                           Delete subdomain',
      'assign <subdomain> <email>                   Transfer ownership',
      'maintenance <subdomain> on|off [--msg "..."] Toggle maintenance mode',
      'auth <subdomain>                             Show auth config',
      'auth <subdomain> --set-project <id> --set-key <key> --set-secret <secret>',
      'auth <subdomain> --enable-social --enable-magic-link --disable-password',
      'share <subdomain> <team-slug> [--level edit] Share with team',
      'unshare <subdomain> <team-slug>              Remove team access',
      'stats <subdomain>                            Content counts',
      'seed-pages <subdomain> [--status PUBLISHED]  Seed template pages into CMS',
      'verify <subdomain> [--base-url <url>]        Crawl with Firecrawl and validate pages',
    ],
  },
  teams: {
    desc: 'Team management — members, invitations, subdomains',
    commands: [
      'list                                         List all teams',
      'get <slug>                                   Full team detail',
      'create <name> --owner <email>                Create team',
      'delete <slug>                                Soft delete team',
      'add-member <slug> <email> [--role admin]     Add team member',
      'remove-member <slug> <email>                 Remove member',
      'set-role <slug> <email> <role>               Change member role',
      'invite <slug> <email> [--role member]        Create invitation',
      'invitations <slug>                           List pending invitations',
      'cancel-invite <slug> <email>                 Cancel invitation',
    ],
  },
  permissions: {
    desc: 'CMS RBAC — roles, assignments, overrides',
    commands: [
      'list                                         All permission groups',
      'roles                                        List all roles',
      'roles get <name>                             Role detail + permissions',
      'roles create <name> --display "Name" --perms "p1,p2"',
      'roles edit <name> --add "perm" --remove "perm"',
      'assign <email> <role-name>                   Assign role to user',
      'unassign <email> <role-name>                 Remove role from user',
      'grant <email> <permission>                   Grant permission override',
      'deny <email> <permission>                    Deny permission override',
      'clear <email> <permission>                   Remove override',
      'check <email> <permission>                   Check: ALLOWED/DENIED',
      'seed                                         Seed built-in roles',
      'dump <email>                                 Dump all effective permissions',
    ],
  },
  'super-admin': {
    desc: 'Super admin management — grant, revoke, check',
    commands: [
      'list                                         List super admins',
      'grant <email> [--perms "p1,p2"]              Grant super admin',
      'revoke <email>                               Revoke super admin',
      'check <email>                                Check status + source',
    ],
  },
  tiers: {
    desc: 'Subscription tier management',
    commands: [
      'list                                         List all tiers',
      'get <name>                                   Full tier detail',
      'create <name> --display "Name" --price-monthly 29',
      'update <name> [--display] [--price-monthly]  Update tier',
      'toggle <name>                                Toggle active/inactive',
      'assign <team-slug> <tier-name>               Assign tier to team',
    ],
  },
}

export function showHelp(domain?: string) {
  if (domain && DOMAINS[domain]) {
    showDomainHelp(domain)
    return
  }

  console.log(`
${c.bold}${c.cyan}tenant${c.reset} — cncpt-tenant platform CLI

${c.bold}USAGE${c.reset}
  pnpm tenant <domain> <action> [args] [flags]

${c.bold}DOMAINS${c.reset}`)

  for (const [name, { desc }] of Object.entries(DOMAINS)) {
    console.log(`  ${c.bold}${name.padEnd(16)}${c.reset}${c.dim}${desc}${c.reset}`)
  }

  console.log(`
${c.bold}EXAMPLES${c.reset}
  ${c.dim}pnpm tenant users list${c.reset}
  ${c.dim}pnpm tenant users get admin@example.com${c.reset}
  ${c.dim}pnpm tenant subdomains auth my-site${c.reset}
  ${c.dim}pnpm tenant permissions check user@email pages.edit${c.reset}
  ${c.dim}pnpm tenant super-admin grant admin@example.com${c.reset}
  ${c.dim}pnpm tenant teams add-member my-team user@email --role admin${c.reset}

${c.bold}HELP${c.reset}
  pnpm tenant help              Full reference
  pnpm tenant help <domain>     Domain-specific help
  pnpm tenant <domain> --help   Same as above
`)
}

function showDomainHelp(domain: string) {
  const d = DOMAINS[domain]
  console.log(`
${c.bold}${c.cyan}tenant ${domain}${c.reset} ${c.dim}${sym.dash} ${d.desc}${c.reset}

${c.bold}COMMANDS${c.reset}`)

  for (const cmd of d.commands) {
    // Split command from description at multiple spaces
    const match = cmd.match(/^(.+?)\s{2,}(.+)$/)
    if (match) {
      console.log(`  ${c.bold}tenant ${domain} ${match[1].trim()}${c.reset}`)
      console.log(`    ${c.dim}${match[2].trim()}${c.reset}`)
    } else {
      console.log(`  ${c.bold}tenant ${domain} ${cmd.trim()}${c.reset}`)
    }
  }

  console.log()
}
