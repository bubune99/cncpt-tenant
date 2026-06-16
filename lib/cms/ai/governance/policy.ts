/**
 * Agent Governance — Policy resolution
 *
 * Turns the stored AgentSettings into a runtime ResolvedAgentPolicy and decides,
 * for a given tool, whether it needs user approval under the active policy.
 */

import type { AgentSettings, ResolvedAgentPolicy } from './types'
import type { ToolMeta } from './tool-registry'

export function resolveAgentPolicy(settings: AgentSettings): ResolvedAgentPolicy {
  return {
    enabled: settings.enabled,
    navigationEnabled: settings.navigationEnabled,
    executionMode: settings.executionMode,
    allowedDomains: new Set(settings.allowedDomains),
    alwaysConfirm: new Set(settings.alwaysConfirm),
    respectRbac: settings.respectRbac,
    auditEnabled: settings.auditEnabled,
  }
}

/**
 * Whether a mutating tool requires explicit user approval before it runs.
 *  - 'ask'  → every mutation needs approval
 *  - 'auto' → only high-risk tools, or tools the admin added to alwaysConfirm
 *  - 'readonly' → mutations are filtered out entirely, so this is never reached
 */
export function toolNeedsApproval(
  toolName: string,
  meta: ToolMeta,
  policy: ResolvedAgentPolicy
): boolean {
  if (!meta.mutation) return false
  if (policy.executionMode === 'ask') return true
  if (policy.executionMode === 'auto') {
    return Boolean(meta.highRisk) || policy.alwaysConfirm.has(toolName)
  }
  return false
}
