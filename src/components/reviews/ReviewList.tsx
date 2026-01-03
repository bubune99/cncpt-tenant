'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, MessageSquarePlus, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ReviewCard, type Review } from './ReviewCard';
import { ReviewStats, type ReviewStatsData } from './ReviewStats';

interface ReviewListProps {
  productId: string;
  onWriteReview?: () => void;
  showStats?: boolean;
  className?: string;
}

type SortOption = 'helpfulCount' | 'createdAt' | 'rating_high' | 'rating_low';

export function ReviewList({
  productId,
  onWriteReview,
  showStats = true,
  className,
}: ReviewListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState<SortOption>('helpfulCount');
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [filterVerified, setFilterVerified] = useState(false);

  const fetchReviews = async (pageNum: number, append: boolean = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const params = new URLSearchParams({
        page: pageNum.toString(),
        pageSize: '10',
      });

      // Handle sort
      if (sortBy === 'rating_high') {
        params.set('sortBy', 'rating');
        params.set('sortDir', 'desc');
      } else if (sortBy === 'rating_low') {
        params.set('sortBy', 'rating');
        params.set('sortDir', 'asc');
      } else {
        params.set('sortBy', sortBy);
        params.set('sortDir', 'desc');
      }

      const response = await fetch(`/api/reviews/product/${productId}?${params}`);
      if (!response.ok) throw new Error('Failed to fetch reviews');

      const data = await response.json();

      if (append) {
        setReviews((prev) => [...prev, ...data.reviews]);
      } else {
        setReviews(data.reviews);
      }

      setTotalPages(data.totalPages);
      if (data.stats) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchReviews(1);
  }, [productId, sortBy]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchReviews(nextPage, true);
  };

  const handleVote = async (reviewId: string, helpful: boolean) => {
    const response = await fetch(`/api/reviews/${reviewId}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ helpful }),
    });

    if (!response.ok) {
      throw new Error('Failed to vote');
    }
  };

  const handleFilterByRating = (rating: number | null) => {
    setFilterRating(rating);
  };

  // Filter reviews client-side for rating filter
  const filteredReviews = reviews.filter((review) => {
    if (filterRating && review.rating !== filterRating) return false;
    if (filterVerified && !review.isVerifiedPurchase) return false;
    return true;
  });

  if (loading) {
    return (
      <div className={cn('flex items-center justify-center py-12', className)}>
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start gap-6">
        {/* Stats */}
        {showStats && stats && (
          <div className="w-full md:w-64 flex-shrink-0">
            <ReviewStats
              stats={stats}
              onFilterByRating={handleFilterByRating}
              selectedRating={filterRating}
            />
          </div>
        )}

        {/* Reviews Content */}
        <div className="flex-1 space-y-4">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Select
                value={sortBy}
                onValueChange={(value) => setSortBy(value as SortOption)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="helpfulCount">Most Helpful</SelectItem>
                  <SelectItem value="createdAt">Most Recent</SelectItem>
                  <SelectItem value="rating_high">Highest Rated</SelectItem>
                  <SelectItem value="rating_low">Lowest Rated</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant={filterVerified ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterVerified(!filterVerified)}
              >
                <Filter className="h-4 w-4 mr-1" />
                Verified Only
              </Button>
            </div>

            {onWriteReview && (
              <Button onClick={onWriteReview}>
                <MessageSquarePlus className="h-4 w-4 mr-2" />
                Write a Review
              </Button>
            )}
          </div>

          {/* Active Filters */}
          {(filterRating || filterVerified) && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Filters:</span>
              {filterRating && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-7"
                  onClick={() => setFilterRating(null)}
                >
                  {filterRating} star{filterRating !== 1 ? 's' : ''} &times;
                </Button>
              )}
              {filterVerified && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-7"
                  onClick={() => setFilterVerified(false)}
                >
                  Verified only &times;
                </Button>
              )}
            </div>
          )}

          {/* Reviews List */}
          {filteredReviews.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {reviews.length === 0 ? (
                <>
                  <MessageSquarePlus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No reviews yet</p>
                  <p className="text-sm">Be the first to review this product!</p>
                  {onWriteReview && (
                    <Button className="mt-4" onClick={onWriteReview}>
                      Write a Review
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <p className="text-lg font-medium">No matching reviews</p>
                  <p className="text-sm">Try adjusting your filters</p>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReviews.map((review) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  onVote={handleVote}
                />
              ))}
            </div>
          )}

          {/* Load More */}
          {page < totalPages && !filterRating && !filterVerified && (
            <div className="text-center pt-4">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Loading...
                  </>
                ) : (
                  'Load More Reviews'
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
