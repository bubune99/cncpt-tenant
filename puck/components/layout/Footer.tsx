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

// Using defaultGlobalSettings from GlobalSettingsField

export interface FooterProps {
  background: {
    type: "solid" | "gradient";
    color: string;
    gradientTo?: string;
  };
  textColor: string;
  paddingTop: string;
  paddingBottom: string;
  paddingX: string;
  maxWidth: string;
  columnsCount: "2" | "3" | "4";
  columnsLayout: "equal" | "1-2" | "2-1" | "1-1-2" | "2-1-1" | "1-2-1" | "custom";
  customColumnWidths: string;
  columnGap: string;
  rowGap: string;
  mobileStack: boolean;
  mobileBreakpoint: string;
  showDivider: boolean;
  dividerColor: string;
  copyright: {
    show: boolean;
    text: string;
    align: "left" | "center" | "right";
  };
  bottomSlotLayout: {
    direction: "row" | "column";
    gap: string;
    align: "start" | "center" | "end";
    justify: "start" | "center" | "end" | "space-between" | "space-around";
    wrap: boolean;
  };
  globalSettings: GlobalSettings;
  // Individual column slots
  column1?: React.FC | never[];
  column2?: React.FC | never[];
  column3?: React.FC | never[];
  column4?: React.FC | never[];
  bottomContent?: React.FC | never[];
}

export const Footer = ({
  background = { type: "solid", color: "#1e293b" },
  textColor = "#e2e8f0",
  paddingTop = "64px",
  paddingBottom = "32px",
  paddingX = "24px",
  maxWidth = "1200px",
  columnsCount = "4",
  columnsLayout = "equal",
  customColumnWidths = "1fr 1fr 1fr 1fr",
  columnGap = "48px",
  rowGap = "32px",
  mobileStack = true,
  mobileBreakpoint = "768px",
  showDivider = true,
  dividerColor = "rgba(255,255,255,0.1)",
  copyright = {
    show: true,
    text: `© ${new Date().getFullYear()} Your Company. All rights reserved.`,
    align: "center",
  },
  bottomSlotLayout = {
    direction: "row",
    gap: "24px",
    align: "center",
    justify: "center",
    wrap: true,
  },
  globalSettings = defaultGlobalSettings,
  column1: Column1,
  column2: Column2,
  column3: Column3,
  column4: Column4,
  bottomContent: BottomContent,
}: FooterProps) => {
  const getBackgroundStyles = (): React.CSSProperties => {
    if (background.type === "gradient" && background.gradientTo) {
      return {
        background: `linear-gradient(180deg, ${background.color} 0%, ${background.gradientTo} 100%)`,
      };
    }
    return { backgroundColor: background.color };
  };

  const getGridColumns = (): string => {
    if (columnsLayout === "custom") {
      return customColumnWidths;
    }

    const count = parseInt(columnsCount);

    switch (columnsLayout) {
      case "1-2":
        return count === 2 ? "1fr 2fr" : "1fr 2fr 1fr";
      case "2-1":
        return count === 2 ? "2fr 1fr" : "2fr 1fr 1fr";
      case "1-1-2":
        return "1fr 1fr 2fr";
      case "2-1-1":
        return "2fr 1fr 1fr";
      case "1-2-1":
        return "1fr 2fr 1fr";
      default: // equal
        return `repeat(${count}, 1fr)`;
    }
  };

  const columnCount = parseInt(columnsCount);
  const columns = [Column1, Column2, Column3, Column4].slice(0, columnCount);

  return (
    <footer
      style={{
        ...getBackgroundStyles(),
        color: textColor,
        width: "100%",
      }}
    >
      <div
        style={{
          maxWidth: maxWidth,
          margin: "0 auto",
          paddingTop: paddingTop,
          paddingBottom: paddingBottom,
          paddingLeft: paddingX,
          paddingRight: paddingX,
        }}
      >
        {/* Main Footer Columns */}
        <div
          className="footer-columns"
          style={{
            display: "grid",
            gridTemplateColumns: getGridColumns(),
            gap: `${rowGap} ${columnGap}`,
          }}
        >
          {columns.map((Column, index) => (
            <div
              key={index}
              className="footer-column"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                minWidth: 0,
              }}
            >
              {typeof Column === "function" && <Column />}
            </div>
          ))}
        </div>

        {/* Bottom Section with optional content */}
        {(BottomContent || copyright.show) && (
          <>
            {showDivider && (
              <hr
                style={{
                  border: "none",
                  borderTop: `1px solid ${dividerColor}`,
                  margin: "32px 0 24px 0",
                }}
              />
            )}

            {/* Bottom Content Slot - configurable layout */}
            {typeof BottomContent === "function" && (
              <div
                style={{
                  display: "flex",
                  flexDirection: bottomSlotLayout.direction,
                  alignItems: bottomSlotLayout.align === "start" ? "flex-start" :
                              bottomSlotLayout.align === "end" ? "flex-end" : "center",
                  justifyContent: bottomSlotLayout.justify === "start" ? "flex-start" :
                                  bottomSlotLayout.justify === "end" ? "flex-end" :
                                  bottomSlotLayout.justify === "space-between" ? "space-between" :
                                  bottomSlotLayout.justify === "space-around" ? "space-around" : "center",
                  gap: bottomSlotLayout.gap,
                  marginBottom: copyright.show ? "16px" : "0",
                  flexWrap: bottomSlotLayout.wrap ? "wrap" : "nowrap",
                }}
              >
                <BottomContent />
              </div>
            )}

            {/* Copyright */}
            {copyright.show && (
              <p
                style={{
                  margin: 0,
                  fontSize: "14px",
                  opacity: 0.7,
                  textAlign: copyright.align,
                }}
              >
                {copyright.text}
              </p>
            )}
          </>
        )}
      </div>

      {/* Mobile responsive styles */}
      {mobileStack && (
        <style>{`
          @media (max-width: ${mobileBreakpoint}) {
            .footer-columns {
              grid-template-columns: 1fr !important;
            }
            .footer-column {
              text-align: center;
            }
          }
        `}</style>
      )}
    </footer>
  );
};

export const FooterConfig: ComponentConfig<FooterProps> = {
  label: "Footer",
  fields: {
    columnsCount: {
      type: "radio",
      label: "Number of Columns",
      options: [
        { label: "2", value: "2" },
        { label: "3", value: "3" },
        { label: "4", value: "4" },
      ],
    },
    columnsLayout: {
      type: "select",
      label: "Column Layout",
      options: [
        { label: "Equal Width", value: "equal" },
        { label: "1:2 Ratio", value: "1-2" },
        { label: "2:1 Ratio", value: "2-1" },
        { label: "1:1:2 Ratio", value: "1-1-2" },
        { label: "2:1:1 Ratio", value: "2-1-1" },
        { label: "1:2:1 Ratio", value: "1-2-1" },
        { label: "Custom", value: "custom" },
      ],
    },
    customColumnWidths: {
      type: "text",
      label: "Custom Column Widths (CSS grid-template-columns)",
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
            { label: "Gradient", value: "gradient" },
          ],
        },
        color: {
          type: "text",
          label: "Color (or Gradient Start)",
        },
        gradientTo: {
          type: "text",
          label: "Gradient End",
        },
      },
    },
    textColor: {
      type: "text",
      label: "Text Color",
    },
    columnGap: {
      type: "text",
      label: "Column Gap",
    },
    rowGap: {
      type: "text",
      label: "Row Gap",
    },
    mobileStack: {
      type: "radio",
      label: "Stack on Mobile",
      options: [
        { label: "Yes", value: true },
        { label: "No", value: false },
      ],
    },
    mobileBreakpoint: {
      type: "text",
      label: "Mobile Breakpoint",
    },
    paddingTop: {
      type: "text",
      label: "Padding Top",
    },
    paddingBottom: {
      type: "text",
      label: "Padding Bottom",
    },
    paddingX: {
      type: "text",
      label: "Horizontal Padding",
    },
    maxWidth: {
      type: "text",
      label: "Max Width",
    },
    showDivider: {
      type: "radio",
      label: "Show Divider",
      options: [
        { label: "Yes", value: true },
        { label: "No", value: false },
      ],
    },
    dividerColor: {
      type: "text",
      label: "Divider Color",
    },
    copyright: {
      type: "object",
      label: "Copyright",
      objectFields: {
        show: {
          type: "radio",
          label: "Show Copyright",
          options: [
            { label: "Yes", value: true },
            { label: "No", value: false },
          ],
        },
        text: {
          type: "text",
          label: "Copyright Text",
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
      },
    },
    bottomSlotLayout: {
      type: "object",
      label: "Bottom Content Layout",
      objectFields: {
        direction: {
          type: "radio",
          label: "Direction",
          options: [
            { label: "Row", value: "row" },
            { label: "Column", value: "column" },
          ],
        },
        gap: {
          type: "text",
          label: "Gap",
        },
        align: {
          type: "select",
          label: "Align",
          options: [
            { label: "Start", value: "start" },
            { label: "Center", value: "center" },
            { label: "End", value: "end" },
          ],
        },
        justify: {
          type: "select",
          label: "Justify",
          options: [
            { label: "Start", value: "start" },
            { label: "Center", value: "center" },
            { label: "End", value: "end" },
            { label: "Space Between", value: "space-between" },
            { label: "Space Around", value: "space-around" },
          ],
        },
        wrap: {
          type: "radio",
          label: "Wrap",
          options: [
            { label: "Yes", value: true },
            { label: "No", value: false },
          ],
        },
      },
    },
    column1: {
      type: "slot",
      label: "Column 1",
    },
    column2: {
      type: "slot",
      label: "Column 2",
    },
    column3: {
      type: "slot",
      label: "Column 3",
    },
    column4: {
      type: "slot",
      label: "Column 4",
    },
    bottomContent: {
      type: "slot",
      label: "Bottom Content (Social Links, etc.)",
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
    background: {
      type: "solid",
      color: "#1e293b",
    },
    textColor: "#e2e8f0",
    paddingTop: "64px",
    paddingBottom: "32px",
    paddingX: "24px",
    maxWidth: "1200px",
    columnsCount: "4",
    columnsLayout: "equal",
    customColumnWidths: "1fr 1fr 1fr 1fr",
    columnGap: "48px",
    rowGap: "32px",
    mobileStack: true,
    mobileBreakpoint: "768px",
    showDivider: true,
    dividerColor: "rgba(255,255,255,0.1)",
    copyright: {
      show: true,
      text: `© ${new Date().getFullYear()} Your Company. All rights reserved.`,
      align: "center",
    },
    bottomSlotLayout: {
      direction: "row",
      gap: "24px",
      align: "center",
      justify: "center",
      wrap: true,
    },
    column1: [],
    column2: [],
    column3: [],
    column4: [],
    bottomContent: [],
    globalSettings: {
      isGlobal: false,
      scope: "all",
      selectedPages: [],
      excludedPages: [],
    },
  },
  render: Footer,
};
