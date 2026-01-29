"use client";

import React, { useState } from "react";

export interface TypographySettings {
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: string;
  lineHeight?: string;
  letterSpacing?: string;
  textAlign?: "left" | "center" | "right" | "justify";
  textTransform?: "none" | "uppercase" | "lowercase" | "capitalize";
  textDecoration?: "none" | "underline" | "line-through";
}

export const defaultTypographySettings: TypographySettings = {
  fontFamily: "inherit",
  fontSize: "16px",
  fontWeight: "400",
  lineHeight: "1.5",
  letterSpacing: "0px",
  textAlign: "left",
  textTransform: "none",
  textDecoration: "none",
};

// Common font stacks
const fontFamilies = [
  { label: "System Default", value: "inherit" },
  { label: "Inter", value: "'Inter', sans-serif" },
  { label: "Roboto", value: "'Roboto', sans-serif" },
  { label: "Open Sans", value: "'Open Sans', sans-serif" },
  { label: "Poppins", value: "'Poppins', sans-serif" },
  { label: "Montserrat", value: "'Montserrat', sans-serif" },
  { label: "Lato", value: "'Lato', sans-serif" },
  { label: "Playfair Display", value: "'Playfair Display', serif" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Times New Roman", value: "'Times New Roman', serif" },
  { label: "Courier New", value: "'Courier New', monospace" },
  { label: "Monaco", value: "Monaco, monospace" },
];

const fontSizePresets = ["12px", "14px", "16px", "18px", "20px", "24px", "32px", "40px", "48px", "64px"];
const fontWeights = [
  { label: "Thin", value: "100" },
  { label: "Light", value: "300" },
  { label: "Regular", value: "400" },
  { label: "Medium", value: "500" },
  { label: "Semibold", value: "600" },
  { label: "Bold", value: "700" },
  { label: "Black", value: "900" },
];

const lineHeightPresets = ["1", "1.25", "1.5", "1.75", "2"];
const letterSpacingPresets = ["-0.05em", "-0.025em", "0em", "0.025em", "0.05em", "0.1em"];

interface TypographyFieldProps {
  value: TypographySettings;
  onChange: (value: TypographySettings) => void;
  showFontFamily?: boolean;
}

export function TypographyField({
  value,
  onChange,
  showFontFamily = true
}: TypographyFieldProps) {
  const settings = { ...defaultTypographySettings, ...value };
  const [showAdvanced, setShowAdvanced] = useState(false);

  const updateSettings = (updates: Partial<TypographySettings>) => {
    onChange({ ...settings, ...updates });
  };

  return (
    <div className="typography-field">
      {/* Font Family */}
      {showFontFamily && (
        <div className="field-row">
          <label className="field-label">Font Family</label>
          <select
            value={settings.fontFamily}
            onChange={(e) => updateSettings({ fontFamily: e.target.value })}
            className="select-field"
          >
            {fontFamilies.map((font) => (
              <option key={font.value} value={font.value}>
                {font.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Font Size */}
      <div className="field-row">
        <label className="field-label">Size</label>
        <div className="size-control">
          <div className="preset-pills">
            {fontSizePresets.slice(0, 6).map((size) => (
              <button
                key={size}
                className={`preset-pill ${settings.fontSize === size ? "active" : ""}`}
                onClick={() => updateSettings({ fontSize: size })}
              >
                {parseInt(size)}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={settings.fontSize}
            onChange={(e) => updateSettings({ fontSize: e.target.value })}
            className="value-input"
            placeholder="16px"
          />
        </div>
      </div>

      {/* Font Weight */}
      <div className="field-row">
        <label className="field-label">Weight</label>
        <div className="weight-slider">
          <input
            type="range"
            min="100"
            max="900"
            step="100"
            value={settings.fontWeight}
            onChange={(e) => updateSettings({ fontWeight: e.target.value })}
            className="range-slider"
          />
          <span className="weight-label">
            {fontWeights.find((w) => w.value === settings.fontWeight)?.label || settings.fontWeight}
          </span>
        </div>
      </div>

      {/* Text Align */}
      <div className="field-row">
        <label className="field-label">Alignment</label>
        <div className="align-buttons">
          {(["left", "center", "right", "justify"] as const).map((align) => (
            <button
              key={align}
              className={`align-btn ${settings.textAlign === align ? "active" : ""}`}
              onClick={() => updateSettings({ textAlign: align })}
              title={align.charAt(0).toUpperCase() + align.slice(1)}
            >
              {align === "left" && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="15" y2="12" /><line x1="3" y1="18" x2="18" y2="18" />
                </svg>
              )}
              {align === "center" && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="3" y1="6" x2="21" y2="6" /><line x1="6" y1="12" x2="18" y2="12" /><line x1="4" y1="18" x2="20" y2="18" />
                </svg>
              )}
              {align === "right" && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="3" y1="6" x2="21" y2="6" /><line x1="9" y1="12" x2="21" y2="12" /><line x1="6" y1="18" x2="21" y2="18" />
                </svg>
              )}
              {align === "justify" && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Advanced Toggle */}
      <button
        className="advanced-toggle"
        onClick={() => setShowAdvanced(!showAdvanced)}
      >
        {showAdvanced ? "▼" : "▶"} Advanced
      </button>

      {showAdvanced && (
        <div className="advanced-section">
          {/* Line Height */}
          <div className="field-row">
            <label className="field-label">Line Height</label>
            <div className="inline-control">
              <div className="mini-pills">
                {lineHeightPresets.map((lh) => (
                  <button
                    key={lh}
                    className={`mini-pill ${settings.lineHeight === lh ? "active" : ""}`}
                    onClick={() => updateSettings({ lineHeight: lh })}
                  >
                    {lh}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={settings.lineHeight}
                onChange={(e) => updateSettings({ lineHeight: e.target.value })}
                className="mini-input"
              />
            </div>
          </div>

          {/* Letter Spacing */}
          <div className="field-row">
            <label className="field-label">Letter Spacing</label>
            <div className="inline-control">
              <div className="mini-pills">
                {letterSpacingPresets.slice(0, 4).map((ls) => (
                  <button
                    key={ls}
                    className={`mini-pill ${settings.letterSpacing === ls ? "active" : ""}`}
                    onClick={() => updateSettings({ letterSpacing: ls })}
                  >
                    {ls === "0em" ? "0" : ls}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={settings.letterSpacing}
                onChange={(e) => updateSettings({ letterSpacing: e.target.value })}
                className="mini-input"
              />
            </div>
          </div>

          {/* Text Transform */}
          <div className="field-row">
            <label className="field-label">Transform</label>
            <div className="transform-buttons">
              {(["none", "uppercase", "lowercase", "capitalize"] as const).map((transform) => (
                <button
                  key={transform}
                  className={`transform-btn ${settings.textTransform === transform ? "active" : ""}`}
                  onClick={() => updateSettings({ textTransform: transform })}
                >
                  {transform === "none" && "Aa"}
                  {transform === "uppercase" && "AA"}
                  {transform === "lowercase" && "aa"}
                  {transform === "capitalize" && "Aa"}
                </button>
              ))}
            </div>
          </div>

          {/* Text Decoration */}
          <div className="field-row">
            <label className="field-label">Decoration</label>
            <div className="decoration-buttons">
              {(["none", "underline", "line-through"] as const).map((decoration) => (
                <button
                  key={decoration}
                  className={`decoration-btn ${settings.textDecoration === decoration ? "active" : ""}`}
                  onClick={() => updateSettings({ textDecoration: decoration })}
                >
                  {decoration === "none" && "None"}
                  {decoration === "underline" && <span style={{ textDecoration: "underline" }}>U</span>}
                  {decoration === "line-through" && <span style={{ textDecoration: "line-through" }}>S</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .typography-field {
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

        .select-field {
          width: 100%;
          padding: 8px 10px;
          font-size: 12px;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          background: white;
          cursor: pointer;
        }

        .size-control {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .preset-pills {
          display: flex;
          gap: 4px;
        }

        .preset-pill {
          flex: 1;
          padding: 6px 4px;
          font-size: 11px;
          font-weight: 500;
          border: 1px solid #e5e7eb;
          background: white;
          color: #6b7280;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .preset-pill:hover {
          border-color: #d1d5db;
        }

        .preset-pill.active {
          background: #3b82f6;
          border-color: #3b82f6;
          color: white;
        }

        .value-input {
          width: 100%;
          padding: 8px 10px;
          font-size: 12px;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          font-family: monospace;
        }

        .weight-slider {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .range-slider {
          flex: 1;
          height: 6px;
          border-radius: 3px;
          background: #e5e7eb;
          cursor: pointer;
          -webkit-appearance: none;
        }

        .range-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
        }

        .weight-label {
          font-size: 11px;
          font-weight: 500;
          color: #374151;
          min-width: 60px;
          text-align: right;
        }

        .align-buttons, .transform-buttons, .decoration-buttons {
          display: flex;
          gap: 4px;
        }

        .align-btn, .transform-btn, .decoration-btn {
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

        .align-btn:hover, .transform-btn:hover, .decoration-btn:hover {
          background: #f3f4f6;
        }

        .align-btn.active, .transform-btn.active, .decoration-btn.active {
          background: #3b82f6;
          border-color: #3b82f6;
          color: white;
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

        .advanced-toggle:hover {
          color: #374151;
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

        .inline-control {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .mini-pills {
          display: flex;
          gap: 2px;
        }

        .mini-pill {
          padding: 4px 6px;
          font-size: 10px;
          font-weight: 500;
          border: 1px solid #e5e7eb;
          background: white;
          color: #6b7280;
          border-radius: 3px;
          cursor: pointer;
        }

        .mini-pill.active {
          background: #eff6ff;
          border-color: #3b82f6;
          color: #3b82f6;
        }

        .mini-input {
          width: 60px;
          padding: 4px 6px;
          font-size: 11px;
          border: 1px solid #e5e7eb;
          border-radius: 4px;
          font-family: monospace;
        }

        .transform-btn, .decoration-btn {
          font-size: 12px;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}

// Helper to convert settings to CSS
export function getTypographyStyles(settings?: TypographySettings): React.CSSProperties {
  if (!settings) return {};

  return {
    fontFamily: settings.fontFamily,
    fontSize: settings.fontSize,
    fontWeight: settings.fontWeight as React.CSSProperties["fontWeight"],
    lineHeight: settings.lineHeight,
    letterSpacing: settings.letterSpacing,
    textAlign: settings.textAlign,
    textTransform: settings.textTransform,
    textDecoration: settings.textDecoration,
  };
}
