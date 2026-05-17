"use client";
/**
 * TypeMorph — Atlas Product Editor Frame F4
 * Product type picker: 6 types, each reshapes the editor tabs.
 */

import React from "react";
import { Sec, SaveBar } from "./atlas-product-ui";
import type { ProductTypeKind } from "./atlas-types";

// ── Type definitions ───────────────────────────────────────────────────────
const PRODUCT_TYPES_DEF = [
  {
    kind: "SIMPLE" as ProductTypeKind,
    glyph: "s",
    name: "Simple",
    desc: "Single SKU. No variants, no options.",
    tabs: ["Detail", "Media", "Inventory", "Pricing", "Channels", "SEO"],
    newTabs: [] as string[],
  },
  {
    kind: "VARIABLE" as ProductTypeKind,
    glyph: "v",
    name: "Variable",
    desc: "Multiple variants from options like size and color.",
    tabs: ["Detail", "Media", "Variants", "Inventory", "Pricing", "Channels", "SEO"],
    newTabs: ["Variants"],
  },
  {
    kind: "DIGITAL" as ProductTypeKind,
    glyph: "d",
    name: "Digital",
    desc: "Downloadable file or license-key product. No shipping.",
    tabs: ["Detail", "Files", "Licenses", "Delivery", "Pricing", "Channels", "SEO"],
    newTabs: ["Files", "Licenses", "Delivery"],
  },
  {
    kind: "SERVICE" as ProductTypeKind,
    glyph: "t",
    name: "Service",
    desc: "Bookable appointment or consultation with capacity.",
    tabs: ["Detail", "Media", "Schedule", "Capacity", "Pricing", "Channels", "SEO"],
    newTabs: ["Schedule", "Capacity"],
  },
  {
    kind: "SUBSCRIPTION" as ProductTypeKind,
    glyph: "r",
    name: "Subscription",
    desc: "Recurring billing with interval, trial, and lifecycle.",
    tabs: ["Detail", "Media", "Billing", "Lifecycle", "Pricing", "Channels", "SEO"],
    newTabs: ["Billing", "Lifecycle"],
  },
  {
    kind: "BUNDLE" as ProductTypeKind,
    glyph: "b",
    name: "Bundle",
    desc: "Multiple products together. Inventory derived from contents.",
    tabs: ["Detail", "Media", "Contents", "Pricing", "Channels", "SEO"],
    newTabs: ["Contents"],
  },
] as const;

// ── Migration warnings by type ─────────────────────────────────────────────
const MIGRATION_WARNINGS: Partial<Record<ProductTypeKind, string>> = {
  BUNDLE: "The variants would be archived (preserved for old orders), the Variants and Inventory tabs would close, and a new Contents tab would open where you compose what's in the box. Inventory becomes derived from the lowest-stock child. — irreversible without manual cleanup",
  DIGITAL: "The Variants tab and inventory tracking would be disabled. Files, Licenses, and Delivery tabs would open. No shipping required.",
  SIMPLE: "All variants would be archived. Only the base product with a single SKU remains.",
};

// ── Props ──────────────────────────────────────────────────────────────────
interface TypeMorphProps {
  readonly currentType: ProductTypeKind;
  readonly productTitle?: string;
  readonly variantCount?: number;
  readonly options?: ReadonlyArray<{ id: string; name: string }>;
  readonly stripeSync?: string;
  readonly onTypeChange?: (type: ProductTypeKind) => void;
  readonly savedAt?: string;
  readonly isDirty?: boolean;
}

// ── Component ──────────────────────────────────────────────────────────────
export function TypeMorph({
  currentType,
  productTitle,
  variantCount = 0,
  options = [],
  stripeSync,
  onTypeChange,
  savedAt,
  isDirty = false,
}: TypeMorphProps) {
  const [pendingType, setPendingType] = React.useState<ProductTypeKind | null>(null);

  const handleTypeSelect = React.useCallback((kind: ProductTypeKind) => {
    if (kind === currentType) return;
    // If destructive, show warning state
    if (MIGRATION_WARNINGS[kind]) {
      setPendingType(kind);
    } else {
      onTypeChange?.(kind);
    }
  }, [currentType, onTypeChange]);

  const handleConfirmSwitch = React.useCallback(() => {
    if (pendingType) {
      onTypeChange?.(pendingType);
      setPendingType(null);
    }
  }, [pendingType, onTypeChange]);

  const currentTypeDef = PRODUCT_TYPES_DEF.find((t) => t.kind === currentType);
  const activeDisplay = pendingType ?? currentType;

  return (
    <div className="prod-editor-shell" style={{ paddingTop: 8, overflow: "auto" }}>
      <Sec
        n="§1"
        h="Product type"
        meta="the foundation — reshapes every other tab"
        right={
          <span>
            <span style={{ color: "var(--ink)" }}>currently: </span>
            <span className="pill pill-solid-accent">{currentType}</span>
          </span>
        }
      />

      {/* Type card strip */}
      <div className="type-strip">
        {PRODUCT_TYPES_DEF.map((t) => (
          <div
            key={t.kind}
            className={"type-card" + (t.kind === activeDisplay ? " on" : "")}
            onClick={() => handleTypeSelect(t.kind)}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className="glyph">{t.glyph}</span>
              <div style={{ minWidth: 0 }}>
                <div className="kind">{t.kind}</div>
                <div className="name">{t.name}</div>
              </div>
            </div>
            <div className="desc">{t.desc}</div>
            <div className="tabs-mini">
              {t.tabs.map((tab) => {
                const isNew = (t.newTabs as readonly string[]).includes(tab);
                return (
                  <span key={tab} className={isNew ? "new" : ""}>
                    {isNew ? "+ " : "· "}{tab}
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Current type callout */}
      <div className="type-callout">
        <div>
          <div className="lbl-mono">Currently editing</div>
          <div className="v">
            <b>{currentType}</b>
            {currentType === "VARIABLE" && variantCount > 0 && (
              ` — ${variantCount} variants`
            )}
            {currentType === "SIMPLE" && ". Single SKU product."}
            {currentType === "BUNDLE" && ". Inventory derived from child stock."}
            {currentType === "DIGITAL" && ". No shipping required."}
          </div>
        </div>
        <div>
          <div className="lbl-mono">Type-specific config</div>
          <div className="v" style={{ fontFamily: "var(--font-geist), sans-serif", fontSize: 13 }}>
            {currentType === "VARIABLE" && options.length > 0 && (
              <>
                {options.map((o) => (
                  <span key={o.id} className="pill pill-out" style={{ marginRight: 4 }}>{o.name}</span>
                ))}
                <span className="pill pill-out-soft">+ add option</span>
                <div className="fig" style={{ fontSize: 11, marginTop: 4 }}>option definitions live here</div>
              </>
            )}
            {currentType === "SIMPLE" && (
              <span className="fig">No options — single SKU</span>
            )}
            {currentType === "DIGITAL" && (
              <span className="fig">See Files & Licenses tabs</span>
            )}
            {currentType === "SUBSCRIPTION" && (
              <span className="fig">See Billing & Lifecycle tabs</span>
            )}
            {currentType === "SERVICE" && (
              <span className="fig">See Schedule & Capacity tabs</span>
            )}
            {currentType === "BUNDLE" && (
              <span className="fig">See Contents tab to compose items</span>
            )}
          </div>
        </div>
        <div>
          <div className="lbl-mono">Stripe sync</div>
          <div className="v" style={{ fontSize: 13 }}>
            {stripeSync ?? (
              variantCount > 0
                ? `${variantCount} prices in sync`
                : "Not synced yet"
            )}
          </div>
        </div>
      </div>

      {/* Migration warning (pending switch) */}
      {pendingType && MIGRATION_WARNINGS[pendingType] && (
        <div className="migration-note">
          <span className="head">If you switch to {pendingType}</span>
          {MIGRATION_WARNINGS[pendingType]}
          <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
            <button className="btn btn-accent btn-sm" onClick={handleConfirmSwitch}>
              Confirm switch to {pendingType}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => setPendingType(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Detail fields (always present) */}
      <div style={{ marginTop: 18 }}>
        <Sec h="Detail" meta="fields that live here regardless of type" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 20px" }}>
          <div className="field">
            <span className="lbl">title</span>
            <span className="val">{productTitle ?? "—"}</span>
          </div>
          <div className="field">
            <span className="lbl">type</span>
            <span className="val">
              <span className="pill pill-solid-accent">{currentType}</span>
            </span>
          </div>
          <div className="field">
            <span className="lbl">variants</span>
            <span className="val mono">{variantCount}</span>
          </div>
        </div>
      </div>

      <SaveBar
        savedAt={savedAt ?? `autosaved · ${currentType} active`}
        isDirty={isDirty}
        hints={[["T", "change type"], ["D", "duplicate"], ["H", "hide"]]}
      />
    </div>
  );
}
