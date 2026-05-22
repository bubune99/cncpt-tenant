"use client";
/**
 * BundleComposer — Atlas Product Editor Frame F7
 * BUNDLE type editor: drag products in, set quantities, fixed/calculated pricing.
 * Live price math; inventory constrained by lowest-stock child.
 */

import React, { useState, useCallback } from "react";
import { Sec, SaveBar } from "./atlas-product-ui";
import type { AtlasBundleItem } from "./atlas-types";

// ── Props ──────────────────────────────────────────────────────────────────
interface BundleComposerProps {
  readonly items: ReadonlyArray<AtlasBundleItem>;
  readonly priceMode: "fixed" | "calculated";
  readonly fixedPrice: number; // cents
  readonly allowVariantChoice: boolean;
  readonly allowSubstitutions: boolean;
  readonly includeGiftWrap: boolean;
  readonly onAddItem?: (productId: string) => void;
  readonly onRemoveItem?: (index: number) => void;
  readonly onUpdateQty?: (index: number, qty: number) => void;
  readonly onPriceModeChange?: (mode: "fixed" | "calculated") => void;
  readonly onFixedPriceChange?: (price: number) => void;
  readonly onAllowVariantChoiceChange?: (value: boolean) => void;
  readonly onAllowSubstitutionsChange?: (value: boolean) => void;
  readonly onIncludeGiftWrapChange?: (value: boolean) => void;
  readonly savedAt?: string;
  readonly isDirty?: boolean;
}

// ── Component ──────────────────────────────────────────────────────────────
export function BundleComposer({
  items,
  priceMode,
  fixedPrice,
  allowVariantChoice,
  allowSubstitutions,
  includeGiftWrap,
  onAddItem,
  onRemoveItem,
  onUpdateQty,
  onPriceModeChange,
  onFixedPriceChange,
  onAllowVariantChoiceChange,
  onAllowSubstitutionsChange,
  onIncludeGiftWrapChange,
  savedAt,
  isDirty = false,
}: BundleComposerProps) {
  const [fixedPriceInput, setFixedPriceInput] = useState(
    (fixedPrice / 100).toFixed(2)
  );

  // ── Computed ─────────────────────────────────────────────────────────────
  const sumRetail = items.reduce((sum, it) => sum + it.price * it.quantity, 0); // cents
  const bundlePrice = priceMode === "fixed" ? fixedPrice : sumRetail;
  const savings = sumRetail - bundlePrice;
  const savingsPct = sumRetail > 0 ? Math.round((savings / sumRetail) * 100) : 0;

  const limitingItem = items
    .filter((it) => it.stock !== null && it.stock !== Infinity)
    .reduce<AtlasBundleItem | null>((lowest, it) => {
      if (it.stock === null) return lowest;
      if (!lowest || (lowest.stock !== null && it.stock < lowest.stock)) return it;
      return lowest;
    }, null);

  const handleQty = useCallback(
    (index: number, delta: number) => {
      const current = items[index]?.quantity ?? 1;
      const next = Math.max(1, current + delta);
      onUpdateQty?.(index, next);
    },
    [items, onUpdateQty]
  );

  const handleFixedPriceBlur = useCallback(() => {
    const price = Math.round(parseFloat(fixedPriceInput) * 100);
    if (!isNaN(price)) onFixedPriceChange?.(price);
  }, [fixedPriceInput, onFixedPriceChange]);

  return (
    <div className="prod-editor-shell" style={{ paddingTop: 8 }}>
      <div className="bundle-wrap">
        {/* LEFT: items list */}
        <div className="bundle-col">
          <Sec
            h="Contents"
            meta="drag to reorder · click thumb to swap variant"
            right={<span className="mono" style={{ fontSize: 10 }}>{items.length} items · {items.length} SKUs</span>}
          />

          <div className="bundle-list">
            {/* Header */}
            <div
              className="bundle-row"
              style={{
                background: "var(--paper-3)", borderBottom: "1px solid var(--ink)", padding: "6px 14px",
                fontFamily: "var(--font-geist-mono), monospace", fontSize: 9.5,
                letterSpacing: ".1em", textTransform: "uppercase", color: "var(--ink-soft)",
              }}
            >
              <span />
              <span />
              <span>Product</span>
              <span style={{ textAlign: "center" }}>Quantity</span>
              <span style={{ textAlign: "right" }}>Retail</span>
              <span style={{ textAlign: "right" }}>Subtotal</span>
              <span />
            </div>

            {items.map((it, i) => (
              <div key={`${it.productId}-${i}`} className="bundle-row">
                <span className="grip">⋮⋮</span>
                <div
                  className="thumb"
                  style={{ background: `${it.hex}22` }}
                >
                  <span style={{ background: it.hex, width: 6, height: 6, borderRadius: "50%", display: "inline-block" }} />
                </div>
                <div>
                  <div className="name">{it.productTitle}</div>
                  <div className="meta">
                    <span className="type-pill">{it.productType}</span>
                    {it.variantLabel} ·{" "}
                    <span style={{
                      color: it.stock === 0 ? "var(--accent)"
                        : it.stock === null ? "var(--moss)"
                        : "var(--ink-soft)"
                    }}>
                      stock {it.stock === null ? "∞" : it.stock}
                    </span>
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "center" }}>
                  <span className="qty-stepper">
                    <button onClick={() => handleQty(i, -1)}>−</button>
                    <input
                      value={it.quantity}
                      readOnly
                      onChange={() => void 0}
                    />
                    <button onClick={() => handleQty(i, 1)}>+</button>
                  </span>
                </div>
                <span className="num">${(it.price / 100).toFixed(2)}</span>
                <span className="num" style={{ fontWeight: 500 }}>
                  ${(it.price * it.quantity / 100).toFixed(2)}
                </span>
                <span
                  style={{ color: "var(--ink-faint)", cursor: "pointer", textAlign: "center" }}
                  onClick={() => onRemoveItem?.(i)}
                >
                  ×
                </span>
              </div>
            ))}

            <div className="bundle-drop">
              ⇩ drop a product here — or{" "}
              <span
                style={{ color: "var(--accent)", fontStyle: "normal", fontWeight: 500, cursor: "pointer" }}
                onClick={() => onAddItem?.("")}
              >
                search the catalog ⌘K
              </span>
            </div>
          </div>

          {/* Options & Inventory rules */}
          <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div style={{ background: "var(--paper-2)", border: "1px solid var(--rule)", borderRadius: "var(--r-sm)", padding: 12 }}>
              <div style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--ink-soft)", marginBottom: 6 }}>
                Customer choices
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, padding: "3px 0", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={allowVariantChoice}
                  onChange={(e) => onAllowVariantChoiceChange?.(e.target.checked)}
                />
                Let customer pick variants for VARIABLE items
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, padding: "3px 0", color: "var(--ink-soft)", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={allowSubstitutions}
                  onChange={(e) => onAllowSubstitutionsChange?.(e.target.checked)}
                />
                Allow substitutions if out of stock
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, padding: "3px 0", color: "var(--ink-soft)", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={includeGiftWrap}
                  onChange={(e) => onIncludeGiftWrapChange?.(e.target.checked)}
                />
                Include gift wrap option
              </label>
            </div>

            <div style={{ background: "var(--paper-2)", border: "1px solid var(--rule)", borderRadius: "var(--r-sm)", padding: 12 }}>
              <div style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--ink-soft)", marginBottom: 6 }}>
                Inventory rules
              </div>
              <div style={{ fontSize: 12.5, lineHeight: 1.5, fontFamily: "var(--font-display), Spectral, serif", fontStyle: "italic", color: "var(--ink-soft)" }}>
                Bundle stock = min(child stock).
                {limitingItem && (
                  <div style={{ marginTop: 4, fontStyle: "normal", fontFamily: "var(--font-geist-mono), monospace", fontSize: 11, color: "var(--accent)" }}>
                    limit: {limitingItem.variantLabel} · {limitingItem.stock} on hand
                  </div>
                )}
                <div style={{ marginTop: 6, fontFamily: "var(--font-geist), sans-serif", fontStyle: "normal", color: "var(--ink-soft)", fontSize: 11.5 }}>
                  Selling the bundle <b>reserves</b> 1 of each child.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: pricing summary */}
        <div className="bundle-col">
          <Sec h="Pricing" meta="bundle math" />

          <div className="summary-card">
            <div style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--ink-soft)", marginBottom: 6 }}>
              Sum of children
            </div>
            {items.map((it, i) => (
              <div key={i} className="row" style={{ fontSize: 12 }}>
                <span className="fig" style={{ fontStyle: "italic", fontSize: 11.5 }}>{it.productTitle}</span>
                <span className="v">${(it.price * it.quantity / 100).toFixed(2)}</span>
              </div>
            ))}
            <div className="row" style={{ borderTop: "1px solid var(--rule-soft)", marginTop: 4, paddingTop: 6, fontWeight: 500 }}>
              <span>Retail total</span>
              <span className="v">${(sumRetail / 100).toFixed(2)}</span>
            </div>

            {/* Price mode toggle */}
            <div style={{ marginTop: 12 }}>
              <div style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--ink-soft)" }}>
                Price mode
              </div>
              <div className="mode-toggle">
                <button
                  className={priceMode === "fixed" ? "on" : ""}
                  onClick={() => onPriceModeChange?.("fixed")}
                >
                  FIXED
                </button>
                <button
                  className={priceMode === "calculated" ? "on" : ""}
                  onClick={() => onPriceModeChange?.("calculated")}
                >
                  CALCULATED
                </button>
              </div>
            </div>

            {/* Fixed price input */}
            {priceMode === "fixed" && (
              <div style={{ marginTop: 10 }}>
                <div style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--ink-soft)", marginBottom: 4 }}>
                  Bundle price
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 16 }}>$</span>
                  <input
                    value={fixedPriceInput}
                    onChange={(e) => setFixedPriceInput(e.target.value)}
                    onBlur={handleFixedPriceBlur}
                    style={{
                      background: "var(--paper)", border: "1px solid var(--rule)", borderRadius: "var(--r-sm)",
                      padding: "4px 8px", fontSize: 20, fontWeight: 500, color: "var(--accent)",
                      fontFamily: "var(--font-display), Spectral, serif", width: 120,
                    }}
                  />
                </div>
              </div>
            )}

            {priceMode === "calculated" && (
              <div className="row big">
                <span>Bundle price</span>
                <span className="v accent">${(bundlePrice / 100).toFixed(2)}</span>
              </div>
            )}

            {savings > 0 && (
              <div className="row savings">
                <span>Customer saves</span>
                <span className="v">
                  ${(savings / 100).toFixed(2)} · {savingsPct}%
                </span>
              </div>
            )}
          </div>

          {/* Status */}
          <div style={{ marginTop: 12 }}>
            <Sec h="Status" />
            <div className="field">
              <span className="lbl">visible</span>
              <span className="val accent">
                {limitingItem && limitingItem.stock === 0
                  ? "temporarily unavailable"
                  : "available"}
              </span>
            </div>
            <div className="field">
              <span className="lbl">backorder</span>
              <span className="val">show &ldquo;notify me&rdquo;</span>
            </div>
          </div>
        </div>
      </div>

      <SaveBar
        savedAt={savedAt ?? `autosaved · ${limitingItem ? `limited by ${limitingItem.variantLabel}` : "bundle ready"}`}
        isDirty={isDirty}
        hints={[["⌘K", "add item"], ["↑↓", "reorder"], ["del", "remove"]]}
      />
    </div>
  );
}
