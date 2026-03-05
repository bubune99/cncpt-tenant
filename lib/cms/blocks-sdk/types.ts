/**
 * Block SDK Types
 * Re-exports core types from block-editor and adds SDK-specific types.
 */

// Re-export core types
export type {
  Block,
  BlockTag,
  BlockAnimation,
  BlockBackground,
  BlockCategory,
  BlockTemplate,
  PageDocument,
  PageLayout,
  ExportFramework,
  CommerceProvider,
  CommerceBinding,
} from "@/lib/cms/block-editor/types"

export {
  CONTAINER_TAGS,
  LEAF_TAGS,
  isContainerTag,
} from "@/lib/cms/block-editor/types"

// SDK-specific types

/** Options for block builder */
export interface BlockBuilderOptions {
  className?: string
  attrs?: Record<string, string>
  textContent?: string
  animation?: import("@/lib/cms/block-editor/types").BlockAnimation
  background?: import("@/lib/cms/block-editor/types").BlockBackground
  label?: string
  hidden?: boolean
  locked?: boolean
}

/** Flex-specific options */
export interface FlexOptions extends BlockBuilderOptions {
  direction?: "row" | "col" | "row-reverse" | "col-reverse"
  justify?: "start" | "end" | "center" | "between" | "around" | "evenly"
  align?: "start" | "end" | "center" | "stretch" | "baseline"
  wrap?: boolean
  gap?: number | string
}

/** Grid-specific options */
export interface GridOptions extends BlockBuilderOptions {
  cols?: number | string
  rows?: number | string
  gap?: number | string
}

/** Validation result */
export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
  suggestions: ValidationSuggestion[]
}

export interface ValidationError {
  path: string
  message: string
  code: string
  blockId?: string
}

export interface ValidationWarning {
  path: string
  message: string
  code: string
  blockId?: string
}

export interface ValidationSuggestion {
  path: string
  message: string
  code: string
  fix?: () => import("@/lib/cms/block-editor/types").Block[]
}

/** Validation options */
export interface ValidationOptions {
  /** Strict mode - treat warnings as errors */
  strict?: boolean
  /** Check accessibility (alt tags, aria labels) */
  checkAccessibility?: boolean
  /** Check for empty containers */
  checkEmptyContainers?: boolean
  /** Maximum nesting depth */
  maxDepth?: number
}

/** Diff result for sync operations */
export interface DiffResult {
  hasChanges: boolean
  hasConflicts: boolean
  added: DiffEntry[]
  removed: DiffEntry[]
  modified: DiffEntry[]
  moved: DiffEntry[]
  conflicts: ConflictEntry[]
}

export interface DiffEntry {
  path: string
  blockId: string
  block: import("@/lib/cms/block-editor/types").Block
}

export interface ConflictEntry {
  path: string
  blockId: string
  local: import("@/lib/cms/block-editor/types").Block
  remote: import("@/lib/cms/block-editor/types").Block
  type: "content" | "structure" | "both"
}

/** Options for diff */
export interface DiffOptions {
  /** Ignore whitespace changes in textContent */
  ignoreWhitespace?: boolean
  /** Ignore className order changes */
  ignoreClassOrder?: boolean
  /** Ignore id changes (compare by structure) */
  ignoreIds?: boolean
}

/** Options for patch */
export interface PatchOptions {
  /** Strategy for resolving conflicts */
  strategy?: "prefer-local" | "prefer-remote" | "manual"
  /** Callback for manual conflict resolution */
  onConflict?: (local: import("@/lib/cms/block-editor/types").Block, remote: import("@/lib/cms/block-editor/types").Block) => import("@/lib/cms/block-editor/types").Block
}

/** Converter options for JSX */
export interface JSXConverterOptions {
  /** Indentation size (default: 2) */
  indent?: number
  /** Include data-block-id attributes */
  includeBlockIds?: boolean
  /** Include animation data attributes */
  includeAnimations?: boolean
  /** Single line output for simple blocks */
  singleLine?: boolean
}

/** Converter options for React component export */
export interface ReactComponentOptions {
  /** Component name */
  name: string
  /** Export type */
  exportType?: "default" | "named"
  /** Include necessary imports */
  includeImports?: boolean
  /** Include framer-motion for animations */
  includeAnimations?: boolean
  /** TypeScript or JavaScript */
  typescript?: boolean
}

/** Converter options for Next.js page export */
export interface NextPageOptions extends ReactComponentOptions {
  /** Route path */
  route?: string
  /** Page metadata */
  metadata?: {
    title?: string
    description?: string
    openGraph?: Record<string, string>
  }
}

/** Tree walker callback */
export type WalkCallback = (
  block: import("@/lib/cms/block-editor/types").Block,
  path: string,
  parent: import("@/lib/cms/block-editor/types").Block | null,
  index: number
) => void | boolean

/** Tree transform callback */
export type TransformCallback = (
  block: import("@/lib/cms/block-editor/types").Block,
  path: string,
  parent: import("@/lib/cms/block-editor/types").Block | null
) => import("@/lib/cms/block-editor/types").Block

/** Tree filter callback */
export type FilterCallback = (
  block: import("@/lib/cms/block-editor/types").Block,
  path: string,
  parent: import("@/lib/cms/block-editor/types").Block | null
) => boolean
