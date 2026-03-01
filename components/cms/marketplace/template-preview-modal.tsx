"use client"

import { useState, useCallback } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/cms/ui/dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/cms/ui/tabs"
import { Button } from "@/components/cms/ui/button"
import { Badge } from "@/components/cms/ui/badge"
import { ScrollArea } from "@/components/cms/ui/scroll-area"
import {
  Eye,
  Code2,
  Info,
  Plus,
  FileText,
  Copy,
  Check,
  Globe,
  Puzzle,
  TrendingUp,
  Tag,
  Scale,
  ExternalLink,
  Monitor,
  Tablet,
  Smartphone,
} from "lucide-react"
import { cn } from "@/lib/cms/utils"
import { BlockRenderer } from "@/components/cms/block-editor/block-renderer"
import type { Block } from "@/lib/cms/block-editor/types"
import type { MarketplaceTemplate } from "./types"

interface TemplatePreviewModalProps {
  template: MarketplaceTemplate | null
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Creates a new page from this template */
  onCreatePage: (template: MarketplaceTemplate) => void
  /** Inserts the template blocks into the currently editing page */
  onInsertIntoPage?: (template: MarketplaceTemplate) => void
  /** Whether the editor context is available (user is editing a page) */
  hasEditorContext?: boolean
}

function PreviewRenderer({ blocks }: { blocks: Block[] }) {
  const renderChildren = (children: Block[]) => {
    return children.map((child) => (
      <BlockRenderer
        key={child.id}
        block={child}
        renderChildren={renderChildren}
        isPreview
      />
    ))
  }

  return (
    <>
      {blocks.map((block) => (
        <BlockRenderer
          key={block.id}
          block={block}
          renderChildren={renderChildren}
          isPreview
        />
      ))}
    </>
  )
}

export function TemplatePreviewModal({
  template,
  open,
  onOpenChange,
  onCreatePage,
  onInsertIntoPage,
  hasEditorContext = false,
}: TemplatePreviewModalProps) {
  const [activeTab, setActiveTab] = useState<"preview" | "code" | "details">("preview")
  const [copied, setCopied] = useState(false)
  const [viewport, setViewport] = useState<"desktop" | "tablet" | "mobile">("desktop")

  const viewportWidth =
    viewport === "mobile" ? "375px" : viewport === "tablet" ? "768px" : "100%"

  const handleCopyCode = useCallback(() => {
    if (!template?.jsx) return
    navigator.clipboard.writeText(template.jsx)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [template?.jsx])

  if (!template) return null

  const blocks = template.blocks as Block[]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0 gap-0">
        {/* Header */}
        <DialogHeader className="flex-shrink-0 px-6 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DialogTitle className="text-lg">{template.name}</DialogTitle>
              <Badge variant="outline" className="text-[10px] capitalize">
                {template.category}
              </Badge>
              <Badge
                variant="secondary"
                className="text-[10px] gap-1"
              >
                {template.type === "site" ? (
                  <Globe size={10} />
                ) : (
                  <Puzzle size={10} />
                )}
                {template.type === "site" ? "Full Site" : "Component"}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              {hasEditorContext && onInsertIntoPage && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onInsertIntoPage(template)
                    onOpenChange(false)
                  }}
                  className="gap-1.5 text-xs"
                >
                  <Plus size={14} />
                  Insert Into Page
                </Button>
              )}
              <Button
                size="sm"
                onClick={() => {
                  onCreatePage(template)
                  onOpenChange(false)
                }}
                className="gap-1.5 text-xs"
              >
                <FileText size={14} />
                Create New Page
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex-1 flex flex-col min-h-0">
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as typeof activeTab)}
            className="flex-1 flex flex-col min-h-0"
          >
            <div className="flex items-center justify-between px-6 pt-3 pb-0 border-b border-border">
              <TabsList className="bg-transparent h-auto p-0 gap-0">
                <TabsTrigger
                  value="preview"
                  className="gap-1.5 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 pb-3"
                >
                  <Eye size={14} />
                  Preview
                </TabsTrigger>
                <TabsTrigger
                  value="code"
                  className="gap-1.5 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 pb-3"
                  disabled={!template.jsx}
                >
                  <Code2 size={14} />
                  Code
                </TabsTrigger>
                <TabsTrigger
                  value="details"
                  className="gap-1.5 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 pb-3"
                >
                  <Info size={14} />
                  Details
                </TabsTrigger>
              </TabsList>

              {/* Viewport toggle (preview tab only) */}
              {activeTab === "preview" && (
                <div className="flex items-center rounded-md border border-border mb-3">
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
              )}
            </div>

            {/* Preview tab */}
            <TabsContent value="preview" className="flex-1 min-h-0 m-0">
              <ScrollArea className="h-full">
                <div className="flex justify-center p-6 bg-muted/30 min-h-full">
                  <div
                    className="w-full bg-background border border-border rounded-lg overflow-hidden transition-all duration-300"
                    style={{
                      maxWidth: viewportWidth === "100%" ? undefined : viewportWidth,
                      minHeight: "400px",
                    }}
                  >
                    {blocks.length > 0 ? (
                      <PreviewRenderer blocks={blocks} />
                    ) : (
                      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
                        No preview available
                      </div>
                    )}
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Code tab */}
            <TabsContent value="code" className="flex-1 min-h-0 m-0">
              <div className="h-full flex flex-col">
                <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-muted/30">
                  <span className="text-xs text-muted-foreground font-mono">
                    JSX / React
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyCode}
                    className="gap-1.5 h-7 text-xs"
                  >
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                    {copied ? "Copied" : "Copy"}
                  </Button>
                </div>
                <ScrollArea className="flex-1">
                  <pre className="p-6 text-xs font-mono text-foreground whitespace-pre-wrap break-words leading-relaxed">
                    {template.jsx || "// No source code available for this template."}
                  </pre>
                </ScrollArea>
              </div>
            </TabsContent>

            {/* Details tab */}
            <TabsContent value="details" className="flex-1 min-h-0 m-0">
              <ScrollArea className="h-full">
                <div className="p-6 max-w-2xl space-y-6">
                  {/* Description */}
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-2">
                      Description
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {template.description || "No description available."}
                    </p>
                  </div>

                  {/* Metadata grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <DetailRow
                      icon={<Globe size={14} />}
                      label="Type"
                      value={template.type === "site" ? "Full Site Template" : "Component Block"}
                    />
                    <DetailRow
                      icon={<Tag size={14} />}
                      label="Category"
                      value={template.category}
                    />
                    <DetailRow
                      icon={<ExternalLink size={14} />}
                      label="Source"
                      value={template.source}
                    />
                    <DetailRow
                      icon={<TrendingUp size={14} />}
                      label="Usage"
                      value={`${template.usageCount.toLocaleString()} time${template.usageCount !== 1 ? "s" : ""}`}
                    />
                    {template.license && (
                      <DetailRow
                        icon={<Scale size={14} />}
                        label="License"
                        value={template.license}
                      />
                    )}
                  </div>

                  {/* Tags */}
                  {template.tags.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-foreground mb-2">
                        Tags
                      </h3>
                      <div className="flex flex-wrap gap-1.5">
                        {template.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-[10px]">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Block count */}
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-2">
                      Composition
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {blocks.length} top-level block{blocks.length !== 1 ? "s" : ""}
                    </p>
                  </div>

                  {/* Timestamps */}
                  <div className="pt-4 border-t border-border">
                    <div className="flex gap-6 text-[11px] text-muted-foreground">
                      <span>
                        Added{" "}
                        {new Date(template.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      <span>
                        Updated{" "}
                        {new Date(template.updatedAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border">
      <span className="text-muted-foreground mt-0.5">{icon}</span>
      <div>
        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="text-sm font-medium text-foreground capitalize">{value}</p>
      </div>
    </div>
  )
}
