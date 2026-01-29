"use client";

import React from "react";
import { ComponentConfig } from "@puckeditor/core";

export interface FooterColumnProps {
  title: string | React.ReactNode; // Support inline editing
  titleColor: string;
  titleSize: string;
  showTitle: boolean;
  gap: string;
  content?: React.FC | never[];
}

export const FooterColumn = ({
  title = "Column Title",
  titleColor = "#ffffff",
  titleSize = "18px",
  showTitle = true,
  gap = "12px",
  content: Content,
}: FooterColumnProps) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: gap,
      }}
    >
      {showTitle && title && (
        <h4
          style={{
            margin: 0,
            marginBottom: "8px",
            fontSize: titleSize,
            fontWeight: 600,
            color: titleColor,
          }}
        >
          {title}
        </h4>
      )}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: gap,
        }}
      >
        {typeof Content === "function" && <Content />}
      </div>
    </div>
  );
};

export const FooterColumnConfig: ComponentConfig<FooterColumnProps> = {
  label: "Footer Column",
  fields: {
    showTitle: {
      type: "radio",
      label: "Show Title",
      options: [
        { label: "Yes", value: true },
        { label: "No", value: false },
      ],
    },
    title: {
      type: "text",
      label: "Column Title",
      contentEditable: true, // Enable inline editing in viewport
    },
    titleColor: {
      type: "text",
      label: "Title Color",
    },
    titleSize: {
      type: "text",
      label: "Title Size",
    },
    gap: {
      type: "text",
      label: "Gap Between Items",
    },
    content: {
      type: "slot",
      label: "Column Content",
    },
  },
  defaultProps: {
    title: "Column Title",
    titleColor: "#ffffff",
    titleSize: "18px",
    showTitle: true,
    gap: "12px",
    content: [],
  },
  render: FooterColumn,
};
