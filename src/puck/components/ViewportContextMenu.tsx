"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { usePuck } from "@puckeditor/core";
import { createPortal } from "react-dom";

// Puck's root zone identifier
const ROOT_ZONE = "root:default-zone";

interface ContextMenuState {
  x: number;
  y: number;
  componentId: string;
  componentType: string;
}

interface ComponentOverlayProps {
  children: React.ReactNode;
  hover: boolean;
  isSelected: boolean;
  componentId: string;
  componentType: string;
}

// Style clipboard utilities
const STYLE_CLIPBOARD_KEY = "puck-style-clipboard";

interface StyleClipboard {
  styles: Record<string, unknown>;
  componentType: string;
  timestamp: number;
}

function saveStylesToClipboard(styles: Record<string, unknown>, componentType: string) {
  const data: StyleClipboard = {
    styles,
    componentType,
    timestamp: Date.now(),
  };
  localStorage.setItem(STYLE_CLIPBOARD_KEY, JSON.stringify(data));
}

function getStylesFromClipboard(): StyleClipboard | null {
  const data = localStorage.getItem(STYLE_CLIPBOARD_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

function hasStylesInClipboard(): boolean {
  return !!localStorage.getItem(STYLE_CLIPBOARD_KEY);
}

// Extract style-related props from component props
function extractStyles(props: Record<string, unknown>): Record<string, unknown> {
  const styleKeys = [
    "backgroundColor", "background", "color", "textColor",
    "padding", "paddingTop", "paddingBottom", "paddingLeft", "paddingRight",
    "margin", "marginTop", "marginBottom", "marginLeft", "marginRight",
    "borderRadius", "borderColor", "borderWidth", "borderStyle",
    "fontSize", "fontWeight", "fontFamily", "textAlign", "lineHeight",
    "boxShadow", "shadow", "opacity",
    "width", "height", "minWidth", "minHeight", "maxWidth", "maxHeight",
    "gap", "flexDirection", "justifyContent", "alignItems",
  ];

  const styles: Record<string, unknown> = {};
  for (const key of styleKeys) {
    if (props[key] !== undefined) {
      styles[key] = props[key];
    }
  }
  return styles;
}

export function ViewportContextMenu({
  children,
  hover,
  isSelected,
  componentId,
  componentType,
}: ComponentOverlayProps) {
  const { appState, dispatch } = usePuck();
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [hasClipboard, setHasClipboard] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Check clipboard on mount and when menu opens
  useEffect(() => {
    setHasClipboard(hasStylesInClipboard());
  }, [contextMenu]);

  // Close context menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };

    if (contextMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [contextMenu]);

  // Close on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setContextMenu(null);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Find component index and zone from componentId
  const findComponentLocation = useCallback(() => {
    const content = appState.data.content || [];

    // Search in root content
    for (let i = 0; i < content.length; i++) {
      if (content[i].props?.id === componentId) {
        return { index: i, zone: ROOT_ZONE };
      }
    }

    // Search in nested zones
    const zones = appState.data.zones || {};
    for (const [zoneName, zoneContent] of Object.entries(zones)) {
      if (Array.isArray(zoneContent)) {
        for (let i = 0; i < zoneContent.length; i++) {
          if (zoneContent[i].props?.id === componentId) {
            return { index: i, zone: zoneName };
          }
        }
      }
    }

    return null;
  }, [appState.data.content, appState.data.zones, componentId]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    // Only respond to actual right-click (button 2)
    if (e.button !== 2 && e.type !== "contextmenu") return;

    e.preventDefault();
    e.stopPropagation();

    // Select the component
    const location = findComponentLocation();
    if (location) {
      dispatch({
        type: "setUi",
        ui: { itemSelector: { index: location.index, zone: location.zone } },
      });
    }

    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      componentId,
      componentType,
    });
  }, [componentId, componentType, dispatch, findComponentLocation]);

  const getComponentProps = useCallback(() => {
    const content = appState.data.content || [];
    for (const item of content) {
      if (item.props?.id === componentId) {
        return item.props;
      }
    }

    // Search in zones
    const zones = appState.data.zones || {};
    for (const zoneContent of Object.values(zones)) {
      if (Array.isArray(zoneContent)) {
        for (const item of zoneContent) {
          if (item.props?.id === componentId) {
            return item.props;
          }
        }
      }
    }
    return null;
  }, [appState.data.content, appState.data.zones, componentId]);

  const handleCopyStyles = useCallback(() => {
    const props = getComponentProps();
    if (props) {
      const styles = extractStyles(props as Record<string, unknown>);
      saveStylesToClipboard(styles, componentType);
      setHasClipboard(true);
    }
    setContextMenu(null);
  }, [getComponentProps, componentType]);

  const handlePasteStyles = useCallback(() => {
    const clipboard = getStylesFromClipboard();
    if (!clipboard) return;

    const location = findComponentLocation();
    if (!location) return;

    // Get content from the right place
    let content: any[];
    if (location.zone === ROOT_ZONE) {
      content = appState.data.content || [];
    } else {
      content = appState.data.zones?.[location.zone] || [];
    }

    const component = content[location.index];
    if (!component) return;

    // Merge styles with existing props
    const newProps = {
      ...component.props,
      ...clipboard.styles,
    };

    dispatch({
      type: "replace",
      destinationIndex: location.index,
      destinationZone: location.zone,
      data: {
        ...component,
        props: newProps,
      },
    } as any);

    setContextMenu(null);
  }, [appState.data.content, appState.data.zones, dispatch, findComponentLocation]);

  const handleMoveUp = useCallback(() => {
    const location = findComponentLocation();
    if (!location || location.index <= 0) return;

    dispatch({
      type: "move",
      sourceIndex: location.index,
      sourceZone: location.zone,
      destinationIndex: location.index - 1,
      destinationZone: location.zone,
    } as any);

    dispatch({
      type: "setUi",
      ui: { itemSelector: { index: location.index - 1, zone: location.zone } },
    });

    setContextMenu(null);
  }, [dispatch, findComponentLocation]);

  const handleMoveDown = useCallback(() => {
    const location = findComponentLocation();
    if (!location) return;

    // Get content length from the right place
    let contentLength: number;
    if (location.zone === ROOT_ZONE) {
      contentLength = appState.data.content?.length || 0;
    } else {
      contentLength = appState.data.zones?.[location.zone]?.length || 0;
    }

    const maxIndex = contentLength - 1;
    if (location.index >= maxIndex) return;

    dispatch({
      type: "move",
      sourceIndex: location.index,
      sourceZone: location.zone,
      destinationIndex: location.index + 2,
      destinationZone: location.zone,
    } as any);

    dispatch({
      type: "setUi",
      ui: { itemSelector: { index: location.index + 1, zone: location.zone } },
    });

    setContextMenu(null);
  }, [appState.data.content?.length, appState.data.zones, dispatch, findComponentLocation]);

  const handleDuplicate = useCallback(() => {
    const location = findComponentLocation();
    if (!location) return;

    dispatch({
      type: "duplicate",
      sourceIndex: location.index,
      sourceZone: location.zone,
    } as any);

    setContextMenu(null);
  }, [dispatch, findComponentLocation]);

  const handleDelete = useCallback(() => {
    const location = findComponentLocation();
    if (!location) return;

    dispatch({
      type: "remove",
      index: location.index,
      zone: location.zone,
    });

    setContextMenu(null);
  }, [dispatch, findComponentLocation]);

  const location = findComponentLocation();

  // Get content length for move validation
  let contentLength = 0;
  if (location) {
    if (location.zone === ROOT_ZONE) {
      contentLength = appState.data.content?.length || 0;
    } else {
      contentLength = appState.data.zones?.[location.zone]?.length || 0;
    }
  }

  const maxIndex = contentLength - 1;
  const canMoveUp = location ? location.index > 0 : false;
  const canMoveDown = location ? location.index < maxIndex : false;

  return (
    <>
      <div
        ref={wrapperRef}
        onContextMenu={handleContextMenu}
        style={{
          position: "relative",
          display: "contents",
        }}
        data-viewport-context-wrapper
      >
        {children}
      </div>

      {contextMenu && createPortal(
        <div
          ref={menuRef}
          className="viewport-context-menu"
          style={{
            position: "fixed",
            top: contextMenu.y,
            left: contextMenu.x,
            zIndex: 99999,
          }}
        >
          <div className="menu-header">
            <span className="menu-component-type">{contextMenu.componentType}</span>
          </div>

          <div className="menu-divider" />

          <div className="menu-section">
            <div className="menu-label">Styles</div>
            <button className="menu-item" onClick={handleCopyStyles}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" />
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
              </svg>
              <span>Copy Styles</span>
            </button>
            <button
              className="menu-item"
              onClick={handlePasteStyles}
              disabled={!hasClipboard}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" />
                <rect x="8" y="2" width="8" height="4" rx="1" />
              </svg>
              <span>Paste Styles</span>
            </button>
          </div>

          <div className="menu-divider" />

          <div className="menu-section">
            <div className="menu-label">Reorder</div>
            <button
              className="menu-item"
              onClick={handleMoveUp}
              disabled={!canMoveUp}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 19V5M5 12l7-7 7 7" />
              </svg>
              <span>Move Up</span>
            </button>
            <button
              className="menu-item"
              onClick={handleMoveDown}
              disabled={!canMoveDown}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12l7 7 7-7" />
              </svg>
              <span>Move Down</span>
            </button>
          </div>

          <div className="menu-divider" />

          <div className="menu-section">
            <div className="menu-label">Actions</div>
            <button className="menu-item" onClick={handleDuplicate}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" />
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
              </svg>
              <span>Duplicate</span>
              <kbd>⌘D</kbd>
            </button>
            <button className="menu-item delete" onClick={handleDelete}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" />
              </svg>
              <span>Delete</span>
              <kbd>⌫</kbd>
            </button>
          </div>
        </div>,
        document.body
      )}

      <style>{`
        .viewport-context-menu {
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05);
          min-width: 200px;
          padding: 6px;
          animation: menuIn 0.15s ease;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }

        @keyframes menuIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .menu-header {
          padding: 8px 10px;
        }

        .menu-component-type {
          font-size: 12px;
          font-weight: 600;
          color: #3b82f6;
          background: #eff6ff;
          padding: 2px 8px;
          border-radius: 4px;
        }

        .menu-section {
          display: flex;
          flex-direction: column;
        }

        .menu-label {
          font-size: 10px;
          font-weight: 600;
          color: #9ca3af;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 6px 10px 4px;
        }

        .menu-divider {
          height: 1px;
          background: #e5e7eb;
          margin: 4px 0;
        }

        .menu-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 10px;
          border: none;
          background: none;
          width: 100%;
          text-align: left;
          font-size: 13px;
          color: #374151;
          cursor: pointer;
          border-radius: 4px;
          transition: background 0.1s ease;
        }

        .menu-item:hover:not(:disabled) {
          background: #f3f4f6;
        }

        .menu-item:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .menu-item svg {
          color: #6b7280;
          flex-shrink: 0;
        }

        .menu-item span {
          flex: 1;
        }

        .menu-item kbd {
          font-size: 10px;
          color: #9ca3af;
          font-family: inherit;
          padding: 2px 6px;
          background: #f3f4f6;
          border-radius: 3px;
        }

        .menu-item.delete {
          color: #dc2626;
        }

        .menu-item.delete svg {
          color: #dc2626;
        }

        .menu-item.delete:hover:not(:disabled) {
          background: #fef2f2;
        }
      `}</style>
    </>
  );
}

export default ViewportContextMenu;
