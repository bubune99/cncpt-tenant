/**
 * Agent Governance — Types
 *
 * Defines the admin-configurable policy that gates what the AI chat agent is
 * allowed to do, and the resolved (runtime) form of that policy.
 *
 * Enforcement is ALWAYS server-side (see guard-tools.ts + the chat route). The
 * settings here are the admin's knobs; the per-user RBAC permission system is
 * the hard ceiling the agent can never exceed.
 */

/**
 * How the agent is allowed to execute mutating tools:
 *  - 'readonly': the agent may read/search/navigate but every state-changing
 *                tool is removed before the model sees it.
 *  - 'ask':      every mutating tool requires explicit user approval in the UI
 *                before it runs (AI SDK `needsApproval`).
 *  - 'auto':     mutating tools run without prompting EXCEPT high-risk ones
 *                (deletes, refunds, publishes, settings) and anything the admin
 *                added to `alwaysConfirm`, which still require approval.
 */
export type AgentExecutionMode = 'readonly' | 'ask' | 'auto'

/** Business domains the agent can act in. Gated by the admin allowlist. */
export type AgentToolDomain =
  | 'pages'
  | 'products'
  | 'orders'
  | 'blog'
  | 'settings'
  | 'help'
  // Pseudo-domains that are never subject to the allowlist:
  | 'navigation' // gated separately by navigationEnabled
  | 'read' // non-mutating data reads
  | 'meta' // visual/UX only (spotlight, scan)

/** Admin-configurable agent governance settings (stored in the `agent` group). */
export interface AgentSettings {
  /** Master switch. When false, the agent gets NO tools at all. */
  enabled: boolean
  /** Whether the agent may navigate the user between pages/routes. */
  navigationEnabled: boolean
  /** How mutating tools execute (see AgentExecutionMode). */
  executionMode: AgentExecutionMode
  /** Business domains the agent may act in. Empty = none allowed. */
  allowedDomains: AgentToolDomain[]
  /**
   * Extra tool names that must ALWAYS require approval, even in 'auto' mode,
   * on top of the built-in high-risk set.
   */
  alwaysConfirm: string[]
  /**
   * Enforce per-user RBAC: the agent can never do anything the signed-in user
   * couldn't do themselves. Strongly recommended on; exposed for transparency.
   */
  respectRbac: boolean
  /** Write an audit-log entry for every agent-performed mutation. */
  auditEnabled: boolean
}

/**
 * Default policy: the agent is on and helpful out of the box, but irreversible
 * actions (deletes, refunds, cancels, publishes, settings writes) still require
 * approval, and per-user RBAC is always enforced.
 */
export const DEFAULT_AGENT_SETTINGS: AgentSettings = {
  enabled: true,
  navigationEnabled: true,
  executionMode: 'auto',
  allowedDomains: ['pages', 'products', 'orders', 'blog', 'settings', 'help'],
  alwaysConfirm: [],
  respectRbac: true,
  auditEnabled: true,
}

/** Runtime form of the policy with lookups pre-built. */
export interface ResolvedAgentPolicy {
  enabled: boolean
  navigationEnabled: boolean
  executionMode: AgentExecutionMode
  allowedDomains: Set<string>
  alwaysConfirm: Set<string>
  respectRbac: boolean
  auditEnabled: boolean
}
