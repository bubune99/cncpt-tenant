"use client";

import { ComponentConfig } from "@puckeditor/core";
import { Hr } from "@react-email/components";

export interface EmailSpacerProps {
  height: number;
  showDivider: boolean;
  dividerColor: string;
  dividerWidth: "full" | "75" | "50" | "25";
  puck?: { isEditing?: boolean };
}

const widthMap = {
  full: "100%",
  "75": "75%",
  "50": "50%",
  "25": "25%",
};

export const EmailSpacer = ({
  height,
  showDivider,
  dividerColor,
  dividerWidth,
  puck,
}: EmailSpacerProps) => {
  const isEditing = puck?.isEditing ?? false;

  const spacerStyle = {
    height,
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  const dividerStyle = {
    width: widthMap[dividerWidth],
    border: "none",
    borderTop: `1px solid ${dividerColor}`,
    margin: 0,
  };

  // In editor mode, show visual indicator
  if (isEditing) {
    return (
      <div style={{ ...spacerStyle, position: "relative" }}>
        {showDivider && <hr style={dividerStyle} />}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(59, 130, 246, 0.05)",
            border: "1px dashed rgba(59, 130, 246, 0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#3b82f6",
            fontSize: 11,
            pointerEvents: "none",
          }}
        >
          {height}px
        </div>
      </div>
    );
  }

  // In render mode
  if (showDivider) {
    return (
      <div style={spacerStyle}>
        <Hr style={dividerStyle} />
      </div>
    );
  }

  return <div style={spacerStyle} />;
};

export const EmailSpacerConfig: ComponentConfig<EmailSpacerProps> = {
  label: "Email Spacer",
  defaultProps: {
    height: 24,
    showDivider: false,
    dividerColor: "#e5e7eb",
    dividerWidth: "full",
  },
  fields: {
    height: {
      type: "number",
      label: "Height (px)",
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
    dividerWidth: {
      type: "select",
      label: "Divider Width",
      options: [
        { label: "Full (100%)", value: "full" },
        { label: "3/4 (75%)", value: "75" },
        { label: "Half (50%)", value: "50" },
        { label: "1/4 (25%)", value: "25" },
      ],
    },
  },
  render: EmailSpacer,
};
