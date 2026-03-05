"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { CheckCircle2, Circle, ArrowRight, X, Sparkles, Rocket } from "lucide-react"
import { resolveChecklistUrl } from "@/lib/onboarding/checklist"

interface ChecklistItem {
  key: string
  title: string
  description: string
  completed: boolean
  completedAt: string | null
  url: string
}

interface OnboardingChecklistProps {
  subdomainId: number
  subdomainName?: string
}

export function OnboardingChecklist({ subdomainId, subdomainName }: OnboardingChecklistProps) {
  const router = useRouter()
  const [items, setItems] = useState<ChecklistItem[]>([])
  const [dismissed, setDismissed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchChecklist = useCallback(async () => {
    if (!subdomainId) return
    try {
      setLoading(true)
      const res = await fetch(`/api/dashboard/onboarding?subdomainId=${subdomainId}`)
      if (!res.ok) throw new Error("Failed to fetch checklist")
      const data = await res.json()
      const checklist = data.checklist
      if (checklist?.dismissed || checklist?.completedAt) {
        setDismissed(true)
        return
      }
      setItems(checklist?.items ?? [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load checklist")
    } finally {
      setLoading(false)
    }
  }, [subdomainId])

  useEffect(() => {
    fetchChecklist()
  }, [fetchChecklist])

  const handleComplete = useCallback(async (itemKey: string) => {
    try {
      const res = await fetch("/api/dashboard/onboarding", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subdomainId, action: "complete", itemKey }),
      })
      if (!res.ok) throw new Error("Failed to complete item")
      setItems(prev =>
        prev.map(item =>
          item.key === itemKey
            ? { ...item, completed: true, completedAt: new Date().toISOString() }
            : item
        )
      )
    } catch {
      // Silently fail — user can retry
    }
  }, [subdomainId])

  const handleDismiss = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/onboarding", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subdomainId, action: "dismiss" }),
      })
      if (!res.ok) throw new Error("Failed to dismiss")
      setDismissed(true)
    } catch {
      // Silently fail
    }
  }, [subdomainId])

  if (dismissed || loading || error || items.length === 0) return null

  const completedCount = items.filter(i => i.completed).length
  const totalCount = items.length
  const progressPercent = Math.round((completedCount / totalCount) * 100)
  const allComplete = completedCount === totalCount

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">
              {allComplete ? "Setup Complete!" : `Get started${subdomainName ? ` with ${subdomainName}` : ""}`}
            </CardTitle>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Dismiss</span>
          </Button>
        </div>
        <div className="flex items-center gap-3 mt-2">
          <Progress value={progressPercent} className="flex-1 h-2" />
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {completedCount}/{totalCount} done
          </span>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {allComplete ? (
          <div className="text-center py-4">
            <Sparkles className="h-10 w-10 text-yellow-500 mx-auto mb-2" />
            <p className="text-base font-medium">
              Congratulations! You have completed all setup steps.
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Your site is ready to go. You can dismiss this checklist.
            </p>
          </div>
        ) : (
          <ul className="space-y-1">
            {items.map(item => (
              <li
                key={item.key}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/50 group"
              >
                <button
                  type="button"
                  onClick={() => !item.completed && handleComplete(item.key)}
                  className="shrink-0"
                  disabled={item.completed}
                >
                  {item.completed ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium leading-tight ${item.completed ? "line-through text-muted-foreground" : ""}`}>
                    {item.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {item.description}
                  </p>
                </div>
                {!item.completed && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => router.push(resolveChecklistUrl(item.url, subdomainName))}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
