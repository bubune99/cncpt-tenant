/**
 * Kofi Agent Skills — server-side execution for media search and image generation.
 *
 * These functions run in the API route context (server-side only).
 */

import { prisma } from '@/lib/cms/db'
import { gateway } from '@ai-sdk/gateway'
import type { Prisma } from '@prisma/client'

/* ------------------------------------------------------------------ */
/*  Media Search                                                        */
/* ------------------------------------------------------------------ */

export interface MediaResult {
  id: string
  url: string
  filename: string
  alt: string | null
  width: number | null
  height: number | null
  mimeType: string
}

/**
 * Search the CMS media library via direct Prisma query.
 * Faster than HTTP since we're already server-side.
 */
export async function searchMediaLibrary(options: {
  query?: string
  type?: 'image' | 'video'
  limit?: number
}): Promise<{ media: MediaResult[] }> {
  const where: Prisma.MediaWhereInput = { deletedAt: null }

  if (options.type) {
    where.mimeType = { startsWith: options.type }
  }

  if (options.query) {
    where.OR = [
      { filename: { contains: options.query, mode: 'insensitive' } },
      { title: { contains: options.query, mode: 'insensitive' } },
      { alt: { contains: options.query, mode: 'insensitive' } },
      { caption: { contains: options.query, mode: 'insensitive' } },
    ]
  }

  const items = await prisma.media.findMany({
    where,
    take: options.limit || 12,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      url: true,
      filename: true,
      alt: true,
      width: true,
      height: true,
      mimeType: true,
    },
  })

  return { media: items }
}

/* ------------------------------------------------------------------ */
/*  AI Image Generation + Upload                                        */
/* ------------------------------------------------------------------ */

const IMAGE_TIMEOUT_MS = 55_000

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Image generation timed out')), ms)
    ),
  ])
}

/**
 * Generate an image via AI Gateway, upload to R2/S3,
 * and create a Media record in the database.
 *
 * Uses experimental_generateImage with gateway.imageModel() following
 * Vercel AI Gateway docs (vercel.com/docs/ai-gateway/capabilities/image-generation/ai-sdk).
 */
export async function generateAndUploadImage(options: {
  prompt: string
  style?: string
  aspectRatio?: string
}): Promise<{ url: string; mediaId: string; prompt: string }> {
  const { experimental_generateImage: generateImage } = await import('ai')
  const { PutObjectCommand } = await import('@aws-sdk/client-s3')

  const styledPrompt = buildImagePrompt(options.prompt, options.style)

  // Step 1: Generate image via Vercel AI Gateway
  const imageModel = gateway.imageModel('google/imagen-4.0-generate-001')
  console.log('[Kofi Image] Step 1: Calling generateImage via gateway (google/imagen-4.0-generate-001)')
  let result
  try {
    result = await withTimeout(
      generateImage({
        model: imageModel,
        prompt: styledPrompt,
        aspectRatio: (options.aspectRatio || '16:9') as `${number}:${number}`,
      }),
      IMAGE_TIMEOUT_MS,
    )
  } catch (genErr) {
    console.error('[Kofi Image] Step 1 FAILED:', genErr)
    throw genErr
  }

  console.log('[Kofi Image] Step 1 OK — images:', result.images?.length)

  // result.image is the first generated image, result.images is the full array
  const image = result.image ?? result.images?.[0]
  if (!image?.base64) {
    throw new Error('Image model returned no image data')
  }

  // Step 2: Decode + upload to storage
  console.log('[Kofi Image] Step 2: Uploading to R2/S3')
  const buffer = Buffer.from(image.base64, 'base64')
  const mimeType = image.mediaType || 'image/png'
  const ext = mimeType.split('/')[1] || 'png'
  const filename = `kofi-${Date.now()}.${ext}`
  const key = `uploads/kofi/${filename}`

  const { r2Client, R2_CONFIG } = await import('@/lib/cms/r2/client')
  let publicUrl: string
  try {
    await r2Client.send(
      new PutObjectCommand({
        Bucket: R2_CONFIG.bucketName,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
      })
    )
    publicUrl = R2_CONFIG.publicUrl
      ? `${R2_CONFIG.publicUrl}/${key}`
      : `/${key}`
    console.log('[Kofi Image] Step 2 OK — uploaded to', publicUrl)
  } catch (uploadErr) {
    console.error('[Kofi Image] Step 2 FAILED (upload):', uploadErr)
    throw uploadErr
  }

  // Step 3: Create Media record in database
  console.log('[Kofi Image] Step 3: Creating media record')
  try {
    const media = await prisma.media.create({
      data: {
        filename,
        originalName: filename,
        mimeType,
        size: buffer.length,
        url: publicUrl,
        key,
        bucket: R2_CONFIG.bucketName,
        provider: 'S3',
        title: `AI Generated: ${(options.prompt || '').slice(0, 100)}`,
        alt: (options.prompt || '').slice(0, 200),
      },
    })
    console.log('[Kofi Image] Step 3 OK — mediaId:', media.id)
    return { url: media.url, mediaId: media.id, prompt: options.prompt }
  } catch (dbErr) {
    console.error('[Kofi Image] Step 3 FAILED (db):', dbErr)
    throw dbErr
  }
}

/* ------------------------------------------------------------------ */
/*  GitHub URL Fetching                                                 */
/* ------------------------------------------------------------------ */

interface GitHubParsedUrl {
  owner: string
  repo: string
  branch: string
  path: string
  type: 'blob' | 'tree'  // blob = single file, tree = directory
}

/**
 * Parse a GitHub URL into its components.
 * Supports:
 *   https://github.com/owner/repo
 *   https://github.com/owner/repo/tree/main/src
 *   https://github.com/owner/repo/blob/main/app/page.tsx
 *   https://raw.githubusercontent.com/owner/repo/main/file.tsx
 */
function parseGitHubUrl(url: string): GitHubParsedUrl | null {
  // Raw GitHub URLs
  const rawMatch = url.match(/raw\.githubusercontent\.com\/([^/]+)\/([^/]+)\/([^/]+)\/(.+)/)
  if (rawMatch) {
    return { owner: rawMatch[1], repo: rawMatch[2], branch: rawMatch[3], path: rawMatch[4], type: 'blob' }
  }

  // Standard GitHub URLs
  const ghMatch = url.match(/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?(?:\/(tree|blob)\/([^/]+)(?:\/(.*))?)?$/)
  if (ghMatch) {
    const [, owner, repo, kind, branch, path] = ghMatch
    return {
      owner,
      repo,
      branch: branch || 'main',
      path: path || '',
      type: (kind === 'blob' ? 'blob' : 'tree'),
    }
  }

  return null
}

interface GitHubFile {
  path: string
  content: string
}

/**
 * Fetch TSX/JSX file(s) from a GitHub URL via the GitHub API.
 * Works for public repos without authentication.
 * Set GITHUB_TOKEN env var for private repos or higher rate limits.
 */
async function fetchFromGitHub(parsed: GitHubParsedUrl): Promise<GitHubFile[]> {
  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'CMS-Kofi-Import',
  }
  const token = process.env.GITHUB_TOKEN
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const files: GitHubFile[] = []

  if (parsed.type === 'blob') {
    // Single file — fetch raw content
    const rawUrl = `https://raw.githubusercontent.com/${parsed.owner}/${parsed.repo}/${parsed.branch}/${parsed.path}`
    const resp = await fetch(rawUrl, { headers: { 'User-Agent': 'CMS-Kofi-Import' } })
    if (!resp.ok) {
      throw new Error(`GitHub fetch failed (${resp.status}): ${rawUrl}`)
    }
    files.push({ path: parsed.path, content: await resp.text() })
  } else {
    // Directory — use Git Trees API for recursive listing
    const treeUrl = `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/git/trees/${parsed.branch}?recursive=1`
    const treeResp = await fetch(treeUrl, { headers })
    if (!treeResp.ok) {
      throw new Error(`GitHub API failed (${treeResp.status}): Could not fetch repo tree. ${treeResp.status === 404 ? 'Check that the repo is public and the branch exists.' : ''}`)
    }
    const treeData = await treeResp.json() as { tree: Array<{ path: string; type: string; size?: number }> }

    // Filter to TSX/JSX files under the target path
    const prefix = parsed.path ? parsed.path + '/' : ''
    const tsxFiles = treeData.tree.filter(f =>
      f.type === 'blob' &&
      (prefix ? f.path.startsWith(prefix) : true) &&
      /\.(tsx|jsx)$/.test(f.path) &&
      // Skip test files, stories, node_modules
      !f.path.includes('node_modules') &&
      !f.path.includes('.test.') &&
      !f.path.includes('.spec.') &&
      !f.path.includes('.stories.') &&
      !f.path.includes('__tests__')
    )

    if (tsxFiles.length === 0) {
      throw new Error(`No .tsx/.jsx files found under "${parsed.path || '/'}" in ${parsed.owner}/${parsed.repo}`)
    }

    // Cap at 50 files to avoid overwhelming the parser
    const filesToFetch = tsxFiles.slice(0, 50)

    // Fetch files in parallel batches of 10
    for (let i = 0; i < filesToFetch.length; i += 10) {
      const batch = filesToFetch.slice(i, i + 10)
      const results = await Promise.all(
        batch.map(async (f) => {
          const rawUrl = `https://raw.githubusercontent.com/${parsed.owner}/${parsed.repo}/${parsed.branch}/${f.path}`
          const resp = await fetch(rawUrl, { headers: { 'User-Agent': 'CMS-Kofi-Import' } })
          if (!resp.ok) return null
          return { path: f.path, content: await resp.text() }
        })
      )
      for (const r of results) {
        if (r) files.push(r)
      }
    }

    if (tsxFiles.length > 50) {
      console.warn(`[Kofi Import] GitHub repo has ${tsxFiles.length} TSX files, only fetching first 50`)
    }
  }

  return files
}

/* ------------------------------------------------------------------ */
/*  Local Filesystem Fetching                                           */
/* ------------------------------------------------------------------ */

interface LocalFile {
  path: string
  content: string
}

/**
 * Read TSX/JSX files from a local filesystem path.
 * Supports single files or directories (recursive).
 */
async function fetchFromLocalPath(filePath: string): Promise<LocalFile[]> {
  const fs = await import('fs')
  const path = await import('path')

  const stat = fs.statSync(filePath)
  const files: LocalFile[] = []

  if (stat.isFile()) {
    files.push({ path: filePath, content: fs.readFileSync(filePath, 'utf-8') })
  } else if (stat.isDirectory()) {
    function walkDir(dir: string): void {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name)
        if (entry.isDirectory()) {
          if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === '.next') return
          walkDir(full)
        } else if (/\.(tsx|jsx)$/.test(entry.name) &&
                   !entry.name.includes('.test.') &&
                   !entry.name.includes('.spec.') &&
                   !entry.name.includes('.stories.')) {
          files.push({ path: full, content: fs.readFileSync(full, 'utf-8') })
        }
      }
    }
    walkDir(filePath)
  } else {
    throw new Error(`Path is neither a file nor a directory: ${filePath}`)
  }

  return files.slice(0, 50)  // Cap at 50 files
}

/* ------------------------------------------------------------------ */
/*  Multi-file import + merge                                           */
/* ------------------------------------------------------------------ */

interface SourceFile {
  path: string
  content: string
}

/**
 * Import multiple source files, parse each, merge all blocks + repair items.
 * Returns per-file summaries so Kofi can report which files had issues.
 */
async function importMultipleFiles(files: SourceFile[]): Promise<ImportAnalysis & { fileResults: FileImportResult[] }> {
  const { importFromReactAST } = await import('./ast-parser')

  const allBlocks: unknown[] = []
  const allErrors: string[] = []
  const fileResults: FileImportResult[] = []

  for (const file of files) {
    try {
      const { blocks, errors } = importFromReactAST(file.content)
      const fileBlockCount = blocks.length

      if (fileBlockCount > 0) {
        allBlocks.push(...blocks)
      }
      if (errors.length > 0) {
        allErrors.push(...errors.map(e => `${file.path}: ${e}`))
      }

      fileResults.push({
        path: file.path,
        blocksExtracted: fileBlockCount,
        success: fileBlockCount > 0,
        errors: errors,
      })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Parse failed'
      allErrors.push(`${file.path}: CRASH — ${msg}`)
      fileResults.push({
        path: file.path,
        blocksExtracted: 0,
        success: false,
        errors: [msg],
      })
    }
  }

  // Analyze the merged block tree for repair items
  const repairItems: ImportRepairItem[] = []
  const comps = new Set<string>()

  function analyzeBlocks(blockList: unknown[], parentTag?: string): void {
    for (const raw of blockList) {
      const b = raw as Record<string, unknown>
      const id = b.id as string
      const tag = b.tag as string
      const className = (b.className as string) || ''
      const textContent = (b.textContent as string) || ''
      const attrs = b.attrs as Record<string, string> | undefined
      const children = b.children as unknown[] | undefined
      const componentName = b.componentName as string | undefined

      if (tag === 'div' && !className && !textContent.trim() &&
          (!children || children.length === 0) && !attrs) {
        repairItems.push({
          blockId: id, issue: 'ghost-div', severity: 'remove',
          description: `Empty <div> block${parentTag ? ` (inside <${parentTag}>)` : ''}`,
          suggestion: 'Remove this empty block.',
        })
      }

      if (textContent) {
        const dynamicMatches = textContent.match(/\{[^}]+\}/g)
        if (dynamicMatches) {
          for (const expr of dynamicMatches) {
            const isCommerce = /product|price|cart|order|item|variant|collection|inventory|shipping|checkout/i.test(expr)
            repairItems.push({
              blockId: id,
              issue: isCommerce ? 'commerce-candidate' : 'dynamic-expression',
              severity: 'adapt',
              description: `Dynamic expression: ${expr}`,
              suggestion: isCommerce
                ? `Map to commerce binding. "${expr}" needs a data source.`
                : `Replace with static content or CMS field binding.`,
              expression: expr,
            })
          }
        }
      }

      if (componentName) {
        comps.add(componentName)
        const isPartial = /header|footer|nav|sidebar|menu|breadcrumb|banner/i.test(componentName)
        const isComm = /product|cart|checkout|price|add.?to.?cart|buy|shop|collection|category/i.test(componentName)
        if (isPartial) {
          repairItems.push({ blockId: id, issue: 'partial-candidate', severity: 'adapt',
            description: `<${componentName}> — reusable partial candidate`,
            suggestion: `Create a CMS Partial for "${componentName}".`, componentName })
        } else if (isComm) {
          repairItems.push({ blockId: id, issue: 'commerce-candidate', severity: 'adapt',
            description: `<${componentName}> — commerce component`,
            suggestion: `Map to a Smart Block with commerce bindings.`, componentName })
        } else {
          repairItems.push({ blockId: id, issue: 'custom-component', severity: 'info',
            description: `<${componentName}> preserved as <${tag}> block`,
            suggestion: `Review if this needs Smart Block or Partial treatment.`, componentName })
        }
      }

      if (tag === 'img' && (!attrs || !attrs.src)) {
        repairItems.push({ blockId: id, issue: 'missing-image', severity: 'adapt',
          description: 'Image without src', suggestion: 'Search media library or generate.' })
      }
      if (tag === 'img' && attrs?.src && /^\{/.test(attrs.src)) {
        repairItems.push({ blockId: id, issue: 'dynamic-expression', severity: 'adapt',
          description: `Image src: ${attrs.src}`, suggestion: 'Replace with media library URL.', expression: attrs.src })
      }

      if (children && children.length > 0) analyzeBlocks(children, tag)
    }
  }

  analyzeBlocks(allBlocks)

  function countBlocks(b: unknown[]): number {
    let n = 0
    for (const block of b) {
      n++
      const bl = block as Record<string, unknown>
      if (Array.isArray(bl.children)) n += countBlocks(bl.children)
    }
    return n
  }

  return {
    blocks: allBlocks,
    errors: allErrors,
    totalBlocks: countBlocks(allBlocks),
    repairItems,
    summary: {
      ghostDivs: repairItems.filter(r => r.issue === 'ghost-div').length,
      dynamicExpressions: repairItems.filter(r => r.issue === 'dynamic-expression').length,
      customComponents: [...comps],
      commerceCandidates: repairItems.filter(r => r.issue === 'commerce-candidate').length,
      partialCandidates: repairItems.filter(r => r.issue === 'partial-candidate').length,
      missingImages: repairItems.filter(r => r.issue === 'missing-image').length,
    },
    fileResults,
  }
}

export interface FileImportResult {
  path: string
  blocksExtracted: number
  success: boolean
  errors: string[]
}

/* ------------------------------------------------------------------ */
/*  Unified import entry point                                          */
/* ------------------------------------------------------------------ */

/**
 * Import from any source: raw code, GitHub URL, or local path.
 * Returns the same ImportAnalysis regardless of source.
 */
export async function importFromSource(options: {
  code?: string
  githubUrl?: string
  localPath?: string
}): Promise<ImportAnalysis & { fileResults?: FileImportResult[]; source: string }> {
  // GitHub URL
  if (options.githubUrl) {
    const parsed = parseGitHubUrl(options.githubUrl)
    if (!parsed) {
      throw new Error(`Could not parse GitHub URL: ${options.githubUrl}. Expected format: https://github.com/owner/repo or https://github.com/owner/repo/tree/branch/path`)
    }

    console.log(`[Kofi Import] Fetching from GitHub: ${parsed.owner}/${parsed.repo}/${parsed.path || '(root)'} (${parsed.type})`)
    const files = await fetchFromGitHub(parsed)
    console.log(`[Kofi Import] Fetched ${files.length} file(s) from GitHub`)

    if (files.length === 1) {
      // Single file — use simple path
      const analysis = await importAndAnalyzeCode(files[0].content)
      return { ...analysis, source: `github:${parsed.owner}/${parsed.repo}/${files[0].path}` }
    }

    // Multiple files — use multi-file merge
    const result = await importMultipleFiles(files)
    return { ...result, source: `github:${parsed.owner}/${parsed.repo}/${parsed.path || ''}` }
  }

  // Local filesystem path
  if (options.localPath) {
    console.log(`[Kofi Import] Reading from local path: ${options.localPath}`)
    const files = await fetchFromLocalPath(options.localPath)
    console.log(`[Kofi Import] Found ${files.length} file(s) locally`)

    if (files.length === 1) {
      const analysis = await importAndAnalyzeCode(files[0].content)
      return { ...analysis, source: `local:${files[0].path}` }
    }

    const result = await importMultipleFiles(files)
    return { ...result, source: `local:${options.localPath}` }
  }

  // Raw code
  if (options.code) {
    const analysis = await importAndAnalyzeCode(options.code)
    return { ...analysis, source: 'paste' }
  }

  throw new Error('No source provided. Pass a GitHub URL, local path, or raw code.')
}

/* ------------------------------------------------------------------ */
/*  Project Import + Analysis (single-file, kept for backward compat)   */
/* ------------------------------------------------------------------ */

export interface ImportRepairItem {
  blockId: string
  issue: 'ghost-div' | 'dynamic-expression' | 'custom-component' | 'missing-image' | 'commerce-candidate' | 'partial-candidate'
  severity: 'remove' | 'adapt' | 'info'
  description: string
  suggestion: string
  /** Original component name (for custom-component issues) */
  componentName?: string
  /** Dynamic expression text (for dynamic-expression issues) */
  expression?: string
}

export interface ImportAnalysis {
  blocks: unknown[]
  errors: string[]
  totalBlocks: number
  repairItems: ImportRepairItem[]
  summary: {
    ghostDivs: number
    dynamicExpressions: number
    customComponents: string[]
    commerceCandidates: number
    partialCandidates: number
    missingImages: number
  }
}

/**
 * Import external JSX/TSX code via AST parser and analyze
 * what needs repair for CMS compatibility.
 */
export async function importAndAnalyzeCode(code: string): Promise<ImportAnalysis> {
  const { importFromReactAST } = await import('./ast-parser')

  const { blocks, errors } = importFromReactAST(code)

  const repairItems: ImportRepairItem[] = []
  const customComponents = new Set<string>()

  function countBlocks(b: unknown[]): number {
    let n = 0
    for (const block of b) {
      n++
      const bl = block as Record<string, unknown>
      if (Array.isArray(bl.children)) n += countBlocks(bl.children)
    }
    return n
  }

  // Walk the block tree and identify issues
  function analyze(blockList: unknown[], parentTag?: string): void {
    for (const raw of blockList) {
      const b = raw as Record<string, unknown>
      const id = b.id as string
      const tag = b.tag as string
      const className = (b.className as string) || ''
      const textContent = (b.textContent as string) || ''
      const attrs = b.attrs as Record<string, string> | undefined
      const children = b.children as unknown[] | undefined
      const componentName = b.componentName as string | undefined

      // Ghost divs — empty div with no content
      if (tag === 'div' && !className && !textContent.trim() &&
          (!children || children.length === 0) && !attrs) {
        repairItems.push({
          blockId: id,
          issue: 'ghost-div',
          severity: 'remove',
          description: `Empty <div> block with no classes, text, or children${parentTag ? ` (inside <${parentTag}>)` : ''}`,
          suggestion: 'Remove this empty block — it has no visual content.',
        })
      }

      // Dynamic expressions — placeholders like {product.title}
      if (textContent) {
        const dynamicMatches = textContent.match(/\{[^}]+\}/g)
        if (dynamicMatches) {
          for (const expr of dynamicMatches) {
            // Detect commerce-related expressions
            const isCommerce = /product|price|cart|order|item|variant|collection|inventory|shipping|checkout/i.test(expr)
            repairItems.push({
              blockId: id,
              issue: isCommerce ? 'commerce-candidate' : 'dynamic-expression',
              severity: 'adapt',
              description: `Contains dynamic expression: ${expr}`,
              suggestion: isCommerce
                ? `Map to a commerce binding or smart block. Expression "${expr}" likely needs a product/collection data source.`
                : `Replace with actual static content, or map to a CMS field binding.`,
              expression: expr,
            })
          }
        }
      }

      // Custom component references (componentName set by AST parser)
      if (componentName) {
        customComponents.add(componentName)
        // Detect if it's likely a partial (header, footer, nav patterns)
        const isPartialCandidate = /header|footer|nav|sidebar|menu|breadcrumb|banner/i.test(componentName)
        // Detect if it's likely a commerce component
        const isCommerceCandidate = /product|cart|checkout|price|add.?to.?cart|buy|shop|collection|category/i.test(componentName)

        if (isPartialCandidate) {
          repairItems.push({
            blockId: id,
            issue: 'partial-candidate',
            severity: 'adapt',
            description: `Custom component <${componentName}> looks like a reusable partial (header/footer/nav).`,
            suggestion: `Create a CMS Partial for "${componentName}" and replace this block with a PartialReference. This makes it reusable across pages.`,
            componentName,
          })
        } else if (isCommerceCandidate) {
          repairItems.push({
            blockId: id,
            issue: 'commerce-candidate',
            severity: 'adapt',
            description: `Custom component <${componentName}> looks like a commerce element.`,
            suggestion: `Map to a Smart Block (ProductGrid, ProductCard, CartSummary, etc.) with appropriate commerce bindings.`,
            componentName,
          })
        } else {
          repairItems.push({
            blockId: id,
            issue: 'custom-component',
            severity: 'info',
            description: `Custom component <${componentName}> preserved as <${tag}> block.`,
            suggestion: `Review if this needs a Smart Block, Partial, or keep as a custom component.`,
            componentName,
          })
        }
      }

      // Missing images — img tags without src
      if (tag === 'img' && (!attrs || !attrs.src)) {
        repairItems.push({
          blockId: id,
          issue: 'missing-image',
          severity: 'adapt',
          description: 'Image block has no src attribute.',
          suggestion: 'Search the media library for a suitable image, or generate one with AI.',
        })
      }

      // Images with dynamic src expressions
      if (tag === 'img' && attrs?.src && /^\{/.test(attrs.src)) {
        repairItems.push({
          blockId: id,
          issue: 'dynamic-expression',
          severity: 'adapt',
          description: `Image src contains a dynamic expression: ${attrs.src}`,
          suggestion: 'Replace with an actual image URL from the media library.',
          expression: attrs.src,
        })
      }

      // Recurse into children
      if (children && children.length > 0) {
        analyze(children, tag)
      }
    }
  }

  analyze(blocks)

  const ghostDivs = repairItems.filter(r => r.issue === 'ghost-div').length
  const dynamicExpressions = repairItems.filter(r => r.issue === 'dynamic-expression').length
  const commerceCandidates = repairItems.filter(r => r.issue === 'commerce-candidate').length
  const partialCandidates = repairItems.filter(r => r.issue === 'partial-candidate').length
  const missingImages = repairItems.filter(r => r.issue === 'missing-image').length

  return {
    blocks,
    errors,
    totalBlocks: countBlocks(blocks),
    repairItems,
    summary: {
      ghostDivs,
      dynamicExpressions,
      customComponents: [...customComponents],
      commerceCandidates,
      partialCandidates,
      missingImages,
    },
  }
}

/* ------------------------------------------------------------------ */
/*  Internal helpers                                                    */
/* ------------------------------------------------------------------ */

function buildImagePrompt(basePrompt: string, style?: string): string {
  const styleGuide: Record<string, string> = {
    photo: 'Photorealistic, professional photography, natural lighting, high resolution.',
    illustration: 'Digital illustration, clean lines, vibrant colors, modern graphic design style.',
    '3d-render': '3D render, realistic materials, studio lighting, octane render quality.',
    abstract: 'Abstract art, bold shapes, vibrant gradients, modern composition.',
    'flat-design': 'Flat design, minimal, geometric shapes, limited color palette, vector-style.',
    watercolor: 'Watercolor painting, soft edges, flowing colors, artistic brushstrokes.',
    cinematic: 'Cinematic scene, dramatic lighting, film grain, widescreen composition, movie poster quality.',
  }

  const styleNote = style && styleGuide[style]
    ? `\nStyle: ${styleGuide[style]}`
    : ''

  return `Generate an image: ${basePrompt}${styleNote}\n\nThe image should be high quality, visually striking, and suitable for use as a website asset (hero background, feature illustration, etc.).`
}
