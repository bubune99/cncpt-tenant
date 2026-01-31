"use client";

import { ComponentConfig } from "@puckeditor/core";
import { Heading } from "@react-email/components";
import { replaceWithSampleValues, hasVariables } from "@/lib/cms/email-variables";
import { TextWithVariablesField } from "./VariablePicker";

export interface EmailHeadingProps {
  text: string;
  level: "h1" | "h2" | "h3" | "h4";
  color: string;
  fontSize: number;
  fontWeight: "normal" | "medium" | "semibold" | "bold";
  textAlign: "left" | "center" | "right";
  lineHeight: number;
  marginTop: number;
  marginBottom: number;
  puck?: { isEditing?: boolean };
}

const fontWeightMap = {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
};

// Highlight variables in text for editor display
function highlightVariables(text: string): React.ReactNode {
  if (!hasVariables(text)) return text;

  const parts = text.split(/(\{\{[^}]+\}\})/g);
  return parts.map((part, index) => {
    if (part.match(/^\{\{[^}]+\}\}$/)) {
      return (
        <span
          key={index}
          style={{
            background: "#eef2ff",
            color: "#6366f1",
            padding: "1px 4px",
            borderRadius: 3,
            fontFamily: "monospace",
            fontSize: "0.85em",
          }}
        >
          {part}
        </span>
      );
    }
    return part;
  });
}

export const EmailHeading = ({
  text,
  level,
  color,
  fontSize,
  fontWeight,
  textAlign,
  lineHeight,
  marginTop,
  marginBottom,
  puck,
}: EmailHeadingProps) => {
  const isEditing = puck?.isEditing ?? false;

  const style = {
    color,
    fontSize,
    fontWeight: fontWeightMap[fontWeight],
    textAlign,
    lineHeight: `${lineHeight}%`,
    marginTop,
    marginBottom,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  };

  // In editor mode, show highlighted variables
  if (isEditing) {
    const Tag = level;
    return <Tag style={style}>{highlightVariables(text)}</Tag>;
  }

  // In render/preview mode, replace variables with sample values
  const renderedText = replaceWithSampleValues(text);
  return (
    <Heading as={level} style={style}>
      {renderedText}
    </Heading>
  );
};

export const EmailHeadingConfig: ComponentConfig<EmailHeadingProps> = {
  label: "Email Heading",
  defaultProps: {
    text: "Heading Text",
    level: "h2",
    color: "#1a1a1a",
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "left",
    lineHeight: 130,
    marginTop: 0,
    marginBottom: 16,
  },
  fields: {
    text: {
      type: "custom",
      label: "Text",
      render: ({ value, onChange }) => (
        <TextWithVariablesField
          value={value}
          onChange={onChange}
          multiline={false}
        />
      ),
    },
    level: {
      type: "select",
      label: "Heading Level",
      options: [
        { label: "H1 (Largest)", value: "h1" },
        { label: "H2", value: "h2" },
        { label: "H3", value: "h3" },
        { label: "H4 (Smallest)", value: "h4" },
      ],
    },
    color: {
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
    textAlign: {
      type: "radio",
      label: "Text Align",
      options: [
        { label: "Left", value: "left" },
        { label: "Center", value: "center" },
        { label: "Right", value: "right" },
      ],
    },
    lineHeight: {
      type: "number",
      label: "Line Height (%)",
    },
    marginTop: {
      type: "number",
      label: "Margin Top (px)",
    },
    marginBottom: {
      type: "number",
      label: "Margin Bottom (px)",
    },
  },
  render: EmailHeading,
};
