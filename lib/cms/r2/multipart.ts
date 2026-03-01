/**
 * S3/R2 Multipart (Chunked) Upload Utilities
 *
 * Enables uploading large files (100MB+ videos) with resumable uploads.
 * Uses the existing S3 client and tenant-scoped key generation from client.ts.
 *
 * Flow:
 * 1. Client calls initiateMultipartUpload() to start
 * 2. Client requests presigned URLs for each chunk via generatePartPresignedUrl()
 * 3. Client uploads chunks directly to S3/R2 using presigned URLs
 * 4. Client calls completeMultipartUpload() with ETags from each part
 * 5. On failure, client calls abortMultipartUpload() to cleanup
 *
 * Chunk size: 10MB (S3 minimum is 5MB, except for the last part)
 */

import {
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { r2Client, R2_CONFIG } from './client'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Default chunk size: 10MB */
export const DEFAULT_CHUNK_SIZE = 10 * 1024 * 1024

/** Minimum chunk size: 5MB (S3 minimum, except for last part) */
export const MIN_CHUNK_SIZE = 5 * 1024 * 1024

/** Maximum number of parts per upload (S3 limit is 10,000) */
export const MAX_PARTS = 10_000

/** Presigned URL expiry: 1 hour */
const PRESIGN_EXPIRY_SECONDS = 3600

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MultipartUploadInit {
  uploadId: string
  key: string
  bucket: string
}

export interface CompletedPart {
  partNumber: number
  etag: string
}

export interface MultipartPresignedUrl {
  url: string
  partNumber: number
}

// ---------------------------------------------------------------------------
// Initiate Multipart Upload
// ---------------------------------------------------------------------------

/**
 * Start a multipart upload session.
 *
 * @param key - The full S3/R2 key (tenant-scoped, e.g. tenants/foo/media/videos/123-file.mp4)
 * @param contentType - MIME type of the file being uploaded
 * @returns Upload ID and key needed for subsequent operations
 */
export async function initiateMultipartUpload(
  key: string,
  contentType: string
): Promise<MultipartUploadInit> {
  if (!R2_CONFIG.isConfigured) {
    throw new Error('R2/S3 storage is not configured')
  }

  const command = new CreateMultipartUploadCommand({
    Bucket: R2_CONFIG.bucketName,
    Key: key,
    ContentType: contentType,
    CacheControl: 'public, max-age=31536000, immutable',
  })

  const response = await r2Client.send(command)

  if (!response.UploadId) {
    throw new Error('Failed to initiate multipart upload: no UploadId returned')
  }

  return {
    uploadId: response.UploadId,
    key,
    bucket: R2_CONFIG.bucketName,
  }
}

// ---------------------------------------------------------------------------
// Generate Presigned URL for a Single Part
// ---------------------------------------------------------------------------

/**
 * Generate a presigned URL for uploading a single chunk/part.
 *
 * The client uses this URL to PUT the chunk data directly to S3/R2,
 * bypassing our server for the heavy data transfer.
 *
 * @param key - The full S3/R2 key (must match the key from initiateMultipartUpload)
 * @param uploadId - The upload ID from initiateMultipartUpload
 * @param partNumber - The part number (1-indexed, max 10,000)
 * @returns Presigned URL for uploading this part
 */
export async function generatePartPresignedUrl(
  key: string,
  uploadId: string,
  partNumber: number
): Promise<MultipartPresignedUrl> {
  if (!R2_CONFIG.isConfigured) {
    throw new Error('R2/S3 storage is not configured')
  }

  if (partNumber < 1 || partNumber > MAX_PARTS) {
    throw new Error(`Part number must be between 1 and ${MAX_PARTS}`)
  }

  const command = new UploadPartCommand({
    Bucket: R2_CONFIG.bucketName,
    Key: key,
    UploadId: uploadId,
    PartNumber: partNumber,
  })

  const url = await getSignedUrl(r2Client, command, {
    expiresIn: PRESIGN_EXPIRY_SECONDS,
  })

  return { url, partNumber }
}

// ---------------------------------------------------------------------------
// Complete Multipart Upload
// ---------------------------------------------------------------------------

/**
 * Finalize a multipart upload after all parts have been uploaded.
 *
 * S3/R2 assembles the parts into the final object. The parts array must include
 * every part number and its corresponding ETag (returned by S3 in the response
 * headers when each part was uploaded).
 *
 * @param key - The full S3/R2 key
 * @param uploadId - The upload ID from initiateMultipartUpload
 * @param parts - Array of { partNumber, etag } for all uploaded parts
 * @returns The public URL of the completed upload
 */
export async function completeMultipartUpload(
  key: string,
  uploadId: string,
  parts: CompletedPart[]
): Promise<{ url: string; key: string; bucket: string }> {
  if (!R2_CONFIG.isConfigured) {
    throw new Error('R2/S3 storage is not configured')
  }

  if (parts.length === 0) {
    throw new Error('At least one part is required to complete upload')
  }

  // Sort parts by part number (S3 requires sorted order)
  const sortedParts = [...parts].sort((a, b) => a.partNumber - b.partNumber)

  // Validate part numbers are sequential starting from 1
  for (let i = 0; i < sortedParts.length; i++) {
    if (sortedParts[i].partNumber !== i + 1) {
      throw new Error(
        `Missing part number ${i + 1}. Parts must be sequential starting from 1.`
      )
    }
  }

  const command = new CompleteMultipartUploadCommand({
    Bucket: R2_CONFIG.bucketName,
    Key: key,
    UploadId: uploadId,
    MultipartUpload: {
      Parts: sortedParts.map((part) => ({
        PartNumber: part.partNumber,
        ETag: part.etag,
      })),
    },
  })

  await r2Client.send(command)

  const publicUrl = `${R2_CONFIG.publicUrl}/${key}`

  return {
    url: publicUrl,
    key,
    bucket: R2_CONFIG.bucketName,
  }
}

// ---------------------------------------------------------------------------
// Abort Multipart Upload
// ---------------------------------------------------------------------------

/**
 * Abort/cancel a multipart upload and clean up any uploaded parts.
 *
 * Call this when an upload fails or is cancelled by the user.
 * S3/R2 will delete any already-uploaded parts to free storage.
 *
 * @param key - The full S3/R2 key
 * @param uploadId - The upload ID from initiateMultipartUpload
 */
export async function abortMultipartUpload(
  key: string,
  uploadId: string
): Promise<void> {
  if (!R2_CONFIG.isConfigured) {
    throw new Error('R2/S3 storage is not configured')
  }

  const command = new AbortMultipartUploadCommand({
    Bucket: R2_CONFIG.bucketName,
    Key: key,
    UploadId: uploadId,
  })

  await r2Client.send(command)
}
