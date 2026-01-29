"use client";

import { ComponentConfig } from "@puckeditor/core";
import React, { ReactNode } from "react";
import { AnimatedWrapper } from "../../animations/AnimatedWrapper";
import { AnimationConfig, LockConfig, defaultAnimationConfig, defaultLockConfig } from "../../animations/types";
import { AnimationField } from "../../fields/AnimationField";
import { LockField } from "../../fields/LockField";
import { ResponsiveVisibility, VisibilitySettings } from "../../fields/ResponsiveVisibility";
import { getVisibilityClassName, defaultVisibility } from "../../utils/visibility";
import { BackgroundField, BackgroundSettings, defaultBackgroundSettings, getBackgroundStyles, BackgroundOverlay } from "../../fields/BackgroundField";
import {
  LayoutField,
  LayoutSettings,
  getLayoutStyles,
  defaultLayoutSettings,
  SizeField,
  SizeSettings,
  getSizeStyles,
  defaultSizeSettings,
  PositionField,
  PositionSettings,
  getPositionStyles,
  defaultPositionSettings,
  BorderField,
  BorderSettings,
  getBorderStyles,
  defaultBorderSettings,
  EffectsField,
  EffectsSettings,
  getEffectsStyles,
  defaultEffectsSettings,
  TransformField,
  TransformSettings,
  getTransformStyles,
  defaultTransformSettings,
} from "../../fields";
import { SpacingField } from "../../fields/SpacingField";

export interface BoxProps {
  // Quick slot layout control
  slotDirection?: "vertical" | "horizontal";
  slotGap?: string;
  slotAlign?: "start" | "center" | "end" | "stretch" | "space-between";
  // Spacing
  padding?: string;
  paddingTop?: string;
  paddingRight?: string;
  paddingBottom?: string;
  paddingLeft?: string;
  margin?: string;
  marginTop?: string;
  marginRight?: string;
  marginBottom?: string;
  marginLeft?: string;
  // Design
  background?: BackgroundSettings;
  layout?: LayoutSettings;
  size?: SizeSettings;
  position?: PositionSettings;
  border?: BorderSettings;
  effects?: EffectsSettings;
  transform?: TransformSettings;
  // Behavior
  animation?: Partial<AnimationConfig>;
  lock?: Partial<LockConfig>;
  visibility?: VisibilitySettings;
  // Content (slot)
  content?: React.FC | never[];
  children?: ReactNode;
  puck?: { isEditing?: boolean };
}

export const Box = ({
  slotDirection = "vertical",
  slotGap = "0px",
  slotAlign = "stretch",
  padding,
  paddingTop,
  paddingRight,
  paddingBottom,
  paddingLeft,
  margin,
  marginTop,
  marginRight,
  marginBottom,
  marginLeft,
  background,
  layout,
  size,
  position,
  border,
  effects,
  transform,
  animation,
  lock,
  visibility,
  content: Content,
  puck,
}: BoxProps) => {
  const isEditing = puck?.isEditing ?? false;
  const isLocked = lock?.isLocked ?? false;
  const visibilityClasses = getVisibilityClassName(visibility);

  // Combine all styles
  const bgStyles = getBackgroundStyles(background);
  const layoutStyles = getLayoutStyles(layout);
  const sizeStyles = getSizeStyles(size);
  const positionStyles = getPositionStyles(position);
  const borderStyles = getBorderStyles(border);
  const effectsStyles = getEffectsStyles(effects);
  const transformStyles = getTransformStyles(transform);

  // Slot layout styles (quick access) - these override layout settings if slotDirection is set
  const slotLayoutStyles: React.CSSProperties = {
    display: "flex",
    flexDirection: slotDirection === "horizontal" ? "row" : "column",
    gap: slotGap,
    alignItems: slotAlign === "space-between" ? "stretch" :
                slotAlign === "start" ? "flex-start" :
                slotAlign === "end" ? "flex-end" :
                slotAlign,
    justifyContent: slotAlign === "space-between" ? "space-between" : undefined,
    flexWrap: slotDirection === "horizontal" ? "wrap" : undefined,
  };

  const style: React.CSSProperties = {
    // Spacing
    padding: padding || undefined,
    paddingTop: paddingTop || undefined,
    paddingRight: paddingRight || undefined,
    paddingBottom: paddingBottom || undefined,
    paddingLeft: paddingLeft || undefined,
    margin: margin || undefined,
    marginTop: marginTop || undefined,
    marginRight: marginRight || undefined,
    marginBottom: marginBottom || undefined,
    marginLeft: marginLeft || undefined,
    // Background
    ...bgStyles,
    // Apply slot layout styles first, then let advanced layout override if needed
    ...slotLayoutStyles,
    // Layout (advanced - can override slot layout)
    ...layoutStyles,
    // Size
    ...sizeStyles,
    // Position
    ...positionStyles,
    // Border
    ...borderStyles,
    // Effects
    ...effectsStyles,
    // Transform
    ...transformStyles,
    // Lock behavior
    pointerEvents: isLocked && !isEditing ? "none" : effectsStyles.pointerEvents,
  };

  const content = (
    <div className={visibilityClasses} style={style}>
      {/* Overlay for backgrounds */}
      {background?.type !== "none" && background?.overlayEnabled && (
        <BackgroundOverlay settings={background} />
      )}

      {isLocked && isEditing && (
        <div
          style={{
            position: "absolute",
            top: 4,
            right: 4,
            background: "#ef4444",
            color: "white",
            padding: "2px 6px",
            borderRadius: 4,
            fontSize: 10,
            fontWeight: 600,
            zIndex: 10,
          }}
        >
          🔒
        </div>
      )}

      {typeof Content === 'function' && <Content />}
    </div>
  );

  if (animation?.enabled && !isEditing) {
    return (
      <AnimatedWrapper animation={animation} isEditing={isEditing}>
        {content}
      </AnimatedWrapper>
    );
  }

  return content;
};

export const BoxConfig: ComponentConfig<BoxProps> = {
  label: "Box",
  defaultProps: {
    slotDirection: "vertical",
    slotGap: "0px",
    slotAlign: "stretch",
    padding: "16px",
    background: { ...defaultBackgroundSettings, type: "none" },
    layout: { ...defaultLayoutSettings, display: "flex" },
    size: defaultSizeSettings,
    position: defaultPositionSettings,
    border: defaultBorderSettings,
    effects: defaultEffectsSettings,
    transform: defaultTransformSettings,
    animation: defaultAnimationConfig,
    lock: defaultLockConfig,
    visibility: defaultVisibility,
    content: [],
  },
  fields: {
    content: {
      type: "slot",
    },
    slotDirection: {
      type: "radio",
      label: "Direction",
      options: [
        { label: "↓ Vertical", value: "vertical" },
        { label: "→ Horizontal", value: "horizontal" },
      ],
    },
    slotGap: {
      type: "select",
      label: "Gap",
      options: [
        { label: "None", value: "0px" },
        { label: "4px", value: "4px" },
        { label: "8px", value: "8px" },
        { label: "12px", value: "12px" },
        { label: "16px", value: "16px" },
        { label: "24px", value: "24px" },
        { label: "32px", value: "32px" },
        { label: "48px", value: "48px" },
      ],
    },
    slotAlign: {
      type: "select",
      label: "Align",
      options: [
        { label: "Stretch", value: "stretch" },
        { label: "Start", value: "start" },
        { label: "Center", value: "center" },
        { label: "End", value: "end" },
        { label: "Space Between", value: "space-between" },
      ],
    },
    padding: {
      type: "custom",
      label: "Padding",
      render: ({ value, onChange }) => (
        <SpacingField value={value || "16px"} onChange={onChange} type="padding" />
      ),
    },
    margin: {
      type: "custom",
      label: "Margin",
      render: ({ value, onChange }) => (
        <SpacingField value={value || "0px"} onChange={onChange} type="margin" />
      ),
    },
    background: {
      type: "custom",
      label: "Background",
      render: ({ value, onChange }) => (
        <BackgroundField value={value || defaultBackgroundSettings} onChange={onChange} />
      ),
    },
    layout: {
      type: "custom",
      label: "Layout (Advanced)",
      render: ({ value, onChange }) => (
        <LayoutField value={value || defaultLayoutSettings} onChange={onChange} />
      ),
    },
    size: {
      type: "custom",
      label: "Size",
      render: ({ value, onChange }) => (
        <SizeField value={value || defaultSizeSettings} onChange={onChange} />
      ),
    },
    position: {
      type: "custom",
      label: "Position",
      render: ({ value, onChange }) => (
        <PositionField value={value || defaultPositionSettings} onChange={onChange} />
      ),
    },
    border: {
      type: "custom",
      label: "Border",
      render: ({ value, onChange }) => (
        <BorderField value={value || defaultBorderSettings} onChange={onChange} />
      ),
    },
    effects: {
      type: "custom",
      label: "Effects",
      render: ({ value, onChange }) => (
        <EffectsField value={value || defaultEffectsSettings} onChange={onChange} />
      ),
    },
    transform: {
      type: "custom",
      label: "Transform",
      render: ({ value, onChange }) => (
        <TransformField value={value || defaultTransformSettings} onChange={onChange} />
      ),
    },
    animation: {
      type: "custom",
      label: "Animation",
      render: ({ value, onChange }) => (
        <AnimationField value={value || defaultAnimationConfig} onChange={onChange} />
      ),
    },
    lock: {
      type: "custom",
      label: "Lock",
      render: ({ value, onChange }) => (
        <LockField value={value || defaultLockConfig} onChange={onChange} />
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
  render: Box,
};
