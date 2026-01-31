'use client'

/**
 * JSON-LD Structured Data Component
 *
 * Renders structured data for SEO
 */

interface JsonLdProps {
  data: object | object[]
}

export function JsonLd({ data }: JsonLdProps) {
  const jsonLd = Array.isArray(data) ? data : [data]

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(jsonLd.length === 1 ? jsonLd[0] : jsonLd),
      }}
    />
  )
}

/**
 * Pre-built JSON-LD components for common use cases
 */

interface OrganizationJsonLdProps {
  name: string
  url: string
  logo?: string
  description?: string
  sameAs?: string[]
}

export function OrganizationJsonLd({
  name,
  url,
  logo,
  description,
  sameAs,
}: OrganizationJsonLdProps) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name,
    url,
    logo,
    description,
    sameAs,
  }

  return <JsonLd data={data} />
}

interface ProductJsonLdProps {
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
}

export function ProductJsonLd({
  name,
  description,
  image,
  sku,
  brand,
  price,
  currency = 'USD',
  availability = 'InStock',
  url,
  reviewCount,
  ratingValue,
}: ProductJsonLdProps) {
  const data: any = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description,
    image,
    sku,
    brand: brand ? { '@type': 'Brand', name: brand } : undefined,
    offers: {
      '@type': 'Offer',
      price,
      priceCurrency: currency,
      availability: `https://schema.org/${availability}`,
      url,
    },
  }

  if (reviewCount && ratingValue) {
    data.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue,
      reviewCount,
    }
  }

  return <JsonLd data={data} />
}

interface ArticleJsonLdProps {
  headline: string
  description?: string
  image?: string
  datePublished: string
  dateModified?: string
  author?: string
  publisherName: string
  publisherLogo?: string
  url?: string
}

export function ArticleJsonLd({
  headline,
  description,
  image,
  datePublished,
  dateModified,
  author,
  publisherName,
  publisherLogo,
  url,
}: ArticleJsonLdProps) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline,
    description,
    image,
    datePublished,
    dateModified: dateModified || datePublished,
    author: author ? { '@type': 'Person', name: author } : undefined,
    publisher: {
      '@type': 'Organization',
      name: publisherName,
      logo: publisherLogo ? { '@type': 'ImageObject', url: publisherLogo } : undefined,
    },
    mainEntityOfPage: url ? { '@type': 'WebPage', '@id': url } : undefined,
  }

  return <JsonLd data={data} />
}

interface BreadcrumbJsonLdProps {
  items: Array<{ name: string; url: string }>
}

export function BreadcrumbJsonLd({ items }: BreadcrumbJsonLdProps) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }

  return <JsonLd data={data} />
}

interface FaqJsonLdProps {
  faqs: Array<{ question: string; answer: string }>
}

export function FaqJsonLd({ faqs }: FaqJsonLdProps) {
  const data = {
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

  return <JsonLd data={data} />
}

interface WebsiteJsonLdProps {
  name: string
  url: string
  searchPath?: string
}

export function WebsiteJsonLd({ name, url, searchPath = '/search' }: WebsiteJsonLdProps) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name,
    url,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${url}${searchPath}?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }

  return <JsonLd data={data} />
}
