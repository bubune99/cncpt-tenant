"use client";

import { ComponentConfig } from "@measured/puck";
import { AnimatedWrapper } from "../../animations/AnimatedWrapper";
import { AnimationConfig, LockConfig, GroupConfig, defaultAnimationConfig, defaultLockConfig, defaultGroupConfig } from "../../animations/types";
import { AnimationField } from "../../fields/AnimationField";
import { LockField } from "../../fields/LockField";
import { GroupField } from "../../fields/GroupField";
import { ResponsiveVisibility, VisibilitySettings } from "../../fields/ResponsiveVisibility";
import { getVisibilityClassName, defaultVisibility } from "../../utils/visibility";

export interface SpacerProps {
  height: string;
  showDivider: boolean;
  dividerColor: string;
  dividerWidth: string;
  // Enhanced props
  animation?: Partial<AnimationConfig>;
  lock?: Partial<LockConfig>;
  group?: Partial<GroupConfig>;
  visibility?: VisibilitySettings;
  puck?: { isEditing?: boolean };
}

export const Spacer = ({
  height,
  showDivider,
  dividerColor,
  dividerWidth,
  animation,
  lock,
  visibility,
  puck,
}: SpacerProps) => {
  const isEditing = puck?.isEditing ?? false;
  const isLocked = lock?.isLocked ?? false;
  const visibilityClasses = getVisibilityClassName(visibility);

  const content = (
    <div
      className={visibilityClasses}
      style={{
        height,
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        pointerEvents: isLocked && !isEditing ? "none" : undefined,
      }}
    >
      {isLocked && isEditing && (
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
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
      {showDivider && (
        <hr
          style={{
            width: dividerWidth,
            border: "none",
            borderTop: `1px solid ${dividerColor}`,
            margin: 0,
          }}
        />
      )}
      {isEditing && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(59, 130, 246, 0.1)",
            border: "1px dashed rgba(59, 130, 246, 0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#3b82f6",
            fontSize: "12px",
            pointerEvents: "none",
          }}
        >
          {height}
        </div>
      )}
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

export const SpacerConfig: ComponentConfig<SpacerProps> = {
  label: "Spacer",
  defaultProps: {
    height: "32px",
    showDivider: false,
    dividerColor: "#e5e7eb",
    dividerWidth: "100%",
    animation: defaultAnimationConfig,
    lock: defaultLockConfig,
    group: defaultGroupConfig,
    visibility: defaultVisibility,
  },
  fields: {
    height: {
      type: "select",
      label: "Height",
      options: [
        { label: "XS (8px)", value: "8px" },
        { label: "Small (16px)", value: "16px" },
        { label: "Medium (32px)", value: "32px" },
        { label: "Large (48px)", value: "48px" },
        { label: "XL (64px)", value: "64px" },
        { label: "2XL (96px)", value: "96px" },
        { label: "3XL (128px)", value: "128px" },
      ],
    },
    showDivider: {
      type: "radio",
      label: "Show Divider",
      options: [
        { label: "Yes", value: true },
        { label: "No", value: false },
      ],
    },
    dividerColor: {
      type: "text",
      label: "Divider Color",
    },
    dividerWidth: {
      type: "select",
      label: "Divider Width",
      options: [
        { label: "Full (100%)", value: "100%" },
        { label: "3/4 (75%)", value: "75%" },
        { label: "Half (50%)", value: "50%" },
        { label: "1/3 (33%)", value: "33%" },
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
  render: Spacer,
};
