/**
 * Smart Block Registry
 *
 * Registers React components that are rendered by the storefront
 * when a block has a `componentName` field. This replaces dumb HTML
 * rendering with interactive, data-driven components.
 */

import type { Block } from '../types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Data requirement descriptor — tells the resolver what to fetch */
export interface DataRequirement {
  /** Unique key for this piece of data (e.g., "products", "categories") */
  key: string
  /** The fetcher identifier (maps to a function in data-resolver) */
  fetcher: string
  /** Arguments to pass to the fetcher */
  args: Record<string, unknown>
}

/** Editor field descriptor — drives the properties panel for smart blocks */
export interface EditorField {
  key: string
  label: string
  type: 'text' | 'number' | 'select' | 'toggle' | 'color' | 'slider'
  defaultValue?: unknown
  options?: { label: string; value: string | number }[]
  min?: number
  max?: number
  step?: number
  /** Where to store the value: 'commerce' writes to block.commerce, 'attrs' writes to block.attrs */
  target?: 'commerce' | 'attrs' | 'root'
}

/** Props passed to every smart block component */
export interface SmartBlockProps {
  block: Block
  data: Record<string, unknown>
  className?: string
}

/** Full smart block definition */
export interface SmartBlockDefinition {
  componentName: string
  displayName: string
  category: 'commerce' | 'dashboard' | 'content'
  icon: string
  component: React.ComponentType<SmartBlockProps>
  dataRequirements: (block: Block) => DataRequirement[]
  defaultBlock: Partial<Block>
  editorConfig: {
    fields: EditorField[]
  }
}

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

const registry = new Map<string, SmartBlockDefinition>()

/** Register a smart block definition */
export function registerSmartBlock(def: SmartBlockDefinition): void {
  registry.set(def.componentName, def)
}

/** Get a smart block definition by componentName */
export function getSmartBlock(componentName: string): SmartBlockDefinition | undefined {
  return registry.get(componentName)
}

/** Check if a componentName is a registered smart block */
export function isSmartBlock(componentName: string | undefined): boolean {
  if (!componentName) return false
  return registry.has(componentName)
}

/** List all registered smart blocks */
export function listSmartBlocks(): SmartBlockDefinition[] {
  return Array.from(registry.values())
}

/** List smart blocks by category */
export function listSmartBlocksByCategory(category: SmartBlockDefinition['category']): SmartBlockDefinition[] {
  return Array.from(registry.values()).filter(d => d.category === category)
}

/** Clear the registry (for testing) */
export function clearRegistry(): void {
  registry.clear()
}
