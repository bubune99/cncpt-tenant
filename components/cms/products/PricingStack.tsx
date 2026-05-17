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

export interface CreateTierPayload {
  readonly label: string;
  readonly minQty: number;
  readonly maxQty: number | null;
  readonly price: number; // cents
  readonly type: "QTY" | "MEMBER";
}

export interface CreateSchedulePayload {
  readonly salePrice: number; // cents
  readonly startsAt: string; // ISO
  readonly endsAt: string;   // ISO
}

interface PricingStackProps {
  readonly basePrices: ReadonlyArray<BasePriceEntry>;
  readonly tierPricing: ReadonlyArray<AtlasPricingTier>;
  readonly tierEnabled: boolean;
  readonly memberPricing: ReadonlyArray<AtlasMemberPricing>;
  readonly saleSchedule: AtlasSaleSchedule | null;
  readonly discountCodes: ReadonlyArray<AtlasDiscountCode>;
  readonly currency?: string;
  /** True while pricing data is being loaded from the API. */
  readonly pricingLoading?: boolean;
  /** Error message from pricing fetch, if any. */
  readonly pricingError?: string | null;
  readonly onAddTier?: () => void;
  readonly onToggleTierEnabled?: (enabled: boolean) => void;
  readonly onToggleMemberPricing?: (id: string, enabled: boolean) => void;
  readonly onLinkCode?: () => void;
  /** Create a new QTY or MEMBER pricing tier via POST. Resolves to the created tier id. */
  readonly onCreateTier?: (payload: CreateTierPayload) => Promise<void>;
  /** Delete a tier by id via DELETE. */
  readonly onDeleteTier?: (tierId: string) => Promise<void>;
  /** Create a new sale schedule via POST. */
  readonly onCreateSchedule?: (payload: CreateSchedulePayload) => Promise<void>;
  /** Delete the active sale schedule by id via DELETE. */
  readonly onDeleteSchedule?: (scheduleId: string) => Promise<void>;
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

// ── Inline "add tier" form ─────────────────────────────────────────────────
interface AddTierFormState {
  readonly label: string;
  readonly minQty: string;
  readonly maxQty: string;
  readonly price: string; // dollars, e.g. "12.99"
  readonly type: "QTY" | "MEMBER";
}

const BLANK_TIER_FORM: AddTierFormState = {
  label: "",
  minQty: "",
  maxQty: "",
  price: "",
  type: "QTY",
};

// ── Inline "add schedule" form ─────────────────────────────────────────────
interface AddScheduleFormState {
  readonly salePrice: string; // dollars
  readonly startsAt: string;  // date string yyyy-mm-dd
  readonly endsAt: string;
}

const BLANK_SCHEDULE_FORM: AddScheduleFormState = {
  salePrice: "",
  startsAt: "",
  endsAt: "",
};

// ── Component ──────────────────────────────────────────────────────────────
export function PricingStack({
  basePrices,
  tierPricing,
  tierEnabled,
  memberPricing,
  saleSchedule,
  discountCodes,
  currency = "USD",
  pricingLoading = false,
  pricingError = null,
  onAddTier,
  onToggleTierEnabled,
  onToggleMemberPricing,
  onLinkCode,
  onCreateTier,
  onDeleteTier,
  onCreateSchedule,
  onDeleteSchedule,
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

  const saleMonthLabel = saleSchedule
    ? new Date(saleSchedule.startDate).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "";

  // ── Add-tier form state ────────────────────────────────────────────────────
  const [showTierForm, setShowTierForm] = useState(false);
  const [tierForm, setTierForm] = useState<AddTierFormState>(BLANK_TIER_FORM);
  const [tierFormSaving, setTierFormSaving] = useState(false);
  const [tierFormError, setTierFormError] = useState<string | null>(null);

  // ── Add-schedule form state ────────────────────────────────────────────────
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [scheduleForm, setScheduleForm] = useState<AddScheduleFormState>(BLANK_SCHEDULE_FORM);
  const [scheduleFormSaving, setScheduleFormSaving] = useState(false);
  const [scheduleFormError, setScheduleFormError] = useState<string | null>(null);

  // ── Delete in-flight tracking ──────────────────────────────────────────────
  const [deletingTierId, setDeletingTierId] = useState<string | null>(null);
  const [deletingSchedule, setDeletingSchedule] = useState(false);

  // ── Tier form handlers ─────────────────────────────────────────────────────
  const handleOpenTierForm = useCallback(() => {
    setTierForm(BLANK_TIER_FORM);
    setTierFormError(null);
    setShowTierForm(true);
    onAddTier?.();
  }, [onAddTier]);

  const handleTierFormChange = useCallback(
    <K extends keyof AddTierFormState>(field: K, value: AddTierFormState[K]) => {
      setTierForm((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleTierFormSubmit = useCallback(async () => {
    if (!onCreateTier) return;
    setTierFormError(null);

    const minQtyNum = parseInt(tierForm.minQty, 10);
    const maxQtyNum = tierForm.maxQty.trim() ? parseInt(tierForm.maxQty, 10) : null;
    const priceNum = Math.round(parseFloat(tierForm.price) * 100);

    if (!tierForm.label.trim()) { setTierFormError("Label is required."); return; }
    if (isNaN(minQtyNum) || minQtyNum < 1) { setTierFormError("Min qty must be ≥ 1."); return; }
    if (maxQtyNum !== null && (isNaN(maxQtyNum) || maxQtyNum < minQtyNum)) { setTierFormError("Max qty must be ≥ min qty."); return; }
    if (isNaN(priceNum) || priceNum < 0) { setTierFormError("Enter a valid price."); return; }

    setTierFormSaving(true);
    try {
      await onCreateTier({
        label: tierForm.label.trim(),
        minQty: minQtyNum,
        maxQty: maxQtyNum,
        price: priceNum,
        type: tierForm.type,
      });
      setShowTierForm(false);
      setTierForm(BLANK_TIER_FORM);
    } catch (err) {
      setTierFormError(err instanceof Error ? err.message : "Failed to create tier.");
    } finally {
      setTierFormSaving(false);
    }
  }, [onCreateTier, tierForm]);

  const handleDeleteTier = useCallback(async (tierId: string) => {
    if (!onDeleteTier || deletingTierId) return;
    setDeletingTierId(tierId);
    try {
      await onDeleteTier(tierId);
    } finally {
      setDeletingTierId(null);
    }
  }, [onDeleteTier, deletingTierId]);

  // ── Schedule form handlers ─────────────────────────────────────────────────
  const handleOpenScheduleForm = useCallback(() => {
    setScheduleForm(BLANK_SCHEDULE_FORM);
    setScheduleFormError(null);
    setShowScheduleForm(true);
  }, []);

  const handleScheduleFormChange = useCallback(
    <K extends keyof AddScheduleFormState>(field: K, value: AddScheduleFormState[K]) => {
      setScheduleForm((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleScheduleFormSubmit = useCallback(async () => {
    if (!onCreateSchedule) return;
    setScheduleFormError(null);

    const salePriceNum = Math.round(parseFloat(scheduleForm.salePrice) * 100);
    if (isNaN(salePriceNum) || salePriceNum < 0) { setScheduleFormError("Enter a valid sale price."); return; }
    if (!scheduleForm.startsAt) { setScheduleFormError("Start date is required."); return; }
    if (!scheduleForm.endsAt) { setScheduleFormError("End date is required."); return; }
    if (scheduleForm.endsAt <= scheduleForm.startsAt) { setScheduleFormError("End date must be after start date."); return; }

    setScheduleFormSaving(true);
    try {
      await onCreateSchedule({
        salePrice: salePriceNum,
        startsAt: new Date(scheduleForm.startsAt).toISOString(),
        endsAt: new Date(scheduleForm.endsAt).toISOString(),
      });
      setShowScheduleForm(false);
      setScheduleForm(BLANK_SCHEDULE_FORM);
    } catch (err) {
      setScheduleFormError(err instanceof Error ? err.message : "Failed to create schedule.");
    } finally {
      setScheduleFormSaving(false);
    }
  }, [onCreateSchedule, scheduleForm]);

  const handleDeleteSchedule = useCallback(async () => {
    if (!onDeleteSchedule || !saleSchedule || deletingSchedule) return;
    setDeletingSchedule(true);
    try {
      await onDeleteSchedule(saleSchedule.id);
    } finally {
      setDeletingSchedule(false);
    }
  }, [onDeleteSchedule, saleSchedule, deletingSchedule]);

  // ── Loading / error overlay for pricing data ───────────────────────────────
  if (pricingLoading) {
    return (
      <div className="prod-editor-shell" style={{ paddingTop: 24, textAlign: "center" }}>
        <span className="fig" style={{ fontStyle: "italic", color: "var(--ink-soft)", fontSize: 13 }}>
          Loading pricing data…
        </span>
      </div>
    );
  }

  if (pricingError) {
    return (
      <div className="prod-editor-shell" style={{ paddingTop: 24 }}>
        <div className="sec">
          <span className="h" style={{ color: "var(--accent)" }}>Pricing unavailable</span>
        </div>
        <p style={{ color: "var(--ink-soft)", fontFamily: "var(--font-geist), sans-serif", fontSize: 13 }}>
          {pricingError}
        </p>
      </div>
    );
  }

  // ── Input style helper ─────────────────────────────────────────────────────
  const inputStyle: React.CSSProperties = {
    border: "1px solid var(--rule)",
    borderRadius: 3,
    padding: "3px 6px",
    background: "var(--paper)",
    color: "var(--ink)",
    fontFamily: "var(--font-geist), sans-serif",
    fontSize: 12,
    width: "100%",
  };

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
                    <th>Label</th>
                    {onDeleteTier && <th style={{ width: 32 }} />}
                  </tr>
                </thead>
                <tbody>
                  {tierPricing.length === 0 && !showTierForm && (
                    <tr>
                      <td colSpan={onDeleteTier ? 5 : 4} style={{ textAlign: "center", color: "var(--ink-faint)", fontStyle: "italic", fontSize: 12, padding: "10px 8px", fontFamily: "var(--font-display), Spectral, serif" }}>
                        No quantity break tiers defined
                      </td>
                    </tr>
                  )}
                  {tierPricing.map((tier) => {
                    const base = basePrices[0]?.price ?? 0;
                    const save = base - tier.price;
                    return (
                      <tr key={tier.id} style={{ opacity: deletingTierId === tier.id ? 0.4 : 1, transition: "opacity .15s" }}>
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
                        {onDeleteTier && (
                          <td style={{ textAlign: "center" }}>
                            <span
                              title="Remove tier"
                              style={{ cursor: deletingTierId === tier.id ? "wait" : "pointer", color: "var(--ink-faint)", fontSize: 11 }}
                              onClick={() => { void handleDeleteTier(tier.id); }}
                            >✕</span>
                          </td>
                        )}
                      </tr>
                    );
                  })}

                  {/* Inline add-tier form */}
                  {showTierForm && (
                    <tr style={{ background: "var(--paper-2)" }}>
                      <td style={{ padding: "6px 6px 6px 8px" }}>
                        <input
                          style={{ ...inputStyle, width: 70 }}
                          placeholder="min"
                          value={tierForm.minQty}
                          onChange={(e) => handleTierFormChange("minQty", e.target.value)}
                        />
                        <span style={{ margin: "0 4px", color: "var(--ink-soft)" }}>–</span>
                        <input
                          style={{ ...inputStyle, width: 60 }}
                          placeholder="max"
                          value={tierForm.maxQty}
                          onChange={(e) => handleTierFormChange("maxQty", e.target.value)}
                        />
                      </td>
                      <td style={{ padding: "6px 4px" }}>
                        <input
                          style={{ ...inputStyle, textAlign: "right" }}
                          placeholder="0.00"
                          value={tierForm.price}
                          onChange={(e) => handleTierFormChange("price", e.target.value)}
                        />
                      </td>
                      <td style={{ padding: "6px 4px" }}>
                        <input
                          style={inputStyle}
                          placeholder="label"
                          value={tierForm.label}
                          onChange={(e) => handleTierFormChange("label", e.target.value)}
                        />
                      </td>
                      <td colSpan={onDeleteTier ? 2 : 1} style={{ padding: "6px 8px 6px 4px" }}>
                        <div style={{ display: "flex", gap: 4 }}>
                          <button
                            className="btn btn-accent btn-sm"
                            disabled={tierFormSaving}
                            onClick={() => { void handleTierFormSubmit(); }}
                          >
                            {tierFormSaving ? "…" : "Add"}
                          </button>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => { setShowTierForm(false); setTierFormError(null); }}
                          >
                            Cancel
                          </button>
                        </div>
                        {tierFormError && (
                          <div style={{ fontSize: 11, color: "var(--accent)", marginTop: 4 }}>{tierFormError}</div>
                        )}
                      </td>
                    </tr>
                  )}

                  {!showTierForm && (
                    <tr style={{ background: "var(--paper-2)" }}>
                      <td
                        colSpan={onDeleteTier ? 5 : 4}
                        style={{ textAlign: "center", color: "var(--accent)", fontSize: 12, padding: "8px 10px", cursor: "pointer" }}
                        onClick={handleOpenTierForm}
                      >
                        + add tier
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* Member pricing */}
          <div style={{ marginTop: 14 }}>
            <Sec h="Member pricing" meta="loyalty tiers — overrides tier table" />
            {memberPricing.length === 0 && (
              <div style={{ padding: "10px 0", fontSize: 12, color: "var(--ink-faint)", fontStyle: "italic", fontFamily: "var(--font-display), Spectral, serif" }}>
                No member pricing tiers defined
              </div>
            )}
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
                  {mp.discountPercent > 0 ? `−${mp.discountPercent}% off base` : `${formatCents(mp.memberPrice ?? 0)}`}
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
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  {isSaleActive && <span className="pill pill-solid-accent">LIVE NOW</span>}
                  {!isSaleActive && saleSchedule.active && <span className="pill pill-solid-gold">SCHEDULED</span>}
                  {onDeleteSchedule && (
                    <span
                      title="Remove schedule"
                      style={{ cursor: deletingSchedule ? "wait" : "pointer", color: "var(--ink-faint)", fontSize: 12, marginLeft: 4 }}
                      onClick={() => { void handleDeleteSchedule(); }}
                    >
                      {deletingSchedule ? "…" : "✕"}
                    </span>
                  )}
                </div>
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

          {!saleSchedule && !showScheduleForm && (
            <div style={{ padding: 16, border: "1.5px dashed var(--rule)", borderRadius: "var(--r-sm)", textAlign: "center", marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: "var(--ink-faint)", marginBottom: 8 }}>No sale scheduled</div>
              <button className="btn btn-sm" onClick={handleOpenScheduleForm}>
                <span className="kbd">S</span>Schedule a sale
              </button>
            </div>
          )}

          {/* Inline schedule form */}
          {!saleSchedule && showScheduleForm && (
            <div style={{ padding: 14, border: "1.5px solid var(--rule)", borderRadius: "var(--r-sm)", marginBottom: 14, background: "var(--paper-2)" }}>
              <div style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--ink-soft)", marginBottom: 10 }}>
                Schedule a sale
              </div>
              <div style={{ display: "grid", gap: 8 }}>
                <div>
                  <div style={{ fontSize: 11, color: "var(--ink-soft)", marginBottom: 3 }}>Sale price ($)</div>
                  <input
                    style={inputStyle}
                    placeholder="e.g. 19.99"
                    value={scheduleForm.salePrice}
                    onChange={(e) => handleScheduleFormChange("salePrice", e.target.value)}
                  />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 11, color: "var(--ink-soft)", marginBottom: 3 }}>Starts</div>
                    <input
                      type="date"
                      style={inputStyle}
                      value={scheduleForm.startsAt}
                      onChange={(e) => handleScheduleFormChange("startsAt", e.target.value)}
                    />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: "var(--ink-soft)", marginBottom: 3 }}>Ends</div>
                    <input
                      type="date"
                      style={inputStyle}
                      value={scheduleForm.endsAt}
                      onChange={(e) => handleScheduleFormChange("endsAt", e.target.value)}
                    />
                  </div>
                </div>
                {scheduleFormError && (
                  <div style={{ fontSize: 11, color: "var(--accent)" }}>{scheduleFormError}</div>
                )}
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    className="btn btn-accent btn-sm"
                    disabled={scheduleFormSaving}
                    onClick={() => { void handleScheduleFormSubmit(); }}
                  >
                    {scheduleFormSaving ? "Saving…" : "Create schedule"}
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => { setShowScheduleForm(false); setScheduleFormError(null); }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
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
