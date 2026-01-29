"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Building2,
  Users,
  Globe,
  Settings,
  ArrowLeft,
  Loader2,
  Plus,
  Mail,
  MoreHorizontal,
  Trash2,
  Crown,
  Shield,
  User,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getRoleLabel, getRoleDescription } from "@/lib/team-auth"
import type { TeamRole } from "@/lib/team-auth"

type Team = {
  id: string
  name: string
  slug: string
  description: string | null
  ownerId: string
  createdAt: string
}

type TeamMember = {
  id: string
  userId: string
  email: string
  displayName: string | null
  role: TeamRole
  acceptedAt: string | null
}

type TeamInvitation = {
  id: string
  email: string
  role: TeamRole
  expiresAt: string
  createdAt: string
}

type TeamSubdomain = {
  id: string
  subdomain: string
  accessLevel: string
  emoji: string | null
  owner: { email: string } | null
}

type Membership = {
  id: string
  role: TeamRole
}

export default function TeamDashboardPage({
  params,
}: {
  params: Promise<{ teamId: string }>
}) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [team, setTeam] = useState<Team | null>(null)
  const [membership, setMembership] = useState<Membership | null>(null)
  const [members, setMembers] = useState<TeamMember[]>([])
  const [invitations, setInvitations] = useState<TeamInvitation[]>([])
  const [subdomains, setSubdomains] = useState<TeamSubdomain[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("members")

  // Invite dialog state
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<TeamRole>("member")
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteError, setInviteError] = useState("")

  const fetchTeam = async () => {
    try {
      const res = await fetch(`/api/teams/${resolvedParams.teamId}`)
      if (res.ok) {
        const data = await res.json()
        setTeam(data.team)
        setMembership(data.membership)
      } else if (res.status === 403) {
        router.push("/dashboard/teams")
      }
    } catch (error) {
      console.error("Failed to fetch team:", error)
    }
  }

  const fetchMembers = async () => {
    try {
      const res = await fetch(`/api/teams/${resolvedParams.teamId}/members`)
      if (res.ok) {
        const data = await res.json()
        setMembers(data.members)
      }
    } catch (error) {
      console.error("Failed to fetch members:", error)
    }
  }

  const fetchInvitations = async () => {
    try {
      const res = await fetch(`/api/teams/${resolvedParams.teamId}/invitations`)
      if (res.ok) {
        const data = await res.json()
        setInvitations(data.invitations)
      }
    } catch (error) {
      console.error("Failed to fetch invitations:", error)
    }
  }

  const fetchSubdomains = async () => {
    try {
      const res = await fetch(`/api/teams/${resolvedParams.teamId}/subdomains`)
      if (res.ok) {
        const data = await res.json()
        setSubdomains(data.subdomains)
      }
    } catch (error) {
      console.error("Failed to fetch subdomains:", error)
    }
  }

  useEffect(() => {
    async function loadData() {
      await fetchTeam()
      await Promise.all([fetchMembers(), fetchInvitations(), fetchSubdomains()])
      setLoading(false)
    }
    loadData()
  }, [resolvedParams.teamId])

  const handleInvite = async () => {
    setInviteError("")
    if (!inviteEmail.trim()) {
      setInviteError("Email is required")
      return
    }

    setInviteLoading(true)
    try {
      const res = await fetch(`/api/teams/${resolvedParams.teamId}/invitations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      })

      if (res.ok) {
        setInviteOpen(false)
        setInviteEmail("")
        setInviteRole("member")
        fetchInvitations()
      } else {
        const data = await res.json()
        setInviteError(data.error || "Failed to send invitation")
      }
    } catch (error) {
      setInviteError("An error occurred")
    } finally {
      setInviteLoading(false)
    }
  }

  const handleCancelInvitation = async (inviteId: string) => {
    try {
      const res = await fetch(
        `/api/teams/${resolvedParams.teamId}/invitations/${inviteId}`,
        { method: "DELETE" }
      )
      if (res.ok) {
        fetchInvitations()
      }
    } catch (error) {
      console.error("Failed to cancel invitation:", error)
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    try {
      const res = await fetch(
        `/api/teams/${resolvedParams.teamId}/members/${memberId}`,
        { method: "DELETE" }
      )
      if (res.ok) {
        fetchMembers()
      }
    } catch (error) {
      console.error("Failed to remove member:", error)
    }
  }

  const getRoleIcon = (role: TeamRole) => {
    switch (role) {
      case "owner":
        return <Crown className="h-4 w-4 text-yellow-500" />
      case "admin":
        return <Shield className="h-4 w-4 text-blue-500" />
      default:
        return <User className="h-4 w-4 text-gray-400" />
    }
  }

  const canManageMembers = membership?.role === "owner" || membership?.role === "admin"

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!team) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Team not found</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/dashboard/teams")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-4 flex-1">
          <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <Building2 className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{team.name}</h1>
            {team.description && (
              <p className="text-muted-foreground">{team.description}</p>
            )}
          </div>
        </div>
        {membership?.role === "owner" && (
          <Button
            variant="outline"
            onClick={() => router.push(`/dashboard/teams/${team.id}/settings`)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="members" className="gap-2">
            <Users className="h-4 w-4" />
            Members ({members.length})
          </TabsTrigger>
          <TabsTrigger value="subdomains" className="gap-2">
            <Globe className="h-4 w-4" />
            Subdomains ({subdomains.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Team Members</h2>
            {canManageMembers && (
              <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Invite Member
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Invite Team Member</DialogTitle>
                    <DialogDescription>
                      Send an invitation to join this team
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="colleague@example.com"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <Select
                        value={inviteRole}
                        onValueChange={(v) => setInviteRole(v as TeamRole)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="member">Member</SelectItem>
                          <SelectItem value="viewer">Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-gray-500">
                        {getRoleDescription(inviteRole)}
                      </p>
                    </div>
                    {inviteError && (
                      <p className="text-sm text-red-600">{inviteError}</p>
                    )}
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setInviteOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleInvite} disabled={inviteLoading}>
                      {inviteLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Send Invitation"
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {invitations.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Pending Invitations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="divide-y">
                  {invitations.map((inv) => (
                    <div
                      key={inv.id}
                      className="flex items-center justify-between py-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <Mail className="h-4 w-4 text-gray-400" />
                        </div>
                        <div>
                          <p className="font-medium">{inv.email}</p>
                          <p className="text-sm text-gray-500">
                            Invited as {getRoleLabel(inv.role)}
                          </p>
                        </div>
                      </div>
                      {canManageMembers && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCancelInvitation(inv.id)}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                        {getRoleIcon(member.role)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">
                            {member.displayName || member.email}
                          </p>
                          <Badge variant="outline">
                            {getRoleLabel(member.role)}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500">{member.email}</p>
                      </div>
                    </div>
                    {canManageMembers && member.role !== "owner" && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleRemoveMember(member.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subdomains" className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Shared Subdomains</h2>
          </div>

          {subdomains.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Globe className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="font-medium text-gray-900 mb-2">
                  No shared subdomains
                </h3>
                <p className="text-gray-500 text-sm max-w-sm mx-auto">
                  Team members can share their subdomains here for collaborative
                  editing
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {subdomains.map((subdomain) => (
                <Card key={subdomain.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">
                          {subdomain.emoji || "🌐"}
                        </div>
                        <div>
                          <p className="font-medium">{subdomain.subdomain}</p>
                          <p className="text-sm text-gray-500">
                            {subdomain.accessLevel} access
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline">{subdomain.accessLevel}</Badge>
                    </div>
                    {subdomain.owner && (
                      <p className="text-xs text-gray-400 mt-3">
                        Shared by {subdomain.owner.email}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
