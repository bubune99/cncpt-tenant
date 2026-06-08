"use client"

import { useFormState } from "react-dom"
import { useState, useEffect, useCallback, Fragment } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
  MoreHorizontal,
  Search,
  ArrowRight,
  Building2,
  Mail,
  Calendar,
  Crown,
  Eye,
  RefreshCw,
  History,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Sparkles,
  Wand2,
  Gift,
  Pencil,
  Plus,
  Bell,
  Gauge,
  DollarSign,
} from "lucide-react"
import "@/app/admin/cncpt-admin.css"
import { deleteSubdomainAction } from "@/app/actions"
import { rootDomain, protocol } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { useUser } from "@stackframe/stack"
import { TiersPageContent } from "./tiers/page"
import { ClientsPageContent } from "./clients/page"
import { RateLimitsSection } from "./rate-limits-section"
import { BillingSection } from "./billing-section"
import type { SubscriptionTier, ClientStats } from "@/types/admin"

type Tenant = {
  subdomain: string
  createdAt: number
}

type DeleteState = {
  error?: string
  success?: string
}

type SuperAdminInfo = {
  userId: string
  email: string
  permissions: string[]
}

type AdminSection = "overview" | "clients" | "tiers" | "subdomains" | "users" | "teams" | "analytics" | "activity" | "feedback" | "settings" | "ai-credits" | "overrides" | "rate-limits" | "billing"

// ---------------------------------------------------------------------------
// Live activity rail — real platform activity (no mock).
// ---------------------------------------------------------------------------
interface RailLog {
  id: string
  actorEmail: string | null
  action: string
  targetType: string | null
  targetId: string | null
  details?: Record<string, unknown>
  createdAt: string
}

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime()
  const diff = Math.max(0, Date.now() - then)
  const s = Math.floor(diff / 1000)
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d ago`
  return new Date(iso).toLocaleDateString()
}

function actionColor(action: string): string {
  const a = action.toLowerCase()
  if (/(delete|suspend|disable|revoke|remove|fail|orphan|ban)/.test(a)) return "#dc2626"
  if (/(create|signup|join|enable|restore|add|grant|topup|top_up|approve)/.test(a)) return "#10b981"
  if (/(tier|plan|billing|credit|subscription)/.test(a)) return "#1d4ed8"
  if (/(flag|request|warn|review)/.test(a)) return "#a16207"
  return "#475569"
}

function actionActionable(action: string): boolean {
  return /(request|flag|orphan|dispute|review_needed)/.test(action.toLowerCase())
}

/** Humanize "tenant.tier_change" + target into a short readable phrase. */
function actionText(log: RailLog): string {
  const verb = log.action.replace(/[._]/g, " ").trim()
  const tgt = log.targetId ? ` · ${log.targetType ?? "target"} ${log.targetId}` : log.targetType ? ` · ${log.targetType}` : ""
  return `${verb}${tgt}`
}

function AdminActivityRail() {
  const [logs, setLogs] = useState<RailLog[] | null>(null)
  const [err, setErr] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/super-admin/activity-log?limit=14", { cache: "no-store" })
      if (!res.ok) throw new Error(String(res.status))
      const data = await res.json()
      setLogs(Array.isArray(data.logs) ? data.logs : [])
    } catch {
      setErr(true)
      setLogs([])
    }
  }, [])

  useEffect(() => {
    load()
    const onRefresh = () => load()
    window.addEventListener("nw:data-refresh", onRefresh)
    return () => window.removeEventListener("nw:data-refresh", onRefresh)
  }, [load])

  return (
    <aside className="ca-rrail">
      <div className="ca-rrail__head">
        <span className="ca-live-dot" aria-hidden />
        <h3>Live activity</h3>
      </div>
      <div className="ca-rrail__tabs">
        <button type="button" className="is-on">Activity</button>
      </div>
      <div className="ca-rrail__body">
        {logs === null ? (
          <div className="ca-act-row" style={{ opacity: 0.6 }}>
            <div className="ca-act-body"><span className="ca-act-who">Loading activity…</span></div>
          </div>
        ) : logs.length === 0 ? (
          <div className="ca-act-row">
            <div className="ca-act-body">
              <span className="ca-act-who">No activity yet</span>
              <div className="ca-act-time">{err ? "Activity log unavailable" : "Platform events will appear here"}</div>
            </div>
          </div>
        ) : (
          logs.map((ev) => (
            <div key={ev.id} className={`ca-act-row${actionActionable(ev.action) ? " is-actionable" : ""}`}>
              <div className="ca-act-icon" style={{ color: actionColor(ev.action) }}>
                <Activity style={{ width: 11, height: 11 }} aria-hidden />
              </div>
              <div className="ca-act-body">
                <span className="ca-act-who">{ev.actorEmail ?? "system"}</span>{" "}{actionText(ev)}
                <div className="ca-act-time">{relativeTime(ev.createdAt)}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
  )
}

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
    { id: "users" as AdminSection, label: "Users", icon: Users },
    { id: "teams" as AdminSection, label: "Teams", icon: Building2 },
    { id: "clients" as AdminSection, label: "Clients", icon: UserCheck, badge: pendingClientsCount },
    { id: "tiers" as AdminSection, label: "Subscription Tiers", icon: CreditCard },
    { id: "subdomains" as AdminSection, label: "Subdomains", icon: Globe },
    { id: "ai-credits" as AdminSection, label: "AI Credits", icon: Sparkles },
    { id: "overrides" as AdminSection, label: "User Overrides", icon: Wand2 },
    { id: "analytics" as AdminSection, label: "Analytics", icon: BarChart3 },
    { id: "activity" as AdminSection, label: "Activity Log", icon: History },
    { id: "feedback" as AdminSection, label: "Feedback", icon: MessageSquare },
    { id: "settings" as AdminSection, label: "Settings", icon: Settings },
  ]

  return (
    <div className="w-64 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 min-h-screen border-r border-border">
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-blue-600 to-orange-500 flex items-center justify-center">
            <Shield className="h-5 w-5 text-foreground" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">CNCPT Web Admin</h2>
            <p className="text-xs text-muted-foreground">{rootDomain}</p>
          </div>
        </div>
      </div>
      <nav className="p-3">
        <ul className="space-y-1">
          {sidebarItems.map((item) => {
            const Icon = item.icon
            const isActive = activeSection === item.id
            return (
              <li key={item.id}>
                <button
                  onClick={() => onSectionChange(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-blue-600/20 to-orange-500/10 text-white border border-blue-500/30 shadow-lg shadow-blue-500/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-4 w-4 ${isActive ? "text-orange-400" : ""}`} />
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                  {item.badge && item.badge > 0 && (
                    <Badge className="bg-rose-500/90 hover:bg-rose-500 text-white text-[10px] px-1.5 py-0.5">
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
  const router = useRouter()

  const handleSignOut = async () => {
    if (user) {
      await user.signOut()
      router.push("/")
    }
  }

  return (
    <div className="bg-muted/50 backdrop-blur-sm border-b border-border px-6 py-4 sticky top-0 z-10">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Super Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">Platform-wide administration</p>
        </div>
        <div className="flex items-center gap-3">
          {user && (
            <div className="flex items-center gap-3 bg-gradient-to-r from-blue-600/10 to-orange-500/10 px-4 py-2 rounded-lg border border-blue-500/20">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-600 to-orange-500 flex items-center justify-center">
                <Crown className="h-4 w-4 text-foreground" />
              </div>
              <div className="text-sm">
                <div className="font-medium text-foreground">{user.displayName || user.primaryEmail}</div>
                <div className="text-orange-400 text-xs">Super Admin</div>
              </div>
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleSignOut}
            className="flex items-center gap-2 bg-transparent border-border text-foreground hover:text-foreground hover:bg-muted hover:border-white/20"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  )
}

type OverviewData = {
  users: { total: number; newLast30Days: number; dailySignups: Array<{ date: string; count: number }> }
  subdomains: { total: number; last30Days: number; last7Days: number }
  teams: { total: number; last30Days: number; totalMembers: number }
  topUsers: Array<{ userId: string; email: string; displayName: string | null; subdomainCount: number }>
}

function OverviewSection() {
  const [data, setData] = useState<OverviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOverviewData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch("/api/super-admin/analytics")
      if (!res.ok) throw new Error("Failed to fetch analytics")
      const json = await res.json()
      setData(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOverviewData()
  }, [fetchOverviewData])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
        <p className="text-muted-foreground">{error || "Failed to load overview data"}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">Platform Overview</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchOverviewData()}
          className="flex items-center gap-2 bg-transparent border-border text-foreground hover:text-foreground hover:bg-muted"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card border-border hover:border-white/[0.15] transition-colors">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
              <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Users className="h-4 w-4 text-blue-400" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{data.users.total}</div>
            <p className="text-xs text-emerald-400 mt-1">+{data.users.newLast30Days} last 30 days</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border hover:border-white/[0.15] transition-colors">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Subdomains</CardTitle>
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Globe className="h-4 w-4 text-emerald-400" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{data.subdomains.total}</div>
            <p className="text-xs text-emerald-400 mt-1">+{data.subdomains.last30Days} last 30 days</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border hover:border-white/[0.15] transition-colors">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">This Week</CardTitle>
              <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Activity className="h-4 w-4 text-orange-400" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{data.subdomains.last7Days}</div>
            <p className="text-xs text-muted-foreground mt-1">New subdomains</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border hover:border-white/[0.15] transition-colors">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Teams</CardTitle>
              <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Building2 className="h-4 w-4 text-amber-400" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{data.teams.total}</div>
            <p className="text-xs text-muted-foreground mt-1">{data.teams.totalMembers} total members</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Top Users by Subdomains</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.topUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No users with subdomains yet</p>
            ) : (
              data.topUsers.map((user, index) => (
                <div
                  key={user.userId}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-600 to-orange-500 flex items-center justify-center text-sm font-medium text-white">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-foreground">{user.displayName || user.email}</div>
                      {user.displayName && (
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      )}
                    </div>
                  </div>
                  <Badge className="bg-blue-500/10 text-orange-400 hover:bg-blue-500/20 border-blue-500/20">{user.subdomainCount} subdomains</Badge>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {data.users.dailySignups && data.users.dailySignups.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">New Users (Last 14 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-1 h-24">
              {data.users.dailySignups.map((day: { date: string; count: number }, i: number) => {
                const max = Math.max(...data.users.dailySignups.map((d: { count: number }) => d.count), 1)
                const height = (day.count / max) * 100
                return (
                  <div
                    key={i}
                    className="flex-1 bg-blue-500/60 hover:bg-blue-500 rounded-t transition-colors cursor-default group relative"
                    style={{ height: `${Math.max(height, 4)}%` }}
                    title={`${day.date}: ${day.count} users`}
                  />
                )
              })}
            </div>
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>{data.users.dailySignups[0]?.date}</span>
              <span>{data.users.dailySignups[data.users.dailySignups.length - 1]?.date}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Activity className="h-5 w-5 text-emerald-400" />
            Platform Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-400">●</div>
              <p className="text-sm text-muted-foreground">API Status</p>
              <p className="text-xs text-emerald-400">Operational</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-400">●</div>
              <p className="text-sm text-muted-foreground">Database</p>
              <p className="text-xs text-emerald-400">Connected</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-400">●</div>
              <p className="text-sm text-muted-foreground">Auth Service</p>
              <p className="text-xs text-emerald-400">Active</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Enhanced subdomain type with owner info
type EnhancedSubdomain = {
  id: number
  subdomain: string
  userId: string | null
  owner: {
    id: string
    email: string | null
    displayName: string | null
  } | null
  createdAt: string
  teamShareCount: number
  disabled?: boolean
  disabledReason?: string | null
  tierId?: string | null
  tierName?: string | null
  tierDisplayName?: string | null
  subscriptionStatus?: string | null
}

type TierOption = { id: string; name: string; displayName: string; priceMonthly: number }

function SubdomainsSection({
  tenants,
  action,
  isPending,
}: {
  tenants: Tenant[]
  action: (formData: FormData) => void
  isPending: boolean
}) {
  const [subdomains, setSubdomains] = useState<EnhancedSubdomain[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [selectedSubdomain, setSelectedSubdomain] = useState<EnhancedSubdomain | null>(null)
  const [newOwnerEmail, setNewOwnerEmail] = useState("")
  const [newOwnerId, setNewOwnerId] = useState("")
  const [reassigning, setReassigning] = useState(false)
  const [searchingUser, setSearchingUser] = useState(false)
  const [foundUser, setFoundUser] = useState<{ id: string; email: string; displayName: string | null } | null>(null)

  // Create subdomain state
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newSubdomain, setNewSubdomain] = useState("")
  const [newSiteName, setNewSiteName] = useState("")
  const [assignOwnerEmail, setAssignOwnerEmail] = useState("")
  const [assignOwnerId, setAssignOwnerId] = useState("")
  const [assignFoundUser, setAssignFoundUser] = useState<{ id: string; email: string; displayName: string | null } | null>(null)
  const [creating, setCreating] = useState(false)
  const [searchingAssignUser, setSearchingAssignUser] = useState(false)

  // Tier assignment + lifecycle state
  const [tierOptions, setTierOptions] = useState<TierOption[]>([])
  const [tierSaving, setTierSaving] = useState<number | null>(null)
  const [suspendTarget, setSuspendTarget] = useState<EnhancedSubdomain | null>(null)
  const [suspendReason, setSuspendReason] = useState("")
  const [suspendUnassign, setSuspendUnassign] = useState(false)
  const [lifecycleBusy, setLifecycleBusy] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<EnhancedSubdomain | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState("")

  // Load active tier options for the assignment dropdown.
  useEffect(() => {
    fetch("/api/admin/tiers")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.tiers) {
          setTierOptions(
            (data.tiers as Array<{ id: string; name: string; displayName?: string; display_name?: string; isActive?: boolean; is_active?: boolean; priceMonthly?: number; price_monthly?: number }>)
              .filter((t) => t.isActive ?? t.is_active ?? true)
              .map((t) => ({
                id: t.id,
                name: t.name,
                displayName: t.displayName ?? t.display_name ?? t.name,
                priceMonthly: Number(t.priceMonthly ?? t.price_monthly ?? 0),
              })),
          )
        }
      })
      .catch(console.error)
  }, [])

  const handleAssignTier = async (sub: EnhancedSubdomain, tierId: string | null) => {
    setTierSaving(sub.id)
    try {
      const res = await fetch(`/api/super-admin/subdomains/${sub.subdomain}/tier`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tierId }),
      })
      if (res.ok) fetchSubdomains()
    } catch (e) {
      console.error("Failed to assign tier:", e)
    } finally {
      setTierSaving(null)
    }
  }

  const handleSuspend = async () => {
    if (!suspendTarget) return
    setLifecycleBusy(true)
    try {
      const res = await fetch(`/api/super-admin/subdomains/${suspendTarget.subdomain}/lifecycle`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "suspend", reason: suspendReason || null, unassignOwner: suspendUnassign }),
      })
      if (res.ok) {
        setSuspendTarget(null)
        setSuspendReason("")
        setSuspendUnassign(false)
        fetchSubdomains()
      }
    } catch (e) {
      console.error("Failed to suspend:", e)
    } finally {
      setLifecycleBusy(false)
    }
  }

  const handleUnsuspend = async (sub: EnhancedSubdomain) => {
    setLifecycleBusy(true)
    try {
      const res = await fetch(`/api/super-admin/subdomains/${sub.subdomain}/lifecycle`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "unsuspend" }),
      })
      if (res.ok) fetchSubdomains()
    } catch (e) {
      console.error("Failed to unsuspend:", e)
    } finally {
      setLifecycleBusy(false)
    }
  }

  const handleHardDelete = async () => {
    if (!deleteTarget || deleteConfirm !== deleteTarget.subdomain) return
    setLifecycleBusy(true)
    try {
      const res = await fetch(
        `/api/super-admin/subdomains/${deleteTarget.subdomain}/lifecycle?confirm=${encodeURIComponent(deleteConfirm)}`,
        { method: "DELETE" },
      )
      if (res.ok) {
        setDeleteTarget(null)
        setDeleteConfirm("")
        fetchSubdomains()
      } else {
        const data = await res.json().catch(() => ({}))
        alert(data.error || "Failed to delete tenant")
      }
    } catch (e) {
      console.error("Failed to delete:", e)
    } finally {
      setLifecycleBusy(false)
    }
  }

  const fetchSubdomains = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        ...(search && { search }),
      })
      const res = await fetch(`/api/super-admin/subdomains?${params}`)
      if (res.ok) {
        const data = await res.json()
        setSubdomains(data.subdomains)
        setTotalPages(data.totalPages)
        setTotal(data.total)
      }
    } catch (error) {
      console.error("Failed to fetch subdomains:", error)
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => {
    fetchSubdomains()
  }, [fetchSubdomains])

  const searchUserByEmail = async () => {
    if (!newOwnerEmail) return
    setSearchingUser(true)
    setFoundUser(null)
    try {
      const res = await fetch(`/api/super-admin/users?search=${encodeURIComponent(newOwnerEmail)}&limit=1`)
      if (res.ok) {
        const data = await res.json()
        if (data.users && data.users.length > 0) {
          const user = data.users[0]
          setFoundUser({
            id: user.id,
            email: user.email,
            displayName: user.displayName,
          })
          setNewOwnerId(user.id)
        } else {
          setFoundUser(null)
          setNewOwnerId("")
        }
      }
    } catch (error) {
      console.error("Failed to search user:", error)
    } finally {
      setSearchingUser(false)
    }
  }

  const handleReassign = async () => {
    if (!selectedSubdomain || !newOwnerId) return
    setReassigning(true)
    try {
      const res = await fetch("/api/super-admin/subdomains", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subdomainId: selectedSubdomain.id,
          newUserId: newOwnerId,
          newUserEmail: foundUser?.email || newOwnerEmail,
        }),
      })
      if (res.ok) {
        setSelectedSubdomain(null)
        setNewOwnerEmail("")
        setNewOwnerId("")
        setFoundUser(null)
        fetchSubdomains()
      }
    } catch (error) {
      console.error("Failed to reassign subdomain:", error)
    } finally {
      setReassigning(false)
    }
  }

  const handleRemoveOwner = async () => {
    if (!selectedSubdomain) return
    setReassigning(true)
    try {
      const res = await fetch("/api/super-admin/subdomains", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subdomainId: selectedSubdomain.id,
          newUserId: null,
        }),
      })
      if (res.ok) {
        setSelectedSubdomain(null)
        fetchSubdomains()
      }
    } catch (error) {
      console.error("Failed to remove owner:", error)
    } finally {
      setReassigning(false)
    }
  }

  const searchAssignUserByEmail = async () => {
    if (!assignOwnerEmail) return
    setSearchingAssignUser(true)
    setAssignFoundUser(null)
    try {
      const res = await fetch(`/api/super-admin/users?search=${encodeURIComponent(assignOwnerEmail)}&limit=1`)
      if (res.ok) {
        const data = await res.json()
        if (data.users && data.users.length > 0) {
          const user = data.users[0]
          setAssignFoundUser({
            id: user.id,
            email: user.email,
            displayName: user.displayName,
          })
          setAssignOwnerId(user.id)
        } else {
          setAssignFoundUser(null)
          setAssignOwnerId("")
        }
      }
    } catch (error) {
      console.error("Failed to search user:", error)
    } finally {
      setSearchingAssignUser(false)
    }
  }

  const handleCreateSubdomain = async () => {
    if (!newSubdomain) return
    setCreating(true)
    try {
      const res = await fetch("/api/super-admin/subdomains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subdomain: newSubdomain.toLowerCase().trim(),
          siteName: newSiteName || newSubdomain,
          ownerId: assignOwnerId || null,
          ownerEmail: assignFoundUser?.email || assignOwnerEmail || null,
        }),
      })
      if (res.ok) {
        setShowCreateDialog(false)
        setNewSubdomain("")
        setNewSiteName("")
        setAssignOwnerEmail("")
        setAssignOwnerId("")
        setAssignFoundUser(null)
        fetchSubdomains()
      } else {
        const data = await res.json()
        alert(data.error || "Failed to create subdomain")
      }
    } catch (error) {
      console.error("Failed to create subdomain:", error)
      alert("Failed to create subdomain")
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Subdomain Management</h2>
          <p className="text-sm text-muted-foreground">{total} total subdomains - Create and assign ownership to users</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowCreateDialog(true)} size="sm" className="bg-gradient-to-r from-blue-700 to-orange-500 hover:from-blue-600 hover:to-orange-400 text-white border-0">
            <Globe className="h-4 w-4 mr-2" />
            Create Subdomain
          </Button>
          <Button onClick={fetchSubdomains} variant="outline" size="sm" className="bg-transparent border-border text-foreground hover:text-foreground hover:bg-muted">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search subdomains..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="pl-10 bg-card border-border text-foreground placeholder:text-muted-foreground focus:border-blue-500/50"
          />
        </div>
      </div>

      {/* Subdomains Table */}
      <Card className="bg-card border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">Subdomain</TableHead>
              <TableHead className="text-muted-foreground">Owner</TableHead>
              <TableHead className="text-muted-foreground">Plan</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
              <TableHead className="text-muted-foreground">Teams</TableHead>
              <TableHead className="w-44 text-muted-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow className="border-border">
                <TableCell colSpan={6} className="text-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-orange-400" />
                </TableCell>
              </TableRow>
            ) : subdomains.length === 0 ? (
              <TableRow className="border-border">
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  <Globe className="h-12 w-12 text-foreground mx-auto mb-4" />
                  <p>No subdomains found</p>
                </TableCell>
              </TableRow>
            ) : (
              subdomains.map((sub) => (
                <TableRow key={sub.id} className="border-border hover:bg-muted">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="font-medium text-foreground">{sub.subdomain}</div>
                        <a
                          href={`${protocol}://${sub.subdomain}.${rootDomain}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-orange-400 hover:text-orange-300"
                        >
                          Visit →
                        </a>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {sub.owner ? (
                      <div>
                        <div className="font-medium text-sm text-foreground">{sub.owner.displayName || sub.owner.email}</div>
                        {sub.owner.displayName && (
                          <div className="text-xs text-muted-foreground">{sub.owner.email}</div>
                        )}
                      </div>
                    ) : (
                      <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20">
                        No Owner
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <select
                        value={sub.tierId || ""}
                        disabled={tierSaving === sub.id}
                        onChange={(e) => handleAssignTier(sub, e.target.value || null)}
                        className="bg-muted/50 border border-border text-foreground text-xs rounded-md px-2 py-1 focus:border-blue-500/50 outline-none"
                      >
                        <option value="">Unassigned</option>
                        {tierOptions.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.displayName}{t.priceMonthly ? ` ($${t.priceMonthly})` : ""}
                          </option>
                        ))}
                      </select>
                      {tierSaving === sub.id && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
                    </div>
                  </TableCell>
                  <TableCell>
                    {sub.disabled ? (
                      <Badge className="bg-red-500/10 text-red-400 border-red-500/20">Suspended</Badge>
                    ) : (
                      <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Active</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {sub.teamShareCount > 0 ? (
                      <Badge className="bg-muted text-foreground">{sub.teamShareCount} teams</Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedSubdomain(sub)
                          setNewOwnerEmail("")
                          setNewOwnerId("")
                          setFoundUser(null)
                        }}
                        className="text-orange-400 hover:text-orange-300 hover:bg-blue-500/10 px-2"
                        title="Reassign owner"
                      >
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                      {sub.disabled ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={lifecycleBusy}
                          onClick={() => handleUnsuspend(sub)}
                          className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 px-2"
                          title="Re-enable tenant"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setSuspendTarget(sub); setSuspendReason(""); setSuspendUnassign(false) }}
                          className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 px-2"
                          title="Suspend (soft-disable)"
                        >
                          <Shield className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { setDeleteTarget(sub); setDeleteConfirm("") }}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10 px-2"
                        title="Hard delete (destructive)"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Reassign Dialog */}
      <Dialog open={!!selectedSubdomain} onOpenChange={() => setSelectedSubdomain(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Subdomain Ownership</DialogTitle>
            <DialogDescription>
              Transfer <strong>{selectedSubdomain?.subdomain}</strong> to a different user
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedSubdomain?.owner && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <Label className="text-xs text-muted-foreground">Current Owner</Label>
                <div className="font-medium">
                  {selectedSubdomain.owner.displayName || selectedSubdomain.owner.email}
                </div>
                {selectedSubdomain.owner.displayName && (
                  <div className="text-sm text-muted-foreground">{selectedSubdomain.owner.email}</div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="newOwnerEmail">New Owner Email</Label>
              <div className="flex gap-2">
                <Input
                  id="newOwnerEmail"
                  type="email"
                  placeholder="user@example.com"
                  value={newOwnerEmail}
                  onChange={(e) => {
                    setNewOwnerEmail(e.target.value)
                    setFoundUser(null)
                    setNewOwnerId("")
                  }}
                />
                <Button
                  variant="outline"
                  onClick={searchUserByEmail}
                  disabled={searchingUser || !newOwnerEmail}
                >
                  {searchingUser ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {foundUser && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">User Found</span>
                </div>
                <div className="mt-1 text-sm">
                  {foundUser.displayName || foundUser.email}
                  {foundUser.displayName && (
                    <span className="text-muted-foreground"> ({foundUser.email})</span>
                  )}
                </div>
              </div>
            )}

            {newOwnerEmail && !foundUser && !searchingUser && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm text-yellow-800">Click search to find the user</span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="flex gap-2">
            {selectedSubdomain?.owner && (
              <Button
                variant="outline"
                onClick={handleRemoveOwner}
                disabled={reassigning}
                className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 mr-auto"
              >
                Remove Owner
              </Button>
            )}
            <Button variant="outline" onClick={() => setSelectedSubdomain(null)}>
              Cancel
            </Button>
            <Button onClick={handleReassign} disabled={reassigning || !foundUser}>
              {reassigning ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ArrowRight className="h-4 w-4 mr-2" />}
              Assign to User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Subdomain Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Subdomain</DialogTitle>
            <DialogDescription>
              Create a new subdomain and optionally assign it to a user
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newSubdomain">Subdomain *</Label>
              <div className="flex gap-2 items-center">
                <Input
                  id="newSubdomain"
                  placeholder="my-site"
                  value={newSubdomain}
                  onChange={(e) => setNewSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                  className="flex-1"
                />
                <span className="text-sm text-muted-foreground">.{rootDomain}</span>
              </div>
              <p className="text-xs text-muted-foreground">Lowercase letters, numbers, and hyphens only</p>
            </div>

            <div className="space-y-2">
              <div className="space-y-2">
                <Label htmlFor="newSiteName">Site Name</Label>
                <Input
                  id="newSiteName"
                  value={newSiteName}
                  onChange={(e) => setNewSiteName(e.target.value)}
                  placeholder={newSubdomain || "My Site"}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="assignOwnerEmail">Assign to User (optional)</Label>
              <div className="flex gap-2">
                <Input
                  id="assignOwnerEmail"
                  type="email"
                  placeholder="user@example.com"
                  value={assignOwnerEmail}
                  onChange={(e) => {
                    setAssignOwnerEmail(e.target.value)
                    setAssignFoundUser(null)
                    setAssignOwnerId("")
                  }}
                />
                <Button
                  variant="outline"
                  onClick={searchAssignUserByEmail}
                  disabled={searchingAssignUser || !assignOwnerEmail}
                >
                  {searchingAssignUser ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {assignFoundUser && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">User Found</span>
                </div>
                <div className="mt-1 text-sm">
                  {assignFoundUser.displayName || assignFoundUser.email}
                  {assignFoundUser.displayName && (
                    <span className="text-muted-foreground"> ({assignFoundUser.email})</span>
                  )}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateSubdomain} disabled={creating || !newSubdomain}>
              {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Globe className="h-4 w-4 mr-2" />}
              Create Subdomain
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend (soft-disable) Dialog */}
      <Dialog open={!!suspendTarget} onOpenChange={() => { setSuspendTarget(null); setSuspendReason(""); setSuspendUnassign(false) }}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <Shield className="h-5 w-5 text-amber-400" />
              Suspend Tenant
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Soft-disable <strong>{suspendTarget?.subdomain}</strong>. This is reversible — it sets
              the tenant to maintenance mode and marks it disabled. You can re-enable anytime.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-muted-foreground text-sm">Reason (optional)</Label>
              <textarea
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                rows={3}
                className="w-full mt-1.5 bg-card border border-border text-foreground text-sm rounded-lg px-3 py-2 focus:border-blue-500/50 outline-none resize-none placeholder:text-muted-foreground"
                placeholder="Why is this tenant being suspended?"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input type="checkbox" checked={suspendUnassign} onChange={(e) => setSuspendUnassign(e.target.checked)} />
              Also unassign the owner
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setSuspendTarget(null); setSuspendReason("") }} className="bg-transparent border-border text-foreground">
              Cancel
            </Button>
            <Button onClick={handleSuspend} disabled={lifecycleBusy} className="bg-amber-600 hover:bg-amber-500 text-white">
              {lifecycleBusy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Shield className="h-4 w-4 mr-2" />}
              Suspend Tenant
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hard-delete Dialog — gated, type-the-name to confirm */}
      <Dialog open={!!deleteTarget} onOpenChange={() => { setDeleteTarget(null); setDeleteConfirm("") }}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-400" />
              Hard-Delete Tenant
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Permanently delete <strong>{deleteTarget?.subdomain}</strong> and cascade its CMS data.
              This is irreversible. Prefer Suspend unless you are certain.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-300">
              This deletes the subdomain row and all tenant-scoped content (FK cascade). It cannot be undone.
            </div>
            <div>
              <Label className="text-muted-foreground text-sm">
                Type <span className="text-red-400 font-mono">{deleteTarget?.subdomain}</span> to confirm
              </Label>
              <Input
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                className="mt-1.5 bg-card border-border text-foreground placeholder:text-muted-foreground focus:border-red-500/50 font-mono"
                placeholder="Type subdomain to confirm…"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDeleteTarget(null); setDeleteConfirm("") }} className="bg-transparent border-border text-foreground">
              Cancel
            </Button>
            <Button
              onClick={handleHardDelete}
              disabled={lifecycleBusy || deleteConfirm !== deleteTarget?.subdomain}
              className="bg-red-600 hover:bg-red-500 text-white disabled:opacity-50"
            >
              {lifecycleBusy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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

type PlatformUser = {
  id: string
  email: string
  displayName: string | null
  profileImageUrl: string | null
  createdAt: string | null
  lastActiveAt: string | null
  isAdmin: boolean
  isSuperAdmin: boolean
  subdomainCount: number
  status: "active" | "suspended" | "deactivated"
  suspendedAt: string | null
  suspensionReason: string | null
  deletedAt: string | null
  adminNotes: string | null
  tierOverride: string | null
  tierName: string | null
  creditBalance: number
}

type UserDetailData = {
  user: PlatformUser & {
    suspendedBy: string | null
    deletedBy: string | null
    superAdminPermissions: string[] | null
  }
  subdomains: Array<{ subdomain: string; createdAt: string }>
  teams: Array<{ id: string; name: string; slug: string; role: string }>
  recentActivity: Array<{ id: string; action: string; details: Record<string, unknown>; createdAt: string }>
}

type PlatformInvite = {
  id: string
  email: string
  name: string | null
  invitedBy: string
  invitedByEmail: string | null
  tier: string
  message: string | null
  token: string
  status: "pending" | "accepted" | "expired" | "revoked"
  acceptedAt: string | null
  expiresAt: string
  createdAt: string
  inviteLink: string
}

type UserStatusFilter = "all" | "active" | "suspended" | "deactivated"
type UserRoleFilter = "all" | "user" | "admin" | "super_admin"
type UserSortField = "name" | "email" | "createdAt" | "lastLogin"

function UsersSection() {
  // === User list state ===
  const [users, setUsers] = useState<PlatformUser[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [statusFilter, setStatusFilter] = useState<UserStatusFilter>("all")
  const [roleFilter, setRoleFilter] = useState<UserRoleFilter>("all")
  const [sortBy, setSortBy] = useState<UserSortField>("createdAt")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({})
  const [actionLoading, setActionLoading] = useState(false)

  // === Selected users for bulk actions ===
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set())
  const [bulkActionLoading, setBulkActionLoading] = useState(false)

  // === User detail panel ===
  const [selectedUser, setSelectedUser] = useState<PlatformUser | null>(null)
  const [userDetails, setUserDetails] = useState<UserDetailData | null>(null)
  const [detailTab, setDetailTab] = useState<"profile" | "subdomains" | "activity" | "notes">("profile")

  // === Suspend dialog ===
  const [suspendUser, setSuspendUser] = useState<PlatformUser | null>(null)
  const [suspendReason, setSuspendReason] = useState("")

  // === Delete dialog ===
  const [deleteUser, setDeleteUser] = useState<PlatformUser | null>(null)
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState("")
  const [deleteReason, setDeleteReason] = useState("")

  // === Admin notes ===
  const [editingNotes, setEditingNotes] = useState(false)
  const [notesText, setNotesText] = useState("")
  const [savingNotes, setSavingNotes] = useState(false)

  // === Invite dialog ===
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteName, setInviteName] = useState("")
  const [inviteTier, setInviteTier] = useState("starter")
  const [inviteMessage, setInviteMessage] = useState("")
  const [inviting, setInviting] = useState(false)

  // === Invites list ===
  const [showInvites, setShowInvites] = useState(false)
  const [invites, setInvites] = useState<PlatformInvite[]>([])
  const [invitesLoading, setInvitesLoading] = useState(false)
  const [inviteStatusCounts, setInviteStatusCounts] = useState<Record<string, number>>({})
  const [copiedInviteId, setCopiedInviteId] = useState<string | null>(null)

  // === Fetch users ===
  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        ...(search && { search }),
        status: statusFilter,
        role: roleFilter,
        sortBy,
        sortOrder,
      })
      const res = await fetch(`/api/super-admin/users?${params}`)
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users)
        setTotalPages(data.totalPages)
        setTotal(data.total)
        if (data.statusCounts) setStatusCounts(data.statusCounts)
      }
    } catch (error) {
      console.error("Failed to fetch users:", error)
    } finally {
      setLoading(false)
    }
  }, [page, search, statusFilter, roleFilter, sortBy, sortOrder])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  // === Fetch user details ===
  const fetchUserDetails = async (userId: string) => {
    try {
      const res = await fetch(`/api/super-admin/users/${userId}`)
      if (res.ok) {
        const data = await res.json()
        setUserDetails(data)
        setNotesText(data.user?.adminNotes || "")
      }
    } catch (error) {
      console.error("Failed to fetch user details:", error)
    }
  }

  const handleViewUser = (user: PlatformUser) => {
    setSelectedUser(user)
    setUserDetails(null)
    setDetailTab("profile")
    setEditingNotes(false)
    fetchUserDetails(user.id)
  }

  // === Fetch invites ===
  const fetchInvites = useCallback(async () => {
    setInvitesLoading(true)
    try {
      const res = await fetch("/api/super-admin/users/invites")
      if (res.ok) {
        const data = await res.json()
        setInvites(data.invites)
        if (data.statusCounts) setInviteStatusCounts(data.statusCounts)
      }
    } catch (error) {
      console.error("Failed to fetch invites:", error)
    } finally {
      setInvitesLoading(false)
    }
  }, [])

  // === User actions ===
  const handleToggleAdmin = async (user: PlatformUser, makeAdmin: boolean) => {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/super-admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAdmin: makeAdmin }),
      })
      if (res.ok) fetchUsers()
    } catch (error) {
      console.error("Failed to update user:", error)
    } finally {
      setActionLoading(false)
    }
  }

  const handleToggleSuperAdmin = async (user: PlatformUser, makeSuperAdmin: boolean) => {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/super-admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isSuperAdmin: makeSuperAdmin }),
      })
      if (res.ok) fetchUsers()
    } catch (error) {
      console.error("Failed to update user:", error)
    } finally {
      setActionLoading(false)
    }
  }

  const handleSuspend = async () => {
    if (!suspendUser) return
    setActionLoading(true)
    try {
      const res = await fetch(`/api/super-admin/users/${suspendUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "suspend", reason: suspendReason }),
      })
      if (res.ok) {
        setSuspendUser(null)
        setSuspendReason("")
        setSelectedUser(null)
        fetchUsers()
      }
    } catch (error) {
      console.error("Failed to suspend user:", error)
    } finally {
      setActionLoading(false)
    }
  }

  const handleUnsuspend = async (user: PlatformUser) => {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/super-admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "unsuspend" }),
      })
      if (res.ok) {
        setSelectedUser(null)
        fetchUsers()
      }
    } catch (error) {
      console.error("Failed to unsuspend user:", error)
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteUser || deleteConfirmEmail !== deleteUser.email) return
    setActionLoading(true)
    try {
      const res = await fetch(`/api/super-admin/users/${deleteUser.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: true, reason: deleteReason }),
      })
      if (res.ok) {
        setDeleteUser(null)
        setDeleteConfirmEmail("")
        setDeleteReason("")
        setSelectedUser(null)
        fetchUsers()
      }
    } catch (error) {
      console.error("Failed to delete user:", error)
    } finally {
      setActionLoading(false)
    }
  }

  const handleSaveNotes = async () => {
    if (!selectedUser) return
    setSavingNotes(true)
    try {
      const res = await fetch(`/api/super-admin/users/${selectedUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminNotes: notesText }),
      })
      if (res.ok) {
        setEditingNotes(false)
        fetchUserDetails(selectedUser.id)
      }
    } catch (error) {
      console.error("Failed to save notes:", error)
    } finally {
      setSavingNotes(false)
    }
  }

  const handleInvite = async () => {
    if (!inviteEmail) return
    setInviting(true)
    try {
      const res = await fetch("/api/super-admin/users/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteEmail,
          name: inviteName || undefined,
          tier: inviteTier,
          message: inviteMessage || undefined,
        }),
      })
      if (res.ok) {
        setShowInviteDialog(false)
        setInviteEmail("")
        setInviteName("")
        setInviteTier("starter")
        setInviteMessage("")
        if (showInvites) fetchInvites()
      } else {
        const data = await res.json()
        alert(data.error || "Failed to send invite")
      }
    } catch (error) {
      console.error("Failed to send invite:", error)
    } finally {
      setInviting(false)
    }
  }

  const handleRevokeInvite = async (inviteId: string) => {
    try {
      const res = await fetch("/api/super-admin/users/invites", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteId }),
      })
      if (res.ok) fetchInvites()
    } catch (error) {
      console.error("Failed to revoke invite:", error)
    }
  }

  const handleResendInvite = async (inviteId: string) => {
    try {
      const res = await fetch("/api/super-admin/users/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteId }),
      })
      if (res.ok) fetchInvites()
    } catch (error) {
      console.error("Failed to resend invite:", error)
    }
  }

  const handleCopyInviteLink = (inviteLink: string, inviteId: string) => {
    navigator.clipboard.writeText(inviteLink)
    setCopiedInviteId(inviteId)
    setTimeout(() => setCopiedInviteId(null), 2000)
  }

  // === Bulk actions ===
  const toggleSelectUser = (userId: string) => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev)
      if (next.has(userId)) next.delete(userId)
      else next.add(userId)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedUserIds.size === users.length) {
      setSelectedUserIds(new Set())
    } else {
      setSelectedUserIds(new Set(users.map((u) => u.id)))
    }
  }

  const handleBulkSuspend = async () => {
    if (selectedUserIds.size === 0) return
    setBulkActionLoading(true)
    try {
      const promises = Array.from(selectedUserIds).map((userId) =>
        fetch(`/api/super-admin/users/${userId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "suspend", reason: "Bulk suspension by admin" }),
        })
      )
      await Promise.allSettled(promises)
      setSelectedUserIds(new Set())
      fetchUsers()
    } catch (error) {
      console.error("Bulk suspend failed:", error)
    } finally {
      setBulkActionLoading(false)
    }
  }

  // === Sorting ===
  const handleSort = (field: UserSortField) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
    } else {
      setSortBy(field)
      setSortOrder("desc")
    }
    setPage(1)
  }

  const SortIndicator = ({ field }: { field: UserSortField }) => {
    if (sortBy !== field) return null
    return <span className="ml-1 text-orange-400">{sortOrder === "asc" ? "\u2191" : "\u2193"}</span>
  }

  // === Status badge ===
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Active</Badge>
      case "suspended":
        return <Badge className="bg-red-500/10 text-red-400 border-red-500/20">Suspended</Badge>
      case "deactivated":
        return <Badge className="bg-slate-500/10 text-muted-foreground border-slate-500/20">Deactivated</Badge>
      default:
        return <Badge className="bg-muted text-foreground">{status}</Badge>
    }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-"
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return "-"
    return new Date(dateStr).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-foreground">User Management</h2>
          <p className="text-sm text-muted-foreground">{total} total users</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => { setShowInvites(!showInvites); if (!showInvites) fetchInvites() }}
            variant="outline"
            size="sm"
            className={`bg-transparent border-border text-foreground hover:text-foreground hover:bg-muted ${showInvites ? "border-orange-500/30 text-orange-400" : ""}`}
          >
            <Mail className="h-4 w-4 mr-2" />
            Invites {(inviteStatusCounts.pending || 0) > 0 && <Badge className="ml-1 bg-orange-500/20 text-orange-400 text-[10px] px-1.5">{inviteStatusCounts.pending}</Badge>}
          </Button>
          <Button
            onClick={() => setShowInviteDialog(true)}
            size="sm"
            className="bg-gradient-to-r from-blue-700 to-orange-500 hover:from-blue-600 hover:to-orange-400 text-white border-0"
          >
            <Plus className="h-4 w-4 mr-2" />
            Invite User
          </Button>
          <Button onClick={fetchUsers} variant="outline" size="sm" className="bg-transparent border-border text-foreground hover:text-foreground hover:bg-muted">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Invites Panel */}
      {showInvites && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-foreground text-base flex items-center gap-2">
                <Mail className="h-4 w-4 text-orange-400" />
                Pending Invitations
              </CardTitle>
              <Button onClick={fetchInvites} variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                <RefreshCw className="h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {invitesLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-orange-400" />
              </div>
            ) : invites.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No invites sent yet</p>
            ) : (
              <div className="space-y-2">
                {invites.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-foreground truncate">
                          {inv.name || inv.email}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">{inv.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge className={
                        inv.status === "pending" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                        inv.status === "accepted" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                        inv.status === "expired" ? "bg-slate-500/10 text-muted-foreground border-slate-500/20" :
                        "bg-red-500/10 text-red-400 border-red-500/20"
                      }>
                        {inv.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{formatDate(inv.createdAt)}</span>
                      {inv.status === "pending" && (
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyInviteLink(inv.inviteLink, inv.id)}
                            className="h-7 px-2 text-muted-foreground hover:text-foreground"
                            title="Copy invite link"
                          >
                            {copiedInviteId === inv.id ? (
                              <span className="text-emerald-400 text-xs">Copied</span>
                            ) : (
                              <span className="text-xs">Copy Link</span>
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleResendInvite(inv.id)}
                            className="h-7 px-2 text-muted-foreground hover:text-foreground"
                            title="Resend invite"
                          >
                            <RefreshCw className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRevokeInvite(inv.id)}
                            className="h-7 px-2 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            title="Revoke invite"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                      {inv.status === "expired" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleResendInvite(inv.id)}
                          className="h-7 px-2 text-orange-400 hover:text-orange-300"
                          title="Resend invite"
                        >
                          <RefreshCw className="h-3 w-3 mr-1" />
                          <span className="text-xs">Resend</span>
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1 w-fit">
        {([
          { key: "all" as UserStatusFilter, label: "All" },
          { key: "active" as UserStatusFilter, label: "Active" },
          { key: "suspended" as UserStatusFilter, label: "Suspended" },
          { key: "deactivated" as UserStatusFilter, label: "Deactivated" },
        ]).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => { setStatusFilter(key); setPage(1) }}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              statusFilter === key
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            {label}
            {statusCounts[key] !== undefined && (
              <span className="ml-1.5 text-xs text-muted-foreground">({statusCounts[key]})</span>
            )}
          </button>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by email or name..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="pl-10 bg-card border-border text-foreground placeholder:text-muted-foreground focus:border-blue-500/50"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value as UserRoleFilter); setPage(1) }}
          className="bg-card border border-border text-foreground text-sm rounded-lg px-3 py-2 focus:border-blue-500/50 outline-none"
        >
          <option value="all">All Roles</option>
          <option value="user">Users</option>
          <option value="admin">Admins</option>
          <option value="super_admin">Super Admins</option>
        </select>
      </div>

      {/* Bulk Actions Bar */}
      {selectedUserIds.size > 0 && (
        <div className="flex items-center gap-3 bg-blue-500/10 border border-blue-500/20 rounded-lg px-4 py-3">
          <span className="text-sm text-blue-400 font-medium">{selectedUserIds.size} selected</span>
          <div className="flex gap-2 ml-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkSuspend}
              disabled={bulkActionLoading}
              className="bg-transparent border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
            >
              {bulkActionLoading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
              Suspend Selected
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedUserIds(new Set())}
              className="bg-transparent border-border text-foreground hover:text-foreground"
            >
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* Users Table */}
      <Card className="bg-card border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="w-10">
                <input
                  type="checkbox"
                  checked={users.length > 0 && selectedUserIds.size === users.length}
                  onChange={toggleSelectAll}
                  className="rounded border-border bg-card text-blue-500 focus:ring-blue-500/20"
                />
              </TableHead>
              <TableHead className="text-muted-foreground">
                <button onClick={() => handleSort("name")} className="flex items-center hover:text-foreground transition-colors">
                  User<SortIndicator field="name" />
                </button>
              </TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
              <TableHead className="text-muted-foreground">
                <button onClick={() => handleSort("email")} className="flex items-center hover:text-foreground transition-colors">
                  Tier<SortIndicator field="email" />
                </button>
              </TableHead>
              <TableHead className="text-muted-foreground">Sites</TableHead>
              <TableHead className="text-muted-foreground">
                <button onClick={() => handleSort("lastLogin")} className="flex items-center hover:text-foreground transition-colors">
                  Last Active<SortIndicator field="lastLogin" />
                </button>
              </TableHead>
              <TableHead className="text-muted-foreground">
                <button onClick={() => handleSort("createdAt")} className="flex items-center hover:text-foreground transition-colors">
                  Joined<SortIndicator field="createdAt" />
                </button>
              </TableHead>
              <TableHead className="text-muted-foreground">Role</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow className="border-border">
                <TableCell colSpan={9} className="text-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-orange-400" />
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow className="border-border">
                <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                  <Users className="h-12 w-12 text-foreground mx-auto mb-4" />
                  <p>No users found</p>
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id} className={`border-border hover:bg-muted ${user.status === "suspended" ? "opacity-70" : ""}`}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedUserIds.has(user.id)}
                      onChange={() => toggleSelectUser(user.id)}
                      className="rounded border-border bg-card text-blue-500 focus:ring-blue-500/20"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {user.profileImageUrl ? (
                        <img src={user.profileImageUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
                      ) : (
                        <div className="h-8 w-8 bg-muted rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="font-medium text-foreground truncate">{user.displayName || user.email}</div>
                        <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(user.status)}</TableCell>
                  <TableCell className="text-sm text-foreground">
                    {user.tierName || <span className="text-muted-foreground">-</span>}
                  </TableCell>
                  <TableCell className="text-foreground">{user.subdomainCount}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {user.lastActiveAt ? formatDate(user.lastActiveAt) : <span className="text-muted-foreground">Never</span>}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(user.createdAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {user.isSuperAdmin && (
                        <Badge className="bg-blue-500/20 text-orange-400 border-blue-500/30 hover:bg-blue-500/30">
                          <Crown className="h-3 w-3 mr-1" />
                          Super
                        </Badge>
                      )}
                      {user.isAdmin && !user.isSuperAdmin && (
                        <Badge className="bg-muted text-foreground">Admin</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => handleViewUser(user)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {user.isAdmin ? (
                          <DropdownMenuItem onClick={() => handleToggleAdmin(user, false)} disabled={actionLoading}>
                            Remove Admin
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => handleToggleAdmin(user, true)} disabled={actionLoading}>
                            Make Admin
                          </DropdownMenuItem>
                        )}
                        {user.isSuperAdmin ? (
                          <DropdownMenuItem onClick={() => handleToggleSuperAdmin(user, false)} disabled={actionLoading} className="text-red-600">
                            Remove Super Admin
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => handleToggleSuperAdmin(user, true)} disabled={actionLoading}>
                            <Crown className="h-4 w-4 mr-2" />
                            Make Super Admin
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        {user.status === "suspended" ? (
                          <DropdownMenuItem onClick={() => handleUnsuspend(user)} disabled={actionLoading}>
                            <Shield className="h-4 w-4 mr-2" />
                            Unsuspend
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => setSuspendUser(user)} className="text-amber-500">
                            <Shield className="h-4 w-4 mr-2" />
                            Suspend
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => setDeleteUser(user)} className="text-red-500">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages} ({total} users)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="bg-transparent border-border text-foreground hover:text-foreground hover:bg-muted"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="bg-transparent border-border text-foreground hover:text-foreground hover:bg-muted"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ===== User Detail Dialog ===== */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-3">
              {selectedUser?.profileImageUrl ? (
                <img src={selectedUser.profileImageUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
              ) : (
                <div className="h-10 w-10 bg-muted rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
              <div>
                <div>{selectedUser?.displayName || selectedUser?.email}</div>
                <div className="text-sm font-normal text-muted-foreground">{selectedUser?.email}</div>
              </div>
            </DialogTitle>
            <DialogDescription className="sr-only">User detail view</DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-4">
              {/* Detail Tabs */}
              <div className="flex gap-1 bg-card rounded-lg p-1 border border-border">
                {([
                  { key: "profile" as const, label: "Profile", icon: User },
                  { key: "subdomains" as const, label: "Subdomains", icon: Globe },
                  { key: "activity" as const, label: "Activity", icon: Activity },
                  { key: "notes" as const, label: "Notes", icon: Pencil },
                ]).map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setDetailTab(key)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      detailTab === key
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </button>
                ))}
              </div>

              {!userDetails ? (
                <div className="py-12 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-orange-400" />
                </div>
              ) : (
                <>
                  {/* Profile Tab */}
                  {detailTab === "profile" && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-card rounded-lg p-3 border border-border">
                          <Label className="text-muted-foreground text-xs">Display Name</Label>
                          <p className="font-medium text-foreground mt-1">{userDetails.user.displayName || "Not set"}</p>
                        </div>
                        <div className="bg-card rounded-lg p-3 border border-border">
                          <Label className="text-muted-foreground text-xs">User ID</Label>
                          <p className="font-mono text-xs text-foreground mt-1 break-all">{userDetails.user.id}</p>
                        </div>
                        <div className="bg-card rounded-lg p-3 border border-border">
                          <Label className="text-muted-foreground text-xs">Status</Label>
                          <div className="mt-1">{getStatusBadge(userDetails.user.status)}</div>
                          {userDetails.user.suspendedAt && (
                            <p className="text-xs text-red-400 mt-1">
                              Suspended {formatDate(userDetails.user.suspendedAt)}
                              {userDetails.user.suspensionReason && ` - ${userDetails.user.suspensionReason}`}
                            </p>
                          )}
                        </div>
                        <div className="bg-card rounded-lg p-3 border border-border">
                          <Label className="text-muted-foreground text-xs">Tier</Label>
                          <p className="font-medium text-foreground mt-1">{userDetails.user.tierName || "No tier"}</p>
                        </div>
                        <div className="bg-card rounded-lg p-3 border border-border">
                          <Label className="text-muted-foreground text-xs">Joined</Label>
                          <p className="text-foreground mt-1">{formatDateTime(userDetails.user.createdAt)}</p>
                        </div>
                        <div className="bg-card rounded-lg p-3 border border-border">
                          <Label className="text-muted-foreground text-xs">Last Active</Label>
                          <p className="text-foreground mt-1">{formatDateTime(userDetails.user.lastActiveAt)}</p>
                        </div>
                        <div className="bg-card rounded-lg p-3 border border-border">
                          <Label className="text-muted-foreground text-xs">AI Credits</Label>
                          <p className="font-medium text-blue-400 mt-1">{userDetails.user.creditBalance.toLocaleString()}</p>
                        </div>
                        <div className="bg-card rounded-lg p-3 border border-border">
                          <Label className="text-muted-foreground text-xs">Subdomains</Label>
                          <p className="font-medium text-foreground mt-1">{userDetails.subdomains.length}</p>
                        </div>
                      </div>

                      {/* Teams */}
                      {userDetails.teams.length > 0 && (
                        <div>
                          <Label className="text-muted-foreground text-xs mb-2 block">Teams ({userDetails.teams.length})</Label>
                          <div className="space-y-1.5">
                            {userDetails.teams.map((t) => (
                              <div key={t.id} className="flex items-center justify-between p-2 bg-card rounded-lg border border-border">
                                <div className="flex items-center gap-2">
                                  <Building2 className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm text-foreground">{t.name}</span>
                                </div>
                                <Badge className="bg-muted text-foreground text-xs">{t.role}</Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                        {selectedUser.status === "suspended" ? (
                          <Button
                            size="sm"
                            onClick={() => handleUnsuspend(selectedUser)}
                            disabled={actionLoading}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white"
                          >
                            <Shield className="h-4 w-4 mr-1" />
                            Unsuspend
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSuspendUser(selectedUser)}
                            className="bg-transparent border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                          >
                            <Shield className="h-4 w-4 mr-1" />
                            Suspend
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setDeleteUser(selectedUser)}
                          className="bg-transparent border-red-500/30 text-red-400 hover:bg-red-500/10"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete User
                        </Button>
                        <a
                          href={`${protocol}://${rootDomain}/dashboard`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-transparent border border-border text-foreground hover:text-foreground hover:bg-muted text-sm"
                        >
                          <Eye className="h-4 w-4" />
                          View as User
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Subdomains Tab */}
                  {detailTab === "subdomains" && (
                    <div>
                      <Label className="text-muted-foreground text-xs mb-3 block">
                        Subdomains ({userDetails.subdomains.length})
                      </Label>
                      {userDetails.subdomains.length > 0 ? (
                        <div className="space-y-2">
                          {userDetails.subdomains.map((s) => (
                            <div key={s.subdomain} className="flex items-center justify-between p-3 bg-card rounded-lg border border-border">
                              <div className="flex items-center gap-3">
                                <Globe className="h-4 w-4 text-emerald-400" />
                                <div>
                                  <span className="font-medium text-foreground">{s.subdomain}</span>
                                  <div className="text-xs text-muted-foreground">Created {formatDate(s.createdAt)}</div>
                                </div>
                              </div>
                              <a
                                href={`${protocol}://${s.subdomain}.${rootDomain}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-orange-400 text-sm hover:text-orange-300 flex items-center gap-1"
                              >
                                Visit <ArrowRight className="h-3 w-3" />
                              </a>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-sm text-center py-6">No subdomains</p>
                      )}
                    </div>
                  )}

                  {/* Activity Tab */}
                  {detailTab === "activity" && (
                    <div>
                      <Label className="text-muted-foreground text-xs mb-3 block">Recent Activity</Label>
                      {userDetails.recentActivity.length > 0 ? (
                        <div className="space-y-2">
                          {userDetails.recentActivity.map((act) => (
                            <div key={act.id} className="flex items-start gap-3 p-3 bg-card rounded-lg border border-border">
                              <Activity className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                              <div className="min-w-0">
                                <div className="text-sm text-foreground">{act.action.replace(/\./g, " ").replace(/^./, (c) => c.toUpperCase())}</div>
                                <div className="text-xs text-muted-foreground">{formatDateTime(act.createdAt)}</div>
                                {Object.keys(act.details).length > 0 && (
                                  <div className="text-xs text-muted-foreground mt-1 bg-muted/50 rounded p-2 font-mono break-all">
                                    {JSON.stringify(act.details, null, 0)}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-sm text-center py-6">No recent activity</p>
                      )}
                    </div>
                  )}

                  {/* Notes Tab */}
                  {detailTab === "notes" && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <Label className="text-muted-foreground text-xs">Admin Notes</Label>
                        {!editingNotes && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => { setEditingNotes(true); setNotesText(userDetails.user.adminNotes || "") }}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <Pencil className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                        )}
                      </div>
                      {editingNotes ? (
                        <div className="space-y-3">
                          <textarea
                            value={notesText}
                            onChange={(e) => setNotesText(e.target.value)}
                            rows={6}
                            className="w-full bg-card border border-border text-foreground text-sm rounded-lg px-3 py-2 focus:border-blue-500/50 outline-none resize-none placeholder:text-muted-foreground"
                            placeholder="Add admin notes about this user..."
                          />
                          <div className="flex gap-2 justify-end">
                            <Button variant="outline" size="sm" onClick={() => setEditingNotes(false)} className="bg-transparent border-border text-foreground">
                              Cancel
                            </Button>
                            <Button size="sm" onClick={handleSaveNotes} disabled={savingNotes} className="bg-blue-600 hover:bg-blue-500 text-white">
                              {savingNotes ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                              Save Notes
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-card rounded-lg p-4 border border-border min-h-[120px]">
                          {userDetails.user.adminNotes ? (
                            <p className="text-sm text-foreground whitespace-pre-wrap">{userDetails.user.adminNotes}</p>
                          ) : (
                            <p className="text-sm text-muted-foreground italic">No admin notes</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ===== Suspend Dialog ===== */}
      <Dialog open={!!suspendUser} onOpenChange={() => { setSuspendUser(null); setSuspendReason("") }}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <Shield className="h-5 w-5 text-amber-400" />
              Suspend User
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              This will prevent {suspendUser?.email} from logging in and using the platform.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
              <p className="text-sm text-amber-300">
                The user will be notified via email about the suspension.
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground text-sm">Reason for suspension</Label>
              <textarea
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                rows={3}
                className="w-full mt-1.5 bg-card border border-border text-foreground text-sm rounded-lg px-3 py-2 focus:border-blue-500/50 outline-none resize-none placeholder:text-muted-foreground"
                placeholder="Reason for suspending this user..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setSuspendUser(null); setSuspendReason("") }} className="bg-transparent border-border text-foreground">
              Cancel
            </Button>
            <Button onClick={handleSuspend} disabled={actionLoading} className="bg-amber-600 hover:bg-amber-500 text-white">
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Shield className="h-4 w-4 mr-2" />}
              Suspend User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== Delete Dialog ===== */}
      <Dialog open={!!deleteUser} onOpenChange={() => { setDeleteUser(null); setDeleteConfirmEmail(""); setDeleteReason("") }}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-400" />
              Delete User
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              This action will schedule {deleteUser?.email} for deletion.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 space-y-2">
              <p className="text-sm text-red-300 font-medium">Warning: This action is destructive</p>
              <ul className="text-sm text-red-300/80 list-disc list-inside space-y-1">
                <li>The user account will be suspended immediately</li>
                <li>Data will be permanently deleted after 30 days</li>
                <li>User&apos;s subdomains will be unassigned</li>
                <li>Team memberships will be removed</li>
                <li>The user will be notified via email</li>
              </ul>
            </div>

            {deleteUser && deleteUser.subdomainCount > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                <p className="text-sm text-amber-300">
                  This user has {deleteUser.subdomainCount} subdomain(s) that will be unassigned.
                </p>
              </div>
            )}

            <div>
              <Label className="text-muted-foreground text-sm">Reason for deletion (optional)</Label>
              <textarea
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                rows={2}
                className="w-full mt-1.5 bg-card border border-border text-foreground text-sm rounded-lg px-3 py-2 focus:border-blue-500/50 outline-none resize-none placeholder:text-muted-foreground"
                placeholder="Reason for deletion..."
              />
            </div>

            <div>
              <Label className="text-muted-foreground text-sm">
                Type <span className="text-red-400 font-mono">{deleteUser?.email}</span> to confirm
              </Label>
              <Input
                value={deleteConfirmEmail}
                onChange={(e) => setDeleteConfirmEmail(e.target.value)}
                className="mt-1.5 bg-card border-border text-foreground placeholder:text-muted-foreground focus:border-red-500/50"
                placeholder="Type email to confirm..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDeleteUser(null); setDeleteConfirmEmail(""); setDeleteReason("") }} className="bg-transparent border-border text-foreground">
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={actionLoading || deleteConfirmEmail !== deleteUser?.email}
              className="bg-red-600 hover:bg-red-500 text-white disabled:opacity-50"
            >
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== Invite Dialog ===== */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <Mail className="h-5 w-5 text-blue-400" />
              Invite New User
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Send an invitation email to join the platform.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-muted-foreground text-sm">Email *</Label>
              <Input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="mt-1.5 bg-card border-border text-foreground placeholder:text-muted-foreground focus:border-blue-500/50"
                placeholder="user@example.com"
              />
            </div>
            <div>
              <Label className="text-muted-foreground text-sm">Name (optional)</Label>
              <Input
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                className="mt-1.5 bg-card border-border text-foreground placeholder:text-muted-foreground focus:border-blue-500/50"
                placeholder="John Doe"
              />
            </div>
            <div>
              <Label className="text-muted-foreground text-sm">Tier</Label>
              <select
                value={inviteTier}
                onChange={(e) => setInviteTier(e.target.value)}
                className="w-full mt-1.5 bg-card border border-border text-foreground text-sm rounded-lg px-3 py-2 focus:border-blue-500/50 outline-none"
              >
                <option value="starter">Starter</option>
                <option value="professional">Professional</option>
                <option value="business">Business</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
            <div>
              <Label className="text-muted-foreground text-sm">Personal message (optional)</Label>
              <textarea
                value={inviteMessage}
                onChange={(e) => setInviteMessage(e.target.value)}
                rows={3}
                className="w-full mt-1.5 bg-card border border-border text-foreground text-sm rounded-lg px-3 py-2 focus:border-blue-500/50 outline-none resize-none placeholder:text-muted-foreground"
                placeholder="Hi! I'd like to invite you to try out our platform..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInviteDialog(false)} className="bg-transparent border-border text-foreground">
              Cancel
            </Button>
            <Button onClick={handleInvite} disabled={inviting || !inviteEmail} className="bg-gradient-to-r from-blue-700 to-orange-500 hover:from-blue-600 hover:to-orange-400 text-white border-0">
              {inviting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Mail className="h-4 w-4 mr-2" />}
              Send Invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

type PlatformTeam = {
  id: string
  name: string
  slug: string
  description: string | null
  ownerId: string
  memberCount: number
  createdAt: string
}

function TeamsSection() {
  const [teams, setTeams] = useState<PlatformTeam[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  // Create/Edit dialog state
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState<PlatformTeam | null>(null)
  const [formData, setFormData] = useState({ name: "", description: "" })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const fetchTeams = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        ...(search && { search }),
      })
      const res = await fetch(`/api/super-admin/teams?${params}`)
      if (res.ok) {
        const data = await res.json()
        setTeams(data.teams)
        setTotalPages(data.totalPages)
        setTotal(data.total)
      }
    } catch (error) {
      console.error("Failed to fetch teams:", error)
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => {
    fetchTeams()
  }, [fetchTeams])

  const handleCreateTeam = async () => {
    if (!formData.name.trim()) return
    setSaving(true)
    try {
      const res = await fetch("/api/super-admin/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
        }),
      })
      if (res.ok) {
        setShowCreateDialog(false)
        setFormData({ name: "", description: "" })
        fetchTeams()
      } else {
        const data = await res.json()
        alert(data.error || "Failed to create team")
      }
    } catch (error) {
      console.error("Failed to create team:", error)
      alert("Failed to create team")
    } finally {
      setSaving(false)
    }
  }

  const handleEditTeam = async () => {
    if (!selectedTeam || !formData.name.trim()) return
    setSaving(true)
    try {
      const res = await fetch("/api/super-admin/teams", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId: selectedTeam.id,
          name: formData.name.trim(),
          description: formData.description.trim(),
        }),
      })
      if (res.ok) {
        setShowEditDialog(false)
        setSelectedTeam(null)
        setFormData({ name: "", description: "" })
        fetchTeams()
      } else {
        const data = await res.json()
        alert(data.error || "Failed to update team")
      }
    } catch (error) {
      console.error("Failed to update team:", error)
      alert("Failed to update team")
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteTeam = async (team: PlatformTeam) => {
    if (!confirm(`Are you sure you want to delete team "${team.name}"? This action cannot be undone.`)) {
      return
    }
    setDeleting(team.id)
    try {
      const res = await fetch(`/api/super-admin/teams?teamId=${team.id}`, {
        method: "DELETE",
      })
      if (res.ok) {
        fetchTeams()
      } else {
        const data = await res.json()
        alert(data.error || "Failed to delete team")
      }
    } catch (error) {
      console.error("Failed to delete team:", error)
      alert("Failed to delete team")
    } finally {
      setDeleting(null)
    }
  }

  const openEditDialog = (team: PlatformTeam) => {
    setSelectedTeam(team)
    setFormData({
      name: team.name,
      description: team.description || "",
    })
    setShowEditDialog(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Team Management</h2>
          <p className="text-sm text-muted-foreground">{total} total teams</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchTeams} variant="outline" size="sm" className="bg-transparent border-border text-foreground hover:text-foreground hover:bg-muted">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            onClick={() => {
              setFormData({ name: "", description: "" })
              setShowCreateDialog(true)
            }}
            size="sm"
            className="bg-gradient-to-r from-blue-700 to-orange-500 hover:from-blue-600 hover:to-orange-400 text-white border-0"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Team
          </Button>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by team name..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="pl-10 bg-card border-border text-foreground placeholder:text-muted-foreground focus:border-blue-500/50"
          />
        </div>
      </div>

      <Card className="bg-card border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">Team</TableHead>
              <TableHead className="text-muted-foreground">Slug</TableHead>
              <TableHead className="text-muted-foreground">Members</TableHead>
              <TableHead className="text-muted-foreground">Created</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow className="border-border">
                <TableCell colSpan={5} className="text-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-orange-400" />
                </TableCell>
              </TableRow>
            ) : teams.length === 0 ? (
              <TableRow className="border-border">
                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                  No teams found
                </TableCell>
              </TableRow>
            ) : (
              teams.map((team) => (
                <TableRow key={team.id} className="border-border hover:bg-muted">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-blue-500/10 rounded flex items-center justify-center">
                        <Building2 className="h-4 w-4 text-blue-400" />
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{team.name}</div>
                        {team.description && (
                          <div className="text-sm text-muted-foreground truncate max-w-xs">
                            {team.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">
                    {team.slug}
                  </TableCell>
                  <TableCell className="text-foreground">{team.memberCount}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(team.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" disabled={deleting === team.id}>
                          {deleting === team.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <MoreHorizontal className="h-4 w-4" />
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(team)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit Team
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => handleDeleteTeam(team)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Team
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {totalPages > 1 && (
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Create Team Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Team</DialogTitle>
            <DialogDescription>
              Create a new team for your clients. Teams can share subdomains and collaborate.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="team-name">Team Name *</Label>
              <Input
                id="team-name"
                placeholder="Enter team name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="team-description">Description</Label>
              <Input
                id="team-description"
                placeholder="Optional description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTeam} disabled={saving || !formData.name.trim()}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Team"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Team Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Team</DialogTitle>
            <DialogDescription>
              Update the team name and description.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-team-name">Team Name *</Label>
              <Input
                id="edit-team-name"
                placeholder="Enter team name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-team-description">Description</Label>
              <Input
                id="edit-team-description"
                placeholder="Optional description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            {selectedTeam && (
              <div className="text-sm text-muted-foreground">
                Slug: <code className="bg-muted px-1 rounded">{selectedTeam.slug}</code>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditTeam} disabled={saving || !formData.name.trim()}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

type AnalyticsData = {
  users: { total: number; newLast30Days: number; dailySignups: { date: string; count: number }[] }
  subdomains: { total: number; last30Days: number; last7Days: number }
  teams: { total: number; last30Days: number; avgSize: number; totalMembers: number }
  invitations: { totalSent: number; accepted: number; declined: number; pending: number }
  topUsers: { userId: string; email: string; subdomainCount: number }[]
}

function AnalyticsSection() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/super-admin/analytics")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setAnalytics(data)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-foreground">Platform Analytics</h2>
        <div className="py-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-orange-400" />
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-foreground">Platform Analytics</h2>
        <Card className="bg-card border-border">
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Failed to load analytics</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-foreground">Platform Analytics</h2>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card border-border hover:border-white/[0.15] transition-colors">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
              <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Users className="h-4 w-4 text-blue-400" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{analytics.users.total}</div>
            <p className="text-xs text-emerald-400 mt-1">+{analytics.users.newLast30Days} last 30 days</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border hover:border-white/[0.15] transition-colors">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Subdomains</CardTitle>
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Globe className="h-4 w-4 text-emerald-400" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{analytics.subdomains.total}</div>
            <p className="text-xs text-emerald-400 mt-1">+{analytics.subdomains.last7Days} this week</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border hover:border-white/[0.15] transition-colors">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Teams</CardTitle>
              <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Building2 className="h-4 w-4 text-orange-400" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{analytics.teams.total}</div>
            <p className="text-xs text-muted-foreground mt-1">Avg {analytics.teams.avgSize.toFixed(1)} members</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border hover:border-white/[0.15] transition-colors">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Invites</CardTitle>
              <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Mail className="h-4 w-4 text-amber-400" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{analytics.invitations.pending}</div>
            <p className="text-xs text-muted-foreground mt-1">{analytics.invitations.accepted} accepted</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">User Signups (Last 14 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] flex items-end gap-1">
              {analytics.users.dailySignups.map((day) => {
                const maxCount = Math.max(...analytics.users.dailySignups.map((d) => d.count), 1)
                const height = (day.count / maxCount) * 100
                return (
                  <div key={day.date} className="flex-1 flex flex-col items-center">
                    <div
                      className="w-full bg-gradient-to-t from-blue-600 to-orange-400 rounded-t"
                      style={{ height: `${Math.max(height, 2)}%` }}
                      title={`${day.date}: ${day.count}`}
                    />
                    <div className="text-[10px] text-muted-foreground mt-1 -rotate-45 origin-top-left">
                      {day.date.slice(5)}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Top Users by Subdomains</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.topUsers.map((user, index) => (
                <div key={user.userId} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-6 w-6 rounded-full bg-gradient-to-br from-blue-600 to-orange-500 flex items-center justify-center text-xs font-medium text-white">
                      {index + 1}
                    </div>
                    <span className="text-sm text-foreground truncate max-w-[200px]">{user.email}</span>
                  </div>
                  <Badge className="bg-blue-500/10 text-orange-400 border-blue-500/20">{user.subdomainCount}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

type ActivityLogEntry = {
  id: string
  actorId: string | null
  actorEmail: string | null
  action: string
  targetType: string | null
  targetId: string | null
  details: Record<string, unknown>
  ipAddress: string | null
  createdAt: string
}

function ActivitySection() {
  const [logs, setLogs] = useState<ActivityLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [actionFilter, setActionFilter] = useState("")

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "25",
        ...(actionFilter && { action: actionFilter }),
      })
      const res = await fetch(`/api/super-admin/activity-log?${params}`)
      if (res.ok) {
        const data = await res.json()
        setLogs(data.logs)
        setTotalPages(data.totalPages)
      }
    } catch (error) {
      console.error("Failed to fetch activity logs:", error)
    } finally {
      setLoading(false)
    }
  }, [page, actionFilter])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  const formatAction = (action: string) => {
    return action.replace(/\./g, " ").replace(/_/g, " ")
  }

  const getActionColor = (action: string) => {
    if (action.includes("delete") || action.includes("revoke")) return "text-red-400 bg-red-500/10 border-red-500/20"
    if (action.includes("create") || action.includes("grant")) return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
    if (action.includes("update") || action.includes("edit")) return "text-blue-400 bg-blue-500/10 border-blue-500/20"
    return "text-muted-foreground bg-slate-500/10 border-slate-500/20"
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Activity Log</h2>
          <p className="text-sm text-muted-foreground">Platform-wide activity history</p>
        </div>
        <Button onClick={fetchLogs} variant="outline" size="sm" className="bg-transparent border-border text-foreground hover:text-foreground hover:bg-muted">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Card className="bg-card border-border">
        <div className="divide-y divide-border">
          {loading ? (
            <div className="py-12 text-center">
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-orange-400" />
            </div>
          ) : logs.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <History className="h-12 w-12 text-foreground mx-auto mb-4" />
              <p>No activity logged yet</p>
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-muted">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      <Activity className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge className={getActionColor(log.action)}>
                          {formatAction(log.action)}
                        </Badge>
                        {log.targetType && (
                          <span className="text-sm text-muted-foreground">
                            on {log.targetType}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {log.actorEmail || "System"}
                        {log.ipAddress && <span className="ml-2 text-muted-foreground">({log.ipAddress})</span>}
                      </div>
                      {Object.keys(log.details).length > 0 && (
                        <details className="mt-2">
                          <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                            View details
                          </summary>
                          <pre className="mt-1 text-xs bg-muted/50 text-muted-foreground p-2 rounded overflow-x-auto border border-border">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(log.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {totalPages > 1 && (
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// Feedback types
type FeedbackItem = {
  id: string
  userId: string
  userEmail: string
  userName: string | null
  tenantId: number | null
  type: "BUG" | "FEATURE" | "GENERAL" | "OTHER"
  subject: string | null
  message: string
  pageUrl: string | null
  status: "NEW" | "REVIEWED" | "IN_PROGRESS" | "RESOLVED" | "ARCHIVED"
  priority: number
  adminNotes: string | null
  resolvedBy: string | null
  resolvedAt: string | null
  createdAt: string
  updatedAt: string
}

function FeedbackSection({ adminUserId }: { adminUserId: string }) {
  const [feedback, setFeedback] = useState<FeedbackItem[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedItem, setSelectedItem] = useState<FeedbackItem | null>(null)
  const [adminNotes, setAdminNotes] = useState("")
  const [updating, setUpdating] = useState(false)

  const fetchFeedback = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== "all") params.append("status", statusFilter)
      const res = await fetch(`/api/feedback?${params}`)
      if (res.ok) {
        const data = await res.json()
        setFeedback(data.feedback)
      }
    } catch (error) {
      console.error("Failed to fetch feedback:", error)
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    fetchFeedback()
  }, [fetchFeedback])

  const updateFeedbackStatus = async (id: string, status: string) => {
    setUpdating(true)
    try {
      const res = await fetch(`/api/feedback/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        const updated = await res.json()
        setFeedback((prev) => prev.map((f) => (f.id === id ? updated : f)))
        if (selectedItem?.id === id) setSelectedItem(updated)
      }
    } catch (error) {
      console.error("Failed to update feedback:", error)
    } finally {
      setUpdating(false)
    }
  }

  const saveNotes = async () => {
    if (!selectedItem) return
    setUpdating(true)
    try {
      const res = await fetch(`/api/feedback/${selectedItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminNotes }),
      })
      if (res.ok) {
        const updated = await res.json()
        setFeedback((prev) => prev.map((f) => (f.id === selectedItem.id ? updated : f)))
        setSelectedItem(updated)
      }
    } catch (error) {
      console.error("Failed to save notes:", error)
    } finally {
      setUpdating(false)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "BUG": return <AlertCircle className="h-4 w-4 text-red-500" />
      case "FEATURE": return <TrendingUp className="h-4 w-4 text-amber-500" />
      default: return <MessageSquare className="h-4 w-4 text-blue-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      NEW: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      REVIEWED: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      IN_PROGRESS: "bg-blue-500/10 text-orange-400 border-blue-500/20",
      RESOLVED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      ARCHIVED: "bg-slate-500/10 text-muted-foreground border-slate-500/20",
    }
    return <Badge className={colors[status] || "bg-slate-500/10"}>{status}</Badge>
  }

  const newCount = feedback.filter((f) => f.status === "NEW").length

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-foreground">User Feedback</h2>
          <p className="text-sm text-muted-foreground">
            {newCount > 0 ? `${newCount} new feedback items` : "Review and respond to user feedback"}
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-border rounded-md text-sm bg-card text-foreground"
          >
            <option value="all">All Status</option>
            <option value="NEW">New</option>
            <option value="REVIEWED">Reviewed</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="ARCHIVED">Archived</option>
          </select>
          <Button onClick={fetchFeedback} variant="outline" size="sm" className="bg-transparent border-border text-foreground hover:text-foreground hover:bg-muted">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Feedback List */}
        <div className="lg:col-span-2">
          <Card className="bg-card border-border">
            <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
              {loading ? (
                <div className="py-12 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-orange-400" />
                </div>
              ) : feedback.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <MessageSquare className="h-12 w-12 text-foreground mx-auto mb-4" />
                  <p>No feedback yet</p>
                </div>
              ) : (
                feedback.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setSelectedItem(item)
                      setAdminNotes(item.adminNotes || "")
                    }}
                    className={`p-4 cursor-pointer hover:bg-muted transition-colors ${
                      selectedItem?.id === item.id ? "bg-blue-500/10 border-l-2 border-l-blue-500" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        {getTypeIcon(item.type)}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm text-foreground">
                              {item.subject || item.message.slice(0, 40) + "..."}
                            </span>
                            {getStatusBadge(item.status)}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {item.userName || item.userEmail} • {new Date(item.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Detail Panel */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4 bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg text-foreground">Details</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedItem ? (
                <div className="space-y-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Type</Label>
                    <div className="flex items-center gap-2 mt-1">
                      {getTypeIcon(selectedItem.type)}
                      <span className="font-medium text-foreground">{selectedItem.type}</span>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground">From</Label>
                    <p className="text-sm text-foreground">{selectedItem.userName || "Unknown"}</p>
                    <p className="text-xs text-muted-foreground">{selectedItem.userEmail}</p>
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground">Message</Label>
                    <p className="text-sm mt-1 whitespace-pre-wrap bg-muted/50 p-2 rounded border border-border text-foreground">
                      {selectedItem.message}
                    </p>
                  </div>

                  {selectedItem.pageUrl && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Page URL</Label>
                      <a
                        href={selectedItem.pageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-orange-400 hover:text-orange-300 break-all"
                      >
                        {selectedItem.pageUrl}
                      </a>
                    </div>
                  )}

                  <div>
                    <Label className="text-xs text-muted-foreground">Status</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {["NEW", "REVIEWED", "IN_PROGRESS", "RESOLVED", "ARCHIVED"].map((status) => (
                        <Button
                          key={status}
                          size="sm"
                          variant={selectedItem.status === status ? "default" : "outline"}
                          onClick={() => updateFeedbackStatus(selectedItem.id, status)}
                          disabled={updating}
                          className={`text-xs ${selectedItem.status === status
                            ? "bg-blue-600 hover:bg-blue-500 text-white border-0"
                            : "bg-transparent border-border text-foreground hover:text-foreground hover:bg-muted"}`}
                        >
                          {status.replace("_", " ")}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground">Admin Notes</Label>
                    <textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      className="w-full mt-1 p-2 bg-muted/50 border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground"
                      rows={3}
                      placeholder="Add internal notes..."
                    />
                    <Button
                      size="sm"
                      onClick={saveNotes}
                      disabled={updating || adminNotes === (selectedItem.adminNotes || "")}
                      className="mt-2 bg-blue-600 hover:bg-blue-500 text-white border-0"
                    >
                      Save Notes
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Select a feedback item to view details</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

type PlatformSettings = {
  platformName: string
  supportEmail: string
  maintenanceMode: boolean
  registrationEnabled: boolean
  inviteOnlyMode: boolean
  maxSubdomainsPerUser: number
  maxTeamsPerUser: number
  maxMembersPerTeam: number
  defaultTrialDays: number
  requireEmailVerification: boolean
  allowCustomDomains: boolean
}

function SettingsSection() {
  const [settings, setSettings] = useState<PlatformSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch("/api/super-admin/settings")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.settings) setSettings(data.settings)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    if (!settings) return
    setSaving(true)
    try {
      const res = await fetch("/api/super-admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })
      if (res.ok) {
        const data = await res.json()
        setSettings(data.settings)
      }
    } catch (error) {
      console.error("Failed to save settings:", error)
    } finally {
      setSaving(false)
    }
  }

  const updateSetting = <K extends keyof PlatformSettings>(key: K, value: PlatformSettings[K]) => {
    setSettings((prev) => (prev ? { ...prev, [key]: value } : null))
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-foreground">Platform Settings</h2>
        <div className="py-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-orange-400" />
        </div>
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-foreground">Platform Settings</h2>
        <Card className="bg-card border-border">
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Failed to load settings</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-foreground">Platform Settings</h2>
        <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-blue-700 to-orange-500 hover:from-blue-600 hover:to-orange-400 text-white border-0">
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Save Changes
        </Button>
      </div>

      <div className="grid gap-6">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Settings className="h-5 w-5 text-orange-400" />
              General Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="platformName" className="text-foreground">Platform Name</Label>
                <Input
                  id="platformName"
                  value={settings.platformName}
                  onChange={(e) => updateSetting("platformName", e.target.value)}
                  className="bg-muted/50 border-border text-foreground placeholder:text-muted-foreground focus:border-blue-500/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supportEmail" className="text-foreground">Support Email</Label>
                <Input
                  id="supportEmail"
                  type="email"
                  value={settings.supportEmail}
                  onChange={(e) => updateSetting("supportEmail", e.target.value)}
                  className="bg-muted/50 border-border text-foreground placeholder:text-muted-foreground focus:border-blue-500/50"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Shield className="h-5 w-5 text-orange-400" />
              Access Control
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-border">
              <div>
                <Label className="text-foreground">Registration Enabled</Label>
                <p className="text-sm text-muted-foreground">Allow new users to sign up</p>
              </div>
              <Switch
                checked={settings.registrationEnabled}
                onCheckedChange={(v) => updateSetting("registrationEnabled", v)}
              />
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border">
              <div>
                <Label className="text-foreground">Invite Only Mode</Label>
                <p className="text-sm text-muted-foreground">Require invitation to sign up</p>
              </div>
              <Switch
                checked={settings.inviteOnlyMode}
                onCheckedChange={(v) => updateSetting("inviteOnlyMode", v)}
              />
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border">
              <div>
                <Label className="text-foreground">Maintenance Mode</Label>
                <p className="text-sm text-muted-foreground">Temporarily disable access for non-admins</p>
              </div>
              <Switch
                checked={settings.maintenanceMode}
                onCheckedChange={(v) => updateSetting("maintenanceMode", v)}
              />
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <Label className="text-foreground">Require Email Verification</Label>
                <p className="text-sm text-muted-foreground">Users must verify email before access</p>
              </div>
              <Switch
                checked={settings.requireEmailVerification}
                onCheckedChange={(v) => updateSetting("requireEmailVerification", v)}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Database className="h-5 w-5 text-orange-400" />
              Limits
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="maxSubdomains" className="text-foreground">Max Subdomains per User</Label>
                <Input
                  id="maxSubdomains"
                  type="number"
                  value={settings.maxSubdomainsPerUser}
                  onChange={(e) => updateSetting("maxSubdomainsPerUser", parseInt(e.target.value) || 0)}
                  className="bg-muted/50 border-border text-foreground placeholder:text-muted-foreground focus:border-blue-500/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxTeams" className="text-foreground">Max Teams per User</Label>
                <Input
                  id="maxTeams"
                  type="number"
                  value={settings.maxTeamsPerUser}
                  onChange={(e) => updateSetting("maxTeamsPerUser", parseInt(e.target.value) || 0)}
                  className="bg-muted/50 border-border text-foreground placeholder:text-muted-foreground focus:border-blue-500/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxMembers" className="text-foreground">Max Members per Team</Label>
                <Input
                  id="maxMembers"
                  type="number"
                  value={settings.maxMembersPerTeam}
                  onChange={(e) => updateSetting("maxMembersPerTeam", parseInt(e.target.value) || 0)}
                  className="bg-muted/50 border-border text-foreground placeholder:text-muted-foreground focus:border-blue-500/50"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Globe className="h-5 w-5 text-orange-400" />
              Features
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-border">
              <div>
                <Label className="text-foreground">Allow Custom Domains</Label>
                <p className="text-sm text-muted-foreground">Let users connect their own domains</p>
              </div>
              <Switch
                checked={settings.allowCustomDomains}
                onCheckedChange={(v) => updateSetting("allowCustomDomains", v)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="trialDays" className="text-foreground">Default Trial Days</Label>
              <Input
                id="trialDays"
                type="number"
                className="w-32 bg-muted/50 border-border text-foreground placeholder:text-muted-foreground focus:border-blue-500/50"
                value={settings.defaultTrialDays}
                onChange={(e) => updateSetting("defaultTrialDays", parseInt(e.target.value) || 0)}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// AI Credits types
type CreditBalance = {
  userId: string
  userEmail: string | null
  userDisplayName: string | null
  userCreatedAt?: string
  monthlyBalance: number
  purchasedBalance: number
  totalBalance: number
  lifetimeAllocated: number
  lifetimePurchased: number
  lifetimeUsed: number
  lastAllocationDate: string | null
  updatedAt: string
  hasCredits?: boolean
}

type CreditStats = {
  totalUsers: number
  usersWithCredits?: number
  totalMonthlyCredits: number
  totalPurchasedCredits: number
  totalUsedCredits: number
  avgBalance: string
}

type CreditGrant = {
  id: string
  userId: string
  userEmail: string | null
  creditsAmount: number
  creditType: string
  grantReason: string | null
  notes: string | null
  grantedByUserId: string | null
  grantedByEmail: string | null
  status: string
  appliedAt: string | null
  createdAt: string
}

function AICreditsSection({ adminUserId }: { adminUserId: string }) {
  const [balances, setBalances] = useState<CreditBalance[]>([])
  const [stats, setStats] = useState<CreditStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  // Grant dialog state
  const [selectedUser, setSelectedUser] = useState<CreditBalance | null>(null)
  const [grantAmount, setGrantAmount] = useState("")
  const [grantType, setGrantType] = useState<"monthly" | "purchased">("purchased")
  const [grantReason, setGrantReason] = useState("")
  const [grantNotes, setGrantNotes] = useState("")
  const [granting, setGranting] = useState(false)

  // History panel state
  const [historyUser, setHistoryUser] = useState<CreditBalance | null>(null)
  const [grants, setGrants] = useState<CreditGrant[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  const fetchBalances = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        ...(search && { search }),
      })
      const res = await fetch(`/api/super-admin/ai-credits?${params}`)
      if (res.ok) {
        const data = await res.json()
        setBalances(data.balances)
        setStats(data.stats)
        setTotalPages(data.totalPages)
        setTotal(data.total)
      }
    } catch (error) {
      console.error("Failed to fetch credit balances:", error)
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => {
    fetchBalances()
  }, [fetchBalances])

  const fetchUserHistory = useCallback(async (userId: string) => {
    setHistoryLoading(true)
    try {
      const res = await fetch(`/api/super-admin/users/${userId}/credits`)
      if (res.ok) {
        const data = await res.json()
        setGrants(data.grants || [])
      }
    } catch (error) {
      console.error("Failed to fetch grant history:", error)
    } finally {
      setHistoryLoading(false)
    }
  }, [])

  const handleRowClick = (balance: CreditBalance) => {
    if (historyUser?.userId === balance.userId) {
      setHistoryUser(null)
      setGrants([])
    } else {
      setHistoryUser(balance)
      fetchUserHistory(balance.userId)
    }
  }

  const handleGrantCredits = async () => {
    if (!selectedUser || !grantAmount) return
    setGranting(true)
    try {
      const res = await fetch("/api/super-admin/ai-credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser.userId,
          userEmail: selectedUser.userEmail,
          amount: parseInt(grantAmount),
          creditType: grantType,
          reason: grantReason || `Manual grant by admin`,
          notes: grantNotes || null,
        }),
      })
      if (res.ok) {
        setGrantAmount("")
        setGrantReason("")
        setGrantNotes("")
        setSelectedUser(null)
        fetchBalances()
        // Refresh history if viewing the same user
        if (historyUser?.userId === selectedUser.userId) {
          fetchUserHistory(selectedUser.userId)
        }
      }
    } catch (error) {
      console.error("Failed to grant credits:", error)
    } finally {
      setGranting(false)
    }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-"
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return "-"
    return new Date(dateStr).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-foreground">AI Credits Management</h2>
          <p className="text-sm text-muted-foreground">Monitor and allocate AI credits across all users</p>
        </div>
        <Button onClick={fetchBalances} variant="outline" size="sm" className="bg-transparent border-border text-foreground hover:text-foreground hover:bg-muted">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          <Card className="bg-card border-border hover:border-white/[0.15] transition-colors">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
                <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Users className="h-4 w-4 text-blue-400" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.totalUsers}</div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border hover:border-white/[0.15] transition-colors">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">With Credits</CardTitle>
                <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <UserCheck className="h-4 w-4 text-emerald-400" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-400">{stats.usersWithCredits ?? 0}</div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border hover:border-white/[0.15] transition-colors">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Credits</CardTitle>
                <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-blue-400" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-400">{stats.totalMonthlyCredits.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border hover:border-white/[0.15] transition-colors">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Purchased Credits</CardTitle>
                <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <CreditCard className="h-4 w-4 text-emerald-400" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-400">{stats.totalPurchasedCredits.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border hover:border-white/[0.15] transition-colors">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Used</CardTitle>
                <div className="h-8 w-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                  <Activity className="h-4 w-4 text-orange-400" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-400">{stats.totalUsedCredits.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border hover:border-white/[0.15] transition-colors">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Avg Balance</CardTitle>
                <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-amber-400" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-400">{parseFloat(stats.avgBalance).toLocaleString(undefined, { maximumFractionDigits: 1 })}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by email or name..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="pl-10 bg-card border-border text-foreground placeholder:text-muted-foreground focus:border-blue-500/50"
          />
        </div>
      </div>

      {/* Balances Table */}
      <Card className="bg-card border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">User</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
              <TableHead className="text-right text-muted-foreground">Monthly</TableHead>
              <TableHead className="text-right text-muted-foreground">Purchased</TableHead>
              <TableHead className="text-right text-muted-foreground">Total</TableHead>
              <TableHead className="text-right text-muted-foreground">Lifetime Used</TableHead>
              <TableHead className="text-muted-foreground">Last Updated</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow className="border-border">
                <TableCell colSpan={8} className="text-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-orange-400" />
                </TableCell>
              </TableRow>
            ) : balances.length === 0 ? (
              <TableRow className="border-border">
                <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                  <Sparkles className="h-12 w-12 text-foreground mx-auto mb-4" />
                  <p>No users found</p>
                </TableCell>
              </TableRow>
            ) : (
              balances.map((balance) => (
                <Fragment key={balance.userId}>
                  <TableRow
                    className={`border-border hover:bg-muted cursor-pointer ${balance.hasCredits === false ? "opacity-60" : ""} ${historyUser?.userId === balance.userId ? "bg-blue-500/5 border-l-2 border-l-blue-500" : ""}`}
                    onClick={() => handleRowClick(balance)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                          balance.hasCredits !== false
                            ? "bg-gradient-to-br from-blue-600 to-orange-500"
                            : "bg-muted"
                        }`}>
                          <Sparkles className={`h-4 w-4 ${balance.hasCredits !== false ? "text-foreground" : "text-muted-foreground"}`} />
                        </div>
                        <div>
                          <div className="font-medium text-foreground">{balance.userDisplayName || balance.userEmail || "Unknown"}</div>
                          <div className="text-sm text-muted-foreground">{balance.userEmail}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {balance.hasCredits !== false ? (
                        <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                          Has Credits
                        </Badge>
                      ) : (
                        <Badge className="bg-muted text-muted-foreground">
                          No Credits
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium text-blue-400">
                      {balance.monthlyBalance.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-medium text-emerald-400">
                      {balance.purchasedBalance.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-bold text-foreground">
                      {balance.totalBalance.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {balance.lifetimeUsed.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(balance.updatedAt)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedUser(balance)
                        }}
                        title="Grant credits"
                        className="text-orange-400 hover:text-orange-300 hover:bg-blue-500/10"
                      >
                        <Gift className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                  {/* Expanded grant history row */}
                  {historyUser?.userId === balance.userId && (
                    <TableRow className="border-border bg-muted/50">
                      <TableCell colSpan={8} className="p-0">
                        <div className="px-6 py-4 border-l-2 border-l-blue-500">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                              <History className="h-4 w-4 text-blue-400" />
                              Grant History for {balance.userDisplayName || balance.userEmail}
                            </h4>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedUser(balance)
                              }}
                              className="text-orange-400 hover:text-orange-300 hover:bg-blue-500/10 text-xs"
                            >
                              <Gift className="h-3 w-3 mr-1" />
                              Grant Credits
                            </Button>
                          </div>
                          {historyLoading ? (
                            <div className="flex items-center justify-center py-6">
                              <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
                            </div>
                          ) : grants.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-4">No credit grants recorded for this user.</p>
                          ) : (
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                              {grants.map((grant) => (
                                <div key={grant.id} className="flex items-center justify-between bg-card rounded-lg px-4 py-2.5 border border-border">
                                  <div className="flex items-center gap-3">
                                    <div className={`h-7 w-7 rounded-full flex items-center justify-center ${
                                      grant.creditType === "purchased" ? "bg-emerald-500/10" : "bg-blue-500/10"
                                    }`}>
                                      <Gift className={`h-3.5 w-3.5 ${grant.creditType === "purchased" ? "text-emerald-400" : "text-blue-400"}`} />
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-foreground">+{grant.creditsAmount.toLocaleString()} credits</span>
                                        <Badge className={`text-[10px] px-1.5 ${
                                          grant.creditType === "purchased"
                                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                            : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                        }`}>
                                          {grant.creditType}
                                        </Badge>
                                        {grant.status && (
                                          <Badge className={`text-[10px] px-1.5 ${
                                            grant.status === "applied"
                                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                              : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                          }`}>
                                            {grant.status}
                                          </Badge>
                                        )}
                                      </div>
                                      <div className="text-xs text-muted-foreground mt-0.5">
                                        {grant.grantReason || "No reason specified"}
                                        {grant.notes && <span className="text-muted-foreground"> -- {grant.notes}</span>}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-xs text-muted-foreground">{formatDateTime(grant.createdAt)}</div>
                                    {grant.grantedByEmail && (
                                      <div className="text-[10px] text-muted-foreground">by {grant.grantedByEmail}</div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages} ({total} users)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="bg-transparent border-border text-foreground hover:text-foreground hover:bg-muted disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="bg-transparent border-border text-foreground hover:text-foreground hover:bg-muted disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Grant Credits Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="text-foreground">Grant AI Credits</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Grant credits to {selectedUser?.userDisplayName || selectedUser?.userEmail}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-card rounded-lg p-3 border border-border">
                <p className="text-xs text-muted-foreground mb-1">Current Monthly</p>
                <p className="text-lg font-medium text-blue-400">
                  {selectedUser?.monthlyBalance.toLocaleString()}
                </p>
              </div>
              <div className="bg-card rounded-lg p-3 border border-border">
                <p className="text-xs text-muted-foreground mb-1">Current Purchased</p>
                <p className="text-lg font-medium text-emerald-400">
                  {selectedUser?.purchasedBalance.toLocaleString()}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="grant-amount" className="text-foreground">Credits to Grant</Label>
              <Input
                id="grant-amount"
                type="number"
                min="1"
                placeholder="100"
                value={grantAmount}
                onChange={(e) => setGrantAmount(e.target.value)}
                className="bg-card border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Credit Type</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="creditType"
                    checked={grantType === "purchased"}
                    onChange={() => setGrantType("purchased")}
                    className="accent-emerald-500"
                  />
                  <span className="text-sm text-foreground">Purchased (never expires)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="creditType"
                    checked={grantType === "monthly"}
                    onChange={() => setGrantType("monthly")}
                    className="accent-blue-500"
                  />
                  <span className="text-sm text-foreground">Monthly (resets each cycle)</span>
                </label>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="grant-reason" className="text-foreground">Reason</Label>
              <Input
                id="grant-reason"
                placeholder="Promotional grant, support resolution, etc."
                value={grantReason}
                onChange={(e) => setGrantReason(e.target.value)}
                className="bg-card border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="grant-notes" className="text-foreground">Notes (optional)</Label>
              <textarea
                id="grant-notes"
                placeholder="Internal notes about this grant..."
                value={grantNotes}
                onChange={(e) => setGrantNotes(e.target.value)}
                rows={3}
                className="w-full rounded-md bg-card border border-border text-foreground placeholder:text-muted-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedUser(null)} className="bg-transparent border-border text-foreground hover:text-foreground hover:bg-muted">
              Cancel
            </Button>
            <Button
              onClick={handleGrantCredits}
              disabled={granting || !grantAmount || parseInt(grantAmount) <= 0}
              className="bg-gradient-to-r from-blue-700 to-orange-500 hover:from-blue-600 hover:to-orange-400 text-white border-0"
            >
              {granting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Gift className="h-4 w-4 mr-2" />}
              Grant Credits
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// User Override types
type UserOverrideItem = {
  id: string
  userId: string
  userEmail: string | null
  unlimitedSubdomains: boolean
  unlimitedAiCredits: boolean
  bypassPayment: boolean
  subdomainLimitOverride: number | null
  monthlyCreditAllocation: number | null
  grantReason: string | null
  grantedAt: string
  expiresAt: string | null
}

function UserOverridesSection({ adminUserId }: { adminUserId: string }) {
  const [overrides, setOverrides] = useState<UserOverrideItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newOverride, setNewOverride] = useState({
    userId: "",
    userEmail: "",
    unlimitedSubdomains: false,
    unlimitedAiCredits: false,
    bypassPayment: false,
    subdomainLimitOverride: "",
    monthlyCreditAllocation: "",
    grantReason: "",
    expiresInDays: "",
  })
  const [creating, setCreating] = useState(false)

  const fetchOverrides = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/super-admin/overrides")
      if (res.ok) {
        const data = await res.json()
        setOverrides(data.overrides || [])
      }
    } catch (error) {
      console.error("Failed to fetch overrides:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOverrides()
  }, [fetchOverrides])

  const handleCreateOverride = async () => {
    if (!newOverride.userId) return
    setCreating(true)
    try {
      const res = await fetch("/api/super-admin/overrides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: newOverride.userId,
          userEmail: newOverride.userEmail || undefined,
          unlimitedSubdomains: newOverride.unlimitedSubdomains,
          unlimitedAiCredits: newOverride.unlimitedAiCredits,
          bypassPayment: newOverride.bypassPayment,
          subdomainLimitOverride: newOverride.subdomainLimitOverride ? parseInt(newOverride.subdomainLimitOverride) : undefined,
          monthlyCreditAllocation: newOverride.monthlyCreditAllocation ? parseInt(newOverride.monthlyCreditAllocation) : undefined,
          grantReason: newOverride.grantReason || undefined,
          expiresInDays: newOverride.expiresInDays ? parseInt(newOverride.expiresInDays) : undefined,
        }),
      })
      if (res.ok) {
        setNewOverride({
          userId: "",
          userEmail: "",
          unlimitedSubdomains: false,
          unlimitedAiCredits: false,
          bypassPayment: false,
          subdomainLimitOverride: "",
          monthlyCreditAllocation: "",
          grantReason: "",
          expiresInDays: "",
        })
        setShowCreateDialog(false)
        fetchOverrides()
      }
    } catch (error) {
      console.error("Failed to create override:", error)
    } finally {
      setCreating(false)
    }
  }

  const handleRevokeOverride = async (userId: string) => {
    if (!confirm("Are you sure you want to revoke this override?")) return
    try {
      const res = await fetch(`/api/super-admin/overrides?userId=${userId}`, {
        method: "DELETE",
      })
      if (res.ok) {
        fetchOverrides()
      }
    } catch (error) {
      console.error("Failed to revoke override:", error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-foreground">User Overrides</h2>
          <p className="text-sm text-muted-foreground">Grant special permissions and trial extensions to users</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchOverrides} variant="outline" size="sm" className="bg-transparent border-border text-foreground hover:text-foreground hover:bg-muted">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowCreateDialog(true)} size="sm" className="bg-gradient-to-r from-blue-700 to-orange-500 hover:from-blue-600 hover:to-orange-400 text-white border-0">
            <Wand2 className="h-4 w-4 mr-2" />
            Create Override
          </Button>
        </div>
      </div>

      <Card className="bg-card border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">User</TableHead>
              <TableHead className="text-muted-foreground">Permissions</TableHead>
              <TableHead className="text-muted-foreground">Limits</TableHead>
              <TableHead className="text-muted-foreground">Reason</TableHead>
              <TableHead className="text-muted-foreground">Expires</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow className="border-border">
                <TableCell colSpan={6} className="text-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-orange-400" />
                </TableCell>
              </TableRow>
            ) : overrides.length === 0 ? (
              <TableRow className="border-border">
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  <Wand2 className="h-12 w-12 text-foreground mx-auto mb-4" />
                  <p>No active overrides</p>
                </TableCell>
              </TableRow>
            ) : (
              overrides.map((override) => (
                <TableRow key={override.id} className="border-border hover:bg-muted">
                  <TableCell>
                    <div className="font-medium text-foreground">{override.userEmail || override.userId}</div>
                    <div className="text-xs text-muted-foreground font-mono">{override.userId.slice(0, 12)}...</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {override.unlimitedSubdomains && (
                        <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">∞ Subdomains</Badge>
                      )}
                      {override.unlimitedAiCredits && (
                        <Badge className="bg-blue-500/10 text-orange-400 border-blue-500/20">∞ AI Credits</Badge>
                      )}
                      {override.bypassPayment && (
                        <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Free Access</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-foreground">
                      {override.subdomainLimitOverride && (
                        <div>Subdomains: {override.subdomainLimitOverride}</div>
                      )}
                      {override.monthlyCreditAllocation && (
                        <div>+{override.monthlyCreditAllocation} credits/mo</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[150px] truncate">
                    {override.grantReason || "-"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {override.expiresAt ? (
                      <span className={new Date(override.expiresAt) < new Date() ? "text-red-400" : "text-foreground"}>
                        {new Date(override.expiresAt).toLocaleDateString()}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Never</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRevokeOverride(override.userId)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Create Override Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create User Override</DialogTitle>
            <DialogDescription>
              Grant special permissions or trial extensions to a user
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="userId">User ID *</Label>
              <Input
                id="userId"
                placeholder="User ID from Stack Auth"
                value={newOverride.userId}
                onChange={(e) => setNewOverride({ ...newOverride, userId: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="userEmail">User Email (optional)</Label>
              <Input
                id="userEmail"
                type="email"
                placeholder="user@example.com"
                value={newOverride.userEmail}
                onChange={(e) => setNewOverride({ ...newOverride, userEmail: e.target.value })}
              />
            </div>

            <div className="space-y-3 border rounded-lg p-3">
              <Label>Permissions</Label>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <Switch
                    checked={newOverride.unlimitedSubdomains}
                    onCheckedChange={(v) => setNewOverride({ ...newOverride, unlimitedSubdomains: v })}
                  />
                  <span className="text-sm">Unlimited Subdomains</span>
                </label>
                <label className="flex items-center gap-2">
                  <Switch
                    checked={newOverride.unlimitedAiCredits}
                    onCheckedChange={(v) => setNewOverride({ ...newOverride, unlimitedAiCredits: v })}
                  />
                  <span className="text-sm">Unlimited AI Credits</span>
                </label>
                <label className="flex items-center gap-2">
                  <Switch
                    checked={newOverride.bypassPayment}
                    onCheckedChange={(v) => setNewOverride({ ...newOverride, bypassPayment: v })}
                  />
                  <span className="text-sm">Bypass Payment (Free Trial Extension)</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="subdomainLimit">Custom Subdomain Limit</Label>
                <Input
                  id="subdomainLimit"
                  type="number"
                  placeholder="e.g., 10"
                  value={newOverride.subdomainLimitOverride}
                  onChange={(e) => setNewOverride({ ...newOverride, subdomainLimitOverride: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="monthlyCredits">Extra Monthly Credits</Label>
                <Input
                  id="monthlyCredits"
                  type="number"
                  placeholder="e.g., 500"
                  value={newOverride.monthlyCreditAllocation}
                  onChange={(e) => setNewOverride({ ...newOverride, monthlyCreditAllocation: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiresInDays">Expires In (days)</Label>
              <Input
                id="expiresInDays"
                type="number"
                placeholder="Leave blank for permanent"
                value={newOverride.expiresInDays}
                onChange={(e) => setNewOverride({ ...newOverride, expiresInDays: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason</Label>
              <Input
                id="reason"
                placeholder="VIP customer, beta tester, support case, etc."
                value={newOverride.grantReason}
                onChange={(e) => setNewOverride({ ...newOverride, grantReason: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateOverride} disabled={creating || !newOverride.userId}>
              {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Wand2 className="h-4 w-4 mr-2" />}
              Create Override
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export function AdminDashboard({
  tenants,
  superAdmin,
}: {
  tenants: Tenant[]
  superAdmin: SuperAdminInfo
}) {
  const [state, action] = useFormState<DeleteState, FormData>(deleteSubdomainAction, {})
  const [isPending, setIsPending] = useState(false)
  const [activeSection, setActiveSection] = useState<AdminSection>("overview")
  const [tiers, setTiers] = useState<(SubscriptionTier & { clientCount: number })[]>([])
  const [clientStats, setClientStats] = useState<ClientStats | undefined>()
  const [tiersLoaded, setTiersLoaded] = useState(false)

  const user = useUser()
  const adminUserId = superAdmin.userId

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
        return <OverviewSection />
      case "users":
        return <UsersSection />
      case "teams":
        return <TeamsSection />
      case "clients":
        return <ClientsSection adminUserId={adminUserId} />
      case "tiers":
        return <TiersSection tiers={tiers} />
      case "subdomains":
        return <SubdomainsSection tenants={tenants} action={handleAction} isPending={isPending} />
      case "ai-credits":
        return <AICreditsSection adminUserId={adminUserId} />
      case "overrides":
        return <UserOverridesSection adminUserId={adminUserId} />
      case "analytics":
        return <AnalyticsSection />
      case "activity":
        return <ActivitySection />
      case "feedback":
        return <FeedbackSection adminUserId={adminUserId} />
      case "settings":
        return <SettingsSection />
      case "rate-limits":
        return <RateLimitsSection />
      case "billing":
        return <BillingSection />
      default:
        return <OverviewSection />
    }
  }

  // Map section IDs to breadcrumb labels
  const sectionLabel: Record<AdminSection, string> = {
    overview: "Overview",
    users: "Users",
    teams: "Teams",
    clients: "Clients",
    tiers: "Subscription Tiers",
    subdomains: "Tenants & Subdomains",
    "ai-credits": "AI Credits",
    overrides: "Permission Overrides",
    analytics: "Analytics",
    activity: "Activity Log",
    feedback: "Feedback",
    settings: "Platform Settings",
    "rate-limits": "Rate Limiting",
    billing: "Billing & Usage",
  }

  const crumbs = ["CNCPT Admin", sectionLabel[activeSection] ?? activeSection]

  return (
    <div className="cncpt-admin">
      <div className="ca-board" style={{ minHeight: "100vh" }}>
        {/* Left sidebar */}
        <aside className="ca-sidebar">
          {/* Brand */}
          <div className="ca-sidebar__brand">
            <div className="ca-sidebar__brand-mark">
              <Shield style={{ width: 14, height: 14 }} aria-hidden />
            </div>
            <span className="ca-sidebar__brand-name">CNCPT Admin</span>
          </div>

          {/* Search */}
          <div className="ca-sidebar__search">
            <Search style={{ width: 13, height: 13 }} aria-hidden />
            <span className="ca-sidebar__search-q">Search…</span>
            <span className="ca-kbd">⌘K</span>
          </div>

          {/* Nav */}
          <nav className="ca-sidebar__nav">
            {[
              { id: "overview" as AdminSection, label: "Overview",             Icon: Home },
              { id: "users" as AdminSection,    label: "Users",                Icon: Users },
              { id: "teams" as AdminSection,    label: "Teams",                Icon: Building2 },
              { id: "clients" as AdminSection,  label: "Clients",              Icon: UserCheck, badge: clientStats?.pendingApproval },
              { id: "tiers" as AdminSection,    label: "Subscription Tiers",   Icon: CreditCard },
              { id: "subdomains" as AdminSection, label: "Tenants & Subdomains", Icon: Globe },
              { id: "ai-credits" as AdminSection, label: "AI Credits",         Icon: Sparkles },
              { id: "overrides" as AdminSection, label: "Permission Overrides", Icon: Wand2 },
              { separator: "Feedback" },
              { id: "feedback" as AdminSection, label: "Feedback",             Icon: MessageSquare },
              { separator: "Insights" },
              { id: "billing" as AdminSection,   label: "Billing & Usage",     Icon: DollarSign },
              { id: "analytics" as AdminSection, label: "Analytics",           Icon: BarChart3 },
              { id: "activity" as AdminSection,  label: "Activity Log",        Icon: History },
              { separator: "Settings" },
              { id: "rate-limits" as AdminSection, label: "Rate Limiting",      Icon: Gauge },
              { id: "settings" as AdminSection,  label: "Platform Settings",   Icon: Settings },
            ].map((item, i) => {
              if ("separator" in item) {
                return (
                  <div className="ca-sidebar__nav-h" key={"sep" + i}>
                    <ChevronLeft style={{ width: 11, height: 11, transform: "rotate(-90deg)" }} aria-hidden />
                    {item.separator}
                  </div>
                )
              }
              const { id, label, Icon: ItemIcon, badge } = item
              const isActive = activeSection === id
              return (
                <button
                  key={id}
                  type="button"
                  className={`ca-sidebar__nav-item${isActive ? " is-active" : ""}`}
                  onClick={() => setActiveSection(id)}
                >
                  <ItemIcon style={{ width: 14, height: 14 }} className="ca-nav-icon" aria-hidden />
                  <span>{label}</span>
                  {badge !== undefined && badge > 0 && (
                    <span className="ca-nav-badge is-hot">{badge}</span>
                  )}
                </button>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="ca-sidebar__foot">
            <div className="ca-avatar ca-avatar--sm ca-avatar--orange">
              {superAdmin.email.slice(0, 2).toUpperCase()}
            </div>
            <div className="ca-col" style={{ flex: 1, minWidth: 0, gap: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 500 }}>
                {superAdmin.email.split("@")[0]}
              </div>
              <div className="ca-muted" style={{ fontSize: 10.5 }}>super admin</div>
            </div>
            <button
              type="button"
              className="ca-iconbtn ca-iconbtn--sm ca-iconbtn--ghost"
              onClick={async () => {
                if (user) {
                  await user.signOut()
                }
              }}
            >
              <LogOut style={{ width: 13, height: 13 }} aria-hidden />
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="ca-main">
          {/* Topbar */}
          <header className="ca-topbar">
            <div className="ca-crumbs">
              {crumbs.map((c, i) => (
                <Fragment key={i}>
                  <span className={i === crumbs.length - 1 ? "ca-crumb-active" : "ca-muted"}>
                    {c}
                  </span>
                  {i < crumbs.length - 1 && (
                    <ChevronRight style={{ width: 12, height: 12, color: "var(--ca-text-faint)" }} aria-hidden />
                  )}
                </Fragment>
              ))}
            </div>
            <div className="ca-topbar__spacer" />
            <button type="button" className="ca-iconbtn ca-iconbtn--sm ca-iconbtn--ghost">
              <Bell style={{ width: 13, height: 13 }} aria-hidden />
            </button>
            <div className="ca-avatar ca-avatar--sm ca-avatar--orange" style={{ marginLeft: 4 }}>
              {superAdmin.email.slice(0, 2).toUpperCase()}
            </div>
          </header>

          {/* Page scroll area */}
          <div className="ca-page">
            <div className="ca-page-body">
              {renderActiveSection()}
            </div>
          </div>
        </main>

        {/* Right activity rail — real platform activity log */}
        <AdminActivityRail />
      </div>

      {/* Toast notifications */}
      {state.error && (
        <div
          style={{
            position: "fixed",
            bottom: 16,
            right: 16,
            background: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#991b1b",
            padding: "12px 16px",
            borderRadius: 8,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            zIndex: 50,
            fontFamily: "var(--ca-font, inherit)",
            fontSize: 13,
          }}
        >
          {state.error}
        </div>
      )}

      {state.success && (
        <div
          style={{
            position: "fixed",
            bottom: 16,
            right: 16,
            background: "#ecfdf5",
            border: "1px solid #a7f3d0",
            color: "#065f46",
            padding: "12px 16px",
            borderRadius: 8,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            zIndex: 50,
            fontFamily: "var(--ca-font, inherit)",
            fontSize: 13,
          }}
        >
          {state.success}
        </div>
      )}
    </div>
  )
}
