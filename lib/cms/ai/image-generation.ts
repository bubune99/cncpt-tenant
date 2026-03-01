/**
 * AI Image Generation via Vercel AI SDK
 *
 * Uses the AI SDK's `generateImage()` with a unified provider pattern:
 * 1. Vercel AI Gateway (automatic on Vercel, needs AI_GATEWAY_API_KEY locally)
 * 2. Direct OpenAI API (OPENAI_API_KEY) — DALL-E 3, GPT Image 1
 * 3. Direct Google AI API (GOOGLE_GENERATIVE_AI_API_KEY) — Imagen
 *
 * Provider priority can be overridden via IMAGE_GENERATION_PROVIDER env var.
 * When deployed on Vercel, the gateway routes requests automatically for
 * observability, caching, rate limiting, and fallback/retry.
 */

import { generateImage, type ImageModel } from 'ai'
import { gateway } from '@ai-sdk/gateway'
import { createOpenAI } from '@ai-sdk/openai'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ImageStyle =
  | 'photorealistic'
  | 'illustration'
  | '3d-render'
  | 'flat-design'
  | 'watercolor'
  | 'oil-painting'
  | 'pixel-art'
  | 'anime'
  | 'sketch'
  | 'cinematic'

export type ImageSize = 'square' | 'landscape' | 'portrait'

export interface ImageGenerationRequest {
  prompt: string
  style?: ImageStyle
  size?: ImageSize
  count?: number
  /** Override the default provider for this request */
  provider?: string
}

export interface GeneratedImage {
  /** Base64-encoded image data */
  b64Data: string
  /** MIME type of the image */
  mimeType: string
  /** Revised prompt returned by the provider (if any) */
  revisedPrompt?: string
}

export interface ImageGenerationResult {
  images: GeneratedImage[]
  provider: string
  model: string
}

// ---------------------------------------------------------------------------
// Style prompts — enhance user prompt with style direction
// ---------------------------------------------------------------------------

const STYLE_PROMPTS: Record<ImageStyle, string> = {
  photorealistic:
    'Photorealistic, high quality photograph, professional lighting, sharp focus, 8K resolution',
  illustration:
    'Digital illustration, clean lines, vibrant colors, professional artwork',
  '3d-render':
    '3D render, physically based rendering, studio lighting, high detail, octane render',
  'flat-design':
    'Flat design, minimal, clean shapes, solid colors, vector style, modern graphic design',
  watercolor:
    'Watercolor painting, soft edges, flowing colors, artistic brushstrokes, fine art',
  'oil-painting':
    'Oil painting, rich textures, visible brushstrokes, classical art style, gallery quality',
  'pixel-art':
    'Pixel art, retro gaming style, 16-bit, crisp pixels, nostalgic',
  anime:
    'Anime style, Japanese animation, clean linework, expressive, vibrant',
  sketch:
    'Pencil sketch, hand-drawn, detailed linework, artistic, graphite on paper',
  cinematic:
    'Cinematic, dramatic lighting, movie still, anamorphic lens, depth of field, film grain',
}

// ---------------------------------------------------------------------------
// Size mappings — provider-specific dimension strings
// ---------------------------------------------------------------------------

/** DALL-E 3 / GPT Image 1 use WxH pixel sizes */
const OPENAI_SIZES: Record<ImageSize, string> = {
  square: '1024x1024',
  landscape: '1792x1024',
  portrait: '1024x1792',
}

/** Google Imagen / Gateway image models use aspect ratios */
const ASPECT_RATIOS: Record<ImageSize, string> = {
  square: '1:1',
  landscape: '16:9',
  portrait: '9:16',
}

// ---------------------------------------------------------------------------
// Provider model definitions
// ---------------------------------------------------------------------------

interface ImageProviderConfig {
  id: string
  label: string
  modelId: string
  /** How this provider specifies dimensions — 'size' (WxH) or 'aspectRatio' */
  dimensionMode: 'size' | 'aspectRatio'
  /** Function that returns the ImageModel instance */
  getModel: () => ImageModel
  /** Check if this provider can be used (has required env vars or is on Vercel) */
  isAvailable: () => boolean
}

// Whether we have gateway access (Vercel deployment or local gateway key)
const hasGateway = () => Boolean(process.env.VERCEL || process.env.AI_GATEWAY_API_KEY)
const hasOpenAIKey = () => Boolean(process.env.OPENAI_API_KEY)
const hasGoogleKey = () => Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY)

/**
 * All known image generation providers, ordered by preference.
 * The first available provider is used unless overridden.
 */
const IMAGE_PROVIDERS: ImageProviderConfig[] = [
  // --- Gateway providers (routed through Vercel AI Gateway) ---
  {
    id: 'gateway-dall-e-3',
    label: 'DALL-E 3 (Gateway)',
    modelId: 'openai/dall-e-3',
    dimensionMode: 'size',
    getModel: () => gateway.imageModel('openai/dall-e-3'),
    isAvailable: hasGateway,
  },
  {
    id: 'gateway-gpt-image-1',
    label: 'GPT Image 1 (Gateway)',
    modelId: 'openai/gpt-image-1',
    dimensionMode: 'size',
    getModel: () => gateway.imageModel('openai/gpt-image-1'),
    isAvailable: hasGateway,
  },
  {
    id: 'gateway-imagen-4',
    label: 'Imagen 4.0 (Gateway)',
    modelId: 'google/imagen-4.0-generate-001',
    dimensionMode: 'aspectRatio',
    getModel: () => gateway.imageModel('google/imagen-4.0-generate-001'),
    isAvailable: hasGateway,
  },
  {
    id: 'gateway-flux-pro',
    label: 'Flux Pro 1.1 (Gateway)',
    modelId: 'bfl/flux-pro-1.1',
    dimensionMode: 'aspectRatio',
    getModel: () => gateway.imageModel('bfl/flux-pro-1.1'),
    isAvailable: hasGateway,
  },
  // --- Direct API providers (when not on Vercel / no gateway key) ---
  {
    id: 'openai-dall-e-3',
    label: 'DALL-E 3',
    modelId: 'dall-e-3',
    dimensionMode: 'size',
    getModel: () => {
      const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY! })
      return openai.image('dall-e-3')
    },
    isAvailable: hasOpenAIKey,
  },
  {
    id: 'openai-gpt-image-1',
    label: 'GPT Image 1',
    modelId: 'gpt-image-1',
    dimensionMode: 'size',
    getModel: () => {
      const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY! })
      return openai.image('gpt-image-1')
    },
    isAvailable: hasOpenAIKey,
  },
]

// ---------------------------------------------------------------------------
// Build the enhanced prompt
// ---------------------------------------------------------------------------

function buildPrompt(prompt: string, style?: ImageStyle): string {
  if (!style || !STYLE_PROMPTS[style]) return prompt
  return `${prompt}. ${STYLE_PROMPTS[style]}`
}

// ---------------------------------------------------------------------------
// Provider resolution
// ---------------------------------------------------------------------------

/**
 * Resolve which provider to use.
 *
 * Priority:
 * 1. Explicit `provider` argument on the request
 * 2. IMAGE_GENERATION_PROVIDER env var (matches provider `id`)
 * 3. First available provider from the ordered list
 */
function resolveProvider(requestProvider?: string): ImageProviderConfig | null {
  const overrideId = requestProvider || process.env.IMAGE_GENERATION_PROVIDER

  if (overrideId) {
    const explicit = IMAGE_PROVIDERS.find(
      (p) => p.id === overrideId && p.isAvailable()
    )
    if (explicit) return explicit
    // If the override doesn't match an id, try matching by modelId
    const byModel = IMAGE_PROVIDERS.find(
      (p) => p.modelId === overrideId && p.isAvailable()
    )
    if (byModel) return byModel
  }

  return IMAGE_PROVIDERS.find((p) => p.isAvailable()) || null
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Check if any image generation provider is available
 */
export function isImageGenerationAvailable(): boolean {
  return IMAGE_PROVIDERS.some((p) => p.isAvailable())
}

/**
 * Get information about all available image generation providers
 */
export function getAvailableImageProviders(): Array<{
  id: string
  label: string
  modelId: string
}> {
  return IMAGE_PROVIDERS
    .filter((p) => p.isAvailable())
    .map(({ id, label, modelId }) => ({ id, label, modelId }))
}

/**
 * Generate images using the Vercel AI SDK.
 *
 * Automatically selects the best available provider (gateway > direct API)
 * and adapts size/aspect ratio parameters per provider requirements.
 */
export async function generateImages(
  request: ImageGenerationRequest
): Promise<ImageGenerationResult> {
  // Validate request
  if (!request.prompt || request.prompt.trim().length === 0) {
    throw new Error('Prompt is required for image generation')
  }

  if (request.prompt.length > 4000) {
    throw new Error('Prompt must be 4000 characters or less')
  }

  if (request.count && (request.count < 1 || request.count > 4)) {
    throw new Error('Count must be between 1 and 4')
  }

  const provider = resolveProvider(request.provider)
  if (!provider) {
    throw new Error(
      'No image generation provider is available. ' +
        'Configure one of: OPENAI_API_KEY, GOOGLE_GENERATIVE_AI_API_KEY, ' +
        'or deploy on Vercel with AI Gateway enabled.'
    )
  }

  const enhancedPrompt = buildPrompt(request.prompt.trim(), request.style)
  const count = Math.min(request.count || 1, 4)
  const sizeKey = request.size || 'square'

  // Build generateImage options based on provider's dimension mode
  const imageModel = provider.getModel()

  // Construct the call options — size uses `${number}x${number}` template
  const sizeStr = OPENAI_SIZES[sizeKey] as `${number}x${number}`
  const aspectStr = ASPECT_RATIOS[sizeKey]

  // Determine provider-specific options
  const isOpenAIModel =
    provider.id.includes('openai') ||
    provider.id.includes('dall-e') ||
    provider.id.includes('gpt-image')

  const providerOptions = isOpenAIModel
    ? { openai: { quality: 'standard' as const } }
    : undefined

  console.log(
    `[Image Generation] Using provider: ${provider.label} (${provider.id}), ` +
      `model: ${provider.modelId}, size: ${sizeKey}, count: ${count}`
  )

  const result = await generateImage({
    model: imageModel,
    prompt: enhancedPrompt,
    n: count,
    ...(provider.dimensionMode === 'size'
      ? { size: sizeStr }
      : { aspectRatio: aspectStr }),
    ...(providerOptions ? { providerOptions } : {}),
  })

  // Try to extract revised prompt from provider metadata (OpenAI models)
  const openaiMeta = result.providerMetadata?.openai as
    | Record<string, unknown>
    | undefined

  // Convert AI SDK result to our GeneratedImage format
  const images: GeneratedImage[] = result.images.map((img) => ({
    b64Data: img.base64,
    mimeType: img.mediaType || 'image/png',
    revisedPrompt:
      (openaiMeta?.revisedPrompt as string) ??
      (openaiMeta?.revised_prompt as string) ??
      undefined,
  }))

  // Extract provider name from the config
  const providerName = provider.id.startsWith('gateway-')
    ? provider.id.replace('gateway-', '')
    : provider.id.replace('openai-', 'openai/').replace('google-', 'google/')

  return {
    images,
    provider: providerName,
    model: provider.modelId,
  }
}

// ---------------------------------------------------------------------------
// UI constants — available styles and sizes for the frontend
// ---------------------------------------------------------------------------

/**
 * Available styles for the UI
 */
export const IMAGE_STYLES: Array<{ value: ImageStyle; label: string }> = [
  { value: 'photorealistic', label: 'Photorealistic' },
  { value: 'illustration', label: 'Illustration' },
  { value: '3d-render', label: '3D Render' },
  { value: 'flat-design', label: 'Flat Design' },
  { value: 'watercolor', label: 'Watercolor' },
  { value: 'oil-painting', label: 'Oil Painting' },
  { value: 'pixel-art', label: 'Pixel Art' },
  { value: 'anime', label: 'Anime' },
  { value: 'sketch', label: 'Sketch' },
  { value: 'cinematic', label: 'Cinematic' },
]

/**
 * Available sizes for the UI
 */
export const IMAGE_SIZES: Array<{
  value: ImageSize
  label: string
  dimensions: string
}> = [
  { value: 'square', label: 'Square', dimensions: '1024x1024' },
  { value: 'landscape', label: 'Landscape', dimensions: '1792x1024' },
  { value: 'portrait', label: 'Portrait', dimensions: '1024x1792' },
]
