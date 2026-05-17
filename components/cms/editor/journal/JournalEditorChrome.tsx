'use client';

import Link from 'next/link';
import type { JournalTab, PostStatus } from './types';

interface BreadcrumbItem {
  readonly label: string;
  readonly href?: string;
}

interface CompactHeadProps {
  readonly title: string;
  readonly slug: string;
  readonly status: PostStatus;
  readonly wordCount: number;
  readonly readTime: number;
  readonly lastSaved?: string;
  readonly isSaving?: boolean;
  readonly onSaveDraft: () => void;
  readonly onPreview: () => void;
  readonly onPublish: () => void;
}

interface JournalEditorChromeProps {
  readonly breadcrumbs: ReadonlyArray<BreadcrumbItem>;
  readonly head: CompactHeadProps;
  readonly activeTab: JournalTab;
  readonly onTabChange: (tab: JournalTab) => void;
  readonly children: React.ReactNode;
}

const STATUS_PILL: Record<PostStatus, { label: string; cls: string }> = {
  DRAFT:     { label: 'DRAFT',     cls: 'pill-soft' },
  PUBLISHED: { label: 'PUBLISHED', cls: 'pill-solid-moss' },
  ARCHIVED:  { label: 'ARCHIVED',  cls: 'pill-solid-ink' },
  SCHEDULED: { label: 'SCHEDULED', cls: 'pill-solid-gold' },
};

function Breadcrumbs({ items }: { items: ReadonlyArray<BreadcrumbItem> }) {
  return (
    <div className="crumbs" style={{
      display: 'flex', alignItems: 'center', gap: 4,
      fontFamily: 'var(--font-geist-mono, monospace)',
      fontSize: 11, color: 'var(--ink-soft)', padding: '8px 0 6px',
    }}>
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {i > 0 && <span style={{ opacity: 0.4 }}>/</span>}
            {isLast
              ? <span style={{ color: 'var(--ink)' }}>{item.label}</span>
              : item.href
                ? <Link href={item.href} style={{ color: 'var(--ink-soft)', textDecoration: 'none' }}>{item.label}</Link>
                : <span>{item.label}</span>}
          </span>
        );
      })}
    </div>
  );
}

function EditorHead({
  title, slug, status, wordCount, readTime, lastSaved, isSaving,
  onSaveDraft, onPreview, onPublish,
}: CompactHeadProps) {
  const pill = STATUS_PILL[status];
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
      gap: 12, padding: '10px 0 12px', borderBottom: '1px solid var(--ink)',
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="eyebrow">Journal · Feature · {readTime} min read · {wordCount.toLocaleString()} words</div>
        <div className="display" style={{ fontSize: 20, lineHeight: 1.1, marginTop: 2, letterSpacing: '-0.02em' }}>
          {title || <span style={{ color: 'var(--ink-faint)', fontStyle: 'italic' }}>Untitled</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
          <span className={`pill ${pill.cls}`}>{pill.label}</span>
          <span className="mono soft" style={{ fontSize: 11 }}>{slug ? `/${slug}` : '/untitled'}</span>
          <span className="fig" style={{ fontSize: 11 }}>
            {isSaving ? 'saving…' : lastSaved ?? '— not yet saved —'}
          </span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
        <button className="btn" onClick={onPreview} type="button">
          <span className="kbd">⌘P</span>Preview
        </button>
        <button className="btn" onClick={onSaveDraft} type="button" disabled={isSaving}>
          <span className="kbd">⌘S</span>Save draft
        </button>
        <button className="btn btn-accent" onClick={onPublish} type="button" disabled={isSaving}>
          <span className="kbd">⌘⏎</span>
          {status === 'PUBLISHED' ? 'Update' : 'Publish'}
        </button>
      </div>
    </div>
  );
}

const TABS: ReadonlyArray<{ id: JournalTab; label: string; count?: number }> = [
  { id: 'write',      label: 'Write' },
  { id: 'blocks',     label: 'Blocks' },
  { id: 'structure',  label: 'Structure' },
  { id: 'distribute', label: 'Distribute', count: 5 },
];

function EditorTabs({
  active, onChange,
}: {
  active: JournalTab;
  onChange: (tab: JournalTab) => void;
}) {
  return (
    <div className="tabs" style={{ marginTop: 8 }}>
      {TABS.map(({ id, label, count }) => (
        <button
          key={id}
          type="button"
          className={`tab${active === id ? ' on' : ''}`}
          onClick={() => onChange(id)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0' }}
        >
          {label}
          {count !== undefined && <span className="ct">{count}</span>}
        </button>
      ))}
    </div>
  );
}

export function JournalEditorChrome({
  breadcrumbs, head, activeTab, onTabChange, children,
}: JournalEditorChromeProps) {
  return (
    <div className="atlas" style={{
      minHeight: '100vh', background: 'var(--paper)', padding: '0 24px 24px',
    }}>
      <Breadcrumbs items={breadcrumbs} />
      <EditorHead {...head} />
      <EditorTabs active={activeTab} onChange={onTabChange} />
      <div style={{ marginTop: 16 }}>
        {children}
      </div>
    </div>
  );
}
