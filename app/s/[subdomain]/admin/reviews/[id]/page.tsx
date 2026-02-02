'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCMSConfig } from '@/contexts/CMSConfigContext';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/cms/ui/card';
import { Button } from '@/components/cms/ui/button';
import { Badge } from '@/components/cms/ui/badge';
import { Textarea } from '@/components/cms/ui/textarea';
import { Label } from '@/components/cms/ui/label';
import { toast as sonnerToast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/cms/ui/dialog';
import {
  ArrowLeft,
  Star,
  CheckCircle,
  XCircle,
  Flag,
  Clock,
  ThumbsUp,
  ThumbsDown,
  Trash2,
  Loader2,
  ShieldCheck,
  MessageSquare,
  User,
  Mail,
  Package,
  Calendar,
  ExternalLink,
  Image as ImageIcon,
  AlertCircle,
} from 'lucide-react';

interface Review {
  id: string;
  productId: string;
  userId: string | null;
  orderId: string | null;
  reviewerName: string;
  reviewerEmail: string;
  rating: number;
  title: string | null;
  content: string;
  pros: string | null;
  cons: string | null;
  images: string[];
  isVerifiedPurchase: boolean;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'FLAGGED';
  moderationNotes: string | null;
  storeResponse: string | null;
  storeResponseAt: string | null;
  helpfulCount: number;
  notHelpfulCount: number;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  updatedAt: string;
  product: {
    id: string;
    name: string;
    slug: string;
    images: Array<{ url: string }>;
  };
  user: {
    id: string;
    name: string | null;
  } | null;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ReviewDetailPage({ params }: PageProps) {
  const { buildPath } = useCMSConfig();
  const { id } = use(params);
  const router = useRouter();
  const [review, setReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [responseDialog, setResponseDialog] = useState(false);
  const [storeResponse, setStoreResponse] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    fetchReview();
  }, [id]);

  const fetchReview = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/reviews/${id}`);
      if (!response.ok) {
        if (response.status === 404) {
          sonnerToast.error('Review not found');
          router.push('/admin/reviews');
          return;
        }
        throw new Error('Failed to fetch review');
      }
      const data = await response.json();
      setReview(data);
      setStoreResponse(data.storeResponse || '');
    } catch (error) {
      console.error('Error fetching review:', error);
      sonnerToast.error('Failed to load review');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: 'approve' | 'reject' | 'flag') => {
    try {
      setActionLoading(action);
      const response = await fetch(`/api/reviews/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) {
        throw new Error('Failed to update review');
      }

      const data = await response.json();
      setReview(data);

      const messages = {
        approve: 'Review approved',
        reject: 'Review rejected',
        flag: 'Review flagged for investigation',
      };
      sonnerToast.success(messages[action]);
    } catch (error) {
      console.error('Error updating review:', error);
      sonnerToast.error('Failed to update review');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSubmitResponse = async () => {
    if (!storeResponse.trim()) {
      sonnerToast.error('Please enter a response');
      return;
    }

    try {
      setActionLoading('response');
      const response = await fetch(`/api/reviews/${id}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response: storeResponse }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit response');
      }

      const data = await response.json();
      setReview(data);
      setResponseDialog(false);
      sonnerToast.success('Store response added');
    } catch (error) {
      console.error('Error submitting response:', error);
      sonnerToast.error('Failed to submit response');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    try {
      setActionLoading('delete');
      const response = await fetch(`/api/reviews/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete review');
      }

      sonnerToast.success('Review deleted');
      router.push('/admin/reviews');
    } catch (error) {
      console.error('Error deleting review:', error);
      sonnerToast.error('Failed to delete review');
    } finally {
      setActionLoading(null);
      setDeleteDialog(false);
    }
  };

  const getStatusBadge = (status: Review['status']) => {
    const config = {
      PENDING: { label: 'Pending', variant: 'secondary' as const, icon: Clock },
      APPROVED: { label: 'Approved', variant: 'default' as const, icon: CheckCircle },
      REJECTED: { label: 'Rejected', variant: 'destructive' as const, icon: XCircle },
      FLAGGED: { label: 'Flagged', variant: 'outline' as const, icon: Flag },
    };
    const { label, variant, icon: Icon } = config[status];
    return (
      <Badge variant={variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    );
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-5 w-5 ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'fill-gray-200 text-gray-200'
            }`}
          />
        ))}
        <span className="ml-2 text-lg font-medium">{rating}/5</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!review) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">Review not found</p>
        <Button asChild>
          <Link href={buildPath('/admin/reviews')}>Back to Reviews</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={buildPath('/admin/reviews')}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Review Details</h1>
            <p className="text-muted-foreground">
              Review for {review.product.name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {review.status !== 'APPROVED' && (
            <Button
              onClick={() => handleAction('approve')}
              disabled={!!actionLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {actionLoading === 'approve' ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Approve
            </Button>
          )}
          {review.status !== 'REJECTED' && (
            <Button
              variant="outline"
              onClick={() => handleAction('reject')}
              disabled={!!actionLoading}
            >
              {actionLoading === 'reject' ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              Reject
            </Button>
          )}
          {review.status !== 'FLAGGED' && (
            <Button
              variant="outline"
              onClick={() => handleAction('flag')}
              disabled={!!actionLoading}
            >
              {actionLoading === 'flag' ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Flag className="h-4 w-4 mr-2" />
              )}
              Flag
            </Button>
          )}
          <Button
            variant="destructive"
            onClick={() => setDeleteDialog(true)}
            disabled={!!actionLoading}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Review Content */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  {renderStars(review.rating)}
                  {review.title && (
                    <h3 className="text-xl font-semibold">{review.title}</h3>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(review.status)}
                  {review.isVerifiedPurchase && (
                    <Badge variant="secondary" className="gap-1">
                      <ShieldCheck className="h-3 w-3" />
                      Verified Purchase
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="prose prose-sm max-w-none">
                <p className="whitespace-pre-wrap">{review.content}</p>
              </div>

              {/* Pros & Cons */}
              {(review.pros || review.cons) && (
                <div className="grid gap-4 md:grid-cols-2 pt-4 border-t">
                  {review.pros && (
                    <div>
                      <h4 className="font-medium text-green-600 mb-2 flex items-center gap-2">
                        <ThumbsUp className="h-4 w-4" />
                        Pros
                      </h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {review.pros}
                      </p>
                    </div>
                  )}
                  {review.cons && (
                    <div>
                      <h4 className="font-medium text-red-600 mb-2 flex items-center gap-2">
                        <ThumbsDown className="h-4 w-4" />
                        Cons
                      </h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {review.cons}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Images */}
              {review.images && review.images.length > 0 && (
                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    Review Images ({review.images.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {review.images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImage(image)}
                        className="relative h-20 w-20 rounded-lg overflow-hidden border hover:border-primary transition-colors"
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
                </div>
              )}

              {/* Helpfulness */}
              <div className="pt-4 border-t flex items-center gap-4">
                <span className="text-sm text-muted-foreground">Helpfulness:</span>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 text-green-600">
                    <ThumbsUp className="h-4 w-4" />
                    <span className="text-sm font-medium">{review.helpfulCount}</span>
                  </div>
                  <div className="flex items-center gap-1 text-red-600">
                    <ThumbsDown className="h-4 w-4" />
                    <span className="text-sm font-medium">{review.notHelpfulCount}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Store Response */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Store Response
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setResponseDialog(true)}
                >
                  {review.storeResponse ? 'Edit Response' : 'Add Response'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {review.storeResponse ? (
                <div className="space-y-2">
                  <p className="whitespace-pre-wrap">{review.storeResponse}</p>
                  {review.storeResponseAt && (
                    <p className="text-xs text-muted-foreground">
                      Responded on {new Date(review.storeResponseAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">
                  No store response yet. Add a response to engage with the customer.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Product Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Product
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-4">
                <div className="relative h-16 w-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                  {review.product.images?.[0]?.url ? (
                    <Image
                      src={review.product.images[0].url}
                      alt={review.product.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <Package className="h-8 w-8 m-auto text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium truncate">{review.product.name}</h4>
                  <Link
                    href={buildPath(`/admin/products/${review.productId}`)}
                    className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                  >
                    View Product
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reviewer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Reviewer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>{review.reviewerName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a
                  href={`mailto:${review.reviewerEmail}`}
                  className="text-primary hover:underline text-sm"
                >
                  {review.reviewerEmail}
                </a>
              </div>
              {review.user && (
                <div className="pt-2 border-t">
                  <Link
                    href={buildPath(`/admin/customers/${review.userId}`)}
                    className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                  >
                    View Customer Profile
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              )}
              {review.orderId && (
                <div className="pt-2 border-t">
                  <Link
                    href={buildPath(`/admin/orders/${review.orderId}`)}
                    className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                  >
                    View Related Order
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Metadata
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>{new Date(review.createdAt).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Updated</span>
                <span>{new Date(review.updatedAt).toLocaleString()}</span>
              </div>
              {review.ipAddress && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">IP Address</span>
                  <span className="font-mono text-xs">{review.ipAddress}</span>
                </div>
              )}
              {review.moderationNotes && (
                <div className="pt-2 border-t">
                  <span className="text-muted-foreground block mb-1">Moderation Notes</span>
                  <p className="text-xs bg-muted p-2 rounded">
                    {review.moderationNotes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Review</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this review? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={actionLoading === 'delete'}
            >
              {actionLoading === 'delete' ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Store Response Dialog */}
      <Dialog open={responseDialog} onOpenChange={setResponseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Store Response</DialogTitle>
            <DialogDescription>
              Add a public response to this review. This will be visible to all customers.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="response">Response</Label>
              <Textarea
                id="response"
                value={storeResponse}
                onChange={(e) => setStoreResponse(e.target.value)}
                placeholder="Thank you for your feedback..."
                rows={5}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResponseDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitResponse}
              disabled={actionLoading === 'response' || !storeResponse.trim()}
            >
              {actionLoading === 'response' ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <MessageSquare className="h-4 w-4 mr-2" />
              )}
              {review.storeResponse ? 'Update Response' : 'Add Response'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Lightbox */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-3xl">
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
