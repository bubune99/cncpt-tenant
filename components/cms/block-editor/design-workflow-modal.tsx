"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/cms/ui/dialog"
import { cn } from "@/lib/cms/utils"
import { GraduationCap, Play, ChevronLeft, ChevronRight, Check, Eye } from "lucide-react"
import type { DesignWorkflow, DesignWorkflowStep } from "@/lib/cms/block-editor/workflow-types"
import { SPOTLIGHT_COLOR_MAP } from "@/lib/cms/block-editor/workflow-types"

/* ------------------------------------------------------------------ */
/*  Props                                                               */
/* ------------------------------------------------------------------ */

interface DesignWorkflowModalProps {
  workflow: DesignWorkflow
  open: boolean
  onClose: () => void
  onViewOnCanvas: (step: DesignWorkflowStep) => void
  onPlayAll: (steps: DesignWorkflowStep[]) => void
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

function getRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp
  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return "just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */

export function DesignWorkflowModal({
  workflow,
  open,
  onClose,
  onViewOnCanvas,
  onPlayAll,
}: DesignWorkflowModalProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [visitedSteps, setVisitedSteps] = useState<Set<number>>(new Set())
  const [isPlaying, setIsPlaying] = useState(false)
  const playTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Reset when workflow changes
  useEffect(() => {
    setCurrentStepIndex(0)
    setVisitedSteps(new Set())
    setIsPlaying(false)
  }, [workflow.id])

  // Track visited steps
  useEffect(() => {
    setVisitedSteps((prev) => {
      if (prev.has(currentStepIndex)) return prev
      const next = new Set(prev)
      next.add(currentStepIndex)
      return next
    })
  }, [currentStepIndex])

  // Auto-play: navigate to block and advance
  useEffect(() => {
    if (!isPlaying) return
    if (currentStepIndex >= workflow.steps.length) {
      setIsPlaying(false)
      return
    }

    onViewOnCanvas(workflow.steps[currentStepIndex])

    playTimerRef.current = setTimeout(() => {
      if (currentStepIndex < workflow.steps.length - 1) {
        setCurrentStepIndex((i) => i + 1)
      } else {
        setIsPlaying(false)
      }
    }, 2500)

    return () => {
      if (playTimerRef.current) clearTimeout(playTimerRef.current)
    }
  }, [isPlaying, currentStepIndex, workflow.steps, onViewOnCanvas])

  const currentStep = workflow.steps[currentStepIndex]
  if (!currentStep) return null

  const colors = SPOTLIGHT_COLOR_MAP[currentStep.color]

  const handlePlayAll = () => {
    setCurrentStepIndex(0)
    setIsPlaying(true)
    onPlayAll(workflow.steps)
  }

  const handleStopPlay = () => {
    setIsPlaying(false)
    if (playTimerRef.current) clearTimeout(playTimerRef.current)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden bg-card border-border">
        {/* Header */}
        <DialogHeader className="px-5 pt-4 pb-3 border-b border-border">
          <div className="pr-10">
            <div className="flex items-center gap-2 mb-2">
              <GraduationCap size={16} className="text-purple-400" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded">
                Walkthrough
              </span>
            </div>
            <DialogTitle className="text-base text-card-foreground">
              {workflow.title}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              {workflow.steps.length} steps &middot; {getRelativeTime(workflow.createdAt)}
            </DialogDescription>
          </div>
        </DialogHeader>

        {/* Body */}
        <div className="flex min-h-[280px]">
          {/* Step list (left) */}
          <div className="w-[160px] shrink-0 border-r border-border overflow-y-auto py-2">
            {workflow.steps.map((step, idx) => {
              const isCurrent = idx === currentStepIndex
              const isVisited = visitedSteps.has(idx) && !isCurrent
              const stepColors = SPOTLIGHT_COLOR_MAP[step.color]

              return (
                <button
                  key={step.stepId}
                  onClick={() => {
                    setCurrentStepIndex(idx)
                    setIsPlaying(false)
                  }}
                  className={cn(
                    "flex items-center gap-2 w-[calc(100%-16px)] mx-2 px-3 py-2 rounded-md text-left transition-all text-xs",
                    isCurrent
                      ? "bg-purple-500/15 border border-purple-500/40"
                      : "border border-transparent hover:bg-accent"
                  )}
                >
                  {isVisited ? (
                    <Check size={12} className="shrink-0 text-green-400" />
                  ) : (
                    <span
                      className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                        isCurrent ? "bg-purple-500/30 text-purple-300" : "bg-accent text-muted-foreground"
                      )}
                    >
                      {idx + 1}
                    </span>
                  )}
                  <span
                    className={cn(
                      "truncate",
                      isCurrent ? "text-purple-300 font-medium" : "text-muted-foreground"
                    )}
                  >
                    {step.annotation || `Step ${idx + 1}`}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Step detail (right) */}
          <div className="flex-1 flex flex-col p-5">
            <div className="flex-1">
              {/* Step header */}
              <div className="flex items-center gap-2 mb-3">
                <span
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
                    colors.bg,
                    colors.text
                  )}
                >
                  {currentStepIndex + 1}
                </span>
                <span className={cn("text-sm font-semibold", colors.text)}>
                  {currentStep.annotation}
                </span>
              </div>

              {/* Block ID reference */}
              <div className="rounded-md bg-accent p-3 mb-3">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground">Block:</span>
                  <code className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono text-purple-300">
                    {currentStep.blockId}
                  </code>
                </div>
              </div>

              {/* View on canvas button */}
              <button
                onClick={() => onViewOnCanvas(currentStep)}
                className="inline-flex items-center gap-1.5 rounded-md bg-purple-500/15 px-3 py-1.5 text-xs font-medium text-purple-300 hover:bg-purple-500/25 transition-colors"
              >
                <Eye size={12} />
                View on Canvas
              </button>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between pt-4 border-t border-border mt-4">
              <button
                onClick={() => {
                  setCurrentStepIndex((i) => Math.max(0, i - 1))
                  setIsPlaying(false)
                }}
                disabled={currentStepIndex === 0}
                className="inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={14} />
                Back
              </button>

              <button
                onClick={isPlaying ? handleStopPlay : handlePlayAll}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  isPlaying
                    ? "bg-red-500/15 text-red-300 hover:bg-red-500/25"
                    : "bg-purple-500/15 text-purple-300 hover:bg-purple-500/25"
                )}
              >
                <Play size={12} />
                {isPlaying ? "Stop" : "Play All"}
              </button>

              <button
                onClick={() => {
                  setCurrentStepIndex((i) => Math.min(workflow.steps.length - 1, i + 1))
                  setIsPlaying(false)
                }}
                disabled={currentStepIndex === workflow.steps.length - 1}
                className="inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Next
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
