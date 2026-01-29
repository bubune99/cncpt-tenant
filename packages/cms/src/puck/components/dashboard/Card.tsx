"use client";

import { ComponentConfig } from "@puckeditor/core";
import React from "react";
import { AnimatedWrapper } from "../../animations/AnimatedWrapper";
import {
  AnimationConfig,
  LockConfig,
  GroupConfig,
  defaultAnimationConfig,
  defaultLockConfig,
  defaultGroupConfig,
} from "../../animations/types";
import { AnimationField } from "../../fields/AnimationField";
import { LockField } from "../../fields/LockField";
import { GroupField } from "../../fields/GroupField";

export interface CardProps {
  title?: string | React.ReactNode; // Support inline editing
  subtitle?: string | React.ReactNode; // Support inline editing
  headerAction?: string | React.ReactNode; // Support inline editing
  backgroundColor: string;
  headerBackground?: string;
  textColor: string;
  borderRadius: string;
  padding: string;
  shadow: "none" | "sm" | "md" | "lg" | "xl";
  border: boolean;
  borderColor: string;
  showHeader: boolean;
  showDivider: boolean;
  // Enhanced props
  animation?: Partial<AnimationConfig>;
  lock?: Partial<LockConfig>;
  group?: Partial<GroupConfig>;
  // Content (slot)
  content?: React.FC | never[];
  puck?: { isEditing?: boolean };
}

const shadowStyles = {
  none: "none",
  sm: "0 1px 2px rgba(0,0,0,0.05)",
  md: "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)",
  lg: "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)",
  xl: "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)",
};

export const Card = ({
  title,
  subtitle,
  headerAction,
  backgroundColor,
  headerBackground,
  textColor,
  borderRadius,
  padding,
  shadow,
  border,
  borderColor,
  showHeader,
  showDivider,
  animation,
  lock,
  content: Content,
  puck,
}: CardProps) => {
  const isEditing = puck?.isEditing ?? false;
  const isLocked = lock?.isLocked ?? false;

  const content = (
    <div
      style={{
        position: "relative",
        backgroundColor,
        borderRadius,
        boxShadow: shadowStyles[shadow],
        border: border ? `1px solid ${borderColor}` : "none",
        overflow: "hidden",
      }}
    >
      {isEditing && isLocked && (
        <div
          style={{
            position: "absolute",
            top: 8,
            right: 8,
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

      {/* Header */}
      {showHeader && (
        <div
          style={{
            padding,
            backgroundColor: headerBackground || backgroundColor,
            borderBottom: showDivider ? `1px solid ${borderColor}` : "none",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            {title && (
              <h3
                style={{
                  margin: 0,
                  fontSize: "16px",
                  fontWeight: 600,
                  color: textColor,
                }}
              >
                {title}
              </h3>
            )}
            {subtitle && (
              <p
                style={{
                  margin: 0,
                  marginTop: "4px",
                  fontSize: "13px",
                  color: textColor,
                  opacity: 0.6,
                }}
              >
                {subtitle}
              </p>
            )}
          </div>
          {headerAction && (
            <button
              style={{
                padding: "6px 12px",
                fontSize: "13px",
                fontWeight: 500,
                color: "#3b82f6",
                background: "transparent",
                border: "1px solid #e5e7eb",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              {headerAction}
            </button>
          )}
        </div>
      )}

      {/* Body */}
      <div style={{ padding }}>
        {typeof Content === 'function' && <Content />}
      </div>
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

export const CardConfig: ComponentConfig<CardProps> = {
  label: "Card",
  defaultProps: {
    title: "Card Title",
    subtitle: "Card subtitle text",
    headerAction: "",
    backgroundColor: "#ffffff",
    headerBackground: "",
    textColor: "#1a1a1a",
    borderRadius: "12px",
    padding: "20px",
    shadow: "md",
    border: true,
    borderColor: "#e5e7eb",
    showHeader: true,
    showDivider: true,
    animation: defaultAnimationConfig,
    lock: defaultLockConfig,
    group: defaultGroupConfig,
    content: [],
  },
  fields: {
    content: {
      type: "slot",
    },
    showHeader: {
      type: "radio",
      label: "Show Header",
      options: [
        { label: "Yes", value: true },
        { label: "No", value: false },
      ],
    },
    title: {
      type: "text",
      label: "Title",
      contentEditable: true, // Enable inline editing in viewport
    },
    subtitle: {
      type: "text",
      label: "Subtitle",
      contentEditable: true, // Enable inline editing in viewport
    },
    headerAction: {
      type: "text",
      label: "Header Action Text",
      contentEditable: true, // Enable inline editing in viewport
    },
    backgroundColor: {
      type: "text",
      label: "Background Color",
    },
    headerBackground: {
      type: "text",
      label: "Header Background",
    },
    textColor: {
      type: "text",
      label: "Text Color",
    },
    borderRadius: {
      type: "select",
      label: "Border Radius",
      options: [
        { label: "None", value: "0px" },
        { label: "Small", value: "8px" },
        { label: "Medium", value: "12px" },
        { label: "Large", value: "16px" },
        { label: "XL", value: "24px" },
      ],
    },
    padding: {
      type: "select",
      label: "Padding",
      options: [
        { label: "Small", value: "12px" },
        { label: "Medium", value: "20px" },
        { label: "Large", value: "28px" },
      ],
    },
    shadow: {
      type: "select",
      label: "Shadow",
      options: [
        { label: "None", value: "none" },
        { label: "Small", value: "sm" },
        { label: "Medium", value: "md" },
        { label: "Large", value: "lg" },
        { label: "XL", value: "xl" },
      ],
    },
    border: {
      type: "radio",
      label: "Show Border",
      options: [
        { label: "Yes", value: true },
        { label: "No", value: false },
      ],
    },
    borderColor: {
      type: "text",
      label: "Border Color",
    },
    showDivider: {
      type: "radio",
      label: "Show Header Divider",
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
  },
  render: Card,
};
