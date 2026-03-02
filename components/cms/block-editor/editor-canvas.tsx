"use client"

import { useRef, useCallback, useState } from "react"
import { useEditor } from "@/lib/cms/block-editor/editor-context"
import { CanvasBlock, EmptyCanvasDropZone } from "./canvas-block"
import { countBlocks } from "@/lib/cms/block-editor/tree-utils"

interface EditorCanvasProps {
  viewportWidth?: string
}

export function EditorCanvas({ viewportWidth = "100%" }: EditorCanvasProps) {
  const { state, selectBlock, addBlockFromTemplate } = useEditor()
  const canvasRef = useRef<HTMLDivElement>(null)
  const [isOver, setIsOver] = useState(false)

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === canvasRef.current || (e.target as HTMLElement).dataset.canvas) {
        selectBlock(null)
      }
    },
    [selectBlock]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    if (canvasRef.current && !canvasRef.current.contains(e.relatedTarget as Node)) {
      setIsOver(false)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsOver(false)

      // Only handle root-level drops (not handled by a CanvasBlock)
      if (e.target !== canvasRef.current && !(e.target as HTMLElement).dataset.canvas) {
        return
      }

      const paletteLabel = e.dataTransfer.getData("application/palette-label")
      if (paletteLabel) {
        addBlockFromTemplate(paletteLabel, null)
      }
    },
    [addBlockFromTemplate]
  )

  const blockCount = countBlocks(state.blocks)

  return (
    <div
      ref={canvasRef}
      onClick={handleCanvasClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      data-canvas="true"
      className="flex-1 overflow-auto bg-background"
    >
      <div className={`flex justify-center ${viewportWidth === "100%" ? "p-0" : "p-2 sm:p-4 md:p-6"}`} data-canvas="true">
        <div
          className={`w-full transition-all duration-300 ease-out ${
            viewportWidth === "100%"
              ? "min-h-full"
              : "rounded-lg border border-border/50 bg-background shadow-sm"
          }`}
          style={{ maxWidth: viewportWidth === "100%" ? undefined : viewportWidth }}
          data-canvas="true"
        >
          {/* Block count indicator */}
          {blockCount > 0 && (
            <div className="mb-4 flex items-center justify-between px-1">
              <span className="text-[10px] text-muted-foreground">
                {blockCount} block{blockCount !== 1 ? "s" : ""}
              </span>
            </div>
          )}

          {/* Canvas content */}
          {state.blocks.length === 0 ? (
            <EmptyCanvasDropZone />
          ) : (
            <div className="flex flex-col gap-1">
              {state.blocks.map((block, index) => (
                <CanvasBlock
                  key={block.id}
                  block={block}
                  index={index}
                  parentId={null}
                  depth={0}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
