/**
 * Storage Provider for Bundle Assets
 *
 * Simple abstraction for uploading bundle assets to different storage backends.
 */

import fs from "fs/promises";
import path from "path";

export interface UploadOptions {
  key: string;
  contentType: string;
}

export interface UploadResult {
  url: string;
  key: string;
  size: number;
}

export interface StorageProvider {
  upload(buffer: Buffer, options: UploadOptions): Promise<UploadResult>;
  getPublicUrl(key: string): string;
}

/**
 * Local filesystem storage provider (for development)
 */
class LocalStorageProvider implements StorageProvider {
  private uploadDir: string;
  private publicPath: string;

  constructor() {
    this.uploadDir = path.join(process.cwd(), "public", "uploads", "bundles");
    this.publicPath = "/uploads/bundles";
  }

  async upload(buffer: Buffer, options: UploadOptions): Promise<UploadResult> {
    // Ensure upload directory exists
    await fs.mkdir(this.uploadDir, { recursive: true });

    // Write file
    const filePath = path.join(this.uploadDir, options.key);
    const fileDir = path.dirname(filePath);
    await fs.mkdir(fileDir, { recursive: true });
    await fs.writeFile(filePath, buffer);

    return {
      url: this.getPublicUrl(options.key),
      key: options.key,
      size: buffer.length,
    };
  }

  getPublicUrl(key: string): string {
    return `${this.publicPath}/${key}`;
  }
}

/**
 * S3-compatible storage provider
 */
class S3StorageProvider implements StorageProvider {
  private bucket: string;
  private region: string;
  private endpoint?: string;

  constructor() {
    this.bucket = process.env.S3_BUCKET || "";
    this.region = process.env.S3_REGION || "us-east-1";
    this.endpoint = process.env.S3_ENDPOINT;
  }

  async upload(buffer: Buffer, options: UploadOptions): Promise<UploadResult> {
    // Dynamic import to avoid loading AWS SDK if not needed
    const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");

    const client = new S3Client({
      region: this.region,
      endpoint: this.endpoint,
      credentials:
        process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
          ? {
              accessKeyId: process.env.AWS_ACCESS_KEY_ID,
              secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            }
          : undefined,
    });

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: options.key,
      Body: buffer,
      ContentType: options.contentType,
      ACL: "public-read",
    });

    await client.send(command);

    return {
      url: this.getPublicUrl(options.key),
      key: options.key,
      size: buffer.length,
    };
  }

  getPublicUrl(key: string): string {
    if (this.endpoint) {
      return `${this.endpoint}/${this.bucket}/${key}`;
    }
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
  }
}

/**
 * Cloudflare R2 storage provider
 */
class R2StorageProvider implements StorageProvider {
  private bucket: string;
  private accountId: string;
  private publicDomain?: string;

  constructor() {
    this.bucket = process.env.R2_BUCKET || "";
    this.accountId = process.env.R2_ACCOUNT_ID || "";
    this.publicDomain = process.env.R2_PUBLIC_DOMAIN;
  }

  async upload(buffer: Buffer, options: UploadOptions): Promise<UploadResult> {
    const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");

    const client = new S3Client({
      region: "auto",
      endpoint: `https://${this.accountId}.r2.cloudflarestorage.com`,
      credentials:
        process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY
          ? {
              accessKeyId: process.env.R2_ACCESS_KEY_ID,
              secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
            }
          : undefined,
    });

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: options.key,
      Body: buffer,
      ContentType: options.contentType,
    });

    await client.send(command);

    return {
      url: this.getPublicUrl(options.key),
      key: options.key,
      size: buffer.length,
    };
  }

  getPublicUrl(key: string): string {
    if (this.publicDomain) {
      return `${this.publicDomain}/${key}`;
    }
    return `https://pub-${this.accountId}.r2.dev/${this.bucket}/${key}`;
  }
}

/**
 * Vercel Blob storage provider
 * Requires @vercel/blob package to be installed
 */
class VercelBlobStorageProvider implements StorageProvider {
  private async getVercelBlobModule(): Promise<{ put: (key: string, data: Buffer, options: { access: string; contentType?: string }) => Promise<{ url: string }> }> {
    try {
      // Use Function constructor to avoid static analysis
      const importFn = new Function("moduleName", "return import(moduleName)");
      return await importFn("@vercel/blob");
    } catch {
      throw new Error(
        "Vercel Blob package is not installed. Run: npm install @vercel/blob"
      );
    }
  }

  async upload(buffer: Buffer, options: UploadOptions): Promise<UploadResult> {
    const { put } = await this.getVercelBlobModule();

    const blob = await put(options.key, buffer, {
      access: "public",
      contentType: options.contentType,
    });

    return {
      url: blob.url,
      key: options.key,
      size: buffer.length,
    };
  }

  getPublicUrl(key: string): string {
    // Vercel Blob returns the URL directly from upload
    return key;
  }
}

// Singleton instances
let localProvider: LocalStorageProvider | null = null;
let s3Provider: S3StorageProvider | null = null;
let r2Provider: R2StorageProvider | null = null;
let vercelBlobProvider: VercelBlobStorageProvider | null = null;

/**
 * Get a storage provider instance
 */
export function getStorageProvider(
  type?: "s3" | "r2" | "vercel-blob" | "local"
): StorageProvider {
  // Determine provider type from env or parameter
  const providerType = type || process.env.STORAGE_PROVIDER || "local";

  switch (providerType) {
    case "s3":
      if (!s3Provider) {
        s3Provider = new S3StorageProvider();
      }
      return s3Provider;

    case "r2":
      if (!r2Provider) {
        r2Provider = new R2StorageProvider();
      }
      return r2Provider;

    case "vercel-blob":
      if (!vercelBlobProvider) {
        vercelBlobProvider = new VercelBlobStorageProvider();
      }
      return vercelBlobProvider;

    case "local":
    default:
      if (!localProvider) {
        localProvider = new LocalStorageProvider();
      }
      return localProvider;
  }
}
