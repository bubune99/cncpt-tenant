/**
 * Bundle Validation
 *
 * Validates bundle manifests and page data for import compatibility.
 */

import {
  BundleManifest,
  ValidationResult,
  ValidationError,
  BUNDLE_VERSION,
  BUNDLE_FORMAT,
  BUNDLE_PATHS,
} from "./types";
import { calculateHash } from "./asset-processor";

/**
 * Validate a bundle manifest
 */
export function validateManifest(manifest: unknown): ValidationResult {
  const errors: ValidationError[] = [];

  // Check if manifest is an object
  if (!manifest || typeof manifest !== "object") {
    errors.push({
      code: "INVALID_MANIFEST",
      message: "Manifest must be a valid JSON object",
      severity: "error",
    });
    return { valid: false, errors };
  }

  const m = manifest as Partial<BundleManifest>;

  // Check required fields
  if (!m.version) {
    errors.push({
      code: "MISSING_VERSION",
      message: "Manifest is missing required 'version' field",
      path: "version",
      severity: "error",
    });
  } else if (m.version !== BUNDLE_VERSION) {
    errors.push({
      code: "VERSION_MISMATCH",
      message: `Manifest version ${m.version} does not match expected ${BUNDLE_VERSION}`,
      path: "version",
      severity: "warning",
    });
  }

  if (!m.format) {
    errors.push({
      code: "MISSING_FORMAT",
      message: "Manifest is missing required 'format' field",
      path: "format",
      severity: "error",
    });
  } else if (m.format !== BUNDLE_FORMAT) {
    errors.push({
      code: "FORMAT_MISMATCH",
      message: `Manifest format '${m.format}' is not a valid puck-bundle`,
      path: "format",
      severity: "error",
    });
  }

  if (!m.created) {
    errors.push({
      code: "MISSING_CREATED",
      message: "Manifest is missing required 'created' timestamp",
      path: "created",
      severity: "error",
    });
  } else if (isNaN(Date.parse(m.created))) {
    errors.push({
      code: "INVALID_CREATED",
      message: "Manifest 'created' is not a valid ISO timestamp",
      path: "created",
      severity: "error",
    });
  }

  // Validate page metadata
  if (!m.page) {
    errors.push({
      code: "MISSING_PAGE",
      message: "Manifest is missing required 'page' metadata",
      path: "page",
      severity: "error",
    });
  } else {
    if (!m.page.title) {
      errors.push({
        code: "MISSING_PAGE_TITLE",
        message: "Page metadata is missing required 'title' field",
        path: "page.title",
        severity: "error",
      });
    }
  }

  // Validate assets if present
  if (m.assets) {
    if (typeof m.assets !== "object") {
      errors.push({
        code: "INVALID_ASSETS",
        message: "Assets must be an object",
        path: "assets",
        severity: "error",
      });
    } else {
      for (const [id, asset] of Object.entries(m.assets)) {
        if (!asset.path) {
          errors.push({
            code: "MISSING_ASSET_PATH",
            message: `Asset '${id}' is missing required 'path' field`,
            path: `assets.${id}.path`,
            severity: "error",
          });
        }
        if (!asset.mimeType) {
          errors.push({
            code: "MISSING_ASSET_MIME",
            message: `Asset '${id}' is missing required 'mimeType' field`,
            path: `assets.${id}.mimeType`,
            severity: "warning",
          });
        }
        if (typeof asset.size !== "number") {
          errors.push({
            code: "MISSING_ASSET_SIZE",
            message: `Asset '${id}' is missing required 'size' field`,
            path: `assets.${id}.size`,
            severity: "warning",
          });
        }
        if (!asset.hash) {
          errors.push({
            code: "MISSING_ASSET_HASH",
            message: `Asset '${id}' is missing 'hash' for integrity verification`,
            path: `assets.${id}.hash`,
            severity: "warning",
          });
        }
      }
    }
  }

  // Validate dependencies if present
  if (m.dependencies) {
    if (!m.dependencies.puckVersion) {
      errors.push({
        code: "MISSING_PUCK_VERSION",
        message: "Dependencies is missing required 'puckVersion' field",
        path: "dependencies.puckVersion",
        severity: "warning",
      });
    }
    if (!m.dependencies.requiredComponents || !Array.isArray(m.dependencies.requiredComponents)) {
      errors.push({
        code: "MISSING_REQUIRED_COMPONENTS",
        message: "Dependencies is missing 'requiredComponents' array",
        path: "dependencies.requiredComponents",
        severity: "warning",
      });
    }
  }

  const hasErrors = errors.some((e) => e.severity === "error");
  return { valid: !hasErrors, errors };
}

/**
 * Validate asset integrity by comparing hash
 */
export function validateAssetIntegrity(
  buffer: Buffer,
  expectedHash: string
): boolean {
  const actualHash = calculateHash(buffer);
  return actualHash === expectedHash;
}

/**
 * Check component compatibility
 */
export function checkComponentCompatibility(
  requiredComponents: string[],
  availableComponents: string[]
): {
  compatible: boolean;
  missingComponents: string[];
} {
  const availableSet = new Set(availableComponents);
  const missingComponents = requiredComponents.filter(
    (c) => !availableSet.has(c)
  );

  return {
    compatible: missingComponents.length === 0,
    missingComponents,
  };
}

/**
 * Validate zip structure has required files
 */
export function validateZipStructure(
  files: string[]
): ValidationResult {
  const errors: ValidationError[] = [];

  // Check for required files
  if (!files.includes(BUNDLE_PATHS.MANIFEST)) {
    errors.push({
      code: "MISSING_MANIFEST_FILE",
      message: `Bundle is missing required '${BUNDLE_PATHS.MANIFEST}' file`,
      path: BUNDLE_PATHS.MANIFEST,
      severity: "error",
    });
  }

  if (!files.includes(BUNDLE_PATHS.PAGE)) {
    errors.push({
      code: "MISSING_PAGE_FILE",
      message: `Bundle is missing required '${BUNDLE_PATHS.PAGE}' file`,
      path: BUNDLE_PATHS.PAGE,
      severity: "error",
    });
  }

  const hasErrors = errors.some((e) => e.severity === "error");
  return { valid: !hasErrors, errors };
}

/**
 * Validate page.json structure
 */
export function validatePageData(pageData: unknown): ValidationResult {
  const errors: ValidationError[] = [];

  if (!pageData || typeof pageData !== "object") {
    errors.push({
      code: "INVALID_PAGE_DATA",
      message: "Page data must be a valid JSON object",
      severity: "error",
    });
    return { valid: false, errors };
  }

  const p = pageData as Record<string, unknown>;

  // Check for Puck data structure
  if (!p.content && !p.root && !p.zones) {
    errors.push({
      code: "INVALID_PUCK_STRUCTURE",
      message: "Page data does not appear to be a valid Puck configuration",
      severity: "error",
    });
  }

  if (p.content && !Array.isArray(p.content)) {
    errors.push({
      code: "INVALID_CONTENT",
      message: "Page content must be an array",
      path: "content",
      severity: "error",
    });
  }

  if (p.zones && typeof p.zones !== "object") {
    errors.push({
      code: "INVALID_ZONES",
      message: "Page zones must be an object",
      path: "zones",
      severity: "error",
    });
  }

  const hasErrors = errors.some((e) => e.severity === "error");
  return { valid: !hasErrors, errors };
}

/**
 * Parse and validate version string (semver)
 */
export function parseVersion(version: string): {
  major: number;
  minor: number;
  patch: number;
} | null {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!match) return null;

  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
  };
}

/**
 * Check if version A is compatible with version B
 */
export function isVersionCompatible(
  required: string,
  available: string
): boolean {
  const req = parseVersion(required);
  const avail = parseVersion(available);

  if (!req || !avail) return false;

  // Same major version is considered compatible
  // Minor version must be >= required
  if (avail.major !== req.major) return false;
  if (avail.minor < req.minor) return false;

  return true;
}
