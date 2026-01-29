"use client";

import { useState } from "react";
import { BrandPreset } from "../presets/types";
import { modernBlue } from "../presets/defaults";

interface PresetEditorProps {
  preset?: BrandPreset;
  onSave: (preset: BrandPreset) => void;
  onCancel: () => void;
}

export function PresetEditor({ preset, onSave, onCancel }: PresetEditorProps) {
  const [editedPreset, setEditedPreset] = useState<BrandPreset>(
    preset || { ...modernBlue, id: "", name: "", description: "", isCustom: true }
  );

  const updateColor = (key: keyof BrandPreset["colors"], value: string) => {
    setEditedPreset((prev) => ({
      ...prev,
      colors: { ...prev.colors, [key]: value },
    }));
  };

  const updateTypography = (key: keyof BrandPreset["typography"], value: string) => {
    setEditedPreset((prev) => ({
      ...prev,
      typography: { ...prev.typography, [key]: value },
    }));
  };

  const updateSpacing = (key: keyof BrandPreset["spacing"], value: string) => {
    setEditedPreset((prev) => ({
      ...prev,
      spacing: { ...prev.spacing, [key]: value },
    }));
  };

  const updateBorders = (key: keyof BrandPreset["borders"], value: string) => {
    setEditedPreset((prev) => ({
      ...prev,
      borders: { ...prev.borders, [key]: value },
    }));
  };

  const handleSave = () => {
    if (!editedPreset.name) {
      alert("Please enter a preset name");
      return;
    }
    const id = editedPreset.id || editedPreset.name.toLowerCase().replace(/\s+/g, "-");
    onSave({ ...editedPreset, id });
  };

  return (
    <div className="preset-editor-overlay">
      <div className="preset-editor">
        <div className="preset-editor-header">
          <h2>{preset ? "Edit Preset" : "Create Custom Preset"}</h2>
          <button className="close-btn" onClick={onCancel}>×</button>
        </div>

        <div className="preset-editor-content">
          {/* Basic Info */}
          <section className="editor-section">
            <h3>Basic Info</h3>
            <div className="field-group">
              <label>Name</label>
              <input
                type="text"
                value={editedPreset.name}
                onChange={(e) => setEditedPreset((p) => ({ ...p, name: e.target.value }))}
                placeholder="My Brand"
              />
            </div>
            <div className="field-group">
              <label>Description</label>
              <input
                type="text"
                value={editedPreset.description}
                onChange={(e) => setEditedPreset((p) => ({ ...p, description: e.target.value }))}
                placeholder="Short description"
              />
            </div>
          </section>

          {/* Colors */}
          <section className="editor-section">
            <h3>Colors</h3>
            <div className="color-grid">
              <ColorField label="Primary" value={editedPreset.colors.primary} onChange={(v) => updateColor("primary", v)} />
              <ColorField label="Primary Hover" value={editedPreset.colors.primaryHover} onChange={(v) => updateColor("primaryHover", v)} />
              <ColorField label="Secondary" value={editedPreset.colors.secondary} onChange={(v) => updateColor("secondary", v)} />
              <ColorField label="Accent" value={editedPreset.colors.accent} onChange={(v) => updateColor("accent", v)} />
              <ColorField label="Background" value={editedPreset.colors.background} onChange={(v) => updateColor("background", v)} />
              <ColorField label="Background Alt" value={editedPreset.colors.backgroundAlt} onChange={(v) => updateColor("backgroundAlt", v)} />
              <ColorField label="Background Dark" value={editedPreset.colors.backgroundDark} onChange={(v) => updateColor("backgroundDark", v)} />
              <ColorField label="Text" value={editedPreset.colors.text} onChange={(v) => updateColor("text", v)} />
              <ColorField label="Text Muted" value={editedPreset.colors.textMuted} onChange={(v) => updateColor("textMuted", v)} />
              <ColorField label="Text on Primary" value={editedPreset.colors.textOnPrimary} onChange={(v) => updateColor("textOnPrimary", v)} />
              <ColorField label="Text on Dark" value={editedPreset.colors.textOnDark} onChange={(v) => updateColor("textOnDark", v)} />
              <ColorField label="Border" value={editedPreset.colors.border} onChange={(v) => updateColor("border", v)} />
            </div>
          </section>

          {/* Typography */}
          <section className="editor-section">
            <h3>Typography</h3>
            <div className="field-row">
              <div className="field-group">
                <label>H1 Size</label>
                <input type="text" value={editedPreset.typography.h1Size} onChange={(e) => updateTypography("h1Size", e.target.value)} />
              </div>
              <div className="field-group">
                <label>H2 Size</label>
                <input type="text" value={editedPreset.typography.h2Size} onChange={(e) => updateTypography("h2Size", e.target.value)} />
              </div>
              <div className="field-group">
                <label>H3 Size</label>
                <input type="text" value={editedPreset.typography.h3Size} onChange={(e) => updateTypography("h3Size", e.target.value)} />
              </div>
            </div>
            <div className="field-row">
              <div className="field-group">
                <label>Body Size</label>
                <input type="text" value={editedPreset.typography.bodySize} onChange={(e) => updateTypography("bodySize", e.target.value)} />
              </div>
              <div className="field-group">
                <label>Heading Weight</label>
                <input type="text" value={editedPreset.typography.headingWeight} onChange={(e) => updateTypography("headingWeight", e.target.value)} />
              </div>
              <div className="field-group">
                <label>Body Weight</label>
                <input type="text" value={editedPreset.typography.bodyWeight} onChange={(e) => updateTypography("bodyWeight", e.target.value)} />
              </div>
            </div>
          </section>

          {/* Spacing */}
          <section className="editor-section">
            <h3>Spacing</h3>
            <div className="field-row">
              <div className="field-group">
                <label>Section Padding Y</label>
                <input type="text" value={editedPreset.spacing.sectionPaddingY} onChange={(e) => updateSpacing("sectionPaddingY", e.target.value)} />
              </div>
              <div className="field-group">
                <label>Container Max Width</label>
                <input type="text" value={editedPreset.spacing.containerMaxWidth} onChange={(e) => updateSpacing("containerMaxWidth", e.target.value)} />
              </div>
              <div className="field-group">
                <label>Element Gap</label>
                <input type="text" value={editedPreset.spacing.elementGap} onChange={(e) => updateSpacing("elementGap", e.target.value)} />
              </div>
            </div>
          </section>

          {/* Borders */}
          <section className="editor-section">
            <h3>Borders</h3>
            <div className="field-row">
              <div className="field-group">
                <label>Border Radius</label>
                <input type="text" value={editedPreset.borders.radius} onChange={(e) => updateBorders("radius", e.target.value)} />
              </div>
              <div className="field-group">
                <label>Button Radius</label>
                <input type="text" value={editedPreset.borders.buttonRadius} onChange={(e) => updateBorders("buttonRadius", e.target.value)} />
              </div>
              <div className="field-group">
                <label>Card Radius</label>
                <input type="text" value={editedPreset.borders.cardRadius} onChange={(e) => updateBorders("cardRadius", e.target.value)} />
              </div>
            </div>
          </section>
        </div>

        <div className="preset-editor-footer">
          <button className="btn-cancel" onClick={onCancel}>Cancel</button>
          <button className="btn-save" onClick={handleSave}>Save Preset</button>
        </div>
      </div>

      <style>{`
        .preset-editor-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .preset-editor {
          background: #ffffff;
          border-radius: 12px;
          width: 90%;
          max-width: 700px;
          max-height: 85vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 20px 40px rgba(0,0,0,0.2);
        }

        .preset-editor-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px;
          border-bottom: 1px solid #e5e7eb;
        }

        .preset-editor-header h2 {
          font-size: 18px;
          font-weight: 600;
          color: #1a1a1a;
          margin: 0;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 24px;
          color: #9ca3af;
          cursor: pointer;
          padding: 0;
          line-height: 1;
        }

        .close-btn:hover {
          color: #1a1a1a;
        }

        .preset-editor-content {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
        }

        .editor-section {
          margin-bottom: 28px;
        }

        .editor-section:last-child {
          margin-bottom: 0;
        }

        .editor-section h3 {
          font-size: 13px;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin: 0 0 12px 0;
        }

        .field-group {
          margin-bottom: 12px;
        }

        .field-group label {
          display: block;
          font-size: 12px;
          font-weight: 500;
          color: #374151;
          margin-bottom: 4px;
        }

        .field-group input {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          color: #1a1a1a;
        }

        .field-group input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
        }

        .field-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        .color-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
        }

        .color-field {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .color-field label {
          font-size: 11px;
          font-weight: 500;
          color: #6b7280;
        }

        .color-input-wrapper {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .color-swatch {
          width: 28px;
          height: 28px;
          border-radius: 6px;
          border: 1px solid #d1d5db;
          cursor: pointer;
          position: relative;
          overflow: hidden;
        }

        .color-swatch input[type="color"] {
          position: absolute;
          inset: -10px;
          width: 150%;
          height: 150%;
          cursor: pointer;
          border: none;
        }

        .color-text {
          flex: 1;
          padding: 6px 8px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          font-size: 12px;
          font-family: monospace;
        }

        .preset-editor-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 16px 24px;
          border-top: 1px solid #e5e7eb;
        }

        .btn-cancel {
          padding: 10px 20px;
          background: none;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          color: #6b7280;
          cursor: pointer;
        }

        .btn-cancel:hover {
          background: #f3f4f6;
        }

        .btn-save {
          padding: 10px 20px;
          background: #3b82f6;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          color: #ffffff;
          cursor: pointer;
        }

        .btn-save:hover {
          background: #2563eb;
        }
      `}</style>
    </div>
  );
}

// Color field component
function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="color-field">
      <label>{label}</label>
      <div className="color-input-wrapper">
        <div className="color-swatch" style={{ backgroundColor: value }}>
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
        <input
          type="text"
          className="color-text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  );
}
