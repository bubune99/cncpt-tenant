"use client"

/**
 * AdminTiers — Platform subscription tiers section.
 * Design: Hybrid — spacious card grid + "Add tier" flow.
 * Data wiring: delegates to TiersPageContent which uses Prisma + server actions.
 */

import { CreditCard } from "lucide-react"
import "@/app/admin/cncpt-admin.css"

export interface AdminTiersWrapperProps {
  children: React.ReactNode
}

export function AdminTiersWrapper({ children }: AdminTiersWrapperProps) {
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
            <CreditCard size={18} color="#fff" aria-hidden />
          </div>
          <div className="ca-col" style={{ gap: 2 }}>
            <h1 style={{ fontSize: 20, marginBottom: 0 }}>Subscription Tiers</h1>
            <div className="sub">
              Manage pricing plans and features for your platform
            </div>
          </div>
        </div>
      </div>
      {children}
    </div>
  )
}
