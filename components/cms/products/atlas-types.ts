/**
 * Atlas Product Editor — shared types
 * Matches Prisma schema shapes exactly (no any, Zod-validated at boundaries).
 */

// ── Product type enum (matches schema) ────────────────────────────────────
export type ProductTypeKind =
  | 'SIMPLE'
  | 'VARIABLE'
  | 'DIGITAL'
  | 'SERVICE'
  | 'SUBSCRIPTION'
  | 'BUNDLE';

// ── Custom field types (matches schema) ───────────────────────────────────
export type CustomFieldTypeKind =
  | 'TEXT'
  | 'NUMBER'
  | 'BOOLEAN'
  | 'SELECT'
  | 'MULTISELECT'
  | 'COLOR'
  | 'IMAGE'
  | 'DATE'
  | 'URL'
  | 'TEXTAREA';

// ── License key statuses ───────────────────────────────────────────────────
export type LicenseKeyStatusKind =
  | 'AVAILABLE'
  | 'ASSIGNED'
  | 'ACTIVATED'
  | 'REVOKED';

// ── Product status ─────────────────────────────────────────────────────────
export type ProductStatusKind = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';

// ── Atlas Product shape (flat, from API) ──────────────────────────────────
// Mirrors the columns on the Prisma `Product` model that the editor surfaces.
// Optional fields cover legacy-parity capabilities (featured, barcode, tax,
// shipping, low-stock threshold, backorder, subscription/service/bundle/digital
// type-specific fields, SEO, Shopify sync, etc.).
export interface AtlasProduct {
  readonly id: string;
  readonly title: string;
  readonly slug: string;
  readonly description: string | null;
  readonly type: ProductTypeKind;
  readonly status: ProductStatusKind;
  readonly basePrice: number; // cents
  readonly compareAtPrice: number | null;
  readonly costPrice: number | null;
  readonly sku: string | null;
  readonly stock: number;
  readonly trackInventory: boolean;
  readonly stripeProductId: string | null;
  readonly stripePriceId: string | null;
  readonly stripeSyncedAt: string | null;
  // ── Legacy parity (optional, may be undefined when loaded from legacy callers) ──
  readonly featured?: boolean;
  readonly barcode?: string | null;
  readonly taxable?: boolean;
  readonly taxCode?: string | null;
  readonly requiresShipping?: boolean;
  readonly weight?: number | null;
  readonly length?: number | null;
  readonly width?: number | null;
  readonly height?: number | null;
  readonly lowStockThreshold?: number;
  readonly allowBackorder?: boolean;
  readonly stripeSyncError?: string | null;
  readonly subscriptionInterval?: string | null;
  readonly subscriptionIntervalCount?: number | null;
  readonly trialDays?: number | null;
  readonly bundlePriceMode?: string | null;
  readonly digitalAssetId?: string | null;
  readonly serviceDuration?: number | null;
  readonly serviceCapacity?: number | null;
  readonly metaTitle?: string | null;
  readonly metaDescription?: string | null;
  readonly bundleItems?: unknown;
  readonly shopifyProductId?: string | null;
  readonly shopifySyncedAt?: string | null;
}

// ── Variant (from API, for grid) ──────────────────────────────────────────
export interface AtlasVariant {
  readonly id: string;
  readonly sku: string | null;
  readonly price: number; // cents
  readonly costPrice: number | null;
  readonly stock: number;
  readonly enabled: boolean;
  readonly weight: number | null;
  readonly imageId: string | null;
  // Option values keyed by option name
  readonly optionValues: Readonly<Record<string, Readonly<{ optionId: string; valueId: string; value: string }>>>;
  // Custom field values keyed by field slug
  readonly customFields: Readonly<Record<string, Readonly<{ fieldId: string; type: string; value: unknown }>>>;
}

// ── Product option ────────────────────────────────────────────────────────
export interface AtlasProductOption {
  readonly id: string;
  readonly name: string;
  readonly position: number;
  readonly values: ReadonlyArray<{ readonly id: string; readonly value: string; readonly position: number }>;
}

// ── Custom field definition ───────────────────────────────────────────────
export interface AtlasCustomField {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly type: CustomFieldTypeKind;
  readonly options: unknown;
  readonly defaultValue: unknown;
  readonly required: boolean;
  readonly showInGrid: boolean;
}

// ── Product custom field attachment ──────────────────────────────────────
export interface AtlasProductCustomField {
  readonly id: string;
  readonly productId: string;
  readonly customFieldId: string;
  readonly required: boolean;
  readonly showInGrid: boolean;
  readonly position: number;
  readonly customField: AtlasCustomField;
}

// ── Digital asset ─────────────────────────────────────────────────────────
export interface AtlasDigitalAsset {
  readonly id: string;
  readonly filename: string;
  readonly url: string;
  readonly fileSize: number | null;
  readonly mimeType: string | null;
  readonly version: string | null;
  readonly downloadLimit: number | null;
  readonly downloadExpiry: number | null;
  readonly useLicenseKeys: boolean;
  readonly deliveryMethod: string;
  readonly licenseKeys: ReadonlyArray<AtlasLicenseKey>;
}

// ── License key ───────────────────────────────────────────────────────────
export interface AtlasLicenseKey {
  readonly id: string;
  readonly key: string;
  readonly status: LicenseKeyStatusKind;
  readonly assignedTo: string | null;
  readonly activationCount: number;
  readonly maxActivations: number | null;
  readonly assignedAt: string | null;
}

// ── Discount code ─────────────────────────────────────────────────────────
export interface AtlasDiscountCode {
  readonly id: string;
  readonly code: string;
  readonly type: string;
  readonly value: number;
  readonly usageCount: number;
  readonly description: string | null;
  readonly stackable: boolean;
}

// ── Bundle item ───────────────────────────────────────────────────────────
export interface AtlasBundleItem {
  readonly productId: string;
  readonly productTitle: string;
  readonly variantId: string | null;
  readonly variantLabel: string;
  readonly productType: ProductTypeKind;
  readonly price: number;
  readonly quantity: number;
  readonly stock: number | null; // null = infinite (digital)
  readonly hex: string;
}

// ── Grid column (for spreadsheet view) ───────────────────────────────────
export type GridColumnKind = 'core' | 'option' | 'field';

export interface AtlasGridColumn {
  readonly id: string;
  readonly kind: GridColumnKind;
  readonly label: string;
  readonly width: number;
  readonly align: 'left' | 'right' | 'center';
  readonly editable: boolean;
  readonly fieldType?: CustomFieldTypeKind; // only for kind==='field'
  readonly fieldOptions?: ReadonlyArray<{ readonly value: string; readonly label: string }>;
}

// ── Grid row (for spreadsheet view) ──────────────────────────────────────
export interface AtlasGridRow {
  readonly id: string;
  readonly sku: string | null;
  readonly price: number;
  readonly costPrice: number | null;
  readonly stock: number;
  readonly status: 'in' | 'low' | 'out';
  readonly enabled: boolean;
  readonly weight: number | null;
  readonly pace: number; // 30-day sold (read-only)
  // dynamic option/field values keyed by column id
  readonly [key: string]: unknown;
}

// ── Filter chip ────────────────────────────────────────────────────────────
export interface AtlasFilterChip {
  readonly id: string;
  readonly label: string;
  readonly field: string;
  readonly op: '=' | '<' | '>' | '!=';
  readonly value: string | number;
}

// ── View mode for variants tab ────────────────────────────────────────────
export type VariantsViewMode = 'list' | 'matrix' | 'cards';

// ── Pricing tier ──────────────────────────────────────────────────────────
export interface AtlasPricingTier {
  readonly id: string;
  readonly minQty: number;
  readonly maxQty: number | null;
  readonly price: number; // cents
  readonly requiresTag: string | null;
}

// ── Member pricing rule ───────────────────────────────────────────────────
export interface AtlasMemberPricing {
  readonly id: string;
  readonly tierName: string;
  readonly description: string;
  readonly memberCount: number;
  readonly discountPercent: number;
  /** Raw member price in cents (from ProductPricingTier.price). Used when discountPercent is 0. */
  readonly memberPrice?: number;
  readonly enabled: boolean;
}

// ── Sale schedule ─────────────────────────────────────────────────────────
export interface AtlasSaleSchedule {
  readonly id: string;
  readonly salePrice: number; // cents
  readonly startDate: string; // ISO
  readonly endDate: string; // ISO
  readonly active: boolean;
}
