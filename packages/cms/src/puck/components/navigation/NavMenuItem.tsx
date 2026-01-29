"use client";

import React, { useState } from "react";
import { ComponentConfig } from "@puckeditor/core";

export interface NavMenuItemProps {
  label: string;
  href: string;
  color: string;
  hoverColor: string;
  fontSize: string;
  fontWeight: "normal" | "500" | "600" | "bold";
  isActive: boolean;
  activeColor: string;
  hasDropdown: boolean;
  dropdownTrigger: "hover" | "click";
  children?: React.FC | never[];
}

export const NavMenuItem = ({
  label = "Menu Item",
  href = "#",
  color = "#374151",
  hoverColor = "#2563eb",
  fontSize = "16px",
  fontWeight = "500",
  isActive = false,
  activeColor = "#2563eb",
  hasDropdown = false,
  dropdownTrigger = "hover",
  children: Children,
}: NavMenuItemProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const hasChildren = typeof Children === "function";
  const showDropdown = hasDropdown && hasChildren;

  const handleClick = (e: React.MouseEvent) => {
    if (showDropdown && dropdownTrigger === "click") {
      e.preventDefault();
      setIsOpen(!isOpen);
    }
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (showDropdown && dropdownTrigger === "hover") {
      setIsOpen(true);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (showDropdown && dropdownTrigger === "hover") {
      setIsOpen(false);
    }
  };

  return (
    <div
      className="nav-menu-item"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <a
        href={showDropdown && dropdownTrigger === "click" ? undefined : href}
        onClick={handleClick}
        style={{
          color: isActive ? activeColor : isHovered ? hoverColor : color,
          fontSize,
          fontWeight,
          textDecoration: "none",
          transition: "color 0.2s ease",
          whiteSpace: "nowrap",
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
          cursor: "pointer",
        }}
      >
        {label}
        {showDropdown && (
          <span className="dropdown-arrow">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </span>
        )}
      </a>

      {showDropdown && (
        <div
          className="dropdown-menu"
          style={{
            display: isOpen || dropdownTrigger === "hover" ? "flex" : "none",
          }}
        >
          <Children />
        </div>
      )}
    </div>
  );
};

export const NavMenuItemConfig: ComponentConfig<NavMenuItemProps> = {
  label: "Nav Menu Item",
  fields: {
    label: {
      type: "text",
      label: "Label",
    },
    href: {
      type: "text",
      label: "URL",
    },
    hasDropdown: {
      type: "radio",
      label: "Has Dropdown",
      options: [
        { label: "Yes", value: true },
        { label: "No", value: false },
      ],
    },
    dropdownTrigger: {
      type: "radio",
      label: "Dropdown Trigger",
      options: [
        { label: "Hover", value: "hover" },
        { label: "Click", value: "click" },
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
    children: {
      type: "slot",
      label: "Dropdown Items",
    },
  },
  defaultProps: {
    label: "Menu Item",
    href: "#",
    color: "#374151",
    hoverColor: "#2563eb",
    fontSize: "16px",
    fontWeight: "500",
    isActive: false,
    activeColor: "#2563eb",
    hasDropdown: false,
    dropdownTrigger: "hover",
    children: [],
  },
  render: NavMenuItem,
};
