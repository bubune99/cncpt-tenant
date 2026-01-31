"use client";

import React, { useState } from "react";

export interface BorderSettings {
  borderWidth?: string;
  borderStyle?: "none" | "solid" | "dashed" | "dotted" | "double";
  borderColor?: string;
  // Individual sides
  borderTopWidth?: string;
  borderRightWidth?: string;
  borderBottomWidth?: string;
  borderLeftWidth?: string;
  borderTopColor?: string;
  borderRightColor?: string;
  borderBottomColor?: string;
  borderLeftColor?: string;
  // Border radius
  borderRadius?: string;
  borderTopLeftRadius?: string;
  borderTopRightRadius?: string;
  borderBottomRightRadius?: string;
  borderBottomLeftRadius?: string;
}

export const defaultBorderSettings: BorderSettings = {
  borderWidth: "0px",
  borderStyle: "solid",
  borderColor: "#e5e7eb",
  borderRadius: "0px",
};

interface BorderFieldProps {
  value: BorderSettings;
  onChange: (value: BorderSettings) => void;
}

const borderWidthPresets = ["0px", "1px", "2px", "3px", "4px"];
const borderRadiusPresets = ["0px", "4px", "8px", "12px", "16px", "24px", "9999px"];

export function BorderField({ value, onChange }: BorderFieldProps) {
  const settings = { ...defaultBorderSettings, ...value };
  const [borderMode, setBorderMode] = useState<"uniform" | "individual">("uniform");
  const [radiusMode, setRadiusMode] = useState<"uniform" | "individual">("uniform");

  const updateSettings = (updates: Partial<BorderSettings>) => {
    onChange({ ...settings, ...updates });
  };

  return (
    <div className="border-field">
      {/* Border Width & Style */}
      <div className="section">
        <div className="section-header">
          <label className="field-label">Border</label>
          <div className="mode-toggle">
            <button
              className={`toggle-btn ${borderMode === "uniform" ? "active" : ""}`}
              onClick={() => setBorderMode("uniform")}
            >
              All
            </button>
            <button
              className={`toggle-btn ${borderMode === "individual" ? "active" : ""}`}
              onClick={() => setBorderMode("individual")}
            >
              Each
            </button>
          </div>
        </div>

        {borderMode === "uniform" ? (
          <div className="uniform-border">
            <div className="border-row">
              <div className="width-presets">
                {borderWidthPresets.map((width) => (
                  <button
                    key={width}
                    className={`preset-btn ${settings.borderWidth === width ? "active" : ""}`}
                    onClick={() => updateSettings({ borderWidth: width })}
                  >
                    {parseInt(width)}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={settings.borderWidth}
                onChange={(e) => updateSettings({ borderWidth: e.target.value })}
                className="width-input"
                placeholder="1px"
              />
            </div>

            <div className="style-color-row">
              <select
                value={settings.borderStyle}
                onChange={(e) => updateSettings({ borderStyle: e.target.value as BorderSettings["borderStyle"] })}
                className="style-select"
              >
                <option value="none">None</option>
                <option value="solid">Solid</option>
                <option value="dashed">Dashed</option>
                <option value="dotted">Dotted</option>
                <option value="double">Double</option>
              </select>
              <div className="color-input-wrapper">
                <input
                  type="color"
                  value={settings.borderColor || "#e5e7eb"}
                  onChange={(e) => updateSettings({ borderColor: e.target.value })}
                  className="color-picker"
                />
                <input
                  type="text"
                  value={settings.borderColor || "#e5e7eb"}
                  onChange={(e) => updateSettings({ borderColor: e.target.value })}
                  className="color-text"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="individual-border">
            {(["Top", "Right", "Bottom", "Left"] as const).map((side) => {
              const widthKey = `border${side}Width` as keyof BorderSettings;
              const colorKey = `border${side}Color` as keyof BorderSettings;
              return (
                <div key={side} className="side-row">
                  <span className="side-label">{side}</span>
                  <input
                    type="text"
                    value={(settings[widthKey] as string) || settings.borderWidth || "0px"}
                    onChange={(e) => updateSettings({ [widthKey]: e.target.value })}
                    className="side-width"
                    placeholder="0px"
                  />
                  <input
                    type="color"
                    value={(settings[colorKey] as string) || settings.borderColor || "#e5e7eb"}
                    onChange={(e) => updateSettings({ [colorKey]: e.target.value })}
                    className="side-color"
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Border Radius */}
      <div className="section">
        <div className="section-header">
          <label className="field-label">Radius</label>
          <div className="mode-toggle">
            <button
              className={`toggle-btn ${radiusMode === "uniform" ? "active" : ""}`}
              onClick={() => setRadiusMode("uniform")}
            >
              All
            </button>
            <button
              className={`toggle-btn ${radiusMode === "individual" ? "active" : ""}`}
              onClick={() => setRadiusMode("individual")}
            >
              Each
            </button>
          </div>
        </div>

        {radiusMode === "uniform" ? (
          <div className="uniform-radius">
            <div className="radius-presets">
              {borderRadiusPresets.map((radius) => (
                <button
                  key={radius}
                  className={`preset-btn ${settings.borderRadius === radius ? "active" : ""}`}
                  onClick={() => updateSettings({ borderRadius: radius })}
                >
                  {radius === "9999px" ? "●" : parseInt(radius)}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={settings.borderRadius}
              onChange={(e) => updateSettings({ borderRadius: e.target.value })}
              className="radius-input"
              placeholder="8px"
            />
          </div>
        ) : (
          <div className="individual-radius">
            <div className="radius-visual">
              <input
                type="text"
                value={settings.borderTopLeftRadius || settings.borderRadius || "0px"}
                onChange={(e) => updateSettings({ borderTopLeftRadius: e.target.value })}
                className="corner-input top-left"
                placeholder="0"
              />
              <input
                type="text"
                value={settings.borderTopRightRadius || settings.borderRadius || "0px"}
                onChange={(e) => updateSettings({ borderTopRightRadius: e.target.value })}
                className="corner-input top-right"
                placeholder="0"
              />
              <div className="radius-preview" style={{
                borderRadius: `${settings.borderTopLeftRadius || settings.borderRadius || "0px"} ${settings.borderTopRightRadius || settings.borderRadius || "0px"} ${settings.borderBottomRightRadius || settings.borderRadius || "0px"} ${settings.borderBottomLeftRadius || settings.borderRadius || "0px"}`
              }} />
              <input
                type="text"
                value={settings.borderBottomLeftRadius || settings.borderRadius || "0px"}
                onChange={(e) => updateSettings({ borderBottomLeftRadius: e.target.value })}
                className="corner-input bottom-left"
                placeholder="0"
              />
              <input
                type="text"
                value={settings.borderBottomRightRadius || settings.borderRadius || "0px"}
                onChange={(e) => updateSettings({ borderBottomRightRadius: e.target.value })}
                className="corner-input bottom-right"
                placeholder="0"
              />
            </div>
          </div>
        )}
      </div>

      {/* Preview */}
      <div className="preview">
        <div
          className="preview-box"
          style={{
            borderWidth: settings.borderWidth,
            borderStyle: settings.borderStyle,
            borderColor: settings.borderColor,
            borderRadius: settings.borderRadius,
          }}
        />
      </div>

      <style>{`
        .border-field {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .section {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .field-label {
          font-size: 11px;
          font-weight: 500;
          color: #6b7280;
        }

        .mode-toggle {
          display: flex;
          gap: 2px;
        }

        .toggle-btn {
          padding: 4px 8px;
          font-size: 10px;
          font-weight: 500;
          border: 1px solid #e5e7eb;
          background: white;
          color: #6b7280;
          cursor: pointer;
        }

        .toggle-btn:first-child {
          border-radius: 4px 0 0 4px;
        }

        .toggle-btn:last-child {
          border-radius: 0 4px 4px 0;
        }

        .toggle-btn.active {
          background: #3b82f6;
          border-color: #3b82f6;
          color: white;
        }

        .uniform-border, .uniform-radius {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .border-row {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .width-presets, .radius-presets {
          display: flex;
          gap: 4px;
        }

        .preset-btn {
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 500;
          border: 1px solid #e5e7eb;
          background: white;
          color: #6b7280;
          border-radius: 4px;
          cursor: pointer;
        }

        .preset-btn:hover {
          background: #f3f4f6;
        }

        .preset-btn.active {
          background: #eff6ff;
          border-color: #3b82f6;
          color: #3b82f6;
        }

        .width-input, .radius-input {
          flex: 1;
          padding: 6px 8px;
          font-size: 12px;
          border: 1px solid #e5e7eb;
          border-radius: 4px;
          font-family: monospace;
        }

        .style-color-row {
          display: flex;
          gap: 8px;
        }

        .style-select {
          padding: 6px 8px;
          font-size: 12px;
          border: 1px solid #e5e7eb;
          border-radius: 4px;
          background: white;
        }

        .color-input-wrapper {
          flex: 1;
          display: flex;
          gap: 6px;
          align-items: center;
        }

        .color-picker {
          width: 32px;
          height: 28px;
          border: 1px solid #e5e7eb;
          border-radius: 4px;
          cursor: pointer;
          padding: 2px;
        }

        .color-text {
          flex: 1;
          padding: 6px 8px;
          font-size: 11px;
          border: 1px solid #e5e7eb;
          border-radius: 4px;
          font-family: monospace;
        }

        .individual-border {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .side-row {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .side-label {
          width: 50px;
          font-size: 11px;
          color: #6b7280;
        }

        .side-width {
          width: 60px;
          padding: 4px 6px;
          font-size: 11px;
          border: 1px solid #e5e7eb;
          border-radius: 4px;
          text-align: center;
        }

        .side-color {
          width: 28px;
          height: 24px;
          border: 1px solid #e5e7eb;
          border-radius: 4px;
          cursor: pointer;
          padding: 2px;
        }

        .individual-radius {
          display: flex;
          justify-content: center;
        }

        .radius-visual {
          display: grid;
          grid-template-columns: 50px 60px 50px;
          grid-template-rows: auto auto auto;
          gap: 8px;
          align-items: center;
          justify-items: center;
        }

        .corner-input {
          width: 50px;
          padding: 4px 6px;
          font-size: 11px;
          border: 1px solid #e5e7eb;
          border-radius: 4px;
          text-align: center;
        }

        .corner-input.top-left { grid-column: 1; grid-row: 1; }
        .corner-input.top-right { grid-column: 3; grid-row: 1; }
        .corner-input.bottom-left { grid-column: 1; grid-row: 3; }
        .corner-input.bottom-right { grid-column: 3; grid-row: 3; }

        .radius-preview {
          grid-column: 2;
          grid-row: 2;
          width: 50px;
          height: 50px;
          background: #e5e7eb;
          border: 2px solid #9ca3af;
        }

        .preview {
          display: flex;
          justify-content: center;
          padding: 12px;
          background: #f9fafb;
          border-radius: 8px;
        }

        .preview-box {
          width: 80px;
          height: 60px;
          background: white;
        }
      `}</style>
    </div>
  );
}

// Helper to convert settings to CSS
export function getBorderStyles(settings?: BorderSettings): React.CSSProperties {
  if (!settings) return {};

  return {
    borderWidth: settings.borderWidth,
    borderStyle: settings.borderStyle,
    borderColor: settings.borderColor,
    borderTopWidth: settings.borderTopWidth,
    borderRightWidth: settings.borderRightWidth,
    borderBottomWidth: settings.borderBottomWidth,
    borderLeftWidth: settings.borderLeftWidth,
    borderTopColor: settings.borderTopColor,
    borderRightColor: settings.borderRightColor,
    borderBottomColor: settings.borderBottomColor,
    borderLeftColor: settings.borderLeftColor,
    borderRadius: settings.borderRadius,
    borderTopLeftRadius: settings.borderTopLeftRadius,
    borderTopRightRadius: settings.borderTopRightRadius,
    borderBottomRightRadius: settings.borderBottomRightRadius,
    borderBottomLeftRadius: settings.borderBottomLeftRadius,
  };
}
