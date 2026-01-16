/**
 * Builder Types
 *
 * Bridges Puck's data model with our custom UI components
 */

import type { Data, Config } from "@measured/puck";

// Element representation for our UI (maps to Puck's content items)
export type BuilderElement = {
  id: string;
  type: string;
  label: string;
  props: Record<string, unknown>;
  children?: BuilderElement[];
};

// Page representation
export type BuilderPage = {
  id: string;
  name: string;
  slug: string;
  isHome?: boolean;
};

// Viewport options
export type Viewport = "desktop" | "tablet" | "mobile";

// Activity bar view options
export type ActivityView =
  | "blocks"
  | "images"
  | "typography"
  | "links"
  | "navigation"
  | "layers"
  | "styles"
  | "code"
  | "global"
  | "ai"
  | "assets"
  | "history"
  | "settings";

// Right panel tab options
export type RightPanelTab = "layers" | "inspector" | "styles" | "interactions";

// Panel positions
export type PanelPosition = "left" | "right" | "bottom";
export type PanelType = "elements" | "layers";

// Element categories for the blocks panel
export interface ElementCategory {
  name: string;
  elements: {
    name: string;
    type: string;
    icon: React.ComponentType<{ className?: string }>;
    defaultProps?: Record<string, unknown>;
  }[];
}

// Builder state that syncs with Puck
export interface BuilderState {
  elements: BuilderElement[];
  selectedElement: BuilderElement | null;
  viewport: Viewport;
  zoom: number;
  activeView: ActivityView;
  rightPanelTab: RightPanelTab;
  rightPanelCollapsed: boolean;
}

// Props for the main builder component
export interface PuckBuilderProps {
  config: Config;
  data: Data;
  onPublish: (data: Data) => void;
  headerActions?: React.ReactNode;
  page?: BuilderPage;
}

// Convert Puck Data to BuilderElements
export function puckDataToElements(data: Data): BuilderElement[] {
  return data.content.map((item, index) => ({
    id: item.props?.id || `element-${index}`,
    type: item.type,
    label: item.type.charAt(0).toUpperCase() + item.type.slice(1).replace(/([A-Z])/g, ' $1'),
    props: item.props || {},
    // TODO: Handle nested zones/children
  }));
}

// Get component label from config
export function getComponentLabel(config: Config, type: string): string {
  const component = config.components[type];
  if (component && 'label' in component) {
    return component.label as string;
  }
  return type.charAt(0).toUpperCase() + type.slice(1).replace(/([A-Z])/g, ' $1');
}
