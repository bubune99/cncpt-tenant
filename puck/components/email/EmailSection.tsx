"use client";

import { ComponentConfig } from "@puckeditor/core";
import React from "react";
import { Section, Container } from "@react-email/components";

export interface EmailSectionProps {
  backgroundColor: string;
  paddingTop: number;
  paddingBottom: number;
  paddingLeft: number;
  paddingRight: number;
  align: "left" | "center" | "right";
  maxWidth: number;
  // Content (slot)
  content?: React.FC | never[];
  puck?: { isEditing?: boolean };
}

export const EmailSection = ({
  backgroundColor,
  paddingTop,
  paddingBottom,
  paddingLeft,
  paddingRight,
  align,
  maxWidth,
  content: Content,
  puck,
}: EmailSectionProps) => {
  const isEditing = puck?.isEditing ?? false;

  // In editor mode, use divs for better compatibility
  if (isEditing) {
    return (
      <div
        style={{
          backgroundColor,
          paddingTop,
          paddingBottom,
          paddingLeft,
          paddingRight,
          width: "100%",
        }}
      >
        <div
          style={{
            maxWidth,
            margin: align === "center" ? "0 auto" : align === "right" ? "0 0 0 auto" : "0",
            width: "100%",
          }}
        >
          {typeof Content === 'function' && <Content />}
        </div>
      </div>
    );
  }

  // In render mode, use React Email components
  return (
    <Section
      style={{
        backgroundColor,
        paddingTop,
        paddingBottom,
        paddingLeft,
        paddingRight,
      }}
    >
      <Container
        style={{
          maxWidth,
          margin: align === "center" ? "0 auto" : align === "right" ? "0 0 0 auto" : "0",
        }}
      >
        {typeof Content === 'function' && <Content />}
      </Container>
    </Section>
  );
};

export const EmailSectionConfig: ComponentConfig<EmailSectionProps> = {
  label: "Email Section",
  defaultProps: {
    backgroundColor: "#ffffff",
    paddingTop: 24,
    paddingBottom: 24,
    paddingLeft: 24,
    paddingRight: 24,
    align: "center",
    maxWidth: 600,
    content: [],
  },
  fields: {
    content: {
      type: "slot",
    },
    backgroundColor: {
      type: "text",
      label: "Background Color",
    },
    paddingTop: {
      type: "number",
      label: "Padding Top (px)",
    },
    paddingBottom: {
      type: "number",
      label: "Padding Bottom (px)",
    },
    paddingLeft: {
      type: "number",
      label: "Padding Left (px)",
    },
    paddingRight: {
      type: "number",
      label: "Padding Right (px)",
    },
    align: {
      type: "radio",
      label: "Content Alignment",
      options: [
        { label: "Left", value: "left" },
        { label: "Center", value: "center" },
        { label: "Right", value: "right" },
      ],
    },
    maxWidth: {
      type: "number",
      label: "Max Width (px)",
    },
  },
  render: EmailSection,
};
