"use client"

import { useFormState } from "react-dom"
import { useState, useEffect, useCallback } from "react"
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

type SuperAdminInfo = {
  userId: string
  email: string
  permissions: string[]
}

type AdminSection = "overview" | "clients" | "tiers" | "subdomains" | "users" | "teams" | "analytics" | "activity" | "feedback" | "settings" | "ai-credits" | "overrides"

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
    <div className="w-64 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 min-h-screen border-r border-white/[0.08]">
      <div className="p-6 border-b border-white/[0.08]">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-blue-600 to-orange-500 flex items-center justify-center">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">CNCPT Admin</h2>
            <p className="text-xs text-slate-400">{rootDomain}</p>
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
                      : "text-slate-400 hover:text-white hover:bg-white/[0.05]"
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

  const handleSignOut = async () => {
    if (user) {
      await user.signOut()
      window.location.href = "/"
    }
  }

  return (
    <div className="bg-slate-900/50 backdrop-blur-sm border-b border-white/[0.08] px-6 py-4 sticky top-0 z-10">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-semibold text-white">Super Admin Dashboard</h1>
          <p className="text-sm text-slate-400">Platform-wide administration</p>
        </div>
        <div className="flex items-center gap-3">
          {user && (
            <div className="flex items-center gap-3 bg-gradient-to-r from-blue-600/10 to-orange-500/10 px-4 py-2 rounded-lg border border-blue-500/20">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-600 to-orange-500 flex items-center justify-center">
                <Crown className="h-4 w-4 text-white" />
              </div>
              <div className="text-sm">
                <div className="font-medium text-white">{user.displayName || user.primaryEmail}</div>
                <div className="text-orange-400 text-xs">Super Admin</div>
              </div>
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleSignOut}
            className="flex items-center gap-2 bg-transparent border-white/10 text-slate-300 hover:text-white hover:bg-white/5 hover:border-white/20"
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
  users: { total: number; newLast30Days: number }
  subdomains: { total: number; last30Days: number; last7Days: number }
  teams: { total: number; last30Days: number; totalMembers: number }
  topUsers: Array<{ userId: string; email: string; displayName: string | null; subdomainCount: number }>
}

function OverviewSection() {
  const [data, setData] = useState<OverviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchOverviewData() {
      try {
        setLoading(true)
        const res = await fetch("/api/super-admin/analytics")
        if (!res.ok) throw new Error("Failed to fetch analytics")
        const json = await res.json()
        setData(json)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data")
      } finally {
        setLoading(false)
      }
    }
    fetchOverviewData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
        <p className="text-gray-600">{error || "Failed to load overview data"}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Platform Overview</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 bg-transparent border-white/10 text-slate-300 hover:text-white hover:bg-white/5"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-slate-800/50 border-white/[0.08] hover:border-white/[0.15] transition-colors">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-400">Total Users</CardTitle>
              <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Users className="h-4 w-4 text-blue-400" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{data.users.total}</div>
            <p className="text-xs text-emerald-400 mt-1">+{data.users.newLast30Days} last 30 days</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-white/[0.08] hover:border-white/[0.15] transition-colors">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-400">Total Subdomains</CardTitle>
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Globe className="h-4 w-4 text-emerald-400" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{data.subdomains.total}</div>
            <p className="text-xs text-emerald-400 mt-1">+{data.subdomains.last30Days} last 30 days</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-white/[0.08] hover:border-white/[0.15] transition-colors">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-400">This Week</CardTitle>
              <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Activity className="h-4 w-4 text-orange-400" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{data.subdomains.last7Days}</div>
            <p className="text-xs text-slate-400 mt-1">New subdomains</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-white/[0.08] hover:border-white/[0.15] transition-colors">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-400">Teams</CardTitle>
              <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Building2 className="h-4 w-4 text-amber-400" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{data.teams.total}</div>
            <p className="text-xs text-slate-400 mt-1">{data.teams.totalMembers} total members</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-800/50 border-white/[0.08]">
        <CardHeader>
          <CardTitle className="text-white">Top Users by Subdomains</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.topUsers.length === 0 ? (
              <p className="text-sm text-slate-400">No users with subdomains yet</p>
            ) : (
              data.topUsers.map((user, index) => (
                <div
                  key={user.userId}
                  className="flex items-center justify-between py-2 border-b border-white/[0.05] last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-600 to-orange-500 flex items-center justify-center text-sm font-medium text-white">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-white">{user.displayName || user.email}</div>
                      {user.displayName && (
                        <div className="text-sm text-slate-400">{user.email}</div>
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
    </div>
  )
}

// Enhanced subdomain type with owner info
type EnhancedSubdomain = {
  id: number
  subdomain: string
  emoji: string
  userId: string | null
  owner: {
    id: string
    email: string | null
    displayName: string | null
  } | null
  createdAt: string
  teamShareCount: number
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
  const [newEmoji, setNewEmoji] = useState("🌐")
  const [newSiteName, setNewSiteName] = useState("")
  const [assignOwnerEmail, setAssignOwnerEmail] = useState("")
  const [assignOwnerId, setAssignOwnerId] = useState("")
  const [assignFoundUser, setAssignFoundUser] = useState<{ id: string; email: string; displayName: string | null } | null>(null)
  const [creating, setCreating] = useState(false)
  const [searchingAssignUser, setSearchingAssignUser] = useState(false)

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
          emoji: newEmoji || "🌐",
          siteName: newSiteName || newSubdomain,
          ownerId: assignOwnerId || null,
          ownerEmail: assignFoundUser?.email || assignOwnerEmail || null,
        }),
      })
      if (res.ok) {
        setShowCreateDialog(false)
        setNewSubdomain("")
        setNewEmoji("🌐")
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
          <h2 className="text-xl font-semibold text-white">Subdomain Management</h2>
          <p className="text-sm text-slate-400">{total} total subdomains - Create and assign ownership to users</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowCreateDialog(true)} size="sm" className="bg-gradient-to-r from-blue-700 to-orange-500 hover:from-blue-600 hover:to-orange-400 text-white border-0">
            <Globe className="h-4 w-4 mr-2" />
            Create Subdomain
          </Button>
          <Button onClick={fetchSubdomains} variant="outline" size="sm" className="bg-transparent border-white/10 text-slate-300 hover:text-white hover:bg-white/5">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Search subdomains..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="pl-10 bg-slate-800/50 border-white/[0.08] text-white placeholder:text-slate-500 focus:border-blue-500/50"
          />
        </div>
      </div>

      {/* Subdomains Table */}
      <Card className="bg-slate-800/50 border-white/[0.08] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-white/[0.08] hover:bg-transparent">
              <TableHead className="text-slate-400">Subdomain</TableHead>
              <TableHead className="text-slate-400">Owner</TableHead>
              <TableHead className="text-slate-400">Created</TableHead>
              <TableHead className="text-slate-400">Teams</TableHead>
              <TableHead className="w-24 text-slate-400">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow className="border-white/[0.08]">
                <TableCell colSpan={5} className="text-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-orange-400" />
                </TableCell>
              </TableRow>
            ) : subdomains.length === 0 ? (
              <TableRow className="border-white/[0.08]">
                <TableCell colSpan={5} className="text-center py-12 text-slate-500">
                  <Globe className="h-12 w-12 text-slate-700 mx-auto mb-4" />
                  <p>No subdomains found</p>
                </TableCell>
              </TableRow>
            ) : (
              subdomains.map((sub) => (
                <TableRow key={sub.id} className="border-white/[0.08] hover:bg-white/[0.02]">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{sub.emoji}</span>
                      <div>
                        <div className="font-medium text-white">{sub.subdomain}</div>
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
                        <div className="font-medium text-sm text-white">{sub.owner.displayName || sub.owner.email}</div>
                        {sub.owner.displayName && (
                          <div className="text-xs text-slate-400">{sub.owner.email}</div>
                        )}
                      </div>
                    ) : (
                      <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20">
                        No Owner
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-slate-400">
                    {new Date(sub.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {sub.teamShareCount > 0 ? (
                      <Badge className="bg-slate-700 text-slate-300">{sub.teamShareCount} teams</Badge>
                    ) : (
                      <span className="text-slate-600">-</span>
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
                        className="text-orange-400 hover:text-orange-300 hover:bg-blue-500/10"
                      >
                        <ArrowRight className="h-4 w-4 mr-1" />
                        Assign
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
          <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
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
                <Label className="text-xs text-gray-500">Current Owner</Label>
                <div className="font-medium">
                  {selectedSubdomain.owner.displayName || selectedSubdomain.owner.email}
                </div>
                {selectedSubdomain.owner.displayName && (
                  <div className="text-sm text-gray-500">{selectedSubdomain.owner.email}</div>
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
                    <span className="text-gray-500"> ({foundUser.email})</span>
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
                <span className="text-sm text-gray-500">.{rootDomain}</span>
              </div>
              <p className="text-xs text-gray-500">Lowercase letters, numbers, and hyphens only</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="newEmoji">Emoji</Label>
                <Input
                  id="newEmoji"
                  value={newEmoji}
                  onChange={(e) => setNewEmoji(e.target.value)}
                  placeholder="🌐"
                  className="text-center text-2xl"
                  maxLength={4}
                />
              </div>
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
                    <span className="text-gray-500"> ({assignFoundUser.email})</span>
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
  createdAt: string
  isAdmin: boolean
  isSuperAdmin: boolean
  subdomainCount: number
}

function UsersSection() {
  const [users, setUsers] = useState<PlatformUser[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [selectedUser, setSelectedUser] = useState<PlatformUser | null>(null)
  const [userDetails, setUserDetails] = useState<{
    subdomains: Array<{ subdomain: string; emoji: string; createdAt: string }>
    teams: Array<{ id: string; name: string; slug: string; role: string }>
  } | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        ...(search && { search }),
      })
      const res = await fetch(`/api/super-admin/users?${params}`)
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users)
        setTotalPages(data.totalPages)
        setTotal(data.total)
      }
    } catch (error) {
      console.error("Failed to fetch users:", error)
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const fetchUserDetails = async (userId: string) => {
    try {
      const res = await fetch(`/api/super-admin/users/${userId}`)
      if (res.ok) {
        const data = await res.json()
        setUserDetails({ subdomains: data.subdomains, teams: data.teams })
      }
    } catch (error) {
      console.error("Failed to fetch user details:", error)
    }
  }

  const handleViewUser = (user: PlatformUser) => {
    setSelectedUser(user)
    setUserDetails(null)
    fetchUserDetails(user.id)
  }

  const handleToggleAdmin = async (user: PlatformUser, makeAdmin: boolean) => {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/super-admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAdmin: makeAdmin }),
      })
      if (res.ok) {
        fetchUsers()
      }
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
      if (res.ok) {
        fetchUsers()
      }
    } catch (error) {
      console.error("Failed to update user:", error)
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-white">User Management</h2>
          <p className="text-sm text-slate-400">{total} total users</p>
        </div>
        <Button onClick={fetchUsers} variant="outline" size="sm" className="bg-transparent border-white/10 text-slate-300 hover:text-white hover:bg-white/5">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Search by email or name..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="pl-10 bg-slate-800/50 border-white/[0.08] text-white placeholder:text-slate-500 focus:border-blue-500/50"
          />
        </div>
      </div>

      <Card className="bg-slate-800/50 border-white/[0.08] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-white/[0.08] hover:bg-transparent">
              <TableHead className="text-slate-400">User</TableHead>
              <TableHead className="text-slate-400">Joined</TableHead>
              <TableHead className="text-slate-400">Subdomains</TableHead>
              <TableHead className="text-slate-400">Role</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow className="border-white/[0.08]">
                <TableCell colSpan={5} className="text-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-orange-400" />
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow className="border-white/[0.08]">
                <TableCell colSpan={5} className="text-center py-12 text-slate-500">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id} className="border-white/[0.08] hover:bg-white/[0.02]">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-slate-700 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-slate-400" />
                      </div>
                      <div>
                        <div className="font-medium text-white">{user.displayName || user.email}</div>
                        <div className="text-sm text-slate-400">{user.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-slate-400">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
                  </TableCell>
                  <TableCell className="text-white">{user.subdomainCount}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {user.isSuperAdmin && (
                        <Badge className="bg-blue-500/20 text-orange-400 border-blue-500/30 hover:bg-blue-500/30">
                          <Crown className="h-3 w-3 mr-1" />
                          Super Admin
                        </Badge>
                      )}
                      {user.isAdmin && !user.isSuperAdmin && (
                        <Badge className="bg-slate-700 text-slate-300">Admin</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewUser(user)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {user.isAdmin ? (
                          <DropdownMenuItem
                            onClick={() => handleToggleAdmin(user, false)}
                            disabled={actionLoading}
                          >
                            Remove Admin
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => handleToggleAdmin(user, true)}
                            disabled={actionLoading}
                          >
                            Make Admin
                          </DropdownMenuItem>
                        )}
                        {user.isSuperAdmin ? (
                          <DropdownMenuItem
                            onClick={() => handleToggleSuperAdmin(user, false)}
                            disabled={actionLoading}
                            className="text-red-600"
                          >
                            Remove Super Admin
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => handleToggleSuperAdmin(user, true)}
                            disabled={actionLoading}
                          >
                            <Crown className="h-4 w-4 mr-2" />
                            Make Super Admin
                          </DropdownMenuItem>
                        )}
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
          <p className="text-sm text-gray-500">
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

      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">Display Name</Label>
                  <p className="font-medium">{selectedUser.displayName || "Not set"}</p>
                </div>
                <div>
                  <Label className="text-gray-500">User ID</Label>
                  <p className="font-mono text-sm">{selectedUser.id}</p>
                </div>
              </div>

              {userDetails ? (
                <>
                  <div>
                    <Label className="text-gray-500 mb-2 block">
                      Subdomains ({userDetails.subdomains.length})
                    </Label>
                    {userDetails.subdomains.length > 0 ? (
                      <div className="space-y-2">
                        {userDetails.subdomains.map((s) => (
                          <div
                            key={s.subdomain}
                            className="flex items-center justify-between p-2 bg-gray-50 rounded"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-xl">{s.emoji}</span>
                              <span className="font-medium">{s.subdomain}</span>
                            </div>
                            <a
                              href={`${protocol}://${s.subdomain}.${rootDomain}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-500 text-sm hover:underline"
                            >
                              Visit
                            </a>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No subdomains</p>
                    )}
                  </div>

                  <div>
                    <Label className="text-gray-500 mb-2 block">
                      Teams ({userDetails.teams.length})
                    </Label>
                    {userDetails.teams.length > 0 ? (
                      <div className="space-y-2">
                        {userDetails.teams.map((t) => (
                          <div
                            key={t.id}
                            className="flex items-center justify-between p-2 bg-gray-50 rounded"
                          >
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-gray-400" />
                              <span className="font-medium">{t.name}</span>
                            </div>
                            <Badge variant="outline">{t.role}</Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">Not a member of any teams</p>
                    )}
                  </div>
                </>
              ) : (
                <div className="py-8 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </div>
              )}
            </div>
          )}
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
          <h2 className="text-xl font-semibold text-white">Team Management</h2>
          <p className="text-sm text-slate-400">{total} total teams</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchTeams} variant="outline" size="sm" className="bg-transparent border-white/10 text-slate-300 hover:text-white hover:bg-white/5">
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
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Search by team name..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="pl-10 bg-slate-800/50 border-white/[0.08] text-white placeholder:text-slate-500 focus:border-blue-500/50"
          />
        </div>
      </div>

      <Card className="bg-slate-800/50 border-white/[0.08] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-white/[0.08] hover:bg-transparent">
              <TableHead className="text-slate-400">Team</TableHead>
              <TableHead className="text-slate-400">Slug</TableHead>
              <TableHead className="text-slate-400">Members</TableHead>
              <TableHead className="text-slate-400">Created</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow className="border-white/[0.08]">
                <TableCell colSpan={5} className="text-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-orange-400" />
                </TableCell>
              </TableRow>
            ) : teams.length === 0 ? (
              <TableRow className="border-white/[0.08]">
                <TableCell colSpan={5} className="text-center py-12 text-slate-500">
                  No teams found
                </TableCell>
              </TableRow>
            ) : (
              teams.map((team) => (
                <TableRow key={team.id} className="border-white/[0.08] hover:bg-white/[0.02]">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-blue-500/10 rounded flex items-center justify-center">
                        <Building2 className="h-4 w-4 text-blue-400" />
                      </div>
                      <div>
                        <div className="font-medium text-white">{team.name}</div>
                        {team.description && (
                          <div className="text-sm text-slate-400 truncate max-w-xs">
                            {team.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm text-slate-400">
                    {team.slug}
                  </TableCell>
                  <TableCell className="text-white">{team.memberCount}</TableCell>
                  <TableCell className="text-sm text-slate-400">
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
          <p className="text-sm text-gray-500">
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
              <div className="text-sm text-gray-500">
                Slug: <code className="bg-gray-100 px-1 rounded">{selectedTeam.slug}</code>
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
        <h2 className="text-xl font-semibold text-white">Platform Analytics</h2>
        <div className="py-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-orange-400" />
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-white">Platform Analytics</h2>
        <Card className="bg-slate-800/50 border-white/[0.08]">
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">Failed to load analytics</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-white">Platform Analytics</h2>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-slate-800/50 border-white/[0.08] hover:border-white/[0.15] transition-colors">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-400">Total Users</CardTitle>
              <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Users className="h-4 w-4 text-blue-400" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{analytics.users.total}</div>
            <p className="text-xs text-emerald-400 mt-1">+{analytics.users.newLast30Days} last 30 days</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-white/[0.08] hover:border-white/[0.15] transition-colors">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-400">Subdomains</CardTitle>
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Globe className="h-4 w-4 text-emerald-400" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{analytics.subdomains.total}</div>
            <p className="text-xs text-emerald-400 mt-1">+{analytics.subdomains.last7Days} this week</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-white/[0.08] hover:border-white/[0.15] transition-colors">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-400">Teams</CardTitle>
              <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Building2 className="h-4 w-4 text-orange-400" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{analytics.teams.total}</div>
            <p className="text-xs text-slate-400 mt-1">Avg {analytics.teams.avgSize.toFixed(1)} members</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-white/[0.08] hover:border-white/[0.15] transition-colors">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-400">Pending Invites</CardTitle>
              <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Mail className="h-4 w-4 text-amber-400" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{analytics.invitations.pending}</div>
            <p className="text-xs text-slate-400 mt-1">{analytics.invitations.accepted} accepted</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-slate-800/50 border-white/[0.08]">
          <CardHeader>
            <CardTitle className="text-white">User Signups (Last 14 Days)</CardTitle>
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
                    <div className="text-[10px] text-slate-500 mt-1 -rotate-45 origin-top-left">
                      {day.date.slice(5)}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-white/[0.08]">
          <CardHeader>
            <CardTitle className="text-white">Top Users by Subdomains</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.topUsers.map((user, index) => (
                <div key={user.userId} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-6 w-6 rounded-full bg-gradient-to-br from-blue-600 to-orange-500 flex items-center justify-center text-xs font-medium text-white">
                      {index + 1}
                    </div>
                    <span className="text-sm text-slate-300 truncate max-w-[200px]">{user.email}</span>
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
    return "text-slate-400 bg-slate-500/10 border-slate-500/20"
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-white">Activity Log</h2>
          <p className="text-sm text-slate-400">Platform-wide activity history</p>
        </div>
        <Button onClick={fetchLogs} variant="outline" size="sm" className="bg-transparent border-white/10 text-slate-300 hover:text-white hover:bg-white/5">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Card className="bg-slate-800/50 border-white/[0.08]">
        <div className="divide-y divide-white/[0.05]">
          {loading ? (
            <div className="py-12 text-center">
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-orange-400" />
            </div>
          ) : logs.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <History className="h-12 w-12 text-slate-700 mx-auto mb-4" />
              <p>No activity logged yet</p>
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-white/[0.02]">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      <Activity className="h-4 w-4 text-slate-500" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge className={getActionColor(log.action)}>
                          {formatAction(log.action)}
                        </Badge>
                        {log.targetType && (
                          <span className="text-sm text-slate-400">
                            on {log.targetType}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-slate-400 mt-1">
                        {log.actorEmail || "System"}
                        {log.ipAddress && <span className="ml-2 text-slate-500">({log.ipAddress})</span>}
                      </div>
                      {Object.keys(log.details).length > 0 && (
                        <details className="mt-2">
                          <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-300">
                            View details
                          </summary>
                          <pre className="mt-1 text-xs bg-slate-900/50 text-slate-400 p-2 rounded overflow-x-auto border border-white/[0.05]">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                  <div className="text-sm text-slate-500">
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
          <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
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
      ARCHIVED: "bg-slate-500/10 text-slate-400 border-slate-500/20",
    }
    return <Badge className={colors[status] || "bg-slate-500/10"}>{status}</Badge>
  }

  const newCount = feedback.filter((f) => f.status === "NEW").length

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-white">User Feedback</h2>
          <p className="text-sm text-slate-400">
            {newCount > 0 ? `${newCount} new feedback items` : "Review and respond to user feedback"}
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-white/[0.08] rounded-md text-sm bg-slate-800/50 text-white"
          >
            <option value="all">All Status</option>
            <option value="NEW">New</option>
            <option value="REVIEWED">Reviewed</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="ARCHIVED">Archived</option>
          </select>
          <Button onClick={fetchFeedback} variant="outline" size="sm" className="bg-transparent border-white/10 text-slate-300 hover:text-white hover:bg-white/5">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Feedback List */}
        <div className="lg:col-span-2">
          <Card className="bg-slate-800/50 border-white/[0.08]">
            <div className="divide-y divide-white/[0.05] max-h-[600px] overflow-y-auto">
              {loading ? (
                <div className="py-12 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-orange-400" />
                </div>
              ) : feedback.length === 0 ? (
                <div className="py-12 text-center text-slate-500">
                  <MessageSquare className="h-12 w-12 text-slate-700 mx-auto mb-4" />
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
                    className={`p-4 cursor-pointer hover:bg-white/[0.02] transition-colors ${
                      selectedItem?.id === item.id ? "bg-blue-500/10 border-l-2 border-l-blue-500" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        {getTypeIcon(item.type)}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm text-white">
                              {item.subject || item.message.slice(0, 40) + "..."}
                            </span>
                            {getStatusBadge(item.status)}
                          </div>
                          <div className="text-xs text-slate-400 mt-1">
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
          <Card className="sticky top-4 bg-slate-800/50 border-white/[0.08]">
            <CardHeader>
              <CardTitle className="text-lg text-white">Details</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedItem ? (
                <div className="space-y-4">
                  <div>
                    <Label className="text-xs text-slate-500">Type</Label>
                    <div className="flex items-center gap-2 mt-1">
                      {getTypeIcon(selectedItem.type)}
                      <span className="font-medium text-white">{selectedItem.type}</span>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs text-slate-500">From</Label>
                    <p className="text-sm text-white">{selectedItem.userName || "Unknown"}</p>
                    <p className="text-xs text-slate-400">{selectedItem.userEmail}</p>
                  </div>

                  <div>
                    <Label className="text-xs text-slate-500">Message</Label>
                    <p className="text-sm mt-1 whitespace-pre-wrap bg-slate-900/50 p-2 rounded border border-white/[0.05] text-slate-300">
                      {selectedItem.message}
                    </p>
                  </div>

                  {selectedItem.pageUrl && (
                    <div>
                      <Label className="text-xs text-slate-500">Page URL</Label>
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
                    <Label className="text-xs text-slate-500">Status</Label>
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
                            : "bg-transparent border-white/10 text-slate-300 hover:text-white hover:bg-white/5"}`}
                        >
                          {status.replace("_", " ")}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs text-slate-500">Admin Notes</Label>
                    <textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      className="w-full mt-1 p-2 bg-slate-900/50 border border-white/[0.08] rounded-md text-sm text-white placeholder:text-slate-500"
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
                <p className="text-sm text-slate-500">Select a feedback item to view details</p>
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
        <h2 className="text-xl font-semibold text-white">Platform Settings</h2>
        <div className="py-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-orange-400" />
        </div>
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-white">Platform Settings</h2>
        <Card className="bg-slate-800/50 border-white/[0.08]">
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">Failed to load settings</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-white">Platform Settings</h2>
        <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-blue-700 to-orange-500 hover:from-blue-600 hover:to-orange-400 text-white border-0">
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Save Changes
        </Button>
      </div>

      <div className="grid gap-6">
        <Card className="bg-slate-800/50 border-white/[0.08]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Settings className="h-5 w-5 text-orange-400" />
              General Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="platformName" className="text-slate-300">Platform Name</Label>
                <Input
                  id="platformName"
                  value={settings.platformName}
                  onChange={(e) => updateSetting("platformName", e.target.value)}
                  className="bg-slate-900/50 border-white/[0.08] text-white placeholder:text-slate-500 focus:border-blue-500/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supportEmail" className="text-slate-300">Support Email</Label>
                <Input
                  id="supportEmail"
                  type="email"
                  value={settings.supportEmail}
                  onChange={(e) => updateSetting("supportEmail", e.target.value)}
                  className="bg-slate-900/50 border-white/[0.08] text-white placeholder:text-slate-500 focus:border-blue-500/50"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-white/[0.08]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Shield className="h-5 w-5 text-orange-400" />
              Access Control
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-white/[0.05]">
              <div>
                <Label className="text-white">Registration Enabled</Label>
                <p className="text-sm text-slate-400">Allow new users to sign up</p>
              </div>
              <Switch
                checked={settings.registrationEnabled}
                onCheckedChange={(v) => updateSetting("registrationEnabled", v)}
              />
            </div>
            <div className="flex items-center justify-between py-2 border-b border-white/[0.05]">
              <div>
                <Label className="text-white">Invite Only Mode</Label>
                <p className="text-sm text-slate-400">Require invitation to sign up</p>
              </div>
              <Switch
                checked={settings.inviteOnlyMode}
                onCheckedChange={(v) => updateSetting("inviteOnlyMode", v)}
              />
            </div>
            <div className="flex items-center justify-between py-2 border-b border-white/[0.05]">
              <div>
                <Label className="text-white">Maintenance Mode</Label>
                <p className="text-sm text-slate-400">Temporarily disable access for non-admins</p>
              </div>
              <Switch
                checked={settings.maintenanceMode}
                onCheckedChange={(v) => updateSetting("maintenanceMode", v)}
              />
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <Label className="text-white">Require Email Verification</Label>
                <p className="text-sm text-slate-400">Users must verify email before access</p>
              </div>
              <Switch
                checked={settings.requireEmailVerification}
                onCheckedChange={(v) => updateSetting("requireEmailVerification", v)}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-white/[0.08]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Database className="h-5 w-5 text-orange-400" />
              Limits
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="maxSubdomains" className="text-slate-300">Max Subdomains per User</Label>
                <Input
                  id="maxSubdomains"
                  type="number"
                  value={settings.maxSubdomainsPerUser}
                  onChange={(e) => updateSetting("maxSubdomainsPerUser", parseInt(e.target.value) || 0)}
                  className="bg-slate-900/50 border-white/[0.08] text-white placeholder:text-slate-500 focus:border-blue-500/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxTeams" className="text-slate-300">Max Teams per User</Label>
                <Input
                  id="maxTeams"
                  type="number"
                  value={settings.maxTeamsPerUser}
                  onChange={(e) => updateSetting("maxTeamsPerUser", parseInt(e.target.value) || 0)}
                  className="bg-slate-900/50 border-white/[0.08] text-white placeholder:text-slate-500 focus:border-blue-500/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxMembers" className="text-slate-300">Max Members per Team</Label>
                <Input
                  id="maxMembers"
                  type="number"
                  value={settings.maxMembersPerTeam}
                  onChange={(e) => updateSetting("maxMembersPerTeam", parseInt(e.target.value) || 0)}
                  className="bg-slate-900/50 border-white/[0.08] text-white placeholder:text-slate-500 focus:border-blue-500/50"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-white/[0.08]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Globe className="h-5 w-5 text-orange-400" />
              Features
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-white/[0.05]">
              <div>
                <Label className="text-white">Allow Custom Domains</Label>
                <p className="text-sm text-slate-400">Let users connect their own domains</p>
              </div>
              <Switch
                checked={settings.allowCustomDomains}
                onCheckedChange={(v) => updateSetting("allowCustomDomains", v)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="trialDays" className="text-slate-300">Default Trial Days</Label>
              <Input
                id="trialDays"
                type="number"
                className="w-32 bg-slate-900/50 border-white/[0.08] text-white placeholder:text-slate-500 focus:border-blue-500/50"
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

function AICreditsSection({ adminUserId }: { adminUserId: string }) {
  const [balances, setBalances] = useState<CreditBalance[]>([])
  const [stats, setStats] = useState<CreditStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedUser, setSelectedUser] = useState<CreditBalance | null>(null)
  const [grantAmount, setGrantAmount] = useState("")
  const [grantType, setGrantType] = useState<"monthly" | "purchased">("purchased")
  const [grantReason, setGrantReason] = useState("")
  const [granting, setGranting] = useState(false)

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
        }),
      })
      if (res.ok) {
        setGrantAmount("")
        setGrantReason("")
        setSelectedUser(null)
        fetchBalances()
      }
    } catch (error) {
      console.error("Failed to grant credits:", error)
    } finally {
      setGranting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-white">AI Credits Management</h2>
          <p className="text-sm text-slate-400">Monitor and allocate AI credits across all users</p>
        </div>
        <Button onClick={fetchBalances} variant="outline" size="sm" className="bg-transparent border-white/10 text-slate-300 hover:text-white hover:bg-white/5">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-5">
          <Card className="bg-slate-800/50 border-white/[0.08]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Total Platform Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.totalUsers}</div>
              {stats.usersWithCredits !== undefined && (
                <p className="text-xs text-slate-400 mt-1">{stats.usersWithCredits} with credits</p>
              )}
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-white/[0.08]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Total Monthly Credits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-400">{stats.totalMonthlyCredits.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-white/[0.08]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Total Purchased Credits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-400">{stats.totalPurchasedCredits.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-white/[0.08]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Total Used Credits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-400">{stats.totalUsedCredits.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Search by email or name..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="pl-10 bg-slate-800/50 border-white/[0.08] text-white placeholder:text-slate-500 focus:border-blue-500/50"
          />
        </div>
      </div>

      {/* Balances Table */}
      <Card className="bg-slate-800/50 border-white/[0.08] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-white/[0.08] hover:bg-transparent">
              <TableHead className="text-slate-400">User</TableHead>
              <TableHead className="text-slate-400">Status</TableHead>
              <TableHead className="text-right text-slate-400">Monthly</TableHead>
              <TableHead className="text-right text-slate-400">Purchased</TableHead>
              <TableHead className="text-right text-slate-400">Total</TableHead>
              <TableHead className="text-right text-slate-400">Lifetime Used</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow className="border-white/[0.08]">
                <TableCell colSpan={7} className="text-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-orange-400" />
                </TableCell>
              </TableRow>
            ) : balances.length === 0 ? (
              <TableRow className="border-white/[0.08]">
                <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              balances.map((balance) => (
                <TableRow key={balance.userId} className={`border-white/[0.08] hover:bg-white/[0.02] ${balance.hasCredits === false ? "opacity-60" : ""}`}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                        balance.hasCredits !== false
                          ? "bg-gradient-to-br from-blue-600 to-orange-500"
                          : "bg-slate-700"
                      }`}>
                        <Sparkles className={`h-4 w-4 ${balance.hasCredits !== false ? "text-white" : "text-slate-500"}`} />
                      </div>
                      <div>
                        <div className="font-medium text-white">{balance.userDisplayName || balance.userEmail || "Unknown"}</div>
                        <div className="text-sm text-slate-400">{balance.userEmail}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {balance.hasCredits !== false ? (
                      <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                        Has Credits
                      </Badge>
                    ) : (
                      <Badge className="bg-slate-700 text-slate-400">
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
                  <TableCell className="text-right font-bold text-white">
                    {balance.totalBalance.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right text-slate-400">
                    {balance.lifetimeUsed.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedUser(balance)}
                      title="Grant credits"
                      className="text-orange-400 hover:text-orange-300 hover:bg-blue-500/10"
                    >
                      <Gift className="h-4 w-4" />
                    </Button>
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
          <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
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

      {/* Grant Credits Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Grant AI Credits</DialogTitle>
            <DialogDescription>
              Grant credits to {selectedUser?.userDisplayName || selectedUser?.userEmail}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Current Monthly</Label>
                <p className="text-lg font-medium text-blue-600">
                  {selectedUser?.monthlyBalance.toLocaleString()}
                </p>
              </div>
              <div>
                <Label>Current Purchased</Label>
                <p className="text-lg font-medium text-green-600">
                  {selectedUser?.purchasedBalance.toLocaleString()}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Credits to Grant</Label>
              <Input
                id="amount"
                type="number"
                placeholder="100"
                value={grantAmount}
                onChange={(e) => setGrantAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Credit Type</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="creditType"
                    checked={grantType === "purchased"}
                    onChange={() => setGrantType("purchased")}
                  />
                  <span className="text-sm">Purchased (never expires)</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="creditType"
                    checked={grantType === "monthly"}
                    onChange={() => setGrantType("monthly")}
                  />
                  <span className="text-sm">Monthly (can rollover)</span>
                </label>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Reason (optional)</Label>
              <Input
                id="reason"
                placeholder="Promotional grant, support resolution, etc."
                value={grantReason}
                onChange={(e) => setGrantReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedUser(null)}>
              Cancel
            </Button>
            <Button onClick={handleGrantCredits} disabled={granting || !grantAmount}>
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
          <h2 className="text-xl font-semibold text-white">User Overrides</h2>
          <p className="text-sm text-slate-400">Grant special permissions and trial extensions to users</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchOverrides} variant="outline" size="sm" className="bg-transparent border-white/10 text-slate-300 hover:text-white hover:bg-white/5">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowCreateDialog(true)} size="sm" className="bg-gradient-to-r from-blue-700 to-orange-500 hover:from-blue-600 hover:to-orange-400 text-white border-0">
            <Wand2 className="h-4 w-4 mr-2" />
            Create Override
          </Button>
        </div>
      </div>

      <Card className="bg-slate-800/50 border-white/[0.08] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-white/[0.08] hover:bg-transparent">
              <TableHead className="text-slate-400">User</TableHead>
              <TableHead className="text-slate-400">Permissions</TableHead>
              <TableHead className="text-slate-400">Limits</TableHead>
              <TableHead className="text-slate-400">Reason</TableHead>
              <TableHead className="text-slate-400">Expires</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow className="border-white/[0.08]">
                <TableCell colSpan={6} className="text-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-orange-400" />
                </TableCell>
              </TableRow>
            ) : overrides.length === 0 ? (
              <TableRow className="border-white/[0.08]">
                <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                  <Wand2 className="h-12 w-12 text-slate-700 mx-auto mb-4" />
                  <p>No active overrides</p>
                </TableCell>
              </TableRow>
            ) : (
              overrides.map((override) => (
                <TableRow key={override.id} className="border-white/[0.08] hover:bg-white/[0.02]">
                  <TableCell>
                    <div className="font-medium text-white">{override.userEmail || override.userId}</div>
                    <div className="text-xs text-slate-500 font-mono">{override.userId.slice(0, 12)}...</div>
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
                    <div className="text-sm text-slate-300">
                      {override.subdomainLimitOverride && (
                        <div>Subdomains: {override.subdomainLimitOverride}</div>
                      )}
                      {override.monthlyCreditAllocation && (
                        <div>+{override.monthlyCreditAllocation} credits/mo</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-slate-400 max-w-[150px] truncate">
                    {override.grantReason || "-"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {override.expiresAt ? (
                      <span className={new Date(override.expiresAt) < new Date() ? "text-red-400" : "text-slate-300"}>
                        {new Date(override.expiresAt).toLocaleDateString()}
                      </span>
                    ) : (
                      <span className="text-slate-500">Never</span>
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
      default:
        return <OverviewSection />
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-950">
      <AdminSidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        pendingClientsCount={clientStats?.pendingApproval}
      />

      <div className="flex-1 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950">
        <AdminHeader />

        <main className="p-6">{renderActiveSection()}</main>
      </div>

      {state.error && (
        <div className="fixed bottom-4 right-4 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg shadow-lg backdrop-blur-sm z-50">
          {state.error}
        </div>
      )}

      {state.success && (
        <div className="fixed bottom-4 right-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-lg shadow-lg backdrop-blur-sm z-50">
          {state.success}
        </div>
      )}
    </div>
  )
}
