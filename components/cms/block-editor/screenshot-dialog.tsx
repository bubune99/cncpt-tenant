"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/cms/ui/dialog"
import { Button } from "@/components/cms/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/cms/ui/tabs"
import {
  Download,
  Copy,
  Check,
  Bookmark,
  GitCompareArrows,
  Loader2,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react"
import {
  downloadScreenshot,
  copyScreenshotToClipboard,
  saveScreenshotToServer,
  type DiffResult,
} from "@/lib/cms/block-editor/screenshot"
import { toast } from "sonner"

interface ScreenshotDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The captured screenshot data URL */
  screenshot: string | null
  /** The current page title (for filenames) */
  pageTitle: string
  /** The current page slug (for server storage) */
  pageSlug: string
  /** Visual diff result (when in compare mode) */
  diffResult?: DiffResult | null
  /** The baseline image (for compare mode) */
  baseline?: string | null
  /** Callback to save current screenshot as baseline */
  onSaveBaseline?: (dataUrl: string) => void
}

export function ScreenshotDialog({
  open,
  onOpenChange,
  screenshot,
  pageTitle,
  pageSlug,
  diffResult,
  baseline,
  onSaveBaseline,
}: ScreenshotDialogProps) {
  const [copied, setCopied] = useState(false)
  const [saving, setSaving] = useState(false)
  const hasCompare = !!diffResult && !!baseline

  const handleDownload = () => {
    if (!screenshot) return
    const timestamp = new Date().toISOString().slice(0, 10)
    const filename = `${pageTitle.replace(/\s+/g, "-").toLowerCase()}-${timestamp}.png`
    downloadScreenshot(screenshot, filename)
    toast.success("Screenshot downloaded")
  }

  const handleCopy = async () => {
    if (!screenshot) return
    try {
      await copyScreenshotToClipboard(screenshot)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast.success("Copied to clipboard")
    } catch {
      toast.error("Failed to copy — try downloading instead")
    }
  }

  const handleSaveBaseline = () => {
    if (!screenshot || !onSaveBaseline) return
    onSaveBaseline(screenshot)
    toast.success("Saved as baseline for future comparisons")
  }

  const handleSaveToServer = async () => {
    if (!screenshot) return
    setSaving(true)
    try {
      await saveScreenshotToServer(screenshot, pageSlug, "current")
      if (baseline) {
        await saveScreenshotToServer(baseline, pageSlug, "baseline")
      }
      toast.success("Screenshots saved to server")
    } catch {
      toast.error("Failed to save to server")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-4xl max-h-[90vh] flex flex-col"
        style={{ backgroundColor: "var(--card)", color: "var(--card-foreground)" }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {hasCompare ? "Visual Comparison" : "Page Screenshot"}
            {diffResult && (
              <span
                className={`ml-2 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  diffResult.failed
                    ? "bg-red-500/10 text-red-400"
                    : "bg-green-500/10 text-green-400"
                }`}
              >
                {diffResult.failed ? (
                  <AlertTriangle size={12} />
                ) : (
                  <CheckCircle2 size={12} />
                )}
                {diffResult.diffPercent}% changed
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        {hasCompare ? (
          <Tabs defaultValue="side-by-side" className="flex-1 flex flex-col min-h-0">
            <TabsList className="w-full justify-start" style={{ backgroundColor: "var(--accent)" }}>
              <TabsTrigger value="side-by-side" className="gap-1.5 text-xs">
                <GitCompareArrows size={14} /> Side by Side
              </TabsTrigger>
              <TabsTrigger value="diff" className="gap-1.5 text-xs">
                Diff Overlay
              </TabsTrigger>
              <TabsTrigger value="current" className="gap-1.5 text-xs">
                Current
              </TabsTrigger>
              <TabsTrigger value="baseline" className="gap-1.5 text-xs">
                Baseline
              </TabsTrigger>
            </TabsList>

            <TabsContent value="side-by-side" className="flex-1 overflow-auto mt-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wider">Baseline</p>
                  <div className="rounded-md border border-border overflow-hidden">
                    {baseline && (
                      <img src={baseline} alt="Baseline" className="w-full" />
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wider">Current</p>
                  <div className="rounded-md border border-border overflow-hidden">
                    {screenshot && (
                      <img src={screenshot} alt="Current" className="w-full" />
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="diff" className="flex-1 overflow-auto mt-2">
              <div className="rounded-md border border-border overflow-hidden">
                {diffResult?.diffDataUrl && (
                  <img
                    src={diffResult.diffDataUrl}
                    alt="Diff overlay"
                    className="w-full"
                    style={{ imageRendering: "pixelated" }}
                  />
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Red pixels indicate differences. {diffResult?.diffPixels.toLocaleString()} of{" "}
                {diffResult?.totalPixels.toLocaleString()} pixels changed.
              </p>
            </TabsContent>

            <TabsContent value="current" className="flex-1 overflow-auto mt-2">
              <div className="rounded-md border border-border overflow-hidden">
                {screenshot && <img src={screenshot} alt="Current" className="w-full" />}
              </div>
            </TabsContent>

            <TabsContent value="baseline" className="flex-1 overflow-auto mt-2">
              <div className="rounded-md border border-border overflow-hidden">
                {baseline && <img src={baseline} alt="Baseline" className="w-full" />}
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="flex-1 overflow-auto">
            <div className="rounded-md border border-border overflow-hidden">
              {screenshot && (
                <img src={screenshot} alt="Page screenshot" className="w-full" />
              )}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleDownload} className="gap-1.5">
              <Download size={14} /> Download PNG
            </Button>
            <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5">
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? "Copied" : "Copy"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveToServer}
              disabled={saving}
              className="gap-1.5"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              Save to Disk
            </Button>
          </div>
          <div className="flex items-center gap-2">
            {onSaveBaseline && screenshot && (
              <Button
                variant={hasCompare ? "outline" : "default"}
                size="sm"
                onClick={handleSaveBaseline}
                className="gap-1.5"
              >
                <Bookmark size={14} />
                {hasCompare ? "Update Baseline" : "Save as Baseline"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
