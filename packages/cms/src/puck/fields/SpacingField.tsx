"use client";

import { useState } from "react";

interface SpacingValue {
  top?: string;
  right?: string;
  bottom?: string;
  left?: string;
}

interface SpacingFieldProps {
  value: string | SpacingValue;
  onChange: (value: string) => void;
  label?: string;
  type?: "padding" | "margin";
}

const presetValues = ["0px", "8px", "16px", "24px", "32px", "48px", "64px", "80px"];

export function SpacingField({
  value,
  onChange,
  label,
  type = "padding",
}: SpacingFieldProps) {
  const [mode, setMode] = useState<"uniform" | "advanced">("uniform");

  // Parse value to determine if it's uniform or individual
  const parseValue = (val: string | SpacingValue): SpacingValue => {
    if (typeof val !== "string") return val;
    const parts = val.split(" ");
    switch (parts.length) {
      case 1:
        return { top: parts[0], right: parts[0], bottom: parts[0], left: parts[0] };
      case 2:
        return { top: parts[0], right: parts[1], bottom: parts[0], left: parts[1] };
      case 3:
        return { top: parts[0], right: parts[1], bottom: parts[2], left: parts[1] };
      case 4:
        return { top: parts[0], right: parts[1], bottom: parts[2], left: parts[3] };
      default:
        return { top: "0px", right: "0px", bottom: "0px", left: "0px" };
    }
  };

  const spacing = parseValue(value);

  const handleUniformChange = (newValue: string) => {
    onChange(newValue);
  };

  const handleSideChange = (side: keyof SpacingValue, newValue: string) => {
    const updated = { ...spacing, [side]: newValue };
    onChange(`${updated.top} ${updated.right} ${updated.bottom} ${updated.left}`);
  };

  const uniformValue = spacing.top === spacing.right &&
    spacing.right === spacing.bottom &&
    spacing.bottom === spacing.left
    ? spacing.top
    : undefined;

  return (
    <div className="spacing-field">
      {/* Mode Toggle */}
      <div className="mode-toggle">
        <button
          type="button"
          className={`mode-btn ${mode === "uniform" ? "active" : ""}`}
          onClick={() => setMode("uniform")}
        >
          Uniform
        </button>
        <button
          type="button"
          className={`mode-btn ${mode === "advanced" ? "active" : ""}`}
          onClick={() => setMode("advanced")}
        >
          Individual
        </button>
      </div>

      {mode === "uniform" ? (
        <div className="uniform-control">
          <div className="preset-row">
            {presetValues.map((preset) => (
              <button
                key={preset}
                type="button"
                className={`preset-btn ${uniformValue === preset ? "active" : ""}`}
                onClick={() => handleUniformChange(preset)}
              >
                {parseInt(preset)}
              </button>
            ))}
          </div>
          <input
            type="text"
            className="custom-input"
            value={uniformValue || spacing.top}
            onChange={(e) => handleUniformChange(e.target.value)}
            placeholder="e.g., 16px"
          />
        </div>
      ) : (
        <div className="individual-control">
          <div className="spacing-visual">
            <div className="visual-box">
              <input
                type="text"
                className="side-input top"
                value={spacing.top}
                onChange={(e) => handleSideChange("top", e.target.value)}
                placeholder="top"
              />
              <div className="side-row">
                <input
                  type="text"
                  className="side-input left"
                  value={spacing.left}
                  onChange={(e) => handleSideChange("left", e.target.value)}
                  placeholder="left"
                />
                <div className="center-box">{type}</div>
                <input
                  type="text"
                  className="side-input right"
                  value={spacing.right}
                  onChange={(e) => handleSideChange("right", e.target.value)}
                  placeholder="right"
                />
              </div>
              <input
                type="text"
                className="side-input bottom"
                value={spacing.bottom}
                onChange={(e) => handleSideChange("bottom", e.target.value)}
                placeholder="bottom"
              />
            </div>
          </div>
        </div>
      )}

      <style>{`
        .spacing-field {
          background: #f8fafc;
          border-radius: 8px;
          padding: 12px;
        }

        .mode-toggle {
          display: flex;
          gap: 4px;
          margin-bottom: 12px;
        }

        .mode-btn {
          flex: 1;
          padding: 6px 12px;
          font-size: 12px;
          font-weight: 500;
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

        .mode-btn.active {
          background: #3b82f6;
          border-color: #3b82f6;
          color: white;
        }

        .preset-row {
          display: flex;
          gap: 4px;
          margin-bottom: 8px;
        }

        .preset-btn {
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

        .preset-btn:hover {
          border-color: #d1d5db;
        }

        .preset-btn.active {
          background: #eff6ff;
          border-color: #3b82f6;
          color: #3b82f6;
        }

        .custom-input {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 13px;
        }

        .spacing-visual {
          display: flex;
          justify-content: center;
        }

        .visual-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 16px;
          background: #e5e7eb;
          border-radius: 8px;
        }

        .side-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .side-input {
          width: 50px;
          padding: 6px;
          font-size: 11px;
          text-align: center;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          background: white;
        }

        .center-box {
          width: 60px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: white;
          border: 2px dashed #d1d5db;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 500;
          color: #9ca3af;
          text-transform: uppercase;
        }
      `}</style>
    </div>
  );
}
