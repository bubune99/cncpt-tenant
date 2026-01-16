"use client";

import { ComponentConfig, DropZone } from "@measured/puck";
import { ReactNode } from "react";
import { AnimatedWrapper } from "../../animations/AnimatedWrapper";
import { AnimationConfig, LockConfig, GroupConfig, defaultAnimationConfig, defaultLockConfig, defaultGroupConfig } from "../../animations/types";
import { AnimationField } from "../../fields/AnimationField";
import { LockField } from "../../fields/LockField";
import { GroupField } from "../../fields/GroupField";
import { SpacingField } from "../../fields/SpacingField";
import { ResponsiveVisibility, VisibilitySettings } from "../../fields/ResponsiveVisibility";
import { getVisibilityClassName, defaultVisibility } from "../../utils/visibility";
import { BackgroundField, BackgroundSettings, defaultBackgroundSettings, getBackgroundStyles, BackgroundOverlay, getBlurStyles } from "../../fields/BackgroundField";

export interface SectionProps {
  background: BackgroundSettings;
  paddingTop: string;
  paddingBottom: string;
  paddingLeft: string;
  paddingRight: string;
  minHeight?: string;
  maxWidth: string;
  fullWidth: boolean;
  children?: ReactNode;
  // Enhanced props
  animation?: Partial<AnimationConfig>;
  lock?: Partial<LockConfig>;
  group?: Partial<GroupConfig>;
  visibility?: VisibilitySettings;
  // Editor state
  puck?: { isEditing?: boolean };
}

export const Section = ({
  background,
  paddingTop,
  paddingBottom,
  paddingLeft,
  paddingRight,
  minHeight,
  maxWidth,
  fullWidth,
  animation,
  lock,
  visibility,
  puck,
}: SectionProps) => {
  const isEditing = puck?.isEditing ?? false;
  const isLocked = lock?.isLocked ?? false;
  const visibilityClasses = getVisibilityClassName(visibility);
  const bgStyles = getBackgroundStyles(background);
  const blurStyles = getBlurStyles(background);
  const hasBlur = background?.blur && background.blur > 0;

  const content = (
    <section
      className={visibilityClasses}
      style={{
        paddingTop,
        paddingBottom,
        paddingLeft,
        paddingRight,
        minHeight: minHeight || undefined,
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
        }}
      >
        <DropZone zone="content" />
      </div>
    </section>
  );

  // Apply animation wrapper if enabled and not in editing mode
  if (animation?.enabled && !isEditing) {
    return (
      <AnimatedWrapper animation={animation} isEditing={isEditing}>
        {content}
      </AnimatedWrapper>
    );
  }

  return content;
};

export const SectionConfig: ComponentConfig<SectionProps> = {
  label: "Section",
  defaultProps: {
    background: defaultBackgroundSettings,
    paddingTop: "48px",
    paddingBottom: "48px",
    paddingLeft: "24px",
    paddingRight: "24px",
    maxWidth: "1200px",
    fullWidth: false,
    animation: defaultAnimationConfig,
    lock: defaultLockConfig,
    group: defaultGroupConfig,
    visibility: defaultVisibility,
  },
  fields: {
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
  render: Section,
};
