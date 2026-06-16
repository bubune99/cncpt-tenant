'use client'

/**
 * Scoped stylesheet for the chat panel: keyframes, scrollbar, and the hover /
 * focus-within states React inline styles can't express. Scoped under
 * `.cbx-scope`; all colors resolve through the Atlas `--wl-*` white-label vars
 * (and `--cbx-accent`, set on the root from the accent prop).
 */
export function ChatPanelStyles() {
  return (
    <style>{`
      .cbx-scope, .cbx-scope * { box-sizing: border-box; }
      @keyframes cbxspin { to { transform: rotate(360deg); } }
      @keyframes cbxshimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(280%); } }
      .cbx-row { transition: background .12s ease; }
      .cbx-row:hover { background: color-mix(in srgb, var(--wl-text) 5%, transparent); }
      .cbx-icon-btn { transition: all .12s ease; }
      .cbx-icon-btn:hover { background: color-mix(in srgb, var(--wl-text) 8%, transparent); color: var(--wl-text) !important; }
      .cbx-ghost:hover { color: var(--wl-text) !important; background: color-mix(in srgb, var(--wl-text) 6%, transparent); }
      .cbx-revert:hover { color: var(--wl-warning) !important; }
      .cbx-accept:hover { filter: brightness(1.08); }
      .cbx-reject:hover { background: color-mix(in srgb, var(--wl-text) 6%, transparent); color: var(--wl-text) !important; }
      .cbx-apply:hover { background: var(--wl-accent-soft); }
      .cbx-canvas:hover { border-color: var(--cbx-accent) !important; background: color-mix(in srgb, var(--wl-text) 4%, var(--wl-surface)) !important; color: var(--wl-text) !important; }
      .cbx-suggestion:hover { background: color-mix(in srgb, var(--wl-text) 7%, transparent); color: var(--wl-text) !important; }
      .cbx-slash:hover { background: color-mix(in srgb, var(--wl-text) 9%, transparent); }
      .cbx-resize:hover { background: color-mix(in srgb, var(--wl-text) 8%, transparent); }
      .cbx-chip-x:hover { background: var(--wl-accent-soft); color: var(--wl-text) !important; }
      .cbx-composer:focus-within { border-color: var(--cbx-accent) !important; }
      .cbx-textarea::placeholder { color: var(--wl-text-faint); }
      .cbx-scroll::-webkit-scrollbar { width: 9px; height: 9px; }
      .cbx-scroll::-webkit-scrollbar-thumb { background: var(--wl-rule); border-radius: 5px; border: 2px solid transparent; background-clip: padding-box; }
      .cbx-scroll::-webkit-scrollbar-thumb:hover { background: var(--wl-text-faint); background-clip: padding-box; }
    `}</style>
  )
}
