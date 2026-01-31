"use client";

/**
 * Help Mode Button
 *
 * A button for the Puck editor header that toggles help mode.
 * When active, the AI assistant focuses on explaining components
 * rather than making changes.
 */

import { useHelpMode } from "@/lib/cms/puck/help-mode-context";

const HelpIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <path d="M12 17h.01" />
  </svg>
);

export function HelpModeButton() {
  const { helpMode, toggleHelpMode } = useHelpMode();

  return (
    <button
      onClick={toggleHelpMode}
      className={`help-mode-button ${helpMode ? "active" : ""}`}
      title={helpMode ? "Exit help mode" : "Enter help mode - AI will explain instead of change"}
    >
      <HelpIcon />
      <span>Help</span>
      <style>{`
        .help-mode-button {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: transparent;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
          color: #6b7280;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .help-mode-button:hover {
          background: #f3f4f6;
          border-color: #d1d5db;
          color: #374151;
        }

        .help-mode-button.active {
          background: linear-gradient(135deg, #ede9fe, #ddd6fe);
          border-color: #a78bfa;
          color: #7c3aed;
        }

        .help-mode-button.active:hover {
          background: linear-gradient(135deg, #ddd6fe, #c4b5fd);
          border-color: #8b5cf6;
        }

        .help-mode-button svg {
          flex-shrink: 0;
        }
      `}</style>
    </button>
  );
}
