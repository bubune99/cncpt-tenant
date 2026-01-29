/**
 * Dashboard AI Tools - Navigation & Help
 *
 * Tools for navigating the dashboard and explaining features.
 */

import { tool } from "ai"
import { z } from "zod"

// Dashboard page definitions
const DASHBOARD_PAGES = {
  overview: {
    path: "/dashboard",
    title: "Dashboard Overview",
    description: "Main dashboard with your subdomains and quick actions",
  },
  analytics: {
    path: "/dashboard/analytics",
    title: "Analytics",
    description: "View deployment statistics and trends",
  },
  visibility: {
    path: "/dashboard/visibility",
    title: "Site Visibility",
    description: "Control whether your site is public, private, or in maintenance mode",
  },
  domains: {
    path: "/dashboard/domains",
    title: "Custom Domains",
    description: "Add and manage custom domains for your subdomains",
  },
  settings: {
    path: "/dashboard/settings",
    title: "Site Settings",
    description: "Configure your site title, description, and general settings",
  },
  appearance: {
    path: "/dashboard/appearance",
    title: "Appearance",
    description: "Customize colors, fonts, and theme settings",
  },
  security: {
    path: "/dashboard/security",
    title: "Security",
    description: "Configure password protection and security headers",
  },
  hosting: {
    path: "/dashboard/frontend",
    title: "Hosting",
    description: "Manage VPS deployments and hosting configuration",
  },
  teams: {
    path: "/dashboard/teams",
    title: "Teams",
    description: "Create and manage teams for collaboration",
  },
  billing: {
    path: "/dashboard/billing",
    title: "Billing",
    description: "View your subscription plan, usage, and manage payments",
  },
}

// Feature explanations
const FEATURE_EXPLANATIONS = {
  subdomain: {
    title: "Subdomains",
    description:
      "Subdomains are your individual sites on the platform. Each subdomain (like 'mysite.cncpt.io') can have its own content, settings, and custom domains.",
    howToUse: [
      "Create a new subdomain from the dashboard overview",
      "Choose an emoji and name for your subdomain",
      "Access the CMS to add content",
      "Optionally add custom domains",
    ],
  },
  customDomain: {
    title: "Custom Domains",
    description:
      "Custom domains let you use your own domain name (like 'mysite.com') instead of the default subdomain URL.",
    howToUse: [
      "Go to Custom Domains in the dashboard",
      "Click 'Add Domain' and enter your domain",
      "Configure DNS records at your domain registrar",
      "Click 'Verify' once DNS is configured",
    ],
  },
  team: {
    title: "Teams",
    description:
      "Teams allow you to collaborate with others on your subdomains. Team members can have different roles with different permissions.",
    howToUse: [
      "Create a team from the Teams page",
      "Invite members via email",
      "Share subdomains with the team",
      "Set access levels (view, edit, admin) for each subdomain",
    ],
    roles: {
      owner: "Full control, can delete team",
      admin: "Can manage members and settings",
      member: "Can edit shared subdomains",
      viewer: "Read-only access",
    },
  },
  visibility: {
    title: "Site Visibility",
    description:
      "Control who can access your site. You can make it public, private (password-protected), or put it in maintenance mode.",
    options: {
      public: "Anyone can view your site",
      private: "Only people with the password can view",
      maintenance: "Shows a maintenance page to visitors",
    },
  },
  cms: {
    title: "Content Management (CMS)",
    description:
      "The CMS is where you create and manage your site's content including pages, blog posts, products, and more.",
    howToUse: [
      "Click 'Manage' on any subdomain to open the CMS",
      "Use the sidebar to navigate different content types",
      "The visual editor lets you design pages without code",
    ],
  },
  deployment: {
    title: "Deployments",
    description:
      "Deployments publish your site's content and make changes live. Each subdomain can have its own deployment configuration.",
    howToUse: [
      "Changes are typically deployed automatically",
      "Check deployment status in Analytics",
      "Use the Hosting section for advanced deployment settings",
    ],
  },
}

/**
 * Navigate user to a dashboard page
 */
export const navigateTo = tool({
  description:
    "Provide a link or instruction to navigate to a specific dashboard page.",
  parameters: z.object({
    page: z
      .string()
      .describe(
        "The page to navigate to (e.g., 'teams', 'billing', 'domains', 'settings')"
      ),
    subdomain: z
      .string()
      .optional()
      .describe("Optional subdomain context for the navigation"),
  }),
  execute: async ({ page, subdomain }: { page: string; subdomain?: string }) => {
    const normalizedPage = page.toLowerCase().replace(/[^a-z]/g, "")

    // Find matching page
    const pageKey = Object.keys(DASHBOARD_PAGES).find(
      (key) => normalizedPage.includes(key) || key.includes(normalizedPage)
    )

    if (pageKey) {
      const pageInfo = DASHBOARD_PAGES[pageKey as keyof typeof DASHBOARD_PAGES]
      return {
        action: "navigate",
        page: pageKey,
        path: pageInfo.path,
        title: pageInfo.title,
        description: pageInfo.description,
        instruction: `Go to ${pageInfo.title}: ${pageInfo.path}`,
        subdomain,
      }
    }

    // Handle CMS navigation
    if (normalizedPage.includes("cms") || normalizedPage.includes("admin") || normalizedPage.includes("content")) {
      if (subdomain) {
        return {
          action: "navigate",
          page: "cms",
          path: `/cms/${subdomain}/admin`,
          title: "CMS Admin",
          description: `Content management for ${subdomain}`,
          instruction: `Open the CMS for ${subdomain}: /cms/${subdomain}/admin`,
        }
      }
      return {
        action: "navigate",
        page: "cms",
        instruction:
          "To access the CMS, click 'Manage' on any subdomain from the dashboard overview.",
        note: "Specify a subdomain to get a direct link",
      }
    }

    return {
      action: "unknown",
      message: `I'm not sure which page '${page}' refers to. Available pages are:`,
      availablePages: Object.entries(DASHBOARD_PAGES).map(([key, info]) => ({
        name: key,
        title: info.title,
        description: info.description,
      })),
    }
  },
})

/**
 * Explain a dashboard feature
 */
export const explainFeature = tool({
  description:
    "Explain how a dashboard feature works and how to use it.",
  parameters: z.object({
    feature: z
      .string()
      .describe(
        "The feature to explain (e.g., 'teams', 'custom domains', 'visibility', 'cms')"
      ),
  }),
  execute: async ({ feature }: { feature: string }) => {
    const normalizedFeature = feature.toLowerCase().replace(/[^a-z]/g, "")

    // Find matching feature
    const featureKey = Object.keys(FEATURE_EXPLANATIONS).find(
      (key) =>
        normalizedFeature.includes(key.toLowerCase()) ||
        key.toLowerCase().includes(normalizedFeature)
    )

    if (featureKey) {
      return FEATURE_EXPLANATIONS[featureKey as keyof typeof FEATURE_EXPLANATIONS]
    }

    return {
      title: "Feature Help",
      description: `I can explain these features: ${Object.keys(FEATURE_EXPLANATIONS).join(", ")}. Which would you like to know more about?`,
      availableFeatures: Object.keys(FEATURE_EXPLANATIONS),
    }
  },
})

/**
 * Suggest relevant actions based on context
 */
export const suggestActions = tool({
  description:
    "Suggest helpful next actions based on the user's current context or goals.",
  parameters: z.object({
    currentPage: z
      .string()
      .optional()
      .describe("The current dashboard page the user is on"),
    goal: z
      .string()
      .optional()
      .describe("What the user is trying to accomplish"),
  }),
  execute: async ({ currentPage, goal }: { currentPage?: string; goal?: string }) => {
    const suggestions: Array<{
      action: string
      description: string
      priority: "high" | "medium" | "low"
    }> = []

    // Goal-based suggestions
    if (goal) {
      const normalizedGoal = goal.toLowerCase()

      if (normalizedGoal.includes("start") || normalizedGoal.includes("begin") || normalizedGoal.includes("new")) {
        suggestions.push({
          action: "Create your first subdomain",
          description: "Go to the dashboard and click 'Create Subdomain' to get started",
          priority: "high",
        })
      }

      if (normalizedGoal.includes("domain") || normalizedGoal.includes("custom")) {
        suggestions.push({
          action: "Add a custom domain",
          description: "Go to Custom Domains and add your domain. You'll need to configure DNS records.",
          priority: "high",
        })
      }

      if (normalizedGoal.includes("team") || normalizedGoal.includes("collaborat") || normalizedGoal.includes("share")) {
        suggestions.push({
          action: "Create a team",
          description: "Go to Teams to create a team and invite collaborators",
          priority: "high",
        })
      }

      if (normalizedGoal.includes("content") || normalizedGoal.includes("edit") || normalizedGoal.includes("page")) {
        suggestions.push({
          action: "Open the CMS",
          description: "Click 'Manage' on your subdomain to access the content editor",
          priority: "high",
        })
      }
    }

    // Page-based suggestions
    if (currentPage) {
      const normalizedPage = currentPage.toLowerCase()

      if (normalizedPage.includes("overview") || normalizedPage === "dashboard") {
        suggestions.push(
          {
            action: "Review your subdomains",
            description: "Check the status of your existing subdomains",
            priority: "medium",
          },
          {
            action: "Check for pending domain verifications",
            description: "Go to Custom Domains to verify any pending domains",
            priority: "medium",
          }
        )
      }

      if (normalizedPage.includes("team")) {
        suggestions.push(
          {
            action: "Invite team members",
            description: "Add collaborators to help manage your sites",
            priority: "medium",
          },
          {
            action: "Share subdomains with team",
            description: "Give your team access to specific subdomains",
            priority: "medium",
          }
        )
      }

      if (normalizedPage.includes("domain")) {
        suggestions.push(
          {
            action: "Verify pending domains",
            description: "Check DNS configuration for any unverified domains",
            priority: "high",
          },
          {
            action: "Set a primary domain",
            description: "Choose which domain should be the main one for each subdomain",
            priority: "low",
          }
        )
      }
    }

    // Default suggestions if none matched
    if (suggestions.length === 0) {
      suggestions.push(
        {
          action: "Explore your dashboard",
          description: "Check out the different sections in the sidebar",
          priority: "medium",
        },
        {
          action: "Create or manage subdomains",
          description: "Start by creating a subdomain or editing existing ones",
          priority: "medium",
        },
        {
          action: "Set up custom domains",
          description: "Add your own domain for a professional touch",
          priority: "low",
        }
      )
    }

    return {
      context: { currentPage, goal },
      suggestions: suggestions.sort((a, b) => {
        const priority = { high: 0, medium: 1, low: 2 }
        return priority[a.priority] - priority[b.priority]
      }),
    }
  },
})

/**
 * Get help with common tasks
 */
export const getHelp = tool({
  description: "Get help with common dashboard tasks and troubleshooting.",
  parameters: z.object({
    topic: z.string().describe("What the user needs help with"),
  }),
  execute: async ({ topic }: { topic: string }) => {
    const normalizedTopic = topic.toLowerCase()

    const helpTopics: Record<string, { title: string; steps: string[]; tips?: string[] }> = {
      "create subdomain": {
        title: "Creating a New Subdomain",
        steps: [
          "Go to the Dashboard overview",
          "Click 'Create Subdomain' button",
          "Enter a name for your subdomain",
          "Choose an emoji (optional)",
          "Click 'Create'",
        ],
        tips: [
          "Subdomain names can only contain letters, numbers, and hyphens",
          "Names must be between 3 and 63 characters",
        ],
      },
      "add domain": {
        title: "Adding a Custom Domain",
        steps: [
          "Go to Custom Domains in the sidebar",
          "Click 'Add Domain'",
          "Enter your domain name",
          "Copy the DNS records shown",
          "Add those records at your domain registrar",
          "Wait for DNS propagation (up to 48 hours)",
          "Click 'Verify' to confirm",
        ],
        tips: [
          "Make sure to add both www and non-www versions",
          "DNS changes can take time to propagate",
        ],
      },
      "invite member": {
        title: "Inviting Team Members",
        steps: [
          "Go to Teams in the sidebar",
          "Select or create a team",
          "Click 'Invite Member'",
          "Enter their email address",
          "Choose their role (admin, member, or viewer)",
          "Click 'Send Invitation'",
        ],
      },
      "share subdomain": {
        title: "Sharing a Subdomain with Team",
        steps: [
          "Go to the team's detail page",
          "Find the 'Shared Subdomains' section",
          "Click 'Add Subdomain'",
          "Select the subdomain to share",
          "Choose access level (view, edit, or admin)",
          "Save changes",
        ],
      },
    }

    // Find matching help topic
    const matchedTopic = Object.keys(helpTopics).find(
      (key) => normalizedTopic.includes(key) || key.includes(normalizedTopic)
    )

    if (matchedTopic) {
      return helpTopics[matchedTopic]
    }

    return {
      title: "Help Topics",
      message:
        "I can help with these common tasks. Which would you like help with?",
      availableTopics: Object.keys(helpTopics),
    }
  },
})

export const navigationTools = {
  navigateTo,
  explainFeature,
  suggestActions,
  getHelp,
}
