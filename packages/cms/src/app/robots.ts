/**
 * Dynamic Robots.txt Generator
 */

import { MetadataRoute } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/checkout/',
          '/_next/',
          '/private/',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/checkout/',
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}
