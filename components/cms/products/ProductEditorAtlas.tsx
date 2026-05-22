"use client";
/**
 * ProductEditorAtlas — Atlas Product Editor Frame Orchestrator
 *
 * Integrates all 9 frames (F1–F9) into a single tabbed interface.
 * Fetches product data from the API and routes tabs based on product type.
 *
 * Tab sets by type:
 *   SIMPLE       → Detail · Inventory · Pricing · Channels · SEO
 *   VARIABLE     → Detail · Variants   · Inventory · Pricing · Channels · SEO
 *   DIGITAL      → Detail · Files      · Licenses  · Delivery · Pricing · Channels · SEO
 *   SERVICE      → Detail · Schedule   · Capacity  · Pricing · Channels · SEO
 *   SUBSCRIPTION → Detail · Billing    · Lifecycle · Pricing · Channels · SEO
 *   BUNDLE       → Detail · Contents   · Pricing   · Channels · SEO
 */

import React from "react";
import Link from "next/link";
import "./atlas-product-editor.css";

import { CompactHead, EditorTabs, SaveBar, Crumbs } from "./atlas-product-ui";
import { SpreadsheetGrid } from "./SpreadsheetGrid";
import { MatrixView } from "./MatrixView";
import { TypeMorph } from "./TypeMorph";
import { CustomFieldsBuilder } from "./CustomFieldsBuilder";
import { BundleComposer } from "./BundleComposer";
import { DigitalEditor } from "./DigitalEditor";
import { PricingStack } from "./PricingStack";
import type { CreateTierPayload, CreateSchedulePayload } from "./PricingStack";

import type {
  AtlasProduct,
  AtlasVariant,
  AtlasProductOption,
  AtlasProductCustomField,
  AtlasDigitalAsset,
  AtlasBundleItem,
  AtlasGridColumn,
  AtlasGridRow,
  AtlasPricingTier,
  AtlasMemberPricing,
  AtlasSaleSchedule,
  AtlasDiscountCode,
  ProductTypeKind,
  VariantsViewMode,
} from "./atlas-types";

// ── Tab sets per product type ─────────────────────────────────────────────────

type TabLabel =
  | "Detail"
  | "Variants"
  | "Files"
  | "Licenses"
  | "Delivery"
  | "Schedule"
  | "Capacity"
  | "Billing"
  | "Lifecycle"
  | "Contents"
  | "Inventory"
  | "Pricing"
  | "Channels"
  | "SEO"
  | "Type";

const TABS_BY_TYPE: Readonly<Record<ProductTypeKind, ReadonlyArray<TabLabel>>> = {
  SIMPLE: ["Detail", "Type", "Inventory", "Pricing", "Channels", "SEO"],
  VARIABLE: ["Detail", "Variants", "Type", "Inventory", "Pricing", "Channels", "SEO"],
  DIGITAL: ["Detail", "Files", "Licenses", "Delivery", "Type", "Pricing", "Channels", "SEO"],
  SERVICE: ["Detail", "Schedule", "Capacity", "Type", "Pricing", "Channels", "SEO"],
  SUBSCRIPTION: ["Detail", "Billing", "Lifecycle", "Type", "Pricing", "Channels", "SEO"],
  BUNDLE: ["Detail", "Contents", "Type", "Pricing", "Channels", "SEO"],
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function buildGridColumns(
  options: ReadonlyArray<AtlasProductOption>,
  customFields: ReadonlyArray<AtlasProductCustomField>,
): ReadonlyArray<AtlasGridColumn> {
  const base: AtlasGridColumn[] = [
    { id: "sku", kind: "core", label: "SKU", width: 120, align: "left", editable: true },
    { id: "price", kind: "core", label: "Price", width: 90, align: "right", editable: true },
    { id: "costPrice", kind: "core", label: "Cost", width: 80, align: "right", editable: true },
    { id: "stock", kind: "core", label: "Stock", width: 70, align: "right", editable: true },
    { id: "status", kind: "core", label: "Status", width: 80, align: "center", editable: false },
    { id: "weight", kind: "core", label: "Weight (g)", width: 90, align: "right", editable: true },
    { id: "pace", kind: "core", label: "30d sold", width: 80, align: "right", editable: false },
  ];

  const optionCols: AtlasGridColumn[] = options.map((opt) => ({
    id: `opt_${opt.id}`,
    kind: "option" as const,
    label: opt.name,
    width: 100,
    align: "left" as const,
    editable: false,
  }));

  const fieldCols: AtlasGridColumn[] = customFields
    .filter((pcf) => pcf.showInGrid)
    .map((pcf) => ({
      id: `field_${pcf.customFieldId}`,
      kind: "field" as const,
      label: pcf.customField.name,
      width: 110,
      align: "left" as const,
      editable: true,
      fieldType: pcf.customField.type,
      fieldOptions: Array.isArray(pcf.customField.options)
        ? (pcf.customField.options as Array<{ value: string; label: string }>).map((o) => ({
            value: String(o.value),
            label: String(o.label ?? o.value),
          }))
        : undefined,
    }));

  return [...base, ...optionCols, ...fieldCols];
}

function buildGridRows(
  variants: ReadonlyArray<AtlasVariant>,
): ReadonlyArray<AtlasGridRow> {
  return variants.map((v) => {
    const stock = v.stock ?? 0;
    const status: "in" | "low" | "out" =
      stock <= 0 ? "out" : stock <= 5 ? "low" : "in";

    const row: Record<string, unknown> = {
      id: v.id,
      sku: v.sku,
      price: v.price,
      costPrice: v.costPrice,
      stock,
      status,
      enabled: v.enabled,
      weight: v.weight,
      pace: 0, // populated by API when available
    };

    // Flatten option values into row
    for (const optVal of Object.values(v.optionValues)) {
      row[`opt_${optVal.optionId}`] = optVal.value;
    }

    // Flatten custom field values into row
    for (const fieldVal of Object.values(v.customFields)) {
      row[`field_${fieldVal.fieldId}`] = fieldVal.value;
    }

    return row as AtlasGridRow;
  });
}

// ── Static formatCents (used outside component for type mapping) ───────────────
function formatCentsStatic(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

// ── Fallback placeholder tab ───────────────────────────────────────────────────

function PlaceholderTab({ label }: { readonly label: string }) {
  return (
    <div className="prod-editor-shell" style={{ paddingTop: 24 }}>
      <div className="sec">
        <span className="h">{label}</span>
        <span className="meta">· coming soon</span>
      </div>
      <p style={{ color: "var(--ink-soft)", fontFamily: "var(--font-geist), sans-serif", fontSize: 13, padding: "12px 0" }}>
        This tab is not yet implemented in the Atlas editor.
      </p>
    </div>
  );
}

// ── API load state ─────────────────────────────────────────────────────────────

interface EditorLoadState {
  readonly loading: boolean;
  readonly error: string | null;
  readonly product: AtlasProduct | null;
  readonly variants: ReadonlyArray<AtlasVariant>;
  readonly options: ReadonlyArray<AtlasProductOption>;
  readonly customFields: ReadonlyArray<AtlasProductCustomField>;
  readonly digitalAsset: AtlasDigitalAsset | null;
}

/** Shape returned by GET /api/cms/discounts for each discount code */
interface DiscountApiRow {
  readonly id: string;
  readonly code: string;
  readonly type: string;
  readonly value: number;
  readonly usageCount: number;
  readonly description: string | null;
  readonly enabled: boolean;
}

/** Shape returned by GET /api/cms/products/[id]/pricing-tiers (one row) */
interface PricingTierApiRow {
  readonly id: string;
  readonly productId: string;
  readonly label: string;
  readonly minQty: number;
  readonly maxQty: number | null;
  readonly price: number; // cents
  readonly type: "QTY" | "MEMBER";
  readonly enabled: boolean;
}

/** Shape returned by GET /api/cms/products/[id]/sale-schedules (one row) */
interface SaleScheduleApiRow {
  readonly id: string;
  readonly productId: string;
  readonly variantId: string | null;
  readonly salePrice: number; // cents
  readonly startsAt: string;  // ISO string from Prisma DateTime
  readonly endsAt: string;    // ISO string from Prisma DateTime
  readonly enabled: boolean;
}

// CreateTierPayload / CreateSchedulePayload are imported from ./PricingStack
// as the single source of truth (the props that consume them live there).

// ── Main Props ─────────────────────────────────────────────────────────────────

export interface ProductEditorAtlasProps {
  /** Product ID to load. Pass "new" to create. */
  readonly productId: string;
  /** Subdomain slug (passed from route params for back-links). */
  readonly subdomain: string;
}

// ── Component ──────────────────────────────────────────────────────────────────

export function ProductEditorAtlas({ productId, subdomain }: ProductEditorAtlasProps) {
  const isNew = productId === "new";

  // ── Load state ──────────────────────────────────────────────────────────────
  const [state, setState] = React.useState<EditorLoadState>({
    loading: !isNew,
    error: null,
    product: isNew
      ? {
          id: "",
          title: "Untitled product",
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
        }
      : null,
    variants: [],
    options: [],
    customFields: [],
    digitalAsset: null,
  });

  // ── UI state ─────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = React.useState<TabLabel>("Detail");
  const [isDirty, setIsDirty] = React.useState(false);
  const [savedAt, setSavedAt] = React.useState<string>("");
  const [viewMode, setViewMode] = React.useState<VariantsViewMode>("list");
  // filters live inside SpreadsheetGrid — no top-level state needed

  // ── Discount codes state ──────────────────────────────────────────────────────
  const [discountCodes, setDiscountCodes] = React.useState<ReadonlyArray<AtlasDiscountCode>>([]);
  const [discountsLoading, setDiscountsLoading] = React.useState(false);

  // ── Pricing tiers + sale schedules state ──────────────────────────────────────
  const [pricingTiers, setPricingTiers] = React.useState<ReadonlyArray<AtlasPricingTier>>([]);
  const [memberPricing, setMemberPricing] = React.useState<ReadonlyArray<AtlasMemberPricing>>([]);
  const [saleSchedules, setSaleSchedules] = React.useState<ReadonlyArray<SaleScheduleApiRow>>([]);
  const [pricingLoading, setPricingLoading] = React.useState(false);
  const [pricingError, setPricingError] = React.useState<string | null>(null);
  // Track whether we've already attempted the pricing fetch to avoid refetching on tab re-activations.
  const pricingFetchedRef = React.useRef(false);

  // ── Fetch product on mount ────────────────────────────────────────────────────
  React.useEffect(() => {
    if (isNew) return;

    let cancelled = false;

    const load = async () => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const res = await fetch(
          `/api/cms/products/${productId}?includeVariants=true&includeOptions=true&includeDigitalAsset=true`,
          { credentials: "same-origin" }
        );
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
        }
        const data = await res.json();
        if (cancelled) return;

        // Map API product to AtlasProduct shape
        const p: AtlasProduct = {
          id: data.id,
          title: data.title,
          slug: data.slug,
          description: data.description ?? null,
          type: data.type as ProductTypeKind,
          status: data.status,
          basePrice: data.basePrice,
          compareAtPrice: data.compareAtPrice ?? null,
          costPrice: data.costPrice ?? null,
          sku: data.sku ?? null,
          stock: data.stock ?? 0,
          trackInventory: data.trackInventory ?? true,
          stripeProductId: data.stripeProductId ?? null,
          stripePriceId: data.stripePriceId ?? null,
          stripeSyncedAt: data.stripeSyncedAt ?? null,
        };

        // Map variants
        const variants: AtlasVariant[] = (data.variants ?? []).map(
          (v: Record<string, unknown>) => ({
            id: String(v.id ?? ""),
            sku: v.sku != null ? String(v.sku) : null,
            price: Number(v.price ?? 0),
            costPrice: v.costPrice != null ? Number(v.costPrice) : null,
            stock: Number(v.stock ?? 0),
            enabled: (v.enabled ?? true) !== false,
            weight: v.weight != null ? Number(v.weight) : null,
            optionValues: Object.fromEntries(
              ((v.optionValues as Array<Record<string, unknown>>) ?? []).map(
                (ov: Record<string, unknown>) => {
                  const optVal = ov.optionValue as Record<string, unknown>;
                  const optionId = optVal?.optionId ?? "";
                  return [
                    optVal?.value ?? "",
                    { optionId, valueId: optVal?.id ?? "", value: String(optVal?.value ?? "") },
                  ];
                }
              )
            ),
            customFields: {},
          } satisfies AtlasVariant)
        );

        // Map options
        const options: AtlasProductOption[] = (data.options ?? []).map(
          (o: Record<string, unknown>) => ({
            id: String(o.id),
            name: String(o.name),
            position: Number(o.position),
            values: ((o.values as Array<Record<string, unknown>>) ?? []).map((val) => ({
              id: String(val.id),
              value: String(val.value),
              position: Number(val.position),
            })),
          })
        );

        setState((prev) => ({
          ...prev,
          loading: false,
          product: p,
          variants,
          options,
          customFields: prev.customFields, // custom fields loaded separately
          digitalAsset: data.digitalAsset ?? null,
        }));
        setSavedAt("Loaded");
      } catch (err) {
        if (cancelled) return;
        setState((prev) => ({
          ...prev,
          loading: false,
          error: err instanceof Error ? err.message : "Failed to load product",
        }));
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [productId, isNew]);

  // ── Also load custom fields ───────────────────────────────────────────────────
  React.useEffect(() => {
    if (isNew || !state.product) return;

    const load = async () => {
      try {
        const res = await fetch(`/api/cms/products/${productId}/custom-fields`, {
          credentials: "same-origin",
        });
        if (!res.ok) return;
        const data = await res.json();
        setState((prev) => ({
          ...prev,
          customFields: (data.customFields ?? []) as ReadonlyArray<AtlasProductCustomField>,
        }));
      } catch {
        // non-critical — custom fields tab will show empty
      }
    };

    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, isNew, state.product?.id]);

  // ── Fetch discount codes from /api/cms/discounts ─────────────────────────────
  // Only fetch when the Pricing tab is active (lazy — avoid unnecessary requests).
  // pricingTiers, memberPricing, saleSchedule remain empty until API plan G06 ships.
  React.useEffect(() => {
    if (activeTab !== "Pricing" || discountsLoading || discountCodes.length > 0) return;

    let cancelled = false;
    setDiscountsLoading(true);

    const fetchDiscounts = async () => {
      try {
        const res = await fetch("/api/cms/discounts?limit=50&status=active", {
          credentials: "same-origin",
        });
        if (!res.ok) return;
        const data = await res.json() as { discounts?: DiscountApiRow[] };
        if (cancelled) return;

        const mapped: ReadonlyArray<AtlasDiscountCode> = (data.discounts ?? []).map(
          (d): AtlasDiscountCode => ({
            id: d.id,
            code: d.code,
            type: d.type,
            value: d.value,
            usageCount: d.usageCount,
            description: d.description,
            // schema has no stackable field — default false
            stackable: false,
          })
        );
        setDiscountCodes(mapped);
      } catch {
        // non-critical — discount section will show empty state
      } finally {
        if (!cancelled) setDiscountsLoading(false);
      }
    };

    void fetchDiscounts();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // ── Fetch pricing tiers + sale schedules ──────────────────────────────────────
  // Lazy: only fires when Pricing tab is first activated (mirrors discount pattern).
  // Uses a ref to prevent re-fetching on subsequent tab activations.
  React.useEffect(() => {
    if (activeTab !== "Pricing" || isNew || !state.product?.id) return;
    if (pricingFetchedRef.current) return;

    let cancelled = false;
    pricingFetchedRef.current = true;
    setPricingLoading(true);
    setPricingError(null);

    const fetchPricing = async () => {
      try {
        const [tiersRes, schedulesRes] = await Promise.all([
          fetch(`/api/cms/products/${productId}/pricing-tiers`, { credentials: "same-origin" }),
          fetch(`/api/cms/products/${productId}/sale-schedules`, { credentials: "same-origin" }),
        ]);

        if (cancelled) return;

        if (!tiersRes.ok) {
          const body = await tiersRes.json().catch(() => ({}));
          throw new Error((body as { error?: string }).error ?? `Tiers fetch: HTTP ${tiersRes.status}`);
        }
        if (!schedulesRes.ok) {
          const body = await schedulesRes.json().catch(() => ({}));
          throw new Error((body as { error?: string }).error ?? `Schedules fetch: HTTP ${schedulesRes.status}`);
        }

        const tiersData = await tiersRes.json() as { data?: PricingTierApiRow[] };
        const schedulesData = await schedulesRes.json() as { data?: SaleScheduleApiRow[] };

        if (cancelled) return;

        const allTiers: ReadonlyArray<PricingTierApiRow> = tiersData.data ?? [];
        const basePrice = state.product?.basePrice ?? 0;

        // Split by type: QTY → AtlasPricingTier, MEMBER → AtlasMemberPricing
        const qtyTiers: AtlasPricingTier[] = allTiers
          .filter((t) => t.type === "QTY")
          .map((t) => ({
            id: t.id,
            minQty: t.minQty,
            maxQty: t.maxQty ?? null,
            price: t.price,
            requiresTag: t.label || null,
          }));

        const memberTiers: AtlasMemberPricing[] = allTiers
          .filter((t) => t.type === "MEMBER")
          .map((t) => {
            const discountPercent =
              basePrice > 0 ? Math.round(((basePrice - t.price) / basePrice) * 100) : 0;
            return {
              id: t.id,
              tierName: t.label,
              description: `${formatCentsStatic(t.price)} per unit`,
              memberCount: 0,
              discountPercent: Math.max(0, discountPercent),
              memberPrice: t.price,
              enabled: t.enabled,
            };
          });

        setPricingTiers(qtyTiers);
        setMemberPricing(memberTiers);
        setSaleSchedules(schedulesData.data ?? []);
      } catch (err) {
        if (cancelled) return;
        pricingFetchedRef.current = false; // allow retry on next tab activation
        setPricingError(err instanceof Error ? err.message : "Failed to load pricing data");
      } finally {
        if (!cancelled) setPricingLoading(false);
      }
    };

    void fetchPricing();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, productId, isNew, state.product?.id]);

  // ── Save handler ──────────────────────────────────────────────────────────────
  const handleSave = React.useCallback(async () => {
    if (!state.product || !isDirty) return;
    try {
      const res = await fetch(`/api/cms/products/${state.product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          title: state.product.title,
          slug: state.product.slug,
          description: state.product.description,
          type: state.product.type,
          status: state.product.status,
          basePrice: state.product.basePrice,
          compareAtPrice: state.product.compareAtPrice,
          costPrice: state.product.costPrice,
          sku: state.product.sku,
          stock: state.product.stock,
          trackInventory: state.product.trackInventory,
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      setIsDirty(false);
      setSavedAt(`Saved · ${new Date().toLocaleTimeString()}`);
    } catch {
      // surface to user
    }
  }, [state.product, isDirty]);

  // ── Cell change handler ────────────────────────────────────────────────────────
  const handleCellChange = React.useCallback(
    (rowIndex: number, colId: string, value: unknown) => {
      setState((prev) => {
        const updated = prev.variants.map((v, i) =>
          i === rowIndex ? { ...v, [colId]: value } : v
        );
        return { ...prev, variants: updated };
      });
      setIsDirty(true);
    },
    []
  );

  // ── Type change handler ────────────────────────────────────────────────────────
  const handleTypeChange = React.useCallback((type: ProductTypeKind) => {
    setState((prev) => ({
      ...prev,
      product: prev.product ? { ...prev.product, type } : null,
    }));
    setIsDirty(true);
    // Reset to Detail tab when type changes
    setActiveTab("Detail");
  }, []);

  // ── Pricing tier CRUD ─────────────────────────────────────────────────────────

  const handleCreateTier = React.useCallback(async (payload: CreateTierPayload) => {
    const body: CreateTierPayload = { ...payload, maxQty: payload.maxQty ?? null };

    const res = await fetch(`/api/cms/products/${productId}/pricing-tiers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error((data as { error?: string }).error ?? `HTTP ${res.status}`);
    }
    const data = await res.json() as { data?: PricingTierApiRow };
    const created = data.data;
    if (!created) return;

    const basePrice = state.product?.basePrice ?? 0;

    if (created.type === "QTY") {
      // Optimistic append to qty tiers
      setPricingTiers((prev) => [
        ...prev,
        {
          id: created.id,
          minQty: created.minQty,
          maxQty: created.maxQty ?? null,
          price: created.price,
          requiresTag: created.label || null,
        },
      ]);
    } else {
      // Optimistic append to member pricing
      const discountPercent =
        basePrice > 0 ? Math.max(0, Math.round(((basePrice - created.price) / basePrice) * 100)) : 0;
      setMemberPricing((prev) => [
        ...prev,
        {
          id: created.id,
          tierName: created.label,
          description: `${formatCentsStatic(created.price)} per unit`,
          memberCount: 0,
          discountPercent,
          memberPrice: created.price,
          enabled: created.enabled,
        },
      ]);
    }
  }, [productId, state.product?.basePrice]);

  const handleDeleteTier = React.useCallback(async (tierId: string) => {
    // Optimistic removal
    setPricingTiers((prev) => prev.filter((t) => t.id !== tierId));
    setMemberPricing((prev) => prev.filter((m) => m.id !== tierId));

    const res = await fetch(`/api/cms/products/${productId}/pricing-tiers`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ tierId }),
    });
    if (!res.ok) {
      // Revert optimistic removal by re-fetching
      pricingFetchedRef.current = false;
      const body = await res.json().catch(() => ({}));
      throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
    }
  }, [productId]);

  // ── Sale schedule CRUD ────────────────────────────────────────────────────────

  const handleCreateSchedule = React.useCallback(async (payload: CreateSchedulePayload) => {
    const res = await fetch(`/api/cms/products/${productId}/sale-schedules`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error((data as { error?: string }).error ?? `HTTP ${res.status}`);
    }
    const data = await res.json() as { data?: SaleScheduleApiRow };
    const created = data.data;
    if (!created) return;

    // Optimistic append
    setSaleSchedules((prev) => [...prev, created]);
  }, [productId]);

  const handleDeleteSchedule = React.useCallback(async (scheduleId: string) => {
    // Optimistic removal
    setSaleSchedules((prev) => prev.filter((s) => s.id !== scheduleId));

    const res = await fetch(`/api/cms/products/${productId}/sale-schedules`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ scheduleId }),
    });
    if (!res.ok) {
      // Revert by re-fetching
      pricingFetchedRef.current = false;
      const body = await res.json().catch(() => ({}));
      throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
    }
  }, [productId]);

  // ── Tab badge counts ─────────────────────────────────────────────────────────
  const variantCount = state.variants.length;
  const customFieldCount = state.customFields.length;

  // ── Derived grid data ─────────────────────────────────────────────────────────
  const gridColumns = React.useMemo(
    () => buildGridColumns(state.options, state.customFields),
    [state.options, state.customFields]
  );
  const gridRows = React.useMemo(
    () => buildGridRows(state.variants),
    [state.variants]
  );

  // ── (filters live inside SpreadsheetGrid — managed there) ────────────────────

  // ── Tabs list for current type ────────────────────────────────────────────────
  const productType = state.product?.type ?? "SIMPLE";
  const tabs = TABS_BY_TYPE[productType].map((label) => ({
    label,
    count:
      label === "Variants" ? variantCount || null
      : label === "Files" ? (state.digitalAsset ? 1 : null)
      : label === "Contents" ? (state.product ? variantCount || null : null)
      : null,
  }));

  // Ensure active tab exists in current type's tab list
  const tabLabels = tabs.map((t) => t.label);
  const safeActiveTab = tabLabels.includes(activeTab) ? activeTab : "Detail";

  // ── Derive active sale schedule from fetched list ────────────────────────────
  // Use the first enabled schedule (earliest startsAt), mapping API row → AtlasSaleSchedule.
  const saleSchedule: AtlasSaleSchedule | null = React.useMemo(() => {
    const active = saleSchedules.find((s) => s.enabled);
    if (!active) return null;
    return {
      id: active.id,
      salePrice: active.salePrice,
      startDate: active.startsAt,
      endDate: active.endsAt,
      active: active.enabled,
    };
  }, [saleSchedules]);

  // ── tierEnabled: true when there are QTY tiers ───────────────────────────────
  const pricingTierEnabled = pricingTiers.length > 0;

  // ── Bundle items (stored in product.bundleItems as JSON) ─────────────────────
  const bundleItems: ReadonlyArray<AtlasBundleItem> = [];

  // ── Render ─────────────────────────────────────────────────────────────────────

  if (state.loading) {
    return (
      <div className="atlas">
        <div className="prod-editor-shell" style={{ paddingTop: 40, textAlign: "center" }}>
          <span className="fig">Loading product…</span>
        </div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="atlas">
        <div className="prod-editor-shell" style={{ paddingTop: 40 }}>
          <div className="sec">
            <span className="h" style={{ color: "var(--accent)" }}>Error loading product</span>
          </div>
          <p style={{ color: "var(--ink-soft)", fontFamily: "var(--font-geist), sans-serif", fontSize: 13 }}>
            {state.error}
          </p>
          <Link href={`/s/${subdomain}/admin/products`} className="btn btn-ghost">
            ← Back to products
          </Link>
        </div>
      </div>
    );
  }

  const product = state.product!;

  return (
    <div className="atlas">
      {/* Breadcrumb */}
      <Crumbs
        items={[
          ["Products", `/s/${subdomain}/admin/products`],
          [product.title],
        ]}
      />

      {/* Compact masthead */}
      <CompactHead
        kicker={product.type}
        title={product.title}
        sku={product.sku ?? undefined}
        pills={
          <>
            <span className={"pill " + (product.status === "ACTIVE" ? "pill-solid-accent" : "pill-out")}>
              {product.status}
            </span>
            {product.stripeProductId && (
              <span className="pill pill-out" style={{ fontSize: 11 }}>Stripe ✓</span>
            )}
          </>
        }
        stats={
          variantCount > 0
            ? `${variantCount} variants · ${customFieldCount} custom fields`
            : undefined
        }
        actions={
          <button className="btn btn-ghost btn-sm" onClick={() => void handleSave()} disabled={!isDirty}>
            {isDirty ? "⌘S Save" : "Saved"}
          </button>
        }
      />

      {/* Tab strip */}
      <EditorTabs
        items={tabs}
        active={safeActiveTab}
        onChange={(label) => setActiveTab(label as TabLabel)}
      />

      {/* Tab content */}
      <div style={{ minHeight: 400 }}>
        {safeActiveTab === "Detail" && (
          <DetailTab
            product={product}
            onChange={(patch) => {
              setState((prev) => ({
                ...prev,
                product: prev.product ? { ...prev.product, ...patch } : null,
              }));
              setIsDirty(true);
            }}
          />
        )}

        {safeActiveTab === "Variants" && viewMode === "list" && (
          <SpreadsheetGrid
            productId={product.id}
            productTitle={product.title}
            sku={product.sku ?? ""}
            rows={gridRows}
            columns={gridColumns}
            customFieldColumns={state.customFields
              .filter((pcf) => pcf.showInGrid)
              .map((pcf) => ({
                id: `field_${pcf.customFieldId}`,
                kind: "field" as const,
                label: pcf.customField.name,
                width: 110,
                align: "left" as const,
                editable: true,
                fieldType: pcf.customField.type,
              }))}
            breadcrumbs={[[product.title], ["Variants"]]}
            viewMode={viewMode}
            onViewChange={setViewMode}
            onCellChange={handleCellChange}
            onSave={() => void handleSave()}
            isDirty={isDirty}
            savedAt={savedAt}
          />
        )}

        {safeActiveTab === "Variants" && viewMode === "matrix" && (
          <MatrixView
            rows={
              (state.options.find((o) => o.name.toLowerCase().includes("color"))?.values ?? []).map((v) => ({
                id: v.id,
                label: v.value,
                code: v.value.toLowerCase().replace(/\s+/g, "-"),
                hex: undefined,
              }))
            }
            cols={
              (state.options.find((o) => o.name.toLowerCase().includes("size"))?.values ?? []).map((v) => ({
                id: v.id,
                label: v.value,
                code: v.value.toLowerCase().replace(/\s+/g, "-"),
              }))
            }
            cells={[]}
            showing="stock"
            isDirty={isDirty}
            savedAt={savedAt}
          />
        )}

        {safeActiveTab === "Variants" && viewMode === "cards" && (
          <PlaceholderTab label="Cards view" />
        )}

        {safeActiveTab === "Type" && (
          <TypeMorph
            currentType={product.type}
            productTitle={product.title}
            variantCount={variantCount}
            options={state.options}
            stripeSync={product.stripeSyncedAt ? `Synced ${new Date(product.stripeSyncedAt).toLocaleDateString()}` : undefined}
            onTypeChange={handleTypeChange}
            savedAt={savedAt}
            isDirty={isDirty}
          />
        )}

        {safeActiveTab === "Contents" && (
          <BundleComposer
            items={bundleItems}
            priceMode="calculated"
            fixedPrice={product.basePrice}
            allowVariantChoice={false}
            allowSubstitutions={false}
            includeGiftWrap={false}
            isDirty={isDirty}
            savedAt={savedAt}
          />
        )}

        {(safeActiveTab === "Files" || safeActiveTab === "Licenses" || safeActiveTab === "Delivery") && (
          <DigitalEditor
            asset={state.digitalAsset}
            delivery={{
              deliverOn: "payment",
              method: "download",
              maxDownloads: state.digitalAsset?.downloadLimit ?? 0,
              linkExpiry: state.digitalAsset?.downloadExpiry ?? 30,
              useLicenseKeys: state.digitalAsset?.useLicenseKeys ?? false,
              maxActivations: null,
            }}
            isDirty={isDirty}
            savedAt={savedAt}
          />
        )}

        {safeActiveTab === "Pricing" && (
          <PricingStack
            basePrices={[
              {
                label: "Base price",
                price: product.basePrice,
                cost: product.costPrice ?? 0,
              },
            ]}
            tierPricing={pricingTiers}
            tierEnabled={pricingTierEnabled}
            memberPricing={memberPricing}
            saleSchedule={saleSchedule}
            discountCodes={discountCodes}
            pricingLoading={pricingLoading}
            pricingError={pricingError}
            onCreateTier={handleCreateTier}
            onDeleteTier={handleDeleteTier}
            onCreateSchedule={handleCreateSchedule}
            onDeleteSchedule={handleDeleteSchedule}
            onToggleTierEnabled={(enabled) => {
              // Toggle is visual — enable means show the tier table; no server call needed
              // since tiers are fetched. When disabled, it just hides the section.
              if (!enabled) {
                // Collapse tier section without deleting tiers
              }
            }}
            onToggleMemberPricing={(id, enabled) => {
              setMemberPricing((prev) =>
                prev.map((m) => m.id === id ? { ...m, enabled } : m)
              );
            }}
            isDirty={isDirty}
            savedAt={savedAt}
          />
        )}

        {safeActiveTab === "Channels" && <PlaceholderTab label="Channels" />}
        {safeActiveTab === "SEO" && <PlaceholderTab label="SEO" />}
        {safeActiveTab === "Schedule" && <PlaceholderTab label="Schedule" />}
        {safeActiveTab === "Capacity" && <PlaceholderTab label="Capacity" />}
        {safeActiveTab === "Billing" && <PlaceholderTab label="Billing" />}
        {safeActiveTab === "Lifecycle" && <PlaceholderTab label="Lifecycle" />}
        {safeActiveTab === "Inventory" && <PlaceholderTab label="Inventory" />}
      </div>
    </div>
  );
}

// ── Detail tab ────────────────────────────────────────────────────────────────
// Inline — small enough to keep here; avoids another component file.

interface DetailTabProps {
  readonly product: AtlasProduct;
  readonly onChange: (patch: Partial<AtlasProduct>) => void;
}

function DetailTab({ product, onChange }: DetailTabProps) {
  return (
    <div className="prod-editor-shell" style={{ paddingTop: 8 }}>
      <div className="sec">
        <span className="n">§1</span>
        <span className="h">Core details</span>
        <span className="meta">· title, slug, description</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 24px", padding: "0 0 16px" }}>
        {/* Title */}
        <div style={{ gridColumn: "1 / -1" }}>
          <div className="field">
            <span className="lbl">Title</span>
            <input
              className="val"
              style={{ width: "100%", border: "1px solid var(--rule)", borderRadius: 4, padding: "4px 8px", background: "var(--paper)", color: "var(--ink)", fontFamily: "var(--font-display), Spectral, serif", fontSize: 15 }}
              value={product.title}
              onChange={(e) => onChange({ title: e.target.value })}
            />
          </div>
        </div>

        {/* Slug */}
        <div>
          <div className="field">
            <span className="lbl">Slug</span>
            <input
              className="val mono"
              style={{ width: "100%", border: "1px solid var(--rule)", borderRadius: 4, padding: "4px 8px", background: "var(--paper)", color: "var(--ink)", fontFamily: "var(--font-geist-mono), monospace", fontSize: 12 }}
              value={product.slug ?? ""}
              onChange={(e) => onChange({ slug: e.target.value })}
            />
          </div>
        </div>

        {/* SKU */}
        <div>
          <div className="field">
            <span className="lbl">Base SKU</span>
            <input
              className="val mono"
              style={{ width: "100%", border: "1px solid var(--rule)", borderRadius: 4, padding: "4px 8px", background: "var(--paper)", color: "var(--ink)", fontFamily: "var(--font-geist-mono), monospace", fontSize: 12 }}
              value={product.sku ?? ""}
              onChange={(e) => onChange({ sku: e.target.value || null })}
            />
          </div>
        </div>

        {/* Description */}
        <div style={{ gridColumn: "1 / -1" }}>
          <div className="field">
            <span className="lbl">Description</span>
            <textarea
              style={{ width: "100%", minHeight: 80, border: "1px solid var(--rule)", borderRadius: 4, padding: "6px 8px", background: "var(--paper)", color: "var(--ink)", fontFamily: "var(--font-geist), sans-serif", fontSize: 13, resize: "vertical" }}
              value={product.description ?? ""}
              onChange={(e) => onChange({ description: e.target.value || null })}
            />
          </div>
        </div>

        {/* Status */}
        <div>
          <div className="field">
            <span className="lbl">Status</span>
            <select
              style={{ border: "1px solid var(--rule)", borderRadius: 4, padding: "4px 8px", background: "var(--paper)", color: "var(--ink)", fontFamily: "var(--font-geist), sans-serif", fontSize: 13, cursor: "pointer" }}
              value={product.status}
              onChange={(e) =>
                onChange({
                  status: e.target.value as "DRAFT" | "ACTIVE" | "ARCHIVED",
                })
              }
            >
              <option value="DRAFT">Draft</option>
              <option value="ACTIVE">Active</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
        </div>
      </div>

      <SaveBar
        hints={[["T", "switch type"], ["P", "pricing"], ["V", "variants"]]}
      />
    </div>
  );
}
