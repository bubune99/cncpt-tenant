"use client"

/**
 * Page version history dialog.
 *
 * Lists the last 20 saved versions of a page (metadata only) and lets the user
 * restore one. Restore snapshots the current content first (server-side) so it
 * is reversible. Uses the builder's existing shadcn primitives.
 */

import { useCallback, useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/cms/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/cms/ui/alert-dialog"
import { Button } from "@/components/cms/ui/button"
import { Loader2, History, RotateCcw } from "lucide-react"
import { toast } from "sonner"

interface PageVersion {
  readonly id: string
  readonly title: string
  readonly status: string
  readonly createdBy: string | null
  readonly createdAt: string
}

interface PageHistoryDialogProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly pageId: string
  /** Called after a successful restore so the editor can reload the page. */
  readonly onRestored: () => void
}

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime()
  if (!Number.isFinite(then)) return ""
  const diff = Date.now() - then
  const mins = Math.round(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins} min${mins === 1 ? "" : "s"} ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`
  const days = Math.round(hrs / 24)
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`
  return new Date(iso).toLocaleDateString()
}

export function PageHistoryDialog({ open, onOpenChange, pageId, onRestored }: PageHistoryDialogProps) {
  const [versions, setVersions] = useState<PageVersion[]>([])
  const [loading, setLoading] = useState(false)
  const [restoreTarget, setRestoreTarget] = useState<PageVersion | null>(null)
  const [restoring, setRestoring] = useState(false)

  const fetchVersions = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/cms/admin/pages/${pageId}/versions`)
      if (!res.ok) throw new Error("Failed to load versions")
      const data = (await res.json()) as { versions?: PageVersion[] }
      setVersions(data.versions ?? [])
    } catch {
      toast.error("Couldn't load version history")
    } finally {
      setLoading(false)
    }
  }, [pageId])

  useEffect(() => {
    if (open) void fetchVersions()
  }, [open, fetchVersions])

  const handleRestore = useCallback(async () => {
    if (!restoreTarget) return
    setRestoring(true)
    try {
      const res = await fetch(
        `/api/cms/admin/pages/${pageId}/versions/${restoreTarget.id}/restore`,
        { method: "POST" }
      )
      if (!res.ok) throw new Error("Failed to restore")
      toast.success("Version restored")
      setRestoreTarget(null)
      onOpenChange(false)
      onRestored()
    } catch {
      toast.error("Couldn't restore this version")
    } finally {
      setRestoring(false)
    }
  }, [restoreTarget, pageId, onOpenChange, onRestored])

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History size={16} />
              Version history
            </DialogTitle>
            <DialogDescription>
              The last {versions.length || 20} content snapshots for this page. Restoring saves
              the current content first, so you can always go back.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[50vh] overflow-y-auto -mx-1 px-1">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
                <Loader2 size={16} className="animate-spin" />
                Loading…
              </div>
            ) : versions.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                No saved versions yet. Versions are captured automatically as you edit.
              </div>
            ) : (
              <ul className="divide-y" style={{ borderColor: "var(--border)" }}>
                {versions.map((v) => (
                  <li key={v.id} className="flex items-center gap-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-foreground">{v.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {relativeTime(v.createdAt)}
                        {v.createdBy ? ` · ${v.createdBy}` : ""}
                        {` · ${v.status}`}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 shrink-0"
                      onClick={() => setRestoreTarget(v)}
                    >
                      <RotateCcw size={13} />
                      Restore
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!restoreTarget} onOpenChange={(o) => !o && setRestoreTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore this version?</AlertDialogTitle>
            <AlertDialogDescription>
              This replaces the current page content with the snapshot from{" "}
              {restoreTarget ? relativeTime(restoreTarget.createdAt) : ""}. Your current content is
              saved as a new version first, so this can be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={restoring}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); void handleRestore() }} disabled={restoring}>
              {restoring ? (
                <>
                  <Loader2 size={14} className="mr-2 animate-spin" />
                  Restoring…
                </>
              ) : (
                "Restore"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
