"use client"

import type React from "react"
import { useState } from "react"
import {
  ChevronUp,
  ChevronDown,
  Layout,
  Layers,
  Sparkles,
  Settings,
  GripVertical,
  X,
  Plus,
  Eye,
  Brush,
  Code,
  FileText,
  LayoutGrid,
  List,
  Home,
  MoreHorizontal,
} from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/cms/ui/tabs"
import { ScrollArea, ScrollBar } from "@/components/cms/ui/scroll-area"
import { Button } from "@/components/cms/ui/button"
import { Input } from "@/components/cms/ui/input"
import { Label } from "@/components/cms/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/cms/ui/select"
import { Slider } from "@/components/cms/ui/slider"
import { Switch } from "@/components/cms/ui/switch"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/cms/ui/dropdown-menu"
import { cn } from "@/lib/cms/utils"
import type { ElementType, PageType, PanelType, PanelPosition } from "./page-builder"

interface StagedElement {
  id: string
  type: string
  label: string
  thumbnail: string
}

interface TemplateSection {
  id: string
  name: string
  category: string
  thumbnail: string
}

interface BottomPanelProps {
  selectedElement: ElementType | null
  onUpdateElement: (id: string, props: Record<string, unknown>) => void
  panelHeight: number
  onPanelHeightChange: (height: number) => void
  pages: PageType[]
  currentPage: PageType
  onChangePage: (page: PageType) => void
  onAddPage: (name: string, slug: string) => void
  bottomPanels: PanelType[]
  elements: ElementType[]
  onSelectElement: (element: ElementType | null) => void
  onMovePanel: (panel: PanelType, position: PanelPosition) => void
}

const templateSections: TemplateSection[] = [
  { id: "hero-1", name: "Hero Split", category: "Hero", thumbnail: "/hero-split-layout-with-text-and-image.jpg" },
  { id: "hero-2", name: "Hero Centered", category: "Hero", thumbnail: "/centered-hero-with-headline.jpg" },
  { id: "hero-3", name: "Hero Video", category: "Hero", thumbnail: "/hero-with-video-background.jpg" },
  { id: "features-1", name: "Features Grid", category: "Features", thumbnail: "/3-column-features-grid.jpg" },
  { id: "features-2", name: "Features Alternating", category: "Features", thumbnail: "/alternating-feature-rows.jpg" },
  { id: "pricing-1", name: "Pricing Cards", category: "Pricing", thumbnail: "/3-pricing-tier-cards.jpg" },
  { id: "pricing-2", name: "Pricing Table", category: "Pricing", thumbnail: "/pricing-comparison-table.jpg" },
  {
    id: "testimonials-1",
    name: "Testimonial Carousel",
    category: "Testimonials",
    thumbnail: "/testimonial-slider-cards.jpg",
  },
  {
    id: "testimonials-2",
    name: "Testimonial Grid",
    category: "Testimonials",
    thumbnail: "/testimonial-grid-layout.jpg",
  },
  { id: "cta-1", name: "CTA Banner", category: "CTA", thumbnail: "/call-to-action-banner.png" },
  { id: "cta-2", name: "CTA Split", category: "CTA", thumbnail: "/split-cta-with-form.jpg" },
  { id: "footer-1", name: "Footer Multi-Column", category: "Footer", thumbnail: "/multi-column-footer.jpg" },
]

const categories = ["All", "Hero", "Features", "Pricing", "Testimonials", "CTA", "Footer"]

export function BottomPanel({
  selectedElement,
  onUpdateElement,
  panelHeight,
  onPanelHeightChange,
  pages,
  currentPage,
  onChangePage,
  onAddPage,
  bottomPanels,
  elements,
  onSelectElement,
  onMovePanel,
}: BottomPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [isDragging, setIsDragging] = useState(false)
  const [activeTab, setActiveTab] = useState("properties")
  const [propertiesSubTab, setPropertiesSubTab] = useState<"settings" | "styles" | "advanced">("settings")
  const [propertiesViewMode, setPropertiesViewMode] = useState<"scroll" | "grid">("scroll")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [stagedElements, setStagedElements] = useState<StagedElement[]>([
    { id: "staged-1", type: "section", label: "Hero Section", thumbnail: "/hero-section-preview.png" },
    { id: "staged-2", type: "card", label: "Feature Card", thumbnail: "/feature-card-preview.jpg" },
  ])
  const [viewMode, setViewMode] = useState<"scroll" | "grid">("scroll")
  const [newPageName, setNewPageName] = useState("")

  const filteredTemplates =
    selectedCategory === "All" ? templateSections : templateSections.filter((t) => t.category === selectedCategory)

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)

    const startY = e.clientY
    const startHeight = panelHeight

    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = startY - e.clientY
      const newHeight = Math.min(Math.max(startHeight + deltaY, 200), 500)
      onPanelHeightChange(newHeight)
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
  }

  const removeFromStaging = (id: string) => {
    setStagedElements((prev) => prev.filter((el) => el.id !== id))
  }

  const handleCollapse = () => {
    if (isExpanded) {
      onPanelHeightChange(40)
    } else {
      onPanelHeightChange(280)
    }
    setIsExpanded(!isExpanded)
  }

  const handleAddPage = () => {
    if (newPageName.trim()) {
      const slug = `/${newPageName.toLowerCase().replace(/\s+/g, "-")}`
      onAddPage(newPageName, slug)
      setNewPageName("")
    }
  }

  const renderPropertiesContent = () => {
    if (!selectedElement) {
      return (
        <div className="h-full flex items-center justify-center p-8 text-center">
          <p className="text-sm text-muted-foreground">Select an element to view and edit its properties</p>
        </div>
      )
    }

    return (
      <div className="h-full flex">
        {/* Properties Sub-tabs - vertical on left */}
        <div className="w-28 border-r border-border shrink-0 flex flex-col">
          <div className="p-2 border-b border-border">
            <p className="text-xs font-medium truncate">{selectedElement.label}</p>
            <p className="text-[10px] text-muted-foreground capitalize">{selectedElement.type}</p>
          </div>
          <div className="flex flex-col p-1 gap-0.5">
            <button
              onClick={() => setPropertiesSubTab("settings")}
              className={cn(
                "flex items-center gap-2 px-2 py-1.5 text-xs rounded transition-colors text-left",
                propertiesSubTab === "settings"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-secondary text-muted-foreground hover:text-foreground",
              )}
            >
              <Settings className="w-3.5 h-3.5" />
              Settings
            </button>
            <button
              onClick={() => setPropertiesSubTab("styles")}
              className={cn(
                "flex items-center gap-2 px-2 py-1.5 text-xs rounded transition-colors text-left",
                propertiesSubTab === "styles"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-secondary text-muted-foreground hover:text-foreground",
              )}
            >
              <Brush className="w-3.5 h-3.5" />
              Styles
            </button>
            <button
              onClick={() => setPropertiesSubTab("advanced")}
              className={cn(
                "flex items-center gap-2 px-2 py-1.5 text-xs rounded transition-colors text-left",
                propertiesSubTab === "advanced"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-secondary text-muted-foreground hover:text-foreground",
              )}
            >
              <Code className="w-3.5 h-3.5" />
              Advanced
            </button>
          </div>
        </div>

        {/* Properties Content - horizontal layout with scroll/grid toggle */}
        <ScrollArea className="flex-1">
          <div className="p-4">
            {propertiesSubTab === "settings" && (
              <div
                className={cn(
                  propertiesViewMode === "grid"
                    ? "grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                    : "flex flex-wrap gap-6",
                )}
              >
                {/* Content settings based on element type */}
                {(selectedElement.type === "heading" ||
                  selectedElement.type === "text" ||
                  selectedElement.type === "button") && (
                  <div className="space-y-2 min-w-48">
                    <Label className="text-xs text-muted-foreground">Text</Label>
                    <Input
                      value={(selectedElement.props.text as string) || ""}
                      onChange={(e) => onUpdateElement(selectedElement.id, { text: e.target.value })}
                      className="h-9 bg-input border-0"
                    />
                  </div>
                )}
                {selectedElement.type === "heading" && (
                  <div className="space-y-2 min-w-36">
                    <Label className="text-xs text-muted-foreground">Level</Label>
                    <Select
                      value={(selectedElement.props.level as string) || "h2"}
                      onValueChange={(value) => onUpdateElement(selectedElement.id, { level: value })}
                    >
                      <SelectTrigger className="h-9 bg-input border-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="h1">Heading 1</SelectItem>
                        <SelectItem value="h2">Heading 2</SelectItem>
                        <SelectItem value="h3">Heading 3</SelectItem>
                        <SelectItem value="h4">Heading 4</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {selectedElement.type === "button" && (
                  <>
                    <div className="space-y-2 min-w-36">
                      <Label className="text-xs text-muted-foreground">Variant</Label>
                      <Select
                        value={(selectedElement.props.variant as string) || "primary"}
                        onValueChange={(value) => onUpdateElement(selectedElement.id, { variant: value })}
                      >
                        <SelectTrigger className="h-9 bg-input border-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="primary">Primary</SelectItem>
                          <SelectItem value="secondary">Secondary</SelectItem>
                          <SelectItem value="outline">Outline</SelectItem>
                          <SelectItem value="ghost">Ghost</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 min-w-36">
                      <Label className="text-xs text-muted-foreground">Size</Label>
                      <Select
                        value={(selectedElement.props.size as string) || "md"}
                        onValueChange={(value) => onUpdateElement(selectedElement.id, { size: value })}
                      >
                        <SelectTrigger className="h-9 bg-input border-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sm">Small</SelectItem>
                          <SelectItem value="md">Medium</SelectItem>
                          <SelectItem value="lg">Large</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
                {selectedElement.type === "image" && (
                  <>
                    <div className="space-y-2 min-w-64">
                      <Label className="text-xs text-muted-foreground">Image URL</Label>
                      <Input
                        value={(selectedElement.props.src as string) || ""}
                        onChange={(e) => onUpdateElement(selectedElement.id, { src: e.target.value })}
                        className="h-9 bg-input border-0"
                      />
                    </div>
                    <div className="space-y-2 min-w-48">
                      <Label className="text-xs text-muted-foreground">Alt Text</Label>
                      <Input
                        value={(selectedElement.props.alt as string) || ""}
                        onChange={(e) => onUpdateElement(selectedElement.id, { alt: e.target.value })}
                        className="h-9 bg-input border-0"
                      />
                    </div>
                  </>
                )}
                {selectedElement.type === "card" && (
                  <>
                    <div className="space-y-2 min-w-48">
                      <Label className="text-xs text-muted-foreground">Title</Label>
                      <Input
                        value={(selectedElement.props.title as string) || ""}
                        onChange={(e) => onUpdateElement(selectedElement.id, { title: e.target.value })}
                        className="h-9 bg-input border-0"
                      />
                    </div>
                    <div className="space-y-2 min-w-64">
                      <Label className="text-xs text-muted-foreground">Description</Label>
                      <Input
                        value={(selectedElement.props.description as string) || ""}
                        onChange={(e) => onUpdateElement(selectedElement.id, { description: e.target.value })}
                        className="h-9 bg-input border-0"
                      />
                    </div>
                  </>
                )}
                {selectedElement.type === "section" && (
                  <>
                    <div className="space-y-2 min-w-36">
                      <Label className="text-xs text-muted-foreground">Padding</Label>
                      <Select
                        value={(selectedElement.props.padding as string) || "md"}
                        onValueChange={(value) => onUpdateElement(selectedElement.id, { padding: value })}
                      >
                        <SelectTrigger className="h-9 bg-input border-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sm">Small</SelectItem>
                          <SelectItem value="md">Medium</SelectItem>
                          <SelectItem value="lg">Large</SelectItem>
                          <SelectItem value="xl">Extra Large</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 min-w-36">
                      <Label className="text-xs text-muted-foreground">Background</Label>
                      <Select
                        value={(selectedElement.props.background as string) || "none"}
                        onValueChange={(value) => onUpdateElement(selectedElement.id, { background: value })}
                      >
                        <SelectTrigger className="h-9 bg-input border-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="light">Light</SelectItem>
                          <SelectItem value="dark">Dark</SelectItem>
                          <SelectItem value="gradient">Gradient</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
                {selectedElement.type === "row" && (
                  <>
                    <div className="space-y-2 min-w-36">
                      <Label className="text-xs text-muted-foreground">Columns</Label>
                      <Select
                        value={String((selectedElement.props.columns as number) || 2)}
                        onValueChange={(value) => onUpdateElement(selectedElement.id, { columns: Number(value) })}
                      >
                        <SelectTrigger className="h-9 bg-input border-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 Column</SelectItem>
                          <SelectItem value="2">2 Columns</SelectItem>
                          <SelectItem value="3">3 Columns</SelectItem>
                          <SelectItem value="4">4 Columns</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 min-w-36">
                      <Label className="text-xs text-muted-foreground">Gap</Label>
                      <Select
                        value={(selectedElement.props.gap as string) || "md"}
                        onValueChange={(value) => onUpdateElement(selectedElement.id, { gap: value })}
                      >
                        <SelectTrigger className="h-9 bg-input border-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sm">Small</SelectItem>
                          <SelectItem value="md">Medium</SelectItem>
                          <SelectItem value="lg">Large</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
              </div>
            )}

            {propertiesSubTab === "styles" && (
              <div
                className={cn(
                  propertiesViewMode === "grid"
                    ? "grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                    : "flex flex-wrap gap-6",
                )}
              >
                <div className="space-y-2 min-w-48">
                  <Label className="text-xs text-muted-foreground">Alignment</Label>
                  <div className="flex gap-1">
                    {["left", "center", "right"].map((align) => (
                      <button
                        key={align}
                        onClick={() => onUpdateElement(selectedElement.id, { align })}
                        className={cn(
                          "flex-1 py-2 rounded text-xs capitalize transition-colors",
                          selectedElement.props.align === align
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary hover:bg-secondary/80",
                        )}
                      >
                        {align}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2 min-w-48">
                  <Label className="text-xs text-muted-foreground">Margin Top</Label>
                  <Slider
                    value={[(selectedElement.props.marginTop as number) || 0]}
                    min={0}
                    max={100}
                    step={4}
                    onValueChange={([value]) => onUpdateElement(selectedElement.id, { marginTop: value })}
                  />
                </div>
                <div className="space-y-2 min-w-48">
                  <Label className="text-xs text-muted-foreground">Margin Bottom</Label>
                  <Slider
                    value={[(selectedElement.props.marginBottom as number) || 0]}
                    min={0}
                    max={100}
                    step={4}
                    onValueChange={([value]) => onUpdateElement(selectedElement.id, { marginBottom: value })}
                  />
                </div>
                <div className="space-y-3 min-w-36">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">Full Width</Label>
                    <Switch
                      checked={(selectedElement.props.fullWidth as boolean) || false}
                      onCheckedChange={(checked) => onUpdateElement(selectedElement.id, { fullWidth: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">Hide on Mobile</Label>
                    <Switch
                      checked={(selectedElement.props.hideOnMobile as boolean) || false}
                      onCheckedChange={(checked) => onUpdateElement(selectedElement.id, { hideOnMobile: checked })}
                    />
                  </div>
                </div>
              </div>
            )}

            {propertiesSubTab === "advanced" && (
              <div
                className={cn(
                  propertiesViewMode === "grid"
                    ? "grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                    : "flex flex-wrap gap-6",
                )}
              >
                <div className="space-y-2 min-w-48">
                  <Label className="text-xs text-muted-foreground">Element ID</Label>
                  <Input value={selectedElement.id} readOnly className="h-9 bg-input border-0 font-mono text-xs" />
                </div>
                <div className="space-y-2 min-w-48">
                  <Label className="text-xs text-muted-foreground">CSS Classes</Label>
                  <Input placeholder="custom-class another-class" className="h-9 bg-input border-0" />
                </div>
                <div className="space-y-2 min-w-64">
                  <Label className="text-xs text-muted-foreground">Custom CSS</Label>
                  <textarea
                    placeholder=".element { }"
                    className="w-full h-20 rounded-md bg-input p-2 text-xs font-mono resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
            )}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    )
  }

  return (
    <div className={cn("border-t border-border bg-sidebar flex flex-col transition-all duration-200 overflow-hidden")}>
      {/* Resize Handle */}
      <div
        className={cn(
          "h-2 flex items-center justify-center cursor-ns-resize hover:bg-primary/10 transition-colors group shrink-0",
          isDragging && "bg-primary/20",
        )}
        onMouseDown={handleMouseDown}
      >
        <div className="w-12 h-1 rounded-full bg-border group-hover:bg-primary/50 transition-colors" />
      </div>

      {/* Header Bar */}
      <div className="h-8 px-2 flex items-center justify-between border-b border-border shrink-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <TabsList className="h-full bg-transparent p-0 gap-1">
            <TabsTrigger
              value="properties"
              className="h-7 px-3 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md"
            >
              <Settings className="w-3.5 h-3.5 mr-1.5" />
              Properties
            </TabsTrigger>
            <TabsTrigger
              value="pages"
              className="h-7 px-3 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md"
            >
              <FileText className="w-3.5 h-3.5 mr-1.5" />
              Pages
              <span className="ml-1.5 px-1.5 py-0.5 text-[10px] bg-accent rounded-full">{pages.length}</span>
            </TabsTrigger>
            <TabsTrigger
              value="templates"
              className="h-7 px-3 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md"
            >
              <Layout className="w-3.5 h-3.5 mr-1.5" />
              Templates
            </TabsTrigger>
            <TabsTrigger
              value="staging"
              className="h-7 px-3 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md"
            >
              <Layers className="w-3.5 h-3.5 mr-1.5" />
              Staging
              {stagedElements.length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 text-[10px] bg-accent rounded-full">{stagedElements.length}</span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="ai"
              className="h-7 px-3 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              AI Suggest
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          {(activeTab === "templates" || activeTab === "staging" || activeTab === "properties") && (
            <div className="flex items-center gap-1 bg-secondary rounded-md p-0.5">
              <button
                onClick={() => (activeTab === "properties" ? setPropertiesViewMode("scroll") : setViewMode("scroll"))}
                className={cn(
                  "px-2 py-1 text-[10px] rounded transition-colors",
                  (activeTab === "properties" ? propertiesViewMode : viewMode) === "scroll"
                    ? "bg-background text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <List className="w-3 h-3" />
              </button>
              <button
                onClick={() => (activeTab === "properties" ? setPropertiesViewMode("grid") : setViewMode("grid"))}
                className={cn(
                  "px-2 py-1 text-[10px] rounded transition-colors",
                  (activeTab === "properties" ? propertiesViewMode : viewMode) === "grid"
                    ? "bg-background text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <LayoutGrid className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Collapse Button */}
          <button onClick={handleCollapse} className="p-1 hover:bg-secondary rounded transition-colors">
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Panel Content */}
      {isExpanded && (
        <div className="flex-1 overflow-hidden">
          {activeTab === "properties" && renderPropertiesContent()}

          {activeTab === "pages" && (
            <div className="h-full flex">
              {/* Pages List */}
              <ScrollArea className="flex-1">
                <div className="p-3">
                  <div className="flex items-center gap-2 mb-3">
                    <Input
                      placeholder="New page name..."
                      value={newPageName}
                      onChange={(e) => setNewPageName(e.target.value)}
                      className="h-8 bg-input border-0 flex-1"
                      onKeyDown={(e) => e.key === "Enter" && handleAddPage()}
                    />
                    <Button size="sm" className="h-8" onClick={handleAddPage}>
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      Add
                    </Button>
                  </div>
                  <div
                    className={cn(
                      viewMode === "grid"
                        ? "grid grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2"
                        : "flex gap-2 flex-wrap",
                    )}
                  >
                    {pages.map((page) => (
                      <button
                        key={page.id}
                        onClick={() => onChangePage(page)}
                        className={cn(
                          "group relative flex flex-col items-center gap-2 p-3 rounded-lg border transition-all",
                          viewMode === "scroll" && "min-w-32",
                          currentPage.id === page.id
                            ? "border-primary bg-primary/10"
                            : "border-border bg-card hover:border-primary/50 hover:bg-secondary",
                        )}
                      >
                        <div
                          className={cn(
                            "w-12 h-9 rounded bg-muted flex items-center justify-center",
                            currentPage.id === page.id && "bg-primary/20",
                          )}
                        >
                          {page.isHome ? (
                            <Home className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <FileText className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                        <div className="text-center">
                          <p className="text-xs font-medium truncate max-w-24">{page.name}</p>
                          <p className="text-[10px] text-muted-foreground truncate max-w-24">{page.slug}</p>
                        </div>
                        {currentPage.id === page.id && (
                          <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary" />
                        )}
                        {/* Page Actions Dropdown */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              className="absolute top-1 left-1 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-black/20 transition-opacity"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="w-3 h-3" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="w-32">
                            <DropdownMenuItem>Rename</DropdownMenuItem>
                            <DropdownMenuItem>Duplicate</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </button>
                    ))}
                  </div>
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </div>
          )}

          {activeTab === "templates" && (
            <div className="h-full flex flex-col">
              {/* Category Pills */}
              <div className="px-3 py-2 border-b border-border shrink-0">
                <div className="flex gap-1.5 overflow-x-auto">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={cn(
                        "px-3 py-1 text-xs rounded-full whitespace-nowrap transition-colors",
                        selectedCategory === cat
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Templates Grid/Scroll */}
              <ScrollArea className="flex-1">
                <div className={cn("p-3", viewMode === "grid" ? "grid grid-cols-4 gap-3" : "flex gap-3")}>
                  {filteredTemplates.map((template) => (
                    <div
                      key={template.id}
                      className={cn(
                        "group relative rounded-lg border border-border bg-card overflow-hidden cursor-pointer hover:border-primary/50 transition-all hover:shadow-lg",
                        viewMode === "scroll" && "shrink-0 w-52",
                      )}
                    >
                      <div className="aspect-[5/3] bg-muted relative overflow-hidden">
                        <img
                          src={template.thumbnail || "/placeholder.svg"}
                          alt={template.name}
                          className="w-full h-full object-cover"
                        />
                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <Button size="sm" variant="secondary" className="h-7 text-xs">
                            <Eye className="w-3 h-3 mr-1" />
                            Preview
                          </Button>
                          <Button size="sm" className="h-7 text-xs">
                            <Plus className="w-3 h-3 mr-1" />
                            Add
                          </Button>
                        </div>
                      </div>
                      <div className="p-2">
                        <p className="text-xs font-medium truncate">{template.name}</p>
                        <p className="text-[10px] text-muted-foreground">{template.category}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </div>
          )}

          {activeTab === "staging" && (
            <div className="h-full flex flex-col">
              <div className="px-3 py-2 border-b border-border shrink-0">
                <p className="text-xs text-muted-foreground">
                  Drag elements here to stage them before adding to the canvas
                </p>
              </div>
              <ScrollArea className="flex-1">
                {stagedElements.length > 0 ? (
                  <div className={cn("p-3", viewMode === "grid" ? "grid grid-cols-5 gap-3" : "flex gap-3")}>
                    {stagedElements.map((element) => (
                      <div
                        key={element.id}
                        className={cn(
                          "group relative rounded-lg border border-border bg-card overflow-hidden",
                          viewMode === "scroll" && "shrink-0 w-40",
                        )}
                      >
                        <div className="aspect-[7/5] bg-muted relative">
                          <img
                            src={element.thumbnail || "/placeholder.svg"}
                            alt={element.label}
                            className="w-full h-full object-cover"
                          />
                          {/* Drag Handle */}
                          <div className="absolute top-1 left-1 p-1 bg-black/50 rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-grab">
                            <GripVertical className="w-3 h-3 text-white" />
                          </div>
                          {/* Remove Button */}
                          <button
                            onClick={() => removeFromStaging(element.id)}
                            className="absolute top-1 right-1 p-1 bg-black/50 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
                          >
                            <X className="w-3 h-3 text-white" />
                          </button>
                        </div>
                        <div className="p-2">
                          <p className="text-xs font-medium truncate">{element.label}</p>
                          <p className="text-[10px] text-muted-foreground capitalize">{element.type}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-center p-8">
                    <div>
                      <Layers className="w-10 h-10 mx-auto mb-2 text-muted-foreground/50" />
                      <p className="text-sm text-muted-foreground">No staged elements</p>
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        Drag elements from the sidebar or templates here
                      </p>
                    </div>
                  </div>
                )}
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </div>
          )}

          {activeTab === "ai" && (
            <div className="h-full flex items-center justify-center p-6">
              <div className="text-center max-w-sm">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <h4 className="font-medium text-sm mb-1">AI Section Suggestions</h4>
                <p className="text-xs text-muted-foreground mb-4">
                  Get intelligent suggestions for sections based on your page content and industry
                </p>
                <Button size="sm">
                  <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                  Generate Suggestions
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
