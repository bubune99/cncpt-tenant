'use client';

/**
 * FilterChip — a Grainy `.filter-chip` with a dropdown of options. Value "Any"
 * means unset; picking a real value shows an inline clear (×). Shared by the
 * products and inventory screens.
 */

import React, { useState } from 'react';
import { ChevronDown, X, Check } from 'lucide-react';

export function FilterChip({
  label,
  value,
  options,
  onChange,
}: {
  readonly label: string;
  readonly value: string;
  readonly options: readonly string[];
  readonly onChange: (value: string) => void;
}): React.ReactElement {
  const [open, setOpen] = useState(false);
  const active = value !== 'Any';
  return (
    <div style={{ position: 'relative' }}>
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 18 }}
        />
      )}
      <button
        type="button"
        className={'filter-chip' + (active ? ' active' : '')}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="fc-key">{label}</span>
        <span className="fc-val">{value}</span>
        {active ? (
          <span
            className="fc-x"
            onClick={(e) => {
              e.stopPropagation();
              onChange('Any');
              setOpen(false);
            }}
            style={{ display: 'inline-flex' }}
          >
            <X size={12} />
          </span>
        ) : (
          <ChevronDown size={12} />
        )}
      </button>
      {open && (
        <div
          className="menu"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            zIndex: 19,
            minWidth: 168,
            maxHeight: 280,
            overflow: 'auto',
          }}
        >
          {['Any', ...options].map((o) => (
            <div
              key={o}
              className="menu-item"
              onClick={() => {
                onChange(o);
                setOpen(false);
              }}
            >
              <span>{o}</span>
              {value === o && (
                <Check size={14} style={{ marginLeft: 'auto', color: 'var(--clay-600)' }} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
