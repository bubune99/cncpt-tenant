"use client";

import { ComponentConfig } from "@puckeditor/core";
import React, { ReactNode } from "react";
import { AnimatedWrapper } from "../../animations/AnimatedWrapper";
import { AnimationConfig, LockConfig, GroupConfig, defaultAnimationConfig, defaultLockConfig, defaultGroupConfig } from "../../animations/types";
import { AnimationField } from "../../fields/AnimationField";
import { LockField } from "../../fields/LockField";
import { GroupField } from "../../fields/GroupField";
import { ResponsiveVisibility, VisibilitySettings } from "../../fields/ResponsiveVisibility";
import { getVisibilityClassName, defaultVisibility } from "../../utils/visibility";

export interface FlexProps {
  direction: "row" | "column" | "row-reverse" | "column-reverse";
  justifyContent: string;
  alignItems: string;
  gap: string;
  wrap: "nowrap" | "wrap" | "wrap-reverse";
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

export const Flex = ({
  direction,
  justifyContent,
  alignItems,
  gap,
  wrap,
  animation,
  lock,
  visibility,
  content: Content,
  puck,
}: FlexProps) => {
  const isEditing = puck?.isEditing ?? false;
  const isLocked = lock?.isLocked ?? false;
  const visibilityClasses = getVisibilityClassName(visibility);

  const flexContent = (
    <div
      className={visibilityClasses}
      style={{
        display: "flex",
        flexDirection: direction,
        justifyContent,
        alignItems,
        gap,
        flexWrap: wrap,
        width: "100%",
        position: "relative",
        pointerEvents: isLocked && !isEditing ? "none" : undefined,
      }}
    >
      {isLocked && isEditing && (
        <div
          style={{
            position: "absolute",
            top: -24,
            right: 0,
            background: "#ef4444",
            color: "white",
            padding: "4px 8px",
            borderRadius: 4,
            fontSize: 11,
            fontWeight: 600,
            zIndex: 10,
          }}
        >
          🔒 LOCKED
        </div>
      )}
      {typeof Content === 'function' && <Content />}
    </div>
  );

  if (animation?.enabled && !isEditing) {
    return (
      <AnimatedWrapper animation={animation} isEditing={isEditing}>
        {flexContent}
      </AnimatedWrapper>
    );
  }

  return flexContent;
};

export const FlexConfig: ComponentConfig<FlexProps> = {
  label: "Flex",
  defaultProps: {
    direction: "row",
    justifyContent: "flex-start",
    alignItems: "stretch",
    gap: "16px",
    wrap: "wrap",
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
    direction: {
      type: "select",
      label: "Direction",
      options: [
        { label: "Row", value: "row" },
        { label: "Column", value: "column" },
        { label: "Row Reverse", value: "row-reverse" },
        { label: "Column Reverse", value: "column-reverse" },
      ],
    },
    justifyContent: {
      type: "select",
      label: "Justify Content",
      options: [
        { label: "Start", value: "flex-start" },
        { label: "Center", value: "center" },
        { label: "End", value: "flex-end" },
        { label: "Space Between", value: "space-between" },
        { label: "Space Around", value: "space-around" },
        { label: "Space Evenly", value: "space-evenly" },
      ],
    },
    alignItems: {
      type: "select",
      label: "Align Items",
      options: [
        { label: "Stretch", value: "stretch" },
        { label: "Start", value: "flex-start" },
        { label: "Center", value: "center" },
        { label: "End", value: "flex-end" },
        { label: "Baseline", value: "baseline" },
      ],
    },
    gap: {
      type: "select",
      label: "Gap",
      options: [
        { label: "None", value: "0px" },
        { label: "Small (8px)", value: "8px" },
        { label: "Medium (16px)", value: "16px" },
        { label: "Large (24px)", value: "24px" },
        { label: "XL (32px)", value: "32px" },
        { label: "2XL (48px)", value: "48px" },
      ],
    },
    wrap: {
      type: "select",
      label: "Wrap",
      options: [
        { label: "No Wrap", value: "nowrap" },
        { label: "Wrap", value: "wrap" },
        { label: "Wrap Reverse", value: "wrap-reverse" },
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
  render: Flex,
};
