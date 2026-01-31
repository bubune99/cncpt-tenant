/**
 * Cloudflare R2 Client Configuration
 *
 * R2 is S3-compatible, so we use the AWS SDK with R2's endpoint.
 */

import { S3Client, ListObjectsV2Command, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

// R2 credentials from environment variables
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || "";
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || "";
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || "";
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "cms-images";
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

export interface R2Image {
  key: string;
  url: string;
  name: string;
  category: string;
  size?: number;
  lastModified?: Date;
}

/**
 * List images from R2 bucket
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
 * Upload an image to R2
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
 * Delete an image from R2
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
 * Get image categories (top-level folders)
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
