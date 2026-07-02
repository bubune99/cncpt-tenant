"use client";
/**
 * useProductEditor — the product editor controller (core half).
 *
 * Owns load state, dirty tracking, the load effects, product save/create, and
 * the in-grid variant edit handlers. The async API-writing mutations (Stripe,
 * custom fields, images, pricing tiers, sale schedules, bundle, digital keys,
 * variant generation) live in useProductMutations and are composed in here so
 * the Grainy shell sees one flat controller object.
 *
 * Tenancy is enforced server-side by the /api/cms routes (withTenant resolves
 * the tenant from the request host); the client calls tenant-scoped endpoints
 * with credentials.
 */

import React from "react";
import type {
  AtlasProduct,
  AtlasVariant,
  AtlasProductOption,
  AtlasCustomField,
  AtlasBundleItem,
  AtlasPricingTier,
  AtlasMemberPricing,
  AtlasSaleSchedule,
  AtlasDiscountCode,
  ProductTypeKind,
  VariantsViewMode,
} from "../atlas-types";
import {
  EMPTY_PRODUCT,
  mapApiProduct,
  buildSavePayload,
  slugify,
  formatCentsStatic,
  type EditorLoadState,
  type EditorCategory,
  type ProductImageRow,
  type DiscountApiRow,
  type PricingTierApiRow,
  type SaleScheduleApiRow,
} from "./editor-model";
import {
  buildGridColumns,
  buildGridRows,
  buildMatrixData,
  buildMediaData,
} from "./editor-data";
import { useProductMutations } from "./use-product-mutations";

export interface UseProductEditorArgs {
  readonly productId: string;
  readonly subdomain: string;
}

export function useProductEditor({ productId }: UseProductEditorArgs) {
  const [isNew, setIsNew] = React.useState(productId === "new");
  const [effectiveProductId, setEffectiveProductId] = React.useState(productId);

  const [state, setState] = React.useState<EditorLoadState>({
    loading: productId !== "new",
    error: null,
    product: productId === "new" ? EMPTY_PRODUCT : null,
    variants: [],
    options: [],
    customFields: [],
    digitalAsset: null,
    images: [],
    categoryIds: [],
  });

  const [isDirty, setIsDirty] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const [savedAt, setSavedAt] = React.useState<string>("");
  const [viewMode, setViewMode] = React.useState<VariantsViewMode>("list");
  const [matrixShowing, setMatrixShowing] = React.useState<"stock" | "price" | "pace" | "cost">("stock");

  const [categories, setCategories] = React.useState<ReadonlyArray<EditorCategory>>([]);

  const [discountCodes, setDiscountCodes] = React.useState<ReadonlyArray<AtlasDiscountCode>>([]);
  const [discountsLoading, setDiscountsLoading] = React.useState(false);

  const [pricingTiers, setPricingTiers] = React.useState<ReadonlyArray<AtlasPricingTier>>([]);
  const [memberPricing, setMemberPricing] = React.useState<ReadonlyArray<AtlasMemberPricing>>([]);
  const [saleSchedules, setSaleSchedules] = React.useState<ReadonlyArray<SaleScheduleApiRow>>([]);
  const [pricingLoading, setPricingLoading] = React.useState(false);
  const [pricingError, setPricingError] = React.useState<string | null>(null);
  const pricingFetchedRef = React.useRef(false);

  const [syncingStripe, setSyncingStripe] = React.useState(false);
  const [globalCustomFields, setGlobalCustomFields] = React.useState<ReadonlyArray<AtlasCustomField>>([]);
  const [mediaLibrary, setMediaLibrary] = React.useState<ReadonlyArray<{ id: string; name: string; url: string }>>([]);
  const [bundleConfig, setBundleConfig] = React.useState({ allowVariantChoice: false, allowSubstitutions: false, includeGiftWrap: false });
  const [reloadNonce, setReloadNonce] = React.useState(0);
  const [generatingVariants, setGeneratingVariants] = React.useState(false);
  const [inspectorRow, setInspectorRow] = React.useState<number | null>(null);
  const [activeTab, setActiveTab] = React.useState<string>("Detail");

  // Mirror the latest variants into a ref so the save path always reads the
  // current grid state, immune to any stale-closure timing in handleSave.
  const variantsRef = React.useRef<ReadonlyArray<AtlasVariant>>(state.variants);
  variantsRef.current = state.variants;

  // ── Patch helper for product state ───────────────────────────────────────
  const patchProduct = React.useCallback((patch: Partial<AtlasProduct>) => {
    setState((prev) => ({
      ...prev,
      product: prev.product ? { ...prev.product, ...patch } : prev.product,
    }));
    setIsDirty(true);
  }, []);

  // ── Async mutations (Stripe / fields / images / pricing / bundle / digital) ─
  const mut = useProductMutations({
    state,
    setState,
    isNew,
    effectiveProductId,
    setSaveError,
    setSavedAt,
    setIsDirty,
    setSyncingStripe,
    setGeneratingVariants,
    setReloadNonce,
    setPricingTiers,
    setMemberPricing,
    setSaleSchedules,
    setGlobalCustomFields,
    patchProduct,
    pricingFetchedRef,
  });
  const { reloadCustomFields } = mut;

  // ── Fetch product on mount / when id changes ─────────────────────────────
  React.useEffect(() => {
    if (isNew) return;

    let cancelled = false;
    const load = async () => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const res = await fetch(
          `/api/cms/products/${effectiveProductId}?includeVariants=true&includeOptions=true&includeImages=true&includeCategories=true&includeDigitalAsset=true`,
          { credentials: "same-origin" }
        );
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
        }
        const data = await res.json();
        if (cancelled) return;

        const product = mapApiProduct(data);

        const variants: AtlasVariant[] = (data.variants ?? []).map(
          (v: Record<string, unknown>) => ({
            id: String(v.id ?? ""),
            sku: v.sku != null ? String(v.sku) : null,
            price: Number(v.price ?? 0),
            costPrice: v.costPrice != null ? Number(v.costPrice) : null,
            stock: Number(v.stock ?? 0),
            enabled: (v.enabled ?? true) !== false,
            weight: v.weight != null ? Number(v.weight) : null,
            imageId:
              (v.imageId as string | null | undefined) ??
              ((v.image as Record<string, unknown> | undefined)?.id as string | undefined) ??
              null,
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

        const images: ProductImageRow[] = (data.images ?? []).map(
          (img: Record<string, unknown>) => ({
            id: String(img.id),
            position: Number(img.position ?? 0),
            alt: (img.alt as string | null) ?? null,
            media: {
              id: String((img.media as Record<string, unknown> | undefined)?.id ?? ""),
              url: String((img.media as Record<string, unknown> | undefined)?.url ?? ""),
              alt: (img.media as Record<string, unknown> | undefined)?.alt as string | null | undefined,
            },
          })
        );

        const categoryIds: string[] = ((data.categories ?? []) as Array<Record<string, unknown>>)
          .map((row) => {
            const cat = row.category as Record<string, unknown> | undefined;
            return cat ? String(cat.id ?? "") : String(row.categoryId ?? "");
          })
          .filter(Boolean);

        setState({
          loading: false,
          error: null,
          product,
          variants,
          options,
          customFields: [],
          digitalAsset: data.digitalAsset ?? null,
          images,
          categoryIds,
        });
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
  }, [effectiveProductId, isNew, reloadNonce]);

  // ── Custom fields: load attached + global library ────────────────────────
  React.useEffect(() => {
    if (isNew || !state.product?.id) return;
    void reloadCustomFields();
  }, [reloadCustomFields, isNew, state.product?.id]);

  // ── Load media library (Media tab bulk variant-image assign) ─────────────
  React.useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch("/api/cms/media?type=image&limit=100", { credentials: "same-origin" });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        const items = ((data.media ?? data.items ?? data.data ?? []) as Array<Record<string, unknown>>).map((m) => ({
          id: String(m.id ?? ""),
          name: String(m.title ?? m.originalName ?? m.filename ?? m.id ?? ""),
          url: String(m.url ?? ""),
        })).filter((m) => m.id);
        setMediaLibrary(items);
      } catch {
        /* non-critical */
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [effectiveProductId]);

  // ── Load categories ──────────────────────────────────────────────────────
  React.useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch("/api/cms/shop/collections", { credentials: "same-origin" });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        const rows: EditorCategory[] = ((data.collections ?? []) as Array<Record<string, unknown>>).map(
          (c) => ({
            id: String(c.id ?? ""),
            name: String(c.title ?? c.name ?? ""),
            slug: String(c.handle ?? c.slug ?? ""),
          })
        );
        setCategories(rows);
      } catch {
        // non-critical
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Discount codes (lazy, fires on Pricing tab) ──────────────────────────
  React.useEffect(() => {
    if (activeTab !== "Pricing" || discountsLoading || discountCodes.length > 0) return;
    let cancelled = false;
    setDiscountsLoading(true);
    const fetchDiscounts = async () => {
      try {
        const res = await fetch("/api/cms/discounts?limit=50&status=active", { credentials: "same-origin" });
        if (!res.ok) return;
        const data = (await res.json()) as { discounts?: DiscountApiRow[] };
        if (cancelled) return;
        const mapped: ReadonlyArray<AtlasDiscountCode> = (data.discounts ?? []).map(
          (d): AtlasDiscountCode => ({
            id: d.id,
            code: d.code,
            type: d.type,
            value: d.value,
            usageCount: d.usageCount,
            description: d.description,
            stackable: false,
          })
        );
        setDiscountCodes(mapped);
      } catch {
        // non-critical
      } finally {
        if (!cancelled) setDiscountsLoading(false);
      }
    };
    void fetchDiscounts();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // ── Pricing tiers + sale schedules (lazy, fires on Pricing tab) ──────────
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
          fetch(`/api/cms/products/${effectiveProductId}/pricing-tiers`, { credentials: "same-origin" }),
          fetch(`/api/cms/products/${effectiveProductId}/sale-schedules`, { credentials: "same-origin" }),
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

        const tiersData = (await tiersRes.json()) as { data?: PricingTierApiRow[] };
        const schedulesData = (await schedulesRes.json()) as { data?: SaleScheduleApiRow[] };
        if (cancelled) return;

        const allTiers: ReadonlyArray<PricingTierApiRow> = tiersData.data ?? [];
        const basePrice = state.product?.basePrice ?? 0;

        const qtyTiers: AtlasPricingTier[] = allTiers
          .filter((t) => t.type === "QTY")
          .map((t) => ({ id: t.id, minQty: t.minQty, maxQty: t.maxQty ?? null, price: t.price, requiresTag: t.label || null }));

        const memberTiers: AtlasMemberPricing[] = allTiers
          .filter((t) => t.type === "MEMBER")
          .map((t) => {
            const discountPercent = basePrice > 0 ? Math.round(((basePrice - t.price) / basePrice) * 100) : 0;
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
        pricingFetchedRef.current = false;
        setPricingError(err instanceof Error ? err.message : "Failed to load pricing data");
      } finally {
        if (!cancelled) setPricingLoading(false);
      }
    };

    void fetchPricing();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, effectiveProductId, isNew, state.product?.id]);

  // ── Variant persistence + save (POST create / PUT edit) ──────────────────
  const persistVariants = React.useCallback(
    async (pid: string, variants: ReadonlyArray<AtlasVariant>) => {
      if (variants.length === 0) return;
      const payloadVariants = variants.map((v) => ({
        id: v.id,
        sku: v.sku ?? undefined,
        price: Math.round(Number(v.price) || 0),
        costPrice: v.costPrice != null ? Math.round(Number(v.costPrice)) : undefined,
        stock: Math.round(Number(v.stock) || 0),
        weight: v.weight != null ? Math.round(Number(v.weight)) : undefined,
        enabled: v.enabled,
        imageId: v.imageId ?? undefined,
      }));
      const res = await fetch(`/api/cms/products/${pid}/variants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ variants: payloadVariants }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? `Variant save failed (HTTP ${res.status})`);
      }
    },
    []
  );

  const handleSave = React.useCallback(async () => {
    if (!state.product) return;
    if (saving) return;
    if (!state.product.title.trim()) {
      setSaveError("Title is required.");
      return;
    }

    setSaving(true);
    setSaveError(null);

    const slug = state.product.slug?.trim() || slugify(state.product.title);
    const payload: Record<string, unknown> = {
      ...buildSavePayload(state.product),
      slug,
      categoryIds: state.categoryIds,
    };

    try {
      if (isNew) {
        const res = await fetch("/api/cms/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
        }
        const created = await res.json();
        const newId = String(created.id ?? "");
        const product = mapApiProduct(created);

        setState((prev) => ({
          ...prev,
          product,
          images: ((created.images ?? []) as Array<Record<string, unknown>>).map((img) => ({
            id: String(img.id),
            position: Number(img.position ?? 0),
            alt: (img.alt as string | null) ?? null,
            media: {
              id: String((img.media as Record<string, unknown> | undefined)?.id ?? ""),
              url: String((img.media as Record<string, unknown> | undefined)?.url ?? ""),
              alt: (img.media as Record<string, unknown> | undefined)?.alt as string | null | undefined,
            },
          })),
        }));

        setIsNew(false);
        setEffectiveProductId(newId);
        setIsDirty(false);
        setSavedAt(`Created · ${new Date().toLocaleTimeString()}`);
        if (typeof window !== "undefined" && newId) {
          window.history.replaceState({}, "", `/admin/products/${newId}`);
        }
      } else {
        const res = await fetch(`/api/cms/products/${effectiveProductId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
        }
        const updated = await res.json();
        const product = mapApiProduct(updated);
        await persistVariants(effectiveProductId, variantsRef.current);
        setState((prev) => ({ ...prev, product }));
        setIsDirty(false);
        setSavedAt(`Saved · ${new Date().toLocaleTimeString()}`);
      }
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save product");
    } finally {
      setSaving(false);
    }
  }, [state.product, state.categoryIds, isNew, effectiveProductId, saving, persistVariants]);

  // ── In-grid variant edits (local state; persisted on save) ───────────────
  const handleCellChange = React.useCallback(
    (rowIndex: number, colId: string, value: unknown) => {
      setState((prev) => ({
        ...prev,
        variants: prev.variants.map((v, i) => (i === rowIndex ? { ...v, [colId]: value } : v)),
      }));
      setIsDirty(true);
    },
    []
  );

  const handleTypeChange = React.useCallback((type: ProductTypeKind) => {
    patchProduct({ type });
    setActiveTab("Detail");
  }, [patchProduct]);

  const handleCategoriesChange = React.useCallback((ids: ReadonlyArray<string>) => {
    setState((prev) => ({ ...prev, categoryIds: ids }));
    setIsDirty(true);
  }, []);

  // ── Derived data ───────────────────────────────────────────────────────────
  const variantCount = state.variants.length;
  const customFieldCount = state.customFields.length;
  const variantStockSummary = React.useMemo(() => {
    if (state.variants.length === 0) return null;
    return {
      variants: state.variants.length,
      totalStock: state.variants.reduce((sum, v) => sum + (v.stock ?? 0), 0),
    };
  }, [state.variants]);

  const gridColumns = React.useMemo(
    () => buildGridColumns(state.options, state.customFields),
    [state.options, state.customFields]
  );
  const gridRows = React.useMemo(() => buildGridRows(state.variants), [state.variants]);
  const matrixData = React.useMemo(() => buildMatrixData(state.options, state.variants), [state.options, state.variants]);
  const mediaData = React.useMemo(() => buildMediaData(state.options, state.variants, mediaLibrary), [state.options, state.variants, mediaLibrary]);

  const handleAssignMedia = React.useCallback(
    async (mediaIds: ReadonlyArray<string>, variantIds: ReadonlyArray<string>) => {
      const mediaId = mediaIds[0];
      if (!mediaId || variantIds.length === 0 || isNew) return;
      const idSet = new Set(variantIds);
      setState((prev) => ({
        ...prev,
        variants: prev.variants.map((v) => (idSet.has(v.id) ? { ...v, imageId: mediaId } : v)),
      }));
      try {
        await fetch(`/api/cms/products/${effectiveProductId}/variants`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({
            variants: variantIds.map((id) => {
              const v = state.variants.find((x) => x.id === id);
              return { id, price: Math.round(Number(v?.price) || 0), imageId: mediaId };
            }),
          }),
        });
        setSavedAt(`Assigned image · ${new Date().toLocaleTimeString()}`);
      } catch {
        setSaveError("Failed to assign image to variants");
      }
    },
    [effectiveProductId, isNew, state.variants]
  );

  const handleMatrixBulkEdit = React.useCallback(
    (keys: ReadonlyArray<{ rowKey: string; colKey: string }>, value: number) => {
      const cellIndex = new Map<string, string>();
      for (const cell of matrixData.cells) {
        cellIndex.set(`${cell.rowKey}|${cell.colKey}`, cell.variantId);
      }
      const targetIds = new Set<string>();
      for (const k of keys) {
        const id = cellIndex.get(`${k.rowKey}|${k.colKey}`);
        if (id) targetIds.add(id);
      }
      if (targetIds.size === 0) return;
      setState((prev) => ({
        ...prev,
        variants: prev.variants.map((v) => (targetIds.has(v.id) ? { ...v, stock: value } : v)),
      }));
      setIsDirty(true);
    },
    [matrixData.cells]
  );

  const handleBulkSetPrice = React.useCallback((rowIndexes: ReadonlyArray<number>, price: number) => {
    const idxSet = new Set(rowIndexes);
    setState((prev) => ({ ...prev, variants: prev.variants.map((v, i) => (idxSet.has(i) ? { ...v, price } : v)) }));
    setIsDirty(true);
  }, []);

  const handleBulkSetStock = React.useCallback((rowIndexes: ReadonlyArray<number>, stock: number) => {
    const idxSet = new Set(rowIndexes);
    setState((prev) => ({ ...prev, variants: prev.variants.map((v, i) => (idxSet.has(i) ? { ...v, stock } : v)) }));
    setIsDirty(true);
  }, []);

  const bundleItems: ReadonlyArray<AtlasBundleItem> = React.useMemo(() => {
    const raw = state.product?.bundleItems;
    if (!Array.isArray(raw)) return [];
    return (raw as ReadonlyArray<Record<string, unknown>>).map((b) => ({
      productId: String(b.productId ?? ""),
      productTitle: String(b.productTitle ?? "Untitled"),
      variantId: (b.variantId as string | null) ?? null,
      variantLabel: String(b.variantLabel ?? "Default"),
      productType: (b.productType ?? "SIMPLE") as ProductTypeKind,
      price: Number(b.price ?? 0),
      quantity: Number(b.quantity ?? 1),
      stock: (b.stock as number | null | undefined) ?? null,
      hex: String(b.hex ?? "#808080"),
    }));
  }, [state.product?.bundleItems]);

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

  const pricingTierEnabled = pricingTiers.length > 0;

  return {
    // identity + load
    isNew,
    effectiveProductId,
    state,
    // ui state
    activeTab,
    setActiveTab,
    isDirty,
    saving,
    saveError,
    savedAt,
    viewMode,
    setViewMode,
    matrixShowing,
    setMatrixShowing,
    inspectorRow,
    setInspectorRow,
    syncingStripe,
    generatingVariants,
    // reference data
    categories,
    globalCustomFields,
    discountCodes,
    pricingTiers,
    memberPricing,
    saleSchedule,
    pricingTierEnabled,
    pricingLoading,
    pricingError,
    bundleConfig,
    setBundleConfig,
    // derived
    variantCount,
    customFieldCount,
    variantStockSummary,
    gridColumns,
    gridRows,
    matrixData,
    mediaData,
    bundleItems,
    // core mutations
    patchProduct,
    handleSave,
    handleCellChange,
    handleTypeChange,
    handleCategoriesChange,
    handleAssignMedia,
    handleMatrixBulkEdit,
    handleBulkSetPrice,
    handleBulkSetStock,
    setMemberPricing,
    // composed async mutations
    handleStripeSync: mut.handleStripeSync,
    handleCreateCustomField: mut.handleCreateCustomField,
    handleAttachCustomField: mut.handleAttachCustomField,
    handleDetachCustomField: mut.handleDetachCustomField,
    handleToggleFieldGrid: mut.handleToggleFieldGrid,
    handleToggleFieldRequired: mut.handleToggleFieldRequired,
    handleAddImage: mut.handleAddImage,
    handleRemoveImage: mut.handleRemoveImage,
    handleUpdateAlt: mut.handleUpdateAlt,
    handleReorderImage: mut.handleReorderImage,
    handleCreateTier: mut.handleCreateTier,
    handleDeleteTier: mut.handleDeleteTier,
    handleCreateSchedule: mut.handleCreateSchedule,
    handleDeleteSchedule: mut.handleDeleteSchedule,
    handleBundleAddItem: mut.handleBundleAddItem,
    handleBundleRemoveItem: mut.handleBundleRemoveItem,
    handleBundleUpdateQty: mut.handleBundleUpdateQty,
    handleGenerateKeys: mut.handleGenerateKeys,
    handleRevokeKey: mut.handleRevokeKey,
    handleDeliveryChange: mut.handleDeliveryChange,
    handleGenerateVariants: mut.handleGenerateVariants,
  };
}
