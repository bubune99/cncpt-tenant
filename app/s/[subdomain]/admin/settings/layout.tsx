'use client';

/**
 * Settings hub layout — the Grainy configuration hub shell.
 *
 * Header + persistent left section rail on the left, the active panel scrolling
 * on the right. Every settings child route renders inside `{children}` so the
 * rail stays put and deep links are preserved. The negative margins cancel the
 * `.atlas .main` padding (50/32/18) so the hub sits full-bleed with its own
 * internal scroll regions instead of riding the page scroll.
 */

import React from 'react';
import { Eyebrow } from '@/components/cms/admin/grainy-ui';
import { SectionRail } from '@/components/cms/admin/settings-hub/section-rail';
import '@/components/cms/admin/settings-hub/settings-hub.css';

export default function SettingsHubLayout({
  children,
}: {
  readonly children: React.ReactNode;
}): React.ReactElement {
  return (
    <div
      className="set-hub"
      data-tour-id="settings-hub"
      style={{ margin: '-50px -32px -18px', height: 'calc(100% + 68px)', overflow: 'hidden' }}
    >
      <div className="set-hub-head">
        <Eyebrow>Workspace</Eyebrow>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 3 }}>
          <h1 style={{ fontSize: 'var(--text-xl)', margin: 0, letterSpacing: '-0.015em' }}>Settings</h1>
          <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
            Configure the storefront, commerce, integrations, and how the workspace runs
          </span>
        </div>
      </div>
      <div className="set-hub-body">
        <SectionRail />
        <div className="gr-scroll set-panel">
          <div className="set-panel-inner">{children}</div>
        </div>
      </div>
    </div>
  );
}
