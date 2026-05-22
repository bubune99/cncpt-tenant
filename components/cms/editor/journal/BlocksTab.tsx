'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import type { BlockKind } from './types';

const TipTapEditor = dynamic(
  () => import('@/components/cms/editor/TipTapEditor'),
  {
    ssr: false,
    loading: () => (
      <div style={{
        height: 400, background: 'var(--paper-2)', border: '1px solid var(--rule)',
        borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--ink-faint)', fontFamily: 'var(--font-geist-mono)', fontSize: 12,
      }}>Loading editor…</div>
    ),
  }
);

interface Block {
  readonly id: string;
  readonly kind: BlockKind;
  readonly content?: string;
  readonly imageUrl?: string;
  readonly caption?: string;
}

interface BlocksTabProps {
  readonly contentHtml: string;
  readonly onContentChange: (html: string) => void;
  readonly onJsonChange: (json: object) => void;
  readonly blocks: ReadonlyArray<Block>;
  readonly onBlocksChange: (blocks: ReadonlyArray<Block>) => void;
}

const BLOCK_PALETTE: ReadonlyArray<{ kind: BlockKind; icon: string; name: string }> = [
  { kind: 'P',       icon: '¶',  name: 'Para' },
  { kind: 'H2',      icon: 'H',  name: 'Heading' },
  { kind: 'QUOTE',   icon: '"',  name: 'Quote' },
  { kind: 'IMAGE',   icon: '▣',  name: 'Image' },
  { kind: 'GALLERY', icon: '▦',  name: 'Gallery' },
  { kind: 'EMBED',   icon: '⤴',  name: 'Embed' },
  { kind: 'DIV',     icon: '⊜',  name: 'Divider' },
  { kind: 'CODE',    icon: '<>', name: 'Code' },
  { kind: 'PROD',    icon: '$',  name: 'Product' },
  { kind: 'NL',      icon: '✉',  name: 'Subscribe' },
];

const SNIPPETS: ReadonlyArray<{ name: string; icon: string; usedCount: number }> = [
  { name: 'Newsletter sign-up',      icon: '✉', usedCount: 14 },
  { name: 'Studio callout',          icon: '⌂', usedCount: 8 },
  { name: 'Shop CTA · seasonal',     icon: '★', usedCount: 22 },
  { name: 'Reading-list footer',     icon: '◫', usedCount: 6 },
];

const LAYOUT_OPTS = ['Column', 'Bleed', 'Full', 'Side'] as const;
type LayoutOpt = typeof LAYOUT_OPTS[number];

function Sec({ h, meta }: { h: string; meta?: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'baseline', gap: 6,
      borderBottom: '1px solid var(--rule-soft)', paddingBottom: 4, marginBottom: 8,
    }}>
      <span style={{
        fontFamily: 'var(--font-geist-mono)', fontSize: 10,
        letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink)',
        fontWeight: 600,
      }}>{h}</span>
      {meta && <span className="fig" style={{ fontSize: 11 }}>· {meta}</span>}
    </div>
  );
}

function BlockProperties({ blocks }: { blocks: ReadonlyArray<Block> }) {
  const [layout, setLayout] = useState<LayoutOpt>('Bleed');

  // Find selected (last) block or default to IMAGE demo
  const selected = blocks.find(b => b.kind === 'IMAGE') ?? blocks[0];
  const isImage = selected?.kind === 'IMAGE';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span className="eyebrow">Block · {selected?.kind ?? 'none'}</span>
        <span className="mono" style={{ fontSize: 9, color: 'var(--ink-soft)' }}>
          #{blocks.findIndex(b => b === selected) + 1} of {blocks.length}
        </span>
      </div>
      <div className="display-i" style={{ fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.35 }}>
        Selected block · settings live here
      </div>

      {isImage && (
        <>
          <Sec h="Image" />
          <div style={{
            height: 80, background: 'var(--paper-2)',
            border: '1px dashed var(--rule)', borderRadius: 2,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--ink-faint)', fontSize: 11,
          }}>
            {selected?.imageUrl ? (
              <img src={selected.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 2 }} />
            ) : (
              <span style={{ fontFamily: 'var(--font-geist-mono)' }}>no image</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 4, marginTop: 2 }}>
            <button className="btn" style={{ flex: 1, justifyContent: 'center', fontSize: 11, padding: '4px 8px' }} type="button">Replace</button>
            <button className="btn" style={{ flex: 1, justifyContent: 'center', fontSize: 11, padding: '4px 8px' }} type="button">Crop</button>
            <button className="btn" style={{ flex: 1, justifyContent: 'center', fontSize: 11, padding: '4px 8px' }} type="button">Alt</button>
          </div>

          <div>
            <Sec h="Layout" />
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {LAYOUT_OPTS.map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setLayout(opt)}
                  style={{
                    flex: 1, padding: '4px 6px', fontSize: 11, cursor: 'pointer',
                    fontFamily: 'var(--font-geist-mono)', letterSpacing: '0.05em',
                    background: layout === opt ? 'var(--ink)' : 'transparent',
                    color: layout === opt ? 'var(--paper)' : 'var(--ink)',
                    border: `1px solid ${layout === opt ? 'var(--ink)' : 'var(--rule)'}`,
                    borderRadius: 2,
                  }}
                >{opt}</button>
              ))}
            </div>
          </div>

          <div>
            <div className="fig" style={{ fontSize: 10, marginBottom: 4 }}>CAPTION</div>
            <div style={{
              background: 'var(--paper-2)', border: '1px solid var(--rule)',
              borderRadius: 2, padding: '6px 8px',
              fontSize: 12, fontStyle: 'italic', fontFamily: 'var(--font-display)',
              color: 'var(--ink-soft)',
            }}>
              {selected?.caption ?? 'Add a caption…'}
            </div>
          </div>

          <div>
            <Sec h="Behavior" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {(['Open in lightbox', 'Lazy load', 'Numbered figure'] as const).map((label) => (
                <div key={label} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  fontSize: 12,
                }}>
                  <span>{label}</span>
                  <div style={{
                    width: 28, height: 16, background: 'var(--accent)',
                    borderRadius: 8, position: 'relative', cursor: 'pointer',
                  }}>
                    <div style={{
                      position: 'absolute', right: 2, top: 2,
                      width: 12, height: 12, background: 'var(--paper)', borderRadius: '50%',
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Sec h="Per channel" meta="overrides" />
            {(['web', 'newsletter', 'rss'] as const).map(ch => (
              <div key={ch} style={{
                display: 'flex', gap: 8, padding: '4px 0',
                borderBottom: '1px solid var(--rule-soft)', fontSize: 12, alignItems: 'baseline',
              }}>
                <span className="mono" style={{ fontSize: 10, color: 'var(--ink-faint)', width: 70 }}>{ch}</span>
                <span className="display-i" style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
                  {ch === 'web' ? 'Bleed · numbered' : ch === 'newsletter' ? 'Column · no caption' : 'inherit'}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      <div style={{ display: 'flex', gap: 4 }}>
        <button className="btn" style={{ flex: 1, justifyContent: 'center', fontSize: 11 }} type="button">↑ up</button>
        <button className="btn" style={{ flex: 1, justifyContent: 'center', fontSize: 11 }} type="button">↓ down</button>
        <button className="btn" style={{ borderColor: 'var(--accent-2)', color: 'var(--accent-2)', fontSize: 11 }} type="button">×</button>
      </div>
    </div>
  );
}

export function BlocksTab({
  contentHtml, onContentChange, onJsonChange, blocks, onBlocksChange,
}: BlocksTabProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr 200px', gap: 20, alignItems: 'start' }}>
      {/* LEFT — Block palette */}
      <div>
        <Sec h="Blocks" meta="drag onto canvas" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
          {BLOCK_PALETTE.map(({ kind, icon, name }) => (
            <div
              key={kind}
              draggable
              style={{
                background: 'var(--paper-2)', border: '1px solid var(--rule)',
                borderRadius: 2, padding: '8px 6px', cursor: 'grab',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                userSelect: 'none',
              }}
            >
              <div style={{
                width: 28, height: 28, background: 'var(--paper-3)',
                border: '1px solid var(--rule)', borderRadius: 2,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-display)', fontSize: 14,
              }}>{icon}</div>
              <div style={{ fontSize: 10, fontFamily: 'var(--font-geist-mono)', letterSpacing: '0.08em' }}>{name}</div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 16 }}>
          <Sec h="Snippets" meta="reusable" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {SNIPPETS.map(({ name, icon, usedCount }) => (
              <div key={name} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '5px 6px', cursor: 'grab',
                background: 'var(--paper)', border: '1px solid var(--rule-soft)',
                borderRadius: 2, fontSize: 12,
              }}>
                <span style={{
                  width: 22, height: 22, background: 'var(--paper-3)',
                  border: '1px solid var(--rule)', borderRadius: 2,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-display)', fontSize: 12,
                }}>{icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 12, lineHeight: 1.1 }}>{name}</div>
                  <div className="fig" style={{ fontSize: 10 }}>used {usedCount}×</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CENTER — TipTap canvas */}
      <div style={{ border: '1px solid var(--rule)', borderRadius: 4, overflow: 'hidden' }}>
        <TipTapEditor
          content={contentHtml}
          onChange={onContentChange}
          onJsonChange={onJsonChange}
          placeholder="Start building your article with blocks…"
          minHeight="560px"
          maxHeight="none"
          showWordCount={false}
        />
        <div className="action-bar" style={{ margin: 0, borderTop: '1px solid var(--ink)', padding: '8px 12px' }}>
          <span><span className="kbd">/</span>insert</span>
          <span><span className="kbd">↑↓</span>reorder</span>
          <span><span className="kbd">⌘D</span>duplicate</span>
          <span><span className="kbd">del</span>remove</span>
        </div>
      </div>

      {/* RIGHT — Block properties */}
      <div style={{
        background: 'var(--paper-2)', border: '1px solid var(--rule)',
        borderRadius: 4, padding: '12px 14px',
      }}>
        <BlockProperties blocks={blocks} />
      </div>
    </div>
  );
}
