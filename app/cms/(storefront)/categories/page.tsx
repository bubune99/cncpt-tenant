import { prisma } from '../../../lib/db';
import Link from "next/link";
import { FolderOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';

export const metadata = {
  title: "Categories",
  description: "Browse blog posts by category",
};

export const revalidate = 60;

async function getCategories() {
  const categories = await prisma.blogCategory.findMany({
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

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">Categories</h1>
        <p className="text-xl text-muted-foreground mb-12">
          Browse our blog posts by category
        </p>

        {categories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category: (typeof categories)[number]) => (
              <Link key={category.id} href={`/categories/${category.slug}`}>
                <Card className="h-full hover:shadow-lg transition-shadow group">
                  {category.image ? (
                    <img
                      src={category.image.url}
                      alt={category.image.alt || category.name}
                      className="w-full h-32 object-cover rounded-t-lg"
                    />
                  ) : (
                    <div className="w-full h-32 bg-gradient-to-br from-primary/10 to-primary/5 rounded-t-lg flex items-center justify-center">
                      <FolderOpen className="h-12 w-12 text-primary/30" />
                    </div>
                  )}
                  <CardHeader className="pb-2">
                    <CardTitle className="group-hover:text-primary transition-colors">
                      {category.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
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
          <div className="text-center py-12 bg-muted/30 rounded-lg">
            <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No categories yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
