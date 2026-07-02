import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';
import { getTenantContext } from '../../../../lib/tenant-context';
import { PostCard } from '../../_components/post-card';
import { BlogPagination } from '../../_components/blog-pagination';
import { getBlogCategory, getPublishedPosts } from '@/lib/cms/blog/public';

interface PageProps {
  params: Promise<{ subdomain: string; slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

function parsePage(value: string | undefined): number {
  const n = Number.parseInt(value ?? '1', 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { subdomain, slug } = await params;
  const tenantContext = await getTenantContext(subdomain);
  if (!tenantContext) return { title: 'Site Not Found' };

  const category = await getBlogCategory(slug, tenantContext.id);
  if (!category) return { title: 'Category Not Found' };

  return {
    title: category.metaTitle || `${category.name} — Blog`,
    description: category.metaDescription || category.description || undefined,
  };
}

export default async function BlogCategoryPage({ params, searchParams }: PageProps) {
  const { subdomain, slug } = await params;
  const { page: pageParam } = await searchParams;

  const tenantContext = await getTenantContext(subdomain);
  if (!tenantContext) {
    notFound();
  }

  const category = await getBlogCategory(slug, tenantContext.id);
  if (!category) {
    notFound();
  }

  const { posts, page, totalPages } = await getPublishedPosts({
    tenantId: tenantContext.id,
    page: parsePage(pageParam),
    categorySlug: slug,
  });

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8 lg:py-12">
      <Link
        href="/blog"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 sm:mb-8 py-1"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Blog
      </Link>

      <header className="max-w-3xl mb-8 sm:mb-12">
        <p className="text-sm text-muted-foreground mb-1">Category</p>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">{category.name}</h1>
        {category.description && (
          <p className="text-base sm:text-lg text-muted-foreground mt-3 sm:mt-4">
            {category.description}
          </p>
        )}
      </header>

      {posts.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
          <BlogPagination
            currentPage={page}
            totalPages={totalPages}
            basePath={`/blog/category/${slug}`}
          />
        </>
      ) : (
        <div className="text-center py-8 sm:py-12 bg-muted/30 rounded-lg">
          <p className="text-muted-foreground text-sm sm:text-base">
            No posts in this category yet.
          </p>
        </div>
      )}
    </div>
  );
}
