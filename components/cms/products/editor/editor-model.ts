/**
 * Product editor — model layer.
 *
 * Pure types, constants, and product<->API mappers lifted out of the old
 * ProductEditorAtlas monolith so the controller hook and Grainy shell can share
 * them. No React, no side-effects — safe to import anywhere.
 */

import type {
  AtlasProduct,
  AtlasVariant,
  AtlasProductOption,
  AtlasProductCustomField,
  AtlasDigitalAsset,
  ProductTypeKind,
} from "../atlas-types";

// ── Tab labels + per-type tab sets ──────────────────────────────────────────

export type TabLabel =
  | "Detail"
  | "Media"
  | "Variants"
  | "Fields"
  | "Files"
  | "Schedule"
  | "Billing"
  | "Contents"
  | "Inventory"
  | "Pricing"
  | "Channels"
  | "SEO"
  | "Type";

export const TABS_BY_TYPE: Readonly<Record<ProductTypeKind, ReadonlyArray<TabLabel>>> = {
  SIMPLE:       ["Detail", "Media", "Fields", "Pricing", "Inventory", "Channels", "SEO", "Type"],
  VARIABLE:     ["Detail", "Media", "Variants", "Fields", "Pricing", "Inventory", "Channels", "SEO", "Type"],
  DIGITAL:      ["Detail", "Media", "Files", "Pricing", "Channels", "SEO", "Type"],
  SERVICE:      ["Detail", "Media", "Schedule", "Pricing", "Channels", "SEO", "Type"],
  SUBSCRIPTION: ["Detail", "Media", "Billing", "Pricing", "Channels", "SEO", "Type"],
  BUNDLE:       ["Detail", "Media", "Contents", "Pricing", "Channels", "SEO", "Type"],
};

// ── Lightweight view-model rows shared with the form tabs ────────────────────

export interface EditorCategory {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
}

export interface ProductImageRow {
  readonly id: string;
  readonly position: number;
  readonly alt: string | null;
  readonly media: {
    readonly id: string;
    readonly url: string;
    readonly alt?: string | null;
  };
}

// ── API row shapes ──────────────────────────────────────────────────────────

export interface DiscountApiRow {
  readonly id: string;
  readonly code: string;
  readonly type: string;
  readonly value: number;
  readonly usageCount: number;
  readonly description: string | null;
  readonly enabled: boolean;
}

export interface PricingTierApiRow {
  readonly id: string;
  readonly productId: string;
  readonly label: string;
  readonly minQty: number;
  readonly maxQty: number | null;
  readonly price: number;
  readonly type: "QTY" | "MEMBER";
  readonly enabled: boolean;
}

export interface SaleScheduleApiRow {
  readonly id: string;
  readonly productId: string;
  readonly variantId: string | null;
  readonly salePrice: number;
  readonly startsAt: string;
  readonly endsAt: string;
  readonly enabled: boolean;
}

export interface BundleItemRaw {
  readonly productId?: string;
  readonly productTitle?: string;
  readonly variantId?: string | null;
  readonly variantLabel?: string;
  readonly productType?: ProductTypeKind;
  readonly price?: number;
  readonly quantity?: number;
  readonly stock?: number | null;
  readonly hex?: string;
}

// ── Editor load state ────────────────────────────────────────────────────────

export interface EditorLoadState {
  readonly loading: boolean;
  readonly error: string | null;
  readonly product: AtlasProduct | null;
  readonly variants: ReadonlyArray<AtlasVariant>;
  readonly options: ReadonlyArray<AtlasProductOption>;
  readonly customFields: ReadonlyArray<AtlasProductCustomField>;
  readonly digitalAsset: AtlasDigitalAsset | null;
  readonly images: ReadonlyArray<ProductImageRow>;
  readonly categoryIds: ReadonlyArray<string>;
}

// ── Empty product (create mode) ────────────────────────────────────────────

export const EMPTY_PRODUCT: AtlasProduct = {
  id: "",
  title: "",
  slug: "",
  description: null,
  type: "SIMPLE",
  status: "DRAFT",
  basePrice: 0,
  compareAtPrice: null,
  costPrice: null,
  sku: null,
  stock: 0,
  trackInventory: true,
  stripeProductId: null,
  stripePriceId: null,
  stripeSyncedAt: null,
  featured: false,
  barcode: null,
  taxable: true,
  taxCode: null,
  requiresShipping: true,
  weight: null,
  length: null,
  width: null,
  height: null,
  lowStockThreshold: 5,
  allowBackorder: false,
  stripeSyncError: null,
  subscriptionInterval: null,
  subscriptionIntervalCount: null,
  trialDays: null,
  bundlePriceMode: null,
  digitalAssetId: null,
  serviceDuration: null,
  serviceCapacity: null,
  metaTitle: null,
  metaDescription: null,
  bundleItems: null,
  shopifyProductId: null,
  shopifySyncedAt: null,
};

// ── Mappers ──────────────────────────────────────────────────────────────────

export function mapApiProduct(data: Record<string, unknown>): AtlasProduct {
  return {
    id: String(data.id ?? ""),
    title: String(data.title ?? ""),
    slug: String(data.slug ?? ""),
    description: (data.description as string | null) ?? null,
    type: (data.type as ProductTypeKind) ?? "SIMPLE",
    status: (data.status as AtlasProduct["status"]) ?? "DRAFT",
    basePrice: Number(data.basePrice ?? 0),
    compareAtPrice: data.compareAtPrice != null ? Number(data.compareAtPrice) : null,
    costPrice: data.costPrice != null ? Number(data.costPrice) : null,
    sku: (data.sku as string | null) ?? null,
    stock: Number(data.stock ?? 0),
    trackInventory: data.trackInventory !== false,
    stripeProductId: (data.stripeProductId as string | null) ?? null,
    stripePriceId: (data.stripePriceId as string | null) ?? null,
    stripeSyncedAt: (data.stripeSyncedAt as string | null) ?? null,
    featured: Boolean(data.featured),
    barcode: (data.barcode as string | null) ?? null,
    taxable: data.taxable !== false,
    taxCode: (data.taxCode as string | null) ?? null,
    requiresShipping: data.requiresShipping !== false,
    weight: data.weight != null ? Number(data.weight) : null,
    length: data.length != null ? Number(data.length) : null,
    width: data.width != null ? Number(data.width) : null,
    height: data.height != null ? Number(data.height) : null,
    lowStockThreshold:
      data.lowStockThreshold != null ? Number(data.lowStockThreshold) : 5,
    allowBackorder: Boolean(data.allowBackorder),
    stripeSyncError: (data.stripeSyncError as string | null) ?? null,
    subscriptionInterval: (data.subscriptionInterval as string | null) ?? null,
    subscriptionIntervalCount:
      data.subscriptionIntervalCount != null
        ? Number(data.subscriptionIntervalCount)
        : null,
    trialDays: data.trialDays != null ? Number(data.trialDays) : null,
    bundlePriceMode: (data.bundlePriceMode as string | null) ?? null,
    digitalAssetId: (data.digitalAssetId as string | null) ?? null,
    serviceDuration:
      data.serviceDuration != null ? Number(data.serviceDuration) : null,
    serviceCapacity:
      data.serviceCapacity != null ? Number(data.serviceCapacity) : null,
    metaTitle: (data.metaTitle as string | null) ?? null,
    metaDescription: (data.metaDescription as string | null) ?? null,
    bundleItems: data.bundleItems ?? null,
    shopifyProductId: (data.shopifyProductId as string | null) ?? null,
    shopifySyncedAt: (data.shopifySyncedAt as string | null) ?? null,
  };
}

export function buildSavePayload(p: AtlasProduct): Record<string, unknown> {
  return {
    title: p.title,
    slug: p.slug,
    description: p.description,
    type: p.type,
    status: p.status,
    featured: p.featured ?? false,
    basePrice: p.basePrice,
    compareAtPrice: p.compareAtPrice,
    costPrice: p.costPrice,
    sku: p.sku,
    barcode: p.barcode,
    taxable: p.taxable ?? true,
    taxCode: p.taxCode,
    requiresShipping: p.requiresShipping ?? true,
    weight: p.weight,
    length: p.length,
    width: p.width,
    height: p.height,
    stock: p.stock,
    trackInventory: p.trackInventory,
    lowStockThreshold: p.lowStockThreshold,
    allowBackorder: p.allowBackorder ?? false,
    subscriptionInterval: p.subscriptionInterval,
    subscriptionIntervalCount: p.subscriptionIntervalCount,
    trialDays: p.trialDays,
    bundlePriceMode: p.bundlePriceMode,
    bundleItems: p.bundleItems,
    digitalAssetId: p.digitalAssetId,
    serviceDuration: p.serviceDuration,
    serviceCapacity: p.serviceCapacity,
    metaTitle: p.metaTitle,
    metaDescription: p.metaDescription,
  };
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function formatCentsStatic(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
