/**
 * App Puck Page
 *
 * Renders Puck-managed pages within the app workspace area.
 * Pages are created via the visual editor and stored in the database.
 */

import { notFound } from 'next/navigation';
import { prisma } from '@/lib/cms/db';
import { Render } from '@puckeditor/core';
import puckConfig from '@/puck/config';

interface PageProps {
  params: Promise<{ slug: string[] }>;
}

export default async function AppPuckPage({ params }: PageProps) {
  const { slug } = await params;
  const fullSlug = `app/pages/${slug.join('/')}`;

  // Fetch the page from database
  const page = await prisma.page.findFirst({
    where: {
      slug: fullSlug,
      status: 'PUBLISHED',
    },
    select: {
      id: true,
      title: true,
      content: true,
    },
  });

  if (!page || !page.content) {
    notFound();
  }

  // Parse and render the Puck content
  const content = page.content as Record<string, unknown>;

  return (
    <div className="min-h-full">
      <Render config={puckConfig} data={content as Parameters<typeof Render>[0]['data']} />
    </div>
  );
}

// Generate metadata for the page
export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const fullSlug = `app/pages/${slug.join('/')}`;

  const page = await prisma.page.findFirst({
    where: { slug: fullSlug },
    select: { title: true, metaTitle: true, metaDescription: true },
  });

  return {
    title: page?.metaTitle || page?.title || 'Page',
    description: page?.metaDescription,
  };
}
