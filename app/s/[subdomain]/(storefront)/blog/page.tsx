import Link from 'next/link';
import { notFound } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { Calendar, Clock, User, Tag as TagIcon } from 'lucide-react';
import { Badge } from '@/components/cms/ui/badge';
import { getTenantContext } from '../../lib/tenant-context';
import { PostCard } from './_components/post-card';
import { BlogPagination } from './_components/blog-pagination';
import {
  getPublishedPosts,
  getFeaturedPost,
  getBlogCategoriesWithCounts,
  publishDueScheduledPosts,
} from '@/lib/cms/blog/public';

export const metadata = {
  title: 'Blog',
  description: 'Read our latest articles and insights',
};

interface BlogPageProps {
  params: Promise<{ subdomain: string }>;
  searchParams: Promise<{ page?: string; category?: string; tag?: string }>;
}

function parsePage(value: string | undefined): number {
  const n = Number.parseInt(value ?? '1', 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

export default async function BlogPage({ params, searchParams }: BlogPageProps) {
  const { subdomain } = await params;
  const { page: pageParam, category, tag } = await searchParams;

  const tenantContext = await getTenantContext(subdomain);
  if (!tenantContext) {
    notFound();
  }

  // Lazily flip any due SCHEDULED posts to PUBLISHED so admin/sitemap catch up.
  // Non-blocking: visibility is already handled by publicPostWhere.
  void publishDueScheduledPosts(tenantContext.id).catch(() => {});

  const page = parsePage(pageParam);
  const isFiltered = Boolean(category || tag);

  const [{ posts, page: currentPage, totalPages }, featuredPost, categories] =
    await Promise.all([
      getPublishedPosts({
        tenantId: tenantContext.id,
        page,
        categorySlug: category,
        tagSlug: tag,
      }),
      // Only spotlight a featured post on the unfiltered first page.
      !isFiltered && page === 1
        ? getFeaturedPost(tenantContext.id)
        : Promise.resolve(null),
      getBlogCategoriesWithCounts(tenantContext.id, 10),
    ]);

  // Avoid showing the featured post twice.
  const listPosts = posts.filter((p) => p.id !== featuredPost?.id);

  const uniqueTags = Array.from(
    new Map(
      posts.flatMap((p) => p.tags.map((t) => t.tag)).map((t) => [t.id, t] as const)
    ).values()
  ).slice(0, 15);

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8 lg:py-12">
      {/* Hero / Featured Post */}
      {featuredPost && (
        <section className="mb-8 sm:mb-12 lg:mb-16">
          <Link href={`/blog/${featuredPost.slug}`}>
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
          <h2 className="text-xl sm:text-2xl font-bold mb-6 sm:mb-8">
            {tag ? `Tagged “${tag}”` : category ? `In “${category}”` : 'Latest Posts'}
          </h2>
          {listPosts.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
                {listPosts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>

              <BlogPagination
                currentPage={currentPage}
                totalPages={totalPages}
                basePath="/blog"
                extraParams={{ category, tag }}
              />
            </>
          ) : (
            <div className="text-center py-8 sm:py-12 bg-muted/30 rounded-lg">
              <p className="text-muted-foreground text-sm sm:text-base">
                No posts published yet.
              </p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="lg:col-span-1">
          <div className="sticky top-20 space-y-6 sm:space-y-8">
            {/* Categories */}
            {categories.length > 0 && (
              <div>
                <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Categories</h3>
                <div className="space-y-1">
                  {categories.map((c) => (
                    <Link
                      key={c.id}
                      href={`/blog/category/${c.slug}`}
                      className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-muted transition-colors"
                    >
                      <span className="text-sm sm:text-base">{c.name}</span>
                      <Badge variant="outline">{c._count.posts}</Badge>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Tags Cloud */}
            {uniqueTags.length > 0 && (
              <div>
                <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {uniqueTags.map((t) => (
                    <Link key={t.id} href={`/blog/tag/${t.slug}`}>
                      <Badge variant="outline" className="hover:bg-muted py-1.5">
                        <TagIcon className="h-3 w-3 mr-1" />
                        {t.name}
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
