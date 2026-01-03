'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast as sonnerToast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Loader2, RefreshCw } from 'lucide-react';

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
  startsAt: string;
  expiresAt: string;
  enabled: boolean;
  stripeSyncEnabled: boolean;
}

export default function CreateDiscountPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
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
    startsAt: new Date().toISOString().split('T')[0],
    expiresAt: '',
    enabled: true,
    stripeSyncEnabled: true,
  });

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData((prev) => ({ ...prev, code }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.code) {
      sonnerToast.error('Discount code is required');
      return;
    }

    if (!formData.value || parseFloat(formData.value) <= 0) {
      sonnerToast.error('Valid discount value is required');
      return;
    }

    setLoading(true);
    try {
      // Prepare data
      const data: Record<string, unknown> = {
        code: formData.code.toUpperCase().trim(),
        description: formData.description || null,
        type: formData.type,
        applyTo: formData.applyTo,
        firstOrderOnly: formData.firstOrderOnly,
        enabled: formData.enabled,
        stripeSyncEnabled: formData.stripeSyncEnabled,
      };

      // Convert value based on type
      if (formData.type === 'PERCENTAGE' || formData.type === 'BUY_X_GET_Y') {
        data.value = parseInt(formData.value, 10);
      } else if (formData.type === 'FIXED') {
        // Convert dollars to cents
        data.value = Math.round(parseFloat(formData.value) * 100);
      } else {
        data.value = 0;
      }

      // Optional fields (convert dollars to cents where needed)
      if (formData.minOrderValue) {
        data.minOrderValue = Math.round(parseFloat(formData.minOrderValue) * 100);
      }
      if (formData.maxDiscount) {
        data.maxDiscount = Math.round(parseFloat(formData.maxDiscount) * 100);
      }
      if (formData.usageLimit) {
        data.usageLimit = parseInt(formData.usageLimit, 10);
      }
      if (formData.perCustomer) {
        data.perCustomer = parseInt(formData.perCustomer, 10);
      }
      if (formData.startsAt) {
        data.startsAt = new Date(formData.startsAt).toISOString();
      }
      if (formData.expiresAt) {
        data.expiresAt = new Date(formData.expiresAt).toISOString();
      }

      const response = await fetch('/api/discounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        sonnerToast.success('Discount code created successfully');

        // Sync to Stripe if enabled
        if (formData.stripeSyncEnabled) {
          setSyncing(true);
          try {
            await fetch(`/api/discounts/${result.id}/sync`, { method: 'POST' });
            sonnerToast.success('Synced with Stripe');
          } catch {
            sonnerToast.error('Created but failed to sync with Stripe');
          }
          setSyncing(false);
        }

        router.push('/admin/discounts');
      } else {
        sonnerToast.error(result.error || 'Failed to create discount');
      }
    } catch (error) {
      console.error('Create discount error:', error);
      sonnerToast.error('Failed to create discount');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/discounts">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Create Discount</h1>
          <p className="text-muted-foreground mt-1">
            Create a new discount code for your store
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Set up the discount code and its value
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="code">Discount Code *</Label>
                <div className="flex gap-2">
                  <Input
                    id="code"
                    placeholder="SUMMER20"
                    value={formData.code}
                    onChange={(e) => setFormData((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
                    className="font-mono"
                    required
                  />
                  <Button type="button" variant="outline" onClick={generateCode}>
                    Generate
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Discount Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, type: value as FormData['type'] }))}
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
                placeholder="Describe the discount..."
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
                    placeholder={formData.type === 'PERCENTAGE' ? '20' : '10.00'}
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
                      placeholder="50.00"
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
                    placeholder="50.00"
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
                onValueChange={(value) => setFormData((prev) => ({ ...prev, applyTo: value as FormData['applyTo'] }))}
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
            <CardDescription>
              Control how many times this discount can be used
            </CardDescription>
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
                <p className="text-xs text-muted-foreground">
                  Leave empty for unlimited uses
                </p>
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
                <p className="text-xs text-muted-foreground">
                  How many times each customer can use this
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label>First Order Only</Label>
                <p className="text-sm text-muted-foreground">
                  Only allow this discount on a customer&apos;s first order
                </p>
              </div>
              <Switch
                checked={formData.firstOrderOnly}
                onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, firstOrderOnly: checked }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Validity Period */}
        <Card>
          <CardHeader>
            <CardTitle>Validity Period</CardTitle>
            <CardDescription>
              When this discount code is active
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
                <p className="text-xs text-muted-foreground">
                  Leave empty for no expiry
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
            <CardDescription>
              Configure discount behavior
            </CardDescription>
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
                  Create a promotion code in Stripe for checkout
                </p>
              </div>
              <Switch
                checked={formData.stripeSyncEnabled}
                onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, stripeSyncEnabled: checked }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <Button type="submit" disabled={loading || syncing}>
            {(loading || syncing) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {loading ? 'Creating...' : syncing ? 'Syncing...' : 'Create Discount'}
          </Button>
          <Link href="/admin/discounts">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
