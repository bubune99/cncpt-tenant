"use client";

import { ComponentConfig } from "@puckeditor/core";
import React, { ReactNode } from "react";
import { AnimatedWrapper } from "../../animations/AnimatedWrapper";
import { AnimationConfig, LockConfig, GroupConfig, defaultAnimationConfig, defaultLockConfig, defaultGroupConfig } from "../../animations/types";
import { SpacingField } from "../../fields/SpacingField";
import { getVisibilityClassName, defaultVisibility } from "../../utils/visibility";
import { BackgroundField, BackgroundSettings, defaultBackgroundSettings, getBackgroundStyles, BackgroundOverlay, getBlurStyles } from "../../fields/BackgroundField";
import {
  AdvancedFieldsPanel,
  AdvancedFieldsSettings,
  defaultAdvancedSettings,
  getSizeStyles,
  getPositionStyles,
  getBorderStyles,
  getEffectsStyles,
  getTransformStyles,
} from "../../fields";

export interface SectionProps {
  // Slot layout
  slotDirection?: "vertical" | "horizontal";
  slotGap?: string;
  slotAlign?: "start" | "center" | "end" | "stretch" | "space-between";
  // Background and spacing
  background: BackgroundSettings;
  paddingTop: string;
  paddingBottom: string;
  paddingLeft: string;
  paddingRight: string;
  minHeight?: string;
  maxWidth: string;
  fullWidth: boolean;
  children?: ReactNode;
  // All advanced settings combined
  advanced?: AdvancedFieldsSettings;
  // Content (slot)
  content?: React.FC | never[];
  // Editor state
  puck?: { isEditing?: boolean };
}

export const Section = ({
  slotDirection = "vertical",
  slotGap = "0px",
  slotAlign = "stretch",
  background,
  paddingTop,
  paddingBottom,
  paddingLeft,
  paddingRight,
  minHeight,
  maxWidth,
  fullWidth,
  advanced,
  content: Content,
  puck,
}: SectionProps) => {
  const isEditing = puck?.isEditing ?? false;
  const animation = advanced?.animation;
  const lock = advanced?.lock;
  const visibility = advanced?.visibility;
  const size = advanced?.size;
  const position = advanced?.position;
  const border = advanced?.border;
  const effects = advanced?.effects;
  const transform = advanced?.transform;

  const isLocked = lock?.isLocked ?? false;
  const visibilityClasses = getVisibilityClassName(visibility);
  const bgStyles = getBackgroundStyles(background);
  const blurStyles = getBlurStyles(background);
  const hasBlur = background?.blur && background.blur > 0;

  // Combine all Framer-style styles
  const sizeStyles = getSizeStyles(size);
  const positionStyles = getPositionStyles(position);
  const borderStyles = getBorderStyles(border);
  const effectsStyles = getEffectsStyles(effects);
  const transformStyles = getTransformStyles(transform);

  const sectionContent = (
    <section
      className={visibilityClasses}
      style={{
        paddingTop,
        paddingBottom,
        paddingLeft,
        paddingRight,
        minHeight: sizeStyles.minHeight || minHeight || undefined,
        width: sizeStyles.width || "100%",
        height: sizeStyles.height,
        maxWidth: sizeStyles.maxWidth,
        maxHeight: sizeStyles.maxHeight,
        aspectRatio: sizeStyles.aspectRatio,
        overflow: sizeStyles.overflow || "hidden",
        position: positionStyles.position || "relative",
        top: positionStyles.top,
        right: positionStyles.right,
        bottom: positionStyles.bottom,
        left: positionStyles.left,
        zIndex: positionStyles.zIndex,
        ...borderStyles,
        ...effectsStyles,
        ...transformStyles,
        pointerEvents: isLocked && !isEditing ? "none" : effectsStyles.pointerEvents,
      }}
    >
      {/* Background layer with optional blur */}
      {background?.type !== "none" && (
        <div
          style={{
            position: "absolute",
            inset: hasBlur ? `-${(background.blur || 0) * 2}px` : 0,
            ...bgStyles,
            ...blurStyles,
            zIndex: 0,
          }}
        />
      )}

      {/* Overlay */}
      <BackgroundOverlay settings={background} />

      {isLocked && isEditing && (
        <div
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            background: "#ef4444",
            color: "white",
            padding: "4px 8px",
            borderRadius: 4,
            fontSize: 11,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 4,
            zIndex: 10,
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
          </svg>
          LOCKED
        </div>
      )}
      <div
        style={{
          maxWidth: fullWidth ? "100%" : maxWidth,
          margin: "0 auto",
          width: "100%",
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: slotDirection === "horizontal" ? "row" : "column",
          gap: slotGap,
          alignItems: slotAlign === "space-between" ? "stretch" :
                      slotAlign === "start" ? "flex-start" :
                      slotAlign === "end" ? "flex-end" :
                      slotAlign,
          justifyContent: slotAlign === "space-between" ? "space-between" : undefined,
          flexWrap: slotDirection === "horizontal" ? "wrap" : undefined,
        }}
      >
        {typeof Content === 'function' && <Content />}
      </div>
    </section>
  );

  // Apply animation wrapper if enabled and not in editing mode
  if (animation?.enabled && !isEditing) {
    return (
      <AnimatedWrapper animation={animation} isEditing={isEditing}>
        {sectionContent}
      </AnimatedWrapper>
    );
  }

  return sectionContent;
};

export const SectionConfig: ComponentConfig<SectionProps> = {
  label: "Section",
  defaultProps: {
    slotDirection: "vertical",
    slotGap: "0px",
    slotAlign: "stretch",
    background: defaultBackgroundSettings,
    paddingTop: "48px",
    paddingBottom: "48px",
    paddingLeft: "24px",
    paddingRight: "24px",
    maxWidth: "1200px",
    fullWidth: false,
    advanced: defaultAdvancedSettings,
    content: [],
  },
  fields: {
    content: {
      type: "slot",
    },
    slotDirection: {
      type: "radio",
      label: "Content Direction",
      options: [
        { label: "Vertical", value: "vertical" },
        { label: "Horizontal", value: "horizontal" },
      ],
    },
    slotGap: {
      type: "select",
      label: "Content Gap",
      options: [
        { label: "None", value: "0px" },
        { label: "8px", value: "8px" },
        { label: "16px", value: "16px" },
        { label: "24px", value: "24px" },
        { label: "32px", value: "32px" },
        { label: "48px", value: "48px" },
      ],
    },
    slotAlign: {
      type: "select",
      label: "Content Align",
      options: [
        { label: "Stretch", value: "stretch" },
        { label: "Start", value: "start" },
        { label: "Center", value: "center" },
        { label: "End", value: "end" },
        { label: "Space Between", value: "space-between" },
      ],
    },
    background: {
      type: "custom",
      label: "Background",
      render: ({ value, onChange }) => (
        <BackgroundField value={value || defaultBackgroundSettings} onChange={onChange} />
      ),
    },
    paddingTop: {
      type: "custom",
      label: "Padding Top",
      render: ({ value, onChange }) => (
        <SpacingField value={value || "48px"} onChange={onChange} type="padding" />
      ),
    },
    paddingBottom: {
      type: "custom",
      label: "Padding Bottom",
      render: ({ value, onChange }) => (
        <SpacingField value={value || "48px"} onChange={onChange} type="padding" />
      ),
    },
    paddingLeft: {
      type: "custom",
      label: "Padding Left",
      render: ({ value, onChange }) => (
        <SpacingField value={value || "24px"} onChange={onChange} type="padding" />
      ),
    },
    paddingRight: {
      type: "custom",
      label: "Padding Right",
      render: ({ value, onChange }) => (
        <SpacingField value={value || "24px"} onChange={onChange} type="padding" />
      ),
    },
    minHeight: {
      type: "text",
      label: "Min Height",
    },
    maxWidth: {
      type: "text",
      label: "Max Width",
    },
    fullWidth: {
      type: "radio",
      label: "Full Width",
      options: [
        { label: "Yes", value: true },
        { label: "No", value: false },
      ],
    },
    advanced: {
      type: "custom",
      label: "",
      render: ({ value, onChange }) => (
        <AdvancedFieldsPanel
          value={value || defaultAdvancedSettings}
          onChange={onChange}
        />
      ),
    },
  },
  render: Section,
};
