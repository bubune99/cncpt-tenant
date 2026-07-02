import { permanentRedirect } from 'next/navigation';

interface PageProps {
  params: Promise<{ subdomain: string; slug: string }>;
}

/**
 * Legacy blog category archive. This route historically RENDERED blog-category
 * post listings, so it redirects to the canonical /blog/category/[slug], which
 * preserves that user-visible behavior while removing the duplicate.
 *
 * Note: the tenant sitemap emits /categories/[slug] intending *product*
 * categories (a pre-existing inconsistency — no product-category page renders
 * at this path today). If a product-category page is built later it can reclaim
 * this path; this redirect only preserves the current blog behavior.
 */
export default async function LegacyCategoryArchive({ params }: PageProps) {
  const { slug } = await params;
  permanentRedirect(`/blog/category/${slug}`);
}
