'use client';

/**
 * Customer dossier — sidebar. Notes (real CustomerNote CRUD), contact fields,
 * saved addresses, and editable tags / segments. All mutations hit real
 * endpoints; nothing here is fixture data.
 */

import React, { useState } from 'react';
import { MapPin, Mail, Phone, Building2, CalendarDays, Clock, Plus, X, Trash2, Loader2 } from 'lucide-react';
import { Badge } from '@/components/cms/admin/grainy-ui';
import {
  fullDate,
  relativeTime,
  lifecycleBadge,
  inferLifecycle,
  visibleTags,
  type ApiCustomerDetail,
  type CustomerNote,
} from './customers-model';

// ── Shared card wrapper (also used by the main column) ───────────────────────

export function DossierCard({
  title,
  meta,
  action,
  children,
}: {
  readonly title: string;
  readonly meta?: string;
  readonly action?: React.ReactNode;
  readonly children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="gr-card" style={{ padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, paddingBottom: 10, marginBottom: 12, borderBottom: '1px solid var(--line)' }}>
        <span style={{ fontWeight: 600, fontSize: 14 }}>{title}</span>
        {meta && <span className="gr-num" style={{ fontSize: 11, color: 'var(--text-muted)' }}>{meta}</span>}
        {action && <span style={{ marginLeft: 'auto' }}>{action}</span>}
      </div>
      {children}
    </div>
  );
}

// ── Contact field row ─────────────────────────────────────────────────────────

function Field({ icon: Icon, label, value }: { readonly icon: typeof Mail; readonly label: string; readonly value: string }): React.ReactElement {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--line-faint, var(--line))' }}>
      <Icon size={15} style={{ color: 'var(--clay-600)', flex: 'none' }} />
      <span className="gr-eyebrow" style={{ fontSize: 9.5 }}>{label}</span>
      <span style={{ marginLeft: 'auto', fontSize: 13, fontWeight: 500, textAlign: 'right', wordBreak: 'break-word' }}>{value}</span>
    </div>
  );
}

const noteInputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 10px', fontSize: 13,
  border: '1px solid var(--line)', borderRadius: 'var(--r-sm, 8px)',
  background: 'var(--surface)', color: 'var(--text)', fontFamily: 'inherit', outline: 'none',
};

export function CustomerDetailSidebar({
  customer,
  notes,
  notesLoading,
  onAddNote,
  onDeleteNote,
  onTagsChange,
}: {
  readonly customer: ApiCustomerDetail;
  readonly notes: readonly CustomerNote[];
  readonly notesLoading: boolean;
  readonly onAddNote: (content: string) => Promise<void>;
  readonly onDeleteNote: (id: string) => Promise<void>;
  readonly onTagsChange: (visibleTags: string[]) => Promise<void>;
}): React.ReactElement {
  const [draft, setDraft] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [tagDraft, setTagDraft] = useState('');
  const [addingTag, setAddingTag] = useState(false);

  const tags = visibleTags(customer.tags);
  const lifecycle = lifecycleBadge(inferLifecycle(customer.totalOrders));
  const defaultAddr = customer.addresses.find((a) => a.isDefault) ?? customer.addresses[0];
  const location = defaultAddr
    ? [defaultAddr.city, defaultAddr.state].filter(Boolean).join(', ') || defaultAddr.country
    : '—';

  const submitNote = async () => {
    const content = draft.trim();
    if (!content) return;
    setSavingNote(true);
    try {
      await onAddNote(content);
      setDraft('');
    } finally {
      setSavingNote(false);
    }
  };

  const submitTag = async () => {
    const t = tagDraft.trim();
    if (!t || tags.includes(t)) { setTagDraft(''); return; }
    setAddingTag(true);
    try {
      await onTagsChange([...tags, t]);
      setTagDraft('');
    } finally {
      setAddingTag(false);
    }
  };

  const removeTag = (t: string) => { void onTagsChange(tags.filter((x) => x !== t)); };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <DossierCard title="Notes" meta={notes.length ? String(notes.length) : undefined}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {notesLoading ? (
            <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>Loading notes…</div>
          ) : notes.length === 0 ? (
            <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>No notes yet.</div>
          ) : (
            notes.map((n) => (
              <div key={n.id} style={{ padding: '11px 12px', borderRadius: 10, background: 'var(--surface-sunken)', boxShadow: 'var(--inset-soft, none)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--text)', flex: 1, whiteSpace: 'pre-wrap' }}>{n.content}</div>
                  <button type="button" className="row-act" aria-label="Delete note" onClick={() => void onDeleteNote(n.id)} style={{ flex: 'none' }}>
                    <Trash2 size={13} />
                  </button>
                </div>
                <div className="gr-num" style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 6 }}>{relativeTime(n.createdAt)}</div>
              </div>
            ))
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={draft}
              placeholder="Write a note…"
              style={noteInputStyle}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void submitNote(); } }}
            />
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => void submitNote()} disabled={savingNote || !draft.trim()}>
              {savingNote ? <Loader2 className="animate-spin" size={14} /> : <Plus size={14} />}
            </button>
          </div>
        </div>
      </DossierCard>

      <DossierCard title="Contact">
        <Field icon={Mail} label="Email" value={customer.email} />
        <Field icon={Phone} label="Phone" value={customer.phone || '—'} />
        {customer.company && <Field icon={Building2} label="Company" value={customer.company} />}
        <Field icon={MapPin} label="Location" value={location} />
        <Field icon={CalendarDays} label="Since" value={fullDate(customer.createdAt)} />
        <Field icon={Clock} label="Last order" value={relativeTime(customer.lastOrderAt)} />
      </DossierCard>

      {customer.addresses.length > 0 && (
        <DossierCard title="Addresses" meta={`${customer.addresses.length} saved`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {customer.addresses.map((addr) => (
              <div key={addr.id} style={{ display: 'flex', gap: 10 }}>
                <MapPin size={15} style={{ color: 'var(--clay-600)', flex: 'none', marginTop: 2 }} />
                <div>
                  <div className="gr-eyebrow" style={{ fontSize: 9, marginBottom: 2 }}>
                    {addr.isDefault ? `Default · ${addr.label ?? 'Shipping'}` : (addr.label ?? 'Address')}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{[addr.firstName, addr.lastName].filter(Boolean).join(' ') || '—'}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {[addr.street1, addr.street2].filter(Boolean).join(', ')}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {[`${addr.city}, ${addr.state} ${addr.postalCode}`.trim(), addr.country].filter(Boolean).join(' · ')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </DossierCard>
      )}

      <DossierCard title="Tags & segments">
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
          <Badge tone={lifecycle.tone}>{lifecycle.label}</Badge>
          {tags.map((t) => (
            <span key={t} className="chip" style={{ fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              {t}
              <X size={11} style={{ cursor: 'pointer', opacity: 0.6 }} onClick={() => removeTag(t)} />
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={tagDraft}
            placeholder="Add a tag…"
            style={noteInputStyle}
            onChange={(e) => setTagDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void submitTag(); } }}
          />
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => void submitTag()} disabled={addingTag || !tagDraft.trim()}>
            {addingTag ? <Loader2 className="animate-spin" size={14} /> : <Plus size={14} />}
          </button>
        </div>
      </DossierCard>
    </div>
  );
}
