'use client';

/**
 * Page Renderer Component
 *
 * Client component that renders Puck content for CMS pages.
 * Used inside PageWrapper for full page rendering with header/footer.
 */

import { Render } from '@measured/puck';
import { pagesPuckConfig } from '@/puck/pages/config';
import type { Data } from '@measured/puck';

export interface PageRendererProps {
  puckContent: Data;
  className?: string;
}

export function PageRenderer({ puckContent, className = '' }: PageRendererProps) {
  return (
    <div className={`puck-content ${className}`}>
      <Render config={pagesPuckConfig} data={puckContent} />
    </div>
  );
}

export default PageRenderer;
