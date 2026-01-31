/**
 * Dynamic Robots.txt Route Handler
 */

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export async function GET() {
  const robotsTxt = `# Robots.txt
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /checkout/
Disallow: /_next/
Disallow: /private/

User-agent: Googlebot
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /checkout/

Sitemap: ${BASE_URL}/sitemap.xml
`

  return new Response(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain',
    },
  })
}
