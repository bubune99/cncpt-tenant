"use client";

import React, { useState } from "react";
import { ComponentConfig } from "@puckeditor/core";

export interface NavLinkProps {
  label: string | React.ReactNode; // Support inline editing
  href: string;
  color: string;
  hoverColor: string;
  fontSize: string;
  fontWeight: "normal" | "500" | "600" | "bold";
  isActive: boolean;
  activeColor: string;
  hasSubmenu: boolean;
  submenuBackground: string;
  submenuShadow: "none" | "sm" | "md" | "lg";
  submenuBorderRadius: string;
  submenuPadding: string;
  submenu?: React.FC | never[];
}

const shadowStyles = {
  none: "none",
  sm: "0 1px 2px rgba(0,0,0,0.05)",
  md: "0 4px 6px rgba(0,0,0,0.1)",
  lg: "0 10px 15px rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.05)",
};

export const NavLink = ({
  label = "Link",
  href = "#",
  color = "#374151",
  hoverColor = "#2563eb",
  fontSize = "16px",
  fontWeight = "500",
  isActive = false,
  activeColor = "#2563eb",
  hasSubmenu = false,
  submenuBackground = "#ffffff",
  submenuShadow = "lg",
  submenuBorderRadius = "8px",
  submenuPadding = "8px",
  submenu: Submenu,
}: NavLinkProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isSubmenuOpen, setIsSubmenuOpen] = useState(false);

  const hasChildren = typeof Submenu === "function";
  const showSubmenu = hasSubmenu && hasChildren;

  return (
    <div
      className="nav-link-wrapper"
      onMouseEnter={() => {
        setIsHovered(true);
        if (showSubmenu) setIsSubmenuOpen(true);
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        if (showSubmenu) setIsSubmenuOpen(false);
      }}
      style={{
        position: "relative",
        display: "inline-block",
      }}
    >
      <a
        href={href}
        style={{
          color: isActive ? activeColor : isHovered ? hoverColor : color,
          fontSize,
          fontWeight,
          textDecoration: "none",
          transition: "color 0.2s ease",
          whiteSpace: "nowrap",
          position: "relative",
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
        }}
      >
        {label}
        {showSubmenu && (
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              transform: isSubmenuOpen ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s ease",
            }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        )}
        {isActive && (
          <span
            style={{
              position: "absolute",
              bottom: "-4px",
              left: 0,
              right: 0,
              height: "2px",
              backgroundColor: activeColor,
              borderRadius: "1px",
            }}
          />
        )}
      </a>

      {showSubmenu && isSubmenuOpen && (
        <div
          className="nav-submenu"
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            minWidth: "180px",
            background: submenuBackground,
            boxShadow: shadowStyles[submenuShadow],
            borderRadius: submenuBorderRadius,
            padding: submenuPadding,
            marginTop: "8px",
            zIndex: 1000,
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}
        >
          <Submenu />
        </div>
      )}
    </div>
  );
};

export const NavLinkConfig: ComponentConfig<NavLinkProps> = {
  label: "Nav Link",
  fields: {
    label: {
      type: "text",
      label: "Label",
    },
    href: {
      type: "text",
      label: "URL",
    },
    hasSubmenu: {
      type: "radio",
      label: "Has Dropdown",
      options: [
        { label: "Yes", value: true },
        { label: "No", value: false },
      ],
    },
    isActive: {
      type: "radio",
      label: "Active State",
      options: [
        { label: "Active", value: true },
        { label: "Inactive", value: false },
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
    activeColor: {
      type: "text",
      label: "Active Color",
    },
    fontSize: {
      type: "text",
      label: "Font Size",
    },
    fontWeight: {
      type: "select",
      label: "Font Weight",
      options: [
        { label: "Normal", value: "normal" },
        { label: "Medium", value: "500" },
        { label: "Semi-bold", value: "600" },
        { label: "Bold", value: "bold" },
      ],
    },
    submenuBackground: {
      type: "text",
      label: "Dropdown Background",
    },
    submenuShadow: {
      type: "select",
      label: "Dropdown Shadow",
      options: [
        { label: "None", value: "none" },
        { label: "Small", value: "sm" },
        { label: "Medium", value: "md" },
        { label: "Large", value: "lg" },
      ],
    },
    submenuBorderRadius: {
      type: "text",
      label: "Dropdown Border Radius",
    },
    submenuPadding: {
      type: "text",
      label: "Dropdown Padding",
    },
    submenu: {
      type: "slot",
      label: "Dropdown Items",
    },
  },
  defaultProps: {
    label: "Link",
    href: "#",
    color: "#374151",
    hoverColor: "#2563eb",
    fontSize: "16px",
    fontWeight: "500",
    isActive: false,
    activeColor: "#2563eb",
    hasSubmenu: false,
    submenuBackground: "#ffffff",
    submenuShadow: "lg",
    submenuBorderRadius: "8px",
    submenuPadding: "8px",
    submenu: [],
  },
  render: (props) => <NavLink {...props} />,
};
