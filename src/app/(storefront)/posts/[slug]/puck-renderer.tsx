"use client";

import { Render } from "@measured/puck";
import { blogPuckConfig } from "@/puck/blog/config";
import Link from "next/link";
import { format } from "date-fns";
import { Calendar, Clock, User, ArrowLeft, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { Data } from "@measured/puck";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  puckContent?: Data | null;
  publishedAt?: Date | null;
  readingTime?: number | null;
  viewCount: number;
  author?: {
    id: string;
    name?: string | null;
    email: string;
  } | null;
  featuredImage?: {
    url: string;
    alt?: string | null;
  } | null;
  categories: Array<{
    category: {
      id: string;
      name: string;
      slug: string;
    };
  }>;
  tags: Array<{
    tag: {
      id: string;
      name: string;
      slug: string;
    };
  }>;
}

interface RelatedPost {
  id: string;
  title: string;
  slug: string;
  featuredImage?: {
    url: string;
    alt?: string | null;
  } | null;
}

interface BlogPostPuckRendererProps {
  post: BlogPost;
  relatedPosts: RelatedPost[];
}

export default function BlogPostPuckRenderer({
  post,
  relatedPosts,
}: BlogPostPuckRendererProps) {
  return (
    <article>
      {/* Back Link */}
      <div className="container mx-auto px-4 py-4">
        <Link
          href="/posts"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Blog
        </Link>
      </div>

      {/* Post Meta Header */}
      <header className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Categories */}
        {post.categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {post.categories.map(({ category }) => (
              <Link key={category.id} href={`/categories/${category.slug}`}>
                <Badge variant="secondary">{category.name}</Badge>
              </Link>
            ))}
          </div>
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

      {/* Puck Content */}
      <div className="puck-content">
        <Render
          config={blogPuckConfig}
          data={post.puckContent as Data}
        />
      </div>

      {/* Footer Section */}
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="pt-8 border-t">
            <div className="flex flex-wrap items-center gap-2">
              {post.tags.map(({ tag }) => (
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
                <p className="font-semibold">
                  {post.author.name || post.author.email}
                </p>
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
              {relatedPosts.map((related) => (
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
