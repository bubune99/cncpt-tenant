"use client"

import React, { useState, useRef, useEffect, useMemo, useCallback } from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import type { UIMessage } from "ai"
import { useEditor } from "@/lib/cms/block-editor/editor-context"
import { Button } from "@/components/cms/ui/button"
import { cn } from "@/lib/cms/utils"
import {
  Bot,
  Send,
  Loader2,
  Blocks,
  Pencil,
  Trash2,
  Move,
  Plus,
  User,
  Sparkles,
  RotateCcw,
  AlertCircle,
  Clock,
  Eye,
  Lightbulb,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Play,
  Wrench,
  GraduationCap,
} from "lucide-react"
import type { Block } from "@/lib/cms/block-editor/types"
import { isContainerTag } from "@/lib/cms/block-editor/types"
import {
  generateId,
  rehydrateParentIds,
  stripParentIds,
} from "@/lib/cms/block-editor/tree-utils"
import {
  KOFI_TOOL_NAMES,
  SPOTLIGHT_COLORS,
  SPOTLIGHT_COLOR_MAP,
  type KofiToolName,
  type BlockSpotlight,
  type SpotlightColor,
  type SpotlightBlockOutput,
  type ExplainDesignOutput,
  type SuggestImprovementOutput,
  type ShowDesignErrorOutput,
  extractDesignWorkflows,
} from "@/lib/cms/block-editor/workflow-types"
import { SpotlightBadge, useBlockSpotlight } from "./block-spotlight"
import { DesignWorkflowModal } from "./design-workflow-modal"
import ReactMarkdownImport from "react-markdown"
import remarkGfmImport from "remark-gfm"

// Handle ESM/CJS interop
const ReactMarkdown = (typeof ReactMarkdownImport === "function"
  ? ReactMarkdownImport
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  : (ReactMarkdownImport as any).default ?? ReactMarkdownImport) as typeof ReactMarkdownImport
const remarkGfm = (typeof remarkGfmImport === "function"
  ? remarkGfmImport
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  : (remarkGfmImport as any).default ?? remarkGfmImport) as typeof remarkGfmImport

/* ------------------------------------------------------------------ */
/*  Helpers / tool parsing                                             */
/* ------------------------------------------------------------------ */

const TOOL_PART_TYPES = new Set<string>(KOFI_TOOL_NAMES.map((n) => `tool-${n}`))

function isToolPart(part: { type: string }): part is {
  type: string
  toolCallId: string
  state: string
  input: Record<string, unknown>
  output?: Record<string, unknown>
} {
  return TOOL_PART_TYPES.has(part.type)
}

function toolNameFromPartType(partType: string): KofiToolName {
  return partType.replace("tool-", "") as KofiToolName
}

function getTextFromParts(msg: UIMessage): string {
  if (!msg.parts || !Array.isArray(msg.parts)) return ""
  return msg.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("")
}

/* ---- Building tool icons/labels ---- */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const actionIcons: Record<string, any> = {
  setPageBlocks: Blocks,
  addBlock: Plus,
  updateBlock: Pencil,
  removeBlock: Trash2,
  moveBlock: Move,
  spotlightBlock: Eye,
  explainDesign: GraduationCap,
  suggestImprovement: Lightbulb,
  showDesignError: AlertTriangle,
}
const actionLabels: Record<string, string> = {
  setPageBlocks: "Rebuilt the page",
  addBlock: "Added a block",
  updateBlock: "Updated a block",
  removeBlock: "Removed a block",
  moveBlock: "Moved a block",
  spotlightBlock: "Spotlighted a block",
  explainDesign: "Design walkthrough",
  suggestImprovement: "Suggested improvement",
  showDesignError: "Flagged design issue",
}

/* Building tools that mutate the page */
const BUILDING_TOOLS = new Set(["setPageBlocks", "addBlock", "updateBlock", "removeBlock", "moveBlock"])

/* ------------------------------------------------------------------ */
/*  Tool call badge (for building tools)                               */
/* ------------------------------------------------------------------ */

function ToolCallBubble({ toolName, state: toolState }: { toolName: string; state: string }) {
  const Icon = actionIcons[toolName] || Blocks
  const label = actionLabels[toolName] || toolName
  const done = toolState === "output-available"
  const errored = toolState === "output-error"

  return (
    <div className={cn("flex items-center gap-2 rounded-md bg-accent px-2.5 py-1.5 text-xs", errored && "border border-destructive/40")}>
      {done || errored ? (
        <Icon size={12} className={errored ? "text-destructive" : "text-primary"} />
      ) : (
        <Loader2 size={12} className="animate-spin text-primary" />
      )}
      <span className="text-muted-foreground">
        {errored ? `Failed: ${label}` : done ? label : `${label}...`}
      </span>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Design Error Card                                                   */
/* ------------------------------------------------------------------ */

function DesignErrorCard({ data, onSpotlight }: { data: ShowDesignErrorOutput; onSpotlight: (id: string) => void }) {
  const isError = data.severity === "error"
  return (
    <div
      className={cn(
        "rounded-lg border p-3 text-xs",
        isError ? "border-red-500/40 bg-red-500/5" : "border-amber-500/40 bg-amber-500/5"
      )}
    >
      <div className="flex items-start gap-2">
        <AlertTriangle
          size={14}
          className={cn("mt-0.5 shrink-0", isError ? "text-red-400" : "text-amber-400")}
        />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={cn("font-semibold", isError ? "text-red-300" : "text-amber-300")}>
              {data.category.charAt(0).toUpperCase() + data.category.slice(1)}
            </span>
            <span className={cn(
              "rounded px-1.5 py-0.5 text-[9px] font-medium uppercase",
              isError ? "bg-red-500/20 text-red-300" : "bg-amber-500/20 text-amber-300"
            )}>
              {data.severity}
            </span>
          </div>
          <p className="text-muted-foreground leading-relaxed">{data.message}</p>
          {data.suggestion && (
            <p className="mt-1.5 text-muted-foreground/80 italic">Fix: {data.suggestion}</p>
          )}
          <button
            onClick={() => onSpotlight(data.blockId)}
            className="mt-2 inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
          >
            <Eye size={10} />
            View on canvas
          </button>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Improvement Card                                                    */
/* ------------------------------------------------------------------ */

function ImprovementCard({
  data,
  onApply,
  onSpotlight,
}: {
  data: SuggestImprovementOutput
  onApply: () => void
  onSpotlight: (id: string) => void
}) {
  const [applied, setApplied] = useState(false)

  return (
    <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs">
      <div className="flex items-start gap-2">
        <Lightbulb size={14} className="mt-0.5 shrink-0 text-amber-400" />
        <div className="flex-1">
          <p className="font-semibold text-amber-300 mb-1">Suggestion</p>
          <p className="text-muted-foreground leading-relaxed mb-1">
            <span className="font-medium text-foreground/80">Issue:</span> {data.issue}
          </p>
          <p className="text-muted-foreground leading-relaxed">
            <span className="font-medium text-foreground/80">Fix:</span> {data.suggestion}
          </p>
          <div className="flex items-center gap-2 mt-2">
            {data.fix && !applied && (
              <button
                onClick={() => {
                  onApply()
                  setApplied(true)
                }}
                className="inline-flex items-center gap-1 rounded bg-amber-500/20 px-2 py-1 text-[10px] font-medium text-amber-300 hover:bg-amber-500/30 transition-colors"
              >
                <Wrench size={10} />
                Apply Fix
              </button>
            )}
            {applied && (
              <span className="inline-flex items-center gap-1 text-[10px] text-green-400">
                <CheckCircle2 size={10} />
                Applied
              </span>
            )}
            <button
              onClick={() => onSpotlight(data.blockId)}
              className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
            >
              <Eye size={10} />
              View on canvas
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Explain Design Card                                                 */
/* ------------------------------------------------------------------ */

function ExplainDesignCard({
  data,
  onWalkThrough,
  onSpotlight,
}: {
  data: ExplainDesignOutput
  onWalkThrough: () => void
  onSpotlight: (id: string) => void
}) {
  return (
    <div className="rounded-lg border border-purple-500/30 bg-purple-500/5 p-3 text-xs">
      <div className="flex items-start gap-2">
        <GraduationCap size={14} className="mt-0.5 shrink-0 text-purple-400" />
        <div className="flex-1">
          <p className="font-semibold text-purple-300 mb-1.5">{data.title}</p>
          <div className="flex flex-col gap-1">
            {data.steps.map((step, idx) => (
              <button
                key={idx}
                onClick={() => onSpotlight(step.blockId)}
                className="flex items-center gap-2 rounded px-2 py-1 text-left text-muted-foreground hover:bg-purple-500/10 hover:text-foreground transition-colors"
              >
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-purple-500/20 text-[9px] font-bold text-purple-300">
                  {idx + 1}
                </span>
                <span className="truncate">{step.annotation}</span>
              </button>
            ))}
          </div>
          <button
            onClick={onWalkThrough}
            className="mt-2 inline-flex items-center gap-1 rounded bg-purple-500/20 px-2 py-1 text-[10px] font-medium text-purple-300 hover:bg-purple-500/30 transition-colors"
          >
            <Play size={10} />
            Walk Through
          </button>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Markdown renderer for AI prose                                      */
/* ------------------------------------------------------------------ */

function KofiMarkdown({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
        strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
        em: ({ children }) => <em className="italic text-muted-foreground">{children}</em>,
        code: ({ children }) => (
          <code className="rounded bg-muted px-1 py-0.5 text-[10px] font-mono text-purple-300">{children}</code>
        ),
        ul: ({ children }) => <ul className="mb-2 ml-3 list-disc space-y-0.5 last:mb-0">{children}</ul>,
        ol: ({ children }) => <ol className="mb-2 ml-3 list-decimal space-y-0.5 last:mb-0">{children}</ol>,
        li: ({ children }) => <li className="text-muted-foreground">{children}</li>,
        h3: ({ children }) => <h3 className="mb-1 mt-2 text-xs font-semibold text-foreground">{children}</h3>,
        h4: ({ children }) => <h4 className="mb-1 mt-1.5 text-xs font-medium text-foreground">{children}</h4>,
        a: ({ href, children }) => (
          <a href={href} className="text-purple-400 underline hover:text-purple-300" target="_blank" rel="noopener noreferrer">{children}</a>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  )
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export function AIChatPanel() {
  const editor = useEditor()
  const { setSpotlights, clearSpotlights, activateSpotlight, assignColors } = useBlockSpotlight()
  const [inputValue, setInputValue] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)
  const appliedRef = useRef<Set<string>>(new Set())
  const [rateLimitError, setRateLimitError] = useState<{ message: string; retryAfter: number } | null>(null)
  const [retryCountdown, setRetryCountdown] = useState(0)
  const [workflowModal, setWorkflowModal] = useState<{ messageId: string } | null>(null)

  // Stable ref to editor so callbacks never read stale context
  const editorRef = useRef(editor)
  editorRef.current = editor

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/cms/block-editor-chat",
        prepareSendMessagesRequest: ({ id, messages }) => ({
          body: {
            messages,
            id,
            pageState: stripParentIds(editorRef.current.state.blocks),
            selectedBlockId: editorRef.current.state.selectedBlockId,
          },
        }),
      }),
    []
  )

  const handleChatError = useCallback((error: Error) => {
    if (error.message.includes("429") || error.message.toLowerCase().includes("too many")) {
      const retryMatch = error.message.match(/(\d+)/i)
      const retryAfter = retryMatch ? Math.min(parseInt(retryMatch[1], 10), 60) : 10
      setRateLimitError({ message: "Too many requests - please slow down", retryAfter })
      setRetryCountdown(retryAfter)
    }
  }, [])

  const { messages, sendMessage, status, setMessages } = useChat({
    transport,
    onError: handleChatError,
  })

  /* ---- Collect spotlights from latest assistant message ---- */
  const latestSpotlights = useMemo(() => {
    const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant")
    if (!lastAssistant?.parts) return []

    const spotlights: Array<{ blockId: string; annotation: string; color?: SpotlightColor }> = []
    let colorIdx = 0

    for (const part of lastAssistant.parts) {
      if (!isToolPart(part)) continue
      const toolName = toolNameFromPartType(part.type)

      if (toolName === "spotlightBlock" && part.state === "output-available") {
        const output = (part.output ?? part.input) as unknown as SpotlightBlockOutput
        spotlights.push({
          blockId: output.blockId,
          annotation: output.annotation,
          color: output.color || SPOTLIGHT_COLORS[colorIdx % SPOTLIGHT_COLORS.length],
        })
        colorIdx++
      }
    }

    return spotlights
  }, [messages])

  // Push spotlights to editor context when they change
  useEffect(() => {
    if (latestSpotlights.length > 0) {
      setSpotlights(assignColors(latestSpotlights))
    } else {
      clearSpotlights()
    }
  }, [latestSpotlights, setSpotlights, clearSpotlights, assignColors])

  /* ---- Extract workflows for modal ---- */
  const workflows = useMemo(() => extractDesignWorkflows(messages), [messages])

  /* ---- Apply tool output to editor ---- */
  const applyToolOutput = useCallback(
    (toolName: KofiToolName, output: Record<string, unknown>) => {
      const ed = editorRef.current

      switch (toolName) {
        case "setPageBlocks": {
          const raw = output.blocks
          if (Array.isArray(raw) && raw.length > 0) {
            const hydrated = rehydrateParentIds(raw as Block[])
            ed.setBlocks(hydrated)
          }
          break
        }
        case "addBlock": {
          const rawBlock = output.block as Record<string, unknown> | undefined
          if (!rawBlock) break

          const tag = (rawBlock.tag as Block["tag"]) || "div"
          const newBlock: Block = {
            id: (rawBlock.id as string) || generateId(),
            tag,
            className: (rawBlock.className as string) || "",
            textContent: (rawBlock.textContent as string) || undefined,
            attrs: rawBlock.attrs as Record<string, string> | undefined,
            children: isContainerTag(tag) ? [] : undefined,
            parentId: null,
            animation: rawBlock.animation as Block["animation"] | undefined,
          }

          if (Array.isArray(rawBlock.children) && rawBlock.children.length > 0) {
            newBlock.children = rehydrateParentIds(rawBlock.children as Block[], newBlock.id)
          }

          const parentId = (output.parentId as string) ?? null
          const index = (output.index as number) ?? undefined
          ed.addBlockRaw(newBlock, parentId, index)
          break
        }
        case "updateBlock": {
          const blockId = output.blockId as string
          if (!blockId) break

          const updates: Partial<Block> = {}
          if (output.className !== null && output.className !== undefined) updates.className = output.className as string
          if (output.textContent !== null && output.textContent !== undefined) updates.textContent = output.textContent as string
          if (output.attrs !== null && output.attrs !== undefined) updates.attrs = output.attrs as Record<string, string>
          if (output.tag !== null && output.tag !== undefined) updates.tag = output.tag as Block["tag"]
          if (output.animation !== null && output.animation !== undefined) updates.animation = output.animation as Block["animation"]

          ed.updateBlock(blockId, updates)
          break
        }
        case "removeBlock": {
          const blockId = output.blockId as string
          if (blockId) ed.removeBlock(blockId)
          break
        }
        case "moveBlock": {
          const blockId = output.blockId as string
          const targetParentId = (output.targetParentId as string) ?? null
          const targetIndex = (output.targetIndex as number) ?? 0
          if (blockId) ed.moveBlock(blockId, targetParentId, targetIndex)
          break
        }
        case "suggestImprovement": {
          // Fix is applied on user action, not automatically
          break
        }
        // spotlightBlock, explainDesign, showDesignError are UI-only — handled in rendering
        default:
          break
      }
    },
    []
  )

  const applyImprovementFix = useCallback(
    (data: SuggestImprovementOutput) => {
      if (!data.fix) return
      const ed = editorRef.current
      const updates: Partial<Block> = {}
      if (data.fix.className) updates.className = data.fix.className as string
      if (data.fix.textContent) updates.textContent = data.fix.textContent as string
      if (data.fix.tag) updates.tag = data.fix.tag as Block["tag"]
      if (data.fix.attrs) updates.attrs = data.fix.attrs as Record<string, string>
      ed.updateBlock(data.blockId, updates)
    },
    []
  )

  /* ---- Watch messages for completed tool calls ---- */
  useEffect(() => {
    for (const msg of messages) {
      if (msg.role !== "assistant" || !msg.parts) continue
      for (const part of msg.parts) {
        if (!isToolPart(part)) continue
        if (part.state !== "output-available") continue
        if (appliedRef.current.has(part.toolCallId)) continue

        appliedRef.current.add(part.toolCallId)
        const toolName = toolNameFromPartType(part.type)
        // Only auto-apply building tools
        if (BUILDING_TOOLS.has(toolName)) {
          const output = part.output ?? part.input
          if (output) applyToolOutput(toolName, output as Record<string, unknown>)
        }
      }
    }
  }, [messages, applyToolOutput])

  /* ---- Auto-scroll ---- */
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, status])

  /* ---- Rate limit countdown ---- */
  useEffect(() => {
    if (retryCountdown <= 0) {
      setRateLimitError(null)
      return
    }
    const timer = setTimeout(() => setRetryCountdown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [retryCountdown])

  /* ---- Send ---- */
  const handleSend = async () => {
    const text = inputValue.trim()
    if (!text || retryCountdown > 0) return

    setInputValue("")
    setRateLimitError(null)

    try {
      await sendMessage({ text })
    } catch (error: unknown) {
      if (error && typeof error === "object" && "message" in error) {
        const errMsg = (error as { message: string }).message
        if (errMsg.includes("429") || errMsg.toLowerCase().includes("rate")) {
          const retryMatch = errMsg.match(/(\d+)\s*seconds?/i)
          const retryAfter = retryMatch ? parseInt(retryMatch[1], 10) : 10
          setRateLimitError({ message: "You're sending messages too quickly", retryAfter })
          setRetryCountdown(retryAfter)
          setInputValue(text)
        }
      }
    }
  }

  const handleSpotlightClick = useCallback(
    (blockId: string) => {
      activateSpotlight(blockId)
    },
    [activateSpotlight]
  )

  const isStreaming = status === "streaming" || status === "submitted"

  /* ---- Extract special tool parts from an assistant message ---- */
  const extractToolData = (msg: UIMessage) => {
    const buildingToolParts: Array<{ type: string; toolCallId: string; state: string }> = []
    const spotlights: Array<SpotlightBlockOutput & { color: SpotlightColor }> = []
    const designErrors: ShowDesignErrorOutput[] = []
    const improvements: SuggestImprovementOutput[] = []
    const explanations: ExplainDesignOutput[] = []

    let colorIdx = 0

    for (const part of msg.parts || []) {
      if (!isToolPart(part)) continue
      const toolName = toolNameFromPartType(part.type)

      if (BUILDING_TOOLS.has(toolName)) {
        buildingToolParts.push(part as { type: string; toolCallId: string; state: string })
      } else if (toolName === "spotlightBlock" && part.state === "output-available") {
        const output = (part.output ?? part.input) as unknown as SpotlightBlockOutput
        spotlights.push({
          ...output,
          color: output.color || SPOTLIGHT_COLORS[colorIdx % SPOTLIGHT_COLORS.length],
        })
        colorIdx++
      } else if (toolName === "showDesignError" && part.state === "output-available") {
        designErrors.push((part.output ?? part.input) as unknown as ShowDesignErrorOutput)
      } else if (toolName === "suggestImprovement" && part.state === "output-available") {
        improvements.push((part.output ?? part.input) as unknown as SuggestImprovementOutput)
      } else if (toolName === "explainDesign" && part.state === "output-available") {
        explanations.push((part.output ?? part.input) as unknown as ExplainDesignOutput)
      }
    }

    return { buildingToolParts, spotlights, designErrors, improvements, explanations }
  }

  /* ---- Suggested questions ---- */
  const hasBlocks = editor.state.blocks.length > 0
  const suggestedQuestions = hasBlocks
    ? [
        "Explain the structure of this page",
        "How can I improve accessibility?",
        "Walk me through this layout",
        "Suggest design improvements",
      ]
    : [
        "Build a modern hero section with a CTA",
        "Create a pricing cards layout",
        "Add a dark navbar with logo and links",
      ]

  /* ---- Workflow modal state ---- */
  const activeWorkflow = workflowModal
    ? workflows.find((w) => w.messageId === workflowModal.messageId)
    : null

  return (
    <aside className="flex w-80 flex-col border-l border-border bg-card">
      {/* Header — Kofi branding */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-purple-600">
            <GraduationCap className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-card-foreground">Kofi</h2>
            <p className="text-[10px] text-muted-foreground">Page builder tutor</p>
          </div>
        </div>
        {messages.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setMessages([])
              appliedRef.current.clear()
              clearSpotlights()
            }}
            className="h-7 gap-1 px-2 text-xs text-muted-foreground"
          >
            <RotateCcw size={12} />
            Clear
          </Button>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10">
              <GraduationCap className="h-6 w-6 text-purple-400" />
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium text-card-foreground">
                Hey, I&apos;m Kofi!
              </p>
              <p className="text-xs text-muted-foreground max-w-[220px]">
                {hasBlocks
                  ? "I can help you understand, improve, and build on your current page. Ask me anything!"
                  : "I'll help you build and learn page design. Describe what you want to create!"}
              </p>
            </div>
            <div className="flex flex-col gap-1.5 w-full mt-2">
              {suggestedQuestions.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => {
                    setInputValue("")
                    sendMessage({ text: suggestion })
                  }}
                  className="rounded-md bg-accent px-3 py-2 text-xs text-left text-accent-foreground hover:bg-accent/80 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-4">
          {messages.map((msg) => {
            const text = getTextFromParts(msg)

            if (msg.role === "user") {
              return (
                <div key={msg.id} className="flex items-start gap-2 justify-end">
                  <div className="max-w-[85%] rounded-lg bg-primary px-3 py-2 text-xs text-primary-foreground">
                    {text}
                  </div>
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent">
                    <User size={12} className="text-accent-foreground" />
                  </div>
                </div>
              )
            }

            // Assistant message
            const { buildingToolParts, spotlights, designErrors, improvements, explanations } =
              extractToolData(msg)

            // Check if this message has a workflow (multiple spotlights)
            const msgWorkflow = workflows.find((w) => w.messageId === msg.id)

            return (
              <div key={msg.id} className="flex items-start gap-2">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-500/15">
                  <GraduationCap size={12} className="text-purple-400" />
                </div>
                <div className="flex flex-col gap-1.5 max-w-[85%]">
                  {/* Building tool badges */}
                  {buildingToolParts.map((part, i) => (
                    <ToolCallBubble
                      key={(part as Record<string, unknown>).toolCallId as string ?? i}
                      toolName={toolNameFromPartType(part.type)}
                      state={(part as Record<string, unknown>).state as string ?? "complete"}
                    />
                  ))}

                  {/* Spotlight badges */}
                  {spotlights.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {spotlights.map((s, idx) => (
                        <SpotlightBadge
                          key={`${s.blockId}-${idx}`}
                          blockId={s.blockId}
                          annotation={s.annotation}
                          color={s.color}
                          index={idx}
                          onClick={handleSpotlightClick}
                        />
                      ))}
                    </div>
                  )}

                  {/* Design error cards */}
                  {designErrors.map((err, idx) => (
                    <DesignErrorCard key={`err-${idx}`} data={err} onSpotlight={handleSpotlightClick} />
                  ))}

                  {/* Improvement cards */}
                  {improvements.map((imp, idx) => (
                    <ImprovementCard
                      key={`imp-${idx}`}
                      data={imp}
                      onApply={() => applyImprovementFix(imp)}
                      onSpotlight={handleSpotlightClick}
                    />
                  ))}

                  {/* Explain design cards */}
                  {explanations.map((exp, idx) => (
                    <ExplainDesignCard
                      key={`exp-${idx}`}
                      data={exp}
                      onWalkThrough={() => setWorkflowModal({ messageId: msg.id })}
                      onSpotlight={handleSpotlightClick}
                    />
                  ))}

                  {/* AI prose (markdown) */}
                  {text && (
                    <div className="rounded-lg bg-accent px-3 py-2">
                      <KofiMarkdown content={text} />
                    </div>
                  )}

                  {/* Workflow modal trigger */}
                  {msgWorkflow && msgWorkflow.steps.length >= 2 && (
                    <button
                      onClick={() => setWorkflowModal({ messageId: msg.id })}
                      className="inline-flex items-center gap-1.5 self-start rounded-md bg-purple-500/10 px-2.5 py-1.5 text-[10px] font-medium text-purple-300 hover:bg-purple-500/20 transition-colors"
                    >
                      <Play size={10} />
                      View as walkthrough ({msgWorkflow.steps.length} steps)
                    </button>
                  )}
                </div>
              </div>
            )
          })}

          {isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 size={12} className="animate-spin" />
              Kofi is thinking...
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-border p-3">
        {rateLimitError && retryCountdown > 0 && (
          <div className="mb-2 flex items-center gap-2 rounded-md bg-amber-500/10 px-3 py-2 text-xs text-amber-400">
            <Clock size={12} />
            <span>{rateLimitError.message}. Retry in {retryCountdown}s</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder={retryCountdown > 0 ? `Wait ${retryCountdown}s...` : "Ask Kofi anything..."}
            disabled={isStreaming || retryCountdown > 0}
            className={cn(
              "h-9 flex-1 rounded-md border border-border bg-input px-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-purple-500/50 disabled:opacity-50",
              retryCountdown > 0 && "border-amber-500/30"
            )}
          />
          <Button
            size="sm"
            onClick={handleSend}
            disabled={isStreaming || !inputValue.trim() || retryCountdown > 0}
            className="h-9 w-9 p-0 bg-purple-600 hover:bg-purple-700"
          >
            {isStreaming ? (
              <Loader2 size={14} className="animate-spin" />
            ) : retryCountdown > 0 ? (
              <Clock size={14} className="text-amber-400" />
            ) : (
              <Send size={14} />
            )}
          </Button>
        </div>
      </div>

      {/* Workflow modal */}
      {activeWorkflow && (
        <DesignWorkflowModal
          workflow={activeWorkflow}
          open={!!workflowModal}
          onClose={() => setWorkflowModal(null)}
          onViewOnCanvas={(step) => {
            handleSpotlightClick(step.blockId)
          }}
          onPlayAll={(steps) => {
            setSpotlights(
              steps.map((s) => ({
                blockId: s.blockId,
                annotation: s.annotation,
                color: s.color,
              }))
            )
          }}
        />
      )}
    </aside>
  )
}
