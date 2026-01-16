'use client';

import { useState } from 'react';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { ThumbsUp, ThumbsDown, ShieldCheck, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { cn } from '../../lib/utils';
import { StarRating } from './StarRating';

export interface Review {
  id: string;
  reviewerName: string;
  rating: number;
  title: string | null;
  content: string;
  pros: string | null;
  cons: string | null;
  images: string[];
  isVerifiedPurchase: boolean;
  helpfulCount: number;
  notHelpfulCount: number;
  storeResponse: string | null;
  storeResponseAt: string | null;
  createdAt: string;
}

interface ReviewCardProps {
  review: Review;
  onVote?: (reviewId: string, helpful: boolean) => Promise<void>;
  showProduct?: boolean;
  productName?: string;
  className?: string;
}

export function ReviewCard({
  review,
  onVote,
  showProduct = false,
  productName,
  className,
}: ReviewCardProps) {
  const [voting, setVoting] = useState<'helpful' | 'not_helpful' | null>(null);
  const [localVotes, setLocalVotes] = useState({
    helpful: review.helpfulCount,
    notHelpful: review.notHelpfulCount,
  });
  const [hasVoted, setHasVoted] = useState(false);
  const [showFullContent, setShowFullContent] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const contentIsLong = review.content.length > 300;
  const displayContent = contentIsLong && !showFullContent
    ? `${review.content.slice(0, 300)}...`
    : review.content;

  const handleVote = async (helpful: boolean) => {
    if (hasVoted || !onVote) return;

    try {
      setVoting(helpful ? 'helpful' : 'not_helpful');
      await onVote(review.id, helpful);
      setLocalVotes((prev) => ({
        helpful: helpful ? prev.helpful + 1 : prev.helpful,
        notHelpful: !helpful ? prev.notHelpful + 1 : prev.notHelpful,
      }));
      setHasVoted(true);
    } catch (error) {
      console.error('Failed to vote:', error);
    } finally {
      setVoting(null);
    }
  };

  return (
    <div className={cn('border rounded-lg p-4 space-y-3', className)}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <StarRating rating={review.rating} size="sm" />
            {review.isVerifiedPurchase && (
              <Badge variant="secondary" className="gap-1 text-xs">
                <ShieldCheck className="h-3 w-3" />
                Verified
              </Badge>
            )}
          </div>
          {review.title && (
            <h4 className="font-semibold">{review.title}</h4>
          )}
        </div>
        <div className="text-sm text-muted-foreground text-right">
          <div className="font-medium">{review.reviewerName}</div>
          <div>{formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}</div>
        </div>
      </div>

      {showProduct && productName && (
        <p className="text-sm text-muted-foreground">
          Review for <span className="font-medium">{productName}</span>
        </p>
      )}

      {/* Content */}
      <div className="space-y-2">
        <p className="text-sm whitespace-pre-wrap">{displayContent}</p>
        {contentIsLong && (
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-0 text-primary"
            onClick={() => setShowFullContent(!showFullContent)}
          >
            {showFullContent ? (
              <>
                Show less <ChevronUp className="h-3 w-3 ml-1" />
              </>
            ) : (
              <>
                Read more <ChevronDown className="h-3 w-3 ml-1" />
              </>
            )}
          </Button>
        )}
      </div>

      {/* Pros & Cons */}
      {(review.pros || review.cons) && (
        <div className="grid gap-2 md:grid-cols-2 text-sm">
          {review.pros && (
            <div className="flex items-start gap-2">
              <ThumbsUp className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
              <span className="text-muted-foreground">{review.pros}</span>
            </div>
          )}
          {review.cons && (
            <div className="flex items-start gap-2">
              <ThumbsDown className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
              <span className="text-muted-foreground">{review.cons}</span>
            </div>
          )}
        </div>
      )}

      {/* Images */}
      {review.images && review.images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {review.images.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedImage(image)}
              className="relative h-16 w-16 rounded overflow-hidden border hover:border-primary transition-colors"
            >
              <Image
                src={image}
                alt={`Review image ${index + 1}`}
                fill
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Store Response */}
      {review.storeResponse && (
        <div className="bg-muted/50 rounded-lg p-3 space-y-1">
          <div className="flex items-center gap-2 text-sm font-medium">
            <MessageSquare className="h-4 w-4" />
            Store Response
          </div>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {review.storeResponse}
          </p>
          {review.storeResponseAt && (
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(review.storeResponseAt), { addSuffix: true })}
            </p>
          )}
        </div>
      )}

      {/* Helpfulness */}
      {onVote && (
        <div className="flex items-center gap-4 pt-2 border-t">
          <span className="text-sm text-muted-foreground">Was this helpful?</span>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'h-8 gap-1',
                hasVoted && 'opacity-50 cursor-not-allowed'
              )}
              onClick={() => handleVote(true)}
              disabled={hasVoted || voting !== null}
            >
              <ThumbsUp className={cn('h-4 w-4', voting === 'helpful' && 'animate-pulse')} />
              <span>{localVotes.helpful}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'h-8 gap-1',
                hasVoted && 'opacity-50 cursor-not-allowed'
              )}
              onClick={() => handleVote(false)}
              disabled={hasVoted || voting !== null}
            >
              <ThumbsDown className={cn('h-4 w-4', voting === 'not_helpful' && 'animate-pulse')} />
              <span>{localVotes.notHelpful}</span>
            </Button>
          </div>
        </div>
      )}

      {/* Image Lightbox */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Image</DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <div className="relative aspect-video">
              <Image
                src={selectedImage}
                alt="Review image"
                fill
                className="object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
