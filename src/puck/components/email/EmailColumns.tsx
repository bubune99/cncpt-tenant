"use client";

import { ComponentConfig } from "@puckeditor/core";
import React from "react";
import { Row, Column } from "@react-email/components";

export interface EmailColumnsProps {
  layout: "50-50" | "60-40" | "40-60" | "70-30" | "30-70" | "33-33-33";
  gap: number;
  verticalAlign: "top" | "middle" | "bottom";
  // Content (slot)
  content?: React.FC | never[];
  puck?: { isEditing?: boolean };
}

const layoutWidths: Record<string, string[]> = {
  "50-50": ["50%", "50%"],
  "60-40": ["60%", "40%"],
  "40-60": ["40%", "60%"],
  "70-30": ["70%", "30%"],
  "30-70": ["30%", "70%"],
  "33-33-33": ["33.33%", "33.33%", "33.33%"],
};

export const EmailColumns = ({
  layout,
  gap,
  verticalAlign,
  content: Content,
  puck,
}: EmailColumnsProps) => {
  const isEditing = puck?.isEditing ?? false;
  const widths = layoutWidths[layout] || layoutWidths["50-50"];
  const columnCount = widths.length;

  // Editor mode uses divs for better compatibility
  if (isEditing) {
    return (
      <div style={{ display: "flex", width: "100%", gap }}>
        {typeof Content === 'function' && <Content />}
      </div>
    );
  }

  // Render mode uses React Email components
  return (
    <Row>
      <Column style={{ width: "100%", verticalAlign }}>
        {typeof Content === 'function' && <Content />}
      </Column>
    </Row>
  );
};

export const EmailColumnsConfig: ComponentConfig<EmailColumnsProps> = {
  label: "Email Columns",
  defaultProps: {
    layout: "50-50",
    gap: 16,
    verticalAlign: "top",
    content: [],
  },
  fields: {
    content: {
      type: "slot",
    },
    layout: {
      type: "select",
      label: "Layout",
      options: [
        { label: "50% / 50%", value: "50-50" },
        { label: "60% / 40%", value: "60-40" },
        { label: "40% / 60%", value: "40-60" },
        { label: "70% / 30%", value: "70-30" },
        { label: "30% / 70%", value: "30-70" },
        { label: "33% / 33% / 33%", value: "33-33-33" },
      ],
    },
    gap: {
      type: "number",
      label: "Gap (px)",
    },
    verticalAlign: {
      type: "radio",
      label: "Vertical Align",
      options: [
        { label: "Top", value: "top" },
        { label: "Middle", value: "middle" },
        { label: "Bottom", value: "bottom" },
      ],
    },
  },
  render: EmailColumns,
};
