'use client';

import { Progress } from '../ui/progress';
import { cn } from '../../lib/utils';
import { StarRating } from './StarRating';

export interface ReviewStatsData {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  verifiedPurchaseCount: number;
  withImagesCount: number;
}

interface ReviewStatsProps {
  stats: ReviewStatsData;
  onFilterByRating?: (rating: number | null) => void;
  selectedRating?: number | null;
  className?: string;
}

export function ReviewStats({
  stats,
  onFilterByRating,
  selectedRating,
  className,
}: ReviewStatsProps) {
  const { averageRating, totalReviews, ratingDistribution } = stats;

  const getRatingPercentage = (rating: number) => {
    if (totalReviews === 0) return 0;
    return (ratingDistribution[rating as keyof typeof ratingDistribution] / totalReviews) * 100;
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Overall Rating */}
      <div className="flex items-center gap-4">
        <div className="text-center">
          <div className="text-4xl font-bold">{averageRating.toFixed(1)}</div>
          <StarRating rating={averageRating} size="md" />
          <div className="text-sm text-muted-foreground mt-1">
            {totalReviews} review{totalReviews !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Rating Distribution */}
      <div className="space-y-2">
        {[5, 4, 3, 2, 1].map((rating) => {
          const count = ratingDistribution[rating as keyof typeof ratingDistribution];
          const percentage = getRatingPercentage(rating);
          const isSelected = selectedRating === rating;

          return (
            <button
              key={rating}
              className={cn(
                'w-full flex items-center gap-2 group text-left',
                onFilterByRating && 'hover:bg-muted/50 rounded px-2 py-1 -mx-2 transition-colors',
                isSelected && 'bg-muted'
              )}
              onClick={() => onFilterByRating?.(isSelected ? null : rating)}
              disabled={!onFilterByRating}
            >
              <span className={cn(
                'text-sm w-16 flex items-center gap-1',
                onFilterByRating && 'group-hover:text-primary',
                isSelected && 'text-primary font-medium'
              )}>
                {rating} star{rating !== 1 ? 's' : ''}
              </span>
              <div className="flex-1">
                <Progress
                  value={percentage}
                  className={cn(
                    'h-2',
                    isSelected && '[&>div]:bg-primary'
                  )}
                />
              </div>
              <span className={cn(
                'text-sm text-muted-foreground w-12 text-right',
                isSelected && 'text-primary font-medium'
              )}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Additional Stats */}
      {(stats.verifiedPurchaseCount > 0 || stats.withImagesCount > 0) && (
        <div className="pt-3 border-t text-sm text-muted-foreground space-y-1">
          {stats.verifiedPurchaseCount > 0 && (
            <div>
              {stats.verifiedPurchaseCount} verified purchase{stats.verifiedPurchaseCount !== 1 ? 's' : ''}
            </div>
          )}
          {stats.withImagesCount > 0 && (
            <div>
              {stats.withImagesCount} review{stats.withImagesCount !== 1 ? 's' : ''} with images
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Compact version for product cards
export function ReviewStatsBadge({
  averageRating,
  totalReviews,
  className,
}: {
  averageRating: number;
  totalReviews: number;
  className?: string;
}) {
  if (totalReviews === 0) return null;

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <StarRating rating={averageRating} size="sm" />
      <span className="text-sm text-muted-foreground">
        {averageRating.toFixed(1)} ({totalReviews})
      </span>
    </div>
  );
}
