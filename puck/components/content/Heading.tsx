"use client";

import { ComponentConfig } from "@puckeditor/core";
import { useState, useRef, useEffect } from "react";
import { AnimatedWrapper } from "../../animations/AnimatedWrapper";
import { AnimationConfig, LockConfig, GroupConfig, defaultAnimationConfig, defaultLockConfig, defaultGroupConfig } from "../../animations/types";
import { AnimationField } from "../../fields/AnimationField";
import { LockField } from "../../fields/LockField";
import { GroupField } from "../../fields/GroupField";
import { ResponsiveVisibility, VisibilitySettings } from "../../fields/ResponsiveVisibility";
import { getVisibilityClassName, defaultVisibility } from "../../utils/visibility";

export interface HeadingProps {
  text: string;
  level: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  fontSize: string;
  fontWeight: string;
  color: string;
  textAlign: "left" | "center" | "right";
  marginBottom: string;
  // Enhanced props
  animation?: Partial<AnimationConfig>;
  lock?: Partial<LockConfig>;
  group?: Partial<GroupConfig>;
  visibility?: VisibilitySettings;
  puck?: { isEditing?: boolean };
}

// Helper to normalize level prop (handles corrupted data where level might be a number)
function normalizeLevel(level: unknown): "h1" | "h2" | "h3" | "h4" | "h5" | "h6" {
  // If it's already a valid string
  if (typeof level === "string" && /^h[1-6]$/.test(level)) {
    return level as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  }
  // If it's a number (1-6), convert to h1-h6
  if (typeof level === "number" && level >= 1 && level <= 6) {
    return `h${level}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  }
  // Default fallback
  return "h2";
}

export const Heading = ({
  text,
  level,
  fontSize,
  fontWeight,
  color,
  textAlign,
  marginBottom,
  animation,
  lock,
  visibility,
  puck,
}: HeadingProps) => {
  const Tag = normalizeLevel(level);
  const [isInlineEditing, setIsInlineEditing] = useState(false);
  const [editedText, setEditedText] = useState(text);
  const editRef = useRef<HTMLDivElement>(null);

  const isEditing = puck?.isEditing ?? false;
  const isLocked = lock?.isLocked ?? false;
  const visibilityClasses = getVisibilityClassName(visibility);

  useEffect(() => {
    setEditedText(text);
  }, [text]);

  const handleBlur = () => {
    setIsInlineEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      editRef.current?.blur();
    }
    if (e.key === "Escape") {
      setEditedText(text);
      setIsInlineEditing(false);
    }
  };

  const style = {
    fontSize,
    fontWeight,
    color,
    textAlign,
    marginBottom,
    margin: 0,
    outline: "none",
    cursor: isEditing && !isLocked ? "text" : "default",
  };

  const renderContent = () => {
    if (isEditing) {
      return (
        <div className={visibilityClasses} style={{ position: "relative" }}>
          {isLocked && (
            <div
              style={{
                position: "absolute",
                top: -4,
                right: -4,
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
          <div
            ref={editRef}
            contentEditable={!isLocked}
            suppressContentEditableWarning
            onFocus={() => !isLocked && setIsInlineEditing(true)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            onInput={(e) => setEditedText(e.currentTarget.textContent || "")}
            style={{
              ...style,
              border: isInlineEditing ? "2px solid #3b82f6" : "2px solid transparent",
              borderRadius: "4px",
              padding: "2px 4px",
              transition: "border-color 0.2s",
              pointerEvents: isLocked ? "none" : undefined,
            }}
            data-puck-inline-edit="true"
          >
            {editedText}
          </div>
        </div>
      );
    }

    return (
      <div className={visibilityClasses}>
        <Tag style={style}>{text}</Tag>
      </div>
    );
  };

  const content = renderContent();

  if (animation?.enabled && !isEditing) {
    return (
      <AnimatedWrapper animation={animation} isEditing={isEditing}>
        {content}
      </AnimatedWrapper>
    );
  }

  return content;
};

export const HeadingConfig: ComponentConfig<HeadingProps> = {
  label: "Heading",
  defaultProps: {
    text: "Heading Text",
    level: "h2",
    fontSize: "32px",
    fontWeight: "700",
    color: "#1a1a1a",
    textAlign: "left",
    marginBottom: "16px",
    animation: defaultAnimationConfig,
    lock: defaultLockConfig,
    group: defaultGroupConfig,
    visibility: defaultVisibility,
  },
  fields: {
    text: {
      type: "textarea",
      label: "Text",
    },
    level: {
      type: "select",
      label: "Level",
      options: [
        { label: "H1", value: "h1" },
        { label: "H2", value: "h2" },
        { label: "H3", value: "h3" },
        { label: "H4", value: "h4" },
        { label: "H5", value: "h5" },
        { label: "H6", value: "h6" },
      ],
    },
    fontSize: {
      type: "select",
      label: "Font Size",
      options: [
        { label: "XS (16px)", value: "16px" },
        { label: "SM (20px)", value: "20px" },
        { label: "MD (24px)", value: "24px" },
        { label: "LG (32px)", value: "32px" },
        { label: "XL (40px)", value: "40px" },
        { label: "2XL (48px)", value: "48px" },
        { label: "3XL (60px)", value: "60px" },
        { label: "4XL (72px)", value: "72px" },
      ],
    },
    fontWeight: {
      type: "select",
      label: "Font Weight",
      options: [
        { label: "Normal (400)", value: "400" },
        { label: "Medium (500)", value: "500" },
        { label: "Semi Bold (600)", value: "600" },
        { label: "Bold (700)", value: "700" },
        { label: "Extra Bold (800)", value: "800" },
      ],
    },
    color: {
      type: "text",
      label: "Color",
    },
    textAlign: {
      type: "radio",
      label: "Text Align",
      options: [
        { label: "Left", value: "left" },
        { label: "Center", value: "center" },
        { label: "Right", value: "right" },
      ],
    },
    marginBottom: {
      type: "select",
      label: "Margin Bottom",
      options: [
        { label: "None", value: "0px" },
        { label: "Small (8px)", value: "8px" },
        { label: "Medium (16px)", value: "16px" },
        { label: "Large (24px)", value: "24px" },
        { label: "XL (32px)", value: "32px" },
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
  render: Heading,
};
