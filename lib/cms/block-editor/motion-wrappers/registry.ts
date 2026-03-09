/**
 * Motion Wrapper Registry
 *
 * Registers interactive animation wrapper components that respond to
 * cursor, scroll, and time. Follows the same pattern as smart-blocks/registry.ts.
 */

import type { BlockAnimation } from '@/lib/cms/block-editor/types'

/** Editor field descriptor for interactive preset config */
export interface MotionEditorField {
  key: string
  label: string
  type: 'number' | 'select' | 'toggle' | 'color' | 'slider'
  defaultValue?: unknown
  options?: { label: string; value: string | number }[]
  min?: number
  max?: number
  step?: number
}

/** Props passed to every motion wrapper component */
export interface MotionWrapperProps {
  children: React.ReactNode
  config: Record<string, unknown>
  animation: BlockAnimation
  className?: string
  style?: React.CSSProperties
}

/** Full motion wrapper definition */
export interface MotionWrapperConfig {
  key: string
  label: string
  category: 'cursor' | 'autonomous' | 'scroll' | 'text'
  component: React.ComponentType<MotionWrapperProps>
  defaultConfig: Record<string, unknown>
  editorFields: MotionEditorField[]
}

const registry = new Map<string, MotionWrapperConfig>()

export function registerMotionWrapper(config: MotionWrapperConfig): void {
  registry.set(config.key, config)
}

export function getMotionWrapper(type: string): MotionWrapperConfig | undefined {
  return registry.get(type)
}

export function listMotionWrappers(): MotionWrapperConfig[] {
  return Array.from(registry.values())
}

export function listMotionWrappersByCategory(category: MotionWrapperConfig['category']): MotionWrapperConfig[] {
  return Array.from(registry.values()).filter(w => w.category === category)
}
