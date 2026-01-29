"use client";

import React from "react";
import { ComponentConfig } from "@puckeditor/core";

export interface FooterLinkProps {
  label: string | React.ReactNode; // Support inline editing
  href: string;
  color: string;
  hoverColor: string;
  fontSize: string;
  openInNewTab: boolean;
}

export const FooterLink = ({
  label = "Link",
  href = "#",
  color = "#94a3b8",
  hoverColor = "#ffffff",
  fontSize = "14px",
  openInNewTab = false,
}: FooterLinkProps) => {
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <a
      href={href}
      target={openInNewTab ? "_blank" : undefined}
      rel={openInNewTab ? "noopener noreferrer" : undefined}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        color: isHovered ? hoverColor : color,
        fontSize,
        textDecoration: "none",
        transition: "color 0.2s ease",
        display: "block",
      }}
    >
      {label}
    </a>
  );
};

export const FooterLinkConfig: ComponentConfig<FooterLinkProps> = {
  label: "Footer Link",
  fields: {
    label: {
      type: "text",
      label: "Label",
      contentEditable: true, // Enable inline editing in viewport
    },
    href: {
      type: "text",
      label: "URL",
    },
    openInNewTab: {
      type: "radio",
      label: "Open in New Tab",
      options: [
        { label: "Yes", value: true },
        { label: "No", value: false },
      ],
    },
    color: {
      type: "text",
      label: "Text Color",
    },
    hoverColor: {
      type: "text",
      label: "Hover Color",
    },
    fontSize: {
      type: "text",
      label: "Font Size",
    },
  },
  defaultProps: {
    label: "Link",
    href: "#",
    color: "#94a3b8",
    hoverColor: "#ffffff",
    fontSize: "14px",
    openInNewTab: false,
  },
  render: (props) => <FooterLink {...props} />,
};
