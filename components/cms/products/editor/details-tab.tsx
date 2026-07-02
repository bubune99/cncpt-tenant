"use client";
/**
 * DetailTab — title, slug, sku, barcode, description, status, featured, categories.
 * Purely controlled: the controller hook owns state; this renders Grainy inputs.
 */

import React from "react";
import { FileText, Layers } from "lucide-react";
import type { AtlasProduct } from "../atlas-types";
import type { EditorCategory } from "./editor-model";
import { SectionHead, Field, Toggle, twoCol, tabShell, hintStyle } from "./form-primitives";

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
}: DetailTabProps): React.ReactElement {
  const toggleCategory = (id: string) => {
    const next = selectedCategoryIds.includes(id)
      ? selectedCategoryIds.filter((c) => c !== id)
      : [...selectedCategoryIds, id];
    onCategoriesChange(next);
  };

  return (
    <div style={tabShell}>
      <SectionHead icon={FileText} title="Core details" meta="title, slug, description, status" />
      <div style={twoCol}>
        <Field label="Title *" full>
          <input
            data-tour-id="product-form-title"
            className="input"
            value={product.title}
            onChange={(e) => onChange({ title: e.target.value })}
            placeholder="Enter product name"
          />
        </Field>

        <Field label="Slug" hint="Leave blank to auto-generate from title.">
          <div style={{ display: "flex", gap: 6 }}>
            <input
              data-tour-id="product-form-slug"
              className="input"
              style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}
              value={product.slug ?? ""}
              onChange={(e) => onChange({ slug: e.target.value })}
              placeholder="auto-generated-from-title"
            />
            {onAutoSlug && (
              <button type="button" className="btn btn-secondary btn-sm" onClick={onAutoSlug}>
                Auto
              </button>
            )}
          </div>
        </Field>

        <Field label="Base SKU">
          <input
            data-tour-id="product-form-sku"
            className="input"
            style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}
            value={product.sku ?? ""}
            onChange={(e) => onChange({ sku: e.target.value || null })}
            placeholder="Product SKU"
          />
        </Field>

        <Field label="Barcode">
          <input
            className="input"
            style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}
            value={product.barcode ?? ""}
            onChange={(e) => onChange({ barcode: e.target.value || null })}
            placeholder="UPC, EAN, ISBN, …"
          />
        </Field>

        <Field label="Status">
          <select
            className="select"
            value={product.status}
            onChange={(e) => onChange({ status: e.target.value as AtlasProduct["status"] })}
          >
            <option value="DRAFT">Draft</option>
            <option value="ACTIVE">Active</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </Field>

        <Field label="Description" full>
          <textarea
            className="textarea"
            style={{ minHeight: 110 }}
            value={product.description ?? ""}
            onChange={(e) => onChange({ description: e.target.value || null })}
            placeholder="Describe your product…"
          />
        </Field>

        <Field label="Featured" full>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Toggle
              on={Boolean(product.featured)}
              onLabel="featured"
              offLabel="not featured"
              onChange={(v) => onChange({ featured: v })}
            />
            <p style={{ ...hintStyle, margin: 0 }}>Featured products appear in storefront highlight slots.</p>
          </div>
        </Field>
      </div>

      <SectionHead icon={Layers} title="Categories" meta="storefront collections" />
      <div style={{ paddingBottom: 16 }}>
        {categories.length === 0 ? (
          <p style={hintStyle}>
            No categories defined yet. Create categories in the Collections section to organise products.
          </p>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {categories.map((cat) => {
              const selected = selectedCategoryIds.includes(cat.id);
              return (
                <button
                  key={cat.id}
                  type="button"
                  className={"chip" + (selected ? " active" : "")}
                  onClick={() => toggleCategory(cat.id)}
                  style={{ cursor: "pointer" }}
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
