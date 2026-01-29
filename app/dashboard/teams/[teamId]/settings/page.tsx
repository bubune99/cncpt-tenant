"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { ArrowLeft, Building2, Loader2, Trash2 } from "lucide-react"

type Team = {
  id: string
  name: string
  slug: string
  description: string | null
  billingEmail: string | null
}

export default function TeamSettingsPage({
  params,
}: {
  params: Promise<{ teamId: string }>
}) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [team, setTeam] = useState<Team | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState("")

  // Form state
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [billingEmail, setBillingEmail] = useState("")

  useEffect(() => {
    async function fetchTeam() {
      try {
        const res = await fetch(`/api/teams/${resolvedParams.teamId}`)
        if (res.ok) {
          const data = await res.json()
          setTeam(data.team)
          setName(data.team.name)
          setDescription(data.team.description || "")
          setBillingEmail(data.team.billingEmail || "")
        } else if (res.status === 403) {
          router.push("/dashboard/teams")
        }
      } catch (error) {
        console.error("Failed to fetch team:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchTeam()
  }, [resolvedParams.teamId])

  const handleSave = async () => {
    setError("")
    if (!name.trim()) {
      setError("Team name is required")
      return
    }

    setSaving(true)
    try {
      const res = await fetch(`/api/teams/${resolvedParams.teamId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          billingEmail: billingEmail.trim() || null,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setTeam(data.team)
      } else {
        const data = await res.json()
        setError(data.error || "Failed to save changes")
      }
    } catch (err) {
      setError("An error occurred")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const res = await fetch(`/api/teams/${resolvedParams.teamId}`, {
        method: "DELETE",
      })

      if (res.ok) {
        router.push("/dashboard/teams")
      } else {
        const data = await res.json()
        setError(data.error || "Failed to delete team")
      }
    } catch (err) {
      setError("An error occurred")
    } finally {
      setDeleting(false)
    }
  }

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
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push(`/dashboard/teams/${team.id}`)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Team Settings</h1>
          <p className="text-muted-foreground">{team.name}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Update your team's profile information
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Team Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={255}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Team Slug</Label>
            <Input id="slug" value={team.slug} disabled className="bg-gray-50" />
            <p className="text-sm text-gray-500">
              The slug cannot be changed after creation
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="billingEmail">Billing Email</Label>
            <Input
              id="billingEmail"
              type="email"
              value={billingEmail}
              onChange={(e) => setBillingEmail(e.target.value)}
              placeholder="billing@example.com"
            />
            <p className="text-sm text-gray-500">
              Email for billing notifications and invoices
            </p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">Danger Zone</CardTitle>
          <CardDescription>
            Irreversible actions that will affect your team
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Delete Team</p>
              <p className="text-sm text-gray-500">
                Permanently delete this team and remove all members
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Team
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Team</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete "{team.name}"? This action
                    cannot be undone. All team members will be removed and shared
                    subdomains will no longer be accessible to the team.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={deleting}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {deleting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Delete Team"
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
