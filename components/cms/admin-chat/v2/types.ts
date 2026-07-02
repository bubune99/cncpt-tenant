/**
 * View-model types for the Grainy admin AI chat panel (v2).
 *
 * The panel is purely presentational: it renders a `ChatPanelModel`. The adapter
 * (`map-admin-messages`) maps the real AI SDK `useChat` stream onto this shape,
 * and the orchestrator supplies the callbacks. Ported from the dzidzor chat
 * spine and re-skinned with the Grainy design system.
 *
 * Each `ChatPart` corresponds to a `tool-*` / text / reasoning stream part.
 */

export type TaskStatus = 'pending' | 'in-progress' | 'completed' | 'need-help' | 'failed'
export type ChangeType = 'added' | 'updated' | 'removed'
export type ChangesetStatus = 'pending' | 'accepted' | 'rejected'

export interface PlanSubtask {
  id: string
  title: string
  status: TaskStatus
  expanded: boolean
  desc?: string
  tools?: string[]
}

export interface PlanTask {
  id: string
  title: string
  status: TaskStatus
  expanded: boolean
  subtasks: PlanSubtask[]
}

export interface ChangeRow {
  id: string
  type: ChangeType
  tag: string
  label: string
  detail: string
}

export interface DiffRow {
  type: 'add' | 'remove' | 'context'
  text: string
}

export interface TokenItem {
  name: string
  value: string
  px?: number
}

/** A row in an entity-list card (search results: products, orders, pages…). */
export interface EntityRow {
  id: string
  title: string
  subtitle?: string
  /** Right-aligned metadata, e.g. a price or total. */
  meta?: string
  /** Small status badge, e.g. ACTIVE / PENDING. */
  badge?: string
  /** Admin link for the row. */
  href?: string
}

/** A tile in a stats-grid card. */
export interface StatRow {
  label: string
  value: string
}

export type ChatPart =
  | { id: string; kind: 'thinking'; text: string; open: boolean }
  | { id: string; kind: 'plan'; title: string; tasks: PlanTask[] }
  | { id: string; kind: 'changeset'; status: ChangesetStatus; summary: string; changes: ChangeRow[]; undoable?: boolean }
  | { id: string; kind: 'diff'; label: string; rows: DiffRow[] }
  | { id: string; kind: 'code'; label: string; code: string; copied?: boolean; applied?: boolean }
  | { id: string; kind: 'tokens'; label: string; tokenType: 'color' | 'spacing'; items: TokenItem[] }
  | { id: string; kind: 'registry'; regType: 'component' | 'styleset' | 'expression'; name: string; meta: string }
  | { id: string; kind: 'approval'; toolCallId: string; approvalId?: string; toolName: string; input: Record<string, unknown>; resolved?: 'approved' | 'denied'; highRisk?: boolean }
  | { id: string; kind: 'nav'; path: string; label?: string }
  | { id: string; kind: 'tour'; title: string; steps: number; slug?: string }
  | { id: string; kind: 'entities'; title: string; count: number; items: EntityRow[] }
  | { id: string; kind: 'stats'; title: string; stats: StatRow[] }
  | { id: string; kind: 'toolcall'; name: string; args?: string; status: 'done' | 'running'; result?: string }
  | { id: string; kind: 'text'; text: string }

export interface SelectionChip {
  id: string
  label: string
  tag: string
}

export interface ChatMessageVM {
  id: string
  role: 'user' | 'assistant' | 'system'
  text?: string
  chips?: SelectionChip[]
  parts?: ChatPart[]
  // system/summary
  retained?: string[]
  saved?: string
}

export interface SlashCommand {
  id: string
  cmd: string
  desc: string
}

export interface CanvasBlockRef {
  id: string
  label: string
  tag: string
}

/** A non-blocking notice rendered below the message log (e.g. out of credits). */
export interface ChatNotice {
  kind: 'credits' | 'error'
  message: string
  actionLabel?: string
  actionHref?: string
}

/** Everything the presentational panel needs. Supplied by the orchestrator. */
export interface ChatPanelModel {
  assistantName: string
  modelLabel: string
  messages: ChatMessageVM[]
  isEmpty: boolean
  streaming: boolean
  reverted: boolean
  // context meter
  contextPct: number
  tokenLabel: string
  // composer
  input: string
  /** Placeholder text for the composer, tailored to the surface. */
  composerPlaceholder?: string
  chips: SelectionChip[]
  slashOpen: boolean
  slashCommands: SlashCommand[]
  suggestions: string[]
  canvasBlocks: CanvasBlockRef[]
  /** A transient notice card (credits exhausted, request failed…). */
  notice?: ChatNotice | null
  // actions
  onInput: (v: string) => void
  onSubmit: () => void
  onPickSuggestion: (text: string) => void
  onAttachBlock: (block: CanvasBlockRef) => void
  onRemoveChip: (id: string) => void
  onRunCommand: (id: string) => void
  onCompact: () => void
  onClear: () => void
  onRevertTo: (messageId: string) => void
  onStop: () => void
  // per-part interactions
  onToggleThinking: (messageId: string, partId: string) => void
  onToggleTask: (messageId: string, partId: string, taskId: string) => void
  onToggleSubtask: (messageId: string, partId: string, taskId: string, subId: string) => void
  onAcceptChangeset: (messageId: string, partId: string) => void
  onRejectChangeset: (messageId: string, partId: string) => void
  onUndoChangeset: (messageId: string, partId: string) => void
  onCopyCode: (messageId: string, partId: string) => void
  onApplyCode: (messageId: string, partId: string) => void
  // governance approval (admin surface)
  // Second arg is the AI SDK approval id (part.approval.id) when present, else the toolCallId.
  onApproveTool: (messageId: string, approvalId: string) => void
  onDenyTool: (messageId: string, approvalId: string) => void
  // client-executed widgets
  onNavigate?: (path: string) => void
  onStartTour?: (slug: string) => void
}
