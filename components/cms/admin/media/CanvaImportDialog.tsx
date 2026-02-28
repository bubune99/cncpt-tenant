"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../ui/dialog"
import { Button } from "../../ui/button"
import { Label } from "../../ui/label"
import { Input } from "../../ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select"
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import type { CanvaDesign, CanvaExportFormat } from "@/lib/cms/canva/types"
import type { FolderWithRelations } from "@/lib/cms/media/types"

interface CanvaImportDialogProps {
  design: CanvaDesign | null
  open: boolean
  folders: FolderWithRelations[]
  onClose: () => void
  onImportComplete: () => void
}

type ImportStatus = "idle" | "exporting" | "downloading" | "uploading" | "success" | "error"

export function CanvaImportDialog({
  design,
  open,
  folders,
  onClose,
  onImportComplete,
}: CanvaImportDialogProps) {
  const [format, setFormat] = useState<CanvaExportFormat>("png")
  const [width, setWidth] = useState("")
  const [height, setHeight] = useState("")
  const [quality, setQuality] = useState("80")
  const [folderId, setFolderId] = useState<string>("")
  const [status, setStatus] = useState<ImportStatus>("idle")
  const [error, setError] = useState("")
  const [importedMedia, setImportedMedia] = useState<{
    id: string
    filename: string
    url: string
  } | null>(null)

  async function handleImport() {
    if (!design) return

    setStatus("exporting")
    setError("")

    try {
      const body: Record<string, unknown> = {
        designId: design.id,
        format,
        title: design.title,
      }

      if (width) body.width = parseInt(width, 10)
      if (height) body.height = parseInt(height, 10)
      if (format === "jpg" && quality) body.quality = parseInt(quality, 10)
      if (format === "png") body.lossless = true
      if (folderId) body.folderId = folderId

      setStatus("downloading")

      const response = await fetch("/api/canva/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Import failed")
      }

      const data = await response.json()
      setImportedMedia(data.media)
      setStatus("success")
      onImportComplete()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed")
      setStatus("error")
    }
  }

  function handleClose() {
    setStatus("idle")
    setError("")
    setImportedMedia(null)
    onClose()
  }

  const isProcessing = status === "exporting" || status === "downloading" || status === "uploading"

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {status === "success"
              ? "Import Complete"
              : `Import: ${design?.title || "Canva Design"}`}
          </DialogTitle>
        </DialogHeader>

        {status === "success" && importedMedia ? (
          <div className="py-6 text-center space-y-3">
            <CheckCircle2 className="h-12 w-12 mx-auto text-green-500" />
            <p className="font-medium">{importedMedia.filename}</p>
            <p className="text-sm text-muted-foreground">
              Successfully imported to media library
            </p>
          </div>
        ) : status === "error" ? (
          <div className="py-6 text-center space-y-3">
            <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        ) : isProcessing ? (
          <div className="py-8 text-center space-y-3">
            <Loader2 className="h-10 w-10 mx-auto animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              {status === "exporting"
                ? "Creating export from Canva..."
                : status === "downloading"
                  ? "Downloading and uploading to storage..."
                  : "Uploading to media library..."}
            </p>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {/* Format */}
            <div className="space-y-2">
              <Label>Export Format</Label>
              <Select
                value={format}
                onValueChange={(v) => setFormat(v as CanvaExportFormat)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="png">PNG (Lossless)</SelectItem>
                  <SelectItem value="jpg">JPG</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="gif">GIF</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Dimensions */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Width (px)</Label>
                <Input
                  type="number"
                  placeholder="Original"
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                  min={40}
                  max={25000}
                />
              </div>
              <div className="space-y-2">
                <Label>Height (px)</Label>
                <Input
                  type="number"
                  placeholder="Original"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  min={40}
                  max={25000}
                />
              </div>
            </div>

            {/* JPG Quality */}
            {format === "jpg" && (
              <div className="space-y-2">
                <Label>Quality (1-100)</Label>
                <Input
                  type="number"
                  value={quality}
                  onChange={(e) => setQuality(e.target.value)}
                  min={1}
                  max={100}
                />
              </div>
            )}

            {/* Destination Folder */}
            {folders.length > 0 && (
              <div className="space-y-2">
                <Label>Destination Folder</Label>
                <Select value={folderId} onValueChange={setFolderId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Root (no folder)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Root (no folder)</SelectItem>
                    {folders.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {"  ".repeat(f.depth)}
                        {f.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {status === "success" || status === "error" ? (
            <Button onClick={handleClose}>
              {status === "success" ? "Done" : "Close"}
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button onClick={handleImport} disabled={isProcessing}>
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Import
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
