/**
 * OrderEditor — Atlas A2
 *
 * Per-line-item sub-fulfillment checkoffs (Pick → Prepare → Customize → Pack),
 * configurable items with attachments, aggregate progress strip, Ship disabled
 * until all sub-tasks complete.
 *
 * Port of atlas-editors-order.jsx (rev 2).
 * Uses only Phase-0 atlas.css + local editor.css classes and --wl-* tokens.
 */

'use client';

import React, { useCallback, useState, useTransition } from 'react';
import Link from 'next/link';
import './editor.css';
import {
  Crumbs,
  EditorTabs,
  Sec,
  SaveBar,
  FieldRow,
  Pill,
  Avatar,
  TimelineItem,
} from './EditorPrimitives';

// ── Types ────────────────────────────────────────────────────────────────────

export type SubStepState = 'done' | 'active' | 'pending';

export interface SubStep {
  readonly id: string;
  readonly label: string;
  readonly state: SubStepState;
  readonly hint?: string;
}

export interface OrderAttachment {
  readonly id: string;
  readonly name: string;
  readonly size: string;
  readonly kind: string;
  readonly url?: string;
}

export interface ConfigOption {
  readonly key: string;
  readonly value: string;
}

export interface OrderLineItem {
  readonly id: string;
  readonly sku: string;
  readonly name: string;
  readonly qty: number;
  readonly unitPrice: string;
  readonly lineTotal: string;
  readonly colorHex?: string;
  readonly kind: 'CONFIGURABLE' | 'STANDARD';
  readonly configOptions?: readonly ConfigOption[];
  readonly attachments?: readonly OrderAttachment[];
  readonly customerNote?: string;
  readonly subSteps: readonly SubStep[];
  readonly flag?: string;
}

export interface OrderTotalLine {
  readonly label: string;
  readonly value: string;
}

export interface OrderCustomer {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly phone?: string;
  readonly initials: string;
  readonly avatarBg?: string;
  readonly since?: string;
  readonly orderCount?: number;
  readonly ltv?: string;
  readonly lifecycle?: 'lead' | 'first' | 'repeat' | 'loyal' | 'vip';
}

export interface OrderShipping {
  readonly addressLines: readonly string[];
  readonly verified?: boolean;
  readonly carrier?: string;
  readonly eta?: string;
  readonly labelGenerated?: boolean;
}

export interface OrderNote {
  readonly author: string;
  readonly time: string;
  readonly body: string;
}

export interface OrderTag {
  readonly label: string;
  readonly variant?: 'out' | 'out-accent';
}

export interface OrderData {
  readonly id: string;
  readonly orderNumber: string;
  readonly placedAt: string;
  readonly customer: OrderCustomer;
  readonly items: readonly OrderLineItem[];
  readonly totals: readonly OrderTotalLine[];
  readonly grandTotal: string;
  readonly paymentCapture?: string;
  readonly status: string;
  readonly paymentStatus: string;
  readonly hasCustomWork: boolean;
  readonly shipping: OrderShipping;
  readonly notes: readonly OrderNote[];
  readonly tags: readonly OrderTag[];
}

export interface OrderEditorProps {
  readonly order: OrderData;
  readonly subdomain: string;
  readonly onStepToggle: (itemId: string, stepId: string) => Promise<void>;
  readonly onNoteAdd?: (note: string) => Promise<void>;
  readonly onShip?: () => Promise<void>;
}

// ── Sub-step pill ─────────────────────────────────────────────────────────────

interface SubStepPillProps {
  readonly step: SubStep;
  readonly onToggle: () => void;
}

function SubStepPill({ step, onToggle }: SubStepPillProps): React.ReactElement {
  const isDone = step.state === 'done';
  const isActive = step.state === 'active';

  return (
    <span
      onClick={onToggle}
      className="sub-step"
      style={{
        border: `1px solid ${isDone ? 'var(--ink)' : isActive ? 'var(--accent)' : 'var(--rule)'}`,
        background: isDone ? 'var(--ink)' : isActive ? 'var(--paper)' : 'transparent',
        color: isDone ? 'var(--paper)' : isActive ? 'var(--accent)' : 'var(--ink-soft)',
        cursor: 'pointer',
      }}
    >
      <span
        className="sub-step-check"
        style={{
          border: `1px solid ${isDone ? 'var(--paper)' : isActive ? 'var(--accent)' : 'var(--rule)'}`,
          background: isDone ? 'var(--paper)' : 'transparent',
          color: isDone ? 'var(--ink)' : 'transparent',
        }}
      >
        {isDone ? '✓' : ''}
      </span>
      <span style={{ textTransform: 'uppercase' }}>{step.label}</span>
      {step.hint && (
        <span
          style={{
            fontStyle: 'italic',
            textTransform: 'none',
            fontFamily: 'var(--font-display), Spectral, serif',
            opacity: 0.8,
            marginLeft: 2,
          }}
        >
          {step.hint}
        </span>
      )}
    </span>
  );
}

// ── Attachment pill ───────────────────────────────────────────────────────────

function AttachPill({ attach }: { readonly attach: OrderAttachment }): React.ReactElement {
  return (
    <a
      href={attach.url ?? '#'}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '3px 8px',
        background: 'var(--paper)',
        border: '1px solid var(--rule)',
        borderRadius: 'var(--r-sm)',
        fontSize: 11,
        textDecoration: 'none',
        color: 'inherit',
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-geist-mono), monospace',
          fontSize: 8,
          padding: '1px 4px',
          background: 'var(--ink)',
          color: 'var(--paper)',
          letterSpacing: '0.05em',
        }}
      >
        {attach.kind}
      </span>
      <span className="mono" style={{ fontSize: 11 }}>{attach.name}</span>
      <span className="fig" style={{ fontSize: 10 }}>{attach.size}</span>
      <span style={{ color: 'var(--accent)', fontSize: 10, marginLeft: 2 }}>↓</span>
    </a>
  );
}

// ── Line item card ────────────────────────────────────────────────────────────

interface LineItemCardProps {
  readonly item: OrderLineItem;
  readonly index: number;
  readonly onStepToggle: (stepId: string) => void;
}

function LineItemCard({ item, index, onStepToggle }: LineItemCardProps): React.ReactElement {
  const doneCount = item.subSteps.filter((s) => s.state === 'done').length;
  const isFullyDone = doneCount === item.subSteps.length;
  const isActive = item.subSteps.some((s) => s.state === 'active');

  return (
    <div
      style={{
        border: `1px solid ${isActive ? 'var(--accent)' : 'var(--rule)'}`,
        borderLeft: `3px solid ${isFullyDone ? 'var(--moss)' : isActive ? 'var(--accent)' : 'var(--ink)'}`,
        background: isFullyDone ? 'var(--paper-2)' : 'var(--paper)',
        borderRadius: 'var(--r-sm)',
        padding: '12px 14px',
        marginBottom: 8,
        opacity: isFullyDone ? 0.82 : 1,
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <span
          style={{
            display: 'inline-block',
            width: 36,
            height: 36,
            background: item.colorHex ?? 'var(--rule)',
            border: '1px solid var(--rule)',
            borderRadius: 'var(--r-sm)',
            flexShrink: 0,
            marginTop: 2,
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span className="mono" style={{ fontSize: 10, color: 'var(--ink-faint)', letterSpacing: '0.1em' }}>
              #{index + 1}
            </span>
            <span className="name" style={{ fontSize: 14 }}>{item.name}</span>
            <Pill
              variant={item.kind === 'CONFIGURABLE' ? 'solid-accent' : 'out'}
              style={{ fontSize: 9 }}
            >
              {item.kind}
            </Pill>
            {isFullyDone && <Pill variant="solid-moss" style={{ fontSize: 9 }}>✓ READY</Pill>}
          </div>
          <div className="mono" style={{ fontSize: 11, color: 'var(--ink-soft)', marginTop: 2 }}>{item.sku}</div>
        </div>
        <div style={{ display: 'flex', gap: 18, alignItems: 'baseline', flexShrink: 0 }}>
          <span className="fig" style={{ fontSize: 12 }}>qty {item.qty}</span>
          <span className="mono" style={{ fontSize: 13 }}>{item.lineTotal}</span>
        </div>
      </div>

      {/* Flag */}
      {item.flag && (
        <div
          className="mono"
          style={{ fontSize: 10, color: 'var(--accent)', letterSpacing: '0.05em', marginTop: 6, paddingLeft: 48 }}
        >
          ⚑ {item.flag}
        </div>
      )}

      {/* Configuration */}
      {item.kind === 'CONFIGURABLE' && item.configOptions && item.configOptions.length > 0 && (
        <div
          style={{
            marginTop: 10,
            paddingTop: 10,
            borderTop: '1px solid var(--rule-soft)',
            paddingLeft: 48,
          }}
        >
          <div className="eyebrow-ink" style={{ fontSize: 9, marginBottom: 4 }}>Customer configuration</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '2px 16px' }}>
            {item.configOptions.map(({ key, value }) => (
              <div key={key} style={{ display: 'flex', gap: 8, fontSize: 12, padding: '2px 0' }}>
                <span
                  className="mono"
                  style={{
                    fontSize: 10,
                    color: 'var(--ink-soft)',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    width: 80,
                    flexShrink: 0,
                  }}
                >
                  {key}
                </span>
                <span>{value}</span>
              </div>
            ))}
          </div>

          {item.attachments && item.attachments.length > 0 && (
            <>
              <div className="eyebrow-ink" style={{ fontSize: 9, marginTop: 8, marginBottom: 4 }}>
                Attachments · {item.attachments.length}
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {item.attachments.map((a) => <AttachPill key={a.id} attach={a} />)}
              </div>
            </>
          )}

          {item.customerNote && (
            <div
              style={{
                marginTop: 8,
                padding: '6px 8px',
                background: 'var(--paper-2)',
                borderLeft: '2px solid var(--accent)',
                fontSize: 12,
                fontStyle: 'italic',
                fontFamily: 'var(--font-display), Spectral, serif',
                color: 'var(--ink-soft)',
              }}
            >
              {item.customerNote}
            </div>
          )}
        </div>
      )}

      {/* Sub-fulfillment steps */}
      <div
        style={{
          marginTop: 10,
          paddingTop: 10,
          borderTop: '1px solid var(--rule-soft)',
          paddingLeft: 48,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 6,
          }}
        >
          <span className="eyebrow-ink" style={{ fontSize: 9 }}>
            Sub-fulfillment · check off as you complete
          </span>
          <span className="mono" style={{ fontSize: 10, color: 'var(--ink-soft)' }}>
            {doneCount} / {item.subSteps.length}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          {item.subSteps.map((step) => (
            <SubStepPill
              key={step.id}
              step={step}
              onToggle={() => onStepToggle(step.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Aggregate progress strip ──────────────────────────────────────────────────

interface ProgressStripProps {
  readonly items: readonly OrderLineItem[];
  readonly doneCount: number;
  readonly totalCount: number;
}

function ProgressStrip({ items, doneCount, totalCount }: ProgressStripProps): React.ReactElement {
  return (
    <div
      style={{
        border: '1px solid var(--ink)',
        borderRadius: 'var(--r-sm)',
        padding: '10px 14px',
        background: 'var(--paper-2)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
        <span className="eyebrow-ink">Fulfillment</span>
        <span className="display" style={{ fontSize: 22, lineHeight: 1 }}>
          {doneCount}
          <span className="fig" style={{ fontSize: 14 }}> / {totalCount} sub-tasks</span>
        </span>
        <span className="fig" style={{ fontSize: 12, marginLeft: 'auto' }}>
          ready to ship when all complete
        </span>
      </div>
      {/* Segmented bar */}
      <div style={{ display: 'flex', gap: 3, marginTop: 8 }}>
        {items.map((item, i) => (
          <div key={i} style={{ flex: item.subSteps.length, display: 'flex', gap: 2 }}>
            {item.subSteps.map((s, j) => (
              <div
                key={j}
                style={{
                  flex: 1,
                  height: 6,
                  background:
                    s.state === 'done'
                      ? 'var(--ink)'
                      : s.state === 'active'
                      ? 'var(--accent)'
                      : 'var(--rule)',
                }}
              />
            ))}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 0, marginTop: 4 }}>
        {items.map((item, i) => (
          <div
            key={i}
            style={{
              flex: item.subSteps.length,
              fontFamily: 'var(--font-geist-mono), monospace',
              fontSize: 9,
              letterSpacing: '0.05em',
              color: 'var(--ink-soft)',
            }}
          >
            item {i + 1} ·{' '}
            {item.subSteps.filter((s) => s.state === 'done').length}/{item.subSteps.length}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function OrderEditor({
  order: initialOrder,
  subdomain,
  onStepToggle,
  onNoteAdd,
  onShip,
}: OrderEditorProps): React.ReactElement {
  const [order, setOrder] = useState(initialOrder);
  const [isPending, startTransition] = useTransition();
  const [newNote, setNewNote] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);

  const allSteps = order.items.flatMap((it) => it.subSteps);
  const doneCount = allSteps.filter((s) => s.state === 'done').length;
  const totalCount = allSteps.length;
  const allDone = doneCount === totalCount;

  const handleStepToggle = useCallback((itemId: string, stepId: string) => {
    // Capture pre-toggle snapshot for revert on failure
    const snapshot = order;

    // Optimistic update
    setOrder((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id !== itemId
          ? item
          : {
              ...item,
              subSteps: item.subSteps.map((step) =>
                step.id !== stepId
                  ? step
                  : { ...step, state: step.state === 'done' ? ('pending' as const) : ('done' as const) }
              ),
            }
      ),
    }));

    startTransition(async () => {
      try {
        await onStepToggle(itemId, stepId);
      } catch {
        // Revert to pre-toggle snapshot on failure
        setOrder(snapshot);
      }
    });
  }, [onStepToggle, order]);

  const handleAddNote = () => {
    if (!newNote.trim() || !onNoteAdd) return;
    startTransition(async () => {
      await onNoteAdd(newNote.trim());
      setNewNote('');
      setShowNoteInput(false);
    });
  };

  const tabs = [
    { label: 'Order', active: true },
    { label: 'Fulfillment', count: doneCount },
    { label: 'Customer' },
    { label: 'Notes', count: order.notes.length },
    { label: 'Timeline', count: 12 },
  ];

  return (
    <div
      className="atlas"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        padding: '0 32px 18px',
      }}
    >
      <Crumbs
        items={[
          { label: 'CMS' },
          { label: 'Orders', href: '/admin/orders' },
          { label: order.orderNumber },
        ]}
      />

      {/* Editor masthead */}
      <div className="editor-head">
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="eyebrow">
            Order · placed {order.placedAt} · includes {order.hasCustomWork ? 'custom work' : 'standard items'}
          </div>
          <h1>
            <span className="mono accent" style={{ fontSize: 30, fontWeight: 400, marginRight: 12 }}>
              {order.orderNumber}
            </span>
            {order.customer.name.split(' ').slice(0, -1).join(' ')}{' '}
            <span className="display-i">{order.customer.name.split(' ').slice(-1)[0]}</span>
          </h1>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginTop: 8 }}>
            <Pill variant="solid-accent">IN PROGRESS</Pill>
            <Pill variant="solid-moss">PAID · {order.grandTotal}</Pill>
            {order.hasCustomWork && (
              <Pill variant="out-accent">⚑ HAS CUSTOM WORK</Pill>
            )}
            <span className="fig" style={{ fontSize: 13 }}>
              {order.items.length} items · {order.items.filter((it) => it.subSteps.every((s) => s.state === 'done')).length} of {order.items.length} fully packed ·
              ships {order.shipping.addressLines[order.shipping.addressLines.length - 1] ?? ''}
            </span>
          </div>
        </div>
        <div className="actions">
          <button className="btn">
            <span className="kbd">P</span>Print all slips
          </button>
          <button className="btn">
            <span className="kbd">S</span>Split shipment
          </button>
          <button
            className="btn btn-accent"
            disabled={!allDone || isPending}
            style={{ opacity: allDone ? 1 : 0.5 }}
            onClick={() => allDone && onShip && startTransition(async () => { await onShip(); })}
          >
            <span className="kbd">↵</span>
            {allDone ? 'Ship order' : 'Ship · waiting'}
          </button>
        </div>
      </div>

      <EditorTabs
        items={tabs}
        right={
          <>
            <span>placed {order.placedAt}</span>
            {order.hasCustomWork && <span>· custom work</span>}
          </>
        }
      />

      {/* Two-column body */}
      <div className="editor-body" style={{ flex: 1, overflow: 'hidden' }}>
        {/* LEFT — items with sub-fulfillment */}
        <div className="editor-col" style={{ overflow: 'auto', paddingRight: 4 }}>
          {/* Aggregate progress */}
          <ProgressStrip items={order.items} doneCount={doneCount} totalCount={totalCount} />

          {/* Line items */}
          <div>
            <Sec
              n="§1"
              h="Line items"
              meta={`${order.items.length} items · check off as you go`}
              right={
                <span>
                  <span className="mono" style={{ background: 'var(--ink)', color: 'var(--paper)', padding: '1px 5px', marginRight: 4 }}>
                    +
                  </span>
                  add line
                </span>
              }
            />
            {order.items.map((item, idx) => (
              <LineItemCard
                key={item.id}
                item={item}
                index={idx}
                onStepToggle={(stepId) => handleStepToggle(item.id, stepId)}
              />
            ))}
          </div>

          {/* Totals */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', marginTop: 4 }}>
            <div />
            <div>
              {order.totals.map(({ label, value }) => (
                <div
                  key={label}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '4px 0',
                    borderBottom: '1px solid var(--rule-soft)',
                    fontSize: 13,
                  }}
                >
                  <span style={{ color: 'var(--ink-soft)' }}>{label}</span>
                  <span className="mono num">{value}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0 0', fontSize: 14, fontWeight: 500 }}>
                <span>Total</span>
                <span className="mono accent" style={{ fontSize: 18 }}>{order.grandTotal}</span>
              </div>
              {order.paymentCapture && (
                <div className="fig" style={{ fontSize: 12, textAlign: 'right' }}>{order.paymentCapture}</div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT — customer + shipping + notes + tags */}
        <div className="editor-col" style={{ overflow: 'auto' }}>
          {/* Customer */}
          <div>
            <Sec
              h="Customer"
              right={
                <Link href={`/admin/customers/${order.customer.id}`} style={{ color: 'var(--accent)' }}>
                  open dossier →
                </Link>
              }
            />
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
              <Avatar
                initials={order.customer.initials}
                size={38}
                bg={order.customer.avatarBg ?? '#c8443a'}
                fontSize={13}
              />
              <div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{order.customer.name}</div>
                <div className="mono" style={{ fontSize: 11, color: 'var(--ink-soft)' }}>{order.customer.email}</div>
              </div>
              {order.customer.lifecycle && (
                <Pill variant="solid-moss" style={{ marginLeft: 'auto' }}>
                  {order.customer.lifecycle.toUpperCase()}
                </Pill>
              )}
            </div>
            {order.customer.since && (
              <FieldRow label="since"><span>{order.customer.since}</span></FieldRow>
            )}
            {order.customer.orderCount != null && (
              <FieldRow label="orders">
                <span>{order.customer.orderCount} orders total</span>
              </FieldRow>
            )}
            {order.customer.ltv && (
              <FieldRow label="ltv">
                <span className="accent" style={{ fontWeight: 500 }}>{order.customer.ltv}</span>
              </FieldRow>
            )}
            {order.customer.phone && (
              <FieldRow label="phone">
                <span className="mono">{order.customer.phone}</span>
              </FieldRow>
            )}
          </div>

          {/* Ship to */}
          <div>
            <Sec
              h="Ship to"
              right={<a href="#" style={{ color: 'var(--accent)', fontSize: 11 }}>edit</a>}
            />
            <div style={{ fontSize: 13, lineHeight: 1.5 }}>
              {order.shipping.addressLines.map((line, i) => (
                <React.Fragment key={i}>{line}<br /></React.Fragment>
              ))}
            </div>
            {order.shipping.verified && (
              <div className="fig" style={{ fontSize: 12, marginTop: 6 }}>verified · USPS deliverable</div>
            )}
          </div>

          {/* Shipping method */}
          <div>
            <Sec h="Shipping method" />
            {order.shipping.carrier && (
              <FieldRow label="carrier"><span>{order.shipping.carrier}</span></FieldRow>
            )}
            {order.shipping.eta && (
              <FieldRow label="eta"><span>{order.shipping.eta}</span></FieldRow>
            )}
            <FieldRow label="label">
              <span className="fig">{order.shipping.labelGenerated ? 'generated' : '— not generated yet —'}</span>
            </FieldRow>
            <div style={{ marginTop: 6 }}>
              <button className="btn btn-sm" disabled={!allDone} style={{ opacity: allDone ? 1 : 0.5 }}>
                {order.shipping.labelGenerated ? 'Reprint label' : 'Generate label (ship when ready)'}
              </button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <Sec
              h="Notes"
              right={
                <button
                  className="btn btn-sm"
                  style={{ border: 'none', color: 'var(--accent)', cursor: 'pointer', background: 'transparent' }}
                  onClick={() => setShowNoteInput((v) => !v)}
                >
                  + note
                </button>
              }
            />
            {showNoteInput && (
              <div style={{ marginBottom: 8 }}>
                <textarea
                  className="input-row"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add an internal note…"
                  rows={3}
                  style={{ width: '100%', padding: '6px 8px', background: 'var(--paper-2)', border: '1px solid var(--rule)', borderRadius: 'var(--r-sm)', fontSize: 12, resize: 'vertical' }}
                />
                <button className="btn btn-sm btn-accent" onClick={handleAddNote} disabled={isPending}>
                  Save note
                </button>
              </div>
            )}
            {order.notes.map((note, i) => (
              <div key={i} className="block" style={{ padding: '8px 10px', marginBottom: 6 }}>
                <div className="b-head">
                  <span className="b-kind">{note.author} · {note.time}</span>
                </div>
                <div className="b-preview" style={{ fontSize: 12 }}>{note.body}</div>
              </div>
            ))}
          </div>

          {/* Tags */}
          {order.tags.length > 0 && (
            <div>
              <Sec h="Tags" right="+ tag" />
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {order.tags.map(({ label, variant }) => (
                  <Pill key={label} variant={variant ?? 'out'}>{label}</Pill>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <SaveBar
        savedAt={`${doneCount} of ${totalCount} sub-tasks complete · auto-syncs to board`}
        hints={[
          { key: 'Space', label: 'check off step' },
          { key: '⌘↵', label: 'mark item ready' },
          { key: 'P', label: 'print' },
          { key: 'S', label: 'split' },
          { key: 'N', label: 'note' },
        ]}
      />
    </div>
  );
}
