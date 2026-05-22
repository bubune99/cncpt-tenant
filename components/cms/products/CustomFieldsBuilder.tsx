"use client";
/**
 * CustomFieldsBuilder — Atlas Product Editor Frame F5
 * Global field library + attached fields list + new field editor.
 * 10 field types from schema: TEXT, NUMBER, BOOLEAN, SELECT, MULTISELECT,
 * COLOR, IMAGE, DATE, URL, TEXTAREA.
 */

import React, { useState, useCallback } from "react";
import { Sec, SaveBar, TogglePill } from "./atlas-product-ui";
import type { AtlasCustomField, AtlasProductCustomField, CustomFieldTypeKind } from "./atlas-types";

// ── Field type palette ─────────────────────────────────────────────────────
const FIELD_TYPES: ReadonlyArray<{
  readonly kind: CustomFieldTypeKind;
  readonly tg: string;
  readonly short: string;
  readonly name: string;
}> = [
  { kind: "TEXT",        tg: "txt",   short: "Aa", name: "Text" },
  { kind: "NUMBER",      tg: "num",   short: "#",  name: "Number" },
  { kind: "BOOLEAN",     tg: "bool",  short: "◯",  name: "Toggle" },
  { kind: "SELECT",      tg: "sel",   short: "▾",  name: "Select" },
  { kind: "MULTISELECT", tg: "multi", short: "☰",  name: "Multi" },
  { kind: "COLOR",       tg: "col",   short: "◐",  name: "Color" },
  { kind: "IMAGE",       tg: "img",   short: "▣",  name: "Image" },
  { kind: "DATE",        tg: "date",  short: "◫",  name: "Date" },
  { kind: "URL",         tg: "url",   short: "↗",  name: "URL" },
  { kind: "TEXTAREA",    tg: "area",  short: "¶",  name: "Long" },
] as const;

function getTg(kind: CustomFieldTypeKind): string {
  return FIELD_TYPES.find((f) => f.kind === kind)?.tg ?? "txt";
}
function getShort(kind: CustomFieldTypeKind): string {
  return FIELD_TYPES.find((f) => f.kind === kind)?.short ?? "?";
}

// ── New field state ────────────────────────────────────────────────────────
interface NewFieldOption {
  readonly id: string;
  readonly label: string;
  readonly slug: string;
}

interface NewFieldState {
  readonly name: string;
  readonly type: CustomFieldTypeKind;
  readonly slug: string;
  readonly description: string;
  readonly options: ReadonlyArray<NewFieldOption>;
  readonly defaultValue: string;
  readonly required: boolean;
}

const DEFAULT_NEW_FIELD: NewFieldState = {
  name: "",
  type: "TEXT",
  slug: "",
  description: "",
  options: [],
  defaultValue: "",
  required: false,
};

// ── Props ──────────────────────────────────────────────────────────────────
interface CustomFieldsBuilderProps {
  readonly globalFields: ReadonlyArray<AtlasCustomField>;
  readonly attachedFields: ReadonlyArray<AtlasProductCustomField>;
  readonly onAttach?: (fieldId: string) => void;
  readonly onDetach?: (productCustomFieldId: string) => void;
  readonly onReorder?: (fromIndex: number, toIndex: number) => void;
  readonly onToggleRequired?: (productCustomFieldId: string, required: boolean) => void;
  readonly onToggleShowInGrid?: (productCustomFieldId: string, showInGrid: boolean) => void;
  readonly onCreateField?: (field: NewFieldState) => void;
  readonly savedAt?: string;
  readonly isDirty?: boolean;
}

// ── Component ──────────────────────────────────────────────────────────────
export function CustomFieldsBuilder({
  globalFields,
  attachedFields,
  onAttach,
  onDetach,
  onReorder,
  onToggleRequired,
  onToggleShowInGrid,
  onCreateField,
  savedAt,
  isDirty = false,
}: CustomFieldsBuilderProps) {
  const [newField, setNewField] = useState<NewFieldState>(DEFAULT_NEW_FIELD);
  const [showNewEditor, setShowNewEditor] = useState(false);
  const [libraryScope, setLibraryScope] = useState<"global" | "product">("global");

  const attachedFieldIds = new Set(attachedFields.map((af) => af.customFieldId));

  const updateNewField = useCallback(<K extends keyof NewFieldState>(
    key: K,
    value: NewFieldState[K]
  ) => {
    setNewField((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleAddOption = useCallback(() => {
    const id = `opt-${Date.now()}`;
    setNewField((prev) => ({
      ...prev,
      options: [...prev.options, { id, label: "", slug: "" }],
    }));
  }, []);

  const updateOption = useCallback((optId: string, field: "label" | "slug", value: string) => {
    setNewField((prev) => ({
      ...prev,
      options: prev.options.map((o) =>
        o.id === optId ? { ...o, [field]: value } : o
      ),
    }));
  }, []);

  const removeOption = useCallback((optId: string) => {
    setNewField((prev) => ({
      ...prev,
      options: prev.options.filter((o) => o.id !== optId),
    }));
  }, []);

  const handleSaveNewField = useCallback(() => {
    if (!newField.name.trim()) return;
    onCreateField?.(newField);
    setNewField(DEFAULT_NEW_FIELD);
    setShowNewEditor(false);
  }, [newField, onCreateField]);

  const handleStartNewField = useCallback((kind: CustomFieldTypeKind) => {
    setNewField({ ...DEFAULT_NEW_FIELD, type: kind });
    setShowNewEditor(true);
  }, []);

  return (
    <div className="prod-editor-shell" style={{ paddingTop: 8 }}>
      {/* Toolbar */}
      <div className="ss-toolbar" style={{ paddingTop: 12 }}>
        <div className="group">
          <span className="lbl-mono">Library scope</span>
          <span
            className={"chip" + (libraryScope === "global" ? " on" : "")}
            onClick={() => setLibraryScope("global")}
            style={{ cursor: "pointer" }}
          >Global</span>
          <span
            className={"chip" + (libraryScope === "product" ? " on" : " dash")}
            onClick={() => setLibraryScope("product")}
            style={{ cursor: "pointer" }}
          >This product only</span>
        </div>
        <div className="group" style={{ marginLeft: "auto" }}>
          <span className="lbl-mono">Preview</span>
          <span className="chip">↗ open in Variants grid</span>
        </div>
      </div>

      {/* 3-column layout */}
      <div className="cf-cols" style={{ marginTop: 8 }}>

        {/* LEFT: field type palette + saved library */}
        <div className="cf-col">
          <Sec h="Field types" meta="drag to attach · or click +" />
          <div className="cf-palette">
            {FIELD_TYPES.map((ft) => (
              <div
                key={ft.kind}
                className="cf-type"
                title={ft.kind}
                onClick={() => handleStartNewField(ft.kind)}
                style={{ cursor: "pointer" }}
              >
                <span className={"tg " + ft.tg}>{ft.short}</span>
                <span>{ft.name}</span>
              </div>
            ))}
          </div>

          <div className="cf-saved">
            <div
              style={{
                fontFamily: "var(--font-geist-mono), monospace", fontSize: 10, color: "var(--ink-soft)",
                letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 4, padding: "0 4px",
              }}
            >
              Saved fields <span style={{ color: "var(--ink-faint)" }}>· {globalFields.length}</span>
            </div>
            <div style={{ maxHeight: 360, overflowY: "auto" }}>
              {globalFields.map((f) => (
                <div
                  key={f.id}
                  className={"cf-saved-row" + (attachedFieldIds.has(f.id) ? " placed" : "")}
                  onClick={() => !attachedFieldIds.has(f.id) && onAttach?.(f.id)}
                  style={{ cursor: attachedFieldIds.has(f.id) ? "default" : "pointer" }}
                >
                  <span className="grip">⋮⋮</span>
                  <span className={"tg " + getTg(f.type)}>{getShort(f.type)}</span>
                  <span className="name">{f.name}</span>
                  <span className="used">—</span>
                </div>
              ))}
            </div>
            <button
              className="btn btn-ghost btn-sm"
              style={{ marginTop: 6, width: "100%", justifyContent: "center" }}
              onClick={() => handleStartNewField("TEXT")}
            >
              + new saved field
            </button>
          </div>
        </div>

        {/* MIDDLE: attached fields */}
        <div className="cf-col middle">
          <Sec
            h="Attached to this product"
            meta={`${attachedFields.length} fields · column order = grid order`}
            right={<span className="mono" style={{ fontSize: 10, color: "var(--ink-soft)" }}>drag rows to reorder</span>}
          />

          <div className="cf-attached">
            {/* Header */}
            <div
              className="cf-row"
              style={{
                background: "var(--paper-3)", borderBottom: "1px solid var(--ink)", padding: "6px 12px",
                fontFamily: "var(--font-geist-mono), monospace", fontSize: 9.5,
                letterSpacing: ".1em", textTransform: "uppercase", color: "var(--ink-soft)",
              }}
            >
              <span />
              <span>type</span>
              <span>field</span>
              <span>config</span>
              <span style={{ textAlign: "left" }}>required</span>
              <span style={{ textAlign: "left" }}>in grid</span>
              <span />
            </div>

            {attachedFields.map((af, i) => (
              <div key={af.id} className="cf-row">
                <span className="grip" title="Drag to reorder">⋮⋮</span>
                <span className={"tg " + getTg(af.customField.type)}>{getShort(af.customField.type)}</span>
                <div className="name-block">
                  <div className="name">{af.customField.name}</div>
                  <div className="slug">{af.customField.slug}</div>
                </div>
                <div className="cfg">
                  {af.customField.type === "SELECT" || af.customField.type === "MULTISELECT"
                    ? "options configured"
                    : af.customField.type}
                </div>
                <TogglePill
                  on={af.required}
                  onLabel="req"
                  offLabel="opt"
                  onChange={(on) => onToggleRequired?.(af.id, on)}
                />
                <TogglePill
                  on={af.showInGrid}
                  onLabel="shown"
                  offLabel="hidden"
                  onChange={(on) => onToggleShowInGrid?.(af.id, on)}
                />
                <span
                  style={{ color: "var(--ink-faint)", cursor: "pointer", textAlign: "center" }}
                  onClick={() => onDetach?.(af.id)}
                  title="Detach field"
                >
                  ×
                </span>
              </div>
            ))}

            {attachedFields.length === 0 && (
              <div style={{ padding: 12, textAlign: "center", color: "var(--ink-faint)", fontSize: 12, fontStyle: "italic" }}>
                No fields attached yet
              </div>
            )}
          </div>

          <div className="cf-drop-hint">
            ⇩ drop a field from the library — or use the type palette above
          </div>

          <div style={{ marginTop: 8, padding: "8px 12px", background: "var(--paper-2)", border: "1px solid var(--rule)", borderRadius: "var(--r-sm)", fontSize: 11.5, color: "var(--ink-soft)" }}>
            <span className="mono" style={{ fontSize: 10 }}>VALUES PER VARIANT</span>
            {" "}— each variant gets its own value for each field.{" "}
            <span style={{ fontStyle: "italic", fontFamily: "var(--font-display), Spectral, serif" }}>
              So Marigold-M can be 320 gsm and Rust-XL can be 280 gsm.
            </span>
          </div>
        </div>

        {/* RIGHT: new field editor */}
        <div className="cf-col">
          {showNewEditor ? (
            <>
              <Sec h="New field" meta="unsaved" />
              <div className="cf-new">
                <div className="h">
                  <span className="accent-bar" />
                  {newField.name || "Unnamed field"}
                </div>

                <div className="input-row">
                  <span className="lbl">Name</span>
                  <input
                    className="val"
                    value={newField.name}
                    onChange={(e) => {
                      updateNewField("name", e.target.value);
                      if (!newField.slug) {
                        updateNewField("slug", e.target.value.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, ""));
                      }
                    }}
                    placeholder="Field name"
                    style={{ background: "transparent", border: "1px solid var(--rule)", borderRadius: "var(--r-sm)", padding: "3px 6px", fontSize: 12, width: "100%" }}
                  />
                </div>

                <div className="input-row">
                  <span className="lbl">Type</span>
                  <span className="val" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <select
                      value={newField.type}
                      onChange={(e) => updateNewField("type", e.target.value as CustomFieldTypeKind)}
                      style={{ background: "transparent", border: "1px solid var(--rule)", borderRadius: "var(--r-sm)", padding: "3px 6px", fontSize: 12 }}
                    >
                      {FIELD_TYPES.map((ft) => (
                        <option key={ft.kind} value={ft.kind}>{ft.name} ({ft.kind})</option>
                      ))}
                    </select>
                  </span>
                </div>

                <div className="input-row">
                  <span className="lbl">Slug</span>
                  <input
                    className="val mono"
                    value={newField.slug}
                    onChange={(e) => updateNewField("slug", e.target.value)}
                    placeholder="field_slug"
                    style={{ background: "transparent", border: "1px solid var(--rule)", borderRadius: "var(--r-sm)", padding: "3px 6px", fontSize: 11, fontFamily: "var(--font-geist-mono), monospace", width: "100%" }}
                  />
                </div>

                <div className="input-row">
                  <span className="lbl">Description</span>
                  <input
                    className="val fig"
                    value={newField.description}
                    onChange={(e) => updateNewField("description", e.target.value)}
                    placeholder="Optional description"
                    style={{ background: "transparent", border: "1px solid var(--rule)", borderRadius: "var(--r-sm)", padding: "3px 6px", fontSize: 12, width: "100%", fontFamily: "var(--font-display), Spectral, serif", fontStyle: "italic" }}
                  />
                </div>

                {/* Options (for SELECT/MULTISELECT) */}
                {(newField.type === "SELECT" || newField.type === "MULTISELECT") && (
                  <div style={{ marginTop: 12 }}>
                    <div
                      style={{
                        fontFamily: "var(--font-geist-mono), monospace", fontSize: 10, letterSpacing: ".1em",
                        textTransform: "uppercase", color: "var(--ink-soft)", marginBottom: 4,
                      }}
                    >
                      Options <span style={{ color: "var(--ink-faint)" }}>· {newField.options.length}</span>
                    </div>
                    {newField.options.map((opt) => (
                      <div key={opt.id} className="opt-row">
                        <span className="grip">⋮⋮</span>
                        <span className="sw-mini" />
                        <input
                          value={opt.label}
                          onChange={(e) => updateOption(opt.id, "label", e.target.value)}
                          placeholder="Label"
                        />
                        <input
                          className="slug"
                          value={opt.slug}
                          onChange={(e) => updateOption(opt.id, "slug", e.target.value)}
                          placeholder="slug"
                        />
                        <span className="x" onClick={() => removeOption(opt.id)}>×</span>
                      </div>
                    ))}
                    <div
                      style={{ marginTop: 4, fontSize: 11, color: "var(--accent)", cursor: "pointer", paddingLeft: 20 }}
                      onClick={handleAddOption}
                    >
                      + add option
                    </div>
                  </div>
                )}

                <div className="input-row" style={{ marginTop: 12 }}>
                  <span className="lbl">Required</span>
                  <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <input
                      type="checkbox"
                      checked={newField.required}
                      onChange={(e) => updateNewField("required", e.target.checked)}
                    />
                    <span style={{ fontSize: 12 }}>Required on all variants</span>
                  </label>
                </div>

                <div style={{ display: "flex", gap: 6, marginTop: 14 }}>
                  <button
                    className="btn btn-accent btn-sm"
                    style={{ flex: 1, justifyContent: "center" }}
                    onClick={handleSaveNewField}
                    disabled={!newField.name.trim()}
                  >
                    Save & attach
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => { setShowNewEditor(false); setNewField(DEFAULT_NEW_FIELD); }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div style={{ padding: 14, textAlign: "center", color: "var(--ink-faint)", fontSize: 12, background: "var(--paper-2)", border: "1px solid var(--rule)", borderRadius: "var(--r-sm)" }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>⊞</div>
              Click a field type or pick from the library to start building.
            </div>
          )}
        </div>
      </div>

      <SaveBar
        savedAt={savedAt ?? `${attachedFields.length} fields attached`}
        isDirty={isDirty}
        hints={[["N", "new"], ["↑↓", "reorder"], ["del", "detach"]]}
      />
    </div>
  );
}
