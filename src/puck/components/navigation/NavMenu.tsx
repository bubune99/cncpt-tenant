"use client";

import React, { useState, useRef, useEffect } from "react";
import { ComponentConfig } from "@puckeditor/core";

export interface NavMenuProps {
  direction: "horizontal" | "vertical";
  gap: string;
  align: "start" | "center" | "end";
  dropdownPosition: "below" | "right";
  dropdownBackground: string;
  dropdownShadow: "none" | "sm" | "md" | "lg";
  dropdownBorderRadius: string;
  dropdownPadding: string;
  dropdownGap: string;
  showDropdownArrow: boolean;
  items?: React.FC | never[];
}

export const NavMenu = ({
  direction = "horizontal",
  gap = "24px",
  align = "center",
  dropdownPosition = "below",
  dropdownBackground = "#ffffff",
  dropdownShadow = "lg",
  dropdownBorderRadius = "8px",
  dropdownPadding = "8px",
  dropdownGap = "4px",
  showDropdownArrow = true,
  items: Items,
}: NavMenuProps) => {
  const shadowStyles = {
    none: "none",
    sm: "0 1px 2px rgba(0,0,0,0.05)",
    md: "0 4px 6px rgba(0,0,0,0.1)",
    lg: "0 10px 15px rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.05)",
  };

  return (
    <nav
      className="nav-menu"
      style={{
        display: "flex",
        flexDirection: direction === "horizontal" ? "row" : "column",
        alignItems: align === "start" ? "flex-start" : align === "end" ? "flex-end" : "center",
        gap,
      }}
    >
      {typeof Items === "function" && <Items />}

      <style>{`
        .nav-menu {
          position: relative;
        }

        .nav-menu-item {
          position: relative;
        }

        .nav-menu-item .dropdown-menu {
          position: absolute;
          ${dropdownPosition === "below" ? "top: 100%; left: 0;" : "left: 100%; top: 0;"}
          min-width: 180px;
          background: ${dropdownBackground};
          box-shadow: ${shadowStyles[dropdownShadow]};
          border-radius: ${dropdownBorderRadius};
          padding: ${dropdownPadding};
          opacity: 0;
          visibility: hidden;
          transform: translateY(${dropdownPosition === "below" ? "-10px" : "0"}) translateX(${dropdownPosition === "right" ? "-10px" : "0"});
          transition: all 0.2s ease;
          z-index: 1000;
          display: flex;
          flex-direction: column;
          gap: ${dropdownGap};
        }

        .nav-menu-item:hover > .dropdown-menu,
        .nav-menu-item:focus-within > .dropdown-menu {
          opacity: 1;
          visibility: visible;
          transform: translateY(0) translateX(0);
        }

        .dropdown-arrow {
          display: ${showDropdownArrow ? "inline-flex" : "none"};
          margin-left: 4px;
          transition: transform 0.2s ease;
        }

        .nav-menu-item:hover .dropdown-arrow {
          transform: rotate(180deg);
        }
      `}</style>
    </nav>
  );
};

export const NavMenuConfig: ComponentConfig<NavMenuProps> = {
  label: "Nav Menu",
  fields: {
    direction: {
      type: "radio",
      label: "Direction",
      options: [
        { label: "Horizontal", value: "horizontal" },
        { label: "Vertical", value: "vertical" },
      ],
    },
    gap: {
      type: "text",
      label: "Gap Between Items",
    },
    align: {
      type: "radio",
      label: "Alignment",
      options: [
        { label: "Start", value: "start" },
        { label: "Center", value: "center" },
        { label: "End", value: "end" },
      ],
    },
    dropdownPosition: {
      type: "radio",
      label: "Dropdown Position",
      options: [
        { label: "Below", value: "below" },
        { label: "Right", value: "right" },
      ],
    },
    dropdownBackground: {
      type: "text",
      label: "Dropdown Background",
    },
    dropdownShadow: {
      type: "select",
      label: "Dropdown Shadow",
      options: [
        { label: "None", value: "none" },
        { label: "Small", value: "sm" },
        { label: "Medium", value: "md" },
        { label: "Large", value: "lg" },
      ],
    },
    dropdownBorderRadius: {
      type: "text",
      label: "Dropdown Border Radius",
    },
    dropdownPadding: {
      type: "text",
      label: "Dropdown Padding",
    },
    dropdownGap: {
      type: "text",
      label: "Dropdown Item Gap",
    },
    showDropdownArrow: {
      type: "radio",
      label: "Show Dropdown Arrow",
      options: [
        { label: "Yes", value: true },
        { label: "No", value: false },
      ],
    },
    items: {
      type: "slot",
      label: "Menu Items",
    },
  },
  defaultProps: {
    direction: "horizontal",
    gap: "24px",
    align: "center",
    dropdownPosition: "below",
    dropdownBackground: "#ffffff",
    dropdownShadow: "lg",
    dropdownBorderRadius: "8px",
    dropdownPadding: "8px",
    dropdownGap: "4px",
    showDropdownArrow: true,
    items: [],
  },
  render: NavMenu,
};
