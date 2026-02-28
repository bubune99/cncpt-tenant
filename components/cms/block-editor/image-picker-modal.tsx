"use client"

import { useState, useCallback, useMemo } from "react"
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

  // Load uploaded images when modal opens
  const handleOpenChange = useCallback((newOpen: boolean) => {
    onOpenChange(newOpen)
    if (newOpen) {
      setUploadedImages(getUploadedImages())
      setSelectedUrl(currentUrl || "")
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="gallery">Gallery</TabsTrigger>
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
