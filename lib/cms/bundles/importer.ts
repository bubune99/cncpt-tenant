/**
 * Bundle Importer
 *
 * Imports .puckbundle zip files and creates pages with uploaded assets.
 */

import JSZip from "jszip";
import { Data } from "@puckeditor/core";
import { prisma } from "@/lib/db";
import { getStorageProvider } from "./storage-provider";
import {
  BundleManifest,
  BundleImportOptions,
  BundleImportResult,
  BundleImportProgress,
  ImportStatus,
  BUNDLE_PATHS,
} from "./types";
import { replacePlaceholdersWithUrls } from "./asset-processor";
import {
  validateManifest,
  validateZipStructure,
  validatePageData,
  validateAssetIntegrity,
} from "./validation";

/**
 * Generate a unique page ID
 */
function generatePageId(slug?: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 6);
  const base = slug?.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 30) || "page";
  return `${base}-${timestamp}-${random}`;
}

/**
 * Generate a unique bundle ID
 */
function generateBundleId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `import-${timestamp}-${random}`;
}

/**
 * Progress callback type
 */
export type ImportProgressCallback = (progress: BundleImportProgress) => void;

/**
 * Import a .puckbundle file
 */
export async function importBundle(
  zipBuffer: Buffer,
  options: BundleImportOptions = {},
  onProgress?: ImportProgressCallback
): Promise<BundleImportResult> {
  const bundleId = generateBundleId();
  const warnings: string[] = [];
  const urlMappings: Record<string, string> = {};

  let assetsTotal = 0;
  let assetsUploaded = 0;
  let assetsFailed = 0;

  // Helper to report progress
  const reportProgress = (
    status: ImportStatus,
    progress: number,
    currentStep: string
  ) => {
    onProgress?.({
      status,
      progress,
      currentStep,
      assets: { total: assetsTotal, uploaded: assetsUploaded, failed: assetsFailed },
    });
  };

  try {
    // Step 1: Extract and validate zip
    reportProgress("validating", 5, "Extracting bundle...");

    const zip = await JSZip.loadAsync(zipBuffer);
    const files = Object.keys(zip.files);

    // Validate zip structure
    const structureValidation = validateZipStructure(files);
    if (!structureValidation.valid) {
      const errors = structureValidation.errors.filter((e) => e.severity === "error");
      throw new Error(`Invalid bundle structure: ${errors.map((e) => e.message).join(", ")}`);
    }

    // Step 2: Read and validate manifest
    reportProgress("validating", 15, "Validating manifest...");

    const manifestFile = zip.file(BUNDLE_PATHS.MANIFEST);
    if (!manifestFile) {
      throw new Error("Missing manifest.json in bundle");
    }

    const manifestText = await manifestFile.async("text");
    const manifest: BundleManifest = JSON.parse(manifestText);

    const manifestValidation = validateManifest(manifest);
    if (!manifestValidation.valid) {
      const errors = manifestValidation.errors.filter((e) => e.severity === "error");
      throw new Error(`Invalid manifest: ${errors.map((e) => e.message).join(", ")}`);
    }

    // Add warnings from validation
    manifestValidation.errors
      .filter((e) => e.severity === "warning")
      .forEach((e) => warnings.push(e.message));

    // Step 3: Read and validate page data
    reportProgress("validating", 25, "Validating page data...");

    const pageFile = zip.file(BUNDLE_PATHS.PAGE);
    if (!pageFile) {
      throw new Error("Missing page.json in bundle");
    }

    const pageText = await pageFile.async("text");
    const pageData: Data = JSON.parse(pageText);

    const pageValidation = validatePageData(pageData);
    if (!pageValidation.valid) {
      const errors = pageValidation.errors.filter((e) => e.severity === "error");
      throw new Error(`Invalid page data: ${errors.map((e) => e.message).join(", ")}`);
    }

    // Step 4: Upload assets
    reportProgress("uploading_assets", 30, "Uploading assets...");

    const assetEntries = Object.entries(manifest.assets || {});
    assetsTotal = assetEntries.length;

    if (assetsTotal > 0 && !options.skipAssetUpload) {
      const storageProvider = getStorageProvider(options.storageProvider);
      const assetPrefix = options.assetPathPrefix || `bundles/${bundleId}`;

      for (const [placeholderId, assetInfo] of assetEntries) {
        try {
          const assetFile = zip.file(assetInfo.path);
          if (!assetFile) {
            warnings.push(`Asset not found in bundle: ${assetInfo.path}`);
            assetsFailed++;
            continue;
          }

          const assetBuffer = await assetFile.async("nodebuffer");

          // Validate integrity if hash is present
          if (assetInfo.hash) {
            if (!validateAssetIntegrity(assetBuffer, assetInfo.hash)) {
              warnings.push(`Asset integrity check failed: ${assetInfo.path}`);
              // Continue anyway but warn
            }
          }

          // Upload to storage
          const filename = assetInfo.path.split("/").pop() || "asset";
          const storageKey = `${assetPrefix}/${filename}`;

          const uploadResult = await storageProvider.upload(assetBuffer, {
            key: storageKey,
            contentType: assetInfo.mimeType || "application/octet-stream",
          });

          // Store URL mapping
          urlMappings[placeholderId] = uploadResult.url;
          assetsUploaded++;

          // Update progress
          const assetProgress = 30 + Math.round((assetsUploaded / assetsTotal) * 40);
          reportProgress(
            "uploading_assets",
            assetProgress,
            `Uploading assets (${assetsUploaded}/${assetsTotal})...`
          );
        } catch (error) {
          console.error(`Failed to upload asset ${assetInfo.path}:`, error);
          warnings.push(`Failed to upload asset: ${assetInfo.path}`);
          assetsFailed++;
        }
      }
    }

    // Step 5: Transform page data with new URLs
    reportProgress("processing", 75, "Processing page data...");

    const urlMappingsMap = new Map(Object.entries(urlMappings));
    const transformedPageData = replacePlaceholdersWithUrls(pageData, urlMappingsMap);

    // Step 6: Save the page to database
    reportProgress("processing", 85, "Saving page...");

    const pageId = options.targetSlug || generatePageId(manifest.page.slug);
    const pageSlug = manifest.page.slug || pageId;

    // Update the root props with the page title
    if (transformedPageData.root?.props) {
      (transformedPageData.root.props as Record<string, unknown>).title =
        manifest.page.title;
    }

    // Create the page in database
    await prisma.page.create({
      data: {
        id: pageId,
        title: manifest.page.title,
        slug: pageSlug,
        content: transformedPageData as object,
        status: "DRAFT",
      },
    });

    // Step 7: Complete
    reportProgress("completed", 100, "Import complete!");

    return {
      bundleId,
      pageId,
      status: "completed",
      assets: {
        total: assetsTotal,
        uploaded: assetsUploaded,
        failed: assetsFailed,
        urlMappings,
      },
      warnings: warnings.length > 0 ? warnings : undefined,
      importedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Bundle import error:", error);

    reportProgress("failed", 0, `Import failed: ${(error as Error).message}`);

    return {
      bundleId,
      pageId: "",
      status: "failed",
      assets: {
        total: assetsTotal,
        uploaded: assetsUploaded,
        failed: assetsFailed,
        urlMappings,
      },
      warnings,
      importedAt: new Date().toISOString(),
    };
  }
}

/**
 * Preview a bundle without importing
 */
export async function previewBundle(
  zipBuffer: Buffer
): Promise<{
  manifest: BundleManifest;
  pageData: Data;
  assetCount: number;
  valid: boolean;
  errors: string[];
  warnings: string[];
}> {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    const zip = await JSZip.loadAsync(zipBuffer);
    const files = Object.keys(zip.files);

    // Validate structure
    const structureValidation = validateZipStructure(files);
    structureValidation.errors.forEach((e) => {
      if (e.severity === "error") errors.push(e.message);
      else warnings.push(e.message);
    });

    // Read manifest
    const manifestFile = zip.file(BUNDLE_PATHS.MANIFEST);
    if (!manifestFile) {
      throw new Error("Missing manifest.json");
    }

    const manifestText = await manifestFile.async("text");
    const manifest: BundleManifest = JSON.parse(manifestText);

    const manifestValidation = validateManifest(manifest);
    manifestValidation.errors.forEach((e) => {
      if (e.severity === "error") errors.push(e.message);
      else warnings.push(e.message);
    });

    // Read page data
    const pageFile = zip.file(BUNDLE_PATHS.PAGE);
    if (!pageFile) {
      throw new Error("Missing page.json");
    }

    const pageText = await pageFile.async("text");
    const pageData: Data = JSON.parse(pageText);

    const pageValidation = validatePageData(pageData);
    pageValidation.errors.forEach((e) => {
      if (e.severity === "error") errors.push(e.message);
      else warnings.push(e.message);
    });

    return {
      manifest,
      pageData,
      assetCount: Object.keys(manifest.assets || {}).length,
      valid: errors.length === 0,
      errors,
      warnings,
    };
  } catch (error) {
    return {
      manifest: null as unknown as BundleManifest,
      pageData: null as unknown as Data,
      assetCount: 0,
      valid: false,
      errors: [(error as Error).message],
      warnings,
    };
  }
}

/**
 * Extract just the manifest from a bundle (fast preview)
 */
export async function extractManifest(zipBuffer: Buffer): Promise<BundleManifest> {
  const zip = await JSZip.loadAsync(zipBuffer);
  const manifestFile = zip.file(BUNDLE_PATHS.MANIFEST);

  if (!manifestFile) {
    throw new Error("Missing manifest.json in bundle");
  }

  const manifestText = await manifestFile.async("text");
  return JSON.parse(manifestText);
}

/**
 * Validate import options
 */
export function validateImportOptions(options: BundleImportOptions): string[] {
  const errors: string[] = [];

  if (options.targetSlug) {
    if (!/^[a-z0-9-]+$/.test(options.targetSlug)) {
      errors.push("Target slug can only contain lowercase letters, numbers, and hyphens");
    }
    if (options.targetSlug.length > 100) {
      errors.push("Target slug must be 100 characters or less");
    }
  }

  if (options.storageProvider) {
    const validProviders = ["s3", "r2", "vercel-blob", "local"];
    if (!validProviders.includes(options.storageProvider)) {
      errors.push(`Invalid storage provider: ${options.storageProvider}`);
    }
  }

  return errors;
}
