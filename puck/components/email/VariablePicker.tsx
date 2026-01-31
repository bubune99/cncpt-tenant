"use client";

import { useState, useRef, useEffect } from "react";
import { emailVariables, VariableDefinition } from "@/lib/cms/email-variables";

interface VariablePickerProps {
  onSelect: (variable: string) => void;
  buttonLabel?: string;
}

export function VariablePicker({ onSelect, buttonLabel = "Insert Variable" }: VariablePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (variable: VariableDefinition) => {
    onSelect(`{{${variable.key}}}`);
    setIsOpen(false);
    setSearch("");
  };

  const filteredCategories = Object.entries(emailVariables).map(([key, category]) => ({
    key,
    ...category,
    variables: category.variables.filter(
      (v) =>
        v.label.toLowerCase().includes(search.toLowerCase()) ||
        v.key.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter((cat) => cat.variables.length > 0);

  const icons: Record<string, React.ReactNode> = {
    user: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
    "shopping-cart": (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="9" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </svg>
    ),
    package: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    ),
    building: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="4" y="2" width="16" height="20" rx="2" />
        <path d="M9 22v-4h6v4M8 6h.01M16 6h.01M12 6h.01M8 10h.01M16 10h.01M12 10h.01M8 14h.01M16 14h.01M12 14h.01" />
      </svg>
    ),
    calendar: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
    link: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </svg>
    ),
  };

  return (
    <div ref={containerRef} style={{ position: "relative", display: "inline-block" }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "6px 10px",
          fontSize: 12,
          color: "#6366f1",
          background: "#eef2ff",
          border: "1px solid #c7d2fe",
          borderRadius: 6,
          cursor: "pointer",
          transition: "all 0.15s ease",
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
        {buttonLabel}
      </button>

      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            marginTop: 4,
            width: 320,
            maxHeight: 400,
            background: "white",
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
            zIndex: 1000,
            overflow: "hidden",
          }}
        >
          {/* Search */}
          <div style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>
            <input
              type="text"
              placeholder="Search variables..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
              style={{
                width: "100%",
                padding: "8px 10px",
                fontSize: 13,
                border: "1px solid #e5e7eb",
                borderRadius: 6,
                outline: "none",
              }}
            />
          </div>

          {/* Categories */}
          <div style={{ maxHeight: 340, overflowY: "auto" }}>
            {filteredCategories.map((category) => (
              <div key={category.key}>
                <button
                  type="button"
                  onClick={() => setActiveCategory(activeCategory === category.key ? null : category.key)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 12px",
                    fontSize: 13,
                    fontWeight: 500,
                    color: "#374151",
                    background: activeCategory === category.key ? "#f9fafb" : "white",
                    border: "none",
                    borderBottom: "1px solid #f3f4f6",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {icons[category.icon]}
                    {category.label}
                  </span>
                  <span style={{ color: "#9ca3af", fontSize: 12 }}>
                    {category.variables.length}
                  </span>
                </button>

                {(activeCategory === category.key || search) && (
                  <div style={{ background: "#fafafa" }}>
                    {category.variables.map((variable) => (
                      <button
                        key={variable.key}
                        type="button"
                        onClick={() => handleSelect(variable)}
                        style={{
                          width: "100%",
                          display: "block",
                          padding: "8px 12px 8px 32px",
                          fontSize: 12,
                          color: "#4b5563",
                          background: "transparent",
                          border: "none",
                          borderBottom: "1px solid #f3f4f6",
                          cursor: "pointer",
                          textAlign: "left",
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.background = "#eef2ff";
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.background = "transparent";
                        }}
                      >
                        <div style={{ fontWeight: 500, color: "#374151" }}>{variable.label}</div>
                        <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>
                          <code style={{ background: "#e5e7eb", padding: "1px 4px", borderRadius: 3 }}>
                            {`{{${variable.key}}}`}
                          </code>
                          <span style={{ marginLeft: 8 }}>{variable.sampleValue}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {filteredCategories.length === 0 && (
              <div style={{ padding: 20, textAlign: "center", color: "#9ca3af", fontSize: 13 }}>
                No variables found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Custom field component for Puck that combines text input with variable insertion
export interface TextWithVariablesValue {
  text: string;
}

interface TextWithVariablesFieldProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  multiline?: boolean;
}

export function TextWithVariablesField({ value, onChange, label, multiline }: TextWithVariablesFieldProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const insertVariable = (variable: string) => {
    const element = multiline ? textareaRef.current : inputRef.current;
    if (element) {
      const start = element.selectionStart || 0;
      const end = element.selectionEnd || 0;
      const newValue = value.substring(0, start) + variable + value.substring(end);
      onChange(newValue);
      // Set cursor position after inserted variable
      setTimeout(() => {
        element.focus();
        element.setSelectionRange(start + variable.length, start + variable.length);
      }, 0);
    } else {
      onChange(value + variable);
    }
  };

  return (
    <div>
      {label && (
        <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#374151", marginBottom: 6 }}>
          {label}
        </label>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {multiline ? (
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={4}
            style={{
              width: "100%",
              padding: "8px 10px",
              fontSize: 13,
              border: "1px solid #e5e7eb",
              borderRadius: 6,
              resize: "vertical",
              fontFamily: "inherit",
            }}
          />
        ) : (
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 10px",
              fontSize: 13,
              border: "1px solid #e5e7eb",
              borderRadius: 6,
            }}
          />
        )}
        <VariablePicker onSelect={insertVariable} />
      </div>
    </div>
  );
}
