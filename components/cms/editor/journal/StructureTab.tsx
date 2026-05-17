'use client';

import type { Category, Tag } from './types';

interface Contributor {
  readonly id: string;
  readonly initials: string;
  readonly name: string;
  readonly role: string;
  readonly bylineSetting: 'primary' | 'credit' | 'colophon' | 'no-byline';
  readonly accentClass?: 'gold' | 'moss' | 'ink';
}

interface RelatedEntry {
  readonly id: string;
  readonly title: string;
  readonly category: string;
  readonly date: string;
  readonly readTime: string;
  readonly relation: 'prev' | 'next' | 'auto';
  readonly accentHex?: string;
}

interface ShopLink {
  readonly id: string;
  readonly title: string;
  readonly subline: string;
  readonly price: string;
  readonly accentHex?: string;
}

interface SeoSummary {
  readonly slug: string;
  readonly metaTitle: string;
  readonly metaDescription: string;
  readonly ogImage?: string;
  readonly score?: number;
}

interface SeriesInfo {
  readonly title: string;
  readonly position: number;
  readonly total: number;
  readonly totalPlanned: number;
  readonly totalLive: number;
  readonly prevTitle?: string;
  readonly prevDate?: string;
  readonly nextTitle?: string;
  readonly progress: ReadonlyArray<'live' | 'this' | 'draft' | 'plan'>;
}

interface StructureTabProps {
  readonly series?: SeriesInfo;
  readonly categories: ReadonlyArray<Category>;
  readonly selectedCategoryIds: ReadonlyArray<string>;
  readonly onToggleCategory: (id: string) => void;
  readonly tags: ReadonlyArray<Tag>;
  readonly selectedTagIds: ReadonlyArray<string>;
  readonly onToggleTag: (id: string) => void;
  readonly contributors?: ReadonlyArray<Contributor>;
  readonly relatedEntries?: ReadonlyArray<RelatedEntry>;
  readonly shopLinks?: ReadonlyArray<ShopLink>;
  readonly seo?: SeoSummary;
  readonly metaTitle: string;
  readonly metaDescription: string;
  readonly onMetaTitleChange: (v: string) => void;
  readonly onMetaDescriptionChange: (v: string) => void;
  readonly slug: string;
  readonly onSlugChange: (v: string) => void;
}

function Sec({ h, meta, right }: { h: string; meta?: string; right?: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'baseline', gap: 6, justifyContent: 'space-between',
      borderBottom: '1px solid var(--rule-soft)', paddingBottom: 6, marginBottom: 10,
    }}>
      <span style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{
          fontFamily: 'var(--font-geist-mono)', fontSize: 10,
          letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink)', fontWeight: 600,
        }}>{h}</span>
        {meta && <span className="fig" style={{ fontSize: 11 }}>· {meta}</span>}
      </span>
      {right}
    </div>
  );
}

function StructCard({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: 'var(--paper)', border: '1px solid var(--rule)',
      borderRadius: 4, padding: '14px 16px', marginBottom: 12,
    }}>
      {children}
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 10, padding: '4px 0', borderBottom: '1px solid var(--rule-soft)', alignItems: 'baseline' }}>
      <span className="mono" style={{ fontSize: 10, color: 'var(--ink-faint)', width: 80, flexShrink: 0, letterSpacing: '0.08em' }}>{label}</span>
      <span style={{ fontSize: 13, color: 'var(--ink)', flex: 1 }}>{value}</span>
    </div>
  );
}

export function StructureTab({
  series, categories, selectedCategoryIds, onToggleCategory,
  tags, selectedTagIds, onToggleTag,
  contributors, relatedEntries, shopLinks,
  metaTitle, metaDescription, onMetaTitleChange, onMetaDescriptionChange,
  slug, onSlugChange,
}: StructureTabProps) {
  const seriesColors: Record<string, string> = {
    live: 'var(--accent)', this: 'var(--ink)', draft: 'var(--gold)', plan: 'var(--rule)',
  };

  const bylinePillClass: Record<string, string> = {
    primary:    'pill-solid-accent',
    credit:     'pill-out',
    colophon:   'pill-soft',
    'no-byline':'pill-soft',
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>
      {/* LEFT column */}
      <div>
        {/* Series */}
        {series && (
          <StructCard>
            <Sec h="Series" meta="part of an ordered run" />
            <Field label="series" value={<><span>{series.title}</span><span className="fig" style={{ fontSize: 11 }}> · {series.totalPlanned} planned · {series.totalLive} live</span></>} />
            <Field label="position" value={`${series.position} of ${series.total}`} />
            {series.prevTitle && <Field label="prev" value={<><span>{series.prevTitle}</span>{series.prevDate && <span className="fig" style={{ fontSize: 11 }}> · {series.prevDate}</span>}</>} />}
            {series.nextTitle && <Field label="next" value={<span className="display-i" style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{series.nextTitle} — outlined</span>} />}
            <div style={{ marginTop: 10 }}>
              <div className="eyebrow-ink" style={{ marginBottom: 6 }}>Progress</div>
              <div style={{ display: 'flex', gap: 3 }}>
                {series.progress.map((s, i) => (
                  <div key={i} style={{
                    flex: 1, height: 28,
                    background: seriesColors[s],
                    border: '1px solid var(--ink)', borderRadius: 2,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-geist-mono)', fontSize: 9,
                    color: s === 'plan' ? 'var(--ink-faint)' : 'var(--paper)',
                  }}>{i + 1}</div>
                ))}
              </div>
            </div>
          </StructCard>
        )}

        {/* Taxonomy */}
        <StructCard>
          <Sec h="Taxonomy" meta="categories & tags" />
          <div style={{ marginBottom: 10 }}>
            <div className="eyebrow-ink" style={{ marginBottom: 6 }}>Category · pick one</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => onToggleCategory(cat.id)}
                  style={{
                    padding: '3px 10px', fontSize: 12, cursor: 'pointer', borderRadius: 2,
                    background: selectedCategoryIds.includes(cat.id) ? 'var(--ink)' : 'transparent',
                    color: selectedCategoryIds.includes(cat.id) ? 'var(--paper)' : 'var(--ink)',
                    border: `1px solid ${selectedCategoryIds.includes(cat.id) ? 'var(--ink)' : 'var(--rule)'}`,
                    fontFamily: 'var(--font-geist)',
                  }}
                >
                  {cat.name}
                  {selectedCategoryIds.includes(cat.id) && <span style={{ marginLeft: 4 }}>✓</span>}
                </button>
              ))}
              {categories.length === 0 && (
                <span className="fig" style={{ fontSize: 12 }}>No categories yet</span>
              )}
            </div>
          </div>
          <div>
            <div className="eyebrow-ink" style={{ marginBottom: 6 }}>Tags · {selectedTagIds.length} selected</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {tags.map(tag => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => onToggleTag(tag.id)}
                  style={{
                    padding: '3px 8px', fontSize: 12, cursor: 'pointer', borderRadius: 2,
                    background: selectedTagIds.includes(tag.id) ? 'var(--accent-soft)' : 'transparent',
                    color: 'var(--ink)',
                    border: `1px solid ${selectedTagIds.includes(tag.id) ? 'var(--accent)' : 'var(--rule)'}`,
                    fontFamily: 'var(--font-geist)',
                  }}
                >
                  {tag.name}
                  {selectedTagIds.includes(tag.id) && <span style={{ marginLeft: 4, color: 'var(--accent)' }}>×</span>}
                </button>
              ))}
              {tags.length === 0 && (
                <span className="fig" style={{ fontSize: 12 }}>No tags yet</span>
              )}
            </div>
          </div>
        </StructCard>

        {/* Contributors */}
        {contributors && contributors.length > 0 && (
          <StructCard>
            <Sec h="Contributors" meta="byline + credits" />
            {contributors.map((c, i) => {
              const bgColor = c.accentClass === 'gold' ? 'var(--gold)' :
                              c.accentClass === 'moss' ? 'var(--moss)' :
                              c.accentClass === 'ink'  ? 'var(--ink)' :
                              'var(--accent)';
              return (
                <div key={c.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 0', borderBottom: '1px solid var(--rule-soft)',
                }}>
                  <div style={{
                    width: 30, height: 30, background: bgColor, color: 'var(--paper)',
                    borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 500, flexShrink: 0,
                  }}>{c.initials}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 500 }}>{c.name}</div>
                    <div className="fig" style={{ fontSize: 11 }}>{c.role}</div>
                  </div>
                  <span className={`pill ${bylinePillClass[c.bylineSetting]}`}>{c.bylineSetting}</span>
                </div>
              );
            })}
            <button className="btn" style={{ width: '100%', justifyContent: 'center', marginTop: 8, fontSize: 11 }} type="button">
              + add contributor
            </button>
          </StructCard>
        )}
      </div>

      {/* RIGHT column */}
      <div>
        {/* Related entries */}
        {relatedEntries && relatedEntries.length > 0 && (
          <StructCard>
            <Sec h="Related" meta="auto-linked at the bottom of the article" />
            <div className="eyebrow-ink" style={{ marginBottom: 6 }}>Other journal entries · {relatedEntries.filter(r => r.relation !== 'auto').length} pinned</div>
            {relatedEntries.map(entry => (
              <div key={entry.id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 0', borderBottom: '1px solid var(--rule-soft)',
              }}>
                <div style={{
                  width: 36, height: 36, flexShrink: 0,
                  background: `${entry.accentHex ?? '#8b2c1f'}22 repeating-linear-gradient(45deg, rgba(26,20,16,.04) 0 6px, transparent 6px 12px)`,
                  borderRadius: 2,
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.title}</div>
                  <div className="fig" style={{ fontSize: 11 }}>{entry.category} · {entry.date} · {entry.readTime}</div>
                </div>
                {entry.relation !== 'auto'
                  ? <span className="pill pill-soft" style={{ fontSize: 9 }}>{entry.relation}</span>
                  : <span className="fig" style={{ fontSize: 11 }}>auto</span>}
              </div>
            ))}
          </StructCard>
        )}

        {/* Shop links */}
        {shopLinks && shopLinks.length > 0 && (
          <StructCard>
            <Sec
              h="Shop the story"
              meta="products linked from the post"
              right={<span className="mono" style={{ fontSize: 10, color: 'var(--ink-soft)' }}>+ link · ⌘K</span>}
            />
            {shopLinks.map(link => (
              <div key={link.id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 0', borderBottom: '1px solid var(--rule-soft)',
              }}>
                <div style={{
                  width: 36, height: 36, flexShrink: 0,
                  background: `${link.accentHex ?? '#d4a017'}44 repeating-linear-gradient(45deg, rgba(26,20,16,.04) 0 6px, transparent 6px 12px)`,
                  borderRadius: 2,
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 500 }}>{link.title}</div>
                  <div className="fig" style={{ fontSize: 11 }}>{link.subline}</div>
                </div>
                <span className="mono" style={{ fontSize: 13, fontWeight: 600 }}>{link.price}</span>
                <button type="button" style={{ background: 'none', border: 'none', color: 'var(--ink-faint)', cursor: 'pointer', fontSize: 14 }}>×</button>
              </div>
            ))}
          </StructCard>
        )}

        {/* SEO summary */}
        <StructCard>
          <Sec
            h="SEO summary"
            meta="full editor below"
            right={<span className="accent" style={{ fontFamily: 'var(--font-geist)', fontSize: 11, fontWeight: 500 }}>
              {metaTitle && metaDescription ? 'good · filled' : 'incomplete'}
            </span>}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div>
              <label style={{ fontFamily: 'var(--font-geist-mono)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-soft)', display: 'block', marginBottom: 4 }}>Slug</label>
              <input
                value={slug}
                onChange={e => onSlugChange(e.target.value)}
                style={{
                  width: '100%', background: 'var(--paper-2)', border: '1px solid var(--rule)',
                  borderRadius: 2, padding: '5px 8px', fontSize: 12,
                  fontFamily: 'var(--font-geist-mono)', color: 'var(--ink)',
                }}
              />
            </div>
            <div>
              <label style={{ fontFamily: 'var(--font-geist-mono)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-soft)', display: 'block', marginBottom: 4 }}>Meta title</label>
              <input
                value={metaTitle}
                onChange={e => onMetaTitleChange(e.target.value)}
                placeholder="SEO title (defaults to post title)"
                style={{
                  width: '100%', background: 'var(--paper-2)', border: '1px solid var(--rule)',
                  borderRadius: 2, padding: '5px 8px', fontSize: 12, color: 'var(--ink)',
                }}
              />
              <div className="fig" style={{ fontSize: 10, marginTop: 2 }}>{metaTitle.length}/60 characters</div>
            </div>
            <div>
              <label style={{ fontFamily: 'var(--font-geist-mono)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-soft)', display: 'block', marginBottom: 4 }}>Meta description</label>
              <textarea
                value={metaDescription}
                onChange={e => onMetaDescriptionChange(e.target.value)}
                placeholder="SEO description (defaults to excerpt)"
                rows={3}
                style={{
                  width: '100%', background: 'var(--paper-2)', border: '1px solid var(--rule)',
                  borderRadius: 2, padding: '5px 8px', fontSize: 12, color: 'var(--ink)',
                  resize: 'vertical', fontFamily: 'inherit',
                }}
              />
              <div className="fig" style={{ fontSize: 10, marginTop: 2 }}>{metaDescription.length}/160 characters</div>
            </div>
          </div>
        </StructCard>
      </div>
    </div>
  );
}
