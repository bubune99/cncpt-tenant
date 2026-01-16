"use client";

import React, { useState } from "react";

export interface BackgroundSettings {
  type: "none" | "color" | "gradient" | "image";
  // Color settings
  color?: string;
  // Gradient settings
  gradientType?: "linear" | "radial";
  gradientAngle?: number;
  gradientColors?: { color: string; position: number }[];
  // Image settings
  imageUrl?: string;
  imageSize?: "cover" | "contain" | "auto" | "100% 100%";
  imagePosition?: string;
  imageRepeat?: "no-repeat" | "repeat" | "repeat-x" | "repeat-y";
  imageAttachment?: "scroll" | "fixed";
  // Overlay settings
  overlayEnabled?: boolean;
  overlayColor?: string;
  overlayOpacity?: number;
  // Effects
  blur?: number;
}

export const defaultBackgroundSettings: BackgroundSettings = {
  type: "none",
  color: "#ffffff",
  gradientType: "linear",
  gradientAngle: 180,
  gradientColors: [
    { color: "#3b82f6", position: 0 },
    { color: "#8b5cf6", position: 100 },
  ],
  imageUrl: "",
  imageSize: "cover",
  imagePosition: "center center",
  imageRepeat: "no-repeat",
  imageAttachment: "scroll",
  overlayEnabled: false,
  overlayColor: "#000000",
  overlayOpacity: 50,
  blur: 0,
};

interface BackgroundFieldProps {
  value: BackgroundSettings;
  onChange: (value: BackgroundSettings) => void;
}

export function BackgroundField({ value, onChange }: BackgroundFieldProps) {
  const settings = { ...defaultBackgroundSettings, ...value };
  const [expandedSection, setExpandedSection] = useState<string | null>(
    settings.type !== "none" ? settings.type : null
  );

  const updateSettings = (updates: Partial<BackgroundSettings>) => {
    onChange({ ...settings, ...updates });
  };

  const addGradientStop = () => {
    const colors = settings.gradientColors || [];
    const newPosition = colors.length > 0 ? Math.min(100, colors[colors.length - 1].position + 25) : 50;
    updateSettings({
      gradientColors: [...colors, { color: "#ffffff", position: newPosition }],
    });
  };

  const removeGradientStop = (index: number) => {
    const colors = settings.gradientColors || [];
    if (colors.length > 2) {
      updateSettings({
        gradientColors: colors.filter((_, i) => i !== index),
      });
    }
  };

  const updateGradientColor = (index: number, updates: { color?: string; position?: number }) => {
    const colors = [...(settings.gradientColors || [])];
    colors[index] = { ...colors[index], ...updates };
    updateSettings({ gradientColors: colors });
  };

  return (
    <div className="background-field">
      {/* Background Type Selector */}
      <div className="type-selector">
        <label className="field-label">Background Type</label>
        <div className="type-buttons">
          {(["none", "color", "gradient", "image"] as const).map((type) => (
            <button
              key={type}
              className={`type-btn ${settings.type === type ? "active" : ""}`}
              onClick={() => {
                updateSettings({ type });
                setExpandedSection(type !== "none" ? type : null);
              }}
            >
              {type === "none" && "None"}
              {type === "color" && "Color"}
              {type === "gradient" && "Gradient"}
              {type === "image" && "Image"}
            </button>
          ))}
        </div>
      </div>

      {/* Color Settings */}
      {settings.type === "color" && (
        <div className="settings-section">
          <div className="field-row">
            <label className="field-label">Background Color</label>
            <div className="color-input-wrapper">
              <input
                type="color"
                value={settings.color || "#ffffff"}
                onChange={(e) => updateSettings({ color: e.target.value })}
                className="color-picker"
              />
              <input
                type="text"
                value={settings.color || "#ffffff"}
                onChange={(e) => updateSettings({ color: e.target.value })}
                className="color-text"
                placeholder="#ffffff"
              />
            </div>
          </div>
        </div>
      )}

      {/* Gradient Settings */}
      {settings.type === "gradient" && (
        <div className="settings-section">
          <div className="field-row">
            <label className="field-label">Gradient Type</label>
            <select
              value={settings.gradientType}
              onChange={(e) => updateSettings({ gradientType: e.target.value as "linear" | "radial" })}
              className="select-field"
            >
              <option value="linear">Linear</option>
              <option value="radial">Radial</option>
            </select>
          </div>

          {settings.gradientType === "linear" && (
            <div className="field-row">
              <label className="field-label">Angle: {settings.gradientAngle}°</label>
              <input
                type="range"
                min="0"
                max="360"
                value={settings.gradientAngle}
                onChange={(e) => updateSettings({ gradientAngle: Number(e.target.value) })}
                className="range-slider"
              />
            </div>
          )}

          <div className="gradient-stops">
            <label className="field-label">Color Stops</label>
            {(settings.gradientColors || []).map((stop, index) => (
              <div key={index} className="gradient-stop">
                <input
                  type="color"
                  value={stop.color}
                  onChange={(e) => updateGradientColor(index, { color: e.target.value })}
                  className="color-picker-small"
                />
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={stop.position}
                  onChange={(e) => updateGradientColor(index, { position: Number(e.target.value) })}
                  className="position-input"
                />
                <span className="percent">%</span>
                {(settings.gradientColors || []).length > 2 && (
                  <button
                    onClick={() => removeGradientStop(index)}
                    className="remove-stop-btn"
                    title="Remove color stop"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            <button onClick={addGradientStop} className="add-stop-btn">
              + Add Color Stop
            </button>
          </div>

          {/* Gradient Preview */}
          <div className="gradient-preview" style={{ background: getGradientCSS(settings) }} />
        </div>
      )}

      {/* Image Settings */}
      {settings.type === "image" && (
        <div className="settings-section">
          <div className="field-row">
            <label className="field-label">Image URL</label>
            <input
              type="text"
              value={settings.imageUrl || ""}
              onChange={(e) => updateSettings({ imageUrl: e.target.value })}
              className="text-input"
              placeholder="https://example.com/image.jpg"
            />
          </div>

          {settings.imageUrl && (
            <div className="image-preview">
              <img src={settings.imageUrl} alt="Background preview" />
            </div>
          )}

          <div className="field-row">
            <label className="field-label">Size</label>
            <select
              value={settings.imageSize}
              onChange={(e) => updateSettings({ imageSize: e.target.value as BackgroundSettings["imageSize"] })}
              className="select-field"
            >
              <option value="cover">Cover (fill area)</option>
              <option value="contain">Contain (fit inside)</option>
              <option value="auto">Auto (original size)</option>
              <option value="100% 100%">Stretch to fit</option>
            </select>
          </div>

          <div className="field-row">
            <label className="field-label">Position</label>
            <select
              value={settings.imagePosition}
              onChange={(e) => updateSettings({ imagePosition: e.target.value })}
              className="select-field"
            >
              <option value="center center">Center</option>
              <option value="top center">Top</option>
              <option value="bottom center">Bottom</option>
              <option value="left center">Left</option>
              <option value="right center">Right</option>
              <option value="top left">Top Left</option>
              <option value="top right">Top Right</option>
              <option value="bottom left">Bottom Left</option>
              <option value="bottom right">Bottom Right</option>
            </select>
          </div>

          <div className="field-row">
            <label className="field-label">Repeat</label>
            <select
              value={settings.imageRepeat}
              onChange={(e) => updateSettings({ imageRepeat: e.target.value as BackgroundSettings["imageRepeat"] })}
              className="select-field"
            >
              <option value="no-repeat">No Repeat</option>
              <option value="repeat">Repeat</option>
              <option value="repeat-x">Repeat X</option>
              <option value="repeat-y">Repeat Y</option>
            </select>
          </div>

          <div className="field-row">
            <label className="field-label">Attachment</label>
            <select
              value={settings.imageAttachment}
              onChange={(e) => updateSettings({ imageAttachment: e.target.value as "scroll" | "fixed" })}
              className="select-field"
            >
              <option value="scroll">Scroll (normal)</option>
              <option value="fixed">Fixed (parallax effect)</option>
            </select>
          </div>
        </div>
      )}

      {/* Overlay Settings - Available for gradient and image */}
      {(settings.type === "gradient" || settings.type === "image") && (
        <div className="settings-section overlay-section">
          <div className="field-row">
            <label className="field-label">Enable Overlay</label>
            <button
              className={`toggle-btn ${settings.overlayEnabled ? "active" : ""}`}
              onClick={() => updateSettings({ overlayEnabled: !settings.overlayEnabled })}
            >
              {settings.overlayEnabled ? "ON" : "OFF"}
            </button>
          </div>

          {settings.overlayEnabled && (
            <>
              <div className="field-row">
                <label className="field-label">Overlay Color</label>
                <div className="color-input-wrapper">
                  <input
                    type="color"
                    value={settings.overlayColor || "#000000"}
                    onChange={(e) => updateSettings({ overlayColor: e.target.value })}
                    className="color-picker"
                  />
                  <input
                    type="text"
                    value={settings.overlayColor || "#000000"}
                    onChange={(e) => updateSettings({ overlayColor: e.target.value })}
                    className="color-text"
                  />
                </div>
              </div>

              <div className="field-row">
                <label className="field-label">Overlay Opacity: {settings.overlayOpacity}%</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.overlayOpacity}
                  onChange={(e) => updateSettings({ overlayOpacity: Number(e.target.value) })}
                  className="range-slider"
                />
              </div>
            </>
          )}
        </div>
      )}

      {/* Blur Effect - Available for image */}
      {settings.type === "image" && (
        <div className="settings-section">
          <div className="field-row">
            <label className="field-label">Blur: {settings.blur || 0}px</label>
            <input
              type="range"
              min="0"
              max="20"
              value={settings.blur || 0}
              onChange={(e) => updateSettings({ blur: Number(e.target.value) })}
              className="range-slider"
            />
          </div>
        </div>
      )}

      <style>{`
        .background-field {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .field-label {
          display: block;
          font-size: 11px;
          font-weight: 500;
          color: #6b7280;
          margin-bottom: 6px;
        }

        .type-selector {
          margin-bottom: 8px;
        }

        .type-buttons {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 4px;
        }

        .type-btn {
          padding: 8px 4px;
          font-size: 11px;
          font-weight: 500;
          background: #f3f4f6;
          color: #6b7280;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .type-btn:hover {
          background: #e5e7eb;
        }

        .type-btn.active {
          background: #3b82f6;
          color: white;
          border-color: #3b82f6;
        }

        .settings-section {
          background: #f9fafb;
          border-radius: 8px;
          padding: 12px;
          border: 1px solid #e5e7eb;
        }

        .field-row {
          margin-bottom: 12px;
        }

        .field-row:last-child {
          margin-bottom: 0;
        }

        .color-input-wrapper {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .color-picker {
          width: 40px;
          height: 32px;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          cursor: pointer;
          padding: 2px;
        }

        .color-picker-small {
          width: 32px;
          height: 28px;
          border: 1px solid #e5e7eb;
          border-radius: 4px;
          cursor: pointer;
          padding: 2px;
        }

        .color-text {
          flex: 1;
          padding: 8px;
          font-size: 12px;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          font-family: monospace;
        }

        .text-input, .select-field {
          width: 100%;
          padding: 8px 10px;
          font-size: 12px;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          background: white;
        }

        .select-field {
          cursor: pointer;
        }

        .range-slider {
          width: 100%;
          height: 6px;
          border-radius: 3px;
          background: #e5e7eb;
          cursor: pointer;
        }

        .gradient-stops {
          margin-top: 12px;
        }

        .gradient-stop {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }

        .position-input {
          width: 60px;
          padding: 6px 8px;
          font-size: 12px;
          border: 1px solid #e5e7eb;
          border-radius: 4px;
          text-align: center;
        }

        .percent {
          font-size: 12px;
          color: #6b7280;
        }

        .remove-stop-btn {
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #fee2e2;
          color: #ef4444;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
          font-weight: bold;
        }

        .remove-stop-btn:hover {
          background: #fecaca;
        }

        .add-stop-btn {
          width: 100%;
          padding: 8px;
          font-size: 12px;
          font-weight: 500;
          background: #eff6ff;
          color: #3b82f6;
          border: 1px dashed #3b82f6;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .add-stop-btn:hover {
          background: #dbeafe;
        }

        .gradient-preview {
          height: 40px;
          border-radius: 6px;
          margin-top: 12px;
          border: 1px solid #e5e7eb;
        }

        .image-preview {
          width: 100%;
          height: 100px;
          border-radius: 6px;
          overflow: hidden;
          margin-bottom: 12px;
          background: #f3f4f6;
          border: 1px solid #e5e7eb;
        }

        .image-preview img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .overlay-section {
          border-color: #fbbf24;
          background: #fffbeb;
        }

        .toggle-btn {
          padding: 6px 16px;
          font-size: 11px;
          font-weight: 600;
          border-radius: 20px;
          border: none;
          cursor: pointer;
          transition: all 0.15s ease;
          background: #f3f4f6;
          color: #6b7280;
        }

        .toggle-btn.active {
          background: #10b981;
          color: white;
        }
      `}</style>
    </div>
  );
}

// Helper function to generate gradient CSS
function getGradientCSS(settings: BackgroundSettings): string {
  const colors = settings.gradientColors || [];
  const colorStops = colors
    .sort((a, b) => a.position - b.position)
    .map((stop) => `${stop.color} ${stop.position}%`)
    .join(", ");

  if (settings.gradientType === "radial") {
    return `radial-gradient(circle, ${colorStops})`;
  }
  return `linear-gradient(${settings.gradientAngle}deg, ${colorStops})`;
}

// Helper function to generate background styles
export function getBackgroundStyles(settings?: BackgroundSettings): React.CSSProperties {
  if (!settings || settings.type === "none") {
    return {};
  }

  const styles: React.CSSProperties = {};

  if (settings.type === "color") {
    styles.backgroundColor = settings.color;
  } else if (settings.type === "gradient") {
    styles.background = getGradientCSS(settings);
  } else if (settings.type === "image" && settings.imageUrl) {
    styles.backgroundImage = `url(${settings.imageUrl})`;
    styles.backgroundSize = settings.imageSize;
    styles.backgroundPosition = settings.imagePosition;
    styles.backgroundRepeat = settings.imageRepeat;
    styles.backgroundAttachment = settings.imageAttachment;
  }

  return styles;
}

// Helper function to generate overlay element
export function BackgroundOverlay({ settings }: { settings?: BackgroundSettings }) {
  if (!settings?.overlayEnabled) {
    return null;
  }

  const opacity = (settings.overlayOpacity || 50) / 100;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: settings.overlayColor || "#000000",
        opacity,
        pointerEvents: "none",
        zIndex: 0,
      }}
    />
  );
}

// Helper for blur effect wrapper
export function getBlurStyles(settings?: BackgroundSettings): React.CSSProperties {
  if (!settings?.blur || settings.blur === 0) {
    return {};
  }

  return {
    filter: `blur(${settings.blur}px)`,
  };
}
