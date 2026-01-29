"use client";

import React, { useState } from "react";
import { AnimationField } from "./AnimationField";
import { LockField } from "./LockField";
import { GroupField } from "./GroupField";
import { ResponsiveVisibility, VisibilitySettings } from "./ResponsiveVisibility";
import { defaultVisibility } from "../utils/visibility";
import {
  AnimationConfig,
  LockConfig,
  GroupConfig,
  defaultAnimationConfig,
  defaultLockConfig,
  defaultGroupConfig,
} from "../animations/types";
// Import directly to avoid circular dependency with ./index
import { SizeField, SizeSettings, defaultSizeSettings } from "./SizeField";
import { PositionField, PositionSettings, defaultPositionSettings } from "./PositionField";
import { BorderField, BorderSettings, defaultBorderSettings } from "./BorderField";
import { EffectsField, EffectsSettings, defaultEffectsSettings } from "./EffectsField";
import { TransformField, TransformSettings, defaultTransformSettings } from "./TransformField";

export interface AdvancedFieldsSettings {
  animation?: Partial<AnimationConfig>;
  lock?: Partial<LockConfig>;
  group?: Partial<GroupConfig>;
  visibility?: VisibilitySettings;
  size?: SizeSettings;
  position?: PositionSettings;
  border?: BorderSettings;
  effects?: EffectsSettings;
  transform?: TransformSettings;
}

export const defaultAdvancedSettings: AdvancedFieldsSettings = {
  animation: defaultAnimationConfig,
  lock: defaultLockConfig,
  group: defaultGroupConfig,
  visibility: defaultVisibility,
  size: defaultSizeSettings,
  position: defaultPositionSettings,
  border: defaultBorderSettings,
  effects: defaultEffectsSettings,
  transform: defaultTransformSettings,
};

interface CollapsibleSectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  icon?: React.ReactNode;
}

function CollapsibleSection({
  title,
  defaultOpen = false,
  children,
  icon,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div
      style={{
        borderBottom: "1px solid #f3f4f6",
        marginBottom: "2px",
      }}
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: "flex",
          alignItems: "center",
          width: "100%",
          padding: "8px 4px",
          background: "none",
          border: "none",
          cursor: "pointer",
          fontSize: "12px",
          fontWeight: 500,
          color: "#374151",
          textAlign: "left",
          gap: "6px",
        }}
      >
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          style={{
            transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
            transition: "transform 0.15s ease",
            color: "#9ca3af",
          }}
        >
          <path d="M9 18l6-6-6-6" />
        </svg>
        {icon}
        {title}
      </button>
      {isOpen && (
        <div style={{ padding: "0 4px 8px 16px" }}>{children}</div>
      )}
    </div>
  );
}

interface AdvancedFieldsPanelProps {
  value: AdvancedFieldsSettings;
  onChange: (value: AdvancedFieldsSettings) => void;
  /** Which sections to show */
  sections?: {
    animation?: boolean;
    visibility?: boolean;
    size?: boolean;
    position?: boolean;
    border?: boolean;
    effects?: boolean;
    transform?: boolean;
    lock?: boolean;
    group?: boolean;
  };
}

const icons = {
  animation: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  ),
  visibility: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  size: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" />
    </svg>
  ),
  position: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3" />
    </svg>
  ),
  border: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" strokeDasharray="4 2" />
    </svg>
  ),
  effects: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a10 10 0 0 0 0 20" fill="currentColor" opacity="0.3" />
    </svg>
  ),
  transform: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  ),
  lock: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  group: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="2" width="8" height="8" rx="1" />
      <rect x="14" y="2" width="8" height="8" rx="1" />
      <rect x="2" y="14" width="8" height="8" rx="1" />
      <rect x="14" y="14" width="8" height="8" rx="1" />
    </svg>
  ),
};

export function AdvancedFieldsPanel({
  value,
  onChange,
  sections = {
    animation: true,
    visibility: true,
    size: true,
    position: true,
    border: true,
    effects: true,
    transform: true,
    lock: true,
    group: true,
  },
}: AdvancedFieldsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  const updateField = <K extends keyof AdvancedFieldsSettings>(
    field: K,
    fieldValue: AdvancedFieldsSettings[K]
  ) => {
    onChange({ ...value, [field]: fieldValue });
  };

  return (
    <div
      style={{
        background: "#fafafa",
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        overflow: "hidden",
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
          padding: "10px 12px",
          background: isOpen ? "#f3f4f6" : "transparent",
          border: "none",
          cursor: "pointer",
          fontSize: "12px",
          fontWeight: 600,
          color: "#374151",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          Advanced Settings
        </span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          style={{
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.15s ease",
          }}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {isOpen && (
        <div style={{ borderTop: "1px solid #e5e7eb" }}>
          {sections.animation && (
            <CollapsibleSection title="Animation" icon={icons.animation}>
              <AnimationField
                value={value.animation || defaultAnimationConfig}
                onChange={(v) => updateField("animation", v)}
              />
            </CollapsibleSection>
          )}

          {sections.visibility && (
            <CollapsibleSection title="Visibility" icon={icons.visibility}>
              <ResponsiveVisibility
                value={value.visibility || defaultVisibility}
                onChange={(v) => updateField("visibility", v)}
              />
            </CollapsibleSection>
          )}

          {sections.size && (
            <CollapsibleSection title="Size & Overflow" icon={icons.size}>
              <SizeField
                value={value.size || defaultSizeSettings}
                onChange={(v) => updateField("size", v)}
              />
            </CollapsibleSection>
          )}

          {sections.position && (
            <CollapsibleSection title="Position" icon={icons.position}>
              <PositionField
                value={value.position || defaultPositionSettings}
                onChange={(v) => updateField("position", v)}
              />
            </CollapsibleSection>
          )}

          {sections.border && (
            <CollapsibleSection title="Border & Radius" icon={icons.border}>
              <BorderField
                value={value.border || defaultBorderSettings}
                onChange={(v) => updateField("border", v)}
              />
            </CollapsibleSection>
          )}

          {sections.effects && (
            <CollapsibleSection title="Effects" icon={icons.effects}>
              <EffectsField
                value={value.effects || defaultEffectsSettings}
                onChange={(v) => updateField("effects", v)}
              />
            </CollapsibleSection>
          )}

          {sections.transform && (
            <CollapsibleSection title="Transform" icon={icons.transform}>
              <TransformField
                value={value.transform || defaultTransformSettings}
                onChange={(v) => updateField("transform", v)}
              />
            </CollapsibleSection>
          )}

          {sections.lock && (
            <CollapsibleSection title="Lock" icon={icons.lock}>
              <LockField
                value={value.lock || defaultLockConfig}
                onChange={(v) => updateField("lock", v)}
              />
            </CollapsibleSection>
          )}

          {sections.group && (
            <CollapsibleSection title="Group" icon={icons.group}>
              <GroupField
                value={value.group || defaultGroupConfig}
                onChange={(v) => updateField("group", v)}
              />
            </CollapsibleSection>
          )}
        </div>
      )}
    </div>
  );
}
