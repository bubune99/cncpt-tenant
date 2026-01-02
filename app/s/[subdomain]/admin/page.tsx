import { requireTenantOwnership, getTenantSettings, getTenantPages, getTenantPosts } from "@/lib/tenant"
import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Eye, Settings, ArrowLeft, ExternalLink } from "lucide-react"
import Link from "next/link"
import { protocol, rootDomain } from "@/lib/utils"

export default async function SubdomainAdminPage({
  params,
}: {
  params: Promise<{ subdomain: string }>
}) {
  const { subdomain } = await params

  const user = await getCurrentUser()
  if (!user) {
    redirect("/login")
  }

  const tenantData = await requireTenantOwnership(subdomain, user.id)
  const settings = await getTenantSettings(tenantData.id)
  const pages = await getTenantPages(tenantData.id, false) // Include unpublished
  const posts = await getTenantPosts(tenantData.id, false) // Include unpublished

  const subdomainUrl = `${protocol}://${subdomain}.${rootDomain}`

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-2xl">{tenantData.emoji}</div>
              <div>
                <h1 className="font-bold text-lg">{settings?.site_title || `${subdomain}.${rootDomain}`} Admin</h1>
                <p className="text-sm text-muted-foreground">Manage your subdomain content</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" asChild>
                <Link href={subdomainUrl} target="_blank">
                  <Eye className="h-4 w-4 mr-2" />
                  View Site
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Dashboard
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Site Overview</CardTitle>
              <CardDescription>Quick stats and actions for your subdomain</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-primary">{pages.length}</div>
                  <div className="text-sm text-muted-foreground">Pages</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-primary">{posts.length}</div>
                  <div className="text-sm text-muted-foreground">Posts</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    {pages.filter((p) => p.published).length + posts.filter((p) => p.published).length}
                  </div>
                  <div className="text-sm text-muted-foreground">Published</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <Button asChild className="w-full">
                    <Link href={subdomainUrl} target="_blank">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Visit Site
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Pages</CardTitle>
                  <CardDescription>Manage your static pages</CardDescription>
                </div>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  New Page
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {pages.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No pages created yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pages.map((page) => (
                    <div key={page.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div>
                          <h4 className="font-medium">{page.title}</h4>
                          <p className="text-sm text-muted-foreground">/{page.slug}</p>
                        </div>
                        {page.published ? (
                          <Badge variant="secondary">Published</Badge>
                        ) : (
                          <Badge variant="outline">Draft</Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`${subdomainUrl}/${page.slug}`} target="_blank">
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Blog Posts</CardTitle>
                  <CardDescription>Manage your blog content</CardDescription>
                </div>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  New Post
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {posts.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No blog posts created yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {posts.map((post) => (
                    <div key={post.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div>
                          <h4 className="font-medium">{post.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {new Date(post.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        {post.published ? (
                          <Badge variant="secondary">Published</Badge>
                        ) : (
                          <Badge variant="outline">Draft</Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`${subdomainUrl}/blog/${post.slug}`} target="_blank">
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Site Settings</CardTitle>
              <CardDescription>Customize your subdomain appearance and behavior</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Site Title</label>
                  <p className="text-sm text-muted-foreground">{settings?.site_title || "Not set"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <p className="text-sm text-muted-foreground">{settings?.site_description || "Not set"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Theme Color</label>
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-6 h-6 rounded border"
                      style={{ backgroundColor: settings?.theme_color || "#0891b2" }}
                    />
                    <span className="text-sm text-muted-foreground">{settings?.theme_color || "#0891b2"}</span>
                  </div>
                </div>
                <Button variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Edit Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
