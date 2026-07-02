"use client";
/**
 * Type-specific tabs:
 *  - ScheduleTab (SERVICE)      — duration + per-slot capacity
 *  - BillingTab  (SUBSCRIPTION) — interval + count + trial days
 */

import React from "react";
import { Clock, RefreshCw } from "lucide-react";
import type { AtlasProduct } from "../atlas-types";
import { SectionHead, Field, twoCol, threeCol, tabShell, hintStyle } from "./form-primitives";

interface TabProps {
  readonly product: AtlasProduct;
  readonly onChange: (patch: Partial<AtlasProduct>) => void;
}

const numInput = { textAlign: "right" as const };

export function ScheduleTab({ product, onChange }: TabProps): React.ReactElement {
  return (
    <div style={tabShell}>
      <SectionHead icon={Clock} title="Service settings" meta="duration and per-slot capacity" />
      <div style={twoCol}>
        <Field label="Duration (minutes)" hint="Length of a single appointment / session.">
          <input
            type="number" min="1" className="input gr-num" style={numInput}
            value={product.serviceDuration ?? 60}
            onChange={(e) => onChange({ serviceDuration: Number.parseInt(e.target.value, 10) || null })}
          />
        </Field>
        <Field label="Max bookings per slot" hint="Concurrent bookings allowed (1 = exclusive slot).">
          <input
            type="number" min="1" className="input gr-num" style={numInput}
            value={product.serviceCapacity ?? 1}
            onChange={(e) => onChange({ serviceCapacity: Number.parseInt(e.target.value, 10) || null })}
          />
        </Field>
      </div>
      <p style={hintStyle}>
        Bookable availability windows are not yet backed by the data model and will land in a follow-up phase.
        Duration + capacity are persisted today.
      </p>
    </div>
  );
}

const SUBSCRIPTION_INTERVALS = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "year", label: "Year" },
] as const;

export function BillingTab({ product, onChange }: TabProps): React.ReactElement {
  return (
    <div style={tabShell}>
      <SectionHead icon={RefreshCw} title="Billing cycle" meta="recurrence interval, trial" />
      <div style={threeCol}>
        <Field label="Billing interval">
          <select
            className="select"
            value={product.subscriptionInterval ?? "month"}
            onChange={(e) => onChange({ subscriptionInterval: e.target.value })}
          >
            {SUBSCRIPTION_INTERVALS.map((iv) => (
              <option key={iv.value} value={iv.value}>{iv.label}</option>
            ))}
          </select>
        </Field>
        <Field label="Interval count" hint="e.g. 3 with month = quarterly.">
          <input
            type="number" min="1" className="input gr-num" style={numInput}
            value={product.subscriptionIntervalCount ?? 1}
            onChange={(e) => onChange({ subscriptionIntervalCount: Number.parseInt(e.target.value, 10) || 1 })}
          />
        </Field>
        <Field label="Trial days" hint="Free-trial period before first charge.">
          <input
            type="number" min="0" className="input gr-num" style={numInput}
            value={product.trialDays ?? 0}
            onChange={(e) => onChange({ trialDays: Number.parseInt(e.target.value, 10) || 0 })}
          />
        </Field>
      </div>
      <p style={hintStyle}>
        Advanced lifecycle / dunning rules (retry windows, downgrade ladders, cancellation flows) are not yet
        persisted to the schema — they will land in a dedicated follow-up phase.
      </p>
    </div>
  );
}
