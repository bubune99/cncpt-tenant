"use client";

import { ComponentConfig } from "@puckeditor/core";
import { Text } from "@react-email/components";
import { replaceWithSampleValues, hasVariables } from "@/lib/cms/email-variables";
import { TextWithVariablesField } from "./VariablePicker";

export interface EmailTextProps {
  text: string;
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
            fontSize: "0.9em",
          }}
        >
          {part}
        </span>
      );
    }
    return part;
  });
}

export const EmailText = ({
  text,
  color,
  fontSize,
  fontWeight,
  textAlign,
  lineHeight,
  marginTop,
  marginBottom,
  puck,
}: EmailTextProps) => {
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
    return <p style={style}>{highlightVariables(text)}</p>;
  }

  // In render/preview mode, replace variables with sample values
  const renderedText = replaceWithSampleValues(text);
  return <Text style={style}>{renderedText}</Text>;
};

export const EmailTextConfig: ComponentConfig<EmailTextProps> = {
  label: "Email Text",
  defaultProps: {
    text: "Your text goes here. Click to edit this text block.",
    color: "#374151",
    fontSize: 16,
    fontWeight: "normal",
    textAlign: "left",
    lineHeight: 160,
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
          multiline={true}
        />
      ),
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
  render: EmailText,
};
