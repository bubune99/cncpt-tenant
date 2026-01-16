'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '../../ui/sheet'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { Textarea } from '../../ui/textarea'
import { Badge } from '../../ui/badge'
import { Separator } from '../../ui/separator'
import { ScrollArea } from '../../ui/scroll-area'
import { getMediaType, formatFileSize } from '../../../lib/media/types'
import type { MediaWithRelations, UsageInfo } from '../../../lib/media/types'
import { format } from 'date-fns'
import {
  FileText,
  Film,
  Music,
  ImageIcon,
  File,
  ExternalLink,
  Copy,
  Download,
  Trash,
  Save,
  X,
} from 'lucide-react'

interface MediaPreviewSheetProps {
  media: MediaWithRelations | null
  open: boolean
  onClose: () => void
  onSave: (id: string, data: { title?: string; alt?: string; caption?: string; description?: string }) => Promise<void>
  onDelete: (id: string) => void
}

const typeIcons = {
  image: ImageIcon,
  video: Film,
  audio: Music,
  document: FileText,
  other: File,
}

export function MediaPreviewSheet({
  media,
  open,
  onClose,
  onSave,
  onDelete,
}: MediaPreviewSheetProps) {
  const [title, setTitle] = useState('')
  const [alt, setAlt] = useState('')
  const [caption, setCaption] = useState('')
  const [description, setDescription] = useState('')
  const [usage, setUsage] = useState<UsageInfo[]>([])
  const [loadingUsage, setLoadingUsage] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (media) {
      setTitle(media.title || '')
      setAlt(media.alt || '')
      setCaption(media.caption || '')
      setDescription(media.description || '')

      // Fetch usage
      setLoadingUsage(true)
      fetch(`/api/media/${media.id}/usage`)
        .then((res) => res.json())
        .then((data) => setUsage(data.usages || []))
        .catch(console.error)
        .finally(() => setLoadingUsage(false))
    }
  }, [media])

  if (!media) return null

  const mediaType = getMediaType(media.mimeType)
  const Icon = typeIcons[mediaType]

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave(media.id, { title, alt, caption, description })
    } finally {
      setSaving(false)
    }
  }

  const hasChanges =
    title !== (media.title || '') ||
    alt !== (media.alt || '') ||
    caption !== (media.caption || '') ||
    description !== (media.description || '')

  return (
    <Sheet open={open} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Icon className="h-5 w-5" />
            Media Details
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-8rem)] pr-4">
          <div className="space-y-6 py-4">
            {/* Preview */}
            <div className="aspect-video relative bg-muted rounded-lg overflow-hidden">
              {mediaType === 'image' ? (
                <Image
                  src={media.url}
                  alt={media.alt || media.filename}
                  fill
                  className="object-contain"
                />
              ) : mediaType === 'video' ? (
                <video
                  src={media.url}
                  controls
                  className="w-full h-full object-contain"
                />
              ) : mediaType === 'audio' ? (
                <div className="w-full h-full flex items-center justify-center p-4">
                  <audio src={media.url} controls className="w-full" />
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Icon className="h-16 w-16 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(media.url, '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                Open
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigator.clipboard.writeText(media.url)}
              >
                <Copy className="h-4 w-4 mr-1" />
                Copy URL
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const a = document.createElement('a')
                  a.href = media.url
                  a.download = media.filename
                  a.click()
                }}
              >
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
            </div>

            <Separator />

            {/* File info */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Filename</p>
                <p className="font-medium truncate">{media.filename}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Original Name</p>
                <p className="font-medium truncate">{media.originalName}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Type</p>
                <p className="font-medium">{media.mimeType}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Size</p>
                <p className="font-medium">{formatFileSize(media.size)}</p>
              </div>
              {media.width && media.height && (
                <div>
                  <p className="text-muted-foreground">Dimensions</p>
                  <p className="font-medium">
                    {media.width} × {media.height}
                  </p>
                </div>
              )}
              <div>
                <p className="text-muted-foreground">Uploaded</p>
                <p className="font-medium">
                  {format(new Date(media.createdAt), 'MMM d, yyyy')}
                </p>
              </div>
            </div>

            <Separator />

            {/* Editable fields */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter title..."
                />
              </div>

              <div>
                <Label htmlFor="alt">Alt Text</Label>
                <Input
                  id="alt"
                  value={alt}
                  onChange={(e) => setAlt(e.target.value)}
                  placeholder="Describe the image for accessibility..."
                />
              </div>

              <div>
                <Label htmlFor="caption">Caption</Label>
                <Input
                  id="caption"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Caption to display..."
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Longer description..."
                  rows={3}
                />
              </div>
            </div>

            {/* Tags */}
            {media.tags && media.tags.length > 0 && (
              <>
                <Separator />
                <div>
                  <p className="text-sm font-medium mb-2">Tags</p>
                  <div className="flex flex-wrap gap-1">
                    {media.tags.map((tagRelation) => (
                      <Badge
                        key={tagRelation.tag.id}
                        variant="secondary"
                        style={
                          tagRelation.tag.color
                            ? { borderColor: tagRelation.tag.color }
                            : undefined
                        }
                      >
                        {tagRelation.tag.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Usage */}
            <Separator />
            <div>
              <p className="text-sm font-medium mb-2">Usage</p>
              {loadingUsage ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : usage.length > 0 ? (
                <div className="space-y-2">
                  {usage.map((u) => (
                    <a
                      key={u.id}
                      href={u.url}
                      className="block p-2 rounded-md bg-muted hover:bg-muted/80 transition-colors"
                    >
                      <p className="text-sm font-medium">{u.entityTitle}</p>
                      <p className="text-xs text-muted-foreground">
                        {u.entityType}
                        {u.fieldName && ` • ${u.fieldName}`}
                      </p>
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Not used anywhere
                </p>
              )}
            </div>

            <Separator />

            {/* Save / Delete */}
            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                disabled={!hasChanges || saving}
                className="flex-1"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button
                variant="destructive"
                onClick={() => onDelete(media.id)}
              >
                <Trash className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
