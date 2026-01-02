"use client"

import { useFormState } from "react-dom"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Trash2,
  Loader2,
  LogOut,
  User,
  Home,
  Users,
  Settings,
  BarChart3,
  Shield,
  Database,
  Globe,
  Activity,
  UserCheck,
  TrendingUp,
  Server,
  CreditCard,
  AlertCircle,
} from "lucide-react"
import { deleteSubdomainAction } from "@/app/actions"
import { rootDomain, protocol } from "@/lib/utils"
import { useUser } from "@stackframe/stack"
import { TiersPageContent } from "./tiers/page"
import { ClientsPageContent } from "./clients/page"
import type { SubscriptionTier, ClientStats } from "@/types/admin"

type Tenant = {
  subdomain: string
  emoji: string
  createdAt: number
}

type DeleteState = {
  error?: string
  success?: string
}

type AdminSection = "overview" | "clients" | "tiers" | "subdomains" | "users" | "analytics" | "settings"

function AdminSidebar({
  activeSection,
  onSectionChange,
  pendingClientsCount = 0,
}: {
  activeSection: AdminSection
  onSectionChange: (section: AdminSection) => void
  pendingClientsCount?: number
}) {
  const sidebarItems = [
    { id: "overview" as AdminSection, label: "Overview", icon: Home },
    { id: "clients" as AdminSection, label: "Clients", icon: Users, badge: pendingClientsCount },
    { id: "tiers" as AdminSection, label: "Subscription Tiers", icon: CreditCard },
    { id: "subdomains" as AdminSection, label: "Subdomains", icon: Globe },
    { id: "analytics" as AdminSection, label: "Analytics", icon: BarChart3 },
    { id: "settings" as AdminSection, label: "Settings", icon: Settings },
  ]

  return (
    <div className="w-64 bg-white border-r border-gray-200 min-h-screen">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-900">Admin Panel</h2>
        <p className="text-sm text-gray-500 mt-1">{rootDomain}</p>
      </div>
      <nav className="p-4">
        <ul className="space-y-2">
          {sidebarItems.map((item) => {
            const Icon = item.icon
            return (
              <li key={item.id}>
                <button
                  onClick={() => onSectionChange(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${
                    activeSection === item.id
                      ? "bg-blue-50 text-blue-700 border border-blue-200"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </div>
                  {item.badge && item.badge > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {item.badge}
                    </Badge>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}

function AdminHeader() {
  const user = useUser()

  const handleSignOut = async () => {
    if (user) {
      await user.signOut()
      window.location.href = "/"
    }
  }

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        </div>
        <div className="flex items-center gap-4">
          {user && (
            <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-lg">
              <User className="h-4 w-4 text-gray-500" />
              <div className="text-sm">
                <div className="font-medium">{user.displayName || user.primaryEmail}</div>
                <div className="text-gray-500">Administrator</div>
              </div>
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleSignOut}
            className="flex items-center gap-2 bg-transparent"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  )
}

function OverviewSection({ tenants }: { tenants: Tenant[] }) {
  const totalSubdomains = tenants.length
  const thisMonth = tenants.filter((t) => new Date(t.createdAt).getMonth() === new Date().getMonth()).length
  const thisWeek = tenants.filter((t) => {
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    return new Date(t.createdAt) > weekAgo
  }).length

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Platform Overview</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Total Subdomains</CardTitle>
              <Globe className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSubdomains}</div>
            <p className="text-xs text-gray-500 mt-1">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">This Month</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{thisMonth}</div>
            <p className="text-xs text-gray-500 mt-1">New subdomains</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">This Week</CardTitle>
              <Activity className="h-4 w-4 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{thisWeek}</div>
            <p className="text-xs text-gray-500 mt-1">Recent activity</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">System Status</CardTitle>
              <Server className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Online</div>
            <p className="text-xs text-gray-500 mt-1">All systems operational</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {tenants.slice(0, 5).map((tenant) => (
              <div
                key={tenant.subdomain}
                className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{tenant.emoji}</div>
                  <div>
                    <div className="font-medium">{tenant.subdomain}</div>
                    <div className="text-sm text-gray-500">
                      Created {new Date(tenant.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <a
                  href={`${protocol}://${tenant.subdomain}.${rootDomain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline text-sm"
                >
                  Visit →
                </a>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function SubdomainsSection({
  tenants,
  action,
  isPending,
}: {
  tenants: Tenant[]
  action: (formData: FormData) => void
  isPending: boolean
}) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Subdomain Management</h2>
        <div className="text-sm text-gray-500">{tenants.length} total subdomains</div>
      </div>

      {tenants.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No subdomains have been created yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tenants.map((tenant) => (
            <Card key={tenant.subdomain}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{tenant.subdomain}</CardTitle>
                  <form action={action}>
                    <input type="hidden" name="subdomain" value={tenant.subdomain} />
                    <Button
                      variant="ghost"
                      size="icon"
                      type="submit"
                      disabled={isPending}
                      className="text-gray-500 hover:text-red-600 hover:bg-red-50"
                    >
                      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </Button>
                  </form>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div className="text-3xl">{tenant.emoji}</div>
                  <div className="text-sm text-gray-500">{new Date(tenant.createdAt).toLocaleDateString()}</div>
                </div>
                <a
                  href={`${protocol}://${tenant.subdomain}.${rootDomain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-blue-500 hover:underline text-sm"
                >
                  Visit subdomain →
                </a>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

function ClientsSection({ adminUserId }: { adminUserId: string }) {
  return <ClientsPageContent adminUserId={adminUserId} />
}

function TiersSection({
  tiers,
}: {
  tiers: (SubscriptionTier & { clientCount: number })[]
}) {
  return <TiersPageContent initialTiers={tiers} />
}

function UsersSection() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
      <Card>
        <CardContent className="py-12 text-center">
          <UserCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">User management coming soon</p>
          <p className="text-sm text-gray-400">View and manage platform users</p>
        </CardContent>
      </Card>
    </div>
  )
}

function AnalyticsSection() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Analytics & Reports</h2>
      <Card>
        <CardContent className="py-12 text-center">
          <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">Analytics dashboard coming soon</p>
          <p className="text-sm text-gray-400">Track usage, performance, and growth metrics</p>
        </CardContent>
      </Card>
    </div>
  )
}

function SettingsSection() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Platform Settings</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500 mb-4">Configure authentication and security policies</p>
            <Button variant="outline" size="sm">
              Configure
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500 mb-4">Manage database connections and backups</p>
            <Button variant="outline" size="sm">
              Manage
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export function AdminDashboard({ tenants }: { tenants: Tenant[] }) {
  const [state, action] = useFormState<DeleteState, FormData>(deleteSubdomainAction, {})
  const [isPending, setIsPending] = useState(false)
  const [activeSection, setActiveSection] = useState<AdminSection>("overview")
  const [tiers, setTiers] = useState<(SubscriptionTier & { clientCount: number })[]>([])
  const [clientStats, setClientStats] = useState<ClientStats | undefined>()
  const [tiersLoaded, setTiersLoaded] = useState(false)

  const user = useUser()
  const adminUserId = user?.id || "admin"

  // Load tiers when switching to tiers section
  useEffect(() => {
    if (activeSection === "tiers" && !tiersLoaded) {
      fetch("/api/admin/tiers")
        .then((res) => res.ok ? res.json() : null)
        .then((data) => {
          if (data?.tiers) {
            setTiers(data.tiers)
            setTiersLoaded(true)
          }
        })
        .catch(console.error)
    }
  }, [activeSection, tiersLoaded])

  // Load client stats for sidebar badge
  useEffect(() => {
    fetch("/api/admin/clients/stats")
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data?.stats) {
          setClientStats(data.stats)
        }
      })
      .catch(console.error)
  }, [])

  const handleAction = async (formData: FormData) => {
    setIsPending(true)
    await action(formData)
    setIsPending(false)
  }

  const renderActiveSection = () => {
    switch (activeSection) {
      case "overview":
        return <OverviewSection tenants={tenants} />
      case "clients":
        return <ClientsSection adminUserId={adminUserId} />
      case "tiers":
        return <TiersSection tiers={tiers} />
      case "subdomains":
        return <SubdomainsSection tenants={tenants} action={handleAction} isPending={isPending} />
      case "analytics":
        return <AnalyticsSection />
      case "settings":
        return <SettingsSection />
      default:
        return <OverviewSection tenants={tenants} />
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        pendingClientsCount={clientStats?.pendingApproval}
      />

      <div className="flex-1">
        <AdminHeader />

        <main className="p-6">{renderActiveSection()}</main>
      </div>

      {state.error && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-md z-50">
          {state.error}
        </div>
      )}

      {state.success && (
        <div className="fixed bottom-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded shadow-md z-50">
          {state.success}
        </div>
      )}
    </div>
  )
}
