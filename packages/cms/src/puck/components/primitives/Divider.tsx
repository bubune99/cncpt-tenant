"use client";

import { ComponentConfig } from "@puckeditor/core";
import { ResponsiveVisibility, VisibilitySettings } from "../../fields/ResponsiveVisibility";
import { getVisibilityClassName, defaultVisibility } from "../../utils/visibility";
import {
  EffectsField,
  EffectsSettings,
  getEffectsStyles,
  defaultEffectsSettings,
} from "../../fields";

export interface DividerProps {
  direction: "horizontal" | "vertical";
  thickness: string;
  length: string;
  color: string;
  style: "solid" | "dashed" | "dotted";
  margin: string;
  // Alignment
  align: "start" | "center" | "end";
  // Design
  effects?: EffectsSettings;
  visibility?: VisibilitySettings;
}

export const Divider = ({
  direction,
  thickness,
  length,
  color,
  style,
  margin,
  align,
  effects,
  visibility,
}: DividerProps) => {
  const visibilityClasses = getVisibilityClassName(visibility);
  const effectsStyles = getEffectsStyles(effects);

  const isHorizontal = direction === "horizontal";

  const wrapperStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: align === "start" ? "flex-start" : align === "end" ? "flex-end" : "center",
    alignItems: "center",
    margin: isHorizontal ? `${margin} 0` : `0 ${margin}`,
    width: isHorizontal ? "100%" : "auto",
    height: isHorizontal ? "auto" : "100%",
  };

  const lineStyle: React.CSSProperties = {
    width: isHorizontal ? length : thickness,
    height: isHorizontal ? thickness : length,
    backgroundColor: style === "solid" ? color : "transparent",
    borderStyle: style,
    borderColor: color,
    borderWidth: style !== "solid" ? thickness : 0,
    borderRadius: thickness,
    flexShrink: 0,
    ...effectsStyles,
  };

  return (
    <div className={visibilityClasses} style={wrapperStyle}>
      <div style={lineStyle} />
    </div>
  );
};

export const DividerConfig: ComponentConfig<DividerProps> = {
  label: "Divider",
  defaultProps: {
    direction: "horizontal",
    thickness: "1px",
    length: "100%",
    color: "#e5e7eb",
    style: "solid",
    margin: "16px",
    align: "center",
    effects: defaultEffectsSettings,
    visibility: defaultVisibility,
  },
  fields: {
    direction: {
      type: "radio",
      label: "Direction",
      options: [
        { label: "Horizontal", value: "horizontal" },
        { label: "Vertical", value: "vertical" },
      ],
    },
    thickness: {
      type: "select",
      label: "Thickness",
      options: [
        { label: "Hairline (1px)", value: "1px" },
        { label: "Thin (2px)", value: "2px" },
        { label: "Medium (3px)", value: "3px" },
        { label: "Thick (4px)", value: "4px" },
        { label: "Bold (6px)", value: "6px" },
      ],
    },
    length: {
      type: "select",
      label: "Length",
      options: [
        { label: "Full (100%)", value: "100%" },
        { label: "3/4 (75%)", value: "75%" },
        { label: "Half (50%)", value: "50%" },
        { label: "Quarter (25%)", value: "25%" },
        { label: "Small (100px)", value: "100px" },
        { label: "Medium (200px)", value: "200px" },
      ],
    },
    color: {
      type: "text",
      label: "Color",
    },
    style: {
      type: "radio",
      label: "Style",
      options: [
        { label: "Solid", value: "solid" },
        { label: "Dashed", value: "dashed" },
        { label: "Dotted", value: "dotted" },
      ],
    },
    margin: {
      type: "select",
      label: "Margin",
      options: [
        { label: "None", value: "0px" },
        { label: "Small (8px)", value: "8px" },
        { label: "Medium (16px)", value: "16px" },
        { label: "Large (24px)", value: "24px" },
        { label: "XL (32px)", value: "32px" },
        { label: "2XL (48px)", value: "48px" },
      ],
    },
    align: {
      type: "radio",
      label: "Alignment",
      options: [
        { label: "Start", value: "start" },
        { label: "Center", value: "center" },
        { label: "End", value: "end" },
      ],
    },
    effects: {
      type: "custom",
      label: "Effects",
      render: ({ value, onChange }) => (
        <EffectsField value={value || defaultEffectsSettings} onChange={onChange} />
      ),
    },
    visibility: {
      type: "custom",
      label: "Visibility",
      render: ({ value, onChange }) => (
        <ResponsiveVisibility value={value || defaultVisibility} onChange={onChange} />
      ),
    },
  },
  render: Divider,
};
