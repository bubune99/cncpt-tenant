"use client";

import { ComponentConfig } from "@puckeditor/core";
import { AnimatedWrapper } from "../../animations/AnimatedWrapper";
import { AnimationConfig, defaultAnimationConfig } from "../../animations/types";
import { AnimationField } from "../../fields/AnimationField";
import { ResponsiveVisibility, VisibilitySettings } from "../../fields/ResponsiveVisibility";
import { getVisibilityClassName, defaultVisibility } from "../../utils/visibility";
import {
  SizeField,
  SizeSettings,
  getSizeStyles,
  defaultSizeSettings,
  EffectsField,
  EffectsSettings,
  getEffectsStyles,
  defaultEffectsSettings,
  TransformField,
  TransformSettings,
  getTransformStyles,
  defaultTransformSettings,
} from "../../fields";

// Common icons as inline SVGs
const icons: Record<string, string> = {
  // Arrows
  "arrow-up": `<path d="M12 19V5M5 12l7-7 7 7"/>`,
  "arrow-down": `<path d="M12 5v14M19 12l-7 7-7-7"/>`,
  "arrow-left": `<path d="M19 12H5M12 19l-7-7 7-7"/>`,
  "arrow-right": `<path d="M5 12h14M12 5l7 7-7 7"/>`,
  "chevron-up": `<path d="M18 15l-6-6-6 6"/>`,
  "chevron-down": `<path d="M6 9l6 6 6-6"/>`,
  "chevron-left": `<path d="M15 18l-6-6 6-6"/>`,
  "chevron-right": `<path d="M9 6l6 6-6 6"/>`,
  // Actions
  "check": `<path d="M20 6L9 17l-5-5"/>`,
  "x": `<path d="M18 6L6 18M6 6l12 12"/>`,
  "plus": `<path d="M12 5v14M5 12h14"/>`,
  "minus": `<path d="M5 12h14"/>`,
  "search": `<circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>`,
  "menu": `<path d="M4 6h16M4 12h16M4 18h16"/>`,
  "settings": `<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>`,
  // Communication
  "mail": `<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><path d="M22 6l-10 7L2 6"/>`,
  "phone": `<path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>`,
  "message-circle": `<path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/>`,
  // User
  "user": `<path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>`,
  "users": `<path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>`,
  // Media
  "image": `<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>`,
  "video": `<polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>`,
  "play": `<polygon points="5 3 19 12 5 21 5 3"/>`,
  "pause": `<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>`,
  // Objects
  "home": `<path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><path d="M9 22V12h6v10"/>`,
  "star": `<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>`,
  "heart": `<path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>`,
  "bookmark": `<path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>`,
  "calendar": `<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><path d="M16 2v4M8 2v4M3 10h18"/>`,
  "clock": `<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>`,
  "gift": `<path d="M20 12v10H4V12M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/>`,
  "shopping-cart": `<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/>`,
  "credit-card": `<rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><path d="M1 10h22"/>`,
  // Finance
  "dollar-sign": `<path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>`,
  "trending-up": `<path d="M23 6l-9.5 9.5-5-5L1 18"/><path d="M17 6h6v6"/>`,
  "trending-down": `<path d="M23 18l-9.5-9.5-5 5L1 6"/><path d="M17 18h6v-6"/>`,
  "bar-chart": `<path d="M12 20V10M18 20V4M6 20v-4"/>`,
  "pie-chart": `<path d="M21.21 15.89A10 10 0 118 2.83"/><path d="M22 12A10 10 0 0012 2v10z"/>`,
  // Social
  "share": `<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98"/>`,
  "thumbs-up": `<path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3zM7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3"/>`,
  "thumbs-down": `<path d="M10 15v4a3 3 0 003 3l4-9V2H5.72a2 2 0 00-2 1.7l-1.38 9a2 2 0 002 2.3zm7-13h2.67A2.31 2.31 0 0122 4v7a2.31 2.31 0 01-2.33 2H17"/>`,
  // Misc
  "zap": `<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>`,
  "shield": `<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>`,
  "lock": `<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>`,
  "unlock": `<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 019.9-1"/>`,
  "eye": `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>`,
  "eye-off": `<path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22"/>`,
  "info": `<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>`,
  "alert-circle": `<circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>`,
  "help-circle": `<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01"/>`,
  "external-link": `<path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/>`,
  "download": `<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>`,
  "upload": `<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>`,
  "copy": `<rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>`,
  "edit": `<path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>`,
  "trash": `<path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6"/>`,
  "refresh": `<path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>`,
  "layers": `<polygon points="12 2 2 7 12 12 22 7 12 2"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>`,
  "grid": `<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>`,
  "list": `<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>`,
};

const iconList = Object.keys(icons);

export interface IconProps {
  icon: string;
  size: string;
  color: string;
  strokeWidth: number;
  // Alignment
  align: "left" | "center" | "right";
  // Design
  sizeSettings?: SizeSettings;
  effects?: EffectsSettings;
  transform?: TransformSettings;
  // Behavior
  animation?: Partial<AnimationConfig>;
  visibility?: VisibilitySettings;
  puck?: { isEditing?: boolean };
}

export const Icon = ({
  icon,
  size,
  color,
  strokeWidth,
  align,
  sizeSettings,
  effects,
  transform,
  animation,
  visibility,
  puck,
}: IconProps) => {
  const isEditing = puck?.isEditing ?? false;
  const visibilityClasses = getVisibilityClassName(visibility);

  const effectsStyles = getEffectsStyles(effects);
  const transformStyles = getTransformStyles(transform);
  const sizeStyles = getSizeStyles(sizeSettings);

  const iconPath = icons[icon] || icons["star"];

  const wrapperStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: align === "left" ? "flex-start" : align === "right" ? "flex-end" : "center",
    ...sizeStyles,
  };

  const svgStyle: React.CSSProperties = {
    width: size,
    height: size,
    flexShrink: 0,
    ...effectsStyles,
    ...transformStyles,
  };

  const content = (
    <div className={visibilityClasses} style={wrapperStyle}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={svgStyle}
        dangerouslySetInnerHTML={{ __html: iconPath }}
      />
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

export const IconConfig: ComponentConfig<IconProps> = {
  label: "Icon",
  defaultProps: {
    icon: "star",
    size: "24px",
    color: "#1a1a1a",
    strokeWidth: 2,
    align: "left",
    sizeSettings: defaultSizeSettings,
    effects: defaultEffectsSettings,
    transform: defaultTransformSettings,
    animation: defaultAnimationConfig,
    visibility: defaultVisibility,
  },
  fields: {
    icon: {
      type: "select",
      label: "Icon",
      options: iconList.map((name) => ({ label: name.replace(/-/g, " "), value: name })),
    },
    size: {
      type: "select",
      label: "Size",
      options: [
        { label: "XS (16px)", value: "16px" },
        { label: "SM (20px)", value: "20px" },
        { label: "MD (24px)", value: "24px" },
        { label: "LG (32px)", value: "32px" },
        { label: "XL (40px)", value: "40px" },
        { label: "2XL (48px)", value: "48px" },
        { label: "3XL (64px)", value: "64px" },
      ],
    },
    color: {
      type: "text",
      label: "Color",
    },
    strokeWidth: {
      type: "select",
      label: "Stroke Width",
      options: [
        { label: "Thin (1)", value: 1 },
        { label: "Normal (2)", value: 2 },
        { label: "Bold (2.5)", value: 2.5 },
        { label: "Extra Bold (3)", value: 3 },
      ],
    },
    align: {
      type: "radio",
      label: "Alignment",
      options: [
        { label: "Left", value: "left" },
        { label: "Center", value: "center" },
        { label: "Right", value: "right" },
      ],
    },
    sizeSettings: {
      type: "custom",
      label: "Size Settings",
      render: ({ value, onChange }) => (
        <SizeField value={value || defaultSizeSettings} onChange={onChange} showOverflow={false} />
      ),
    },
    effects: {
      type: "custom",
      label: "Effects",
      render: ({ value, onChange }) => (
        <EffectsField value={value || defaultEffectsSettings} onChange={onChange} />
      ),
    },
    transform: {
      type: "custom",
      label: "Transform",
      render: ({ value, onChange }) => (
        <TransformField value={value || defaultTransformSettings} onChange={onChange} />
      ),
    },
    animation: {
      type: "custom",
      label: "Animation",
      render: ({ value, onChange }) => (
        <AnimationField value={value || defaultAnimationConfig} onChange={onChange} />
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
  render: Icon,
};
