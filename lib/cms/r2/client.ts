/**
 * Cloudflare R2 / S3-Compatible Storage Client
 *
 * DB-driven configuration with env var fallback.
 * Uses getStorageSettings() from the settings system, so credentials
 * stored in the database (encrypted) take precedence over env vars.
 *
 * Multi-Tenant Storage Schema:
 * tenants/{subdomain}/
 * ├── media/
 * │   ├── images/       # General images
 * │   ├── documents/    # PDFs, docs
 * │   ├── videos/       # Video files
 * │   └── thumbnails/   # Auto-generated video thumbnails
 * ├── products/         # Product images
 * ├── blog/             # Blog post images
 * ├── pages/            # Page builder assets
 * └── avatars/          # User/team avatars
 */

import {
  S3Client,
  ListObjectsV2Command,
  PutObjectCommand,
  DeleteObjectCommand,
  CopyObjectCommand,
  HeadBucketCommand,
} from "@aws-sdk/client-s3";
import { getStorageSettings } from '../settings';
import type { StorageSettings } from '../settings/types';

// ---------------------------------------------------------------------------
// S3 Client Factory (DB-driven, cached with invalidation)
// ---------------------------------------------------------------------------

let _cachedClient: S3Client | null = null;
let _cachedConfig: StorageResolvedConfig | null = null;
let _cacheTimestamp = 0;
const CLIENT_CACHE_TTL = 60 * 1000; // 1 minute — matches settings cache TTL

export interface StorageResolvedConfig {
  bucketName: string;
  publicUrl: string;
  endpoint: string;
  region: string;
  isConfigured: boolean;
  provider: 's3' | 'r2' | 'local';
}

/**
 * Get a configured S3 client using DB settings with env var fallback.
 * The client is cached for 1 minute and recreated when settings change.
 */
export async function getS3Client(): Promise<S3Client> {
  const now = Date.now();
  if (_cachedClient && now - _cacheTimestamp < CLIENT_CACHE_TTL) {
    return _cachedClient;
  }

  const settings = await getStorageSettings();

  _cachedClient = new S3Client({
    region: settings.region || 'auto',
    endpoint: settings.endpoint || undefined,
    credentials: {
      accessKeyId: settings.accessKeyId || '',
      secretAccessKey: settings.secretAccessKey || '',
    },
    forcePathStyle: settings.forcePathStyle ?? (settings.provider === 'r2'),
  });

  _cacheTimestamp = now;
  return _cachedClient;
}

/**
 * Get the resolved storage configuration from DB/env.
 * Cached alongside the S3 client.
 */
export async function getStorageConfig(): Promise<StorageResolvedConfig> {
  const now = Date.now();
  if (_cachedConfig && now - _cacheTimestamp < CLIENT_CACHE_TTL) {
    return _cachedConfig;
  }

  const settings = await getStorageSettings();

  _cachedConfig = {
    bucketName: settings.bucket || '',
    publicUrl: (settings.publicUrl || '').replace(/\/$/, ''),
    endpoint: settings.endpoint || '',
    region: settings.region || 'auto',
    isConfigured: Boolean(
      settings.accessKeyId &&
      settings.secretAccessKey &&
      settings.bucket &&
      (settings.provider !== 'r2' || settings.endpoint)
    ),
    provider: settings.provider || 's3',
  };

  return _cachedConfig;
}

/**
 * Invalidate the cached S3 client and config.
 * Call this after storage settings are updated via the admin API.
 */
export function invalidateStorageClient(): void {
  if (_cachedClient) {
    _cachedClient.destroy();
  }
  _cachedClient = null;
  _cachedConfig = null;
  _cacheTimestamp = 0;
}

// ---------------------------------------------------------------------------
// Legacy exports — kept for backwards compatibility
// ---------------------------------------------------------------------------

/**
 * @deprecated Use getS3Client() instead. This is kept for code that imports r2Client directly.
 * Falls back to env vars for module-level initialization (non-async context).
 */
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || "";
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || "";
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || "";
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || process.env.R2_BUCKET || "cms-images";
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || "";

/** @deprecated Use getS3Client() instead */
export const r2Client = new S3Client({
  region: "auto",
  endpoint: R2_ACCOUNT_ID ? `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com` : undefined,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

/** @deprecated Use getStorageConfig() instead */
export const R2_CONFIG = {
  bucketName: R2_BUCKET_NAME,
  publicUrl: R2_PUBLIC_URL,
  isConfigured: Boolean(R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY),
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

// Media categories for organizing uploads within a tenant
export type MediaCategory =
  | 'media/images'
  | 'media/documents'
  | 'media/videos'
  | 'media/thumbnails'
  | 'products'
  | 'blog'
  | 'pages'
  | 'avatars';

export interface R2Media {
  key: string;
  url: string;
  name: string;
  category: MediaCategory | string;
  subdomain: string;
  size?: number;
  lastModified?: Date;
  contentType?: string;
}

// Legacy interface for backwards compatibility
export interface R2Image {
  key: string;
  url: string;
  name: string;
  category: string;
  size?: number;
  lastModified?: Date;
}

// ---------------------------------------------------------------------------
// Path Utilities
// ---------------------------------------------------------------------------

/**
 * Build a tenant-scoped storage path
 */
export function buildTenantPath(subdomain: string, category: MediaCategory, filename: string): string {
  const sanitizedSubdomain = subdomain.toLowerCase().replace(/[^a-z0-9-]/g, '');
  const timestamp = Date.now();
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `tenants/${sanitizedSubdomain}/${category}/${timestamp}-${sanitizedFilename}`;
}

/**
 * Extract tenant info from a storage key
 */
export function parseTenantPath(key: string): { subdomain: string; category: string; filename: string } | null {
  const match = key.match(/^tenants\/([^/]+)\/(.+)\/([^/]+)$/);
  if (!match) return null;
  return {
    subdomain: match[1],
    category: match[2],
    filename: match[3],
  };
}

// ---------------------------------------------------------------------------
// Content Type Helper
// ---------------------------------------------------------------------------

/**
 * Get content type from file extension
 */
function getContentType(ext: string): string {
  const types: Record<string, string> = {
    // Images
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    ico: 'image/x-icon',
    // Documents
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    // Videos
    mp4: 'video/mp4',
    webm: 'video/webm',
    mov: 'video/quicktime',
    // Audio
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
  };
  return types[ext] || 'application/octet-stream';
}

// ---------------------------------------------------------------------------
// Tenant Media Operations (DB-driven)
// ---------------------------------------------------------------------------

/**
 * List media for a specific tenant
 * @param subdomain - The tenant's subdomain
 * @param category - Optional category filter (e.g., 'media/images', 'products')
 * @param options - Additional options like maxKeys and continuationToken
 */
export async function listTenantMedia(
  subdomain: string,
  category?: MediaCategory,
  options?: { maxKeys?: number; continuationToken?: string }
): Promise<{ media: R2Media[]; nextToken?: string }> {
  const config = await getStorageConfig();
  if (!config.isConfigured) {
    console.warn("Storage is not configured. Configure via Admin > Settings > Storage or set env vars.");
    return { media: [] };
  }

  const client = await getS3Client();
  const sanitizedSubdomain = subdomain.toLowerCase().replace(/[^a-z0-9-]/g, '');
  const prefix = category
    ? `tenants/${sanitizedSubdomain}/${category}/`
    : `tenants/${sanitizedSubdomain}/`;

  try {
    const command = new ListObjectsV2Command({
      Bucket: config.bucketName,
      Prefix: prefix,
      MaxKeys: options?.maxKeys || 100,
      ContinuationToken: options?.continuationToken,
    });

    const response = await client.send(command);
    const media: R2Media[] = [];

    for (const obj of response.Contents || []) {
      if (!obj.Key) continue;

      const parsed = parseTenantPath(obj.Key);
      if (!parsed) continue;

      // Determine content type from extension
      const ext = parsed.filename.split('.').pop()?.toLowerCase() || '';
      const contentType = getContentType(ext);

      media.push({
        key: obj.Key,
        url: `${config.publicUrl}/${obj.Key}`,
        name: parsed.filename,
        category: parsed.category,
        subdomain: parsed.subdomain,
        size: obj.Size,
        lastModified: obj.LastModified,
        contentType,
      });
    }

    return {
      media,
      nextToken: response.NextContinuationToken,
    };
  } catch (error) {
    console.error("Error listing tenant media:", error);
    return { media: [] };
  }
}

/**
 * List images from bucket (legacy function for backwards compatibility)
 * Images are organized by prefix/folder (e.g., "heroes/", "features/", "team/")
 */
export async function listImages(prefix?: string): Promise<R2Image[]> {
  const config = await getStorageConfig();
  if (!config.isConfigured) {
    console.warn("Storage is not configured. Configure via Admin > Settings > Storage or set env vars.");
    return [];
  }

  const client = await getS3Client();

  try {
    const command = new ListObjectsV2Command({
      Bucket: config.bucketName,
      Prefix: prefix || "",
      MaxKeys: 100,
    });

    const response = await client.send(command);
    const images: R2Image[] = [];

    for (const obj of response.Contents || []) {
      if (!obj.Key) continue;

      // Skip if not an image
      const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(obj.Key);
      if (!isImage) continue;

      // Extract category from path (e.g., "heroes/image.jpg" -> "heroes")
      const parts = obj.Key.split("/");
      const category = parts.length > 1 ? parts[0] : "uncategorized";
      const name = parts[parts.length - 1];

      images.push({
        key: obj.Key,
        url: `${config.publicUrl}/${obj.Key}`,
        name,
        category,
        size: obj.Size,
        lastModified: obj.LastModified,
      });
    }

    return images;
  } catch (error) {
    console.error("Error listing images:", error);
    return [];
  }
}

/**
 * Upload media for a specific tenant
 * @param subdomain - The tenant's subdomain
 * @param file - File buffer to upload
 * @param filename - Original filename
 * @param category - Media category (e.g., 'media/images', 'products')
 * @param contentType - MIME type of the file
 */
export async function uploadTenantMedia(
  subdomain: string,
  file: Buffer,
  filename: string,
  category: MediaCategory = 'media/images',
  contentType?: string
): Promise<R2Media | null> {
  const config = await getStorageConfig();
  if (!config.isConfigured) {
    console.warn("Storage is not configured");
    return null;
  }

  const client = await getS3Client();

  try {
    const key = buildTenantPath(subdomain, category, filename);
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    const mimeType = contentType || getContentType(ext);

    const command = new PutObjectCommand({
      Bucket: config.bucketName,
      Key: key,
      Body: file,
      ContentType: mimeType,
      // Add cache control for CDN optimization
      CacheControl: 'public, max-age=31536000, immutable',
    });

    await client.send(command);

    const sanitizedSubdomain = subdomain.toLowerCase().replace(/[^a-z0-9-]/g, '');

    return {
      key,
      url: `${config.publicUrl}/${key}`,
      name: filename,
      category,
      subdomain: sanitizedSubdomain,
      contentType: mimeType,
    };
  } catch (error) {
    console.error("Error uploading tenant media:", error);
    return null;
  }
}

/**
 * Upload an image to bucket (legacy function for backwards compatibility)
 */
export async function uploadImage(
  file: Buffer,
  filename: string,
  category: string = "uploads",
  contentType: string = "image/jpeg"
): Promise<R2Image | null> {
  const config = await getStorageConfig();
  if (!config.isConfigured) {
    console.warn("Storage is not configured");
    return null;
  }

  const client = await getS3Client();

  try {
    const key = `${category}/${Date.now()}-${filename}`;

    const command = new PutObjectCommand({
      Bucket: config.bucketName,
      Key: key,
      Body: file,
      ContentType: contentType,
    });

    await client.send(command);

    return {
      key,
      url: `${config.publicUrl}/${key}`,
      name: filename,
      category,
    };
  } catch (error) {
    console.error("Error uploading image:", error);
    return null;
  }
}

/**
 * Delete tenant media - ensures the key belongs to the specified tenant
 * @param subdomain - The tenant's subdomain
 * @param key - The full storage key to delete
 */
export async function deleteTenantMedia(subdomain: string, key: string): Promise<boolean> {
  const config = await getStorageConfig();
  if (!config.isConfigured) {
    return false;
  }

  // Verify the key belongs to this tenant
  const parsed = parseTenantPath(key);
  const sanitizedSubdomain = subdomain.toLowerCase().replace(/[^a-z0-9-]/g, '');

  if (!parsed || parsed.subdomain !== sanitizedSubdomain) {
    console.error("Attempted to delete media from another tenant");
    return false;
  }

  const client = await getS3Client();

  try {
    const command = new DeleteObjectCommand({
      Bucket: config.bucketName,
      Key: key,
    });

    await client.send(command);
    return true;
  } catch (error) {
    console.error("Error deleting tenant media:", error);
    return false;
  }
}

/**
 * Delete an image from bucket (legacy function)
 */
export async function deleteImage(key: string): Promise<boolean> {
  const config = await getStorageConfig();
  if (!config.isConfigured) {
    return false;
  }

  const client = await getS3Client();

  try {
    const command = new DeleteObjectCommand({
      Bucket: config.bucketName,
      Key: key,
    });

    await client.send(command);
    return true;
  } catch (error) {
    console.error("Error deleting image:", error);
    return false;
  }
}

/**
 * Get categories for a specific tenant
 * @param subdomain - The tenant's subdomain
 */
export async function getTenantCategories(subdomain: string): Promise<MediaCategory[]> {
  const config = await getStorageConfig();
  if (!config.isConfigured) {
    return [];
  }

  const client = await getS3Client();
  const sanitizedSubdomain = subdomain.toLowerCase().replace(/[^a-z0-9-]/g, '');
  const prefix = `tenants/${sanitizedSubdomain}/`;

  try {
    const command = new ListObjectsV2Command({
      Bucket: config.bucketName,
      Prefix: prefix,
      Delimiter: "/",
    });

    const response = await client.send(command);
    const categories: MediaCategory[] = [];

    for (const commonPrefix of response.CommonPrefixes || []) {
      if (commonPrefix.Prefix) {
        // Extract category from path like "tenants/subdomain/media/" -> "media"
        const cat = commonPrefix.Prefix.replace(prefix, '').replace(/\/$/, '');
        if (cat) {
          categories.push(cat as MediaCategory);
        }
      }
    }

    return categories;
  } catch (error) {
    console.error("Error getting tenant categories:", error);
    return [];
  }
}

/**
 * Get image categories (top-level folders) - legacy function
 */
export async function getCategories(): Promise<string[]> {
  const config = await getStorageConfig();
  if (!config.isConfigured) {
    return [];
  }

  const client = await getS3Client();

  try {
    const command = new ListObjectsV2Command({
      Bucket: config.bucketName,
      Delimiter: "/",
    });

    const response = await client.send(command);
    const categories: string[] = [];

    for (const prefix of response.CommonPrefixes || []) {
      if (prefix.Prefix) {
        categories.push(prefix.Prefix.replace("/", ""));
      }
    }

    return categories;
  } catch (error) {
    console.error("Error getting categories:", error);
    return [];
  }
}

/**
 * Copy media to a different tenant (useful for templates or migrations)
 * @param sourceSubdomain - Source tenant
 * @param targetSubdomain - Target tenant
 * @param sourceKey - The key to copy
 */
export async function copyTenantMedia(
  sourceSubdomain: string,
  targetSubdomain: string,
  sourceKey: string
): Promise<R2Media | null> {
  const config = await getStorageConfig();
  if (!config.isConfigured) {
    return null;
  }

  const parsed = parseTenantPath(sourceKey);
  if (!parsed) {
    console.error("Invalid source key format");
    return null;
  }

  const sanitizedSource = sourceSubdomain.toLowerCase().replace(/[^a-z0-9-]/g, '');
  if (parsed.subdomain !== sanitizedSource) {
    console.error("Source key does not belong to the specified tenant");
    return null;
  }

  const client = await getS3Client();

  try {
    const newKey = buildTenantPath(targetSubdomain, parsed.category as MediaCategory, parsed.filename);

    const command = new CopyObjectCommand({
      Bucket: config.bucketName,
      CopySource: `${config.bucketName}/${sourceKey}`,
      Key: newKey,
    });

    await client.send(command);

    const sanitizedTarget = targetSubdomain.toLowerCase().replace(/[^a-z0-9-]/g, '');

    return {
      key: newKey,
      url: `${config.publicUrl}/${newKey}`,
      name: parsed.filename,
      category: parsed.category,
      subdomain: sanitizedTarget,
    };
  } catch (error) {
    console.error("Error copying tenant media:", error);
    return null;
  }
}

/**
 * Get storage usage for a tenant
 * @param subdomain - The tenant's subdomain
 */
export async function getTenantStorageUsage(subdomain: string): Promise<{
  totalSize: number;
  fileCount: number;
  byCategory: Record<string, { size: number; count: number }>;
}> {
  const config = await getStorageConfig();
  if (!config.isConfigured) {
    return { totalSize: 0, fileCount: 0, byCategory: {} };
  }

  const client = await getS3Client();
  const sanitizedSubdomain = subdomain.toLowerCase().replace(/[^a-z0-9-]/g, '');
  const prefix = `tenants/${sanitizedSubdomain}/`;

  let totalSize = 0;
  let fileCount = 0;
  const byCategory: Record<string, { size: number; count: number }> = {};
  let continuationToken: string | undefined;

  try {
    do {
      const command = new ListObjectsV2Command({
        Bucket: config.bucketName,
        Prefix: prefix,
        MaxKeys: 1000,
        ContinuationToken: continuationToken,
      });

      const response = await client.send(command);

      for (const obj of response.Contents || []) {
        if (!obj.Key || !obj.Size) continue;

        const parsed = parseTenantPath(obj.Key);
        if (!parsed) continue;

        totalSize += obj.Size;
        fileCount++;

        if (!byCategory[parsed.category]) {
          byCategory[parsed.category] = { size: 0, count: 0 };
        }
        byCategory[parsed.category].size += obj.Size;
        byCategory[parsed.category].count++;
      }

      continuationToken = response.NextContinuationToken;
    } while (continuationToken);

    return { totalSize, fileCount, byCategory };
  } catch (error) {
    console.error("Error getting tenant storage usage:", error);
    return { totalSize: 0, fileCount: 0, byCategory: {} };
  }
}

// ---------------------------------------------------------------------------
// Test Connection
// ---------------------------------------------------------------------------

/**
 * Test the S3/R2 storage connection by attempting a HeadBucket request.
 * Uses the current DB settings (or env var fallback).
 */
export async function testStorageConnection(): Promise<{
  success: boolean;
  message: string;
  provider: string;
  bucket: string;
}> {
  const config = await getStorageConfig();

  if (!config.isConfigured) {
    return {
      success: false,
      message: 'Storage is not configured. Please provide bucket, credentials, and endpoint.',
      provider: config.provider,
      bucket: config.bucketName,
    };
  }

  const client = await getS3Client();

  try {
    await client.send(new HeadBucketCommand({ Bucket: config.bucketName }));
    return {
      success: true,
      message: `Successfully connected to ${config.provider.toUpperCase()} bucket "${config.bucketName}".`,
      provider: config.provider,
      bucket: config.bucketName,
    };
  } catch (error: any) {
    let message = 'Connection failed: ';
    if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
      message += `Bucket "${config.bucketName}" not found.`;
    } else if (error.name === 'Forbidden' || error.$metadata?.httpStatusCode === 403) {
      message += 'Access denied. Check your credentials and bucket permissions.';
    } else if (error.name === 'CredentialsProviderError' || error.message?.includes('credentials')) {
      message += 'Invalid credentials. Check your Access Key ID and Secret Access Key.';
    } else {
      message += error.message || 'Unknown error.';
    }

    return {
      success: false,
      message,
      provider: config.provider,
      bucket: config.bucketName,
    };
  }
}
