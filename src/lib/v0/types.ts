/**
 * v0 Integration Types
 *
 * Types for parsing and converting v0.dev components to Puck components.
 */

// Parsed component structure from v0 code
export interface ParsedV0Component {
  // Component metadata
  name: string;
  displayName: string;
  description?: string;

  // Source code
  sourceCode: string;
  language: "typescript" | "javascript";

  // Parsed structure
  props: ParsedProp[];
  imports: ParsedImport[];
  dependencies: string[];

  // UI details
  hasChildren: boolean;
  defaultContent?: string;

  // Tailwind classes found
  tailwindClasses: string[];
}

export interface ParsedProp {
  name: string;
  type: PropType;
  defaultValue?: unknown;
  required: boolean;
  description?: string;

  // For enum/select types
  options?: string[];

  // For object types
  properties?: ParsedProp[];
}

export type PropType =
  | "string"
  | "number"
  | "boolean"
  | "select"
  | "color"
  | "object"
  | "array"
  | "function"
  | "node"
  | "unknown";

export interface ParsedImport {
  source: string;
  defaultImport?: string;
  namedImports: string[];
  isRelative: boolean;
}

// Puck ComponentConfig type (simplified)
export interface PuckComponentConfig {
  label: string;
  fields: Record<string, PuckField>;
  defaultProps: Record<string, unknown>;
  render: (props: Record<string, unknown>) => React.ReactNode;
}

export interface PuckField {
  type: PuckFieldType;
  label?: string;
  options?: { label: string; value: string }[];
  defaultValue?: unknown;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
}

export type PuckFieldType =
  | "text"
  | "textarea"
  | "number"
  | "select"
  | "radio"
  | "custom"
  | "external"
  | "array"
  | "object";

// Custom component stored in database
export interface CustomComponent {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  category: string;
  tags: string[];

  // Source
  sourceCode: string;
  sourceUrl?: string; // Original v0 URL if available

  // Puck configuration
  puckConfig: string; // JSON stringified PuckComponentConfig

  // Metadata
  version: number;
  isPublished: boolean;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

// v0 import request
export interface V0ImportRequest {
  // Either URL or code
  url?: string;
  code?: string;

  // Optional overrides
  name?: string;
  category?: string;
  description?: string;
}

// v0 import result
export interface V0ImportResult {
  success: boolean;
  component?: CustomComponent;
  parsed?: ParsedV0Component;
  puckConfig?: PuckComponentConfig;
  errors?: string[];
  warnings?: string[];
  requiredSetup?: string[];
}

// v0 fetch result
export interface V0FetchResult {
  success: boolean;
  code?: string;
  name?: string;
  description?: string;
  error?: string;
}
