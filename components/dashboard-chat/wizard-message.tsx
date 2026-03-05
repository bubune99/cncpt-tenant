"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Check,
  ChevronRight,
  BookmarkPlus,
  Loader2,
  Sparkles,
} from "lucide-react"

interface WizardStep {
  number: number
  title: string
  content: string
  actionLabel?: string
  actionUrl?: string
}

interface WizardData {
  title: string
  description?: string
  steps: WizardStep[]
  category?: string
  totalSteps: number
}

interface WizardMessageProps {
  wizard: WizardData
  onSaveAsTour?: (wizard: WizardData) => void
}

export function WizardMessage({ wizard, onSaveAsTour }: WizardMessageProps) {
  const router = useRouter()
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())
  const [saving, setSaving] = useState(false)

  const toggleStep = useCallback((stepNumber: number) => {
    setCompletedSteps((prev) => {
      const next = new Set(prev)
      if (next.has(stepNumber)) {
        next.delete(stepNumber)
      } else {
        next.add(stepNumber)
      }
      return next
    })
  }, [])

  const handleAction = useCallback(
    (url: string) => {
      router.push(url)
    },
    [router]
  )

  const handleSave = useCallback(async () => {
    if (!onSaveAsTour) return
    setSaving(true)
    try {
      onSaveAsTour(wizard)
    } finally {
      setSaving(false)
    }
  }, [wizard, onSaveAsTour])

  const allComplete = completedSteps.size === wizard.steps.length

  return (
    <div className="mt-2 rounded-xl border border-border/50 bg-card overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-primary/10 to-primary/5 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h4 className="text-sm font-semibold">{wizard.title}</h4>
        </div>
        {wizard.description && (
          <p className="text-xs text-muted-foreground mt-1">
            {wizard.description}
          </p>
        )}
      </div>

      {/* Steps */}
      <div className="divide-y divide-border/30">
        {wizard.steps.map((step) => {
          const isComplete = completedSteps.has(step.number)

          return (
            <div
              key={step.number}
              className="px-4 py-3 flex gap-3 group hover:bg-muted/30 transition-colors"
            >
              {/* Step number / check */}
              <button
                onClick={() => toggleStep(step.number)}
                className="shrink-0 mt-0.5"
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                    isComplete
                      ? "bg-green-500/20 text-green-500 ring-1 ring-green-500/30"
                      : "bg-primary/10 text-primary ring-1 ring-primary/20"
                  }`}
                >
                  {isComplete ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    step.number
                  )}
                </div>
              </button>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-medium ${isComplete ? "line-through text-muted-foreground" : ""}`}
                >
                  {step.title}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 whitespace-pre-wrap">
                  {step.content}
                </p>
                {step.actionUrl && !isComplete && (
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 mt-1 text-xs"
                    onClick={() => handleAction(step.actionUrl!)}
                  >
                    {step.actionLabel || "Go there"}
                    <ChevronRight className="h-3 w-3 ml-0.5" />
                  </Button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 bg-muted/30 border-t border-border/50 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {completedSteps.size}/{wizard.steps.length} steps
          {allComplete && " — All done!"}
        </span>
        {onSaveAsTour && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <BookmarkPlus className="h-3 w-3" />
            )}
            Save as Tour
          </Button>
        )}
      </div>
    </div>
  )
}
