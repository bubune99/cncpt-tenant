/**
 * Block SDK - Main Exports
 *
 * @module @cncpt/blocks
 *
 * A comprehensive SDK for working with the Block format programmatically.
 *
 * @example
 * ```ts
 * import {
 *   block, section, flex, heading, text, link, image,
 *   fromJSX, toJSX, toReactComponent,
 *   validate, walk, findById, diff, patch
 * } from '@/lib/cms/blocks-sdk'
 *
 * // Build blocks programmatically
 * const hero = section({ className: 'py-20' })
 *   .add(
 *     flex({ direction: 'col', align: 'center' })
 *       .add(heading(1, 'Welcome'))
 *       .add(text('Your journey starts here'))
 *   )
 *   .build()
 *
 * // Convert from/to JSX
 * const blocks = fromJSX('<section>...</section>')
 * const jsx = toJSX(blocks)
 *
 * // Validate before saving
 * const result = validate(blocks)
 * if (!result.valid) console.error(result.errors)
 *
 * // Traverse and transform
 * walk(blocks, (block, path) => console.log(path, block.tag))
 * const updated = transform(blocks, b => ({ ...b, className: b.className + ' animate' }))
 *
 * // Diff and merge for sync
 * const changes = diff(localBlocks, remoteBlocks)
 * const merged = patch(localBlocks, changes, { strategy: 'prefer-remote' })
 * ```
 */

// ============================================================
// Types
// ============================================================

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
  // SDK-specific types
  BlockBuilderOptions,
  FlexOptions,
  GridOptions,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  ValidationSuggestion,
  ValidationOptions,
  DiffResult,
  DiffEntry,
  ConflictEntry,
  DiffOptions,
  PatchOptions,
  JSXConverterOptions,
  ReactComponentOptions,
  NextPageOptions,
  WalkCallback,
  TransformCallback,
  FilterCallback,
} from "./types"

export { CONTAINER_TAGS, LEAF_TAGS, isContainerTag } from "./types"

// ============================================================
// Builder
// ============================================================

export {
  BlockBuilder,
  block,
  // Layout
  section,
  div,
  header,
  footer,
  nav,
  main,
  aside,
  article,
  // Flex & Grid
  flex,
  grid,
  stack,
  row,
  // Typography
  heading,
  h1,
  h2,
  h3,
  h4,
  h5,
  h6,
  text,
  p,
  span,
  // Interactive
  link,
  a,
  button,
  // Media
  image,
  img,
  video,
  // Lists
  ul,
  ol,
  li,
  // Form
  form,
  input,
  textarea,
  label,
  // Misc
  hr,
  blockquote,
  figure,
} from "./builder"

// ============================================================
// Validator
// ============================================================

export {
  validate,
  isValidBlock,
  isValidBlockTree,
  formatValidationErrors,
} from "./validator"

// ============================================================
// Converters
// ============================================================

export {
  fromJSX,
  toJSX,
  toCleanJSX,
  fromReactComponent,
  extractJSXSnippets,
} from "./converters/jsx"

export {
  fromHTML,
  toHTML,
} from "./converters/html"

export {
  toReactComponent,
  toNextPage,
  toServerComponent,
  generateComponentName,
} from "./converters/react"

// ============================================================
// Traversal
// ============================================================

export {
  // Walking
  walk,
  walkReverse,
  // Querying
  find,
  findAll,
  findById,
  findByTag,
  findByClass,
  getByPath,
  getPathById,
  getParent,
  getAncestors,
  getSiblings,
  // Transformation
  transform,
  map,
  filter,
  // Mutation
  insertAt,
  removeById,
  removeAt,
  moveTo,
  replaceById,
  updateById,
  addClassById,
  removeClassById,
} from "./traversal"

// ============================================================
// Diff & Merge
// ============================================================

export {
  diff,
  patch,
  merge,
  formatDiffSummary,
} from "./diff"

// ============================================================
// Utilities
// ============================================================

export {
  generateId,
  deepClone,
  normalizeBlocks,
  countBlocks,
  getTreeDepth,
  flattenBlocks,
  getAllClassNames,
  getAllTags,
  blocksEqual,
  mergeClassNames,
  parseClassNames,
  rehydrateParentIds,
  stripParentIds,
} from "./utils"
