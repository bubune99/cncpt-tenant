import Link from "next/link"

/**
 * Hexclave's own pages (account settings, sign-in, sign-out) are drawn full page by StackHandler and offer no way
 * back to the product: from Account settings the only way out was the browser's Back (walk of /dashboard,
 * 2026-11-22). This bar gives every one of them a visible way back.
 */
export default function HandlerLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="flex items-center border-b px-4 py-2 text-sm" data-ui="handler.back_bar">
        <Link href="/dashboard" className="inline-flex min-h-6 items-center gap-1 text-muted-foreground hover:text-foreground" data-ui="handler.back">
          <span aria-hidden="true">←</span> Back to your dashboard
        </Link>
      </div>
      {children}
    </>
  )
}
