'use client'

import { useState, useCallback, useRef } from 'react'
import type { UploadProgress } from '@/lib/cms/media/types'
import { MULTIPART_THRESHOLD } from '@/lib/cms/media/types'
import { isVideoMimeType } from '@/lib/cms/media/video-utils'

interface UseMediaUploadOptions {
  folderId?: string | null
  /** Whether to automatically extract video metadata and generate thumbnails after upload (default: true) */
  autoProcessVideo?: boolean
  onSuccess?: (media: any) => void
  onError?: (error: string) => void
}

/**
 * State for tracking an in-progress multipart upload (for resume support)
 */
interface MultipartUploadState {
  uploadId: string
  key: string
  bucket: string
  chunkSize: number
  totalParts: number
  publicUrl: string
  completedParts: Array<{ partNumber: number; etag: string }>
}

export function useMediaUpload(options: UseMediaUploadOptions = {}) {
  const [uploads, setUploads] = useState<Map<string, UploadProgress>>(new Map())
  const [isUploading, setIsUploading] = useState(false)

  // Track multipart upload state for resume support
  const multipartStateRef = useRef<Map<string, MultipartUploadState>>(new Map())

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

  // ---------------------------------------------------------------------------
  // Video post-processing: extract metadata and generate thumbnail
  // ---------------------------------------------------------------------------

  const processVideoAfterUpload = useCallback(
    async (file: File, media: any, trackingId: string) => {
      if (!isVideoMimeType(file.type) || options.autoProcessVideo === false) {
        return media
      }

      updateUpload(trackingId, { status: 'processing', progress: 85 })

      try {
        const { extractVideoMetadataWithThumbnail, getThumbnailFilename } = await import(
          '@/lib/cms/media/video-utils'
        )

        const extracted = await extractVideoMetadataWithThumbnail(file)

        // Upload thumbnail to R2 if generated
        let thumbnailUrl: string | null = null
        if (extracted.thumbnail) {
          const thumbFilename = getThumbnailFilename(file.name)
          const thumbPresign = await fetch('/api/cms/media', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'presign',
              filename: thumbFilename,
              mimeType: 'image/jpeg',
              size: extracted.thumbnail.blob.size,
            }),
          })

          if (thumbPresign.ok) {
            const thumbPresignData = await thumbPresign.json()
            const thumbUpload = await fetch(thumbPresignData.uploadUrl, {
              method: 'PUT',
              body: extracted.thumbnail.blob,
              headers: { 'Content-Type': 'image/jpeg' },
            })
            if (thumbUpload.ok) {
              thumbnailUrl = thumbPresignData.publicUrl

              // Create a media record for the thumbnail too
              await fetch('/api/cms/media', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  action: 'complete',
                  filename: thumbPresignData.key.split('/').pop(),
                  originalName: thumbFilename,
                  mimeType: 'image/jpeg',
                  size: extracted.thumbnail.blob.size,
                  url: thumbPresignData.publicUrl,
                  key: thumbPresignData.key,
                  bucket: thumbPresignData.bucket,
                  provider: thumbPresignData.provider,
                  width: extracted.thumbnail.width,
                  height: extracted.thumbnail.height,
                  title: `Thumbnail: ${file.name}`,
                }),
              }).catch(() => {
                // Non-critical: thumbnail file was uploaded even if record fails
              })
            }
          }
        }

        updateUpload(trackingId, { progress: 95 })

        // Update the video's media record with metadata
        if (media.id) {
          await fetch(`/api/cms/media/${media.id}/metadata`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              duration: extracted.duration,
              width: extracted.width,
              height: extracted.height,
              thumbnailUrl,
              metadata: {
                codec: extracted.codec,
                bitrate: extracted.bitrate,
                format: extracted.format,
              },
            }),
          })
        }

        // Merge metadata into the returned media object
        media.duration = Math.round(extracted.duration)
        media.width = extracted.width
        media.height = extracted.height
        media.thumbnailUrl = thumbnailUrl
        media.metadata = {
          codec: extracted.codec,
          bitrate: extracted.bitrate,
          format: extracted.format,
        }
      } catch (videoError) {
        // Video metadata extraction is non-critical — log and continue
        console.warn('Video metadata extraction failed (non-critical):', videoError)
      }

      return media
    },
    [options.autoProcessVideo, updateUpload]
  )

  // ---------------------------------------------------------------------------
  // Standard single-presigned-URL upload (for small files <= 50MB)
  // ---------------------------------------------------------------------------

  const uploadSmallFile = useCallback(
    async (file: File, trackingId: string): Promise<any> => {
      updateUpload(trackingId, { status: 'uploading', progress: 10 })

      // Step 1: Get presigned URL
      const presignResponse = await fetch('/api/cms/media', {
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
      updateUpload(trackingId, { progress: 30 })

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

      updateUpload(trackingId, { progress: 70 })

      // Step 3: Create media record
      const completeResponse = await fetch('/api/cms/media', {
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

      return completeResponse.json()
    },
    [options.folderId, updateUpload]
  )

  // ---------------------------------------------------------------------------
  // Multipart (chunked) upload for large files (> 50MB)
  // ---------------------------------------------------------------------------

  const uploadLargeFile = useCallback(
    async (file: File, trackingId: string): Promise<any> => {
      updateUpload(trackingId, { status: 'uploading', progress: 1 })

      // Step 1: Initiate multipart upload
      const initiateResponse = await fetch('/api/cms/media/multipart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'initiate',
          filename: file.name,
          mimeType: file.type,
          size: file.size,
        }),
      })

      if (!initiateResponse.ok) {
        const error = await initiateResponse.json()
        throw new Error(error.error || 'Failed to initiate multipart upload')
      }

      const initData = await initiateResponse.json()
      const { uploadId, key, chunkSize, totalParts } = initData

      // Save state for potential resume
      const mpState: MultipartUploadState = {
        uploadId,
        key,
        bucket: initData.bucket,
        chunkSize,
        totalParts,
        publicUrl: initData.publicUrl,
        completedParts: [],
      }
      multipartStateRef.current.set(trackingId, mpState)

      updateUpload(trackingId, { progress: 5 })

      // Step 2: Upload each chunk
      // Progress range: 5% to 80% (75% total for chunk uploading)
      const progressPerPart = 75 / totalParts

      for (let partNumber = 1; partNumber <= totalParts; partNumber++) {
        // Check if this part was already uploaded (resume support)
        const alreadyUploaded = mpState.completedParts.find(
          (p) => p.partNumber === partNumber
        )
        if (alreadyUploaded) {
          const progress = 5 + partNumber * progressPerPart
          updateUpload(trackingId, { progress: Math.round(progress) })
          continue
        }

        // Get presigned URL for this part
        const presignResponse = await fetch('/api/cms/media/multipart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'presign-part',
            uploadId,
            key,
            partNumber,
          }),
        })

        if (!presignResponse.ok) {
          const error = await presignResponse.json()
          throw new Error(
            error.error || `Failed to get presigned URL for part ${partNumber}`
          )
        }

        const { url } = await presignResponse.json()

        // Slice the file for this chunk
        const start = (partNumber - 1) * chunkSize
        const end = Math.min(start + chunkSize, file.size)
        const chunk = file.slice(start, end)

        // Upload the chunk with retry logic (3 attempts)
        let etag: string | null = null
        let lastError: Error | null = null

        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            const chunkUploadResponse = await fetch(url, {
              method: 'PUT',
              body: chunk,
            })

            if (!chunkUploadResponse.ok) {
              throw new Error(`Part ${partNumber} upload failed with status ${chunkUploadResponse.status}`)
            }

            // S3/R2 returns ETag in response headers
            etag = chunkUploadResponse.headers.get('etag')
            if (!etag) {
              // Some CORS configs strip quotes — check without them
              throw new Error(
                `No ETag returned for part ${partNumber}. Ensure your R2/S3 CORS config includes ETag in ExposeHeaders.`
              )
            }

            lastError = null
            break
          } catch (err) {
            lastError = err instanceof Error ? err : new Error(String(err))
            // Wait briefly before retry (exponential backoff)
            if (attempt < 2) {
              await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)))
            }
          }
        }

        if (lastError || !etag) {
          // Upload failed after retries — abort the whole upload
          try {
            await fetch('/api/cms/media/multipart', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'abort', uploadId, key }),
            })
          } catch {
            // Best effort cleanup
          }
          multipartStateRef.current.delete(trackingId)
          throw lastError || new Error(`Failed to upload part ${partNumber}`)
        }

        // Track completed part
        mpState.completedParts.push({ partNumber, etag })

        const progress = 5 + partNumber * progressPerPart
        updateUpload(trackingId, { progress: Math.round(progress) })
      }

      updateUpload(trackingId, { progress: 82 })

      // Step 3: Complete multipart upload
      const completeResponse = await fetch('/api/cms/media/multipart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'complete',
          uploadId,
          key,
          parts: mpState.completedParts,
          filename: file.name,
          mimeType: file.type,
          size: file.size,
          folderId: options.folderId,
        }),
      })

      if (!completeResponse.ok) {
        const error = await completeResponse.json()
        throw new Error(error.error || 'Failed to complete multipart upload')
      }

      const result = await completeResponse.json()

      // Clean up multipart state
      multipartStateRef.current.delete(trackingId)

      return result.media || result
    },
    [options.folderId, updateUpload]
  )

  // ---------------------------------------------------------------------------
  // Main uploadFile: routes to small or large path based on file size
  // ---------------------------------------------------------------------------

  const uploadFile = useCallback(
    async (file: File): Promise<any> => {
      const trackingId = `${file.name}-${Date.now()}`

      // Add to uploads
      setUploads((prev) => {
        const newMap = new Map(prev)
        newMap.set(trackingId, {
          id: trackingId,
          filename: file.name,
          progress: 0,
          status: 'pending',
          size: file.size,
        })
        return newMap
      })

      try {
        let media: any

        if (file.size > MULTIPART_THRESHOLD) {
          // Large file: use multipart chunked upload
          media = await uploadLargeFile(file, trackingId)
        } else {
          // Small file: use standard single presigned URL
          media = await uploadSmallFile(file, trackingId)
        }

        // Post-processing for video files (metadata extraction, thumbnails)
        media = await processVideoAfterUpload(file, media, trackingId)

        updateUpload(trackingId, {
          status: 'complete',
          progress: 100,
          url: media?.url,
        })

        options.onSuccess?.(media)
        return media
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Upload failed'
        updateUpload(trackingId, {
          status: 'error',
          error: message,
        })
        options.onError?.(message)
        throw error
      }
    },
    [options, updateUpload, uploadSmallFile, uploadLargeFile, processVideoAfterUpload]
  )

  // ---------------------------------------------------------------------------
  // Upload multiple files
  // ---------------------------------------------------------------------------

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

  // ---------------------------------------------------------------------------
  // Abort an in-progress multipart upload
  // ---------------------------------------------------------------------------

  const abortUpload = useCallback(
    async (trackingId: string) => {
      const mpState = multipartStateRef.current.get(trackingId)
      if (mpState) {
        try {
          await fetch('/api/cms/media/multipart', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'abort',
              uploadId: mpState.uploadId,
              key: mpState.key,
            }),
          })
        } catch {
          // Best effort
        }
        multipartStateRef.current.delete(trackingId)
      }

      updateUpload(trackingId, {
        status: 'error',
        error: 'Upload cancelled',
      })
    },
    [updateUpload]
  )

  // ---------------------------------------------------------------------------
  // Clear helpers
  // ---------------------------------------------------------------------------

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
    abortUpload,
    clearCompleted,
    clearAll,
  }
}
