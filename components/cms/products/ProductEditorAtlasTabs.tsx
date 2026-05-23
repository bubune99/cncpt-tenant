"use client";
/**
 * ProductEditorAtlasTabs — Concrete tab implementations for ProductEditorAtlas.
 *
 * Each exported component renders one tab body. They are intentionally small
 * and unopinionated so the orchestrator (`ProductEditorAtlas.tsx`) owns all
 * state and side-effects; tabs are purely controlled inputs.
 *
 * Tabs implemented here (replace the old "coming soon" stubs):
 *  - DetailTab        — title, slug, sku, barcode, description, status, featured, categories
 *  - MediaTab         — product image gallery (grid + upload + delete + alt)
 *  - InventoryTab     — stock / trackInventory / lowStockThreshold / backorder
 *                       + Shipping section (requiresShipping + weight + L/W/H)
 *  - ChannelsTab      — Storefront (web) visibility + Stripe sync + Shopify status
 *  - SeoTab           — metaTitle (60ch) + metaDescription (160ch) + slug mirror
 *  - ScheduleTab      — duration + capacity (SERVICE)
 *  - BillingTab       — interval + count + trial days (SUBSCRIPTION, lifecycle folded in)
 *  - PricingExtrasTab — compare-at / cost / taxable / tax code rows (shown above PricingStack)
 *
 * Styling uses the Atlas editorial CSS classes from `./atlas-product-editor.css`.
 */

import React from "react";
import { Sec, TogglePill } from "./atlas-product-ui";
import type { AtlasProduct } from "./atlas-types";

// ── Shared helpers ────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid var(--rule)",
  borderRadius: 4,
  padding: "4px 8px",
  background: "var(--paper)",
  color: "var(--ink)",
  fontFamily: "var(--font-geist), sans-serif",
  fontSize: 13,
};

const monoInputStyle: React.CSSProperties = {
  ...inputStyle,
  fontFamily: "var(--font-geist-mono), monospace",
  fontSize: 12,
};

const numericInputStyle: React.CSSProperties = {
  ...monoInputStyle,
  textAlign: "right",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontFamily: "var(--font-geist-mono), monospace",
  fontSize: 10,
  letterSpacing: ".05em",
  textTransform: "uppercase",
  color: "var(--ink-soft)",
  marginBottom: 4,
};

const helperStyle: React.CSSProperties = {
  fontFamily: "var(--font-geist), sans-serif",
  fontSize: 11,
  color: "var(--ink-faint)",
  marginTop: 4,
};

const rowGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "14px 24px",
  padding: "8px 0 16px",
};

const triGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "14px 24px",
  padding: "8px 0 16px",
};

const quadGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: "14px 16px",
  padding: "8px 0 16px",
};

const fullRowStyle: React.CSSProperties = { gridColumn: "1 / -1" };

function centsToDollars(cents: number | null | undefined): string {
  if (cents == null) return "";
  return (cents / 100).toFixed(2);
}

function dollarsToCents(value: string): number | null {
  if (value.trim() === "") return null;
  const n = Number.parseFloat(value);
  if (Number.isNaN(n)) return null;
  return Math.round(n * 100);
}

// ── Category type (lightweight, matches /api/cms/shop/collections row) ───────
export interface EditorCategory {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
}

// ── DetailTab ─────────────────────────────────────────────────────────────────

interface DetailTabProps {
  readonly product: AtlasProduct;
  readonly onChange: (patch: Partial<AtlasProduct>) => void;
  readonly categories: ReadonlyArray<EditorCategory>;
  readonly selectedCategoryIds: ReadonlyArray<string>;
  readonly onCategoriesChange: (ids: ReadonlyArray<string>) => void;
  readonly onAutoSlug?: () => void;
}

export function DetailTab({
  product,
  onChange,
  categories,
  selectedCategoryIds,
  onCategoriesChange,
  onAutoSlug,
}: DetailTabProps) {
  const toggleCategory = (id: string) => {
    const next = selectedCategoryIds.includes(id)
      ? selectedCategoryIds.filter((c) => c !== id)
      : [...selectedCategoryIds, id];
    onCategoriesChange(next);
  };

  return (
    <div className="prod-editor-shell" style={{ paddingTop: 8 }}>
      <Sec n="§1" h="Core details" meta="title, slug, description, status" />
      <div style={rowGridStyle}>
        <div style={fullRowStyle}>
          <label style={labelStyle}>Title *</label>
          <input
            data-tour-id="product-form-title"
            style={{ ...inputStyle, fontFamily: "var(--font-display), Spectral, serif", fontSize: 15 }}
            value={product.title}
            onChange={(e) => onChange({ title: e.target.value })}
            placeholder="Enter product name"
          />
        </div>

        <div>
          <label style={labelStyle}>Slug</label>
          <div style={{ display: "flex", gap: 6 }}>
            <input
              data-tour-id="product-form-slug"
              style={monoInputStyle}
              value={product.slug ?? ""}
              onChange={(e) => onChange({ slug: e.target.value })}
              placeholder="auto-generated-from-title"
            />
            {onAutoSlug && (
              <button type="button" className="btn btn-ghost btn-sm" onClick={onAutoSlug}>
                Auto
              </button>
            )}
          </div>
          <p style={helperStyle}>Leave blank to auto-generate from title.</p>
        </div>

        <div>
          <label style={labelStyle}>Base SKU</label>
          <input
            data-tour-id="product-form-sku"
            style={monoInputStyle}
            value={product.sku ?? ""}
            onChange={(e) => onChange({ sku: e.target.value || null })}
            placeholder="Product SKU"
          />
        </div>

        <div>
          <label style={labelStyle}>Barcode</label>
          <input
            style={monoInputStyle}
            value={product.barcode ?? ""}
            onChange={(e) => onChange({ barcode: e.target.value || null })}
            placeholder="UPC, EAN, ISBN, …"
          />
        </div>

        <div>
          <label style={labelStyle}>Status</label>
          <select
            style={{ ...inputStyle, cursor: "pointer" }}
            value={product.status}
            onChange={(e) =>
              onChange({ status: e.target.value as AtlasProduct["status"] })
            }
          >
            <option value="DRAFT">Draft</option>
            <option value="ACTIVE">Active</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>

        <div style={fullRowStyle}>
          <label style={labelStyle}>Description</label>
          <textarea
            style={{ ...inputStyle, minHeight: 110, resize: "vertical" }}
            value={product.description ?? ""}
            onChange={(e) => onChange({ description: e.target.value || null })}
            placeholder="Describe your product…"
          />
        </div>

        <div style={fullRowStyle}>
          <label style={labelStyle}>Featured</label>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <TogglePill
              on={Boolean(product.featured)}
              onLabel="featured"
              offLabel="not featured"
              onChange={(v) => onChange({ featured: v })}
            />
            <p style={{ ...helperStyle, margin: 0 }}>Featured products appear in storefront highlight slots.</p>
          </div>
        </div>
      </div>

      <Sec n="§2" h="Categories" meta="storefront collections" />
      <div style={{ padding: "8px 0 16px" }}>
        {categories.length === 0 ? (
          <p style={helperStyle}>
            No categories defined yet. Create categories in the Categories section to organise products.
          </p>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {categories.map((cat) => {
              const selected = selectedCategoryIds.includes(cat.id);
              return (
                <button
                  key={cat.id}
                  type="button"
                  className={"chip" + (selected ? " on" : "")}
                  onClick={() => toggleCategory(cat.id)}
                  style={{ cursor: "pointer", border: "1px solid var(--rule)" }}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── MediaTab ──────────────────────────────────────────────────────────────────

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

interface MediaTabProps {
  readonly images: ReadonlyArray<ProductImageRow>;
  readonly productId: string;
  readonly canUpload: boolean;
  readonly onAddImage: () => void;
  readonly onRemoveImage: (imageId: string) => void;
  readonly onUpdateAlt: (imageId: string, alt: string) => void;
  readonly onReorder: (imageId: string, direction: -1 | 1) => void;
}

export function MediaTab({
  images,
  productId: _productId,
  canUpload,
  onAddImage,
  onRemoveImage,
  onUpdateAlt,
  onReorder,
}: MediaTabProps) {
  return (
    <div className="prod-editor-shell" style={{ paddingTop: 8 }}>
      <Sec
        n="§1"
        h="Images"
        meta={`${images.length} image${images.length === 1 ? "" : "s"} · drag-order via arrows`}
      />

      {!canUpload && (
        <div
          style={{
            padding: 16,
            border: "1px dashed var(--rule)",
            borderRadius: 6,
            margin: "8px 0",
            color: "var(--ink-soft)",
            fontSize: 13,
          }}
        >
          Save the product first to add images.
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
          gap: 12,
          padding: "8px 0 24px",
        }}
      >
        {images.map((img, idx) => (
          <div
            key={img.id}
            style={{
              border: "1px solid var(--rule)",
              borderRadius: 6,
              overflow: "hidden",
              background: "var(--paper)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ aspectRatio: "1 / 1", background: "var(--paper-2)", position: "relative" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.media.url}
                alt={img.alt ?? img.media.alt ?? `Image ${idx + 1}`}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
              {idx === 0 && (
                <span
                  className="pill pill-solid-accent"
                  style={{
                    position: "absolute",
                    top: 6,
                    left: 6,
                    fontSize: 10,
                    padding: "2px 6px",
                  }}
                >
                  Primary
                </span>
              )}
            </div>
            <div style={{ padding: 8, display: "flex", flexDirection: "column", gap: 6 }}>
              <input
                aria-label="Alt text"
                style={{ ...inputStyle, fontSize: 11 }}
                placeholder="Alt text (accessibility)"
                value={img.alt ?? ""}
                onChange={(e) => onUpdateAlt(img.id, e.target.value)}
              />
              <div style={{ display: "flex", justifyContent: "space-between", gap: 4 }}>
                <div style={{ display: "flex", gap: 4 }}>
                  <button
                    type="button"
                    className="btn btn-sm btn-ghost"
                    onClick={() => onReorder(img.id, -1)}
                    disabled={idx === 0}
                    title="Move earlier"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-ghost"
                    onClick={() => onReorder(img.id, 1)}
                    disabled={idx === images.length - 1}
                    title="Move later"
                  >
                    ↓
                  </button>
                </div>
                <button
                  type="button"
                  className="btn btn-sm"
                  style={{ borderColor: "var(--accent-2)", color: "var(--accent-2)" }}
                  onClick={() => onRemoveImage(img.id)}
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}

        {canUpload && (
          <button
            type="button"
            onClick={onAddImage}
            style={{
              aspectRatio: "1 / 1",
              border: "2px dashed var(--rule)",
              borderRadius: 6,
              background: "transparent",
              color: "var(--ink-soft)",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
              fontFamily: "var(--font-geist), sans-serif",
              fontSize: 13,
            }}
          >
            <span style={{ fontSize: 22, lineHeight: 1 }}>+</span>
            <span>Add image</span>
          </button>
        )}
      </div>
    </div>
  );
}

// ── PricingExtrasTab — wraps PricingStack + adds compare-at/cost/taxable rows ─

interface PricingExtrasProps {
  readonly product: AtlasProduct;
  readonly onChange: (patch: Partial<AtlasProduct>) => void;
}

export function PricingExtras({ product, onChange }: PricingExtrasProps) {
  return (
    <div className="prod-editor-shell" style={{ paddingTop: 8 }}>
      <Sec n="§1" h="Base prices" meta="base, compare-at, cost — all in storefront currency" />
      <div style={triGridStyle}>
        <div>
          <label style={labelStyle}>Base price</label>
          <input
            type="number"
            step="0.01"
            min="0"
            style={numericInputStyle}
            value={centsToDollars(product.basePrice)}
            onChange={(e) => {
              const cents = dollarsToCents(e.target.value);
              onChange({ basePrice: cents ?? 0 });
            }}
          />
        </div>
        <div>
          <label style={labelStyle}>Compare-at price</label>
          <input
            type="number"
            step="0.01"
            min="0"
            style={numericInputStyle}
            value={centsToDollars(product.compareAtPrice)}
            onChange={(e) =>
              onChange({ compareAtPrice: dollarsToCents(e.target.value) })
            }
            placeholder="Original price"
          />
          <p style={helperStyle}>Shows crossed-out on storefront when set.</p>
        </div>
        <div>
          <label style={labelStyle}>Cost price</label>
          <input
            type="number"
            step="0.01"
            min="0"
            style={numericInputStyle}
            value={centsToDollars(product.costPrice)}
            onChange={(e) =>
              onChange({ costPrice: dollarsToCents(e.target.value) })
            }
          />
          <p style={helperStyle}>Used for margin reporting only.</p>
        </div>
      </div>

      <Sec n="§2" h="Tax" meta="charged at checkout when taxable" />
      <div style={rowGridStyle}>
        <div>
          <label style={labelStyle}>Taxable</label>
          <TogglePill
            on={product.taxable !== false}
            onLabel="taxable"
            offLabel="not taxable"
            onChange={(v) => onChange({ taxable: v })}
          />
        </div>
        {product.taxable !== false && (
          <div>
            <label style={labelStyle}>Tax code</label>
            <input
              style={inputStyle}
              value={product.taxCode ?? ""}
              onChange={(e) => onChange({ taxCode: e.target.value || null })}
              placeholder="e.g. txcd_30000000"
            />
            <p style={helperStyle}>Stripe Tax / external tax category code.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── InventoryTab (with Shipping section inline) ───────────────────────────────

interface InventoryTabProps {
  readonly product: AtlasProduct;
  readonly onChange: (patch: Partial<AtlasProduct>) => void;
  readonly variantStockSummary: { readonly variants: number; readonly totalStock: number } | null;
}

export function InventoryTab({ product, onChange, variantStockSummary }: InventoryTabProps) {
  const tracking = product.trackInventory !== false;
  return (
    <div className="prod-editor-shell" style={{ paddingTop: 8 }}>
      <Sec n="§1" h="Stock" meta="quantity, low-stock alert, backorder" />
      <div style={triGridStyle}>
        <div>
          <label style={labelStyle}>Track inventory</label>
          <TogglePill
            on={tracking}
            onLabel="tracked"
            offLabel="untracked"
            onChange={(v) => onChange({ trackInventory: v })}
          />
        </div>
        {tracking && (
          <>
            <div>
              <label style={labelStyle}>Stock quantity</label>
              <input
                type="number"
                min="0"
                style={numericInputStyle}
                value={product.stock ?? 0}
                onChange={(e) =>
                  onChange({ stock: Number.parseInt(e.target.value, 10) || 0 })
                }
              />
              {variantStockSummary && variantStockSummary.variants > 0 && (
                <p style={helperStyle}>
                  Variants roll-up: {variantStockSummary.totalStock} across {variantStockSummary.variants}{" "}
                  variant{variantStockSummary.variants === 1 ? "" : "s"}.
                </p>
              )}
            </div>
            <div>
              <label style={labelStyle}>Low-stock threshold</label>
              <input
                type="number"
                min="0"
                style={numericInputStyle}
                value={product.lowStockThreshold ?? 5}
                onChange={(e) =>
                  onChange({
                    lowStockThreshold: Number.parseInt(e.target.value, 10) || 0,
                  })
                }
              />
              <p style={helperStyle}>Trigger low-stock alerts at this count.</p>
            </div>
            <div>
              <label style={labelStyle}>Backorders</label>
              <TogglePill
                on={Boolean(product.allowBackorder)}
                onLabel="allowed"
                offLabel="blocked"
                onChange={(v) => onChange({ allowBackorder: v })}
              />
              <p style={helperStyle}>Allow buyers to order when stock = 0.</p>
            </div>
          </>
        )}
      </div>

      <Sec n="§2" h="Shipping" meta="requires-shipping + weight + dimensions" />
      <div style={triGridStyle}>
        <div>
          <label style={labelStyle}>Requires shipping</label>
          <TogglePill
            on={product.requiresShipping !== false}
            onLabel="physical"
            offLabel="not shipped"
            onChange={(v) => onChange({ requiresShipping: v })}
          />
        </div>
      </div>
      {product.requiresShipping !== false && (
        <div style={quadGridStyle}>
          <div>
            <label style={labelStyle}>Weight (oz)</label>
            <input
              type="number"
              step="0.1"
              min="0"
              style={numericInputStyle}
              value={product.weight ?? ""}
              onChange={(e) =>
                onChange({
                  weight:
                    e.target.value.trim() === ""
                      ? null
                      : Number.parseFloat(e.target.value),
                })
              }
            />
          </div>
          <div>
            <label style={labelStyle}>Length (in)</label>
            <input
              type="number"
              step="0.1"
              min="0"
              style={numericInputStyle}
              value={product.length ?? ""}
              onChange={(e) =>
                onChange({
                  length:
                    e.target.value.trim() === ""
                      ? null
                      : Number.parseFloat(e.target.value),
                })
              }
            />
          </div>
          <div>
            <label style={labelStyle}>Width (in)</label>
            <input
              type="number"
              step="0.1"
              min="0"
              style={numericInputStyle}
              value={product.width ?? ""}
              onChange={(e) =>
                onChange({
                  width:
                    e.target.value.trim() === ""
                      ? null
                      : Number.parseFloat(e.target.value),
                })
              }
            />
          </div>
          <div>
            <label style={labelStyle}>Height (in)</label>
            <input
              type="number"
              step="0.1"
              min="0"
              style={numericInputStyle}
              value={product.height ?? ""}
              onChange={(e) =>
                onChange({
                  height:
                    e.target.value.trim() === ""
                      ? null
                      : Number.parseFloat(e.target.value),
                })
              }
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ── ChannelsTab — Stripe + Storefront + Shopify (status only) ─────────────────

interface ChannelsTabProps {
  readonly product: AtlasProduct;
  readonly onChange: (patch: Partial<AtlasProduct>) => void;
  readonly hasBeenSaved: boolean;
  readonly syncingStripe: boolean;
  readonly onSyncStripe: () => void;
}

export function ChannelsTab({
  product,
  onChange,
  hasBeenSaved,
  syncingStripe,
  onSyncStripe,
}: ChannelsTabProps) {
  return (
    <div className="prod-editor-shell" style={{ paddingTop: 8 }}>
      <Sec n="§1" h="Storefront (web)" meta="visibility on this tenant's web storefront" />
      <div style={rowGridStyle}>
        <div>
          <label style={labelStyle}>Web status</label>
          <select
            style={{ ...inputStyle, cursor: "pointer" }}
            value={product.status}
            onChange={(e) =>
              onChange({ status: e.target.value as AtlasProduct["status"] })
            }
          >
            <option value="DRAFT">Draft (hidden)</option>
            <option value="ACTIVE">Active (published)</option>
            <option value="ARCHIVED">Archived (hidden)</option>
          </select>
          <p style={helperStyle}>Only ACTIVE products appear on the web storefront.</p>
        </div>
      </div>

      <Sec n="§2" h="Stripe" meta="sync this product + variants to Stripe" />
      <div style={{ padding: "8px 0 16px" }}>
        {!hasBeenSaved ? (
          <p style={{ ...helperStyle, margin: 0 }}>Save the product first to enable Stripe sync.</p>
        ) : product.stripeProductId ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span className="pill pill-solid-accent" style={{ fontSize: 11 }}>Synced</span>
              <span style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 12 }}>
                {product.stripeProductId}
              </span>
              {product.stripeSyncedAt && (
                <span style={{ ...helperStyle, marginTop: 0 }}>
                  Last sync: {new Date(product.stripeSyncedAt).toLocaleString()}
                </span>
              )}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                className="btn btn-sm"
                onClick={() =>
                  window.open(
                    `https://dashboard.stripe.com/products/${product.stripeProductId}`,
                    "_blank",
                    "noopener,noreferrer"
                  )
                }
              >
                View in Stripe ↗
              </button>
              <button
                type="button"
                className="btn btn-sm btn-accent"
                onClick={onSyncStripe}
                disabled={syncingStripe}
              >
                {syncingStripe ? "Re-syncing…" : "Re-sync"}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span className="pill pill-out" style={{ fontSize: 11, width: "fit-content" }}>
              Not synced
            </span>
            <button
              type="button"
              className="btn btn-sm btn-accent"
              style={{ width: "fit-content" }}
              onClick={onSyncStripe}
              disabled={syncingStripe}
            >
              {syncingStripe ? "Syncing…" : "Sync to Stripe"}
            </button>
          </div>
        )}
        {product.stripeSyncError && (
          <div
            style={{
              marginTop: 8,
              padding: 8,
              border: "1px solid var(--accent-2)",
              borderRadius: 4,
              color: "var(--accent-2)",
              fontSize: 12,
              fontFamily: "var(--font-geist-mono), monospace",
              whiteSpace: "pre-wrap",
            }}
          >
            {product.stripeSyncError}
          </div>
        )}
      </div>

      {product.shopifyProductId && (
        <>
          <Sec n="§3" h="Shopify" meta="read-only status (sync managed via Shopify provider)" />
          <div style={{ padding: "8px 0 16px" }}>
            <span className="pill pill-solid-accent" style={{ fontSize: 11 }}>Connected</span>
            <span
              style={{
                marginLeft: 10,
                fontFamily: "var(--font-geist-mono), monospace",
                fontSize: 12,
              }}
            >
              {product.shopifyProductId}
            </span>
            {product.shopifySyncedAt && (
              <p style={helperStyle}>
                Last Shopify sync: {new Date(product.shopifySyncedAt).toLocaleString()}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ── SeoTab ────────────────────────────────────────────────────────────────────

interface SeoTabProps {
  readonly product: AtlasProduct;
  readonly onChange: (patch: Partial<AtlasProduct>) => void;
}

export function SeoTab({ product, onChange }: SeoTabProps) {
  const titleLen = (product.metaTitle ?? "").length;
  const descLen = (product.metaDescription ?? "").length;
  return (
    <div className="prod-editor-shell" style={{ paddingTop: 8 }}>
      <Sec n="§1" h="Search engine listing" meta="title + description shown in Google" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 14, padding: "8px 0 16px" }}>
        <div>
          <label style={labelStyle}>Meta title</label>
          <input
            style={inputStyle}
            value={product.metaTitle ?? ""}
            onChange={(e) => onChange({ metaTitle: e.target.value || null })}
            placeholder={product.title || "Product title"}
            maxLength={120}
          />
          <p
            style={{
              ...helperStyle,
              color: titleLen > 60 ? "var(--accent-2)" : "var(--ink-faint)",
            }}
          >
            {titleLen}/60 characters
          </p>
        </div>

        <div>
          <label style={labelStyle}>Meta description</label>
          <textarea
            style={{ ...inputStyle, minHeight: 90, resize: "vertical" }}
            value={product.metaDescription ?? ""}
            onChange={(e) => onChange({ metaDescription: e.target.value || null })}
            placeholder="Short summary shown in search results."
            maxLength={320}
          />
          <p
            style={{
              ...helperStyle,
              color: descLen > 160 ? "var(--accent-2)" : "var(--ink-faint)",
            }}
          >
            {descLen}/160 characters
          </p>
        </div>

        <div>
          <label style={labelStyle}>URL slug</label>
          <input
            style={monoInputStyle}
            value={product.slug ?? ""}
            onChange={(e) => onChange({ slug: e.target.value })}
          />
          <p style={helperStyle}>Mirrors the slug from the Detail tab.</p>
        </div>
      </div>

      <Sec n="§2" h="Preview" meta="search snippet approximation" />
      <div
        style={{
          padding: 14,
          border: "1px solid var(--rule)",
          borderRadius: 4,
          background: "var(--paper-2)",
          fontFamily: "var(--font-geist), Arial, sans-serif",
          margin: "8px 0 24px",
        }}
      >
        <div style={{ color: "#1a0dab", fontSize: 18, lineHeight: 1.3 }}>
          {product.metaTitle || product.title || "Product title"}
        </div>
        <div style={{ color: "#006621", fontSize: 12, margin: "2px 0 4px" }}>
          /{product.slug || "product-slug"}
        </div>
        <div style={{ color: "#545454", fontSize: 13, lineHeight: 1.45 }}>
          {product.metaDescription || product.description || "Add a description to preview the search snippet."}
        </div>
      </div>
    </div>
  );
}

// ── ScheduleTab (SERVICE) — duration + capacity ───────────────────────────────

interface ScheduleTabProps {
  readonly product: AtlasProduct;
  readonly onChange: (patch: Partial<AtlasProduct>) => void;
}

export function ScheduleTab({ product, onChange }: ScheduleTabProps) {
  return (
    <div className="prod-editor-shell" style={{ paddingTop: 8 }}>
      <Sec n="§1" h="Service settings" meta="duration and per-slot capacity" />
      <div style={rowGridStyle}>
        <div>
          <label style={labelStyle}>Duration (minutes)</label>
          <input
            type="number"
            min="1"
            style={numericInputStyle}
            value={product.serviceDuration ?? 60}
            onChange={(e) =>
              onChange({ serviceDuration: Number.parseInt(e.target.value, 10) || null })
            }
          />
          <p style={helperStyle}>Length of a single appointment / session.</p>
        </div>
        <div>
          <label style={labelStyle}>Max bookings per slot</label>
          <input
            type="number"
            min="1"
            style={numericInputStyle}
            value={product.serviceCapacity ?? 1}
            onChange={(e) =>
              onChange({ serviceCapacity: Number.parseInt(e.target.value, 10) || null })
            }
          />
          <p style={helperStyle}>Concurrent bookings allowed (1 = exclusive slot).</p>
        </div>
      </div>
      <p style={{ ...helperStyle, padding: "0 0 16px" }}>
        Bookable availability windows are not yet backed by the data model and will land in a follow-up
        phase. Duration + capacity are persisted today.
      </p>
    </div>
  );
}

// ── BillingTab (SUBSCRIPTION) — interval + count + trial days ─────────────────

const SUBSCRIPTION_INTERVALS = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "year", label: "Year" },
] as const;

interface BillingTabProps {
  readonly product: AtlasProduct;
  readonly onChange: (patch: Partial<AtlasProduct>) => void;
}

export function BillingTab({ product, onChange }: BillingTabProps) {
  return (
    <div className="prod-editor-shell" style={{ paddingTop: 8 }}>
      <Sec n="§1" h="Billing cycle" meta="recurrence interval, trial" />
      <div style={triGridStyle}>
        <div>
          <label style={labelStyle}>Billing interval</label>
          <select
            style={{ ...inputStyle, cursor: "pointer" }}
            value={product.subscriptionInterval ?? "month"}
            onChange={(e) => onChange({ subscriptionInterval: e.target.value })}
          >
            {SUBSCRIPTION_INTERVALS.map((iv) => (
              <option key={iv.value} value={iv.value}>
                {iv.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Interval count</label>
          <input
            type="number"
            min="1"
            style={numericInputStyle}
            value={product.subscriptionIntervalCount ?? 1}
            onChange={(e) =>
              onChange({
                subscriptionIntervalCount: Number.parseInt(e.target.value, 10) || 1,
              })
            }
          />
          <p style={helperStyle}>e.g. 3 with month = quarterly.</p>
        </div>
        <div>
          <label style={labelStyle}>Trial days</label>
          <input
            type="number"
            min="0"
            style={numericInputStyle}
            value={product.trialDays ?? 0}
            onChange={(e) =>
              onChange({ trialDays: Number.parseInt(e.target.value, 10) || 0 })
            }
          />
          <p style={helperStyle}>Free-trial period before first charge.</p>
        </div>
      </div>
      <p style={{ ...helperStyle, padding: "0 0 16px" }}>
        Advanced lifecycle / dunning rules (retry windows, downgrade ladders, cancellation flows) are not
        yet persisted to the schema — they will land in a dedicated follow-up phase.
      </p>
    </div>
  );
}
