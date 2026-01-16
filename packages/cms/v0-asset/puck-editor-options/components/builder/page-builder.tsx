"use client"

import { useState } from "react"
import { BuilderHeader } from "./builder-header"
import { BuilderCanvas } from "./builder-canvas"
import { BottomPanel } from "./bottom-panel"
import { SiteSettingsModal } from "./site-settings-modal"
import { ActivityBar, type ActivityView } from "./activity-bar"
import { ActivityPanel } from "./activity-panel"
import { RightPanel } from "./right-panel"

export type ElementType = {
  id: string
  type: string
  label: string
  props: Record<string, unknown>
  children?: ElementType[]
}

export type PageType = {
  id: string
  name: string
  slug: string
  isHome?: boolean
}

export type PanelPosition = "left" | "right" | "bottom"
export type PanelType = "elements" | "layers"

const initialPages: PageType[] = [
  { id: "page-1", name: "Home", slug: "/", isHome: true },
  { id: "page-2", name: "About", slug: "/about" },
  { id: "page-3", name: "Services", slug: "/services" },
  { id: "page-4", name: "Contact", slug: "/contact" },
  { id: "page-5", name: "Blog", slug: "/blog" },
]

const initialElements: ElementType[] = [
  {
    id: "section-1",
    type: "section",
    label: "Hero Section",
    props: { padding: "lg", background: "gradient" },
    children: [
      {
        id: "row-1",
        type: "row",
        label: "Row",
        props: { columns: 2, gap: "md" },
        children: [
          {
            id: "col-1",
            type: "column",
            label: "Column 1",
            props: { width: "1/2" },
            children: [
              {
                id: "heading-1",
                type: "heading",
                label: "Heading",
                props: { text: "Build Beautiful Pages", level: "h1", align: "left" },
              },
              {
                id: "text-1",
                type: "text",
                label: "Paragraph",
                props: { text: "Create stunning websites with our intuitive drag-and-drop builder.", align: "left" },
              },
              {
                id: "button-1",
                type: "button",
                label: "Button",
                props: { text: "Get Started", variant: "primary", size: "lg" },
              },
            ],
          },
          {
            id: "col-2",
            type: "column",
            label: "Column 2",
            props: { width: "1/2" },
            children: [
              {
                id: "image-1",
                type: "image",
                label: "Hero Image",
                props: { src: "/modern-dashboard.png", alt: "Hero", rounded: "lg" },
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "section-2",
    type: "section",
    label: "Features Section",
    props: { padding: "xl", background: "dark" },
    children: [
      {
        id: "heading-2",
        type: "heading",
        label: "Section Title",
        props: { text: "Powerful Features", level: "h2", align: "center" },
      },
      {
        id: "row-2",
        type: "row",
        label: "Features Row",
        props: { columns: 3, gap: "lg" },
        children: [
          {
            id: "card-1",
            type: "card",
            label: "Feature Card 1",
            props: {
              title: "Drag & Drop",
              description: "Intuitive interface for easy page building",
              icon: "mouse-pointer",
            },
          },
          {
            id: "card-2",
            type: "card",
            label: "Feature Card 2",
            props: { title: "Responsive", description: "Perfect on every device and screen size", icon: "smartphone" },
          },
          {
            id: "card-3",
            type: "card",
            label: "Feature Card 3",
            props: { title: "Fast & Light", description: "Optimized code for lightning performance", icon: "zap" },
          },
        ],
      },
    ],
  },
]

export function PageBuilder() {
  const [elements, setElements] = useState<ElementType[]>(initialElements)
  const [selectedElement, setSelectedElement] = useState<ElementType | null>(null)
  const [viewport, setViewport] = useState<"desktop" | "tablet" | "mobile">("desktop")
  const [showLayers, setShowLayers] = useState(true)
  const [zoom, setZoom] = useState(100)
  const [bottomPanelHeight, setBottomPanelHeight] = useState(280)

  const [pages, setPages] = useState<PageType[]>(initialPages)
  const [currentPage, setCurrentPage] = useState<PageType>(initialPages[0])

  const [showSiteSettings, setShowSiteSettings] = useState(false)

  const [activeView, setActiveView] = useState<ActivityView>("blocks")

  const [panelPositions, setPanelPositions] = useState<Record<PanelType, PanelPosition>>({
    elements: "left",
    layers: "right",
  })

  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false)

  const handleSelectElement = (element: ElementType | null) => {
    setSelectedElement(element)
  }

  const handleUpdateElement = (id: string, props: Record<string, unknown>) => {
    const updateElementInTree = (elements: ElementType[]): ElementType[] => {
      return elements.map((el) => {
        if (el.id === id) {
          return { ...el, props: { ...el.props, ...props } }
        }
        if (el.children) {
          return { ...el, children: updateElementInTree(el.children) }
        }
        return el
      })
    }
    setElements(updateElementInTree(elements))
    if (selectedElement?.id === id) {
      setSelectedElement({ ...selectedElement, props: { ...selectedElement.props, ...props } })
    }
  }

  const handleMovePanel = (panel: PanelType, newPosition: PanelPosition) => {
    setPanelPositions((prev) => ({
      ...prev,
      [panel]: newPosition,
    }))
  }

  const handleAddPage = (name: string, slug: string) => {
    const newPage: PageType = {
      id: `page-${Date.now()}`,
      name,
      slug,
    }
    setPages([...pages, newPage])
  }

  const bottomPanels = Object.entries(panelPositions)
    .filter(([_, pos]) => pos === "bottom")
    .map(([panel]) => panel as PanelType)

  return (
    <div className="h-screen grid grid-rows-[auto_1fr] bg-background overflow-hidden">
      <BuilderHeader
        viewport={viewport}
        setViewport={setViewport}
        zoom={zoom}
        setZoom={setZoom}
        showLayers={showLayers}
        setShowLayers={setShowLayers}
        currentPage={currentPage}
        onOpenSiteSettings={() => setShowSiteSettings(true)}
      />
      <div className="flex overflow-hidden">
        {/* Activity Bar - far left vertical icon strip */}
        <ActivityBar activeView={activeView} onViewChange={setActiveView} />

        {/* Activity Panel - content panel for selected activity */}
        <ActivityPanel
          activeView={activeView}
          elements={elements}
          selectedElement={selectedElement}
          onSelectElement={handleSelectElement}
        />

        {/* Main content area - canvas + bottom panel */}
        <div className="flex-1 grid overflow-hidden" style={{ gridTemplateRows: `1fr ${bottomPanelHeight}px` }}>
          <BuilderCanvas
            elements={elements}
            selectedElement={selectedElement}
            onSelectElement={handleSelectElement}
            viewport={viewport}
            zoom={zoom}
          />
          <BottomPanel
            selectedElement={selectedElement}
            onUpdateElement={handleUpdateElement}
            panelHeight={bottomPanelHeight}
            onPanelHeightChange={setBottomPanelHeight}
            pages={pages}
            currentPage={currentPage}
            onChangePage={setCurrentPage}
            onAddPage={handleAddPage}
            bottomPanels={bottomPanels}
            elements={elements}
            onSelectElement={handleSelectElement}
            onMovePanel={handleMovePanel}
          />
        </div>

        {/* Right Panel */}
        <RightPanel
          elements={elements}
          selectedElement={selectedElement}
          onSelectElement={handleSelectElement}
          isCollapsed={rightPanelCollapsed}
          onCollapse={() => setRightPanelCollapsed(!rightPanelCollapsed)}
        />
      </div>

      <SiteSettingsModal isOpen={showSiteSettings} onClose={() => setShowSiteSettings(false)} />
    </div>
  )
}
