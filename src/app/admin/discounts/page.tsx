'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  Plus,
  MoreVertical,
  Tag,
  Percent,
  DollarSign,
  Truck,
  Gift,
  RefreshCw,
  Calendar,
  Users,
  Copy,
  Trash2,
  Edit,
  ExternalLink,
  Loader2,
  AlertCircle,
  CheckCircle,
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

interface DiscountCode {
  id: string;
  code: string;
  description: string | null;
  type: 'PERCENTAGE' | 'FIXED' | 'FREE_SHIPPING' | 'BUY_X_GET_Y';
  value: number;
  minOrderValue: number | null;
  maxDiscount: number | null;
  applyTo: string;
  usageLimit: number | null;
  usageCount: number;
  perCustomer: number | null;
  firstOrderOnly: boolean;
  startsAt: string;
  expiresAt: string | null;
  enabled: boolean;
  stripeCouponId: string | null;
  stripePromotionCodeId: string | null;
  stripeSyncEnabled: boolean;
  stripeSyncedAt: string | null;
  revenue: number;
  ordersCount: number;
  status: 'active' | 'scheduled' | 'expired' | 'disabled' | 'depleted';
  _count: {
    usages: number;
    orders: number;
  };
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function DiscountsPage() {
  const [discounts, setDiscounts] = useState<DiscountCode[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    discount: DiscountCode | null;
    deleting: boolean;
  }>({
    open: false,
    discount: null,
    deleting: false,
  });

  useEffect(() => {
    fetchDiscounts();
  }, [statusFilter, typeFilter]);

  const fetchDiscounts = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', String(page));
      params.append('limit', '20');
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (typeFilter !== 'all') params.append('type', typeFilter);
      if (searchTerm) params.append('search', searchTerm);

      const response = await fetch(`/api/discounts?${params}`);
      if (response.ok) {
        const data = await response.json();
        setDiscounts(data.discounts);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch discounts:', error);
      sonnerToast.error('Failed to load discounts');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDiscounts();
  };

  const handleSync = async (discountId: string) => {
    setSyncingId(discountId);
    try {
      const response = await fetch(`/api/discounts/${discountId}/sync`, {
        method: 'POST',
      });
      const data = await response.json();
      if (response.ok) {
        sonnerToast.success('Synced with Stripe successfully');
        fetchDiscounts();
      } else {
        sonnerToast.error(data.error || 'Failed to sync with Stripe');
      }
    } catch (error) {
      sonnerToast.error('Failed to sync with Stripe');
    } finally {
      setSyncingId(null);
    }
  };

  const handleToggleEnabled = async (discount: DiscountCode) => {
    try {
      const response = await fetch(`/api/discounts/${discount.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !discount.enabled }),
      });
      if (response.ok) {
        sonnerToast.success(discount.enabled ? 'Discount disabled' : 'Discount enabled');
        fetchDiscounts();
      }
    } catch (error) {
      sonnerToast.error('Failed to update discount');
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.discount) return;
    setDeleteDialog((prev) => ({ ...prev, deleting: true }));

    try {
      const response = await fetch(`/api/discounts/${deleteDialog.discount.id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (response.ok) {
        sonnerToast.success(data.softDeleted ? 'Discount disabled' : 'Discount deleted');
        setDeleteDialog({ open: false, discount: null, deleting: false });
        fetchDiscounts();
      } else {
        sonnerToast.error(data.error || 'Failed to delete discount');
      }
    } catch (error) {
      sonnerToast.error('Failed to delete discount');
    } finally {
      setDeleteDialog((prev) => ({ ...prev, deleting: false }));
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    sonnerToast.success('Code copied to clipboard');
  };

  const formatValue = (discount: DiscountCode) => {
    switch (discount.type) {
      case 'PERCENTAGE':
        return `${discount.value}%`;
      case 'FIXED':
        return `$${(discount.value / 100).toFixed(2)}`;
      case 'FREE_SHIPPING':
        return 'Free Shipping';
      case 'BUY_X_GET_Y':
        return `${discount.value}% BOGO`;
      default:
        return discount.value;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'PERCENTAGE':
        return <Percent className="h-4 w-4" />;
      case 'FIXED':
        return <DollarSign className="h-4 w-4" />;
      case 'FREE_SHIPPING':
        return <Truck className="h-4 w-4" />;
      case 'BUY_X_GET_Y':
        return <Gift className="h-4 w-4" />;
      default:
        return <Tag className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-600">Active</Badge>;
      case 'scheduled':
        return <Badge className="bg-blue-600">Scheduled</Badge>;
      case 'expired':
        return <Badge variant="secondary">Expired</Badge>;
      case 'disabled':
        return <Badge variant="outline">Disabled</Badge>;
      case 'depleted':
        return <Badge variant="destructive">Depleted</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const filteredDiscounts = discounts.filter((discount) =>
    discount.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    discount.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate stats
  const stats = {
    total: discounts.length,
    active: discounts.filter((d) => d.status === 'active').length,
    totalRevenue: discounts.reduce((sum, d) => sum + d.revenue, 0),
    totalUsage: discounts.reduce((sum, d) => sum + d.usageCount, 0),
  };

  if (loading && discounts.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Discount Codes</h1>
          <p className="text-muted-foreground mt-2">
            Manage discount codes and promotions
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/discounts/create">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Discount
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Discounts</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.active} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usage</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsage}</div>
            <p className="text-xs text-muted-foreground">
              Times redeemed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Savings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(stats.totalRevenue / 100).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Customer savings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stripe Synced</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {discounts.filter((d) => d.stripePromotionCodeId).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Of {stats.total} total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSearch} className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by code or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="disabled">Disabled</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                  <SelectItem value="FIXED">Fixed Amount</SelectItem>
                  <SelectItem value="FREE_SHIPPING">Free Shipping</SelectItem>
                  <SelectItem value="BUY_X_GET_Y">Buy X Get Y</SelectItem>
                </SelectContent>
              </Select>

              <Button type="submit" variant="secondary">
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Discount List */}
      <Card>
        <CardHeader>
          <CardTitle>All Discounts</CardTitle>
          <CardDescription>
            {filteredDiscounts.length} discount{filteredDiscounts.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredDiscounts.map((discount) => (
              <div key={discount.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        {getTypeIcon(discount.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold font-mono">{discount.code}</h3>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => copyCode(discount.code)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          {getStatusBadge(discount.status)}
                          {discount.stripePromotionCodeId && (
                            <Badge variant="outline" className="gap-1">
                              <ExternalLink className="h-3 w-3" />
                              Stripe
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {discount.description || formatValue(discount)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 mt-3 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Tag className="h-4 w-4" />
                        {formatValue(discount)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {discount.usageCount}
                        {discount.usageLimit ? `/${discount.usageLimit}` : ''} uses
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        ${(discount.revenue / 100).toFixed(2)} saved
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {discount.expiresAt
                          ? `Expires ${new Date(discount.expiresAt).toLocaleDateString()}`
                          : 'No expiry'}
                      </div>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/discounts/${discount.id}`}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => copyCode(discount.code)}>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Code
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {discount.stripeSyncEnabled && (
                        <DropdownMenuItem
                          onClick={() => handleSync(discount.id)}
                          disabled={syncingId === discount.id}
                        >
                          {syncingId === discount.id ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4 mr-2" />
                          )}
                          Sync to Stripe
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => handleToggleEnabled(discount)}>
                        {discount.enabled ? (
                          <>
                            <AlertCircle className="h-4 w-4 mr-2" />
                            Disable
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Enable
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => setDeleteDialog({ open: true, discount, deleting: false })}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}

            {filteredDiscounts.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No discounts found
              </div>
            )}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() => fetchDiscounts(pagination.page - 1)}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchDiscounts(pagination.page + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <Dialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, discount: null, deleting: false })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Discount</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the discount code &quot;{deleteDialog.discount?.code}&quot;?
              {deleteDialog.discount?._count.usages ? (
                <span className="block mt-2 text-amber-600">
                  This code has been used {deleteDialog.discount._count.usages} times.
                  It will be disabled instead of deleted.
                </span>
              ) : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialog({ open: false, discount: null, deleting: false })}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteDialog.deleting}
            >
              {deleteDialog.deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
