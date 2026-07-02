'use client';

/**
 * Panel header used at the top of each settings panel. Gives embedded legacy
 * components (AiSettings, EmailProviderSettings, …) a consistent Grainy title
 * block without rewriting their internals.
 */

import React from 'react';

export function PanelHeader({
  eyebrow,
  title,
  desc,
  action,
}: {
  readonly eyebrow?: React.ReactNode;
  readonly title: React.ReactNode;
  readonly desc?: React.ReactNode;
  readonly action?: React.ReactNode;
}): React.ReactElement {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, marginBottom: 18 }}>
      <div style={{ minWidth: 0 }}>
        {eyebrow && <div className="gr-eyebrow">{eyebrow}</div>}
        <h2 style={{ fontSize: 'var(--text-xl)', margin: '2px 0 0', letterSpacing: '-0.015em' }}>
          {title}
        </h2>
        {desc && (
          <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 3 }}>{desc}</div>
        )}
      </div>
      {action && <div style={{ marginLeft: 'auto', flex: 'none' }}>{action}</div>}
    </div>
  );
}
