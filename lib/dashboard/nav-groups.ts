/**
 * The workspace sidebar's seven places. A place either opens one section, or holds entries shown under it
 * while it is open. Icons are added in app/dashboard/canvas/nav-config.tsx.
 * Check: lib/dashboard/nav-groups.assert.ts
 */

export interface NavEntryDef { id: string; label: string; section: string }
export interface NavGroupDef { id: string; label: string; section: string; items: NavEntryDef[] }

export const NAV_GROUPS: NavGroupDef[] = [
  { id: "overview", label: "Overview", section: "overview", items: [] },
  {
    id: "sites", label: "Client sites", section: "sites", items: [
      { id: "subdomains", label: "All sites", section: "sites" },
      { id: "branding", label: "Branding", section: "branding" },
      { id: "domains", label: "Custom domains", section: "domains" },
      { id: "frontend", label: "Hosting", section: "frontend" },
      { id: "visibility", label: "Visibility", section: "visibility" },
    ],
  },
  { id: "analytics", label: "Analytics", section: "analytics", items: [] },
  {
    id: "team", label: "Team", section: "team", items: [
      { id: "members", label: "Members", section: "team" },
      { id: "roles", label: "Roles & permissions", section: "team-roles" },
      { id: "activity", label: "Activity log", section: "team-activity" },
    ],
  },
  {
    id: "inbox", label: "Inbox", section: "comms", items: [
      { id: "tickets", label: "Support", section: "comms" },
      { id: "announce", label: "Announcements", section: "comms-announce" },
      { id: "campaigns", label: "Email campaigns", section: "comms-campaigns" },
      { id: "team-chat", label: "Team messages", section: "comms-team-chat" },
      { id: "feedback", label: "Feedback board", section: "comms-feedback" },
    ],
  },
  {
    id: "billing", label: "Billing & credits", section: "billing", items: [
      { id: "billing", label: "Billing & plan", section: "billing" },
      { id: "credits", label: "AI credits", section: "credits" },
    ],
  },
  {
    id: "settings", label: "Settings", section: "settings", items: [
      { id: "settings", label: "Workspace settings", section: "settings" },
      { id: "mcp", label: "MCP / AI agents", section: "mcp" },
    ],
  },
]

export function groupOfSection(section: string): string {
  for (const g of NAV_GROUPS) {
    if (g.section === section || g.items.some((i) => i.section === section)) return g.id
  }
  return "overview"
}

export function firstSection(groupId: string): string {
  const g = NAV_GROUPS.find((x) => x.id === groupId)
  return g ? g.items[0]?.section ?? g.section : "overview"
}
