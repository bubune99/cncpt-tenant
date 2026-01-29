"use client";

import React from "react";
import { ComponentConfig } from "@puckeditor/core";
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

export interface StatsCardProps {
  title: string | React.ReactNode; // Support inline editing
  value: string | React.ReactNode; // Support inline editing
  subtitle?: string | React.ReactNode; // Support inline editing
  icon?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  borderRadius: string;
  padding: string;
  shadow: "none" | "sm" | "md" | "lg" | "xl";
  // Enhanced props
  animation?: Partial<AnimationConfig>;
  lock?: Partial<LockConfig>;
  group?: Partial<GroupConfig>;
  puck?: { isEditing?: boolean };
}

const shadowStyles = {
  none: "none",
  sm: "0 1px 2px rgba(0,0,0,0.05)",
  md: "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)",
  lg: "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)",
  xl: "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)",
};

const TrendIcon = ({ trend, color }: { trend: string; color: string }) => {
  if (trend === "up") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill={color}>
        <path d="M7 14l5-5 5 5H7z" />
      </svg>
    );
  }
  if (trend === "down") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill={color}>
        <path d="M7 10l5 5 5-5H7z" />
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill={color}>
      <path d="M4 12h16v2H4z" />
    </svg>
  );
};

export const StatsCard = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendValue,
  backgroundColor,
  textColor,
  accentColor,
  borderRadius,
  padding,
  shadow,
  animation,
  lock,
  puck,
}: StatsCardProps) => {
  const isEditing = puck?.isEditing ?? false;
  const isLocked = lock?.isLocked ?? false;

  const trendColors = {
    up: "#10b981",
    down: "#ef4444",
    neutral: "#6b7280",
  };

  const content = (
    <div
      style={{
        position: "relative",
        backgroundColor,
        borderRadius,
        padding,
        boxShadow: shadowStyles[shadow],
        border: "1px solid rgba(0,0,0,0.05)",
        transition: "all 0.2s ease",
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

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <p
            style={{
              margin: 0,
              marginBottom: "8px",
              fontSize: "14px",
              fontWeight: 500,
              color: textColor,
              opacity: 0.7,
            }}
          >
            {title}
          </p>
          <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
            <span
              style={{
                fontSize: "32px",
                fontWeight: 700,
                color: textColor,
                lineHeight: 1,
              }}
            >
              {value}
            </span>
            {trend && trendValue && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "2px",
                  padding: "2px 6px",
                  borderRadius: "4px",
                  backgroundColor: `${trendColors[trend]}15`,
                }}
              >
                <TrendIcon trend={trend} color={trendColors[trend]} />
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: trendColors[trend],
                  }}
                >
                  {trendValue}
                </span>
              </div>
            )}
          </div>
          {subtitle && (
            <p
              style={{
                margin: 0,
                marginTop: "8px",
                fontSize: "13px",
                color: textColor,
                opacity: 0.5,
              }}
            >
              {subtitle}
            </p>
          )}
        </div>

        {icon && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              backgroundColor: `${accentColor}15`,
              fontSize: "24px",
            }}
          >
            {icon}
          </div>
        )}
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

export const StatsCardConfig: ComponentConfig<StatsCardProps> = {
  label: "Stats Card",
  defaultProps: {
    title: "Total Revenue",
    value: "$45,231",
    subtitle: "vs last month",
    icon: "💰",
    trend: "up",
    trendValue: "12.5%",
    backgroundColor: "#ffffff",
    textColor: "#1a1a1a",
    accentColor: "#3b82f6",
    borderRadius: "12px",
    padding: "24px",
    shadow: "md",
    animation: defaultAnimationConfig,
    lock: defaultLockConfig,
    group: defaultGroupConfig,
  },
  fields: {
    title: {
      type: "text",
      label: "Title",
      contentEditable: true, // Enable inline editing in viewport
    },
    value: {
      type: "text",
      label: "Value",
      contentEditable: true, // Enable inline editing in viewport
    },
    subtitle: {
      type: "text",
      label: "Subtitle",
      contentEditable: true, // Enable inline editing in viewport
    },
    icon: {
      type: "text",
      label: "Icon (emoji)",
    },
    trend: {
      type: "radio",
      label: "Trend Direction",
      options: [
        { label: "Up", value: "up" },
        { label: "Down", value: "down" },
        { label: "Neutral", value: "neutral" },
      ],
    },
    trendValue: {
      type: "text",
      label: "Trend Value",
    },
    backgroundColor: {
      type: "text",
      label: "Background Color",
    },
    textColor: {
      type: "text",
      label: "Text Color",
    },
    accentColor: {
      type: "text",
      label: "Accent Color",
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
        { label: "Small", value: "16px" },
        { label: "Medium", value: "24px" },
        { label: "Large", value: "32px" },
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
  render: StatsCard,
};
