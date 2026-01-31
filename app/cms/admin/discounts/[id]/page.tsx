'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { Textarea } from '../../../../components/ui/textarea';
import { Switch } from '../../../../components/ui/switch';
import { Badge } from '../../../../components/ui/badge';
import { toast as sonnerToast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../../components/ui/select';
import {
  ArrowLeft,
  Loader2,
  RefreshCw,
  ExternalLink,
  Trash2,
  Users,
  DollarSign,
  Calendar,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../../components/ui/dialog';

interface DiscountCode {
  id: string;
  code: string;
  description: string | null;
  type: 'PERCENTAGE' | 'FIXED' | 'FREE_SHIPPING' | 'BUY_X_GET_Y';
  value: number;
  minOrderValue: number | null;
  maxDiscount: number | null;
  applyTo: 'ORDER' | 'PRODUCT' | 'CATEGORY' | 'SHIPPING';
  productIds: string[];
  categoryIds: string[];
  excludeProductIds: string[];
  excludeSaleItems: boolean;
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
  status: string;
  _count: {
    usages: number;
    orders: number;
  };
  usages: Array<{
    id: string;
    orderId: string;
    email: string;
    discountAmount: number;
    createdAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

interface FormData {
  code: string;
  description: string;
  type: 'PERCENTAGE' | 'FIXED' | 'FREE_SHIPPING' | 'BUY_X_GET_Y';
  value: string;
  minOrderValue: string;
  maxDiscount: string;
  applyTo: 'ORDER' | 'PRODUCT' | 'CATEGORY' | 'SHIPPING';
  usageLimit: string;
  perCustomer: string;
  firstOrderOnly: boolean;
  excludeSaleItems: boolean;
  startsAt: string;
  expiresAt: string;
  enabled: boolean;
  stripeSyncEnabled: boolean;
}

export default function EditDiscountPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [discount, setDiscount] = useState<DiscountCode | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Form state
  const [formData, setFormData] = useState<FormData>({
    code: '',
    description: '',
    type: 'PERCENTAGE',
    value: '',
    minOrderValue: '',
    maxDiscount: '',
    applyTo: 'ORDER',
    usageLimit: '',
    perCustomer: '',
    firstOrderOnly: false,
    excludeSaleItems: false,
    startsAt: '',
    expiresAt: '',
    enabled: true,
    stripeSyncEnabled: true,
  });

  useEffect(() => {
    fetchDiscount();
  }, [id]);

  const fetchDiscount = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/discounts/${id}`);
      if (!response.ok) {
        if (response.status === 404) {
          sonnerToast.error('Discount not found');
          router.push('/admin/discounts');
          return;
        }
        throw new Error('Failed to fetch discount');
      }
      const data = await response.json();
      setDiscount(data);

      // Populate form
      setFormData({
        code: data.code,
        description: data.description || '',
        type: data.type,
        value: data.type === 'FIXED' ? (data.value / 100).toString() : data.value.toString(),
        minOrderValue: data.minOrderValue ? (data.minOrderValue / 100).toString() : '',
        maxDiscount: data.maxDiscount ? (data.maxDiscount / 100).toString() : '',
        applyTo: data.applyTo,
        usageLimit: data.usageLimit?.toString() || '',
        perCustomer: data.perCustomer?.toString() || '',
        firstOrderOnly: data.firstOrderOnly,
        excludeSaleItems: data.excludeSaleItems,
        startsAt: data.startsAt.split('T')[0],
        expiresAt: data.expiresAt ? data.expiresAt.split('T')[0] : '',
        enabled: data.enabled,
        stripeSyncEnabled: data.stripeSyncEnabled,
      });
    } catch (error) {
      console.error('Fetch discount error:', error);
      sonnerToast.error('Failed to load discount');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const data: Record<string, unknown> = {
        code: formData.code.toUpperCase().trim(),
        description: formData.description || null,
        type: formData.type,
        applyTo: formData.applyTo,
        firstOrderOnly: formData.firstOrderOnly,
        excludeSaleItems: formData.excludeSaleItems,
        enabled: formData.enabled,
        stripeSyncEnabled: formData.stripeSyncEnabled,
      };

      // Convert value based on type
      if (formData.type === 'PERCENTAGE' || formData.type === 'BUY_X_GET_Y') {
        data.value = parseInt(formData.value, 10);
      } else if (formData.type === 'FIXED') {
        data.value = Math.round(parseFloat(formData.value) * 100);
      } else {
        data.value = 0;
      }

      // Optional fields
      data.minOrderValue = formData.minOrderValue
        ? Math.round(parseFloat(formData.minOrderValue) * 100)
        : null;
      data.maxDiscount = formData.maxDiscount
        ? Math.round(parseFloat(formData.maxDiscount) * 100)
        : null;
      data.usageLimit = formData.usageLimit ? parseInt(formData.usageLimit, 10) : null;
      data.perCustomer = formData.perCustomer ? parseInt(formData.perCustomer, 10) : null;
      data.startsAt = formData.startsAt ? new Date(formData.startsAt).toISOString() : undefined;
      data.expiresAt = formData.expiresAt ? new Date(formData.expiresAt).toISOString() : null;

      const response = await fetch(`/api/discounts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        sonnerToast.success('Discount updated successfully');
        fetchDiscount();
      } else {
        const result = await response.json();
        sonnerToast.error(result.error || 'Failed to update discount');
      }
    } catch (error) {
      console.error('Update discount error:', error);
      sonnerToast.error('Failed to update discount');
    } finally {
      setSaving(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const response = await fetch(`/api/discounts/${id}/sync`, { method: 'POST' });
      const data = await response.json();
      if (response.ok) {
        sonnerToast.success('Synced with Stripe');
        fetchDiscount();
      } else {
        sonnerToast.error(data.error || 'Failed to sync');
      }
    } catch (error) {
      sonnerToast.error('Failed to sync with Stripe');
    } finally {
      setSyncing(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const response = await fetch(`/api/discounts/${id}`, { method: 'DELETE' });
      if (response.ok) {
        sonnerToast.success('Discount deleted');
        router.push('/admin/discounts');
      } else {
        const data = await response.json();
        sonnerToast.error(data.error || 'Failed to delete');
      }
    } catch (error) {
      sonnerToast.error('Failed to delete discount');
    } finally {
      setDeleting(false);
      setDeleteDialog(false);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!discount) {
    return null;
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/discounts">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold font-mono">{discount.code}</h1>
              {getStatusBadge(discount.status)}
            </div>
            <p className="text-muted-foreground mt-1">
              Edit discount code settings
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {formData.stripeSyncEnabled && (
            <Button variant="outline" onClick={handleSync} disabled={syncing}>
              {syncing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              {discount.stripePromotionCodeId ? 'Sync to Stripe' : 'Push to Stripe'}
            </Button>
          )}
          <Button variant="destructive" onClick={() => setDeleteDialog(true)}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Uses</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {discount.usageCount}
              {discount.usageLimit ? `/${discount.usageLimit}` : ''}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Savings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(discount.revenue / 100).toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orders</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{discount.ordersCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stripe Status</CardTitle>
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {discount.stripePromotionCodeId ? (
                <Badge className="bg-green-600">Synced</Badge>
              ) : (
                <Badge variant="outline">Not synced</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="code">Discount Code *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  className="font-mono"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Discount Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, type: value as typeof formData.type }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENTAGE">Percentage Off</SelectItem>
                    <SelectItem value="FIXED">Fixed Amount Off</SelectItem>
                    <SelectItem value="FREE_SHIPPING">Free Shipping</SelectItem>
                    <SelectItem value="BUY_X_GET_Y">Buy X Get Y</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                rows={2}
              />
            </div>

            {formData.type !== 'FREE_SHIPPING' && (
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="value">
                    {formData.type === 'PERCENTAGE' || formData.type === 'BUY_X_GET_Y'
                      ? 'Percentage *'
                      : 'Amount ($) *'}
                  </Label>
                  <Input
                    id="value"
                    type="number"
                    value={formData.value}
                    onChange={(e) => setFormData((prev) => ({ ...prev, value: e.target.value }))}
                    min="0"
                    step={formData.type === 'FIXED' ? '0.01' : '1'}
                    required
                  />
                </div>

                {formData.type === 'PERCENTAGE' && (
                  <div className="space-y-2">
                    <Label htmlFor="maxDiscount">Max Discount ($)</Label>
                    <Input
                      id="maxDiscount"
                      type="number"
                      value={formData.maxDiscount}
                      onChange={(e) => setFormData((prev) => ({ ...prev, maxDiscount: e.target.value }))}
                      min="0"
                      step="0.01"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="minOrderValue">Minimum Order ($)</Label>
                  <Input
                    id="minOrderValue"
                    type="number"
                    value={formData.minOrderValue}
                    onChange={(e) => setFormData((prev) => ({ ...prev, minOrderValue: e.target.value }))}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="applyTo">Apply To</Label>
              <Select
                value={formData.applyTo}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, applyTo: value as typeof formData.applyTo }))}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ORDER">Entire Order</SelectItem>
                  <SelectItem value="PRODUCT">Specific Products</SelectItem>
                  <SelectItem value="CATEGORY">Specific Categories</SelectItem>
                  <SelectItem value="SHIPPING">Shipping Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Usage Limits */}
        <Card>
          <CardHeader>
            <CardTitle>Usage Limits</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="usageLimit">Total Usage Limit</Label>
                <Input
                  id="usageLimit"
                  type="number"
                  placeholder="Unlimited"
                  value={formData.usageLimit}
                  onChange={(e) => setFormData((prev) => ({ ...prev, usageLimit: e.target.value }))}
                  min="1"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="perCustomer">Per Customer Limit</Label>
                <Input
                  id="perCustomer"
                  type="number"
                  placeholder="Unlimited"
                  value={formData.perCustomer}
                  onChange={(e) => setFormData((prev) => ({ ...prev, perCustomer: e.target.value }))}
                  min="1"
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label>First Order Only</Label>
                <p className="text-sm text-muted-foreground">
                  Only allow on first orders
                </p>
              </div>
              <Switch
                checked={formData.firstOrderOnly}
                onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, firstOrderOnly: checked }))}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label>Exclude Sale Items</Label>
                <p className="text-sm text-muted-foreground">
                  Don&apos;t apply to items already on sale
                </p>
              </div>
              <Switch
                checked={formData.excludeSaleItems}
                onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, excludeSaleItems: checked }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Validity Period */}
        <Card>
          <CardHeader>
            <CardTitle>Validity Period</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="startsAt">Start Date</Label>
                <Input
                  id="startsAt"
                  type="date"
                  value={formData.startsAt}
                  onChange={(e) => setFormData((prev) => ({ ...prev, startsAt: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiresAt">Expiry Date</Label>
                <Input
                  id="expiresAt"
                  type="date"
                  value={formData.expiresAt}
                  onChange={(e) => setFormData((prev) => ({ ...prev, expiresAt: e.target.value }))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label>Enabled</Label>
                <p className="text-sm text-muted-foreground">
                  Discount can be used by customers
                </p>
              </div>
              <Switch
                checked={formData.enabled}
                onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, enabled: checked }))}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Label>Sync with Stripe</Label>
                  <RefreshCw className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                  {discount.stripePromotionCodeId
                    ? `Synced: ${discount.stripePromotionCodeId}`
                    : 'Create promotion code in Stripe'}
                </p>
              </div>
              <Switch
                checked={formData.stripeSyncEnabled}
                onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, stripeSyncEnabled: checked }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Recent Usage */}
        {discount.usages.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Recent Usage</CardTitle>
              <CardDescription>Last 10 times this code was used</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {discount.usages.map((usage) => (
                  <div
                    key={usage.id}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div>
                      <p className="font-medium">{usage.email}</p>
                      <p className="text-sm text-muted-foreground">
                        Order: {usage.orderId}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        -${(usage.discountAmount / 100).toFixed(2)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(usage.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex items-center gap-4">
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
          <Link href="/admin/discounts">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
        </div>
      </form>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Discount</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{discount.code}&quot;?
              {discount._count.usages > 0 && (
                <span className="block mt-2 text-amber-600">
                  This code has been used {discount._count.usages} times.
                  It will be disabled instead of deleted.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(false)}>
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
