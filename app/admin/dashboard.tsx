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
          <h1 className="text-2xl font-bold text-gray-900">Super Admin Dashboard</h1>
          <p className="text-sm text-gray-500">Platform-wide administration</p>
        </div>
        <div className="flex items-center gap-4">
          {user && (
            <div className="flex items-center gap-3 bg-purple-50 px-4 py-2 rounded-lg border border-purple-100">
              <Crown className="h-4 w-4 text-purple-600" />
              <div className="text-sm">
                <div className="font-medium text-purple-900">{user.displayName || user.primaryEmail}</div>
                <div className="text-purple-600">Super Admin</div>
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Subdomain Management</h2>
          <p className="text-sm text-gray-500">{total} total subdomains - Assign ownership to users</p>
        </div>
        <Button onClick={fetchSubdomains} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search subdomains..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="pl-10"
          />
        </div>
      </div>

      {/* Subdomains Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Subdomain</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Teams</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : subdomains.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-gray-500">
                  <Globe className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p>No subdomains found</p>
                </TableCell>
              </TableRow>
            ) : (
              subdomains.map((sub) => (
                <TableRow key={sub.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{sub.emoji}</span>
                      <div>
                        <div className="font-medium">{sub.subdomain}</div>
                        <a
                          href={`${protocol}://${sub.subdomain}.${rootDomain}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-500 hover:underline"
                        >
                          Visit →
                        </a>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {sub.owner ? (
                      <div>
                        <div className="font-medium text-sm">{sub.owner.displayName || sub.owner.email}</div>
                        {sub.owner.displayName && (
                          <div className="text-xs text-gray-500">{sub.owner.email}</div>
                        )}
                      </div>
                    ) : (
                      <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">
                        No Owner
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {new Date(sub.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {sub.teamShareCount > 0 ? (
                      <Badge variant="secondary">{sub.teamShareCount} teams</Badge>
                    ) : (
                      <span className="text-gray-400">-</span>
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
                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
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
          <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
          <p className="text-sm text-gray-500">{total} total users</p>
        </div>
        <Button onClick={fetchUsers} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by email or name..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="pl-10"
          />
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Subdomains</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-gray-500">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-gray-500" />
                      </div>
                      <div>
                        <div className="font-medium">{user.displayName || user.email}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
                  </TableCell>
                  <TableCell>{user.subdomainCount}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {user.isSuperAdmin && (
                        <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">
                          <Crown className="h-3 w-3 mr-1" />
                          Super Admin
                        </Badge>
                      )}
                      {user.isAdmin && !user.isSuperAdmin && (
                        <Badge variant="secondary">Admin</Badge>
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Team Management</h2>
          <p className="text-sm text-gray-500">{total} total teams</p>
        </div>
        <Button onClick={fetchTeams} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by team name..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="pl-10"
          />
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Team</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Members</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : teams.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-gray-500">
                  No teams found
                </TableCell>
              </TableRow>
            ) : (
              teams.map((team) => (
                <TableRow key={team.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-blue-100 rounded flex items-center justify-center">
                        <Building2 className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium">{team.name}</div>
                        {team.description && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {team.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm text-gray-500">
                    {team.slug}
                  </TableCell>
                  <TableCell>{team.memberCount}</TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {new Date(team.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">
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
        <h2 className="text-xl font-semibold text-gray-900">Platform Analytics</h2>
        <div className="py-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900">Platform Analytics</h2>
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Failed to load analytics</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Platform Analytics</h2>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Total Users</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.users.total}</div>
            <p className="text-xs text-green-600 mt-1">+{analytics.users.newLast30Days} last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Subdomains</CardTitle>
              <Globe className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.subdomains.total}</div>
            <p className="text-xs text-green-600 mt-1">+{analytics.subdomains.last7Days} this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Teams</CardTitle>
              <Building2 className="h-4 w-4 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.teams.total}</div>
            <p className="text-xs text-gray-500 mt-1">Avg {analytics.teams.avgSize.toFixed(1)} members</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Pending Invites</CardTitle>
              <Mail className="h-4 w-4 text-orange-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.invitations.pending}</div>
            <p className="text-xs text-gray-500 mt-1">{analytics.invitations.accepted} accepted</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>User Signups (Last 14 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] flex items-end gap-1">
              {analytics.users.dailySignups.map((day) => {
                const maxCount = Math.max(...analytics.users.dailySignups.map((d) => d.count), 1)
                const height = (day.count / maxCount) * 100
                return (
                  <div key={day.date} className="flex-1 flex flex-col items-center">
                    <div
                      className="w-full bg-blue-500 rounded-t"
                      style={{ height: `${Math.max(height, 2)}%` }}
                      title={`${day.date}: ${day.count}`}
                    />
                    <div className="text-[10px] text-gray-400 mt-1 -rotate-45 origin-top-left">
                      {day.date.slice(5)}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Users by Subdomains</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.topUsers.map((user, index) => (
                <div key={user.userId} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium">
                      {index + 1}
                    </div>
                    <span className="text-sm truncate max-w-[200px]">{user.email}</span>
                  </div>
                  <Badge variant="secondary">{user.subdomainCount}</Badge>
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
    if (action.includes("delete") || action.includes("revoke")) return "text-red-600 bg-red-50"
    if (action.includes("create") || action.includes("grant")) return "text-green-600 bg-green-50"
    if (action.includes("update") || action.includes("edit")) return "text-blue-600 bg-blue-50"
    return "text-gray-600 bg-gray-50"
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Activity Log</h2>
          <p className="text-sm text-gray-500">Platform-wide activity history</p>
        </div>
        <Button onClick={fetchLogs} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Card>
        <div className="divide-y">
          {loading ? (
            <div className="py-12 text-center">
              <Loader2 className="h-6 w-6 animate-spin mx-auto" />
            </div>
          ) : logs.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              <History className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p>No activity logged yet</p>
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      <Activity className="h-4 w-4 text-gray-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge className={getActionColor(log.action)} variant="secondary">
                          {formatAction(log.action)}
                        </Badge>
                        {log.targetType && (
                          <span className="text-sm text-gray-500">
                            on {log.targetType}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {log.actorEmail || "System"}
                        {log.ipAddress && <span className="ml-2 text-gray-400">({log.ipAddress})</span>}
                      </div>
                      {Object.keys(log.details).length > 0 && (
                        <details className="mt-2">
                          <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">
                            View details
                          </summary>
                          <pre className="mt-1 text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                  <div className="text-sm text-gray-400">
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
      NEW: "bg-blue-100 text-blue-800",
      REVIEWED: "bg-yellow-100 text-yellow-800",
      IN_PROGRESS: "bg-purple-100 text-purple-800",
      RESOLVED: "bg-green-100 text-green-800",
      ARCHIVED: "bg-gray-100 text-gray-800",
    }
    return <Badge className={colors[status] || "bg-gray-100"}>{status}</Badge>
  }

  const newCount = feedback.filter((f) => f.status === "NEW").length

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">User Feedback</h2>
          <p className="text-sm text-gray-500">
            {newCount > 0 ? `${newCount} new feedback items` : "Review and respond to user feedback"}
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border rounded-md text-sm"
          >
            <option value="all">All Status</option>
            <option value="NEW">New</option>
            <option value="REVIEWED">Reviewed</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="ARCHIVED">Archived</option>
          </select>
          <Button onClick={fetchFeedback} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Feedback List */}
        <div className="lg:col-span-2">
          <Card>
            <div className="divide-y max-h-[600px] overflow-y-auto">
              {loading ? (
                <div className="py-12 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </div>
              ) : feedback.length === 0 ? (
                <div className="py-12 text-center text-gray-500">
                  <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
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
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedItem?.id === item.id ? "bg-blue-50" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        {getTypeIcon(item.type)}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">
                              {item.subject || item.message.slice(0, 40) + "..."}
                            </span>
                            {getStatusBadge(item.status)}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
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
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="text-lg">Details</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedItem ? (
                <div className="space-y-4">
                  <div>
                    <Label className="text-xs text-gray-500">Type</Label>
                    <div className="flex items-center gap-2 mt-1">
                      {getTypeIcon(selectedItem.type)}
                      <span className="font-medium">{selectedItem.type}</span>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs text-gray-500">From</Label>
                    <p className="text-sm">{selectedItem.userName || "Unknown"}</p>
                    <p className="text-xs text-gray-500">{selectedItem.userEmail}</p>
                  </div>

                  <div>
                    <Label className="text-xs text-gray-500">Message</Label>
                    <p className="text-sm mt-1 whitespace-pre-wrap bg-gray-50 p-2 rounded">
                      {selectedItem.message}
                    </p>
                  </div>

                  {selectedItem.pageUrl && (
                    <div>
                      <Label className="text-xs text-gray-500">Page URL</Label>
                      <a
                        href={selectedItem.pageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline break-all"
                      >
                        {selectedItem.pageUrl}
                      </a>
                    </div>
                  )}

                  <div>
                    <Label className="text-xs text-gray-500">Status</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {["NEW", "REVIEWED", "IN_PROGRESS", "RESOLVED", "ARCHIVED"].map((status) => (
                        <Button
                          key={status}
                          size="sm"
                          variant={selectedItem.status === status ? "default" : "outline"}
                          onClick={() => updateFeedbackStatus(selectedItem.id, status)}
                          disabled={updating}
                          className="text-xs"
                        >
                          {status.replace("_", " ")}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs text-gray-500">Admin Notes</Label>
                    <textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      className="w-full mt-1 p-2 border rounded-md text-sm"
                      rows={3}
                      placeholder="Add internal notes..."
                    />
                    <Button
                      size="sm"
                      onClick={saveNotes}
                      disabled={updating || adminNotes === (selectedItem.adminNotes || "")}
                      className="mt-2"
                    >
                      Save Notes
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">Select a feedback item to view details</p>
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
        <h2 className="text-xl font-semibold text-gray-900">Platform Settings</h2>
        <div className="py-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
        </div>
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900">Platform Settings</h2>
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Failed to load settings</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Platform Settings</h2>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Save Changes
        </Button>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              General Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="platformName">Platform Name</Label>
                <Input
                  id="platformName"
                  value={settings.platformName}
                  onChange={(e) => updateSetting("platformName", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supportEmail">Support Email</Label>
                <Input
                  id="supportEmail"
                  type="email"
                  value={settings.supportEmail}
                  onChange={(e) => updateSetting("supportEmail", e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Access Control
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Registration Enabled</Label>
                <p className="text-sm text-gray-500">Allow new users to sign up</p>
              </div>
              <Switch
                checked={settings.registrationEnabled}
                onCheckedChange={(v) => updateSetting("registrationEnabled", v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Invite Only Mode</Label>
                <p className="text-sm text-gray-500">Require invitation to sign up</p>
              </div>
              <Switch
                checked={settings.inviteOnlyMode}
                onCheckedChange={(v) => updateSetting("inviteOnlyMode", v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Maintenance Mode</Label>
                <p className="text-sm text-gray-500">Temporarily disable access for non-admins</p>
              </div>
              <Switch
                checked={settings.maintenanceMode}
                onCheckedChange={(v) => updateSetting("maintenanceMode", v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Require Email Verification</Label>
                <p className="text-sm text-gray-500">Users must verify email before access</p>
              </div>
              <Switch
                checked={settings.requireEmailVerification}
                onCheckedChange={(v) => updateSetting("requireEmailVerification", v)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Limits
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="maxSubdomains">Max Subdomains per User</Label>
                <Input
                  id="maxSubdomains"
                  type="number"
                  value={settings.maxSubdomainsPerUser}
                  onChange={(e) => updateSetting("maxSubdomainsPerUser", parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxTeams">Max Teams per User</Label>
                <Input
                  id="maxTeams"
                  type="number"
                  value={settings.maxTeamsPerUser}
                  onChange={(e) => updateSetting("maxTeamsPerUser", parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxMembers">Max Members per Team</Label>
                <Input
                  id="maxMembers"
                  type="number"
                  value={settings.maxMembersPerTeam}
                  onChange={(e) => updateSetting("maxMembersPerTeam", parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Features
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Allow Custom Domains</Label>
                <p className="text-sm text-gray-500">Let users connect their own domains</p>
              </div>
              <Switch
                checked={settings.allowCustomDomains}
                onCheckedChange={(v) => updateSetting("allowCustomDomains", v)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="trialDays">Default Trial Days</Label>
              <Input
                id="trialDays"
                type="number"
                className="w-32"
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
  monthlyBalance: number
  purchasedBalance: number
  totalBalance: number
  lifetimeAllocated: number
  lifetimePurchased: number
  lifetimeUsed: number
  lastAllocationDate: string | null
  updatedAt: string
}

type CreditStats = {
  totalUsers: number
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
          <h2 className="text-xl font-semibold text-gray-900">AI Credits Management</h2>
          <p className="text-sm text-gray-500">Monitor and allocate AI credits across all users</p>
        </div>
        <Button onClick={fetchBalances} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Users with Credits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Monthly Credits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.totalMonthlyCredits.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Purchased Credits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.totalPurchasedCredits.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Used Credits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.totalUsedCredits.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by email or name..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="pl-10"
          />
        </div>
      </div>

      {/* Balances Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead className="text-right">Monthly</TableHead>
              <TableHead className="text-right">Purchased</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Lifetime Used</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : balances.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-gray-500">
                  No credit balances found
                </TableCell>
              </TableRow>
            ) : (
              balances.map((balance) => (
                <TableRow key={balance.userId}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center">
                        <Sparkles className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <div className="font-medium">{balance.userDisplayName || balance.userEmail || "Unknown"}</div>
                        <div className="text-sm text-gray-500">{balance.userEmail}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium text-blue-600">
                    {balance.monthlyBalance.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-medium text-green-600">
                    {balance.purchasedBalance.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {balance.totalBalance.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right text-gray-500">
                    {balance.lifetimeUsed.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedUser(balance)}
                      title="Grant credits"
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
          <h2 className="text-xl font-semibold text-gray-900">User Overrides</h2>
          <p className="text-sm text-gray-500">Grant special permissions and trial extensions to users</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchOverrides} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowCreateDialog(true)} size="sm">
            <Wand2 className="h-4 w-4 mr-2" />
            Create Override
          </Button>
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Permissions</TableHead>
              <TableHead>Limits</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : overrides.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-gray-500">
                  <Wand2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p>No active overrides</p>
                </TableCell>
              </TableRow>
            ) : (
              overrides.map((override) => (
                <TableRow key={override.id}>
                  <TableCell>
                    <div className="font-medium">{override.userEmail || override.userId}</div>
                    <div className="text-xs text-gray-500 font-mono">{override.userId.slice(0, 12)}...</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {override.unlimitedSubdomains && (
                        <Badge className="bg-blue-100 text-blue-700">∞ Subdomains</Badge>
                      )}
                      {override.unlimitedAiCredits && (
                        <Badge className="bg-purple-100 text-purple-700">∞ AI Credits</Badge>
                      )}
                      {override.bypassPayment && (
                        <Badge className="bg-green-100 text-green-700">Free Access</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {override.subdomainLimitOverride && (
                        <div>Subdomains: {override.subdomainLimitOverride}</div>
                      )}
                      {override.monthlyCreditAllocation && (
                        <div>+{override.monthlyCreditAllocation} credits/mo</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500 max-w-[150px] truncate">
                    {override.grantReason || "-"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {override.expiresAt ? (
                      <span className={new Date(override.expiresAt) < new Date() ? "text-red-500" : ""}>
                        {new Date(override.expiresAt).toLocaleDateString()}
                      </span>
                    ) : (
                      <span className="text-gray-400">Never</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRevokeOverride(override.userId)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
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
        return <OverviewSection tenants={tenants} />
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
