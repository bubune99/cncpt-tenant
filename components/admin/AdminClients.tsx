"use client"

/**
 * AdminClients — thin cncpt-admin-scoped wrapper for the platform clients page.
 * The inner ClientsPageContent uses shadcn components; this wrapper sets the
 * design context and page heading consistent with the Hybrid design.
 */

import { Users, RefreshCw } from "lucide-react"
import "@/app/admin/cncpt-admin.css"

export interface AdminClientsWrapperProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
  onRefresh?: () => void
  refreshing?: boolean
}

export function AdminClientsWrapper({
  children,
  title = "Client Management",
  subtitle = "Manage platform clients, subscriptions, and trials",
  onRefresh,
  refreshing = false,
}: AdminClientsWrapperProps) {
  return (
    <div className="cncpt-admin">
      <div className="ca-page-h" style={{ marginBottom: 20 }}>
        <div className="ca-row" style={{ gap: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 9,
              background: "linear-gradient(135deg, #2563eb 0%, #ea580c 100%)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Users size={18} color="#fff" aria-hidden />
          </div>
          <div className="ca-col" style={{ gap: 2 }}>
            <h1 style={{ fontSize: 20, marginBottom: 0 }}>{title}</h1>
            <div className="sub">{subtitle}</div>
          </div>
        </div>
        {onRefresh && (
          <button
            type="button"
            className={`ca-btn ca-btn--secondary ca-btn--sm${refreshing ? " is-loading" : ""}`}
            onClick={onRefresh}
            disabled={refreshing}
          >
            <RefreshCw size={13} style={refreshing ? { animation: "spin 1s linear infinite" } : undefined} aria-hidden />
            Refresh
          </button>
        )}
      </div>
      {children}
    </div>
  )
}
