/**
 * PageSettingsEditor — Atlas A2
 *
 * Magazine-style preview (left) + highlighted settings/SEO/schedule/access/
 * versions panel (right). Content is edited in the dedicated page builder —
 * this surface handles everything else.
 *
 * Port of atlas-editors-page.jsx (rev 2).
 * Uses only Phase-0 atlas.css + local editor.css classes and --wl-* tokens.
 */

'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import './editor.css';
import {
  Crumbs,
  EditorTabs,
  Sec,
  SaveBar,
  FieldRow,
  InputRow,
  Pill,
} from './EditorPrimitives';

// ── Types ────────────────────────────────────────────────────────────────────

export interface PageForEditor {
  readonly id: string;
  readonly title: string;
  readonly slug: string;
  readonly status: 'published' | 'draft' | 'archived';
  readonly metaTitle: string | null;
  readonly metaDescription: string | null;
  readonly parentId: string | null;
  readonly parent: { readonly id: string; readonly title: string; readonly slug: string } | null;
  readonly headerMode: string;
  readonly footerMode: string;
  readonly showAnnouncement: boolean;
  readonly updatedAt: string;
  readonly createdAt: string;
  readonly publishedAt: string | null;
  /** version number of the live page */
  readonly version?: number;
}

export interface PageSettingsEditorProps {
  readonly page: PageForEditor;
  readonly subdomain: string;
  readonly onSave: (updated: Partial<PageForEditor>) => Promise<void>;
  /** optional analytics hint: visits + cvr for the "at a glance" stat strip */
  readonly stats?: {
    readonly visits: string;
    readonly cvr: string;
  };
}

type ActiveTab = 'overview' | 'seo' | 'schedule' | 'access' | 'versions' | 'activity';

// ── Preview panel ─────────────────────────────────────────────────────────────

interface PreviewPanelProps {
  readonly page: PageForEditor;
  readonly subdomain: string;
}

function MagazinePreview({ page, subdomain }: PreviewPanelProps): React.ReactElement {
  return (
    <div
      style={{
        flex: 1,
        overflow: 'auto',
        background: 'var(--paper-2)',
        border: '1px solid var(--rule)',
        borderRadius: 'var(--r-sm)',
        padding: '22px 28px 28px',
        position: 'relative',
      }}
    >
      {/* Faux browser bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          paddingBottom: 10,
          marginBottom: 16,
          borderBottom: '1px solid var(--rule-soft)',
        }}
      >
        {['dot', 'dot2', 'dot3'].map((k) => (
          <span
            key={k}
            style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--rule)' }}
          />
        ))}
        <span className="mono" style={{ fontSize: 11, color: 'var(--ink-soft)', marginLeft: 6 }}>
          {subdomain}.shop
          <span style={{ color: 'var(--ink)' }}>
            {page.slug === '/' ? '/' : page.slug}
          </span>{' '}
          <span style={{ color: 'var(--ink-faint)' }}>↻</span>
        </span>
        <span className="mono" style={{ fontSize: 10, color: 'var(--ink-faint)', marginLeft: 'auto' }}>
          1440 × auto
        </span>
      </div>

      {/* Magazine masthead */}
      <div
        style={{
          borderBottom: '1px solid var(--ink)',
          paddingBottom: 10,
          marginBottom: 14,
          display: 'flex',
          alignItems: 'baseline',
          gap: 16,
        }}
      >
        <div className="display" style={{ fontSize: 26, letterSpacing: '-0.02em', lineHeight: 1 }}>
          {subdomain.charAt(0).toUpperCase() + subdomain.slice(1)}
        </div>
        <div className="fig" style={{ fontSize: 12 }}>powered by cncpt</div>
        <div
          style={{
            marginLeft: 'auto',
            display: 'flex',
            gap: 16,
            fontFamily: 'var(--font-geist-mono), monospace',
            fontSize: 10,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--ink-soft)',
          }}
        >
          <span>Shop</span>
          <span>Journal</span>
          <span>About</span>
          <span>Cart · 0</span>
        </div>
      </div>

      {/* Hero section */}
      <div style={{ position: 'relative' }}>
        <span
          style={{
            position: 'absolute',
            left: -20,
            top: 2,
            fontFamily: 'var(--font-geist-mono), monospace',
            fontSize: 9,
            color: 'var(--ink-faint)',
            letterSpacing: '0.1em',
          }}
        >
          §1
        </span>
        <div className="display" style={{ fontSize: 40, letterSpacing: '-0.03em', lineHeight: 1.02, margin: '4px 0 6px' }}>
          {page.title}
          <br />
          <span className="display-i" style={{ color: 'var(--accent)' }}>the story.</span>
        </div>
        <div className="fig" style={{ fontSize: 13, maxWidth: 480, lineHeight: 1.4 }}>
          {page.metaDescription ?? 'No meta description set — add one in the settings panel.'}
        </div>
        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
          <span
            style={{
              background: 'var(--ink)',
              color: 'var(--paper)',
              fontSize: 11,
              padding: '5px 12px',
              fontFamily: 'var(--font-geist-mono), monospace',
              letterSpacing: '0.05em',
            }}
          >
            SHOP NOW →
          </span>
          <span
            style={{
              border: '1px solid var(--ink)',
              fontSize: 11,
              padding: '5px 12px',
              fontFamily: 'var(--font-geist-mono), monospace',
              letterSpacing: '0.05em',
            }}
          >
            READ THE JOURNAL
          </span>
        </div>
        <div className="ph-box" style={{ height: 160, marginTop: 14, position: 'relative' }}>
          hero image — {page.slug === '/' ? 'home' : page.slug.replace(/^\//, '')}
          <span
            className="fig"
            style={{ position: 'absolute', bottom: 6, right: 10, fontSize: 11, color: 'var(--ink-soft)' }}
          >
            fig. 1 — live render
          </span>
        </div>
      </div>

      {/* Featured grid */}
      <div style={{ marginTop: 22, position: 'relative' }}>
        <span
          style={{
            position: 'absolute',
            left: -20,
            top: 2,
            fontFamily: 'var(--font-geist-mono), monospace',
            fontSize: 9,
            color: 'var(--ink-faint)',
            letterSpacing: '0.1em',
          }}
        >
          §2
        </span>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            borderBottom: '1px solid var(--ink)',
            paddingBottom: 4,
            marginBottom: 10,
          }}
        >
          <span className="display" style={{ fontSize: 18 }}>Featured products</span>
          <span className="fig" style={{ fontSize: 12, marginLeft: 10 }}>· auto-pulled from shop</span>
          <span className="display-i accent" style={{ fontSize: 12, marginLeft: 'auto' }}>see all →</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {[
            ['var(--accent-2)', 'Product 1', '$32'],
            ['var(--gold)', 'Product 2', '$16'],
            ['var(--moss)', 'Product 3', '$48'],
            ['var(--ink-soft)', 'Product 4', '$18'],
          ].map(([c, n, p]) => (
            <div key={n}>
              <div style={{ background: c as string, height: 60, borderRadius: 'var(--r-sm)', border: '1px solid var(--rule)' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 11 }}>
                <span>{n}</span>
                <span className="mono">{p}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        className="fig"
        style={{ fontSize: 11, textAlign: 'center', marginTop: 22, paddingTop: 12, borderTop: '1px solid var(--rule-soft)' }}
      >
        · more sections below — content is managed in the page builder ·
      </div>
    </div>
  );
}

// ── Settings panel ────────────────────────────────────────────────────────────

interface SettingsPanelProps {
  readonly page: PageForEditor;
  readonly activeTab: ActiveTab;
  readonly stats?: PageSettingsEditorProps['stats'];
  readonly onFieldChange: (field: keyof PageForEditor, value: unknown) => void;
}

function SettingsPanel({ page, activeTab, stats, onFieldChange }: SettingsPanelProps): React.ReactElement {
  const version = page.version ?? 1;

  const panelStyle: React.CSSProperties = {
    overflow: 'auto',
    background: 'var(--paper-3)',
    border: '1px solid var(--ink)',
    borderRadius: 'var(--r-sm)',
    padding: '16px 18px',
    boxShadow: 'inset 3px 0 0 var(--accent), 0 2px 0 rgba(0,0,0,0.04)',
  };

  return (
    <div className="editor-col" style={panelStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
        <span className="eyebrow">Editing · settings</span>
        <span className="mono" style={{ fontSize: 9, color: 'var(--ink-soft)', letterSpacing: '0.1em' }}>
          v{version} → v{version + 1} draft
        </span>
      </div>
      <div className="display-i" style={{ fontSize: 13, color: 'var(--ink-soft)', marginBottom: 12, lineHeight: 1.35 }}>
        Content is edited in the{' '}
        <Link
          href={`/admin/pages/${page.id}/builder`}
          style={{ color: 'var(--accent)' }}
        >
          page builder →
        </Link>{' '}
        This panel handles everything else.
      </div>

      {(activeTab === 'overview' || activeTab === 'seo') && (
        <>
          <div>
            <Sec h="Page" />
            <InputRow label="title">
              <input
                className="val"
                value={page.title}
                onChange={(e) => onFieldChange('title', e.target.value)}
                style={{ width: '100%' }}
              />
            </InputRow>
            <InputRow label="slug">
              <input
                className="val mono"
                value={page.slug}
                onChange={(e) => onFieldChange('slug', e.target.value)}
                style={{ width: '100%' }}
              />
            </InputRow>
            <FieldRow label="template">
              <span>Landing · 1-col wide</span>
            </FieldRow>
            <FieldRow label="parent">
              <span className="fig">{page.parent ? page.parent.title : '— root —'}</span>
            </FieldRow>
          </div>

          <div style={{ marginTop: 14 }}>
            <Sec h="Status" meta={page.status} />
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <Pill variant={page.status === 'published' ? 'solid-ink' : 'soft'}>
                {page.status.toUpperCase()}
              </Pill>
              {page.status === 'published' && (
                <>
                  <Pill variant="out">indexed</Pill>
                  <Pill variant="out">sitemap on</Pill>
                </>
              )}
            </div>
            <FieldRow label="visible">
              <span>{page.status === 'published' ? `Yes · since ${new Date(page.publishedAt ?? page.updatedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}` : 'No'}</span>
            </FieldRow>
            <FieldRow label="scheduled"><span className="fig">— none —</span></FieldRow>
            <FieldRow label="access"><span>Public</span></FieldRow>
            <FieldRow label="redirect"><span className="fig">— none —</span></FieldRow>
          </div>
        </>
      )}

      {(activeTab === 'seo' || activeTab === 'overview') && (
        <div style={{ marginTop: 14 }}>
          <Sec h="Search &amp; social" meta="SEO" />
          <InputRow label="meta title">
            <input
              className="val mono"
              value={page.metaTitle ?? ''}
              onChange={(e) => onFieldChange('metaTitle', e.target.value || null)}
              placeholder="Defaults to page title"
              style={{ width: '100%' }}
            />
          </InputRow>
          <InputRow label="meta description">
            <textarea
              className="val area"
              value={page.metaDescription ?? ''}
              onChange={(e) => onFieldChange('metaDescription', e.target.value || null)}
              style={{ fontSize: 12, resize: 'vertical', width: '100%' }}
            />
          </InputRow>
          <FieldRow label="og image"><span className="mono" style={{ fontSize: 11 }}>— not set —</span></FieldRow>
          <FieldRow label="canonical"><span className="mono" style={{ fontSize: 11 }}>{page.slug}</span></FieldRow>
        </div>
      )}

      {stats && (
        <div style={{ marginTop: 14 }}>
          <Sec h="At a glance" meta="last 30 days" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            <div className="brick" style={{ padding: '6px 8px' }}>
              <div className="l">visits</div>
              <div className="v" style={{ fontSize: 18 }}>{stats.visits}</div>
            </div>
            <div className="brick" style={{ padding: '6px 8px' }}>
              <div className="l">cvr</div>
              <div className="v" style={{ fontSize: 18 }}>{stats.cvr}</div>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginTop: 14 }}>
        <Sec h="Activity" />
        <div className="tl" style={{ paddingLeft: 14 }}>
          <div className="tl-item now" style={{ padding: '2px 0 6px' }}>
            <div className="when">
              {new Date(page.updatedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })} · v{version} live
            </div>
            <div className="what fig" style={{ fontSize: 12 }}>last edited</div>
          </div>
          {page.publishedAt && (
            <div className="tl-item" style={{ padding: '2px 0 6px' }}>
              <div className="when">
                {new Date(page.publishedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })} · first publish
              </div>
              <div className="what fig" style={{ fontSize: 12 }}>published</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function PageSettingsEditor({
  page: initialPage,
  subdomain,
  onSave,
  stats,
}: PageSettingsEditorProps): React.ReactElement {
  const [page, setPage] = useState(initialPage);
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [isPending, startTransition] = useTransition();

  const handleFieldChange = (field: keyof PageForEditor, value: unknown) => {
    setPage((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    startTransition(async () => {
      await onSave({
        title: page.title,
        slug: page.slug,
        status: page.status,
        metaTitle: page.metaTitle,
        metaDescription: page.metaDescription,
        parentId: page.parentId,
        headerMode: page.headerMode,
        footerMode: page.footerMode,
        showAnnouncement: page.showAnnouncement,
      });
    });
  };

  const tabs = [
    { label: 'Overview', active: activeTab === 'overview' },
    { label: 'SEO', active: activeTab === 'seo' },
    { label: 'Schedule', active: activeTab === 'schedule' },
    { label: 'Access', active: activeTab === 'access' },
    { label: 'Versions', count: page.version ?? 1, active: activeTab === 'versions' },
    { label: 'Activity', active: activeTab === 'activity' },
  ] as const;

  const tabKeys: ActiveTab[] = ['overview', 'seo', 'schedule', 'access', 'versions', 'activity'];

  const statusPill: 'solid-ink' | 'soft' | 'solid-accent' = page.status === 'published' ? 'solid-ink' : page.status === 'draft' ? 'soft' : 'solid-accent';

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
          { label: 'Pages', href: '/admin/pages' },
          { label: page.title },
        ]}
      />

      {/* Editor masthead */}
      <div className="editor-head">
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="eyebrow">Page · {page.headerMode || 'Storefront'} · Landing</div>
          <h1>
            {page.title} —{' '}
            <span className="display-i">{subdomain}</span>
          </h1>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginTop: 6 }}>
            <span className="mono" style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
              {subdomain}.shop
              <span style={{ color: 'var(--ink)' }}>{page.slug}</span>
            </span>
            <Pill variant={statusPill}>{page.status.toUpperCase()}</Pill>
            <span className="fig" style={{ fontSize: 12 }}>
              v{page.version ?? 1} · last edited{' '}
              {new Date(page.updatedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
            </span>
          </div>
        </div>
        <div className="actions">
          <Link
            href={`/admin/pages/${page.id}/builder`}
            className="btn"
          >
            <span className="kbd">B</span>Open builder
          </Link>
          <a href={page.slug} target="_blank" rel="noopener noreferrer" className="btn">
            <span className="kbd">⌘P</span>Preview
          </a>
          <button className="btn btn-accent" onClick={handleSave} disabled={isPending}>
            <span className="kbd">⌘↵</span>
            {isPending ? 'Saving…' : 'Publish changes'}
          </button>
        </div>
      </div>

      <EditorTabs
        items={tabs}
        activeIndex={tabKeys.indexOf(activeTab)}
        onTabChange={(i) => setActiveTab(tabKeys[i])}
        right={
          <>
            <span>content lives in the page builder</span>
            <span>· this surface = settings + preview</span>
          </>
        }
      />

      {/* Two-column body */}
      <div className="editor-body" style={{ gridTemplateColumns: '1fr 360px', flex: 1, overflow: 'hidden' }}>
        {/* LEFT — magazine preview */}
        <div className="editor-col" style={{ overflow: 'hidden' }}>
          <Sec
            h="Preview"
            meta={`rendered · v${page.version ?? 1} live`}
            right={
              <>
                <span className="mono" style={{ background: 'var(--ink)', color: 'var(--paper)', padding: '1px 6px', marginRight: 6 }}>
                  desktop
                </span>
                <span style={{ marginRight: 8 }}>tablet</span>
                <span>mobile</span>
              </>
            }
          />
          <MagazinePreview page={page} subdomain={subdomain} />
        </div>

        {/* RIGHT — settings panel */}
        <SettingsPanel
          page={page}
          activeTab={activeTab}
          stats={stats}
          onFieldChange={handleFieldChange}
        />
      </div>

      <SaveBar
        savedAt={`v${page.version ?? 1} live · settings up to date`}
        hints={[
          { key: '⌘S', label: 'save settings' },
          { key: 'B', label: 'open builder' },
          { key: '⌘P', label: 'preview' },
          { key: '⌘↵', label: 'publish' },
        ]}
      />
    </div>
  );
}
