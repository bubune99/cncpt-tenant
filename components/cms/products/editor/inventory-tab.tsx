"use client";
/**
 * InventoryTab — stock / tracking / low-stock / backorder + shipping section.
 */

import React from "react";
import { Box, Truck } from "lucide-react";
import type { AtlasProduct } from "../atlas-types";
import { SectionHead, Field, Toggle, threeCol, fourCol, tabShell, hintStyle } from "./form-primitives";

interface InventoryTabProps {
  readonly product: AtlasProduct;
  readonly onChange: (patch: Partial<AtlasProduct>) => void;
  readonly variantStockSummary: { readonly variants: number; readonly totalStock: number } | null;
}

export function InventoryTab({ product, onChange, variantStockSummary }: InventoryTabProps): React.ReactElement {
  const tracking = product.trackInventory !== false;
  const numInput = { textAlign: "right" as const };

  return (
    <div style={tabShell}>
      <SectionHead icon={Box} title="Stock" meta="quantity, low-stock alert, backorder" />
      <div style={threeCol}>
        <Field label="Track inventory">
          <Toggle on={tracking} onLabel="tracked" offLabel="untracked" onChange={(v) => onChange({ trackInventory: v })} />
        </Field>
        {tracking && (
          <>
            <Field
              label="Stock quantity"
              hint={
                variantStockSummary && variantStockSummary.variants > 0
                  ? `Variants roll-up: ${variantStockSummary.totalStock} across ${variantStockSummary.variants} variant${variantStockSummary.variants === 1 ? "" : "s"}.`
                  : undefined
              }
            >
              <input
                type="number"
                min="0"
                className="input gr-num"
                style={numInput}
                value={product.stock ?? 0}
                onChange={(e) => onChange({ stock: Number.parseInt(e.target.value, 10) || 0 })}
              />
            </Field>
            <Field label="Low-stock threshold" hint="Trigger low-stock alerts at this count.">
              <input
                type="number"
                min="0"
                className="input gr-num"
                style={numInput}
                value={product.lowStockThreshold ?? 5}
                onChange={(e) => onChange({ lowStockThreshold: Number.parseInt(e.target.value, 10) || 0 })}
              />
            </Field>
            <Field label="Backorders" hint="Allow buyers to order when stock = 0.">
              <Toggle
                on={Boolean(product.allowBackorder)}
                onLabel="allowed"
                offLabel="blocked"
                onChange={(v) => onChange({ allowBackorder: v })}
              />
            </Field>
          </>
        )}
      </div>

      <SectionHead icon={Truck} title="Shipping" meta="requires-shipping + weight + dimensions" />
      <div style={{ ...threeCol, paddingBottom: product.requiresShipping !== false ? 8 : 20 }}>
        <Field label="Requires shipping">
          <Toggle
            on={product.requiresShipping !== false}
            onLabel="physical"
            offLabel="not shipped"
            onChange={(v) => onChange({ requiresShipping: v })}
          />
        </Field>
      </div>
      {product.requiresShipping !== false && (
        <div style={fourCol}>
          <Field label="Weight (oz)">
            <input
              type="number" step="0.1" min="0" className="input gr-num" style={numInput}
              value={product.weight ?? ""}
              onChange={(e) => onChange({ weight: e.target.value.trim() === "" ? null : Number.parseFloat(e.target.value) })}
            />
          </Field>
          <Field label="Length (in)">
            <input
              type="number" step="0.1" min="0" className="input gr-num" style={numInput}
              value={product.length ?? ""}
              onChange={(e) => onChange({ length: e.target.value.trim() === "" ? null : Number.parseFloat(e.target.value) })}
            />
          </Field>
          <Field label="Width (in)">
            <input
              type="number" step="0.1" min="0" className="input gr-num" style={numInput}
              value={product.width ?? ""}
              onChange={(e) => onChange({ width: e.target.value.trim() === "" ? null : Number.parseFloat(e.target.value) })}
            />
          </Field>
          <Field label="Height (in)">
            <input
              type="number" step="0.1" min="0" className="input gr-num" style={numInput}
              value={product.height ?? ""}
              onChange={(e) => onChange({ height: e.target.value.trim() === "" ? null : Number.parseFloat(e.target.value) })}
            />
          </Field>
        </div>
      )}
      {!tracking && <p style={hintStyle}>Inventory is not tracked — this product can always be purchased.</p>}
    </div>
  );
}
