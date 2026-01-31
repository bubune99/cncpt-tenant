'use client'

import { useState, useCallback } from 'react'
import type { UploadProgress } from '../lib/media/types'

interface UseMediaUploadOptions {
  folderId?: string | null
  onSuccess?: (media: any) => void
  onError?: (error: string) => void
}

export function useMediaUpload(options: UseMediaUploadOptions = {}) {
  const [uploads, setUploads] = useState<Map<string, UploadProgress>>(new Map())
  const [isUploading, setIsUploading] = useState(false)

  const updateUpload = useCallback((id: string, updates: Partial<UploadProgress>) => {
    setUploads((prev) => {
      const newMap = new Map(prev)
      const current = newMap.get(id)
      if (current) {
        newMap.set(id, { ...current, ...updates })
      }
      return newMap
    })
  }, [])

  const uploadFile = useCallback(
    async (file: File): Promise<any> => {
      const uploadId = `${file.name}-${Date.now()}`

      // Add to uploads
      setUploads((prev) => {
        const newMap = new Map(prev)
        newMap.set(uploadId, {
          id: uploadId,
          filename: file.name,
          progress: 0,
          status: 'pending',
          size: file.size,
        })
        return newMap
      })

      try {
        updateUpload(uploadId, { status: 'uploading', progress: 10 })

        // Step 1: Get presigned URL
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
        updateUpload(uploadId, { progress: 30 })

        // Step 2: Upload to storage
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

        updateUpload(uploadId, { progress: 70 })

        // Step 3: Create media record
        const completeResponse = await fetch('/api/media', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'complete',
            filename: presignData.key.split('/').pop(),
            originalName: file.name,
            mimeType: file.type,
            size: file.size,
            url: presignData.publicUrl,
            key: presignData.key,
            bucket: presignData.bucket,
            provider: presignData.provider,
            folderId: options.folderId,
          }),
        })

        if (!completeResponse.ok) {
          const error = await completeResponse.json()
          throw new Error(error.error || 'Failed to create media record')
        }

        const media = await completeResponse.json()

        updateUpload(uploadId, {
          status: 'complete',
          progress: 100,
          url: media.url,
        })

        options.onSuccess?.(media)
        return media
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Upload failed'
        updateUpload(uploadId, {
          status: 'error',
          error: message,
        })
        options.onError?.(message)
        throw error
      }
    },
    [options, updateUpload]
  )

  const uploadFiles = useCallback(
    async (files: FileList | File[]) => {
      setIsUploading(true)

      const fileArray = Array.from(files)
      const results: any[] = []

      for (const file of fileArray) {
        try {
          const media = await uploadFile(file)
          results.push(media)
        } catch (error) {
          // Continue with other files
        }
      }

      setIsUploading(false)
      return results
    },
    [uploadFile]
  )

  const clearCompleted = useCallback(() => {
    setUploads((prev) => {
      const newMap = new Map(prev)
      for (const [id, upload] of newMap) {
        if (upload.status === 'complete' || upload.status === 'error') {
          newMap.delete(id)
        }
      }
      return newMap
    })
  }, [])

  const clearAll = useCallback(() => {
    setUploads(new Map())
  }, [])

  return {
    uploads: Array.from(uploads.values()),
    isUploading,
    uploadFile,
    uploadFiles,
    clearCompleted,
    clearAll,
  }
}
