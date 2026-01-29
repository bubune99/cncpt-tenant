# Dashboard AI Chat Agent Specification

## Overview

Implement an AI chat agent for the platform dashboard that helps users manage their subdomains, teams, domains, deployments, and billing. The implementation will share core infrastructure with the CMS chat while providing dashboard-specific tools and context.

---

## Architecture

### Shared Core (Extract from CMS)

```
lib/ai/
├── core/                           # SHARED CORE
│   ├── providers.ts                # Vercel AI Gateway setup
│   ├── models.ts                   # Model configuration (Claude)
│   ├── types.ts                    # Base TypeScript interfaces
│   ├── chat-store.ts               # Zustand state management
│   └── streaming.ts                # Stream utilities
│
├── tools/
│   ├── cms/                        # CMS-specific tools (existing)
│   │   ├── product-tools.ts
│   │   ├── order-tools.ts
│   │   └── help-tools.ts
│   │
│   └── dashboard/                  # NEW: Dashboard tools
│       ├── subdomain-tools.ts
│       ├── team-tools.ts
│       ├── domain-tools.ts
│       ├── deployment-tools.ts
│       ├── billing-tools.ts
│       └── index.ts
│
└── prompts/
    ├── cms-system-prompt.ts        # CMS context
    └── dashboard-system-prompt.ts  # Dashboard context (NEW)
```

### API Routes

```
app/api/
├── chat/route.ts                   # Existing CMS chat
└── dashboard-chat/route.ts         # NEW: Dashboard chat endpoint
```

### Components

```
components/
├── admin-chat/                     # Existing CMS chat UI
└── dashboard-chat/                 # NEW: Dashboard chat UI
    ├── chat-panel.tsx
    ├── chat-trigger.tsx
    └── index.tsx
```

---

## Dashboard Tools Specification

### 1. Subdomain Tools (`subdomain-tools.ts`)

#### `listSubdomains`
- **Purpose**: List user's subdomains with stats
- **Parameters**: `{ includeStats?: boolean }`
- **Returns**: Array of subdomains with name, emoji, created date, visit count
- **Use case**: "Show me all my sites" / "How many subdomains do I have?"

#### `getSubdomainDetails`
- **Purpose**: Get detailed info about a specific subdomain
- **Parameters**: `{ subdomain: string }`
- **Returns**: Settings, domains, visibility status, team access
- **Use case**: "Tell me about my-site subdomain" / "What's the status of X?"

#### `searchSubdomains`
- **Purpose**: Find subdomains by name or settings
- **Parameters**: `{ query: string }`
- **Returns**: Matching subdomains
- **Use case**: "Find my blog sites" / "Which site has custom domain X?"

#### `getSubdomainStats`
- **Purpose**: Get analytics for a subdomain
- **Parameters**: `{ subdomain: string, period?: 'day' | 'week' | 'month' }`
- **Returns**: Visitors, page views, top pages, bandwidth
- **Use case**: "How's my site performing?" / "Show traffic for last week"

---

### 2. Team Tools (`team-tools.ts`)

#### `listTeams`
- **Purpose**: List user's teams (owned and member of)
- **Parameters**: `{ role?: 'owner' | 'member' | 'all' }`
- **Returns**: Teams with member counts, subdomain counts
- **Use case**: "Show my teams" / "Which teams am I part of?"

#### `getTeamDetails`
- **Purpose**: Get detailed team information
- **Parameters**: `{ teamId: string }`
- **Returns**: Members, subdomains, roles, permissions
- **Use case**: "Who's on the marketing team?" / "What access does team X have?"

#### `listTeamMembers`
- **Purpose**: List members of a specific team
- **Parameters**: `{ teamId: string }`
- **Returns**: Members with roles, emails, join dates
- **Use case**: "List members of my team" / "Who has admin access?"

#### `getTeamInvitations`
- **Purpose**: Get pending invitations (sent and received)
- **Parameters**: `{ type?: 'sent' | 'received' | 'all' }`
- **Returns**: Pending invitations with status
- **Use case**: "Do I have any pending invites?" / "Who did I invite?"

#### `checkTeamAccess`
- **Purpose**: Check what a team member can access
- **Parameters**: `{ teamId: string, userId?: string }`
- **Returns**: Accessible subdomains, permission levels
- **Use case**: "What can John access?" / "What permissions do viewers have?"

---

### 3. Domain Tools (`domain-tools.ts`)

#### `listDomains`
- **Purpose**: List custom domains across all subdomains
- **Parameters**: `{ subdomain?: string, status?: 'verified' | 'pending' | 'all' }`
- **Returns**: Domains with verification status, SSL status
- **Use case**: "Show all my custom domains" / "Which domains are pending?"

#### `getDomainStatus`
- **Purpose**: Get detailed domain status and DNS info
- **Parameters**: `{ domain: string }`
- **Returns**: DNS records, verification status, SSL cert info
- **Use case**: "Is example.com verified?" / "What DNS records do I need?"

#### `troubleshootDomain`
- **Purpose**: Diagnose domain configuration issues
- **Parameters**: `{ domain: string }`
- **Returns**: Issues found, suggested fixes, DNS lookup results
- **Use case**: "Why isn't my domain working?" / "Help me fix DNS"

#### `getDnsInstructions`
- **Purpose**: Get DNS setup instructions for a domain
- **Parameters**: `{ domain: string, provider?: string }`
- **Returns**: Step-by-step DNS configuration guide
- **Use case**: "How do I set up DNS for my domain?" / "Cloudflare DNS setup"

---

### 4. Deployment Tools (`deployment-tools.ts`)

#### `getDeploymentStatus`
- **Purpose**: Get current deployment status
- **Parameters**: `{ subdomain?: string }`
- **Returns**: Deploy status, last deploy time, build logs summary
- **Use case**: "Is my site deployed?" / "When was my last deploy?"

#### `listDeployments`
- **Purpose**: List recent deployments
- **Parameters**: `{ subdomain?: string, limit?: number }`
- **Returns**: Deployment history with status, duration, commit info
- **Use case**: "Show recent deploys" / "What was my last 5 deployments?"

#### `getDokployStatus`
- **Purpose**: Get Dokploy VPS connection and app status
- **Parameters**: none
- **Returns**: Connection status, projects, applications
- **Use case**: "Is my VPS connected?" / "Show my Dokploy projects"

#### `troubleshootDeployment`
- **Purpose**: Diagnose deployment issues
- **Parameters**: `{ subdomain?: string, deploymentId?: string }`
- **Returns**: Error analysis, common fixes, log excerpts
- **Use case**: "Why did my deploy fail?" / "Help me fix build errors"

---

### 5. Billing Tools (`billing-tools.ts`)

#### `getBillingStatus`
- **Purpose**: Get current subscription and usage
- **Parameters**: none
- **Returns**: Plan name, usage stats, limits, renewal date
- **Use case**: "What plan am I on?" / "How many subdomains can I create?"

#### `getUsageStats`
- **Purpose**: Get detailed resource usage
- **Parameters**: `{ period?: 'current' | 'last_month' }`
- **Returns**: Subdomains used, domains used, storage, bandwidth
- **Use case**: "Am I near my limits?" / "Show my usage"

#### `comparePlans`
- **Purpose**: Compare available plans
- **Parameters**: none
- **Returns**: Plan comparison with features, limits, pricing
- **Use case**: "What's the difference between Pro and Enterprise?"

#### `explainBilling`
- **Purpose**: Explain billing concepts
- **Parameters**: `{ topic: string }`
- **Returns**: Explanation of billing terms, upgrade process, etc.
- **Use case**: "How does billing work?" / "When will I be charged?"

---

### 6. Navigation & Help Tools (`navigation-tools.ts`)

#### `navigateTo`
- **Purpose**: Navigate user to a dashboard page
- **Parameters**: `{ page: string, params?: object }`
- **Returns**: Navigation confirmation
- **Use case**: "Take me to team settings" / "Go to billing"

#### `explainFeature`
- **Purpose**: Explain a dashboard feature
- **Parameters**: `{ feature: string }`
- **Returns**: Feature explanation, how to use it
- **Use case**: "What is site visibility?" / "How do custom domains work?"

#### `suggestActions`
- **Purpose**: Suggest relevant actions based on context
- **Parameters**: `{ currentPage?: string }`
- **Returns**: Suggested next steps
- **Use case**: "What should I do next?" / "Help me get started"

---

## Context Detection

### Dashboard Route Patterns

```typescript
const DASHBOARD_ROUTES = {
  // Main sections
  '/dashboard': { type: 'overview' },
  '/dashboard/overview': { type: 'overview' },
  '/dashboard/analytics': { type: 'analytics' },

  // Site management
  '/dashboard/visibility': { type: 'visibility' },
  '/dashboard/domains': { type: 'domains' },
  '/dashboard/settings': { type: 'settings' },
  '/dashboard/appearance': { type: 'appearance' },
  '/dashboard/security': { type: 'security' },
  '/dashboard/frontend': { type: 'hosting' },

  // Collaboration
  '/dashboard/teams': { type: 'teams' },
  '/dashboard/teams/[teamId]': { type: 'team_detail' },
  '/dashboard/teams/[teamId]/settings': { type: 'team_settings' },

  // Account
  '/dashboard/billing': { type: 'billing' },
}
```

### Context Object

```typescript
interface DashboardContext {
  type: 'overview' | 'subdomain' | 'team' | 'domains' | 'billing' | 'deployment' | 'settings'

  // Current subdomain (from selector)
  subdomain?: string

  // Team context (when in team pages)
  teamId?: string
  teamRole?: 'owner' | 'admin' | 'member' | 'viewer'

  // Page-specific context
  currentPage: string
  section?: string
}
```

---

## System Prompt

```typescript
const DASHBOARD_SYSTEM_PROMPT = `
You are an AI assistant for a multi-tenant SaaS platform dashboard. You help users manage their:

- **Subdomains**: Create and configure websites
- **Custom Domains**: Set up and troubleshoot domain connections
- **Teams**: Collaborate with team members
- **Deployments**: Monitor and troubleshoot deployments
- **Billing**: Understand plans and usage

## Current Context
{context}

## Your Capabilities
You can:
1. Look up information about subdomains, teams, domains, and billing
2. Explain features and guide users through tasks
3. Troubleshoot domain and deployment issues
4. Navigate users to relevant pages
5. Suggest next actions based on their goals

## Guidelines
- Be concise and helpful
- When troubleshooting, gather information before suggesting fixes
- Always verify the user has access before showing sensitive info
- For destructive actions, explain consequences first
- If unsure, ask clarifying questions

## Tool Usage
- Use tools to fetch real data rather than guessing
- Combine multiple tools to answer complex questions
- For troubleshooting, use diagnostic tools before suggesting fixes
`
```

---

## Implementation Phases

### Phase 1: Extract Shared Core
1. Create `lib/ai/core/` directory
2. Extract provider setup, models, types from CMS
3. Make chat store configurable for different contexts
4. Create shared streaming utilities

### Phase 2: Create Dashboard Tools
1. Implement subdomain tools
2. Implement team tools
3. Implement domain tools
4. Implement deployment tools
5. Implement billing tools
6. Implement navigation/help tools

### Phase 3: Create Dashboard Chat API
1. Create `/api/dashboard-chat/route.ts`
2. Configure with dashboard tools and prompt
3. Add context detection from request
4. Implement rate limiting

### Phase 4: Create Dashboard Chat UI
1. Copy and adapt chat panel component
2. Create dashboard-specific trigger button
3. Integrate with dashboard layout
4. Add context provider for current subdomain

### Phase 5: Integration & Testing
1. Add chat to dashboard sidebar
2. Test all tools with real data
3. Test context detection across pages
4. Performance and rate limit testing

---

## File Checklist

### New Files to Create
- [ ] `lib/ai/core/providers.ts`
- [ ] `lib/ai/core/models.ts`
- [ ] `lib/ai/core/types.ts`
- [ ] `lib/ai/core/chat-store.ts`
- [ ] `lib/ai/tools/dashboard/subdomain-tools.ts`
- [ ] `lib/ai/tools/dashboard/team-tools.ts`
- [ ] `lib/ai/tools/dashboard/domain-tools.ts`
- [ ] `lib/ai/tools/dashboard/deployment-tools.ts`
- [ ] `lib/ai/tools/dashboard/billing-tools.ts`
- [ ] `lib/ai/tools/dashboard/navigation-tools.ts`
- [ ] `lib/ai/tools/dashboard/index.ts`
- [ ] `lib/ai/prompts/dashboard-system-prompt.ts`
- [ ] `app/api/dashboard-chat/route.ts`
- [ ] `components/dashboard-chat/chat-panel.tsx`
- [ ] `components/dashboard-chat/chat-trigger.tsx`
- [ ] `components/dashboard-chat/index.tsx`

### Files to Modify
- [ ] `app/dashboard/sidebar.tsx` - Add chat trigger
- [ ] `app/dashboard/layout.tsx` - Add chat provider

---

## Security Considerations

1. **Access Control**: Verify user owns/has access to resources before returning data
2. **Rate Limiting**: 100 messages/day for free, 500 for Pro
3. **Data Filtering**: Never expose other users' data
4. **Team Permissions**: Respect team role when showing team data
5. **Audit Logging**: Log tool usage for debugging

---

## Success Metrics

- User can ask "How many subdomains do I have?" and get accurate answer
- User can troubleshoot domain issues with AI guidance
- User can navigate dashboard via chat commands
- Context detection correctly identifies current page/subdomain
- Tools respect access control and permissions
