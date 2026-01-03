'use client'

/**
 * Custom Puck Field: Media Picker
 *
 * Allows users to select images from the media library or upload new ones directly in Puck
 */

import React, { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Upload, Image, Link as LinkIcon, Loader2, X, Check } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import { toast } from 'sonner'

interface MediaItem {
  id: string
  url: string
  filename: string
  alt?: string
  width?: number
  height?: number
}

interface MediaPickerFieldProps {
  value: string
  onChange: (value: string) => void
  label?: string
  placeholder?: string
}

export function MediaPickerField({
  value,
  onChange,
  label = 'Image',
  placeholder = 'Enter image URL or select from library',
}: MediaPickerFieldProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'library' | 'upload' | 'url'>('library')
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const [isLoadingMedia, setIsLoadingMedia] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [urlInput, setUrlInput] = useState('')
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null)

  // Load media from library
  const loadMedia = useCallback(async () => {
    setIsLoadingMedia(true)
    try {
      const response = await fetch('/api/media?type=IMAGE&limit=50&sortBy=createdAt&sortOrder=desc')
      if (response.ok) {
        const data = await response.json()
        setMediaItems(data.items || [])
      }
    } catch (error) {
      console.error('Failed to load media:', error)
    } finally {
      setIsLoadingMedia(false)
    }
  }, [])

  // Upload a file
  const uploadFile = useCallback(async (file: File) => {
    setIsUploading(true)
    setUploadProgress(0)

    try {
      // Get presigned URL
      const presignResponse = await fetch('/api/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'presign',
          filename: file.name,
          mimeType: file.type,
          size: file.size,
        }),
      })

      if (!presignResponse.ok) {
        const error = await presignResponse.json()
        throw new Error(error.error || 'Failed to get upload URL')
      }

      const presignData = await presignResponse.json()
      setUploadProgress(25)

      // Upload to storage
      const uploadResponse = await fetch(presignData.uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      })

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file')
      }

      setUploadProgress(75)

      // Complete upload
      const completeResponse = await fetch('/api/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'complete',
          filename: file.name,
          originalName: file.name,
          mimeType: file.type,
          size: file.size,
          url: presignData.publicUrl,
          key: presignData.key,
          bucket: presignData.bucket,
          provider: presignData.provider,
        }),
      })

      if (!completeResponse.ok) {
        throw new Error('Failed to create media record')
      }

      const media = await completeResponse.json()
      setUploadProgress(100)

      // Set the URL and close
      onChange(media.url)
      setIsOpen(false)
      toast.success('Image uploaded successfully')
    } catch (error) {
      console.error('Upload error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to upload image')
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }, [onChange])

  // Dropzone config
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false,
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        await uploadFile(acceptedFiles[0])
      }
    },
  })

  // Handle dialog open
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (open) {
      loadMedia()
      setUrlInput(value || '')
    }
  }

  // Handle URL submit
  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      onChange(urlInput.trim())
      setIsOpen(false)
    }
  }

  // Handle media select
  const handleMediaSelect = (media: MediaItem) => {
    setSelectedMedia(media)
  }

  // Handle confirm selection
  const handleConfirmSelection = () => {
    if (selectedMedia) {
      onChange(selectedMedia.url)
      setIsOpen(false)
      setSelectedMedia(null)
    }
  }

  return (
    <div className="space-y-2">
      {label && (
        <Label className="text-sm font-medium">{label}</Label>
      )}

      <div className="flex gap-2">
        <Input
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1"
        />

        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon" type="button">
              <Image className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>Select Image</DialogTitle>
            </DialogHeader>

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="library">
                  <Image className="h-4 w-4 mr-2" />
                  Library
                </TabsTrigger>
                <TabsTrigger value="upload">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </TabsTrigger>
                <TabsTrigger value="url">
                  <LinkIcon className="h-4 w-4 mr-2" />
                  URL
                </TabsTrigger>
              </TabsList>

              <TabsContent value="library" className="mt-4">
                {isLoadingMedia ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : mediaItems.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Image className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No images in library</p>
                    <p className="text-sm">Upload some images first</p>
                  </div>
                ) : (
                  <>
                    <ScrollArea className="h-[400px]">
                      <div className="grid grid-cols-4 gap-3 p-1">
                        {mediaItems.map((media) => (
                          <div
                            key={media.id}
                            className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                              selectedMedia?.id === media.id
                                ? 'border-primary ring-2 ring-primary/20'
                                : 'border-transparent hover:border-muted-foreground/30'
                            }`}
                            onClick={() => handleMediaSelect(media)}
                          >
                            <img
                              src={media.url}
                              alt={media.alt || media.filename}
                              className="w-full h-full object-cover"
                            />
                            {selectedMedia?.id === media.id && (
                              <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                <Check className="h-8 w-8 text-primary" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                    <div className="flex justify-end mt-4 pt-4 border-t">
                      <Button
                        onClick={handleConfirmSelection}
                        disabled={!selectedMedia}
                      >
                        Select Image
                      </Button>
                    </div>
                  </>
                )}
              </TabsContent>

              <TabsContent value="upload" className="mt-4">
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
                    isDragActive
                      ? 'border-primary bg-primary/5'
                      : 'border-muted-foreground/25 hover:border-primary/50'
                  }`}
                >
                  <input {...getInputProps()} />
                  {isUploading ? (
                    <div className="space-y-4">
                      <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary" />
                      <p className="text-muted-foreground">
                        Uploading... {uploadProgress}%
                      </p>
                      <div className="w-48 mx-auto h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-lg font-medium">
                        {isDragActive ? 'Drop the image here' : 'Drag & drop an image'}
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">
                        or click to select a file
                      </p>
                      <p className="text-xs text-muted-foreground mt-4">
                        PNG, JPG, GIF, WebP, or SVG up to 10MB
                      </p>
                    </>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="url" className="mt-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="imageUrl">Image URL</Label>
                    <Input
                      id="imageUrl"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
                    />
                  </div>

                  {urlInput && (
                    <div className="border rounded-lg p-4">
                      <p className="text-sm text-muted-foreground mb-2">Preview:</p>
                      <img
                        src={urlInput}
                        alt="Preview"
                        className="max-h-48 rounded-lg mx-auto"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none'
                        }}
                        onLoad={(e) => {
                          (e.target as HTMLImageElement).style.display = 'block'
                        }}
                      />
                    </div>
                  )}

                  <div className="flex justify-end">
                    <Button onClick={handleUrlSubmit} disabled={!urlInput.trim()}>
                      Use This URL
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>

      {/* Preview */}
      {value && (
        <div className="relative mt-2 rounded-lg overflow-hidden border bg-muted/30">
          <img
            src={value}
            alt="Selected image"
            className="max-h-32 w-full object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none'
            }}
          />
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-6 w-6"
            onClick={() => onChange('')}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  )
}

/**
 * Puck custom field adapter
 *
 * Note: We use `any` for the render props to support both:
 * - Fields with non-optional string values (defaultProps defined)
 * - Fields with optional string values (no defaultProps)
 */
export const mediaPickerFieldConfig = {
  type: 'custom' as const,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  render: ({ value, onChange }: any) => (
    <MediaPickerField value={value || ''} onChange={(v) => onChange(v || '')} />
  ),
}

export default MediaPickerField
