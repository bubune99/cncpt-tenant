# tenant CLI Guide

Platform management CLI for cncpt-tenant. Goes directly to the database via Prisma + raw SQL — no HTTP/auth layer needed.

## Setup

Requires `DATABASE_URL` in `.env`. Auth is by having direct DB access.

```bash
pnpm tenant help              # Full command reference
pnpm tenant help <domain>     # Domain-specific help
```

## Domains

### Users

```bash
pnpm tenant users list                                 # Table: email, name, role, stackAuthId, created
pnpm tenant users list --role ADMIN                    # Filter by UserRole enum
pnpm tenant users get <email>                          # Full detail: roles, permissions, teams, subdomains
pnpm tenant users create <email> --name "John"         # Create user record
pnpm tenant users create <email> --name "John" --role ADMIN
pnpm tenant users update <email> --name "New Name"     # Update fields
pnpm tenant users update <email> --role EDITOR         # Change base role
pnpm tenant users delete <email>                       # Delete with confirmation + cascade warning
pnpm tenant users search <query>                       # Search by email, name (partial match)
pnpm tenant users setup <email>                        # Interactive wizard: create → roles → team → subdomain
```

### Subdomains

```bash
pnpm tenant subdomains list                            # Table: subdomain, owner, maintenance, created
pnpm tenant subdomains list --owner <email>            # Filter by owner
pnpm tenant subdomains get <subdomain>                 # Full detail: owner, teams, auth config, content counts
pnpm tenant subdomains create <name> --owner <email>
pnpm tenant subdomains delete <subdomain>              # Delete with confirmation
pnpm tenant subdomains assign <subdomain> <email>      # Transfer ownership
pnpm tenant subdomains maintenance <subdomain> on      # Enable maintenance mode
pnpm tenant subdomains maintenance <subdomain> off     # Disable
pnpm tenant subdomains maintenance <subdomain> on --msg "Back soon"
pnpm tenant subdomains auth <subdomain>                # Show auth config
pnpm tenant subdomains auth <subdomain> --set-project <id> --set-key <key> --set-secret <secret>
pnpm tenant subdomains auth <subdomain> --enable-social --enable-magic-link --disable-password
pnpm tenant subdomains share <subdomain> <team-slug> --level edit
pnpm tenant subdomains unshare <subdomain> <team-slug>
pnpm tenant subdomains stats <subdomain>               # Content counts
```

### Teams

```bash
pnpm tenant teams list                                 # Table: name, slug, owner, members, tier, subdomains
pnpm tenant teams get <slug>                           # Full detail: members, invitations, subdomains, tier
pnpm tenant teams create <name> --owner <email>        # Create team
pnpm tenant teams delete <slug>                        # Soft delete with confirmation
pnpm tenant teams add-member <slug> <email> --role admin
pnpm tenant teams remove-member <slug> <email>
pnpm tenant teams set-role <slug> <email> <role>       # owner/admin/member/viewer
pnpm tenant teams invite <slug> <email> --role member  # Create invitation (7-day expiry)
pnpm tenant teams invitations <slug>                   # List pending invitations
pnpm tenant teams cancel-invite <slug> <email>         # Cancel invitation
```

### Permissions (CMS RBAC)

```bash
pnpm tenant permissions list                           # All permission groups + keys
pnpm tenant permissions roles                          # Table: name, displayName, system, permissions, users
pnpm tenant permissions roles get <name>               # Full role detail + all permissions
pnpm tenant permissions roles create <name> --display "My Role" --perms "products.*,orders.view"
pnpm tenant permissions roles edit <name> --add "blog.edit" --remove "blog.delete"
pnpm tenant permissions assign <email> <role-name>     # Assign role to user
pnpm tenant permissions unassign <email> <role-name>   # Remove role from user
pnpm tenant permissions grant <email> <permission>     # Grant permission override
pnpm tenant permissions deny <email> <permission>      # Deny permission override
pnpm tenant permissions clear <email> <permission>     # Remove override
pnpm tenant permissions check <email> <permission>     # Test: ALLOWED/DENIED with source
pnpm tenant permissions check <email> <permission> --team <slug>  # Include team-level check
pnpm tenant permissions seed                           # Seed built-in roles
pnpm tenant permissions dump <email>                   # Dump ALL effective permissions (CMS + team)
```

### Super Admin

```bash
pnpm tenant super-admin list                           # Table: email, grantedBy, grantedAt, permissions
pnpm tenant super-admin grant <email>                  # Grant super admin (ALL permissions)
pnpm tenant super-admin grant <email> --perms "users.*,teams.*"  # Limited permissions
pnpm tenant super-admin revoke <email>                 # Revoke (soft revoke)
pnpm tenant super-admin check <email>                  # Check: DB source vs env source
```

### Tiers

```bash
pnpm tenant tiers list                                 # Table: name, price, active, teams
pnpm tenant tiers get <name>                           # Full detail: limits, features, Stripe IDs
pnpm tenant tiers create <name> --display "Pro" --price-monthly 29
pnpm tenant tiers update <name> --price-monthly 39     # Update fields
pnpm tenant tiers toggle <name>                        # Toggle active/inactive
pnpm tenant tiers assign <team-slug> <tier-name>       # Assign tier to team
```

## Architecture

### Database Access
- **Prisma** (`lib/cms/db`) for ORM models: User, Role, RoleAssignment, UserPermission, Subdomain, Team, TeamMember, TeamInvitation, TeamSubdomain, SubscriptionTier
- **Raw SQL** (`lib/neon.ts` → `sql`) for non-Prisma tables: `subdomain_auth_config`, `super_admins`, `platform_activity_log`

### Files
```
scripts/tenant.ts           # Entry point, arg parser, domain router
lib/cli/utils.ts            # Colors, table, prompts, arg parser, user lookup
lib/cli/help.ts             # Help text system
lib/cli/users.ts            # User CRUD + setup wizard
lib/cli/subdomains.ts       # Subdomain CRUD + auth config + sharing
lib/cli/teams.ts            # Team management + members + invitations
lib/cli/permissions.ts      # CMS RBAC roles, assignments, overrides
lib/cli/super-admin.ts      # Super admin grant/revoke/check
lib/cli/tiers.ts            # Subscription tier management
```

### Reused Modules
- `lib/cms/permissions/` — RBAC functions (getUserPermissions, hasPermission, assignRole, etc.)
- `lib/cms/permissions/constants.ts` — PERMISSIONS, PERMISSION_GROUPS, BUILT_IN_ROLES
- `lib/team-utils.ts` — Team permissions (TEAM_PERMISSIONS, hasTeamPermission, getEffectivePermissions)

### Tenant Context
Platform-level models (Subdomain, Team, SuperAdmin) have no tenantId and work directly. Tenant-scoped models (User, Page, Product) use `runAsSuperAdmin()` or `runWithTenant()` to bypass/set tenant context.

## Debugging

```bash
DEBUG=1 pnpm tenant users list    # Show full stack traces on error
```
