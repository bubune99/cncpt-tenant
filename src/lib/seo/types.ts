/**
 * SEO Types and Configurations
 */

import type { Metadata } from 'next'

// Base SEO configuration
export interface SeoConfig {
  siteName: string
  siteUrl: string
  defaultTitle: string
  titleTemplate: string // e.g., "%s | Site Name"
  defaultDescription: string
  defaultImage?: string
  twitterHandle?: string
  locale: string
  themeColor?: string
  keywords?: string[]
}

// Page-specific SEO data
export interface PageSeo {
  title?: string
  description?: string
  keywords?: string[]
  image?: string
  noIndex?: boolean
  noFollow?: boolean
  canonical?: string
  publishedTime?: string
  modifiedTime?: string
  author?: string
  section?: string
  tags?: string[]
}

// Product SEO data
export interface ProductSeo extends PageSeo {
  price?: number
  currency?: string
  availability?: 'InStock' | 'OutOfStock' | 'PreOrder'
  sku?: string
  brand?: string
  category?: string
  reviewCount?: number
  ratingValue?: number
}

// Article SEO data
export interface ArticleSeo extends PageSeo {
  type?: 'article' | 'blog' | 'news'
}

// Open Graph types
export type OgType =
  | 'website'
  | 'article'
  | 'product'
  | 'profile'
  | 'book'
  | 'video.movie'
  | 'video.episode'
  | 'video.tv_show'
  | 'video.other'
  | 'music.song'
  | 'music.album'

// Structured data types
export type StructuredDataType =
  | 'Organization'
  | 'WebSite'
  | 'WebPage'
  | 'Product'
  | 'Article'
  | 'BlogPosting'
  | 'BreadcrumbList'
  | 'FAQPage'
  | 'LocalBusiness'
  | 'Person'
  | 'Event'
  | 'Review'
  | 'HowTo'
  | 'Recipe'
  | 'VideoObject'

// Breadcrumb item
export interface BreadcrumbItem {
  name: string
  url: string
}

// Organization data for structured data
export interface OrganizationData {
  name: string
  url: string
  logo?: string
  description?: string
  sameAs?: string[] // Social profiles
  contactPoint?: {
    type: string
    telephone?: string
    email?: string
    areaServed?: string
    availableLanguage?: string[]
  }
}

// Local business data
export interface LocalBusinessData extends OrganizationData {
  address?: {
    streetAddress: string
    addressLocality: string
    addressRegion: string
    postalCode: string
    addressCountry: string
  }
  geo?: {
    latitude: number
    longitude: number
  }
  openingHours?: string[]
  priceRange?: string
}

// FAQ item
export interface FaqItem {
  question: string
  answer: string
}

// Default SEO config
export const DEFAULT_SEO_CONFIG: SeoConfig = {
  siteName: 'My Store',
  siteUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  defaultTitle: 'My Store',
  titleTemplate: '%s | My Store',
  defaultDescription: 'Welcome to our store',
  locale: 'en_US',
  themeColor: '#000000',
}

// Robots configurations
export const ROBOTS_CONFIGS = {
  default: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large' as const,
      'max-snippet': -1,
    },
  },
  noIndex: {
    index: false,
    follow: true,
  },
  noFollow: {
    index: true,
    follow: false,
  },
  none: {
    index: false,
    follow: false,
  },
}
