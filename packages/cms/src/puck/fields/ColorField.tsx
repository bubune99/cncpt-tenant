"use client";

import { useState, useRef, useEffect } from "react";

interface ColorFieldProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  presets?: string[];
}

const defaultPresets = [
  "#ffffff", "#f8fafc", "#f1f5f9", "#e2e8f0",
  "#1a1a1a", "#374151", "#6b7280", "#9ca3af",
  "#3b82f6", "#2563eb", "#1d4ed8", "#1e40af",
  "#10b981", "#059669", "#047857", "#065f46",
  "#f59e0b", "#d97706", "#b45309", "#92400e",
  "#ef4444", "#dc2626", "#b91c1c", "#991b1b",
  "#8b5cf6", "#7c3aed", "#6d28d9", "#5b21b6",
  "#ec4899", "#db2777", "#be185d", "#9d174d",
];

export function ColorField({
  value,
  onChange,
  label,
  presets = defaultPresets,
}: ColorFieldProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [inputValue, setInputValue] = useState(value || "#ffffff");
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInputValue(value || "#ffffff");
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setShowPicker(false);
      }
    }

    if (showPicker) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showPicker]);

  const handleInputChange = (newValue: string) => {
    setInputValue(newValue);
    if (/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(newValue)) {
      onChange(newValue);
    }
  };

  const handlePresetClick = (color: string) => {
    setInputValue(color);
    onChange(color);
    setShowPicker(false);
  };

  return (
    <div className="color-field" ref={pickerRef}>
      <div className="color-input-wrapper">
        <button
          type="button"
          className="color-swatch"
          style={{ backgroundColor: value || "#ffffff" }}
          onClick={() => setShowPicker(!showPicker)}
        />
        <input
          type="text"
          className="color-text-input"
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder="#000000"
        />
        <input
          type="color"
          className="color-native-input"
          value={value || "#ffffff"}
          onChange={(e) => {
            setInputValue(e.target.value);
            onChange(e.target.value);
          }}
        />
      </div>

      {showPicker && (
        <div className="color-picker-dropdown">
          <div className="preset-grid">
            {presets.map((color) => (
              <button
                key={color}
                type="button"
                className={`preset-swatch ${value === color ? "active" : ""}`}
                style={{ backgroundColor: color }}
                onClick={() => handlePresetClick(color)}
                title={color}
              />
            ))}
          </div>
          <div className="custom-color-row">
            <span className="custom-label">Custom:</span>
            <input
              type="color"
              className="custom-color-picker"
              value={value || "#ffffff"}
              onChange={(e) => {
                setInputValue(e.target.value);
                onChange(e.target.value);
              }}
            />
          </div>
        </div>
      )}

      <style>{`
        .color-field {
          position: relative;
        }

        .color-input-wrapper {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px;
          background: white;
          border: 1px solid #d1d5db;
          border-radius: 6px;
        }

        .color-swatch {
          width: 28px;
          height: 28px;
          border-radius: 4px;
          border: 1px solid #e5e7eb;
          cursor: pointer;
          flex-shrink: 0;
        }

        .color-text-input {
          flex: 1;
          border: none;
          outline: none;
          font-family: monospace;
          font-size: 13px;
          padding: 0;
          min-width: 0;
        }

        .color-native-input {
          width: 28px;
          height: 28px;
          padding: 0;
          border: none;
          cursor: pointer;
          border-radius: 4px;
          overflow: hidden;
        }

        .color-picker-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          margin-top: 4px;
          padding: 12px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
          z-index: 100;
        }

        .preset-grid {
          display: grid;
          grid-template-columns: repeat(8, 1fr);
          gap: 4px;
        }

        .preset-swatch {
          width: 100%;
          aspect-ratio: 1;
          border-radius: 4px;
          border: 1px solid #e5e7eb;
          cursor: pointer;
          transition: transform 0.1s ease;
        }

        .preset-swatch:hover {
          transform: scale(1.15);
          z-index: 1;
        }

        .preset-swatch.active {
          outline: 2px solid #3b82f6;
          outline-offset: 1px;
        }

        .custom-color-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid #e5e7eb;
        }

        .custom-label {
          font-size: 12px;
          color: #6b7280;
        }

        .custom-color-picker {
          flex: 1;
          height: 32px;
          border: 1px solid #e5e7eb;
          border-radius: 4px;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
