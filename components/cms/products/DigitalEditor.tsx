"use client";
/**
 * DigitalEditor — Atlas Product Editor Frame F8
 * DIGITAL type editor: Files + Licenses + Delivery.
 */

import React, { useState, useCallback } from "react";
import { Sec, SaveBar } from "./atlas-product-ui";
import type { AtlasDigitalAsset, AtlasLicenseKey, LicenseKeyStatusKind } from "./atlas-types";

// ── Types ─────────────────────────────────────────────────────────────────
interface DeliverySettings {
  readonly deliverOn: "payment" | "manual";
  readonly method: string;
  readonly maxDownloads: number;
  readonly linkExpiry: number; // days
  readonly useLicenseKeys: boolean;
  readonly maxActivations: number | null;
}

interface DigitalEditorProps {
  readonly asset: AtlasDigitalAsset | null;
  readonly delivery: DeliverySettings;
  readonly onUploadNew?: () => void;
  readonly onPreview?: () => void;
  readonly onGenerateKeys?: (count: number) => void;
  readonly onRevokeKey?: (keyId: string) => void;
  readonly onDeliveryChange?: (settings: Partial<DeliverySettings>) => void;
  readonly savedAt?: string;
  readonly isDirty?: boolean;
}

// ── Key status label + class ───────────────────────────────────────────────
const KEY_STATUS_INFO: Record<LicenseKeyStatusKind, { label: string; cls: string }> = {
  AVAILABLE: { label: "Available", cls: "av" },
  ASSIGNED:  { label: "Assigned",  cls: "as" },
  ACTIVATED: { label: "Activated", cls: "ac" },
  REVOKED:   { label: "Revoked",   cls: "rv" },
};

// ── Component ──────────────────────────────────────────────────────────────
export function DigitalEditor({
  asset,
  delivery,
  onUploadNew,
  onPreview,
  onGenerateKeys,
  onRevokeKey,
  onDeliveryChange,
  savedAt,
  isDirty = false,
}: DigitalEditorProps) {
  const [generateCount, setGenerateCount] = useState(100);
  const [selectedKeys, setSelectedKeys] = useState<ReadonlyArray<string>>([]);

  const keys = asset?.licenseKeys ?? [];

  // Pool stats
  const poolStats = {
    AVAILABLE: keys.filter((k) => k.status === "AVAILABLE").length,
    ASSIGNED:  keys.filter((k) => k.status === "ASSIGNED").length,
    ACTIVATED: keys.filter((k) => k.status === "ACTIVATED").length,
    REVOKED:   keys.filter((k) => k.status === "REVOKED").length,
  };

  const toggleKeySelect = useCallback((id: string) => {
    setSelectedKeys((prev) =>
      prev.includes(id) ? prev.filter((k) => k !== id) : [...prev, id]
    );
  }, []);

  const handleSelectAllKeys = useCallback((checked: boolean) => {
    setSelectedKeys(checked ? keys.map((k) => k.id) : []);
  }, [keys]);

  return (
    <div className="prod-editor-shell" style={{ paddingTop: 8 }}>
      <div className="digital-wrap">
        {/* LEFT: file card + versions + license keys */}
        <div className="digital-col left">

          {/* Master file */}
          <Sec h="Master file" meta="the file customers download" />
          {asset ? (
            <div className="file-card">
              <div className="file-icon">
                {asset.mimeType?.includes("pdf") ? "PDF" : asset.mimeType?.includes("zip") ? "ZIP" : "FILE"}
              </div>
              <div className="meta">
                <div className="name">{asset.filename}</div>
                <div className="submeta">
                  {asset.fileSize != null && `${(asset.fileSize / 1024 / 1024).toFixed(1)} MB · `}
                  {asset.version && `v${asset.version} · `}
                  uploaded
                  <br />
                  <span style={{ color: "var(--ink-faint)" }}>sha256 · verified</span>
                </div>
                <div className="actions">
                  <button className="btn btn-sm" onClick={onPreview}>
                    <span className="kbd">P</span>Preview
                  </button>
                  <button className="btn btn-sm" onClick={onUploadNew}>Replace</button>
                  <button className="btn btn-sm">Copy URL</button>
                  <button className="btn btn-sm btn-ghost">Download</button>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ padding: 24, border: "2px dashed var(--rule)", borderRadius: "var(--r-sm)", textAlign: "center" }}>
              <button className="btn btn-solid" onClick={onUploadNew}>Upload file</button>
            </div>
          )}

          {/* Version history */}
          <div style={{ marginTop: 14 }}>
            <div style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--ink-soft)", marginBottom: 4 }}>
              Version history
            </div>
            <div className="version-list">
              <div className="v-item curr">
                <span>{asset?.version ? `v${asset.version}` : "v1.0.0"}</span>
                <span>· current</span>
                <span className="when">today</span>
              </div>
            </div>
          </div>

          {/* License keys */}
          {delivery.useLicenseKeys && (
            <div style={{ marginTop: 18 }}>
              <Sec
                h="License keys"
                meta={`${keys.length} total · pool for serialized delivery`}
                right={
                  <span>
                    <span className="mono" style={{ fontSize: 10 }}>+ generate · ↓ export csv · revoke selected</span>
                  </span>
                }
              />

              {/* Key pool stats */}
              <div className="key-pool">
                {(["AVAILABLE", "ASSIGNED", "ACTIVATED", "REVOKED"] as LicenseKeyStatusKind[]).map((status) => (
                  <div key={status} className={"key-stat " + KEY_STATUS_INFO[status].cls}>
                    <div className="l">
                      <span className="dot" />
                      {KEY_STATUS_INFO[status].label}
                    </div>
                    <div className="v">{poolStats[status]}</div>
                  </div>
                ))}
              </div>

              {/* Generate controls */}
              <div style={{ display: "flex", gap: 8, alignItems: "center", margin: "8px 0" }}>
                <span style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 10, color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: ".08em" }}>Generate</span>
                <input
                  type="number"
                  value={generateCount}
                  min={1}
                  max={1000}
                  onChange={(e) => setGenerateCount(parseInt(e.target.value) || 0)}
                  style={{ width: 60, background: "var(--paper)", border: "1px solid var(--rule)", borderRadius: "var(--r-sm)", padding: "3px 6px", fontSize: 12, fontFamily: "var(--font-geist-mono), monospace" }}
                />
                <span style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 10, color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: ".08em" }}>keys</span>
                <button
                  className="btn btn-accent btn-sm"
                  onClick={() => onGenerateKeys?.(generateCount)}
                >
                  <span className="kbd">G</span>Generate
                </button>
              </div>

              {/* Key table */}
              {keys.length > 0 && (
                <div className="key-grid">
                  <table className="key-list">
                    <thead>
                      <tr>
                        <th style={{ width: 24 }}>
                          <input
                            type="checkbox"
                            checked={selectedKeys.length === keys.length}
                            onChange={(e) => handleSelectAllKeys(e.target.checked)}
                          />
                        </th>
                        <th style={{ width: 170 }}>Key</th>
                        <th style={{ width: 100 }}>Status</th>
                        <th>Assigned to</th>
                        <th style={{ width: 60, textAlign: "right" }}>Activ.</th>
                        <th style={{ width: 110 }}>When</th>
                        <th style={{ width: 28 }} />
                      </tr>
                    </thead>
                    <tbody>
                      {keys.map((k) => (
                        <tr key={k.id}>
                          <td>
                            <input
                              type="checkbox"
                              checked={selectedKeys.includes(k.id)}
                              onChange={() => toggleKeySelect(k.id)}
                            />
                          </td>
                          <td style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 11, fontWeight: 500 }}>{k.key}</td>
                          <td>
                            <span className={"key-status " + KEY_STATUS_INFO[k.status].cls}>
                              {KEY_STATUS_INFO[k.status].label}
                            </span>
                          </td>
                          <td style={{
                            fontFamily: "var(--font-display), Spectral, serif",
                            fontStyle: k.assignedTo ? "normal" : "italic",
                            color: k.assignedTo ? "var(--ink)" : "var(--ink-faint)",
                          }}>
                            {k.assignedTo ?? "—"}
                          </td>
                          <td style={{ textAlign: "right", color: "var(--ink-soft)", fontFamily: "var(--font-geist-mono), monospace", fontSize: 11 }}>
                            {k.activationCount}/{k.maxActivations ?? "∞"}
                          </td>
                          <td style={{ color: "var(--ink-soft)", fontSize: 11 }}>
                            {k.assignedAt ? new Date(k.assignedAt).toLocaleDateString() : "—"}
                          </td>
                          <td>
                            <span
                              style={{ color: "var(--ink-faint)", cursor: "pointer", textAlign: "center" }}
                              onClick={() => onRevokeKey?.(k.id)}
                            >
                              ⋯
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div style={{ padding: "8px 12px", background: "var(--paper-3)", borderTop: "1px solid var(--rule)", display: "flex", justifyContent: "space-between", fontFamily: "var(--font-geist-mono), monospace", fontSize: 10, color: "var(--ink-soft)", letterSpacing: ".04em" }}>
                    <span>showing {keys.length} keys</span>
                    <span>‹ 1 ›</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT: delivery rules */}
        <div className="digital-col right">
          <Sec h="Delivery" meta="post-purchase rules" />

          <div className="field">
            <span className="lbl">deliver</span>
            <span className="val">
              <select
                value={delivery.deliverOn}
                onChange={(e) => onDeliveryChange?.({ deliverOn: e.target.value as "payment" | "manual" })}
                style={{ background: "transparent", border: "none", fontSize: 13, color: "var(--ink)", cursor: "pointer" }}
              >
                <option value="payment">Automatic — on payment</option>
                <option value="manual">Manual — approve each</option>
              </select>
            </span>
          </div>
          <div className="field">
            <span className="lbl">method</span>
            <span className="val">Email + customer portal</span>
          </div>
          <div className="field">
            <span className="lbl">max d/loads</span>
            <span className="val mono">{delivery.maxDownloads} per buyer</span>
          </div>
          <div className="field">
            <span className="lbl">link expires</span>
            <span className="val mono">{delivery.linkExpiry} days from purchase</span>
          </div>
          <div className="field">
            <span className="lbl">use keys</span>
            <span className="val">
              <span className={delivery.useLicenseKeys ? "pill pill-solid-accent" : "pill pill-out"}>
                {delivery.useLicenseKeys ? "YES" : "NO"}
              </span>
              {delivery.useLicenseKeys && " 1 per order"}
            </span>
          </div>
          {delivery.useLicenseKeys && (
            <div className="field">
              <span className="lbl">max activ.</span>
              <span className="val fig" style={{ fontStyle: "italic" }}>
                {delivery.maxActivations ?? "unlimited"} per key
              </span>
            </div>
          )}

          <div style={{ marginTop: 18 }}>
            <Sec h="Toggle keys" />
            <label style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", cursor: "pointer", fontSize: 13 }}>
              <input
                type="checkbox"
                checked={delivery.useLicenseKeys}
                onChange={(e) => onDeliveryChange?.({ useLicenseKeys: e.target.checked })}
              />
              Use license key pool
            </label>
          </div>

          <div style={{ marginTop: 14, padding: 10, background: "var(--paper-2)", border: "1px solid var(--rule)", borderRadius: "var(--r-sm)", fontFamily: "var(--font-display), Spectral, serif", fontStyle: "italic", fontSize: 12, color: "var(--ink-soft)", lineHeight: 1.4 }}>
            Tip: when key pool drops below{" "}
            <span style={{ fontStyle: "normal", fontFamily: "var(--font-geist-mono), monospace", fontSize: 11 }}>20</span>
            , you&rsquo;ll get a notification to refill.
          </div>

          {/* Pool health indicator */}
          {delivery.useLicenseKeys && keys.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--ink-soft)", marginBottom: 4 }}>
                Pool health
              </div>
              <div style={{ height: 6, background: "var(--rule-soft)", borderRadius: 3, overflow: "hidden" }}>
                <div style={{
                  width: `${(poolStats.AVAILABLE / keys.length) * 100}%`,
                  height: "100%",
                  background: poolStats.AVAILABLE < 20 ? "var(--accent)" : "var(--moss)",
                }} />
              </div>
              <div style={{ fontSize: 11, color: "var(--ink-faint)", marginTop: 3, fontFamily: "var(--font-geist-mono), monospace" }}>
                {poolStats.AVAILABLE} available / {keys.length} total
              </div>
            </div>
          )}
        </div>
      </div>

      <SaveBar
        savedAt={savedAt ?? `autosaved · ${delivery.useLicenseKeys ? `pool: ${keys.filter((k) => k.status === "AVAILABLE").length} available` : "no keys"}`}
        isDirty={isDirty}
        hints={[["G", "generate keys"], ["U", "upload"], ["E", "export csv"]]}
      />
    </div>
  );
}
