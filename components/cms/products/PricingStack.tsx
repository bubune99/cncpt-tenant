"use client";
/**
 * PricingStack — Atlas Product Editor Frame F9
 * Five pricing layers: base, tier, member, sale schedule (calendar), discount codes.
 */

import React, { useState, useCallback } from "react";
import { Sec, SaveBar, TogglePill } from "./atlas-product-ui";
import type {
  AtlasPricingTier,
  AtlasMemberPricing,
  AtlasSaleSchedule,
  AtlasDiscountCode,
} from "./atlas-types";

// ── Props ──────────────────────────────────────────────────────────────────
interface BasePriceEntry {
  readonly label: string;
  readonly price: number; // cents
  readonly cost: number;  // cents
}

interface PricingStackProps {
  readonly basePrices: ReadonlyArray<BasePriceEntry>;
  readonly tierPricing: ReadonlyArray<AtlasPricingTier>;
  readonly tierEnabled: boolean;
  readonly memberPricing: ReadonlyArray<AtlasMemberPricing>;
  readonly saleSchedule: AtlasSaleSchedule | null;
  readonly discountCodes: ReadonlyArray<AtlasDiscountCode>;
  readonly currency?: string;
  readonly onAddTier?: () => void;
  readonly onToggleTierEnabled?: (enabled: boolean) => void;
  readonly onToggleMemberPricing?: (id: string, enabled: boolean) => void;
  readonly onLinkCode?: () => void;
  readonly savedAt?: string;
  readonly isDirty?: boolean;
}

// ── Helpers ────────────────────────────────────────────────────────────────
function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function marginPct(price: number, cost: number): number {
  if (price === 0) return 0;
  return Math.round(((price - cost) / price) * 100);
}

// ── Calendar days for sale schedule ───────────────────────────────────────
function getSaleCalendarDays(schedule: AtlasSaleSchedule, todayStr: string): ReadonlyArray<{ day: number; type: "past" | "sale" | "today-sale" | "normal" }> {
  const start = new Date(schedule.startDate);
  const end = new Date(schedule.endDate);
  const today = new Date(todayStr);
  // Show 14 days around the sale
  const days: { day: number; type: "past" | "sale" | "today-sale" | "normal" }[] = [];
  const anchor = new Date(start);
  anchor.setDate(anchor.getDate() - 3);
  for (let i = 0; i < 17; i++) {
    const d = new Date(anchor);
    d.setDate(anchor.getDate() + i);
    const dayNum = d.getDate();
    const isPast = d < start;
    const isSale = d >= start && d <= end;
    const isToday = d.toDateString() === today.toDateString();
    days.push({
      day: dayNum,
      type: isPast ? "past" : (isToday && isSale) ? "today-sale" : isSale ? "sale" : "normal",
    });
  }
  return days;
}

// ── Component ──────────────────────────────────────────────────────────────
export function PricingStack({
  basePrices,
  tierPricing,
  tierEnabled,
  memberPricing,
  saleSchedule,
  discountCodes,
  currency = "USD",
  onAddTier,
  onToggleTierEnabled,
  onToggleMemberPricing,
  onLinkCode,
  savedAt,
  isDirty = false,
}: PricingStackProps) {
  const todayStr = new Date().toISOString().split("T")[0];
  const calDays = saleSchedule ? getSaleCalendarDays(saleSchedule, todayStr) : [];

  const isSaleActive = saleSchedule
    ? saleSchedule.active && new Date(saleSchedule.startDate) <= new Date() && new Date() <= new Date(saleSchedule.endDate)
    : false;

  const daysRemain = saleSchedule
    ? Math.max(0, Math.ceil((new Date(saleSchedule.endDate).getTime() - Date.now()) / 86400000))
    : 0;

  // Sale month label
  const saleMonthLabel = saleSchedule
    ? new Date(saleSchedule.startDate).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "";

  return (
    <div className="prod-editor-shell" style={{ paddingTop: 8 }}>
      <div className="pricing-cols">
        {/* LEFT: base + tier + member */}
        <div className="pricing-col">

          {/* Base price */}
          <div>
            <Sec h="Base price" meta={`per variant · ${currency}`} right="margins calc'd from cost" />
            <table className="tier-table">
              <thead>
                <tr>
                  <th>Variant scope</th>
                  <th className="num">Price</th>
                  <th className="num">Cost</th>
                  <th className="num">Margin</th>
                </tr>
              </thead>
              <tbody>
                {basePrices.map((bp, i) => (
                  <tr key={i}>
                    <td>{bp.label}</td>
                    <td className="num price-big">{formatCents(bp.price)}</td>
                    <td className="num fig" style={{ fontStyle: "italic" }}>{formatCents(bp.cost)}</td>
                    <td className="num">
                      <span className="accent">
                        {formatCents(bp.price - bp.cost)} · {marginPct(bp.price, bp.cost)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ marginTop: 6, fontSize: 11, color: "var(--ink-soft)", fontFamily: "var(--font-display), Spectral, serif", fontStyle: "italic" }}>
              Override per-variant in the Variants grid — these are the defaults.
            </div>
          </div>

          {/* Tier pricing */}
          <div style={{ marginTop: 14 }}>
            <Sec
              h="Tier pricing"
              meta="wholesale & quantity breaks"
              right={
                <TogglePill
                  on={tierEnabled}
                  onLabel="enabled"
                  offLabel="disabled"
                  onChange={onToggleTierEnabled}
                />
              }
            />
            {tierEnabled && (
              <table className="tier-table">
                <thead>
                  <tr>
                    <th>Qty range</th>
                    <th className="num">Per-unit</th>
                    <th className="num">Save</th>
                    <th>Requires</th>
                  </tr>
                </thead>
                <tbody>
                  {tierPricing.map((tier) => {
                    const base = basePrices[0]?.price ?? 0;
                    const save = base - tier.price;
                    return (
                      <tr key={tier.id}>
                        <td>
                          <span className="mono">
                            {tier.minQty} – {tier.maxQty ?? "+"}
                          </span>
                        </td>
                        <td className="num price-big">{formatCents(tier.price)}</td>
                        <td className="num save">
                          {save > 0 ? `−${formatCents(save)} / ${Math.round((save / base) * 100)}%` : "—"}
                        </td>
                        <td>
                          {tier.requiresTag
                            ? <span className="pill pill-out-soft">{tier.requiresTag}</span>
                            : <span className="fig" style={{ fontStyle: "italic", fontSize: 12 }}>all customers</span>}
                        </td>
                      </tr>
                    );
                  })}
                  <tr style={{ background: "var(--paper-2)" }}>
                    <td
                      colSpan={4}
                      style={{ textAlign: "center", color: "var(--accent)", fontSize: 12, padding: "8px 10px", cursor: "pointer" }}
                      onClick={onAddTier}
                    >
                      + add tier
                    </td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>

          {/* Member pricing */}
          <div style={{ marginTop: 14 }}>
            <Sec h="Member pricing" meta="loyalty tiers — overrides tier table" />
            {memberPricing.map((mp) => (
              <div key={mp.id} className="member-row" style={{ opacity: mp.enabled ? 1 : .65 }}>
                <span className={`badge${mp.id.includes("gold") || mp.tierName.toLowerCase().includes("vault") ? " gold" : ""}`}>
                  {mp.tierName.toLowerCase().includes("vault") ? "★" : mp.tierName.toLowerCase().includes("insider") ? "○" : "✕"}
                </span>
                <div>
                  <div className="label">{mp.tierName}</div>
                  <div className="fig" style={{ fontSize: 11 }}>{mp.description}</div>
                </div>
                <span className="mono" style={{ fontSize: 12, textAlign: "right" }}>
                  −{mp.discountPercent}% off base
                </span>
                <TogglePill
                  on={mp.enabled}
                  onChange={(on) => onToggleMemberPricing?.(mp.id, on)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: sale schedule + discount codes */}
        <div className="pricing-col">

          {/* Sale schedule */}
          {saleSchedule && (
            <div className="schedule-card">
              <div className="head">
                <div className="h2">Sale schedule</div>
                {isSaleActive && <span className="pill pill-solid-accent">LIVE NOW</span>}
                {!isSaleActive && saleSchedule.active && <span className="pill pill-solid-gold">SCHEDULED</span>}
              </div>

              <div className="field" style={{ borderBottom: "none", padding: "4px 0" }}>
                <span className="lbl">compare-at</span>
                <span className="val mono" style={{ textDecoration: "line-through", color: "var(--ink-soft)" }}>
                  {basePrices[0] ? formatCents(basePrices[0].price) : "—"}
                </span>
              </div>
              <div className="field" style={{ borderBottom: "none", padding: "4px 0" }}>
                <span className="lbl">sale price</span>
                <span className="val mono accent" style={{ fontSize: 16, fontWeight: 500 }}>
                  {formatCents(saleSchedule.salePrice)}
                </span>
              </div>
              <div className="field" style={{ borderBottom: "none", padding: "4px 0" }}>
                <span className="lbl">window</span>
                <span className="val">
                  {new Date(saleSchedule.startDate).toLocaleDateString("en-US", { day: "numeric", month: "short" })}
                  {" → "}
                  {new Date(saleSchedule.endDate).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
                  {daysRemain > 0 && (
                    <span className="fig" style={{ fontSize: 11 }}> · {daysRemain}d remain</span>
                  )}
                </span>
              </div>

              {/* Calendar strip */}
              <div style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--ink-soft)", marginTop: 10, marginBottom: 4 }}>
                {saleMonthLabel}
              </div>
              <div className="cal-strip">
                {calDays.map(({ day, type }, i) => (
                  <div key={i} className={"cal-cell" + (type === "past" ? " past" : type === "sale" ? " sale" : type === "today-sale" ? " sale today" : "")}>
                    <span className="d">{day}</span>
                    <span>
                      {type === "today-sale" ? "today" : ""}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!saleSchedule && (
            <div style={{ padding: 16, border: "1.5px dashed var(--rule)", borderRadius: "var(--r-sm)", textAlign: "center", marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: "var(--ink-faint)", marginBottom: 8 }}>No sale scheduled</div>
              <button className="btn btn-sm"><span className="kbd">S</span>Schedule a sale</button>
            </div>
          )}

          {/* Discount codes */}
          <div>
            <Sec
              h="Discount codes"
              meta={`${discountCodes.length} code${discountCodes.length !== 1 ? "s" : ""} apply to this product`}
              right={
                <span style={{ cursor: "pointer" }} onClick={onLinkCode}>
                  <span className="mono" style={{ fontSize: 10 }}>+ link existing · + new</span>
                </span>
              }
            />

            <div style={{ border: "1px solid var(--rule)", borderRadius: "var(--r-sm)", background: "var(--paper)" }}>
              {/* Header */}
              <div
                className="promo-row"
                style={{
                  background: "var(--paper-3)", borderBottom: "1px solid var(--ink)", padding: "6px 10px",
                  fontFamily: "var(--font-geist-mono), monospace", fontSize: 9.5,
                  letterSpacing: ".1em", textTransform: "uppercase", color: "var(--ink-soft)",
                }}
              >
                <span />
                <span>Code</span>
                <span style={{ textAlign: "right" }}>Value</span>
                <span style={{ textAlign: "right" }}>Used</span>
                <span />
              </div>

              {discountCodes.map((code) => (
                <div key={code.id} className="promo-row">
                  <span className={"icon" + (code.type === "PERCENTAGE" ? " pct" : " fix")}>
                    {code.type === "PERCENTAGE" ? "%" : "$"}
                  </span>
                  <div>
                    <div className="code">{code.code}</div>
                    <div className="desc">{code.description ?? (code.stackable ? "stackable" : "single use")}</div>
                  </div>
                  <span className="val">
                    {code.type === "PERCENTAGE" ? `−${code.value}%` : `−${formatCents(code.value)}`}
                  </span>
                  <span className="val fig" style={{ fontStyle: "italic" }}>{code.usageCount.toLocaleString()}</span>
                  <span style={{ color: "var(--ink-faint)", cursor: "pointer", textAlign: "center" }}>⋯</span>
                </div>
              ))}

              {discountCodes.length === 0 && (
                <div style={{ padding: "12px 10px", textAlign: "center", fontSize: 12, color: "var(--ink-faint)", fontStyle: "italic", fontFamily: "var(--font-display), Spectral, serif" }}>
                  No discount codes linked
                </div>
              )}
            </div>

            {/* Stacking rules */}
            <div style={{ marginTop: 10, padding: 10, background: "var(--paper-2)", border: "1px solid var(--rule)", borderRadius: "var(--r-sm)", fontSize: 11.5, lineHeight: 1.45 }}>
              <div style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--ink-soft)", marginBottom: 4 }}>
                Stacking rules
              </div>
              <div style={{ fontFamily: "var(--font-display), Spectral, serif", fontStyle: "italic", color: "var(--ink-soft)" }}>
                Sale & member discounts auto-apply. One code per order unless code is marked stackable.
                Tier pricing replaces base — sale still applies to tier.
              </div>
            </div>
          </div>
        </div>
      </div>

      <SaveBar
        savedAt={savedAt ?? `autosaved · ${isSaleActive ? "sale live" : "pricing ready"} · ${discountCodes.length} codes attached`}
        isDirty={isDirty}
        hints={[["S", "schedule sale"], ["C", "+ code"], ["T", "+ tier"]]}
      />
    </div>
  );
}
