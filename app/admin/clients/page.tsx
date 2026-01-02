"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Users,
  AlertCircle,
  UserCheck,
  Activity,
  Loader2,
  RefreshCw,
} from "lucide-react"
import { ClientFilters } from "./client-filters"
import { ClientTable } from "./client-table"
import { BulkActions } from "./bulk-actions"
import {
  ApproveClientDialog,
  SuspendClientDialog,
  ExtendTrialDialog,
  ReactivateClientDialog,
} from "./client-dialogs"
import type {
  PlatformClient,
  ClientStatus,
  ClientStats,
  SubscriptionTier,
} from "@/types/admin"

interface ClientsPageContentProps {
  adminUserId: string
}

type DialogType = "approve" | "suspend" | "extend" | "reactivate" | null

export function ClientsPageContent({ adminUserId }: ClientsPageContentProps) {
  const [clients, setClients] = useState<PlatformClient[]>([])
  const [stats, setStats] = useState<ClientStats | null>(null)
  const [tiers, setTiers] = useState<SubscriptionTier[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Filters
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<ClientStatus | "all">("all")
  const [tierFilter, setTierFilter] = useState("all")

  // Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // Dialog state
  const [activeDialog, setActiveDialog] = useState<DialogType>(null)
  const [activeClientId, setActiveClientId] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    try {
      const [clientsRes, statsRes, tiersRes] = await Promise.all([
        fetch(
          `/api/admin/clients?` +
            new URLSearchParams({
              search,
              status: statusFilter,
              tierId: tierFilter,
            })
        ),
        fetch("/api/admin/clients/stats"),
        fetch("/api/admin/tiers"),
      ])

      if (clientsRes.ok) {
        const data = await clientsRes.json()
        setClients(data.clients || [])
      }
      if (statsRes.ok) {
        const data = await statsRes.json()
        setStats(data.stats)
      }
      if (tiersRes.ok) {
        const data = await tiersRes.json()
        setTiers(data.tiers || [])
      }
    } catch (error) {
      console.error("Failed to load clients:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [search, statusFilter, tierFilter])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleRefresh = () => {
    setRefreshing(true)
    loadData()
  }

  const openDialog = (type: DialogType, clientId: string) => {
    setActiveDialog(type)
    setActiveClientId(clientId)
  }

  const closeDialog = () => {
    setActiveDialog(null)
    setActiveClientId(null)
  }

  const getActiveClient = () => {
    return clients.find((c) => c.id === activeClientId)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Client Management</h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage platform clients, subscriptions, and trials
          </p>
        </div>
        <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Clients
                </CardTitle>
                <Users className="h-4 w-4 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-gray-500">
                {stats.newThisMonth} new this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Pending Approval
                </CardTitle>
                <AlertCircle className="h-4 w-4 text-yellow-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {stats.pendingApproval}
              </div>
              <p className="text-xs text-gray-500">Awaiting review</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Active</CardTitle>
                <UserCheck className="h-4 w-4 text-green-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
              <p className="text-xs text-gray-500">Paying customers</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">On Trial</CardTitle>
                <Activity className="h-4 w-4 text-purple-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.trial}</div>
              <p className="text-xs text-gray-500">
                {stats.trialExpiringThisWeek} expiring this week
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <ClientFilters
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        tierFilter={tierFilter}
        onTierChange={setTierFilter}
        tiers={tiers}
      />

      {/* Bulk Actions */}
      <BulkActions
        selectedCount={selectedIds.length}
        selectedIds={selectedIds}
        adminUserId={adminUserId}
        tiers={tiers}
        onClearSelection={() => setSelectedIds([])}
        onSuccess={handleRefresh}
      />

      {/* Client Table */}
      <ClientTable
        clients={clients}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        onViewClient={(client) => {
          // TODO: Navigate to client detail or open detail dialog
          console.log("View client:", client.id)
        }}
        onApprove={(id) => openDialog("approve", id)}
        onSuspend={(id) => openDialog("suspend", id)}
        onReactivate={(id) => openDialog("reactivate", id)}
        onExtendTrial={(id) => openDialog("extend", id)}
      />

      {/* Dialogs */}
      {activeDialog === "approve" && activeClientId && (
        <ApproveClientDialog
          clientId={activeClientId}
          adminUserId={adminUserId}
          companyName={getActiveClient()?.companyName || ""}
          tiers={tiers}
          onClose={closeDialog}
          onSuccess={handleRefresh}
        />
      )}

      {activeDialog === "suspend" && activeClientId && (
        <SuspendClientDialog
          clientId={activeClientId}
          adminUserId={adminUserId}
          companyName={getActiveClient()?.companyName || ""}
          onClose={closeDialog}
          onSuccess={handleRefresh}
        />
      )}

      {activeDialog === "extend" && activeClientId && (
        <ExtendTrialDialog
          clientId={activeClientId}
          adminUserId={adminUserId}
          companyName={getActiveClient()?.companyName || ""}
          currentTrialEndsAt={getActiveClient()?.trialEndsAt}
          onClose={closeDialog}
          onSuccess={handleRefresh}
        />
      )}

      {activeDialog === "reactivate" && activeClientId && (
        <ReactivateClientDialog
          clientId={activeClientId}
          adminUserId={adminUserId}
          companyName={getActiveClient()?.companyName || ""}
          onClose={closeDialog}
          onSuccess={handleRefresh}
        />
      )}
    </div>
  )
}

// Default export - standalone page
export default function ClientsPage() {
  // In a real app, get adminUserId from auth context
  const adminUserId = "admin-user-id"

  return <ClientsPageContent adminUserId={adminUserId} />
}
