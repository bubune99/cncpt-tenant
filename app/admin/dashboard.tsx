"use client"

import { useFormState } from "react-dom"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trash2, Loader2, LogOut, User } from "lucide-react"
import Link from "next/link"
import { deleteSubdomainAction } from "@/app/actions"
import { rootDomain, protocol } from "@/lib/utils"
import { useUser } from "@stackframe/stack"

type Tenant = {
  subdomain: string
  emoji: string
  createdAt: number
}

type DeleteState = {
  error?: string
  success?: string
}

function DashboardHeader() {
  const user = useUser()

  const handleSignOut = async () => {
    if (user) {
      await user.signOut()
      window.location.href = "/"
    }
  }

  return (
    <div className="flex justify-between items-center mb-8">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-gray-600 mt-1">Manage subdomains and platform settings</p>
      </div>
      <div className="flex items-center gap-4">
        {user && (
          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg border">
            <User className="h-4 w-4 text-gray-500" />
            <div className="text-sm">
              <div className="font-medium">{user.displayName || user.primaryEmail}</div>
              <div className="text-gray-500">Admin</div>
            </div>
          </div>
        )}
        <Link
          href={`${protocol}://${rootDomain}`}
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          {rootDomain}
        </Link>
        <Button variant="outline" size="sm" onClick={handleSignOut} className="flex items-center gap-2 bg-transparent">
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  )
}

function TenantGrid({
  tenants,
  action,
  isPending,
}: {
  tenants: Tenant[]
  action: (formData: FormData) => void
  isPending: boolean
}) {
  if (tenants.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-gray-500">No subdomains have been created yet.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {tenants.map((tenant) => (
        <Card key={tenant.subdomain}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">{tenant.subdomain}</CardTitle>
              <form action={action}>
                <input type="hidden" name="subdomain" value={tenant.subdomain} />
                <Button
                  variant="ghost"
                  size="icon"
                  type="submit"
                  disabled={isPending}
                  className="text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                >
                  {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Trash2 className="h-5 w-5" />}
                </Button>
              </form>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-4xl">{tenant.emoji}</div>
              <div className="text-sm text-gray-500">Created: {new Date(tenant.createdAt).toLocaleDateString()}</div>
            </div>
            <div className="mt-4">
              <a
                href={`${protocol}://${tenant.subdomain}.${rootDomain}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline text-sm"
              >
                Visit subdomain →
              </a>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function AdminDashboard({ tenants }: { tenants: Tenant[] }) {
  const [state, action] = useFormState<DeleteState, FormData>(deleteSubdomainAction, {})
  const [isPending, setIsPending] = useState(false)

  const handleAction = async (formData: FormData) => {
    setIsPending(true)
    await action(formData)
    setIsPending(false)
  }

  return (
    <div className="space-y-6 relative p-4 md:p-8">
      <DashboardHeader />

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Subdomains</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tenants.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tenants.filter((t) => new Date(t.createdAt).getMonth() === new Date().getMonth()).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Platform Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Active</div>
          </CardContent>
        </Card>
      </div>

      <TenantGrid tenants={tenants} action={handleAction} isPending={isPending} />

      {state.error && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-md">
          {state.error}
        </div>
      )}

      {state.success && (
        <div className="fixed bottom-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded shadow-md">
          {state.success}
        </div>
      )}
    </div>
  )
}
