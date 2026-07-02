'use client';

/**
 * Order tab — left column: fulfillment progress card (only when line-item steps
 * exist), the line items with per-item sub-fulfillment pills, and the totals.
 */

import React from 'react';
import { Check, Download, ShoppingBag } from 'lucide-react';
import { Eyebrow } from './orders-ui';
import { money } from './orders-model';
import type { DetailAttachment, DetailLineItem, DetailSubStep } from './order-detail';

function SubStepPill({ step, onToggle }: { readonly step: DetailSubStep; readonly onToggle: () => void }): React.ReactElement {
  const done = step.done;
  return (
    <button
      type="button"
      onClick={onToggle}
      title={done ? 'Mark not done' : 'Mark done'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 9px 4px 7px',
        cursor: 'pointer',
        font: 'inherit',
        border: `1px solid ${done ? 'transparent' : 'var(--line)'}`,
        background: done ? 'var(--sage-100)' : 'var(--surface-raised)',
        color: done ? 'var(--sage-ink)' : 'var(--text-secondary)',
        borderRadius: 999,
        fontSize: 11.5,
        fontWeight: 500,
      }}
    >
      <span
        style={{
          width: 14,
          height: 14,
          borderRadius: '50%',
          flex: 'none',
          border: `1.5px solid ${done ? 'var(--sage-500)' : 'var(--line-strong)'}`,
          background: done ? 'var(--sage-500)' : 'transparent',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {done && <Check size={9} strokeWidth={3} color="#fff" />}
      </span>
      <span>{step.label}</span>
      {step.hint && <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>· {step.hint}</span>}
    </button>
  );
}

function Attach({ att }: { readonly att: DetailAttachment }): React.ReactElement {
  return (
    <a
      href={att.url ?? '#'}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 7,
        padding: '4px 9px',
        background: 'var(--surface)',
        border: '1px solid var(--line)',
        borderRadius: 999,
        fontSize: 12,
        textDecoration: 'none',
        color: 'inherit',
      }}
    >
      <span className="gr-num" style={{ fontSize: 8.5, padding: '1px 5px', background: 'var(--ink-900)', color: 'var(--surface-raised)', borderRadius: 4 }}>{att.kind}</span>
      <span className="gr-num" style={{ fontSize: 11.5 }}>{att.name}</span>
      <span style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>{att.size}</span>
      <Download size={12} style={{ color: 'var(--link)' }} />
    </a>
  );
}

function LineItem({
  item,
  index,
  onToggleStep,
}: {
  readonly item: DetailLineItem;
  readonly index: number;
  readonly onToggleStep: (stepId: string) => void;
}): React.ReactElement {
  const doneCt = item.subSteps.filter((s) => s.done).length;
  const itDone = item.subSteps.length > 0 && doneCt === item.subSteps.length;

  return (
    <div
      className="gr-card"
      style={{ borderColor: 'var(--line)', padding: '14px 16px', marginBottom: 10, position: 'relative', overflow: 'hidden', opacity: itDone ? 0.92 : 1 }}
    >
      <span style={{ position: 'absolute', left: 0, top: 12, bottom: 12, width: 4, borderRadius: 999, background: itDone ? 'var(--sage-500)' : 'var(--line-strong)' }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, paddingLeft: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
            <span className="gr-num" style={{ fontSize: 10, color: 'var(--text-muted)' }}>#{index + 1}</span>
            <span style={{ fontWeight: 600, fontSize: 14 }}>{item.name}</span>
            {item.hasCustomWork && <span className="badge badge-clay" style={{ fontSize: 9.5 }}>Custom</span>}
            {itDone && <span className="badge badge-sage" style={{ fontSize: 9.5 }}>Ready</span>}
          </div>
          {item.sku && <div className="gr-num" style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{item.sku}</div>}
        </div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'baseline', flex: 'none' }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>qty {item.qty}</span>
          <span className="gr-num" style={{ fontSize: 13.5, fontWeight: 600 }}>{money(item.lineTotalCents)}</span>
        </div>
      </div>

      {item.configOptions && item.configOptions.length > 0 && (
        <div style={{ marginTop: 11, paddingTop: 11, borderTop: '1px solid var(--line-faint)', paddingLeft: 8 }}>
          <Eyebrow style={{ fontSize: 9 }}>Customer configuration</Eyebrow>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px 18px', marginTop: 6 }}>
            {item.configOptions.map((o) => (
              <div key={o.key} style={{ display: 'flex', gap: 8, fontSize: 12.5, padding: '2px 0' }}>
                <span className="gr-eyebrow" style={{ fontSize: 9, width: 78, flex: 'none' }}>{o.key}</span>
                <span>{o.value}</span>
              </div>
            ))}
          </div>
          {item.attachments && item.attachments.length > 0 && (
            <>
              <Eyebrow style={{ fontSize: 9, marginTop: 10, display: 'block' }}>Attachments · {item.attachments.length}</Eyebrow>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                {item.attachments.map((a) => <Attach key={a.id} att={a} />)}
              </div>
            </>
          )}
        </div>
      )}

      {item.subSteps.length > 0 && (
        <div style={{ marginTop: 11, paddingTop: 11, borderTop: '1px solid var(--line-faint)', paddingLeft: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
            <Eyebrow style={{ fontSize: 9 }}>Sub-fulfillment · check off as you go</Eyebrow>
            <span className="gr-num" style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>{doneCt} / {item.subSteps.length}</span>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            {item.subSteps.map((s) => (
              <SubStepPill key={s.id} step={s} onToggle={() => onToggleStep(s.id)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function OrderItemsPanel({
  items,
  totals,
  grandTotalCents,
  doneCount,
  totalSteps,
  hasSteps,
  onToggleStep,
}: {
  readonly items: readonly DetailLineItem[];
  readonly totals: readonly { readonly label: string; readonly cents: number }[];
  readonly grandTotalCents: number;
  readonly doneCount: number;
  readonly totalSteps: number;
  readonly hasSteps: boolean;
  readonly onToggleStep: (itemId: string, stepId: string) => Promise<void>;
}): React.ReactElement {
  const allDone = hasSteps && doneCount === totalSteps;

  return (
    <>
      {hasSteps && (
        <div className="gr-card" style={{ padding: '13px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
            <Eyebrow>Fulfillment</Eyebrow>
            <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.01em' }}>
              {doneCount}
              <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--text-muted)' }}> / {totalSteps} sub-tasks</span>
            </span>
            <span style={{ marginLeft: 'auto', fontSize: 12, color: allDone ? 'var(--sage-700)' : 'var(--text-muted)', fontWeight: allDone ? 600 : 400 }}>
              {allDone ? 'all complete — ready to ship' : 'ready to ship when all complete'}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 4, marginTop: 9 }}>
            {items.map((it) => (
              <div key={it.id} style={{ flex: Math.max(it.subSteps.length, 1), display: 'flex', gap: 2 }}>
                {it.subSteps.map((s) => (
                  <div key={s.id} style={{ flex: 1, height: 7, borderRadius: 2, background: s.done ? 'var(--sage-500)' : 'var(--surface-sunken)' }} />
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 9, paddingBottom: 8, marginBottom: 10, borderBottom: '1px solid var(--line)' }}>
          <ShoppingBag size={15} style={{ color: 'var(--clay-600)', alignSelf: 'center' }} />
          <span style={{ fontWeight: 600, fontSize: 14 }}>Line items</span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>· {items.length} item{items.length === 1 ? '' : 's'}</span>
        </div>
        {items.map((it, i) => (
          <LineItem key={it.id} item={it} index={i} onToggleStep={(stepId) => void onToggleStep(it.id, stepId)} />
        ))}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr minmax(0, 300px)', marginTop: 4 }}>
          <div />
          <div className="gr-card" style={{ padding: '14px 16px' }}>
            {totals.map((t) => (
              <div key={t.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--line-faint)', fontSize: 12.5 }}>
                <span style={{ color: 'var(--text-secondary)' }}>{t.label}</span>
                <span className="gr-num">{money(t.cents)}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '9px 0 0' }}>
              <span style={{ fontWeight: 600 }}>Total</span>
              <span className="gr-num" style={{ fontSize: 19, fontWeight: 700, color: 'var(--clay-700)' }}>{money(grandTotalCents)}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
