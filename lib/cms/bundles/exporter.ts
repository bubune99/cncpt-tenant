/**
 * Bundle Exporter
 *
 * Creates portable .puckbundle zip files from Puck pages.
 */

import JSZip from "jszip";
import { Data } from "@puckeditor/core";
import { prisma } from "@/lib/cms/db";
import {
  BundleManifest,
  BundleExportOptions,
  BundleExportResult,
  BundleAsset,
  BundleAnimations,
  BundleDependencies,
  BUNDLE_VERSION,
  BUNDLE_FORMAT,
  BUNDLE_PATHS,
  BUNDLE_EXTENSION,
} from "./types";
import {
  extractAssetsFromPage,
  replaceAssetsWithPlaceholders,
  extractRequiredComponents,
  fetchAsset,
  createBundleAsset,
} from "./asset-processor";

// Current Puck version (should match package.json)
const PUCK_VERSION = "0.18.0";

/**
 * Generate a unique bundle ID
 */
function generateBundleId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `bundle-${timestamp}-${random}`;
}

/**
 * Create an empty animations structure
 */
function createEmptyAnimations(): BundleAnimations {
  return {
    custom: {},
    lottie: {},
    timelines: {},
  };
}

/**
 * Create dependencies object from page data
 */
function createDependencies(pageData: Data): BundleDependencies {
  const requiredComponents = extractRequiredComponents(pageData);

  return {
    puckVersion: PUCK_VERSION,
    requiredComponents,
    requiredFields: [],
    requiredAnimationFeatures: [],
  };
}

/**
 * Export a page as a .puckbundle zip file
 */
export async function exportBundle(
  options: BundleExportOptions
): Promise<{ zip: Buffer; manifest: BundleManifest; bundleId: string }> {
  const { pageId, includeAssets = true, includeAnimations = true, metadata } = options;

  // Fetch the page data from database
  const page = await prisma.page.findUnique({
    where: { id: pageId },
    select: {
      id: true,
      title: true,
      slug: true,
      content: true,
    },
  });

  if (!page) {
    throw new Error(`Page not found: ${pageId}`);
  }

  const pageData = page.content as Data;
  if (!pageData) {
    throw new Error(`Page has no content: ${pageId}`);
  }

  const bundleId = generateBundleId();
  const zip = new JSZip();

  // Extract assets from page
  const extractedAssets = includeAssets ? extractAssetsFromPage(pageData) : [];

  // Process page data (replace URLs with placeholders if including assets)
  let processedPageData = pageData;
  const bundleAssets: Record<string, BundleAsset> = {};

  if (includeAssets && extractedAssets.length > 0) {
    processedPageData = replaceAssetsWithPlaceholders(pageData, extractedAssets);

    // Fetch and add assets to zip
    for (const extracted of extractedAssets) {
      try {
        const { buffer, mimeType } = await fetchAsset(extracted.url);
        const bundleAsset = createBundleAsset(extracted, buffer, mimeType);

        // Add to zip
        zip.file(bundleAsset.path, buffer);

        // Add to manifest assets
        bundleAssets[extracted.placeholderId] = bundleAsset;
      } catch (error) {
        console.warn(`Failed to fetch asset ${extracted.url}:`, error);
        // Continue without this asset
      }
    }
  }

  // Create animations structure
  const animations = createEmptyAnimations();

  // Extract custom animations from page if present
  if (includeAnimations) {
    // TODO: Extract Lottie and custom animation definitions
    // This will be enhanced in the animation phases
  }

  // Create dependencies
  const dependencies = createDependencies(processedPageData);

  // Create manifest
  const manifest: BundleManifest = {
    version: BUNDLE_VERSION,
    format: BUNDLE_FORMAT,
    created: new Date().toISOString(),
    page: {
      title: page.title,
      slug: page.slug || pageId,
      description: metadata?.description as string,
      category: metadata?.category as string,
      tags: metadata?.tags as string[],
      author: metadata?.author as string,
    },
    assets: bundleAssets,
    animations,
    dependencies,
    metadata,
  };

  // Add manifest to zip
  zip.file(BUNDLE_PATHS.MANIFEST, JSON.stringify(manifest, null, 2));

  // Add page data to zip
  zip.file(BUNDLE_PATHS.PAGE, JSON.stringify(processedPageData, null, 2));

  // Generate the zip buffer
  const zipBuffer = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 9 },
  });

  return {
    zip: zipBuffer,
    manifest,
    bundleId,
  };
}

/**
 * Create a download filename for the bundle
 */
export function getBundleFilename(pageTitle: string, bundleId: string): string {
  const safeName = pageTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);

  return `${safeName}-${bundleId}${BUNDLE_EXTENSION}`;
}

/**
 * Export multiple pages as separate bundles in a single zip
 */
export async function exportMultipleBundles(
  pageIds: string[],
  options?: Omit<BundleExportOptions, "pageId">
): Promise<{ zip: Buffer; manifests: BundleManifest[] }> {
  const masterZip = new JSZip();
  const manifests: BundleManifest[] = [];

  for (const pageId of pageIds) {
    const { zip, manifest, bundleId } = await exportBundle({
      pageId,
      ...options,
    });

    // Get safe folder name
    const folderName = getBundleFilename(manifest.page.title, bundleId).replace(
      BUNDLE_EXTENSION,
      ""
    );

    // Add the bundle zip as a file in the master zip
    masterZip.file(`${folderName}${BUNDLE_EXTENSION}`, zip);
    manifests.push(manifest);
  }

  const zipBuffer = await masterZip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 9 },
  });

  return { zip: zipBuffer, manifests };
}

/**
 * Validate export options
 */
export function validateExportOptions(options: BundleExportOptions): string[] {
  const errors: string[] = [];

  if (!options.pageId) {
    errors.push("Page ID is required");
  }

  return errors;
}
