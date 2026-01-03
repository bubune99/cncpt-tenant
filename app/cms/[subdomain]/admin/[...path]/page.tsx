"use client"

import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, ExternalLink, Construction } from "lucide-react"
import Link from "next/link"
import { rootDomain, protocol } from "@/lib/utils"

export default function CMSAdminSubPage() {
  const params = useParams()
  const router = useRouter()
  const subdomain = params.subdomain as string
  const path = (params.path as string[]) || []
  const section = path[0] || "unknown"

  const siteUrl = `${protocol}://${subdomain}.${rootDomain}`

  // Format section name for display
  const sectionTitle = section
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/cms/${subdomain}/admin`)}
                className="text-muted-foreground"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to CMS
              </Button>
              <div className="h-6 w-px bg-border" />
              <div>
                <h1 className="text-xl font-semibold">{sectionTitle}</h1>
                <p className="text-sm text-muted-foreground">{subdomain}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href={siteUrl} target="_blank">
                <ExternalLink className="h-4 w-4 mr-2" />
                View Site
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content - Placeholder for CMS sections */}
      <main className="container mx-auto px-6 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Construction className="h-5 w-5 text-yellow-500" />
              {sectionTitle} - Coming Soon
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              This section is being integrated from the CMS package. The full{" "}
              {sectionTitle.toLowerCase()} management interface will be available here.
            </p>
            <p className="text-sm text-muted-foreground">
              Current path: <code className="bg-muted px-2 py-1 rounded">/admin/{path.join("/")}</code>
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
