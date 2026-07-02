"use client";
/**
 * ChannelsTab — storefront visibility + Stripe sync + Shopify status (read-only).
 */

import React from "react";
import { Globe, CreditCard } from "lucide-react";
import type { AtlasProduct } from "../atlas-types";
import { SectionHead, Field, twoCol, tabShell, hintStyle } from "./form-primitives";

interface ChannelsTabProps {
  readonly product: AtlasProduct;
  readonly onChange: (patch: Partial<AtlasProduct>) => void;
  readonly hasBeenSaved: boolean;
  readonly syncingStripe: boolean;
  readonly onSyncStripe: () => void;
}

export function ChannelsTab({
  product,
  onChange,
  hasBeenSaved,
  syncingStripe,
  onSyncStripe,
}: ChannelsTabProps): React.ReactElement {
  return (
    <div style={tabShell}>
      <SectionHead icon={Globe} title="Storefront (web)" meta="visibility on this tenant's web storefront" />
      <div style={twoCol}>
        <Field label="Web status" hint="Only ACTIVE products appear on the web storefront.">
          <select
            className="select"
            value={product.status}
            onChange={(e) => onChange({ status: e.target.value as AtlasProduct["status"] })}
          >
            <option value="DRAFT">Draft (hidden)</option>
            <option value="ACTIVE">Active (published)</option>
            <option value="ARCHIVED">Archived (hidden)</option>
          </select>
        </Field>
      </div>

      <SectionHead icon={CreditCard} title="Stripe" meta="sync this product + variants to Stripe" />
      <div style={{ paddingBottom: 16 }}>
        {!hasBeenSaved ? (
          <p style={{ ...hintStyle, margin: 0 }}>Save the product first to enable Stripe sync.</p>
        ) : product.stripeProductId ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span className="badge badge-sage">Synced</span>
              <span className="gr-num" style={{ fontSize: 12 }}>{product.stripeProductId}</span>
              {product.stripeSyncedAt && (
                <span style={{ ...hintStyle, margin: 0 }}>
                  Last sync: {new Date(product.stripeSyncedAt).toLocaleString()}
                </span>
              )}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() =>
                  window.open(
                    `https://dashboard.stripe.com/products/${product.stripeProductId}`,
                    "_blank",
                    "noopener,noreferrer"
                  )
                }
              >
                View in Stripe ↗
              </button>
              <button type="button" className="btn btn-primary btn-sm" onClick={onSyncStripe} disabled={syncingStripe}>
                {syncingStripe ? "Re-syncing…" : "Re-sync"}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-start" }}>
            <span className="badge badge-neutral">Not synced</span>
            <button type="button" className="btn btn-primary btn-sm" onClick={onSyncStripe} disabled={syncingStripe}>
              {syncingStripe ? "Syncing…" : "Sync to Stripe"}
            </button>
          </div>
        )}
        {product.stripeSyncError && (
          <div
            style={{
              marginTop: 10,
              padding: 10,
              border: "1px solid var(--rust-500)",
              borderRadius: "var(--r-sm)",
              color: "var(--rust-700)",
              fontSize: 12,
              fontFamily: "var(--font-mono)",
              whiteSpace: "pre-wrap",
            }}
          >
            {product.stripeSyncError}
          </div>
        )}
      </div>

      {product.shopifyProductId && (
        <>
          <SectionHead title="Shopify" meta="read-only status (sync managed via Shopify provider)" />
          <div style={{ paddingBottom: 16, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span className="badge badge-sage">Connected</span>
            <span className="gr-num" style={{ fontSize: 12 }}>{product.shopifyProductId}</span>
            {product.shopifySyncedAt && (
              <span style={{ ...hintStyle, margin: 0 }}>
                Last Shopify sync: {new Date(product.shopifySyncedAt).toLocaleString()}
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
