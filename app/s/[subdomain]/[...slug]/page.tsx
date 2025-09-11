import { notFound } from "next/navigation"
import { getTenantData, getTenantPage, getTenantPost } from "@/lib/tenant"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Calendar } from "lucide-react"
import { protocol, rootDomain } from "@/lib/utils"

export default async function SubdomainContentPage({
  params,
}: {
  params: Promise<{ subdomain: string; slug: string[] }>
}) {
  const { subdomain, slug } = await params
  const tenantData = await getTenantData(subdomain)

  if (!tenantData) {
    notFound()
  }

  const slugPath = slug.join("/")

  let content = null
  let contentType = "page"

  // Check if it's a blog post
  if (slug[0] === "blog" && slug[1]) {
    content = await getTenantPost(tenantData.id, slug[1])
    contentType = "post"
  } else {
    // Try to find a page with this slug
    content = await getTenantPage(tenantData.id, slugPath)
  }

  if (!content) {
    notFound()
  }

  const subdomainUrl = `${protocol}://${subdomain}.${rootDomain}`

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-2xl">{tenantData.emoji}</div>
              <div>
                <h1 className="font-bold text-lg">
                  {subdomain}.{rootDomain}
                </h1>
              </div>
            </div>

            <Button variant="ghost" size="sm" asChild>
              <Link href={subdomainUrl}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <article className="max-w-4xl mx-auto">
          <header className="mb-8">
            <h1 className="text-4xl font-bold text-balance mb-4">{content.title}</h1>

            {contentType === "post" && (
              <div className="flex items-center space-x-4 text-muted-foreground">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  {new Date(content.created_at).toLocaleDateString()}
                </div>
                {content.updated_at !== content.created_at && (
                  <div className="text-sm">Updated {new Date(content.updated_at).toLocaleDateString()}</div>
                )}
              </div>
            )}
          </header>

          <div className="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: content.content }} />
        </article>
      </main>
    </div>
  )
}
