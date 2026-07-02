"use client";
/**
 * useProductMutations — the async, API-writing half of the product editor.
 *
 * Split out of useProductEditor to keep each file focused: the core hook owns
 * state + load effects + the grid/save handlers; this hook owns every "call a
 * /api/cms endpoint" mutation (Stripe sync, custom fields, product images,
 * pricing tiers, sale schedules, bundle items, digital license keys, and
 * option/variant generation). It receives the core's state accessors + setters
 * via a typed context so the callbacks read/write the same store.
 */

import React from "react";
import type { CreateTierPayload, CreateSchedulePayload } from "../PricingStack";
import type {
  AtlasProduct,
  AtlasCustomField,
  AtlasPricingTier,
  AtlasMemberPricing,
} from "../atlas-types";
import {
  buildSavePayload,
  slugify,
  formatCentsStatic,
  type EditorLoadState,
  type ProductImageRow,
  type PricingTierApiRow,
  type SaleScheduleApiRow,
} from "./editor-model";

export interface MutationContext {
  readonly state: EditorLoadState;
  readonly setState: React.Dispatch<React.SetStateAction<EditorLoadState>>;
  readonly isNew: boolean;
  readonly effectiveProductId: string;
  readonly setSaveError: (v: string | null) => void;
  readonly setSavedAt: (v: string) => void;
  readonly setIsDirty: (v: boolean) => void;
  readonly setSyncingStripe: (v: boolean) => void;
  readonly setGeneratingVariants: (v: boolean) => void;
  readonly setReloadNonce: React.Dispatch<React.SetStateAction<number>>;
  readonly setPricingTiers: React.Dispatch<React.SetStateAction<ReadonlyArray<AtlasPricingTier>>>;
  readonly setMemberPricing: React.Dispatch<React.SetStateAction<ReadonlyArray<AtlasMemberPricing>>>;
  readonly setSaleSchedules: React.Dispatch<React.SetStateAction<ReadonlyArray<SaleScheduleApiRow>>>;
  readonly setGlobalCustomFields: React.Dispatch<React.SetStateAction<ReadonlyArray<AtlasCustomField>>>;
  readonly patchProduct: (patch: Partial<AtlasProduct>) => void;
  readonly pricingFetchedRef: React.MutableRefObject<boolean>;
}

export function useProductMutations(ctx: MutationContext) {
  const {
    state, setState, isNew, effectiveProductId,
    setSaveError, setSavedAt, setIsDirty, setSyncingStripe, setGeneratingVariants, setReloadNonce,
    setPricingTiers, setMemberPricing, setSaleSchedules, setGlobalCustomFields,
    patchProduct, pricingFetchedRef,
  } = ctx;

  // ── Stripe sync ────────────────────────────────────────────────────────────
  const handleStripeSync = React.useCallback(async () => {
    if (!state.product?.id || isNew) {
      setSaveError("Save the product before syncing to Stripe.");
      return;
    }
    setSyncingStripe(true);
    try {
      const res = await fetch(`/api/cms/products/${effectiveProductId}/sync-stripe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ syncVariants: true }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
      }
      const result = await res.json();
      setState((prev) => ({
        ...prev,
        product: prev.product
          ? {
              ...prev.product,
              stripeProductId: (result.stripeProductId as string | null) ?? null,
              stripePriceId: (result.stripePriceId as string | null) ?? null,
              stripeSyncedAt: (result.stripeSyncedAt as string | null) ?? null,
              stripeSyncError: null,
            }
          : prev.product,
      }));
      setSavedAt(`Stripe synced · ${new Date().toLocaleTimeString()}`);
    } catch (err) {
      setState((prev) => ({
        ...prev,
        product: prev.product
          ? { ...prev.product, stripeSyncError: err instanceof Error ? err.message : "Sync failed" }
          : prev.product,
      }));
    } finally {
      setSyncingStripe(false);
    }
  }, [state.product?.id, isNew, effectiveProductId, setState, setSaveError, setSavedAt, setSyncingStripe]);

  // ── Custom fields ────────────────────────────────────────────────────────
  const mapApiCustomField = React.useCallback((f: Record<string, unknown>): AtlasCustomField => ({
    id: String(f.id ?? ""),
    name: String(f.name ?? ""),
    slug: String(f.slug ?? ""),
    type: (f.type as AtlasCustomField["type"]) ?? "TEXT",
    options: f.options ?? null,
    defaultValue: f.defaultValue ?? null,
    required: !!f.required,
    showInGrid: (f.enabled as boolean | undefined) !== false,
  }), []);

  const reloadCustomFields = React.useCallback(async () => {
    if (isNew || !effectiveProductId || effectiveProductId === "new") return;
    try {
      const res = await fetch(`/api/cms/products/${effectiveProductId}/custom-fields`, {
        credentials: "same-origin",
      });
      if (!res.ok) return;
      const data = await res.json();
      const assigned = ((data.assignedFields ?? []) as Array<Record<string, unknown>>).map((f) => ({
        id: String(f.id ?? ""),
        productId: effectiveProductId,
        customFieldId: String(f.id ?? ""),
        required: !!f.required,
        showInGrid: (f.enabled as boolean | undefined) !== false,
        position: Number(f.position ?? 0),
        customField: mapApiCustomField(f),
      }));
      const available = ((data.availableFields ?? []) as Array<Record<string, unknown>>).map(mapApiCustomField);
      setState((prev) => ({ ...prev, customFields: assigned }));
      setGlobalCustomFields(available);
    } catch {
      // non-critical
    }
  }, [effectiveProductId, isNew, mapApiCustomField, setState, setGlobalCustomFields]);

  const handleCreateCustomField = React.useCallback(
    async (field: { name: string; type: string; slug: string; description: string; options: ReadonlyArray<{ label: string; slug: string }>; defaultValue: string; required: boolean }) => {
      if (isNew || !effectiveProductId) {
        setSaveError("Save the product before adding custom fields.");
        return;
      }
      try {
        const createRes = await fetch(`/api/cms/custom-fields`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({
            name: field.name,
            slug: field.slug || undefined,
            description: field.description || undefined,
            type: field.type,
            options: field.options.length
              ? field.options.map((o) => ({ value: o.slug || o.label, label: o.label }))
              : undefined,
            defaultValue: field.defaultValue || undefined,
            required: field.required,
          }),
        });
        if (!createRes.ok) throw new Error(`Create field failed (HTTP ${createRes.status})`);
        const created = await createRes.json();
        const newId = String(created.id ?? created.field?.id ?? "");
        if (newId) {
          await fetch(`/api/cms/products/${effectiveProductId}/custom-fields`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "same-origin",
            body: JSON.stringify({ fieldIds: [newId] }),
          });
        }
        await reloadCustomFields();
      } catch (err) {
        setSaveError(err instanceof Error ? err.message : "Failed to create custom field");
      }
    },
    [effectiveProductId, isNew, reloadCustomFields, setSaveError]
  );

  const handleAttachCustomField = React.useCallback(
    async (fieldId: string) => {
      if (isNew || !effectiveProductId) return;
      try {
        await fetch(`/api/cms/products/${effectiveProductId}/custom-fields`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ fieldIds: [fieldId] }),
        });
        await reloadCustomFields();
      } catch { /* non-critical */ }
    },
    [effectiveProductId, isNew, reloadCustomFields]
  );

  const handleDetachCustomField = React.useCallback(
    async (customFieldId: string) => {
      if (isNew || !effectiveProductId) return;
      try {
        await fetch(
          `/api/cms/products/${effectiveProductId}/custom-fields?fieldIds=${encodeURIComponent(customFieldId)}&removeValues=true`,
          { method: "DELETE", credentials: "same-origin" }
        );
        await reloadCustomFields();
      } catch { /* non-critical */ }
    },
    [effectiveProductId, isNew, reloadCustomFields]
  );

  const handleToggleFieldGrid = React.useCallback(
    async (customFieldId: string, showInGrid: boolean) => {
      if (isNew || !effectiveProductId) return;
      try {
        await fetch(`/api/cms/products/${effectiveProductId}/custom-fields`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ fieldId: customFieldId, enabled: showInGrid }),
        });
        await reloadCustomFields();
      } catch { /* non-critical */ }
    },
    [effectiveProductId, isNew, reloadCustomFields]
  );

  const handleToggleFieldRequired = React.useCallback(
    async (customFieldId: string, required: boolean) => {
      try {
        await fetch(`/api/cms/custom-fields/${customFieldId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ required }),
        });
        await reloadCustomFields();
      } catch { /* non-critical */ }
    },
    [reloadCustomFields]
  );

  // ── Product images ─────────────────────────────────────────────────────────
  const refetchProduct = React.useCallback(async () => {
    if (isNew || !effectiveProductId) return;
    try {
      const res = await fetch(`/api/cms/products/${effectiveProductId}?includeImages=true`, {
        credentials: "same-origin",
      });
      if (!res.ok) return;
      const data = await res.json();
      const images: ProductImageRow[] = ((data.images ?? []) as Array<Record<string, unknown>>).map((img) => ({
        id: String(img.id),
        position: Number(img.position ?? 0),
        alt: (img.alt as string | null) ?? null,
        media: {
          id: String((img.media as Record<string, unknown> | undefined)?.id ?? ""),
          url: String((img.media as Record<string, unknown> | undefined)?.url ?? ""),
          alt: (img.media as Record<string, unknown> | undefined)?.alt as string | null | undefined,
        },
      }));
      setState((prev) => ({ ...prev, images }));
    } catch { /* non-critical */ }
  }, [effectiveProductId, isNew, setState]);

  const handleAddImage = React.useCallback(async () => {
    if (isNew || !effectiveProductId) {
      setSaveError("Save the product before adding images.");
      return;
    }
    if (typeof window === "undefined") return;
    const url = window.prompt("Paste an image URL to attach to this product:");
    if (!url) return;
    try {
      const mediaId = window.prompt(
        "Paste the Media library ID for this image (upload via Media first, then copy its ID):"
      );
      if (!mediaId) return;
      const res = await fetch(`/api/cms/products/${effectiveProductId}/images`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ mediaId, alt: null, url }),
      });
      if (!res.ok) {
        setSaveError(
          "Image upload endpoint is not available in this deploy. Use the Media library and connect images via the database for now."
        );
        return;
      }
      await refetchProduct();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to add image");
    }
  }, [effectiveProductId, isNew, refetchProduct, setSaveError]);

  const handleRemoveImage = React.useCallback(
    async (imageId: string) => {
      if (isNew || !effectiveProductId) return;
      setState((prev) => ({ ...prev, images: prev.images.filter((img) => img.id !== imageId) }));
      try {
        const res = await fetch(`/api/cms/products/${effectiveProductId}/images/${imageId}`, {
          method: "DELETE",
          credentials: "same-origin",
        });
        if (!res.ok) {
          await refetchProduct();
          setSaveError("Failed to remove image.");
        }
      } catch {
        await refetchProduct();
      }
    },
    [effectiveProductId, isNew, refetchProduct, setState, setSaveError]
  );

  const handleUpdateAlt = React.useCallback((imageId: string, alt: string) => {
    setState((prev) => ({
      ...prev,
      images: prev.images.map((img) => (img.id === imageId ? { ...img, alt } : img)),
    }));
    setIsDirty(true);
  }, [setState, setIsDirty]);

  const handleReorderImage = React.useCallback(
    (imageId: string, direction: -1 | 1) => {
      setState((prev) => {
        const ordered = [...prev.images];
        const idx = ordered.findIndex((img) => img.id === imageId);
        if (idx === -1) return prev;
        const target = idx + direction;
        if (target < 0 || target >= ordered.length) return prev;
        const tmp = ordered[idx];
        ordered[idx] = ordered[target];
        ordered[target] = tmp;
        return { ...prev, images: ordered.map((img, i) => ({ ...img, position: i })) };
      });
      setIsDirty(true);
    },
    [setState, setIsDirty]
  );

  // ── Pricing tiers ────────────────────────────────────────────────────────
  const handleCreateTier = React.useCallback(
    async (payload: CreateTierPayload) => {
      const body: CreateTierPayload = { ...payload, maxQty: payload.maxQty ?? null };
      const res = await fetch(`/api/cms/products/${effectiveProductId}/pricing-tiers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? `HTTP ${res.status}`);
      }
      const data = (await res.json()) as { data?: PricingTierApiRow };
      const created = data.data;
      if (!created) return;
      const basePrice = state.product?.basePrice ?? 0;
      if (created.type === "QTY") {
        setPricingTiers((prev) => [
          ...prev,
          { id: created.id, minQty: created.minQty, maxQty: created.maxQty ?? null, price: created.price, requiresTag: created.label || null },
        ]);
      } else {
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
    },
    [effectiveProductId, state.product?.basePrice, setPricingTiers, setMemberPricing]
  );

  const handleDeleteTier = React.useCallback(
    async (tierId: string) => {
      setPricingTiers((prev) => prev.filter((t) => t.id !== tierId));
      setMemberPricing((prev) => prev.filter((m) => m.id !== tierId));
      const res = await fetch(`/api/cms/products/${effectiveProductId}/pricing-tiers`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ tierId }),
      });
      if (!res.ok) {
        pricingFetchedRef.current = false;
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
      }
    },
    [effectiveProductId, setPricingTiers, setMemberPricing, pricingFetchedRef]
  );

  const handleCreateSchedule = React.useCallback(
    async (payload: CreateSchedulePayload) => {
      const res = await fetch(`/api/cms/products/${effectiveProductId}/sale-schedules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? `HTTP ${res.status}`);
      }
      const data = (await res.json()) as { data?: SaleScheduleApiRow };
      const created = data.data;
      if (!created) return;
      setSaleSchedules((prev) => [...prev, created]);
    },
    [effectiveProductId, setSaleSchedules]
  );

  const handleDeleteSchedule = React.useCallback(
    async (scheduleId: string) => {
      setSaleSchedules((prev) => prev.filter((s) => s.id !== scheduleId));
      const res = await fetch(`/api/cms/products/${effectiveProductId}/sale-schedules`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ scheduleId }),
      });
      if (!res.ok) {
        pricingFetchedRef.current = false;
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
      }
    },
    [effectiveProductId, setSaleSchedules, pricingFetchedRef]
  );

  // ── Bundle items (BUNDLE) ────────────────────────────────────────────────
  const handleBundleAddItem = React.useCallback(async () => {
    const term = window.prompt("Add bundle item — search products by title or SKU:");
    if (!term) return;
    try {
      const res = await fetch(`/api/cms/products?search=${encodeURIComponent(term)}&limit=5`, {
        credentials: "same-origin",
      });
      const data = await res.json();
      const list = (data.products ?? data.data ?? []) as Array<Record<string, unknown>>;
      const p = list.find((x) => String(x.id) !== effectiveProductId) ?? list[0];
      if (!p) { setSaveError(`No product found for "${term}".`); return; }
      const newItem = {
        productId: String(p.id),
        productTitle: String(p.title ?? "Untitled"),
        variantId: null,
        variantLabel: "Default",
        productType: String(p.type ?? "SIMPLE"),
        price: Number(p.basePrice ?? 0),
        quantity: 1,
        stock: p.type === "DIGITAL" ? null : Number(p.stock ?? 0),
        hex: "#808080",
      };
      const raw = Array.isArray(state.product?.bundleItems) ? (state.product!.bundleItems as unknown[]) : [];
      patchProduct({ bundleItems: [...raw, newItem] });
    } catch {
      setSaveError("Failed to search products.");
    }
  }, [effectiveProductId, state.product, patchProduct, setSaveError]);

  const handleBundleRemoveItem = React.useCallback((index: number) => {
    const raw = Array.isArray(state.product?.bundleItems) ? (state.product!.bundleItems as unknown[]) : [];
    patchProduct({ bundleItems: raw.filter((_, i) => i !== index) });
  }, [state.product, patchProduct]);

  const handleBundleUpdateQty = React.useCallback((index: number, qty: number) => {
    const raw = Array.isArray(state.product?.bundleItems) ? (state.product!.bundleItems as Array<Record<string, unknown>>) : [];
    patchProduct({ bundleItems: raw.map((it, i) => (i === index ? { ...it, quantity: Math.max(1, qty) } : it)) });
  }, [state.product, patchProduct]);

  // ── Digital license keys + delivery ──────────────────────────────────────
  const reloadDigitalAsset = React.useCallback(async (assetId: string) => {
    try {
      const res = await fetch(`/api/cms/digital-assets/${assetId}`, { credentials: "same-origin" });
      if (!res.ok) return;
      const data = await res.json();
      const asset = data.asset ?? data;
      setState((prev) => ({ ...prev, digitalAsset: asset }));
    } catch { /* non-critical */ }
  }, [setState]);

  const handleGenerateKeys = React.useCallback(async (count: number) => {
    const assetId = state.digitalAsset?.id;
    if (!assetId || count <= 0) return;
    const stamp = effectiveProductId.slice(-4).toUpperCase();
    const block = () => Math.random().toString(36).slice(2, 6).toUpperCase();
    const keys = Array.from({ length: Math.min(count, 1000) }, (_, i) =>
      `${stamp}-${block()}-${block()}-${String(i).padStart(4, "0")}`
    );
    try {
      const res = await fetch(`/api/cms/digital-assets/${assetId}/license-keys`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ keys }),
      });
      if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error((b as { error?: string }).error ?? `HTTP ${res.status}`); }
      setSavedAt(`Generated ${keys.length} keys · ${new Date().toLocaleTimeString()}`);
      await reloadDigitalAsset(assetId);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to generate keys");
    }
  }, [state.digitalAsset?.id, effectiveProductId, reloadDigitalAsset, setSavedAt, setSaveError]);

  const handleRevokeKey = React.useCallback(async (keyId: string) => {
    const assetId = state.digitalAsset?.id;
    if (!assetId) return;
    try {
      await fetch(`/api/cms/digital-assets/${assetId}/license-keys/${keyId}`, { method: "DELETE", credentials: "same-origin" });
      await reloadDigitalAsset(assetId);
    } catch { /* non-critical */ }
  }, [state.digitalAsset?.id, reloadDigitalAsset]);

  const handleDeliveryChange = React.useCallback(async (settings: Record<string, unknown>) => {
    const assetId = state.digitalAsset?.id;
    if (!assetId) return;
    const payload: Record<string, unknown> = {};
    if ("maxDownloads" in settings) payload.downloadLimit = settings.maxDownloads;
    if ("linkExpiry" in settings) payload.downloadExpiry = settings.linkExpiry;
    if ("useLicenseKeys" in settings) payload.useLicenseKeys = settings.useLicenseKeys;
    if ("method" in settings) payload.deliveryMethod = settings.method;
    try {
      await fetch(`/api/cms/digital-assets/${assetId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(payload),
      });
      await reloadDigitalAsset(assetId);
    } catch { /* non-critical */ }
  }, [state.digitalAsset?.id, reloadDigitalAsset]);

  // ── Option + variant generation (brand-new VARIABLE products) ──────────────
  const handleGenerateVariants = React.useCallback(
    async (optionSpecs: ReadonlyArray<{ name: string; values: ReadonlyArray<string> }>) => {
      if (!state.product || isNew || !effectiveProductId) return;
      const specs = optionSpecs
        .map((o) => ({ name: o.name.trim(), values: o.values.map((v) => v.trim()).filter(Boolean) }))
        .filter((o) => o.name && o.values.length);
      if (specs.length === 0) return;
      setGeneratingVariants(true);
      setSaveError(null);
      try {
        const slug = state.product.slug?.trim() || slugify(state.product.title);
        const putRes = await fetch(`/api/cms/products/${effectiveProductId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ ...buildSavePayload(state.product), slug, type: "VARIABLE", categoryIds: state.categoryIds, options: specs }),
        });
        if (!putRes.ok) throw new Error(`Create options failed (HTTP ${putRes.status})`);
        const optRes = await fetch(`/api/cms/products/${effectiveProductId}/variants`, { credentials: "same-origin" });
        const optData = await optRes.json();
        const opts = (optData.options ?? []) as Array<{ id: string; name: string; values: Array<{ id: string; value: string }> }>;
        if (opts.length === 0) throw new Error("No options returned");

        const axes = opts.map((o) => o.values.map((v) => ({ id: v.id, value: v.value })));
        let combos: Array<Array<{ id: string; value: string }>> = [[]];
        for (const axis of axes) {
          const next: Array<Array<{ id: string; value: string }>> = [];
          for (const combo of combos) for (const val of axis) next.push([...combo, val]);
          combos = next;
        }
        const baseSku = state.product.sku || "SKU";
        const variants = combos.map((combo) => ({
          price: state.product!.basePrice || 0,
          sku: `${baseSku}-${combo.map((c) => c.value.slice(0, 3).toUpperCase()).join("-")}`,
          stock: 0,
          optionValues: combo.map((c) => c.id),
        }));

        const vRes = await fetch(`/api/cms/products/${effectiveProductId}/variants`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ variants }),
        });
        if (!vRes.ok) throw new Error(`Create variants failed (HTTP ${vRes.status})`);

        setSavedAt(`Generated ${variants.length} variants · ${new Date().toLocaleTimeString()}`);
        setReloadNonce((n) => n + 1);
      } catch (err) {
        setSaveError(err instanceof Error ? err.message : "Failed to generate variants");
      } finally {
        setGeneratingVariants(false);
      }
    },
    [state.product, state.categoryIds, effectiveProductId, isNew, setGeneratingVariants, setSaveError, setSavedAt, setReloadNonce]
  );

  return {
    reloadCustomFields,
    refetchProduct,
    handleStripeSync,
    handleCreateCustomField,
    handleAttachCustomField,
    handleDetachCustomField,
    handleToggleFieldGrid,
    handleToggleFieldRequired,
    handleAddImage,
    handleRemoveImage,
    handleUpdateAlt,
    handleReorderImage,
    handleCreateTier,
    handleDeleteTier,
    handleCreateSchedule,
    handleDeleteSchedule,
    handleBundleAddItem,
    handleBundleRemoveItem,
    handleBundleUpdateQty,
    handleGenerateKeys,
    handleRevokeKey,
    handleDeliveryChange,
    handleGenerateVariants,
  };
}
