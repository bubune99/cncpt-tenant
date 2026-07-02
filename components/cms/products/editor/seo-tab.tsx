"use client";
/**
 * SeoTab — meta title (60ch) + meta description (160ch) + slug mirror + preview.
 */

import React from "react";
import { Search } from "lucide-react";
import type { AtlasProduct } from "../atlas-types";
import { SectionHead, Field, tabShell, hintStyle } from "./form-primitives";

interface SeoTabProps {
  readonly product: AtlasProduct;
  readonly onChange: (patch: Partial<AtlasProduct>) => void;
}

export function SeoTab({ product, onChange }: SeoTabProps): React.ReactElement {
  const titleLen = (product.metaTitle ?? "").length;
  const descLen = (product.metaDescription ?? "").length;
  const counter = (len: number, max: number): React.ReactNode => (
    <span style={{ color: len > max ? "var(--rust-700)" : "var(--text-muted)" }}>{len}/{max} characters</span>
  );

  return (
    <div style={tabShell}>
      <SectionHead icon={Search} title="Search engine listing" meta="title + description shown in Google" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16, paddingBottom: 16, maxWidth: 640 }}>
        <Field label="Meta title" hint={counter(titleLen, 60)}>
          <input
            className="input"
            value={product.metaTitle ?? ""}
            onChange={(e) => onChange({ metaTitle: e.target.value || null })}
            placeholder={product.title || "Product title"}
            maxLength={120}
          />
        </Field>
        <Field label="Meta description" hint={counter(descLen, 160)}>
          <textarea
            className="textarea"
            style={{ minHeight: 90 }}
            value={product.metaDescription ?? ""}
            onChange={(e) => onChange({ metaDescription: e.target.value || null })}
            placeholder="Short summary shown in search results."
            maxLength={320}
          />
        </Field>
        <Field label="URL slug" hint="Mirrors the slug from the Detail tab.">
          <input
            className="input"
            style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}
            value={product.slug ?? ""}
            onChange={(e) => onChange({ slug: e.target.value })}
          />
        </Field>
      </div>

      <SectionHead title="Preview" meta="search snippet approximation" />
      <div className="gr-card" style={{ padding: 16, maxWidth: 640, fontFamily: "var(--font-sans)" }}>
        <div style={{ color: "var(--link, #1a0dab)", fontSize: 18, lineHeight: 1.3 }}>
          {product.metaTitle || product.title || "Product title"}
        </div>
        <div style={{ color: "var(--sage-700)", fontSize: 12, margin: "2px 0 5px" }}>
          /{product.slug || "product-slug"}
        </div>
        <div style={{ color: "var(--text-secondary)", fontSize: 13, lineHeight: 1.45 }}>
          {product.metaDescription || product.description || "Add a description to preview the search snippet."}
        </div>
      </div>
      <p style={{ ...hintStyle, paddingTop: 10 }}>Aim for a title under 60 characters and a description under 160.</p>
    </div>
  );
}
