import { permanentRedirect } from 'next/navigation';

interface PageProps {
  params: Promise<{ subdomain: string; slug: string }>;
}

/**
 * Legacy blog tag archive. Canonical path is now /blog/tag/[slug]. Redirect old
 * links permanently, preserving the slug.
 */
export default async function LegacyTagArchive({ params }: PageProps) {
  const { slug } = await params;
  permanentRedirect(`/blog/tag/${slug}`);
}
