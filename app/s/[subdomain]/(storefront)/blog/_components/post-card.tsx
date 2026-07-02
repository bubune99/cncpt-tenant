import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Calendar, Clock } from 'lucide-react';
import { Badge } from '@/components/cms/ui/badge';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/cms/ui/card';
import type { BlogCardPost } from '@/lib/cms/blog/public';

/** Shared post card used by the blog index and the category/tag archives. */
export function PostCard({ post }: { post: BlogCardPost }) {
  return (
    <Link href={`/blog/${post.slug}`}>
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
            {post.categories.slice(0, 2).map(({ category }) => (
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
                {formatDistanceToNow(new Date(post.publishedAt), { addSuffix: true })}
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
  );
}
