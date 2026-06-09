"use client"

import { useState, useCallback } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/cms/ui/dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/cms/ui/tabs"
import { Button } from "@/components/cms/ui/button"
import { Textarea } from "@/components/cms/ui/textarea"
import { useEditor } from "@/lib/cms/block-editor/editor-context"
import {
  exportToJSON,
  importFromJSON,
  exportToReact,
  exportToFramework,
  importFromReact,
  getAISchemaDocumentation,
  type ExportOptions,
} from "@/lib/cms/block-editor/serialization"
import { preprocessForImport, validateImport } from "@/lib/cms/block-editor/preprocess"
import type { ExportFramework } from "@/lib/cms/block-editor/types"
import { PAGE_TEMPLATES } from "@/lib/cms/block-editor/page-templates"
import { rehydrateParentIds } from "@/lib/cms/block-editor/tree-utils"
import { normalizeBlocks } from "@/lib/cms/block-editor/normalize"
import {
  Download,
  Upload,
  Copy,
  Check,
  AlertCircle,
  FileJson,
  Code2,
  Bot,
  LayoutTemplate,
  Plus,
  ShoppingBag,
  Hexagon,
  Atom,
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/cms/ui/select"
import { Switch } from "@/components/cms/ui/switch"
import { Label } from "@/components/cms/ui/label"
import { ShopifySettingsDialog, isShopifyConnected } from "./shopify-settings"

export function ImportExportDialog({ children }: { children: React.ReactNode }) {
  const { state, setBlocks } = useEditor()
  const [activeTab, setActiveTab] = useState("templates")
  const [importText, setImportText] = useState("")
  const [errors, setErrors] = useState<string[]>([])
  const [copied, setCopied] = useState(false)
  const [open, setOpen] = useState(false)
  const [exportFramework, setExportFramework] = useState<ExportFramework>("react")
  const [shouldNormalize, setShouldNormalize] = useState(false)

  const jsonExport = exportToJSON(state.blocks)
  const frameworkExport = exportToFramework(state.blocks, {
    framework: exportFramework,
    includeAnimations: true,
  })
  const aiDocs = getAISchemaDocumentation()

  // Check if any commerce blocks are present (require Hydrogen)
  const hasCommerceBlocks = state.blocks.some(function checkCommerce(b): boolean {
    if (b.commerce || b.componentName) return true
    return b.children?.some(checkCommerce) ?? false
  })

  const handleCopy = useCallback((text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [])

  const handleImportJSON = useCallback(() => {
    const result = importFromJSON(importText)
    if (result.errors.length > 0) setErrors(result.errors)
    if (result.blocks.length > 0) {
      const blocks = shouldNormalize ? normalizeBlocks(result.blocks) : result.blocks
      setBlocks(blocks)
      setErrors([])
      setImportText("")
      setOpen(false)
    }
  }, [importText, setBlocks, shouldNormalize])

  const handleImportReact = useCallback(() => {
    // Preprocess v0/React code before parsing
    const preprocessed = preprocessForImport(importText)
    const result = importFromReact(preprocessed.code)
    if (result.errors.length > 0) setErrors(result.errors)
    if (result.blocks.length > 0) {
      const blocks = shouldNormalize ? normalizeBlocks(result.blocks) : result.blocks
      // Validate import quality
      const validation = validateImport(blocks, preprocessed)
      if (validation.quality < 80 && validation.warnings.length > 0) {
        setErrors(prev => [...(result.errors.length > 0 ? result.errors : []), `Import quality: ${validation.quality}/100 — ${validation.warnings.slice(0, 3).join("; ")}`])
      }
      setBlocks(blocks)
      setImportText("")
      setOpen(false)
    }
  }, [importText, setBlocks, shouldNormalize])

  const handleUseTemplate = useCallback(
    (templateId: string, append: boolean) => {
      const tmpl = PAGE_TEMPLATES.find((t) => t.id === templateId)
      if (!tmpl) return
      const fresh = tmpl.blocks()
      if (append) {
        setBlocks([...state.blocks, ...rehydrateParentIds(fresh)])
      } else {
        setBlocks(rehydrateParentIds(fresh))
      }
      setOpen(false)
    },
    [state.blocks, setBlocks]
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        className="max-w-3xl max-h-[85vh] flex flex-col"
        style={{ backgroundColor: "var(--card)", color: "var(--card-foreground)" }}
      >
        <DialogHeader>
          <DialogTitle>Import / Export</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="w-full justify-start" style={{ backgroundColor: "var(--accent)" }}>
            <TabsTrigger value="templates" className="gap-1.5">
              <LayoutTemplate size={14} /> Templates
            </TabsTrigger>
            <TabsTrigger value="json" className="gap-1.5">
              <FileJson size={14} /> JSON
            </TabsTrigger>
            <TabsTrigger value="react" className="gap-1.5">
              <Code2 size={14} /> React
            </TabsTrigger>
            <TabsTrigger value="ai" className="gap-1.5">
              <Bot size={14} /> AI Schema
            </TabsTrigger>
          </TabsList>

          {/* ===== TEMPLATES TAB ===== */}
          <TabsContent value="templates" className="flex-1 flex flex-col gap-4 mt-4 min-h-0 overflow-y-auto">
            <p className="text-xs text-muted-foreground">
              Start with a pre-built section or add one to your existing page. All templates include animation data that exports as framer-motion code.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {PAGE_TEMPLATES.map((tmpl) => (
                <div
                  key={tmpl.id}
                  className="flex flex-col gap-3 rounded-xl border p-4 transition-colors hover:border-primary/50 hover:bg-accent/30"
                  style={{ borderColor: "var(--border)" }}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-foreground">{tmpl.name}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">{tmpl.description}</p>
                    </div>
                    <span className="shrink-0 rounded-md px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider"
                      style={{ backgroundColor: "var(--accent)", color: "var(--accent-foreground)" }}>
                      {tmpl.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 gap-1.5 text-xs"
                      onClick={() => handleUseTemplate(tmpl.id, false)}
                    >
                      <LayoutTemplate size={12} /> Replace Page
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 gap-1.5 text-xs"
                      onClick={() => handleUseTemplate(tmpl.id, true)}
                    >
                      <Plus size={12} /> Add to Page
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* ===== JSON TAB ===== */}
          <TabsContent value="json" className="flex-1 flex flex-col gap-4 mt-4 min-h-0">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Export JSON</h3>
              <Button variant="outline" size="sm" onClick={() => handleCopy(jsonExport)} className="gap-1.5">
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
            <Textarea value={jsonExport} readOnly className="flex-1 min-h-[200px] max-h-[300px] font-mono text-xs bg-input text-foreground resize-none" />

            <div className="border-t pt-4" style={{ borderColor: "var(--border)" }}>
              <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
                <Upload size={14} /> Import JSON
              </h3>
              <Textarea
                value={importText}
                onChange={(e) => { setImportText(e.target.value); setErrors([]) }}
                placeholder='Paste JSON document here... {"version": "2.0", "blocks": [...]}'
                className="min-h-[120px] font-mono text-xs bg-input text-foreground resize-none"
              />
              {errors.length > 0 && (
                <div className="mt-2 flex items-start gap-2 rounded-md p-2 text-xs" style={{ backgroundColor: "var(--destructive)", color: "var(--destructive-foreground)" }}>
                  <AlertCircle size={14} className="shrink-0 mt-0.5" />
                  <div>{errors.map((e, i) => <div key={i}>{e}</div>)}</div>
                </div>
              )}
              <div className="flex items-center justify-between mt-2">
                <Button onClick={handleImportJSON} disabled={!importText.trim()} size="sm">
                  <Download size={14} className="mr-1.5" /> Load JSON
                </Button>
                <div className="flex items-center gap-2">
                  <Switch
                    id="normalize-json"
                    checked={shouldNormalize}
                    onCheckedChange={setShouldNormalize}
                  />
                  <Label htmlFor="normalize-json" className="text-xs text-muted-foreground cursor-pointer">
                    Auto-label blocks
                  </Label>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ===== REACT TAB ===== */}
          <TabsContent value="react" className="flex-1 flex flex-col gap-4 mt-4 min-h-0">
            {/* Framework selector */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground">Framework:</Label>
                <Select value={exportFramework} onValueChange={(v) => setExportFramework(v as ExportFramework)}>
                  <SelectTrigger className="w-40 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="react" className="text-xs">
                      <div className="flex items-center gap-2">
                        <Atom size={14} className="text-blue-400" />
                        React
                      </div>
                    </SelectItem>
                    <SelectItem value="hydrogen" className="text-xs">
                      <div className="flex items-center gap-2">
                        <ShoppingBag size={14} className="text-green-400" />
                        Hydrogen
                      </div>
                    </SelectItem>
                    <SelectItem value="nextjs" className="text-xs">
                      <div className="flex items-center gap-2">
                        <Hexagon size={14} className="text-white" />
                        Next.js
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {hasCommerceBlocks && exportFramework !== "hydrogen" && (
                <p className="text-[10px] text-amber-400 flex items-center gap-1">
                  <AlertCircle size={12} />
                  Commerce blocks require Hydrogen export
                </p>
              )}

              {exportFramework === "hydrogen" && (
                <ShopifySettingsDialog>
                  <button className="text-[10px] text-green-400 hover:text-green-300 flex items-center gap-1 transition-colors">
                    <ShoppingBag size={12} />
                    {isShopifyConnected() ? "Shopify Connected" : "Connect Shopify Store"}
                  </button>
                </ShopifySettingsDialog>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Export {exportFramework === "hydrogen" ? "Hydrogen" : exportFramework === "nextjs" ? "Next.js" : "React"} Code
                </h3>
                <p className="text-[10px] text-muted-foreground">
                  {exportFramework === "hydrogen"
                    ? "Includes Shopify Storefront API queries and Hydrogen components"
                    : exportFramework === "nextjs"
                    ? "Uses Next.js Image and Link components"
                    : "Standard React with Tailwind CSS"
                  }
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => handleCopy(frameworkExport)} className="gap-1.5">
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
            <Textarea value={frameworkExport} readOnly className="flex-1 min-h-[200px] max-h-[300px] font-mono text-xs bg-input text-foreground resize-none" />

            <div className="border-t pt-4" style={{ borderColor: "var(--border)" }}>
              <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
                <Upload size={14} /> Import React / JSX
              </h3>
              <p className="text-xs text-muted-foreground mb-2">
                Paste any React/JSX or HTML with Tailwind. Supports motion.div, deeply nested elements, and rich text with inline tags.
              </p>
              <Textarea
                value={importText}
                onChange={(e) => { setImportText(e.target.value); setErrors([]) }}
                placeholder="Paste React/JSX code here..."
                className="min-h-[120px] font-mono text-xs bg-input text-foreground resize-none"
              />
              {errors.length > 0 && (
                <div className="mt-2 flex items-start gap-2 rounded-md p-2 text-xs" style={{ backgroundColor: "var(--destructive)", color: "var(--destructive-foreground)" }}>
                  <AlertCircle size={14} className="shrink-0 mt-0.5" />
                  <div>{errors.map((e, i) => <div key={i}>{e}</div>)}</div>
                </div>
              )}
              <div className="flex items-center justify-between mt-2">
                <Button onClick={handleImportReact} disabled={!importText.trim()} size="sm">
                  <Download size={14} className="mr-1.5" /> Load React Code
                </Button>
                <div className="flex items-center gap-2">
                  <Switch
                    id="normalize-react"
                    checked={shouldNormalize}
                    onCheckedChange={setShouldNormalize}
                  />
                  <Label htmlFor="normalize-react" className="text-xs text-muted-foreground cursor-pointer">
                    Auto-label blocks
                  </Label>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ===== AI SCHEMA TAB ===== */}
          <TabsContent value="ai" className="flex-1 flex flex-col gap-4 mt-4 min-h-0">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground">AI Schema Documentation</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Copy this schema and give it to an AI chatbot so it can build pages for your editor.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => handleCopy(aiDocs)} className="gap-1.5">
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? "Copied" : "Copy Schema"}
              </Button>
            </div>
            <Textarea value={aiDocs} readOnly className="flex-1 min-h-[300px] font-mono text-xs bg-input text-foreground resize-none" />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
