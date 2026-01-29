"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { usePuck, type ComponentData } from "@puckeditor/core";

// Puck's root zone identifier
const ROOT_ZONE = "root:default-zone";

interface ContextMenuState {
  x: number;
  y: number;
  index: number;
  zone: string;
}

interface OutlineItemProps {
  item: ComponentData;
  index: number;
  depth: number;
  zone: string;
  totalItems: number;
  selectedId: string | null;
  onSelect: (index: number, zone: string) => void;
  onContextMenu: (e: React.MouseEvent, index: number, zone: string) => void;
}

function OutlineItem({
  item,
  index,
  depth,
  zone,
  totalItems,
  selectedId,
  onSelect,
  onContextMenu,
}: OutlineItemProps) {
  const isSelected = item.props?.id === selectedId;

  // Check if this item has nested content (slots)
  const hasChildren = Array.isArray(item.props?.content) && item.props.content.length > 0;
  const [isExpanded, setIsExpanded] = useState(true);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onContextMenu(e, index, zone);
  };

  return (
    <div className="outline-item-wrapper">
      <div
        className={`outline-item ${isSelected ? "selected" : ""}`}
        style={{ paddingLeft: `${12 + depth * 16}px` }}
        onClick={() => onSelect(index, zone)}
        onContextMenu={handleContextMenu}
      >
        {hasChildren && (
          <button
            className="expand-btn"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="currentColor"
              style={{ transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)" }}
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
        )}
        <span className="item-icon">{getComponentIcon(item.type)}</span>
        <span className="item-label">{getDisplayLabel(item)}</span>
        <span className="item-index">#{index + 1}</span>
      </div>

      {hasChildren && isExpanded && (
        <div className="outline-children">
          {(item.props.content as ComponentData[]).map((child, childIndex) => (
            <OutlineItem
              key={child.props?.id as string || childIndex}
              item={child}
              index={childIndex}
              depth={depth + 1}
              zone={`${item.props?.id}:content`}
              totalItems={(item.props.content as ComponentData[]).length}
              selectedId={selectedId}
              onSelect={onSelect}
              onContextMenu={onContextMenu}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function getComponentIcon(type: string): string {
  const icons: Record<string, string> = {
    Header: "📌",
    Footer: "📎",
    Section: "📦",
    Container: "📋",
    Grid: "⊞",
    Flex: "↔",
    Row: "═",
    Columns: "║",
    Heading: "H",
    Text: "¶",
    Button: "🔘",
    Image: "🖼",
    Spacer: "↕",
    Card: "🃏",
    StatsCard: "📊",
    Box: "□",
    Icon: "★",
    Divider: "—",
    NavLink: "🔗",
    NavMenu: "☰",
    NavMenuItem: "•",
    FooterColumn: "📁",
    FooterLink: "→",
    SocialLink: "🌐",
  };
  return icons[type] || "◦";
}

function getDisplayLabel(item: ComponentData): string {
  const label = item.props?.label || item.props?.title || item.props?.text;
  if (typeof label === "string" && label.length > 0) {
    return label.length > 20 ? label.substring(0, 20) + "..." : label;
  }
  return item.type;
}

export function DraggableOutline() {
  const { appState, dispatch } = usePuck();
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const content = appState.data.content || [];
  const selectedId = appState.ui.itemSelector?.index !== undefined
    ? content[appState.ui.itemSelector.index]?.props?.id as string
    : null;

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

  // Close context menu on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setContextMenu(null);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSelect = useCallback((index: number, zone: string) => {
    dispatch({
      type: "setUi",
      ui: { itemSelector: { index, zone } },
    });
  }, [dispatch]);

  const handleContextMenu = useCallback((e: React.MouseEvent, index: number, zone: string) => {
    e.preventDefault();

    // Select the item when right-clicking
    dispatch({
      type: "setUi",
      ui: { itemSelector: { index, zone } },
    });

    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      index,
      zone,
    });
  }, [dispatch]);

  const getMaxIndex = useCallback((zone: string) => {
    if (zone === ROOT_ZONE) return content.length - 1;
    // For nested zones, we'd need to traverse the tree
    return 999;
  }, [content.length]);

  const handleMoveUp = useCallback(() => {
    if (!contextMenu || contextMenu.index <= 0) return;

    dispatch({
      type: "move",
      sourceIndex: contextMenu.index,
      sourceZone: contextMenu.zone,
      destinationIndex: contextMenu.index - 1,
      destinationZone: contextMenu.zone,
    } as any);

    dispatch({
      type: "setUi",
      ui: { itemSelector: { index: contextMenu.index - 1, zone: contextMenu.zone } },
    });

    setContextMenu(null);
  }, [contextMenu, dispatch]);

  const handleMoveDown = useCallback(() => {
    if (!contextMenu || contextMenu.index >= getMaxIndex(contextMenu.zone)) return;

    dispatch({
      type: "move",
      sourceIndex: contextMenu.index,
      sourceZone: contextMenu.zone,
      destinationIndex: contextMenu.index + 2,
      destinationZone: contextMenu.zone,
    } as any);

    dispatch({
      type: "setUi",
      ui: { itemSelector: { index: contextMenu.index + 1, zone: contextMenu.zone } },
    });

    setContextMenu(null);
  }, [contextMenu, dispatch, getMaxIndex]);

  const handleMoveToTop = useCallback(() => {
    if (!contextMenu || contextMenu.index <= 0) return;

    dispatch({
      type: "move",
      sourceIndex: contextMenu.index,
      sourceZone: contextMenu.zone,
      destinationIndex: 0,
      destinationZone: contextMenu.zone,
    } as any);

    dispatch({
      type: "setUi",
      ui: { itemSelector: { index: 0, zone: contextMenu.zone } },
    });

    setContextMenu(null);
  }, [contextMenu, dispatch]);

  const handleMoveToBottom = useCallback(() => {
    const maxIndex = getMaxIndex(contextMenu?.zone || ROOT_ZONE);
    if (!contextMenu || contextMenu.index >= maxIndex) return;

    dispatch({
      type: "move",
      sourceIndex: contextMenu.index,
      sourceZone: contextMenu.zone,
      destinationIndex: maxIndex + 1,
      destinationZone: contextMenu.zone,
    } as any);

    dispatch({
      type: "setUi",
      ui: { itemSelector: { index: maxIndex, zone: contextMenu.zone } },
    });

    setContextMenu(null);
  }, [contextMenu, dispatch, getMaxIndex]);

  const handleDuplicate = useCallback(() => {
    if (!contextMenu) return;

    dispatch({
      type: "duplicate",
      sourceIndex: contextMenu.index,
      sourceZone: contextMenu.zone,
    } as any);

    setContextMenu(null);
  }, [contextMenu, dispatch]);

  const handleDelete = useCallback(() => {
    if (!contextMenu) return;

    dispatch({
      type: "remove",
      index: contextMenu.index,
      zone: contextMenu.zone,
    });

    setContextMenu(null);
  }, [contextMenu, dispatch]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const selectedIndex = appState.ui.itemSelector?.index;
      const selectedZone = appState.ui.itemSelector?.zone || ROOT_ZONE;

      if (selectedIndex === undefined || selectedIndex === null) return;

      // Alt+Up to move up
      if (e.altKey && e.key === "ArrowUp" && selectedIndex > 0) {
        e.preventDefault();
        dispatch({
          type: "move",
          sourceIndex: selectedIndex,
          sourceZone: selectedZone,
          destinationIndex: selectedIndex - 1,
          destinationZone: selectedZone,
        } as any);
        dispatch({
          type: "setUi",
          ui: { itemSelector: { index: selectedIndex - 1, zone: selectedZone } },
        });
      }

      // Alt+Down to move down
      if (e.altKey && e.key === "ArrowDown" && selectedIndex < getMaxIndex(selectedZone)) {
        e.preventDefault();
        dispatch({
          type: "move",
          sourceIndex: selectedIndex,
          sourceZone: selectedZone,
          destinationIndex: selectedIndex + 2,
          destinationZone: selectedZone,
        } as any);
        dispatch({
          type: "setUi",
          ui: { itemSelector: { index: selectedIndex + 1, zone: selectedZone } },
        });
      }

      // Delete key
      if (e.key === "Delete" || e.key === "Backspace") {
        const target = e.target as HTMLElement;
        if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA" && !target.isContentEditable) {
          e.preventDefault();
          dispatch({
            type: "remove",
            index: selectedIndex,
            zone: selectedZone,
          });
        }
      }

      // Cmd/Ctrl+D to duplicate
      if ((e.metaKey || e.ctrlKey) && e.key === "d") {
        e.preventDefault();
        dispatch({
          type: "duplicate",
          sourceIndex: selectedIndex,
          sourceZone: selectedZone,
        } as any);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [appState.ui.itemSelector, dispatch, getMaxIndex]);

  return (
    <div className="draggable-outline">
      <div className="outline-header">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 6h18M3 12h18M3 18h18" />
        </svg>
        <span>Outline</span>
        <span className="item-count">{content.length}</span>
      </div>

      <div className="outline-help">
        <span>Right-click for options • Alt+↑↓ move • ⌘D duplicate</span>
      </div>

      <div className="outline-content">
        {content.length === 0 ? (
          <div className="empty-state">
            <p>No components yet</p>
            <p className="hint">Drag components from the left panel</p>
          </div>
        ) : (
          content.map((item, index) => (
            <OutlineItem
              key={item.props?.id as string || index}
              item={item}
              index={index}
              depth={0}
              zone={ROOT_ZONE}
              totalItems={content.length}
              selectedId={selectedId}
              onSelect={handleSelect}
              onContextMenu={handleContextMenu}
            />
          ))
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          ref={menuRef}
          className="outline-context-menu"
          style={{
            position: "fixed",
            top: contextMenu.y,
            left: contextMenu.x,
            zIndex: 99999,
          }}
        >
          <div className="menu-section">
            <div className="menu-label">Reorder</div>
            <button
              className="menu-item"
              onClick={handleMoveUp}
              disabled={contextMenu.index === 0}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 19V5M5 12l7-7 7 7" />
              </svg>
              <span>Move Up</span>
              <kbd>Alt+↑</kbd>
            </button>
            <button
              className="menu-item"
              onClick={handleMoveDown}
              disabled={contextMenu.index >= getMaxIndex(contextMenu.zone)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12l7 7 7-7" />
              </svg>
              <span>Move Down</span>
              <kbd>Alt+↓</kbd>
            </button>
            <button
              className="menu-item"
              onClick={handleMoveToTop}
              disabled={contextMenu.index === 0}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 11l-5-5-5 5M17 18l-5-5-5 5" />
              </svg>
              <span>Move to Top</span>
            </button>
            <button
              className="menu-item"
              onClick={handleMoveToBottom}
              disabled={contextMenu.index >= getMaxIndex(contextMenu.zone)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M7 13l5 5 5-5M7 6l5 5 5-5" />
              </svg>
              <span>Move to Bottom</span>
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
        </div>
      )}

      <style>{`
        .draggable-outline {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: #ffffff;
          border-top: 1px solid #e5e7eb;
        }

        .outline-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          font-size: 12px;
          font-weight: 600;
          color: #374151;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 1px solid #e5e7eb;
          background: #f9fafb;
        }

        .outline-header svg {
          color: #6b7280;
        }

        .item-count {
          margin-left: auto;
          padding: 2px 8px;
          font-size: 10px;
          font-weight: 500;
          background: #e5e7eb;
          color: #6b7280;
          border-radius: 10px;
        }

        .outline-help {
          padding: 8px 16px;
          font-size: 11px;
          color: #9ca3af;
          background: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
        }

        .outline-content {
          flex: 1;
          overflow-y: auto;
          padding: 8px 0;
        }

        .empty-state {
          padding: 24px 16px;
          text-align: center;
        }

        .empty-state p {
          margin: 0;
          font-size: 13px;
          color: #6b7280;
        }

        .empty-state .hint {
          margin-top: 4px;
          font-size: 12px;
          color: #9ca3af;
        }

        .outline-item-wrapper {
          user-select: none;
        }

        .outline-item {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          cursor: pointer;
          transition: all 0.15s ease;
          border-left: 3px solid transparent;
          position: relative;
        }

        .outline-item:hover {
          background: #f3f4f6;
        }

        .outline-item.selected {
          background: #eff6ff;
          border-left-color: #3b82f6;
        }

        .expand-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 16px;
          height: 16px;
          padding: 0;
          background: none;
          border: none;
          cursor: pointer;
          color: #6b7280;
          transition: transform 0.15s ease;
        }

        .expand-btn:hover {
          color: #374151;
        }

        .item-icon {
          font-size: 12px;
          width: 18px;
          text-align: center;
        }

        .item-label {
          flex: 1;
          font-size: 13px;
          font-weight: 500;
          color: #374151;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .item-index {
          font-size: 10px;
          color: #9ca3af;
          font-family: monospace;
        }

        .outline-children {
          border-left: 1px dashed #d1d5db;
          margin-left: 20px;
        }

        /* Context Menu */
        .outline-context-menu {
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05);
          min-width: 200px;
          padding: 6px;
          animation: menuIn 0.15s ease;
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
    </div>
  );
}

export default DraggableOutline;
