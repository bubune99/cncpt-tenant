"use client"

import { useState } from "react"
import { ScrollArea } from "@/components/cms/ui/scroll-area"
import { Input } from "@/components/cms/ui/input"
import { Switch } from "@/components/cms/ui/switch"
import { Slider } from "@/components/cms/ui/slider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/cms/ui/select"
import { Separator } from "@/components/cms/ui/separator"
import {
  ChevronDown,
  ChevronRight,
  Eye,
  Unlock,
  Layers,
  PanelRightClose,
  GripVertical,
  Palette,
  Layout,
  MousePointer,
  Sparkles,
  Component,
} from "lucide-react"
import { cn } from "@/lib/cms/utils"
import { getSmartBlock, type EditorField } from "@/lib/cms/block-editor/smart-blocks/registry"
import type { Block } from "@/lib/cms/block-editor/types"
import type { ElementType } from "./page-builder"

interface RightPanelProps {
  elements: ElementType[]
  selectedElement: ElementType | null
  onSelectElement: (element: ElementType | null) => void
  onCollapse?: () => void
  isCollapsed?: boolean
}

/* ---- Smart Block Field Renderer ---- */
function SmartBlockField({ field, block, onUpdate }: {
  field: EditorField
  block: Block
  onUpdate: (value: unknown) => void
}) {
  const target = field.target || "attrs"
  let currentValue: unknown = field.defaultValue
  if (target === "commerce" && block.commerce) {
    currentValue = (block.commerce as unknown as Record<string, unknown>)[field.key] ?? field.defaultValue
  } else if (target === "attrs" && block.attrs) {
    currentValue = block.attrs[field.key] ?? field.defaultValue
  } else if (target === "root") {
    currentValue = (block as unknown as Record<string, unknown>)[field.key] ?? field.defaultValue
  }

  switch (field.type) {
    case "text":
      return (
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">{field.label}</label>
          <Input
            value={String(currentValue ?? "")}
            onChange={(e) => onUpdate(e.target.value)}
            className="h-8 bg-input text-foreground text-xs"
          />
        </div>
      )
    case "number":
      return (
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">{field.label}</label>
          <Input
            type="number"
            value={Number(currentValue ?? 0)}
            onChange={(e) => onUpdate(parseInt(e.target.value) || 0)}
            min={field.min}
            max={field.max}
            step={field.step}
            className="h-8 bg-input text-foreground text-xs"
          />
        </div>
      )
    case "select":
      return (
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">{field.label}</label>
          <Select value={String(currentValue ?? "")} onValueChange={onUpdate}>
            <SelectTrigger className="h-8 bg-input text-foreground text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {field.options?.map((opt) => (
                <SelectItem key={String(opt.value)} value={String(opt.value)} className="text-xs">{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )
    case "toggle":
      return (
        <div className="flex items-center justify-between">
          <label className="text-xs text-muted-foreground">{field.label}</label>
          <Switch
            checked={Boolean(currentValue)}
            onCheckedChange={onUpdate}
          />
        </div>
      )
    case "slider":
      return (
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">{field.label}</label>
          <div className="flex items-center gap-2">
            <Slider
              value={[Number(currentValue ?? field.min ?? 0)]}
              onValueChange={([v]) => onUpdate(v)}
              min={field.min ?? 0}
              max={field.max ?? 100}
              step={field.step ?? 1}
              className="flex-1"
            />
            <span className="text-[10px] text-muted-foreground w-8 text-right">{String(currentValue ?? 0)}</span>
          </div>
        </div>
      )
    case "color":
      return (
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">{field.label}</label>
          <Input
            value={String(currentValue ?? "")}
            onChange={(e) => onUpdate(e.target.value)}
            placeholder="#hex or Tailwind class"
            className="h-8 bg-input text-foreground text-xs font-mono"
          />
        </div>
      )
    default:
      return null
  }
}

export function RightPanel({
  elements,
  selectedElement,
  onSelectElement,
  onCollapse,
  isCollapsed = false,
}: RightPanelProps) {
  const [activeTab, setActiveTab] = useState<"layers" | "inspector" | "styles" | "interactions">("layers")
  const [expandedLayers, setExpandedLayers] = useState<string[]>(["section-1", "section-2", "row-1", "row-2"])

  const toggleLayer = (id: string) => {
    setExpandedLayers((prev) => (prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id]))
  }

  const renderElement = (element: ElementType, depth = 0) => {
    const hasChildren = element.children && element.children.length > 0
    const isExpanded = expandedLayers.includes(element.id)
    const isSelected = selectedElement?.id === element.id

    return (
      <div key={element.id} className="group">
        <div
          className={cn(
            "flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer transition-colors",
            isSelected ? "bg-primary/20 text-primary" : "hover:bg-secondary",
          )}
          style={{ paddingLeft: `${8 + depth * 12}px` }}
          onClick={() => onSelectElement(element)}
        >
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleLayer(element.id)
              }}
              className="p-0.5 hover:bg-secondary rounded"
            >
              {isExpanded ? (
                <ChevronDown className="w-3 h-3 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-3 h-3 text-muted-foreground" />
              )}
            </button>
          ) : (
            <div className="w-4" />
          )}
          <Layers className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
          <span className="text-xs flex-1 truncate">{element.label}</span>
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button className="p-0.5 hover:bg-secondary rounded">
              <Eye className="w-3 h-3 text-muted-foreground" />
            </button>
            <button className="p-0.5 hover:bg-secondary rounded">
              <Unlock className="w-3 h-3 text-muted-foreground" />
            </button>
          </div>
        </div>
        {hasChildren && isExpanded && <div>{element.children!.map((child) => renderElement(child, depth + 1))}</div>}
      </div>
    )
  }

  if (isCollapsed) {
    return (
      <div className="w-10 bg-sidebar border-l border-border flex flex-col items-center py-2 gap-2">
        <button
          onClick={onCollapse}
          className="p-2 rounded-md hover:bg-secondary transition-colors"
          title="Expand Panel"
        >
          <PanelRightClose className="w-4 h-4 rotate-180" />
        </button>
        <div className="w-6 h-px bg-border my-1" />
        <button
          onClick={() => {
            onCollapse?.()
            setActiveTab("layers")
          }}
          className={cn(
            "p-2 rounded-md transition-colors",
            activeTab === "layers" ? "bg-primary/20 text-primary" : "hover:bg-secondary",
          )}
          title="Layers"
        >
          <Layers className="w-4 h-4" />
        </button>
        <button
          onClick={() => {
            onCollapse?.()
            setActiveTab("inspector")
          }}
          className={cn(
            "p-2 rounded-md transition-colors",
            activeTab === "inspector" ? "bg-primary/20 text-primary" : "hover:bg-secondary",
          )}
          title="Inspector"
        >
          <Layout className="w-4 h-4" />
        </button>
        <button
          onClick={() => {
            onCollapse?.()
            setActiveTab("styles")
          }}
          className={cn(
            "p-2 rounded-md transition-colors",
            activeTab === "styles" ? "bg-primary/20 text-primary" : "hover:bg-secondary",
          )}
          title="Styles"
        >
          <Palette className="w-4 h-4" />
        </button>
        <button
          onClick={() => {
            onCollapse?.()
            setActiveTab("interactions")
          }}
          className={cn(
            "p-2 rounded-md transition-colors",
            activeTab === "interactions" ? "bg-primary/20 text-primary" : "hover:bg-secondary",
          )}
          title="Interactions"
        >
          <MousePointer className="w-4 h-4" />
        </button>
      </div>
    )
  }

  return (
    <div className="w-72 bg-sidebar flex flex-col border-l border-border">
      {/* Header */}
      <div className="h-10 border-b border-border flex items-center justify-between px-3">
        <div className="flex items-center gap-2">
          <GripVertical className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-sm font-medium">
            {activeTab === "layers" && "Layers"}
            {activeTab === "inspector" && "Inspector"}
            {activeTab === "styles" && "Styles"}
            {activeTab === "interactions" && "Interactions"}
          </span>
        </div>
        <button
          onClick={onCollapse}
          className="p-1.5 rounded-md hover:bg-secondary transition-colors"
          title="Collapse Panel"
        >
          <PanelRightClose className="w-4 h-4" />
        </button>
      </div>

      {/* Tab Bar */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab("layers")}
          className={cn(
            "flex-1 px-3 py-2 text-xs font-medium transition-colors border-b-2",
            activeTab === "layers"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          <Layers className="w-3.5 h-3.5 mx-auto mb-1" />
          Layers
        </button>
        <button
          onClick={() => setActiveTab("inspector")}
          className={cn(
            "flex-1 px-3 py-2 text-xs font-medium transition-colors border-b-2",
            activeTab === "inspector"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          <Layout className="w-3.5 h-3.5 mx-auto mb-1" />
          Inspector
        </button>
        <button
          onClick={() => setActiveTab("styles")}
          className={cn(
            "flex-1 px-3 py-2 text-xs font-medium transition-colors border-b-2",
            activeTab === "styles"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          <Palette className="w-3.5 h-3.5 mx-auto mb-1" />
          Styles
        </button>
        <button
          onClick={() => setActiveTab("interactions")}
          className={cn(
            "flex-1 px-3 py-2 text-xs font-medium transition-colors border-b-2",
            activeTab === "interactions"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          <MousePointer className="w-3.5 h-3.5 mx-auto mb-1" />
          Actions
        </button>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        {activeTab === "layers" && <div className="p-2">{elements.map((element) => renderElement(element))}</div>}

        {activeTab === "inspector" && (
          <div className="p-3">
            {selectedElement ? (
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Selected Element</p>
                  <div className="p-3 rounded-lg bg-card border border-border">
                    <p className="text-sm font-medium">{selectedElement.label}</p>
                    <p className="text-xs text-muted-foreground">Type: {selectedElement.type}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Properties</p>
                  <div className="space-y-2">
                    {Object.entries(selectedElement.props).map(([key, value]) => (
                      <div
                        key={key}
                        className="flex items-center justify-between p-2 rounded-lg bg-card border border-border"
                      >
                        <span className="text-xs text-muted-foreground">{key}</span>
                        <span className="text-xs font-medium truncate max-w-[120px]">
                          {typeof value === "string" ? value : JSON.stringify(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Smart Block Settings */}
                {!!selectedElement.props.componentName && getSmartBlock(String(selectedElement.props.componentName)) && (() => {
                  const smartDef = getSmartBlock(String(selectedElement.props.componentName))!
                  // Build a Block-like object from element props for the field renderer
                  const blockProxy: Block = {
                    id: selectedElement.id,
                    tag: "div",
                    className: "",
                    componentName: String(selectedElement.props.componentName),
                    commerce: selectedElement.props.commerce as Block["commerce"],
                    attrs: selectedElement.props.attrs as Block["attrs"],
                  }
                  return (
                    <>
                      <Separator />
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2">Smart Block Settings</p>
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center gap-2 p-2 rounded-md bg-violet-500/10">
                            <Component size={14} className="text-violet-400" />
                            <span className="text-xs font-medium text-violet-300">{smartDef.displayName}</span>
                          </div>
                          {smartDef.editorConfig.fields.map((field) => (
                            <SmartBlockField
                              key={field.key}
                              field={field}
                              block={blockProxy}
                              onUpdate={() => {
                                // Field updates would be handled via editor context in a full integration
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    </>
                  )
                })()}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-center">
                <Layout className="w-8 h-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Select an element to inspect</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "styles" && (
          <div className="p-3 space-y-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Quick Styles</p>
              <div className="grid grid-cols-2 gap-2">
                {["Background", "Border", "Shadow", "Opacity"].map((style) => (
                  <button
                    key={style}
                    className="p-3 rounded-lg border border-border bg-card hover:bg-secondary text-xs transition-colors"
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Spacing</p>
              <div className="p-3 rounded-lg border border-border bg-card">
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div />
                  <input className="w-full p-1 bg-input rounded text-center" placeholder="T" />
                  <div />
                  <input className="w-full p-1 bg-input rounded text-center" placeholder="L" />
                  <div className="w-full aspect-square bg-secondary rounded" />
                  <input className="w-full p-1 bg-input rounded text-center" placeholder="R" />
                  <div />
                  <input className="w-full p-1 bg-input rounded text-center" placeholder="B" />
                  <div />
                </div>
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Size</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground">Width</label>
                  <input className="w-full p-2 bg-input rounded text-sm mt-1" placeholder="Auto" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Height</label>
                  <input className="w-full p-2 bg-input rounded text-sm mt-1" placeholder="Auto" />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "interactions" && (
          <div className="p-3 space-y-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Click Actions</p>
              <div className="space-y-2">
                <button className="w-full p-3 rounded-lg border border-dashed border-border hover:border-primary/50 hover:bg-secondary/50 transition-all flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground">
                  <MousePointer className="w-4 h-4" />
                  <span className="text-xs">Add Click Action</span>
                </button>
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Hover Effects</p>
              <div className="space-y-2">
                {["Scale", "Rotate", "Fade", "Slide"].map((effect) => (
                  <div
                    key={effect}
                    className="p-3 rounded-lg border border-border bg-card hover:border-primary/50 cursor-pointer transition-all flex items-center justify-between"
                  >
                    <span className="text-xs">{effect}</span>
                    <Sparkles className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Scroll Animations</p>
              <button className="w-full p-3 rounded-lg border border-dashed border-border hover:border-primary/50 hover:bg-secondary/50 transition-all flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground">
                <span className="text-xs">Configure Scroll Effects</span>
              </button>
            </div>
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
