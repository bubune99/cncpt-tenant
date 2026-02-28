import type { UIMessage } from "ai"

/* ------------------------------------------------------------------ */
/*  Spotlight Colors                                                    */
/* ------------------------------------------------------------------ */

export type SpotlightColor = "purple" | "teal" | "blue" | "orange" | "green"

export const SPOTLIGHT_COLORS: SpotlightColor[] = [
  "purple",
  "teal",
  "blue",
  "orange",
  "green",
]

export const SPOTLIGHT_COLOR_MAP: Record<
  SpotlightColor,
  { ring: string; bg: string; text: string; border: string; dot: string }
> = {
  purple: { ring: "ring-purple-400", bg: "bg-purple-500/10", text: "text-purple-300", border: "border-purple-500/40", dot: "bg-purple-400" },
  teal:   { ring: "ring-teal-400",   bg: "bg-teal-500/10",   text: "text-teal-300",   border: "border-teal-500/40",   dot: "bg-teal-400" },
  blue:   { ring: "ring-blue-400",   bg: "bg-blue-500/10",   text: "text-blue-300",   border: "border-blue-500/40",   dot: "bg-blue-400" },
  orange: { ring: "ring-orange-400", bg: "bg-orange-500/10", text: "text-orange-300", border: "border-orange-500/40", dot: "bg-orange-400" },
  green:  { ring: "ring-green-400",  bg: "bg-green-500/10",  text: "text-green-300",  border: "border-green-500/40",  dot: "bg-green-400" },
}

/* ------------------------------------------------------------------ */
/*  Block Spotlight                                                     */
/* ------------------------------------------------------------------ */

export interface BlockSpotlight {
  blockId: string
  annotation: string
  color: SpotlightColor
}

/* ------------------------------------------------------------------ */
/*  Design Workflow (sequence of spotlights from one AI message)        */
/* ------------------------------------------------------------------ */

export interface DesignWorkflowStep extends BlockSpotlight {
  stepId: string
  index: number
}

export interface DesignWorkflow {
  id: string
  title: string
  messageId: string
  steps: DesignWorkflowStep[]
  createdAt: number
}

/* ------------------------------------------------------------------ */
/*  AI Tool Output Types                                                */
/* ------------------------------------------------------------------ */

export interface SpotlightBlockOutput {
  blockId: string
  annotation: string
  color?: SpotlightColor
}

export interface ExplainDesignOutput {
  title: string
  steps: Array<{
    blockId: string
    annotation: string
    detail: string
  }>
}

export interface SuggestImprovementOutput {
  blockId: string
  issue: string
  suggestion: string
  /** Partial block updates to apply if user accepts */
  fix?: Record<string, unknown>
}

export interface ShowDesignErrorOutput {
  blockId: string
  severity: "warning" | "error"
  category: "accessibility" | "responsive" | "ux" | "performance" | "seo"
  message: string
  suggestion?: string
}

/* ------------------------------------------------------------------ */
/*  Tool name constants                                                 */
/* ------------------------------------------------------------------ */

export const KOFI_TOOL_NAMES = [
  "setPageBlocks",
  "addBlock",
  "updateBlock",
  "removeBlock",
  "moveBlock",
  "spotlightBlock",
  "explainDesign",
  "suggestImprovement",
  "showDesignError",
] as const

export type KofiToolName = (typeof KOFI_TOOL_NAMES)[number]

/* ------------------------------------------------------------------ */
/*  Extract design workflows from AI messages                           */
/* ------------------------------------------------------------------ */

export function extractDesignWorkflows(messages: UIMessage[]): DesignWorkflow[] {
  const workflows: DesignWorkflow[] = []

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i]
    if (msg.role !== "assistant") continue

    const steps: DesignWorkflowStep[] = []
    let colorIdx = 0

    for (const part of msg.parts) {
      if (part.type !== "tool-invocation") continue
      const toolPart = part as unknown as {
        type: "tool-invocation"
        toolInvocation: { toolName: string; state: string; args: Record<string, unknown> }
      }
      if (toolPart.toolInvocation.toolName !== "spotlightBlock") continue

      const args = toolPart.toolInvocation.args as unknown as SpotlightBlockOutput
      const color = args.color || SPOTLIGHT_COLORS[colorIdx % SPOTLIGHT_COLORS.length]
      colorIdx++

      steps.push({
        blockId: args.blockId,
        annotation: args.annotation,
        color,
        stepId: `wf-${msg.id}-${steps.length}`,
        index: steps.length,
      })
    }

    if (steps.length === 0) continue

    // Find preceding user message for title
    let title = "Design Walkthrough"
    for (let j = i - 1; j >= 0; j--) {
      if (messages[j].role === "user") {
        const userText = messages[j].parts
          .filter((p): p is { type: "text"; text: string } => p.type === "text")
          .map((p) => p.text)
          .join(" ")
        title = userText.length > 60 ? userText.slice(0, 57) + "..." : userText
        break
      }
    }

    workflows.push({
      id: `wf-${msg.id}`,
      title,
      messageId: msg.id,
      steps,
      createdAt: Date.now(),
    })
  }

  return workflows
}
