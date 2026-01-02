"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  MoreHorizontal,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  ExternalLink,
} from "lucide-react"
import type { PlatformClient, ClientStatus } from "@/types/admin"
import { CLIENT_STATUS_COLORS, getTrialDaysRemaining } from "@/types/admin"

interface ClientTableProps {
  clients: PlatformClient[]
  selectedIds: string[]
  onSelectionChange: (ids: string[]) => void
  onViewClient: (client: PlatformClient) => void
  onApprove: (clientId: string) => void
  onSuspend: (clientId: string) => void
  onReactivate: (clientId: string) => void
  onExtendTrial: (clientId: string) => void
}

const statusIcons: Record<ClientStatus, React.ReactNode> = {
  pending_approval: <Clock className="h-3 w-3" />,
  trial: <RefreshCw className="h-3 w-3" />,
  active: <CheckCircle className="h-3 w-3" />,
  suspended: <XCircle className="h-3 w-3" />,
  cancelled: <XCircle className="h-3 w-3" />,
}

export function ClientTable({
  clients,
  selectedIds,
  onSelectionChange,
  onViewClient,
  onApprove,
  onSuspend,
  onReactivate,
  onExtendTrial,
}: ClientTableProps) {
  const allSelected = clients.length > 0 && selectedIds.length === clients.length
  const someSelected = selectedIds.length > 0 && selectedIds.length < clients.length

  const toggleAll = () => {
    if (allSelected) {
      onSelectionChange([])
    } else {
      onSelectionChange(clients.map((c) => c.id))
    }
  }

  const toggleOne = (clientId: string) => {
    if (selectedIds.includes(clientId)) {
      onSelectionChange(selectedIds.filter((id) => id !== clientId))
    } else {
      onSelectionChange([...selectedIds, clientId])
    }
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="w-12 px-4 py-3">
              <Checkbox
                checked={allSelected}
                onCheckedChange={toggleAll}
                aria-label="Select all"
                className={someSelected ? "data-[state=checked]:bg-blue-300" : ""}
              />
            </th>
            <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">
              Company
            </th>
            <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">
              Status
            </th>
            <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">
              Tier
            </th>
            <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">
              Subdomain
            </th>
            <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">
              Trial
            </th>
            <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">
              Created
            </th>
            <th className="w-12 px-4 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {clients.map((client) => {
            const daysRemaining = getTrialDaysRemaining(client)
            const isTrialExpiring = client.status === "trial" && daysRemaining !== null && daysRemaining <= 7

            return (
              <tr
                key={client.id}
                className={`hover:bg-gray-50 ${
                  selectedIds.includes(client.id) ? "bg-blue-50" : ""
                }`}
              >
                <td className="px-4 py-3">
                  <Checkbox
                    checked={selectedIds.includes(client.id)}
                    onCheckedChange={() => toggleOne(client.id)}
                    aria-label={`Select ${client.companyName}`}
                  />
                </td>
                <td className="px-4 py-3">
                  <div>
                    <div className="font-medium text-gray-900">
                      {client.companyName}
                    </div>
                    <div className="text-sm text-gray-500">
                      {client.contactEmail}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge
                    className={`${CLIENT_STATUS_COLORS[client.status]} flex items-center gap-1 w-fit`}
                  >
                    {statusIcons[client.status]}
                    {client.status.replace("_", " ")}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-sm">
                  {client.tier?.displayName || (
                    <span className="text-gray-400">No tier</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm">
                  {client.subdomain ? (
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
                    <span className="text-gray-400">Not assigned</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm">
                  {client.status === "trial" && daysRemaining !== null ? (
                    <span
                      className={
                        isTrialExpiring ? "text-red-600 font-medium" : ""
                      }
                    >
                      {daysRemaining} days left
                    </span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {new Date(client.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onViewClient(client)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {client.status === "pending_approval" && (
                        <DropdownMenuItem onClick={() => onApprove(client.id)}>
                          <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                          Approve
                        </DropdownMenuItem>
                      )}
                      {client.status === "trial" && (
                        <DropdownMenuItem onClick={() => onExtendTrial(client.id)}>
                          <Clock className="h-4 w-4 mr-2" />
                          Extend Trial
                        </DropdownMenuItem>
                      )}
                      {(client.status === "active" || client.status === "trial") && (
                        <DropdownMenuItem
                          onClick={() => onSuspend(client.id)}
                          className="text-red-600"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Suspend
                        </DropdownMenuItem>
                      )}
                      {client.status === "suspended" && (
                        <DropdownMenuItem onClick={() => onReactivate(client.id)}>
                          <RefreshCw className="h-4 w-4 mr-2 text-green-600" />
                          Reactivate
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {clients.length === 0 && (
        <div className="py-12 text-center text-gray-500">
          No clients found matching your filters.
        </div>
      )}
    </div>
  )
}
