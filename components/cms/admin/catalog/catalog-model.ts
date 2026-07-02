/**
 * Catalog model — shared types, helpers, and data access for the Grainy
 * catalog screens (products list, collections, inventory).
 *
 * All data comes from the real CMS APIs:
 *  - products         → GET  /api/cms/products
 *  - product status   → PUT  /api/cms/products/[id]  { status }
 *  - product stock    → PUT  /api/cms/products/[id]  { stock }
 *  - product delete   → DELETE /api/cms/products/[id]
 *  - collections      → GET  /api/cms/shop/collections  (Prisma categories)
 *
 * Families derive from the Prisma `ProductType` enum
 * (SIMPLE/VARIABLE/BUNDLE → physical, DIGITAL → digital,
 * SERVICE/SUBSCRIPTION → service).
 */

import { Package, Download, Sparkles, type LucideIcon } from 'lucide-react';
import type { BadgeTone } from '../orders/orders-model';

export type Family = 'physical' | 'digital' | 'service';

const TYPE_FAMILY: Readonly<Record<string, Family>> = {
  SIMPLE: 'physical',
  VARIABLE: 'physical',
  BUNDLE: 'physical',
  DIGITAL: 'digital',
  SERVICE: 'service',
  SUBSCRIPTION: 'service',
};

export interface FamilyMeta {
  readonly key: Family;
  readonly label: string;
  readonly icon: LucideIcon;
  readonly tone: BadgeTone;
  readonly hex: string; // grainy ramp var, for accents
  readonly blurb: string;
  readonly facets: string;
}

export const FAMILIES: readonly FamilyMeta[] = [
  {
    key: 'physical',
    label: 'Physical goods',
    icon: Package,
    tone: 'clay',
    hex: 'var(--clay-500)',
    blurb: 'Tangible items you stock, pick, and ship.',
    facets: 'Variants · inventory · weight',
  },
  {
    key: 'digital',
    label: 'Digital products',
    icon: Download,
    tone: 'blue',
    hex: 'var(--blue-500)',
    blurb: 'Files customers download — delivered instantly, no stock held.',
    facets: 'Format · license · downloads',
  },
  {
    key: 'service',
    label: 'Services & plans',
    icon: Sparkles,
    tone: 'sage',
    hex: 'var(--sage-500)',
    blurb: 'Time-based work and recurring plans.',
    facets: 'Billing cadence · term · capacity',
  },
];

export const familyMeta = (k: Family): FamilyMeta =>
  FAMILIES.find((f) => f.key === k) ?? FAMILIES[0];

export const familyOf = (type: string): Family =>
  TYPE_FAMILY[(type || 'SIMPLE').toUpperCase()] ?? 'physical';

export interface Prod {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly sku: string;
  readonly type: string; // UPPERCASE enum
  readonly family: Family;
  readonly price: number; // dollars
  readonly compareAt: number | null;
  readonly status: 'active' | 'draft' | 'archived';
  readonly stock: number;
  readonly trackInventory: boolean;
  readonly lowStockThreshold: number;
  readonly category: string; // slug
  readonly thumbnail: string | null;
  readonly variants: number;
  readonly interval: string | null; // subscription
  readonly duration: number | null; // service minutes
  readonly capacity: number | null; // service slots
  readonly createdAt: string;
}

export type StockLevel = 'In stock' | 'Low' | 'Out of stock';

export const money = (n: number): string =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

export const titleCase = (s: string): string =>
  (s || '')
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');

export const statusTone = (s: string): BadgeTone =>
  s === 'active' ? 'sage' : s === 'archived' ? 'neutral' : 'ochre';

export const stockLevel = (p: Prod): StockLevel =>
  p.stock === 0 ? 'Out of stock' : p.stock < p.lowStockThreshold ? 'Low' : 'In stock';

/* eslint-disable @typescript-eslint/no-explicit-any */
function transform(p: any): Prod {
  const type = (p.type || 'SIMPLE').toUpperCase();
  const status = (p.status || 'draft').toLowerCase();
  return {
    id: p.id,
    name: p.title,
    slug: p.slug,
    sku: p.sku || '',
    type,
    family: familyOf(type),
    price: (p.basePrice ?? 0) / 100,
    compareAt: p.compareAtPrice != null ? p.compareAtPrice / 100 : null,
    status: status === 'active' || status === 'archived' ? status : 'draft',
    stock: p.stock ?? 0,
    trackInventory: p.trackInventory ?? true,
    lowStockThreshold: p.lowStockThreshold ?? 5,
    category: p.categories?.[0]?.category?.slug || 'uncategorized',
    thumbnail: p.images?.[0]?.media?.url || null,
    variants: Array.isArray(p.variants) ? p.variants.length : 0,
    interval: p.subscriptionInterval || null,
    duration: p.serviceDuration ?? null,
    capacity: p.serviceCapacity ?? null,
    createdAt: p.createdAt,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/** Fetch the tenant catalog. Pulls a generous page so client-side family
 * splitting, filtering, and sorting have the full set to work with. */
export async function fetchCatalog(): Promise<Prod[]> {
  const res = await fetch(
    '/api/cms/products?includeImages=true&includeCategories=true&includeVariants=true&limit=200',
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return (data.products || []).map(transform);
}

const STATUS_ENUM: Record<Prod['status'], string> = {
  active: 'ACTIVE',
  draft: 'DRAFT',
  archived: 'ARCHIVED',
};

/** Persist a status change for one product. Throws on failure. */
export async function setProductStatus(id: string, status: Prod['status']): Promise<void> {
  const res = await fetch(`/api/cms/products/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: STATUS_ENUM[status] }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

/** Set the stock level for one product (SIMPLE / non-variant products). */
export async function setProductStock(id: string, stock: number): Promise<void> {
  const res = await fetch(`/api/cms/products/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ stock }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

/** Delete one product. Throws on failure. */
export async function deleteProduct(id: string): Promise<void> {
  const res = await fetch(`/api/cms/products/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

export interface Collection {
  readonly id: string;
  readonly handle: string;
  readonly title: string;
  readonly description?: string;
  readonly imageUrl: string | null;
  readonly count: number;
  readonly thumbs: readonly string[];
}

/** Fetch collections (Prisma categories with product counts + thumbnails). */
export async function fetchCollections(): Promise<Collection[]> {
  const res = await fetch('/api/cms/shop/collections');
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  /* eslint-disable @typescript-eslint/no-explicit-any */
  return (data.collections || []).map((c: any) => ({
    id: c.id,
    handle: c.handle,
    title: c.title,
    description: c.description || undefined,
    imageUrl: c.image?.url || null,
    count: Array.isArray(c.products) ? c.products.length : 0,
    thumbs: (c.products || [])
      .map((p: any) => p.images?.[0]?.url)
      .filter(Boolean)
      .slice(0, 4),
  }));
  /* eslint-enable @typescript-eslint/no-explicit-any */
}
