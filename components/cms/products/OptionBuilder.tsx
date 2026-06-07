"use client";
/**
 * OptionBuilder — create product options + generate the variant matrix.
 * Shown on the Variants tab when a VARIABLE product has no options yet.
 */

import React, { useState } from "react";
import { Sec } from "./atlas-product-ui";

interface OptionDraft {
  name: string;
  values: string; // comma-separated
}

interface OptionBuilderProps {
  readonly onGenerate: (specs: ReadonlyArray<{ name: string; values: ReadonlyArray<string> }>) => void;
  readonly busy?: boolean;
}

const inputStyle: React.CSSProperties = {
  background: "var(--paper-2)",
  border: "1px solid var(--rule)",
  borderRadius: "var(--r-sm)",
  padding: "6px 9px",
  fontFamily: "var(--font-geist), sans-serif",
  fontSize: 13,
  color: "var(--ink)",
  width: "100%",
  boxSizing: "border-box",
};

export function OptionBuilder({ onGenerate, busy = false }: OptionBuilderProps) {
  const [options, setOptions] = useState<OptionDraft[]>([{ name: "", values: "" }]);

  const setOption = (i: number, patch: Partial<OptionDraft>) =>
    setOptions((prev) => prev.map((o, idx) => (idx === i ? { ...o, ...patch } : o)));
  const addOption = () => setOptions((prev) => (prev.length >= 3 ? prev : [...prev, { name: "", values: "" }]));
  const removeOption = (i: number) => setOptions((prev) => prev.filter((_, idx) => idx !== i));

  const specs = options
    .map((o) => ({ name: o.name.trim(), values: o.values.split(",").map((v) => v.trim()).filter(Boolean) }))
    .filter((o) => o.name && o.values.length);
  const comboCount = specs.reduce((n, o) => n * o.values.length, specs.length ? 1 : 0);

  return (
    <div className="prod-editor-shell" style={{ paddingTop: 8, maxWidth: 720 }}>
      <Sec h="Set up variants" meta="add options like Size or Color, then generate the combinations" />

      <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "10px 0" }}>
        {options.map((opt, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "160px 1fr 28px", gap: 10, alignItems: "end" }}>
            <div>
              <div className="lbl-mono" style={{ marginBottom: 3 }}>Option name</div>
              <input
                style={inputStyle}
                placeholder="Size"
                value={opt.name}
                onChange={(e) => setOption(i, { name: e.target.value })}
              />
            </div>
            <div>
              <div className="lbl-mono" style={{ marginBottom: 3 }}>Values (comma-separated)</div>
              <input
                style={inputStyle}
                placeholder="S, M, L, XL"
                value={opt.values}
                onChange={(e) => setOption(i, { values: e.target.value })}
              />
            </div>
            <button
              className="btn btn-ghost btn-sm"
              style={{ height: 32 }}
              onClick={() => removeOption(i)}
              disabled={options.length === 1}
              title="Remove option"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 6 }}>
        <button className="btn btn-ghost btn-sm" onClick={addOption} disabled={options.length >= 3}>
          + add option
        </button>
        <span className="fig" style={{ fontSize: 12, fontStyle: "italic", color: "var(--ink-soft)" }}>
          {comboCount > 0 ? `${comboCount} variant${comboCount > 1 ? "s" : ""} will be generated` : "enter an option and values"}
        </span>
        <button
          className="btn btn-accent"
          style={{ marginLeft: "auto" }}
          onClick={() => onGenerate(specs)}
          disabled={busy || comboCount === 0}
        >
          {busy ? "Generating…" : `Generate ${comboCount || ""} variants`}
        </button>
      </div>
    </div>
  );
}
