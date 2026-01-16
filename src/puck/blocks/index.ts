/**
 * Puck Pre-built Blocks
 *
 * A collection of ready-to-use blocks for landing pages and marketing sites.
 * Built with shadcn/ui components for consistent styling.
 */

// Hero Sections
export { HeroBlock, heroBlockConfig, type HeroBlockProps } from './HeroBlock'

// Features
export { FeaturesBlock, featuresBlockConfig, type FeaturesBlockProps } from './FeaturesBlock'

// Call to Action
export { CTABlock, ctaBlockConfig, type CTABlockProps } from './CTABlock'

// Testimonials
export { TestimonialsBlock, testimonialsBlockConfig, type TestimonialsBlockProps } from './TestimonialsBlock'

// Pricing
export { PricingBlock, pricingBlockConfig, type PricingBlockProps } from './PricingBlock'

// Statistics
export { StatsBlock, statsBlockConfig, type StatsBlockProps } from './StatsBlock'

// FAQ
export { FAQBlock, faqBlockConfig, type FAQBlockProps } from './FAQBlock'

// Combined config for all blocks
import type { Config } from '@measured/puck'
import { heroBlockConfig } from './HeroBlock'
import { featuresBlockConfig } from './FeaturesBlock'
import { ctaBlockConfig } from './CTABlock'
import { testimonialsBlockConfig } from './TestimonialsBlock'
import { pricingBlockConfig } from './PricingBlock'
import { statsBlockConfig } from './StatsBlock'
import { faqBlockConfig } from './FAQBlock'

/**
 * All pre-built block components
 */
export const blocksComponents = {
  HeroBlock: heroBlockConfig,
  FeaturesBlock: featuresBlockConfig,
  CTABlock: ctaBlockConfig,
  TestimonialsBlock: testimonialsBlockConfig,
  PricingBlock: pricingBlockConfig,
  StatsBlock: statsBlockConfig,
  FAQBlock: faqBlockConfig,
}

/**
 * Block categories for organization in the editor
 */
export const blocksCategories = {
  'Landing Page': {
    components: ['HeroBlock', 'FeaturesBlock', 'CTABlock'],
  },
  'Social Proof': {
    components: ['TestimonialsBlock', 'StatsBlock'],
  },
  'Conversion': {
    components: ['PricingBlock', 'CTABlock'],
  },
  'Information': {
    components: ['FAQBlock'],
  },
}

/**
 * Creates a Puck config with all pre-built blocks
 */
export function createBlocksConfig(): Partial<Config> {
  return {
    components: blocksComponents,
    categories: blocksCategories,
  }
}

/**
 * Merge blocks config with an existing config
 */
export function withBlocks<T extends Config>(config: T): T {
  return {
    ...config,
    components: {
      ...blocksComponents,
      ...config.components,
    },
    categories: {
      ...blocksCategories,
      ...(config.categories || {}),
    },
  }
}
