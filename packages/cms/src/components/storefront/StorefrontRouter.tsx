/**
 * StorefrontRouter - Multi-tenant storefront router component
 *
 * This component handles routing for subdomain storefronts.
 * It can be imported and used by external apps to render CMS content.
 *
 * Usage:
 * import { StorefrontRouter } from '@cncpt/cms'
 * <StorefrontRouter subdomain="mysite" path={['posts', 'my-post']} />
 */

import { prisma } from '../../lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { Calendar, Clock, User, ArrowLeft } from 'lucide-react'
import { Card, CardContent, CardFooter, CardHeader } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import type { Data } from '@puckeditor/core'

export interface StorefrontRouterProps {
  subdomain: string
  path?: string[]
  // Future: siteId for multi-tenant filtering
  siteId?: string
}

// Get site settings (future: filter by subdomain/siteId)
async function getSiteSettings(subdomain: string) {
  // For now, return default settings
  // Future: query by subdomain
  return {
    siteName: subdomain,
    siteDescription: `Welcome to ${subdomain}`,
    logo: null,
  }
}

// Get published blog posts
async function getPosts(limit = 10) {
  const posts = await prisma.blogPost.findMany({
    where: {
      status: 'PUBLISHED',
      visibility: 'PUBLIC',
    },
    orderBy: {
      publishedAt: 'desc',
    },
    take: limit,
    include: {
      author: {
        select: { id: true, name: true },
      },
      featuredImage: {
        select: { id: true, url: true, alt: true },
      },
      categories: {
        include: {
          category: {
            select: { id: true, name: true, slug: true },
          },
        },
      },
    },
  })
  return posts
}

// Get single post by slug
async function getPost(slug: string) {
  const post = await prisma.blogPost.findFirst({
    where: {
      slug,
      status: 'PUBLISHED',
    },
    include: {
      author: {
        select: { id: true, name: true },
      },
      featuredImage: {
        select: { id: true, url: true, alt: true },
      },
      categories: {
        include: {
          category: true,
        },
      },
      tags: {
        include: {
          tag: true,
        },
      },
    },
  })
  return post
}

// Get published pages
async function getPages() {
  const pages = await prisma.page.findMany({
    where: {
      status: 'PUBLISHED',
    },
    orderBy: {
      title: 'asc',
    },
    select: {
      id: true,
      title: true,
      slug: true,
    },
  })
  return pages
}

// Get single page by slug
async function getPage(slug: string) {
  const page = await prisma.page.findFirst({
    where: {
      slug: slug.startsWith('/') ? slug : `/${slug}`,
      status: 'PUBLISHED',
    },
    include: {
      featuredImage: true,
    },
  })
  return page
}

// Home page component
async function HomePage({ subdomain }: { subdomain: string }) {
  const settings = await getSiteSettings(subdomain)
  const posts = await getPosts(6)
  const pages = await getPages()

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="font-bold text-xl">
            {settings.siteName}
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/posts" className="text-muted-foreground hover:text-foreground">
              Blog
            </Link>
            {pages.slice(0, 4).map((page) => (
              <Link
                key={page.id}
                href={page.slug}
                className="text-muted-foreground hover:text-foreground"
              >
                {page.title}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 text-center">
        <div className="container mx-auto px-4">
          <h1 className="text-5xl font-bold mb-6">{settings.siteName}</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {settings.siteDescription}
          </p>
        </div>
      </section>

      {/* Recent Posts */}
      {posts.length > 0 && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold">Latest Posts</h2>
              <Button variant="outline" asChild>
                <Link href="/posts">View All</Link>
              </Button>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <Link key={post.id} href={`/posts/${post.slug}`}>
                  <Card className="h-full hover:shadow-lg transition-shadow">
                    {post.featuredImage && (
                      <img
                        src={post.featuredImage.url}
                        alt={post.featuredImage.alt || post.title}
                        className="w-full h-48 object-cover"
                      />
                    )}
                    <CardHeader>
                      <h3 className="font-semibold text-lg line-clamp-2">{post.title}</h3>
                    </CardHeader>
                    <CardContent>
                      {post.excerpt && (
                        <p className="text-muted-foreground line-clamp-3">{post.excerpt}</p>
                      )}
                    </CardContent>
                    <CardFooter className="text-sm text-muted-foreground">
                      {post.publishedAt && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDistanceToNow(new Date(post.publishedAt), { addSuffix: true })}
                        </span>
                      )}
                    </CardFooter>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          &copy; {new Date().getFullYear()} {settings.siteName}. All rights reserved.
        </div>
      </footer>
    </div>
  )
}

// Posts list page
async function PostsPage({ subdomain }: { subdomain: string }) {
  const settings = await getSiteSettings(subdomain)
  const posts = await getPosts(20)

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="font-bold text-xl">{settings.siteName}</Link>
          <nav className="flex items-center gap-6">
            <Link href="/posts" className="text-foreground font-medium">Blog</Link>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">Blog</h1>
        {posts.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <Link key={post.id} href={`/posts/${post.slug}`}>
                <Card className="h-full hover:shadow-lg transition-shadow">
                  {post.featuredImage && (
                    <img
                      src={post.featuredImage.url}
                      alt={post.featuredImage.alt || post.title}
                      className="w-full h-48 object-cover"
                    />
                  )}
                  <CardHeader>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {post.categories.slice(0, 2).map(({ category }) => (
                        <Badge key={category.id} variant="secondary">{category.name}</Badge>
                      ))}
                    </div>
                    <h3 className="font-semibold text-lg">{post.title}</h3>
                  </CardHeader>
                  <CardContent>
                    {post.excerpt && (
                      <p className="text-muted-foreground line-clamp-3">{post.excerpt}</p>
                    )}
                  </CardContent>
                  <CardFooter className="text-sm text-muted-foreground">
                    {post.publishedAt && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDistanceToNow(new Date(post.publishedAt), { addSuffix: true })}
                      </span>
                    )}
                  </CardFooter>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No posts yet.</p>
        )}
      </main>
    </div>
  )
}

// Single post page
async function PostPage({ subdomain, slug }: { subdomain: string; slug: string }) {
  const settings = await getSiteSettings(subdomain)
  const post = await getPost(slug)

  if (!post) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="font-bold text-xl">{settings.siteName}</Link>
          <nav className="flex items-center gap-6">
            <Link href="/posts" className="text-muted-foreground hover:text-foreground">Blog</Link>
          </nav>
        </div>
      </header>

      <article className="container mx-auto px-4 py-12 max-w-4xl">
        <Button variant="ghost" asChild className="mb-8">
          <Link href="/posts">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Blog
          </Link>
        </Button>

        {post.featuredImage && (
          <img
            src={post.featuredImage.url}
            alt={post.featuredImage.alt || post.title}
            className="w-full h-[400px] object-cover rounded-lg mb-8"
          />
        )}

        <header className="mb-8">
          <div className="flex flex-wrap gap-2 mb-4">
            {post.categories.map(({ category }) => (
              <Badge key={category.id}>{category.name}</Badge>
            ))}
          </div>
          <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
          <div className="flex items-center gap-4 text-muted-foreground">
            {post.author?.name && (
              <span className="flex items-center gap-1">
                <User className="h-4 w-4" />
                {post.author.name}
              </span>
            )}
            {post.publishedAt && (
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {new Date(post.publishedAt).toLocaleDateString()}
              </span>
            )}
            {post.readingTime && (
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {post.readingTime} min read
              </span>
            )}
          </div>
        </header>

        <div
          className="prose prose-lg max-w-none"
          dangerouslySetInnerHTML={{ __html: post.content || '' }}
        />

        {post.tags.length > 0 && (
          <div className="mt-8 pt-8 border-t">
            <h3 className="font-semibold mb-4">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {post.tags.map(({ tag }) => (
                <Badge key={tag.id} variant="outline">{tag.name}</Badge>
              ))}
            </div>
          </div>
        )}
      </article>
    </div>
  )
}

// CMS Page renderer (for Puck pages)
async function CMSPage({ subdomain, slug }: { subdomain: string; slug: string }) {
  const settings = await getSiteSettings(subdomain)
  const page = await getPage(slug)

  if (!page) {
    notFound()
  }

  // Check if page has Puck content
  const hasPuckContent = page.content && typeof page.content === 'object'

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="font-bold text-xl">{settings.siteName}</Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        {hasPuckContent ? (
          // Render Puck content - would need PageRenderer
          <div>
            <h1 className="text-4xl font-bold mb-8">{page.title}</h1>
            <p className="text-muted-foreground">
              This page uses the visual editor. Puck rendering coming soon.
            </p>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold mb-8">{page.title}</h1>
            {page.content && typeof page.content === 'string' && (
              <div
                className="prose prose-lg max-w-none"
                dangerouslySetInnerHTML={{ __html: page.content }}
              />
            )}
          </div>
        )}
      </main>
    </div>
  )
}

/**
 * Main StorefrontRouter component
 * Routes to appropriate page based on path
 */
export async function StorefrontRouter({ subdomain, path = [] }: StorefrontRouterProps) {
  // Determine which page to render based on path
  if (path.length === 0) {
    // Home page
    return <HomePage subdomain={subdomain} />
  }

  const [firstSegment, ...rest] = path

  if (firstSegment === 'posts') {
    if (rest.length === 0) {
      // Posts list
      return <PostsPage subdomain={subdomain} />
    } else {
      // Single post
      return <PostPage subdomain={subdomain} slug={rest[0]} />
    }
  }

  if (firstSegment === 'p' || firstSegment === 'pages') {
    // CMS page
    return <CMSPage subdomain={subdomain} slug={rest.join('/')} />
  }

  // Try to find a page with this slug
  const page = await getPage(firstSegment)
  if (page) {
    return <CMSPage subdomain={subdomain} slug={firstSegment} />
  }

  // Not found
  notFound()
}

export default StorefrontRouter
