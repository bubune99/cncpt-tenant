"use client";

import React, { useState } from "react";

export interface PositionSettings {
  position?: "static" | "relative" | "absolute" | "fixed" | "sticky";
  top?: string;
  right?: string;
  bottom?: string;
  left?: string;
  zIndex?: number;
  inset?: string;
}

export const defaultPositionSettings: PositionSettings = {
  position: "relative",
  zIndex: 0,
};

interface PositionFieldProps {
  value: PositionSettings;
  onChange: (value: PositionSettings) => void;
}

export function PositionField({ value, onChange }: PositionFieldProps) {
  const settings = { ...defaultPositionSettings, ...value };
  const [linkOffsets, setLinkOffsets] = useState(false);

  const updateSettings = (updates: Partial<PositionSettings>) => {
    onChange({ ...settings, ...updates });
  };

  const showOffsets = settings.position !== "static";

  const handleOffsetChange = (side: "top" | "right" | "bottom" | "left", val: string) => {
    if (linkOffsets) {
      updateSettings({ top: val, right: val, bottom: val, left: val });
    } else {
      updateSettings({ [side]: val });
    }
  };

  return (
    <div className="position-field">
      {/* Position Type */}
      <div className="field-row">
        <label className="field-label">Position</label>
        <div className="position-buttons">
          {(["static", "relative", "absolute", "fixed", "sticky"] as const).map((pos) => (
            <button
              key={pos}
              className={`position-btn ${settings.position === pos ? "active" : ""}`}
              onClick={() => updateSettings({ position: pos })}
            >
              {pos.charAt(0).toUpperCase()}
            </button>
          ))}
        </div>
        <span className="position-label">{settings.position}</span>
      </div>

      {/* Offsets */}
      {showOffsets && (
        <div className="offsets-section">
          <div className="offsets-header">
            <label className="field-label">Offsets</label>
            <button
              className={`link-btn ${linkOffsets ? "active" : ""}`}
              onClick={() => setLinkOffsets(!linkOffsets)}
              title="Link all sides"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {linkOffsets ? (
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                ) : (
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                )}
              </svg>
            </button>
          </div>

          <div className="offsets-visual">
            <div className="offset-row">
              <input
                type="text"
                value={settings.top || ""}
                onChange={(e) => handleOffsetChange("top", e.target.value)}
                className="offset-input top"
                placeholder="auto"
              />
            </div>
            <div className="offset-middle">
              <input
                type="text"
                value={settings.left || ""}
                onChange={(e) => handleOffsetChange("left", e.target.value)}
                className="offset-input left"
                placeholder="auto"
              />
              <div className="offset-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                </svg>
              </div>
              <input
                type="text"
                value={settings.right || ""}
                onChange={(e) => handleOffsetChange("right", e.target.value)}
                className="offset-input right"
                placeholder="auto"
              />
            </div>
            <div className="offset-row">
              <input
                type="text"
                value={settings.bottom || ""}
                onChange={(e) => handleOffsetChange("bottom", e.target.value)}
                className="offset-input bottom"
                placeholder="auto"
              />
            </div>
          </div>

          {/* Quick presets */}
          <div className="preset-buttons">
            <button
              className="preset-btn"
              onClick={() => updateSettings({ top: "0", left: "0", right: "auto", bottom: "auto" })}
              title="Top Left"
            >
              ↖
            </button>
            <button
              className="preset-btn"
              onClick={() => updateSettings({ top: "0", left: "50%", right: "auto", bottom: "auto" })}
              title="Top Center"
            >
              ↑
            </button>
            <button
              className="preset-btn"
              onClick={() => updateSettings({ top: "0", right: "0", left: "auto", bottom: "auto" })}
              title="Top Right"
            >
              ↗
            </button>
            <button
              className="preset-btn"
              onClick={() => updateSettings({ top: "50%", left: "0", right: "auto", bottom: "auto" })}
              title="Middle Left"
            >
              ←
            </button>
            <button
              className="preset-btn"
              onClick={() => updateSettings({ top: "50%", left: "50%", right: "auto", bottom: "auto" })}
              title="Center"
            >
              •
            </button>
            <button
              className="preset-btn"
              onClick={() => updateSettings({ top: "50%", right: "0", left: "auto", bottom: "auto" })}
              title="Middle Right"
            >
              →
            </button>
            <button
              className="preset-btn"
              onClick={() => updateSettings({ bottom: "0", left: "0", right: "auto", top: "auto" })}
              title="Bottom Left"
            >
              ↙
            </button>
            <button
              className="preset-btn"
              onClick={() => updateSettings({ bottom: "0", left: "50%", right: "auto", top: "auto" })}
              title="Bottom Center"
            >
              ↓
            </button>
            <button
              className="preset-btn"
              onClick={() => updateSettings({ bottom: "0", right: "0", left: "auto", top: "auto" })}
              title="Bottom Right"
            >
              ↘
            </button>
          </div>

          {/* Inset shorthand */}
          <div className="inset-row">
            <label className="mini-label">Inset (fill parent)</label>
            <button
              className="inset-btn"
              onClick={() => updateSettings({ top: "0", right: "0", bottom: "0", left: "0" })}
            >
              Set to 0
            </button>
          </div>
        </div>
      )}

      {/* Z-Index */}
      <div className="field-row">
        <label className="field-label">Z-Index</label>
        <div className="zindex-control">
          <input
            type="range"
            min="-10"
            max="100"
            value={settings.zIndex ?? 0}
            onChange={(e) => updateSettings({ zIndex: Number(e.target.value) })}
            className="zindex-slider"
          />
          <input
            type="number"
            value={settings.zIndex ?? 0}
            onChange={(e) => updateSettings({ zIndex: Number(e.target.value) })}
            className="zindex-input"
          />
        </div>
      </div>

      <style>{`
        .position-field {
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

        .position-buttons {
          display: flex;
          gap: 4px;
        }

        .position-btn {
          flex: 1;
          padding: 8px 4px;
          font-size: 12px;
          font-weight: 600;
          border: 1px solid #e5e7eb;
          background: white;
          color: #6b7280;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .position-btn:hover {
          background: #f3f4f6;
        }

        .position-btn.active {
          background: #3b82f6;
          border-color: #3b82f6;
          color: white;
        }

        .position-label {
          font-size: 10px;
          color: #9ca3af;
          text-align: center;
        }

        .offsets-section {
          padding: 12px;
          background: #f9fafb;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
        }

        .offsets-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .link-btn {
          padding: 4px 8px;
          border: 1px solid #e5e7eb;
          background: white;
          border-radius: 4px;
          cursor: pointer;
          color: #6b7280;
        }

        .link-btn.active {
          background: #eff6ff;
          border-color: #3b82f6;
          color: #3b82f6;
        }

        .offsets-visual {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
        }

        .offset-row {
          display: flex;
          justify-content: center;
        }

        .offset-middle {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .offset-input {
          width: 60px;
          padding: 6px 8px;
          font-size: 11px;
          text-align: center;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          font-family: monospace;
        }

        .offset-center {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: white;
          border: 2px dashed #d1d5db;
          border-radius: 4px;
        }

        .preset-buttons {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 4px;
          margin-bottom: 12px;
        }

        .preset-btn {
          padding: 8px;
          font-size: 14px;
          border: 1px solid #e5e7eb;
          background: white;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .preset-btn:hover {
          background: #f3f4f6;
        }

        .inset-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .mini-label {
          font-size: 10px;
          color: #6b7280;
        }

        .inset-btn {
          padding: 4px 12px;
          font-size: 11px;
          font-weight: 500;
          border: 1px solid #e5e7eb;
          background: white;
          border-radius: 4px;
          cursor: pointer;
        }

        .inset-btn:hover {
          background: #f3f4f6;
        }

        .zindex-control {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .zindex-slider {
          flex: 1;
          height: 6px;
          border-radius: 3px;
          background: #e5e7eb;
          cursor: pointer;
          -webkit-appearance: none;
        }

        .zindex-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
        }

        .zindex-input {
          width: 60px;
          padding: 6px 8px;
          font-size: 12px;
          border: 1px solid #e5e7eb;
          border-radius: 4px;
          text-align: center;
        }
      `}</style>
    </div>
  );
}

// Helper to convert settings to CSS
export function getPositionStyles(settings?: PositionSettings): React.CSSProperties {
  if (!settings) return {};

  return {
    position: settings.position,
    top: settings.top,
    right: settings.right,
    bottom: settings.bottom,
    left: settings.left,
    zIndex: settings.zIndex,
    inset: settings.inset,
  };
}
