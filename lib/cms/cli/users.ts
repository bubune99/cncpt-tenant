/**
 * CMS CLI — Users Domain
 * Manage users, role assignments, and permission overrides
 */

import {
  prisma, c, sym, table, heading, success, error, warn, info,
  confirm, closeRL, formatDate, truncate,
} from "./utils"
import {
  getUserPermissions, checkPermission,
  assignRole, removeRole,
  grantPermission, denyPermission, removePermissionOverride,
} from "../permissions"

export async function handleUsers(action: string, args: string[], flags: Record<string, string | boolean>) {
  switch (action) {
    case "list": return usersList()
    case "get": return usersGet(args[0])
    case "create": return usersCreate(args[0], flags)
    case "assign-role": return usersAssignRole(args[0], args[1])
    case "remove-role": return usersRemoveRole(args[0], args[1])
    case "grant": return usersGrant(args[0], args[1])
    case "deny": return usersDeny(args[0], args[1])
    case "clear-override": return usersClearOverride(args[0], args[1])
    default:
      error(`Unknown users action: ${action}`)
      info(`Run ${c.cyan("cms help users")} for available commands.`)
  }
}

// ── helpers ─────────────────────────────────────────────────────────

async function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
    include: {
      roleAssignments: { include: { role: true } },
      permissions: true,
    },
  })
}

// ── list ────────────────────────────────────────────────────────────

async function usersList() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      roleAssignments: { include: { role: { select: { displayName: true, name: true } } } },
    },
  })

  heading("Users")

  const rows = users.map((u) => {
    const roles = u.roleAssignments.map((ra) => ra.role.displayName).join(", ")
    return {
      email: c.cyan(u.email),
      name: u.name || c.dim("—"),
      legacyRole: c.dim(u.role),
      rbacRoles: roles || c.dim("none"),
      created: formatDate(u.createdAt),
    }
  })

  console.log(table(
    [
      { key: "email", label: "Email" },
      { key: "name", label: "Name" },
      { key: "rbacRoles", label: "Roles" },
      { key: "legacyRole", label: "Legacy" },
      { key: "created", label: "Created" },
    ],
    rows,
  ))

  console.log(c.dim(`\n  ${users.length} user(s)\n`))
}

// ── get ─────────────────────────────────────────────────────────────

async function usersGet(email: string) {
  if (!email) { error("Usage: cms users get <email>"); return }

  const user = await findUserByEmail(email)
  if (!user) { error(`User not found: ${email}`); return }

  const perms = await getUserPermissions(user.id)

  heading(`User: ${user.name || user.email}`)
  console.log(`  ${c.bold("ID:")}         ${c.dim(user.id)}`)
  console.log(`  ${c.bold("Email:")}      ${c.cyan(user.email)}`)
  console.log(`  ${c.bold("Name:")}       ${user.name || c.dim("not set")}`)
  console.log(`  ${c.bold("Legacy Role:")} ${user.role}`)
  console.log(`  ${c.bold("Stack Auth:")} ${user.stackAuthId || c.dim("not linked")}`)
  console.log(`  ${c.bold("Created:")}    ${formatDate(user.createdAt)}`)

  // Roles
  console.log(`\n  ${c.bold("RBAC Roles:")}`)
  if (user.roleAssignments.length === 0) {
    console.log(`    ${c.dim("No roles assigned")}`)
  } else {
    for (const ra of user.roleAssignments) {
      const roleName = ra.role.name
      const displayName = ra.role.displayName
      console.log(`    ${sym.arrow} ${c.green(displayName)} ${c.dim(`(${roleName})`)}`)
    }
  }

  // Permission overrides
  if (user.permissions.length > 0) {
    console.log(`\n  ${c.bold("Permission Overrides:")}`)
    for (const p of user.permissions) {
      const typeColor = p.type === "GRANT" ? c.green : c.red
      const expiry = p.expiresAt ? c.dim(` expires ${formatDate(p.expiresAt)}`) : ""
      const reason = p.reason ? c.dim(` — ${p.reason}`) : ""
      console.log(`    ${typeColor(p.type.padEnd(5))} ${c.cyan(p.permission)}${expiry}${reason}`)
    }
  }

  // Effective permissions
  if (perms) {
    const permList = [...perms.permissions].sort()
    console.log(`\n  ${c.bold("Effective Permissions:")} ${c.dim(`(${permList.length})`)}`)
    if (permList.includes("*")) {
      console.log(`    ${c.green("★ SUPER ADMIN — all permissions")}`)
    } else {
      for (const p of permList) {
        console.log(`    ${c.dim("•")} ${p}`)
      }
    }
  }

  console.log()
}

// ── create ──────────────────────────────────────────────────────────

async function usersCreate(email: string, flags: Record<string, string | boolean>) {
  if (!email) { error("Usage: cms users create <email> --name \"Name\" --role <role-name>"); return }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) { error(`User already exists: ${email}`); return }

  const name = typeof flags.name === "string" ? flags.name : null

  const user = await prisma.user.create({
    data: {
      email,
      name,
      role: "VIEWER",
    },
  })

  success(`Created user: ${c.cyan(email)}`)
  info(`ID: ${c.dim(user.id)}`)

  // Assign role if provided
  if (typeof flags.role === "string") {
    const role = await prisma.role.findFirst({ where: { name: flags.role } })
    if (role) {
      await assignRole({ userId: user.id, roleId: role.id })
      success(`Assigned role: ${c.green(role.displayName)}`)
    } else {
      warn(`Role not found: ${flags.role}. User created without RBAC role.`)
    }
  }
}

// ── assign-role ─────────────────────────────────────────────────────

async function usersAssignRole(email: string, roleName: string) {
  if (!email || !roleName) { error("Usage: cms users assign-role <email> <role-name>"); return }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) { error(`User not found: ${email}`); return }

  const role = await prisma.role.findFirst({ where: { name: roleName } })
  if (!role) { error(`Role not found: ${roleName}`); return }

  // Check if already assigned
  const existing = await prisma.roleAssignment.findUnique({
    where: { userId_roleId: { userId: user.id, roleId: role.id } },
  })
  if (existing) { info(`User already has role: ${role.displayName}`); return }

  await assignRole({ userId: user.id, roleId: role.id })
  success(`Assigned ${c.green(role.displayName)} to ${c.cyan(email)}`)
}

// ── remove-role ─────────────────────────────────────────────────────

async function usersRemoveRole(email: string, roleName: string) {
  if (!email || !roleName) { error("Usage: cms users remove-role <email> <role-name>"); return }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) { error(`User not found: ${email}`); return }

  const role = await prisma.role.findFirst({ where: { name: roleName } })
  if (!role) { error(`Role not found: ${roleName}`); return }

  try {
    await removeRole({ userId: user.id, roleId: role.id })
    success(`Removed ${c.green(role.displayName)} from ${c.cyan(email)}`)
  } catch {
    error(`User does not have role: ${roleName}`)
  }
}

// ── grant ───────────────────────────────────────────────────────────

async function usersGrant(email: string, permission: string) {
  if (!email || !permission) { error("Usage: cms users grant <email> <permission>"); return }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) { error(`User not found: ${email}`); return }

  await grantPermission({ userId: user.id, permission })
  success(`Granted ${c.cyan(permission)} to ${c.cyan(email)}`)
}

// ── deny ────────────────────────────────────────────────────────────

async function usersDeny(email: string, permission: string) {
  if (!email || !permission) { error("Usage: cms users deny <email> <permission>"); return }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) { error(`User not found: ${email}`); return }

  await denyPermission({ userId: user.id, permission })
  success(`Denied ${c.cyan(permission)} for ${c.cyan(email)}`)
}

// ── clear-override ──────────────────────────────────────────────────

async function usersClearOverride(email: string, permission: string) {
  if (!email || !permission) { error("Usage: cms users clear-override <email> <permission>"); return }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) { error(`User not found: ${email}`); return }

  await removePermissionOverride({ userId: user.id, permission })
  success(`Cleared override ${c.cyan(permission)} for ${c.cyan(email)}`)
}
