"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/cms/ui/dialog"
import { Button } from "@/components/cms/ui/button"
import { Input } from "@/components/cms/ui/input"
import { Label } from "@/components/cms/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/cms/ui/select"
import { Trash2, ImageIcon, ExternalLink } from "lucide-react"
import type { BlockBackground } from "@/lib/cms/block-editor/types"
import { cn } from "@/lib/cms/utils"

const OVERLAY_PRESETS = [
  { label: "None", value: "" },
  { label: "Dark Gradient", value: "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.7) 100%)" },
  { label: "Dark Overlay", value: "rgba(0,0,0,0.5)" },
  { label: "Light Overlay", value: "rgba(255,255,255,0.3)" },
  { label: "Blue Wash", value: "rgba(59,130,246,0.3)" },
  { label: "Dark Top", value: "linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 50%)" },
  { label: "Vignette", value: "radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.6) 100%)" },
]

interface BackgroundModalProps {
  /** Controlled mode - use open/onOpenChange together */
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /** Trigger mode - renders a button that opens the modal */
  trigger?: React.ReactNode
  background?: BlockBackground
  onChange: (bg: BlockBackground | undefined) => void
}

export function BackgroundModal({
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  trigger,
  background,
  onChange,
}: BackgroundModalProps) {
  // Internal state for uncontrolled (trigger) mode
  const [internalOpen, setInternalOpen] = useState(false)
  
  // Determine if controlled or uncontrolled
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen
  const onOpenChange = isControlled ? controlledOnOpenChange! : setInternalOpen
  // Local state for editing
  const [url, setUrl] = useState(background?.url || "")
  const [size, setSize] = useState<BlockBackground["size"]>(background?.size || "cover")
  const [position, setPosition] = useState<BlockBackground["position"]>(background?.position || "center")
  const [attachment, setAttachment] = useState<BlockBackground["attachment"]>(background?.attachment || "scroll")
  const [overlay, setOverlay] = useState(background?.overlay || "")
  const [customOverlay, setCustomOverlay] = useState("")
  
  // Sync local state when modal opens
  useEffect(() => {
    if (open) {
      setUrl(background?.url || "")
      setSize(background?.size || "cover")
      setPosition(background?.position || "center")
      setAttachment(background?.attachment || "scroll")
      setOverlay(background?.overlay || "")
      
      // Check if overlay matches a preset
      const isPreset = OVERLAY_PRESETS.some(p => p.value === (background?.overlay || ""))
      if (!isPreset && background?.overlay) {
        setCustomOverlay(background.overlay)
      } else {
        setCustomOverlay("")
      }
    }
  }, [open, background])
  
  const handleSave = () => {
    if (!url.trim()) {
      onChange(undefined)
    } else {
      onChange({
        url: url.trim(),
        size,
        position,
        attachment,
        overlay: overlay || undefined,
      })
    }
    onOpenChange(false)
  }
  
  const handleRemove = () => {
    onChange(undefined)
    onOpenChange(false)
  }
  
  const handleOverlayPreset = (value: string) => {
    setOverlay(value)
    setCustomOverlay("")
  }
  
  const handleCustomOverlay = (value: string) => {
    setCustomOverlay(value)
    setOverlay(value)
  }
  
  // Preview style
  const previewStyle: React.CSSProperties = url ? {
    backgroundImage: `url('${url}')`,
    backgroundSize: size || "cover",
    backgroundPosition: position || "center",
    backgroundRepeat: "no-repeat",
  } : {}
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon size={18} />
            Background Image
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-6">
          {/* Preview */}
          <div className="flex flex-col gap-2">
            <Label className="text-xs font-medium text-muted-foreground">Preview</Label>
            <div
              className={cn(
                "relative h-48 rounded-lg border border-border overflow-hidden",
                !url && "flex items-center justify-center bg-muted"
              )}
              style={previewStyle}
            >
              {/* Overlay preview */}
              {url && overlay && (
                <div
                  className="absolute inset-0 z-10"
                  style={{ background: overlay }}
                />
              )}
              
              {!url && (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <ImageIcon size={32} className="opacity-40" />
                  <span className="text-xs">No image</span>
                </div>
              )}
              
              {url && (
                <div className="absolute bottom-2 left-2 z-20 rounded bg-black/60 px-2 py-1 text-[10px] text-white">
                  {size} / {position}
                </div>
              )}
            </div>
          </div>
          
          {/* Settings */}
          <div className="flex flex-col gap-4">
            {/* Image URL */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Image URL</Label>
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://... or /images/..."
                className="h-9 text-sm"
              />
              <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                <ExternalLink size={10} />
                Use Unsplash, upload to /public, or paste any URL
              </p>
            </div>
            
            {/* Size & Position */}
            {url && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">Size</Label>
                    <Select value={size} onValueChange={(v) => setSize(v as BlockBackground["size"])}>
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cover">Cover</SelectItem>
                        <SelectItem value="contain">Contain</SelectItem>
                        <SelectItem value="auto">Auto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">Position</Label>
                    <Select value={position} onValueChange={(v) => setPosition(v as BlockBackground["position"])}>
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="center">Center</SelectItem>
                        <SelectItem value="top">Top</SelectItem>
                        <SelectItem value="bottom">Bottom</SelectItem>
                        <SelectItem value="left">Left</SelectItem>
                        <SelectItem value="right">Right</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {/* Scroll behavior */}
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Scroll Behavior</Label>
                  <div className="flex gap-2">
                    <Button
                      variant={attachment === "scroll" ? "secondary" : "outline"}
                      size="sm"
                      onClick={() => setAttachment("scroll")}
                      className="flex-1 h-8 text-xs"
                    >
                      Scroll
                    </Button>
                    <Button
                      variant={attachment === "fixed" ? "secondary" : "outline"}
                      size="sm"
                      onClick={() => setAttachment("fixed")}
                      className="flex-1 h-8 text-xs"
                    >
                      Fixed (Parallax)
                    </Button>
                  </div>
                </div>
                
                {/* Overlay */}
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Overlay</Label>
                  <Select
                    value={OVERLAY_PRESETS.some(p => p.value === overlay) ? overlay : "custom"}
                    onValueChange={(v) => {
                      if (v === "custom") return
                      handleOverlayPreset(v)
                    }}
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Select overlay..." />
                    </SelectTrigger>
                    <SelectContent>
                      {OVERLAY_PRESETS.map((preset) => (
                        <SelectItem key={preset.value || "none"} value={preset.value || "none"}>
                          {preset.label}
                        </SelectItem>
                      ))}
                      <SelectItem value="custom">Custom...</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {(!OVERLAY_PRESETS.some(p => p.value === overlay) || customOverlay) && (
                    <Input
                      value={customOverlay}
                      onChange={(e) => handleCustomOverlay(e.target.value)}
                      placeholder="rgba(0,0,0,0.5) or linear-gradient(...)"
                      className="h-8 text-xs font-mono"
                    />
                  )}
                </div>
              </>
            )}
          </div>
        </div>
        
        <DialogFooter className="flex items-center justify-between">
          <div>
            {background?.url && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 size={14} className="mr-1" />
                Remove Background
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {url ? "Apply" : "Clear"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
