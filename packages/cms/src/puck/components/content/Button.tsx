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

export interface ButtonProps {
  text: string;
  href: string;
  variant: "primary" | "secondary" | "outline" | "ghost";
  size: "sm" | "md" | "lg";
  backgroundColor: string;
  textColor: string;
  borderRadius: string;
  fullWidth: boolean;
  openInNewTab: boolean;
  // Enhanced props
  animation?: Partial<AnimationConfig>;
  lock?: Partial<LockConfig>;
  group?: Partial<GroupConfig>;
  visibility?: VisibilitySettings;
  puck?: { isEditing?: boolean };
}

const variantStyles = {
  primary: {
    backgroundColor: "#3b82f6",
    color: "#ffffff",
    border: "none",
  },
  secondary: {
    backgroundColor: "#6b7280",
    color: "#ffffff",
    border: "none",
  },
  outline: {
    backgroundColor: "transparent",
    color: "#3b82f6",
    border: "2px solid #3b82f6",
  },
  ghost: {
    backgroundColor: "transparent",
    color: "#3b82f6",
    border: "none",
  },
};

const sizeStyles = {
  sm: {
    padding: "8px 16px",
    fontSize: "14px",
  },
  md: {
    padding: "12px 24px",
    fontSize: "16px",
  },
  lg: {
    padding: "16px 32px",
    fontSize: "18px",
  },
};

export const Button = ({
  text,
  href,
  variant,
  size,
  backgroundColor,
  textColor,
  borderRadius,
  fullWidth,
  openInNewTab,
  animation,
  lock,
  visibility,
  puck,
}: ButtonProps) => {
  const [isInlineEditing, setIsInlineEditing] = useState(false);
  const [editedText, setEditedText] = useState(text);
  const editRef = useRef<HTMLSpanElement>(null);

  const isEditing = puck?.isEditing ?? false;
  const isLocked = lock?.isLocked ?? false;
  const visibilityClasses = getVisibilityClassName(visibility);

  useEffect(() => {
    setEditedText(text);
  }, [text]);

  const baseVariantStyle = variantStyles[variant];
  const sizeStyle = sizeStyles[size];

  const style: React.CSSProperties = {
    ...baseVariantStyle,
    ...sizeStyle,
    backgroundColor: backgroundColor || baseVariantStyle.backgroundColor,
    color: textColor || baseVariantStyle.color,
    borderRadius,
    width: fullWidth ? "100%" : "auto",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "600",
    textDecoration: "none",
    cursor: isEditing && !isLocked ? "text" : "pointer",
    transition: "all 0.2s ease",
  };

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

  const renderContent = () => {
    if (isEditing) {
      return (
        <div className={visibilityClasses} style={{ position: "relative", display: "inline-block" }}>
          {isLocked && (
            <div
              style={{
                position: "absolute",
                top: -8,
                right: -8,
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
          <span
            style={{
              ...style,
              outline: isInlineEditing ? "2px solid #3b82f6" : "none",
              outlineOffset: "2px",
              pointerEvents: isLocked ? "none" : undefined,
            }}
          >
            <span
              ref={editRef}
              contentEditable={!isLocked}
              suppressContentEditableWarning
              onFocus={() => !isLocked && setIsInlineEditing(true)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              onInput={(e) => setEditedText(e.currentTarget.textContent || "")}
              style={{ outline: "none" }}
              data-puck-inline-edit="true"
            >
              {editedText}
            </span>
          </span>
        </div>
      );
    }

    return (
      <div className={visibilityClasses} style={{ display: "inline-block" }}>
        <a
          href={href}
          target={openInNewTab ? "_blank" : undefined}
          rel={openInNewTab ? "noopener noreferrer" : undefined}
          style={style}
        >
          {text}
        </a>
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

export const ButtonConfig: ComponentConfig<ButtonProps> = {
  label: "Button",
  defaultProps: {
    text: "Click Me",
    href: "#",
    variant: "primary",
    size: "md",
    backgroundColor: "",
    textColor: "",
    borderRadius: "8px",
    fullWidth: false,
    openInNewTab: false,
    animation: defaultAnimationConfig,
    lock: defaultLockConfig,
    group: defaultGroupConfig,
    visibility: defaultVisibility,
  },
  fields: {
    text: {
      type: "text",
      label: "Button Text",
    },
    href: {
      type: "text",
      label: "Link URL",
    },
    variant: {
      type: "select",
      label: "Variant",
      options: [
        { label: "Primary", value: "primary" },
        { label: "Secondary", value: "secondary" },
        { label: "Outline", value: "outline" },
        { label: "Ghost", value: "ghost" },
      ],
    },
    size: {
      type: "radio",
      label: "Size",
      options: [
        { label: "Small", value: "sm" },
        { label: "Medium", value: "md" },
        { label: "Large", value: "lg" },
      ],
    },
    backgroundColor: {
      type: "text",
      label: "Background Color (override)",
    },
    textColor: {
      type: "text",
      label: "Text Color (override)",
    },
    borderRadius: {
      type: "select",
      label: "Border Radius",
      options: [
        { label: "None", value: "0px" },
        { label: "Small (4px)", value: "4px" },
        { label: "Medium (8px)", value: "8px" },
        { label: "Large (16px)", value: "16px" },
        { label: "Full (9999px)", value: "9999px" },
      ],
    },
    fullWidth: {
      type: "radio",
      label: "Full Width",
      options: [
        { label: "Yes", value: true },
        { label: "No", value: false },
      ],
    },
    openInNewTab: {
      type: "radio",
      label: "Open in New Tab",
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
  render: Button,
};
