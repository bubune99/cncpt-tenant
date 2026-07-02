'use client';

/**
 * CollectionsScreen — Grainy collections list.
 *
 * Collections are Prisma categories, read from GET /api/cms/shop/collections
 * (title, product count, product thumbnails). This surface is read + navigate:
 * the generic commerce provider exposes no category-mutation endpoint, so there
 * is no create/edit/delete here. Products are assigned to categories from the
 * product editor; each card opens the products list to work its members.
 */

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Layers, Package, RefreshCw, ArrowRight, Info } from 'lucide-react';
import { toast } from 'sonner';
import { useCMSConfig } from '@/contexts/CMSConfigContext';
import { useAuth } from '@/hooks/use-auth';
import { Btn } from '../grainy-ui';
import { CatalogSubnav } from './catalog-subnav';
import { fetchCollections, type Collection } from './catalog-model';

export default function CollectionsScreen(): React.ReactElement {
  const { user } = useAuth();
  const { buildPath } = useCMSConfig();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      setCollections(await fetchCollections());
    } catch (e) {
      console.error('Error fetching collections:', e);
      toast.error('Failed to load collections');
      setCollections([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [user]);

  const total = collections.reduce((a, c) => a + c.count, 0);

  return (
    <div className="main-inner" style={{ padding: '4px 2px' }} data-tour-id="collections-page">
      <CatalogSubnav active="collections" />

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20 }}>
        <div>
          <span className="gr-eyebrow">Catalog</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 3 }}>
            <h1 style={{ fontSize: 'var(--text-xl)', margin: 0, letterSpacing: '-0.015em' }}>Collections</h1>
            <span className="gr-num" style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
              {collections.length} · {total} products
            </span>
          </div>
        </div>
        <Btn icon={RefreshCw} onClick={load} disabled={loading}>Refresh</Btn>
      </div>

      <p style={{ margin: '12px 0 20px', maxWidth: 620, color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.5, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <Info size={15} style={{ color: 'var(--clay-600)', flex: 'none', marginTop: 2 }} />
        Collections group products for storefront browsing. Assign a product to a collection from its
        editor — open a collection here to work its members in the products list.
      </p>

      {loading && collections.length === 0 ? (
        <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
          <RefreshCw size={18} className="animate-spin" style={{ display: 'inline' }} /> Loading collections…
        </div>
      ) : collections.length === 0 ? (
        <div style={{ minHeight: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--surface-sunken)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', marginBottom: 12 }}><Layers size={22} /></div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>No collections yet</div>
            <p style={{ margin: '5px 0 0', color: 'var(--text-muted)', fontSize: 13 }}>Categories you create appear here with their product counts.</p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          {collections.map((c) => (
            <Link
              key={c.id}
              href={buildPath('/admin/products')}
              className="gr-card"
              style={{ padding: 0, overflow: 'hidden', textDecoration: 'none', color: 'inherit' }}
            >
              <div style={{ height: 80, display: 'flex', background: 'var(--surface-sunken)' }}>
                {c.thumbs.length > 0
                  ? c.thumbs.map((src, i) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={i} src={src} alt="" style={{ flex: 1, minWidth: 0, height: '100%', objectFit: 'cover' }} />
                    ))
                  : <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}><Layers size={22} /></div>}
              </div>
              <div style={{ padding: '13px 15px' }}>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{c.title}</div>
                {c.description && (
                  <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 6, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{c.description}</div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 11, paddingTop: 11, borderTop: '1px solid var(--line-faint)' }}>
                  <Package size={14} style={{ color: 'var(--text-muted)' }} />
                  <span className="gr-num" style={{ fontSize: 12.5, fontWeight: 600 }}>{c.count}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>products</span>
                  <span className="gr-link" style={{ marginLeft: 'auto', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 3 }}>Open <ArrowRight size={12} /></span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
