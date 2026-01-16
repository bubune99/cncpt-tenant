"use client";

import { useState } from "react";
import { AnimationConfig, defaultAnimationConfig } from "../animations/types";
import { entrancePresets, attentionPresets } from "../animations/presets";

interface AnimationFieldProps {
  value: Partial<AnimationConfig>;
  onChange: (value: Partial<AnimationConfig>) => void;
}

export function AnimationField({ value, onChange }: AnimationFieldProps) {
  const config = { ...defaultAnimationConfig, ...value };
  const [expanded, setExpanded] = useState(false);

  const updateConfig = (updates: Partial<AnimationConfig>) => {
    onChange({ ...config, ...updates });
  };

  return (
    <div className="animation-field">
      {/* Enable Toggle */}
      <div className="field-row toggle-row">
        <label>Enable Animation</label>
        <button
          className={`toggle-btn ${config.enabled ? "active" : ""}`}
          onClick={() => updateConfig({ enabled: !config.enabled })}
        >
          {config.enabled ? "ON" : "OFF"}
        </button>
      </div>

      {config.enabled && (
        <>
          {/* Preset Selection */}
          <div className="field-group">
            <label>Entrance Animation</label>
            <div className="preset-grid">
              {entrancePresets.map((preset) => (
                <button
                  key={preset.id}
                  className={`preset-btn ${config.type === preset.config.type && config.direction === preset.config.direction ? "active" : ""}`}
                  onClick={() => updateConfig({
                    type: preset.config.type || "fade",
                    direction: preset.config.direction,
                    duration: preset.config.duration || 0.5,
                    easing: preset.config.easing || "easeOut",
                  })}
                  title={preset.description}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* Trigger */}
          <div className="field-group">
            <label>Trigger</label>
            <div className="button-group">
              {(["onLoad", "onScroll"] as const).map((trigger) => (
                <button
                  key={trigger}
                  className={`option-btn ${config.trigger === trigger ? "active" : ""}`}
                  onClick={() => updateConfig({ trigger })}
                >
                  {trigger === "onLoad" ? "On Load" : "On Scroll"}
                </button>
              ))}
            </div>
          </div>

          {/* Advanced Settings Toggle */}
          <button
            className="advanced-toggle"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? "▼" : "▶"} Advanced Settings
          </button>

          {expanded && (
            <div className="advanced-settings">
              {/* Duration */}
              <div className="field-row">
                <label>Duration</label>
                <input
                  type="range"
                  min="0.1"
                  max="2"
                  step="0.1"
                  value={config.duration}
                  onChange={(e) => updateConfig({ duration: parseFloat(e.target.value) })}
                />
                <span className="value">{config.duration}s</span>
              </div>

              {/* Delay */}
              <div className="field-row">
                <label>Delay</label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={config.delay}
                  onChange={(e) => updateConfig({ delay: parseFloat(e.target.value) })}
                />
                <span className="value">{config.delay}s</span>
              </div>

              {/* Easing */}
              <div className="field-group">
                <label>Easing</label>
                <select
                  value={config.easing}
                  onChange={(e) => updateConfig({ easing: e.target.value as AnimationConfig["easing"] })}
                >
                  <option value="linear">Linear</option>
                  <option value="easeIn">Ease In</option>
                  <option value="easeOut">Ease Out</option>
                  <option value="easeInOut">Ease In Out</option>
                  <option value="spring">Spring</option>
                </select>
              </div>

              {/* Scroll Threshold */}
              {config.trigger === "onScroll" && (
                <div className="field-row">
                  <label>Scroll Threshold</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={config.scrollTrigger?.threshold || 0.2}
                    onChange={(e) => updateConfig({
                      scrollTrigger: {
                        ...config.scrollTrigger,
                        threshold: parseFloat(e.target.value),
                        once: config.scrollTrigger?.once ?? true,
                      }
                    })}
                  />
                  <span className="value">{Math.round((config.scrollTrigger?.threshold || 0.2) * 100)}%</span>
                </div>
              )}
            </div>
          )}

          {/* Hover Animation */}
          <div className="field-group">
            <label>Hover Effect</label>
            <div className="preset-grid small">
              <button
                className={`preset-btn ${!config.hover ? "active" : ""}`}
                onClick={() => updateConfig({ hover: undefined })}
              >
                None
              </button>
              {attentionPresets.map((preset) => (
                <button
                  key={preset.id}
                  className={`preset-btn ${JSON.stringify(config.hover) === JSON.stringify(preset.config.hover) ? "active" : ""}`}
                  onClick={() => updateConfig({ hover: preset.config.hover })}
                  title={preset.description}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      <style>{`
        .animation-field {
          padding: 12px;
          background: #f8fafc;
          border-radius: 8px;
          font-size: 13px;
        }

        .field-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .field-row label {
          font-weight: 500;
          color: #374151;
        }

        .field-row input[type="range"] {
          flex: 1;
          margin: 0 12px;
        }

        .field-row .value {
          font-family: monospace;
          font-size: 12px;
          color: #6b7280;
          min-width: 40px;
          text-align: right;
        }

        .toggle-row {
          padding-bottom: 12px;
          border-bottom: 1px solid #e5e7eb;
        }

        .toggle-btn {
          padding: 6px 16px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          border: none;
          cursor: pointer;
          transition: all 0.15s ease;
          background: #e5e7eb;
          color: #6b7280;
        }

        .toggle-btn.active {
          background: #3b82f6;
          color: white;
        }

        .field-group {
          margin: 12px 0;
        }

        .field-group label {
          display: block;
          font-weight: 500;
          color: #374151;
          margin-bottom: 8px;
        }

        .field-group select {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 13px;
          background: white;
        }

        .preset-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 6px;
        }

        .preset-grid.small {
          grid-template-columns: repeat(2, 1fr);
        }

        .preset-btn {
          padding: 8px 10px;
          font-size: 11px;
          font-weight: 500;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          background: white;
          color: #6b7280;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .preset-btn:hover {
          border-color: #d1d5db;
          color: #374151;
        }

        .preset-btn.active {
          background: #3b82f6;
          border-color: #3b82f6;
          color: white;
        }

        .button-group {
          display: flex;
          gap: 8px;
        }

        .option-btn {
          flex: 1;
          padding: 8px 12px;
          font-size: 12px;
          font-weight: 500;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          background: white;
          color: #6b7280;
          cursor: pointer;
        }

        .option-btn.active {
          background: #eff6ff;
          border-color: #3b82f6;
          color: #3b82f6;
        }

        .advanced-toggle {
          width: 100%;
          padding: 8px;
          margin: 8px 0;
          font-size: 12px;
          font-weight: 500;
          color: #6b7280;
          background: none;
          border: none;
          cursor: pointer;
          text-align: left;
        }

        .advanced-toggle:hover {
          color: #374151;
        }

        .advanced-settings {
          padding: 12px;
          background: #ffffff;
          border-radius: 6px;
          border: 1px solid #e5e7eb;
        }
      `}</style>
    </div>
  );
}
