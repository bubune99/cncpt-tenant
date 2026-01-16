"use client";

import React from "react";

export interface VisibilitySettings {
  mobile: boolean;
  tablet: boolean;
  desktop: boolean;
}

interface ResponsiveVisibilityProps {
  value: VisibilitySettings;
  onChange: (value: VisibilitySettings) => void;
  name?: string;
}

const defaultVisibility: VisibilitySettings = {
  mobile: true,
  tablet: true,
  desktop: true,
};

export function ResponsiveVisibility({
  value = defaultVisibility,
  onChange,
}: ResponsiveVisibilityProps) {
  const visibility = { ...defaultVisibility, ...value };

  const toggleDevice = (device: keyof VisibilitySettings) => {
    onChange({
      ...visibility,
      [device]: !visibility[device],
    });
  };

  return (
    <div className="responsive-visibility">
      <div className="visibility-buttons">
        <button
          type="button"
          className={`visibility-btn ${visibility.mobile ? "active" : "hidden"}`}
          onClick={() => toggleDevice("mobile")}
          title={visibility.mobile ? "Visible on mobile" : "Hidden on mobile"}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
            <line x1="12" y1="18" x2="12" y2="18" />
          </svg>
          <span>Mobile</span>
        </button>

        <button
          type="button"
          className={`visibility-btn ${visibility.tablet ? "active" : "hidden"}`}
          onClick={() => toggleDevice("tablet")}
          title={visibility.tablet ? "Visible on tablet" : "Hidden on tablet"}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
            <line x1="12" y1="18" x2="12" y2="18" />
          </svg>
          <span>Tablet</span>
        </button>

        <button
          type="button"
          className={`visibility-btn ${visibility.desktop ? "active" : "hidden"}`}
          onClick={() => toggleDevice("desktop")}
          title={visibility.desktop ? "Visible on desktop" : "Hidden on desktop"}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>
          <span>Desktop</span>
        </button>
      </div>

      <style>{`
        .responsive-visibility {
          padding: 4px 0;
        }

        .visibility-buttons {
          display: flex;
          gap: 6px;
        }

        .visibility-btn {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 8px 6px;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          background: #ffffff;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .visibility-btn svg {
          color: #6b7280;
          transition: color 0.15s ease;
        }

        .visibility-btn span {
          font-size: 10px;
          font-weight: 500;
          color: #6b7280;
          transition: color 0.15s ease;
        }

        .visibility-btn:hover {
          border-color: #d1d5db;
        }

        .visibility-btn.active {
          background: #eff6ff;
          border-color: #3b82f6;
        }

        .visibility-btn.active svg {
          color: #3b82f6;
        }

        .visibility-btn.active span {
          color: #3b82f6;
        }

        .visibility-btn.hidden {
          background: #fef2f2;
          border-color: #fca5a5;
        }

        .visibility-btn.hidden svg {
          color: #ef4444;
          opacity: 0.5;
        }

        .visibility-btn.hidden span {
          color: #ef4444;
        }

        .visibility-btn.hidden::after {
          content: "";
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-45deg);
          width: 2px;
          height: 70%;
          background: #ef4444;
          opacity: 0.3;
        }

        .visibility-btn {
          position: relative;
        }
      `}</style>
    </div>
  );
}

// Export the field configuration for Puck
export const ResponsiveVisibilityField = {
  type: "custom" as const,
  render: ResponsiveVisibility,
};
