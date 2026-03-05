/**
 * CMS CLI Help System
 * Command registry and formatted help output
 */

import { c, sym } from "./utils"

interface CommandDef {
  usage: string
  description: string
  flags?: string[]
}

interface DomainDef {
  label: string
  description: string
  commands: CommandDef[]
}

const DOMAINS: Record<string, DomainDef> = {
  pages: {
    label: "Pages",
    description: "Create, edit, publish, and export CMS pages",
    commands: [
      { usage: "pages list", description: "List all pages", flags: ["--status <DRAFT|PUBLISHED|ARCHIVED>"] },
      { usage: "pages get <slug>", description: "Show page detail + block tree outline" },
      { usage: "pages create <slug> --title \"Title\"", description: "Create empty page" },
      { usage: "pages create <slug> --from ./file.tsx", description: "Create page from JSX file" },
      { usage: "pages create <slug> --jsx '<div>...</div>'", description: "Create page from inline JSX" },
      { usage: "pages create <slug> --stdin", description: "Create page from piped/heredoc JSX" },
      { usage: "pages delete <slug>", description: "Delete a page (with confirmation)" },
      { usage: "pages publish <slug>", description: "Set status to PUBLISHED" },
      { usage: "pages unpublish <slug>", description: "Set status to DRAFT" },
      { usage: "pages set-slug <old> <new>", description: "Rename page slug" },
      { usage: "pages set-layout <slug>", description: "Set header/footer mode", flags: ["--header <GLOBAL|CUSTOM|NONE>", "--footer <GLOBAL|CUSTOM|NONE>"] },
      { usage: "pages export <slug>", description: "Export to JSX", flags: ["-o <path>"] },
    ],
  },
  partials: {
    label: "Partials",
    description: "Manage reusable block compositions (headers, footers, sections)",
    commands: [
      { usage: "partials list", description: "List all partials", flags: ["--category <HEADER|FOOTER|...>"] },
      { usage: "partials get <slug>", description: "Show partial detail + blocks" },
      { usage: "partials create <slug> --name \"Name\" --category HEADER", description: "Create partial" },
      { usage: "partials create <slug> --from ./file.tsx --category SECTION", description: "Create from JSX file" },
      { usage: "partials delete <slug>", description: "Delete a partial" },
      { usage: "partials set-default <slug>", description: "Make default for its category" },
    ],
  },
  blocks: {
    label: "Blocks",
    description: "Add, remove, and edit block templates on pages",
    commands: [
      { usage: "blocks list-templates", description: "Show all block templates", flags: ["--category <name>"] },
      { usage: "blocks add <page-slug> <template-label>", description: "Append template block", flags: ["--at <position>"] },
      { usage: "blocks add <page-slug> --from ./section.tsx", description: "Add blocks from JSX file" },
      { usage: "blocks add <page-slug> --jsx '<div>...</div>'", description: "Add blocks from inline JSX" },
      { usage: "blocks add <page-slug> --stdin", description: "Add blocks from piped/heredoc JSX" },
      { usage: "blocks add <page-slug> --partial <partial-slug>", description: "Add partial reference" },
      { usage: "blocks remove <page-slug> <block-id>", description: "Remove block by ID" },
      { usage: "blocks tree <page-slug>", description: "Print block tree" },
      { usage: "blocks set <page-slug> <block-id>", description: "Update block properties", flags: ["--text \"content\"", "--class \"tailwind classes\"", "--attr key=value"] },
    ],
  },
  routes: {
    label: "Routes & Links",
    description: "Manage page routing and scan/fix internal links",
    commands: [
      { usage: "routes list", description: "All page slugs with status" },
      { usage: "routes set <slug> <new-slug>", description: "Rename slug (alias for pages set-slug)" },
      { usage: "routes tree", description: "Show parent->child hierarchy" },
      { usage: "links scan <page-slug>", description: "Scan page for all href attributes" },
      { usage: "links set <page-slug> <block-id> --href /new", description: "Update href on a block" },
      { usage: "links check", description: "Find broken internal links" },
    ],
  },
  users: {
    label: "Users",
    description: "Manage users, role assignments, and permission overrides",
    commands: [
      { usage: "users list", description: "List all users with roles" },
      { usage: "users get <email>", description: "Full detail: roles, permissions, overrides" },
      { usage: "users create <email> --name \"Name\" --role <role>", description: "Create user and assign role" },
      { usage: "users assign-role <email> <role-name>", description: "Assign role to user" },
      { usage: "users remove-role <email> <role-name>", description: "Remove role from user" },
      { usage: "users grant <email> <permission>", description: "Grant permission override" },
      { usage: "users deny <email> <permission>", description: "Deny permission override" },
      { usage: "users clear-override <email> <permission>", description: "Remove permission override" },
    ],
  },
  roles: {
    label: "Roles",
    description: "Manage RBAC roles and their permission sets",
    commands: [
      { usage: "roles list", description: "List all roles with user counts" },
      { usage: "roles get <name>", description: "Show role detail + permissions" },
      { usage: "roles create <name> --permissions perm1 perm2 ...", description: "Create custom role" },
      { usage: "roles edit <name>", description: "Edit role permissions", flags: ["--add-perm <perm>", "--remove-perm <perm>"] },
    ],
  },
  permissions: {
    label: "Permissions",
    description: "List permission groups and check user access",
    commands: [
      { usage: "permissions list", description: "Show all permission groups and keys" },
      { usage: "permissions check <email> <permission>", description: "Test if user has specific permission" },
    ],
  },
}

export function printHelp(domain?: string) {
  if (domain && DOMAINS[domain]) {
    printDomainHelp(domain)
    return
  }

  // Check for combined domains like "links"
  if (domain === "links") {
    printDomainHelp("routes")
    return
  }

  if (domain) {
    console.log(`${sym.cross} Unknown domain: ${c.red(domain)}`)
    console.log(`Run ${c.cyan("cms help")} for a list of all commands.\n`)
    return
  }

  // Full help
  console.log(`\n${c.bold("CMS CLI")} — Manage CMS content from the terminal\n`)
  console.log(`${c.bold("USAGE")}`)
  console.log(`  ${c.cyan("cms")} <domain> <action> [args] [flags]\n`)
  console.log(`${c.bold("GLOBAL FLAGS")}`)
  console.log(`  ${c.yellow("--tenant <subdomain>")}  Scope commands to a specific tenant\n`)
  console.log(`${c.bold("DOMAINS")}`)

  for (const [key, def] of Object.entries(DOMAINS)) {
    console.log(`  ${c.cyan(key.padEnd(14))} ${c.dim(def.description)}`)
  }

  console.log(`\n${c.bold("EXAMPLES")}`)
  console.log(`  ${c.dim("$")} cms pages list --status PUBLISHED`)
  console.log(`  ${c.dim("$")} cms pages create about --title "About Us"`)
  console.log(`  ${c.dim("$")} cms pages create hero --jsx '<section className="py-24"><h1 className="text-5xl font-bold">Hello</h1></section>'`)
  console.log(`  ${c.dim("$")} cms blocks add about "Section"`)
  console.log(`  ${c.dim("$")} cms blocks tree about`)
  console.log(`  ${c.dim("$")} cms users get admin@example.com`)
  console.log(`  ${c.dim("$")} cms permissions check admin@example.com pages.edit`)
  console.log(`  ${c.dim("$")} cms links check`)
  console.log(`  ${c.dim("$")} cms --tenant my-site pages list`)

  console.log(`\n${c.bold("MORE HELP")}`)
  console.log(`  ${c.dim("$")} cms help <domain>     ${c.dim("# Show commands for a domain")}`)
  console.log(`  ${c.dim("$")} cms help pages`)
  console.log(`  ${c.dim("$")} cms help blocks\n`)
}

function printDomainHelp(domain: string) {
  const def = DOMAINS[domain]
  if (!def) return

  console.log(`\n${c.bold(def.label)} — ${def.description}\n`)
  console.log(`${c.bold("COMMANDS")}\n`)

  for (const cmd of def.commands) {
    console.log(`  ${c.cyan(cmd.usage)}`)
    console.log(`    ${c.dim(cmd.description)}`)
    if (cmd.flags) {
      for (const flag of cmd.flags) {
        console.log(`    ${c.dim("flag:")} ${c.yellow(flag)}`)
      }
    }
    console.log()
  }
}
