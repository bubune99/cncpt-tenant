'use client';

import { useState, useEffect, useCallback } from 'react';
import type {
  ApiPostChannel,
  ApiDistributionChannel,
  ApiChannelPublishStatus,
} from './types';

// ── Local UI types ────────────────────────────────────────────────────────────

type ChannelId = 'web' | 'newsletter' | 'rss' | 'x' | 'mastodon' | 'instagram';
type ChannelStatus = 'live' | 'queued' | 'auto' | 'draft';

interface ChannelUi {
  readonly id: ChannelId;
  readonly label: string;
  readonly glyph: string;
  readonly apiKey: ApiDistributionChannel;
  readonly status: ChannelStatus;
  readonly when: string;
  readonly enabled: boolean;
  readonly copy: string;
  readonly scheduledAt: string;
}

interface NewsletterConfig {
  readonly fromName: string;
  readonly fromEmail: string;
  readonly audience: string;
  readonly subject: string;
  readonly preheader: string;
  readonly subscriberCount: number;
  readonly openRate: number;
}

interface SocialConfig {
  readonly handle: string;
  readonly displayName: string;
  readonly followerCount: string;
  readonly copy: string;
  readonly hashtags: ReadonlyArray<string>;
}

interface ScheduleSlot {
  readonly channelId: ChannelId;
  readonly dayIndex: number;
  readonly time: string;
  readonly isDraft?: boolean;
}

interface DistributeTabProps {
  readonly postId?: string;
  readonly postTitle: string;
  readonly postSlug: string;
  readonly newsletter?: NewsletterConfig;
  readonly social?: SocialConfig;
  readonly scheduleSlots?: ReadonlyArray<ScheduleSlot>;
  readonly onPublishAll: () => void;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const SCHEDULE_DAYS = ['Fri 16', 'Sat 17', 'Sun 18', 'Mon 19', 'Tue 20', 'Wed 21'] as const;

const CHANNEL_COLORS: Record<ChannelId, string> = {
  web:       'var(--accent)',
  newsletter:'var(--gold)',
  rss:       'var(--ink)',
  x:         'var(--ink)',
  mastodon:  'var(--moss)',
  instagram: 'var(--ink-faint)',
};

const STATUS_DOT_COLOR: Record<ChannelStatus, string> = {
  live:   'var(--moss)',
  queued: 'var(--gold)',
  auto:   'var(--ink-soft)',
  draft:  'var(--ink-faint)',
};

const API_KEY_MAP: Record<ChannelId, ApiDistributionChannel> = {
  web:       'WEB',
  newsletter:'NEWSLETTER',
  rss:       'RSS',
  x:         'TWITTER_X',
  mastodon:  'MASTODON',
  instagram: 'INSTAGRAM',
};

const ID_FROM_API: Record<ApiDistributionChannel, ChannelId> = {
  WEB:       'web',
  NEWSLETTER:'newsletter',
  RSS:       'rss',
  TWITTER_X: 'x',
  MASTODON:  'mastodon',
  INSTAGRAM: 'instagram',
};

function apiStatusToUi(s: ApiChannelPublishStatus, enabled: boolean): ChannelStatus {
  if (s === 'PUBLISHED') return 'live';
  if (s === 'SCHEDULED') return 'queued';
  if (!enabled) return 'draft';
  return 'auto';
}

function scheduledWhen(scheduledAt: string): string {
  return `${new Date(scheduledAt).toLocaleString([], {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })} · scheduled`;
}

function buildDefaultChannels(): ReadonlyArray<ChannelUi> {
  return [
    { id: 'web',        label: 'Web',        glyph: '⌂', apiKey: 'WEB',        status: 'live',   when: 'live in 1h · auto',    enabled: true,  copy: '', scheduledAt: '' },
    { id: 'newsletter', label: 'Newsletter', glyph: '✉', apiKey: 'NEWSLETTER', status: 'queued', when: 'Sat 09:00 · queued',    enabled: true,  copy: '', scheduledAt: '' },
    { id: 'rss',        label: 'RSS',        glyph: '⊿', apiKey: 'RSS',        status: 'auto',   when: 'on publish · auto',     enabled: true,  copy: '', scheduledAt: '' },
    { id: 'x',          label: 'X',          glyph: 'x', apiKey: 'TWITTER_X',  status: 'queued', when: 'Sat 11:00 · queued',    enabled: true,  copy: '', scheduledAt: '' },
    { id: 'mastodon',   label: 'Mastodon',   glyph: 'M', apiKey: 'MASTODON',   status: 'queued', when: 'Sat 11:00 · queued',    enabled: true,  copy: '', scheduledAt: '' },
    { id: 'instagram',  label: 'Instagram',  glyph: '◯', apiKey: 'INSTAGRAM',  status: 'draft',  when: 'draft · needs caption', enabled: false, copy: '', scheduledAt: '' },
  ];
}

function applyRecord(ch: ChannelUi, rec: ApiPostChannel): ChannelUi {
  const status = apiStatusToUi(rec.status, rec.enabled);
  const when = rec.scheduledAt
    ? scheduledWhen(rec.scheduledAt)
    : status === 'live' ? 'live' : status === 'auto' ? 'on publish · auto' : 'draft';
  return {
    ...ch,
    enabled: rec.enabled,
    status,
    when,
    copy: rec.copy ?? '',
    scheduledAt: rec.scheduledAt ?? '',
  };
}

function mergeChannels(
  defaults: ReadonlyArray<ChannelUi>,
  records: ReadonlyArray<ApiPostChannel>,
): ReadonlyArray<ChannelUi> {
  return defaults.map(ch => {
    const rec = records.find(r => r.channel === ch.apiKey);
    return rec ? applyRecord(ch, rec) : ch;
  });
}

const DEFAULT_SLOTS: ReadonlyArray<ScheduleSlot> = [
  { channelId: 'web',        dayIndex: 0, time: '10:00 →LIVE' },
  { channelId: 'rss',        dayIndex: 0, time: 'auto' },
  { channelId: 'newsletter', dayIndex: 1, time: '09:00' },
  { channelId: 'x',          dayIndex: 1, time: '11:00' },
  { channelId: 'mastodon',   dayIndex: 1, time: '11:01' },
  { channelId: 'instagram',  dayIndex: 2, time: 'draft', isDraft: true },
];

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
        {meta && <span className="fig" style={{ fontSize: 11 }}>· {meta}</span>}
      </span>
      {right}
    </div>
  );
}

function ChannelTile({
  channel, isActive, onClick,
}: {
  channel: ChannelUi;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: isActive ? 'var(--ink)' : 'var(--paper-2)',
        border: `1px solid ${isActive ? 'var(--ink)' : 'var(--rule)'}`,
        borderRadius: 4, padding: '10px 12px', cursor: 'pointer',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
        minWidth: 80, flex: 1,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <div style={{
          width: 7, height: 7, borderRadius: '50%',
          background: isActive ? 'var(--paper)' : STATUS_DOT_COLOR[channel.status],
        }} />
      </div>
      <div style={{
        fontSize: 18, lineHeight: 1,
        color: isActive ? 'var(--paper)' : 'var(--ink)',
        fontFamily: 'var(--font-display)',
      }}>{channel.glyph}</div>
      <div style={{
        fontFamily: 'var(--font-geist-mono)', fontSize: 10, letterSpacing: '0.06em',
        color: isActive ? 'var(--paper)' : 'var(--ink)',
      }}>{channel.label}</div>
      <div style={{
        fontSize: 10, color: isActive ? 'rgba(255,255,255,0.6)' : 'var(--ink-faint)',
        fontFamily: 'var(--font-display)', fontStyle: 'italic',
      }}>{channel.when}</div>
    </button>
  );
}

function ChannelDetailPanel({
  channel,
  isSaving,
  onToggle,
  onCopyChange,
  onCopyBlur,
  onScheduleChange,
  onScheduleBlur,
}: {
  channel: ChannelUi;
  isSaving: boolean;
  onToggle: (id: ChannelId) => void;
  onCopyChange: (id: ChannelId, copy: string) => void;
  onCopyBlur: (id: ChannelId) => void;
  onScheduleChange: (id: ChannelId, scheduledAt: string) => void;
  onScheduleBlur: (id: ChannelId) => void;
}) {
  return (
    <div style={{
      background: 'var(--paper)', border: '1px solid var(--rule)', borderRadius: 4,
      padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      <Sec
        h={channel.label}
        meta={channel.when}
        right={
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
            <span className="fig" style={{ fontSize: 11 }}>{channel.enabled ? 'enabled' : 'disabled'}</span>
            <input
              type="checkbox"
              checked={channel.enabled}
              disabled={isSaving}
              onChange={() => onToggle(channel.id)}
              style={{ accentColor: 'var(--accent)', width: 14, height: 14 }}
            />
          </label>
        }
      />

      <div>
        <label style={{
          fontFamily: 'var(--font-geist-mono)', fontSize: 10, letterSpacing: '0.1em',
          textTransform: 'uppercase', color: 'var(--ink-soft)', display: 'block', marginBottom: 4,
        }}>Custom copy (optional)</label>
        <textarea
          value={channel.copy}
          onChange={e => onCopyChange(channel.id, e.target.value)}
          onBlur={() => onCopyBlur(channel.id)}
          disabled={isSaving}
          placeholder="Leave blank to use the post excerpt"
          rows={3}
          style={{
            width: '100%', background: 'var(--paper-2)', border: '1px solid var(--rule)',
            borderRadius: 2, padding: '5px 8px', fontSize: 12, color: 'var(--ink)',
            resize: 'vertical', fontFamily: 'var(--font-display)',
          }}
        />
      </div>

      <div>
        <label style={{
          fontFamily: 'var(--font-geist-mono)', fontSize: 10, letterSpacing: '0.1em',
          textTransform: 'uppercase', color: 'var(--ink-soft)', display: 'block', marginBottom: 4,
        }}>Schedule (optional — blank = on publish)</label>
        <input
          type="datetime-local"
          value={channel.scheduledAt ? channel.scheduledAt.slice(0, 16) : ''}
          onChange={e => onScheduleChange(channel.id, e.target.value)}
          onBlur={() => onScheduleBlur(channel.id)}
          disabled={isSaving}
          style={{
            background: 'var(--paper-2)', border: '1px solid var(--rule)',
            borderRadius: 2, padding: '5px 8px', fontSize: 12, color: 'var(--ink)',
            fontFamily: 'var(--font-geist-mono)',
          }}
        />
      </div>

      {isSaving && (
        <div className="fig" style={{ fontSize: 11 }}>saving…</div>
      )}
    </div>
  );
}

function NewsletterPanel({ config, postTitle }: { config: NewsletterConfig; postTitle: string }) {
  return (
    <div style={{
      background: 'var(--paper)', border: '1px solid var(--rule)', borderRadius: 4, padding: '14px 16px',
    }}>
      <Sec
        h="Newsletter · Studio Weekly"
        meta={`${config.subscriberCount.toLocaleString()} subscribers · open rate ${config.openRate}%`}
        right={<span className="pill pill-solid-gold">QUEUED</span>}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
        {([
          ['from', `${config.fromName} <${config.fromEmail}>`],
          ['audience', config.audience],
          ['subject', config.subject],
          ['preheader', config.preheader],
        ] as ReadonlyArray<readonly [string, string]>).map(([label, value]) => (
          <div key={label} style={{ display: 'flex', gap: 8, alignItems: 'baseline', borderBottom: '1px solid var(--rule-soft)', padding: '3px 0' }}>
            <span className="mono" style={{ fontSize: 10, color: 'var(--ink-faint)', width: 70, letterSpacing: '0.08em' }}>{label}</span>
            <span style={{ fontSize: 12, color: 'var(--ink)', flex: 1, fontFamily: label === 'preheader' ? 'var(--font-display)' : 'inherit', fontStyle: label === 'preheader' ? 'italic' : 'normal' }}>{value}</span>
          </div>
        ))}
      </div>
      <div style={{ background: 'var(--paper-2)', border: '1px solid var(--rule-soft)', borderRadius: 2, padding: '14px 16px' }}>
        <div className="fig" style={{ fontSize: 10, marginBottom: 8 }}>From <strong>{config.fromName}</strong> · Preview</div>
        <div className="display" style={{ fontSize: 22, lineHeight: 1.1, letterSpacing: '-0.015em' }}>{postTitle || 'Untitled article'} —</div>
        <div className="display-i" style={{ fontSize: 16, color: 'var(--ink-soft)', lineHeight: 1.2, marginBottom: 10 }}>{config.preheader}</div>
        <div style={{ borderTop: '1px solid var(--rule-soft)', paddingTop: 10 }}>
          <p style={{ fontSize: 13, lineHeight: 1.55, margin: '0 0 8px', fontFamily: 'var(--font-display)' }}>
            {config.preheader} Here is what it asked of us, and what it gave back…
          </p>
          <a href="#" style={{ color: 'var(--accent)', textDecoration: 'none', borderBottom: '1px solid var(--accent)', fontSize: 13 }}>
            Read the full piece →
          </a>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, fontSize: 12 }}>
        <span className="fig">Last test send · just now</span>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn" style={{ fontSize: 11, padding: '4px 10px' }} type="button">Test send</button>
          <button className="btn" style={{ fontSize: 11, padding: '4px 10px' }} type="button">Reschedule</button>
        </div>
      </div>
    </div>
  );
}

function SocialPanel({ config }: { config: SocialConfig }) {
  return (
    <div style={{ background: 'var(--paper)', border: '1px solid var(--rule)', borderRadius: 4, padding: '14px 16px' }}>
      <Sec
        h="Social · X &amp; Mastodon"
        meta="2 platforms · same copy by default"
        right={<span className="pill pill-solid-gold">QUEUED</span>}
      />
      <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
        <span className="pill pill-solid-ink">X · {config.copy.length} chars</span>
        <span className="pill pill-out">Mastodon · same</span>
      </div>
      <div style={{ background: 'var(--paper-2)', border: '1px solid var(--rule-soft)', borderRadius: 2, padding: '12px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{ width: 32, height: 32, background: 'var(--accent)', color: 'var(--paper)', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600 }}>SM</div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 500 }}>{config.displayName}</div>
            <div className="fig" style={{ fontSize: 11 }}>{config.handle} · {config.followerCount}</div>
          </div>
          <span className="mono" style={{ marginLeft: 'auto', fontSize: 9.5, color: 'var(--ink-soft)' }}>{config.copy.length}/280</span>
        </div>
        <div style={{ fontSize: 13, lineHeight: 1.55, fontFamily: 'var(--font-display)', color: 'var(--ink)' }}>{config.copy}</div>
        <div style={{ marginTop: 8, height: 60, background: 'var(--paper-3)', border: '1px dashed var(--rule)', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-faint)', fontSize: 11 }}>og card · auto-pulled from cover</div>
      </div>
      <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <div className="eyebrow-ink" style={{ marginBottom: 6 }}>Hashtags</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {config.hashtags.map(tag => (
              <span key={tag} style={{ padding: '2px 8px', fontSize: 11, cursor: 'pointer', borderRadius: 2, background: 'var(--accent-soft)', color: 'var(--accent)', border: '1px solid var(--accent)', fontFamily: 'var(--font-geist)' }}>{tag}</span>
            ))}
          </div>
        </div>
        <div>
          <div className="eyebrow-ink" style={{ marginBottom: 6 }}>Card</div>
          <div style={{ height: 60, background: 'var(--paper-3)', border: '1px dashed var(--rule)', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-faint)', fontSize: 10 }}>og · auto-pulled from cover</div>
          <div className="fig" style={{ fontSize: 10, marginTop: 4 }}>override available</div>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, marginTop: 10 }}>
        <button className="btn" style={{ fontSize: 11, padding: '4px 10px' }} type="button">Preview</button>
        <button className="btn" style={{ fontSize: 11, padding: '4px 10px' }} type="button">Edit per-platform</button>
      </div>
    </div>
  );
}

function ScheduleStrip({ slots }: { slots: ReadonlyArray<ScheduleSlot> }) {
  const channelRows: ReadonlyArray<{ id: ChannelId; label: string }> = [
    { id: 'web',       label: 'Web' },
    { id: 'rss',       label: 'RSS' },
    { id: 'newsletter',label: 'Newsletter' },
    { id: 'x',         label: 'X' },
    { id: 'mastodon',  label: 'Mastodon' },
    { id: 'instagram', label: 'Instagram' },
  ];

  return (
    <div style={{ background: 'var(--paper-2)', border: '1px solid var(--rule)', borderRadius: 4, padding: '12px 14px', marginTop: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
        <div>
          <div className="eyebrow-ink">Schedule · all channels · {SCHEDULE_DAYS[0]}–{SCHEDULE_DAYS[SCHEDULE_DAYS.length - 1]}</div>
          <div className="fig" style={{ fontSize: 12, marginTop: 2 }}>web first, then newsletter the next morning, social same day</div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <span className="pill pill-solid-ink">{slots.filter(s => !s.isDraft).length} SCHEDULED</span>
          <span className="pill pill-soft">{slots.filter(s => s.isDraft).length} DRAFT</span>
        </div>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
          <thead>
            <tr>
              <th style={{ width: 90 }} />
              {SCHEDULE_DAYS.map(d => (
                <th key={d} style={{ fontFamily: 'var(--font-geist-mono)', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-soft)', padding: '4px 6px', borderBottom: '1px solid var(--rule-soft)', textAlign: 'center' }}>{d}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {channelRows.map(({ id, label }) => (
              <tr key={id}>
                <td style={{ fontFamily: 'var(--font-geist-mono)', fontSize: 10, color: 'var(--ink-soft)', padding: '6px 8px 6px 0', letterSpacing: '0.06em' }}>{label}</td>
                {SCHEDULE_DAYS.map((_, dayIndex) => {
                  const slot = slots.find(s => s.channelId === id && s.dayIndex === dayIndex);
                  return (
                    <td key={dayIndex} style={{ border: '1px solid var(--rule-soft)', borderRadius: 2, padding: 2, height: 28, textAlign: 'center', verticalAlign: 'middle', background: dayIndex === 0 ? 'var(--paper-3)' : 'transparent' }}>
                      {slot && (
                        <div style={{ background: slot.isDraft ? 'transparent' : CHANNEL_COLORS[id], border: slot.isDraft ? `1px dashed ${CHANNEL_COLORS[id]}` : 'none', color: slot.isDraft ? CHANNEL_COLORS[id] : 'var(--paper)', borderRadius: 2, padding: '2px 4px', fontFamily: 'var(--font-geist-mono)', fontSize: 9, letterSpacing: '0.04em', cursor: 'pointer', userSelect: 'none' }}>
                          {slot.time}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function DistributeTab({
  postId, postTitle, newsletter, social,
  scheduleSlots = DEFAULT_SLOTS, onPublishAll,
}: DistributeTabProps) {
  const [activeChannel, setActiveChannel] = useState<ChannelId>('web');
  const [channels, setChannels] = useState<ReadonlyArray<ChannelUi>>(buildDefaultChannels);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [savingChannel, setSavingChannel] = useState<ChannelId | null>(null);

  // ── Load persisted channel state ──────────────────────────────────────────
  useEffect(() => {
    if (!postId) return;
    const abort = new AbortController();
    setLoading(true);
    setLoadError(null);

    fetch(`/api/cms/blog/posts/${postId}/channels`, { signal: abort.signal })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d: unknown) => {
        if (
          d !== null &&
          typeof d === 'object' &&
          'data' in d &&
          Array.isArray((d as { data: unknown }).data)
        ) {
          const records = (d as { data: ReadonlyArray<ApiPostChannel> }).data;
          setChannels(prev => mergeChannels(prev, records));
        }
      })
      .catch((err: unknown) => {
        if (err instanceof Error && err.name !== 'AbortError') {
          setLoadError('Could not load channel state');
        }
      })
      .finally(() => setLoading(false));

    return () => abort.abort();
  }, [postId]);

  // ── Persist a channel patch (optimistic + revert on failure) ─────────────
  const persistChannel = useCallback(
    async (
      channelId: ChannelId,
      patch: { enabled?: boolean; copy?: string; scheduledAt?: string },
    ): Promise<void> => {
      if (!postId) return;
      setSavingChannel(channelId);

      // Snapshot current for revert
      const snapshot = channels.slice();

      // Optimistic update
      setChannels(prev => prev.map(ch => {
        if (ch.id !== channelId) return ch;
        return {
          ...ch,
          ...(patch.enabled !== undefined ? { enabled: patch.enabled } : {}),
          ...(patch.copy !== undefined ? { copy: patch.copy } : {}),
          ...(patch.scheduledAt !== undefined ? { scheduledAt: patch.scheduledAt } : {}),
        };
      }));

      try {
        const body: { channel: ApiDistributionChannel; enabled?: boolean; copy?: string; scheduledAt?: string } = {
          channel: API_KEY_MAP[channelId],
        };
        if (patch.enabled !== undefined) body.enabled = patch.enabled;
        if (patch.copy !== undefined) body.copy = patch.copy;
        if (patch.scheduledAt) body.scheduledAt = new Date(patch.scheduledAt).toISOString();

        const res = await fetch(`/api/cms/blog/posts/${postId}/channels`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const d: unknown = await res.json();
        if (d !== null && typeof d === 'object' && 'data' in d) {
          const rec = (d as { data: ApiPostChannel }).data;
          setChannels(prev => prev.map(ch =>
            ch.id === ID_FROM_API[rec.channel] ? applyRecord(ch, rec) : ch,
          ));
        }
      } catch {
        setChannels(snapshot);
      } finally {
        setSavingChannel(null);
      }
    },
    [postId, channels],
  );

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleToggle = useCallback((id: ChannelId) => {
    const ch = channels.find(c => c.id === id);
    if (!ch) return;
    void persistChannel(id, { enabled: !ch.enabled });
  }, [channels, persistChannel]);

  const handleCopyChange = useCallback((id: ChannelId, copy: string) => {
    setChannels(prev => prev.map(ch => ch.id === id ? { ...ch, copy } : ch));
  }, []);

  const handleCopyBlur = useCallback((id: ChannelId) => {
    const ch = channels.find(c => c.id === id);
    if (ch) void persistChannel(id, { copy: ch.copy });
  }, [channels, persistChannel]);

  const handleScheduleChange = useCallback((id: ChannelId, scheduledAt: string) => {
    setChannels(prev => prev.map(ch => ch.id === id ? { ...ch, scheduledAt } : ch));
  }, []);

  const handleScheduleBlur = useCallback((id: ChannelId) => {
    const ch = channels.find(c => c.id === id);
    if (ch) void persistChannel(id, { scheduledAt: ch.scheduledAt });
  }, [channels, persistChannel]);

  // ── Render ────────────────────────────────────────────────────────────────
  const enabled = channels.filter(c => c.enabled);
  const activeChData = channels.find(c => c.id === activeChannel) ?? channels[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Status banners */}
      {loading && (
        <div className="fig" style={{ fontSize: 11 }}>Loading channel state…</div>
      )}
      {!loading && loadError !== null && (
        <div style={{ background: 'var(--paper-2)', border: '1px solid var(--rule)', borderRadius: 4, padding: '8px 12px', fontSize: 12, color: 'var(--ink-soft)', fontFamily: 'var(--font-geist-mono)' }}>
          {loadError} — showing defaults
        </div>
      )}
      {!postId && (
        <div style={{ background: 'var(--paper-2)', border: '1px dashed var(--rule)', borderRadius: 4, padding: '8px 12px', fontSize: 12, color: 'var(--ink-faint)', fontFamily: 'var(--font-geist-mono)' }}>
          Save this post first to persist channel settings.
        </div>
      )}

      {/* Channel strip */}
      <div style={{ display: 'flex', gap: 6 }}>
        {channels.map(ch => (
          <ChannelTile
            key={ch.id}
            channel={ch}
            isActive={activeChannel === ch.id}
            onClick={() => setActiveChannel(ch.id)}
          />
        ))}
      </div>

      {/* Active channel detail */}
      {activeChData !== undefined && (
        <ChannelDetailPanel
          channel={activeChData}
          isSaving={savingChannel === activeChannel}
          onToggle={handleToggle}
          onCopyChange={handleCopyChange}
          onCopyBlur={handleCopyBlur}
          onScheduleChange={handleScheduleChange}
          onScheduleBlur={handleScheduleBlur}
        />
      )}

      {/* Two-panel: newsletter + social */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {newsletter !== undefined ? (
          <NewsletterPanel config={newsletter} postTitle={postTitle} />
        ) : (
          <div style={{ background: 'var(--paper-2)', border: '1px dashed var(--rule)', borderRadius: 4, padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-faint)', fontSize: 12, fontFamily: 'var(--font-geist-mono)' }}>
            Newsletter not configured
          </div>
        )}
        {social !== undefined ? (
          <SocialPanel config={social} />
        ) : (
          <div style={{ background: 'var(--paper-2)', border: '1px dashed var(--rule)', borderRadius: 4, padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-faint)', fontSize: 12, fontFamily: 'var(--font-geist-mono)' }}>
            Social accounts not connected
          </div>
        )}
      </div>

      {/* Schedule strip */}
      <ScheduleStrip slots={scheduleSlots} />

      {/* Publish CTA */}
      <div className="action-bar" style={{ borderTop: '1px solid var(--ink)', padding: '10px 0' }}>
        <span><span className="kbd">⌘S</span>save</span>
        <span><span className="kbd">⌘⏎</span>publish web</span>
        <span><span className="kbd">T</span>test send</span>
        <span><span className="kbd">R</span>reschedule</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <span className="fig" style={{ fontSize: 12, alignSelf: 'center' }}>
            {enabled.length} channels ready
          </span>
          <button className="btn btn-accent" onClick={onPublishAll} type="button">
            <span className="kbd">⌘⏎</span>Publish to {enabled.length} channels
          </button>
        </div>
      </div>
    </div>
  );
}
