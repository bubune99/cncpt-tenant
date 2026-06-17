/**
 * Scan Page — Client Implementation
 *
 * Pure-browser DOM walker that discovers meaningful landmarks on the
 * current page. Invoked by the chat panel when the model returns the
 * client-execution sentinel from `scan-page.ts`.
 *
 * Design goals:
 *  - Prefer the most stable selector available (data-tour-id > id >
 *    data-testid > structural fallback).
 *  - Skip the AI Assistant drawer + Field Trip pill so the agent doesn't
 *    plan tours over its own UI.
 *  - Return items in visual order (top-to-bottom, then left-to-right).
 *  - Exclude purely decorative nodes (svg w/o aria-label, empty divs).
 */
import type {
  ScanPageInput,
  ScanPageItem,
  ScanPageKind,
} from './scan-page'

/* ---------------------------------------------------------------- */
/* Selector resolution                                              */
/* ---------------------------------------------------------------- */

/**
 * CSS.escape polyfill for older browsers / SSR safety.
 */
function cssEscape(value: string): string {
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
    return CSS.escape(value)
  }
  return value.replace(/([^\w-])/g, '\\$1')
}

/**
 * Build a stable selector for an element.
 *
 * Order of preference:
 *   1. data-tour-id  (the canonical Phase-1 tour selector)
 *   2. id
 *   3. data-testid
 *   4. structural fallback: tag + class + nth-child chain (max 3 hops)
 */
function buildSelector(el: Element): string {
  const tourId = el.getAttribute('data-tour-id')
  if (tourId) return `[data-tour-id="${cssEscape(tourId)}"]`

  if (el.id) return `#${cssEscape(el.id)}`

  const testId = el.getAttribute('data-testid')
  if (testId) return `[data-testid="${cssEscape(testId)}"]`

  return buildStructuralSelector(el)
}

/**
 * Walk up to 3 ancestors building a structural CSS selector.
 * Used as a last resort when no stable id/data attribute is available.
 */
function buildStructuralSelector(el: Element): string {
  const segments: string[] = []
  let current: Element | null = el
  let hops = 0

  while (current && hops < 3 && current.tagName.toLowerCase() !== 'body') {
    let segment = current.tagName.toLowerCase()

    // Use the first 1-2 stable-looking class names
    const classes = Array.from(current.classList)
      .filter((c) => /^[a-zA-Z][\w-]{1,30}$/.test(c))
      .slice(0, 2)
      .map(cssEscape)
    if (classes.length > 0) segment += '.' + classes.join('.')

    // Disambiguate with :nth-child if the segment isn't already specific
    const parent = current.parentElement
    if (parent) {
      const sameTag = Array.from(parent.children).filter(
        (c) => c.tagName === current!.tagName
      )
      if (sameTag.length > 1) {
        const index = Array.from(parent.children).indexOf(current) + 1
        segment += `:nth-child(${index})`
      }
    }

    segments.unshift(segment)
    current = current.parentElement
    hops += 1
  }

  return segments.join(' > ')
}

/* ---------------------------------------------------------------- */
/* Element classification                                           */
/* ---------------------------------------------------------------- */

const HEADING_TAGS = new Set(['H1', 'H2', 'H3', 'H4', 'H5', 'H6'])
const INPUT_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT'])

/**
 * Compute a role string. Prefer explicit ARIA, fall back to element
 * semantics. Mirrors the categories agents are most likely to ask about.
 */
function computeRole(el: Element): string {
  const aria = el.getAttribute('role')
  if (aria) return aria

  const tag = el.tagName
  if (tag === 'A') return 'link'
  if (tag === 'BUTTON') return 'button'
  if (tag === 'NAV') return 'nav'
  if (HEADING_TAGS.has(tag)) return 'heading'
  if (tag === 'INPUT') {
    const type = (el as HTMLInputElement).type
    if (type === 'checkbox') return 'checkbox'
    if (type === 'radio') return 'radio'
    if (type === 'button' || type === 'submit') return 'button'
    return 'textbox'
  }
  if (tag === 'TEXTAREA') return 'textbox'
  if (tag === 'SELECT') return 'combobox'
  return tag.toLowerCase()
}

/**
 * Categorize an element into one of the kind buckets the agent uses
 * when planning tours.
 */
function classifyKind(el: Element, role: string): ScanPageKind | null {
  if (role === 'nav' || el.tagName === 'NAV') return 'nav'
  if (role === 'button' || el.tagName === 'BUTTON') return 'button'
  if (role === 'link' || el.tagName === 'A') return 'link'
  if (
    INPUT_TAGS.has(el.tagName) ||
    role === 'textbox' ||
    role === 'combobox' ||
    role === 'checkbox' ||
    role === 'radio'
  ) {
    return 'input'
  }
  if (HEADING_TAGS.has(el.tagName) || role === 'heading') return 'heading'

  // "card" — heuristic: section/article/li or a div that explicitly opts in
  if (
    el.tagName === 'ARTICLE' ||
    el.tagName === 'SECTION' ||
    role === 'article' ||
    el.getAttribute('data-card') !== null ||
    el.classList.contains('card')
  ) {
    return 'card'
  }

  return null
}

/* ---------------------------------------------------------------- */
/* Label extraction                                                 */
/* ---------------------------------------------------------------- */

const MAX_LABEL_LEN = 60

function truncate(text: string, max = MAX_LABEL_LEN): string {
  const trimmed = text.replace(/\s+/g, ' ').trim()
  if (trimmed.length <= max) return trimmed
  return trimmed.slice(0, max - 1) + '…'
}

/**
 * Best-effort human label. aria-label > placeholder > text > title.
 */
function getLabel(el: Element): string {
  const aria = el.getAttribute('aria-label')
  if (aria) return truncate(aria)

  if (INPUT_TAGS.has(el.tagName)) {
    const placeholder = el.getAttribute('placeholder')
    if (placeholder) return truncate(placeholder)
    const name = el.getAttribute('name')
    if (name) return truncate(name)
  }

  const text = (el as HTMLElement).innerText || el.textContent || ''
  if (text.trim()) return truncate(text)

  const title = el.getAttribute('title')
  if (title) return truncate(title)

  return ''
}

/* ---------------------------------------------------------------- */
/* Visibility / exclusion                                           */
/* ---------------------------------------------------------------- */

/**
 * Skip the AI Assistant drawer and Field Trip pill so the agent doesn't
 * try to plan tours over its own UI.
 */
const EXCLUDE_SELECTORS = [
  '[data-admin-chat]',
  '[data-ai-chat-drawer]',
  '[data-field-trip-pill]',
  '#field-trip-pill',
  '#ft-pill',
  '.ai-chat-drawer',
  '.admin-chat-drawer',
]

function isExcluded(el: Element): boolean {
  for (const sel of EXCLUDE_SELECTORS) {
    if (el.closest(sel)) return true
  }
  return false
}

/**
 * Quick visibility check — element must occupy non-zero area and not be
 * `display: none` / `visibility: hidden`.
 */
function isVisible(el: Element): boolean {
  const rect = el.getBoundingClientRect()
  if (rect.width === 0 || rect.height === 0) return false
  const style = window.getComputedStyle(el)
  if (style.display === 'none' || style.visibility === 'hidden') return false
  if (style.opacity === '0') return false
  return true
}

/* ---------------------------------------------------------------- */
/* Public entry point                                               */
/* ---------------------------------------------------------------- */

/**
 * Run a scan against the live DOM. Safe to call repeatedly.
 * Returns up to `maxItems` landmarks sorted in visual order.
 */
export async function runScanPage(
  args: ScanPageInput
): Promise<{ items: ScanPageItem[]; total: number; surface: string }> {
  const surface = args.surface ?? 'interactive'
  const maxItems = args.maxItems ?? 60

  if (typeof document === 'undefined') {
    return { items: [], total: 0, surface }
  }

  // Candidate selector list. "interactive" is the lean default; "all"
  // additionally pulls in headings + card-like containers for tour planning.
  const interactiveSelectors = [
    'a[href]',
    'button',
    'input:not([type="hidden"])',
    'textarea',
    'select',
    '[role="button"]',
    '[role="link"]',
    '[role="textbox"]',
    '[role="checkbox"]',
    '[role="radio"]',
    '[role="combobox"]',
    'nav',
    '[role="navigation"]',
    '[data-tour-id]',
  ]
  const structuralSelectors = [
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'article',
    'section',
    '[role="article"]',
    '[data-card]',
  ]

  const selectorList =
    surface === 'all'
      ? [...interactiveSelectors, ...structuralSelectors]
      : interactiveSelectors

  const root = document.body
  const seen = new Set<Element>()
  const candidates: Element[] = []

  for (const sel of selectorList) {
    let matches: NodeListOf<Element>
    try {
      matches = root.querySelectorAll(sel)
    } catch {
      continue
    }
    for (const el of Array.from(matches)) {
      if (seen.has(el)) continue
      seen.add(el)
      if (isExcluded(el)) continue
      if (!isVisible(el)) continue
      candidates.push(el)
    }
  }

  // Sort top-to-bottom, then left-to-right by bounding rect.
  candidates.sort((a, b) => {
    const ra = a.getBoundingClientRect()
    const rb = b.getBoundingClientRect()
    if (Math.abs(ra.top - rb.top) > 4) return ra.top - rb.top
    return ra.left - rb.left
  })

  const items: ScanPageItem[] = []
  for (const el of candidates) {
    if (items.length >= maxItems) break

    const role = computeRole(el)
    const kind = classifyKind(el, role)
    if (!kind) continue

    const label = getLabel(el)

    // Drop purely decorative elements: no label AND no semantic role hint.
    if (!label && (kind === 'card' || kind === 'heading')) continue
    if (!label && el.tagName === 'DIV') continue

    items.push({
      selector: buildSelector(el),
      role,
      label,
      kind,
    })
  }

  return { items, total: items.length, surface }
}
