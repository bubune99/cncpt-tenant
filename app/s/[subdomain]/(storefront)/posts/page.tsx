import { prisma } from '@/lib/cms/db';
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Calendar, Clock, User, Tag as TagIcon } from "lucide-react";
import { Badge } from '@/components/cms/ui/badge';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/cms/ui/card';
import { getTenantContext } from '../../lib/tenant-context';
import { notFound } from 'next/navigation';

export const metadata = {
  title: "Blog",
  description: "Read our latest articles and insights",
};

export const revalidate = 60; // Revalidate every minute

async function getPosts(tenantId: number) {
  const posts = await prisma.blogPost.findMany({
    where: {
      status: "PUBLISHED",
      visibility: "PUBLIC",
      tenantId: tenantId,
    },
    orderBy: {
      publishedAt: "desc",
    },
    take: 20,
    include: {
      author: {
        select: { id: true, name: true, email: true },
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
      tags: {
        include: {
          tag: {
            select: { id: true, name: true, slug: true },
          },
        },
      },
    },
  });

  return posts;
}

async function getFeaturedPost(tenantId: number) {
  const featured = await prisma.blogPost.findFirst({
    where: {
      status: "PUBLISHED",
      visibility: "PUBLIC",
      featured: true,
      tenantId: tenantId,
    },
    orderBy: {
      publishedAt: "desc",
    },
    include: {
      author: {
        select: { id: true, name: true, email: true },
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
  });

  return featured;
}

async function getCategories(tenantId: number) {
  const categories = await prisma.blogCategory.findMany({
    where: {
      tenantId: tenantId,
    },
    include: {
      _count: {
        select: { posts: true },
      },
    },
    orderBy: {
      name: "asc",
    },
    take: 10,
  });

  return categories;
}

interface BlogPageProps {
  params: Promise<{ subdomain: string }>;
}

export default async function BlogPage({ params }: BlogPageProps) {
  const { subdomain } = await params;
  const tenantContext = await getTenantContext(subdomain);

  if (!tenantContext) {
    notFound();
  }

  const [posts, featuredPost, categories] = await Promise.all([
    getPosts(tenantContext.id),
    getFeaturedPost(tenantContext.id),
    getCategories(tenantContext.id),
  ]);

  // Filter out the featured post from the list
  const regularPosts = posts.filter((p: (typeof posts)[number]) => p.id !== featuredPost?.id);

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8 lg:py-12">
      {/* Hero / Featured Post */}
      {featuredPost && (
        <section className="mb-8 sm:mb-12 lg:mb-16">
          <Link href={`/posts/${featuredPost.slug}`}>
            <div className="relative rounded-xl sm:rounded-2xl overflow-hidden group">
              {featuredPost.featuredImage ? (
                <img
                  src={featuredPost.featuredImage.url}
                  alt={featuredPost.featuredImage.alt || featuredPost.title}
                  className="w-full h-[250px] sm:h-[350px] md:h-[400px] lg:h-[500px] object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-[250px] sm:h-[350px] md:h-[400px] lg:h-[500px] bg-gradient-to-br from-primary/20 to-primary/5" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 lg:p-8 text-white">
                <Badge className="mb-2 sm:mb-4">Featured</Badge>
                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold mb-2 sm:mb-4">
                  {featuredPost.title}
                </h1>
                {featuredPost.excerpt && (
                  <p className="text-sm sm:text-base lg:text-lg opacity-90 max-w-2xl mb-2 sm:mb-4 line-clamp-2 sm:line-clamp-none">
                    {featuredPost.excerpt}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm opacity-75">
                  {featuredPost.author?.name && (
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3 sm:h-4 sm:w-4" />
                      {featuredPost.author.name}
                    </span>
                  )}
                  {featuredPost.publishedAt && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                      {formatDistanceToNow(new Date(featuredPost.publishedAt), {
                        addSuffix: true,
                      })}
                    </span>
                  )}
                  {featuredPost.readingTime && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                      {featuredPost.readingTime} min read
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Link>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 lg:gap-12">
        {/* Posts Grid */}
        <div className="lg:col-span-3">
          <h2 className="text-xl sm:text-2xl font-bold mb-6 sm:mb-8">Latest Posts</h2>
          {regularPosts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
              {regularPosts.map((post: (typeof regularPosts)[number]) => (
                <Link key={post.id} href={`/posts/${post.slug}`}>
                  <Card className="h-full hover:shadow-lg transition-shadow overflow-hidden group">
                    {post.featuredImage ? (
                      <img
                        src={post.featuredImage.url}
                        alt={post.featuredImage.alt || post.title}
                        className="w-full h-40 sm:h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-40 sm:h-48 bg-gradient-to-br from-muted to-muted/50" />
                    )}
                    <CardHeader className="pb-2 p-3 sm:p-6 sm:pb-2">
                      <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-2">
                        {post.categories.slice(0, 2).map(({ category }: (typeof post.categories)[number]) => (
                          <Badge key={category.id} variant="secondary" className="text-xs">
                            {category.name}
                          </Badge>
                        ))}
                      </div>
                      <h3 className="text-base sm:text-xl font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                        {post.title}
                      </h3>
                    </CardHeader>
                    <CardContent className="px-3 sm:px-6">
                      {post.excerpt && (
                        <p className="text-sm text-muted-foreground line-clamp-2 sm:line-clamp-3">
                          {post.excerpt}
                        </p>
                      )}
                    </CardContent>
                    <CardFooter className="text-xs sm:text-sm text-muted-foreground px-3 sm:px-6 pb-3 sm:pb-6">
                      <div className="flex items-center gap-3 sm:gap-4">
                        {post.publishedAt && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDistanceToNow(new Date(post.publishedAt), {
                              addSuffix: true,
                            })}
                          </span>
                        )}
                        {post.readingTime && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {post.readingTime} min
                          </span>
                        )}
                      </div>
                    </CardFooter>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 sm:py-12 bg-muted/30 rounded-lg">
              <p className="text-muted-foreground text-sm sm:text-base">No posts published yet.</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="lg:col-span-1">
          <div className="sticky top-20 space-y-6 sm:space-y-8">
            {/* Categories */}
            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Categories</h3>
              <div className="space-y-1">
                {categories.map((category: (typeof categories)[number]) => (
                  <Link
                    key={category.id}
                    href={`/categories/${category.slug}`}
                    className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-muted transition-colors"
                  >
                    <span className="text-sm sm:text-base">{category.name}</span>
                    <Badge variant="outline">{category._count.posts}</Badge>
                  </Link>
                ))}
              </div>
            </div>

            {/* Tags Cloud */}
            {posts.some((p: (typeof posts)[number]) => p.tags.length > 0) && (
              <div>
                <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {(Array.from(
                    new Set(
                      posts.flatMap((p: (typeof posts)[number]) => p.tags.map((t: (typeof p.tags)[number]) => JSON.stringify(t.tag)))
                    )
                  ) as string[])
                    .map((t) => JSON.parse(t) as { id: string; name: string; slug: string })
                    .slice(0, 15)
                    .map((tag: { id: string; name: string; slug: string }) => (
                      <Link key={tag.id} href={`/tags/${tag.slug}`}>
                        <Badge variant="outline" className="hover:bg-muted py-1.5">
                          <TagIcon className="h-3 w-3 mr-1" />
                          {tag.name}
                        </Badge>
                      </Link>
                    ))}
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
