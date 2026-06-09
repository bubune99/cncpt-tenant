"use client"

import React, { useState, useRef, useEffect, useMemo, useCallback } from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport, isToolUIPart } from "ai"
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
  ImageIcon,
  Camera,
  X,
  Search,
  Wand2,
  ExternalLink,
  Square,
  ScanEye,
  Download,
} from "lucide-react"
import type { Block } from "@/lib/cms/block-editor/types"
import { isContainerTag } from "@/lib/cms/block-editor/types"
import {
  generateId,
  rehydrateParentIds,
  stripParentIds,
} from "@/lib/cms/block-editor/tree-utils"
import {
  SPOTLIGHT_COLORS,
  SPOTLIGHT_COLOR_MAP,
  type KofiToolName,
  type BlockSpotlight,
  type SpotlightColor,
  type SpotlightBlockOutput,
  type ExplainDesignOutput,
  type SuggestImprovementOutput,
  type ShowDesignErrorOutput,
  type SearchMediaOutput,
  type GenerateImageOutput,
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

function toolNameFromPartType(partType: string): KofiToolName {
  return partType.replace("tool-", "") as KofiToolName
}

function stripThinkTags(text: string): string {
  return text.replace(/<think>[\s\S]*?<\/think>/g, "").trim()
}

function getTextFromParts(msg: UIMessage): string {
  if (!msg.parts || !Array.isArray(msg.parts)) return ""
  return stripThinkTags(
    msg.parts
      .filter((p): p is { type: "text"; text: string } => p.type === "text" && typeof p.text === "string")
      .map((p) => p.text)
      .join("")
  )
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
  importAndAnalyze: Download,
  repairBlock: Wrench,
  explainDesign: GraduationCap,
  suggestImprovement: Lightbulb,
  showDesignError: AlertTriangle,
  searchMedia: Search,
  generateImage: Wand2,
  analyzeDesign: ScanEye,
}
const actionLabels: Record<string, string> = {
  setPageBlocks: "Rebuilt the page",
  addBlock: "Added a block",
  updateBlock: "Updated a block",
  removeBlock: "Removed a block",
  moveBlock: "Moved a block",
  spotlightBlock: "Spotlighted a block",
  importAndAnalyze: "Imported external code",
  repairBlock: "Repaired a block",
  explainDesign: "Design walkthrough",
  suggestImprovement: "Suggested improvement",
  showDesignError: "Flagged design issue",
  searchMedia: "Searching media library",
  generateImage: "Generating image",
  analyzeDesign: "Analyzing design",
}

/* Building tools that mutate the page */
const BUILDING_TOOLS = new Set(["setPageBlocks", "addBlock", "updateBlock", "removeBlock", "moveBlock", "generateImage", "importAndAnalyze", "repairBlock"])

/* Agent tools (informational — Kofi reads results) */
const AGENT_TOOLS = new Set(["searchMedia", "analyzeDesign"])

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
/*  Media Search Card                                                    */
/* ------------------------------------------------------------------ */

function MediaSearchCard({ data }: { data: SearchMediaOutput }) {
  if (!data.media || data.media.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-accent/50 p-3 text-xs">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Search size={12} />
          <span>No media found</span>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-sky-500/30 bg-sky-500/5 p-3 text-xs">
      <div className="flex items-center gap-2 mb-2">
        <Search size={12} className="text-sky-400" />
        <span className="font-semibold text-sky-300">
          Found {data.media.length} media item{data.media.length !== 1 ? "s" : ""}
        </span>
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {data.media.slice(0, 8).map((item) => (
          <div key={item.id} className="group relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.url}
              alt={item.alt || item.filename}
              className="h-14 w-full rounded border border-border object-cover"
            />
            <div className="absolute inset-0 flex items-end rounded bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="truncate px-1 pb-0.5 text-[8px] text-white">
                {item.filename}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Generated Image Card                                                */
/* ------------------------------------------------------------------ */

function GeneratedImageCard({ data }: { data: GenerateImageOutput }) {
  return (
    <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 text-xs">
      <div className="flex items-center gap-2 mb-2">
        <Wand2 size={12} className="text-emerald-400" />
        <span className="font-semibold text-emerald-300">Image generated</span>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={data.url}
        alt={data.prompt}
        className="w-full rounded border border-border object-cover max-h-40"
      />
      <p className="mt-1.5 text-muted-foreground/80 italic truncate">{data.prompt}</p>
      <a
        href="/admin/media"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-1.5 inline-flex items-center gap-1 text-[10px] text-emerald-400 hover:text-emerald-300 transition-colors"
      >
        <ExternalLink size={10} />
        View in media library
      </a>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Design Analysis Card                                                */
/* ------------------------------------------------------------------ */

function DesignAnalysisCard({ data }: { data: Record<string, unknown> }) {
  const [expanded, setExpanded] = useState(false)
  const sections = (data.sections as Array<{ name: string; layout: string; elements: string[] }>) || []
  const colors = data.colorPalette as Record<string, string> | undefined
  const effects = (data.effects as string[]) || []
  const motionPresets = (data.motionPresets as string[]) || []
  const buildOrder = (data.buildOrder as string[]) || []

  return (
    <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/5 p-3 text-xs">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 w-full text-left"
      >
        <ScanEye size={12} className="text-cyan-400" />
        <span className="font-semibold text-cyan-300">Design Analysis</span>
        <span className="text-muted-foreground ml-auto">{sections.length} sections</span>
        <ChevronRight size={12} className={cn("text-muted-foreground transition-transform", expanded && "rotate-90")} />
      </button>

      {expanded && (
        <div className="mt-2 space-y-2">
          {/* Sections */}
          {sections.map((s, i) => (
            <div key={i} className="rounded bg-background/50 p-2">
              <div className="font-medium text-foreground">{s.name}</div>
              <div className="text-muted-foreground mt-0.5">{s.layout}</div>
              <div className="flex flex-wrap gap-1 mt-1">
                {s.elements?.map((el, j) => (
                  <span key={j} className="px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 text-[10px]">{el}</span>
                ))}
              </div>
            </div>
          ))}

          {/* Colors */}
          {colors && (
            <div className="rounded bg-background/50 p-2">
              <div className="font-medium text-foreground mb-1">Colors</div>
              <div className="grid grid-cols-2 gap-1 text-[10px] text-muted-foreground">
                {Object.entries(colors).map(([k, v]) => (
                  <div key={k}><span className="text-foreground">{k}:</span> {v}</div>
                ))}
              </div>
            </div>
          )}

          {/* Effects & Motion */}
          {(effects.length > 0 || motionPresets.length > 0) && (
            <div className="flex flex-wrap gap-1">
              {effects.map((e, i) => (
                <span key={`fx-${i}`} className="px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-300 text-[10px]">{e}</span>
              ))}
              {motionPresets.map((p, i) => (
                <span key={`mp-${i}`} className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 text-[10px]">{p}</span>
              ))}
            </div>
          )}

          {/* Build Order */}
          {buildOrder.length > 0 && (
            <div className="text-[10px] text-muted-foreground">
              <span className="text-foreground font-medium">Build order:</span> {buildOrder.join(" → ")}
            </div>
          )}
        </div>
      )}
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
/*  Image helpers for multimodal chat                                  */
/* ------------------------------------------------------------------ */

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function resizeImage(dataUrl: string, maxWidth: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      if (img.width <= maxWidth) {
        resolve(dataUrl)
        return
      }
      const scale = maxWidth / img.width
      const canvas = document.createElement("canvas")
      canvas.width = maxWidth
      canvas.height = Math.round(img.height * scale)
      const ctx = canvas.getContext("2d")!
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL("image/png"))
    }
    img.onerror = reject
    img.src = dataUrl
  })
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

const MAX_CONTINUATIONS = 3
const COMPACTION_KEEP_RECENT = 12

class MessageErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: string | null }
> {
  state = { error: null as string | null }
  static getDerivedStateFromError(err: Error) {
    return { error: err.message }
  }
  render() {
    if (this.state.error) {
      return (
        <div className="rounded-md bg-red-500/10 px-3 py-2 text-xs text-red-400">
          Render error: {this.state.error}
          <button
            className="ml-2 underline"
            onClick={() => this.setState({ error: null })}
          >
            Retry
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

export function AIChatPanel() {
  const editor = useEditor()
  const { setSpotlights, clearSpotlights, activateSpotlight, assignColors } = useBlockSpotlight()
  const [inputValue, setInputValue] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)
  const appliedRef = useRef<Set<string>>(new Set())
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const savePendingRef = useRef(false) // true when a building tool was applied but not yet saved
  const [rateLimitError, setRateLimitError] = useState<{ message: string; retryAfter: number } | null>(null)
  const [retryCountdown, setRetryCountdown] = useState(0)
  const [workflowModal, setWorkflowModal] = useState<{ messageId: string } | null>(null)
  const [pendingScreenshot, setPendingScreenshot] = useState<string | null>(null)
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Auto-continue state
  const continuationCountRef = useRef(0)
  const lastFinishReasonRef = useRef<string | undefined>(undefined)
  const wasStoppedRef = useRef(false)
  const [continuationStatus, setContinuationStatus] = useState<string | null>(null)

  // Message queue state (type while Kofi is streaming)
  const [queuedMessage, setQueuedMessage] = useState<string | null>(null)
  const queuedMessageRef = useRef<string | null>(null)
  const queuedFilesRef = useRef<Array<{ type: "file"; mediaType: string; url: string }>>([])

  // Keep ref in sync for use in callbacks (avoids stale closures)
  queuedMessageRef.current = queuedMessage

  // Stable ref to editor so callbacks never read stale context
  const editorRef = useRef(editor)
  editorRef.current = editor

  // Compact older messages to reduce payload size — strips verbose tool outputs
  const compactMessages = useCallback((msgs: UIMessage[]): UIMessage[] => {
    if (msgs.length <= COMPACTION_KEEP_RECENT) return msgs
    const cutoff = msgs.length - COMPACTION_KEEP_RECENT
    return msgs.map((msg, idx) => {
      if (idx >= cutoff) return msg          // Recent: keep intact
      if (msg.role === "user") return msg     // User msgs: small, keep
      // Older assistant msgs: strip verbose tool outputs
      if (msg.role === "assistant" && msg.parts) {
        const compactedParts = msg.parts.map((part) => {
          if (!isToolUIPart(part)) return part
          if (part.state === "output-available" && part.output) {
            return { ...part, output: { _compacted: true, tool: part.type } }
          }
          return part
        })
        return { ...msg, parts: compactedParts }
      }
      return msg
    })
  }, [])

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/cms/block-editor-chat",
        prepareSendMessagesRequest: ({ id, messages: msgs }) => ({
          body: {
            messages: compactMessages(msgs),
            id,
            pageState: stripParentIds(editorRef.current.state.blocks),
            selectedBlockId: editorRef.current.state.selectedBlockId,
            sourceCode: editorRef.current.state.currentPage?.sourceCode || undefined,
            sourceDeps: editorRef.current.state.currentPage?.sourceDeps || undefined,
          },
        }),
      }),
    [compactMessages]
  )

  const processFiles = useCallback(async (files: File[]) => {
    const imageFiles = files.filter((f) => f.type.startsWith("image/"))
    if (imageFiles.length === 0) return
    const remaining = 3 - uploadedImages.length
    const toProcess = imageFiles.slice(0, remaining)
    const results: string[] = []
    for (const file of toProcess) {
      try {
        const dataUrl = await fileToDataUrl(file)
        const resized = await resizeImage(dataUrl, 1200)
        results.push(resized)
      } catch (e) {
        console.warn("[Kofi] Image processing failed:", e)
      }
    }
    if (results.length > 0) {
      setUploadedImages((prev) => [...prev, ...results].slice(0, 3))
    }
  }, [uploadedImages.length])

  const [chatError, setChatError] = useState<string | null>(null)

  const handleChatError = useCallback((error: Error) => {
    console.error("[Kofi] Chat error:", error)
    if (error.message.includes("429") || error.message.toLowerCase().includes("too many")) {
      const retryMatch = error.message.match(/(\d+)/i)
      const retryAfter = retryMatch ? Math.min(parseInt(retryMatch[1], 10), 60) : 10
      setRateLimitError({ message: "Too many requests - please slow down", retryAfter })
      setRetryCountdown(retryAfter)
    } else {
      setChatError(error.message || "Something went wrong")
    }
  }, [])

  const { messages, sendMessage, status, setMessages, stop } = useChat({
    transport,
    onError: handleChatError,

    onFinish: ({ isAbort, finishReason }) => {
      lastFinishReasonRef.current = finishReason
      if (finishReason === "stop" || isAbort) {
        continuationCountRef.current = 0
        setContinuationStatus(null)
      }
      if (isAbort) wasStoppedRef.current = false
      // Dequeue message if one is waiting and Kofi finished naturally or was stopped
      const queued = queuedMessageRef.current
      if (queued && (finishReason === "stop" || isAbort)) {
        const files = [...queuedFilesRef.current]
        setQueuedMessage(null)
        queuedMessageRef.current = null
        queuedFilesRef.current = []
        setTimeout(() => sendMessage({ text: queued, ...(files.length > 0 ? { files } : {}) }), 100)
      }
    },

    sendAutomaticallyWhen: (_opts: { messages: UIMessage[] }) => {
      if (wasStoppedRef.current) {
        wasStoppedRef.current = false
        continuationCountRef.current = 0
        setContinuationStatus(null)
        return false
      }
      if (queuedMessageRef.current) {
        // User wants to interject — stop auto-continue
        continuationCountRef.current = 0
        setContinuationStatus(null)
        return false
      }
      const reason = lastFinishReasonRef.current
      if (reason !== "length" && reason !== "tool-calls") return false
      if (continuationCountRef.current >= MAX_CONTINUATIONS) {
        continuationCountRef.current = 0
        setContinuationStatus(null)
        return false
      }
      continuationCountRef.current += 1
      setContinuationStatus(`Continuing (${continuationCountRef.current}/${MAX_CONTINUATIONS})...`)
      return true
    },
  })

  /* ---- Collect spotlights from latest assistant message ---- */
  const latestSpotlights = useMemo(() => {
    const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant")
    if (!lastAssistant?.parts) return []

    const spotlights: Array<{ blockId: string; annotation: string; color?: SpotlightColor }> = []
    let colorIdx = 0

    for (const part of lastAssistant.parts) {
      if (!isToolUIPart(part)) continue
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
            // Ensure every block (and nested child) has an ID
            const ensureIds = (blocks: Block[]): Block[] =>
              blocks.map((b) => ({
                ...b,
                id: b.id || generateId(),
                children: b.children ? ensureIds(b.children) : undefined,
              }))
            const withIds = ensureIds(raw as Block[])
            const hydrated = rehydrateParentIds(withIds)
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
        case "generateImage": {
          // Composite tool: generates image + returns addBlock-compatible data
          if (output._action === "error" || output.error) break
          // Treat like addBlock
          const rawImgBlock = output.block as Record<string, unknown> | undefined
          if (!rawImgBlock) break
          const imgTag = (rawImgBlock.tag as Block["tag"]) || "img"
          const imgBlock: Block = {
            id: (rawImgBlock.id as string) || generateId(),
            tag: imgTag,
            className: (rawImgBlock.className as string) || "w-full h-auto object-cover",
            attrs: rawImgBlock.attrs as Record<string, string> | undefined,
            children: undefined,
            parentId: null,
          }
          const imgParentId = (output.parentId as string) ?? null
          const imgIndex = (output.index as number) ?? undefined
          ed.addBlockRaw(imgBlock, imgParentId, imgIndex)
          break
        }
        case "importAndAnalyze": {
          // Composite tool: imports code + optionally auto-places blocks
          if (!output.success) break
          if (output._action === "setPageBlocks" && Array.isArray(output.blocks)) {
            const ensureIds = (blocks: Block[]): Block[] =>
              blocks.map((b) => ({
                ...b,
                id: b.id || generateId(),
                children: b.children ? ensureIds(b.children) : undefined,
              }))
            const withIds = ensureIds(output.blocks as Block[])
            const hydrated = rehydrateParentIds(withIds)
            ed.setBlocks(hydrated)
          }
          break
        }
        case "repairBlock": {
          // Delegates to existing actions based on _action field
          const action = output._action as string
          if (action === "removeBlock") {
            const blockId = output.blockId as string
            if (blockId) ed.removeBlock(blockId)
          } else if (action === "updateBlock") {
            const blockId = output.blockId as string
            if (!blockId) break
            const updates: Partial<Block> = {}
            if (output.className !== null && output.className !== undefined) updates.className = output.className as string
            if (output.textContent !== null && output.textContent !== undefined) updates.textContent = output.textContent as string
            if (output.tag !== null && output.tag !== undefined) updates.tag = output.tag as Block["tag"]
            if (output.commerce !== null && output.commerce !== undefined) updates.commerce = output.commerce as Block["commerce"]
            if (output.componentName !== null && output.componentName !== undefined) updates.componentName = output.componentName as string
            if (output.partialId !== null && output.partialId !== undefined) updates.partialId = output.partialId as string
            ed.updateBlock(blockId, updates)
          }
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
        if (!isToolUIPart(part)) continue
        if (part.state !== "output-available") continue
        if (appliedRef.current.has(part.toolCallId)) continue

        appliedRef.current.add(part.toolCallId)
        const toolName = toolNameFromPartType(part.type)
        // Only auto-apply building tools
        if (BUILDING_TOOLS.has(toolName)) {
          const output = part.output ?? part.input
          if (output) {
            applyToolOutput(toolName, output as Record<string, unknown>)
            savePendingRef.current = true
          }
        }
      }
    }
  }, [messages, applyToolOutput])

  /* ---- Auto-save after Kofi finishes (when streaming ends) ---- */
  useEffect(() => {
    // Only save when chat goes idle AND building tools were applied
    if (status !== "ready" || !savePendingRef.current) return

    savePendingRef.current = false
    // Debounce 500ms to let editor state settle
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(async () => {
      editorRef.current.saveCurrentPage()
      // Capture canvas screenshot for Kofi's visual feedback
      const el = document.querySelector("[data-screenshot-target]") as HTMLElement | null
      if (el) {
        try {
          const { captureScreenshot } = await import("@/lib/cms/block-editor/screenshot")
          const dataUrl = await captureScreenshot(el, { scale: 1, maxWidth: 800 })
          setPendingScreenshot(dataUrl)
        } catch (e) {
          console.warn("[Kofi] Screenshot capture failed:", e)
        }
      }
    }, 500)
  }, [status])

  // Cleanup save timer on unmount
  useEffect(() => {
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current) }
  }, [])

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

  const isStreaming = status === "streaming" || status === "submitted"

  /* ---- Stop ---- */
  const handleStop = useCallback(async () => {
    wasStoppedRef.current = true
    continuationCountRef.current = 0
    setContinuationStatus(null)
    await stop()
  }, [stop])

  /* ---- Send ---- */
  const handleSend = async () => {
    const text = inputValue.trim()
    if (!text || retryCountdown > 0) return
    setChatError(null)

    // Queue if Kofi is currently streaming
    if (isStreaming) {
      const files: Array<{ type: "file"; mediaType: string; url: string }> = []
      if (pendingScreenshot) {
        files.push({ type: "file", mediaType: "image/png", url: pendingScreenshot })
        setPendingScreenshot(null)
      }
      for (const img of uploadedImages) {
        files.push({ type: "file", mediaType: "image/png", url: img })
      }
      setUploadedImages([])
      setQueuedMessage(text)
      queuedFilesRef.current = files
      setInputValue("")
      return
    }

    setInputValue("")
    setRateLimitError(null)

    // Collect image files for multimodal message
    const files: Array<{ type: "file"; mediaType: string; url: string }> = []
    if (pendingScreenshot) {
      files.push({ type: "file", mediaType: "image/png", url: pendingScreenshot })
      setPendingScreenshot(null)
    }
    for (const img of uploadedImages) {
      files.push({ type: "file", mediaType: "image/png", url: img })
    }
    setUploadedImages([])

    try {
      await sendMessage({ text, ...(files.length > 0 ? { files } : {}) })
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

  /* ---- Extract special tool parts from an assistant message ---- */
  const extractToolData = (msg: UIMessage) => {
    const buildingToolParts: Array<{ type: string; toolCallId: string; state: string }> = []
    const agentToolParts: Array<{ type: string; toolCallId: string; state: string }> = []
    const spotlights: Array<SpotlightBlockOutput & { color: SpotlightColor }> = []
    const designErrors: ShowDesignErrorOutput[] = []
    const improvements: SuggestImprovementOutput[] = []
    const explanations: ExplainDesignOutput[] = []
    const mediaSearchResults: SearchMediaOutput[] = []
    const generatedImages: GenerateImageOutput[] = []
    const designAnalyses: Array<Record<string, unknown>> = []

    let colorIdx = 0

    for (const part of msg.parts || []) {
      if (!isToolUIPart(part)) continue
      const toolName = toolNameFromPartType(part.type)

      if (BUILDING_TOOLS.has(toolName)) {
        buildingToolParts.push(part as { type: string; toolCallId: string; state: string })
        // Also extract generated image data for the UI card
        if (toolName === "generateImage" && part.state === "output-available") {
          const output = (part.output ?? part.input) as unknown as Record<string, unknown>
          if (output.url && output._action !== "error") {
            generatedImages.push(output as unknown as GenerateImageOutput)
          }
        }
      } else if (AGENT_TOOLS.has(toolName)) {
        agentToolParts.push(part as { type: string; toolCallId: string; state: string })
        if (part.state === "output-available") {
          const output = (part.output ?? part.input) as unknown as Record<string, unknown>
          if (toolName === "searchMedia" && output.media) {
            mediaSearchResults.push(output as unknown as SearchMediaOutput)
          }
        }
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
      } else if (toolName === "analyzeDesign" && part.state === "output-available") {
        const output = (part.output ?? part.input) as unknown as Record<string, unknown>
        const analysis = (output.analysis ?? output) as Record<string, unknown>
        designAnalyses.push(analysis)
      }
    }

    return { buildingToolParts, agentToolParts, spotlights, designErrors, improvements, explanations, mediaSearchResults, generatedImages, designAnalyses }
  }

  /* ---- Suggested questions ---- */
  const hasBlocks = editor.state.blocks.length > 0
  const hasSourceCode = !!editor.state.currentPage?.sourceCode
  const suggestedQuestions = hasSourceCode
    ? hasBlocks
      ? [
          "Rebuild this page to match the source code",
          "Compare the current blocks with the source code",
          "Walk me through what needs fixing",
          "Suggest design improvements",
        ]
      : [
          "Build this page from the source code reference",
          "What does the source code describe?",
          "Start building section by section",
        ]
    : hasBlocks
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
              continuationCountRef.current = 0
              setContinuationStatus(null)
              setQueuedMessage(null)
              queuedFilesRef.current = []
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
                {hasSourceCode
                  ? "I have the original source code for this page. I can rebuild it section by section or help you refine what's here!"
                  : hasBlocks
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

        <MessageErrorBoundary>
        <div className="flex flex-col gap-4">
          {messages.map((msg) => {
            const text = getTextFromParts(msg)

            if (msg.role === "user") {
              const fileParts = (msg.parts || []).filter(
                (p): p is { type: "file"; mediaType: string; url: string } => p.type === "file"
              )
              return (
                <div key={msg.id} className="flex items-start gap-2 justify-end">
                  <div className="max-w-[85%] flex flex-col gap-1.5 items-end">
                    {fileParts.length > 0 && (
                      <div className="flex gap-1 flex-wrap justify-end">
                        {fileParts.map((fp, idx) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            key={idx}
                            src={fp.url}
                            alt={`Attached image ${idx + 1}`}
                            className="h-16 w-auto rounded border border-border object-cover"
                          />
                        ))}
                      </div>
                    )}
                    <div className="rounded-lg bg-primary px-3 py-2 text-xs text-primary-foreground">
                      {text}
                    </div>
                  </div>
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent">
                    <User size={12} className="text-accent-foreground" />
                  </div>
                </div>
              )
            }

            // Assistant message
            const { buildingToolParts, agentToolParts, spotlights, designErrors, improvements, explanations, mediaSearchResults, generatedImages, designAnalyses } =
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

                  {/* Agent tool badges (searching, generating) */}
                  {agentToolParts.map((part, i) => (
                    <ToolCallBubble
                      key={(part as Record<string, unknown>).toolCallId as string ?? `agent-${i}`}
                      toolName={toolNameFromPartType(part.type)}
                      state={(part as Record<string, unknown>).state as string ?? "complete"}
                    />
                  ))}

                  {/* Media search results */}
                  {mediaSearchResults.map((res, idx) => (
                    <MediaSearchCard key={`media-${idx}`} data={res} />
                  ))}

                  {/* Generated image cards */}
                  {generatedImages.map((img, idx) => (
                    <GeneratedImageCard key={`genimg-${idx}`} data={img} />
                  ))}

                  {/* Design analysis cards */}
                  {designAnalyses.map((analysis, idx) => (
                    <DesignAnalysisCard key={`analysis-${idx}`} data={analysis} />
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
              {continuationStatus || "Kofi is thinking..."}
            </div>
          )}
          {isStreaming && continuationStatus && messages[messages.length - 1]?.role === "assistant" && (
            <div className="flex items-center gap-2 text-xs text-purple-400">
              <Loader2 size={12} className="animate-spin" />
              {continuationStatus}
            </div>
          )}
        </div>
        </MessageErrorBoundary>
      </div>

      {/* Input */}
      <div className="border-t border-border p-3">
        {rateLimitError && retryCountdown > 0 && (
          <div className="mb-2 flex items-center gap-2 rounded-md bg-amber-500/10 px-3 py-2 text-xs text-amber-400">
            <Clock size={12} />
            <span>{rateLimitError.message}. Retry in {retryCountdown}s</span>
          </div>
        )}

        {chatError && (
          <div className="mb-2 flex items-center gap-2 rounded-md bg-red-500/10 px-3 py-2 text-xs text-red-400">
            <AlertCircle size={12} />
            <span className="flex-1 truncate">{chatError}</span>
            <button onClick={() => setChatError(null)} className="text-red-400 hover:text-red-200 shrink-0">
              <X size={10} />
            </button>
          </div>
        )}

        {/* Screenshot indicator */}
        {pendingScreenshot && (
          <div className="mb-2 flex items-center justify-between rounded-md bg-purple-500/10 px-3 py-1.5 text-[10px] text-purple-300">
            <div className="flex items-center gap-1.5">
              <Camera size={10} />
              <span>Kofi will see the canvas with your next message</span>
            </div>
            <button onClick={() => setPendingScreenshot(null)} className="text-purple-400 hover:text-purple-200">
              <X size={10} />
            </button>
          </div>
        )}

        {/* Uploaded image previews */}
        {uploadedImages.length > 0 && (
          <div className="mb-2 flex items-center gap-1.5">
            {uploadedImages.map((img, idx) => (
              <div key={idx} className="relative group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img} alt={`Upload ${idx + 1}`} className="h-12 w-12 rounded border border-border object-cover" />
                <button
                  onClick={() => setUploadedImages((prev) => prev.filter((_, i) => i !== idx))}
                  className="absolute -right-1 -top-1 hidden h-4 w-4 items-center justify-center rounded-full bg-destructive text-destructive-foreground group-hover:flex"
                >
                  <X size={8} />
                </button>
              </div>
            ))}
            <span className="text-[10px] text-muted-foreground">{uploadedImages.length}/3</span>
          </div>
        )}

        {/* Queued message indicator */}
        {queuedMessage && (
          <div className="mb-2 flex items-center justify-between rounded-md bg-purple-500/10 px-3 py-1.5 text-[10px] text-purple-300">
            <div className="flex items-center gap-1.5 min-w-0">
              <Clock size={10} className="shrink-0" />
              <span className="truncate">Queued: &ldquo;{queuedMessage}&rdquo;</span>
            </div>
            <button
              onClick={() => { setQueuedMessage(null); queuedFilesRef.current = [] }}
              className="text-purple-400 hover:text-purple-200 shrink-0 ml-1"
            >
              <X size={10} />
            </button>
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
            onPaste={(e) => {
              const items = Array.from(e.clipboardData?.items || [])
              const imageFiles = items
                .filter((item) => item.type.startsWith("image/"))
                .map((item) => item.getAsFile())
                .filter((f): f is File => f !== null)
              if (imageFiles.length > 0) {
                e.preventDefault()
                processFiles(imageFiles)
              }
            }}
            placeholder={
              retryCountdown > 0
                ? `Wait ${retryCountdown}s...`
                : isStreaming
                  ? "Type to queue a message..."
                  : "Ask Kofi anything..."
            }
            disabled={retryCountdown > 0}
            className={cn(
              "h-9 flex-1 rounded-md border border-border bg-input px-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-purple-500/50 disabled:opacity-50",
              retryCountdown > 0 && "border-amber-500/30",
              isStreaming && "border-purple-500/30"
            )}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) {
                processFiles(Array.from(e.target.files))
                e.target.value = ""
              }
            }}
          />
          <Button
            size="sm"
            variant="ghost"
            onClick={() => fileInputRef.current?.click()}
            disabled={isStreaming || uploadedImages.length >= 3}
            className="h-9 w-9 p-0 text-muted-foreground hover:text-foreground"
          >
            <ImageIcon size={14} />
          </Button>
          <Button
            size="sm"
            onClick={isStreaming ? handleStop : handleSend}
            disabled={isStreaming ? false : !inputValue.trim() || retryCountdown > 0}
            className={cn(
              "h-9 w-9 p-0",
              isStreaming
                ? "bg-red-600 hover:bg-red-700"
                : "bg-purple-600 hover:bg-purple-700"
            )}
          >
            {isStreaming ? (
              <Square size={12} className="fill-current" />
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
