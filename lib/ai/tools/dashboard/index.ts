/**
 * Dashboard AI Tools - Index
 *
 * Exports all dashboard-specific tools for the AI chat agent.
 */

import { subdomainTools } from "./subdomain-tools"
import { teamTools } from "./team-tools"
import { domainTools } from "./domain-tools"
import { billingTools } from "./billing-tools"
import { navigationTools } from "./navigation-tools"

// Re-export individual tool groups
export { subdomainTools } from "./subdomain-tools"
export { teamTools } from "./team-tools"
export { domainTools } from "./domain-tools"
export { billingTools } from "./billing-tools"
export { navigationTools } from "./navigation-tools"

// Re-export individual tools
export {
  listSubdomains,
  getSubdomainDetails,
  searchSubdomains,
  getSubdomainStats,
} from "./subdomain-tools"

export {
  listTeams,
  getTeamDetails,
  listTeamMembers,
  getTeamInvitations,
  checkTeamAccess,
} from "./team-tools"

export {
  listDomains,
  getDomainStatus,
  troubleshootDomain,
  getDnsInstructions,
} from "./domain-tools"

export {
  getBillingStatus,
  getUsageStats,
  comparePlans,
  explainBilling,
} from "./billing-tools"

export {
  navigateTo,
  explainFeature,
  suggestActions,
  getHelp,
} from "./navigation-tools"

/**
 * Combined dashboard tools object for easy registration with streamText
 */
export const dashboardTools = {
  ...subdomainTools,
  ...teamTools,
  ...domainTools,
  ...billingTools,
  ...navigationTools,
}

/**
 * Get all dashboard tools as an array for inspection
 */
export function getDashboardToolList() {
  return Object.keys(dashboardTools)
}
