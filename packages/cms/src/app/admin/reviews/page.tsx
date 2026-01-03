'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { toast as sonnerToast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Search,
  MoreVertical,
  Star,
  CheckCircle,
  XCircle,
  Flag,
  Clock,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Trash2,
  Eye,
  Loader2,
  ShieldCheck,
  Image as ImageIcon,
  AlertCircle,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ProductReview {
  id: string;
  productId: string;
  reviewerName: string;
  reviewerEmail: string;
  rating: number;
  title: string | null;
  content: string;
  pros: string | null;
  cons: string | null;
  images: string[] | null;
  isVerifiedPurchase: boolean;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'FLAGGED';
  helpfulCount: number;
  unhelpfulCount: number;
  responseContent: string | null;
  responseAt: string | null;
  createdAt: string;
  publishedAt: string | null;
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

interface DashboardStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  flagged: number;
  averageRating: number;
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedReviews, setSelectedReviews] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    review: ProductReview | null;
  }>({ open: false, review: null });
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchReviews();
    fetchStats();
  }, [page, statusFilter, ratingFilter]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: '20',
        sortBy: 'createdAt',
        sortDir: 'desc',
      });

      if (statusFilter !== 'all') {
        params.set('status', statusFilter);
      }
      if (ratingFilter !== 'all') {
        params.set('rating', ratingFilter);
      }
      if (searchTerm) {
        params.set('search', searchTerm);
      }

      const response = await fetch(`/api/reviews?${params}`);
      const data = await response.json();

      if (response.ok) {
        setReviews(data.reviews);
        setTotalPages(data.totalPages);
        setTotal(data.total);
      }
    } catch (error) {
      console.error('Fetch reviews error:', error);
      sonnerToast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/reviews/stats');
      const data = await response.json();
      if (response.ok) {
        setStats(data);
      }
    } catch (error) {
      console.error('Fetch stats error:', error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchReviews();
  };

  const handleAction = async (reviewId: string, action: 'approve' | 'reject' | 'flag') => {
    try {
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      if (response.ok) {
        sonnerToast.success(`Review ${action}d successfully`);
        fetchReviews();
        fetchStats();
      } else {
        const data = await response.json();
        sonnerToast.error(data.error || `Failed to ${action} review`);
      }
    } catch (error) {
      console.error(`${action} review error:`, error);
      sonnerToast.error(`Failed to ${action} review`);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.review) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/reviews/${deleteDialog.review.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        sonnerToast.success('Review deleted successfully');
        setDeleteDialog({ open: false, review: null });
        fetchReviews();
        fetchStats();
      } else {
        const data = await response.json();
        sonnerToast.error(data.error || 'Failed to delete review');
      }
    } catch (error) {
      console.error('Delete review error:', error);
      sonnerToast.error('Failed to delete review');
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedReviews.length === 0) return;

    try {
      const response = await fetch('/api/reviews/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: bulkAction,
          reviewIds: selectedReviews,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        sonnerToast.success(data.message);
        setSelectedReviews([]);
        setBulkAction(null);
        fetchReviews();
        fetchStats();
      } else {
        sonnerToast.error(data.error || 'Bulk action failed');
      }
    } catch (error) {
      console.error('Bulk action error:', error);
      sonnerToast.error('Bulk action failed');
    }
  };

  const toggleSelectAll = () => {
    if (selectedReviews.length === reviews.length) {
      setSelectedReviews([]);
    } else {
      setSelectedReviews(reviews.map((r) => r.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedReviews((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  const getStatusBadge = (status: ProductReview['status']) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'APPROVED':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'REJECTED':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      case 'FLAGGED':
        return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200"><Flag className="h-3 w-3 mr-1" />Flagged</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Reviews</h1>
        <p className="text-muted-foreground mt-1">
          Moderate and manage product reviews
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Flagged</CardTitle>
              <Flag className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.flagged}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
              <Star className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageRating.toFixed(1)}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Review Moderation</CardTitle>
          <CardDescription>
            Review and moderate customer reviews
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search reviews..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </form>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                  <SelectItem value="FLAGGED">Flagged</SelectItem>
                </SelectContent>
              </Select>
              <Select value={ratingFilter} onValueChange={(v) => { setRatingFilter(v); setPage(1); }}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ratings</SelectItem>
                  <SelectItem value="5">5 Stars</SelectItem>
                  <SelectItem value="4">4 Stars</SelectItem>
                  <SelectItem value="3">3 Stars</SelectItem>
                  <SelectItem value="2">2 Stars</SelectItem>
                  <SelectItem value="1">1 Star</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedReviews.length > 0 && (
            <div className="flex items-center gap-4 p-4 mb-4 bg-muted rounded-lg">
              <span className="text-sm font-medium">{selectedReviews.length} selected</span>
              <Select value={bulkAction || ''} onValueChange={setBulkAction}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Bulk Action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="approve">Approve</SelectItem>
                  <SelectItem value="reject">Reject</SelectItem>
                  <SelectItem value="delete">Delete</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleBulkAction} disabled={!bulkAction} size="sm">
                Apply
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setSelectedReviews([])}>
                Clear
              </Button>
            </div>
          )}

          {/* Reviews List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No reviews found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Select All */}
              <div className="flex items-center gap-2 pb-2 border-b">
                <Checkbox
                  checked={selectedReviews.length === reviews.length}
                  onCheckedChange={toggleSelectAll}
                />
                <span className="text-sm text-muted-foreground">Select All</span>
              </div>

              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="flex gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <Checkbox
                    checked={selectedReviews.includes(review.id)}
                    onCheckedChange={() => toggleSelect(review.id)}
                  />

                  {/* Product Image */}
                  <div className="flex-shrink-0">
                    {review.product.images[0] ? (
                      <img
                        src={review.product.images[0].url}
                        alt={review.product.name}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                        <ImageIcon className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Review Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          {renderStars(review.rating)}
                          {getStatusBadge(review.status)}
                          {review.isVerifiedPurchase && (
                            <Badge variant="secondary" className="text-xs">
                              <ShieldCheck className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          )}
                          {review.images && review.images.length > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              <ImageIcon className="h-3 w-3 mr-1" />
                              {review.images.length}
                            </Badge>
                          )}
                        </div>
                        {review.title && (
                          <h4 className="font-semibold">{review.title}</h4>
                        )}
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {review.content}
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/reviews/${review.id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {review.status !== 'APPROVED' && (
                            <DropdownMenuItem onClick={() => handleAction(review.id, 'approve')}>
                              <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                              Approve
                            </DropdownMenuItem>
                          )}
                          {review.status !== 'REJECTED' && (
                            <DropdownMenuItem onClick={() => handleAction(review.id, 'reject')}>
                              <XCircle className="h-4 w-4 mr-2 text-red-500" />
                              Reject
                            </DropdownMenuItem>
                          )}
                          {review.status !== 'FLAGGED' && (
                            <DropdownMenuItem onClick={() => handleAction(review.id, 'flag')}>
                              <Flag className="h-4 w-4 mr-2 text-orange-500" />
                              Flag
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setDeleteDialog({ open: true, review })}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                      <span className="font-medium">{review.reviewerName}</span>
                      <span>for</span>
                      <Link
                        href={`/admin/products/${review.product.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {review.product.name}
                      </Link>
                      <span>•</span>
                      <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="h-3 w-3" /> {review.helpfulCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <ThumbsDown className="h-3 w-3" /> {review.unhelpfulCount}
                      </span>
                      {review.responseContent && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-blue-600">
                            <MessageSquare className="h-3 w-3" /> Responded
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-muted-foreground">
                Showing {(page - 1) * 20 + 1} - {Math.min(page * 20, total)} of {total}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, review: deleteDialog.review })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Review</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this review? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {deleteDialog.review && (
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                {renderStars(deleteDialog.review.rating)}
                <span className="font-medium">{deleteDialog.review.reviewerName}</span>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {deleteDialog.review.content}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false, review: null })}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
