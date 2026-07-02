import { permanentRedirect } from 'next/navigation';

interface PageProps {
  params: Promise<{ subdomain: string; slug: string }>;
}

/**
 * Legacy blog post detail. Canonical path is now /blog/[slug]. Redirect old
 * /posts/[slug] links permanently, preserving the slug.
 */
export default async function LegacyPostDetail({ params }: PageProps) {
  const { slug } = await params;
  permanentRedirect(`/blog/${slug}`);
}
