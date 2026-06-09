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
import {
  ImageIcon,
  Upload,
  Link2,
  Check,
  Trash2,
  X,
  Video,
  FolderOpen,
  Loader2,
  Film,
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

/** Media item from the /api/media endpoint */
interface MediaItem {
  id: string
  url: string
  filename: string
  originalName: string
  mimeType: string
  size: number
  width: number | null
  height: number | null
  title: string | null
  alt: string | null
  createdAt: string
}

function isVideoMime(mimeType: string): boolean {
  return mimeType.startsWith("video/")
}

function isVideoUrl(url: string): boolean {
  return /\.(mp4|webm|ogg|mov|avi|mkv)(\?|$)/i.test(url)
}

export type MediaPickerMode = "image" | "video" | "media"

interface ImagePickerModalProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  trigger?: React.ReactNode
  onSelect: (url: string) => void
  currentUrl?: string
  /** "image" = only images, "video" = only videos, "media" = both (default: "image") */
  mode?: MediaPickerMode
}

export function ImagePickerModal({
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  trigger,
  onSelect,
  currentUrl,
  mode = "image",
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

  // Media library state
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const [mediaLoading, setMediaLoading] = useState(false)
  const [mediaError, setMediaError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const isVideoMode = mode === "video"
  const isMediaMode = mode === "media"
  const acceptTypes = isVideoMode ? "video/*" : isMediaMode ? "image/*,video/*" : "image/*"
  const titleLabel = isVideoMode ? "Select Video" : isMediaMode ? "Select Media" : "Select Image"
  const TitleIcon = isVideoMode ? Video : ImageIcon

  // Fetch media from the API
  const fetchMediaLibrary = useCallback(async () => {
    setMediaLoading(true)
    setMediaError(null)
    try {
      const typeParam = isVideoMode ? "video" : isMediaMode ? "" : "image"
      const params = new URLSearchParams({ limit: "50", sortBy: "createdAt", sortOrder: "desc" })
      if (typeParam) params.set("type", typeParam)
      const res = await fetch(`/api/cms/media?${params}`)
      if (!res.ok) {
        const errBody = await res.text().catch(() => "")
        throw new Error(`Failed to load media library (${res.status}): ${errBody.slice(0, 200)}`)
      }
      const data = await res.json()
      setMediaItems(data.media || [])
    } catch (err) {
      setMediaError((err as Error).message)
    } finally {
      setMediaLoading(false)
    }
  }, [isVideoMode, isMediaMode])

  // Load uploaded images and media library when modal opens
  const handleOpenChange = useCallback((newOpen: boolean) => {
    onOpenChange(newOpen)
    if (newOpen) {
      setUploadedImages(getUploadedImages())
      setSelectedUrl(currentUrl || "")
      fetchMediaLibrary()
    }
  }, [onOpenChange, currentUrl, fetchMediaLibrary])

  // Filter stock images by category (only for image mode)
  const filteredStockImages = useMemo(() => {
    if (isVideoMode) return []
    if (category === "all") return STOCK_IMAGES
    return STOCK_IMAGES.filter((img) => img.category === category)
  }, [category, isVideoMode])

  // Handle file upload — uploads to /api/media if possible, falls back to localStorage
  const handleFileUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return

    for (const file of Array.from(files)) {
      const isVideo = file.type.startsWith("video/")
      const isImage = file.type.startsWith("image/")
      if (!isVideo && !isImage) continue
      if (isVideoMode && !isVideo) continue
      if (mode === "image" && !isImage) continue

      // Try uploading to the media API first
      setUploading(true)
      try {
        const formData = new FormData()
        formData.append("file", file)
        const res = await fetch("/api/cms/media", { method: "POST", body: formData })
        if (res.ok) {
          const media = await res.json()
          setSelectedUrl(media.url)
          // Refresh library
          fetchMediaLibrary()
          setUploading(false)
          continue
        }
      } catch {
        // API upload failed, fall back to local storage for images
      }
      setUploading(false)

      // Fallback: localStorage for images (videos are too large for localStorage)
      if (isImage) {
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
      }
    }
  }, [isVideoMode, mode, fetchMediaLibrary])

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
            <TitleIcon size={18} />
            {titleLabel}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="library" className="flex-1 flex flex-col min-h-0">
          <TabsList className={cn("grid w-full", isVideoMode ? "grid-cols-3" : "grid-cols-4")}>
            <TabsTrigger value="library">
              <FolderOpen size={14} className="mr-1.5" />
              Library
            </TabsTrigger>
            {!isVideoMode && <TabsTrigger value="gallery">Gallery</TabsTrigger>}
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger value="url">URL</TabsTrigger>
          </TabsList>

          {/* Media Library Tab */}
          <TabsContent value="library" className="flex-1 flex flex-col min-h-0 mt-4" style={{ minHeight: '300px' }}>
            {mediaLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mb-2" />
                <p className="text-xs text-muted-foreground">Loading media library...</p>
              </div>
            ) : mediaError ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-sm text-muted-foreground mb-2">{mediaError}</p>
                <Button variant="outline" size="sm" onClick={fetchMediaLibrary}>
                  Retry
                </Button>
              </div>
            ) : mediaItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FolderOpen className="w-10 h-10 text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground mb-1">No media files yet</p>
                <p className="text-xs text-muted-foreground/60">Upload files via the Upload tab or admin media library</p>
              </div>
            ) : (
              <ScrollArea className="flex-1 h-[400px]">
                <div className="grid grid-cols-4 gap-2 pr-4">
                  {mediaItems.map((item) => {
                    const itemIsVideo = isVideoMime(item.mimeType)
                    return (
                      <div key={item.id} className="relative group">
                        <button
                          onClick={() => setSelectedUrl(item.url)}
                          className={cn(
                            "aspect-video rounded-lg overflow-hidden border-2 transition-all w-full",
                            selectedUrl === item.url
                              ? "border-primary ring-2 ring-primary/20"
                              : "border-transparent hover:border-primary/50"
                          )}
                        >
                          {itemIsVideo ? (
                            <div className="w-full h-full bg-muted flex flex-col items-center justify-center gap-1">
                              <Film size={24} className="text-muted-foreground" />
                              <span className="text-[9px] text-muted-foreground truncate max-w-full px-1">
                                {item.originalName || item.filename}
                              </span>
                            </div>
                          ) : (
                            <img
                              src={item.url}
                              alt={item.alt || item.originalName}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          )}
                          {selectedUrl === item.url && (
                            <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                              <Check className="w-6 h-6 text-primary" />
                            </div>
                          )}
                        </button>
                        <span className="absolute bottom-1 left-1 right-1 text-[9px] text-white bg-black/50 px-1 rounded truncate">
                          {item.title || item.originalName}
                        </span>
                        {itemIsVideo && (
                          <span className="absolute top-1 left-1 text-[8px] font-medium text-white bg-black/60 px-1.5 py-0.5 rounded">
                            VIDEO
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          {/* Gallery Tab (images only) */}
          {!isVideoMode && (
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
          )}

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
              {uploading ? (
                <Loader2 className="w-12 h-12 mx-auto mb-4 text-primary animate-spin" />
              ) : (
                <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              )}
              <p className="text-sm font-medium mb-2">
                {uploading ? "Uploading..." : `Drag and drop ${isVideoMode ? "videos" : isMediaMode ? "files" : "images"} here`}
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                {isVideoMode ? "MP4, WebM, OGG supported (up to 50MB)" : isMediaMode ? "Images and videos supported" : "or click to browse"}
              </p>
              <input
                type="file"
                accept={acceptTypes}
                multiple
                onChange={(e) => handleFileUpload(e.target.files)}
                className="hidden"
                id="media-upload"
                disabled={uploading}
              />
              <Button asChild variant="outline" size="sm" disabled={uploading}>
                <label htmlFor="media-upload" className="cursor-pointer">
                  Choose Files
                </label>
              </Button>
            </div>

            {/* Uploaded images preview (local) */}
            {!isVideoMode && uploadedImages.length > 0 && (
              <div className="mt-4">
                <Label className="text-xs text-muted-foreground mb-2 block">
                  Local Uploads ({uploadedImages.length})
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
                <Label htmlFor="media-url">{isVideoMode ? "Video" : "Media"} URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="media-url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder={isVideoMode ? "https://example.com/video.mp4" : "https://example.com/image.jpg"}
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
                    {isVideoUrl(selectedUrl) || isVideoMode ? (
                      <video
                        src={selectedUrl}
                        controls
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <img
                        src={selectedUrl}
                        alt="Preview"
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = ""
                        }}
                      />
                    )}
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
                Selected: {selectedUrl.substring(0, 50)}{selectedUrl.length > 50 ? "..." : ""}
              </span>
            )}
          </div>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSelect} disabled={!selectedUrl}>
            {isVideoMode ? "Select Video" : "Select Media"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
