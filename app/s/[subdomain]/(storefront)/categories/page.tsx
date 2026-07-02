import { prisma } from '@/lib/cms/db';
import Link from "next/link";
import { FolderOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/cms/ui/card';
import { Badge } from '@/components/cms/ui/badge';
import { getTenantContext } from '../../lib/tenant-context';
import { notFound } from 'next/navigation';

export const metadata = {
  title: "Categories",
  description: "Browse blog posts by category",
};

export const revalidate = 60;

async function getCategories(tenantId: number) {
  const categories = await prisma.blogCategory.findMany({
    where: {
      tenantId: tenantId,
    },
    include: {
      _count: {
        select: { posts: true },
      },
      image: {
        select: { url: true, alt: true },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  return categories;
}

interface CategoriesPageProps {
  params: Promise<{ subdomain: string }>;
}

export default async function CategoriesPage({ params }: CategoriesPageProps) {
  const { subdomain } = await params;
  const tenantContext = await getTenantContext(subdomain);

  if (!tenantContext) {
    notFound();
  }

  const categories = await getCategories(tenantContext.id);

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8 lg:py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 sm:mb-4">Categories</h1>
        <p className="text-base sm:text-lg lg:text-xl text-muted-foreground mb-8 sm:mb-12">
          Browse our blog posts by category
        </p>

        {categories.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {categories.map((category: (typeof categories)[number]) => (
              <Link key={category.id} href={`/blog/category/${category.slug}`}>
                <Card className="h-full hover:shadow-lg transition-shadow group">
                  {category.image ? (
                    <img
                      src={category.image.url}
                      alt={category.image.alt || category.name}
                      className="w-full h-32 object-cover rounded-t-lg"
                    />
                  ) : (
                    <div className="w-full h-32 bg-gradient-to-br from-primary/10 to-primary/5 rounded-t-lg flex items-center justify-center">
                      <FolderOpen className="h-10 w-10 sm:h-12 sm:w-12 text-primary/30" />
                    </div>
                  )}
                  <CardHeader className="pb-2 p-3 sm:p-6 sm:pb-2">
                    <CardTitle className="text-base sm:text-lg group-hover:text-primary transition-colors">
                      {category.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                    {category.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {category.description}
                      </p>
                    )}
                    <Badge variant="secondary">
                      {category._count.posts} posts
                    </Badge>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 sm:py-12 bg-muted/30 rounded-lg">
            <FolderOpen className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-sm sm:text-base">No categories yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
