import { notFound } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { Calendar, Clock, User, ArrowLeft, Tag as TagIcon, Eye } from 'lucide-react';
import type { Metadata } from 'next';
import { Badge } from '@/components/cms/ui/badge';
import { Separator } from '@/components/cms/ui/separator';
import { getTenantContext } from '../../../lib/tenant-context';
import {
  getPublishedPostBySlug,
  getRelatedPublishedPosts,
  incrementViewCount,
} from '@/lib/cms/blog/public';

interface PageProps {
  params: Promise<{ subdomain: string; slug: string }>;
}

// Rendered per request: view-count increments and scheduled-post visibility
// must reflect the current moment, not a cached snapshot.
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { subdomain, slug } = await params;
  const tenantContext = await getTenantContext(subdomain);
  if (!tenantContext) {
    return { title: 'Site Not Found' };
  }

  const post = await getPublishedPostBySlug(slug, tenantContext.id);
  if (!post) {
    return { title: 'Post Not Found' };
  }

  const description = post.metaDescription || post.excerpt || undefined;
  const imageUrl = post.ogImage?.url || post.featuredImage?.url;

  return {
    title: post.metaTitle || post.title,
    description,
    openGraph: {
      title: post.ogTitle || post.metaTitle || post.title,
      description: post.ogDescription || description,
      type: 'article',
      publishedTime: post.publishedAt?.toISOString(),
      authors: post.author?.name ? [post.author.name] : undefined,
      images: imageUrl ? [{ url: imageUrl }] : undefined,
    },
    robots: post.noIndex ? { index: false, follow: false } : undefined,
    alternates: post.canonicalUrl ? { canonical: post.canonicalUrl } : undefined,
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { subdomain, slug } = await params;
  const tenantContext = await getTenantContext(subdomain);

  if (!tenantContext) {
    notFound();
  }

  // publicPostWhere excludes drafts, private, archived, and not-yet-due
  // scheduled posts, so a null result here is a genuine 404.
  const post = await getPublishedPostBySlug(slug, tenantContext.id);
  if (!post) {
    notFound();
  }

  incrementViewCount(post.id);

  const categoryIds = post.categories.map((c) => c.categoryId);
  const relatedPosts = await getRelatedPublishedPosts(
    post.id,
    categoryIds,
    tenantContext.id
  );

  return (
    <article className="container mx-auto px-4 py-6 sm:py-8 lg:py-12">
      {/* Back Link */}
      <Link
        href="/blog"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 sm:mb-8 py-1"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Blog
      </Link>

      {/* Header */}
      <header className="max-w-3xl mx-auto mb-8 sm:mb-12">
        {post.categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3 sm:mb-4">
            {post.categories.map(({ category }) => (
              <Link key={category.id} href={`/blog/category/${category.slug}`}>
                <Badge variant="secondary">{category.name}</Badge>
              </Link>
            ))}
          </div>
        )}

        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6">
          {post.title}
        </h1>

        {post.excerpt && (
          <p className="text-base sm:text-lg lg:text-xl text-muted-foreground mb-4 sm:mb-6">
            {post.excerpt}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
          {post.author?.name && (
            <span className="flex items-center gap-1">
              <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              {post.author.name}
            </span>
          )}
          {post.publishedAt && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              {format(new Date(post.publishedAt), 'MMMM d, yyyy')}
            </span>
          )}
          {post.readingTime && (
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              {post.readingTime} min read
            </span>
          )}
          <span className="flex items-center gap-1">
            <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            {post.viewCount} views
          </span>
        </div>
      </header>

      {/* Featured Image */}
      {post.featuredImage && (
        <figure className="max-w-4xl mx-auto mb-8 sm:mb-12">
          <img
            src={post.featuredImage.url}
            alt={post.featuredImage.alt || post.title}
            className="w-full rounded-lg shadow-lg"
          />
          {post.featuredImage.alt && (
            <figcaption className="text-center text-xs sm:text-sm text-muted-foreground mt-2 sm:mt-3">
              {post.featuredImage.alt}
            </figcaption>
          )}
        </figure>
      )}

      {/* Content — pre-rendered TipTap HTML from the Journal editor. */}
      <div className="max-w-3xl mx-auto">
        <div
          className="prose prose-sm sm:prose-base lg:prose-lg dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: post.contentHtml || '' }}
        />

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t">
            <div className="flex flex-wrap items-center gap-2">
              <TagIcon className="h-4 w-4 text-muted-foreground" />
              {post.tags.map(({ tag }) => (
                <Link key={tag.id} href={`/blog/tag/${tag.slug}`}>
                  <Badge variant="outline" className="py-1.5">
                    {tag.name}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Author Bio */}
        {post.author && (
          <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 shrink-0 rounded-full bg-primary/20 flex items-center justify-center text-xl sm:text-2xl font-bold text-primary">
                {post.author.name?.charAt(0) || post.author.email.charAt(0)}
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Written by</p>
                <p className="font-semibold text-sm sm:text-base">
                  {post.author.name || post.author.email}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <section className="mt-10 sm:mt-16">
            <Separator className="mb-8 sm:mb-12" />
            <h2 className="text-xl sm:text-2xl font-bold mb-6 sm:mb-8">Related Posts</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              {relatedPosts.map((related) => (
                <Link key={related.id} href={`/blog/${related.slug}`} className="group">
                  <div className="rounded-lg overflow-hidden border hover:shadow-md transition-shadow">
                    {related.featuredImage ? (
                      <img
                        src={related.featuredImage.url}
                        alt={related.featuredImage.alt || related.title}
                        className="w-full h-32 sm:h-36 object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-32 sm:h-36 bg-muted" />
                    )}
                    <div className="p-3 sm:p-4">
                      <h3 className="text-sm sm:text-base font-medium line-clamp-2 group-hover:text-primary transition-colors">
                        {related.title}
                      </h3>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </article>
  );
}
