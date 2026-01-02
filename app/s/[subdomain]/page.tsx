import Link from "next/link"
import type { Metadata } from "next/metadata"
import { notFound } from "next/navigation"
import { getTenantData, getTenantSettings, getTenantPages, getTenantPosts } from "@/lib/tenant"
import { protocol, rootDomain } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, ArrowLeft } from "lucide-react"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ subdomain: string }>
}): Promise<Metadata> {
  const { subdomain } = await params
  const tenantData = await getTenantData(subdomain)

  if (!tenantData) {
    return {
      title: rootDomain,
    }
  }

  const settings = await getTenantSettings(tenantData.id)

  return {
    title: settings?.site_title || `${subdomain}.${rootDomain}`,
    description: settings?.site_description || `Subdomain page for ${subdomain}.${rootDomain}`,
  }
}

export default async function SubdomainPage({
  params,
}: {
  params: Promise<{ subdomain: string }>
}) {
  const { subdomain } = await params

  console.log("[v0] Accessing subdomain:", subdomain)

  try {
    const tenantData = await getTenantData(subdomain)
    console.log("[v0] Tenant data found:", tenantData ? "yes" : "no")

    if (!tenantData) {
      console.log("[v0] No tenant data found for subdomain:", subdomain)
      notFound()
    }

    const settings = await getTenantSettings(tenantData.id)
    const pages = await getTenantPages(tenantData.id)
    const posts = await getTenantPosts(tenantData.id)
    const homePage = pages.find((page) => page.slug === "home")

    console.log("[v0] Loaded tenant content - settings:", !!settings, "pages:", pages.length, "posts:", posts.length)

    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="text-2xl">{tenantData.emoji}</div>
                <div>
                  <h1 className="font-bold text-lg">{settings?.site_title || `${subdomain}.${rootDomain}`}</h1>
                </div>
              </div>

              <nav className="hidden md:flex items-center space-x-6">
                <Link
                  href={`${protocol}://${subdomain}.${rootDomain}`}
                  className="text-foreground hover:text-primary transition-colors"
                >
                  Home
                </Link>
                {pages
                  .filter((page) => page.slug !== "home")
                  .map((page) => (
                    <Link
                      key={page.slug}
                      href={`${protocol}://${subdomain}.${rootDomain}/${page.slug}`}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {page.title}
                    </Link>
                  ))}
                {posts.length > 0 && (
                  <Link
                    href={`${protocol}://${subdomain}.${rootDomain}/blog`}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Blog
                  </Link>
                )}
              </nav>

              <Button variant="ghost" size="sm" asChild>
                <Link href={`${protocol}://${rootDomain}`}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to {rootDomain}
                </Link>
              </Button>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {homePage ? (
            <div className="max-w-4xl mx-auto">
              <div className="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: homePage.content }} />
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="text-9xl mb-6">{tenantData.emoji}</div>
              <h1 className="text-4xl font-bold text-balance mb-4">
                Welcome to {settings?.site_title || `${subdomain}.${rootDomain}`}
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                {settings?.site_description || "This is your custom subdomain page"}
              </p>
            </div>
          )}

          {posts.length > 0 && (
            <section className="mt-16">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold">Recent Posts</h2>
                <Button variant="outline" asChild>
                  <Link href={`${protocol}://${subdomain}.${rootDomain}/blog`}>View All Posts</Link>
                </Button>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.slice(0, 3).map((post) => (
                  <Card key={post.id}>
                    <CardContent className="p-6">
                      <h3 className="font-semibold text-lg mb-2 line-clamp-2">{post.title}</h3>
                      <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                        {post.content.replace(/<[^>]*>/g, "").substring(0, 150)}...
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(post.created_at).toLocaleDateString()}
                        </div>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`${protocol}://${subdomain}.${rootDomain}/blog/${post.slug}`}>Read More</Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {pages.filter((page) => page.slug !== "home").length > 0 && (
            <section className="mt-16">
              <h2 className="text-2xl font-bold mb-8">Pages</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {pages
                  .filter((page) => page.slug !== "home")
                  .map((page) => (
                    <Card key={page.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold">{page.title}</h3>
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`${protocol}://${subdomain}.${rootDomain}/${page.slug}`}>View Page</Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </section>
          )}
        </main>

        {settings?.custom_css && <style dangerouslySetInnerHTML={{ __html: settings.custom_css }} />}
      </div>
    )
  } catch (error) {
    console.error("[v0] Error loading subdomain data:", error)
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Unable to Access Subdomain</h1>
          <p className="text-muted-foreground mb-4">
            There was an error loading the subdomain data. This might be a temporary issue.
          </p>
          <p className="text-sm text-muted-foreground">Subdomain: {subdomain}</p>
        </div>
      </div>
    )
  }
}
