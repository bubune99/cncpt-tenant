"use client";

import { ComponentConfig } from "@measured/puck";
import { useState, useRef, useEffect } from "react";
import { AnimatedWrapper } from "../../animations/AnimatedWrapper";
import { AnimationConfig, LockConfig, GroupConfig, defaultAnimationConfig, defaultLockConfig, defaultGroupConfig } from "../../animations/types";
import { AnimationField } from "../../fields/AnimationField";
import { LockField } from "../../fields/LockField";
import { GroupField } from "../../fields/GroupField";
import { ResponsiveVisibility, VisibilitySettings } from "../../fields/ResponsiveVisibility";
import { getVisibilityClassName, defaultVisibility } from "../../utils/visibility";

export interface TextProps {
  text: string;
  fontSize: string;
  fontWeight: string;
  color: string;
  textAlign: "left" | "center" | "right" | "justify";
  lineHeight: string;
  marginBottom: string;
  maxWidth?: string;
  // Enhanced props
  animation?: Partial<AnimationConfig>;
  lock?: Partial<LockConfig>;
  group?: Partial<GroupConfig>;
  visibility?: VisibilitySettings;
  puck?: { isEditing?: boolean };
}

export const Text = ({
  text,
  fontSize,
  fontWeight,
  color,
  textAlign,
  lineHeight,
  marginBottom,
  maxWidth,
  animation,
  lock,
  visibility,
  puck,
}: TextProps) => {
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
    if (e.key === "Escape") {
      setEditedText(text);
      setIsInlineEditing(false);
    }
  };

  const style: React.CSSProperties = {
    fontSize,
    fontWeight,
    color,
    textAlign,
    lineHeight,
    marginBottom,
    maxWidth: maxWidth || "none",
    margin: 0,
    whiteSpace: "pre-wrap",
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
              outline: "none",
              border: isInlineEditing ? "2px solid #3b82f6" : "2px solid transparent",
              borderRadius: "4px",
              padding: "2px 4px",
              transition: "border-color 0.2s",
              cursor: isLocked ? "default" : "text",
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
        <p style={style}>{text}</p>
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

export const TextConfig: ComponentConfig<TextProps> = {
  label: "Text",
  defaultProps: {
    text: "Enter your text here. This is a paragraph component that supports inline editing when in edit mode.",
    fontSize: "16px",
    fontWeight: "400",
    color: "#4a4a4a",
    textAlign: "left",
    lineHeight: "1.6",
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
    fontSize: {
      type: "select",
      label: "Font Size",
      options: [
        { label: "XS (12px)", value: "12px" },
        { label: "SM (14px)", value: "14px" },
        { label: "Base (16px)", value: "16px" },
        { label: "LG (18px)", value: "18px" },
        { label: "XL (20px)", value: "20px" },
        { label: "2XL (24px)", value: "24px" },
      ],
    },
    fontWeight: {
      type: "select",
      label: "Font Weight",
      options: [
        { label: "Light (300)", value: "300" },
        { label: "Normal (400)", value: "400" },
        { label: "Medium (500)", value: "500" },
        { label: "Semi Bold (600)", value: "600" },
        { label: "Bold (700)", value: "700" },
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
        { label: "Justify", value: "justify" },
      ],
    },
    lineHeight: {
      type: "select",
      label: "Line Height",
      options: [
        { label: "Tight (1.2)", value: "1.2" },
        { label: "Normal (1.4)", value: "1.4" },
        { label: "Relaxed (1.6)", value: "1.6" },
        { label: "Loose (1.8)", value: "1.8" },
        { label: "Extra Loose (2)", value: "2" },
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
    maxWidth: {
      type: "text",
      label: "Max Width",
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
  render: Text,
};
