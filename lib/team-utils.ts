// Client-safe team utilities
// These functions can be used in both client and server components

export type TeamRole = "owner" | "admin" | "member" | "viewer"

/**
 * Default permissions for each team role
 */
export const TEAM_PERMISSIONS: Record<TeamRole, string[]> = {
  owner: ["*"],
  admin: [
    "team.view",
    "team.edit",
    "members.view",
    "members.invite",
    "members.remove",
    "members.edit_role",
    "invitations.view",
    "invitations.create",
    "invitations.cancel",
    "settings.view",
    "settings.edit",
    "subdomains.view",
    "subdomains.add",
    "subdomains.remove",
    "subdomains.edit",
  ],
  member: [
    "team.view",
    "members.view",
    "invitations.view",
    "settings.view",
    "subdomains.view",
    "subdomains.edit",
  ],
  viewer: ["team.view", "members.view", "subdomains.view"],
}

/**
 * Permission descriptions for UI display
 */
export const PERMISSION_DESCRIPTIONS: Record<string, string> = {
  "*": "Full access to all team features",
  "team.view": "View team information",
  "team.edit": "Edit team details (name, description, logo)",
  "team.delete": "Delete the team",
  "members.view": "View team members",
  "members.invite": "Invite new members",
  "members.remove": "Remove members from team",
  "members.edit_role": "Change member roles",
  "invitations.view": "View pending invitations",
  "invitations.create": "Send invitations",
  "invitations.cancel": "Cancel pending invitations",
  "settings.view": "View team settings",
  "settings.edit": "Edit team settings",
  "subdomains.view": "View shared subdomains",
  "subdomains.add": "Share subdomains with team",
  "subdomains.remove": "Remove subdomains from team",
  "subdomains.edit": "Edit content on shared subdomains",
}

/**
 * Get all effective permissions for a role + custom permissions
 */
export function getEffectivePermissions(
  role: TeamRole,
  customPermissions: string[] = []
): string[] {
  const rolePermissions = TEAM_PERMISSIONS[role] || []
  const allPermissions = new Set([...rolePermissions, ...customPermissions])
  return Array.from(allPermissions)
}

/**
 * Check if a permission set includes a required permission
 */
export function hasTeamPermission(
  permissions: string[],
  requiredPermission: string
): boolean {
  if (permissions.includes("*")) return true
  if (permissions.includes(requiredPermission)) return true

  for (const perm of permissions) {
    if (perm.endsWith(".*")) {
      const prefix = perm.slice(0, -2)
      if (requiredPermission.startsWith(prefix + ".")) return true
    }
  }

  return false
}

/**
 * Check if a role can manage another role
 */
export function canManageRole(
  currentRole: TeamRole,
  targetRole: TeamRole
): boolean {
  const roleHierarchy: Record<TeamRole, number> = {
    owner: 3,
    admin: 2,
    member: 1,
    viewer: 0,
  }
  return roleHierarchy[currentRole] > roleHierarchy[targetRole]
}

/**
 * Get available roles that a user can assign based on their role
 */
export function getAssignableRoles(currentRole: TeamRole): TeamRole[] {
  switch (currentRole) {
    case "owner":
      return ["admin", "member", "viewer"]
    case "admin":
      return ["member", "viewer"]
    default:
      return []
  }
}

/**
 * Get human-readable role label
 */
export function getRoleLabel(role: TeamRole): string {
  switch (role) {
    case "owner":
      return "Owner"
    case "admin":
      return "Admin"
    case "member":
      return "Member"
    case "viewer":
      return "Viewer"
    default:
      return role
  }
}

/**
 * Get role description
 */
export function getRoleDescription(role: TeamRole): string {
  switch (role) {
    case "owner":
      return "Full control over the team, including deletion and ownership transfer"
    case "admin":
      return "Can manage members, invitations, and team settings"
    case "member":
      return "Can view and edit shared subdomains"
    case "viewer":
      return "Read-only access to team and shared subdomains"
    default:
      return ""
  }
}
