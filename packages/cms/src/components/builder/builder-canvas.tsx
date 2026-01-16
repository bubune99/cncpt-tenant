"use client"
import type { ElementType } from "./page-builder"
import { CanvasElement } from "./canvas-element"

interface BuilderCanvasProps {
  elements: ElementType[]
  selectedElement: ElementType | null
  onSelectElement: (element: ElementType | null) => void
  viewport: "desktop" | "tablet" | "mobile"
  zoom: number
}

export function BuilderCanvas({ elements, selectedElement, onSelectElement, viewport, zoom }: BuilderCanvasProps) {
  const viewportWidths = {
    desktop: "100%",
    tablet: "768px",
    mobile: "375px",
  }

  return (
    <div
      className="flex-1 overflow-auto bg-canvas p-8"
      style={{
        backgroundImage: `
          linear-gradient(to right, var(--canvas-grid) 1px, transparent 1px),
          linear-gradient(to bottom, var(--canvas-grid) 1px, transparent 1px)
        `,
        backgroundSize: "20px 20px",
      }}
      onClick={() => onSelectElement(null)}
    >
      <div
        className="mx-auto bg-white rounded-lg shadow-2xl overflow-hidden transition-all duration-300"
        style={{
          width: viewportWidths[viewport],
          maxWidth: "100%",
          transform: `scale(${zoom / 100})`,
          transformOrigin: "top center",
        }}
      >
        {elements.map((element) => (
          <CanvasElement
            key={element.id}
            element={element}
            selectedElement={selectedElement}
            onSelectElement={onSelectElement}
            depth={0}
          />
        ))}
        <div className="p-8 border-2 border-dashed border-gray-200 text-center text-gray-400 hover:border-primary/50 hover:text-primary/50 transition-colors cursor-pointer m-4 rounded-lg">
          + Add Section
        </div>
      </div>
    </div>
  )
}
