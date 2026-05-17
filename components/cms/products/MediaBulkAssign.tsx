"use client";
/**
 * MediaBulkAssign — Atlas Product Editor Frame F3
 * Library strip + variant rows × image slots + bulk assign panel.
 */

import React, { useState, useCallback } from "react";
import { Sec, SaveBar } from "./atlas-product-ui";

// ── Types ─────────────────────────────────────────────────────────────────
export interface MediaLibraryItem {
  readonly id: string;
  readonly name: string;
  readonly url: string;
  readonly assignedTo: string | null; // variant label or null
}

export interface MediaVariantRow {
  readonly variantId: string;
  readonly colorGroup: string;
  readonly colorHex: string;
  readonly colorCode: string;
  readonly sizeLabel: string;
  readonly sku: string;
  readonly slots: ReadonlyArray<"cover" | "alt" | "empty" | "missing">;
}

interface CoverageItem {
  readonly slot: string;
  readonly have: number;
  readonly total: number;
  readonly note: string;
}

interface MediaBulkAssignProps {
  readonly library: ReadonlyArray<MediaLibraryItem>;
  readonly variantRows: ReadonlyArray<MediaVariantRow>;
  readonly colorGroups: ReadonlyArray<{ id: string; label: string; hex: string; code: string }>;
  readonly coverage: ReadonlyArray<CoverageItem>;
  readonly onAssign?: (mediaIds: ReadonlyArray<string>, variantIds: ReadonlyArray<string>, slot: string) => void;
  readonly onAutoMatch?: () => void;
  readonly savedAt?: string;
}

// ── Component ─────────────────────────────────────────────────────────────
export function MediaBulkAssign({
  library,
  variantRows,
  colorGroups,
  coverage,
  onAssign,
  onAutoMatch,
  savedAt,
}: MediaBulkAssignProps) {
  const [selectedMedia, setSelectedMedia] = useState<ReadonlyArray<string>>([]);
  const [targetGroups, setTargetGroups] = useState<ReadonlyArray<string>>([]);

  const toggleMedia = useCallback((id: string) => {
    setSelectedMedia((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }, []);

  const toggleTargetGroup = useCallback((id: string) => {
    setTargetGroups((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  }, []);

  // Group rows by color
  const grouped = colorGroups.map((cg) => ({
    ...cg,
    rows: variantRows.filter((r) => r.colorGroup === cg.id),
  }));

  // Alert colors (missing cover)
  const missingCoverGroups = new Set(
    colorGroups
      .filter((cg) => {
        const cov = coverage.find((c) => c.slot === "Cover");
        return cov && cov.have < cov.total;
      })
      .map((cg) => cg.id)
  );

  const handleAssign = useCallback(() => {
    const variantIds = variantRows
      .filter((r) => targetGroups.includes(r.colorGroup))
      .map((r) => r.variantId);
    onAssign?.(selectedMedia, variantIds, "cover");
  }, [selectedMedia, targetGroups, variantRows, onAssign]);

  return (
    <div className="prod-editor-shell" style={{ paddingTop: 8 }}>
      {/* Library strip */}
      <div style={{ paddingBottom: 6 }}>
        <Sec
          h="Library"
          meta={`${library.length} images`}
          right={
            <span>
              <span className="mono" style={{ background: "var(--ink)", color: "var(--paper)", padding: "1px 5px", marginRight: 4 }}>+</span>
              upload · drag from desktop
            </span>
          }
        />
        <div className="library">
          {library.map((item) => (
            <div
              key={item.id}
              className={"lib-tile" + (selectedMedia.includes(item.id) ? " sel" : "")}
              title={item.name}
              onClick={() => toggleMedia(item.id)}
              style={{ cursor: "pointer" }}
            >
              <span className="ck" />
              <span style={{ fontSize: 8.5, textAlign: "center" }}>
                {item.name.split("-").slice(-1)[0]}
              </span>
              <span className={"assn" + (!item.assignedTo ? " none" : "")}>
                {item.assignedTo ?? "— unassigned —"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Body: grid + bulk panel */}
      <div className="media-wrap" style={{ flex: 1, minHeight: 0 }}>
        {/* Left: variant rows × image slots */}
        <div className="media-left">
          <Sec
            h="Assigned to variants"
            meta="rows = variants · cols = image slots · drag from library"
            right={<span className="chip on" style={{ fontSize: 10 }}>group by color</span>}
          />
          <div className="media-grid">
            <table className="mg-table">
              <colgroup>
                <col style={{ width: 170 }} />
                <col style={{ width: 68 }} />
                <col style={{ width: 68 }} />
                <col style={{ width: 68 }} />
                <col style={{ width: 68 }} />
                <col style={{ width: 68 }} />
                <col />
              </colgroup>
              <thead>
                <tr>
                  <th>Variant</th>
                  <th>Cover</th>
                  <th>Alt 1</th>
                  <th>Alt 2</th>
                  <th>Detail</th>
                  <th>Studio</th>
                  <th>+</th>
                </tr>
              </thead>
              <tbody>
                {grouped.map((group) => {
                  const isMissingCover = missingCoverGroups.has(group.id);
                  return (
                    <React.Fragment key={group.id}>
                      {/* Color group header */}
                      <tr style={{ background: isMissingCover ? "var(--accent-soft)" : "var(--paper-2)" }}>
                        <td colSpan={7} style={{ padding: "8px 10px", borderBottom: "1px solid var(--ink)" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <span style={{ width: 16, height: 16, background: group.hex, border: "1px solid var(--rule)", borderRadius: 2, display: "inline-block" }} />
                            <span style={{ fontFamily: "var(--font-display), Spectral, serif", fontSize: 15 }}>{group.label}</span>
                            <span className="fig" style={{ fontSize: 11 }}>{group.rows.length} sizes</span>
                            {isMissingCover && <span className="pill pill-solid-accent">NO COVER</span>}
                            <span style={{ marginLeft: "auto" }}>
                              {isMissingCover ? (
                                <span style={{
                                  display: "inline-flex", alignItems: "center", gap: 6,
                                  border: "2px dashed var(--accent)", borderRadius: 3,
                                  padding: "3px 10px", background: "rgba(139,44,31,.1)",
                                  color: "var(--accent)", fontFamily: "var(--font-geist-mono), monospace",
                                  fontSize: 10, letterSpacing: ".06em", textTransform: "uppercase"
                                }}>
                                  ⇩ drop images here → fills {group.rows.length} variants
                                </span>
                              ) : (
                                <span className="chip" style={{ fontSize: 10, cursor: "pointer" }}>assign to all {group.rows.length}</span>
                              )}
                            </span>
                          </div>
                        </td>
                      </tr>

                      {/* Variant rows */}
                      {group.rows.map((vRow) => (
                        <tr key={vRow.variantId} className={targetGroups.includes(group.id) ? "sel-row" : ""}>
                          <td>
                            <div className="v-cell">
                              <span className="sw" style={{ background: vRow.colorHex }} />
                              <div>
                                <div className="label">{vRow.colorGroup} · {vRow.sizeLabel}</div>
                                <div className="sub">{vRow.sku}</div>
                              </div>
                            </div>
                          </td>
                          {vRow.slots.map((slot, j) => (
                            <td key={j}>
                              {slot === "cover" && <div className="img-slot cover">flat</div>}
                              {slot === "alt" && <div className="img-slot">model</div>}
                              {slot === "empty" && <div className="img-slot empty">+</div>}
                              {slot === "missing" && (
                                j === 0
                                  ? <div className="img-slot drop-target">drop</div>
                                  : <div className="img-slot missing">missing</div>
                              )}
                            </td>
                          ))}
                          <td>
                            <div className="img-slot empty" style={{ borderColor: "transparent" }} />
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: bulk assign control */}
        <div className="media-right">
          <Sec h="Bulk assign" meta={selectedMedia.length > 0 ? `${selectedMedia.length} selected` : "select from library"} />

          {selectedMedia.length > 0 && (
            <>
              <div className="input-row">
                <span className="lbl">Use as</span>
                <span className="val mono">Cover · Alt 1 · Alt 2 <span style={{ marginLeft: 6, color: "var(--ink-soft)" }}>(auto-order)</span></span>
              </div>

              <div style={{ marginTop: 10 }}>
                <span className="lbl-mono" style={{ display: "block", marginBottom: 6 }}>Target variants</span>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {colorGroups.map((cg) => (
                    <label
                      key={cg.id}
                      style={{
                        display: "flex", alignItems: "center", gap: 8, padding: "4px 6px",
                        background: targetGroups.includes(cg.id) ? "var(--accent-soft)" : "transparent",
                        border: `1px solid ${targetGroups.includes(cg.id) ? "var(--accent)" : "transparent"}`,
                        borderRadius: "var(--r-sm)", cursor: "pointer", fontSize: 13,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={targetGroups.includes(cg.id)}
                        onChange={() => toggleTargetGroup(cg.id)}
                      />
                      All{" "}
                      <b style={{ color: targetGroups.includes(cg.id) ? "var(--accent)" : "inherit" }}>{cg.label}</b>
                      <span className="fig" style={{ fontSize: 11 }}>
                        ({variantRows.filter((r) => r.colorGroup === cg.id).length})
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                className="btn btn-accent"
                style={{ marginTop: 14, justifyContent: "center", padding: "10px 14px", width: "100%" }}
                onClick={handleAssign}
                disabled={targetGroups.length === 0}
              >
                Assign {selectedMedia.length} → {variantRows.filter((r) => targetGroups.includes(r.colorGroup)).length} variants
                <span className="kbd">↵</span>
              </button>
            </>
          )}

          {/* Coverage bars */}
          <div style={{ marginTop: 16, padding: "12px 0 0", borderTop: "1px solid var(--rule)" }}>
            <span className="lbl-mono" style={{ display: "block", marginBottom: 8 }}>Coverage</span>
            {coverage.map(({ slot, have, total, note }) => {
              const pct = (have / total) * 100;
              const isShort = slot === "Cover" && have < total;
              return (
                <div key={slot} style={{ marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
                    <span>
                      {slot}{" "}
                      <span className="fig" style={{ fontSize: 11 }}>{note}</span>
                    </span>
                    <span
                      className="mono"
                      style={{ fontSize: 11, color: isShort ? "var(--accent)" : "var(--ink-soft)" }}
                    >
                      {have}/{total}
                    </span>
                  </div>
                  <div style={{ height: 4, background: "var(--rule-soft)", borderRadius: 2, overflow: "hidden" }}>
                    <div style={{
                      width: `${pct}%`, height: "100%",
                      background: isShort ? "var(--accent)" : "var(--moss)",
                    }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Auto-match tip */}
          <div style={{ marginTop: 14, padding: 10, background: "var(--paper-2)", border: "1px solid var(--rule)", borderRadius: "var(--r-sm)", fontFamily: "var(--font-display), Spectral, serif", fontStyle: "italic", fontSize: 12, color: "var(--ink-soft)", lineHeight: 1.4 }}>
            Auto-match by filename detected: <span style={{ fontStyle: "normal", fontFamily: "var(--font-geist-mono), monospace", fontSize: 11 }}>*-{colorGroups[0]?.label.toLowerCase()}-*</span> → variants.{" "}
            <button className="btn btn-sm" style={{ display: "block", marginTop: 6 }} onClick={onAutoMatch}>
              Run auto-match
            </button>
          </div>
        </div>
      </div>

      <SaveBar
        savedAt={selectedMedia.length > 0 ? `${selectedMedia.length} selected · ready to assign` : savedAt}
        hints={[["A", "assign"], ["G", "auto-match"], ["Esc", "clear"]]}
      />
    </div>
  );
}
