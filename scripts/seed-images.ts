#!/usr/bin/env npx tsx
/**
 * AI Image Seed Script
 *
 * Generates AI images from a list of prompts and stores them in R2 + database.
 * Useful for populating demo/template sites with placeholder imagery.
 *
 * Usage:
 *   npx tsx scripts/seed-images.ts --prompts "modern hero background" "product placeholder" "team photo"
 *   npx tsx scripts/seed-images.ts --config ./image-seeds.json
 *   npx tsx scripts/seed-images.ts --prompts "abstract art" --style cinematic --size landscape
 *   npx tsx scripts/seed-images.ts --prompts "storefront" --subdomain demo-store
 *
 * Options:
 *   --prompts    Space-separated list of image descriptions (required unless --config)
 *   --config     Path to a JSON config file with an array of { prompt, style?, size? }
 *   --style      Default style for all prompts (photorealistic, illustration, 3d-render, etc.)
 *   --size       Default size (square, landscape, portrait). Default: square
 *   --subdomain  Tenant subdomain for scoped storage
 *   --dry-run    Show what would be generated without actually calling the API
 *
 * Config file format (image-seeds.json):
 *   [
 *     { "prompt": "modern hero background with gradients", "style": "photorealistic", "size": "landscape" },
 *     { "prompt": "product placeholder image", "style": "flat-design" },
 *     { "prompt": "team collaboration photo" }
 *   ]
 */

import { generateImages, type ImageStyle, type ImageSize } from '../lib/cms/ai/image-generation'
import { uploadTenantMedia, R2_CONFIG } from '../lib/cms/r2/client'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { v4 as uuidv4 } from 'uuid'
import * as fs from 'fs'
import * as path from 'path'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SeedEntry {
  prompt: string
  style?: ImageStyle
  size?: ImageSize
}

interface SeedResult {
  prompt: string
  style?: ImageStyle
  size?: ImageSize
  url: string
  key: string
  success: boolean
  error?: string
}

// ---------------------------------------------------------------------------
// Parse CLI arguments
// ---------------------------------------------------------------------------

function parseArgs(): {
  prompts: SeedEntry[]
  subdomain?: string
  dryRun: boolean
} {
  const args = process.argv.slice(2)
  const prompts: SeedEntry[] = []
  let defaultStyle: ImageStyle | undefined
  let defaultSize: ImageSize | undefined
  let subdomain: string | undefined
  let configPath: string | undefined
  let dryRun = false

  let i = 0
  while (i < args.length) {
    const arg = args[i]

    if (arg === '--prompts') {
      i++
      // Collect all args until the next flag
      while (i < args.length && !args[i].startsWith('--')) {
        prompts.push({ prompt: args[i] })
        i++
      }
      continue
    }

    if (arg === '--config') {
      i++
      configPath = args[i]
      i++
      continue
    }

    if (arg === '--style') {
      i++
      defaultStyle = args[i] as ImageStyle
      i++
      continue
    }

    if (arg === '--size') {
      i++
      defaultSize = args[i] as ImageSize
      i++
      continue
    }

    if (arg === '--subdomain') {
      i++
      subdomain = args[i]
      i++
      continue
    }

    if (arg === '--dry-run') {
      dryRun = true
      i++
      continue
    }

    // Unknown arg - treat as prompt if no --prompts flag was used
    if (!arg.startsWith('--')) {
      prompts.push({ prompt: arg })
    }
    i++
  }

  // Load from config file
  if (configPath) {
    const configFile = path.resolve(process.cwd(), configPath)
    if (!fs.existsSync(configFile)) {
      console.error(`Config file not found: ${configFile}`)
      process.exit(1)
    }
    const config: SeedEntry[] = JSON.parse(fs.readFileSync(configFile, 'utf-8'))
    prompts.push(...config)
  }

  // Apply defaults
  for (const p of prompts) {
    if (!p.style && defaultStyle) p.style = defaultStyle
    if (!p.size && defaultSize) p.size = defaultSize
  }

  return { prompts, subdomain, dryRun }
}

// ---------------------------------------------------------------------------
// Sanitize filename from prompt
// ---------------------------------------------------------------------------

function sanitizeFilename(prompt: string): string {
  return prompt
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 40)
}

// ---------------------------------------------------------------------------
// Upload to R2 or local storage
// ---------------------------------------------------------------------------

async function uploadImage(
  imageBuffer: Buffer,
  filename: string,
  subdomain?: string
): Promise<{ url: string; key: string }> {
  if (subdomain && R2_CONFIG.isConfigured) {
    const result = await uploadTenantMedia(
      subdomain,
      imageBuffer,
      filename,
      'media/images',
      'image/png'
    )
    if (!result) throw new Error('Failed to upload to R2')
    return { url: result.url, key: result.key }
  }

  if (R2_CONFIG.isConfigured) {
    const { r2Client } = await import('../lib/cms/r2/client')
    const key = `ai-generated/seed/${new Date().toISOString().slice(0, 10)}/${filename}`

    await r2Client.send(
      new PutObjectCommand({
        Bucket: R2_CONFIG.bucketName,
        Key: key,
        Body: imageBuffer,
        ContentType: 'image/png',
        CacheControl: 'public, max-age=31536000, immutable',
      })
    )

    return {
      url: `${R2_CONFIG.publicUrl}/${key}`,
      key,
    }
  }

  // Local fallback
  const dir = path.join(process.cwd(), 'public', 'uploads', 'ai-generated', 'seed')
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, filename), imageBuffer)

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  return {
    url: `${baseUrl}/uploads/ai-generated/seed/${filename}`,
    key: `ai-generated/seed/${filename}`,
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const { prompts, subdomain, dryRun } = parseArgs()

  if (prompts.length === 0) {
    console.log(`
AI Image Seed Script
====================

Usage:
  npx tsx scripts/seed-images.ts --prompts "hero background" "product image" "team photo"
  npx tsx scripts/seed-images.ts --config ./image-seeds.json
  npx tsx scripts/seed-images.ts --prompts "abstract art" --style cinematic --size landscape

Options:
  --prompts      List of image descriptions
  --config       Path to JSON config file
  --style        Default style (photorealistic, illustration, 3d-render, flat-design, etc.)
  --size         Default size (square, landscape, portrait)
  --subdomain    Tenant subdomain for scoped storage
  --dry-run      Preview without generating
`)
    process.exit(0)
  }

  console.log(`\n  AI Image Seed`)
  console.log(`  ${'='.repeat(50)}`)
  console.log(`  Images to generate: ${prompts.length}`)
  if (subdomain) console.log(`  Tenant: ${subdomain}`)
  if (dryRun) console.log(`  Mode: DRY RUN`)
  console.log()

  if (dryRun) {
    for (const entry of prompts) {
      console.log(`  [DRY RUN] Would generate:`)
      console.log(`    Prompt: "${entry.prompt}"`)
      console.log(`    Style:  ${entry.style || 'auto'}`)
      console.log(`    Size:   ${entry.size || 'square'}`)
      console.log()
    }
    console.log(`  Total: ${prompts.length} images would be generated`)
    process.exit(0)
  }

  const results: SeedResult[] = []
  let successCount = 0
  let failCount = 0

  for (let i = 0; i < prompts.length; i++) {
    const entry = prompts[i]
    const num = `[${i + 1}/${prompts.length}]`

    console.log(`  ${num} Generating: "${entry.prompt.substring(0, 60)}..."`)
    console.log(`       Style: ${entry.style || 'auto'} | Size: ${entry.size || 'square'}`)

    try {
      // Generate image
      const genResult = await generateImages({
        prompt: entry.prompt,
        style: entry.style,
        size: entry.size,
        count: 1,
      })

      const imageData = genResult.images[0]
      if (!imageData) throw new Error('No image returned')

      // Upload
      const imageBuffer = Buffer.from(imageData.b64Data, 'base64')
      const ext = imageData.mimeType?.split('/')[1] || 'png'
      const filename = `seed-${sanitizeFilename(entry.prompt)}-${uuidv4().slice(0, 8)}.${ext}`

      console.log(`       Uploading: ${filename}...`)
      const { url, key } = await uploadImage(imageBuffer, filename, subdomain)

      results.push({
        prompt: entry.prompt,
        style: entry.style,
        size: entry.size,
        url,
        key,
        success: true,
      })

      successCount++
      console.log(`       Done: ${url}`)
      console.log()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      results.push({
        prompt: entry.prompt,
        style: entry.style,
        size: entry.size,
        url: '',
        key: '',
        success: false,
        error: errorMessage,
      })

      failCount++
      console.error(`       FAILED: ${errorMessage}`)
      console.log()
    }

    // Small delay between generations to avoid rate limits
    if (i < prompts.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 2000))
    }
  }

  // Summary
  console.log(`  ${'='.repeat(50)}`)
  console.log(`  Summary:`)
  console.log(`    Generated: ${successCount}/${prompts.length}`)
  if (failCount > 0) console.log(`    Failed: ${failCount}`)
  console.log()

  if (successCount > 0) {
    console.log(`  Generated images:`)
    for (const r of results.filter((r) => r.success)) {
      console.log(`    - ${r.url}`)
    }
    console.log()
  }

  if (failCount > 0) {
    console.log(`  Failed images:`)
    for (const r of results.filter((r) => !r.success)) {
      console.log(`    - "${r.prompt}": ${r.error}`)
    }
    console.log()
  }

  // Write results to a JSON file for reference
  const resultsPath = path.join(process.cwd(), 'seed-images-results.json')
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2))
  console.log(`  Results saved to: ${resultsPath}`)
  console.log()

  process.exit(failCount > 0 ? 1 : 0)
}

main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
