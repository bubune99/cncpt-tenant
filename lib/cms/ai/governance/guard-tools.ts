/**
 * Agent Governance — Tool guard
 *
 * Wraps the assembled AI tool set with the resolved policy + per-user RBAC.
 * This is the single server-side choke point that makes the agent safe:
 *
 *   1. Master switch off            -> no tools at all.
 *   2. Navigation disabled          -> nav tools removed.
 *   3. Domain not in allowlist      -> that domain's tools removed.
 *   4. User lacks the RBAC perm     -> tool removed (model never sees it).
 *   5. readonly mode                -> every mutating tool removed.
 *   6. Surviving mutating tools     -> wrapped with a defense-in-depth perm
 *                                      re-check + audit logging, and tagged
 *                                      with `needsApproval` per execution mode.
 *
 * Tools not in the registry (dynamic VMCP/MCP tools) pass through untouched —
 * they self-govern via their own needsApproval.
 */

import type { ToolSet, Tool } from 'ai'
import type { ResolvedAgentPolicy } from './types'
import { TOOL_REGISTRY, isAllowlistGatedDomain, type ToolMeta } from './tool-registry'
import { toolNeedsApproval } from './policy'
import { hasPermission, checkPermission, logAuditEvent } from '@/lib/cms/permissions'
import type { UserWithPermissions } from '@/lib/cms/permissions/types'

// Loose view of a tool used only for reading/overriding `execute` while wrapping.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ExecutableTool = Tool & { execute?: (...args: any[]) => any }

export interface AgentToolGuardContext {
  userId: string
  policy: ResolvedAgentPolicy
  /** Pre-fetched permission set, so filtering needs zero extra DB calls. */
  userPerms: UserWithPermissions | null
}

export interface GuardResult {
  tools: ToolSet
  /** Names removed by policy/RBAC — useful for logging + telemetry. */
  removed: string[]
}

export function guardTools(
  tools: ToolSet,
  ctx: AgentToolGuardContext
): GuardResult {
  const { policy, userPerms } = ctx
  const removed: string[] = []

  // 1. Master switch.
  if (!policy.enabled) {
    return { tools: {}, removed: Object.keys(tools) }
  }

  const guarded: ToolSet = {}

  for (const [name, tool] of Object.entries(tools)) {
    const meta = TOOL_REGISTRY[name]

    // Unknown/dynamic tools self-govern — pass through.
    if (!meta) {
      guarded[name] = tool
      continue
    }

    // 2. Navigation gate.
    if (meta.navigation && !policy.navigationEnabled) {
      removed.push(name)
      continue
    }

    // 3. Domain allowlist (business domains only).
    if (isAllowlistGatedDomain(meta.domain) && !policy.allowedDomains.has(meta.domain)) {
      removed.push(name)
      continue
    }

    // 4. RBAC pre-filter (reads and writes).
    if (policy.respectRbac && meta.permission && userPerms) {
      if (!checkPermission(userPerms, meta.permission).allowed) {
        removed.push(name)
        continue
      }
    }

    // Non-mutating tools: no approval, no audit.
    if (!meta.mutation) {
      guarded[name] = tool
      continue
    }

    // 5. readonly mode removes mutations.
    if (policy.executionMode === 'readonly') {
      removed.push(name)
      continue
    }

    // 6. Wrap the mutating tool.
    guarded[name] = wrapMutatingTool(name, tool, meta, ctx)
  }

  return { tools: guarded, removed }
}

function wrapMutatingTool(
  name: string,
  tool: Tool,
  meta: ToolMeta,
  ctx: AgentToolGuardContext
): Tool {
  const { userId, policy } = ctx
  const originalExecute = (tool as ExecutableTool).execute
  const needsApproval = toolNeedsApproval(name, meta, policy)

  const wrapped: ExecutableTool = { ...tool, needsApproval }

  if (typeof originalExecute === 'function') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    wrapped.execute = async (input: any, options: any) => {
      // Defense-in-depth: re-check the permission at call time even though the
      // tool was only exposed because the pre-filter allowed it.
      if (policy.respectRbac && meta.permission) {
        const check = await hasPermission(userId, meta.permission)
        if (!check.allowed) {
          return {
            success: false,
            error: `Permission denied: this action requires the "${meta.permission}" permission, which your account does not have.`,
          }
        }
      }

      const result = await originalExecute(input, options)

      // Audit successful mutations. Never let audit failure break the call.
      if (policy.auditEnabled && meta.audit) {
        try {
          await logAuditEvent({
            userId,
            action: meta.audit,
            targetType: meta.domain,
            targetId: extractTargetId(input, result),
            details: { tool: name, via: 'ai-agent', input: redactInput(input) },
          })
        } catch {
          /* swallow audit errors */
        }
      }

      return result
    }
  }

  return wrapped
}

/** Best-effort extraction of the affected entity id for the audit trail. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractTargetId(input: any, result: any): string | undefined {
  if (input && typeof input === 'object' && typeof input.id === 'string') return input.id
  if (result && typeof result === 'object') {
    for (const key of ['page', 'product', 'order', 'post', 'blogPost']) {
      const v = result[key]
      if (v && typeof v === 'object' && typeof v.id === 'string') return v.id
    }
    if (typeof result.id === 'string') return result.id
  }
  return undefined
}

/** Strip bulky/sensitive fields so audit details stay small and safe. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function redactInput(input: any): Record<string, unknown> | unknown {
  if (!input || typeof input !== 'object') return input
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(input)) {
    if (['content', 'blocks', 'html', 'body'].includes(k)) {
      out[k] = '[omitted]'
    } else if (typeof v === 'string' && v.length > 500) {
      out[k] = `${v.slice(0, 500)}…`
    } else {
      out[k] = v
    }
  }
  return out
}
