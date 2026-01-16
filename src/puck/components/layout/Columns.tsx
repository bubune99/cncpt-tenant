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

export interface ColumnsProps {
  layout: string;
  gap: string;
  alignItems: string;
  stackOnMobile: boolean;
  reverseOnMobile: boolean;
  children?: ReactNode;
  // Enhanced props
  animation?: Partial<AnimationConfig>;
  lock?: Partial<LockConfig>;
  group?: Partial<GroupConfig>;
  visibility?: VisibilitySettings;
  puck?: { isEditing?: boolean };
}

const layoutOptions: Record<string, string[]> = {
  "1": ["100%"],
  "1-1": ["50%", "50%"],
  "1-2": ["33.33%", "66.67%"],
  "2-1": ["66.67%", "33.33%"],
  "1-1-1": ["33.33%", "33.33%", "33.33%"],
  "1-2-1": ["25%", "50%", "25%"],
  "2-1-1": ["50%", "25%", "25%"],
  "1-1-2": ["25%", "25%", "50%"],
  "1-1-1-1": ["25%", "25%", "25%", "25%"],
};

export const Columns = ({
  layout,
  gap,
  alignItems,
  stackOnMobile,
  reverseOnMobile,
  animation,
  lock,
  visibility,
  puck,
}: ColumnsProps) => {
  const isEditing = puck?.isEditing ?? false;
  const isLocked = lock?.isLocked ?? false;
  const visibilityClasses = getVisibilityClassName(visibility);
  const widths = layoutOptions[layout] || layoutOptions["1-1"];

  const content = (
    <div
      className={`puck-columns ${stackOnMobile ? "stack-mobile" : ""} ${reverseOnMobile ? "reverse-mobile" : ""} ${visibilityClasses}`}
      style={{
        display: "flex",
        flexDirection: "row",
        gap,
        alignItems,
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
      {widths.map((width, index) => (
        <div
          key={index}
          className="puck-column"
          style={{
            flex: `0 0 calc(${width} - ${gap} * ${(widths.length - 1) / widths.length})`,
            minWidth: 0,
          }}
        >
          <DropZone zone={`column-${index}`} />
        </div>
      ))}
      <style>{`
        @media (max-width: 768px) {
          .puck-columns.stack-mobile {
            flex-direction: column !important;
          }
          .puck-columns.stack-mobile .puck-column {
            flex: 1 1 100% !important;
          }
          .puck-columns.stack-mobile.reverse-mobile {
            flex-direction: column-reverse !important;
          }
        }
      `}</style>
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

export const ColumnsConfig: ComponentConfig<ColumnsProps> = {
  label: "Columns",
  defaultProps: {
    layout: "1-1",
    gap: "24px",
    alignItems: "stretch",
    stackOnMobile: true,
    reverseOnMobile: false,
    animation: defaultAnimationConfig,
    lock: defaultLockConfig,
    group: defaultGroupConfig,
    visibility: defaultVisibility,
  },
  fields: {
    layout: {
      type: "select",
      label: "Layout",
      options: [
        { label: "Single (100%)", value: "1" },
        { label: "Two Equal (50/50)", value: "1-1" },
        { label: "Two (33/67)", value: "1-2" },
        { label: "Two (67/33)", value: "2-1" },
        { label: "Three Equal (33/33/33)", value: "1-1-1" },
        { label: "Three (25/50/25)", value: "1-2-1" },
        { label: "Three (50/25/25)", value: "2-1-1" },
        { label: "Three (25/25/50)", value: "1-1-2" },
        { label: "Four Equal (25/25/25/25)", value: "1-1-1-1" },
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
    alignItems: {
      type: "select",
      label: "Vertical Alignment",
      options: [
        { label: "Stretch", value: "stretch" },
        { label: "Top", value: "flex-start" },
        { label: "Center", value: "center" },
        { label: "Bottom", value: "flex-end" },
      ],
    },
    stackOnMobile: {
      type: "radio",
      label: "Stack on Mobile",
      options: [
        { label: "Yes", value: true },
        { label: "No", value: false },
      ],
    },
    reverseOnMobile: {
      type: "radio",
      label: "Reverse on Mobile",
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
  render: Columns,
};
