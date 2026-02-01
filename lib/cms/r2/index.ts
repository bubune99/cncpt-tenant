/**
 * R2 Storage Module
 *
 * Exports all R2-related functionality for image storage.
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

// Legacy exports (for backwards compatibility)
export { r2Client, R2_CONFIG, listImages, uploadImage, deleteImage, getCategories } from "./client";
export type { R2Image } from "./client";

// Multi-tenant exports
export {
  // Functions
  listTenantMedia,
  uploadTenantMedia,
  deleteTenantMedia,
  getTenantCategories,
  getTenantStorageUsage,
  copyTenantMedia,
  buildTenantPath,
  parseTenantPath,
} from "./client";

export type { R2Media, MediaCategory } from "./client";
