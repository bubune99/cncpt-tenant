"use client";

import React, { useState } from "react";

interface AdvancedSectionProps {
  title?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

/**
 * Collapsible section for advanced/rarely-used fields.
 * Collapsed by default to keep the UI clean.
 */
export function AdvancedSection({
  title = "Advanced",
  defaultOpen = false,
  children,
}: AdvancedSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div
      style={{
        marginTop: "8px",
        borderTop: "1px solid #e5e7eb",
        paddingTop: "8px",
      }}
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          padding: "6px 0",
          background: "none",
          border: "none",
          cursor: "pointer",
          fontSize: "11px",
          fontWeight: 600,
          color: "#6b7280",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            style={{
              transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
              transition: "transform 0.15s ease",
            }}
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
          {title}
        </span>
        <span
          style={{
            fontSize: "10px",
            color: "#9ca3af",
            fontWeight: 400,
            textTransform: "none",
            letterSpacing: "normal",
          }}
        >
          {isOpen ? "collapse" : "expand"}
        </span>
      </button>
      {isOpen && (
        <div
          style={{
            paddingTop: "8px",
            paddingLeft: "4px",
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * Wrapper for individual field rows with compact styling
 */
export function FieldRow({
  label,
  children,
  inline = false,
}: {
  label: string;
  children: React.ReactNode;
  inline?: boolean;
}) {
  if (inline) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "8px",
          gap: "8px",
        }}
      >
        <label
          style={{
            fontSize: "12px",
            color: "#374151",
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </label>
        <div style={{ flex: 1, maxWidth: "60%" }}>{children}</div>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: "10px" }}>
      <label
        style={{
          display: "block",
          fontSize: "11px",
          fontWeight: 500,
          color: "#6b7280",
          marginBottom: "4px",
          textTransform: "uppercase",
          letterSpacing: "0.025em",
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

/**
 * Compact input styling
 */
export const compactInputStyle: React.CSSProperties = {
  width: "100%",
  padding: "6px 10px",
  fontSize: "13px",
  border: "1px solid #e5e7eb",
  borderRadius: "6px",
  background: "#ffffff",
  color: "#374151",
  outline: "none",
  transition: "border-color 0.15s ease",
};

export const compactSelectStyle: React.CSSProperties = {
  ...compactInputStyle,
  appearance: "none",
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 8px center",
  paddingRight: "28px",
};

/**
 * Compact checkbox with label
 */
export function CompactCheckbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        fontSize: "12px",
        color: "#374151",
        cursor: "pointer",
        marginBottom: "6px",
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{
          width: "14px",
          height: "14px",
          borderRadius: "3px",
          cursor: "pointer",
        }}
      />
      {label}
    </label>
  );
}

/**
 * Compact number input with optional unit
 */
export function CompactNumberInput({
  value,
  onChange,
  min,
  max,
  step = 1,
  unit,
  placeholder,
}: {
  value: number | string;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  placeholder?: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        min={min}
        max={max}
        step={step}
        placeholder={placeholder}
        style={{
          ...compactInputStyle,
          width: unit ? "calc(100% - 30px)" : "100%",
        }}
      />
      {unit && (
        <span
          style={{
            fontSize: "11px",
            color: "#9ca3af",
            minWidth: "24px",
          }}
        >
          {unit}
        </span>
      )}
    </div>
  );
}

/**
 * Inline radio buttons for compact toggle options
 */
export function CompactRadioGroup({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: string | boolean }[];
  value: string | boolean;
  onChange: (value: string | boolean) => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: "4px",
        background: "#f3f4f6",
        borderRadius: "6px",
        padding: "2px",
      }}
    >
      {options.map((option) => (
        <button
          key={String(option.value)}
          type="button"
          onClick={() => onChange(option.value)}
          style={{
            flex: 1,
            padding: "4px 8px",
            fontSize: "11px",
            fontWeight: 500,
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            background: value === option.value ? "#ffffff" : "transparent",
            color: value === option.value ? "#374151" : "#6b7280",
            boxShadow: value === option.value ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
            transition: "all 0.15s ease",
          }}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
