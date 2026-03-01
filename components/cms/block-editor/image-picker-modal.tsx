"use client"

import { useState, useCallback, useMemo, useEffect } from "react"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/cms/ui/tabs"
import { ScrollArea } from "@/components/cms/ui/scroll-area"
import { Textarea } from "@/components/cms/ui/textarea"
import {
  ImageIcon,
  Upload,
  Link2,
  Check,
  Trash2,
  X,
  Sparkles,
  Loader2,
  AlertCircle,
} from "lucide-react"
import { cn } from "@/lib/cms/utils"
import {
  getUploadedImages,
  saveUploadedImage,
  deleteUploadedImage,
  generateId,
  type UploadedImage
} from "@/lib/cms/block-editor/storage"

// Stock images from picsum/unsplash for gallery
const STOCK_IMAGES = [
  // Nature
  { url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800", category: "nature" },
  { url: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800", category: "nature" },
  { url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800", category: "nature" },
  { url: "https://images.unsplash.com/photo-1518173946687-a4c036bc5ce4?w=800", category: "nature" },
  // Architecture
  { url: "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800", category: "architecture" },
  { url: "https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=800", category: "architecture" },
  { url: "https://images.unsplash.com/photo-1448630360428-65456885c650?w=800", category: "architecture" },
  // Abstract
  { url: "https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=800", category: "abstract" },
  { url: "https://images.unsplash.com/photo-1550684376-efcbd6e3f031?w=800", category: "abstract" },
  { url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800", category: "abstract" },
  // Technology
  { url: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800", category: "technology" },
  { url: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800", category: "technology" },
  { url: "https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=800", category: "technology" },
  // Textures
  { url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800", category: "textures" },
  { url: "https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?w=800", category: "textures" },
  { url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800", category: "textures" },
  // People
  { url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800", category: "people" },
  { url: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800", category: "people" },
  // Business
  { url: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800", category: "business" },
  { url: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800", category: "business" },
  // Food
  { url: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800", category: "food" },
  { url: "https://images.unsplash.com/photo-1493770348161-369560ae357d?w=800", category: "food" },
  // Travel
  { url: "https://images.unsplash.com/photo-1488085061387-422e29b40080?w=800", category: "travel" },
  { url: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800", category: "travel" },
]

const CATEGORIES = ["all", "nature", "architecture", "abstract", "technology", "textures", "business", "food", "travel"]

// AI Image generation styles and sizes
const AI_STYLES = [
  { value: "", label: "Auto" },
  { value: "photorealistic", label: "Photorealistic" },
  { value: "illustration", label: "Illustration" },
  { value: "3d-render", label: "3D Render" },
  { value: "flat-design", label: "Flat Design" },
  { value: "watercolor", label: "Watercolor" },
  { value: "oil-painting", label: "Oil Painting" },
  { value: "pixel-art", label: "Pixel Art" },
  { value: "anime", label: "Anime" },
  { value: "sketch", label: "Sketch" },
  { value: "cinematic", label: "Cinematic" },
]

const AI_SIZES = [
  { value: "square", label: "Square", dimensions: "1024x1024" },
  { value: "landscape", label: "Landscape", dimensions: "1792x1024" },
  { value: "portrait", label: "Portrait", dimensions: "1024x1792" },
]

interface GeneratedImageResult {
  id: string
  url: string
  revisedPrompt?: string
}

interface ImagePickerModalProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  trigger?: React.ReactNode
  onSelect: (url: string) => void
  currentUrl?: string
}

export function ImagePickerModal({
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  trigger,
  onSelect,
  currentUrl,
}: ImagePickerModalProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen
  const onOpenChange = isControlled ? controlledOnOpenChange! : setInternalOpen

  const [selectedUrl, setSelectedUrl] = useState(currentUrl || "")
  const [urlInput, setUrlInput] = useState("")
  const [category, setCategory] = useState("all")
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([])
  const [isDragging, setIsDragging] = useState(false)

  // AI Generate state
  const [aiPrompt, setAiPrompt] = useState("")
  const [aiStyle, setAiStyle] = useState("")
  const [aiSize, setAiSize] = useState("square")
  const [aiGenerating, setAiGenerating] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [aiResults, setAiResults] = useState<GeneratedImageResult[]>([])
  const [aiAvailable, setAiAvailable] = useState<boolean | null>(null)

  // Check AI availability when modal opens
  useEffect(() => {
    if (open && aiAvailable === null) {
      fetch("/api/cms/media/generate")
        .then((res) => res.json())
        .then((data) => setAiAvailable(data.available))
        .catch(() => setAiAvailable(false))
    }
  }, [open, aiAvailable])

  // Load uploaded images when modal opens
  const handleOpenChange = useCallback((newOpen: boolean) => {
    onOpenChange(newOpen)
    if (newOpen) {
      setUploadedImages(getUploadedImages())
      setSelectedUrl(currentUrl || "")
      setAiError(null)
    }
  }, [onOpenChange, currentUrl])

  // Filter stock images by category
  const filteredStockImages = useMemo(() => {
    if (category === "all") return STOCK_IMAGES
    return STOCK_IMAGES.filter((img) => img.category === category)
  }, [category])

  // Handle file upload
  const handleFileUpload = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) return

      const reader = new FileReader()
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string
        const uploadedImage: UploadedImage = {
          id: generateId(),
          url: dataUrl,
          name: file.name,
          createdAt: new Date().toISOString(),
        }
        saveUploadedImage(uploadedImage)
        setUploadedImages(getUploadedImages())
        setSelectedUrl(dataUrl)
      }
      reader.readAsDataURL(file)
    })
  }, [])

  // Handle drag and drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFileUpload(e.dataTransfer.files)
  }, [handleFileUpload])

  // Handle delete uploaded image
  const handleDeleteUploaded = useCallback((id: string) => {
    deleteUploadedImage(id)
    setUploadedImages(getUploadedImages())
  }, [])

  // Handle AI image generation
  const handleAiGenerate = useCallback(async () => {
    if (!aiPrompt.trim()) return

    setAiGenerating(true)
    setAiError(null)

    try {
      const response = await fetch("/api/cms/media/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: aiPrompt.trim(),
          style: aiStyle || undefined,
          size: aiSize,
          count: 1,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate image")
      }

      if (data.images && data.images.length > 0) {
        setAiResults((prev) => [...data.images, ...prev])
        // Auto-select the first generated image
        setSelectedUrl(data.images[0].url)
      }
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "Failed to generate image")
    } finally {
      setAiGenerating(false)
    }
  }, [aiPrompt, aiStyle, aiSize])

  // Handle select
  const handleSelect = useCallback(() => {
    if (selectedUrl) {
      onSelect(selectedUrl)
      onOpenChange(false)
    }
  }, [selectedUrl, onSelect, onOpenChange])

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon size={18} />
            Select Image
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="gallery" className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="gallery">Gallery</TabsTrigger>
            <TabsTrigger value="ai-generate" className="flex items-center gap-1.5">
              <Sparkles size={13} />
              AI Generate
            </TabsTrigger>
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger value="url">URL</TabsTrigger>
          </TabsList>

          {/* Gallery Tab */}
          <TabsContent value="gallery" className="flex-1 flex flex-col min-h-0 mt-4">
            {/* Category filter */}
            <div className="flex gap-1 mb-3 flex-wrap">
              {CATEGORIES.map((cat) => (
                <Button
                  key={cat}
                  variant={category === cat ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setCategory(cat)}
                  className="h-7 text-xs capitalize"
                >
                  {cat}
                </Button>
              ))}
            </div>

            <ScrollArea className="flex-1">
              <div className="grid grid-cols-4 gap-2 pr-4">
                {/* Uploaded images first */}
                {uploadedImages.map((img) => (
                  <div key={img.id} className="relative group">
                    <button
                      onClick={() => setSelectedUrl(img.url)}
                      className={cn(
                        "aspect-video rounded-lg overflow-hidden border-2 transition-all",
                        selectedUrl === img.url
                          ? "border-primary ring-2 ring-primary/20"
                          : "border-transparent hover:border-primary/50"
                      )}
                    >
                      <img
                        src={img.url}
                        alt={img.name}
                        className="w-full h-full object-cover"
                      />
                      {selectedUrl === img.url && (
                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                          <Check className="w-6 h-6 text-primary" />
                        </div>
                      )}
                    </button>
                    <button
                      onClick={() => handleDeleteUploaded(img.id)}
                      className="absolute top-1 right-1 p-1 rounded bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={12} />
                    </button>
                    <span className="absolute bottom-1 left-1 right-1 text-[9px] text-white bg-black/50 px-1 rounded truncate">
                      {img.name}
                    </span>
                  </div>
                ))}

                {/* Stock images */}
                {filteredStockImages.map((img, i) => (
                  <button
                    key={img.url + i}
                    onClick={() => setSelectedUrl(img.url)}
                    className={cn(
                      "aspect-video rounded-lg overflow-hidden border-2 transition-all relative",
                      selectedUrl === img.url
                        ? "border-primary ring-2 ring-primary/20"
                        : "border-transparent hover:border-primary/50"
                    )}
                  >
                    <img
                      src={img.url}
                      alt={`Stock ${img.category}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    {selectedUrl === img.url && (
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                        <Check className="w-6 h-6 text-primary" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* AI Generate Tab */}
          <TabsContent value="ai-generate" className="flex-1 flex flex-col min-h-0 mt-4">
            {aiAvailable === false ? (
              <div className="flex flex-col items-center justify-center flex-1 text-center p-8">
                <AlertCircle className="w-10 h-10 text-muted-foreground mb-3" />
                <p className="text-sm font-medium mb-1">AI Image Generation Unavailable</p>
                <p className="text-xs text-muted-foreground">
                  Configure an AI provider (OPENAI_API_KEY, GOOGLE_GENERATIVE_AI_API_KEY, or Vercel AI Gateway) to enable image generation.
                </p>
              </div>
            ) : (
              <>
                {/* Prompt input */}
                <div className="space-y-3 mb-4">
                  <div>
                    <Label htmlFor="ai-prompt" className="text-xs font-medium mb-1.5 block">
                      Describe the image you want
                    </Label>
                    <Textarea
                      id="ai-prompt"
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder="A modern hero background with abstract geometric shapes in blue and purple gradients..."
                      className="min-h-[80px] resize-none text-sm"
                      maxLength={4000}
                    />
                    <span className="text-[10px] text-muted-foreground mt-1 block text-right">
                      {aiPrompt.length}/4000
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Style selector */}
                    <div>
                      <Label className="text-xs font-medium mb-1.5 block">Style</Label>
                      <div className="flex flex-wrap gap-1">
                        {AI_STYLES.map((s) => (
                          <Button
                            key={s.value}
                            type="button"
                            variant={aiStyle === s.value ? "secondary" : "ghost"}
                            size="sm"
                            onClick={() => setAiStyle(s.value)}
                            className="h-6 text-[11px] px-2"
                          >
                            {s.label}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Size selector */}
                    <div>
                      <Label className="text-xs font-medium mb-1.5 block">Size</Label>
                      <div className="flex gap-1">
                        {AI_SIZES.map((s) => (
                          <Button
                            key={s.value}
                            type="button"
                            variant={aiSize === s.value ? "secondary" : "ghost"}
                            size="sm"
                            onClick={() => setAiSize(s.value)}
                            className="h-6 text-[11px] px-2"
                          >
                            {s.label}
                            <span className="text-[9px] text-muted-foreground ml-1">
                              {s.dimensions}
                            </span>
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={handleAiGenerate}
                    disabled={!aiPrompt.trim() || aiGenerating}
                    className="w-full"
                  >
                    {aiGenerating ? (
                      <>
                        <Loader2 size={14} className="mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} className="mr-2" />
                        Generate Image
                      </>
                    )}
                  </Button>
                </div>

                {/* Error message */}
                {aiError && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 mb-3">
                    <AlertCircle size={14} className="text-destructive mt-0.5 shrink-0" />
                    <p className="text-xs text-destructive">{aiError}</p>
                  </div>
                )}

                {/* Loading state */}
                {aiGenerating && (
                  <div className="flex flex-col items-center justify-center py-8">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Sparkles className="w-8 h-8 text-primary animate-pulse" />
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-3">
                      Creating your image with AI...
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      This usually takes 10-30 seconds
                    </p>
                  </div>
                )}

                {/* Generated images */}
                {aiResults.length > 0 && !aiGenerating && (
                  <div>
                    <Label className="text-xs text-muted-foreground mb-2 block">
                      Generated Images ({aiResults.length})
                    </Label>
                    <ScrollArea className="flex-1">
                      <div className="grid grid-cols-3 gap-2 pr-4">
                        {aiResults.map((img) => (
                          <div key={img.id} className="relative group">
                            <button
                              onClick={() => setSelectedUrl(img.url)}
                              className={cn(
                                "aspect-square rounded-lg overflow-hidden border-2 transition-all w-full",
                                selectedUrl === img.url
                                  ? "border-primary ring-2 ring-primary/20"
                                  : "border-transparent hover:border-primary/50"
                              )}
                            >
                              <img
                                src={img.url}
                                alt={img.revisedPrompt || "AI generated image"}
                                className="w-full h-full object-cover"
                              />
                              {selectedUrl === img.url && (
                                <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                  <Check className="w-6 h-6 text-primary" />
                                </div>
                              )}
                            </button>
                            {img.revisedPrompt && (
                              <span className="absolute bottom-1 left-1 right-1 text-[9px] text-white bg-black/60 px-1.5 py-0.5 rounded truncate block">
                                {img.revisedPrompt.substring(0, 60)}...
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}

                {/* Empty state (no results yet, not loading) */}
                {aiResults.length === 0 && !aiGenerating && !aiError && (
                  <div className="flex flex-col items-center justify-center flex-1 text-center py-6">
                    <Sparkles className="w-8 h-8 text-muted-foreground/50 mb-2" />
                    <p className="text-xs text-muted-foreground">
                      Describe what you want and click Generate to create an AI image
                    </p>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* Upload Tab */}
          <TabsContent value="upload" className="flex-1 mt-4">
            <div
              onDragOver={(e) => {
                e.preventDefault()
                setIsDragging(true)
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={cn(
                "border-2 border-dashed rounded-lg p-12 text-center transition-colors",
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              )}
            >
              <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm font-medium mb-2">
                Drag and drop images here
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                or click to browse
              </p>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handleFileUpload(e.target.files)}
                className="hidden"
                id="image-upload"
              />
              <Button asChild variant="outline" size="sm">
                <label htmlFor="image-upload" className="cursor-pointer">
                  Choose Files
                </label>
              </Button>
            </div>

            {/* Uploaded images preview */}
            {uploadedImages.length > 0 && (
              <div className="mt-4">
                <Label className="text-xs text-muted-foreground mb-2 block">
                  Your Uploads ({uploadedImages.length})
                </Label>
                <div className="grid grid-cols-6 gap-2">
                  {uploadedImages.slice(0, 12).map((img) => (
                    <div key={img.id} className="relative group">
                      <button
                        onClick={() => setSelectedUrl(img.url)}
                        className={cn(
                          "aspect-square rounded overflow-hidden border-2 transition-all w-full",
                          selectedUrl === img.url
                            ? "border-primary"
                            : "border-transparent hover:border-primary/50"
                        )}
                      >
                        <img
                          src={img.url}
                          alt={img.name}
                          className="w-full h-full object-cover"
                        />
                      </button>
                      <button
                        onClick={() => handleDeleteUploaded(img.id)}
                        className="absolute -top-1 -right-1 p-0.5 rounded-full bg-destructive text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* URL Tab */}
          <TabsContent value="url" className="flex-1 mt-4">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="image-url">Image URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="image-url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="flex-1"
                  />
                  <Button
                    onClick={() => {
                      if (urlInput.trim()) {
                        setSelectedUrl(urlInput.trim())
                      }
                    }}
                    disabled={!urlInput.trim()}
                  >
                    <Link2 size={14} className="mr-1.5" />
                    Use URL
                  </Button>
                </div>
              </div>

              {/* URL Preview */}
              {selectedUrl && selectedUrl.startsWith("http") && (
                <div className="border rounded-lg p-4">
                  <Label className="text-xs text-muted-foreground mb-2 block">
                    Preview
                  </Label>
                  <div className="aspect-video rounded overflow-hidden bg-muted">
                    <img
                      src={selectedUrl}
                      alt="Preview"
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = ""
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-4">
          <div className="flex items-center gap-2 flex-1">
            {selectedUrl && (
              <span className="text-xs text-muted-foreground truncate flex-1">
                Selected: {selectedUrl.substring(0, 50)}...
              </span>
            )}
          </div>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSelect} disabled={!selectedUrl}>
            Select Image
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
