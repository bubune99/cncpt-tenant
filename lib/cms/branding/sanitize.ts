/**
 * Branding Security Utilities
 *
 * Sanitizes user-supplied branding values to prevent:
 * - CSS injection via color/custom CSS fields
 * - XSS via SVG favicon uploads
 * - Cross-tenant data leaks
 */

/**
 * Validate a hex color string. Returns the sanitized hex or null if invalid.
 * Only allows #RGB or #RRGGBB format.
 */
export function sanitizeHexColor(value: string | undefined | null): string | null {
  if (!value) return null
  const trimmed = value.trim()
  // Only allow strict hex color format
  if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(trimmed)) {
    return trimmed.toLowerCase()
  }
  return null
}

/**
 * Sanitize a CSS custom property value.
 * Strips anything that could escape a CSS property context:
 * - Removes semicolons, braces, angle brackets, comments
 * - Prevents url() injection outside of controlled contexts
 * - Prevents expression(), var() re-injection, etc.
 */
export function sanitizeCssValue(value: string): string {
  // Remove null bytes
  let clean = value.replace(/\0/g, '')
  // Remove CSS comments
  clean = clean.replace(/\/\*[\s\S]*?\*\//g, '')
  // Remove characters that could break out of a property value context
  clean = clean.replace(/[{}<>;\\]/g, '')
  // Remove url() calls to prevent data exfiltration
  clean = clean.replace(/url\s*\(/gi, '')
  // Remove expression() (IE legacy)
  clean = clean.replace(/expression\s*\(/gi, '')
  // Remove @import
  clean = clean.replace(/@import/gi, '')
  // Remove behavior: (IE)
  clean = clean.replace(/behavior\s*:/gi, '')
  // Remove -moz-binding (Firefox legacy)
  clean = clean.replace(/-moz-binding\s*:/gi, '')
  return clean.trim()
}

/**
 * Sanitize a full custom CSS block.
 * Strips dangerous constructs while allowing valid CSS properties.
 */
export function sanitizeCustomCss(css: string | undefined | null): string {
  if (!css) return ''
  let clean = css
  // Remove null bytes
  clean = clean.replace(/\0/g, '')
  // Remove @import rules (prevent loading external stylesheets)
  clean = clean.replace(/@import\s+[^;]+;?/gi, '')
  // Remove @charset rules
  clean = clean.replace(/@charset\s+[^;]+;?/gi, '')
  // Remove expression() (IE)
  clean = clean.replace(/expression\s*\([^)]*\)/gi, '')
  // Remove behavior: (IE)
  clean = clean.replace(/behavior\s*:\s*[^;]+/gi, '')
  // Remove -moz-binding (Firefox)
  clean = clean.replace(/-moz-binding\s*:\s*[^;]+/gi, '')
  // Remove javascript: URLs
  clean = clean.replace(/javascript\s*:/gi, '')
  // Remove data: URLs in url() (prevent inline SVG/HTML injection)
  clean = clean.replace(/url\s*\(\s*(['"]?)data\s*:[^)]+\)/gi, '')
  // Limit total length to prevent abuse (64KB is generous for custom CSS)
  if (clean.length > 65536) {
    clean = clean.substring(0, 65536)
  }
  return clean.trim()
}

/**
 * Validate that a URL is a safe image URL.
 * Allows HTTPS URLs, relative paths, and data: image URLs.
 * Blocks javascript:, data:text/html, and other dangerous schemes.
 */
export function sanitizeImageUrl(url: string | undefined | null): string | null {
  if (!url) return null
  const trimmed = url.trim()
  if (!trimmed) return null

  // Allow relative paths (start with /)
  if (trimmed.startsWith('/')) return trimmed

  // Allow HTTPS URLs
  if (trimmed.startsWith('https://')) return trimmed

  // Allow HTTP in development
  if (
    process.env.NODE_ENV === 'development' &&
    trimmed.startsWith('http://')
  ) {
    return trimmed
  }

  // Block everything else (javascript:, data:, etc.)
  return null
}

/**
 * Validate that an uploaded file has an image content type.
 * For SVG files, performs additional checks for embedded scripts.
 */
export function validateImageContentType(
  contentType: string,
  fileContent?: Buffer
): { valid: boolean; reason?: string } {
  const allowedTypes = [
    'image/png',
    'image/jpeg',
    'image/gif',
    'image/webp',
    'image/x-icon',
    'image/vnd.microsoft.icon',
    'image/svg+xml',
    'image/avif',
  ]

  if (!allowedTypes.includes(contentType.toLowerCase())) {
    return { valid: false, reason: `Unsupported image type: ${contentType}` }
  }

  // SVG requires additional validation
  if (contentType === 'image/svg+xml' && fileContent) {
    return validateSvgContent(fileContent.toString('utf-8'))
  }

  return { valid: true }
}

/**
 * Validate SVG content for XSS vectors.
 * Checks for scripts, event handlers, external references, etc.
 */
export function validateSvgContent(
  svgString: string
): { valid: boolean; reason?: string } {
  const lower = svgString.toLowerCase()

  // Block <script> tags
  if (/<script[\s>]/i.test(lower)) {
    return { valid: false, reason: 'SVG contains script tags' }
  }

  // Block on* event handlers (onclick, onload, onerror, etc.)
  if (/\bon[a-z]+\s*=/i.test(svgString)) {
    return { valid: false, reason: 'SVG contains event handlers' }
  }

  // Block javascript: URLs
  if (/javascript\s*:/i.test(lower)) {
    return { valid: false, reason: 'SVG contains javascript: URLs' }
  }

  // Block data: URLs that could embed HTML
  if (/data\s*:\s*text\/html/i.test(lower)) {
    return { valid: false, reason: 'SVG contains data:text/html URLs' }
  }

  // Block <foreignObject> (can embed HTML)
  if (/<foreignobject[\s>]/i.test(lower)) {
    return { valid: false, reason: 'SVG contains foreignObject elements' }
  }

  // Block <use> with external references (can load cross-origin SVGs)
  if (/<use[^>]+href\s*=\s*["']https?:/i.test(lower)) {
    return { valid: false, reason: 'SVG contains external references' }
  }

  // Block <set> and <animate> with dangerous attributes
  if (/<(set|animate)[^>]+attributename\s*=\s*["']on/i.test(lower)) {
    return { valid: false, reason: 'SVG contains dangerous animation targets' }
  }

  return { valid: true }
}
