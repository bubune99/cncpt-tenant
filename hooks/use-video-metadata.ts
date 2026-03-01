'use client'

import { useState, useCallback } from 'react'
import {
  extractVideoMetadataWithThumbnail,
  isVideoMimeType,
  getThumbnailFilename,
  type VideoMetadata,
  type ThumbnailResult,
} from '@/lib/cms/media/video-utils'

// =============================================================================
// TYPES
// =============================================================================

export interface VideoProcessingResult {
  /** Extracted video metadata */
  metadata: VideoMetadata
  /** Generated thumbnail data URL for immediate preview */
  thumbnailDataUrl: string | null
  /** URL of the thumbnail after uploading to R2 (null if upload failed or skipped) */
  thumbnailUrl: string | null
}

export interface UseVideoMetadataOptions {
  /** Whether to auto-upload the generated thumbnail to R2 (default: true) */
  uploadThumbnail?: boolean
  /** Called when processing succeeds */
  onSuccess?: (result: VideoProcessingResult) => void
  /** Called when processing fails */
  onError?: (error: string) => void
}

export interface UseVideoMetadataReturn {
  /** Whether video metadata extraction is in progress */
  isProcessing: boolean
  /** Current processing status message */
  status: string | null
  /** The last error that occurred */
  error: string | null
  /** The last processing result */
  result: VideoProcessingResult | null
  /**
   * Extract metadata and optionally generate + upload a thumbnail for a video.
   *
   * @param source - A File object or URL string of the video
   * @param mediaId - The media record ID (for updating metadata via API)
   * @returns The processing result, or null if it failed
   */
  processVideo: (source: File | string, mediaId?: string) => Promise<VideoProcessingResult | null>
  /**
   * Extract metadata only (no thumbnail) from a video file.
   * Useful for quick metadata checks before upload.
   */
  extractMetadataOnly: (source: File | string) => Promise<VideoMetadata | null>
  /** Reset the hook state */
  reset: () => void
}

// =============================================================================
// HOOK
// =============================================================================

export function useVideoMetadata(
  options: UseVideoMetadataOptions = {}
): UseVideoMetadataReturn {
  const { uploadThumbnail = true, onSuccess, onError } = options

  const [isProcessing, setIsProcessing] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<VideoProcessingResult | null>(null)

  const reset = useCallback(() => {
    setIsProcessing(false)
    setStatus(null)
    setError(null)
    setResult(null)
  }, [])

  /**
   * Upload a thumbnail blob to R2 via the media presign + upload flow.
   */
  const uploadThumbnailToR2 = useCallback(
    async (thumbnail: ThumbnailResult, originalFilename: string): Promise<string | null> => {
      try {
        setStatus('Uploading thumbnail...')

        const thumbnailFilename = getThumbnailFilename(originalFilename)

        // Step 1: Get presigned URL for the thumbnail
        const presignResponse = await fetch('/api/cms/media', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'presign',
            filename: thumbnailFilename,
            mimeType: 'image/jpeg',
            size: thumbnail.blob.size,
          }),
        })

        if (!presignResponse.ok) {
          console.error('Failed to get presigned URL for thumbnail')
          return null
        }

        const presignData = await presignResponse.json()

        // Step 2: Upload thumbnail to storage
        const uploadResponse = await fetch(presignData.uploadUrl, {
          method: 'PUT',
          body: thumbnail.blob,
          headers: {
            'Content-Type': 'image/jpeg',
          },
        })

        if (!uploadResponse.ok) {
          console.error('Failed to upload thumbnail to storage')
          return null
        }

        // Step 3: Create a media record for the thumbnail
        const completeResponse = await fetch('/api/cms/media', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'complete',
            filename: presignData.key.split('/').pop(),
            originalName: thumbnailFilename,
            mimeType: 'image/jpeg',
            size: thumbnail.blob.size,
            url: presignData.publicUrl,
            key: presignData.key,
            bucket: presignData.bucket,
            provider: presignData.provider,
            width: thumbnail.width,
            height: thumbnail.height,
            title: `Thumbnail: ${originalFilename}`,
          }),
        })

        if (!completeResponse.ok) {
          console.error('Failed to create thumbnail media record')
          // Even if media record creation fails, the file was uploaded
          return presignData.publicUrl
        }

        return presignData.publicUrl
      } catch (err) {
        console.error('Thumbnail upload error:', err)
        return null
      }
    },
    []
  )

  /**
   * Update the media record with video metadata via the API.
   */
  const updateMediaMetadata = useCallback(
    async (
      mediaId: string,
      metadata: VideoMetadata,
      thumbnailUrl: string | null
    ): Promise<void> => {
      try {
        setStatus('Saving metadata...')

        const response = await fetch(`/api/cms/media/${mediaId}/metadata`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            duration: metadata.duration,
            width: metadata.width,
            height: metadata.height,
            thumbnailUrl,
            metadata: {
              codec: metadata.codec,
              bitrate: metadata.bitrate,
              format: metadata.format,
            },
          }),
        })

        if (!response.ok) {
          const data = await response.json().catch(() => ({}))
          console.error('Failed to update media metadata:', data.error || 'Unknown error')
        }
      } catch (err) {
        console.error('Failed to save video metadata:', err)
      }
    },
    []
  )

  /**
   * Main processing function: extract metadata, generate thumbnail, upload, and update record.
   */
  const processVideo = useCallback(
    async (source: File | string, mediaId?: string): Promise<VideoProcessingResult | null> => {
      // Validate it's a video
      if (source instanceof File && !isVideoMimeType(source.type)) {
        const msg = 'File is not a video'
        setError(msg)
        onError?.(msg)
        return null
      }

      setIsProcessing(true)
      setError(null)
      setStatus('Extracting video metadata...')

      try {
        // Extract metadata and thumbnail in one pass
        const extracted = await extractVideoMetadataWithThumbnail(source)

        const processingResult: VideoProcessingResult = {
          metadata: {
            duration: extracted.duration,
            width: extracted.width,
            height: extracted.height,
            codec: extracted.codec,
            bitrate: extracted.bitrate,
            format: extracted.format,
          },
          thumbnailDataUrl: extracted.thumbnail?.dataUrl || null,
          thumbnailUrl: null,
        }

        // Upload thumbnail to R2 if enabled and thumbnail was generated
        if (uploadThumbnail && extracted.thumbnail) {
          const filename = source instanceof File
            ? source.name
            : (source.split('/').pop() || 'video')

          const thumbnailUrl = await uploadThumbnailToR2(extracted.thumbnail, filename)
          processingResult.thumbnailUrl = thumbnailUrl
        }

        // Update the media record if we have an ID
        if (mediaId) {
          await updateMediaMetadata(
            mediaId,
            processingResult.metadata,
            processingResult.thumbnailUrl
          )
        }

        setStatus('Complete')
        setResult(processingResult)
        onSuccess?.(processingResult)
        return processingResult
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Video processing failed'
        setError(message)
        setStatus(null)
        onError?.(message)
        return null
      } finally {
        setIsProcessing(false)
      }
    },
    [uploadThumbnail, uploadThumbnailToR2, updateMediaMetadata, onSuccess, onError]
  )

  /**
   * Extract metadata only, without thumbnail generation or API calls.
   * Useful for checking video properties before or during upload.
   */
  const extractMetadataOnly = useCallback(
    async (source: File | string): Promise<VideoMetadata | null> => {
      if (source instanceof File && !isVideoMimeType(source.type)) {
        return null
      }

      try {
        // Use the simpler metadata-only extraction
        const { extractVideoMetadata } = await import('@/lib/cms/media/video-utils')
        return await extractVideoMetadata(source)
      } catch (err) {
        console.error('Metadata extraction failed:', err)
        return null
      }
    },
    []
  )

  return {
    isProcessing,
    status,
    error,
    result,
    processVideo,
    extractMetadataOnly,
    reset,
  }
}
