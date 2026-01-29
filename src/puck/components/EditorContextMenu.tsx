"use client";

import React, { useState, useEffect, useCallback } from "react";
import { usePuck } from "@puckeditor/core";
import {
  ContextMenu,
  saveStylesToClipboard,
  getStylesFromClipboard,
  hasStylesInClipboard,
  mergeStyles,
  saveComponentToClipboard,
  getComponentFromClipboard,
  hasComponentInClipboard,
} from "./ContextMenu";

export function EditorContextMenu() {
  const { appState, dispatch } = usePuck();
  const [hasClipboard, setHasClipboard] = useState(false);
  const [hasComponentClipboard, setHasComponentClipboard] = useState(false);

  // Check clipboard status on mount and after copy
  useEffect(() => {
    setHasClipboard(hasStylesInClipboard());
    setHasComponentClipboard(hasComponentInClipboard());
  }, []);

  // Get the currently selected component
  const selectedItem = appState.ui.itemSelector;
  const hasSelection = selectedItem !== null;

  // Find the selected component data
  const getSelectedComponentData = useCallback(() => {
    if (!selectedItem) return null;

    const { index, zone } = selectedItem;

    // Handle root content
    if (!zone || zone === "default-zone" || zone === "content") {
      return appState.data.content[index] || null;
    }

    // Handle nested zones - need to traverse the tree
    // Zone format is typically "componentId:zoneName"
    const zoneParts = zone.split(":");
    if (zoneParts.length >= 2) {
      const parentId = zoneParts[0];

      // Find parent component by ID
      const findComponentById = (components: any[], id: string): any => {
        for (const comp of components) {
          if (comp.props?.id === id) {
            return comp;
          }
          // Check nested content
          if (comp.props?.content && Array.isArray(comp.props.content)) {
            const found = findComponentById(comp.props.content, id);
            if (found) return found;
          }
          // Check other slots
          for (const key of Object.keys(comp.props || {})) {
            if (Array.isArray(comp.props[key])) {
              const found = findComponentById(comp.props[key], id);
              if (found) return found;
            }
          }
        }
        return null;
      };

      const parent = findComponentById(appState.data.content, parentId);
      if (parent) {
        const zoneName = zoneParts.slice(1).join(":");
        const zoneContent = parent.props?.[zoneName] || parent.props?.content;
        if (Array.isArray(zoneContent)) {
          return zoneContent[index] || null;
        }
      }
    }

    return appState.data.content[index] || null;
  }, [selectedItem, appState.data.content]);

  const handleCopyStyles = useCallback(() => {
    const component = getSelectedComponentData();
    if (component) {
      saveStylesToClipboard(component.type, component.props);
      setHasClipboard(true);

      // Show toast notification
      showToast("Styles copied!");
    }
  }, [getSelectedComponentData]);

  const handlePasteStyles = useCallback(() => {
    const component = getSelectedComponentData();
    if (!component || !selectedItem) return;

    const clipboard = getStylesFromClipboard();
    if (!clipboard) return;

    const sameType = clipboard.componentType === component.type;
    const newProps = mergeStyles(component.props, clipboard.styles, sameType);

    // Create the updated component
    const updatedComponent = {
      ...component,
      props: newProps,
    };

    // Use Puck's dispatch to update the component
    dispatch({
      type: "setData",
      data: updateComponentInData(appState.data, selectedItem, updatedComponent),
    });

    showToast(sameType ? "Styles pasted!" : "Compatible styles pasted!");
  }, [getSelectedComponentData, selectedItem, appState.data, dispatch]);

  const handleDuplicate = useCallback(() => {
    if (!selectedItem) return;

    dispatch({
      type: "duplicate",
      sourceIndex: selectedItem.index,
      sourceZone: selectedItem.zone || "content",
    });

    showToast("Component duplicated!");
  }, [selectedItem, dispatch]);

  const handleDelete = useCallback(() => {
    if (!selectedItem) return;

    dispatch({
      type: "remove",
      index: selectedItem.index,
      zone: selectedItem.zone || "content",
    });

    showToast("Component deleted!");
  }, [selectedItem, dispatch]);

  const handleCopyComponent = useCallback(() => {
    const component = getSelectedComponentData();
    if (component) {
      saveComponentToClipboard(component);
      setHasComponentClipboard(true);
      showToast("Component copied!");
    }
  }, [getSelectedComponentData]);

  const handlePasteComponent = useCallback(() => {
    const component = getComponentFromClipboard();
    if (!component) return;

    const zone = selectedItem?.zone || "content";
    const insertIndex = selectedItem ? selectedItem.index + 1 : appState.data.content.length;

    // Create new component with new ID
    const newComponent = {
      ...component,
      props: {
        ...component.props,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      },
    };

    dispatch({
      type: "insert",
      componentType: newComponent.type,
      destinationIndex: insertIndex,
      destinationZone: zone,
      props: newComponent.props,
    } as any);

    showToast("Component pasted!");
  }, [selectedItem, appState.data.content.length, dispatch]);

  const handleMoveUp = useCallback(() => {
    if (!selectedItem || selectedItem.index === 0) return;

    const zone = selectedItem.zone || "content";
    const fromIndex = selectedItem.index;
    const toIndex = fromIndex - 1;

    dispatch({
      type: "move",
      sourceIndex: fromIndex,
      sourceZone: zone,
      destinationIndex: toIndex,
      destinationZone: zone,
    } as any);

    // Update selection
    dispatch({
      type: "setUi",
      ui: {
        itemSelector: { index: toIndex, zone },
      },
    });

    showToast("Moved up!");
  }, [selectedItem, dispatch]);

  const handleMoveDown = useCallback(() => {
    if (!selectedItem) return;

    const zone = selectedItem.zone || "content";
    const content = zone === "content" ? appState.data.content : [];

    if (selectedItem.index >= content.length - 1) return;

    const fromIndex = selectedItem.index;
    const toIndex = fromIndex + 1;

    dispatch({
      type: "move",
      sourceIndex: fromIndex,
      sourceZone: zone,
      destinationIndex: toIndex + 1,
      destinationZone: zone,
    } as any);

    // Update selection
    dispatch({
      type: "setUi",
      ui: {
        itemSelector: { index: toIndex, zone },
      },
    });

    showToast("Moved down!");
  }, [selectedItem, appState.data.content, dispatch]);

  return (
    <ContextMenu
      onCopyStyles={handleCopyStyles}
      onPasteStyles={handlePasteStyles}
      onCopyComponent={handleCopyComponent}
      onPasteComponent={handlePasteComponent}
      onDuplicate={handleDuplicate}
      onDelete={handleDelete}
      onMoveUp={handleMoveUp}
      onMoveDown={handleMoveDown}
      hasClipboard={hasClipboard}
      hasComponentClipboard={hasComponentClipboard}
      hasSelection={hasSelection}
    />
  );
}

// Helper to update a component in the data tree
function updateComponentInData(data: any, selector: { index: number; zone?: string }, newComponent: any): any {
  const newData = { ...data, content: [...data.content] };

  if (!selector.zone || selector.zone === "default-zone" || selector.zone === "content") {
    newData.content[selector.index] = newComponent;
    return newData;
  }

  // Handle nested zones
  const zoneParts = selector.zone.split(":");
  if (zoneParts.length >= 2) {
    const parentId = zoneParts[0];

    const updateInTree = (components: any[]): any[] => {
      return components.map((comp) => {
        if (comp.props?.id === parentId) {
          const zoneName = zoneParts.slice(1).join(":") || "content";
          const zoneContent = [...(comp.props[zoneName] || comp.props.content || [])];
          zoneContent[selector.index] = newComponent;

          return {
            ...comp,
            props: {
              ...comp.props,
              [zoneName]: zoneContent,
            },
          };
        }

        // Recursively update nested content
        if (comp.props?.content && Array.isArray(comp.props.content)) {
          return {
            ...comp,
            props: {
              ...comp.props,
              content: updateInTree(comp.props.content),
            },
          };
        }

        return comp;
      });
    };

    newData.content = updateInTree(newData.content);
  }

  return newData;
}

// Simple toast notification
function showToast(message: string) {
  const toast = document.createElement("div");
  toast.className = "context-menu-toast";
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    bottom: 80px;
    left: 50%;
    transform: translateX(-50%);
    padding: 10px 20px;
    background: #1e293b;
    color: white;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 500;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 10001;
    animation: toastIn 0.2s ease, toastOut 0.2s ease 1.5s forwards;
  `;

  // Add animation styles if not already present
  if (!document.getElementById("toast-styles")) {
    const style = document.createElement("style");
    style.id = "toast-styles";
    style.textContent = `
      @keyframes toastIn {
        from { opacity: 0; transform: translateX(-50%) translateY(10px); }
        to { opacity: 1; transform: translateX(-50%) translateY(0); }
      }
      @keyframes toastOut {
        from { opacity: 1; }
        to { opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 1800);
}
