/**
 * CMS CLI — Roles Domain
 * Manage RBAC roles and their permission sets
 */

import {
  prisma, c, sym, table, heading, success, error, info, formatDate,
} from "./utils"
import { BUILT_IN_ROLES } from "../permissions/constants"

export async function handleRoles(action: string, args: string[], flags: Record<string, string | boolean>) {
  switch (action) {
    case "list": return rolesList()
    case "get": return rolesGet(args[0])
    case "create": return rolesCreate(args[0], flags)
    case "edit": return rolesEdit(args[0], flags)
    default:
      error(`Unknown roles action: ${action}`)
      info(`Run ${c.cyan("cms help roles")} for available commands.`)
  }
}

// ── list ────────────────────────────────────────────────────────────

async function rolesList() {
  const roles = await prisma.role.findMany({
    orderBy: { position: "asc" },
    include: {
      _count: { select: { assignments: true } },
    },
  })

  heading("Roles")

  const rows = roles.map((r) => {
    const perms = r.permissions as string[]
    return {
      name: r.isSystem ? c.cyan(r.name) : r.name,
      display: r.displayName,
      system: r.isSystem ? c.green("YES") : c.dim("—"),
      permissions: String(perms.length),
      users: String(r._count.assignments),
      desc: r.description ? c.dim(r.description.slice(0, 40)) : "",
    }
  })

  console.log(table(
    [
      { key: "name", label: "Name" },
      { key: "display", label: "Display Name" },
      { key: "system", label: "System" },
      { key: "permissions", label: "Perms", align: "right" },
      { key: "users", label: "Users", align: "right" },
      { key: "desc", label: "Description" },
    ],
    rows,
  ))

  console.log(c.dim(`\n  ${roles.length} role(s)\n`))
}

// ── get ─────────────────────────────────────────────────────────────

async function rolesGet(name: string) {
  if (!name) { error("Usage: cms roles get <name>"); return }

  const role = await prisma.role.findUnique({
    where: { name },
    include: {
      assignments: { include: { user: { select: { email: true, name: true } } } },
    },
  })

  if (!role) { error(`Role not found: ${name}`); return }

  const perms = role.permissions as string[]

  heading(`Role: ${role.displayName}`)
  console.log(`  ${c.bold("Name:")}        ${role.name}`)
  console.log(`  ${c.bold("Display:")}     ${role.displayName}`)
  console.log(`  ${c.bold("System:")}      ${role.isSystem ? c.green("YES") : "No"}`)
  console.log(`  ${c.bold("Description:")} ${role.description || c.dim("none")}`)
  console.log(`  ${c.bold("Position:")}    ${role.position}`)

  // Permissions
  console.log(`\n  ${c.bold("Permissions:")} ${c.dim(`(${perms.length})`)}`)
  if (perms.includes("*")) {
    console.log(`    ${c.green("★ ALL PERMISSIONS (*)")}`)
  } else {
    for (const p of perms.sort()) {
      console.log(`    ${c.dim("•")} ${p}`)
    }
  }

  // Users with this role
  if (role.assignments.length > 0) {
    console.log(`\n  ${c.bold("Users:")} ${c.dim(`(${role.assignments.length})`)}`)
    for (const a of role.assignments) {
      console.log(`    ${sym.arrow} ${c.cyan(a.user.email)} ${a.user.name ? c.dim(`(${a.user.name})`) : ""}`)
    }
  }

  console.log()
}

// ── create ──────────────────────────────────────────────────────────

async function rolesCreate(name: string, flags: Record<string, string | boolean>) {
  if (!name) { error("Usage: cms roles create <name> --permissions perm1 perm2 ..."); return }

  const existing = await prisma.role.findUnique({ where: { name } })
  if (existing) { error(`Role already exists: ${name}`); return }

  const permsStr = typeof flags.permissions === "string" ? flags.permissions : ""
  const permissions = permsStr.split(/[,\s]+/).filter(Boolean)

  const displayName = typeof flags.display === "string"
    ? flags.display
    : name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())

  const description = typeof flags.description === "string" ? flags.description : null

  // Get max position
  const maxPos = await prisma.role.aggregate({ _max: { position: true } })
  const position = (maxPos._max.position ?? 0) + 1

  const role = await prisma.role.create({
    data: {
      name,
      displayName,
      description,
      permissions: permissions,
      position,
    },
  })

  success(`Created role: ${c.green(role.displayName)}`)
  info(`Permissions: ${permissions.length > 0 ? permissions.join(", ") : c.dim("none (add with roles edit)")}`)
}

// ── edit ─────────────────────────────────────────────────────────────

async function rolesEdit(name: string, flags: Record<string, string | boolean>) {
  if (!name) { error("Usage: cms roles edit <name> --add-perm <perm> --remove-perm <perm>"); return }

  const role = await prisma.role.findUnique({ where: { name } })
  if (!role) { error(`Role not found: ${name}`); return }

  if (role.isSystem) {
    error("Cannot edit system roles. Use permission overrides on users instead.")
    return
  }

  const perms = new Set(role.permissions as string[])
  const changes: string[] = []

  // Add permissions
  if (typeof flags["add-perm"] === "string") {
    const toAdd = flags["add-perm"].split(/[,\s]+/).filter(Boolean)
    for (const p of toAdd) {
      if (!perms.has(p)) {
        perms.add(p)
        changes.push(`${c.green("+")} ${p}`)
      }
    }
  }

  // Remove permissions
  if (typeof flags["remove-perm"] === "string") {
    const toRemove = flags["remove-perm"].split(/[,\s]+/).filter(Boolean)
    for (const p of toRemove) {
      if (perms.has(p)) {
        perms.delete(p)
        changes.push(`${c.red("−")} ${p}`)
      }
    }
  }

  // Update display name
  if (typeof flags.display === "string") {
    changes.push(`display → "${flags.display}"`)
  }

  if (changes.length === 0) {
    error("No changes. Use --add-perm, --remove-perm, or --display")
    return
  }

  await prisma.role.update({
    where: { name },
    data: {
      permissions: [...perms],
      ...(typeof flags.display === "string" ? { displayName: flags.display } : {}),
    },
  })

  success(`Updated role "${role.displayName}":`)
  for (const change of changes) {
    console.log(`  ${change}`)
  }
}
