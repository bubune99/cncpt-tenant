"use client";

import { ComponentConfig, DropZone } from "@measured/puck";
import { ReactNode } from "react";
import { AnimatedWrapper } from "../../animations/AnimatedWrapper";
import { AnimationConfig, LockConfig, GroupConfig, defaultAnimationConfig, defaultLockConfig, defaultGroupConfig } from "../../animations/types";
import { AnimationField } from "../../fields/AnimationField";
import { LockField } from "../../fields/LockField";
import { GroupField } from "../../fields/GroupField";
import { ResponsiveVisibility, VisibilitySettings } from "../../fields/ResponsiveVisibility";
import { getVisibilityClassName, defaultVisibility } from "../../utils/visibility";

export interface GridProps {
  columns: number;
  gap: string;
  rowGap?: string;
  alignItems: string;
  justifyItems: string;
  minChildWidth?: string;
  children?: ReactNode;
  // Enhanced props
  animation?: Partial<AnimationConfig>;
  lock?: Partial<LockConfig>;
  group?: Partial<GroupConfig>;
  visibility?: VisibilitySettings;
  puck?: { isEditing?: boolean };
}

export const Grid = ({
  columns,
  gap,
  rowGap,
  alignItems,
  justifyItems,
  minChildWidth,
  animation,
  lock,
  visibility,
  puck,
}: GridProps) => {
  const isEditing = puck?.isEditing ?? false;
  const isLocked = lock?.isLocked ?? false;
  const visibilityClasses = getVisibilityClassName(visibility);
  const zones = Array.from({ length: columns }, (_, i) => `column-${i}`);

  const content = (
    <div
      className={visibilityClasses}
      style={{
        display: "grid",
        gridTemplateColumns: minChildWidth
          ? `repeat(auto-fit, minmax(${minChildWidth}, 1fr))`
          : `repeat(${columns}, 1fr)`,
        gap,
        rowGap: rowGap || gap,
        alignItems,
        justifyItems,
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
      {zones.map((zone) => (
        <div key={zone} style={{ minWidth: 0 }}>
          <DropZone zone={zone} />
        </div>
      ))}
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

export const GridConfig: ComponentConfig<GridProps> = {
  label: "Grid",
  defaultProps: {
    columns: 3,
    gap: "24px",
    alignItems: "stretch",
    justifyItems: "stretch",
    animation: defaultAnimationConfig,
    lock: defaultLockConfig,
    group: defaultGroupConfig,
    visibility: defaultVisibility,
  },
  fields: {
    columns: {
      type: "select",
      label: "Columns",
      options: [
        { label: "1 Column", value: 1 },
        { label: "2 Columns", value: 2 },
        { label: "3 Columns", value: 3 },
        { label: "4 Columns", value: 4 },
        { label: "5 Columns", value: 5 },
        { label: "6 Columns", value: 6 },
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
    rowGap: {
      type: "select",
      label: "Row Gap (optional)",
      options: [
        { label: "Same as Gap", value: "" },
        { label: "None", value: "0px" },
        { label: "Small (8px)", value: "8px" },
        { label: "Medium (16px)", value: "16px" },
        { label: "Large (24px)", value: "24px" },
        { label: "XL (32px)", value: "32px" },
      ],
    },
    alignItems: {
      type: "select",
      label: "Align Items",
      options: [
        { label: "Stretch", value: "stretch" },
        { label: "Start", value: "start" },
        { label: "Center", value: "center" },
        { label: "End", value: "end" },
      ],
    },
    justifyItems: {
      type: "select",
      label: "Justify Items",
      options: [
        { label: "Stretch", value: "stretch" },
        { label: "Start", value: "start" },
        { label: "Center", value: "center" },
        { label: "End", value: "end" },
      ],
    },
    minChildWidth: {
      type: "text",
      label: "Min Child Width (auto-fit)",
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
  render: Grid,
};
