"use client"

import { EditorProvider, useEditor, type ContentAdapter } from "@/lib/cms/block-editor/editor-context"
import { BlockPalette } from "./block-palette"
import { EditorCanvas } from "./editor-canvas"
import { PropertiesPanel } from "./properties-panel"
import { ImportExportDialog } from "./import-export-dialog"
import { AIChatPanel } from "./ai-chat-panel"
import { OutlinePanel } from "./outline-panel"
import { TemplatesPanel } from "./templates-panel"
import { PagesPanel } from "./pages-panel"
import { CodePanel } from "./code-panel"
import { FileTreePanel } from "./file-tree-panel"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/cms/ui/resizable"
import { SaveTemplateDialog } from "./save-template-dialog"
import { useEditorShortcuts } from "@/hooks/use-editor-shortcuts"
import { Button } from "@/components/cms/ui/button"
import { Input } from "@/components/cms/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/cms/ui/dropdown-menu"
import {
  Download,
  Undo2,
  Redo2,
  Trash2,
  Eye,
  Code2,
  Sparkles,
  PanelRight,
  Layers,
  LayoutGrid,
  LayoutTemplate,
  Monitor,
  Tablet,
  Smartphone,
  Save,
  Upload,
  MoreVertical,
  FileText,
  Globe,
  Check,
  Loader2,
  Circle,
  ExternalLink,
  ChevronDown,
  FolderTree,
  Camera,
  GitCompareArrows,
  Store,
  Menu,
  X,
  PanelLeft,
} from "lucide-react"
import { useState, useCallback, useEffect, useRef } from "react"
import { useIsMobile } from "@/hooks/use-mobile"
import { BlockRenderer } from "./block-renderer"
import { InteractionPreview } from "./interaction-preview"
import { ScreenshotDialog } from "./screenshot-dialog"
import { DesignBrowserDialog } from "./design-browser-dialog"
import type { Block } from "@/lib/cms/block-editor/types"
import { cn } from "@/lib/cms/utils"
import { toast } from "sonner"
import { captureScreenshot, compareScreenshots, type DiffResult } from "@/lib/cms/block-editor/screenshot"

function PreviewRenderer({ blocks }: { blocks: Block[] }) {
  const renderBlock = (block: Block): React.ReactNode => {
    const rendered = (
      <BlockRenderer key={block.id} block={block} renderChildren={renderChildren} isPreview />
    )
    // Wrap with InteractionPreview if block has overlay content
    if (block.interaction) {
      return (
        <InteractionPreview
          key={`interaction-${block.id}`}
          interaction={block.interaction}
          trigger={rendered}
          renderBlocks={(overlayBlocks) => overlayBlocks.map(renderBlock)}
        />
      )
    }
    return rendered
  }

  const renderChildren = (children: Block[]) => children.map(renderBlock)

  return <>{blocks.map(renderBlock)}</>
}

function EditorShell({ editorLabel, hidePageMeta }: { editorLabel?: string; hidePageMeta?: boolean }) {
  const editor = useEditor()
  const { 
    state, 
    undo, 
    redo, 
    clearAll, 
    saveCurrentPage, 
    updatePageMeta,
    publishPage,
    unpublishPage,
  } = editor
  const [showPreview, setShowPreview] = useState(false)
  const [rightPanel, setRightPanel] = useState<"properties" | "ai">("properties")
  const [leftPanel, setLeftPanel] = useState<"palette" | "outline" | "templates" | "pages" | "files">("palette")
  const [codeViewMode, setCodeViewMode] = useState<"hidden" | "split" | "full">("hidden")
  const [viewport, setViewport] = useState<"desktop" | "tablet" | "mobile">("desktop")
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [titleInput, setTitleInput] = useState("")
  // Mobile panel overlay: which panel is shown full-width on small screens
  const [mobilePanel, setMobilePanel] = useState<"none" | "left" | "right">("none")
  const isMobile = useIsMobile()

  // Design browser state
  const [designBrowserOpen, setDesignBrowserOpen] = useState(false)

  // Screenshot state
  const [screenshotOpen, setScreenshotOpen] = useState(false)
  const [screenshotData, setScreenshotData] = useState<string | null>(null)
  const [diffResult, setDiffResult] = useState<DiffResult | null>(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const screenshotContainerRef = useRef<HTMLDivElement>(null)

  // Viewport width mapping
  const viewportWidth = viewport === "mobile" ? "375px" : viewport === "tablet" ? "768px" : "100%"

  // Register global keyboard shortcuts
  useEditorShortcuts({ editor, enabled: !showPreview })

  // Page title
  const pageTitle = state.currentPage?.title || "Untitled Page"
  const isPublished = state.currentPage?.status === "published"
  const pageSlug = state.currentPage?.slug || ""

  // Handle title editing
  const startEditingTitle = useCallback(() => {
    setTitleInput(pageTitle)
    setIsEditingTitle(true)
  }, [pageTitle])

  const saveTitle = useCallback(() => {
    if (titleInput.trim() && titleInput !== pageTitle) {
      updatePageMeta({ title: titleInput.trim() })
    }
    setIsEditingTitle(false)
  }, [titleInput, pageTitle, updatePageMeta])

  // Handle manual save (Ctrl+S)
  const handleSave = useCallback(async () => {
    await saveCurrentPage()
    toast.success("Page saved")
  }, [saveCurrentPage])

  // Handle publish
  const handlePublish = useCallback(async () => {
    await publishPage()
    toast.success("Page published!", {
      description: `View at /pages/${pageSlug}`,
      action: {
        label: "View",
        onClick: () => window.open(`/pages/${pageSlug}`, "_blank"),
      },
    })
  }, [publishPage, pageSlug])

  // Handle screenshot capture
  const handleScreenshot = useCallback(async () => {
    if (isCapturing || !screenshotContainerRef.current) return
    setIsCapturing(true)
    try {
      const dataUrl = await captureScreenshot(screenshotContainerRef.current)
      setScreenshotData(dataUrl)
      setDiffResult(null)
      setScreenshotOpen(true)
    } catch (err) {
      console.error("Screenshot capture failed:", err)
      toast.error("Failed to capture screenshot")
    } finally {
      setIsCapturing(false)
    }
  }, [isCapturing])

  // Handle visual diff comparison
  const handleCompare = useCallback(async () => {
    const baseline = state.currentPage?.baseline
    if (!baseline || isCapturing || !screenshotContainerRef.current) return
    setIsCapturing(true)
    try {
      const currentDataUrl = await captureScreenshot(screenshotContainerRef.current)
      const diff = await compareScreenshots(baseline, currentDataUrl)
      setScreenshotData(currentDataUrl)
      setDiffResult(diff)
      setScreenshotOpen(true)
    } catch (err) {
      console.error("Visual diff failed:", err)
      toast.error("Failed to compare screenshots")
    } finally {
      setIsCapturing(false)
    }
  }, [isCapturing, state.currentPage?.baseline])

  // Save current screenshot as baseline (stored in localStorage for now)
  const handleSaveBaseline = useCallback((dataUrl: string) => {
    if (!state.currentPage?.id) return
    const key = `block-editor:baseline:${state.currentPage.id}`
    try {
      localStorage.setItem(key, dataUrl)
    } catch {
      // localStorage may be full for large data URLs
    }
  }, [state.currentPage?.id])

  // Handle Ctrl+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault()
        handleSave()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleSave])

  // Save status indicator
  const SaveStatusIndicator = () => {
    if (state.saveStatus === "saving") {
      return (
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Loader2 size={12} className="animate-spin" />
          Saving...
        </span>
      )
    }
    if (state.hasUnsavedChanges) {
      return (
        <span className="flex items-center gap-1.5 text-xs text-amber-500">
          <Circle size={8} className="fill-current" />
          Unsaved changes
        </span>
      )
    }
    if (state.lastSavedAt) {
      return (
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Check size={12} className="text-green-500" />
          Saved
        </span>
      )
    }
    return null
  }

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden" style={{ backgroundColor: "var(--background)" }}>
      {/* Top toolbar */}
      <div
        className="flex items-center justify-between border-b px-2 md:px-4 py-2 gap-1"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--card)" }}
      >
        {/* Left section: Panel toggles, Undo/Redo, Viewport */}
        <div className="flex items-center gap-1 shrink-0">
          {!showPreview && (
            <>
              {/* Mobile: Left panel toggle button */}
              <Button
                variant={mobilePanel === "left" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setMobilePanel(mobilePanel === "left" ? "none" : "left")}
                className="md:hidden gap-1 px-2 h-9 w-9"
                title="Toggle Panel"
              >
                {mobilePanel === "left" ? <X size={16} /> : <PanelLeft size={16} />}
              </Button>

              {/* Desktop: Left panel toggle buttons */}
              <div className="hidden md:flex items-center gap-1">
                <Button
                  variant={leftPanel === "palette" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setLeftPanel("palette")}
                  className="gap-1 px-2"
                  title="Block Palette"
                >
                  <LayoutGrid size={14} />
                </Button>
                <Button
                  variant={leftPanel === "outline" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setLeftPanel("outline")}
                  className="gap-1 px-2"
                  title="Outline"
                >
                  <Layers size={14} />
                </Button>
                <Button
                  variant={leftPanel === "templates" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setLeftPanel("templates")}
                  className="gap-1 px-2"
                  title="Templates"
                >
                  <LayoutTemplate size={14} />
                </Button>
                <Button
                  variant={leftPanel === "pages" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setLeftPanel("pages")}
                  className="gap-1 px-2"
                  title="Pages"
                >
                  <FileText size={14} />
                </Button>
                <Button
                  variant={leftPanel === "files" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setLeftPanel("files")}
                  className="gap-1 px-2"
                  title="Files"
                >
                  <FolderTree size={14} />
                </Button>
                <div className="w-px h-5 mx-1" style={{ backgroundColor: "var(--border)" }} />
                {/* Code view toggle with mode indicator */}
                <Button
                  variant={codeViewMode !== "hidden" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => {
                    setCodeViewMode(prev =>
                      prev === "hidden" ? "split" :
                      prev === "split" ? "full" : "hidden"
                    )
                  }}
                  className="gap-1.5 px-2"
                  title={`Code View: ${codeViewMode === "hidden" ? "Click for Split View" : codeViewMode === "split" ? "Click for Full View" : "Click to Hide"}`}
                >
                  <Code2 size={14} />
                  {codeViewMode !== "hidden" && (
                    <span className="text-[10px] font-medium opacity-80">
                      {codeViewMode === "split" ? "Split" : "Full"}
                    </span>
                  )}
                </Button>
                <div className="w-px h-5 mx-1" style={{ backgroundColor: "var(--border)" }} />
              </div>

              {/* Undo/Redo - always visible */}
              <Button
                variant="ghost"
                size="sm"
                onClick={undo}
                disabled={state.historyIndex <= 0}
                className="gap-1 px-2"
                title="Undo (Ctrl+Z)"
              >
                <Undo2 size={14} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={redo}
                disabled={state.historyIndex >= state.history.length - 1}
                className="gap-1 px-2"
                title="Redo (Ctrl+Y)"
              >
                <Redo2 size={14} />
              </Button>

              {/* Viewport toggle - hidden on mobile */}
              <div className="hidden md:flex items-center">
                <div className="w-px h-5 mx-1" style={{ backgroundColor: "var(--border)" }} />
                <div className="flex items-center rounded-md border border-border">
                  <Button
                    variant={viewport === "desktop" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setViewport("desktop")}
                    className="h-7 px-2 rounded-r-none"
                    title="Desktop"
                  >
                    <Monitor size={14} />
                  </Button>
                  <Button
                    variant={viewport === "tablet" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setViewport("tablet")}
                    className="h-7 px-2 rounded-none border-x border-border"
                    title="Tablet (768px)"
                  >
                    <Tablet size={14} />
                  </Button>
                  <Button
                    variant={viewport === "mobile" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setViewport("mobile")}
                    className="h-7 px-2 rounded-l-none"
                    title="Mobile (375px)"
                  >
                    <Smartphone size={14} />
                  </Button>
                </div>
              </div>
            </>
          )}
          {showPreview && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPreview(false)}
                className="gap-1.5"
              >
                <Code2 size={14} /> <span className="hidden sm:inline">Back to Editor</span>
              </Button>
              {/* Viewport toggle in preview - hidden on mobile */}
              <div className="hidden md:flex items-center">
                <div className="w-px h-5 mx-2" style={{ backgroundColor: "var(--border)" }} />
                <div className="flex items-center rounded-md border border-border">
                  <Button
                    variant={viewport === "desktop" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setViewport("desktop")}
                    className="h-7 px-2 rounded-r-none"
                    title="Desktop"
                  >
                    <Monitor size={14} />
                  </Button>
                  <Button
                    variant={viewport === "tablet" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setViewport("tablet")}
                    className="h-7 px-2 rounded-none border-x border-border"
                    title="Tablet (768px)"
                  >
                    <Tablet size={14} />
                  </Button>
                  <Button
                    variant={viewport === "mobile" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setViewport("mobile")}
                    className="h-7 px-2 rounded-l-none"
                    title="Mobile (375px)"
                  >
                    <Smartphone size={14} />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
        
        {/* Center section: Page title and save status */}
        <div className="flex items-center gap-2 md:gap-3 min-w-0 mx-1">
          {hidePageMeta && editorLabel ? (
            <span className="text-xs md:text-sm font-medium text-foreground truncate">{editorLabel}</span>
          ) : isEditingTitle ? (
            <Input
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveTitle()
                if (e.key === "Escape") setIsEditingTitle(false)
              }}
              className="h-7 w-32 md:w-48 text-sm font-medium"
              autoFocus
            />
          ) : (
            <button
              onClick={startEditingTitle}
              className="flex items-center gap-1.5 text-xs md:text-sm font-medium text-foreground hover:text-primary transition-colors truncate max-w-[120px] md:max-w-none"
            >
              <span className="truncate">{pageTitle}</span>
              {isPublished && (
                <span className="hidden sm:flex items-center gap-1 text-[10px] font-normal px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-600 shrink-0">
                  <Globe size={10} />
                  Published
                </span>
              )}
            </button>
          )}
          <span className="hidden sm:block"><SaveStatusIndicator /></span>
        </div>

        {/* Right section: Save, Actions, Preview, Publish */}
        <div className="flex items-center gap-1 shrink-0">
          {!showPreview && (
            <>
              {/* Save Draft button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSave}
                className={cn(
                  "gap-1.5 px-2",
                  state.hasUnsavedChanges && "text-amber-500"
                )}
                title="Save Draft (Ctrl+S)"
              >
                <Save size={14} />
                <span className="hidden sm:inline">Save</span>
              </Button>

              {/* Actions dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-1 px-2">
                    <MoreVertical size={14} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {/* Mobile-only panel switchers */}
                  <div className="md:hidden">
                    <DropdownMenuItem onClick={() => { setLeftPanel("palette"); setMobilePanel("left"); }}>
                      <LayoutGrid size={14} className="mr-2" />
                      Block Palette
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { setLeftPanel("outline"); setMobilePanel("left"); }}>
                      <Layers size={14} className="mr-2" />
                      Outline
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { setLeftPanel("templates"); setMobilePanel("left"); }}>
                      <LayoutTemplate size={14} className="mr-2" />
                      Templates
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </div>
                  <SaveTemplateDialog>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      <LayoutTemplate size={14} className="mr-2" />
                      Save as Template
                    </DropdownMenuItem>
                  </SaveTemplateDialog>
                  <ImportExportDialog>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      <Download size={14} className="mr-2" />
                      Import / Export
                    </DropdownMenuItem>
                  </ImportExportDialog>
                  <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setDesignBrowserOpen(true) }}>
                    <Store size={14} className="mr-2" />
                    Design Browser
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleScreenshot} disabled={isCapturing}>
                    <Camera size={14} className="mr-2" />
                    {isCapturing ? "Capturing..." : "Capture Screenshot"}
                  </DropdownMenuItem>
                  {state.currentPage?.baseline && (
                    <DropdownMenuItem onClick={handleCompare} disabled={isCapturing}>
                      <GitCompareArrows size={14} className="mr-2" />
                      Compare with Baseline
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={clearAll} className="text-destructive">
                    <Trash2 size={14} className="mr-2" />
                    Clear All
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="hidden sm:block w-px h-5 mx-1" style={{ backgroundColor: "var(--border)" }} />

              {/* AI / Properties toggle */}
              <Button
                variant={rightPanel === "ai" ? "secondary" : mobilePanel === "right" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => {
                  if (isMobile) {
                    if (mobilePanel === "right") {
                      setMobilePanel("none")
                    } else {
                      setRightPanel(rightPanel === "ai" ? "properties" : "ai")
                      setMobilePanel("right")
                    }
                  } else {
                    setRightPanel(rightPanel === "ai" ? "properties" : "ai")
                  }
                }}
                className="gap-1.5 px-2"
                title={rightPanel === "ai" ? "Show Properties" : "AI Assistant"}
              >
                {rightPanel === "ai" ? (
                  <PanelRight size={14} />
                ) : (
                  <Sparkles size={14} />
                )}
              </Button>

              {/* Preview button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(true)}
                className="gap-1.5 px-2 sm:px-3"
              >
                <Eye size={14} /> <span className="hidden sm:inline">Preview</span>
              </Button>

              {/* Publish button (hidden in partial mode) */}
              {!hidePageMeta && (
                isPublished ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" className="gap-1.5">
                        <Globe size={14} />
                        <span className="hidden sm:inline">Update</span>
                        <ChevronDown size={12} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={handlePublish}>
                        <Upload size={14} className="mr-2" />
                        Update Published Page
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => window.open(`/pages/${pageSlug}`, "_blank")}
                      >
                        <ExternalLink size={14} className="mr-2" />
                        View Published Page
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={unpublishPage} className="text-destructive">
                        <Trash2 size={14} className="mr-2" />
                        Unpublish
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button size="sm" onClick={handlePublish} className="gap-1.5">
                    <Globe size={14} />
                    <span className="hidden sm:inline">Publish</span>
                  </Button>
                )
              )}
            </>
          )}
          {showPreview && isPublished && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`/pages/${pageSlug}`, "_blank")}
              className="gap-1.5"
            >
              <ExternalLink size={14} /> <span className="hidden sm:inline">Open Published</span>
            </Button>
          )}
        </div>
      </div>

      {/* Main content */}
      {showPreview ? (
        <div className="flex-1 overflow-auto" style={{ backgroundColor: "var(--background)" }}>
          {/* Preview URL bar */}
          <div className="sticky top-0 z-10 flex items-center justify-center py-2 bg-muted/50 border-b border-border">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-background border border-border text-xs text-muted-foreground">
              <Globe size={12} />
              <span className="font-mono">
                yoursite.com/pages/{pageSlug || "untitled"}
              </span>
            </div>
          </div>
          
          {/* Preview content with viewport simulation */}
          <div className="flex justify-center p-2 sm:p-4 md:p-8">
            <div 
              className="w-full transition-all duration-300 ease-out bg-background"
              style={{ 
                maxWidth: viewportWidth === "100%" ? undefined : viewportWidth,
                boxShadow: viewportWidth !== "100%" ? "0 0 0 1px var(--border)" : undefined,
                borderRadius: viewportWidth !== "100%" ? "8px" : undefined,
                minHeight: viewportWidth !== "100%" ? "600px" : undefined,
              }}
            >
              <PreviewRenderer blocks={state.blocks} />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden relative">
          {/* Mobile left panel overlay */}
          {mobilePanel === "left" && (
            <div className="md:hidden absolute inset-0 z-20 flex animate-in fade-in duration-200">
              <div className="w-72 max-w-[80vw] bg-card border-r border-border overflow-y-auto animate-in slide-in-from-left duration-200">
                {/* Mobile panel tab switcher */}
                <div className="sticky top-0 z-10 flex items-center gap-1 p-2 border-b border-border bg-card">
                  <Button
                    variant={leftPanel === "palette" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setLeftPanel("palette")}
                    className="h-8 px-2"
                    title="Blocks"
                  >
                    <LayoutGrid size={14} />
                  </Button>
                  <Button
                    variant={leftPanel === "outline" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setLeftPanel("outline")}
                    className="h-8 px-2"
                    title="Outline"
                  >
                    <Layers size={14} />
                  </Button>
                  <Button
                    variant={leftPanel === "templates" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setLeftPanel("templates")}
                    className="h-8 px-2"
                    title="Templates"
                  >
                    <LayoutTemplate size={14} />
                  </Button>
                  <Button
                    variant={leftPanel === "pages" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setLeftPanel("pages")}
                    className="h-8 px-2"
                    title="Pages"
                  >
                    <FileText size={14} />
                  </Button>
                  <Button
                    variant={leftPanel === "files" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setLeftPanel("files")}
                    className="h-8 px-2"
                    title="Files"
                  >
                    <FolderTree size={14} />
                  </Button>
                  <div className="flex-1" />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setMobilePanel("none")}
                    className="h-8 w-8 px-0"
                  >
                    <X size={16} />
                  </Button>
                </div>
                {leftPanel === "outline" ? (
                  <OutlinePanel />
                ) : leftPanel === "templates" ? (
                  <TemplatesPanel />
                ) : leftPanel === "pages" ? (
                  <PagesPanel />
                ) : leftPanel === "files" ? (
                  <FileTreePanel
                    onRequestCodeView={() => {
                      if (codeViewMode === "hidden") {
                        setCodeViewMode("split")
                      }
                    }}
                  />
                ) : (
                  <BlockPalette />
                )}
              </div>
              <div
                className="flex-1 bg-black/30"
                onClick={() => setMobilePanel("none")}
              />
            </div>
          )}

          {/* Mobile right panel overlay */}
          {mobilePanel === "right" && (
            <div className="md:hidden absolute inset-0 z-20 flex justify-end animate-in fade-in duration-200">
              <div
                className="flex-1 bg-black/30"
                onClick={() => setMobilePanel("none")}
              />
              <div className="w-80 max-w-[85vw] bg-card border-l border-border overflow-y-auto animate-in slide-in-from-right duration-200">
                {/* Close button for right panel on mobile */}
                <div className="sticky top-0 z-10 flex items-center justify-between p-2 border-b border-border bg-card">
                  <div className="flex items-center gap-1">
                    <Button
                      variant={rightPanel === "properties" ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setRightPanel("properties")}
                      className="h-8 px-2 gap-1"
                    >
                      <PanelRight size={14} />
                      <span className="text-xs">Properties</span>
                    </Button>
                    <Button
                      variant={rightPanel === "ai" ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setRightPanel("ai")}
                      className="h-8 px-2 gap-1"
                    >
                      <Sparkles size={14} />
                      <span className="text-xs">AI</span>
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setMobilePanel("none")}
                    className="h-8 w-8 px-0"
                  >
                    <X size={16} />
                  </Button>
                </div>
                {rightPanel === "ai" ? <AIChatPanel /> : <PropertiesPanel />}
              </div>
            </div>
          )}

          {/* Desktop left panel */}
          <div className="hidden md:flex">
            {leftPanel === "outline" ? (
              <OutlinePanel />
            ) : leftPanel === "templates" ? (
              <TemplatesPanel />
            ) : leftPanel === "pages" ? (
              <PagesPanel />
            ) : leftPanel === "files" ? (
              <FileTreePanel
                onRequestCodeView={() => {
                  if (codeViewMode === "hidden") {
                    setCodeViewMode("split")
                  }
                }}
              />
            ) : (
              <BlockPalette />
            )}
          </div>

          {/* Center area with optional code panel */}
          {codeViewMode === "hidden" ? (
            <EditorCanvas viewportWidth={viewportWidth} />
          ) : codeViewMode === "full" ? (
            <div className="flex-1 overflow-hidden">
              <CodePanel />
            </div>
          ) : (
            /* Split mode: Canvas + Code Panel side by side */
            <ResizablePanelGroup orientation="horizontal" className="flex-1">
              <ResizablePanel defaultSize={50} minSize={30}>
                <EditorCanvas viewportWidth={viewportWidth} />
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={50} minSize={30}>
                <CodePanel />
              </ResizablePanel>
            </ResizablePanelGroup>
          )}

          {/* Desktop right panel */}
          <div className="hidden md:flex">
            {rightPanel === "ai" ? <AIChatPanel /> : <PropertiesPanel />}
          </div>

          {/* Mobile bottom toolbar - shows when a block is selected */}
          {isMobile && state.selectedBlockId && mobilePanel === "none" && !showPreview && (
            <div className="md:hidden absolute bottom-0 left-0 right-0 z-10 flex items-center justify-center gap-2 p-2 border-t border-border bg-card/95 backdrop-blur-sm">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setRightPanel("properties")
                  setMobilePanel("right")
                }}
                className="gap-1.5 h-10 flex-1 max-w-[180px]"
              >
                <PanelRight size={14} />
                Edit Properties
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setRightPanel("ai")
                  setMobilePanel("right")
                }}
                className="gap-1.5 h-10"
              >
                <Sparkles size={14} />
                AI
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Hidden render container for screenshot capture (off-screen) */}
      {state.blocks.length > 0 && (
        <div
          ref={screenshotContainerRef}
          aria-hidden
          style={{
            position: "fixed",
            left: "-9999px",
            top: 0,
            width: "1280px",
            background: "#ffffff",
            zIndex: -1,
            pointerEvents: "none",
          }}
        >
          <PreviewRenderer blocks={state.blocks} />
        </div>
      )}

      {/* Screenshot dialog */}
      <ScreenshotDialog
        open={screenshotOpen}
        onOpenChange={setScreenshotOpen}
        screenshot={screenshotData}
        pageTitle={pageTitle}
        pageSlug={pageSlug}
        diffResult={diffResult}
        baseline={state.currentPage?.baseline}
        onSaveBaseline={handleSaveBaseline}
      />

      {/* Design browser dialog */}
      <DesignBrowserDialog
        open={designBrowserOpen}
        onOpenChange={setDesignBrowserOpen}
      />
    </div>
  )
}

interface PageBuilderProps {
  /** Page ID to load for editing (omit for new page) */
  pageId?: string
  /** Custom content adapter for non-page content (partials, site headers/footers) */
  adapter?: ContentAdapter
  /** Editor mode */
  mode?: "web" | "email"
  /** Label shown in the editor toolbar (e.g. "Global Header", "Footer Template") */
  editorLabel?: string
  /** Hide page-specific UI (slug, status, publish) when editing partials */
  hidePageMeta?: boolean
}

export function PageBuilder({ pageId, adapter, mode = "web", editorLabel, hidePageMeta }: PageBuilderProps) {
  return (
    <EditorProvider pageId={pageId} adapter={adapter} mode={mode}>
      <EditorShell editorLabel={editorLabel} hidePageMeta={hidePageMeta} />
    </EditorProvider>
  )
}
