import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { Calendar, Clock, User, ArrowLeft, Tag as TagIcon, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { Metadata } from "next";
import BlogPostPuckRenderer from "./puck-renderer";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getPost(slug: string) {
  const post = await prisma.blogPost.findUnique({
    where: { slug },
    include: {
      author: {
        select: { id: true, name: true, email: true },
      },
      featuredImage: true,
      ogImage: true,
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
  });

  return post;
}

async function getRelatedPosts(postId: string, categoryIds: string[]) {
  if (categoryIds.length === 0) return [];

  const related = await prisma.blogPost.findMany({
    where: {
      id: { not: postId },
      status: "PUBLISHED",
      visibility: "PUBLIC",
      categories: {
        some: {
          categoryId: { in: categoryIds },
        },
      },
    },
    take: 3,
    include: {
      featuredImage: {
        select: { url: true, alt: true },
      },
      categories: {
        include: {
          category: {
            select: { name: true, slug: true },
          },
        },
      },
    },
    orderBy: {
      publishedAt: "desc",
    },
  });

  return related;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    return {
      title: "Post Not Found",
    };
  }

  return {
    title: post.metaTitle || post.title,
    description: post.metaDescription || post.excerpt,
    openGraph: {
      title: post.ogTitle || post.metaTitle || post.title,
      description: post.ogDescription || post.metaDescription || post.excerpt || undefined,
      type: "article",
      publishedTime: post.publishedAt?.toISOString(),
      authors: post.author?.name ? [post.author.name] : undefined,
      images: post.ogImage?.url || post.featuredImage?.url ? [
        {
          url: post.ogImage?.url || post.featuredImage?.url || "",
        },
      ] : undefined,
    },
    robots: post.noIndex ? { index: false } : undefined,
    alternates: post.canonicalUrl ? { canonical: post.canonicalUrl } : undefined,
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post || post.status !== "PUBLISHED" || post.visibility !== "PUBLIC") {
    notFound();
  }

  // Increment view count (fire and forget)
  prisma.blogPost
    .update({
      where: { id: post.id },
      data: { viewCount: { increment: 1 } },
    })
    .catch(() => {});

  const categoryIds = post.categories.map((c: (typeof post.categories)[number]) => c.categoryId);
  const relatedPosts = await getRelatedPosts(post.id, categoryIds);

  // If using Puck layout, render with Puck
  if (post.usePuckLayout && post.puckContent) {
    return <BlogPostPuckRenderer post={post as Parameters<typeof BlogPostPuckRenderer>[0]['post']} relatedPosts={relatedPosts} />;
  }

  // Otherwise render with TipTap HTML content
  return (
    <article className="container mx-auto px-4 py-12">
      {/* Back Link */}
      <Link
        href="/posts"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Blog
      </Link>

      {/* Header */}
      <header className="max-w-3xl mx-auto mb-12">
        {/* Categories */}
        {post.categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {post.categories.map(({ category }: (typeof post.categories)[number]) => (
              <Link key={category.id} href={`/categories/${category.slug}`}>
                <Badge variant="secondary">{category.name}</Badge>
              </Link>
            ))}
          </div>
        )}

        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-bold mb-6">{post.title}</h1>

        {/* Excerpt */}
        {post.excerpt && (
          <p className="text-xl text-muted-foreground mb-6">{post.excerpt}</p>
        )}

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          {post.author?.name && (
            <span className="flex items-center gap-1">
              <User className="h-4 w-4" />
              {post.author.name}
            </span>
          )}
          {post.publishedAt && (
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {format(new Date(post.publishedAt), "MMMM d, yyyy")}
            </span>
          )}
          {post.readingTime && (
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {post.readingTime} min read
            </span>
          )}
          <span className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            {post.viewCount} views
          </span>
        </div>
      </header>

      {/* Featured Image */}
      {post.featuredImage && (
        <figure className="max-w-4xl mx-auto mb-12">
          <img
            src={post.featuredImage.url}
            alt={post.featuredImage.alt || post.title}
            className="w-full rounded-lg shadow-lg"
          />
          {post.featuredImage.alt && (
            <figcaption className="text-center text-sm text-muted-foreground mt-3">
              {post.featuredImage.alt}
            </figcaption>
          )}
        </figure>
      )}

      {/* Content */}
      <div className="max-w-3xl mx-auto">
        <div
          className="prose prose-lg dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: post.contentHtml || "" }}
        />

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="mt-12 pt-8 border-t">
            <div className="flex flex-wrap items-center gap-2">
              <TagIcon className="h-4 w-4 text-muted-foreground" />
              {post.tags.map(({ tag }: (typeof post.tags)[number]) => (
                <Link key={tag.id} href={`/tags/${tag.slug}`}>
                  <Badge variant="outline">{tag.name}</Badge>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Author Bio */}
        {post.author && (
          <div className="mt-12 pt-8 border-t">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary">
                {post.author.name?.charAt(0) || post.author.email.charAt(0)}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Written by</p>
                <p className="font-semibold">{post.author.name || post.author.email}</p>
              </div>
            </div>
          </div>
        )}

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <section className="mt-16">
            <Separator className="mb-12" />
            <h2 className="text-2xl font-bold mb-8">Related Posts</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedPosts.map((related: (typeof relatedPosts)[number]) => (
                <Link
                  key={related.id}
                  href={`/posts/${related.slug}`}
                  className="group"
                >
                  <div className="rounded-lg overflow-hidden border hover:shadow-md transition-shadow">
                    {related.featuredImage ? (
                      <img
                        src={related.featuredImage.url}
                        alt={related.featuredImage.alt || related.title}
                        className="w-full h-32 object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-32 bg-muted" />
                    )}
                    <div className="p-4">
                      <h3 className="font-medium line-clamp-2 group-hover:text-primary transition-colors">
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
