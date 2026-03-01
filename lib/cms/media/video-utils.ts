/**
 * Video Metadata Extraction & Thumbnail Generation
 *
 * Uses a client-side approach for Vercel serverless compatibility:
 * - Browser <video> element extracts duration, dimensions
 * - Browser <canvas> captures a frame for thumbnail
 * - No server-side FFmpeg dependencies required
 *
 * For server-side scenarios (e.g. background jobs), provides
 * a lightweight file-header parser for basic metadata extraction.
 */

// =============================================================================
// TYPES
// =============================================================================

export interface VideoMetadata {
  /** Duration in seconds */
  duration: number
  /** Video width in pixels */
  width: number
  /** Video height in pixels */
  height: number
  /** Video codec (e.g. 'h264', 'vp9', 'av1') — extracted client-side when available */
  codec: string | null
  /** Bitrate in bits per second — estimated from file size and duration */
  bitrate: number | null
  /** Container format (e.g. 'mp4', 'webm', 'mov') */
  format: string | null
}

export interface ThumbnailResult {
  /** Thumbnail as a Blob (for uploading to R2) */
  blob: Blob
  /** Thumbnail as a data URL (for immediate preview) */
  dataUrl: string
  /** Width of the thumbnail */
  width: number
  /** Height of the thumbnail */
  height: number
}

export interface VideoMetadataWithThumbnail extends VideoMetadata {
  thumbnail: ThumbnailResult | null
}

// =============================================================================
// CLIENT-SIDE: EXTRACT VIDEO METADATA
// =============================================================================

/**
 * Extract video metadata using the browser's <video> element.
 * Works with both File objects and URLs.
 *
 * This is the primary extraction method — runs in the browser,
 * requires no server-side dependencies.
 *
 * @param source - A File object or URL string pointing to the video
 * @param options - Optional configuration
 * @returns Promise resolving to VideoMetadata
 */
export function extractVideoMetadata(
  source: File | string,
  options: { timeoutMs?: number } = {}
): Promise<VideoMetadata> {
  const { timeoutMs = 30000 } = options

  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('extractVideoMetadata requires a browser environment. Use parseVideoFormat() for server-side.'))
      return
    }

    const video = document.createElement('video')
    video.preload = 'metadata'
    video.muted = true
    video.playsInline = true

    // Prevent the video from being visible
    video.style.position = 'absolute'
    video.style.top = '-9999px'
    video.style.left = '-9999px'
    video.style.width = '1px'
    video.style.height = '1px'

    let objectUrl: string | null = null
    let timeoutId: ReturnType<typeof setTimeout> | null = null

    const cleanup = () => {
      if (timeoutId) clearTimeout(timeoutId)
      if (objectUrl) URL.revokeObjectURL(objectUrl)
      video.removeAttribute('src')
      video.load()
      if (video.parentNode) video.parentNode.removeChild(video)
    }

    // Set timeout
    timeoutId = setTimeout(() => {
      cleanup()
      reject(new Error(`Video metadata extraction timed out after ${timeoutMs}ms`))
    }, timeoutMs)

    video.onloadedmetadata = () => {
      const format = getFormatFromSource(source)
      const codec = getCodecFromVideoElement(video)

      const metadata: VideoMetadata = {
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
        codec,
        bitrate: null, // Will be calculated if file size is known
        format,
      }

      // Calculate bitrate if we have a File with size
      if (source instanceof File && metadata.duration > 0) {
        // bitrate = (file size in bits) / duration in seconds
        metadata.bitrate = Math.round((source.size * 8) / metadata.duration)
      }

      cleanup()
      resolve(metadata)
    }

    video.onerror = () => {
      cleanup()
      reject(new Error('Failed to load video for metadata extraction'))
    }

    // Set source
    if (source instanceof File) {
      objectUrl = URL.createObjectURL(source)
      video.src = objectUrl
    } else {
      video.crossOrigin = 'anonymous'
      video.src = source
    }

    // Append briefly to trigger loading
    document.body.appendChild(video)
  })
}

// =============================================================================
// CLIENT-SIDE: GENERATE THUMBNAIL
// =============================================================================

/**
 * Generate a thumbnail from a video by capturing a frame using <canvas>.
 *
 * @param source - A File object or URL string pointing to the video
 * @param options - Configuration for thumbnail generation
 * @returns Promise resolving to ThumbnailResult
 */
export function generateVideoThumbnail(
  source: File | string,
  options: {
    /** Timestamp in seconds to capture (default: 1 second or 10% of duration) */
    timestamp?: number
    /** Maximum width for the thumbnail (maintains aspect ratio) */
    maxWidth?: number
    /** Maximum height for the thumbnail (maintains aspect ratio) */
    maxHeight?: number
    /** JPEG quality 0-1 (default: 0.85) */
    quality?: number
    /** Timeout in milliseconds (default: 30000) */
    timeoutMs?: number
  } = {}
): Promise<ThumbnailResult> {
  const {
    timestamp,
    maxWidth = 640,
    maxHeight = 360,
    quality = 0.85,
    timeoutMs = 30000,
  } = options

  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('generateVideoThumbnail requires a browser environment'))
      return
    }

    const video = document.createElement('video')
    video.preload = 'auto'
    video.muted = true
    video.playsInline = true
    video.crossOrigin = 'anonymous'

    // Prevent the video from being visible
    video.style.position = 'absolute'
    video.style.top = '-9999px'
    video.style.left = '-9999px'
    video.style.width = '1px'
    video.style.height = '1px'

    let objectUrl: string | null = null
    let timeoutId: ReturnType<typeof setTimeout> | null = null

    const cleanup = () => {
      if (timeoutId) clearTimeout(timeoutId)
      if (objectUrl) URL.revokeObjectURL(objectUrl)
      video.removeAttribute('src')
      video.load()
      if (video.parentNode) video.parentNode.removeChild(video)
    }

    // Set timeout
    timeoutId = setTimeout(() => {
      cleanup()
      reject(new Error(`Thumbnail generation timed out after ${timeoutMs}ms`))
    }, timeoutMs)

    video.onloadedmetadata = () => {
      // Determine capture timestamp
      const captureAt = timestamp ?? Math.min(1, video.duration * 0.1)
      video.currentTime = Math.min(captureAt, video.duration)
    }

    video.onseeked = () => {
      try {
        // Calculate thumbnail dimensions maintaining aspect ratio
        const { width: thumbWidth, height: thumbHeight } = calculateThumbnailDimensions(
          video.videoWidth,
          video.videoHeight,
          maxWidth,
          maxHeight
        )

        // Create canvas and capture frame
        const canvas = document.createElement('canvas')
        canvas.width = thumbWidth
        canvas.height = thumbHeight

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          cleanup()
          reject(new Error('Failed to get canvas 2D context'))
          return
        }

        ctx.drawImage(video, 0, 0, thumbWidth, thumbHeight)

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              cleanup()
              reject(new Error('Failed to generate thumbnail blob'))
              return
            }

            const dataUrl = canvas.toDataURL('image/jpeg', quality)

            cleanup()
            resolve({
              blob,
              dataUrl,
              width: thumbWidth,
              height: thumbHeight,
            })
          },
          'image/jpeg',
          quality
        )
      } catch (error) {
        cleanup()
        reject(error)
      }
    }

    video.onerror = () => {
      cleanup()
      reject(new Error('Failed to load video for thumbnail generation'))
    }

    // Set source
    if (source instanceof File) {
      objectUrl = URL.createObjectURL(source)
      video.src = objectUrl
    } else {
      video.src = source
    }

    // Append briefly to trigger loading
    document.body.appendChild(video)
  })
}

// =============================================================================
// CLIENT-SIDE: COMBINED EXTRACTION
// =============================================================================

/**
 * Extract both metadata and thumbnail in a single pass.
 * More efficient than calling extractVideoMetadata + generateVideoThumbnail separately
 * because it only loads the video once.
 *
 * @param source - A File object or URL string pointing to the video
 * @param options - Configuration options
 * @returns Promise resolving to VideoMetadataWithThumbnail
 */
export function extractVideoMetadataWithThumbnail(
  source: File | string,
  options: {
    thumbnailTimestamp?: number
    maxThumbnailWidth?: number
    maxThumbnailHeight?: number
    thumbnailQuality?: number
    timeoutMs?: number
  } = {}
): Promise<VideoMetadataWithThumbnail> {
  const {
    thumbnailTimestamp,
    maxThumbnailWidth = 640,
    maxThumbnailHeight = 360,
    thumbnailQuality = 0.85,
    timeoutMs = 30000,
  } = options

  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('extractVideoMetadataWithThumbnail requires a browser environment'))
      return
    }

    const video = document.createElement('video')
    video.preload = 'auto'
    video.muted = true
    video.playsInline = true
    video.crossOrigin = 'anonymous'

    video.style.position = 'absolute'
    video.style.top = '-9999px'
    video.style.left = '-9999px'
    video.style.width = '1px'
    video.style.height = '1px'

    let objectUrl: string | null = null
    let timeoutId: ReturnType<typeof setTimeout> | null = null
    let metadata: VideoMetadata | null = null

    const cleanup = () => {
      if (timeoutId) clearTimeout(timeoutId)
      if (objectUrl) URL.revokeObjectURL(objectUrl)
      video.removeAttribute('src')
      video.load()
      if (video.parentNode) video.parentNode.removeChild(video)
    }

    timeoutId = setTimeout(() => {
      cleanup()
      reject(new Error(`Video processing timed out after ${timeoutMs}ms`))
    }, timeoutMs)

    video.onloadedmetadata = () => {
      const format = getFormatFromSource(source)
      const codec = getCodecFromVideoElement(video)

      metadata = {
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
        codec,
        bitrate: null,
        format,
      }

      if (source instanceof File && metadata.duration > 0) {
        metadata.bitrate = Math.round((source.size * 8) / metadata.duration)
      }

      // Seek to thumbnail timestamp
      const captureAt = thumbnailTimestamp ?? Math.min(1, video.duration * 0.1)
      video.currentTime = Math.min(captureAt, video.duration)
    }

    video.onseeked = () => {
      if (!metadata) {
        cleanup()
        reject(new Error('Metadata not available at seek time'))
        return
      }

      try {
        const { width: thumbWidth, height: thumbHeight } = calculateThumbnailDimensions(
          video.videoWidth,
          video.videoHeight,
          maxThumbnailWidth,
          maxThumbnailHeight
        )

        const canvas = document.createElement('canvas')
        canvas.width = thumbWidth
        canvas.height = thumbHeight

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          cleanup()
          resolve({ ...metadata!, thumbnail: null })
          return
        }

        ctx.drawImage(video, 0, 0, thumbWidth, thumbHeight)

        canvas.toBlob(
          (blob) => {
            const thumbnail: ThumbnailResult | null = blob
              ? {
                  blob,
                  dataUrl: canvas.toDataURL('image/jpeg', thumbnailQuality),
                  width: thumbWidth,
                  height: thumbHeight,
                }
              : null

            cleanup()
            resolve({ ...metadata!, thumbnail })
          },
          'image/jpeg',
          thumbnailQuality
        )
      } catch {
        // If thumbnail fails, still return metadata
        cleanup()
        resolve({ ...metadata!, thumbnail: null })
      }
    }

    video.onerror = () => {
      cleanup()
      reject(new Error('Failed to load video'))
    }

    if (source instanceof File) {
      objectUrl = URL.createObjectURL(source)
      video.src = objectUrl
    } else {
      video.src = source
    }

    document.body.appendChild(video)
  })
}

// =============================================================================
// SERVER-SIDE: PARSE VIDEO FORMAT FROM FILE HEADER
// =============================================================================

/**
 * Parse basic video format info from file header bytes.
 * Works server-side without FFmpeg. Only detects container format.
 *
 * @param buffer - First ~32 bytes of the file
 * @returns Detected format or null
 */
export function parseVideoFormat(buffer: Buffer | Uint8Array): {
  format: string
  mimeType: string
} | null {
  const bytes = buffer instanceof Buffer ? buffer : Buffer.from(buffer)

  // MP4 / MOV / M4V — ftyp box
  if (bytes.length >= 8) {
    const ftypStr = bytes.toString('ascii', 4, 8)
    if (ftypStr === 'ftyp') {
      const brand = bytes.toString('ascii', 8, 12)
      if (brand.startsWith('qt')) {
        return { format: 'mov', mimeType: 'video/quicktime' }
      }
      if (brand === 'M4V ' || brand === 'M4VH' || brand === 'M4VP') {
        return { format: 'm4v', mimeType: 'video/x-m4v' }
      }
      return { format: 'mp4', mimeType: 'video/mp4' }
    }
  }

  // WebM — EBML header
  if (bytes.length >= 4 && bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3) {
    return { format: 'webm', mimeType: 'video/webm' }
  }

  // AVI — RIFF header
  if (bytes.length >= 12) {
    const riff = bytes.toString('ascii', 0, 4)
    const avi = bytes.toString('ascii', 8, 12)
    if (riff === 'RIFF' && avi === 'AVI ') {
      return { format: 'avi', mimeType: 'video/x-msvideo' }
    }
  }

  // OGG — OggS header
  if (bytes.length >= 4 && bytes.toString('ascii', 0, 4) === 'OggS') {
    return { format: 'ogg', mimeType: 'video/ogg' }
  }

  return null
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Calculate thumbnail dimensions maintaining aspect ratio
 * within the given max bounds.
 */
function calculateThumbnailDimensions(
  videoWidth: number,
  videoHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  if (videoWidth === 0 || videoHeight === 0) {
    return { width: maxWidth, height: maxHeight }
  }

  const aspectRatio = videoWidth / videoHeight

  let width = videoWidth
  let height = videoHeight

  // Scale down if larger than max
  if (width > maxWidth) {
    width = maxWidth
    height = Math.round(width / aspectRatio)
  }

  if (height > maxHeight) {
    height = maxHeight
    width = Math.round(height * aspectRatio)
  }

  return { width: Math.max(1, width), height: Math.max(1, height) }
}

/**
 * Extract format from file source (File object or URL string)
 */
function getFormatFromSource(source: File | string): string | null {
  let filename: string

  if (source instanceof File) {
    filename = source.name
  } else {
    try {
      const url = new URL(source)
      filename = url.pathname.split('/').pop() || ''
    } catch {
      filename = source.split('/').pop() || ''
    }
  }

  const ext = filename.split('.').pop()?.toLowerCase()
  if (!ext) return null

  const formatMap: Record<string, string> = {
    mp4: 'mp4',
    m4v: 'm4v',
    webm: 'webm',
    mov: 'mov',
    avi: 'avi',
    mkv: 'mkv',
    ogv: 'ogg',
    ogg: 'ogg',
    flv: 'flv',
    wmv: 'wmv',
    '3gp': '3gp',
  }

  return formatMap[ext] || null
}

/**
 * Try to detect codec from the video element.
 * Uses the canPlayType API to probe common codecs.
 */
function getCodecFromVideoElement(video: HTMLVideoElement): string | null {
  // Modern browsers expose media capabilities
  // We probe known codecs against the loaded video's MIME type
  const mimeType = video.currentSrc
    ? getMimeTypeFromUrl(video.currentSrc)
    : null

  if (!mimeType) return null

  // Test common codecs
  const codecTests: Array<{ codec: string; types: string[] }> = [
    { codec: 'h264', types: [`${mimeType}; codecs="avc1.42E01E"`, `${mimeType}; codecs="avc1.4D401E"`] },
    { codec: 'h265', types: [`${mimeType}; codecs="hev1.1.6.L93.B0"`, `${mimeType}; codecs="hvc1.1.6.L93.B0"`] },
    { codec: 'vp8', types: [`${mimeType}; codecs="vp8"`] },
    { codec: 'vp9', types: [`${mimeType}; codecs="vp09.00.10.08"`] },
    { codec: 'av1', types: [`${mimeType}; codecs="av01.0.01M.08"`] },
  ]

  for (const test of codecTests) {
    for (const type of test.types) {
      const result = video.canPlayType(type)
      if (result === 'probably') {
        return test.codec
      }
    }
  }

  return null
}

/**
 * Get MIME type from URL based on file extension
 */
function getMimeTypeFromUrl(url: string): string | null {
  const ext = url.split('.').pop()?.split('?')[0]?.toLowerCase()
  if (!ext) return null

  const mimeMap: Record<string, string> = {
    mp4: 'video/mp4',
    webm: 'video/webm',
    ogg: 'video/ogg',
    ogv: 'video/ogg',
    mov: 'video/quicktime',
    avi: 'video/x-msvideo',
    mkv: 'video/x-matroska',
    m4v: 'video/x-m4v',
  }

  return mimeMap[ext] || null
}

/**
 * Format duration in seconds to a human-readable string.
 * Useful for display in the media library.
 *
 * @example
 * formatDuration(125) // "2:05"
 * formatDuration(3723) // "1:02:03"
 */
export function formatDuration(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '0:00'

  const totalSeconds = Math.round(seconds)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const secs = totalSeconds % 60

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

/**
 * Check if a MIME type is a video type
 */
export function isVideoMimeType(mimeType: string): boolean {
  return mimeType.startsWith('video/')
}

/**
 * Generate a thumbnail filename for a given media filename.
 *
 * @example
 * getThumbnailFilename('my-video.mp4') // 'my-video-thumb.jpg'
 */
export function getThumbnailFilename(originalFilename: string): string {
  const nameParts = originalFilename.split('.')
  if (nameParts.length > 1) {
    nameParts.pop() // Remove original extension
  }
  return `${nameParts.join('.')}-thumb.jpg`
}
