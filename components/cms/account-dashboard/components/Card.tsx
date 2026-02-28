"use client";

import React from "react";

export interface CardProps {
  title?: string | React.ReactNode;
  subtitle?: string | React.ReactNode;
  headerAction?: string | React.ReactNode;
  backgroundColor: string;
  headerBackground?: string;
  textColor: string;
  borderRadius: string;
  padding: string;
  shadow: "none" | "sm" | "md" | "lg" | "xl";
  border: boolean;
  borderColor: string;
  showHeader: boolean;
  showDivider: boolean;
  contentAlign: "left" | "center" | "right";
  contentVerticalAlign: "top" | "center" | "bottom";
  contentDirection: "column" | "row";
  contentGap: "none" | "sm" | "md" | "lg";
  content?: React.ComponentType | React.ReactNode;
  children?: React.ReactNode;
}

const gapStyles = {
  none: "0px",
  sm: "8px",
  md: "16px",
  lg: "24px",
};

const alignMap = {
  left: "flex-start",
  center: "center",
  right: "flex-end",
};

const verticalAlignMap = {
  top: "flex-start",
  center: "center",
  bottom: "flex-end",
};

const shadowStyles = {
  none: "none",
  sm: "0 1px 2px rgba(0,0,0,0.05)",
  md: "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)",
  lg: "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)",
  xl: "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)",
};

export const Card = ({
  title,
  subtitle,
  headerAction,
  backgroundColor,
  headerBackground,
  textColor,
  borderRadius,
  padding,
  shadow,
  border,
  borderColor,
  showHeader,
  showDivider,
  contentAlign,
  contentVerticalAlign,
  contentDirection,
  contentGap,
  content: Content,
  children,
}: CardProps) => {
  return (
    <div
      style={{
        position: "relative",
        backgroundColor,
        borderRadius,
        boxShadow: shadowStyles[shadow],
        border: border ? `1px solid ${borderColor}` : "none",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      {showHeader && (
        <div
          style={{
            padding,
            backgroundColor: headerBackground || backgroundColor,
            borderBottom: showDivider ? `1px solid ${borderColor}` : "none",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            {title && (
              <h3
                style={{
                  margin: 0,
                  fontSize: "16px",
                  fontWeight: 600,
                  color: textColor,
                }}
              >
                {title}
              </h3>
            )}
            {subtitle && (
              <p
                style={{
                  margin: 0,
                  marginTop: "4px",
                  fontSize: "13px",
                  color: textColor,
                  opacity: 0.6,
                }}
              >
                {subtitle}
              </p>
            )}
          </div>
          {headerAction && (
            <button
              style={{
                padding: "6px 12px",
                fontSize: "13px",
                fontWeight: 500,
                color: "#3b82f6",
                background: "transparent",
                border: "1px solid #e5e7eb",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              {headerAction}
            </button>
          )}
        </div>
      )}

      {/* Body */}
      <div
        style={{
          padding,
          display: "flex",
          flexDirection: contentDirection,
          justifyContent: contentDirection === "column" ? verticalAlignMap[contentVerticalAlign] : alignMap[contentAlign],
          alignItems: contentDirection === "column" ? alignMap[contentAlign] : verticalAlignMap[contentVerticalAlign],
          gap: gapStyles[contentGap],
        }}
      >
        {typeof Content === 'function' ? <Content /> : Content}
        {children}
      </div>
    </div>
  );
};
