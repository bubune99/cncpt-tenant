"use client";

import React from "react";
import { ComponentConfig } from "@puckeditor/core";
import { GlobalSettingsField, defaultGlobalSettings } from "../../fields/GlobalSettingsField";

export interface GlobalSettings {
  isGlobal: boolean;
  scope: "all" | "selected";
  selectedPages: string[];
  excludedPages: string[];
}

export interface HeaderProps {
  logo: {
    type: "image" | "text";
    imageUrl?: string;
    text?: string;
    fontSize?: string;
    fontWeight?: string;
  };
  background: {
    type: "solid" | "transparent" | "blur";
    color: string;
  };
  textColor: string;
  height: string;
  paddingX: string;
  maxWidth: string;
  sticky: boolean;
  shadow: "none" | "sm" | "md" | "lg";
  layout: "3-column" | "2-column-left" | "2-column-right" | "logo-center";
  columnGap: string;
  verticalAlign: "start" | "center" | "end";
  // Column widths
  leftColumnWidth: string;
  centerColumnWidth: string;
  rightColumnWidth: string;
  globalSettings: GlobalSettings;
  // Three column slots
  leftContent?: React.FC | never[];
  centerContent?: React.FC | never[];
  rightContent?: React.FC | never[];
}

const shadowStyles = {
  none: "none",
  sm: "0 1px 2px rgba(0,0,0,0.05)",
  md: "0 4px 6px rgba(0,0,0,0.1)",
  lg: "0 10px 15px rgba(0,0,0,0.1)",
};

export const Header = ({
  logo = { type: "text", text: "Logo", fontSize: "24px", fontWeight: "bold" },
  background = { type: "solid", color: "#ffffff" },
  textColor = "#1a1a1a",
  height = "70px",
  paddingX = "24px",
  maxWidth = "1200px",
  sticky = true,
  shadow = "sm",
  layout = "3-column",
  columnGap = "24px",
  verticalAlign = "center",
  leftColumnWidth = "auto",
  centerColumnWidth = "1fr",
  rightColumnWidth = "auto",
  globalSettings = defaultGlobalSettings,
  leftContent: LeftContent,
  centerContent: CenterContent,
  rightContent: RightContent,
}: HeaderProps) => {
  const getBackgroundStyles = (): React.CSSProperties => {
    switch (background.type) {
      case "transparent":
        return { backgroundColor: "transparent" };
      case "blur":
        return {
          backgroundColor: `${background.color}cc`,
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
        };
      default:
        return { backgroundColor: background.color };
    }
  };

  const renderLogo = () => {
    if (logo.type === "image" && logo.imageUrl) {
      return (
        <img
          src={logo.imageUrl}
          alt="Logo"
          style={{
            height: "40px",
            width: "auto",
            objectFit: "contain",
          }}
        />
      );
    }
    return (
      <span
        style={{
          fontSize: logo.fontSize || "24px",
          fontWeight: logo.fontWeight || "bold",
          color: "inherit",
          whiteSpace: "nowrap",
        }}
      >
        {logo.text || "Logo"}
      </span>
    );
  };

  // Determine grid template based on layout
  const getGridTemplate = () => {
    switch (layout) {
      case "2-column-left":
        return `${leftColumnWidth} ${centerColumnWidth}`;
      case "2-column-right":
        return `${centerColumnWidth} ${rightColumnWidth}`;
      case "logo-center":
        return `${leftColumnWidth} auto ${rightColumnWidth}`;
      default: // 3-column
        return `${leftColumnWidth} ${centerColumnWidth} ${rightColumnWidth}`;
    }
  };

  return (
    <header
      style={{
        ...getBackgroundStyles(),
        color: textColor,
        position: sticky ? "sticky" : "relative",
        top: sticky ? 0 : undefined,
        zIndex: sticky ? 1000 : undefined,
        boxShadow: shadowStyles[shadow],
        width: "100%",
      }}
    >
      <div
        style={{
          maxWidth: maxWidth,
          margin: "0 auto",
          minHeight: height,
          paddingLeft: paddingX,
          paddingRight: paddingX,
          display: "grid",
          gridTemplateColumns: getGridTemplate(),
          alignItems: verticalAlign === "start" ? "flex-start" : verticalAlign === "end" ? "flex-end" : "center",
          gap: columnGap,
        }}
      >
        {/* Left Column - Logo + Left Content */}
        {layout !== "2-column-right" && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              justifyContent: "flex-start",
            }}
          >
            {layout !== "logo-center" && renderLogo()}
            {typeof LeftContent === "function" && <LeftContent />}
          </div>
        )}

        {/* Center Column */}
        {(layout === "3-column" || layout === "2-column-left" || layout === "2-column-right") && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: layout === "2-column-left" ? "flex-end" : "center",
              gap: "16px",
            }}
          >
            {typeof CenterContent === "function" && <CenterContent />}
          </div>
        )}

        {/* Logo Center (for logo-center layout) */}
        {layout === "logo-center" && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {renderLogo()}
          </div>
        )}

        {/* Right Column */}
        {layout !== "2-column-left" && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              justifyContent: "flex-end",
            }}
          >
            {typeof RightContent === "function" && <RightContent />}
          </div>
        )}
      </div>
    </header>
  );
};

export const HeaderConfig: ComponentConfig<HeaderProps> = {
  label: "Header",
  fields: {
    layout: {
      type: "radio",
      label: "Layout",
      options: [
        { label: "3 Columns", value: "3-column" },
        { label: "2 Columns (Logo Left)", value: "2-column-left" },
        { label: "2 Columns (Logo Right)", value: "2-column-right" },
        { label: "Logo Center", value: "logo-center" },
      ],
    },
    logo: {
      type: "object",
      label: "Logo",
      objectFields: {
        type: {
          type: "radio",
          label: "Type",
          options: [
            { label: "Text", value: "text" },
            { label: "Image", value: "image" },
          ],
        },
        text: {
          type: "text",
          label: "Logo Text",
        },
        imageUrl: {
          type: "text",
          label: "Image URL",
        },
        fontSize: {
          type: "text",
          label: "Font Size",
        },
        fontWeight: {
          type: "select",
          label: "Font Weight",
          options: [
            { label: "Normal", value: "normal" },
            { label: "Medium", value: "500" },
            { label: "Semi-bold", value: "600" },
            { label: "Bold", value: "bold" },
          ],
        },
      },
    },
    background: {
      type: "object",
      label: "Background",
      objectFields: {
        type: {
          type: "radio",
          label: "Type",
          options: [
            { label: "Solid", value: "solid" },
            { label: "Transparent", value: "transparent" },
            { label: "Blur", value: "blur" },
          ],
        },
        color: {
          type: "text",
          label: "Color",
        },
      },
    },
    textColor: {
      type: "text",
      label: "Text Color",
    },
    sticky: {
      type: "radio",
      label: "Sticky",
      options: [
        { label: "Yes", value: true },
        { label: "No", value: false },
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
      ],
    },
    height: {
      type: "text",
      label: "Height",
    },
    maxWidth: {
      type: "text",
      label: "Max Width",
    },
    paddingX: {
      type: "text",
      label: "Horizontal Padding",
    },
    columnGap: {
      type: "text",
      label: "Column Gap",
    },
    verticalAlign: {
      type: "radio",
      label: "Vertical Alignment",
      options: [
        { label: "Top", value: "start" },
        { label: "Center", value: "center" },
        { label: "Bottom", value: "end" },
      ],
    },
    leftColumnWidth: {
      type: "text",
      label: "Left Column Width",
    },
    centerColumnWidth: {
      type: "text",
      label: "Center Column Width",
    },
    rightColumnWidth: {
      type: "text",
      label: "Right Column Width",
    },
    leftContent: {
      type: "slot",
      label: "Left Column Content",
    },
    centerContent: {
      type: "slot",
      label: "Center Column Content",
    },
    rightContent: {
      type: "slot",
      label: "Right Column Content",
    },
    globalSettings: {
      type: "custom",
      label: "Global Settings",
      render: ({ value, onChange }) => (
        <GlobalSettingsField
          value={value || defaultGlobalSettings}
          onChange={onChange}
        />
      ),
    },
  },
  defaultProps: {
    logo: {
      type: "text",
      text: "Logo",
      fontSize: "24px",
      fontWeight: "bold",
    },
    background: {
      type: "solid",
      color: "#ffffff",
    },
    textColor: "#1a1a1a",
    height: "70px",
    paddingX: "24px",
    maxWidth: "1200px",
    sticky: true,
    shadow: "sm",
    layout: "3-column",
    columnGap: "24px",
    verticalAlign: "center",
    leftColumnWidth: "auto",
    centerColumnWidth: "1fr",
    rightColumnWidth: "auto",
    globalSettings: {
      isGlobal: false,
      scope: "all",
      selectedPages: [],
      excludedPages: [],
    },
    leftContent: [],
    centerContent: [],
    rightContent: [],
  },
  render: Header,
};
