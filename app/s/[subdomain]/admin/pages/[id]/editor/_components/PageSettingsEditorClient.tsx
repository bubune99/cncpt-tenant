/**
 * PageSettingsEditorClient — Atlas A2
 * Client wrapper for PageSettingsEditor.
 * Handles data fetching fallback and wires server actions.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { PageSettingsEditor } from '@/components/cms/editor/PageSettingsEditor';
import type { PageForEditor } from '@/components/cms/editor/PageSettingsEditor';

interface PageSettingsEditorClientProps {
  readonly initialPage: PageForEditor | null;
  readonly subdomain: string;
  readonly pageId: string;
}

export function PageSettingsEditorClient({
  initialPage,
  subdomain,
  pageId,
}: PageSettingsEditorClientProps): React.ReactElement {
  const router = useRouter();
  const [page, setPage] = useState<PageForEditor | null>(initialPage);
  const [isLoading, setIsLoading] = useState(initialPage === null);

  // Client-side fetch if SSR failed
  useEffect(() => {
    if (page !== null) return;
    let active = true;
    setIsLoading(true);
    fetch(`/api/cms/admin/pages/${pageId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: PageForEditor | null) => {
        if (active) {
          setPage(data);
          setIsLoading(false);
        }
      })
      .catch(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [pageId, page]);

  const handleSave = async (updated: Partial<PageForEditor>) => {
    const response = await fetch(`/api/cms/admin/pages/${pageId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Failed to save page' }));
      const msg = typeof err?.error === 'string' ? err.error : 'Failed to save page';
      toast.error(msg);
      throw new Error(msg);
    }

    const updatedPage: PageForEditor = await response.json();
    setPage(updatedPage);
    toast.success('Page settings saved');
    router.refresh();
  };

  if (isLoading) {
    return (
      <div className="atlas" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
        <span className="fig">Loading page…</span>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="atlas" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: 12 }}>
        <span className="display-i" style={{ fontSize: 22 }}>Page not found</span>
        <a href="/admin/pages" className="btn">← Back to pages</a>
      </div>
    );
  }

  return (
    <PageSettingsEditor
      page={page}
      subdomain={subdomain}
      onSave={handleSave}
      stats={{ visits: '—', cvr: '—' }}
    />
  );
}
