'use client';

/**
 * Atlas White-Label Announcement Bar
 * A slim banner rendered above the storefront chrome. Content comes from the
 * CMS (SiteSettings.announcementBar). Dismissals are remembered per-message in
 * localStorage so a visitor isn't re-shown a bar they already closed.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface AnnouncementBarProps {
  readonly message: string;
  readonly href?: string;
  readonly dismissible?: boolean;
  readonly backgroundColor?: string;
  readonly textColor?: string;
}

function messageKey(message: string): string {
  // Stable-ish key from the message so editing the text re-shows the bar.
  let hash = 0;
  for (let i = 0; i < message.length; i++) {
    hash = (hash * 31 + message.charCodeAt(i)) | 0;
  }
  return `wl-annc-dismissed:${hash}`;
}

export function AnnouncementBar({
  message,
  href,
  dismissible = true,
  backgroundColor,
  textColor,
}: AnnouncementBarProps) {
  // Render on the server and first client paint; hide only after we confirm a
  // prior dismissal, to avoid a layout flash.
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (!dismissible) return;
    try {
      if (localStorage.getItem(messageKey(message)) === '1') setHidden(true);
    } catch {
      /* ignore */
    }
  }, [message, dismissible]);

  if (hidden) return null;

  const dismiss = () => {
    setHidden(true);
    try {
      localStorage.setItem(messageKey(message), '1');
    } catch {
      /* ignore */
    }
  };

  const content = href ? (
    <Link
      href={href}
      style={{ color: 'inherit', textDecoration: 'underline', textUnderlineOffset: 2 }}
    >
      {message}
    </Link>
  ) : (
    <span>{message}</span>
  );

  return (
    <div
      role="region"
      aria-label="Announcement"
      style={{
        background: backgroundColor || 'var(--wl-accent)',
        color: textColor || 'var(--wl-accent-fg)',
        fontFamily: 'var(--wl-font-body)',
        fontSize: 13,
        lineHeight: 1.3,
        padding: '8px 40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        textAlign: 'center',
      }}
    >
      {content}
      {dismissible && (
        <button
          onClick={dismiss}
          aria-label="Dismiss announcement"
          style={{
            position: 'absolute',
            right: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'transparent',
            border: 'none',
            color: 'inherit',
            cursor: 'pointer',
            display: 'inline-flex',
            opacity: 0.8,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      )}
    </div>
  );
}
