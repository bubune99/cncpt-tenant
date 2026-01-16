/**
 * Dynamic CMS Page Route
 *
 * Renders CMS pages created with Puck visual editor.
 * Pages are wrapped with appropriate header/footer based on settings.
 *
 * Route: /p/[...slug]
 * Examples: /p/about, /p/contact, /p/services/consulting
 */

import { prisma } from '../../../../lib/db';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import type { Data } from '@measured/puck';
import { PageWrapper, getPageLayoutSettings } from '../../../../components/page-wrapper';
import { PageRenderer } from '../../../../components/page-wrapper/page-renderer';

interface PageProps {
  params: Promise<{ slug: string[] }>;
}

/**
 * Fetch page by slug
 */
async function getPage(slugParts: string[]) {
  const slug = '/' + slugParts.join('/');

  const page = await prisma.page.findFirst({
    where: {
      OR: [{ slug: slug }, { slug: slugParts.join('/') }],
      status: 'PUBLISHED',
    },
    include: {
      featuredImage: true,
    },
  });

  return page;
}

/**
 * Generate metadata for the page
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPage(slug);

  if (!page) {
    return {
      title: 'Page Not Found',
    };
  }

  return {
    title: page.metaTitle || page.title,
    description: page.metaDescription || undefined,
    openGraph: {
      title: page.metaTitle || page.title,
      description: page.metaDescription || undefined,
      type: 'website',
      images: page.featuredImage?.url
        ? [{ url: page.featuredImage.url }]
        : undefined,
    },
  };
}

/**
 * Render the CMS page
 */
export default async function CMSPage({ params }: PageProps) {
  const { slug } = await params;
  const page = await getPage(slug);

  if (!page) {
    notFound();
  }

  // Check if page has Puck content
  if (!page.content) {
    // Render empty page placeholder
    return (
      <PageWrapper pageSettings={getPageLayoutSettings(page)}>
        <div className="container mx-auto px-4 py-12">
          <header className="max-w-3xl mx-auto mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">{page.title}</h1>
          </header>
          <div className="max-w-3xl mx-auto">
            <p className="text-muted-foreground">
              This page has no content yet.
            </p>
          </div>
        </div>
      </PageWrapper>
    );
  }

  // Render with Puck
  return (
    <PageWrapper pageSettings={getPageLayoutSettings(page)}>
      <PageRenderer puckContent={page.content as Data} />
    </PageWrapper>
  );
}

/**
 * Generate static params for common pages (optional optimization)
 * Note: Filters out root/empty slugs as [...slug] requires at least one segment
 */
export async function generateStaticParams() {
  const pages = await prisma.page.findMany({
    where: { status: 'PUBLISHED' },
    select: { slug: true },
    take: 50, // Limit to prevent build slowdowns
  });

  return pages
    .map((page) => {
      const cleanSlug = page.slug.replace(/^\//, '').trim();
      // Filter out empty slugs - [...slug] requires at least one segment
      if (!cleanSlug) return null;
      return {
        slug: cleanSlug.split('/'),
      };
    })
    .filter(Boolean) as { slug: string[] }[];
}
