"use client";
/**
 * ProductEditor — Grainy product editor shell.
 *
 * Owns no data of its own: the useProductEditor hook is the controller and
 * every heavy surface (variant spreadsheet/matrix/cards, pricing stack, custom
 * fields, media bulk-assign, digital keys, bundle, type morph) is an embedded
 * organ. This file is just the Grainy chrome — masthead, tab strip, body
 * routing, save bar, and the single-row inspector drawer — plus the per-type
 * tab set driven by the product's real capabilities.
 *
 * Replaces the 2,214-line ProductEditorAtlas + ProductEditorAtlasTabs monolith.
 */

import React from "react";
import "../atlas-product-editor.css";

import { EditorHeader } from "./editor-header";
import { useProductEditor } from "./use-product-editor";
import { EMPTY_PRODUCT, TABS_BY_TYPE, slugify, type TabLabel } from "./editor-model";
import { tabShell } from "./form-primitives";

import { DetailTab } from "./details-tab";
import { MediaTab } from "./media-tab";
import { PricingExtras } from "./pricing-extras";
import { InventoryTab } from "./inventory-tab";
import { ChannelsTab } from "./channels-tab";
import { SeoTab } from "./seo-tab";
import { ScheduleTab, BillingTab } from "./service-billing-tabs";

import { SpreadsheetGrid } from "../SpreadsheetGrid";
import { MatrixView } from "../MatrixView";
import { VariantCards } from "../VariantCards";
import { VariantInspector } from "../VariantInspector";
import { OptionBuilder } from "../OptionBuilder";
import { TypeMorph } from "../TypeMorph";
import { CustomFieldsBuilder } from "../CustomFieldsBuilder";
import { MediaBulkAssign } from "../MediaBulkAssign";
import { BundleComposer } from "../BundleComposer";
import { DigitalEditor } from "../DigitalEditor";
import { PricingStack } from "../PricingStack";

export interface ProductEditorProps {
  /** Product ID to load. Pass "new" to enter create mode. */
  readonly productId: string;
  /** Subdomain slug (passed from route params). */
  readonly subdomain: string;
}

// ── "Save the product first" empty state ────────────────────────────────────
function SaveFirstNotice({ title, body }: { readonly title: string; readonly body: string }) {
  return (
    <div style={{ ...tabShell, maxWidth: 560 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8 }}>
        <span style={{ fontWeight: 600, fontSize: 14 }}>{title}</span>
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>· save the product first</span>
      </div>
      <p style={{ color: "var(--text-secondary)", fontSize: 13, lineHeight: 1.5 }}>{body}</p>
    </div>
  );
}

export function ProductEditor({ productId, subdomain }: ProductEditorProps): React.ReactElement {
  const ed = useProductEditor({ productId, subdomain });
  const { state, isNew } = ed;

  if (state.loading) {
    return (
      <div className="atlas" style={{ padding: "48px 26px", textAlign: "center", color: "var(--text-muted)" }}>
        Loading product…
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="atlas" style={{ padding: "40px 26px" }}>
        <h1 style={{ fontSize: "var(--text-lg)", margin: "0 0 8px", color: "var(--rust-700)" }}>
          Error loading product
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>{state.error}</p>
        <a href="/admin/products" className="btn btn-secondary btn-sm" style={{ marginTop: 12 }}>
          ← Back to products
        </a>
      </div>
    );
  }

  const product = state.product ?? EMPTY_PRODUCT;
  const hasBeenSaved = !isNew && Boolean(product.id);
  const backHref = "/admin/products";

  const tabs = TABS_BY_TYPE[product.type].map((label) => ({
    label,
    count:
      label === "Variants" ? ed.variantCount || null
      : label === "Files" ? (state.digitalAsset ? 1 : null)
      : label === "Media" ? (state.images.length || null)
      : label === "Contents" ? ed.bundleItems.length || null
      : null,
  }));
  const tabLabels = tabs.map((t) => t.label);
  const activeTab: TabLabel = (tabLabels as ReadonlyArray<string>).includes(ed.activeTab)
    ? (ed.activeTab as TabLabel)
    : "Detail";

  return (
    <div className="atlas" style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0, position: "relative" }}>
      <EditorHeader
        product={product}
        isNew={isNew}
        isDirty={ed.isDirty}
        saving={ed.saving}
        variantCount={ed.variantCount}
        customFieldCount={ed.customFieldCount}
        backHref={backHref}
        onSave={() => void ed.handleSave()}
      />

      {/* Tab strip */}
      <div style={{ padding: "0 26px", flex: "none" }}>
        <div style={{ display: "flex", gap: 4, marginTop: 16, borderBottom: "1px solid var(--line)", overflowX: "auto" }}>
          {tabs.map(({ label, count }) => (
            <button
              key={label}
              type="button"
              onClick={() => ed.setActiveTab(label)}
              style={{
                border: "none",
                background: "transparent",
                cursor: "pointer",
                padding: "8px 12px",
                marginBottom: -1,
                fontSize: 13,
                fontWeight: 500,
                whiteSpace: "nowrap",
                color: activeTab === label ? "var(--text)" : "var(--text-secondary)",
                borderBottom: `2px solid ${activeTab === label ? "var(--primary)" : "transparent"}`,
              }}
            >
              {label}
              {count != null && (
                <span className="gr-num" style={{ marginLeft: 6, fontSize: 11, color: "var(--text-muted)" }}>{count}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {ed.saveError && (
        <div
          role="alert"
          style={{
            margin: "12px 26px 0",
            padding: "8px 12px",
            border: "1px solid var(--rust-500)",
            borderRadius: "var(--r-sm)",
            color: "var(--rust-700)",
            background: "color-mix(in srgb, var(--rust-100) 40%, transparent)",
            fontSize: 13,
          }}
        >
          {ed.saveError}
        </div>
      )}

      {/* Body */}
      <div className="gr-scroll" style={{ flex: 1, minHeight: 0, padding: "16px 26px 20px" }}>
        {activeTab === "Detail" && (
          <DetailTab
            product={product}
            onChange={ed.patchProduct}
            categories={ed.categories}
            selectedCategoryIds={state.categoryIds}
            onCategoriesChange={ed.handleCategoriesChange}
            onAutoSlug={() => ed.patchProduct({ slug: slugify(product.title) })}
          />
        )}

        {activeTab === "Media" && (
          <>
            <MediaTab
              images={state.images}
              canUpload={hasBeenSaved}
              onAddImage={() => void ed.handleAddImage()}
              onRemoveImage={(id) => void ed.handleRemoveImage(id)}
              onUpdateAlt={ed.handleUpdateAlt}
              onReorder={ed.handleReorderImage}
            />
            {hasBeenSaved && state.variants.length > 0 && (
              <div style={{ marginTop: 18, borderTop: "1px solid var(--line)", paddingTop: 14 }}>
                <MediaBulkAssign
                  library={ed.mediaData.libraryItems}
                  variantRows={ed.mediaData.variantRows}
                  colorGroups={ed.mediaData.colorGroups}
                  coverage={ed.mediaData.coverage}
                  onAssign={(mediaIds, variantIds) => void ed.handleAssignMedia(mediaIds, variantIds)}
                  savedAt={ed.savedAt}
                />
              </div>
            )}
          </>
        )}

        {activeTab === "Variants" && (
          !hasBeenSaved ? (
            <SaveFirstNotice
              title="Variants"
              body="Variants require a saved product so option values can be attached. Save the Detail tab first, then return here."
            />
          ) : state.options.length === 0 ? (
            <OptionBuilder onGenerate={(specs) => void ed.handleGenerateVariants(specs)} busy={ed.generatingVariants} />
          ) : ed.viewMode === "list" ? (
            <SpreadsheetGrid
              productId={product.id}
              productTitle={product.title}
              sku={product.sku ?? ""}
              rows={ed.gridRows}
              columns={ed.gridColumns}
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
              viewMode={ed.viewMode}
              onViewChange={ed.setViewMode}
              onCellChange={ed.handleCellChange}
              onBulkSetPrice={ed.handleBulkSetPrice}
              onBulkSetStock={ed.handleBulkSetStock}
              onInspectRow={ed.setInspectorRow}
              onSave={() => void ed.handleSave()}
              isDirty={ed.isDirty}
              savedAt={ed.savedAt}
            />
          ) : ed.viewMode === "matrix" ? (
            <MatrixView
              rows={ed.matrixData.rows}
              cols={ed.matrixData.cols}
              cells={ed.matrixData.cells}
              rowAxisName={ed.matrixData.rowAxisName}
              colAxisName={ed.matrixData.colAxisName}
              showing={ed.matrixShowing}
              onShowingChange={ed.setMatrixShowing}
              onCellBulkEdit={ed.handleMatrixBulkEdit}
              onViewChange={ed.setViewMode}
              onSave={() => void ed.handleSave()}
              isDirty={ed.isDirty}
              savedAt={ed.savedAt}
            />
          ) : (
            <VariantCards
              rows={ed.gridRows}
              options={state.options}
              fieldColumns={ed.gridColumns.filter((c) => c.kind === "field")}
              viewMode={ed.viewMode}
              onViewChange={ed.setViewMode}
              onSave={() => void ed.handleSave()}
              isDirty={ed.isDirty}
              savedAt={ed.savedAt}
            />
          )
        )}

        {activeTab === "Fields" && (
          !hasBeenSaved ? (
            <SaveFirstNotice title="Custom fields" body="Save the Detail tab first, then attach custom fields here." />
          ) : (
            <CustomFieldsBuilder
              globalFields={ed.globalCustomFields}
              attachedFields={state.customFields}
              onCreateField={(f) => void ed.handleCreateCustomField(f)}
              onAttach={(id) => void ed.handleAttachCustomField(id)}
              onDetach={(id) => void ed.handleDetachCustomField(id)}
              onToggleShowInGrid={(id, v) => void ed.handleToggleFieldGrid(id, v)}
              onToggleRequired={(id, v) => void ed.handleToggleFieldRequired(id, v)}
              isDirty={ed.isDirty}
              savedAt={ed.savedAt}
            />
          )
        )}

        {activeTab === "Type" && (
          <TypeMorph
            currentType={product.type}
            productTitle={product.title}
            variantCount={ed.variantCount}
            options={state.options}
            stripeSync={product.stripeSyncedAt ? `Synced ${new Date(product.stripeSyncedAt).toLocaleDateString()}` : undefined}
            onTypeChange={ed.handleTypeChange}
            savedAt={ed.savedAt}
            isDirty={ed.isDirty}
          />
        )}

        {activeTab === "Contents" && (
          <BundleComposer
            items={ed.bundleItems}
            priceMode={(product.bundlePriceMode === "fixed" ? "fixed" : "calculated") as "fixed" | "calculated"}
            fixedPrice={product.basePrice}
            allowVariantChoice={ed.bundleConfig.allowVariantChoice}
            allowSubstitutions={ed.bundleConfig.allowSubstitutions}
            includeGiftWrap={ed.bundleConfig.includeGiftWrap}
            onAddItem={() => void ed.handleBundleAddItem()}
            onRemoveItem={ed.handleBundleRemoveItem}
            onUpdateQty={ed.handleBundleUpdateQty}
            onPriceModeChange={(mode) => ed.patchProduct({ bundlePriceMode: mode })}
            onFixedPriceChange={(price) => ed.patchProduct({ basePrice: price })}
            onAllowVariantChoiceChange={(v) => ed.setBundleConfig((c) => ({ ...c, allowVariantChoice: v }))}
            onAllowSubstitutionsChange={(v) => ed.setBundleConfig((c) => ({ ...c, allowSubstitutions: v }))}
            onIncludeGiftWrapChange={(v) => ed.setBundleConfig((c) => ({ ...c, includeGiftWrap: v }))}
            isDirty={ed.isDirty}
            savedAt={ed.savedAt}
          />
        )}

        {activeTab === "Files" && (
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
            onGenerateKeys={(count) => void ed.handleGenerateKeys(count)}
            onRevokeKey={(keyId) => void ed.handleRevokeKey(keyId)}
            onDeliveryChange={(s) => void ed.handleDeliveryChange(s as Record<string, unknown>)}
            onUploadNew={() => void ed.handleAddImage()}
            isDirty={ed.isDirty}
            savedAt={ed.savedAt}
          />
        )}

        {activeTab === "Pricing" && (
          <>
            <PricingExtras product={product} onChange={ed.patchProduct} />
            <PricingStack
              basePrices={[{ label: "Base price", price: product.basePrice, cost: product.costPrice ?? 0 }]}
              tierPricing={ed.pricingTiers}
              tierEnabled={ed.pricingTierEnabled}
              memberPricing={ed.memberPricing}
              saleSchedule={ed.saleSchedule}
              discountCodes={ed.discountCodes}
              pricingLoading={ed.pricingLoading}
              pricingError={ed.pricingError}
              onCreateTier={ed.handleCreateTier}
              onDeleteTier={ed.handleDeleteTier}
              onCreateSchedule={ed.handleCreateSchedule}
              onDeleteSchedule={ed.handleDeleteSchedule}
              onToggleTierEnabled={() => {
                /* Visual toggle only — enablement persists with the tier row. */
              }}
              onToggleMemberPricing={(id, enabled) => {
                ed.setMemberPricing((prev) => prev.map((m) => (m.id === id ? { ...m, enabled } : m)));
              }}
              isDirty={ed.isDirty}
              savedAt={ed.savedAt}
            />
          </>
        )}

        {activeTab === "Inventory" && (
          <InventoryTab product={product} onChange={ed.patchProduct} variantStockSummary={ed.variantStockSummary} />
        )}

        {activeTab === "Channels" && (
          <ChannelsTab
            product={product}
            onChange={ed.patchProduct}
            hasBeenSaved={hasBeenSaved}
            syncingStripe={ed.syncingStripe}
            onSyncStripe={() => void ed.handleStripeSync()}
          />
        )}

        {activeTab === "SEO" && <SeoTab product={product} onChange={ed.patchProduct} />}
        {activeTab === "Schedule" && <ScheduleTab product={product} onChange={ed.patchProduct} />}
        {activeTab === "Billing" && <BillingTab product={product} onChange={ed.patchProduct} />}
      </div>

      {/* Save bar */}
      <div
        style={{
          flex: "none",
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "10px 26px",
          borderTop: "1px solid var(--line)",
          background: "var(--surface-raised)",
        }}
      >
        <span className="gr-num" style={{ fontSize: 11, color: "var(--text-muted)" }}>
          {ed.savedAt || (ed.isDirty ? "Unsaved changes" : "All changes saved")}
        </span>
        <span style={{ marginLeft: "auto" }}>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => void ed.handleSave()}
            disabled={ed.saving || (!ed.isDirty && !isNew)}
          >
            {ed.saving ? (isNew ? "Creating…" : "Saving…") : isNew ? "Create product" : ed.isDirty ? "Save changes" : "Saved"}
          </button>
        </span>
      </div>

      {/* Single-row deep-edit drawer */}
      {ed.inspectorRow != null && ed.gridRows[ed.inspectorRow] && (
        <VariantInspector
          row={ed.gridRows[ed.inspectorRow]}
          rowIndex={ed.inspectorRow}
          columns={ed.gridColumns}
          onChange={ed.handleCellChange}
          onClose={() => ed.setInspectorRow(null)}
        />
      )}
    </div>
  );
}
