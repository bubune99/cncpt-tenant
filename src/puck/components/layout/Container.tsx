"use client";

import { ComponentConfig } from "@puckeditor/core";
import React, { ReactNode } from "react";
import { AnimatedWrapper } from "../../animations/AnimatedWrapper";
import { AnimationConfig, LockConfig, GroupConfig, defaultAnimationConfig, defaultLockConfig, defaultGroupConfig } from "../../animations/types";
import { AnimationField } from "../../fields/AnimationField";
import { LockField } from "../../fields/LockField";
import { GroupField } from "../../fields/GroupField";
import { BorderRadiusField } from "../../fields/BorderRadiusField";
import { ShadowField, getShadowCSS } from "../../fields/ShadowField";
import { ResponsiveVisibility, VisibilitySettings } from "../../fields/ResponsiveVisibility";
import { getVisibilityClassName, defaultVisibility } from "../../utils/visibility";
import { BackgroundField, BackgroundSettings, defaultBackgroundSettings, getBackgroundStyles, BackgroundOverlay, getBlurStyles } from "../../fields/BackgroundField";

export interface ContainerProps {
  // Slot layout
  slotDirection?: "vertical" | "horizontal";
  slotGap?: string;
  slotAlign?: "start" | "center" | "end" | "stretch" | "space-between";
  // Container settings
  maxWidth: string;
  padding: string;
  background: BackgroundSettings;
  borderRadius: string;
  boxShadow: string;
  children?: ReactNode;
  // Enhanced props
  animation?: Partial<AnimationConfig>;
  lock?: Partial<LockConfig>;
  group?: Partial<GroupConfig>;
  visibility?: VisibilitySettings;
  // Content (slot)
  content?: React.FC | never[];
  puck?: { isEditing?: boolean };
}

export const Container = ({
  slotDirection = "vertical",
  slotGap = "0px",
  slotAlign = "stretch",
  maxWidth,
  padding,
  background,
  borderRadius,
  boxShadow,
  animation,
  lock,
  visibility,
  content: Content,
  puck,
}: ContainerProps) => {
  const isEditing = puck?.isEditing ?? false;
  const isLocked = lock?.isLocked ?? false;
  const visibilityClasses = getVisibilityClassName(visibility);
  const bgStyles = getBackgroundStyles(background);
  const blurStyles = getBlurStyles(background);
  const hasBlur = background?.blur && background.blur > 0;

  const containerContent = (
    <div
      className={visibilityClasses}
      style={{
        maxWidth,
        margin: "0 auto",
        padding,
        borderRadius,
        boxShadow: getShadowCSS(boxShadow),
        width: "100%",
        position: "relative",
        pointerEvents: isLocked && !isEditing ? "none" : undefined,
        overflow: "hidden",
      }}
    >
      {/* Background layer with optional blur */}
      {background?.type !== "none" && (
        <div
          style={{
            position: "absolute",
            inset: hasBlur ? `-${(background.blur || 0) * 2}px` : 0,
            borderRadius,
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
    </div>
  );

  if (animation?.enabled && !isEditing) {
    return (
      <AnimatedWrapper animation={animation} isEditing={isEditing}>
        {containerContent}
      </AnimatedWrapper>
    );
  }

  return containerContent;
};

export const ContainerConfig: ComponentConfig<ContainerProps> = {
  label: "Container",
  defaultProps: {
    slotDirection: "vertical",
    slotGap: "0px",
    slotAlign: "stretch",
    maxWidth: "1200px",
    padding: "24px",
    background: defaultBackgroundSettings,
    borderRadius: "0px",
    boxShadow: "none",
    animation: defaultAnimationConfig,
    lock: defaultLockConfig,
    group: defaultGroupConfig,
    visibility: defaultVisibility,
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
        { label: "↓ Vertical", value: "vertical" },
        { label: "→ Horizontal", value: "horizontal" },
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
    maxWidth: {
      type: "select",
      label: "Max Width",
      options: [
        { label: "Small (640px)", value: "640px" },
        { label: "Medium (768px)", value: "768px" },
        { label: "Large (1024px)", value: "1024px" },
        { label: "XL (1200px)", value: "1200px" },
        { label: "2XL (1400px)", value: "1400px" },
        { label: "Full", value: "100%" },
      ],
    },
    padding: {
      type: "select",
      label: "Padding",
      options: [
        { label: "None", value: "0px" },
        { label: "Small (12px)", value: "12px" },
        { label: "Medium (24px)", value: "24px" },
        { label: "Large (48px)", value: "48px" },
        { label: "XL (64px)", value: "64px" },
      ],
    },
    background: {
      type: "custom",
      label: "Background",
      render: ({ value, onChange }) => (
        <BackgroundField value={value || defaultBackgroundSettings} onChange={onChange} />
      ),
    },
    borderRadius: {
      type: "custom",
      label: "Border Radius",
      render: ({ value, onChange }) => (
        <BorderRadiusField value={value || "0px"} onChange={onChange} />
      ),
    },
    boxShadow: {
      type: "custom",
      label: "Box Shadow",
      render: ({ value, onChange }) => (
        <ShadowField value={value || "none"} onChange={onChange} />
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
    group: {
      type: "custom",
      label: "Group",
      render: ({ value, onChange }) => (
        <GroupField value={value || defaultGroupConfig} onChange={onChange} />
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
  render: Container,
};
