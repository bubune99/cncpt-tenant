"use client"

import type React from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, Trash2, Settings, BarChart3 } from "lucide-react"
import { deleteSubdomainAction } from "@/app/actions"
import { useState } from "react"
import { rootDomain, protocol } from "@/lib/utils"
import Link from "next/link"

interface Subdomain {
  subdomain: string
  emoji: string
  created_at: string
  site_title?: string
}

interface SubdomainListProps {
  subdomains: Subdomain[]
}

function SubdomainCard({ subdomain }: { subdomain: Subdomain }) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteMessage, setDeleteMessage] = useState<string | null>(null)

  const subdomainUrl = `${protocol}://${subdomain.subdomain}.${rootDomain}`
  const adminUrl = `${protocol}://${subdomain.subdomain}.${rootDomain}/admin`
  const createdDate = new Date(subdomain.created_at).toLocaleDateString()

  const handleDelete = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsDeleting(true)
    setDeleteMessage(null)

    try {
      const formData = new FormData(e.currentTarget)
      const result = await deleteSubdomainAction({}, formData)
      if (result?.success) {
        setDeleteMessage(result.success)
      }
    } catch (error) {
      console.error("[v0] Error deleting subdomain:", error)
      setDeleteMessage("Failed to delete subdomain")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-3xl">{subdomain.emoji}</div>
            <div>
              <h3 className="font-semibold text-lg">
                {subdomain.site_title || `${subdomain.subdomain}.${rootDomain}`}
              </h3>
              <p className="text-sm text-muted-foreground">
                {subdomain.subdomain}.{rootDomain}
              </p>
              <p className="text-xs text-muted-foreground">Created on {createdDate}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Badge variant="secondary">Active</Badge>

            <Button variant="outline" size="sm" asChild>
              <Link href={subdomainUrl} target="_blank">
                <ExternalLink className="h-4 w-4 mr-2" />
                Visit Site
              </Link>
            </Button>

            <Button variant="outline" size="sm" asChild>
              <Link href={adminUrl} target="_blank">
                <Settings className="h-4 w-4 mr-2" />
                Manage
              </Link>
            </Button>

            <Button variant="outline" size="sm" asChild>
              <Link href={`/dashboard/subdomain/${subdomain.subdomain}/analytics`}>
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
              </Link>
            </Button>

            <form onSubmit={handleDelete}>
              <input type="hidden" name="subdomain" value={subdomain.subdomain} />
              <Button
                variant="outline"
                size="sm"
                type="submit"
                disabled={isDeleting}
                className="text-destructive hover:text-destructive bg-transparent"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </form>
          </div>
        </div>

        {deleteMessage && <div className="mt-4 text-sm text-green-600">{deleteMessage}</div>}
      </CardContent>
    </Card>
  )
}

export function SubdomainList({ subdomains }: SubdomainListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Subdomains</CardTitle>
        <CardDescription>Manage and monitor all your active subdomains</CardDescription>
      </CardHeader>
      <CardContent>
        {subdomains.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">You haven't created any subdomains yet</p>
            <p className="text-sm text-muted-foreground">Create your first subdomain above to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            {subdomains.map((subdomain) => (
              <SubdomainCard key={subdomain.subdomain} subdomain={subdomain} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
