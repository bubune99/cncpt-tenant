/**
 * v0 Import Agent Types
 */

// Puck primitive definition
export interface PuckPrimitive {
  name: string;
  description: string;
  props: PuckPropDefinition[];
  slots?: string[];
  category: string;
}

export interface PuckPropDefinition {
  name: string;
  type: "string" | "number" | "boolean" | "select" | "color" | "object" | "array";
  description: string;
  required: boolean;
  options?: string[]; // For select type
  default?: unknown;
}

// Parsed v0 component
export interface V0ComponentAnalysis {
  name: string;
  description: string;
  structure: ComponentNode[];
  assets: ExtractedAsset[];
  dependencies: string[];
  complexity: "simple" | "moderate" | "complex";
  warnings: string[];
}

// Component tree node
export interface ComponentNode {
  type: string; // Puck primitive name
  props: Record<string, unknown>;
  slots?: Record<string, ComponentNode[]>;
  sourceElement?: string; // Original JSX element for reference
}

// Asset extracted from component
export interface ExtractedAsset {
  originalUrl: string;
  type: "image" | "svg" | "video" | "font";
  placeholder: string; // Placeholder ID for replacement
  suggestedName: string;
}

// Template output
export interface PuckTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  thumbnail?: string;

  // The actual Puck configuration
  root: ComponentNode;

  // Metadata
  sourceUrl?: string;
  primitivesuUsed: string[];
  assetCount: number;

  createdAt: Date;
  updatedAt: Date;
}

// Import request
export interface V0ImportRequest {
  url: string;
  name?: string;
  category?: string;
  description?: string;
}

// Import result
export interface V0ImportResult {
  success: boolean;
  template?: PuckTemplate;
  analysis?: V0ComponentAnalysis;
  errors?: string[];
  warnings?: string[];
  missingPrimitives?: string[];
}

// Tool definitions for the agent
export interface AgentToolResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
