"use client";

import React from "react";
import { Config } from "@puckeditor/core";

// Email components
import {
  EmailSectionConfig,
  EmailColumnsConfig,
  EmailHeadingConfig,
  EmailTextConfig,
  EmailButtonConfig,
  EmailImageConfig,
  EmailSpacerConfig,
} from "../components/email";

// Component categories
const layoutComponents = ["EmailSection", "EmailColumns"];
const contentComponents = ["EmailHeading", "EmailText", "EmailButton", "EmailImage", "EmailSpacer"];

export const emailPuckConfig: Config = {
  categories: {
    layout: {
      title: "Layout",
      components: layoutComponents,
      defaultExpanded: true,
    },
    content: {
      title: "Content",
      components: contentComponents,
      defaultExpanded: true,
    },
  },
  components: {
    // Layout
    EmailSection: {
      ...EmailSectionConfig,
      ai: {
        instructions: "Use EmailSection as the main container for email content blocks. Each major section of the email should be wrapped in an EmailSection. Set appropriate background colors and padding. Use maxWidth of 600px for best email client compatibility.",
      },
    },
    EmailColumns: {
      ...EmailColumnsConfig,
      ai: {
        instructions: "Use EmailColumns for side-by-side content layouts. Choose appropriate layout ratios. Note: Some email clients may stack columns on mobile. Keep content simple within columns.",
      },
    },
    // Content
    EmailHeading: {
      ...EmailHeadingConfig,
      ai: {
        instructions: "Use EmailHeading for email titles and section headers. H1 for the main email title, H2 for sections. Keep headings short and impactful. Use web-safe fonts and appropriate sizes.",
      },
    },
    EmailText: {
      ...EmailTextConfig,
      ai: {
        instructions: "Use EmailText for paragraphs and body content. Keep text concise and scannable. Use appropriate line height (150-170%) for readability. Stick to web-safe fonts.",
      },
    },
    EmailButton: {
      ...EmailButtonConfig,
      ai: {
        instructions: "Use EmailButton for calls-to-action. Keep button text short and action-oriented. Use contrasting colors for visibility. Center-align for emphasis or left-align for secondary actions.",
      },
    },
    EmailImage: {
      ...EmailImageConfig,
      ai: {
        instructions: "Use EmailImage for visual content. Always use absolute URLs for images (not relative paths). Provide meaningful alt text. Keep images optimized for email (under 100KB). Use standard widths like 600px or 300px.",
      },
    },
    EmailSpacer: {
      ...EmailSpacerConfig,
      ai: {
        instructions: "Use EmailSpacer to add vertical spacing between content. Use consistent spacing values. Optionally add divider lines for visual separation.",
      },
    },
  },
  root: {
    defaultProps: {
      title: "Untitled Email",
    },
    fields: {
      title: {
        type: "text",
        label: "Email Name",
      },
    },
    render: ({ children }: { children: React.ReactNode }) => {
      return (
        <div
          style={{
            backgroundColor: "#f4f4f5",
            padding: "24px 0",
            minHeight: "100vh",
            fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          }}
        >
          <div
            style={{
              maxWidth: 600,
              margin: "0 auto",
              backgroundColor: "#ffffff",
            }}
          >
            {children}
          </div>
        </div>
      );
    },
  },
};

export default emailPuckConfig;
