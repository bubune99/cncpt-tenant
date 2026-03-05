/**
 * Dashboard AI Tools - Index
 *
 * Exports all dashboard-specific tools for the AI chat agent.
 * Tools that require user context are exported as factory functions.
 */

// Factory function exports for user-context-aware tools
export { createSubdomainTools } from "./subdomain-tools"
export { createTeamTools } from "./team-tools"
export { createDomainTools } from "./domain-tools"
export { createBillingTools } from "./billing-tools"
export { createOnboardingTools } from "./onboarding-tools"
export { createWizardTools } from "./wizard-tools"

// Direct exports for context-free tools
export {
  navigateTo,
  explainFeature,
  suggestActions,
  getHelp,
  navigationTools,
} from "./navigation-tools"

// Docs tools (no user context needed)
export { createDocsTools } from "./docs-tools"

/**
 * Create all dashboard tools with user context
 * Use this in API routes to get all tools configured for a specific user
 */
export function createDashboardTools(userId: string) {
  // Import factory functions
  const { createSubdomainTools } = require("./subdomain-tools")
  const { createTeamTools } = require("./team-tools")
  const { createDomainTools } = require("./domain-tools")
  const { createBillingTools } = require("./billing-tools")
  const { createOnboardingTools } = require("./onboarding-tools")
  const { createWizardTools } = require("./wizard-tools")
  const { navigationTools } = require("./navigation-tools")
  const { createDocsTools } = require("./docs-tools")

  // Create tools with user context
  const subdomainTools = createSubdomainTools(userId)
  const teamTools = createTeamTools(userId)
  const domainTools = createDomainTools(userId)
  const billingTools = createBillingTools(userId)
  const onboardingTools = createOnboardingTools(userId)
  const wizardTools = createWizardTools()
  const docsTools = createDocsTools()

  return {
    // User-context tools
    ...subdomainTools,
    ...teamTools,
    ...domainTools,
    ...billingTools,
    ...onboardingTools,
    // Wizard tools (no user context needed)
    ...wizardTools,
    // Docs tools (no user context needed)
    ...docsTools,
    // Navigation tools (no user context needed)
    ...navigationTools,
  }
}

/**
 * Get list of all available dashboard tool names
 */
export function getDashboardToolList() {
  return [
    // Subdomain tools
    "listSubdomains",
    "getSubdomainDetails",
    "searchSubdomains",
    "getSubdomainStats",
    // Team tools
    "listTeams",
    "getTeamDetails",
    "listTeamMembers",
    "getTeamInvitations",
    "checkTeamAccess",
    // Domain tools
    "listDomains",
    "getDomainStatus",
    "troubleshootDomain",
    "getDnsInstructions",
    // Billing tools
    "getBillingStatus",
    "getUsageStats",
    "comparePlans",
    "explainBilling",
    // Onboarding tools
    "getOnboardingStatus",
    "completeOnboardingStep",
    "suggestNextStep",
    // Wizard tools
    "generateInlineWizard",
    "saveWizardAsTour",
    "suggestWalkthroughs",
    "startWalkthrough",
    "listTours",
    // Docs tools
    "searchDocs",
    // Navigation tools
    "navigateTo",
    "explainFeature",
    "suggestActions",
    "getHelp",
  ]
}
