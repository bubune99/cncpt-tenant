/**
 * S3/R2 Multipart (Chunked) Upload Utilities
 *
 * Enables uploading large files (100MB+ videos) with resumable uploads.
 * Uses the DB-driven S3 client and tenant-scoped key generation from client.ts.
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
import { getS3Client, getStorageConfig } from './client'

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
  const config = await getStorageConfig()
  if (!config.isConfigured) {
    throw new Error('Storage is not configured. Configure via Admin > Settings > Storage or set env vars.')
  }

  const client = await getS3Client()

  const command = new CreateMultipartUploadCommand({
    Bucket: config.bucketName,
    Key: key,
    ContentType: contentType,
    CacheControl: 'public, max-age=31536000, immutable',
  })

  const response = await client.send(command)

  if (!response.UploadId) {
    throw new Error('Failed to initiate multipart upload: no UploadId returned')
  }

  return {
    uploadId: response.UploadId,
    key,
    bucket: config.bucketName,
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
  const config = await getStorageConfig()
  if (!config.isConfigured) {
    throw new Error('Storage is not configured. Configure via Admin > Settings > Storage or set env vars.')
  }

  if (partNumber < 1 || partNumber > MAX_PARTS) {
    throw new Error(`Part number must be between 1 and ${MAX_PARTS}`)
  }

  const client = await getS3Client()

  const command = new UploadPartCommand({
    Bucket: config.bucketName,
    Key: key,
    UploadId: uploadId,
    PartNumber: partNumber,
  })

  const url = await getSignedUrl(client as unknown as Parameters<typeof getSignedUrl>[0], command as unknown as Parameters<typeof getSignedUrl>[1], {
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
  const config = await getStorageConfig()
  if (!config.isConfigured) {
    throw new Error('Storage is not configured. Configure via Admin > Settings > Storage or set env vars.')
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

  const client = await getS3Client()

  const command = new CompleteMultipartUploadCommand({
    Bucket: config.bucketName,
    Key: key,
    UploadId: uploadId,
    MultipartUpload: {
      Parts: sortedParts.map((part) => ({
        PartNumber: part.partNumber,
        ETag: part.etag,
      })),
    },
  })

  await client.send(command)

  const publicUrl = `${config.publicUrl}/${key}`

  return {
    url: publicUrl,
    key,
    bucket: config.bucketName,
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
  const config = await getStorageConfig()
  if (!config.isConfigured) {
    throw new Error('Storage is not configured. Configure via Admin > Settings > Storage or set env vars.')
  }

  const client = await getS3Client()

  const command = new AbortMultipartUploadCommand({
    Bucket: config.bucketName,
    Key: key,
    UploadId: uploadId,
  })

  await client.send(command)
}
