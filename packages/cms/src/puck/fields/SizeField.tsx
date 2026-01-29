"use client";

import React, { useState } from "react";

export interface SizeSettings {
  width?: string;
  height?: string;
  minWidth?: string;
  maxWidth?: string;
  minHeight?: string;
  maxHeight?: string;
  aspectRatio?: string;
  overflow?: "visible" | "hidden" | "scroll" | "auto";
  overflowX?: "visible" | "hidden" | "scroll" | "auto";
  overflowY?: "visible" | "hidden" | "scroll" | "auto";
}

export const defaultSizeSettings: SizeSettings = {
  width: "auto",
  height: "auto",
  overflow: "visible",
};

interface SizeFieldProps {
  value: SizeSettings;
  onChange: (value: SizeSettings) => void;
  showOverflow?: boolean;
}

type SizeMode = "auto" | "fill" | "fixed" | "fit";

const sizePresets = ["auto", "100%", "50%", "fit-content"];
const aspectRatioPresets = ["auto", "1/1", "16/9", "4/3", "3/2", "2/1"];

export function SizeField({
  value,
  onChange,
  showOverflow = true
}: SizeFieldProps) {
  const settings = { ...defaultSizeSettings, ...value };
  const [showConstraints, setShowConstraints] = useState(false);

  const updateSettings = (updates: Partial<SizeSettings>) => {
    onChange({ ...settings, ...updates });
  };

  const getSizeMode = (val?: string): SizeMode => {
    if (!val || val === "auto") return "auto";
    if (val === "100%") return "fill";
    if (val === "fit-content") return "fit";
    return "fixed";
  };

  const widthMode = getSizeMode(settings.width);
  const heightMode = getSizeMode(settings.height);

  const handleModeChange = (dimension: "width" | "height", mode: SizeMode) => {
    let newValue = "auto";
    switch (mode) {
      case "auto": newValue = "auto"; break;
      case "fill": newValue = "100%"; break;
      case "fit": newValue = "fit-content"; break;
      case "fixed": newValue = "200px"; break;
    }
    updateSettings({ [dimension]: newValue });
  };

  return (
    <div className="size-field">
      {/* Width */}
      <div className="dimension-section">
        <label className="field-label">Width</label>
        <div className="dimension-control">
          <div className="mode-buttons">
            {(["auto", "fill", "fit", "fixed"] as SizeMode[]).map((mode) => (
              <button
                key={mode}
                className={`mode-btn ${widthMode === mode ? "active" : ""}`}
                onClick={() => handleModeChange("width", mode)}
                title={mode === "fill" ? "100%" : mode === "fit" ? "fit-content" : mode}
              >
                {mode === "auto" && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                )}
                {mode === "fill" && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 12h16M4 12l4-4M4 12l4 4M20 12l-4-4M20 12l-4 4" />
                  </svg>
                )}
                {mode === "fit" && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="6" y="6" width="12" height="12" rx="2" strokeDasharray="3" />
                  </svg>
                )}
                {mode === "fixed" && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="4" y="10" width="16" height="4" rx="1" />
                  </svg>
                )}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={settings.width}
            onChange={(e) => updateSettings({ width: e.target.value })}
            className="dimension-input"
            placeholder="auto"
          />
        </div>
      </div>

      {/* Height */}
      <div className="dimension-section">
        <label className="field-label">Height</label>
        <div className="dimension-control">
          <div className="mode-buttons">
            {(["auto", "fill", "fit", "fixed"] as SizeMode[]).map((mode) => (
              <button
                key={mode}
                className={`mode-btn ${heightMode === mode ? "active" : ""}`}
                onClick={() => handleModeChange("height", mode)}
                title={mode === "fill" ? "100%" : mode === "fit" ? "fit-content" : mode}
              >
                {mode === "auto" && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                )}
                {mode === "fill" && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 4v16M12 4l-4 4M12 4l4 4M12 20l-4-4M12 20l4-4" />
                  </svg>
                )}
                {mode === "fit" && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="6" y="6" width="12" height="12" rx="2" strokeDasharray="3" />
                  </svg>
                )}
                {mode === "fixed" && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="10" y="4" width="4" height="16" rx="1" />
                  </svg>
                )}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={settings.height}
            onChange={(e) => updateSettings({ height: e.target.value })}
            className="dimension-input"
            placeholder="auto"
          />
        </div>
      </div>

      {/* Aspect Ratio */}
      <div className="dimension-section">
        <label className="field-label">Aspect Ratio</label>
        <div className="aspect-control">
          <div className="aspect-presets">
            {aspectRatioPresets.map((ratio) => (
              <button
                key={ratio}
                className={`aspect-btn ${settings.aspectRatio === ratio ? "active" : ""}`}
                onClick={() => updateSettings({ aspectRatio: ratio === "auto" ? undefined : ratio })}
              >
                {ratio}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Constraints Toggle */}
      <button
        className="constraints-toggle"
        onClick={() => setShowConstraints(!showConstraints)}
      >
        {showConstraints ? "▼" : "▶"} Min / Max Constraints
      </button>

      {showConstraints && (
        <div className="constraints-section">
          <div className="constraint-row">
            <div className="constraint-field">
              <label className="mini-label">Min W</label>
              <input
                type="text"
                value={settings.minWidth || ""}
                onChange={(e) => updateSettings({ minWidth: e.target.value || undefined })}
                className="constraint-input"
                placeholder="none"
              />
            </div>
            <div className="constraint-field">
              <label className="mini-label">Max W</label>
              <input
                type="text"
                value={settings.maxWidth || ""}
                onChange={(e) => updateSettings({ maxWidth: e.target.value || undefined })}
                className="constraint-input"
                placeholder="none"
              />
            </div>
          </div>
          <div className="constraint-row">
            <div className="constraint-field">
              <label className="mini-label">Min H</label>
              <input
                type="text"
                value={settings.minHeight || ""}
                onChange={(e) => updateSettings({ minHeight: e.target.value || undefined })}
                className="constraint-input"
                placeholder="none"
              />
            </div>
            <div className="constraint-field">
              <label className="mini-label">Max H</label>
              <input
                type="text"
                value={settings.maxHeight || ""}
                onChange={(e) => updateSettings({ maxHeight: e.target.value || undefined })}
                className="constraint-input"
                placeholder="none"
              />
            </div>
          </div>
        </div>
      )}

      {/* Overflow */}
      {showOverflow && (
        <div className="dimension-section">
          <label className="field-label">Overflow</label>
          <div className="overflow-buttons">
            {(["visible", "hidden", "scroll", "auto"] as const).map((overflow) => (
              <button
                key={overflow}
                className={`overflow-btn ${settings.overflow === overflow ? "active" : ""}`}
                onClick={() => updateSettings({ overflow })}
              >
                {overflow === "visible" && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M12 7v10M7 12h10" strokeDasharray="2" />
                  </svg>
                )}
                {overflow === "hidden" && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <rect x="3" y="3" width="18" height="18" rx="2" fill="currentColor" fillOpacity="0.1" />
                  </svg>
                )}
                {overflow === "scroll" && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M19 8v8" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                )}
                {overflow === "auto" && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <text x="12" y="15" fontSize="8" textAnchor="middle" fill="currentColor">A</text>
                  </svg>
                )}
              </button>
            ))}
          </div>
          <span className="overflow-label">{settings.overflow}</span>
        </div>
      )}

      <style>{`
        .size-field {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .dimension-section {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .field-label {
          font-size: 11px;
          font-weight: 500;
          color: #6b7280;
        }

        .dimension-control {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .mode-buttons {
          display: flex;
          gap: 2px;
        }

        .mode-btn {
          padding: 6px 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #e5e7eb;
          background: white;
          color: #6b7280;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .mode-btn:first-child {
          border-radius: 6px 0 0 6px;
        }

        .mode-btn:last-child {
          border-radius: 0 6px 6px 0;
        }

        .mode-btn:hover {
          background: #f3f4f6;
        }

        .mode-btn.active {
          background: #3b82f6;
          border-color: #3b82f6;
          color: white;
        }

        .dimension-input {
          flex: 1;
          padding: 6px 10px;
          font-size: 12px;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          font-family: monospace;
        }

        .aspect-control {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .aspect-presets {
          display: flex;
          gap: 4px;
          flex-wrap: wrap;
        }

        .aspect-btn {
          padding: 6px 10px;
          font-size: 11px;
          font-weight: 500;
          border: 1px solid #e5e7eb;
          background: white;
          color: #6b7280;
          border-radius: 4px;
          cursor: pointer;
        }

        .aspect-btn:hover {
          background: #f3f4f6;
        }

        .aspect-btn.active {
          background: #eff6ff;
          border-color: #3b82f6;
          color: #3b82f6;
        }

        .constraints-toggle {
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

        .constraints-section {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 12px;
          background: #f9fafb;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
        }

        .constraint-row {
          display: flex;
          gap: 12px;
        }

        .constraint-field {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .mini-label {
          font-size: 10px;
          font-weight: 500;
          color: #9ca3af;
        }

        .constraint-input {
          width: 100%;
          padding: 6px 8px;
          font-size: 11px;
          border: 1px solid #e5e7eb;
          border-radius: 4px;
          font-family: monospace;
        }

        .overflow-buttons {
          display: flex;
          gap: 4px;
        }

        .overflow-btn {
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
        }

        .overflow-btn:hover {
          background: #f3f4f6;
        }

        .overflow-btn.active {
          background: #3b82f6;
          border-color: #3b82f6;
          color: white;
        }

        .overflow-label {
          font-size: 10px;
          color: #9ca3af;
          text-align: center;
        }
      `}</style>
    </div>
  );
}

// Helper to convert settings to CSS
export function getSizeStyles(settings?: SizeSettings): React.CSSProperties {
  if (!settings) return {};

  return {
    width: settings.width,
    height: settings.height,
    minWidth: settings.minWidth,
    maxWidth: settings.maxWidth,
    minHeight: settings.minHeight,
    maxHeight: settings.maxHeight,
    aspectRatio: settings.aspectRatio,
    overflow: settings.overflow,
    overflowX: settings.overflowX,
    overflowY: settings.overflowY,
  };
}
