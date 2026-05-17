/**
 * components/admin — Platform / super-admin design system components.
 *
 * Design: CNCPT Hybrid direction (Refined Classic chrome + compact Inbox
 * sidebar + persistent right Activity rail).
 *
 * All components are scoped under `.cncpt-admin` and import their own CSS
 * from `@/app/admin/cncpt-admin.css`. They do not depend on the per-tenant
 * Atlas (--wl-*) design system.
 */

export { AdminShell } from "./AdminShell"
export type { AdminShellProps, AdminSection, AdminRole } from "./AdminShell"

export { AdminOverview } from "./AdminOverview"
export type { } from "./AdminOverview"

export { AdminClientsWrapper } from "./AdminClients"
export type { AdminClientsWrapperProps } from "./AdminClients"

export { AdminFeedbackWrapper } from "./AdminFeedback"
export type { AdminFeedbackWrapperProps } from "./AdminFeedback"

export { AdminTiersWrapper } from "./AdminTiers"
export type { AdminTiersWrapperProps } from "./AdminTiers"
