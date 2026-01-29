/**
 * Upload Asset Tool
 *
 * Uploads images and other assets extracted from v0 components to S3
 */

import { AgentToolResult, ExtractedAsset } from "../types";

interface UploadAssetInput {
  url: string;
  type: "image" | "svg" | "video" | "font";
  suggestedName?: string;
}

interface UploadAssetOutput {
  originalUrl: string;
  storedUrl: string;
  storageKey: string;
  size: number;
  mimeType: string;
}

interface UploadMultipleInput {
  assets: ExtractedAsset[];
}

interface UploadMultipleOutput {
  uploaded: UploadAssetOutput[];
  failed: { url: string; error: string }[];
  urlMap: Record<string, string>; // originalUrl -> storedUrl
}

/**
 * Tool to upload a single asset
 */
export const uploadAssetTool = {
  name: "upload_asset",
  description: `Uploads an asset (image, SVG, video, font) from a URL to S3 storage.
Returns the new storage URL that should replace the original URL in the component.
Use this for each external asset found in a v0 component.`,

  inputSchema: {
    type: "object" as const,
    properties: {
      url: {
        type: "string",
        description: "The original URL of the asset to upload",
      },
      type: {
        type: "string",
        enum: ["image", "svg", "video", "font"],
        description: "The type of asset",
      },
      suggestedName: {
        type: "string",
        description: "Optional suggested filename for the asset",
      },
    },
    required: ["url", "type"],
  },

  async execute(
    input: UploadAssetInput
  ): Promise<AgentToolResult<UploadAssetOutput>> {
    try {
      const { url, type, suggestedName } = input;

      // Validate URL
      if (!isValidUrl(url)) {
        return {
          success: false,
          error: "Invalid URL format",
        };
      }

      // Skip data URLs - they're already embedded
      if (url.startsWith("data:")) {
        return {
          success: true,
          data: {
            originalUrl: url,
            storedUrl: url, // Keep data URL as-is
            storageKey: "",
            size: url.length,
            mimeType: extractDataUrlMimeType(url),
          },
        };
      }

      // Fetch the asset
      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });

      if (!response.ok) {
        return {
          success: false,
          error: `Failed to fetch asset: ${response.status} ${response.statusText}`,
        };
      }

      const contentType = response.headers.get("content-type") || getMimeType(type);
      const buffer = await response.arrayBuffer();

      // Generate storage key
      const filename = generateFilename(url, suggestedName, contentType);
      const storageKey = `v0-imports/${Date.now()}/${filename}`;

      // Upload to storage via API
      const uploadResponse = await fetch("/api/storage/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          key: storageKey,
          contentType,
          data: Buffer.from(buffer).toString("base64"),
          source: "v0-import",
        }),
      });

      if (!uploadResponse.ok) {
        const error = await uploadResponse.json();
        return {
          success: false,
          error: `Upload failed: ${error.message || "Unknown error"}`,
        };
      }

      const uploadResult = await uploadResponse.json();

      return {
        success: true,
        data: {
          originalUrl: url,
          storedUrl: uploadResult.url,
          storageKey,
          size: buffer.byteLength,
          mimeType: contentType,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Asset upload failed: ${(error as Error).message}`,
      };
    }
  },
};

/**
 * Tool to upload multiple assets at once
 */
export const uploadMultipleAssetsTool = {
  name: "upload_multiple_assets",
  description: `Uploads multiple assets in batch and returns a URL mapping.
More efficient than uploading one by one.
Returns a map of original URLs to new storage URLs for easy replacement.`,

  inputSchema: {
    type: "object" as const,
    properties: {
      assets: {
        type: "array",
        items: {
          type: "object",
          properties: {
            originalUrl: { type: "string" },
            type: { type: "string", enum: ["image", "svg", "video", "font"] },
            suggestedName: { type: "string" },
          },
          required: ["originalUrl", "type"],
        },
        description: "Array of assets to upload",
      },
    },
    required: ["assets"],
  },

  async execute(
    input: UploadMultipleInput
  ): Promise<AgentToolResult<UploadMultipleOutput>> {
    const uploaded: UploadAssetOutput[] = [];
    const failed: { url: string; error: string }[] = [];
    const urlMap: Record<string, string> = {};

    // Process assets in parallel with concurrency limit
    const concurrencyLimit = 5;
    const chunks = chunkArray(input.assets, concurrencyLimit);

    for (const chunk of chunks) {
      const results = await Promise.all(
        chunk.map(async (asset) => {
          const result = await uploadAssetTool.execute({
            url: asset.originalUrl,
            type: asset.type,
            suggestedName: asset.suggestedName,
          });

          return { asset, result };
        })
      );

      for (const { asset, result } of results) {
        if (result.success && result.data) {
          uploaded.push(result.data);
          urlMap[asset.originalUrl] = result.data.storedUrl;
        } else {
          failed.push({
            url: asset.originalUrl,
            error: result.error || "Unknown error",
          });
        }
      }
    }

    return {
      success: true,
      data: {
        uploaded,
        failed,
        urlMap,
      },
    };
  },
};

/**
 * Helper functions
 */

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function extractDataUrlMimeType(dataUrl: string): string {
  const match = dataUrl.match(/^data:([^;]+);/);
  return match ? match[1] : "application/octet-stream";
}

function getMimeType(type: string): string {
  switch (type) {
    case "image":
      return "image/png";
    case "svg":
      return "image/svg+xml";
    case "video":
      return "video/mp4";
    case "font":
      return "font/woff2";
    default:
      return "application/octet-stream";
  }
}

function generateFilename(
  url: string,
  suggestedName: string | undefined,
  contentType: string
): string {
  if (suggestedName) {
    return sanitizeFilename(suggestedName);
  }

  // Try to extract from URL
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split("/");
    const lastPart = pathParts[pathParts.length - 1];

    if (lastPart && lastPart.includes(".")) {
      return sanitizeFilename(lastPart);
    }
  } catch {
    // Ignore URL parsing errors
  }

  // Generate based on content type
  const ext = getExtensionFromMimeType(contentType);
  return `asset-${Date.now()}${ext}`;
}

function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9.-]/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();
}

function getExtensionFromMimeType(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/gif": ".gif",
    "image/webp": ".webp",
    "image/svg+xml": ".svg",
    "video/mp4": ".mp4",
    "video/webm": ".webm",
    "font/woff": ".woff",
    "font/woff2": ".woff2",
    "font/ttf": ".ttf",
  };

  return mimeToExt[mimeType] || "";
}

function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

export default { uploadAssetTool, uploadMultipleAssetsTool };
