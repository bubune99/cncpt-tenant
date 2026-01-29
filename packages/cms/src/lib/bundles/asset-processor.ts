/**
 * Asset Processor
 *
 * Extracts asset URLs from page configurations and processes them for bundling.
 */

import crypto from "crypto";
import { Data } from "@puckeditor/core";
import {
  ExtractedAsset,
  AssetType,
  BundleAsset,
  AssetMimeType,
  BUNDLE_PATHS,
} from "./types";

// URL patterns that indicate an asset
const URL_PATTERNS = [
  /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i,
  /^https?:\/\/.+\.(mp4|webm|mov)(\?.*)?$/i,
  /^https?:\/\/.+\.(woff|woff2|ttf|otf|eot)(\?.*)?$/i,
  /^https?:\/\/.+\.(json)(\?.*)?$/i, // Could be Lottie
  /^\/uploads\/.+/i, // Local uploads
  /^data:image\/.+;base64,/i, // Base64 images
];

// Properties that typically contain asset URLs
const ASSET_PROPERTIES = [
  "src",
  "href",
  "url",
  "image",
  "backgroundImage",
  "logoSrc",
  "imageSrc",
  "videoSrc",
  "poster",
  "thumbnail",
  "icon",
  "avatar",
  "banner",
  "cover",
  "background",
];

// MIME type mapping by extension
const MIME_TYPES: Record<string, AssetMimeType> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
  woff: "font/woff",
  woff2: "font/woff2",
  ttf: "font/ttf",
  otf: "font/otf",
  json: "application/json",
};

/**
 * Determine asset type from URL or MIME type
 */
export function getAssetType(url: string, mimeType?: string): AssetType {
  const lowerUrl = url.toLowerCase();
  const mime = mimeType?.toLowerCase() || "";

  // Check MIME type first
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("font/") || mime.includes("font")) return "font";

  // Check URL extension
  if (/\.(jpg|jpeg|png|gif|webp|svg|ico|bmp)(\?.*)?$/i.test(lowerUrl)) return "image";
  if (/\.(mp4|webm|mov|avi|mkv)(\?.*)?$/i.test(lowerUrl)) return "video";
  if (/\.(woff|woff2|ttf|otf|eot)(\?.*)?$/i.test(lowerUrl)) return "font";
  if (/\.json(\?.*)?$/i.test(lowerUrl)) return "lottie"; // Assume JSON is Lottie

  // Check for data URLs
  if (lowerUrl.startsWith("data:image/")) return "image";
  if (lowerUrl.startsWith("data:video/")) return "video";

  return "other";
}

/**
 * Get file extension from URL
 */
export function getExtensionFromUrl(url: string): string {
  // Handle data URLs
  if (url.startsWith("data:")) {
    const match = url.match(/^data:([^;,]+)/);
    if (match) {
      const mime = match[1];
      const ext = Object.entries(MIME_TYPES).find(([, m]) => m === mime)?.[0];
      return ext || "bin";
    }
    return "bin";
  }

  // Remove query string and get extension
  const cleanUrl = url.split("?")[0].split("#")[0];
  const lastSegment = cleanUrl.split("/").pop() || "";
  const match = lastSegment.match(/\.([a-zA-Z0-9]+)$/);
  return match ? match[1].toLowerCase() : "bin";
}

/**
 * Get MIME type from extension
 */
export function getMimeType(extension: string): AssetMimeType {
  return MIME_TYPES[extension.toLowerCase()] || "application/octet-stream";
}

/**
 * Generate a unique asset ID from URL
 */
export function generateAssetId(url: string): string {
  const hash = crypto.createHash("sha256").update(url).digest("hex").slice(0, 12);
  const ext = getExtensionFromUrl(url);
  const name = url
    .split("/")
    .pop()
    ?.split("?")[0]
    ?.replace(/\.[^.]+$/, "")
    ?.replace(/[^a-zA-Z0-9-_]/g, "-")
    ?.slice(0, 20) || "asset";

  return `${name}-${hash}`;
}

/**
 * Check if a string looks like an asset URL
 */
export function isAssetUrl(value: unknown): value is string {
  if (typeof value !== "string" || !value) return false;
  return URL_PATTERNS.some((pattern) => pattern.test(value));
}

/**
 * Get the bundle path for an asset type
 */
export function getBundlePath(assetType: AssetType, filename: string): string {
  switch (assetType) {
    case "image":
      return `${BUNDLE_PATHS.ASSETS.IMAGES}${filename}`;
    case "video":
      return `${BUNDLE_PATHS.ASSETS.VIDEOS}${filename}`;
    case "font":
      return `${BUNDLE_PATHS.ASSETS.FONTS}${filename}`;
    case "lottie":
      return `${BUNDLE_PATHS.ANIMATIONS.LOTTIE}${filename}`;
    default:
      return `${BUNDLE_PATHS.ASSETS.ROOT}${filename}`;
  }
}

/**
 * Extract all asset URLs from a Puck page configuration
 */
export function extractAssetsFromPage(pageData: Data): ExtractedAsset[] {
  const assets: ExtractedAsset[] = [];
  const seenUrls = new Set<string>();

  /**
   * Recursively search object for asset URLs
   */
  function searchObject(
    obj: unknown,
    path: string[] = [],
    componentPath: string = ""
  ): void {
    if (!obj || typeof obj !== "object") return;

    if (Array.isArray(obj)) {
      obj.forEach((item, index) => {
        searchObject(item, [...path, String(index)], componentPath);
      });
      return;
    }

    const record = obj as Record<string, unknown>;

    // Track component path for better identification
    if (record.type && typeof record.type === "string") {
      componentPath = [...path, record.type as string].join(".");
    }

    for (const [key, value] of Object.entries(record)) {
      const currentPath = [...path, key];

      // Check if this is an asset property with a URL value
      if (ASSET_PROPERTIES.includes(key) && isAssetUrl(value)) {
        if (!seenUrls.has(value)) {
          seenUrls.add(value);
          const assetType = getAssetType(value);

          assets.push({
            url: value,
            placeholderId: `{{ASSET:${generateAssetId(value)}}}`,
            componentPath,
            propertyName: key,
            assetType,
          });
        }
      }
      // Also check string values that look like URLs
      else if (isAssetUrl(value) && !seenUrls.has(value)) {
        seenUrls.add(value);
        const assetType = getAssetType(value);

        assets.push({
          url: value,
          placeholderId: `{{ASSET:${generateAssetId(value)}}}`,
          componentPath,
          propertyName: key,
          assetType,
        });
      }
      // Recurse into nested objects
      else if (typeof value === "object" && value !== null) {
        searchObject(value, currentPath, componentPath);
      }
    }
  }

  // Search through all page data
  searchObject(pageData.content, ["content"]);
  searchObject(pageData.root, ["root"]);
  if (pageData.zones) {
    searchObject(pageData.zones, ["zones"]);
  }

  return assets;
}

/**
 * Replace asset URLs with placeholders in page data
 */
export function replaceAssetsWithPlaceholders(
  pageData: Data,
  extractedAssets: ExtractedAsset[]
): Data {
  // Create URL to placeholder mapping
  const urlToPlaceholder = new Map<string, string>();
  for (const asset of extractedAssets) {
    urlToPlaceholder.set(asset.url, asset.placeholderId);
  }

  /**
   * Deep clone and replace URLs
   */
  function processValue(value: unknown): unknown {
    if (typeof value === "string" && urlToPlaceholder.has(value)) {
      return urlToPlaceholder.get(value);
    }

    if (Array.isArray(value)) {
      return value.map(processValue);
    }

    if (value && typeof value === "object") {
      const result: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        result[k] = processValue(v);
      }
      return result;
    }

    return value;
  }

  return processValue(pageData) as Data;
}

/**
 * Replace placeholders with new URLs in page data
 */
export function replacePlaceholdersWithUrls(
  pageData: Data,
  urlMappings: Map<string, string>
): Data {
  /**
   * Deep clone and replace placeholders
   */
  function processValue(value: unknown): unknown {
    if (typeof value === "string") {
      // Check if it's a placeholder
      const match = value.match(/^\{\{ASSET:([^}]+)\}\}$/);
      if (match) {
        const placeholderId = value;
        if (urlMappings.has(placeholderId)) {
          return urlMappings.get(placeholderId);
        }
      }
    }

    if (Array.isArray(value)) {
      return value.map(processValue);
    }

    if (value && typeof value === "object") {
      const result: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        result[k] = processValue(v);
      }
      return result;
    }

    return value;
  }

  return processValue(pageData) as Data;
}

/**
 * Calculate SHA-256 hash of a buffer
 */
export function calculateHash(buffer: Buffer): string {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

/**
 * Fetch an asset from URL and return buffer with metadata
 */
export async function fetchAsset(url: string): Promise<{
  buffer: Buffer;
  mimeType: string;
  size: number;
}> {
  // Handle data URLs
  if (url.startsWith("data:")) {
    const match = url.match(/^data:([^;]+);base64,(.+)$/);
    if (match) {
      const mimeType = match[1];
      const base64Data = match[2];
      const buffer = Buffer.from(base64Data, "base64");
      return {
        buffer,
        mimeType,
        size: buffer.length,
      };
    }
    throw new Error("Invalid data URL format");
  }

  // Handle local URLs
  if (url.startsWith("/")) {
    const fs = await import("fs/promises");
    const path = await import("path");
    const fullPath = path.join(process.cwd(), "public", url);
    const buffer = await fs.readFile(fullPath);
    const ext = getExtensionFromUrl(url);
    return {
      buffer,
      mimeType: getMimeType(ext),
      size: buffer.length,
    };
  }

  // Fetch remote URL
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch asset: ${response.status} ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const mimeType = response.headers.get("content-type") || getMimeType(getExtensionFromUrl(url));

  return {
    buffer,
    mimeType,
    size: buffer.length,
  };
}

/**
 * Create BundleAsset from ExtractedAsset and fetched data
 */
export function createBundleAsset(
  extracted: ExtractedAsset,
  buffer: Buffer,
  mimeType: string
): BundleAsset {
  const assetId = extracted.placeholderId.replace(/^\{\{ASSET:|}\}$/g, "");
  const extension = getExtensionFromUrl(extracted.url);
  const filename = `${assetId}.${extension}`;
  const bundlePath = getBundlePath(extracted.assetType, filename);

  return {
    path: bundlePath,
    mimeType,
    size: buffer.length,
    hash: calculateHash(buffer),
    name: assetId,
    originalUrl: extracted.url,
  };
}

/**
 * Extract required component types from page data
 */
export function extractRequiredComponents(pageData: Data): string[] {
  const componentTypes = new Set<string>();

  function extractFromContent(content: unknown[]): void {
    for (const item of content) {
      if (item && typeof item === "object" && "type" in item) {
        const component = item as { type: string; props?: Record<string, unknown> };
        componentTypes.add(component.type);
      }
    }
  }

  // Extract from main content
  if (pageData.content) {
    extractFromContent(pageData.content);
  }

  // Extract from zones
  if (pageData.zones) {
    for (const zoneContent of Object.values(pageData.zones)) {
      if (Array.isArray(zoneContent)) {
        extractFromContent(zoneContent);
      }
    }
  }

  return Array.from(componentTypes).sort();
}
