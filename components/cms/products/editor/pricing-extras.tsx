"use client";
/**
 * PricingExtras — base / compare-at / cost prices + tax rows.
 * Rendered above the PricingStack organ on the Pricing tab.
 */

import React from "react";
import { DollarSign, Percent } from "lucide-react";
import type { AtlasProduct } from "../atlas-types";
import {
  SectionHead,
  Field,
  Toggle,
  twoCol,
  threeCol,
  tabShell,
  centsToDollars,
  dollarsToCents,
} from "./form-primitives";

interface PricingExtrasProps {
  readonly product: AtlasProduct;
  readonly onChange: (patch: Partial<AtlasProduct>) => void;
}

export function PricingExtras({ product, onChange }: PricingExtrasProps): React.ReactElement {
  return (
    <div style={tabShell}>
      <SectionHead icon={DollarSign} title="Base prices" meta="base, compare-at, cost — storefront currency" />
      <div style={threeCol}>
        <Field label="Base price">
          <input
            type="number"
            step="0.01"
            min="0"
            className="input gr-num"
            style={{ textAlign: "right" }}
            value={centsToDollars(product.basePrice)}
            onChange={(e) => onChange({ basePrice: dollarsToCents(e.target.value) ?? 0 })}
          />
        </Field>
        <Field label="Compare-at price" hint="Shows crossed-out on storefront when set.">
          <input
            type="number"
            step="0.01"
            min="0"
            className="input gr-num"
            style={{ textAlign: "right" }}
            value={centsToDollars(product.compareAtPrice)}
            onChange={(e) => onChange({ compareAtPrice: dollarsToCents(e.target.value) })}
            placeholder="Original price"
          />
        </Field>
        <Field label="Cost price" hint="Used for margin reporting only.">
          <input
            type="number"
            step="0.01"
            min="0"
            className="input gr-num"
            style={{ textAlign: "right" }}
            value={centsToDollars(product.costPrice)}
            onChange={(e) => onChange({ costPrice: dollarsToCents(e.target.value) })}
          />
        </Field>
      </div>

      <SectionHead icon={Percent} title="Tax" meta="charged at checkout when taxable" />
      <div style={twoCol}>
        <Field label="Taxable">
          <Toggle
            on={product.taxable !== false}
            onLabel="taxable"
            offLabel="not taxable"
            onChange={(v) => onChange({ taxable: v })}
          />
        </Field>
        {product.taxable !== false && (
          <Field label="Tax code" hint="Stripe Tax / external tax category code.">
            <input
              className="input"
              value={product.taxCode ?? ""}
              onChange={(e) => onChange({ taxCode: e.target.value || null })}
              placeholder="e.g. txcd_30000000"
            />
          </Field>
        )}
      </div>
    </div>
  );
}
