'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { cn } from '../../../lib/utils'
import { Button } from '../../ui/button'
import { Progress } from '../../ui/progress'
import { Upload, X, Check, AlertCircle, FileIcon } from 'lucide-react'
import type { UploadProgress } from '../../../lib/media/types'
import { formatFileSize } from '../../../lib/media/types'

interface MediaUploaderProps {
  folderId?: string | null
  uploads: UploadProgress[]
  isUploading: boolean
  onUpload: (files: File[]) => Promise<void> | Promise<unknown[]>
  onClearCompleted: () => void
  className?: string
}

export function MediaUploader({
  folderId,
  uploads,
  isUploading,
  onUpload,
  onClearCompleted,
  className,
}: MediaUploaderProps) {
  const [isDragActive, setIsDragActive] = useState(false)

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      await onUpload(acceptedFiles)
    },
    [onUpload]
  )

  const { getRootProps, getInputProps, open } = useDropzone({
    onDrop,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
    noClick: true,
    noKeyboard: true,
  })

  const hasUploads = uploads.length > 0
  const hasCompleted = uploads.some(
    (u) => u.status === 'complete' || u.status === 'error'
  )

  return (
    <div className={cn('space-y-4', className)}>
      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={cn(
          'relative border-2 border-dashed rounded-lg p-8 text-center transition-colors',
          isDragActive
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-muted-foreground/50',
          isUploading && 'pointer-events-none opacity-50'
        )}
      >
        <input {...getInputProps()} />

        <div className="flex flex-col items-center gap-2">
          <Upload
            className={cn(
              'h-10 w-10 transition-colors',
              isDragActive ? 'text-primary' : 'text-muted-foreground'
            )}
          />
          <div>
            <p className="font-medium">
              {isDragActive ? 'Drop files here' : 'Drag and drop files here'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              or{' '}
              <button
                type="button"
                onClick={open}
                className="text-primary hover:underline"
                disabled={isUploading}
              >
                browse files
              </button>
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            Images, videos, audio, and documents up to 50MB
          </p>
        </div>
      </div>

      {/* Upload progress */}
      {hasUploads && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Uploads</p>
            {hasCompleted && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearCompleted}
                className="h-auto py-1 px-2 text-xs"
              >
                Clear completed
              </Button>
            )}
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {uploads.map((upload) => (
              <div
                key={upload.id}
                className="flex items-center gap-3 p-2 rounded-md bg-muted/50"
              >
                <div className="flex-shrink-0">
                  {upload.status === 'complete' ? (
                    <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                      <Check className="h-4 w-4 text-green-600" />
                    </div>
                  ) : upload.status === 'error' ? (
                    <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    </div>
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                      <FileIcon className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{upload.filename}</p>
                  <div className="flex items-center gap-2">
                    {upload.status === 'uploading' ? (
                      <Progress value={upload.progress} className="h-1 flex-1" />
                    ) : upload.status === 'error' ? (
                      <p className="text-xs text-red-600 truncate">{upload.error}</p>
                    ) : upload.status === 'complete' ? (
                      <p className="text-xs text-muted-foreground">Complete</p>
                    ) : (
                      <p className="text-xs text-muted-foreground">Pending</p>
                    )}
                    {upload.size && (
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {formatFileSize(upload.size)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
