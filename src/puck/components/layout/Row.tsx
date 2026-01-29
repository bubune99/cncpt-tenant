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

export interface RowProps {
  justifyContent: string;
  alignItems: string;
  gap: string;
  wrap: boolean;
  verticalPadding: string;
  horizontalPadding: string;
  backgroundColor: string;
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

export const Row = ({
  justifyContent,
  alignItems,
  gap,
  wrap,
  verticalPadding,
  horizontalPadding,
  backgroundColor,
  animation,
  lock,
  visibility,
  content: Content,
  puck,
}: RowProps) => {
  const isEditing = puck?.isEditing ?? false;
  const isLocked = lock?.isLocked ?? false;
  const visibilityClasses = getVisibilityClassName(visibility);

  const content = (
    <div
      className={visibilityClasses}
      style={{
        display: "flex",
        flexDirection: "row",
        justifyContent,
        alignItems,
        gap,
        flexWrap: wrap ? "wrap" : "nowrap",
        paddingTop: verticalPadding,
        paddingBottom: verticalPadding,
        paddingLeft: horizontalPadding,
        paddingRight: horizontalPadding,
        backgroundColor,
        width: "100%",
        position: "relative",
        pointerEvents: isLocked && !isEditing ? "none" : undefined,
      }}
    >
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

export const RowConfig: ComponentConfig<RowProps> = {
  label: "Row",
  defaultProps: {
    justifyContent: "flex-start",
    alignItems: "center",
    gap: "16px",
    wrap: true,
    verticalPadding: "0px",
    horizontalPadding: "0px",
    backgroundColor: "transparent",
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
        { label: "XS (4px)", value: "4px" },
        { label: "Small (8px)", value: "8px" },
        { label: "Medium (16px)", value: "16px" },
        { label: "Large (24px)", value: "24px" },
        { label: "XL (32px)", value: "32px" },
        { label: "2XL (48px)", value: "48px" },
      ],
    },
    wrap: {
      type: "radio",
      label: "Wrap Items",
      options: [
        { label: "Yes", value: true },
        { label: "No", value: false },
      ],
    },
    verticalPadding: {
      type: "select",
      label: "Vertical Padding",
      options: [
        { label: "None", value: "0px" },
        { label: "Small (8px)", value: "8px" },
        { label: "Medium (16px)", value: "16px" },
        { label: "Large (24px)", value: "24px" },
        { label: "XL (32px)", value: "32px" },
      ],
    },
    horizontalPadding: {
      type: "select",
      label: "Horizontal Padding",
      options: [
        { label: "None", value: "0px" },
        { label: "Small (8px)", value: "8px" },
        { label: "Medium (16px)", value: "16px" },
        { label: "Large (24px)", value: "24px" },
        { label: "XL (32px)", value: "32px" },
      ],
    },
    backgroundColor: {
      type: "text",
      label: "Background Color",
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
  render: Row,
};
