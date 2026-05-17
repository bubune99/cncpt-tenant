"use client"

/**
 * Admin error boundary — restyled with cncpt-admin design system.
 */

import { useEffect } from "react"
import { AlertCircle, RefreshCw, Home } from "lucide-react"
import "@/app/admin/cncpt-admin.css"

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Error is caught by the boundary — intentional log for dev debugging.
    // In production, wire this to your error tracking service (e.g. Sentry).
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.error("[Admin Error]", error)
    }
  }, [error])

  return (
    <div
      className="cncpt-admin"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--ca-bg, #f8fafc)",
        padding: 24,
      }}
    >
      <div
        className="ca-card"
        style={{ width: "100%", maxWidth: 480 }}
      >
        <div className="ca-card__head" style={{ flexDirection: "column", alignItems: "flex-start", gap: 12 }}>
          <div className="ca-row" style={{ gap: 12 }}>
            <div
              className="ca-modal__icon ca-modal__icon--danger"
              style={{ width: 40, height: 40 }}
            >
              <AlertCircle size={20} aria-hidden />
            </div>
            <div className="ca-col" style={{ gap: 2 }}>
              <h2 className="ca-card__title" style={{ fontSize: 15 }}>
                Admin Dashboard Error
              </h2>
              <p className="ca-card__sub">
                Something went wrong loading the admin dashboard.
              </p>
            </div>
          </div>
        </div>

        <div className="ca-card__body" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Error detail */}
          <div
            style={{
              background: "var(--ca-bg, #f8fafc)",
              borderRadius: 8,
              padding: "10px 12px",
              fontSize: 12.5,
            }}
          >
            <strong>Error:</strong>{" "}
            <span style={{ color: "var(--ca-text-soft, #6b7280)" }}>
              {error.message || "Unknown error"}
            </span>
            {error.digest && (
              <div
                style={{
                  marginTop: 4,
                  fontSize: 11,
                  fontFamily: "var(--ca-mono, monospace)",
                  color: "var(--ca-text-faint, #94a3b8)",
                }}
              >
                Digest: {error.digest}
              </div>
            )}
          </div>

          {/* Common causes */}
          <div className="ca-banner ca-banner--warn">
            <AlertCircle size={16} aria-hidden />
            <div className="ca-col" style={{ gap: 4, flex: 1 }}>
              <b>Possible causes</b>
              <ul style={{ margin: "4px 0 0 16px", padding: 0, fontSize: 12 }}>
                <li>Database tables not created (run SQL migration)</li>
                <li>Missing SUPER_ADMIN_EMAILS environment variable</li>
                <li>Database connection issues</li>
              </ul>
            </div>
          </div>

          {/* Actions */}
          <div className="ca-row" style={{ gap: 8 }}>
            <button
              type="button"
              className="ca-btn ca-btn--primary"
              onClick={reset}
              style={{ flex: 1, justifyContent: "center" }}
            >
              <RefreshCw size={14} aria-hidden />
              Try Again
            </button>
            <button
              type="button"
              className="ca-btn ca-btn--secondary"
              onClick={() => { window.location.href = "/dashboard" }}
              style={{ flex: 1, justifyContent: "center" }}
            >
              <Home size={14} aria-hidden />
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
