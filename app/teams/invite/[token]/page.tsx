"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Loader2, CheckCircle, XCircle, Clock } from "lucide-react"
import { useUser } from "@stackframe/stack"
import { getRoleLabel } from "@/lib/team-auth"

type InvitationInfo = {
  id: string
  email: string
  role: string
  expiresAt: string
  team: {
    id: string
    name: string
    slug: string
    description: string | null
    logoUrl: string | null
  } | null
}

export default function AcceptInvitationPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const resolvedParams = use(params)
  const router = useRouter()
  const user = useUser()
  const [invitation, setInvitation] = useState<InvitationInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<"pending" | "accepted" | "expired" | "error">("pending")

  useEffect(() => {
    async function fetchInvitation() {
      try {
        const res = await fetch(`/api/teams/invitations/${resolvedParams.token}`)
        const data = await res.json()

        if (res.ok) {
          setInvitation(data.invitation)
        } else {
          if (data.status === "accepted") {
            setStatus("accepted")
          } else if (data.status === "expired") {
            setStatus("expired")
          } else {
            setError(data.error || "Invalid invitation")
            setStatus("error")
          }
        }
      } catch (err) {
        setError("Failed to load invitation")
        setStatus("error")
      } finally {
        setLoading(false)
      }
    }
    fetchInvitation()
  }, [resolvedParams.token])

  const handleAccept = async () => {
    if (!user) {
      // Redirect to login with return URL
      router.push(`/login?redirect=/teams/invite/${resolvedParams.token}`)
      return
    }

    setAccepting(true)
    setError(null)

    try {
      const res = await fetch(`/api/teams/invitations/${resolvedParams.token}/accept`, {
        method: "POST",
      })
      const data = await res.json()

      if (res.ok) {
        router.push(data.redirectUrl)
      } else {
        setError(data.message || data.error || "Failed to accept invitation")
      }
    } catch (err) {
      setError("An error occurred")
    } finally {
      setAccepting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (status === "accepted") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Already Accepted</h2>
            <p className="text-gray-500 mb-6">
              This invitation has already been accepted.
            </p>
            <Button onClick={() => router.push("/dashboard/teams")}>
              Go to Teams
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (status === "expired") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <Clock className="h-16 w-16 text-orange-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Invitation Expired</h2>
            <p className="text-gray-500 mb-6">
              This invitation has expired. Please ask the team admin to send a new
              invitation.
            </p>
            <Button variant="outline" onClick={() => router.push("/")}>
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (status === "error" || !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Invalid Invitation</h2>
            <p className="text-gray-500 mb-6">
              {error || "This invitation link is invalid or has been revoked."}
            </p>
            <Button variant="outline" onClick={() => router.push("/")}>
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center pb-2">
          <div className="h-16 w-16 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Building2 className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-xl">Team Invitation</CardTitle>
          <CardDescription>
            You've been invited to join a team
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <h3 className="text-lg font-semibold">{invitation.team?.name}</h3>
            {invitation.team?.description && (
              <p className="text-sm text-gray-500 mt-1">
                {invitation.team.description}
              </p>
            )}
            <p className="text-sm text-blue-600 mt-2">
              You'll join as a <strong>{getRoleLabel(invitation.role as any)}</strong>
            </p>
          </div>

          <div className="text-center text-sm text-gray-500">
            Invitation sent to <strong>{invitation.email}</strong>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg text-center">
              {error}
            </div>
          )}

          {!user ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-500 text-center">
                Sign in to accept this invitation
              </p>
              <Button
                className="w-full"
                onClick={() =>
                  router.push(`/login?redirect=/teams/invite/${resolvedParams.token}`)
                }
              >
                Sign In to Accept
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() =>
                  router.push(`/signup?redirect=/teams/invite/${resolvedParams.token}`)
                }
              >
                Create Account
              </Button>
            </div>
          ) : user.primaryEmail?.toLowerCase() !== invitation.email.toLowerCase() ? (
            <div className="space-y-3">
              <div className="bg-orange-50 text-orange-700 text-sm px-4 py-3 rounded-lg">
                <p className="font-medium">Email Mismatch</p>
                <p className="mt-1">
                  This invitation was sent to <strong>{invitation.email}</strong>,
                  but you're signed in as <strong>{user.primaryEmail}</strong>.
                </p>
              </div>
              <Button variant="outline" className="w-full" onClick={() => router.push("/login")}>
                Sign in with {invitation.email}
              </Button>
            </div>
          ) : (
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => router.push("/dashboard/teams")}
              >
                Decline
              </Button>
              <Button
                className="flex-1"
                onClick={handleAccept}
                disabled={accepting}
              >
                {accepting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Accept Invitation"
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
