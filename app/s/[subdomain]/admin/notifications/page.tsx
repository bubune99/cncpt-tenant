"use client";
/**
 * Inbox — full notifications list (the sidebar "Inbox" + bell "Open full inbox").
 * Was missing (the Inbox link 404'd). Lists notifications from
 * /api/cms/notifications with mark-all-read.
 */

import React from "react";

interface Notif {
  id: string;
  type?: string;
  title?: string;
  message?: string;
  body?: string;
  read?: boolean;
  isRead?: boolean;
  createdAt?: string;
  actionUrl?: string;
}

function when(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function NotificationsPage() {
  const [items, setItems] = React.useState<Notif[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/cms/notifications?limit=50", { credentials: "same-origin" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const list: Notif[] = (data.notifications ?? data.data ?? (Array.isArray(data) ? data : [])) as Notif[];
      setItems(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { void load(); }, [load]);

  const markAllRead = async () => {
    try {
      await fetch("/api/cms/notifications/mark-all-read", { method: "POST", credentials: "same-origin" });
      setItems((prev) => prev.map((n) => ({ ...n, read: true, isRead: true })));
    } catch { /* non-critical */ }
  };

  const unread = items.filter((n) => !(n.read ?? n.isRead)).length;

  return (
    <div className="prod-editor-shell" style={{ padding: "40px 28px 24px", maxWidth: 920 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, paddingBottom: 10, borderBottom: "1px solid var(--ink)", marginBottom: 14 }}>
        <div className="eyebrow">Inbox</div>
        <h1 className="display" style={{ fontSize: 32, letterSpacing: "-0.02em", margin: 0 }}>
          {unread > 0 ? <><span className="display-i accent">{unread}</span> unread</> : "All caught up"}
        </h1>
        {items.length > 0 && unread > 0 && (
          <button className="btn btn-ghost btn-sm" style={{ marginLeft: "auto" }} onClick={() => void markAllRead()}>
            Mark all read
          </button>
        )}
        <button className="btn btn-ghost btn-sm" onClick={() => void load()} style={{ marginLeft: unread > 0 ? 0 : "auto" }}>
          Refresh
        </button>
      </div>

      {loading && <p style={{ color: "var(--ink-soft)", fontSize: 13 }}>Loading…</p>}
      {error && <p style={{ color: "var(--accent)", fontSize: 13 }}>{error}</p>}
      {!loading && !error && items.length === 0 && (
        <p className="fig" style={{ fontStyle: "italic", color: "var(--ink-soft)", fontSize: 14, padding: "16px 0" }}>
          No notifications yet.
        </p>
      )}

      <div style={{ display: "flex", flexDirection: "column" }}>
        {items.map((n) => {
          const isUnread = !(n.read ?? n.isRead);
          return (
            <div
              key={n.id}
              style={{
                padding: "12px 4px 12px 14px",
                borderBottom: "1px solid var(--rule-soft)",
                borderLeft: isUnread ? "3px solid var(--accent)" : "3px solid transparent",
                background: isUnread ? "rgba(139,44,31,.04)" : "transparent",
              }}
            >
              <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                {n.type && <span className="small-caps" style={{ color: "var(--accent)" }}>{n.type}</span>}
                <span className="mono" style={{ fontSize: 10, color: "var(--ink-faint)", marginLeft: "auto" }}>{when(n.createdAt)}</span>
              </div>
              <div className="display" style={{ fontSize: 15, lineHeight: 1.25, marginTop: 2 }}>{n.title ?? "Notification"}</div>
              {(n.message ?? n.body) && (
                <div className="fig" style={{ fontStyle: "italic", fontSize: 12.5, color: "var(--ink-soft)", marginTop: 2 }}>
                  {n.message ?? n.body}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
