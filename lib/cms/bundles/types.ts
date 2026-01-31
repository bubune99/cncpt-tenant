import { Data } from "@puckeditor/core";

// ============ BUNDLE MANIFEST ============

export const BUNDLE_VERSION = "1.0.0";
export const BUNDLE_FORMAT = "puck-bundle";
export const BUNDLE_EXTENSION = ".puckbundle";

/**
 * Asset reference placeholder format: {{ASSET:asset-id}}
 * These are replaced with actual URLs during import
 */
export type AssetPlaceholder = `{{ASSET:${string}}}`;

/**
 * Supported asset types
 */
export type AssetType = "image" | "video" | "font" | "lottie" | "other";

export type ImageMimeType = "image/jpeg" | "image/png" | "image/svg+xml" | "image/webp" | "image/gif";
export type VideoMimeType = "video/mp4" | "video/webm";
export type FontMimeType = "font/woff" | "font/woff2" | "font/ttf" | "application/x-font-ttf";
export type LottieMimeType = "application/json";

export type AssetMimeType = ImageMimeType | VideoMimeType | FontMimeType | LottieMimeType | string;

/**
 * Individual asset entry in the manifest
 */
export interface BundleAsset {
  /** Relative path within the bundle zip */
  path: string;
  /** MIME type of the asset */
  mimeType: AssetMimeType;
  /** File size in bytes */
  size: number;
  /** SHA-256 hash for integrity verification */
  hash: string;
  /** Human-readable name */
  name?: string;
  /** Original URL (for reference only) */
  originalUrl?: string;
}

/**
 * Custom animation definition (keyframes)
 */
export interface BundleCustomAnimation {
  /** Display name */
  name: string;
  /** Relative path to animation JSON file */
  path: string;
  /** Description of the animation */
  description?: string;
}

/**
 * Lottie animation definition
 */
export interface BundleLottieAnimation {
  /** Display name */
  name: string;
  /** Relative path to Lottie JSON file */
  path: string;
  /** Animation dimensions */
  dimensions: {
    width: number;
    height: number;
  };
  /** Frame rate */
  frameRate?: number;
  /** Total frames */
  totalFrames?: number;
  /** Description */
  description?: string;
}

/**
 * Timeline sequence entry
 */
export interface BundleTimelineSequence {
  /** Display name */
  name: string;
  /** Relative path to timeline JSON file */
  path: string;
  /** Duration in seconds */
  duration?: number;
  /** Description */
  description?: string;
}

/**
 * Animation references in the bundle
 */
export interface BundleAnimations {
  /** Custom keyframe animations */
  custom: Record<string, BundleCustomAnimation>;
  /** Lottie animations */
  lottie: Record<string, BundleLottieAnimation>;
  /** Timeline sequences */
  timelines: Record<string, BundleTimelineSequence>;
}

/**
 * Puck version compatibility info
 */
export interface BundleDependencies {
  /** Minimum Puck version required */
  puckVersion: string;
  /** List of component types used in the page */
  requiredComponents: string[];
  /** Optional: list of custom field types used */
  requiredFields?: string[];
  /** Optional: animation features used */
  requiredAnimationFeatures?: (
    | "exit"
    | "repeat"
    | "lottie"
    | "timeline"
    | "custom"
  )[];
}

/**
 * Page metadata
 */
export interface BundlePageMeta {
  /** Page title */
  title: string;
  /** URL-friendly slug */
  slug?: string;
  /** Page description */
  description?: string;
  /** Categorization */
  category?: string;
  /** Tags for searchability */
  tags?: string[];
  /** Author information */
  author?: string;
}

/**
 * Complete bundle manifest
 */
export interface BundleManifest {
  /** Manifest version */
  version: typeof BUNDLE_VERSION;
  /** Format identifier */
  format: typeof BUNDLE_FORMAT;
  /** Creation timestamp (ISO 8601) */
  created: string;
  /** Last modified timestamp (ISO 8601) */
  modified?: string;

  /** Page metadata */
  page: BundlePageMeta;

  /** Asset mappings: placeholder ID → asset info */
  assets: Record<string, BundleAsset>;

  /** Animation references */
  animations: BundleAnimations;

  /** Compatibility requirements */
  dependencies: BundleDependencies;

  /** Preview image path (relative to bundle root) */
  previewImage?: string;

  /** Additional metadata (extensible) */
  metadata?: Record<string, unknown>;
}

// ============ EXPORT/IMPORT TYPES ============

/**
 * Export options
 */
export interface BundleExportOptions {
  /** Page ID to export */
  pageId: string;
  /** Include all referenced assets */
  includeAssets?: boolean;
  /** Include animation definitions */
  includeAnimations?: boolean;
  /** Generate preview image */
  generatePreview?: boolean;
  /** Custom metadata to include */
  metadata?: Record<string, unknown>;
}

/**
 * Export result
 */
export interface BundleExportResult {
  /** Unique bundle identifier */
  bundleId: string;
  /** Download URL (temporary) */
  downloadUrl: string;
  /** Bundle manifest */
  manifest: BundleManifest;
  /** Bundle file size in bytes */
  size: number;
  /** Export timestamp */
  exportedAt: string;
}

/**
 * Import options
 */
export interface BundleImportOptions {
  /** Target slug for the imported page */
  targetSlug?: string;
  /** Storage provider to use for assets */
  storageProvider?: "s3" | "r2" | "vercel-blob" | "local";
  /** Overwrite existing page with same slug */
  overwrite?: boolean;
  /** Skip asset upload (for testing) */
  skipAssetUpload?: boolean;
  /** Custom asset path prefix */
  assetPathPrefix?: string;
}

/**
 * Import progress status
 */
export type ImportStatus =
  | "validating"
  | "uploading_assets"
  | "processing"
  | "completed"
  | "failed";

/**
 * Import progress tracking
 */
export interface BundleImportProgress {
  /** Current status */
  status: ImportStatus;
  /** Progress percentage (0-100) */
  progress: number;
  /** Current step description */
  currentStep: string;
  /** Asset upload progress */
  assets: {
    total: number;
    uploaded: number;
    failed: number;
  };
  /** Error message if failed */
  error?: string;
}

/**
 * Import result
 */
export interface BundleImportResult {
  /** Bundle record ID */
  bundleId: string;
  /** Created page ID */
  pageId: string;
  /** Final status */
  status: ImportStatus;
  /** Asset upload results */
  assets: {
    total: number;
    uploaded: number;
    failed: number;
    /** Mapping from placeholder to new URL */
    urlMappings: Record<string, string>;
  };
  /** Warnings during import */
  warnings?: string[];
  /** Import timestamp */
  importedAt: string;
}

// ============ VALIDATION TYPES ============

/**
 * Validation error
 */
export interface ValidationError {
  /** Error code */
  code: string;
  /** Human-readable message */
  message: string;
  /** Related field or path */
  path?: string;
  /** Severity */
  severity: "error" | "warning";
}

/**
 * Validation result
 */
export interface ValidationResult {
  /** Whether the bundle is valid */
  valid: boolean;
  /** List of validation errors/warnings */
  errors: ValidationError[];
  /** Compatibility notes */
  compatibility?: {
    /** Puck version compatible */
    puckVersionOk: boolean;
    /** All required components available */
    componentsOk: boolean;
    /** Missing component types */
    missingComponents?: string[];
  };
}

// ============ DATABASE TYPES ============

/**
 * Bundle record status
 */
export type BundleStatus = "active" | "archived" | "deleted";

/**
 * Bundle record (stored in database)
 */
export interface PageBundleRecord {
  id: string;
  /** Associated page ID */
  pageId: string;
  /** Bundle name */
  name: string;
  /** Bundle version */
  version: string;
  /** Hash of manifest for integrity check */
  manifestHash?: string;
  /** Record status */
  status: BundleStatus;
  /** Additional metadata */
  metadata: Record<string, unknown>;
  /** Original manifest (stored as JSON) */
  manifest: BundleManifest;
  /** Creation timestamp */
  createdAt: Date;
  /** Import timestamp */
  importedAt?: Date;
}

/**
 * Bundle asset record status
 */
export type BundleAssetStatus = "pending" | "uploaded" | "failed";

/**
 * Bundle asset record (stored in database)
 */
export interface BundleAssetRecord {
  id: string;
  /** Parent bundle ID */
  bundleId: string;
  /** Original path in bundle */
  originalPath: string;
  /** Placeholder ID used in page config */
  placeholderId: string;
  /** Uploaded storage URL */
  storageUrl?: string;
  /** Asset type category */
  assetType: AssetType;
  /** Upload status */
  status: BundleAssetStatus;
  /** Error message if failed */
  errorMessage?: string;
  /** Creation timestamp */
  createdAt: Date;
}

/**
 * Custom animation type
 */
export type CustomAnimationType = "keyframe" | "lottie" | "sequence" | "timeline";

/**
 * Custom animation record (stored in database)
 */
export interface CustomAnimationRecord {
  id: string;
  /** Parent bundle ID (null if global) */
  bundleId?: string;
  /** Animation name */
  name: string;
  /** Animation type */
  type: CustomAnimationType;
  /** Animation definition (JSON) */
  definition: Record<string, unknown>;
  /** Is globally available */
  isGlobal: boolean;
  /** Creation timestamp */
  createdAt: Date;
}

// ============ ZIP STRUCTURE PATHS ============

export const BUNDLE_PATHS = {
  MANIFEST: "manifest.json",
  PAGE: "page.json",
  PREVIEW: "preview.png",
  ASSETS: {
    ROOT: "assets/",
    IMAGES: "assets/images/",
    VIDEOS: "assets/videos/",
    FONTS: "assets/fonts/",
  },
  ANIMATIONS: {
    ROOT: "animations/",
    CUSTOM: "animations/custom/",
    LOTTIE: "animations/lottie/",
    TIMELINES: "animations/timelines/",
  },
} as const;

// ============ UTILITY TYPES ============

/**
 * Asset extraction result from page config
 */
export interface ExtractedAsset {
  /** URL found in the config */
  url: string;
  /** Generated placeholder ID */
  placeholderId: string;
  /** Component path where found */
  componentPath: string;
  /** Property name */
  propertyName: string;
  /** Detected asset type */
  assetType: AssetType;
}

/**
 * URL mapping for import rewriting
 */
export interface UrlMapping {
  /** Original placeholder */
  placeholder: string;
  /** Original URL (from export) */
  originalUrl: string;
  /** New storage URL (after import) */
  newUrl: string;
}
