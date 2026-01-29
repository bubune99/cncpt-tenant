"use client";

import React, { useState } from "react";

export interface TransformSettings {
  // Rotate
  rotate?: number;
  rotateX?: number;
  rotateY?: number;
  // Scale
  scale?: number;
  scaleX?: number;
  scaleY?: number;
  // Skew
  skewX?: number;
  skewY?: number;
  // Translate
  translateX?: string;
  translateY?: string;
  translateZ?: string;
  // Transform origin
  transformOrigin?: string;
  // Perspective
  perspective?: string;
  // Backface visibility
  backfaceVisibility?: "visible" | "hidden";
}

export const defaultTransformSettings: TransformSettings = {
  rotate: 0,
  scale: 1,
  skewX: 0,
  skewY: 0,
  translateX: "0px",
  translateY: "0px",
  transformOrigin: "center center",
};

interface TransformFieldProps {
  value: TransformSettings;
  onChange: (value: TransformSettings) => void;
}

const originPresets = [
  { label: "TL", value: "top left", x: 0, y: 0 },
  { label: "T", value: "top center", x: 50, y: 0 },
  { label: "TR", value: "top right", x: 100, y: 0 },
  { label: "L", value: "center left", x: 0, y: 50 },
  { label: "C", value: "center center", x: 50, y: 50 },
  { label: "R", value: "center right", x: 100, y: 50 },
  { label: "BL", value: "bottom left", x: 0, y: 100 },
  { label: "B", value: "bottom center", x: 50, y: 100 },
  { label: "BR", value: "bottom right", x: 100, y: 100 },
];

export function TransformField({ value, onChange }: TransformFieldProps) {
  const settings = { ...defaultTransformSettings, ...value };
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [show3D, setShow3D] = useState(false);

  const updateSettings = (updates: Partial<TransformSettings>) => {
    onChange({ ...settings, ...updates });
  };

  const getOriginPosition = () => {
    const preset = originPresets.find(p => p.value === settings.transformOrigin);
    if (preset) return { x: preset.x, y: preset.y };
    return { x: 50, y: 50 };
  };

  const originPos = getOriginPosition();

  return (
    <div className="transform-field">
      {/* Rotate */}
      <div className="transform-section">
        <label className="field-label">Rotate</label>
        <div className="rotate-control">
          <div className="dial-container">
            <div
              className="dial"
              style={{ transform: `rotate(${settings.rotate}deg)` }}
            >
              <div className="dial-indicator" />
            </div>
            <input
              type="range"
              min="-180"
              max="180"
              value={settings.rotate}
              onChange={(e) => updateSettings({ rotate: Number(e.target.value) })}
              className="dial-slider"
            />
          </div>
          <div className="value-input-group">
            <input
              type="number"
              min="-360"
              max="360"
              value={settings.rotate}
              onChange={(e) => updateSettings({ rotate: Number(e.target.value) })}
              className="value-input"
            />
            <span className="unit">°</span>
          </div>
        </div>
        <div className="rotate-presets">
          {[-90, -45, 0, 45, 90, 180].map((deg) => (
            <button
              key={deg}
              className={`preset-btn ${settings.rotate === deg ? "active" : ""}`}
              onClick={() => updateSettings({ rotate: deg })}
            >
              {deg}°
            </button>
          ))}
        </div>
      </div>

      {/* Scale */}
      <div className="transform-section">
        <label className="field-label">Scale</label>
        <div className="scale-control">
          <input
            type="range"
            min="0"
            max="2"
            step="0.01"
            value={settings.scale}
            onChange={(e) => updateSettings({ scale: Number(e.target.value) })}
            className="scale-slider"
          />
          <div className="value-input-group">
            <input
              type="number"
              min="0"
              max="10"
              step="0.1"
              value={settings.scale}
              onChange={(e) => updateSettings({ scale: Number(e.target.value) })}
              className="value-input"
            />
            <span className="unit">x</span>
          </div>
        </div>
        <div className="scale-presets">
          {[0.5, 0.75, 1, 1.25, 1.5, 2].map((s) => (
            <button
              key={s}
              className={`preset-btn ${settings.scale === s ? "active" : ""}`}
              onClick={() => updateSettings({ scale: s })}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      {/* Translate */}
      <div className="transform-section">
        <label className="field-label">Translate</label>
        <div className="translate-grid">
          <div className="translate-field">
            <span className="axis-label">X</span>
            <input
              type="text"
              value={settings.translateX || "0px"}
              onChange={(e) => updateSettings({ translateX: e.target.value })}
              className="translate-input"
              placeholder="0px"
            />
          </div>
          <div className="translate-field">
            <span className="axis-label">Y</span>
            <input
              type="text"
              value={settings.translateY || "0px"}
              onChange={(e) => updateSettings({ translateY: e.target.value })}
              className="translate-input"
              placeholder="0px"
            />
          </div>
        </div>
      </div>

      {/* Transform Origin */}
      <div className="transform-section">
        <label className="field-label">Transform Origin</label>
        <div className="origin-control">
          <div className="origin-grid">
            {originPresets.map((preset) => (
              <button
                key={preset.value}
                className={`origin-btn ${settings.transformOrigin === preset.value ? "active" : ""}`}
                onClick={() => updateSettings({ transformOrigin: preset.value })}
                title={preset.value}
              >
                <span className="origin-dot" />
              </button>
            ))}
          </div>
          <div className="origin-preview">
            <div
              className="origin-box"
              style={{ transform: `rotate(${settings.rotate}deg) scale(${settings.scale})` }}
            >
              <div
                className="origin-marker"
                style={{ left: `${originPos.x}%`, top: `${originPos.y}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Toggle */}
      <button
        className="section-toggle"
        onClick={() => setShowAdvanced(!showAdvanced)}
      >
        {showAdvanced ? "▼" : "▶"} Skew
      </button>

      {showAdvanced && (
        <div className="advanced-section">
          <div className="skew-grid">
            <div className="skew-field">
              <span className="axis-label">Skew X</span>
              <div className="skew-control">
                <input
                  type="range"
                  min="-45"
                  max="45"
                  value={settings.skewX}
                  onChange={(e) => updateSettings({ skewX: Number(e.target.value) })}
                  className="skew-slider"
                />
                <div className="value-input-group">
                  <input
                    type="number"
                    min="-89"
                    max="89"
                    value={settings.skewX}
                    onChange={(e) => updateSettings({ skewX: Number(e.target.value) })}
                    className="mini-input"
                  />
                  <span className="unit">°</span>
                </div>
              </div>
            </div>
            <div className="skew-field">
              <span className="axis-label">Skew Y</span>
              <div className="skew-control">
                <input
                  type="range"
                  min="-45"
                  max="45"
                  value={settings.skewY}
                  onChange={(e) => updateSettings({ skewY: Number(e.target.value) })}
                  className="skew-slider"
                />
                <div className="value-input-group">
                  <input
                    type="number"
                    min="-89"
                    max="89"
                    value={settings.skewY}
                    onChange={(e) => updateSettings({ skewY: Number(e.target.value) })}
                    className="mini-input"
                  />
                  <span className="unit">°</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3D Toggle */}
      <button
        className="section-toggle"
        onClick={() => setShow3D(!show3D)}
      >
        {show3D ? "▼" : "▶"} 3D Transforms
      </button>

      {show3D && (
        <div className="advanced-section">
          <div className="field-row">
            <label className="mini-label">Perspective</label>
            <input
              type="text"
              value={settings.perspective || ""}
              onChange={(e) => updateSettings({ perspective: e.target.value || undefined })}
              className="perspective-input"
              placeholder="none (e.g., 1000px)"
            />
          </div>

          <div className="rotate-3d-grid">
            <div className="rotate-3d-field">
              <span className="axis-label">Rotate X</span>
              <div className="rotate-3d-control">
                <input
                  type="range"
                  min="-180"
                  max="180"
                  value={settings.rotateX || 0}
                  onChange={(e) => updateSettings({ rotateX: Number(e.target.value) })}
                  className="rotate-3d-slider"
                />
                <span className="rotate-3d-value">{settings.rotateX || 0}°</span>
              </div>
            </div>
            <div className="rotate-3d-field">
              <span className="axis-label">Rotate Y</span>
              <div className="rotate-3d-control">
                <input
                  type="range"
                  min="-180"
                  max="180"
                  value={settings.rotateY || 0}
                  onChange={(e) => updateSettings({ rotateY: Number(e.target.value) })}
                  className="rotate-3d-slider"
                />
                <span className="rotate-3d-value">{settings.rotateY || 0}°</span>
              </div>
            </div>
          </div>

          <div className="field-row">
            <label className="mini-label">Translate Z</label>
            <input
              type="text"
              value={settings.translateZ || ""}
              onChange={(e) => updateSettings({ translateZ: e.target.value || undefined })}
              className="perspective-input"
              placeholder="0px"
            />
          </div>

          <div className="field-row">
            <label className="mini-label">Backface Visibility</label>
            <div className="toggle-buttons">
              <button
                className={`toggle-btn ${settings.backfaceVisibility !== "hidden" ? "active" : ""}`}
                onClick={() => updateSettings({ backfaceVisibility: "visible" })}
              >
                Visible
              </button>
              <button
                className={`toggle-btn ${settings.backfaceVisibility === "hidden" ? "active" : ""}`}
                onClick={() => updateSettings({ backfaceVisibility: "hidden" })}
              >
                Hidden
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Button */}
      <button
        className="reset-btn"
        onClick={() => onChange(defaultTransformSettings)}
      >
        Reset Transforms
      </button>

      <style>{`
        .transform-field {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .transform-section {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .field-label {
          font-size: 11px;
          font-weight: 500;
          color: #6b7280;
        }

        .rotate-control {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .dial-container {
          position: relative;
          width: 48px;
          height: 48px;
        }

        .dial {
          width: 48px;
          height: 48px;
          border: 2px solid #e5e7eb;
          border-radius: 50%;
          background: white;
          position: relative;
        }

        .dial-indicator {
          position: absolute;
          top: 4px;
          left: 50%;
          transform: translateX(-50%);
          width: 4px;
          height: 10px;
          background: #3b82f6;
          border-radius: 2px;
        }

        .dial-slider {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          opacity: 0;
          cursor: pointer;
        }

        .value-input-group {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .value-input {
          width: 60px;
          padding: 6px 8px;
          font-size: 12px;
          border: 1px solid #e5e7eb;
          border-radius: 4px;
          text-align: right;
        }

        .mini-input {
          width: 50px;
          padding: 4px 6px;
          font-size: 11px;
          border: 1px solid #e5e7eb;
          border-radius: 4px;
          text-align: right;
        }

        .unit {
          font-size: 11px;
          color: #6b7280;
        }

        .rotate-presets, .scale-presets {
          display: flex;
          gap: 4px;
          flex-wrap: wrap;
        }

        .preset-btn {
          padding: 4px 8px;
          font-size: 10px;
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

        .scale-control {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .scale-slider {
          flex: 1;
          height: 6px;
          border-radius: 3px;
          background: #e5e7eb;
          cursor: pointer;
          -webkit-appearance: none;
        }

        .scale-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
        }

        .translate-grid {
          display: flex;
          gap: 12px;
        }

        .translate-field {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .axis-label {
          font-size: 10px;
          font-weight: 600;
          color: #9ca3af;
          width: 14px;
        }

        .translate-input {
          flex: 1;
          padding: 6px 8px;
          font-size: 12px;
          border: 1px solid #e5e7eb;
          border-radius: 4px;
          font-family: monospace;
        }

        .origin-control {
          display: flex;
          gap: 16px;
          align-items: center;
        }

        .origin-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 4px;
        }

        .origin-btn {
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #e5e7eb;
          background: white;
          border-radius: 4px;
          cursor: pointer;
        }

        .origin-btn:hover {
          background: #f3f4f6;
        }

        .origin-btn.active {
          background: #3b82f6;
          border-color: #3b82f6;
        }

        .origin-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #9ca3af;
        }

        .origin-btn.active .origin-dot {
          background: white;
        }

        .origin-preview {
          width: 60px;
          height: 60px;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .origin-box {
          width: 36px;
          height: 36px;
          background: #e0e7ff;
          border: 2px solid #6366f1;
          border-radius: 4px;
          position: relative;
        }

        .origin-marker {
          position: absolute;
          width: 8px;
          height: 8px;
          background: #ef4444;
          border: 2px solid white;
          border-radius: 50%;
          transform: translate(-50%, -50%);
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

        .advanced-section {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 12px;
          background: #f9fafb;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
        }

        .skew-grid, .rotate-3d-grid {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .skew-field, .rotate-3d-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .skew-control, .rotate-3d-control {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .skew-slider, .rotate-3d-slider {
          flex: 1;
          height: 4px;
          border-radius: 2px;
          background: #e5e7eb;
          cursor: pointer;
          -webkit-appearance: none;
        }

        .skew-slider::-webkit-slider-thumb,
        .rotate-3d-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
        }

        .rotate-3d-value {
          font-size: 11px;
          font-family: monospace;
          color: #374151;
          min-width: 40px;
          text-align: right;
        }

        .field-row {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .mini-label {
          font-size: 10px;
          font-weight: 500;
          color: #9ca3af;
        }

        .perspective-input {
          width: 100%;
          padding: 6px 8px;
          font-size: 11px;
          border: 1px solid #e5e7eb;
          border-radius: 4px;
          font-family: monospace;
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

        .reset-btn {
          padding: 8px 16px;
          font-size: 11px;
          font-weight: 500;
          color: #6b7280;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          cursor: pointer;
        }

        .reset-btn:hover {
          background: #f3f4f6;
        }
      `}</style>
    </div>
  );
}

// Helper to convert settings to CSS
export function getTransformStyles(settings?: TransformSettings): React.CSSProperties {
  if (!settings) return {};

  const transforms: string[] = [];

  // Translate
  if (settings.translateX || settings.translateY || settings.translateZ) {
    if (settings.translateZ) {
      transforms.push(`translate3d(${settings.translateX || "0"}, ${settings.translateY || "0"}, ${settings.translateZ})`);
    } else if (settings.translateX || settings.translateY) {
      transforms.push(`translate(${settings.translateX || "0"}, ${settings.translateY || "0"})`);
    }
  }

  // Rotate
  if (settings.rotateX || settings.rotateY) {
    if (settings.rotateX) transforms.push(`rotateX(${settings.rotateX}deg)`);
    if (settings.rotateY) transforms.push(`rotateY(${settings.rotateY}deg)`);
  }
  if (settings.rotate && settings.rotate !== 0) {
    transforms.push(`rotate(${settings.rotate}deg)`);
  }

  // Scale
  if (settings.scaleX !== undefined || settings.scaleY !== undefined) {
    transforms.push(`scale(${settings.scaleX ?? settings.scale ?? 1}, ${settings.scaleY ?? settings.scale ?? 1})`);
  } else if (settings.scale !== undefined && settings.scale !== 1) {
    transforms.push(`scale(${settings.scale})`);
  }

  // Skew
  if ((settings.skewX && settings.skewX !== 0) || (settings.skewY && settings.skewY !== 0)) {
    transforms.push(`skew(${settings.skewX || 0}deg, ${settings.skewY || 0}deg)`);
  }

  return {
    transform: transforms.length > 0 ? transforms.join(" ") : undefined,
    transformOrigin: settings.transformOrigin,
    perspective: settings.perspective,
    backfaceVisibility: settings.backfaceVisibility,
  };
}
