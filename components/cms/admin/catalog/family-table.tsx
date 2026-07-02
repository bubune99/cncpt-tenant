'use client';

/**
 * FamilyTable — focused per-family products table (Grainy). Columns + filters
 * match the family. Real capabilities: status view tabs, category/stock
 * filters, live search, sort, selection + bulk publish/draft/archive/delete
 * (PUT/DELETE /api/cms/products/[id]), persisted column customizer, per-row
 * configure/view/status/delete.
 */

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Plus, Filter, ChevronLeft, Search, X, SlidersHorizontal, Check,
  Settings as SettingsIcon, ExternalLink, Layers, Trash2, FileEdit, CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge, Btn, LiveSearch, RowMenu } from '../grainy-ui';
import { FilterChip } from './filter-chip';
import {
  familyMeta, money, titleCase, statusTone, stockLevel,
  setProductStatus, deleteProduct,
  type Family, type Prod,
} from './catalog-model';

type OptCol = 'type' | 'stock' | 'variants' | 'cadence' | 'capacity';

const FAMILY_COLS: Record<Family, readonly { key: OptCol; label: string; num?: boolean }[]> = {
  physical: [
    { key: 'type', label: 'Type' },
    { key: 'stock', label: 'Stock', num: true },
    { key: 'variants', label: 'Variants', num: true },
  ],
  digital: [{ key: 'type', label: 'Type' }],
  service: [
    { key: 'type', label: 'Type' },
    { key: 'cadence', label: 'Cadence' },
    { key: 'capacity', label: 'Capacity', num: true },
  ],
};

const COLS_KEY = 'grainy-catalog-columns-v1';

function loadCols(family: Family, all: readonly OptCol[]): OptCol[] {
  try {
    const saved = JSON.parse(localStorage.getItem(COLS_KEY) || '{}');
    const arr = saved[family];
    if (Array.isArray(arr)) return all.filter((c) => arr.includes(c));
  } catch {
    /* ignore */
  }
  return [...all];
}
function persistCols(family: Family, cols: readonly OptCol[]): void {
  try {
    const saved = JSON.parse(localStorage.getItem(COLS_KEY) || '{}');
    saved[family] = cols;
    localStorage.setItem(COLS_KEY, JSON.stringify(saved));
  } catch {
    /* ignore */
  }
}

function ColumnMenu({
  family, cols, onToggle,
}: {
  readonly family: Family;
  readonly cols: readonly OptCol[];
  readonly onToggle: (c: OptCol) => void;
}): React.ReactElement {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      {open && <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 18 }} />}
      <Btn icon={SlidersHorizontal} onClick={() => setOpen((o) => !o)}>Columns</Btn>
      {open && (
        <div className="menu" style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 19, minWidth: 180 }}>
          {FAMILY_COLS[family].map((c) => {
            const on = cols.includes(c.key);
            return (
              <div key={c.key} className="menu-item" onClick={() => onToggle(c.key)}>
                <span>{c.label}</span>
                {on && <Check size={14} style={{ marginLeft: 'auto', color: 'var(--clay-600)' }} />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function FamilyTable({
  family, products, onBack, onNew, onMutate, buildPath,
}: {
  readonly family: Family;
  readonly products: readonly Prod[];
  readonly onBack: () => void;
  readonly onNew: (f: Family) => void;
  readonly onMutate: () => void;
  readonly buildPath: (p: string) => string;
}): React.ReactElement {
  const meta = familyMeta(family);
  const base = useMemo(() => products.filter((p) => p.family === family), [products, family]);
  const allCols = FAMILY_COLS[family].map((c) => c.key);

  const [view, setView] = useState<'all' | 'active' | 'draft' | 'archived'>('all');
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('Any');
  const [stock, setStock] = useState('Any');
  const [sort, setSort] = useState('Newest');
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [cols, setCols] = useState<OptCol[]>(allCols);
  const [busy, setBusy] = useState(false);

  useEffect(() => { setCols(loadCols(family, allCols)); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [family]);
  useEffect(() => { setSel(new Set()); }, [view, cat, stock, q]);

  const toggleCol = (c: OptCol) => setCols((prev) => {
    const next = prev.includes(c) ? prev.filter((x) => x !== c) : allCols.filter((x) => prev.includes(x) || x === c);
    persistCols(family, next);
    return next;
  });

  const categories = useMemo(() => {
    const s: string[] = [];
    base.forEach((p) => { const c = titleCase(p.category); if (c && !s.includes(c)) s.push(c); });
    return s.sort();
  }, [base]);

  const viewRows = base.filter((p) => view === 'all' || p.status === view);
  let rows = viewRows.filter((p) => {
    if (q && !(p.name.toLowerCase().includes(q.toLowerCase()) || p.sku.toLowerCase().includes(q.toLowerCase()))) return false;
    if (cat !== 'Any' && titleCase(p.category) !== cat) return false;
    if (family === 'physical' && stock !== 'Any' && stockLevel(p) !== stock) return false;
    return true;
  });
  rows = [...rows].sort((a, b) => {
    if (sort === 'Name A–Z') return a.name.localeCompare(b.name);
    if (sort === 'Price') return b.price - a.price;
    if (sort === 'Stock') return b.stock - a.stock;
    return +new Date(b.createdAt) - +new Date(a.createdAt);
  });

  const sortOpts = ['Newest', 'Name A–Z', 'Price', ...(family === 'physical' ? ['Stock'] : [])];
  const counts = {
    all: base.length,
    active: base.filter((p) => p.status === 'active').length,
    draft: base.filter((p) => p.status === 'draft').length,
    archived: base.filter((p) => p.status === 'archived').length,
  };

  const toggle = (id: string) => setSel((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const allOn = rows.length > 0 && rows.every((p) => sel.has(p.id));
  const toggleAll = () => setSel((s) => { const n = new Set(s); allOn ? rows.forEach((p) => n.delete(p.id)) : rows.forEach((p) => n.add(p.id)); return n; });
  const activeCount = (cat !== 'Any' ? 1 : 0) + (stock !== 'Any' ? 1 : 0) + (q ? 1 : 0);
  const resetAll = () => { setCat('Any'); setStock('Any'); setQ(''); };

  async function runBulk(label: string, fn: (id: string) => Promise<void>): Promise<void> {
    const ids = [...sel];
    if (ids.length === 0 || busy) return;
    setBusy(true);
    const t = toast.loading(`${label} ${ids.length} product${ids.length > 1 ? 's' : ''}…`);
    const results = await Promise.allSettled(ids.map((id) => fn(id)));
    const failed = results.filter((r) => r.status === 'rejected').length;
    toast.dismiss(t);
    if (failed === 0) toast.success(`${label} ${ids.length} product${ids.length > 1 ? 's' : ''}`);
    else toast.error(`${label} failed for ${failed} of ${ids.length}`);
    setSel(new Set());
    setBusy(false);
    onMutate();
  }

  const Icon = meta.icon;
  const newLabel = family === 'service' ? 'service' : family === 'digital' ? 'digital product' : 'product';
  const nameLabel = family === 'service' ? 'Service' : 'Product';
  const shownCols = FAMILY_COLS[family].filter((c) => cols.includes(c.key));

  const optCell = (key: OptCol, p: Prod): React.ReactElement => {
    if (key === 'type') return <td key={key}><Badge tone={meta.tone}>{titleCase(p.type.toLowerCase())}</Badge></td>;
    if (key === 'stock') return (
      <td key={key} className="num">
        {p.trackInventory
          ? <span style={{ color: p.stock === 0 ? 'var(--rust-700)' : p.stock < p.lowStockThreshold ? 'var(--ochre-700)' : 'var(--text)', fontWeight: p.stock === 0 ? 700 : 400 }}>{p.stock}</span>
          : <span style={{ color: 'var(--text-muted)' }}>—</span>}
      </td>
    );
    if (key === 'variants') return <td key={key} className="num">{p.variants > 0 ? p.variants : <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>;
    if (key === 'cadence') return <td key={key}>{p.interval ? <Badge tone="neutral">{titleCase(p.interval)}</Badge> : <span style={{ color: 'var(--text-muted)' }}>One-time</span>}</td>;
    if (key === 'capacity') return <td key={key} className="num">{p.capacity ?? (p.duration ? `${p.duration}m` : <span style={{ color: 'var(--text-muted)' }}>—</span>)}</td>;
    return <td key={key} />;
  };

  return (
    <>
      <button
        onClick={onBack}
        className="gr-link"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, border: 'none', background: 'transparent', fontSize: 11, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '.06em', cursor: 'pointer', marginBottom: 8 }}
      >
        <ChevronLeft size={13} /> Products
      </button>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          <span style={{ width: 30, height: 30, borderRadius: 8, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `color-mix(in srgb, ${meta.hex} 16%, var(--surface))`, color: meta.hex }}>
            <Icon size={17} />
          </span>
          <h1 style={{ fontSize: 'var(--text-xl)', margin: 0, letterSpacing: '-0.015em' }}>{meta.label}</h1>
          <span className="gr-num" style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{base.length} items</span>
        </div>
        <Btn kind="primary" icon={Plus} onClick={() => onNew(family)}>New {newLabel}</Btn>
      </div>

      {/* status view tabs */}
      <div style={{ display: 'flex', gap: 7, margin: '16px 0 2px', flexWrap: 'wrap' }}>
        {(['all', 'active', 'draft', 'archived'] as const).map((v) => {
          const on = view === v;
          return (
            <button
              key={v}
              onClick={() => setView(v)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 7, border: '1px solid ' + (on ? 'transparent' : 'var(--line)'), background: on ? 'var(--ink-900)' : 'var(--surface-raised)', color: on ? 'var(--surface-raised)' : 'var(--text-secondary)', borderRadius: 999, padding: '6px 13px', cursor: 'pointer', fontSize: 13, fontWeight: on ? 600 : 500 }}
            >
              {v === 'all' ? 'All' : titleCase(v)}
              <span className="gr-num" style={{ fontSize: 11, color: on ? 'color-mix(in srgb, var(--surface-raised) 70%, transparent)' : 'var(--text-muted)' }}>{counts[v]}</span>
            </button>
          );
        })}
      </div>

      {/* filter bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '14px 0 12px', flexWrap: 'wrap' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 12 }}><Filter size={14} /> Filter</span>
        <FilterChip label="category" value={cat} options={categories} onChange={setCat} />
        {family === 'physical' && <FilterChip label="stock" value={stock} options={['In stock', 'Low', 'Out of stock']} onChange={setStock} />}
        <FilterChip label="sort" value={sort} options={sortOpts.filter((x) => x !== sort)} onChange={setSort} />
        {activeCount > 0 && <button className="gr-link" onClick={resetAll} style={{ border: 'none', background: 'transparent', fontSize: 12, cursor: 'pointer' }}>Clear all</button>}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <ColumnMenu family={family} cols={cols} onToggle={toggleCol} />
          <LiveSearch value={q} onChange={setQ} placeholder={`Search ${meta.label.toLowerCase()}…`} width={224} />
        </div>
      </div>

      {sel.size > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div className="bulkbar">
            <span className="count"><b>{sel.size}</b> selected</span>
            <span className="bb-sep" />
            <button className="bb-btn" disabled={busy} onClick={() => runBulk('Published', (id) => setProductStatus(id, 'active'))}><CheckCircle2 size={15} /> Publish</button>
            <button className="bb-btn" disabled={busy} onClick={() => runBulk('Moved to draft', (id) => setProductStatus(id, 'draft'))}><FileEdit size={15} /> Draft</button>
            <button className="bb-btn" disabled={busy} onClick={() => runBulk('Archived', (id) => setProductStatus(id, 'archived'))}><Layers size={15} /> Archive</button>
            <span className="bb-sep" />
            <button
              className="bb-btn danger"
              disabled={busy}
              onClick={() => {
                if (confirm(`Delete ${sel.size} product${sel.size > 1 ? 's' : ''}? This cannot be undone.`)) {
                  runBulk('Deleted', deleteProduct);
                }
              }}
            >
              <Trash2 size={15} /> Delete
            </button>
            <button className="bb-close bb-btn" onClick={() => setSel(new Set())}><X size={15} /></button>
          </div>
        </div>
      )}

      {rows.length === 0 ? (
        <div style={{ minHeight: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--surface-sunken)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', marginBottom: 12 }}><Search size={22} /></div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>No products match these filters</div>
            <p style={{ margin: '5px 0 12px', color: 'var(--text-muted)', fontSize: 13 }}>Try widening the filter, or clear them all.</p>
            <Btn size="sm" onClick={resetAll}>Clear filters</Btn>
          </div>
        </div>
      ) : (
        <div className="table-wrap gr-scroll">
          <table className="table">
            <thead>
              <tr>
                <th className="col-check"><input type="checkbox" className="checkbox" checked={allOn} onChange={toggleAll} aria-label="Select all" /></th>
                <th>{nameLabel}</th>
                {shownCols.map((c) => <th key={c.key} className={c.num ? 'num' : ''}>{c.label}</th>)}
                <th className="num">Price</th>
                <th>Status</th>
                <th className="col-actions" />
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => {
                const on = sel.has(p.id);
                return (
                  <tr key={p.id} className={on ? 'sel' : ''}>
                    <td className="col-check" onClick={(e) => { e.stopPropagation(); toggle(p.id); }}>
                      <input type="checkbox" className="checkbox" checked={on} onChange={() => toggle(p.id)} aria-label={`Select ${p.name}`} />
                    </td>
                    <td>
                      <Link href={buildPath(`/admin/products/${p.id}`)} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                          {p.thumbnail
                            // eslint-disable-next-line @next/next/no-img-element
                            ? <img src={p.thumbnail} alt="" style={{ width: 34, height: 34, borderRadius: 8, objectFit: 'cover', flex: 'none' }} />
                            : <span style={{ width: 34, height: 34, borderRadius: 8, flex: 'none', background: `color-mix(in srgb, ${meta.hex} 30%, var(--surface-sunken))` }} />}
                          <div style={{ minWidth: 0 }}>
                            <div className="t-name" style={{ whiteSpace: 'nowrap' }}>{p.name}</div>
                            <div className="gr-num" style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>{p.sku || p.id.slice(0, 8)}</div>
                          </div>
                        </div>
                      </Link>
                    </td>
                    {shownCols.map((c) => optCell(c.key, p))}
                    <td className="num" style={{ fontWeight: 600, color: 'var(--text)' }}>
                      {p.price === 0 ? 'Free' : money(p.price)}
                      {p.compareAt != null && p.compareAt > p.price && (
                        <span style={{ marginLeft: 6, color: 'var(--text-muted)', textDecoration: 'line-through', fontWeight: 400 }}>{money(p.compareAt)}</span>
                      )}
                    </td>
                    <td><Badge tone={statusTone(p.status)}>{titleCase(p.status)}</Badge></td>
                    <td className="col-actions" onClick={(e) => e.stopPropagation()}>
                      <RowMenu
                        items={[
                          { icon: SettingsIcon, label: 'Configure', onClick: () => { window.location.href = buildPath(`/admin/products/${p.id}`); } },
                          { icon: ExternalLink, label: 'View product', onClick: () => window.open(`/products/${p.slug || p.id}`, '_blank') },
                          p.status === 'active'
                            ? { icon: FileEdit, label: 'Move to draft', onClick: () => setProductStatus(p.id, 'draft').then(onMutate).catch(() => toast.error('Update failed')) }
                            : { icon: CheckCircle2, label: 'Publish', onClick: () => setProductStatus(p.id, 'active').then(onMutate).catch(() => toast.error('Update failed')) },
                          { icon: Trash2, label: 'Delete', danger: true, onClick: () => { if (confirm(`Delete "${p.name}"?`)) deleteProduct(p.id).then(onMutate).catch(() => toast.error('Delete failed')); } },
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
    </>
  );
}
