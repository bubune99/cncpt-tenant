/**
 * Chat panel tokens — mapped onto the Atlas white-label CSS variables
 * (`--wl-*`, see app/globals.css / app/atlas.css).
 *
 * Because every value resolves through `--wl-*`, the chat automatically adopts
 * each tenant's brand colors, the active brand preset (marigold / boreal /
 * obsidian / meadow → light or dark), and density — no hardcoded palette.
 * The accent flows through `--cbx-accent`, which the panel sets from the
 * `accent` prop (defaults to `var(--wl-accent)`).
 */

export const ACCENT_DEFAULT = 'var(--wl-accent)'

export const C = {
  // surfaces
  editorBg: 'var(--wl-canvas)',
  canvasBg: 'var(--wl-bg)',
  canvasDot: 'var(--wl-rule-soft)',
  panelBg: 'var(--wl-surface)',
  headerBg: 'var(--wl-surface)',
  raised: 'color-mix(in srgb, var(--wl-text) 4%, var(--wl-surface))',
  raisedHover: 'color-mix(in srgb, var(--wl-text) 7%, var(--wl-surface))',
  chip: 'color-mix(in srgb, var(--wl-text) 4%, var(--wl-surface))',
  codeBg: 'var(--wl-canvas)',
  rowHover: 'color-mix(in srgb, var(--wl-text) 5%, transparent)',
  // lines
  border: 'var(--wl-rule)',
  borderSoft: 'var(--wl-rule-soft)',
  borderStrong: 'var(--wl-rule)',
  dashed: 'var(--wl-rule)',
  // text
  text: 'var(--wl-text)',
  textStrong: 'var(--wl-text)',
  textBody: 'var(--wl-text)',
  textMuted: 'var(--wl-text-soft)',
  textFaint: 'var(--wl-text-faint)',
  textGhost: 'var(--wl-text-faint)',
  // status
  green: 'var(--wl-success)',
  greenStrong: 'var(--wl-success)',
  greenFill: 'var(--wl-success)',
  blue: 'var(--wl-accent)',
  amber: 'var(--wl-warning)',
  red: 'var(--wl-error)',
  online: 'var(--wl-success)',
} as const

export const FONT = 'var(--wl-font-body)'
export const MONO = 'var(--wl-font-mono)'
