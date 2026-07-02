'use client';

/**
 * Settings hub panel primitives — SetCard / SetRow / SetToggle / SetField / SetSelect.
 *
 * Presentational building blocks that reproduce the design-reference SetCard
 * section (title/desc/action header + rows + field grids). Styling comes from
 * settings-hub.css (ported .set-* rules); this file only supplies the markup so
 * every panel reads the same way.
 */

import React from 'react';

// ── SetCard ────────────────────────────────────────────────────────────────

export function SetCard({
  title,
  desc,
  action,
  children,
  pad = true,
}: {
  readonly title?: React.ReactNode;
  readonly desc?: React.ReactNode;
  readonly action?: React.ReactNode;
  readonly children?: React.ReactNode;
  readonly pad?: boolean;
}): React.ReactElement {
  return (
    <div className="set-card">
      {(title || action) && (
        <div className="set-card-head">
          <div style={{ minWidth: 0 }}>
            {title && <div className="set-card-title">{title}</div>}
            {desc && <div className="set-card-desc">{desc}</div>}
          </div>
          {action && <div style={{ marginLeft: 'auto', flex: 'none' }}>{action}</div>}
        </div>
      )}
      <div className={pad ? 'set-card-body' : undefined}>{children}</div>
    </div>
  );
}

// ── SetRow ─────────────────────────────────────────────────────────────────

export function SetRow({
  title,
  desc,
  leading,
  trailing,
}: {
  readonly title: React.ReactNode;
  readonly desc?: React.ReactNode;
  readonly leading?: React.ReactNode;
  readonly trailing?: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="set-row">
      {leading}
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600 }}>{title}</div>
        {desc && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{desc}</div>}
      </div>
      {trailing && (
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          {trailing}
        </div>
      )}
    </div>
  );
}

// ── SetToggle ────────────────────────────────────────────────────────────────

export function SetToggle({
  on,
  onChange,
  disabled,
}: {
  readonly on: boolean;
  readonly onChange: (next: boolean) => void;
  readonly disabled?: boolean;
}): React.ReactElement {
  return (
    <span
      role="switch"
      aria-checked={on}
      tabIndex={disabled ? -1 : 0}
      className={'toggle' + (on ? ' on' : '')}
      style={{ flex: 'none', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1 }}
      onClick={() => !disabled && onChange(!on)}
      onKeyDown={(e) => {
        if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onChange(!on);
        }
      }}
    />
  );
}

// ── SetField ─────────────────────────────────────────────────────────────────

export function SetField({
  label,
  value,
  onChange,
  half,
  placeholder,
  suffix,
  type = 'text',
}: {
  readonly label: React.ReactNode;
  readonly value: string;
  readonly onChange: (next: string) => void;
  readonly half?: boolean;
  readonly placeholder?: string;
  readonly suffix?: React.ReactNode;
  readonly type?: string;
}): React.ReactElement {
  return (
    <div className={half ? 'set-field-half' : 'set-field-full'}>
      <label className="set-fl">{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          className="input"
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
        {suffix && <span className="set-field-suffix">{suffix}</span>}
      </div>
    </div>
  );
}

// ── SetSelect ────────────────────────────────────────────────────────────────

export function SetSelect({
  label,
  value,
  onChange,
  options,
  half,
}: {
  readonly label: React.ReactNode;
  readonly value: string;
  readonly onChange: (next: string) => void;
  readonly options: readonly { readonly value: string; readonly label: string }[];
  readonly half?: boolean;
}): React.ReactElement {
  return (
    <div className={half ? 'set-field-half' : 'set-field-full'}>
      <label className="set-fl">{label}</label>
      <select className="select" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
