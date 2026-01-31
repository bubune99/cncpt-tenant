"use client";

import { ComponentConfig } from "@puckeditor/core";
import { AnimatedWrapper } from "../../animations/AnimatedWrapper";
import { AnimationConfig, LockConfig, GroupConfig, defaultAnimationConfig, defaultLockConfig, defaultGroupConfig } from "../../animations/types";
import { AnimationField } from "../../fields/AnimationField";
import { LockField } from "../../fields/LockField";
import { GroupField } from "../../fields/GroupField";
import { ResponsiveVisibility, VisibilitySettings } from "../../fields/ResponsiveVisibility";
import { getVisibilityClassName, defaultVisibility } from "../../utils/visibility";

export interface ImageProps {
  src: string;
  alt: string;
  width: string;
  height: string;
  objectFit: "contain" | "cover" | "fill" | "none" | "scale-down";
  borderRadius: string;
  boxShadow: string;
  alignment: "left" | "center" | "right";
  // Enhanced props
  animation?: Partial<AnimationConfig>;
  lock?: Partial<LockConfig>;
  group?: Partial<GroupConfig>;
  visibility?: VisibilitySettings;
  puck?: { isEditing?: boolean };
}

export const Image = ({
  src,
  alt,
  width,
  height,
  objectFit,
  borderRadius,
  boxShadow,
  alignment,
  animation,
  lock,
  visibility,
  puck,
}: ImageProps) => {
  const isEditing = puck?.isEditing ?? false;
  const isLocked = lock?.isLocked ?? false;
  const visibilityClasses = getVisibilityClassName(visibility);

  const alignmentStyles: Record<string, React.CSSProperties> = {
    left: { marginRight: "auto" },
    center: { marginLeft: "auto", marginRight: "auto" },
    right: { marginLeft: "auto" },
  };

  const content = (
    <div
      className={visibilityClasses}
      style={{
        display: "flex",
        justifyContent: alignment === "center" ? "center" : alignment === "right" ? "flex-end" : "flex-start",
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
      {src ? (
        <img
          src={src}
          alt={alt}
          style={{
            width,
            height,
            objectFit,
            borderRadius,
            boxShadow,
            display: "block",
            maxWidth: "100%",
            ...alignmentStyles[alignment],
          }}
        />
      ) : (
        <div
          style={{
            width,
            height: height === "auto" ? "200px" : height,
            backgroundColor: "#f3f4f6",
            borderRadius,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#9ca3af",
            fontSize: "14px",
            border: "2px dashed #d1d5db",
            ...alignmentStyles[alignment],
          }}
        >
          Add image URL
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

export const ImageConfig: ComponentConfig<ImageProps> = {
  label: "Image",
  defaultProps: {
    src: "",
    alt: "Image description",
    width: "100%",
    height: "auto",
    objectFit: "cover",
    borderRadius: "0px",
    boxShadow: "none",
    alignment: "center",
    animation: defaultAnimationConfig,
    lock: defaultLockConfig,
    group: defaultGroupConfig,
    visibility: defaultVisibility,
  },
  fields: {
    src: {
      type: "text",
      label: "Image URL",
    },
    alt: {
      type: "text",
      label: "Alt Text",
    },
    width: {
      type: "select",
      label: "Width",
      options: [
        { label: "Auto", value: "auto" },
        { label: "Full (100%)", value: "100%" },
        { label: "3/4 (75%)", value: "75%" },
        { label: "Half (50%)", value: "50%" },
        { label: "1/3 (33%)", value: "33%" },
        { label: "1/4 (25%)", value: "25%" },
        { label: "Small (200px)", value: "200px" },
        { label: "Medium (400px)", value: "400px" },
        { label: "Large (600px)", value: "600px" },
      ],
    },
    height: {
      type: "select",
      label: "Height",
      options: [
        { label: "Auto", value: "auto" },
        { label: "Small (150px)", value: "150px" },
        { label: "Medium (300px)", value: "300px" },
        { label: "Large (450px)", value: "450px" },
        { label: "XL (600px)", value: "600px" },
      ],
    },
    objectFit: {
      type: "select",
      label: "Object Fit",
      options: [
        { label: "Cover", value: "cover" },
        { label: "Contain", value: "contain" },
        { label: "Fill", value: "fill" },
        { label: "None", value: "none" },
        { label: "Scale Down", value: "scale-down" },
      ],
    },
    borderRadius: {
      type: "select",
      label: "Border Radius",
      options: [
        { label: "None", value: "0px" },
        { label: "Small (4px)", value: "4px" },
        { label: "Medium (8px)", value: "8px" },
        { label: "Large (16px)", value: "16px" },
        { label: "XL (24px)", value: "24px" },
        { label: "Full (9999px)", value: "9999px" },
      ],
    },
    boxShadow: {
      type: "select",
      label: "Box Shadow",
      options: [
        { label: "None", value: "none" },
        { label: "Small", value: "0 1px 3px rgba(0,0,0,0.12)" },
        { label: "Medium", value: "0 4px 6px rgba(0,0,0,0.1)" },
        { label: "Large", value: "0 10px 25px rgba(0,0,0,0.15)" },
      ],
    },
    alignment: {
      type: "radio",
      label: "Alignment",
      options: [
        { label: "Left", value: "left" },
        { label: "Center", value: "center" },
        { label: "Right", value: "right" },
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
  render: Image,
};
