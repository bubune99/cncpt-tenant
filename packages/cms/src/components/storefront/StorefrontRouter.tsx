/**
 * StorefrontRouter - Multi-tenant storefront router component
 *
 * Server Component - No client hooks
 *
 * This component handles routing for subdomain storefronts.
 * It can be imported and used by external apps to render CMS content.
 */

import { prisma } from '../../lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

export interface StorefrontRouterProps {
  subdomain: string
  path?: string[]
  siteId?: string
}

// Get site settings (future: filter by subdomain/siteId)
async function getSiteSettings(subdomain: string) {
  return {
    siteName: subdomain,
    siteDescription: `Welcome to ${subdomain}`,
    logo: null,
  }
}

// Get published blog posts
async function getPosts(limit = 10) {
  try {
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
  } catch (e) {
    console.error('Error fetching posts:', e)
    return []
  }
}

// Get single post by slug
async function getPost(slug: string) {
  try {
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
  } catch (e) {
    console.error('Error fetching post:', e)
    return null
  }
}

// Get published pages
async function getPages() {
  try {
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
  } catch (e) {
    console.error('Error fetching pages:', e)
    return []
  }
}

// Get single page by slug
async function getPage(slug: string) {
  try {
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
  } catch (e) {
    console.error('Error fetching page:', e)
    return null
  }
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
            <Link href="/posts" className="text-muted-foreground hover:text-foreground transition-colors">
              Blog
            </Link>
            {pages.slice(0, 4).map((page) => (
              <Link
                key={page.id}
                href={page.slug}
                className="text-muted-foreground hover:text-foreground transition-colors"
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
              <Link href="/posts" className="text-primary hover:underline">
                View All →
              </Link>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <Link key={post.id} href={`/posts/${post.slug}`}>
                  <article className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow h-full">
                    {post.featuredImage && (
                      <img
                        src={post.featuredImage.url}
                        alt={post.featuredImage.alt || post.title}
                        className="w-full h-48 object-cover"
                      />
                    )}
                    <div className="p-4">
                      <h3 className="font-semibold text-lg mb-2 line-clamp-2">{post.title}</h3>
                      {post.excerpt && (
                        <p className="text-muted-foreground text-sm line-clamp-3 mb-4">{post.excerpt}</p>
                      )}
                      {post.publishedAt && (
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(post.publishedAt), { addSuffix: true })}
                        </p>
                      )}
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t py-8 mt-16">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          © {new Date().getFullYear()} {settings.siteName}. All rights reserved.
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
                <article className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow h-full">
                  {post.featuredImage && (
                    <img
                      src={post.featuredImage.url}
                      alt={post.featuredImage.alt || post.title}
                      className="w-full h-48 object-cover"
                    />
                  )}
                  <div className="p-4">
                    <div className="flex flex-wrap gap-2 mb-2">
                      {post.categories.slice(0, 2).map(({ category }) => (
                        <span key={category.id} className="text-xs bg-muted px-2 py-1 rounded">
                          {category.name}
                        </span>
                      ))}
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{post.title}</h3>
                    {post.excerpt && (
                      <p className="text-muted-foreground text-sm line-clamp-3 mb-4">{post.excerpt}</p>
                    )}
                    {post.publishedAt && (
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(post.publishedAt), { addSuffix: true })}
                      </p>
                    )}
                  </div>
                </article>
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
        <Link href="/posts" className="text-muted-foreground hover:text-foreground mb-8 inline-block">
          ← Back to Blog
        </Link>

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
              <span key={category.id} className="text-sm bg-primary text-primary-foreground px-3 py-1 rounded">
                {category.name}
              </span>
            ))}
          </div>
          <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
          <div className="flex items-center gap-4 text-muted-foreground text-sm">
            {post.author?.name && (
              <span>By {post.author.name}</span>
            )}
            {post.publishedAt && (
              <span>{new Date(post.publishedAt).toLocaleDateString()}</span>
            )}
            {post.readingTime && (
              <span>{post.readingTime} min read</span>
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
                <span key={tag.id} className="text-sm border px-3 py-1 rounded">
                  {tag.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </article>
    </div>
  )
}

// CMS Page renderer
async function CMSPage({ subdomain, slug }: { subdomain: string; slug: string }) {
  const settings = await getSiteSettings(subdomain)
  const page = await getPage(slug)

  if (!page) {
    notFound()
  }

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
          <div>
            <h1 className="text-4xl font-bold mb-8">{page.title}</h1>
            <p className="text-muted-foreground">
              Visual editor content - Puck rendering integration coming soon.
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
  if (path.length === 0) {
    return <HomePage subdomain={subdomain} />
  }

  const [firstSegment, ...rest] = path

  if (firstSegment === 'posts' || firstSegment === 'blog') {
    if (rest.length === 0) {
      return <PostsPage subdomain={subdomain} />
    } else {
      return <PostPage subdomain={subdomain} slug={rest[0]} />
    }
  }

  if (firstSegment === 'p' || firstSegment === 'pages') {
    return <CMSPage subdomain={subdomain} slug={rest.join('/')} />
  }

  // Try to find a page with this slug
  const page = await getPage(firstSegment)
  if (page) {
    return <CMSPage subdomain={subdomain} slug={firstSegment} />
  }

  notFound()
}

export default StorefrontRouter
