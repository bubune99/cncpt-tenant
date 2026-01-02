"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  Globe,
  Calendar,
  Clock,
  CreditCard,
  ExternalLink,
  CheckCircle,
  XCircle,
  RefreshCw,
  Loader2,
  AlertCircle,
  User,
  FileText,
} from "lucide-react"
import {
  ApproveClientDialog,
  SuspendClientDialog,
  ExtendTrialDialog,
  ReactivateClientDialog,
  ChangeTierDialog,
} from "../client-dialogs"
import type {
  PlatformClient,
  SubscriptionTier,
  ActivityLogEntry,
} from "@/types/admin"
import { CLIENT_STATUS_COLORS, CLIENT_STATUS_LABELS, getTrialDaysRemaining } from "@/types/admin"

interface ClientDetailPageProps {
  params: Promise<{ clientId: string }>
}

type DialogType = "approve" | "suspend" | "extend" | "reactivate" | "changeTier" | null

export default function ClientDetailPage({ params }: ClientDetailPageProps) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [client, setClient] = useState<PlatformClient | null>(null)
  const [tiers, setTiers] = useState<SubscriptionTier[]>([])
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [activeDialog, setActiveDialog] = useState<DialogType>(null)

  // In a real app, get from auth context
  const adminUserId = "admin-user-id"

  useEffect(() => {
    async function loadClient() {
      try {
        const [clientRes, tiersRes, activityRes] = await Promise.all([
          fetch(`/api/admin/clients/${resolvedParams.clientId}`),
          fetch("/api/admin/tiers"),
          fetch(`/api/admin/clients/${resolvedParams.clientId}/activity`),
        ])

        if (clientRes.ok) {
          const data = await clientRes.json()
          setClient(data.client)
        }
        if (tiersRes.ok) {
          const data = await tiersRes.json()
          setTiers(data.tiers || [])
        }
        if (activityRes.ok) {
          const data = await activityRes.json()
          setActivityLog(data.activities || [])
        }
      } catch (error) {
        console.error("Failed to load client:", error)
      } finally {
        setLoading(false)
      }
    }
    loadClient()
  }, [resolvedParams.clientId])

  const handleRefresh = () => {
    setLoading(true)
    // Re-fetch data
    window.location.reload()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!client) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Client not found</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const daysRemaining = getTrialDaysRemaining(client)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <div>
            <h1 className="text-2xl font-bold">{client.companyName}</h1>
            <p className="text-gray-500">{client.contactEmail}</p>
          </div>
        </div>
        <Badge className={`${CLIENT_STATUS_COLORS[client.status]} text-sm px-3 py-1`}>
          {CLIENT_STATUS_LABELS[client.status]}
        </Badge>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {client.status === "pending_approval" && (
              <Button
                onClick={() => setActiveDialog("approve")}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve Client
              </Button>
            )}
            {client.status === "trial" && (
              <Button onClick={() => setActiveDialog("extend")} variant="outline">
                <Clock className="h-4 w-4 mr-2" />
                Extend Trial
              </Button>
            )}
            {(client.status === "active" || client.status === "trial") && (
              <Button
                onClick={() => setActiveDialog("suspend")}
                variant="outline"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Suspend
              </Button>
            )}
            {client.status === "suspended" && (
              <Button
                onClick={() => setActiveDialog("reactivate")}
                className="bg-green-600 hover:bg-green-700"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reactivate
              </Button>
            )}
            <Button onClick={() => setActiveDialog("changeTier")} variant="outline">
              <CreditCard className="h-4 w-4 mr-2" />
              Change Tier
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Client Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Client Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoRow
              icon={<Building2 className="h-4 w-4 text-gray-400" />}
              label="Company"
              value={client.companyName}
            />
            <InfoRow
              icon={<User className="h-4 w-4 text-gray-400" />}
              label="Contact"
              value={client.contactName || "Not provided"}
            />
            <InfoRow
              icon={<Mail className="h-4 w-4 text-gray-400" />}
              label="Email"
              value={client.contactEmail}
            />
            <InfoRow
              icon={<Phone className="h-4 w-4 text-gray-400" />}
              label="Phone"
              value={client.phone || "Not provided"}
            />
            <InfoRow
              icon={<Globe className="h-4 w-4 text-gray-400" />}
              label="Website"
              value={
                client.website ? (
                  <a
                    href={client.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline flex items-center gap-1"
                  >
                    {client.website}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  "Not provided"
                )
              }
            />
          </CardContent>
        </Card>

        {/* Subscription Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Subscription
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoRow
              icon={<CreditCard className="h-4 w-4 text-gray-400" />}
              label="Current Tier"
              value={client.tier?.displayName || "No tier assigned"}
            />
            {client.status === "trial" && (
              <>
                <InfoRow
                  icon={<Calendar className="h-4 w-4 text-gray-400" />}
                  label="Trial Started"
                  value={
                    client.trialStartedAt
                      ? new Date(client.trialStartedAt).toLocaleDateString()
                      : "N/A"
                  }
                />
                <InfoRow
                  icon={<Clock className="h-4 w-4 text-gray-400" />}
                  label="Trial Ends"
                  value={
                    client.trialEndsAt ? (
                      <span
                        className={
                          daysRemaining !== null && daysRemaining <= 7
                            ? "text-red-600 font-medium"
                            : ""
                        }
                      >
                        {new Date(client.trialEndsAt).toLocaleDateString()}
                        {daysRemaining !== null && ` (${daysRemaining} days left)`}
                      </span>
                    ) : (
                      "N/A"
                    )
                  }
                />
              </>
            )}
            <InfoRow
              icon={<Globe className="h-4 w-4 text-gray-400" />}
              label="Subdomain"
              value={
                client.subdomain ? (
                  <a
                    href={`https://${client.subdomain}.example.com`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline flex items-center gap-1"
                  >
                    {client.subdomain}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  "Not assigned"
                )
              }
            />
          </CardContent>
        </Card>

        {/* Dates */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Timeline
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoRow
              icon={<Calendar className="h-4 w-4 text-gray-400" />}
              label="Created"
              value={new Date(client.createdAt).toLocaleString()}
            />
            {client.approvedAt && (
              <InfoRow
                icon={<CheckCircle className="h-4 w-4 text-green-500" />}
                label="Approved"
                value={new Date(client.approvedAt).toLocaleString()}
              />
            )}
            {client.suspendedAt && (
              <InfoRow
                icon={<XCircle className="h-4 w-4 text-red-500" />}
                label="Suspended"
                value={`${new Date(client.suspendedAt).toLocaleString()} - ${
                  client.suspensionReason || "No reason"
                }`}
              />
            )}
            {client.cancelledAt && (
              <InfoRow
                icon={<XCircle className="h-4 w-4 text-gray-500" />}
                label="Cancelled"
                value={new Date(client.cancelledAt).toLocaleString()}
              />
            )}
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {client.requestMessage && (
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-1">Request Message:</p>
                <p className="text-gray-700 bg-gray-50 p-3 rounded">
                  {client.requestMessage}
                </p>
              </div>
            )}
            {client.notes ? (
              <p className="text-gray-700">{client.notes}</p>
            ) : (
              <p className="text-gray-400">No notes added</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Activity Log */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
        </CardHeader>
        <CardContent>
          {activityLog.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No activity recorded</p>
          ) : (
            <div className="space-y-4">
              {activityLog.map((entry) => (
                <div
                  key={entry.id}
                  className="flex gap-4 pb-4 border-b last:border-0 last:pb-0"
                >
                  <div className="w-2 h-2 mt-2 rounded-full bg-blue-500" />
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <p className="font-medium">
                        {entry.action.replace("_", " ")}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(entry.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <p className="text-sm text-gray-500">
                      by {entry.performedByEmail || entry.performedBy}
                    </p>
                    {entry.notes && (
                      <p className="text-sm text-gray-600 mt-1">{entry.notes}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      {activeDialog === "approve" && (
        <ApproveClientDialog
          clientId={client.id}
          adminUserId={adminUserId}
          companyName={client.companyName}
          tiers={tiers}
          onClose={() => setActiveDialog(null)}
          onSuccess={handleRefresh}
        />
      )}

      {activeDialog === "suspend" && (
        <SuspendClientDialog
          clientId={client.id}
          adminUserId={adminUserId}
          companyName={client.companyName}
          onClose={() => setActiveDialog(null)}
          onSuccess={handleRefresh}
        />
      )}

      {activeDialog === "extend" && (
        <ExtendTrialDialog
          clientId={client.id}
          adminUserId={adminUserId}
          companyName={client.companyName}
          currentTrialEndsAt={client.trialEndsAt}
          onClose={() => setActiveDialog(null)}
          onSuccess={handleRefresh}
        />
      )}

      {activeDialog === "reactivate" && (
        <ReactivateClientDialog
          clientId={client.id}
          adminUserId={adminUserId}
          companyName={client.companyName}
          onClose={() => setActiveDialog(null)}
          onSuccess={handleRefresh}
        />
      )}

      {activeDialog === "changeTier" && (
        <ChangeTierDialog
          clientId={client.id}
          adminUserId={adminUserId}
          companyName={client.companyName}
          currentTierId={client.tierId}
          tiers={tiers}
          onClose={() => setActiveDialog(null)}
          onSuccess={handleRefresh}
        />
      )}
    </div>
  )
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3">
      {icon}
      <div className="flex-1">
        <p className="text-sm text-gray-500">{label}</p>
        <div className="text-gray-900">{value}</div>
      </div>
    </div>
  )
}
