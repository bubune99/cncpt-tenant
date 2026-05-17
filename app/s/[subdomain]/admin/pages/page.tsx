'use client';

/**
 * Admin pages list — Atlas editorial style
 * Faithful port of atlas-v2-pages.jsx Pages() / PagesTable() / PagesMap()
 *
 * Preserves all existing data wiring:
 *  - fetch /api/cms/admin/pages with searchTerm
 *  - handleDelete via /api/cms/admin/pages/[id] DELETE
 *  - handleDuplicate via /api/cms/admin/pages POST
 *  - AlertDialog delete confirmation (shadcn)
 *  - SystemPagesSection component
 *  - useCMSConfig buildPath
 */

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useCMSConfig } from '@/contexts/CMSConfigContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/cms/ui/alert-dialog';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { SystemPagesSection } from './_components/system-pages-section';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface Page {
  readonly id: string;
  readonly title: string;
  readonly slug: string;
  readonly status: 'published' | 'draft' | 'archived';
  readonly hasContent: boolean;
  readonly parentId: string | null;
  readonly parent: { readonly id: string; readonly title: string; readonly slug: string } | null;
  readonly childCount: number;
  readonly updatedAt: string;
  readonly createdAt: string;
}

type ViewMode = 'table' | 'map';
type TabFilter = 'all' | 'published' | 'drafts' | 'archived';

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function statusPillClass(status: Page['status']): string {
  switch (status) {
    case 'published': return 'pill-solid-ink';
    case 'draft':     return 'pill-out-accent';
    case 'archived':  return 'pill-out';
  }
}

function statusLabel(status: Page['status']): string {
  return status.toUpperCase();
}

function formatEdited(dateString: string): string {
  const d = new Date(dateString);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

interface PagesTableProps {
  readonly pages: readonly Page[];
  readonly buildPath: (path: string) => string;
  readonly onDuplicate: (page: Page) => void;
  readonly onDeleteRequest: (page: Page) => void;
}

function PagesTable({ pages, buildPath, onDuplicate, onDeleteRequest }: PagesTableProps) {
  return (
    <>
      <table className="tbl" style={{ marginTop: 0 }}>
        <thead>
          <tr>
            <th className="check"><input type="checkbox" aria-label="Select all" /></th>
            <th>Title</th>
            <th>Slug</th>
            <th style={{ width: 80 }}>Type</th>
            <th className="sort" style={{ width: 80 }}>Edited</th>
            <th style={{ width: 100 }}>Status</th>
            <th style={{ width: 120 }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {pages.map((p) => (
            <tr key={p.id}>
              <td className="check"><input type="checkbox" aria-label={`Select ${p.title}`} /></td>
              <td className="name">
                <Link href={buildPath(`/admin/pages/${p.id}`)} style={{ textDecoration: 'none', color: 'inherit' }}>
                  {p.title}
                </Link>
              </td>
              <td>
                <span className="mono" style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{p.slug}</span>
              </td>
              <td>
                <span className="fig" style={{ fontSize: 12 }}>
                  {p.parentId ? 'Page' : p.slug === '/' ? 'Landing' : 'Page'}
                </span>
              </td>
              <td><span className="meta">{formatEdited(p.updatedAt)}</span></td>
              <td><span className={`pill ${statusPillClass(p.status)}`}>{statusLabel(p.status)}</span></td>
              <td>
                <div style={{ display: 'flex', gap: 4 }}>
                  <Link href={buildPath(`/admin/pages/${p.id}`)} className="btn" style={{ fontSize: 10, padding: '2px 8px' }}>
                    Edit
                  </Link>
                  <button
                    className="btn"
                    style={{ fontSize: 10, padding: '2px 8px' }}
                    onClick={() => onDuplicate(p)}
                    type="button"
                  >
                    Dup
                  </button>
                  <button
                    className="btn"
                    style={{ fontSize: 10, padding: '2px 8px', color: 'var(--accent)' }}
                    onClick={() => onDeleteRequest(p)}
                    type="button"
                  >
                    Del
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Action bar */}
      <div className="action-bar">
        <span className="selct">Pages</span>
        <span><span className="kbd">↑↓</span>move</span>
        <span><span className="kbd">E</span>edit</span>
        <span><span className="kbd">D</span>duplicate</span>
        <span><span className="kbd">X</span>archive</span>
        <span><span className="kbd">P</span>preview</span>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────

interface PageMapGroup {
  readonly ch: string;
  readonly title: string;
  readonly pages: readonly Page[];
}

function buildMapGroups(pages: readonly Page[]): readonly PageMapGroup[] {
  // Group: parent pages form chapter headers, children fall under them
  const roots = pages.filter(p => !p.parentId);
  const children = pages.filter(p => p.parentId);

  // Simple grouping: each root page is a chapter with its children
  if (roots.length === 0) {
    return [{ ch: 'I', title: 'All Pages', pages }];
  }

  const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];
  return roots.map((root, idx) => {
    const rootChildren = children.filter(c => c.parentId === root.id);
    return {
      ch: romanNumerals[idx] ?? String(idx + 1),
      title: root.title,
      pages: [root, ...rootChildren],
    };
  });
}

interface PagesMapProps {
  readonly pages: readonly Page[];
  readonly buildPath: (path: string) => string;
}

function PagesMap({ pages, buildPath }: PagesMapProps) {
  const groups = buildMapGroups(pages);

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 36, rowGap: 0 }}>
        {groups.map((c) => (
          <div key={c.ch} style={{ marginBottom: 18 }}>
            {/* Chapter header */}
            <div style={{
              display: 'flex', alignItems: 'baseline', gap: 10,
              paddingBottom: 6, borderBottom: '1px solid var(--ink)',
            }}>
              <span className="display accent" style={{ fontSize: 28, lineHeight: 1 }}>{c.ch}</span>
              <span className="display" style={{ fontSize: 22, lineHeight: 1 }}>{c.title}</span>
              <span className="fig" style={{ fontSize: 13 }}>· {c.pages.length} pages</span>
            </div>

            {/* Page rows */}
            {c.pages.map((p, idx) => {
              const isChild = idx > 0; // first is root, rest are children
              return (
                <div
                  key={p.id}
                  style={{
                    display: 'grid', gridTemplateColumns: '1fr 88px',
                    alignItems: 'baseline', gap: 8,
                    padding: '8px 0', borderBottom: '1px solid var(--rule-soft)',
                  }}
                >
                  <div style={{ minWidth: 0, display: 'flex', alignItems: 'baseline', gap: 4 }}>
                    {isChild && (
                      <span style={{
                        color: 'var(--ink-faint)',
                        fontFamily: 'var(--font-geist-mono), monospace',
                        fontSize: 12,
                      }}>
                        └─
                      </span>
                    )}
                    <span style={{ marginLeft: isChild ? 2 : 0 }}>
                      <Link
                        href={buildPath(`/admin/pages/${p.id}`)}
                        style={{
                          textDecoration: 'none', color: 'inherit',
                          fontSize: 14, fontWeight: isChild ? 400 : 500,
                        }}
                      >
                        {p.title}
                      </Link>
                      {' '}
                      <span className="mono" style={{ fontSize: 11, color: 'var(--ink-soft)' }}>{p.slug}</span>
                    </span>
                    <span className="meta" style={{ marginLeft: 'auto', whiteSpace: 'nowrap', paddingLeft: 8 }}>
                      {formatEdited(p.updatedAt)}
                    </span>
                  </div>
                  <div style={{ justifySelf: 'end' }}>
                    <span className={`pill ${statusPillClass(p.status)}`}>{statusLabel(p.status)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Action bar */}
      <div className="action-bar">
        <span className="selct">Map</span>
        <span><span className="kbd">↑↓</span>move</span>
        <span><span className="kbd">Enter</span>open</span>
        <span><span className="kbd">N</span>new child</span>
        <span><span className="kbd">G</span>regroup</span>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────
// Main page component
// ─────────────────────────────────────────────

export default function PagesPage() {
  const { buildPath } = useCMSConfig();

  const [pages, setPages] = useState<Page[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [view, setView] = useState<ViewMode>('table');
  const [activeTab, setActiveTab] = useState<TabFilter>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pageToDelete, setPageToDelete] = useState<Page | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ── Data fetching ──

  const fetchPages = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.set('search', searchTerm);
      const res = await fetch(`/api/cms/admin/pages?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch pages');
      const data = await res.json() as { pages?: Page[] };
      setPages(data.pages ?? []);
    } catch {
      toast.error('Failed to load pages');
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    void fetchPages();
  }, [fetchPages]);

  // Debounced search re-fetch
  useEffect(() => {
    const timer = setTimeout(() => void fetchPages(), 300);
    return () => clearTimeout(timer);
  }, [searchTerm, fetchPages]);

  // ── Actions ──

  const handleDelete = async () => {
    if (!pageToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/cms/admin/pages/${pageToDelete.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        throw new Error(data.error ?? 'Failed to delete page');
      }
      toast.success('Page deleted successfully');
      void fetchPages();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete page');
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setPageToDelete(null);
    }
  };

  const handleDuplicate = async (page: Page) => {
    try {
      const res = await fetch('/api/cms/admin/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: `${page.title} (Copy)`, slug: `${page.slug}-copy`, status: 'draft' }),
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        throw new Error(data.error ?? 'Failed to duplicate page');
      }
      toast.success('Page duplicated successfully');
      void fetchPages();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to duplicate page');
    }
  };

  const handleDeleteRequest = (page: Page) => {
    setPageToDelete(page);
    setDeleteDialogOpen(true);
  };

  // ── Derived counts ──

  const counts = {
    all:       pages.length,
    published: pages.filter(p => p.status === 'published').length,
    drafts:    pages.filter(p => p.status === 'draft').length,
    archived:  pages.filter(p => p.status === 'archived').length,
  };

  const filteredPages = activeTab === 'all'
    ? pages
    : pages.filter(p => {
        if (activeTab === 'published') return p.status === 'published';
        if (activeTab === 'drafts')    return p.status === 'draft';
        if (activeTab === 'archived')  return p.status === 'archived';
        return true;
      });

  // ── Tab items ──

  const tabItems: readonly [TabFilter, string, number][] = [
    ['all',       'All',      counts.all],
    ['published', 'Published',counts.published],
    ['drafts',    'Drafts',   counts.drafts],
    ['archived',  'Archived', counts.archived],
  ];

  return (
    <div data-tour-id="pages-page">

      {/* Main head */}
      <div className="main-head" data-tour-id="pages-heading">
        <div>
          <div className="eyebrow">Pages</div>
          <h1>The <span className="display-i accent">pages.</span></h1>
          <div className="sub">
            {isLoading
              ? 'Loading pages…'
              : `${counts.all} pages · ${counts.published} published · ${counts.drafts} draft${counts.drafts !== 1 ? 's' : ''} in flight`}
          </div>
        </div>
        <div className="actions">
          {/* View toggle */}
          <span className="mono fig" style={{ fontSize: 11 }}>view:</span>
          <button
            className={'btn' + (view === 'table' ? ' btn-solid' : '')}
            style={{ padding: '5px 10px', fontSize: 11 }}
            onClick={() => setView('table')}
            type="button"
          >
            Table
          </button>
          <button
            className={'btn' + (view === 'map' ? ' btn-solid' : '')}
            style={{ padding: '5px 10px', fontSize: 11 }}
            onClick={() => setView('map')}
            type="button"
          >
            Map
          </button>

          {/* Search input */}
          <div style={{ position: 'relative' }}>
            <input
              type="search"
              placeholder="Search…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                height: 28, paddingLeft: 8, paddingRight: 8, fontSize: 12,
                border: '1px solid var(--ink)', background: 'var(--paper)',
                color: 'var(--ink)', fontFamily: 'inherit', outline: 'none',
              }}
              aria-label="Search pages"
            />
          </div>

          <Link href={buildPath('/admin/pages/new')} className="btn btn-solid" data-tour-id="pages-create-button">
            <span className="kbd">N</span>+ New page
          </Link>
        </div>
      </div>

      {/* System pages section — preserved from original */}
      <div style={{ marginBottom: 16 }}>
        <SystemPagesSection onChange={() => void fetchPages()} />
      </div>

      {/* Tabs — only shown in table view */}
      {view === 'table' && (
        <div className="tabs-row" style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--ink)', marginBottom: 0 }}>
          {tabItems.map(([key, label, count]) => (
            <button
              key={key}
              type="button"
              className={activeTab === key ? 'tab on' : 'tab'}
              onClick={() => setActiveTab(key)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px 14px 6px 0', fontSize: 12 }}
            >
              {label} <span className="ct">{count}</span>
            </button>
          ))}
          <span style={{ marginLeft: 'auto', color: 'var(--ink-soft)', fontSize: 11, display: 'flex', alignItems: 'center', paddingBottom: 6 }}>
            sort: edited ↓
          </span>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 0', gap: 8 }}>
          <Loader2 className="h-5 w-5 animate-spin" style={{ color: 'var(--ink-soft)' }} />
          <span className="eyebrow">Loading…</span>
        </div>
      ) : filteredPages.length === 0 ? (
        <div style={{ padding: '48px 0', textAlign: 'center' }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>No pages</div>
          <p className="fig" style={{ fontSize: 13, marginBottom: 16 }}>
            {searchTerm ? `No pages match "${searchTerm}"` : 'Get started by creating your first page.'}
          </p>
          <Link href={buildPath('/admin/pages/new')} className="btn btn-solid">
            <span className="kbd">N</span>+ New page
          </Link>
        </div>
      ) : view === 'table' ? (
        <PagesTable
          pages={filteredPages}
          buildPath={buildPath}
          onDuplicate={handleDuplicate}
          onDeleteRequest={handleDeleteRequest}
        />
      ) : (
        <PagesMap
          pages={filteredPages}
          buildPath={buildPath}
        />
      )}

      {/* Delete confirmation dialog — shadcn preserved */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Page</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{pageToDelete?.title}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleDelete()}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting…
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
