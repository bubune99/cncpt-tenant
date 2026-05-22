'use client';

/**
 * Atlas Analytics — F4 Query Builder
 *
 * Schema browser (left) · query canvas with zones (center) · result + save (right).
 * Zones: From / Metric / Group by / Filters. SQL preview auto-generates.
 * Real React state — fields can be toggled and filters removed.
 */

import React, { useState } from 'react';
import { DEMO_DATA } from '@/lib/cms/analytics/demo-data';

// ─── Schema definition ────────────────────────────────────────────────────────

interface SchemaField {
  readonly name: string;
  readonly type: 'dim' | 'met' | 'tim' | 'txt' | 'bool';
  readonly note?: string;
}

interface SchemaTableDef {
  readonly name: string;
  readonly rowCount: string;
  readonly fields: readonly SchemaField[];
}

const SCHEMA_TABLES: readonly SchemaTableDef[] = [
  {
    name: 'orders',
    rowCount: '4,820 rows',
    fields: [
      { name: 'id',          type: 'dim',  note: 'PK'     },
      { name: 'created_at',  type: 'tim',  note: 'used 8×' },
      { name: 'total_cents', type: 'met',  note: 'used 14×'},
      { name: 'tax_cents',   type: 'met'   },
      { name: 'shipping_cents', type: 'met' },
      { name: 'customer_id', type: 'dim'   },
      { name: 'status',      type: 'txt',  note: 'enum'   },
      { name: 'channel',     type: 'txt'   },
      { name: 'currency',    type: 'txt'   },
      { name: 'test',        type: 'bool'  },
    ],
  },
  { name: 'order_items', rowCount: '8 cols',          fields: [] },
  { name: 'products',    rowCount: '22 cols · 142 rows', fields: [] },
  { name: 'variants',    rowCount: '11 cols · 318 rows', fields: [] },
  { name: 'customers',   rowCount: '9 cols · 2,184 rows', fields: [] },
  { name: 'sessions',    rowCount: '15 cols · 12,402 rows', fields: [] },
  { name: 'page_views',  rowCount: '7 cols · 89k rows', fields: [] },
];

// ─── Filter type ──────────────────────────────────────────────────────────────

interface FilterRow {
  readonly field: string;
  readonly op: string;
  readonly value: string;
}

const DEFAULT_FILTERS: FilterRow[] = [
  { field: 'orders.created_at', op: '≥', value: 'now() − 30d' },
  { field: 'orders.status',     op: '=', value: "'paid'"        },
  { field: 'orders.test',       op: '=', value: 'false'         },
];

// ─── SQL generator ────────────────────────────────────────────────────────────

function buildSQL(filters: FilterRow[]): React.ReactNode {
  return (
    <>
      <span className="at-sql-cmt">-- revenue_daily · auto-generated</span>{'\n'}
      <span className="at-sql-kw">SELECT</span>{'\n'}
      {'  '}<span className="at-sql-fn">date_trunc</span>(<span className="at-sql-str">&apos;day&apos;</span>, orders.created_at) <span className="at-sql-kw">AS</span> day,{'\n'}
      {'  '}<span className="at-sql-fn">SUM</span>(orders.total_cents) / 100.0 <span className="at-sql-kw">AS</span> revenue{'\n'}
      <span className="at-sql-kw">FROM</span> orders{'\n'}
      {filters.length > 0 && (
        <>
          <span className="at-sql-kw">WHERE</span>{' '}
          {filters.map((f, i) => (
            <React.Fragment key={i}>
              {i > 0 && <><br />{'  '}<span className="at-sql-kw">AND</span> </>}
              {f.field} <span className="at-sql-kw">{f.op}</span> <span className="at-sql-str">{f.value}</span>
            </React.Fragment>
          ))}
          {'\n'}
        </>
      )}
      <span className="at-sql-kw">GROUP BY</span> 1 <span className="at-sql-kw">ORDER BY</span> 1
    </>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export interface QueryBuilderProps {
  onSave: () => void;
  onBack: () => void;
}

export function QueryBuilder({ onSave, onBack }: QueryBuilderProps) {
  const [openTable, setOpenTable] = useState<string>('orders');
  const [filters, setFilters] = useState<FilterRow[]>(DEFAULT_FILTERS);

  const removeFilter = (i: number) => {
    setFilters((prev) => prev.filter((_, idx) => idx !== i));
  };

  return (
    <div className="at-qb-wrap">
      {/* LEFT — schema browser */}
      <div className="at-qb-col">
        <div className="at-sec">
          <span className="at-sec-h">Schema</span>
          <span className="at-sec-meta">· storefront · 14 tables</span>
          <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-geist-mono, monospace)', fontSize: 10, color: 'var(--at-ink-soft)' }}>+ join</span>
        </div>
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', fontSize: 12.5 }}>
          {SCHEMA_TABLES.map((tbl) => {
            const isOpen = openTable === tbl.name;
            return (
              <div key={tbl.name} className={`at-schema-table${isOpen ? ' open' : ''}`}>
                <div
                  className="at-schema-head"
                  onClick={() => setOpenTable(isOpen ? '' : tbl.name)}
                >
                  <span style={{ color: isOpen ? 'var(--at-accent)' : undefined }}>
                    {isOpen ? '▾' : '▸'}
                  </span>
                  {tbl.name}
                  <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-geist-mono, monospace)', fontSize: 9.5, color: 'var(--at-ink-faint)', letterSpacing: '.04em' }}>
                    {tbl.rowCount}
                  </span>
                </div>
                {isOpen && tbl.fields.length > 0 && (
                  <div className="at-schema-cols">
                    {tbl.fields.map((f) => (
                      <div key={f.name} className="at-schema-col">
                        <span className={`at-col-tag ${f.type}`}>{
                          f.type === 'met' ? 'Σ' :
                          f.type === 'dim' ? '#' :
                          f.type === 'tim' ? 't' :
                          f.type === 'txt' ? 'A' :
                          'Y'
                        }</span>
                        <span>{f.name}</span>
                        {f.note && (
                          <span style={{ color: 'var(--at-ink-faint)', fontSize: 9.5, letterSpacing: '.04em' }}>{f.note}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* CENTER — query canvas + SQL */}
      <div className="at-qb-col">
        <div className="at-sec">
          <span className="at-sec-h">Query · revenue_daily</span>
          <span className="at-sec-meta">· drag fields into a role · order matters</span>
        </div>
        <div className="at-qb-canvas">
          {/* From */}
          <div className="at-qb-zone">
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
              <span className="at-qb-zone-h">From</span>
              <span style={{ fontFamily: 'var(--font-display, Spectral, serif)', fontStyle: 'italic', fontSize: 11, color: 'var(--at-ink-soft)' }}>primary table</span>
            </div>
            <span className="at-field-chip">
              <span className="at-chip-tag" style={{ background: 'var(--at-ink)' }}>T</span>
              orders
              <span style={{ color: 'var(--at-ink-faint)', cursor: 'pointer' }}>▾</span>
            </span>
            <span className="at-field-chip dash">+ join</span>
          </div>

          {/* Metric */}
          <div className="at-qb-zone">
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
              <span className="at-qb-zone-h">Metric · Σ</span>
              <span style={{ fontFamily: 'var(--font-display, Spectral, serif)', fontStyle: 'italic', fontSize: 11, color: 'var(--at-ink-soft)' }}>numeric · aggregated</span>
            </div>
            <span className="at-field-chip">
              <span className="at-chip-tag met">Σ</span>
              <span style={{ fontFamily: 'var(--font-geist-mono, monospace)' }}>SUM</span>
              <span style={{ color: 'var(--at-ink-soft)' }}>(</span>
              orders.total_cents
              <span style={{ color: 'var(--at-ink-soft)' }}>) / 100</span>
              <span style={{ color: 'var(--at-ink-faint)', cursor: 'pointer' }}>▾</span>
            </span>
            <span className="at-field-chip dash">+ metric</span>
          </div>

          {/* Group by */}
          <div className="at-qb-zone">
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
              <span className="at-qb-zone-h">Group by · ▭</span>
              <span style={{ fontFamily: 'var(--font-display, Spectral, serif)', fontStyle: 'italic', fontSize: 11, color: 'var(--at-ink-soft)' }}>becomes x-axis · time or category</span>
            </div>
            <span className="at-field-chip">
              <span className="at-chip-tag dim">▭</span>
              <span style={{ fontFamily: 'var(--font-geist-mono, monospace)' }}>date_trunc</span>
              <span style={{ color: 'var(--at-ink-soft)' }}>&apos;day&apos;,</span>
              orders.created_at
              <span style={{ color: 'var(--at-ink-soft)' }}>)</span>
              <span style={{ color: 'var(--at-ink-faint)', cursor: 'pointer' }}>▾</span>
            </span>
            <span className="at-field-chip dash">+ breakdown</span>
          </div>

          {/* Filters */}
          <div className="at-qb-zone">
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
              <span className="at-qb-zone-h">Filters · ⚑</span>
              <span style={{ fontFamily: 'var(--font-display, Spectral, serif)', fontStyle: 'italic', fontSize: 11, color: 'var(--at-ink-soft)' }}>applied before aggregation</span>
            </div>
            {filters.map((f, i) => (
              <div key={i} className="at-filter-row">
                <span className="at-filter-ctrl">{f.field}</span>
                <span className="at-filter-op">{f.op}</span>
                <span className="at-filter-ctrl">{f.value}</span>
                <button
                  onClick={() => removeFilter(i)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--at-ink-faint)', fontFamily: 'var(--font-geist-mono, monospace)', fontSize: 11, textAlign: 'center' }}
                >
                  ×
                </button>
              </div>
            ))}
            <span className="at-field-chip dash" style={{ marginTop: 4 }}>+ filter</span>
          </div>

          {/* SQL preview */}
          <div className="at-sql-card">
            {buildSQL(filters)}
          </div>
        </div>
      </div>

      {/* RIGHT — result preview + save */}
      <div className="at-qb-col">
        <div className="at-sec">
          <span className="at-sec-h">Result</span>
          <span className="at-sec-meta">· 30 rows · 28ms</span>
          <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-geist-mono, monospace)', fontSize: 10, color: 'var(--at-ink-soft)' }}>↓ export · cache</span>
        </div>
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', border: '1px solid var(--at-rule)', borderRadius: 'var(--at-r-sm)', background: 'var(--at-paper)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '6px 10px', fontFamily: 'var(--font-geist-mono, monospace)', fontSize: 9.5, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--at-ink-soft)', background: 'var(--at-paper-3)', borderBottom: '1px solid var(--at-ink)', position: 'sticky', top: 0 }}>day</th>
                <th style={{ textAlign: 'right', padding: '6px 10px', fontFamily: 'var(--font-geist-mono, monospace)', fontSize: 9.5, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--at-ink-soft)', background: 'var(--at-paper-3)', borderBottom: '1px solid var(--at-ink)', position: 'sticky', top: 0 }}>revenue</th>
              </tr>
            </thead>
            <tbody>
              {DEMO_DATA.revenue30.map((v, i) => (
                <tr key={i}>
                  <td style={{ padding: '4px 10px', fontFamily: 'var(--font-geist-mono, monospace)', fontSize: 10.5, color: 'var(--at-ink-soft)', borderBottom: '1px solid var(--at-rule-soft)' }}>
                    {DEMO_DATA.days[i]}
                  </td>
                  <td style={{ padding: '4px 10px', textAlign: 'right', fontFamily: 'var(--font-geist-mono, monospace)', fontSize: 11, borderBottom: '1px solid var(--at-rule-soft)' }}>
                    ${v}.00
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Save as data source */}
        <div style={{ marginTop: 12, padding: 12, background: 'var(--at-paper-2)', border: '1px solid var(--at-rule)', borderRadius: 'var(--at-r-sm)', flexShrink: 0 }}>
          <div className="at-eyebrow-ink" style={{ marginBottom: 4 }}>Save as data source</div>
          <div className="at-fig" style={{ fontSize: 12, marginBottom: 8, lineHeight: 1.4 }}>
            Save this query as a reusable source. Any widget can subscribe; updates propagate.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: 10, alignItems: 'baseline', padding: '5px 0', borderBottom: '1px solid var(--at-rule-soft)' }}>
            <span style={{ fontFamily: 'var(--font-geist-mono, monospace)', fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--at-ink-soft)' }}>name</span>
            <span style={{ fontFamily: 'var(--font-geist-mono, monospace)', fontSize: 12 }}>revenue_daily</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: 10, alignItems: 'baseline', padding: '5px 0', borderBottom: '1px solid var(--at-rule-soft)' }}>
            <span style={{ fontFamily: 'var(--font-geist-mono, monospace)', fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--at-ink-soft)' }}>cache</span>
            <span style={{ fontSize: 13 }}>5 min · refresh on dashboard load</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: 10, alignItems: 'baseline', padding: '5px 0' }}>
            <span style={{ fontFamily: 'var(--font-geist-mono, monospace)', fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--at-ink-soft)' }}>used by</span>
            <span style={{ color: 'var(--at-accent)', fontSize: 12.5 }}>3 widgets · 1 alert</span>
          </div>
          <button className="at-btn at-btn-accent" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }} onClick={onSave}>
            <span className="at-kbd">⌘S</span> Save data source
          </button>
        </div>
      </div>
    </div>
  );
}
