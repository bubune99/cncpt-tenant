"use client";
/**
 * EditorHeader — Grainy product-editor masthead.
 *
 * Back-link + category crumb, swatch + title + id, type / status / featured /
 * Stripe badges, and the action cluster (Preview + Save). Mirrors the orders
 * detail header so the admin shares one chrome vocabulary.
 */

import React from "react";
import { ChevronLeft } from "lucide-react";
import { Badge } from "../../admin/grainy-ui";
import type { BadgeTone } from "../../admin/orders/orders-model";
import type { AtlasProduct } from "../atlas-types";

const STATUS_TONE: Record<AtlasProduct["status"], BadgeTone> = {
  ACTIVE: "sage",
  DRAFT: "neutral",
  ARCHIVED: "ochre",
};

export function EditorHeader({
  product,
  isNew,
  isDirty,
  saving,
  variantCount,
  customFieldCount,
  backHref,
  onSave,
}: {
  readonly product: AtlasProduct;
  readonly isNew: boolean;
  readonly isDirty: boolean;
  readonly saving: boolean;
  readonly variantCount: number;
  readonly customFieldCount: number;
  readonly backHref: string;
  readonly onSave: () => void;
}): React.ReactElement {
  const hasBeenSaved = !isNew && Boolean(product.id);
  const title = isNew ? product.title || "New product" : product.title || "Untitled";
  const saveLabel = saving
    ? isNew ? "Creating…" : "Saving…"
    : isNew ? "Create" : isDirty ? "Save" : "Saved";

  return (
    <div style={{ padding: "18px 26px 0", flex: "none" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <a
              href={backHref}
              className="gr-link"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                fontSize: 12,
                fontFamily: "var(--font-mono)",
                textTransform: "uppercase",
                letterSpacing: ".06em",
              }}
            >
              <ChevronLeft size={13} />Products
            </a>
            <span className="gr-num" style={{ fontSize: 11, color: "var(--text-muted)" }}>
              / {product.type.toLowerCase()}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <h1 style={{ fontSize: "var(--text-xl)", margin: 0, letterSpacing: "-0.02em" }}>{title}</h1>
            {product.sku && (
              <span className="gr-num" style={{ fontSize: 12.5, color: "var(--text-muted)" }}>{product.sku}</span>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 9, flexWrap: "wrap" }}>
            <Badge tone="clay">{product.type}</Badge>
            <Badge tone={STATUS_TONE[product.status]}>{product.status}</Badge>
            {product.featured && <Badge tone="ochre">Featured</Badge>}
            {product.stripeProductId && <Badge tone="blue">Stripe ✓</Badge>}
            {isNew && <Badge tone="neutral">Unsaved</Badge>}
            {variantCount > 0 && (
              <span style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
                {variantCount} variant{variantCount === 1 ? "" : "s"}
                {customFieldCount > 0 ? ` · ${customFieldCount} custom field${customFieldCount === 1 ? "" : "s"}` : ""}
              </span>
            )}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flex: "none", alignItems: "center" }}>
          {hasBeenSaved && product.slug && (
            <a
              className="btn btn-secondary btn-sm"
              href={`/products/${product.slug}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Preview ↗
            </a>
          )}
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={onSave}
            data-tour-id="product-form-save"
            disabled={saving || (!isDirty && !isNew)}
          >
            {saveLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
