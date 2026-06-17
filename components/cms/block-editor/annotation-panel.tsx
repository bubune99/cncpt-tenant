"use client"

/**
 * AnnotationPanel — the side list of builder annotations (notes pinned to
 * blocks in annotate mode). Lets the user review/resolve/delete notes, jump to
 * the annotated block, and hand the whole batch to the AI ("apply my notes").
 */

import { useEditor } from "@/lib/cms/block-editor/editor-context"
import { MessageSquarePlus, Check, Trash2, CornerUpLeft, Sparkles } from "lucide-react"
import { cn } from "@/lib/cms/utils"

interface AnnotationPanelProps {
  /** Send the "apply my notes" instruction to the builder AI chat. */
  onApplyNotes?: () => void
}

export function AnnotationPanel({ onApplyNotes }: AnnotationPanelProps) {
  const {
    state,
    setAnnotateMode,
    removeAnnotation,
    toggleAnnotationResolved,
    scrollToBlock,
    selectBlock,
    getBlockById,
  } = useEditor()

  const annotations = state.annotations
  const open = annotations.filter((a) => !a.resolved)

  const blockLabel = (blockId: string): string => {
    const b = getBlockById(blockId)
    if (!b) return "(deleted block)"
    return b.label || b.tag + (b.textContent ? ` · ${b.textContent.slice(0, 20)}` : "")
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
        <div className="flex items-center gap-2">
          <MessageSquarePlus size={15} className="text-[#BE6E4B]" />
          <span className="text-sm font-semibold">Annotations</span>
          {open.length > 0 && (
            <span className="rounded-full bg-[#BE6E4B] px-1.5 py-0.5 text-[10px] font-semibold text-[#FBF4EE]">{open.length}</span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setAnnotateMode(!state.annotateMode)}
          className={cn(
            "rounded-md px-2 py-1 text-[11px] font-medium transition-colors",
            state.annotateMode ? "bg-[#BE6E4B] text-[#FBF4EE]" : "bg-muted text-muted-foreground hover:text-foreground"
          )}
        >
          {state.annotateMode ? "Annotating…" : "Annotate"}
        </button>
      </div>

      {/* Empty state */}
      {annotations.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
          <MessageSquarePlus size={26} className="text-muted-foreground/50" />
          <p className="text-sm font-medium">No notes yet</p>
          <p className="text-xs text-muted-foreground">
            Turn on <span className="font-medium">Annotate</span>, click any block on the canvas, and leave a note. Then ask the AI to apply them all at once.
          </p>
        </div>
      ) : (
        <>
          <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto p-2">
            {annotations.map((a) => (
              <div
                key={a.id}
                className={cn(
                  "group rounded-lg border p-2",
                  a.resolved ? "border-[#B3BE98]/50 bg-[#E2E6D7]/40" : "border-[#C2B093] bg-[#FBF8F1]"
                )}
              >
                <div className="mb-1 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => { selectBlock(a.blockId); scrollToBlock(a.blockId) }}
                    className="truncate text-[10px] font-medium uppercase tracking-wide text-[#8A4A30] hover:underline"
                    title="Jump to block"
                  >
                    {blockLabel(a.blockId)}
                  </button>
                  <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                    <button type="button" title={a.resolved ? "Reopen" : "Resolve"} onClick={() => toggleAnnotationResolved(a.id)} className="rounded p-1 text-[#586041] hover:bg-[#E2E6D7]">
                      {a.resolved ? <CornerUpLeft size={12} /> : <Check size={12} />}
                    </button>
                    <button type="button" title="Delete" onClick={() => removeAnnotation(a.id)} className="rounded p-1 text-[#8A3624] hover:bg-[#F1D7CF]">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
                <p className={cn("text-[12.5px] leading-snug", a.resolved ? "text-[#3C4429] line-through" : "text-[#2A2419]")}>{a.text}</p>
              </div>
            ))}
          </div>

          {/* Apply-with-AI footer */}
          {open.length > 0 && onApplyNotes && (
            <div className="border-t border-border p-2">
              <button
                type="button"
                onClick={onApplyNotes}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#BE6E4B] px-3 py-2 text-[12.5px] font-semibold text-[#FBF4EE] shadow-sm transition-colors hover:bg-[#A85C3C]"
              >
                <Sparkles size={13} />
                Apply my notes with AI
              </button>
              <p className="mt-1 text-center text-[10px] text-muted-foreground">The assistant addresses each open note on its block.</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
