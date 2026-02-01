/**
 * Cloudflare R2 Client Configuration
 *
 * R2 is S3-compatible, so we use the AWS SDK with R2's endpoint.
 *
 * Multi-Tenant Storage Schema:
 * tenants/{subdomain}/
 * ├── media/
 * │   ├── images/       # General images
 * │   ├── documents/    # PDFs, docs
 * │   └── videos/       # Video files
 * ├── products/         # Product images
 * ├── blog/             # Blog post images
 * ├── pages/            # Page builder assets
 * └── avatars/          # User/team avatars
 */

import { S3Client, ListObjectsV2Command, PutObjectCommand, DeleteObjectCommand, CopyObjectCommand } from "@aws-sdk/client-s3";

// R2 credentials from environment variables
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || "";
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || "";
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || "";
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || process.env.R2_BUCKET || "cms-images";
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || ""; // Your R2 public bucket URL or custom domain

// Create S3 client configured for R2
export const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

export const R2_CONFIG = {
  bucketName: R2_BUCKET_NAME,
  publicUrl: R2_PUBLIC_URL,
  isConfigured: Boolean(R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY),
};

// Media categories for organizing uploads within a tenant
export type MediaCategory =
  | 'media/images'
  | 'media/documents'
  | 'media/videos'
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
  if (!R2_CONFIG.isConfigured) {
    console.warn("R2 is not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY env vars.");
    return { media: [] };
  }

  const sanitizedSubdomain = subdomain.toLowerCase().replace(/[^a-z0-9-]/g, '');
  const prefix = category
    ? `tenants/${sanitizedSubdomain}/${category}/`
    : `tenants/${sanitizedSubdomain}/`;

  try {
    const command = new ListObjectsV2Command({
      Bucket: R2_CONFIG.bucketName,
      Prefix: prefix,
      MaxKeys: options?.maxKeys || 100,
      ContinuationToken: options?.continuationToken,
    });

    const response = await r2Client.send(command);
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
        url: `${R2_CONFIG.publicUrl}/${obj.Key}`,
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
 * List images from R2 bucket (legacy function for backwards compatibility)
 * Images are organized by prefix/folder (e.g., "heroes/", "features/", "team/")
 */
export async function listImages(prefix?: string): Promise<R2Image[]> {
  if (!R2_CONFIG.isConfigured) {
    console.warn("R2 is not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY env vars.");
    return [];
  }

  try {
    const command = new ListObjectsV2Command({
      Bucket: R2_CONFIG.bucketName,
      Prefix: prefix || "",
      MaxKeys: 100,
    });

    const response = await r2Client.send(command);
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
        url: `${R2_CONFIG.publicUrl}/${obj.Key}`,
        name,
        category,
        size: obj.Size,
        lastModified: obj.LastModified,
      });
    }

    return images;
  } catch (error) {
    console.error("Error listing R2 images:", error);
    return [];
  }
}

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
  if (!R2_CONFIG.isConfigured) {
    console.warn("R2 is not configured");
    return null;
  }

  try {
    const key = buildTenantPath(subdomain, category, filename);
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    const mimeType = contentType || getContentType(ext);

    const command = new PutObjectCommand({
      Bucket: R2_CONFIG.bucketName,
      Key: key,
      Body: file,
      ContentType: mimeType,
      // Add cache control for CDN optimization
      CacheControl: 'public, max-age=31536000, immutable',
    });

    await r2Client.send(command);

    const sanitizedSubdomain = subdomain.toLowerCase().replace(/[^a-z0-9-]/g, '');

    return {
      key,
      url: `${R2_CONFIG.publicUrl}/${key}`,
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
 * Upload an image to R2 (legacy function for backwards compatibility)
 */
export async function uploadImage(
  file: Buffer,
  filename: string,
  category: string = "uploads",
  contentType: string = "image/jpeg"
): Promise<R2Image | null> {
  if (!R2_CONFIG.isConfigured) {
    console.warn("R2 is not configured");
    return null;
  }

  try {
    const key = `${category}/${Date.now()}-${filename}`;

    const command = new PutObjectCommand({
      Bucket: R2_CONFIG.bucketName,
      Key: key,
      Body: file,
      ContentType: contentType,
    });

    await r2Client.send(command);

    return {
      key,
      url: `${R2_CONFIG.publicUrl}/${key}`,
      name: filename,
      category,
    };
  } catch (error) {
    console.error("Error uploading to R2:", error);
    return null;
  }
}

/**
 * Delete tenant media - ensures the key belongs to the specified tenant
 * @param subdomain - The tenant's subdomain
 * @param key - The full storage key to delete
 */
export async function deleteTenantMedia(subdomain: string, key: string): Promise<boolean> {
  if (!R2_CONFIG.isConfigured) {
    return false;
  }

  // Verify the key belongs to this tenant
  const parsed = parseTenantPath(key);
  const sanitizedSubdomain = subdomain.toLowerCase().replace(/[^a-z0-9-]/g, '');

  if (!parsed || parsed.subdomain !== sanitizedSubdomain) {
    console.error("Attempted to delete media from another tenant");
    return false;
  }

  try {
    const command = new DeleteObjectCommand({
      Bucket: R2_CONFIG.bucketName,
      Key: key,
    });

    await r2Client.send(command);
    return true;
  } catch (error) {
    console.error("Error deleting tenant media:", error);
    return false;
  }
}

/**
 * Delete an image from R2 (legacy function)
 */
export async function deleteImage(key: string): Promise<boolean> {
  if (!R2_CONFIG.isConfigured) {
    return false;
  }

  try {
    const command = new DeleteObjectCommand({
      Bucket: R2_CONFIG.bucketName,
      Key: key,
    });

    await r2Client.send(command);
    return true;
  } catch (error) {
    console.error("Error deleting from R2:", error);
    return false;
  }
}

/**
 * Get categories for a specific tenant
 * @param subdomain - The tenant's subdomain
 */
export async function getTenantCategories(subdomain: string): Promise<MediaCategory[]> {
  if (!R2_CONFIG.isConfigured) {
    return [];
  }

  const sanitizedSubdomain = subdomain.toLowerCase().replace(/[^a-z0-9-]/g, '');
  const prefix = `tenants/${sanitizedSubdomain}/`;

  try {
    const command = new ListObjectsV2Command({
      Bucket: R2_CONFIG.bucketName,
      Prefix: prefix,
      Delimiter: "/",
    });

    const response = await r2Client.send(command);
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
  if (!R2_CONFIG.isConfigured) {
    return [];
  }

  try {
    const command = new ListObjectsV2Command({
      Bucket: R2_CONFIG.bucketName,
      Delimiter: "/",
    });

    const response = await r2Client.send(command);
    const categories: string[] = [];

    for (const prefix of response.CommonPrefixes || []) {
      if (prefix.Prefix) {
        categories.push(prefix.Prefix.replace("/", ""));
      }
    }

    return categories;
  } catch (error) {
    console.error("Error getting R2 categories:", error);
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
  if (!R2_CONFIG.isConfigured) {
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

  try {
    const newKey = buildTenantPath(targetSubdomain, parsed.category as MediaCategory, parsed.filename);

    const command = new CopyObjectCommand({
      Bucket: R2_CONFIG.bucketName,
      CopySource: `${R2_CONFIG.bucketName}/${sourceKey}`,
      Key: newKey,
    });

    await r2Client.send(command);

    const sanitizedTarget = targetSubdomain.toLowerCase().replace(/[^a-z0-9-]/g, '');

    return {
      key: newKey,
      url: `${R2_CONFIG.publicUrl}/${newKey}`,
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
  if (!R2_CONFIG.isConfigured) {
    return { totalSize: 0, fileCount: 0, byCategory: {} };
  }

  const sanitizedSubdomain = subdomain.toLowerCase().replace(/[^a-z0-9-]/g, '');
  const prefix = `tenants/${sanitizedSubdomain}/`;

  let totalSize = 0;
  let fileCount = 0;
  const byCategory: Record<string, { size: number; count: number }> = {};
  let continuationToken: string | undefined;

  try {
    do {
      const command = new ListObjectsV2Command({
        Bucket: R2_CONFIG.bucketName,
        Prefix: prefix,
        MaxKeys: 1000,
        ContinuationToken: continuationToken,
      });

      const response = await r2Client.send(command);

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
