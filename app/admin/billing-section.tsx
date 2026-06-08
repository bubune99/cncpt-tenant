"use client"

import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Loader2, RefreshCw, DollarSign, HardDrive, Activity, Users } from "lucide-react"

interface TenantUsage {
  id: number
  subdomain: string
  disabled: boolean
  tierName: string | null
  tierDisplayName: string | null
  tierPriceMonthly: number | null
  subscriptionStatus: string | null
  mediaCount: number
  storageBytes: number
  storageGb: number
  storageLimitGb: number | null
  overStorage: boolean
}

interface Totals {
  mrr: number
  byTier: Record<string, { count: number; mrr: number }>
  subscriptions: { active: number; trialing: number; canceled: number; total: number }
  apiUsage30d: { requests: number; errors: number; rateLimited: number }
  storage: { bytes: number; gb: number; files: number }
}

function fmtGb(gb: number): string {
  if (gb >= 1) return `${gb.toFixed(2)} GB`
  return `${(gb * 1024).toFixed(1)} MB`
}

export function BillingSection() {
  const [tenants, setTenants] = useState<TenantUsage[]>([])
  const [totals, setTotals] = useState<Totals | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/super-admin/billing")
      if (res.ok) {
        const data = await res.json()
        setTenants(data.tenants || [])
        setTotals(data.totals || null)
      }
    } catch (e) {
      console.error("Failed to load billing:", e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-emerald-400" />
            Billing & Usage
          </h2>
          <p className="text-sm text-muted-foreground">Per-tenant plan, storage, and platform usage.</p>
        </div>
        <Button onClick={fetchData} variant="outline" size="sm" className="bg-transparent border-border text-foreground hover:text-foreground hover:bg-muted">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Totals cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Assigned MRR</CardTitle>
              <DollarSign className="h-4 w-4 text-emerald-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">${totals ? totals.mrr.toFixed(0) : "—"}</div>
            <p className="text-xs text-muted-foreground mt-1">from tier assignments</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Subscriptions</CardTitle>
              <Users className="h-4 w-4 text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{totals?.subscriptions.active ?? "—"}</div>
            <p className="text-xs text-muted-foreground mt-1">{totals?.subscriptions.trialing ?? 0} trialing</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Storage Used</CardTitle>
              <HardDrive className="h-4 w-4 text-orange-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{totals ? fmtGb(totals.storage.gb) : "—"}</div>
            <p className="text-xs text-muted-foreground mt-1">{totals?.storage.files ?? 0} files</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">API Requests (30d)</CardTitle>
              <Activity className="h-4 w-4 text-purple-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{totals ? totals.apiUsage30d.requests.toLocaleString() : "—"}</div>
            <p className="text-xs text-muted-foreground mt-1">{totals?.apiUsage30d.rateLimited ?? 0} rate-limited</p>
          </CardContent>
        </Card>
      </div>

      {/* Tier distribution */}
      {totals && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground text-base">Tenants by Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.entries(totals.byTier).map(([tier, v]) => (
                <div key={tier} className="px-3 py-1.5 rounded-lg bg-muted/50 border border-border text-sm">
                  <span className="text-foreground font-medium capitalize">{tier}</span>{" "}
                  <span className="text-muted-foreground">{v.count} tenant{v.count === 1 ? "" : "s"}</span>
                  {v.mrr > 0 && <span className="text-emerald-400 ml-2">${v.mrr.toFixed(0)}/mo</span>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Per-tenant usage table */}
      <Card className="bg-card border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">Tenant</TableHead>
              <TableHead className="text-muted-foreground">Plan</TableHead>
              <TableHead className="text-muted-foreground">Storage</TableHead>
              <TableHead className="text-muted-foreground">Media</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow className="border-border">
                <TableCell colSpan={5} className="text-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-orange-400" />
                </TableCell>
              </TableRow>
            ) : tenants.length === 0 ? (
              <TableRow className="border-border">
                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">No tenants</TableCell>
              </TableRow>
            ) : (
              tenants.map((t) => (
                <TableRow key={t.id} className="border-border hover:bg-muted">
                  <TableCell className="font-medium text-foreground">{t.subdomain}</TableCell>
                  <TableCell>
                    {t.tierDisplayName ? (
                      <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                        {t.tierDisplayName}
                        {t.tierPriceMonthly ? ` · $${t.tierPriceMonthly}` : ""}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">unassigned</span>
                    )}
                  </TableCell>
                  <TableCell className={`text-sm ${t.overStorage ? "text-red-400" : "text-foreground"}`}>
                    {fmtGb(t.storageGb)}
                    {t.storageLimitGb != null && t.storageLimitGb >= 0 && (
                      <span className="text-muted-foreground"> / {t.storageLimitGb} GB</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-foreground">{t.mediaCount}</TableCell>
                  <TableCell>
                    {t.disabled ? (
                      <Badge className="bg-red-500/10 text-red-400 border-red-500/20">Suspended</Badge>
                    ) : (
                      <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Active</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
