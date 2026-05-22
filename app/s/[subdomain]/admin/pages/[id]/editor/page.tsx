/**
 * Page Settings Editor — Atlas A2
 *
 * Magazine-style preview (left) + highlighted settings panel (right).
 * Content editing lives in the block builder at /admin/pages/[id]/builder
 * (sibling route — see ./builder/page.tsx).
 *
 * This route is for: status, SEO, scheduling, access, versions.
 */

import { notFound } from 'next/navigation';
import { PageSettingsEditorClient } from './_components/PageSettingsEditorClient';

interface PageEditorParams {
  readonly subdomain: string;
  readonly id: string;
}

interface PageEditorProps {
  readonly params: Promise<PageEditorParams>;
}

export default async function PageEditorRoute({ params }: PageEditorProps): Promise<React.ReactElement> {
  const { subdomain, id } = await params;

  // Fetch page data server-side
  const baseUrl = process.env.NEXTAUTH_URL ?? process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000';

  const res = await fetch(`${baseUrl}/api/cms/admin/pages/${id}`, {
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
  });

  if (!res.ok) {
    if (res.status === 404) notFound();
    // Fall through to client with null for graceful degradation
  }

  const page = res.ok ? await res.json() : null;

  return (
    <PageSettingsEditorClient
      initialPage={page}
      subdomain={subdomain}
      pageId={id}
    />
  );
}
