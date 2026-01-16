/**
 * Puck Builder Components
 *
 * A professional page builder UI that wraps Puck editor
 * with VS Code-style layout and modern design.
 */

export { ActivityBar } from "./activity-bar";
export { ActivityPanel } from "./activity-panel";
export { BuilderHeader } from "./builder-header";
export { RightPanel } from "./right-panel";
export { BottomPanel } from "./bottom-panel";
export { PuckBuilder, default as default } from "./puck-builder";

// Types
export type {
  ActivityView,
  Viewport,
  RightPanelTab,
  BuilderPage,
  BuilderElement,
  BuilderState,
  PuckBuilderProps,
  ElementCategory,
  PanelPosition,
  PanelType,
} from "./types";

// Utilities
export {
  puckDataToElements,
  getComponentLabel,
} from "./types";
