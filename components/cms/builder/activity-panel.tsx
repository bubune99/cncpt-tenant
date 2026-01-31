"use client"

import { useState } from "react"
import { ScrollArea } from '@/components/cms/ui/scroll-area"
import { Input } from '@/components/cms/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/cms/ui/tabs"
import {
  Search,
  Upload,
  Grid3X3,
  List,
  Plus,
  ExternalLink,
  MoreHorizontal,
  ChevronDown,
  ChevronRight,
  Eye,
  Unlock,
  Sparkles,
  Send,
  Clock,
  RotateCcw,
  Settings,
  Type,
  Layers,
  Box,
} from "lucide-react"
import { cn } from '@/lib/cms/utils"
import type { ActivityView } from "./activity-bar"
import type { ElementType } from "./page-builder"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/cms/ui/collapsible"

interface ActivityPanelProps {
  activeView: ActivityView
  elements?: ElementType[]
  selectedElement?: ElementType | null
  onSelectElement?: (element: ElementType | null) => void
}

// Sample data
const sampleImages = [
  { id: "1", name: "hero-bg.jpg", url: "/abstract-hero-background.png", size: "245 KB" },
  { id: "2", name: "product-1.png", url: "/modern-tech-product.png", size: "128 KB" },
  { id: "3", name: "team-photo.jpg", url: "/diverse-team-outdoor.png", size: "512 KB" },
  { id: "4", name: "logo.svg", url: "/generic-company-logo.png", size: "12 KB" },
  { id: "5", name: "pattern.png", url: "/decorative-pattern.png", size: "89 KB" },
  { id: "6", name: "icon-set.svg", url: "/diverse-icon-set.png", size: "34 KB" },
]

const fontFamilies = [
  { name: "Inter", category: "Sans Serif", weights: ["400", "500", "600", "700"] },
  { name: "Roboto", category: "Sans Serif", weights: ["300", "400", "500", "700"] },
  { name: "Playfair Display", category: "Serif", weights: ["400", "500", "600", "700"] },
  { name: "Space Grotesk", category: "Sans Serif", weights: ["300", "400", "500", "700"] },
  { name: "JetBrains Mono", category: "Monospace", weights: ["400", "500", "700"] },
]

const linksList = [
  { id: "1", text: "Get Started", url: "/get-started", type: "internal" },
  { id: "2", text: "Documentation", url: "https://docs.example.com", type: "external" },
  { id: "3", text: "Contact Us", url: "/contact", type: "internal" },
  { id: "4", text: "GitHub", url: "https://github.com", type: "external" },
]

const navigationMenus = [
  { id: "1", name: "Main Navigation", items: 5 },
  { id: "2", name: "Footer Links", items: 8 },
  { id: "3", name: "Mobile Menu", items: 6 },
]

const historyItems = [
  { id: "1", action: "Changed heading text", time: "2 min ago", element: "Hero Heading" },
  { id: "2", action: "Updated button color", time: "5 min ago", element: "CTA Button" },
  { id: "3", action: "Added new section", time: "12 min ago", element: "Features Section" },
  { id: "4", action: "Deleted image", time: "18 min ago", element: "Old Banner" },
  { id: "5", action: "Changed font size", time: "25 min ago", element: "Body Text" },
]

const elementCategories = [
  {
    name: "Layout",
    elements: [
      { name: "Section", icon: Box },
      { name: "Row", icon: Layers },
      { name: "Column", icon: Layers },
      { name: "Container", icon: Box },
    ],
  },
  {
    name: "Basic",
    elements: [
      { name: "Heading", icon: Type },
      { name: "Paragraph", icon: Type },
      { name: "Image", icon: Box },
      { name: "Button", icon: Box },
    ],
  },
  {
    name: "Components",
    elements: [
      { name: "Card", icon: Box },
      { name: "Slider", icon: Box },
      { name: "Tabs", icon: Layers },
      { name: "Accordion", icon: Layers },
    ],
  },
]

export function ActivityPanel({ activeView, elements = [], selectedElement, onSelectElement }: ActivityPanelProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [openCategories, setOpenCategories] = useState<string[]>(["Layout", "Basic"])
  const [aiMessage, setAiMessage] = useState("")

  const toggleCategory = (name: string) => {
    setOpenCategories((prev) => (prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name]))
  }

  const renderPanelHeader = (title: string, showViewToggle = false) => (
    <div className="p-3 border-b border-border flex items-center justify-between">
      <span className="font-medium text-sm">{title}</span>
      {showViewToggle && (
        <div className="flex items-center gap-1 bg-secondary rounded-md p-0.5">
          <button
            onClick={() => setViewMode("grid")}
            className={cn(
              "p-1.5 rounded transition-colors",
              viewMode === "grid" ? "bg-background shadow-sm" : "hover:bg-background/50",
            )}
          >
            <Grid3X3 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={cn(
              "p-1.5 rounded transition-colors",
              viewMode === "list" ? "bg-background shadow-sm" : "hover:bg-background/50",
            )}
          >
            <List className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  )

  const renderSearch = (placeholder: string) => (
    <div className="p-3 border-b border-border">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-8 h-9 bg-input border-0"
        />
      </div>
    </div>
  )

  // Blocks & Elements View
  if (activeView === "blocks") {
    return (
      <div className="w-64 bg-sidebar flex flex-col border-r border-border">
        {renderPanelHeader("Blocks & Elements")}
        {renderSearch("Search elements...")}
        <ScrollArea className="flex-1">
          <div className="p-2">
            {elementCategories.map((category) => (
              <Collapsible
                key={category.name}
                open={openCategories.includes(category.name)}
                onOpenChange={() => toggleCategory(category.name)}
              >
                <CollapsibleTrigger className="flex items-center gap-2 w-full p-2 rounded-md hover:bg-secondary text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  {openCategories.includes(category.name) ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  {category.name}
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="grid grid-cols-2 gap-1.5 py-2 pl-6 pr-2">
                    {category.elements.map((element) => (
                      <button
                        key={element.name}
                        className="flex flex-col items-center gap-1.5 p-3 rounded-lg border border-border bg-card hover:bg-secondary hover:border-primary/50 transition-all cursor-grab"
                        draggable
                      >
                        <element.icon className="h-5 w-5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{element.name}</span>
                      </button>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </ScrollArea>
      </div>
    )
  }

  // Images View
  if (activeView === "images") {
    return (
      <div className="w-64 bg-sidebar flex flex-col border-r border-border">
        {renderPanelHeader("Images", true)}
        <Tabs defaultValue="gallery" className="flex-1 flex flex-col">
          <TabsList className="mx-3 mt-2 grid grid-cols-2">
            <TabsTrigger value="gallery">Gallery</TabsTrigger>
            <TabsTrigger value="my-images">My Images</TabsTrigger>
          </TabsList>
          {renderSearch("Search images...")}
          <TabsContent value="gallery" className="flex-1 m-0">
            <ScrollArea className="h-full">
              <div className={cn("p-3 gap-2", viewMode === "grid" ? "grid grid-cols-2" : "flex flex-col")}>
                {sampleImages.map((image) => (
                  <div
                    key={image.id}
                    className={cn(
                      "group relative rounded-lg border border-border bg-card overflow-hidden hover:border-primary/50 cursor-pointer transition-all",
                      viewMode === "list" && "flex items-center gap-3 p-2",
                    )}
                  >
                    <img
                      src={image.url || "/placeholder.svg"}
                      alt={image.name}
                      className={cn("object-cover", viewMode === "grid" ? "w-full aspect-video" : "w-12 h-12 rounded")}
                    />
                    {viewMode === "grid" ? (
                      <div className="p-2">
                        <p className="text-xs truncate">{image.name}</p>
                        <p className="text-xs text-muted-foreground">{image.size}</p>
                      </div>
                    ) : (
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{image.name}</p>
                        <p className="text-xs text-muted-foreground">{image.size}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
          <TabsContent value="my-images" className="flex-1 m-0 p-3">
            <div className="h-full flex flex-col items-center justify-center text-center gap-3">
              <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                <Upload className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">Upload Images</p>
                <p className="text-xs text-muted-foreground">Drag & drop or click to upload</p>
              </div>
              <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 transition-colors">
                Browse Files
              </button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    )
  }

  // Typography View
  if (activeView === "typography") {
    return (
      <div className="w-64 bg-sidebar flex flex-col border-r border-border">
        {renderPanelHeader("Typography")}
        <Tabs defaultValue="fonts" className="flex-1 flex flex-col">
          <TabsList className="mx-3 mt-2 grid grid-cols-2">
            <TabsTrigger value="fonts">Fonts</TabsTrigger>
            <TabsTrigger value="presets">Presets</TabsTrigger>
          </TabsList>
          {renderSearch("Search fonts...")}
          <TabsContent value="fonts" className="flex-1 m-0">
            <ScrollArea className="h-full">
              <div className="p-3 space-y-2">
                {fontFamilies.map((font) => (
                  <div
                    key={font.name}
                    className="p-3 rounded-lg border border-border bg-card hover:border-primary/50 cursor-pointer transition-all"
                  >
                    <p className="font-medium" style={{ fontFamily: font.name }}>
                      {font.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {font.category} · {font.weights.length} weights
                    </p>
                    <p className="text-xs mt-2 text-muted-foreground" style={{ fontFamily: font.name }}>
                      The quick brown fox jumps over the lazy dog
                    </p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
          <TabsContent value="presets" className="flex-1 m-0 p-3">
            <div className="space-y-3">
              <div className="p-3 rounded-lg border border-border bg-card">
                <p className="text-2xl font-bold">Heading 1</p>
                <p className="text-xs text-muted-foreground mt-1">48px / Bold / Inter</p>
              </div>
              <div className="p-3 rounded-lg border border-border bg-card">
                <p className="text-xl font-semibold">Heading 2</p>
                <p className="text-xs text-muted-foreground mt-1">36px / Semibold / Inter</p>
              </div>
              <div className="p-3 rounded-lg border border-border bg-card">
                <p className="text-base">Body Text</p>
                <p className="text-xs text-muted-foreground mt-1">16px / Regular / Inter</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    )
  }

  // Links View
  if (activeView === "links") {
    return (
      <div className="w-64 bg-sidebar flex flex-col border-r border-border">
        {renderPanelHeader("Links")}
        {renderSearch("Search links...")}
        <ScrollArea className="flex-1">
          <div className="p-3 space-y-2">
            {linksList.map((link) => (
              <div
                key={link.id}
                className="p-3 rounded-lg border border-border bg-card hover:border-primary/50 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{link.text}</p>
                  {link.type === "external" && <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />}
                </div>
                <p className="text-xs text-muted-foreground truncate mt-1">{link.url}</p>
              </div>
            ))}
            <button className="w-full p-3 rounded-lg border border-dashed border-border hover:border-primary/50 hover:bg-secondary/50 transition-all flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground">
              <Plus className="w-4 h-4" />
              <span className="text-sm">Add Link</span>
            </button>
          </div>
        </ScrollArea>
      </div>
    )
  }

  // Navigation View
  if (activeView === "navigation") {
    return (
      <div className="w-64 bg-sidebar flex flex-col border-r border-border">
        {renderPanelHeader("Navigation")}
        <ScrollArea className="flex-1">
          <div className="p-3 space-y-2">
            {navigationMenus.map((menu) => (
              <div
                key={menu.id}
                className="p-3 rounded-lg border border-border bg-card hover:border-primary/50 cursor-pointer transition-all"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{menu.name}</p>
                  <button className="p-1 hover:bg-secondary rounded opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{menu.items} items</p>
              </div>
            ))}
            <button className="w-full p-3 rounded-lg border border-dashed border-border hover:border-primary/50 hover:bg-secondary/50 transition-all flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground">
              <Plus className="w-4 h-4" />
              <span className="text-sm">Create Menu</span>
            </button>
          </div>
        </ScrollArea>
      </div>
    )
  }

  // Layers View
  if (activeView === "layers") {
    const renderElement = (element: ElementType, depth = 0) => (
      <div key={element.id}>
        <div
          className={cn(
            "flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors",
            selectedElement?.id === element.id ? "bg-primary/20 text-primary" : "hover:bg-secondary",
          )}
          style={{ paddingLeft: `${8 + depth * 16}px` }}
          onClick={() => onSelectElement?.(element)}
        >
          {element.children && element.children.length > 0 ? (
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          ) : (
            <div className="w-3.5" />
          )}
          <Layers className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs flex-1 truncate">{element.label}</span>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
            <button className="p-0.5 hover:bg-secondary rounded">
              <Eye className="w-3 h-3 text-muted-foreground" />
            </button>
            <button className="p-0.5 hover:bg-secondary rounded">
              <Unlock className="w-3 h-3 text-muted-foreground" />
            </button>
          </div>
        </div>
        {element.children?.map((child) => renderElement(child, depth + 1))}
      </div>
    )

    return (
      <div className="w-64 bg-sidebar flex flex-col border-r border-border">
        {renderPanelHeader("Layers")}
        {renderSearch("Search layers...")}
        <ScrollArea className="flex-1">
          <div className="p-2">{elements.map((element) => renderElement(element))}</div>
        </ScrollArea>
      </div>
    )
  }

  // Global Styles View
  if (activeView === "styles") {
    return (
      <div className="w-64 bg-sidebar flex flex-col border-r border-border">
        {renderPanelHeader("Global Styles")}
        <ScrollArea className="flex-1">
          <div className="p-3 space-y-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Colors</p>
              <div className="grid grid-cols-5 gap-2">
                {[
                  "#3B82F6",
                  "#10B981",
                  "#F59E0B",
                  "#EF4444",
                  "#8B5CF6",
                  "#EC4899",
                  "#06B6D4",
                  "#84CC16",
                  "#F97316",
                  "#6366F1",
                ].map((color) => (
                  <button
                    key={color}
                    className="w-8 h-8 rounded-lg border border-border hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Spacing</p>
              <div className="space-y-2">
                {["xs", "sm", "md", "lg", "xl"].map((size) => (
                  <div
                    key={size}
                    className="flex items-center justify-between p-2 rounded-lg bg-card border border-border"
                  >
                    <span className="text-xs uppercase">{size}</span>
                    <span className="text-xs text-muted-foreground">
                      {size === "xs"
                        ? "4px"
                        : size === "sm"
                          ? "8px"
                          : size === "md"
                            ? "16px"
                            : size === "lg"
                              ? "24px"
                              : "32px"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>
    )
  }

  // AI Assistant View
  if (activeView === "ai") {
    return (
      <div className="w-64 bg-sidebar flex flex-col border-r border-border">
        {renderPanelHeader("AI Assistant")}
        <ScrollArea className="flex-1">
          <div className="p-3 space-y-3">
            <div className="p-3 rounded-lg bg-secondary/50">
              <div className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-primary mt-0.5" />
                <div>
                  <p className="text-sm">How can I help you build your page?</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Ask me to generate sections, improve content, or suggest designs.
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Quick Actions</p>
              <button className="w-full p-2 text-left text-sm rounded-lg border border-border hover:bg-secondary transition-colors">
                Generate hero section
              </button>
              <button className="w-full p-2 text-left text-sm rounded-lg border border-border hover:bg-secondary transition-colors">
                Improve copy for selected
              </button>
              <button className="w-full p-2 text-left text-sm rounded-lg border border-border hover:bg-secondary transition-colors">
                Suggest color palette
              </button>
            </div>
          </div>
        </ScrollArea>
        <div className="p-3 border-t border-border">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Ask AI anything..."
              value={aiMessage}
              onChange={(e) => setAiMessage(e.target.value)}
              className="flex-1 h-9 bg-input border-0"
            />
            <button className="p-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  // History View
  if (activeView === "history") {
    return (
      <div className="w-64 bg-sidebar flex flex-col border-r border-border">
        {renderPanelHeader("History")}
        <ScrollArea className="flex-1">
          <div className="p-3 space-y-1">
            {historyItems.map((item) => (
              <div key={item.id} className="p-2 rounded-lg hover:bg-secondary cursor-pointer transition-colors group">
                <div className="flex items-start gap-2">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{item.action}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.element} · {item.time}
                    </p>
                  </div>
                  <button className="p-1 hover:bg-secondary rounded opacity-0 group-hover:opacity-100 transition-opacity">
                    <RotateCcw className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    )
  }

  // Default / Settings / Other views
  return (
    <div className="w-64 bg-sidebar flex flex-col border-r border-border">
      {renderPanelHeader(activeView.charAt(0).toUpperCase() + activeView.slice(1))}
      <div className="flex-1 flex items-center justify-center p-6 text-center">
        <div>
          <Settings className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            {activeView.charAt(0).toUpperCase() + activeView.slice(1)} panel
          </p>
          <p className="text-xs text-muted-foreground mt-1">Coming soon...</p>
        </div>
      </div>
    </div>
  )
}
