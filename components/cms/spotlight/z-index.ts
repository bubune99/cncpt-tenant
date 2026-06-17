/**
 * Stacking-order contract for spotlight UI:
 *   z-40  : admin-chat-panel chat surfaces (current Tailwind z-50 should
 *           be reduced, OR spotlight goes higher — we chose higher)
 *   z-60  : SpotlightOverlay (dim backdrop + SVG cutout)
 *   z-70  : TourTooltip + TourTooltipMiniChat
 *   z-80+ : reserved for genuine system modals (confirms, alerts) that
 *           must beat tour
 *
 * Do NOT add z-50 elements to the admin shell without checking this list.
 *
 * ─── Why these specific values ───────────────────────────────────────────
 * Tailwind ships z-10/20/30/40/50 as defaults; arbitrary [60]/[70]/[80]
 * are accepted via JIT. We use literal numeric `zIndex` values in inline
 * style so the contract holds even if Tailwind config changes — and so
 * computed-style readouts in verification produce a clean integer.
 *
 * ─── Audit (admin chrome stacking before this branch) ────────────────────
 *   z-30  AdminShell mobile sidebar backdrop
 *   z-40  AdminShell desktop sidebar
 *   z-40  AdminShell user-menu click-outside scrim
 *   z-40  AI Assistant drawer (admin-chat/chat-panel.tsx open mode)
 *   z-50  AdminShell mobile sidebar toggle button
 *   z-50  AdminShell user-menu popover
 *   z-50  AI Assistant drawer collapsed FAB / minimized strip / demo menu
 *   z-50  RecorderButton FAB
 *   z-50  shadcn <Dialog> overlay + content       (genuine system modal)
 *   z-50  shadcn <Sheet> overlay + content        (genuine system modal)
 *
 * Owner directive: spotlight must be ABOVE all admin chrome listed above
 * but BELOW genuine system modals (Dialog/Sheet/AlertDialog confirms),
 * so spotlight backdrop sits at z-60 and tooltip at z-70. System modals
 * should be re-homed to z-80+ if they are expected to beat the tour.
 *
 * ─── Stacking-context escape hatch ───────────────────────────────────────
 * Tailwind `transform`, `backdrop-blur`, `filter`, `mix-blend-mode`, and
 * `position: fixed` ancestors all create new stacking contexts. The
 * AdminShell sidebar uses `transform: translate-x` for slide-in, which
 * means a child with z-index N inside that subtree CANNOT escape the
 * sidebar's z-40 stacking context.
 *
 * `SpotlightHost` is mounted inside `<StackProvider>` → `<ThemeProvider>`
 * in `src/app/layout.tsx`. Stack Auth's provider can wrap in a div with
 * `isolation: isolate`, which would also create a new stacking context.
 *
 * To guarantee the spotlight sits at the top of the document regardless
 * of where it's rendered from, both `SpotlightOverlay` and `TourTooltip`
 * portal directly to `document.body` via `createPortal`. See the portal
 * mounts in those components.
 *
 * If you change this stack:
 *   1. Update the audit table above.
 *   2. Re-run the runtime DOM eval in PR verification:
 *      `getComputedStyle(document.querySelector('[data-spotlight-overlay]')).zIndex`
 *      should match `SPOTLIGHT_OVERLAY_Z` (as a string).
 *   3. Confirm a shadcn `<Dialog>` opened on top of an active spotlight
 *      visually wins — system modals must remain interactive.
 */

export const SPOTLIGHT_OVERLAY_Z = 60
export const SPOTLIGHT_TOOLTIP_Z = 70
