/**
 * CMS CLI — Permissions Domain
 * List all permission groups and check user access
 */

import { prisma, c, sym, heading, success, error, info } from "./utils"
import { PERMISSION_GROUPS } from "../permissions/constants"
import { getUserPermissions, checkPermission } from "../permissions"

export async function handlePermissions(action: string, args: string[], flags: Record<string, string | boolean>) {
  switch (action) {
    case "list": return permissionsList()
    case "check": return permissionsCheck(args[0], args[1])
    default:
      error(`Unknown permissions action: ${action}`)
      info(`Run ${c.cyan("cms help permissions")} for available commands.`)
  }
}

// ── list ────────────────────────────────────────────────────────────

async function permissionsList() {
  heading("Permission Groups")

  let total = 0

  for (const [groupKey, group] of Object.entries(PERMISSION_GROUPS)) {
    console.log(`\n  ${c.bold(c.magenta(group.label))} ${c.dim(`(${groupKey})`)}`)

    for (const perm of group.permissions) {
      console.log(`    ${c.cyan(perm.key.padEnd(25))} ${c.dim(perm.label)}`)
      total++
    }
  }

  console.log(c.dim(`\n  ${total} permissions across ${Object.keys(PERMISSION_GROUPS).length} groups`))
  console.log(c.dim(`  Use ${c.cyan("cms permissions check <email> <perm>")} to test access\n`))
}

// ── check ───────────────────────────────────────────────────────────

async function permissionsCheck(email: string, permission: string) {
  if (!email || !permission) {
    error("Usage: cms permissions check <email> <permission>")
    return
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) { error(`User not found: ${email}`); return }

  const userPerms = await getUserPermissions(user.id)
  if (!userPerms) { error(`Could not load permissions for: ${email}`); return }

  const result = checkPermission(userPerms, permission)

  heading(`Permission Check`)
  console.log(`  ${c.bold("User:")}       ${c.cyan(email)}`)
  console.log(`  ${c.bold("Permission:")} ${c.cyan(permission)}`)
  console.log()

  if (result.allowed) {
    console.log(`  ${sym.check} ${c.green("ALLOWED")}`)

    if (result.source) {
      switch (result.source.type) {
        case "super_admin":
          console.log(`  ${c.dim("Source: Super Admin (*)")}`)
          break
        case "role":
          console.log(`  ${c.dim(`Source: Role "${result.source.name}"`)}`)
          break
        case "override":
          console.log(`  ${c.dim(`Source: GRANT override (${result.source.id})`)}`)
          break
      }
    }
  } else {
    console.log(`  ${sym.cross} ${c.red("DENIED")}`)
    if (result.reason) {
      console.log(`  ${c.dim(`Reason: ${result.reason}`)}`)
    }
    if (result.source?.type === "override") {
      console.log(`  ${c.dim(`Source: DENY override (${result.source.id})`)}`)
    }
  }

  console.log()
}
