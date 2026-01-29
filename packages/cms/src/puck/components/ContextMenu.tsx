"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";

interface ContextMenuProps {
  onCopyStyles: () => void;
  onPasteStyles: () => void;
  onCopyComponent?: () => void;
  onPasteComponent?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  hasClipboard: boolean;
  hasComponentClipboard?: boolean;
  hasSelection: boolean;
}

interface Position {
  x: number;
  y: number;
}

export function ContextMenu({
  onCopyStyles,
  onPasteStyles,
  onCopyComponent,
  onPasteComponent,
  onDuplicate,
  onDelete,
  onMoveUp,
  onMoveDown,
  hasClipboard,
  hasComponentClipboard = false,
  hasSelection,
}: ContextMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const menuRef = useRef<HTMLDivElement>(null);

  const handleContextMenu = useCallback((e: MouseEvent) => {
    // Check if right-click is on a Puck component or within the editor canvas
    const target = e.target as HTMLElement;

    // More comprehensive detection for Puck canvas and components
    const isInCanvas = target.closest('[class*="Puck-preview"]') ||
                       target.closest('[class*="Puck-frame"]') ||
                       target.closest('[class*="puck-preview"]') ||
                       target.closest('[class*="puck-frame"]') ||
                       target.closest('[data-puck-component]') ||
                       target.closest('[data-puck-dnd]') ||
                       target.closest('[class*="DraggableComponent"]') ||
                       target.closest('[class*="draggable"]') ||
                       target.closest('iframe')?.contentDocument?.body ||
                       // Check for common canvas container patterns
                       target.closest('[class*="preview"]') ||
                       target.closest('[class*="canvas"]') ||
                       target.closest('[class*="Preview"]') ||
                       target.closest('[class*="Canvas"]');

    // Also check if we're in the main editor area (not sidebar)
    const isInSidebar = target.closest('[class*="Sidebar"]') ||
                        target.closest('[class*="sidebar"]') ||
                        target.closest('[class*="Drawer"]') ||
                        target.closest('[class*="drawer"]') ||
                        target.closest('.custom-sidebar');

    if (isInCanvas && !isInSidebar) {
      e.preventDefault();

      // Calculate position, ensuring menu stays within viewport
      const x = Math.min(e.clientX, window.innerWidth - 220);
      const y = Math.min(e.clientY, window.innerHeight - 280);

      setPosition({ x, y });
      setIsOpen(true);
    }
  }, []);

  const handleClick = useCallback((e: MouseEvent) => {
    if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
      setIsOpen(false);
    }
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false);
    }

    // Keyboard shortcuts when menu is closed but component selected
    if (hasSelection && !isOpen) {
      // Ctrl/Cmd + Shift + C = Copy Styles
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "c") {
        e.preventDefault();
        onCopyStyles();
      }
      // Ctrl/Cmd + Shift + V = Paste Styles
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "v" && hasClipboard) {
        e.preventDefault();
        onPasteStyles();
      }
    }
  }, [hasSelection, hasClipboard, isOpen, onCopyStyles, onPasteStyles]);

  useEffect(() => {
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("click", handleClick);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("click", handleClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleContextMenu, handleClick, handleKeyDown]);

  const handleMenuAction = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        ref={menuRef}
        className="context-menu"
        style={{
          position: "fixed",
          left: position.x,
          top: position.y,
          zIndex: 10000,
        }}
      >
        <div className="context-menu-inner">
          {/* Style Operations */}
          <div className="context-menu-section-label">Styles</div>
          <button
            className="context-menu-item"
            onClick={() => handleMenuAction(onCopyStyles)}
            disabled={!hasSelection}
          >
            <span className="context-menu-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </span>
            <span className="context-menu-label">Copy Styles</span>
            <span className="context-menu-shortcut">Ctrl+Shift+C</span>
          </button>

          <button
            className="context-menu-item"
            onClick={() => handleMenuAction(onPasteStyles)}
            disabled={!hasClipboard || !hasSelection}
          >
            <span className="context-menu-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
                <path d="M12 12v10" strokeDasharray="3 3" />
              </svg>
            </span>
            <span className="context-menu-label">Paste Styles</span>
            <span className="context-menu-shortcut">Ctrl+Shift+V</span>
          </button>

          <div className="context-menu-divider" />

          {/* Component Operations */}
          <div className="context-menu-section-label">Component</div>

          {onCopyComponent && (
            <button
              className="context-menu-item"
              onClick={() => handleMenuAction(onCopyComponent)}
              disabled={!hasSelection}
            >
              <span className="context-menu-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                </svg>
              </span>
              <span className="context-menu-label">Copy Component</span>
              <span className="context-menu-shortcut">Ctrl+C</span>
            </button>
          )}

          {onPasteComponent && (
            <button
              className="context-menu-item"
              onClick={() => handleMenuAction(onPasteComponent)}
              disabled={!hasComponentClipboard}
            >
              <span className="context-menu-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" />
                  <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                </svg>
              </span>
              <span className="context-menu-label">Paste Component</span>
              <span className="context-menu-shortcut">Ctrl+V</span>
            </button>
          )}

          {onDuplicate && (
            <button
              className="context-menu-item"
              onClick={() => handleMenuAction(onDuplicate)}
              disabled={!hasSelection}
            >
              <span className="context-menu-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="8" y="8" width="12" height="12" rx="2" />
                  <path d="M16 8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h2" />
                </svg>
              </span>
              <span className="context-menu-label">Duplicate</span>
              <span className="context-menu-shortcut">Ctrl+D</span>
            </button>
          )}

          <div className="context-menu-divider" />

          {/* Move Operations */}
          {(onMoveUp || onMoveDown) && (
            <>
              <div className="context-menu-section-label">Reorder</div>
              {onMoveUp && (
                <button
                  className="context-menu-item"
                  onClick={() => handleMenuAction(onMoveUp)}
                  disabled={!hasSelection}
                >
                  <span className="context-menu-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 19V5M5 12l7-7 7 7" />
                    </svg>
                  </span>
                  <span className="context-menu-label">Move Up</span>
                  <span className="context-menu-shortcut">Alt+↑</span>
                </button>
              )}
              {onMoveDown && (
                <button
                  className="context-menu-item"
                  onClick={() => handleMenuAction(onMoveDown)}
                  disabled={!hasSelection}
                >
                  <span className="context-menu-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 5v14M5 12l7 7 7-7" />
                    </svg>
                  </span>
                  <span className="context-menu-label">Move Down</span>
                  <span className="context-menu-shortcut">Alt+↓</span>
                </button>
              )}
              <div className="context-menu-divider" />
            </>
          )}

          {onDelete && (
            <button
              className="context-menu-item context-menu-item-danger"
              onClick={() => handleMenuAction(onDelete)}
              disabled={!hasSelection}
            >
              <span className="context-menu-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18" />
                  <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" />
                  <path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                </svg>
              </span>
              <span className="context-menu-label">Delete</span>
              <span className="context-menu-shortcut">Del</span>
            </button>
          )}
        </div>
      </div>

      <style>{`
        .context-menu {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          animation: contextMenuIn 0.15s ease;
        }

        @keyframes contextMenuIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(-5px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .context-menu-inner {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15), 0 2px 10px rgba(0, 0, 0, 0.1);
          min-width: 220px;
          padding: 6px;
          overflow: hidden;
        }

        .context-menu-section-label {
          padding: 6px 12px 4px 12px;
          font-size: 10px;
          font-weight: 600;
          color: #9ca3af;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .context-menu-item {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          padding: 8px 12px;
          font-size: 13px;
          color: #374151;
          background: none;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.1s ease;
          text-align: left;
        }

        .context-menu-item:hover:not(:disabled) {
          background: #f3f4f6;
        }

        .context-menu-item:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .context-menu-item-danger:hover:not(:disabled) {
          background: #fef2f2;
          color: #dc2626;
        }

        .context-menu-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 18px;
          height: 18px;
          color: #6b7280;
        }

        .context-menu-item:hover:not(:disabled) .context-menu-icon {
          color: #374151;
        }

        .context-menu-item-danger:hover:not(:disabled) .context-menu-icon {
          color: #dc2626;
        }

        .context-menu-label {
          flex: 1;
          font-weight: 500;
        }

        .context-menu-shortcut {
          font-size: 10px;
          color: #9ca3af;
          padding: 2px 6px;
          background: #f3f4f6;
          border-radius: 4px;
          font-family: monospace;
        }

        .context-menu-divider {
          height: 1px;
          background: #e5e7eb;
          margin: 6px 8px;
        }
      `}</style>
    </>
  );
}

// Style clipboard utilities
const CLIPBOARD_KEY = "puck_style_clipboard";
const COMPONENT_CLIPBOARD_KEY = "puck_component_clipboard";

export interface StyleClipboard {
  componentType: string;
  styles: Record<string, unknown>;
  timestamp: number;
}

export function saveStylesToClipboard(componentType: string, props: Record<string, unknown>): void {
  // Extract style-related props (exclude content, id, children)
  const styleProps = { ...props };
  delete styleProps.content;
  delete styleProps.id;
  delete styleProps.children;

  const clipboard: StyleClipboard = {
    componentType,
    styles: styleProps,
    timestamp: Date.now(),
  };

  localStorage.setItem(CLIPBOARD_KEY, JSON.stringify(clipboard));
}

export function getStylesFromClipboard(): StyleClipboard | null {
  try {
    const stored = localStorage.getItem(CLIPBOARD_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Failed to read style clipboard:", e);
  }
  return null;
}

export function hasStylesInClipboard(): boolean {
  return !!localStorage.getItem(CLIPBOARD_KEY);
}

export function mergeStyles(
  targetProps: Record<string, unknown>,
  clipboardStyles: Record<string, unknown>,
  sameComponentType: boolean
): Record<string, unknown> {
  const merged = { ...targetProps };

  // Style properties that are safe to copy between any components
  const universalStyleProps = [
    "padding",
    "paddingTop",
    "paddingBottom",
    "paddingLeft",
    "paddingRight",
    "paddingX",
    "paddingY",
    "margin",
    "marginTop",
    "marginBottom",
    "marginLeft",
    "marginRight",
    "background",
    "backgroundColor",
    "border",
    "borderRadius",
    "shadow",
    "effects",
    "color",
    "textColor",
    "fontSize",
    "fontWeight",
    "textAlign",
    "align",
    "gap",
    "slotDirection",
    "slotGap",
    "slotAlign",
  ];

  // If same component type, copy all style props
  // If different types, only copy universal style props
  const propsToCopy = sameComponentType
    ? Object.keys(clipboardStyles)
    : universalStyleProps;

  for (const prop of propsToCopy) {
    if (prop in clipboardStyles && clipboardStyles[prop] !== undefined) {
      merged[prop] = clipboardStyles[prop];
    }
  }

  return merged;
}

// Component clipboard utilities
export interface ComponentClipboard {
  type: string;
  props: Record<string, unknown>;
  timestamp: number;
}

export function saveComponentToClipboard(component: { type: string; props: Record<string, unknown> }): void {
  const clipboard: ComponentClipboard = {
    type: component.type,
    props: { ...component.props },
    timestamp: Date.now(),
  };

  localStorage.setItem(COMPONENT_CLIPBOARD_KEY, JSON.stringify(clipboard));
}

export function getComponentFromClipboard(): ComponentClipboard | null {
  try {
    const stored = localStorage.getItem(COMPONENT_CLIPBOARD_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Failed to read component clipboard:", e);
  }
  return null;
}

export function hasComponentInClipboard(): boolean {
  return !!localStorage.getItem(COMPONENT_CLIPBOARD_KEY);
}
