/**
 * SEO Utilities Library
 *
 * Provides metadata generation, structured data, and SEO helpers
 */

import type { Metadata, Viewport } from 'next'
import { prisma } from '../db'
import type {
  SeoConfig,
  PageSeo,
  ProductSeo,
  ArticleSeo,
  BreadcrumbItem,
  OrganizationData,
  LocalBusinessData,
  FaqItem,
  OgType,
} from './types'
import { DEFAULT_SEO_CONFIG } from './types'

// Cache for SEO settings
let seoConfigCache: SeoConfig | null = null
let seoConfigCacheTime = 0
const SEO_CACHE_TTL = 60 * 1000 // 1 minute

/**
 * Get SEO configuration from database
 */
export async function getSeoConfig(): Promise<SeoConfig> {
  const now = Date.now()
  if (seoConfigCache && now - seoConfigCacheTime < SEO_CACHE_TTL) {
    return seoConfigCache
  }

  const settings = await prisma.setting.findMany({
    where: { key: { startsWith: 'seo.' } },
  })

  const config: SeoConfig = { ...DEFAULT_SEO_CONFIG }

  for (const setting of settings) {
    const key = setting.key.replace('seo.', '')
    switch (key) {
      case 'siteName':
        config.siteName = setting.value
        break
      case 'siteUrl':
        config.siteUrl = setting.value
        break
      case 'defaultTitle':
        config.defaultTitle = setting.value
        break
      case 'titleTemplate':
        config.titleTemplate = setting.value
        break
      case 'defaultDescription':
        config.defaultDescription = setting.value
        break
      case 'defaultImage':
        config.defaultImage = setting.value
        break
      case 'twitterHandle':
        config.twitterHandle = setting.value
        break
      case 'locale':
        config.locale = setting.value
        break
      case 'themeColor':
        config.themeColor = setting.value
        break
      case 'keywords':
        config.keywords = JSON.parse(setting.value)
        break
    }
  }

  seoConfigCache = config
  seoConfigCacheTime = now

  return config
}

/**
 * Clear SEO config cache
 */
export function clearSeoConfigCache(): void {
  seoConfigCache = null
  seoConfigCacheTime = 0
}

/**
 * Generate Next.js Metadata for a page
 */
export async function generateMetadata(
  pageSeo: PageSeo = {},
  type: OgType = 'website'
): Promise<Metadata> {
  const config = await getSeoConfig()

  const title = pageSeo.title || config.defaultTitle
  const description = pageSeo.description || config.defaultDescription
  const image = pageSeo.image || config.defaultImage
  const url = pageSeo.canonical || config.siteUrl

  const metadata: Metadata = {
    title: pageSeo.title
      ? config.titleTemplate.replace('%s', pageSeo.title)
      : config.defaultTitle,
    description,
    keywords: pageSeo.keywords || config.keywords,
    authors: pageSeo.author ? [{ name: pageSeo.author }] : undefined,
    metadataBase: new URL(config.siteUrl),
    alternates: {
      canonical: pageSeo.canonical,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: config.siteName,
      locale: config.locale,
      type: type as 'website' | 'article',
      images: image
        ? [
            {
              url: image,
              width: 1200,
              height: 630,
              alt: title,
            },
          ]
        : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: image ? [image] : undefined,
      creator: config.twitterHandle,
      site: config.twitterHandle,
    },
    robots: {
      index: !pageSeo.noIndex,
      follow: !pageSeo.noFollow,
      googleBot: {
        index: !pageSeo.noIndex,
        follow: !pageSeo.noFollow,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  }

  return metadata
}

/**
 * Generate metadata for a product page
 */
export async function generateProductMetadata(product: ProductSeo): Promise<Metadata> {
  const baseMetadata = await generateMetadata(product, 'product')

  // Add product-specific Open Graph data
  if (baseMetadata.openGraph && product.price) {
    (baseMetadata.openGraph as any).price = {
      amount: product.price.toString(),
      currency: product.currency || 'USD',
    }
  }

  return baseMetadata
}

/**
 * Generate metadata for an article/blog post
 */
export async function generateArticleMetadata(article: ArticleSeo): Promise<Metadata> {
  const metadata = await generateMetadata(article, 'article')

  if (metadata.openGraph) {
    const og = metadata.openGraph as any
    og.type = 'article'
    if (article.publishedTime) {
      og.publishedTime = article.publishedTime
    }
    if (article.modifiedTime) {
      og.modifiedTime = article.modifiedTime
    }
    if (article.author) {
      og.authors = [article.author]
    }
    if (article.section) {
      og.section = article.section
    }
    if (article.tags) {
      og.tags = article.tags
    }
  }

  return metadata
}

/**
 * Generate viewport configuration
 */
export function generateViewport(): Viewport {
  return {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    themeColor: [
      { media: '(prefers-color-scheme: light)', color: '#ffffff' },
      { media: '(prefers-color-scheme: dark)', color: '#000000' },
    ],
  }
}

// ============================================================================
// STRUCTURED DATA (JSON-LD)
// ============================================================================

/**
 * Generate Organization structured data
 */
export function generateOrganizationSchema(org: OrganizationData): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: org.name,
    url: org.url,
    logo: org.logo,
    description: org.description,
    sameAs: org.sameAs,
    contactPoint: org.contactPoint
      ? {
          '@type': 'ContactPoint',
          contactType: org.contactPoint.type,
          telephone: org.contactPoint.telephone,
          email: org.contactPoint.email,
          areaServed: org.contactPoint.areaServed,
          availableLanguage: org.contactPoint.availableLanguage,
        }
      : undefined,
  }
}

/**
 * Generate LocalBusiness structured data
 */
export function generateLocalBusinessSchema(business: LocalBusinessData): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: business.name,
    url: business.url,
    logo: business.logo,
    description: business.description,
    sameAs: business.sameAs,
    address: business.address
      ? {
          '@type': 'PostalAddress',
          streetAddress: business.address.streetAddress,
          addressLocality: business.address.addressLocality,
          addressRegion: business.address.addressRegion,
          postalCode: business.address.postalCode,
          addressCountry: business.address.addressCountry,
        }
      : undefined,
    geo: business.geo
      ? {
          '@type': 'GeoCoordinates',
          latitude: business.geo.latitude,
          longitude: business.geo.longitude,
        }
      : undefined,
    openingHoursSpecification: business.openingHours,
    priceRange: business.priceRange,
  }
}

/**
 * Generate WebSite structured data with search action
 */
export async function generateWebsiteSchema(searchPath = '/search'): Promise<object> {
  const config = await getSeoConfig()

  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: config.siteName,
    url: config.siteUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${config.siteUrl}${searchPath}?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }
}

/**
 * Generate BreadcrumbList structured data
 */
export async function generateBreadcrumbSchema(items: BreadcrumbItem[]): Promise<object> {
  const config = await getSeoConfig()

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${config.siteUrl}${item.url}`,
    })),
  }
}

/**
 * Generate Product structured data
 */
export async function generateProductSchema(product: {
  name: string
  description?: string
  image?: string | string[]
  sku?: string
  brand?: string
  price: number
  currency?: string
  availability?: 'InStock' | 'OutOfStock' | 'PreOrder'
  url?: string
  reviewCount?: number
  ratingValue?: number
}): Promise<object> {
  const config = await getSeoConfig()

  const schema: any = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.image,
    sku: product.sku,
    brand: product.brand
      ? {
          '@type': 'Brand',
          name: product.brand,
        }
      : undefined,
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: product.currency || 'USD',
      availability: `https://schema.org/${product.availability || 'InStock'}`,
      url: product.url || config.siteUrl,
    },
  }

  if (product.reviewCount && product.ratingValue) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: product.ratingValue,
      reviewCount: product.reviewCount,
    }
  }

  return schema
}

/**
 * Generate Article/BlogPosting structured data
 */
export async function generateArticleSchema(article: {
  headline: string
  description?: string
  image?: string
  datePublished: string
  dateModified?: string
  author?: string
  url?: string
}): Promise<object> {
  const config = await getSeoConfig()

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.headline,
    description: article.description,
    image: article.image,
    datePublished: article.datePublished,
    dateModified: article.dateModified || article.datePublished,
    author: article.author
      ? {
          '@type': 'Person',
          name: article.author,
        }
      : undefined,
    publisher: {
      '@type': 'Organization',
      name: config.siteName,
      logo: config.defaultImage
        ? {
            '@type': 'ImageObject',
            url: config.defaultImage,
          }
        : undefined,
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': article.url || config.siteUrl,
    },
  }
}

/**
 * Generate FAQ structured data
 */
export function generateFaqSchema(faqs: FaqItem[]): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }
}

/**
 * Render JSON-LD script tag
 */
export function renderJsonLd(data: object | object[]): string {
  const jsonLd = Array.isArray(data) ? data : [data]
  return `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`
}

export * from './types'
