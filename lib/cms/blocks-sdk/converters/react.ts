/**
 * Block SDK - React Component Converter
 *
 * Converts Block[] trees to full React component files.
 */

import type { Block } from "../types"
import type { ReactComponentOptions, NextPageOptions } from "../types"
import { toCleanJSX } from "./jsx"

/**
 * Convert Block[] to a full React component file
 *
 * @example
 * ```ts
 * const code = toReactComponent(blocks, {
 *   name: 'HeroSection',
 *   exportType: 'default',
 * })
 * ```
 */
export function toReactComponent(blocks: Block[], options: ReactComponentOptions): string {
  const {
    name,
    exportType = "default",
    includeImports = true,
    includeAnimations = hasAnimations(blocks),
    typescript = true,
  } = options

  const lines: string[] = []

  // Imports
  if (includeImports) {
    lines.push(`"use client"`)
    lines.push("")

    if (includeAnimations) {
      lines.push(`import { motion } from "framer-motion"`)
    }

    // Check for special components
    const hasImages = hasTag(blocks, "img")
    const hasLinks = hasTag(blocks, "a")

    // For Next.js, could use next/image and next/link
    // But for generic React, we'll keep standard HTML

    lines.push("")
  }

  // Component
  const jsxContent = toCleanJSX(blocks, { indent: 2, includeAnimations })
  const wrappedJSX = wrapWithAnimations(blocks, jsxContent, includeAnimations)

  if (exportType === "default") {
    lines.push(`export default function ${name}() {`)
  } else {
    lines.push(`export function ${name}() {`)
  }

  lines.push(`  return (`)

  // Wrap in fragment if multiple root blocks
  if (blocks.length > 1) {
    lines.push(`    <>`)
    for (const line of wrappedJSX.split("\n")) {
      lines.push(`      ${line}`)
    }
    lines.push(`    </>`)
  } else {
    for (const line of wrappedJSX.split("\n")) {
      lines.push(`    ${line}`)
    }
  }

  lines.push(`  )`)
  lines.push(`}`)

  return lines.join("\n")
}

/**
 * Convert Block[] to a Next.js page component
 *
 * @example
 * ```ts
 * const code = toNextPage(blocks, {
 *   name: 'AboutPage',
 *   route: '/about',
 *   metadata: { title: 'About Us' },
 * })
 * ```
 */
export function toNextPage(blocks: Block[], options: NextPageOptions): string {
  const {
    name,
    exportType = "default",
    includeImports = true,
    includeAnimations = hasAnimations(blocks),
    typescript = true,
    route,
    metadata,
  } = options

  const lines: string[] = []

  // Imports
  if (includeImports) {
    lines.push(`import type { Metadata } from "next"`)

    if (includeAnimations) {
      lines.push(`import { motion } from "framer-motion"`)
    }

    lines.push("")
  }

  // Metadata export
  if (metadata) {
    lines.push(`export const metadata: Metadata = {`)
    if (metadata.title) lines.push(`  title: "${metadata.title}",`)
    if (metadata.description) lines.push(`  description: "${metadata.description}",`)
    if (metadata.openGraph) {
      lines.push(`  openGraph: {`)
      for (const [key, value] of Object.entries(metadata.openGraph)) {
        lines.push(`    ${key}: "${value}",`)
      }
      lines.push(`  },`)
    }
    lines.push(`}`)
    lines.push("")
  }

  // Component
  const jsxContent = toCleanJSX(blocks, { indent: 2, includeAnimations })
  const wrappedJSX = wrapWithAnimations(blocks, jsxContent, includeAnimations)

  if (exportType === "default") {
    lines.push(`export default function ${name}() {`)
  } else {
    lines.push(`export function ${name}() {`)
  }

  lines.push(`  return (`)

  // Wrap in fragment if multiple root blocks
  if (blocks.length > 1) {
    lines.push(`    <>`)
    for (const line of wrappedJSX.split("\n")) {
      lines.push(`      ${line}`)
    }
    lines.push(`    </>`)
  } else {
    for (const line of wrappedJSX.split("\n")) {
      lines.push(`    ${line}`)
    }
  }

  lines.push(`  )`)
  lines.push(`}`)

  return lines.join("\n")
}

/**
 * Convert Block[] to a React Server Component (no 'use client')
 */
export function toServerComponent(blocks: Block[], options: Omit<ReactComponentOptions, "includeAnimations">): string {
  // Server components can't have animations (no client-side JS)
  return toReactComponent(blocks, { ...options, includeAnimations: false })
    .replace('"use client"\n\n', '')
}

// ============================================================
// Animation Helpers
// ============================================================

const ANIMATION_PRESETS: Record<string, { initial: string; animate: string }> = {
  fadeIn: { initial: '{ opacity: 0 }', animate: '{ opacity: 1 }' },
  slideUp: { initial: '{ opacity: 0, y: 40 }', animate: '{ opacity: 1, y: 0 }' },
  slideDown: { initial: '{ opacity: 0, y: -40 }', animate: '{ opacity: 1, y: 0 }' },
  slideLeft: { initial: '{ opacity: 0, x: 40 }', animate: '{ opacity: 1, x: 0 }' },
  slideRight: { initial: '{ opacity: 0, x: -40 }', animate: '{ opacity: 1, x: 0 }' },
  scale: { initial: '{ opacity: 0, scale: 0.85 }', animate: '{ opacity: 1, scale: 1 }' },
}

function hasAnimations(blocks: Block[]): boolean {
  for (const block of blocks) {
    if (block.animation) return true
    if (block.children && hasAnimations(block.children)) return true
  }
  return false
}

function hasTag(blocks: Block[], tag: string): boolean {
  for (const block of blocks) {
    if (block.tag === tag) return true
    if (block.children && hasTag(block.children, tag)) return true
  }
  return false
}

function wrapWithAnimations(blocks: Block[], jsx: string, includeAnimations: boolean): string {
  if (!includeAnimations) return jsx

  // For blocks with animations, we need to convert their tags to motion.tag
  // This is a simplified approach - a full implementation would need AST manipulation

  for (const block of blocks) {
    if (block.animation) {
      const { type, trigger, duration, delay, custom } = block.animation

      // Get animation props
      let initial = '{ opacity: 0 }'
      let animate = '{ opacity: 1 }'
      let transition = `{ duration: ${duration || 0.5}${delay ? `, delay: ${delay}` : ''} }`

      if (type && ANIMATION_PRESETS[type]) {
        initial = ANIMATION_PRESETS[type].initial
        animate = ANIMATION_PRESETS[type].animate
      }

      if (custom?.initial) initial = JSON.stringify(custom.initial)
      if (custom?.animate) animate = JSON.stringify(custom.animate)
      if (custom?.transition) transition = JSON.stringify(custom.transition)

      // Build animation props string
      let animProps = ''
      if (trigger === 'inView') {
        animProps = `initial={${initial}} whileInView={${animate}} viewport={{ once: true }} transition={${transition}}`
      } else if (trigger === 'hover') {
        animProps = `whileHover={${animate}} transition={${transition}}`
      } else {
        animProps = `initial={${initial}} animate={${animate}} transition={${transition}}`
      }

      // This is a simplified replacement - in production you'd use proper AST
      jsx = jsx.replace(
        new RegExp(`<${block.tag}([^>]*?)className="${block.className}"`),
        `<motion.${block.tag}$1${animProps} className="${block.className}"`
      )
    }
  }

  return jsx
}

/**
 * Generate a component name from a file path or route
 */
export function generateComponentName(input: string): string {
  // Remove extension
  let name = input.replace(/\.(tsx?|jsx?)$/, "")

  // Get last segment of path
  const segments = name.split(/[/\\]/)
  name = segments[segments.length - 1]

  // Handle index files
  if (name === "index" || name === "page") {
    name = segments[segments.length - 2] || "Component"
  }

  // Convert to PascalCase
  return name
    .split(/[-_\s]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join("")
}
