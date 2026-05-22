'use client';

import { useState, useEffect, useCallback } from 'react';
import type {
  Category,
  Tag,
  ApiSeries,
  ApiPostSeries,
  ApiContributor,
  ApiRelatedPost,
} from './types';

// ── Local display types (derived from API shapes) ─────────────────────────────

interface ContributorUi {
  readonly postId: string;
  readonly userId: string;
  readonly role: string;
  readonly position: number;
  readonly name: string;
  readonly email: string;
  readonly initials: string;
  readonly avatar: string | null;
}

interface RelatedEntryUi {
  readonly postId: string;
  readonly relatedPostId: string;
  readonly position: number;
  readonly title: string;
  readonly slug: string;
  readonly status: string;
}

interface ShopLink {
  readonly id: string;
  readonly title: string;
  readonly subline: string;
  readonly price: string;
  readonly accentHex?: string;
}

interface StructureTabProps {
  readonly postId?: string;
  readonly allSeries: ReadonlyArray<ApiSeries>;
  readonly categories: ReadonlyArray<Category>;
  readonly selectedCategoryIds: ReadonlyArray<string>;
  readonly onToggleCategory: (id: string) => void;
  readonly tags: ReadonlyArray<Tag>;
  readonly selectedTagIds: ReadonlyArray<string>;
  readonly onToggleTag: (id: string) => void;
  readonly shopLinks?: ReadonlyArray<ShopLink>;
  readonly metaTitle: string;
  readonly metaDescription: string;
  readonly onMetaTitleChange: (v: string) => void;
  readonly onMetaDescriptionChange: (v: string) => void;
  readonly slug: string;
  readonly onSlugChange: (v: string) => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function initials(name: string | null, email: string): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

function toContributorUi(c: ApiContributor): ContributorUi {
  return {
    postId: c.postId,
    userId: c.userId,
    role: c.role,
    position: c.position,
    name: c.user.name ?? c.user.email,
    email: c.user.email,
    initials: initials(c.user.name, c.user.email),
    avatar: c.user.avatar,
  };
}

function toRelatedEntryUi(r: ApiRelatedPost): RelatedEntryUi {
  return {
    postId: r.postId,
    relatedPostId: r.relatedPostId,
    position: r.position,
    title: r.relatedPost.title,
    slug: r.relatedPost.slug,
    status: r.relatedPost.status,
  };
}

// ── Sub-components ────────────────────────────────────────────────────────────

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
        {meta !== undefined && <span className="fig" style={{ fontSize: 11 }}>· {meta}</span>}
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

// ── SeriesCard ─────────────────────────────────────────────────────────────────

function SeriesCard({
  postId,
  allSeries,
  memberships,
  loading,
  error,
  onAdd,
  onRemove,
  savingSeriesId,
}: {
  postId: string | undefined;
  allSeries: ReadonlyArray<ApiSeries>;
  memberships: ReadonlyArray<ApiPostSeries>;
  loading: boolean;
  error: string | null;
  onAdd: (seriesId: string) => void;
  onRemove: (seriesId: string) => void;
  savingSeriesId: string | null;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const memberIds = new Set(memberships.map(m => m.seriesId));

  const seriesColors: Record<string, string> = {
    PUBLISHED: 'var(--accent)',
    DRAFT: 'var(--gold)',
    plan: 'var(--rule)',
  };

  return (
    <StructCard>
      <Sec h="Series" meta="part of an ordered run" />

      {loading && (
        <div className="fig" style={{ fontSize: 11, marginBottom: 8 }}>Loading series…</div>
      )}
      {!loading && error !== null && (
        <div style={{ fontSize: 11, color: 'var(--ink-soft)', marginBottom: 8 }}>{error}</div>
      )}

      {/* Current memberships */}
      {memberships.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          {memberships.map(m => (
            <div key={m.seriesId} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '6px 0', borderBottom: '1px solid var(--rule-soft)',
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 500 }}>{m.series.title}</div>
                <div className="fig" style={{ fontSize: 11 }}>position {m.position} · {m.series.postCount} posts</div>
              </div>
              {/* Progress bar placeholder */}
              <div style={{ display: 'flex', gap: 2 }}>
                {Array.from({ length: Math.min(m.series.postCount, 6) }).map((_, i) => (
                  <div key={i} style={{
                    width: 18, height: 18,
                    background: i === m.position ? 'var(--ink)' : seriesColors['PUBLISHED'],
                    border: '1px solid var(--ink)', borderRadius: 2,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-geist-mono)', fontSize: 8,
                    color: 'var(--paper)',
                  }}>{i + 1}</div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => onRemove(m.seriesId)}
                disabled={savingSeriesId === m.seriesId || !postId}
                style={{ background: 'none', border: 'none', color: 'var(--ink-faint)', cursor: 'pointer', fontSize: 14, padding: '0 2px' }}
              >×</button>
            </div>
          ))}
        </div>
      )}

      {memberships.length === 0 && !loading && (
        <div className="fig" style={{ fontSize: 12, marginBottom: 8 }}>Not part of any series</div>
      )}

      {/* Add to series */}
      <div>
        <button
          className="btn"
          type="button"
          style={{ fontSize: 11, marginBottom: pickerOpen ? 8 : 0 }}
          onClick={() => setPickerOpen(p => !p)}
          disabled={!postId}
        >
          {pickerOpen ? 'Cancel' : '+ Add to series'}
        </button>

        {pickerOpen && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {allSeries.length === 0 && (
              <div className="fig" style={{ fontSize: 12 }}>No series yet — create one first</div>
            )}
            {allSeries.map(s => (
              <button
                key={s.id}
                type="button"
                onClick={() => { onAdd(s.id); setPickerOpen(false); }}
                disabled={memberIds.has(s.id) || savingSeriesId === s.id}
                style={{
                  background: memberIds.has(s.id) ? 'var(--paper-3)' : 'var(--paper-2)',
                  border: `1px solid ${memberIds.has(s.id) ? 'var(--accent)' : 'var(--rule)'}`,
                  borderRadius: 2, padding: '6px 10px', cursor: memberIds.has(s.id) ? 'default' : 'pointer',
                  textAlign: 'left', fontSize: 12, color: 'var(--ink)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}
              >
                <span style={{ fontFamily: 'var(--font-display)' }}>{s.title}</span>
                <span className="fig" style={{ fontSize: 11 }}>
                  {memberIds.has(s.id) ? 'already added' : `${s.postCount} posts`}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </StructCard>
  );
}

// ── ContributorsCard ──────────────────────────────────────────────────────────

function ContributorsCard({
  postId,
  contributors,
  loading,
  error,
  onRemove,
  savingUserId,
}: {
  postId: string | undefined;
  contributors: ReadonlyArray<ContributorUi>;
  loading: boolean;
  error: string | null;
  onRemove: (userId: string) => void;
  savingUserId: string | null;
}) {
  const ACCENT_COLORS = ['var(--accent)', 'var(--gold)', 'var(--moss)', 'var(--ink)'];

  return (
    <StructCard>
      <Sec h="Contributors" meta="byline + credits" />

      {loading && (
        <div className="fig" style={{ fontSize: 11, marginBottom: 8 }}>Loading contributors…</div>
      )}
      {!loading && error !== null && (
        <div style={{ fontSize: 11, color: 'var(--ink-soft)', marginBottom: 8 }}>{error}</div>
      )}

      {contributors.length === 0 && !loading && (
        <div className="fig" style={{ fontSize: 12, marginBottom: 8 }}>No contributors yet</div>
      )}

      {contributors.map((c, i) => (
        <div key={c.userId} style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '8px 0', borderBottom: '1px solid var(--rule-soft)',
        }}>
          <div style={{
            width: 30, height: 30,
            background: ACCENT_COLORS[i % ACCENT_COLORS.length],
            color: 'var(--paper)',
            borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 500, flexShrink: 0,
          }}>
            {c.avatar ? (
              <img src={c.avatar} alt={c.initials} style={{ width: 30, height: 30, borderRadius: 2, objectFit: 'cover' }} />
            ) : c.initials}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 500 }}>{c.name}</div>
            <div className="fig" style={{ fontSize: 11 }}>{c.role}</div>
          </div>
          <button
            type="button"
            onClick={() => onRemove(c.userId)}
            disabled={savingUserId === c.userId || !postId}
            style={{ background: 'none', border: 'none', color: 'var(--ink-faint)', cursor: 'pointer', fontSize: 14, padding: '0 2px' }}
          >×</button>
        </div>
      ))}

      {/* Note: "add contributor" requires a user search — shown as non-interactive placeholder */}
      <div style={{
        marginTop: 8, padding: '6px 10px', fontSize: 11,
        color: 'var(--ink-faint)', fontFamily: 'var(--font-geist-mono)',
        border: '1px dashed var(--rule)', borderRadius: 2,
      }}>
        + add contributor — user search coming
      </div>
    </StructCard>
  );
}

// ── RelatedCard ───────────────────────────────────────────────────────────────

function RelatedCard({
  postId,
  entries,
  loading,
  error,
  onRemove,
  savingRelatedId,
}: {
  postId: string | undefined;
  entries: ReadonlyArray<RelatedEntryUi>;
  loading: boolean;
  error: string | null;
  onRemove: (relatedPostId: string) => void;
  savingRelatedId: string | null;
}) {
  const ACCENT_HEX = '#8b2c1f';

  return (
    <StructCard>
      <Sec h="Related" meta="auto-linked at the bottom of the article" />

      {loading && (
        <div className="fig" style={{ fontSize: 11, marginBottom: 8 }}>Loading related posts…</div>
      )}
      {!loading && error !== null && (
        <div style={{ fontSize: 11, color: 'var(--ink-soft)', marginBottom: 8 }}>{error}</div>
      )}

      {entries.length === 0 && !loading && (
        <div className="fig" style={{ fontSize: 12, marginBottom: 8 }}>No related posts linked</div>
      )}

      <div className="eyebrow-ink" style={{ marginBottom: 6 }}>
        Linked entries · {entries.length} total
      </div>

      {entries.map(entry => (
        <div key={entry.relatedPostId} style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '8px 0', borderBottom: '1px solid var(--rule-soft)',
        }}>
          <div style={{
            width: 36, height: 36, flexShrink: 0,
            background: `${ACCENT_HEX}22 repeating-linear-gradient(45deg, rgba(26,20,16,.04) 0 6px, transparent 6px 12px)`,
            borderRadius: 2,
          }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.title}</div>
            <div className="fig" style={{ fontSize: 11 }}>{entry.status} · /{entry.slug}</div>
          </div>
          <button
            type="button"
            onClick={() => onRemove(entry.relatedPostId)}
            disabled={savingRelatedId === entry.relatedPostId || !postId}
            style={{ background: 'none', border: 'none', color: 'var(--ink-faint)', cursor: 'pointer', fontSize: 14, padding: '0 2px' }}
          >×</button>
        </div>
      ))}

      <div style={{
        marginTop: 8, padding: '6px 10px', fontSize: 11,
        color: 'var(--ink-faint)', fontFamily: 'var(--font-geist-mono)',
        border: '1px dashed var(--rule)', borderRadius: 2,
      }}>
        + link related post — post search coming
      </div>
    </StructCard>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function StructureTab({
  postId,
  allSeries,
  categories, selectedCategoryIds, onToggleCategory,
  tags, selectedTagIds, onToggleTag,
  shopLinks,
  metaTitle, metaDescription, onMetaTitleChange, onMetaDescriptionChange,
  slug, onSlugChange,
}: StructureTabProps) {
  // ── Series state ────────────────────────────────────────────────────────────
  const [seriesMemberships, setSeriesMemberships] = useState<ReadonlyArray<ApiPostSeries>>([]);
  const [seriesLoading, setSeriesLoading] = useState(false);
  const [seriesError, setSeriesError] = useState<string | null>(null);
  const [savingSeriesId, setSavingSeriesId] = useState<string | null>(null);

  // ── Contributors state ──────────────────────────────────────────────────────
  const [contributors, setContributors] = useState<ReadonlyArray<ContributorUi>>([]);
  const [contributorsLoading, setContributorsLoading] = useState(false);
  const [contributorsError, setContributorsError] = useState<string | null>(null);
  const [savingUserId, setSavingUserId] = useState<string | null>(null);

  // ── Related state ────────────────────────────────────────────────────────────
  const [relatedEntries, setRelatedEntries] = useState<ReadonlyArray<RelatedEntryUi>>([]);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [relatedError, setRelatedError] = useState<string | null>(null);
  const [savingRelatedId, setSavingRelatedId] = useState<string | null>(null);

  // ── Load all three datasets when postId becomes available ───────────────────
  useEffect(() => {
    if (!postId) return;
    const abort = new AbortController();

    // Series memberships
    setSeriesLoading(true);
    setSeriesError(null);
    fetch(`/api/cms/blog/posts/${postId}/series`, { signal: abort.signal })
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((d: unknown) => {
        if (d !== null && typeof d === 'object' && 'data' in d && Array.isArray((d as { data: unknown }).data)) {
          setSeriesMemberships((d as { data: ReadonlyArray<ApiPostSeries> }).data);
        }
      })
      .catch((err: unknown) => {
        if (err instanceof Error && err.name !== 'AbortError') setSeriesError('Could not load series');
      })
      .finally(() => setSeriesLoading(false));

    // Contributors
    setContributorsLoading(true);
    setContributorsError(null);
    fetch(`/api/cms/blog/posts/${postId}/contributors`, { signal: abort.signal })
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((d: unknown) => {
        if (d !== null && typeof d === 'object' && 'data' in d && Array.isArray((d as { data: unknown }).data)) {
          setContributors((d as { data: ReadonlyArray<ApiContributor> }).data.map(toContributorUi));
        }
      })
      .catch((err: unknown) => {
        if (err instanceof Error && err.name !== 'AbortError') setContributorsError('Could not load contributors');
      })
      .finally(() => setContributorsLoading(false));

    // Related posts
    setRelatedLoading(true);
    setRelatedError(null);
    fetch(`/api/cms/blog/posts/${postId}/related`, { signal: abort.signal })
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((d: unknown) => {
        if (d !== null && typeof d === 'object' && 'data' in d && Array.isArray((d as { data: unknown }).data)) {
          setRelatedEntries((d as { data: ReadonlyArray<ApiRelatedPost> }).data.map(toRelatedEntryUi));
        }
      })
      .catch((err: unknown) => {
        if (err instanceof Error && err.name !== 'AbortError') setRelatedError('Could not load related posts');
      })
      .finally(() => setRelatedLoading(false));

    return () => abort.abort();
  }, [postId]);

  // ── Series handlers ─────────────────────────────────────────────────────────

  const handleAddToSeries = useCallback(async (seriesId: string): Promise<void> => {
    if (!postId) return;
    setSavingSeriesId(seriesId);

    // Optimistic: find series info
    const seriesInfo = allSeries.find(s => s.id === seriesId);
    if (!seriesInfo) { setSavingSeriesId(null); return; }

    const optimisticEntry: ApiPostSeries = {
      postId,
      seriesId,
      position: seriesMemberships.length,
      series: { id: seriesId, title: seriesInfo.title, slug: seriesInfo.slug, postCount: seriesInfo.postCount },
    };

    setSeriesMemberships(prev => [...prev, optimisticEntry]);

    try {
      const res = await fetch(`/api/cms/blog/posts/${postId}/series`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seriesId }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const d: unknown = await res.json();
      if (d !== null && typeof d === 'object' && 'data' in d) {
        const record = (d as { data: ApiPostSeries }).data;
        setSeriesMemberships(prev =>
          prev.map(m => m.seriesId === seriesId ? { ...m, position: record.position } : m),
        );
      }
    } catch {
      setSeriesMemberships(prev => prev.filter(m => m.seriesId !== seriesId));
      setSeriesError('Failed to add series');
    } finally {
      setSavingSeriesId(null);
    }
  }, [postId, allSeries, seriesMemberships.length]);

  const handleRemoveFromSeries = useCallback(async (seriesId: string): Promise<void> => {
    if (!postId) return;
    setSavingSeriesId(seriesId);

    const snapshot = seriesMemberships.slice();
    setSeriesMemberships(prev => prev.filter(m => m.seriesId !== seriesId));

    try {
      const res = await fetch(`/api/cms/blog/posts/${postId}/series`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seriesId }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch {
      setSeriesMemberships(snapshot);
      setSeriesError('Failed to remove series');
    } finally {
      setSavingSeriesId(null);
    }
  }, [postId, seriesMemberships]);

  // ── Contributor handlers ────────────────────────────────────────────────────

  const handleRemoveContributor = useCallback(async (userId: string): Promise<void> => {
    if (!postId) return;
    setSavingUserId(userId);

    const snapshot = contributors.slice();
    setContributors(prev => prev.filter(c => c.userId !== userId));

    try {
      const res = await fetch(`/api/cms/blog/posts/${postId}/contributors`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch {
      setContributors(snapshot);
      setContributorsError('Failed to remove contributor');
    } finally {
      setSavingUserId(null);
    }
  }, [postId, contributors]);

  // ── Related handlers ────────────────────────────────────────────────────────

  const handleRemoveRelated = useCallback(async (relatedPostId: string): Promise<void> => {
    if (!postId) return;
    setSavingRelatedId(relatedPostId);

    const snapshot = relatedEntries.slice();
    setRelatedEntries(prev => prev.filter(e => e.relatedPostId !== relatedPostId));

    try {
      const res = await fetch(`/api/cms/blog/posts/${postId}/related`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ relatedPostId }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch {
      setRelatedEntries(snapshot);
      setRelatedError('Failed to remove related post');
    } finally {
      setSavingRelatedId(null);
    }
  }, [postId, relatedEntries]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>
      {/* LEFT column */}
      <div>
        {/* Series */}
        <SeriesCard
          postId={postId}
          allSeries={allSeries}
          memberships={seriesMemberships}
          loading={seriesLoading}
          error={seriesError}
          onAdd={handleAddToSeries}
          onRemove={handleRemoveFromSeries}
          savingSeriesId={savingSeriesId}
        />

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
        <ContributorsCard
          postId={postId}
          contributors={contributors}
          loading={contributorsLoading}
          error={contributorsError}
          onRemove={handleRemoveContributor}
          savingUserId={savingUserId}
        />
      </div>

      {/* RIGHT column */}
      <div>
        {/* Related entries */}
        <RelatedCard
          postId={postId}
          entries={relatedEntries}
          loading={relatedLoading}
          error={relatedError}
          onRemove={handleRemoveRelated}
          savingRelatedId={savingRelatedId}
        />

        {/* Shop links */}
        {shopLinks !== undefined && shopLinks.length > 0 && (
          <StructCard>
            <Sec
              h="Shop the story"
              meta="products linked from the post"
              right={<span className="mono" style={{ fontSize: 10, color: 'var(--ink-soft)' }}>+ link · ⌘K</span>}
            />
            {shopLinks.map(link => (
              <div key={link.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--rule-soft)' }}>
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
                style={{ width: '100%', background: 'var(--paper-2)', border: '1px solid var(--rule)', borderRadius: 2, padding: '5px 8px', fontSize: 12, fontFamily: 'var(--font-geist-mono)', color: 'var(--ink)' }}
              />
            </div>
            <div>
              <label style={{ fontFamily: 'var(--font-geist-mono)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-soft)', display: 'block', marginBottom: 4 }}>Meta title</label>
              <input
                value={metaTitle}
                onChange={e => onMetaTitleChange(e.target.value)}
                placeholder="SEO title (defaults to post title)"
                style={{ width: '100%', background: 'var(--paper-2)', border: '1px solid var(--rule)', borderRadius: 2, padding: '5px 8px', fontSize: 12, color: 'var(--ink)' }}
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
                style={{ width: '100%', background: 'var(--paper-2)', border: '1px solid var(--rule)', borderRadius: 2, padding: '5px 8px', fontSize: 12, color: 'var(--ink)', resize: 'vertical', fontFamily: 'inherit' }}
              />
              <div className="fig" style={{ fontSize: 10, marginTop: 2 }}>{metaDescription.length}/160 characters</div>
            </div>
          </div>
        </StructCard>

        {/* Unsaved post banner */}
        {!postId && (
          <div style={{ background: 'var(--paper-2)', border: '1px dashed var(--rule)', borderRadius: 4, padding: '8px 12px', fontSize: 12, color: 'var(--ink-faint)', fontFamily: 'var(--font-geist-mono)' }}>
            Save this post first to manage series, contributors, and related entries.
          </div>
        )}
      </div>
    </div>
  );
}

