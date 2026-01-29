"use client";

import React, { useState } from "react";

export interface LayoutSettings {
  display?: "block" | "flex" | "grid" | "inline" | "inline-flex" | "inline-block" | "none";
  // Flex properties
  flexDirection?: "row" | "column" | "row-reverse" | "column-reverse";
  flexWrap?: "nowrap" | "wrap" | "wrap-reverse";
  justifyContent?: "flex-start" | "center" | "flex-end" | "space-between" | "space-around" | "space-evenly";
  alignItems?: "flex-start" | "center" | "flex-end" | "stretch" | "baseline";
  alignContent?: "flex-start" | "center" | "flex-end" | "stretch" | "space-between" | "space-around";
  gap?: string;
  rowGap?: string;
  columnGap?: string;
  // Grid properties
  gridTemplateColumns?: string;
  gridTemplateRows?: string;
  // Item properties (for children)
  flexGrow?: number;
  flexShrink?: number;
  flexBasis?: string;
  alignSelf?: "auto" | "flex-start" | "center" | "flex-end" | "stretch" | "baseline";
}

export const defaultLayoutSettings: LayoutSettings = {
  display: "block",
  flexDirection: "row",
  flexWrap: "nowrap",
  justifyContent: "flex-start",
  alignItems: "stretch",
  gap: "0px",
};

interface LayoutFieldProps {
  value: LayoutSettings;
  onChange: (value: LayoutSettings) => void;
  mode?: "container" | "item" | "both";
}

const gapPresets = ["0px", "8px", "16px", "24px", "32px", "48px"];

export function LayoutField({
  value,
  onChange,
  mode = "container"
}: LayoutFieldProps) {
  const settings = { ...defaultLayoutSettings, ...value };
  const [showAdvanced, setShowAdvanced] = useState(false);

  const updateSettings = (updates: Partial<LayoutSettings>) => {
    onChange({ ...settings, ...updates });
  };

  const isFlexOrGrid = settings.display === "flex" || settings.display === "inline-flex" || settings.display === "grid";
  const isGrid = settings.display === "grid";
  const isFlex = settings.display === "flex" || settings.display === "inline-flex";

  return (
    <div className="layout-field">
      {/* Display Type */}
      {(mode === "container" || mode === "both") && (
        <>
          <div className="field-row">
            <label className="field-label">Display</label>
            <div className="display-buttons">
              {(["block", "flex", "grid", "none"] as const).map((display) => (
                <button
                  key={display}
                  className={`display-btn ${settings.display === display ? "active" : ""}`}
                  onClick={() => updateSettings({ display })}
                >
                  {display === "block" && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                    </svg>
                  )}
                  {display === "flex" && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="5" height="18" rx="1" />
                      <rect x="10" y="3" width="5" height="18" rx="1" />
                      <rect x="17" y="3" width="4" height="18" rx="1" />
                    </svg>
                  )}
                  {display === "grid" && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="7" height="7" rx="1" />
                      <rect x="14" y="3" width="7" height="7" rx="1" />
                      <rect x="3" y="14" width="7" height="7" rx="1" />
                      <rect x="14" y="14" width="7" height="7" rx="1" />
                    </svg>
                  )}
                  {display === "none" && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
            <span className="display-label">{settings.display}</span>
          </div>

          {/* Flex Direction */}
          {isFlex && (
            <div className="field-row">
              <label className="field-label">Direction</label>
              <div className="direction-buttons">
                {(["row", "column", "row-reverse", "column-reverse"] as const).map((dir) => (
                  <button
                    key={dir}
                    className={`direction-btn ${settings.flexDirection === dir ? "active" : ""}`}
                    onClick={() => updateSettings({ flexDirection: dir })}
                    title={dir}
                  >
                    {dir === "row" && "→"}
                    {dir === "column" && "↓"}
                    {dir === "row-reverse" && "←"}
                    {dir === "column-reverse" && "↑"}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Justify Content */}
          {isFlexOrGrid && (
            <div className="field-row">
              <label className="field-label">Justify</label>
              <div className="justify-buttons">
                {(["flex-start", "center", "flex-end", "space-between", "space-around", "space-evenly"] as const).map((justify) => (
                  <button
                    key={justify}
                    className={`justify-btn ${settings.justifyContent === justify ? "active" : ""}`}
                    onClick={() => updateSettings({ justifyContent: justify })}
                    title={justify}
                  >
                    {justify === "flex-start" && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <rect x="2" y="8" width="4" height="8" /><rect x="8" y="8" width="4" height="8" /><rect x="14" y="8" width="4" height="8" />
                      </svg>
                    )}
                    {justify === "center" && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <rect x="4" y="8" width="4" height="8" /><rect x="10" y="8" width="4" height="8" /><rect x="16" y="8" width="4" height="8" />
                      </svg>
                    )}
                    {justify === "flex-end" && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <rect x="6" y="8" width="4" height="8" /><rect x="12" y="8" width="4" height="8" /><rect x="18" y="8" width="4" height="8" />
                      </svg>
                    )}
                    {justify === "space-between" && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <rect x="2" y="8" width="4" height="8" /><rect x="10" y="8" width="4" height="8" /><rect x="18" y="8" width="4" height="8" />
                      </svg>
                    )}
                    {justify === "space-around" && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <rect x="3" y="8" width="4" height="8" /><rect x="10" y="8" width="4" height="8" /><rect x="17" y="8" width="4" height="8" />
                      </svg>
                    )}
                    {justify === "space-evenly" && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <rect x="2" y="8" width="3" height="8" /><rect x="10" y="8" width="3" height="8" /><rect x="18" y="8" width="3" height="8" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Align Items */}
          {isFlexOrGrid && (
            <div className="field-row">
              <label className="field-label">Align</label>
              <div className="align-buttons">
                {(["flex-start", "center", "flex-end", "stretch", "baseline"] as const).map((align) => (
                  <button
                    key={align}
                    className={`align-btn ${settings.alignItems === align ? "active" : ""}`}
                    onClick={() => updateSettings({ alignItems: align })}
                    title={align}
                  >
                    {align === "flex-start" && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <rect x="4" y="2" width="4" height="10" /><rect x="10" y="2" width="4" height="6" /><rect x="16" y="2" width="4" height="8" />
                      </svg>
                    )}
                    {align === "center" && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <rect x="4" y="7" width="4" height="10" /><rect x="10" y="9" width="4" height="6" /><rect x="16" y="8" width="4" height="8" />
                      </svg>
                    )}
                    {align === "flex-end" && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <rect x="4" y="12" width="4" height="10" /><rect x="10" y="16" width="4" height="6" /><rect x="16" y="14" width="4" height="8" />
                      </svg>
                    )}
                    {align === "stretch" && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <rect x="4" y="2" width="4" height="20" /><rect x="10" y="2" width="4" height="20" /><rect x="16" y="2" width="4" height="20" />
                      </svg>
                    )}
                    {align === "baseline" && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1">
                        <rect x="4" y="4" width="4" height="10" fill="currentColor" />
                        <rect x="10" y="8" width="4" height="6" fill="currentColor" />
                        <rect x="16" y="6" width="4" height="8" fill="currentColor" />
                        <line x1="2" y1="14" x2="22" y2="14" strokeDasharray="2" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Wrap */}
          {isFlex && (
            <div className="field-row">
              <label className="field-label">Wrap</label>
              <div className="wrap-buttons">
                {(["nowrap", "wrap", "wrap-reverse"] as const).map((wrap) => (
                  <button
                    key={wrap}
                    className={`wrap-btn ${settings.flexWrap === wrap ? "active" : ""}`}
                    onClick={() => updateSettings({ flexWrap: wrap })}
                  >
                    {wrap === "nowrap" && "No Wrap"}
                    {wrap === "wrap" && "Wrap"}
                    {wrap === "wrap-reverse" && "Reverse"}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Gap */}
          {isFlexOrGrid && (
            <div className="field-row">
              <label className="field-label">Gap</label>
              <div className="gap-control">
                <div className="gap-presets">
                  {gapPresets.map((preset) => (
                    <button
                      key={preset}
                      className={`gap-preset ${settings.gap === preset ? "active" : ""}`}
                      onClick={() => updateSettings({ gap: preset })}
                    >
                      {parseInt(preset)}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={settings.gap}
                  onChange={(e) => updateSettings({ gap: e.target.value })}
                  className="gap-input"
                  placeholder="16px"
                />
              </div>
            </div>
          )}

          {/* Grid Template Columns */}
          {isGrid && (
            <div className="field-row">
              <label className="field-label">Grid Columns</label>
              <input
                type="text"
                value={settings.gridTemplateColumns || ""}
                onChange={(e) => updateSettings({ gridTemplateColumns: e.target.value })}
                className="text-input"
                placeholder="repeat(3, 1fr)"
              />
            </div>
          )}
        </>
      )}

      {/* Item properties */}
      {(mode === "item" || mode === "both") && (
        <>
          <button
            className="advanced-toggle"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? "▼" : "▶"} Flex Item
          </button>

          {showAdvanced && (
            <div className="advanced-section">
              <div className="field-row">
                <label className="field-label">Grow / Shrink / Basis</label>
                <div className="flex-item-controls">
                  <input
                    type="number"
                    value={settings.flexGrow ?? 0}
                    onChange={(e) => updateSettings({ flexGrow: Number(e.target.value) })}
                    className="flex-num-input"
                    placeholder="0"
                    title="Flex Grow"
                  />
                  <input
                    type="number"
                    value={settings.flexShrink ?? 1}
                    onChange={(e) => updateSettings({ flexShrink: Number(e.target.value) })}
                    className="flex-num-input"
                    placeholder="1"
                    title="Flex Shrink"
                  />
                  <input
                    type="text"
                    value={settings.flexBasis || "auto"}
                    onChange={(e) => updateSettings({ flexBasis: e.target.value })}
                    className="flex-basis-input"
                    placeholder="auto"
                    title="Flex Basis"
                  />
                </div>
              </div>

              <div className="field-row">
                <label className="field-label">Align Self</label>
                <select
                  value={settings.alignSelf || "auto"}
                  onChange={(e) => updateSettings({ alignSelf: e.target.value as LayoutSettings["alignSelf"] })}
                  className="select-field"
                >
                  <option value="auto">Auto</option>
                  <option value="flex-start">Start</option>
                  <option value="center">Center</option>
                  <option value="flex-end">End</option>
                  <option value="stretch">Stretch</option>
                  <option value="baseline">Baseline</option>
                </select>
              </div>
            </div>
          )}
        </>
      )}

      <style>{`
        .layout-field {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .field-row {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .field-label {
          font-size: 11px;
          font-weight: 500;
          color: #6b7280;
        }

        .display-buttons, .direction-buttons, .justify-buttons, .align-buttons, .wrap-buttons {
          display: flex;
          gap: 4px;
        }

        .display-btn, .direction-btn, .justify-btn, .align-btn, .wrap-btn {
          flex: 1;
          padding: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #e5e7eb;
          background: white;
          color: #6b7280;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .display-btn:hover, .direction-btn:hover, .justify-btn:hover, .align-btn:hover, .wrap-btn:hover {
          background: #f3f4f6;
        }

        .display-btn.active, .direction-btn.active, .justify-btn.active, .align-btn.active, .wrap-btn.active {
          background: #3b82f6;
          border-color: #3b82f6;
          color: white;
        }

        .display-label {
          font-size: 10px;
          color: #9ca3af;
          text-align: center;
        }

        .direction-btn {
          font-size: 16px;
          font-weight: 600;
        }

        .wrap-btn {
          font-size: 11px;
          font-weight: 500;
        }

        .gap-control {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .gap-presets {
          display: flex;
          gap: 4px;
        }

        .gap-preset {
          flex: 1;
          padding: 6px 4px;
          font-size: 11px;
          font-weight: 500;
          border: 1px solid #e5e7eb;
          background: white;
          color: #6b7280;
          border-radius: 4px;
          cursor: pointer;
        }

        .gap-preset.active {
          background: #eff6ff;
          border-color: #3b82f6;
          color: #3b82f6;
        }

        .gap-input, .text-input {
          width: 100%;
          padding: 8px 10px;
          font-size: 12px;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          font-family: monospace;
        }

        .select-field {
          width: 100%;
          padding: 8px 10px;
          font-size: 12px;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          background: white;
          cursor: pointer;
        }

        .advanced-toggle {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 0;
          font-size: 11px;
          font-weight: 500;
          color: #6b7280;
          background: none;
          border: none;
          cursor: pointer;
        }

        .advanced-section {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 12px;
          background: #f9fafb;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
        }

        .flex-item-controls {
          display: flex;
          gap: 8px;
        }

        .flex-num-input {
          width: 50px;
          padding: 6px 8px;
          font-size: 12px;
          border: 1px solid #e5e7eb;
          border-radius: 4px;
          text-align: center;
        }

        .flex-basis-input {
          flex: 1;
          padding: 6px 8px;
          font-size: 12px;
          border: 1px solid #e5e7eb;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
}

// Helper to convert settings to CSS
export function getLayoutStyles(settings?: LayoutSettings): React.CSSProperties {
  if (!settings) return {};

  const styles: React.CSSProperties = {
    display: settings.display,
  };

  if (settings.display === "flex" || settings.display === "inline-flex") {
    styles.flexDirection = settings.flexDirection;
    styles.flexWrap = settings.flexWrap;
    styles.justifyContent = settings.justifyContent;
    styles.alignItems = settings.alignItems;
    styles.gap = settings.gap;
  }

  if (settings.display === "grid") {
    styles.gridTemplateColumns = settings.gridTemplateColumns;
    styles.gridTemplateRows = settings.gridTemplateRows;
    styles.justifyContent = settings.justifyContent;
    styles.alignItems = settings.alignItems;
    styles.gap = settings.gap;
  }

  // Item properties
  if (settings.flexGrow !== undefined) styles.flexGrow = settings.flexGrow;
  if (settings.flexShrink !== undefined) styles.flexShrink = settings.flexShrink;
  if (settings.flexBasis) styles.flexBasis = settings.flexBasis;
  if (settings.alignSelf) styles.alignSelf = settings.alignSelf;

  return styles;
}
