"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useCodeEditorBridge } from "@/lib/cms/block-editor/use-code-editor-bridge"
import { useEditor } from "@/lib/cms/block-editor/editor-context"
import { Button } from "@/components/cms/ui/button"
import { cn } from "@/lib/cms/utils"
import { FileCode2, Circle, AlertCircle, WandSparkles, X, Lock } from "lucide-react"

// CodeMirror imports
import { EditorView, basicSetup } from "codemirror"
import { javascript } from "@codemirror/lang-javascript"
import { oneDark } from "@codemirror/theme-one-dark"
import { EditorState } from "@codemirror/state"
import { keymap } from "@codemirror/view"
import { indentWithTab } from "@codemirror/commands"

interface CodePanelProps {
  className?: string
}

export function CodePanel({ className }: CodePanelProps) {
  const { source, applyJSX, syncDirection, isDirty } = useCodeEditorBridge()
  const { state, closeFile } = useEditor()
  const editorRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const [errors, setErrors] = useState<string[]>([])
  const [isLocalDirty, setIsLocalDirty] = useState(false)

  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const isUpdatingFromVisualRef = useRef(false)

  // Viewed file integration
  const viewedFile = state.viewedFile
  const isViewingFile = viewedFile !== null
  const isReadOnly = viewedFile?.isReadOnly ?? false
  // Hide data-block-id from the user-facing code view — it's editor identity
  // metadata, not meaningful markup. The parser re-assigns ids automatically on
  // apply, so edited clean code round-trips fine (ids are managed in the
  // background).
  const cleanPageSource = source.replace(/\s+data-block-id="[^"]*"/g, "")
  const displayContent = isViewingFile ? viewedFile.content : cleanPageSource
  const filePath = isViewingFile
    ? viewedFile.path
    : `pages/${state.currentPage?.slug || "current"}.tsx`

  // Apply JSX changes with debounce
  const handleDocChange = useCallback((content: string) => {
    if (isReadOnly) return

    setIsLocalDirty(true)

    if (isUpdatingFromVisualRef.current) {
      isUpdatingFromVisualRef.current = false
      return
    }

    if (debounceRef.current) clearTimeout(debounceRef.current)

    // Only sync current page edits back to visual editor
    if (isViewingFile) return

    debounceRef.current = setTimeout(() => {
      const result = applyJSX(content)
      if (!result.success) {
        setErrors(result.errors)
      } else {
        setErrors(result.errors)
        setIsLocalDirty(false)
      }
    }, 500)
  }, [applyJSX, isReadOnly, isViewingFile])

  // Initialize CodeMirror
  useEffect(() => {
    if (!editorRef.current) return

    if (viewRef.current) viewRef.current.destroy()

    const startState = EditorState.create({
      doc: displayContent,
      extensions: [
        basicSetup,
        javascript({ jsx: true, typescript: true }),
        oneDark,
        keymap.of([indentWithTab]),
        EditorView.editable.of(!isReadOnly),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            handleDocChange(update.state.doc.toString())
          }
        }),
        EditorView.theme({
          "&": { height: "100%", fontSize: "13px" },
          ".cm-scroller": {
            overflow: "auto",
            fontFamily: "var(--font-mono), ui-monospace, monospace",
          },
          ".cm-content": { padding: "12px 0" },
          ".cm-gutters": {
            backgroundColor: "transparent",
            borderRight: "1px solid var(--border)",
          },
          ".cm-lineNumbers .cm-gutterElement": {
            padding: "0 12px 0 8px",
            minWidth: "40px",
          },
        }),
      ],
    })

    const view = new EditorView({ state: startState, parent: editorRef.current })
    viewRef.current = view

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      view.destroy()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReadOnly])

  // Update editor content when visual side changes or viewed file changes
  useEffect(() => {
    const view = viewRef.current
    if (!view) return

    if (isViewingFile) {
      // Show viewed file content
      const currentContent = view.state.doc.toString()
      if (currentContent !== displayContent) {
        isUpdatingFromVisualRef.current = true
        view.dispatch({
          changes: { from: 0, to: currentContent.length, insert: displayContent },
        })
        setErrors([])
        setIsLocalDirty(false)
      }
      return
    }

    // Only update if the change came from visual side
    if (syncDirection === "visual") {
      isUpdatingFromVisualRef.current = true
      const currentContent = view.state.doc.toString()
      if (currentContent !== cleanPageSource) {
        view.dispatch({
          changes: { from: 0, to: currentContent.length, insert: cleanPageSource },
        })
        setErrors([])
        setIsLocalDirty(false)
      }
    }
  }, [source, syncDirection, displayContent, isViewingFile])

  const handleFormat = useCallback(() => {
    const view = viewRef.current
    if (!view || isReadOnly) return

    const content = view.state.doc.toString()
    const result = applyJSX(content)
    setErrors(result.errors)
  }, [applyJSX, isReadOnly])

  return (
    <div className={cn("flex flex-col h-full bg-[#282c34]", className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/50 bg-[#21252b]">
        <div className="flex items-center gap-2">
          <FileCode2 size={14} className="text-muted-foreground" />
          <span className="text-sm font-mono text-foreground/80">
            {filePath}
          </span>
          {isReadOnly && (
            <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
              <Lock size={10} />
              Read-only
            </span>
          )}
          {(isDirty || isLocalDirty) && !isReadOnly && (
            <Circle size={8} className="fill-amber-500 text-amber-500" />
          )}
        </div>
        <div className="flex items-center gap-1">
          {isViewingFile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={closeFile}
              className="h-7 px-2 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <X size={12} />
              Close
            </Button>
          )}
          {!isReadOnly && !isViewingFile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleFormat}
              className="h-7 px-2 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <WandSparkles size={12} />
              Format
            </Button>
          )}
        </div>
      </div>

      {/* Editor */}
      <div ref={editorRef} className="flex-1 overflow-hidden" />

      {/* Error bar */}
      {errors.length > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border-t border-red-500/20">
          <AlertCircle size={14} className="text-red-500 shrink-0" />
          <span className="text-xs text-red-400 truncate">
            {errors.length} error{errors.length > 1 ? "s" : ""}: {errors[0]}
          </span>
        </div>
      )}
    </div>
  )
}
