"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Building2,
  Plus,
  Users,
  Globe,
  ChevronRight,
  Loader2,
  Mail,
} from "lucide-react"
import { getRoleLabel } from "@/lib/team-utils"

type Team = {
  id: string
  name: string
  slug: string
  description: string | null
  memberCount: number
  createdAt: string
}

type Invitation = {
  id: string
  teamId: string
  email: string
  role: string
  token: string
  team: {
    name: string
    description: string | null
  } | null
}

export default function TeamsPage() {
  const router = useRouter()
  const [teams, setTeams] = useState<Team[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/teams")
        if (res.ok) {
          const data = await res.json()
          setTeams(data.teams)
        }
      } catch (error) {
        console.error("Failed to fetch teams:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleAcceptInvitation = async (token: string) => {
    try {
      const res = await fetch(`/api/teams/invitations/${token}/accept`, {
        method: "POST",
      })
      if (res.ok) {
        const data = await res.json()
        router.push(data.redirectUrl)
      }
    } catch (error) {
      console.error("Failed to accept invitation:", error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Teams</h1>
          <p className="text-muted-foreground">
            Collaborate with others on your projects
          </p>
        </div>
        <Button onClick={() => router.push("/dashboard/teams/create")}>
          <Plus className="h-4 w-4 mr-2" />
          Create Team
        </Button>
      </div>

      {invitations.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Pending Invitations</h2>
          <div className="grid gap-4">
            {invitations.map((invitation) => (
              <Card key={invitation.id} className="border-blue-200 bg-blue-50">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Mail className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">
                        You've been invited to join{" "}
                        <span className="font-semibold">{invitation.team?.name}</span>
                      </p>
                      <p className="text-sm text-gray-500">
                        As a {getRoleLabel(invitation.role as any)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAcceptInvitation(invitation.token)}
                    >
                      Accept
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {teams.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building2 className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No teams yet</h3>
            <p className="text-gray-500 mb-4 max-w-sm mx-auto">
              Create a team to collaborate with others on your subdomains and projects
            </p>
            <Button onClick={() => router.push("/dashboard/teams/create")}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Team
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <Card
              key={team.id}
              className="cursor-pointer hover:border-gray-300 transition-colors"
              onClick={() => router.push(`/dashboard/teams/${team.id}`)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-blue-600" />
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
                <CardTitle className="mt-4">{team.name}</CardTitle>
                {team.description && (
                  <CardDescription className="line-clamp-2">
                    {team.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{team.memberCount} members</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
