/**
 * Page Block Builder — Atlas A2
 *
 * The drag-and-drop visual block editor for a page's content.
 * This route owns content composition (blocks); the sibling
 * /admin/pages/[id]/editor route owns settings, SEO, scheduling,
 * access, and versions.
 */

'use client';

import { useParams } from 'next/navigation';
import { PageBuilder } from '@/components/cms/block-editor/page-builder';

export default function PageBlockBuilderRoute(): React.ReactElement {
  const { id } = useParams<{ id: string }>();

  return <PageBuilder pageId={id} />;
}
