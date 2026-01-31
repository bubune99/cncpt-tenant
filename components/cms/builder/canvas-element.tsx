"use client"

import type React from "react"

import { cn } from "@/lib/cms/utils"
import type { ElementType } from "./page-builder"
import { GripVertical, Plus, Trash2, Copy, Settings } from "lucide-react"
import { useState } from "react"

interface CanvasElementProps {
  element: ElementType
  selectedElement: ElementType | null
  onSelectElement: (element: ElementType | null) => void
  depth: number
}

export function CanvasElement({ element, selectedElement, onSelectElement, depth }: CanvasElementProps) {
  const [isHovered, setIsHovered] = useState(false)
  const isSelected = selectedElement?.id === element.id

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onSelectElement(element)
  }

  const renderElementContent = () => {
    switch (element.type) {
      case "section":
        return (
          <div
            className={cn(
              "min-h-[100px]",
              element.props.padding === "lg" && "py-16 px-8",
              element.props.padding === "xl" && "py-24 px-8",
              element.props.background === "gradient" && "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900",
              element.props.background === "dark" && "bg-slate-900",
            )}
          >
            {element.children?.map((child) => (
              <CanvasElement
                key={child.id}
                element={child}
                selectedElement={selectedElement}
                onSelectElement={onSelectElement}
                depth={depth + 1}
              />
            ))}
          </div>
        )
      case "row":
        return (
          <div
            className={cn(
              "flex flex-wrap",
              element.props.gap === "md" && "gap-6",
              element.props.gap === "lg" && "gap-8",
            )}
          >
            {element.children?.map((child) => (
              <CanvasElement
                key={child.id}
                element={child}
                selectedElement={selectedElement}
                onSelectElement={onSelectElement}
                depth={depth + 1}
              />
            ))}
          </div>
        )
      case "column":
        return (
          <div className={cn("flex-1", element.props.width === "1/2" && "flex-1")}>
            {element.children?.map((child) => (
              <CanvasElement
                key={child.id}
                element={child}
                selectedElement={selectedElement}
                onSelectElement={onSelectElement}
                depth={depth + 1}
              />
            ))}
          </div>
        )
      case "heading":
        const HeadingTag = (element.props.level as "h1" | "h2" | "h3") || "h2"
        return (
          <HeadingTag
            className={cn(
              "font-bold text-white",
              element.props.level === "h1" && "text-5xl leading-tight mb-6",
              element.props.level === "h2" && "text-4xl mb-8",
              element.props.align === "center" && "text-center",
            )}
          >
            {element.props.text as string}
          </HeadingTag>
        )
      case "text":
        return (
          <p className={cn("text-lg text-slate-300 mb-6", element.props.align === "center" && "text-center")}>
            {element.props.text as string}
          </p>
        )
      case "button":
        return (
          <button
            className={cn(
              "rounded-lg font-semibold transition-all",
              element.props.variant === "primary" && "bg-primary text-primary-foreground hover:opacity-90",
              element.props.size === "lg" && "px-8 py-4 text-lg",
            )}
          >
            {element.props.text as string}
          </button>
        )
      case "image":
        return (
          <img
            src={(element.props.src as string) || "/placeholder.svg"}
            alt={element.props.alt as string}
            className={cn("w-full h-auto", element.props.rounded === "lg" && "rounded-xl")}
          />
        )
      case "card":
        return (
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center mb-4">
              <span className="text-primary text-xl">★</span>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">{element.props.title as string}</h3>
            <p className="text-slate-400">{element.props.description as string}</p>
          </div>
        )
      default:
        return (
          <div className="p-4 bg-gray-100 rounded text-gray-500 text-sm">
            {element.type}: {element.label}
          </div>
        )
    }
  }

  return (
    <div
      className={cn(
        "relative group",
        isSelected && "ring-2 ring-primary ring-offset-1",
        isHovered && !isSelected && "ring-1 ring-primary/50",
      )}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Element label */}
      {(isHovered || isSelected) && (
        <div
          className={cn(
            "absolute -top-6 left-0 z-10 flex items-center gap-1 px-2 py-1 rounded text-xs font-medium",
            isSelected ? "bg-primary text-primary-foreground" : "bg-slate-700 text-white",
          )}
        >
          <GripVertical className="h-3 w-3 cursor-grab" />
          {element.label}
        </div>
      )}

      {/* Element actions */}
      {isSelected && (
        <div className="absolute -top-6 right-0 z-10 flex items-center gap-0.5">
          <button className="p-1 rounded bg-slate-700 hover:bg-slate-600 text-white">
            <Plus className="h-3 w-3" />
          </button>
          <button className="p-1 rounded bg-slate-700 hover:bg-slate-600 text-white">
            <Copy className="h-3 w-3" />
          </button>
          <button className="p-1 rounded bg-slate-700 hover:bg-slate-600 text-white">
            <Settings className="h-3 w-3" />
          </button>
          <button className="p-1 rounded bg-destructive hover:bg-destructive/80 text-white">
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      )}

      {renderElementContent()}
    </div>
  )
}
