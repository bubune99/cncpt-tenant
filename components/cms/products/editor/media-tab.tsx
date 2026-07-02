"use client";
/**
 * MediaTab — product image gallery (grid + add + reorder + alt + delete).
 * The variant-image bulk-assign board (MediaBulkAssign) is rendered by the
 * shell below this when the product is saved and has variants.
 */

import React from "react";
import { Image as ImageIcon, ArrowUp, ArrowDown, Plus } from "lucide-react";
import { SectionHead, tabShell, hintStyle } from "./form-primitives";
import type { ProductImageRow } from "./editor-model";

interface MediaTabProps {
  readonly images: ReadonlyArray<ProductImageRow>;
  readonly canUpload: boolean;
  readonly onAddImage: () => void;
  readonly onRemoveImage: (imageId: string) => void;
  readonly onUpdateAlt: (imageId: string, alt: string) => void;
  readonly onReorder: (imageId: string, direction: -1 | 1) => void;
}

export function MediaTab({
  images,
  canUpload,
  onAddImage,
  onRemoveImage,
  onUpdateAlt,
  onReorder,
}: MediaTabProps): React.ReactElement {
  return (
    <div style={tabShell}>
      <SectionHead
        icon={ImageIcon}
        title="Images"
        meta={`${images.length} image${images.length === 1 ? "" : "s"} · reorder via arrows`}
      />

      {!canUpload && (
        <div
          style={{
            padding: 14,
            border: "1px dashed var(--line-strong)",
            borderRadius: "var(--r-md)",
            margin: "0 0 12px",
            color: "var(--text-muted)",
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
          paddingBottom: 24,
        }}
      >
        {images.map((img, idx) => (
          <div
            key={img.id}
            className="gr-card"
            style={{ overflow: "hidden", display: "flex", flexDirection: "column", padding: 0 }}
          >
            <div style={{ aspectRatio: "1 / 1", background: "var(--surface-sunken)", position: "relative" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.media.url}
                alt={img.alt ?? img.media.alt ?? `Image ${idx + 1}`}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
              {idx === 0 && (
                <span
                  className="badge badge-clay"
                  style={{ position: "absolute", top: 6, left: 6, fontSize: 10 }}
                >
                  Primary
                </span>
              )}
            </div>
            <div style={{ padding: 8, display: "flex", flexDirection: "column", gap: 7 }}>
              <input
                aria-label="Alt text"
                className="input"
                style={{ fontSize: 11.5 }}
                placeholder="Alt text (accessibility)"
                value={img.alt ?? ""}
                onChange={(e) => onUpdateAlt(img.id, e.target.value)}
              />
              <div style={{ display: "flex", justifyContent: "space-between", gap: 4 }}>
                <div style={{ display: "flex", gap: 4 }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => onReorder(img.id, -1)}
                    disabled={idx === 0}
                    title="Move earlier"
                  >
                    <ArrowUp size={13} />
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => onReorder(img.id, 1)}
                    disabled={idx === images.length - 1}
                    title="Move later"
                  >
                    <ArrowDown size={13} />
                  </button>
                </div>
                <button
                  type="button"
                  className="btn btn-sm"
                  style={{ borderColor: "var(--rust-500)", color: "var(--rust-700)" }}
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
              border: "2px dashed var(--line-strong)",
              borderRadius: "var(--r-md)",
              background: "transparent",
              color: "var(--text-muted)",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              fontSize: 13,
            }}
          >
            <Plus size={22} />
            <span>Add image</span>
          </button>
        )}
      </div>

      {images.length === 0 && canUpload && (
        <p style={hintStyle}>Add product photos — the first image becomes the storefront cover.</p>
      )}
    </div>
  );
}
