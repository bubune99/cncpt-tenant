'use client';

/**
 * InventoryScreen — Grainy stock overview.
 *
 * Stock lives on the Product model (stock / trackInventory / lowStockThreshold)
 * and per-variant on ProductVariant; there is no separate inventory API, so
 * this reads the products list (GET /api/cms/products) and surfaces the tracked
 * items. Stock for simple (non-variant) products can be set inline via
 * PUT /api/cms/products/[id]; variant stock is edited in the product editor.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Boxes, RefreshCw, Search, AlertTriangle, PackageX, Settings as SettingsIcon, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { useCMSConfig } from '@/contexts/CMSConfigContext';
import { useAuth } from '@/hooks/use-auth';
import { Badge, Btn, LiveSearch, RowMenu } from '../grainy-ui';
import { CatalogSubnav } from './catalog-subnav';
import { FilterChip } from './filter-chip';
import {
  fetchCatalog, setProductStock, stockLevel, titleCase,
  type Prod, type StockLevel,
} from './catalog-model';

const LEVEL_TONE: Record<StockLevel, 'sage' | 'ochre' | 'rust'> = {
  'In stock': 'sage',
  Low: 'ochre',
  'Out of stock': 'rust',
};

export default function InventoryScreen(): React.ReactElement {
  const { user } = useAuth();
  const { buildPath } = useCMSConfig();
  const [products, setProducts] = useState<Prod[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [level, setLevel] = useState('Any');

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      setProducts(await fetchCatalog());
    } catch (e) {
      console.error('Error fetching inventory:', e);
      toast.error('Failed to load inventory');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [user]);

  const tracked = useMemo(() => products.filter((p) => p.trackInventory && p.family === 'physical'), [products]);
  const totals = useMemo(() => ({
    units: tracked.reduce((a, p) => a + p.stock, 0),
    low: tracked.filter((p) => p.stock > 0 && p.stock < p.lowStockThreshold).length,
    out: tracked.filter((p) => p.stock === 0).length,
  }), [tracked]);

  const rows = tracked.filter((p) => {
    if (q && !(p.name.toLowerCase().includes(q.toLowerCase()) || p.sku.toLowerCase().includes(q.toLowerCase()))) return false;
    if (level !== 'Any' && stockLevel(p) !== level) return false;
    return true;
  });

  async function adjust(p: Prod): Promise<void> {
    if (p.variants > 0) {
      window.location.href = buildPath(`/admin/products/${p.id}`);
      return;
    }
    const input = prompt(`Set stock for "${p.name}"`, String(p.stock));
    if (input == null) return;
    const n = parseInt(input, 10);
    if (!Number.isFinite(n) || n < 0) { toast.error('Enter a valid quantity'); return; }
    try {
      await setProductStock(p.id, n);
      toast.success(`Stock set to ${n} · ${p.name}`);
      load();
    } catch {
      toast.error('Failed to update stock');
    }
  }

  return (
    <div className="main-inner" style={{ padding: '4px 2px' }} data-tour-id="inventory-page">
      <CatalogSubnav active="inventory" />

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20 }}>
        <div>
          <span className="gr-eyebrow">Stock</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 3 }}>
            <h1 style={{ fontSize: 'var(--text-xl)', margin: 0, letterSpacing: '-0.015em' }}>Inventory</h1>
            <span className="gr-num" style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{tracked.length} tracked items</span>
          </div>
        </div>
        <Btn icon={RefreshCw} onClick={load} disabled={loading}>Refresh</Btn>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '16px 0 12px', flexWrap: 'wrap' }}>
        <span className="gr-card" style={{ padding: '7px 14px', display: 'inline-flex', alignItems: 'baseline', gap: 7 }}>
          <span className="gr-num" style={{ fontSize: 17, fontWeight: 700 }}>{totals.units}</span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>units on hand</span>
        </span>
        <span className="gr-card" style={{ padding: '7px 14px', display: 'inline-flex', alignItems: 'baseline', gap: 7 }}>
          <span className="gr-num" style={{ fontSize: 17, fontWeight: 700, color: 'var(--ochre-700)' }}>{totals.low}</span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>low stock</span>
        </span>
        <span className="gr-card" style={{ padding: '7px 14px', display: 'inline-flex', alignItems: 'baseline', gap: 7 }}>
          <span className="gr-num" style={{ fontSize: 17, fontWeight: 700, color: 'var(--rust-700)' }}>{totals.out}</span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>sold out</span>
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <FilterChip label="stock" value={level} options={['In stock', 'Low', 'Out of stock']} onChange={setLevel} />
          <LiveSearch value={q} onChange={setQ} placeholder="Search SKUs…" width={200} />
        </div>
      </div>

      {loading && products.length === 0 ? (
        <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
          <RefreshCw size={18} className="animate-spin" style={{ display: 'inline' }} /> Loading inventory…
        </div>
      ) : rows.length === 0 ? (
        <div style={{ minHeight: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--surface-sunken)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', marginBottom: 12 }}><Boxes size={22} /></div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>Nothing to show</div>
            <p style={{ margin: '5px 0 0', color: 'var(--text-muted)', fontSize: 13 }}>
              {tracked.length === 0 ? 'No inventory-tracked physical products yet.' : 'No items match this filter.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="table-wrap gr-scroll">
          <table className="table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Type</th>
                <th className="num">On hand</th>
                <th className="num">Low at</th>
                <th className="num">Variants</th>
                <th>Level</th>
                <th className="col-actions" />
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => {
                const lvl = stockLevel(p);
                return (
                  <tr key={p.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                        {p.thumbnail
                          // eslint-disable-next-line @next/next/no-img-element
                          ? <img src={p.thumbnail} alt="" style={{ width: 30, height: 30, borderRadius: 7, objectFit: 'cover', flex: 'none' }} />
                          : <span style={{ width: 30, height: 30, borderRadius: 7, flex: 'none', background: 'var(--surface-sunken)' }} />}
                        <div style={{ minWidth: 0 }}>
                          <div className="t-name" style={{ whiteSpace: 'nowrap' }}>{p.name}</div>
                          <div className="gr-num" style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>{p.sku || p.id.slice(0, 8)}</div>
                        </div>
                      </div>
                    </td>
                    <td><Badge tone="neutral">{titleCase(p.type.toLowerCase())}</Badge></td>
                    <td className="num" style={{ fontWeight: 700, color: p.stock === 0 ? 'var(--rust-700)' : 'var(--text)' }}>{p.stock}</td>
                    <td className="num" style={{ color: 'var(--text-muted)' }}>{p.lowStockThreshold}</td>
                    <td className="num">{p.variants > 0 ? p.variants : <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                    <td>
                      <Badge tone={LEVEL_TONE[lvl]} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        {lvl === 'Low' && <AlertTriangle size={11} />}
                        {lvl === 'Out of stock' && <PackageX size={11} />}
                        {lvl}
                      </Badge>
                    </td>
                    <td className="col-actions" onClick={(e) => e.stopPropagation()}>
                      <RowMenu
                        items={[
                          {
                            icon: Pencil,
                            label: p.variants > 0 ? 'Edit in product' : 'Set stock',
                            title: p.variants > 0 ? 'Variant stock is edited in the product editor' : undefined,
                            onClick: () => adjust(p),
                          },
                          { icon: SettingsIcon, label: 'Configure', onClick: () => { window.location.href = buildPath(`/admin/products/${p.id}`); } },
                        ]}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
