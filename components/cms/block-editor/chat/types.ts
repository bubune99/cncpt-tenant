/**
 * View-model types for the Page Builder AI chat panel.
 *
 * The panel is purely presentational: it renders a ChatPanelModel. An adapter
 * (use-block-editor-chat-model) maps the real AI SDK `useChat` stream onto this
 * shape, so the same panel can later be driven by the unified chat spine.
 *
 * Each `ChatPart` corresponds 1:1 to a `tool-*` / text / reasoning stream part.
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

export type ChatPart =
  | { id: string; kind: 'thinking'; text: string; open: boolean }
  | { id: string; kind: 'plan'; title: string; tasks: PlanTask[] }
  | { id: string; kind: 'changeset'; status: ChangesetStatus; summary: string; changes: ChangeRow[]; undoable?: boolean }
  | { id: string; kind: 'diff'; label: string; rows: DiffRow[] }
  | { id: string; kind: 'code'; label: string; code: string; copied?: boolean; applied?: boolean }
  | { id: string; kind: 'tokens'; label: string; tokenType: 'color' | 'spacing'; items: TokenItem[] }
  | { id: string; kind: 'registry'; regType: 'component' | 'styleset' | 'expression'; name: string; meta: string }
  | { id: string; kind: 'approval'; toolCallId: string; toolName: string; input: Record<string, unknown>; resolved?: 'approved' | 'denied'; highRisk?: boolean }
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

/** Everything the presentational panel needs. Supplied by the adapter. */
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
  onApproveTool: (messageId: string, toolCallId: string) => void
  onDenyTool: (messageId: string, toolCallId: string) => void
}
