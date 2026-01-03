/**
 * Media Upload Handling
 *
 * Supports S3, R2, and local storage providers
 */

import { getStorageSettings } from '@/lib/settings'
import type { StorageSettings } from '@/lib/settings/types'
import type { StorageProvider, PresignedUrlResponse, UploadOptions } from './types'
import { createMedia } from './index'
import { v4 as uuidv4 } from 'uuid'

// =============================================================================
// STORAGE CONFIGURATION CHECK
// =============================================================================

export interface StorageConfigStatus {
  configured: boolean
  provider: string
  missingFields: string[]
  message: string
}

/**
 * Check if storage is properly configured
 */
export async function checkStorageConfig(): Promise<StorageConfigStatus> {
  const settings = await getStorageSettings()
  const provider = (settings.provider || 'local').toUpperCase()
  const missingFields: string[] = []

  if (provider === 'S3' || provider === 'R2') {
    if (!settings.bucket) missingFields.push('bucket')
    if (!settings.accessKeyId) missingFields.push('accessKeyId')
    if (!settings.secretAccessKey) missingFields.push('secretAccessKey')
    if (provider === 'S3' && !settings.region) missingFields.push('region')
    if (provider === 'R2' && !settings.endpoint) missingFields.push('endpoint')
  }

  const configured = missingFields.length === 0

  let message = ''
  if (!configured) {
    if (provider === 'S3') {
      message = `S3 storage is not configured. Please add your AWS S3 credentials in Settings > Storage. Missing: ${missingFields.join(', ')}`
    } else if (provider === 'R2') {
      message = `Cloudflare R2 storage is not configured. Please add your R2 credentials in Settings > Storage. Missing: ${missingFields.join(', ')}`
    } else {
      message = 'Storage provider is not properly configured.'
    }
  }

  return {
    configured,
    provider,
    missingFields,
    message,
  }
}

// =============================================================================
// GENERATE PRESIGNED URL
// =============================================================================

export async function generatePresignedUrl(
  filename: string,
  mimeType: string,
  size: number
): Promise<PresignedUrlResponse> {
  const settings = await getStorageSettings()
  const provider = (settings.provider || 'local').toUpperCase() as StorageProvider

  // Check storage configuration before proceeding
  if (provider === 'S3' || provider === 'R2') {
    const configStatus = await checkStorageConfig()
    if (!configStatus.configured) {
      throw new Error(configStatus.message)
    }
  }

  // Generate unique key
  const ext = filename.split('.').pop() || ''
  const key = `uploads/${new Date().toISOString().slice(0, 10)}/${uuidv4()}.${ext}`

  switch (provider) {
    case 'S3':
    case 'R2':
      return generateS3PresignedUrl(key, mimeType, size, settings, provider)
    case 'LOCAL':
      return generateLocalUploadUrl(key, settings)
    default:
      // Fall back to local if provider is not recognized
      return generateLocalUploadUrl(key, settings)
  }
}

// =============================================================================
// S3/R2 PRESIGNED URL
// =============================================================================

async function generateS3PresignedUrl(
  key: string,
  mimeType: string,
  size: number,
  settings: any,
  provider: StorageProvider
): Promise<PresignedUrlResponse> {
  // Dynamic import to avoid bundling AWS SDK in client
  const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3')
  const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner')

  const client = new S3Client({
    region: settings.region || 'auto',
    endpoint: settings.endpoint,
    credentials: {
      accessKeyId: settings.accessKeyId!,
      secretAccessKey: settings.secretAccessKey!,
    },
    forcePathStyle: provider === 'R2', // R2 requires path style
  })

  const command = new PutObjectCommand({
    Bucket: settings.bucket,
    Key: key,
    ContentType: mimeType,
    ContentLength: size,
  })

  const uploadUrl = await getSignedUrl(client, command, { expiresIn: 3600 })

  // Build public URL
  let publicUrl: string
  if (settings.publicUrl) {
    publicUrl = `${settings.publicUrl.replace(/\/$/, '')}/${key}`
  } else if (settings.endpoint) {
    publicUrl = `${settings.endpoint}/${settings.bucket}/${key}`
  } else {
    publicUrl = `https://${settings.bucket}.s3.${settings.region}.amazonaws.com/${key}`
  }

  return {
    uploadUrl,
    key,
    bucket: settings.bucket!,
    provider,
    publicUrl,
  }
}

// =============================================================================
// LOCAL UPLOAD URL
// =============================================================================

async function generateLocalUploadUrl(
  key: string,
  settings: any
): Promise<PresignedUrlResponse> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  return {
    uploadUrl: `${baseUrl}/api/media/upload/local`,
    key,
    bucket: 'local',
    provider: 'LOCAL',
    publicUrl: `${baseUrl}/uploads/${key}`,
  }
}

// =============================================================================
// PROCESS UPLOAD (after file is uploaded to storage)
// =============================================================================

export async function processUpload(
  filename: string,
  originalName: string,
  mimeType: string,
  size: number,
  url: string,
  key: string,
  bucket: string,
  provider: StorageProvider,
  options: UploadOptions = {},
  uploadedById?: string
) {
  // Get image dimensions if applicable
  let width: number | undefined
  let height: number | undefined

  if (mimeType.startsWith('image/')) {
    const dimensions = await getImageDimensions(url)
    if (dimensions) {
      width = dimensions.width
      height = dimensions.height
    }
  }

  // Create media record
  const media = await createMedia({
    filename,
    originalName,
    mimeType,
    size,
    url,
    width,
    height,
    provider,
    bucket,
    key,
    folderId: options.folderId,
    alt: options.alt,
    caption: options.caption,
    title: options.title || originalName,
    tagIds: options.tagIds,
    uploadedById,
  })

  return media
}

// =============================================================================
// DELETE FROM STORAGE
// =============================================================================

export async function deleteFromStorage(
  key: string,
  bucket: string,
  provider: StorageProvider
): Promise<void> {
  const settings = await getStorageSettings()

  switch (provider) {
    case 'S3':
    case 'R2':
      await deleteFromS3(key, bucket, settings, provider)
      break
    case 'LOCAL':
      await deleteLocalFile(key)
      break
    default:
      throw new Error(`Unsupported storage provider: ${provider}`)
  }
}

async function deleteFromS3(
  key: string,
  bucket: string,
  settings: any,
  provider: StorageProvider
): Promise<void> {
  const { S3Client, DeleteObjectCommand } = await import('@aws-sdk/client-s3')

  const client = new S3Client({
    region: settings.region || 'auto',
    endpoint: settings.endpoint,
    credentials: {
      accessKeyId: settings.accessKeyId!,
      secretAccessKey: settings.secretAccessKey!,
    },
    forcePathStyle: provider === 'R2',
  })

  await client.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    })
  )
}

async function deleteLocalFile(key: string): Promise<void> {
  const fs = await import('fs/promises')
  const path = await import('path')

  const filePath = path.join(process.cwd(), 'public', 'uploads', key)

  try {
    await fs.unlink(filePath)
  } catch (error: any) {
    if (error.code !== 'ENOENT') {
      throw error
    }
  }
}

// =============================================================================
// GET IMAGE DIMENSIONS
// =============================================================================

async function getImageDimensions(
  url: string
): Promise<{ width: number; height: number } | null> {
  try {
    // For server-side, we could use sharp or probe-image-size
    // For now, return null and let the client provide dimensions
    return null
  } catch (error) {
    console.error('Failed to get image dimensions:', error)
    return null
  }
}

// =============================================================================
// VALIDATE FILE
// =============================================================================

export function validateFile(
  file: { name: string; type: string; size: number },
  options: {
    maxSize?: number
    allowedTypes?: string[]
  } = {}
): { valid: boolean; error?: string } {
  const { maxSize = 50 * 1024 * 1024, allowedTypes } = options

  // Check size
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds maximum of ${formatBytes(maxSize)}`,
    }
  }

  // Check type
  if (allowedTypes && allowedTypes.length > 0) {
    const isAllowed = allowedTypes.some((type) => {
      if (type.endsWith('/*')) {
        const prefix = type.slice(0, -2)
        return file.type.startsWith(prefix)
      }
      return file.type === type
    })

    if (!isAllowed) {
      return {
        valid: false,
        error: `File type ${file.type} is not allowed`,
      }
    }
  }

  return { valid: true }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
