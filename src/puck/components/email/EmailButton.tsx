"use client";

import { ComponentConfig } from "@puckeditor/core";
import { Button } from "@react-email/components";

export interface EmailButtonProps {
  text: string;
  href: string;
  backgroundColor: string;
  textColor: string;
  fontSize: number;
  fontWeight: "normal" | "medium" | "semibold" | "bold";
  paddingX: number;
  paddingY: number;
  borderRadius: number;
  fullWidth: boolean;
  align: "left" | "center" | "right";
  puck?: { isEditing?: boolean };
}

const fontWeightMap = {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
};

export const EmailButton = ({
  text,
  href,
  backgroundColor,
  textColor,
  fontSize,
  fontWeight,
  paddingX,
  paddingY,
  borderRadius,
  fullWidth,
  align,
  puck,
}: EmailButtonProps) => {
  const isEditing = puck?.isEditing ?? false;

  const buttonStyle = {
    backgroundColor,
    color: textColor,
    fontSize,
    fontWeight: fontWeightMap[fontWeight],
    paddingLeft: paddingX,
    paddingRight: paddingX,
    paddingTop: paddingY,
    paddingBottom: paddingY,
    borderRadius,
    textDecoration: "none",
    display: fullWidth ? "block" : "inline-block",
    textAlign: "center" as const,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  };

  const wrapperStyle = {
    textAlign: align as "left" | "center" | "right",
    width: "100%",
  };

  // In editor mode, use standard HTML
  if (isEditing) {
    return (
      <div style={wrapperStyle}>
        <a href={href || "#"} style={buttonStyle}>
          {text}
        </a>
      </div>
    );
  }

  // In render mode, use React Email component
  return (
    <div style={wrapperStyle}>
      <Button href={href} style={buttonStyle}>
        {text}
      </Button>
    </div>
  );
};

export const EmailButtonConfig: ComponentConfig<EmailButtonProps> = {
  label: "Email Button",
  defaultProps: {
    text: "Click Here",
    href: "https://example.com",
    backgroundColor: "#3b82f6",
    textColor: "#ffffff",
    fontSize: 16,
    fontWeight: "semibold",
    paddingX: 24,
    paddingY: 12,
    borderRadius: 6,
    fullWidth: false,
    align: "left",
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
    backgroundColor: {
      type: "text",
      label: "Background Color",
    },
    textColor: {
      type: "text",
      label: "Text Color",
    },
    fontSize: {
      type: "number",
      label: "Font Size (px)",
    },
    fontWeight: {
      type: "select",
      label: "Font Weight",
      options: [
        { label: "Normal", value: "normal" },
        { label: "Medium", value: "medium" },
        { label: "Semibold", value: "semibold" },
        { label: "Bold", value: "bold" },
      ],
    },
    paddingX: {
      type: "number",
      label: "Padding X (px)",
    },
    paddingY: {
      type: "number",
      label: "Padding Y (px)",
    },
    borderRadius: {
      type: "number",
      label: "Border Radius (px)",
    },
    fullWidth: {
      type: "radio",
      label: "Full Width",
      options: [
        { label: "Yes", value: true },
        { label: "No", value: false },
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
  },
  render: EmailButton,
};
