"use client";

import React, { useState } from "react";

export interface EffectsSettings {
  opacity?: number;
  mixBlendMode?: "normal" | "multiply" | "screen" | "overlay" | "darken" | "lighten" | "color-dodge" | "color-burn" | "hard-light" | "soft-light" | "difference" | "exclusion";
  // Filters
  blur?: number;
  brightness?: number;
  contrast?: number;
  saturate?: number;
  grayscale?: number;
  sepia?: number;
  hueRotate?: number;
  invert?: number;
  // Backdrop filters
  backdropBlur?: number;
  backdropBrightness?: number;
  backdropContrast?: number;
  backdropSaturate?: number;
  // Cursor
  cursor?: "auto" | "default" | "pointer" | "move" | "text" | "wait" | "not-allowed" | "grab" | "grabbing";
  // Pointer events
  pointerEvents?: "auto" | "none";
  // User select
  userSelect?: "auto" | "none" | "text" | "all";
}

export const defaultEffectsSettings: EffectsSettings = {
  opacity: 100,
  mixBlendMode: "normal",
  blur: 0,
  brightness: 100,
  contrast: 100,
  saturate: 100,
  grayscale: 0,
  sepia: 0,
  hueRotate: 0,
  invert: 0,
  backdropBlur: 0,
  cursor: "auto",
  pointerEvents: "auto",
  userSelect: "auto",
};

interface EffectsFieldProps {
  value: EffectsSettings;
  onChange: (value: EffectsSettings) => void;
}

export function EffectsField({ value, onChange }: EffectsFieldProps) {
  const settings = { ...defaultEffectsSettings, ...value };
  const [showFilters, setShowFilters] = useState(false);
  const [showBackdrop, setShowBackdrop] = useState(false);
  const [showInteraction, setShowInteraction] = useState(false);

  const updateSettings = (updates: Partial<EffectsSettings>) => {
    onChange({ ...settings, ...updates });
  };

  return (
    <div className="effects-field">
      {/* Opacity */}
      <div className="field-row">
        <label className="field-label">Opacity</label>
        <div className="slider-row">
          <input
            type="range"
            min="0"
            max="100"
            value={settings.opacity}
            onChange={(e) => updateSettings({ opacity: Number(e.target.value) })}
            className="range-slider"
          />
          <div className="value-with-unit">
            <input
              type="number"
              min="0"
              max="100"
              value={settings.opacity}
              onChange={(e) => updateSettings({ opacity: Number(e.target.value) })}
              className="value-input"
            />
            <span className="unit">%</span>
          </div>
        </div>
      </div>

      {/* Blend Mode */}
      <div className="field-row">
        <label className="field-label">Blend Mode</label>
        <select
          value={settings.mixBlendMode}
          onChange={(e) => updateSettings({ mixBlendMode: e.target.value as EffectsSettings["mixBlendMode"] })}
          className="select-field"
        >
          <option value="normal">Normal</option>
          <option value="multiply">Multiply</option>
          <option value="screen">Screen</option>
          <option value="overlay">Overlay</option>
          <option value="darken">Darken</option>
          <option value="lighten">Lighten</option>
          <option value="color-dodge">Color Dodge</option>
          <option value="color-burn">Color Burn</option>
          <option value="hard-light">Hard Light</option>
          <option value="soft-light">Soft Light</option>
          <option value="difference">Difference</option>
          <option value="exclusion">Exclusion</option>
        </select>
      </div>

      {/* Filters Toggle */}
      <button className="section-toggle" onClick={() => setShowFilters(!showFilters)}>
        {showFilters ? "▼" : "▶"} Filters
      </button>

      {showFilters && (
        <div className="section-content">
          {/* Blur */}
          <div className="filter-row">
            <span className="filter-label">Blur</span>
            <input
              type="range"
              min="0"
              max="20"
              value={settings.blur}
              onChange={(e) => updateSettings({ blur: Number(e.target.value) })}
              className="filter-slider"
            />
            <span className="filter-value">{settings.blur}px</span>
          </div>

          {/* Brightness */}
          <div className="filter-row">
            <span className="filter-label">Brightness</span>
            <input
              type="range"
              min="0"
              max="200"
              value={settings.brightness}
              onChange={(e) => updateSettings({ brightness: Number(e.target.value) })}
              className="filter-slider"
            />
            <span className="filter-value">{settings.brightness}%</span>
          </div>

          {/* Contrast */}
          <div className="filter-row">
            <span className="filter-label">Contrast</span>
            <input
              type="range"
              min="0"
              max="200"
              value={settings.contrast}
              onChange={(e) => updateSettings({ contrast: Number(e.target.value) })}
              className="filter-slider"
            />
            <span className="filter-value">{settings.contrast}%</span>
          </div>

          {/* Saturate */}
          <div className="filter-row">
            <span className="filter-label">Saturate</span>
            <input
              type="range"
              min="0"
              max="200"
              value={settings.saturate}
              onChange={(e) => updateSettings({ saturate: Number(e.target.value) })}
              className="filter-slider"
            />
            <span className="filter-value">{settings.saturate}%</span>
          </div>

          {/* Grayscale */}
          <div className="filter-row">
            <span className="filter-label">Grayscale</span>
            <input
              type="range"
              min="0"
              max="100"
              value={settings.grayscale}
              onChange={(e) => updateSettings({ grayscale: Number(e.target.value) })}
              className="filter-slider"
            />
            <span className="filter-value">{settings.grayscale}%</span>
          </div>

          {/* Sepia */}
          <div className="filter-row">
            <span className="filter-label">Sepia</span>
            <input
              type="range"
              min="0"
              max="100"
              value={settings.sepia}
              onChange={(e) => updateSettings({ sepia: Number(e.target.value) })}
              className="filter-slider"
            />
            <span className="filter-value">{settings.sepia}%</span>
          </div>

          {/* Hue Rotate */}
          <div className="filter-row">
            <span className="filter-label">Hue Rotate</span>
            <input
              type="range"
              min="0"
              max="360"
              value={settings.hueRotate}
              onChange={(e) => updateSettings({ hueRotate: Number(e.target.value) })}
              className="filter-slider"
            />
            <span className="filter-value">{settings.hueRotate}°</span>
          </div>

          {/* Invert */}
          <div className="filter-row">
            <span className="filter-label">Invert</span>
            <input
              type="range"
              min="0"
              max="100"
              value={settings.invert}
              onChange={(e) => updateSettings({ invert: Number(e.target.value) })}
              className="filter-slider"
            />
            <span className="filter-value">{settings.invert}%</span>
          </div>

          {/* Reset Filters */}
          <button
            className="reset-btn"
            onClick={() => updateSettings({
              blur: 0,
              brightness: 100,
              contrast: 100,
              saturate: 100,
              grayscale: 0,
              sepia: 0,
              hueRotate: 0,
              invert: 0,
            })}
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Backdrop Filters Toggle */}
      <button className="section-toggle" onClick={() => setShowBackdrop(!showBackdrop)}>
        {showBackdrop ? "▼" : "▶"} Backdrop Blur
      </button>

      {showBackdrop && (
        <div className="section-content">
          <div className="filter-row">
            <span className="filter-label">Blur</span>
            <input
              type="range"
              min="0"
              max="30"
              value={settings.backdropBlur}
              onChange={(e) => updateSettings({ backdropBlur: Number(e.target.value) })}
              className="filter-slider"
            />
            <span className="filter-value">{settings.backdropBlur}px</span>
          </div>
        </div>
      )}

      {/* Interaction Toggle */}
      <button className="section-toggle" onClick={() => setShowInteraction(!showInteraction)}>
        {showInteraction ? "▼" : "▶"} Interaction
      </button>

      {showInteraction && (
        <div className="section-content">
          <div className="field-row">
            <label className="mini-label">Cursor</label>
            <select
              value={settings.cursor}
              onChange={(e) => updateSettings({ cursor: e.target.value as EffectsSettings["cursor"] })}
              className="mini-select"
            >
              <option value="auto">Auto</option>
              <option value="default">Default</option>
              <option value="pointer">Pointer</option>
              <option value="move">Move</option>
              <option value="text">Text</option>
              <option value="wait">Wait</option>
              <option value="not-allowed">Not Allowed</option>
              <option value="grab">Grab</option>
              <option value="grabbing">Grabbing</option>
            </select>
          </div>

          <div className="field-row">
            <label className="mini-label">Pointer Events</label>
            <div className="toggle-buttons">
              <button
                className={`toggle-btn ${settings.pointerEvents === "auto" ? "active" : ""}`}
                onClick={() => updateSettings({ pointerEvents: "auto" })}
              >
                Auto
              </button>
              <button
                className={`toggle-btn ${settings.pointerEvents === "none" ? "active" : ""}`}
                onClick={() => updateSettings({ pointerEvents: "none" })}
              >
                None
              </button>
            </div>
          </div>

          <div className="field-row">
            <label className="mini-label">User Select</label>
            <select
              value={settings.userSelect}
              onChange={(e) => updateSettings({ userSelect: e.target.value as EffectsSettings["userSelect"] })}
              className="mini-select"
            >
              <option value="auto">Auto</option>
              <option value="none">None</option>
              <option value="text">Text</option>
              <option value="all">All</option>
            </select>
          </div>
        </div>
      )}

      <style>{`
        .effects-field {
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

        .slider-row {
          display: flex;
          gap: 12px;
          align-items: center;
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
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
        }

        .value-with-unit {
          display: flex;
          align-items: center;
          gap: 2px;
        }

        .value-input {
          width: 50px;
          padding: 4px 6px;
          font-size: 12px;
          border: 1px solid #e5e7eb;
          border-radius: 4px;
          text-align: right;
        }

        .unit {
          font-size: 11px;
          color: #6b7280;
        }

        .select-field, .mini-select {
          width: 100%;
          padding: 8px 10px;
          font-size: 12px;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          background: white;
          cursor: pointer;
        }

        .section-toggle {
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

        .section-toggle:hover {
          color: #374151;
        }

        .section-content {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 12px;
          background: #f9fafb;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
        }

        .filter-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .filter-label {
          width: 70px;
          font-size: 11px;
          color: #6b7280;
        }

        .filter-slider {
          flex: 1;
          height: 4px;
          border-radius: 2px;
          background: #e5e7eb;
          cursor: pointer;
          -webkit-appearance: none;
        }

        .filter-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
        }

        .filter-value {
          width: 50px;
          font-size: 11px;
          color: #374151;
          text-align: right;
          font-family: monospace;
        }

        .reset-btn {
          margin-top: 8px;
          padding: 6px 12px;
          font-size: 11px;
          font-weight: 500;
          color: #6b7280;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 4px;
          cursor: pointer;
        }

        .reset-btn:hover {
          background: #f3f4f6;
        }

        .mini-label {
          font-size: 10px;
          font-weight: 500;
          color: #9ca3af;
        }

        .toggle-buttons {
          display: flex;
          gap: 4px;
        }

        .toggle-btn {
          flex: 1;
          padding: 6px 12px;
          font-size: 11px;
          font-weight: 500;
          border: 1px solid #e5e7eb;
          background: white;
          color: #6b7280;
          border-radius: 4px;
          cursor: pointer;
        }

        .toggle-btn.active {
          background: #3b82f6;
          border-color: #3b82f6;
          color: white;
        }
      `}</style>
    </div>
  );
}

// Helper to convert settings to CSS
export function getEffectsStyles(settings?: EffectsSettings): React.CSSProperties {
  if (!settings) return {};

  const filters: string[] = [];
  if (settings.blur && settings.blur > 0) filters.push(`blur(${settings.blur}px)`);
  if (settings.brightness !== undefined && settings.brightness !== 100) filters.push(`brightness(${settings.brightness}%)`);
  if (settings.contrast !== undefined && settings.contrast !== 100) filters.push(`contrast(${settings.contrast}%)`);
  if (settings.saturate !== undefined && settings.saturate !== 100) filters.push(`saturate(${settings.saturate}%)`);
  if (settings.grayscale && settings.grayscale > 0) filters.push(`grayscale(${settings.grayscale}%)`);
  if (settings.sepia && settings.sepia > 0) filters.push(`sepia(${settings.sepia}%)`);
  if (settings.hueRotate && settings.hueRotate > 0) filters.push(`hue-rotate(${settings.hueRotate}deg)`);
  if (settings.invert && settings.invert > 0) filters.push(`invert(${settings.invert}%)`);

  const backdropFilters: string[] = [];
  if (settings.backdropBlur && settings.backdropBlur > 0) backdropFilters.push(`blur(${settings.backdropBlur}px)`);

  return {
    opacity: settings.opacity !== undefined ? settings.opacity / 100 : undefined,
    mixBlendMode: settings.mixBlendMode,
    filter: filters.length > 0 ? filters.join(" ") : undefined,
    backdropFilter: backdropFilters.length > 0 ? backdropFilters.join(" ") : undefined,
    WebkitBackdropFilter: backdropFilters.length > 0 ? backdropFilters.join(" ") : undefined,
    cursor: settings.cursor,
    pointerEvents: settings.pointerEvents,
    userSelect: settings.userSelect,
  };
}
