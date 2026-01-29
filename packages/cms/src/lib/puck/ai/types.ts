/**
 * Puck AI Types
 *
 * Type definitions for Puck editor AI integration including
 * real-time context and help mode support.
 */

/**
 * Selected component information from the editor
 */
export interface SelectedComponent {
  /** Component ID */
  id: string;
  /** Component type (e.g., "Heading", "Section") */
  type: string;
  /** Component props */
  props: Record<string, unknown>;
  /** Parent component ID if nested */
  parentId?: string;
  /** Zone name if in a drop zone */
  zone?: string;
  /** Index position in parent/zone */
  index: number;
}

/**
 * Editor context passed with each AI request
 * Includes real-time state about user interactions
 */
export interface PuckEditorContext {
  /** Currently selected component, if any */
  selectedComponent?: SelectedComponent;
  /** User is in help mode (wants explanations) */
  helpMode?: boolean;
  /** User clicked "help" on a specific component */
  helpTarget?: {
    componentId: string;
    componentType: string;
    action: "explain" | "edit-help" | "example";
  };
  /** Recent user actions for context */
  recentActions?: Array<{
    action: "select" | "add" | "edit" | "delete" | "move";
    componentId?: string;
    componentType?: string;
    timestamp: number;
  }>;
  /** Active drop zone the user is hovering over */
  activeDropZone?: {
    componentId: string;
    zone: string;
  };
  /** Viewport/device preview mode */
  viewportMode?: "desktop" | "tablet" | "mobile";
  /** Is the properties panel open? */
  propertiesPanelOpen?: boolean;
  /** Current undo/redo state */
  canUndo?: boolean;
  /** Current undo/redo state */
  canRedo?: boolean;
}

/**
 * Component help information
 */
export interface ComponentHelp {
  /** Component type name */
  componentType: string;
  /** Short description */
  summary: string;
  /** Detailed description */
  description: string;
  /** Available props with descriptions */
  props: Array<{
    name: string;
    type: string;
    description: string;
    defaultValue?: unknown;
    required?: boolean;
  }>;
  /** Usage examples */
  examples: Array<{
    title: string;
    props: Record<string, unknown>;
    description?: string;
  }>;
  /** Tips for using this component */
  tips?: string[];
  /** Related components */
  relatedComponents?: string[];
}

/**
 * Help mode action from user interaction
 */
export interface PuckHelpAction {
  type: "explain" | "edit-guide" | "show-example" | "suggest-improvement";
  componentId: string;
  componentType: string;
  question?: string;
}

/**
 * Result of help mode action
 */
export interface PuckHelpResult {
  success: boolean;
  componentType: string;
  action: PuckHelpAction["type"];
  content: {
    explanation?: string;
    editGuide?: string;
    example?: Record<string, unknown>;
    suggestion?: string;
  };
}

/**
 * Puck socket events for real-time sync
 */
export interface PuckSocketEvents {
  // Client -> Server
  "puck:state-update": {
    pageId: string;
    selectedComponentId?: string;
    componentCount: number;
    timestamp: number;
  };
  "puck:help-request": PuckHelpAction & { pageId: string };

  // Server -> Client
  "puck:ai-response": {
    type: "help" | "suggestion" | "action";
    content: string;
    targetComponentId?: string;
  };
}
