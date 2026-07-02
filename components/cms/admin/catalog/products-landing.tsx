'use client';

/**
 * ProductsLanding — the family picker for the products catalog. Cards open the
 * focused per-family table; the stat strip summarises the whole catalog.
 */

import React from 'react';
import { Plus, ArrowRight, RefreshCw } from 'lucide-react';
import { Btn } from '../grainy-ui';
import { FAMILIES, type Family, type Prod } from './catalog-model';

export function ProductsLanding({
  products, onPick, onNew, onRefresh, loading,
}: {
  readonly products: readonly Prod[];
  readonly onPick: (f: Family) => void;
  readonly onNew: () => void;
  readonly onRefresh: () => void;
  readonly loading: boolean;
}): React.ReactElement {
  const drafts = products.filter((p) => p.status === 'draft').length;
  const low = products.filter((p) => p.family === 'physical' && p.trackInventory && p.stock > 0 && p.stock < p.lowStockThreshold).length;
  const out = products.filter((p) => p.family === 'physical' && p.trackInventory && p.stock === 0).length;

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20 }}>
        <div>
          <span className="gr-eyebrow">Catalog</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 3 }}>
            <h1 style={{ fontSize: 'var(--text-xl)', margin: 0, letterSpacing: '-0.015em' }}>Products</h1>
            <span className="gr-num" style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
              {products.length} items · 3 catalogs
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn icon={RefreshCw} onClick={onRefresh} disabled={loading}>Refresh</Btn>
          <Btn kind="primary" icon={Plus} onClick={onNew}>New product</Btn>
        </div>
      </div>
      <p style={{ margin: '12px 0 20px', maxWidth: 600, color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.5 }}>
        Pick a catalog to work in. Each keeps the columns and filters that matter for that kind of
        product — no squeezing physical stock, file formats, and billing cycles into one table.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, maxWidth: 1080 }}>
        {FAMILIES.map((f) => {
          const items = products.filter((p) => p.family === f.key);
          const Icon = f.icon;
          return (
            <button
              key={f.key}
              onClick={() => onPick(f.key)}
              className="gr-card"
              style={{ textAlign: 'left', cursor: 'pointer', padding: 0, overflow: 'hidden' }}
            >
              <div style={{ height: 7, background: f.hex }} />
              <div style={{ padding: '18px 18px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ width: 44, height: 44, borderRadius: 12, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `color-mix(in srgb, ${f.hex} 16%, var(--surface))`, color: f.hex }}>
                    <Icon size={22} />
                  </span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16.5, letterSpacing: '-0.01em' }}>{f.label}</div>
                    <div className="gr-num" style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 1 }}>{items.length} products</div>
                  </div>
                  <ArrowRight size={18} style={{ marginLeft: 'auto', color: 'var(--text-muted)' }} />
                </div>
                <p style={{ margin: '14px 0 0', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.45, minHeight: 38 }}>{f.blurb}</p>
                <div style={{ marginTop: 14, paddingTop: 13, borderTop: '1px solid var(--line-faint)' }}>
                  <span className="gr-eyebrow" style={{ fontSize: 9, textTransform: 'none', letterSpacing: 0, color: 'var(--text-muted)' }}>{f.facets}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 22, flexWrap: 'wrap' }}>
        {([
          [products.length, 'total products', 'var(--text)'],
          [drafts, 'in draft', 'var(--ochre-700)'],
          [low, 'low stock', 'var(--ochre-700)'],
          [out, 'sold out', 'var(--rust-700)'],
        ] as const).map(([n, label, col]) => (
          <span key={label} className="gr-card" style={{ padding: '9px 15px', display: 'inline-flex', alignItems: 'baseline', gap: 8 }}>
            <span className="gr-num" style={{ fontSize: 18, fontWeight: 700, color: col }}>{n}</span>
            <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{label}</span>
          </span>
        ))}
      </div>
    </>
  );
}
