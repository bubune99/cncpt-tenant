import { prisma } from '@/lib/cms/db';
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Calendar, Clock, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from '@/components/cms/ui/card';
import { Badge } from '@/components/cms/ui/badge';
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getCategory(slug: string) {
  // Use findFirst due to compound unique constraint (tenantId, slug)
  const category = await prisma.blogCategory.findFirst({
    where: { slug, tenantId: null },
    include: {
      posts: {
        where: {
          post: {
            status: "PUBLISHED",
            visibility: "PUBLIC",
          },
        },
        include: {
          post: {
            include: {
              author: {
                select: { name: true },
              },
              featuredImage: {
                select: { url: true, alt: true },
              },
              categories: {
                include: {
                  category: {
                    select: { id: true, name: true, slug: true },
                  },
                },
              },
            },
          },
        },
        orderBy: {
          post: {
            publishedAt: "desc",
          },
        },
      },
    },
  });

  return category;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug);

  if (!category) {
    return {
      title: "Category Not Found",
    };
  }

  return {
    title: category.metaTitle || `${category.name} - Blog`,
    description: category.metaDescription || category.description,
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const category = await getCategory(slug);

  if (!category) {
    notFound();
  }

  const posts = category.posts.map((p: (typeof category.posts)[number]) => p.post);

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Back Link */}
      <Link
        href="/categories"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8"
      >
        <ArrowLeft className="h-4 w-4" />
        All Categories
      </Link>

      {/* Header */}
      <header className="max-w-4xl mx-auto mb-12">
        <h1 className="text-4xl font-bold mb-4">{category.name}</h1>
        {category.description && (
          <p className="text-xl text-muted-foreground">{category.description}</p>
        )}
        <Badge variant="secondary" className="mt-4">
          {posts.length} posts
        </Badge>
      </header>

      {/* Posts Grid */}
      {posts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post: (typeof posts)[number]) => (
            <Link key={post.id} href={`/posts/${post.slug}`}>
              <Card className="h-full hover:shadow-lg transition-shadow overflow-hidden group">
                {post.featuredImage ? (
                  <img
                    src={post.featuredImage.url}
                    alt={post.featuredImage.alt || post.title}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-48 bg-gradient-to-br from-muted to-muted/50" />
                )}
                <CardHeader className="pb-2">
                  <h3 className="text-xl font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                    {post.title}
                  </h3>
                </CardHeader>
                <CardContent>
                  {post.excerpt && (
                    <p className="text-muted-foreground line-clamp-3">
                      {post.excerpt}
                    </p>
                  )}
                </CardContent>
                <CardFooter className="text-sm text-muted-foreground">
                  <div className="flex items-center gap-4">
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
        <div className="text-center py-12 bg-muted/30 rounded-lg">
          <p className="text-muted-foreground">
            No posts in this category yet.
          </p>
        </div>
      )}
    </div>
  );
}
