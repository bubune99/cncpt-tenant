"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Eye,
  Layers,
  Upload,
  Image as ImageIcon,
  Type,
  Sliders,
  Trash,
  Plus,
  Package2,
  RefreshCw,
  CreditCard,
  Truck,
  Download,
  Calendar,
  Box,
  AlertCircle,
  Check,
  ExternalLink,
  Expand,
} from "lucide-react";
import { VariantGridEditor } from './VariantGridEditor';
import { VariantGridModal } from './VariantGridEditor/VariantGridModal';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../ui/tabs';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Separator } from '../ui/separator';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Badge } from '../ui/badge';
import { toast } from "sonner";

// Product types with descriptions
const PRODUCT_TYPES = [
  { value: 'SIMPLE', label: 'Simple', description: 'Single product with no variants' },
  { value: 'VARIABLE', label: 'Variable', description: 'Product with size/color options' },
  { value: 'DIGITAL', label: 'Digital', description: 'Downloadable product or license' },
  { value: 'SERVICE', label: 'Service', description: 'Appointment or consultation' },
  { value: 'SUBSCRIPTION', label: 'Subscription', description: 'Recurring billing product' },
  { value: 'BUNDLE', label: 'Bundle', description: 'Multiple products together' },
] as const;

const SUBSCRIPTION_INTERVALS = [
  { value: 'day', label: 'Daily' },
  { value: 'week', label: 'Weekly' },
  { value: 'month', label: 'Monthly' },
  { value: 'year', label: 'Yearly' },
];

interface Product {
  id: string;
  title: string;
  slug: string;
  description?: string;
  descriptionHtml?: string;
  basePrice: number;
  compareAtPrice?: number;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  featured: boolean;
  type: 'SIMPLE' | 'VARIABLE' | 'DIGITAL' | 'SERVICE' | 'SUBSCRIPTION' | 'BUNDLE';
  sku?: string;
  barcode?: string;
  costPrice?: number;
  taxable: boolean;
  taxCode?: string;
  requiresShipping: boolean;
  weight?: number;
  length?: number;
  width?: number;
  height?: number;
  trackInventory: boolean;
  stock: number;
  lowStockThreshold: number;
  allowBackorder: boolean;
  stripeProductId?: string;
  stripePriceId?: string;
  stripeSyncedAt?: string;
  stripeSyncError?: string;
  subscriptionInterval?: string;
  subscriptionIntervalCount?: number;
  trialDays?: number;
  bundleItems?: unknown;
  bundlePriceMode?: string;
  digitalAssetId?: string;
  serviceDuration?: number;
  serviceCapacity?: number;
  metaTitle?: string;
  metaDescription?: string;
  images?: { id: string; media: { url: string; alt?: string } }[];
  variants?: unknown[];
  options?: { id: string; name: string; values: { id: string; value: string }[] }[];
  categories?: { category: { id: string; name: string } }[];
}

// Default product for create mode
const DEFAULT_PRODUCT: Omit<Product, 'id'> = {
  title: '',
  slug: '',
  description: '',
  basePrice: 0,
  status: 'DRAFT',
  featured: false,
  type: 'SIMPLE',
  taxable: true,
  requiresShipping: true,
  trackInventory: true,
  stock: 0,
  lowStockThreshold: 5,
  allowBackorder: false,
};

interface ProductEditorProps {
  mode: 'create' | 'edit';
  productId?: string;
}

export function ProductEditor({ mode, productId }: ProductEditorProps) {
  const router = useRouter();
  const isCreateMode = mode === 'create';

  const [product, setProduct] = useState<Product | null>(
    isCreateMode ? { id: '', ...DEFAULT_PRODUCT } : null
  );
  const [loading, setLoading] = useState(!isCreateMode);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [variantsDirty, setVariantsDirty] = useState(false);
  const [currentProductId, setCurrentProductId] = useState<string | undefined>(productId);

  // Generate slug from title
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  // Fetch product data (edit mode only)
  const fetchProduct = useCallback(async () => {
    if (!currentProductId || isCreateMode) return;

    try {
      const response = await fetch(`/api/products/${currentProductId}?includeDigitalAsset=true`);
      if (response.ok) {
        const data = await response.json();
        setProduct(data);
      } else {
        toast.error('Failed to load product');
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Failed to load product');
    } finally {
      setLoading(false);
    }
  }, [currentProductId, isCreateMode]);

  useEffect(() => {
    if (!isCreateMode) {
      fetchProduct();
    }
  }, [fetchProduct, isCreateMode]);

  // Handle save (create or update)
  const handleSave = async () => {
    if (!product) return;

    // Validate required fields
    if (!product.title.trim()) {
      toast.error('Product name is required');
      return;
    }

    setSaving(true);

    try {
      if (isCreateMode && !currentProductId) {
        // CREATE: POST new product
        const slug = product.slug || generateSlug(product.title);
        const response = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...product,
            slug,
            id: undefined, // Remove empty id
          }),
        });

        if (response.ok) {
          const created = await response.json();
          setProduct(created);
          setCurrentProductId(created.id);
          toast.success("Product created successfully");
          // Update URL without full navigation
          window.history.replaceState({}, '', `/admin/products/${created.id}/configure`);
        } else {
          const error = await response.json();
          toast.error(error.error || 'Failed to create product');
        }
      } else {
        // UPDATE: PUT existing product
        const response = await fetch(`/api/products/${currentProductId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(product),
        });

        if (response.ok) {
          const updated = await response.json();
          setProduct(updated);
          toast.success("Product saved successfully");
        } else {
          const error = await response.json();
          toast.error(error.error || 'Failed to save product');
        }
      }
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error('Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  // Handle Stripe sync
  const handleStripeSync = async () => {
    if (!product || !currentProductId) {
      toast.error('Save the product first before syncing to Stripe');
      return;
    }
    setSyncing(true);

    try {
      const response = await fetch(`/api/products/${currentProductId}/sync-stripe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ syncVariants: true }),
      });

      if (response.ok) {
        const result = await response.json();
        setProduct((prev) => prev ? {
          ...prev,
          stripeProductId: result.stripeProductId,
          stripePriceId: result.stripePriceId,
          stripeSyncedAt: result.stripeSyncedAt,
          stripeSyncError: undefined,
        } : null);
        toast.success("Synced to Stripe successfully");
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to sync with Stripe');
      }
    } catch (error) {
      console.error('Error syncing to Stripe:', error);
      toast.error('Failed to sync with Stripe');
    } finally {
      setSyncing(false);
    }
  };

  // Update product field
  const updateField = (field: keyof Product, value: unknown) => {
    setProduct((prev) => prev ? { ...prev, [field]: value } : null);
  };

  // Loading state (edit mode)
  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading product...</p>
          </div>
        </div>
      </div>
    );
  }

  // Not found state (edit mode)
  if (!isCreateMode && !product) {
    return (
      <div className="p-6 lg:p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-lg font-medium">Product not found</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => router.push('/admin/products')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Products
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!product) return null;

  const productTypeInfo = PRODUCT_TYPES.find((t) => t.value === product.type);
  const hasBeenSaved = !!currentProductId;

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/admin/products')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {isCreateMode && !hasBeenSaved ? 'New Product' : product.title || 'Untitled Product'}
            </h1>
            <p className="text-muted-foreground">
              {isCreateMode && !hasBeenSaved ? 'Create a new product' : 'Configure product settings'}
              <Badge variant="outline" className="ml-2">{productTypeInfo?.label}</Badge>
              {isCreateMode && !hasBeenSaved && (
                <Badge variant="secondary" className="ml-2">Unsaved</Badge>
              )}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {hasBeenSaved && (
            <Button variant="outline">
              <Eye className="mr-2 h-4 w-4" />
              Preview
            </Button>
          )}
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {isCreateMode && !hasBeenSaved ? 'Creating...' : 'Saving...'}
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {isCreateMode && !hasBeenSaved ? 'Create Product' : 'Save'}
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Sidebar */}
        <div className="col-span-12 md:col-span-4 lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Product Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {product.images && product.images.length > 0 && (
                <div className="flex items-center justify-center mb-2">
                  <img
                    src={product.images[0].media.url}
                    alt={product.title}
                    className="h-32 w-32 object-cover rounded-md"
                  />
                </div>
              )}
              <div>
                <p className="text-sm font-medium">Status</p>
                <Select
                  value={product.status}
                  onValueChange={(value) => updateField('status', value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="ARCHIVED">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <p className="text-sm font-medium">SKU</p>
                <p className="text-sm text-muted-foreground">{product.sku || 'Not set'}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Price</p>
                <p className="text-sm text-muted-foreground">
                  ${(product.basePrice / 100).toFixed(2)}
                </p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Featured</p>
                <Switch
                  checked={product.featured}
                  onCheckedChange={(checked) => updateField('featured', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Stripe Status Card */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Stripe Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {!hasBeenSaved ? (
                <p className="text-sm text-muted-foreground">
                  Save the product first to sync with Stripe
                </p>
              ) : product.stripeProductId ? (
                <>
                  <div className="flex items-center gap-2 text-green-600">
                    <Check className="h-4 w-4" />
                    <span className="text-sm">Synced to Stripe</span>
                  </div>
                  {product.stripeSyncedAt && (
                    <p className="text-xs text-muted-foreground">
                      Last sync: {new Date(product.stripeSyncedAt).toLocaleString()}
                    </p>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => window.open(`https://dashboard.stripe.com/products/${product.stripeProductId}`, '_blank')}
                  >
                    <ExternalLink className="mr-2 h-3 w-3" />
                    View in Stripe
                  </Button>
                </>
              ) : (
                <div className="flex items-center gap-2 text-amber-600">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">Not synced</span>
                </div>
              )}
              {product.stripeSyncError && (
                <Alert variant="destructive">
                  <AlertDescription className="text-xs">
                    {product.stripeSyncError}
                  </AlertDescription>
                </Alert>
              )}
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={handleStripeSync}
                disabled={syncing || !hasBeenSaved}
              >
                {syncing ? (
                  <RefreshCw className="mr-2 h-3 w-3 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-3 w-3" />
                )}
                {product.stripeProductId ? 'Re-sync' : 'Sync to Stripe'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="col-span-12 md:col-span-8 lg:col-span-9">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <Card>
              <CardHeader>
                <TabsList className="flex-wrap">
                  <TabsTrigger value="general">
                    <Sliders className="mr-2 h-4 w-4" />
                    General
                  </TabsTrigger>
                  <TabsTrigger value="type">
                    <Box className="mr-2 h-4 w-4" />
                    Type
                  </TabsTrigger>
                  <TabsTrigger value="pricing">
                    <CreditCard className="mr-2 h-4 w-4" />
                    Pricing
                  </TabsTrigger>
                  <TabsTrigger value="inventory">
                    <Package2 className="mr-2 h-4 w-4" />
                    Inventory
                  </TabsTrigger>
                  <TabsTrigger value="shipping">
                    <Truck className="mr-2 h-4 w-4" />
                    Shipping
                  </TabsTrigger>
                  <TabsTrigger value="images">
                    <ImageIcon className="mr-2 h-4 w-4" />
                    Images
                  </TabsTrigger>
                  <TabsTrigger value="variants" disabled={!hasBeenSaved}>
                    <Layers className="mr-2 h-4 w-4" />
                    Variants
                  </TabsTrigger>
                  <TabsTrigger value="seo">
                    <Type className="mr-2 h-4 w-4" />
                    SEO
                  </TabsTrigger>
                </TabsList>
              </CardHeader>

              <CardContent>
                {/* General Tab */}
                <TabsContent value="general" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label>Product Name *</Label>
                        <Input
                          value={product.title}
                          onChange={(e) => updateField('title', e.target.value)}
                          placeholder="Enter product name"
                        />
                      </div>
                      <div>
                        <Label>Slug</Label>
                        <Input
                          value={product.slug}
                          onChange={(e) => updateField('slug', e.target.value)}
                          placeholder={product.title ? generateSlug(product.title) : 'auto-generated-from-title'}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Leave blank to auto-generate from title
                        </p>
                      </div>
                      <div>
                        <Label>SKU</Label>
                        <Input
                          value={product.sku || ''}
                          onChange={(e) => updateField('sku', e.target.value)}
                          placeholder="Product SKU"
                        />
                      </div>
                      <div>
                        <Label>Barcode</Label>
                        <Input
                          value={product.barcode || ''}
                          onChange={(e) => updateField('barcode', e.target.value)}
                          placeholder="UPC, EAN, ISBN, etc."
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea
                        value={product.description || ''}
                        onChange={(e) => updateField('description', e.target.value)}
                        placeholder="Describe your product..."
                        rows={10}
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* Type Tab */}
                <TabsContent value="type" className="space-y-6">
                  <div>
                    <Label className="text-base">Product Type</Label>
                    <p className="text-sm text-muted-foreground mb-4">
                      Choose the type that best describes this product
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {PRODUCT_TYPES.map((type) => (
                        <Card
                          key={type.value}
                          className={`cursor-pointer transition-colors ${
                            product.type === type.value
                              ? 'border-primary bg-primary/5'
                              : 'hover:border-primary/50'
                          }`}
                          onClick={() => updateField('type', type.value)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className={`w-4 h-4 rounded-full border-2 mt-0.5 ${
                                product.type === type.value
                                  ? 'border-primary bg-primary'
                                  : 'border-muted-foreground'
                              }`} />
                              <div>
                                <p className="font-medium">{type.label}</p>
                                <p className="text-sm text-muted-foreground">
                                  {type.description}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {/* Type-specific settings */}
                  {product.type === 'SUBSCRIPTION' && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Subscription Settings
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label>Billing Interval</Label>
                            <Select
                              value={product.subscriptionInterval || 'month'}
                              onValueChange={(value) => updateField('subscriptionInterval', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {SUBSCRIPTION_INTERVALS.map((interval) => (
                                  <SelectItem key={interval.value} value={interval.value}>
                                    {interval.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Interval Count</Label>
                            <Input
                              type="number"
                              min={1}
                              value={product.subscriptionIntervalCount || 1}
                              onChange={(e) => updateField('subscriptionIntervalCount', parseInt(e.target.value))}
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              e.g., 3 for quarterly
                            </p>
                          </div>
                          <div>
                            <Label>Trial Days</Label>
                            <Input
                              type="number"
                              min={0}
                              value={product.trialDays || 0}
                              onChange={(e) => updateField('trialDays', parseInt(e.target.value))}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {product.type === 'SERVICE' && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Service Settings
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label>Duration (minutes)</Label>
                            <Input
                              type="number"
                              min={1}
                              value={product.serviceDuration || 60}
                              onChange={(e) => updateField('serviceDuration', parseInt(e.target.value))}
                            />
                          </div>
                          <div>
                            <Label>Max Bookings Per Slot</Label>
                            <Input
                              type="number"
                              min={1}
                              value={product.serviceCapacity || 1}
                              onChange={(e) => updateField('serviceCapacity', parseInt(e.target.value))}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {product.type === 'DIGITAL' && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Download className="h-4 w-4" />
                          Digital Product Settings
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                          Configure digital delivery options in the Digital Assets section.
                        </p>
                        {product.digitalAssetId ? (
                          <Badge>Digital asset linked</Badge>
                        ) : (
                          <Button variant="outline">
                            <Plus className="mr-2 h-4 w-4" />
                            Link Digital Asset
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {product.type === 'BUNDLE' && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Box className="h-4 w-4" />
                          Bundle Settings
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label>Pricing Mode</Label>
                          <Select
                            value={product.bundlePriceMode || 'fixed'}
                            onValueChange={(value) => updateField('bundlePriceMode', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="fixed">Fixed Price</SelectItem>
                              <SelectItem value="calculated">Calculate from Items</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground mt-1">
                            Fixed uses base price; Calculated sums item prices with discounts
                          </p>
                        </div>
                        <Separator />
                        <p className="text-sm text-muted-foreground">
                          Bundle items configuration coming soon
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* Pricing Tab */}
                <TabsContent value="pricing" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <Label>Base Price</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                        <Input
                          type="number"
                          step="0.01"
                          className="pl-7"
                          value={(product.basePrice / 100).toFixed(2)}
                          onChange={(e) => updateField('basePrice', Math.round(parseFloat(e.target.value || '0') * 100))}
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Compare at Price</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                        <Input
                          type="number"
                          step="0.01"
                          className="pl-7"
                          value={product.compareAtPrice ? (product.compareAtPrice / 100).toFixed(2) : ''}
                          onChange={(e) => updateField('compareAtPrice', e.target.value ? Math.round(parseFloat(e.target.value) * 100) : null)}
                          placeholder="Original price"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Shows as crossed out price
                      </p>
                    </div>
                    <div>
                      <Label>Cost Price</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                        <Input
                          type="number"
                          step="0.01"
                          className="pl-7"
                          value={product.costPrice ? (product.costPrice / 100).toFixed(2) : ''}
                          onChange={(e) => updateField('costPrice', e.target.value ? Math.round(parseFloat(e.target.value) * 100) : null)}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        For profit calculations
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Taxable</p>
                        <p className="text-sm text-muted-foreground">Charge tax on this product</p>
                      </div>
                      <Switch
                        checked={product.taxable}
                        onCheckedChange={(checked) => updateField('taxable', checked)}
                      />
                    </div>
                    {product.taxable && (
                      <div>
                        <Label>Tax Code</Label>
                        <Input
                          value={product.taxCode || ''}
                          onChange={(e) => updateField('taxCode', e.target.value)}
                          placeholder="Tax category code"
                        />
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Inventory Tab */}
                <TabsContent value="inventory" className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Track Inventory</p>
                      <p className="text-sm text-muted-foreground">Monitor stock levels</p>
                    </div>
                    <Switch
                      checked={product.trackInventory}
                      onCheckedChange={(checked) => updateField('trackInventory', checked)}
                    />
                  </div>

                  {product.trackInventory && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <Label>Stock Quantity</Label>
                        <Input
                          type="number"
                          value={product.stock}
                          onChange={(e) => updateField('stock', parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div>
                        <Label>Low Stock Threshold</Label>
                        <Input
                          type="number"
                          value={product.lowStockThreshold}
                          onChange={(e) => updateField('lowStockThreshold', parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div className="flex items-center pt-6">
                        <div className="flex items-center justify-between w-full">
                          <div>
                            <p className="font-medium">Allow Backorders</p>
                            <p className="text-xs text-muted-foreground">Sell when out of stock</p>
                          </div>
                          <Switch
                            checked={product.allowBackorder}
                            onCheckedChange={(checked) => updateField('allowBackorder', checked)}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* Shipping Tab */}
                <TabsContent value="shipping" className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Requires Shipping</p>
                      <p className="text-sm text-muted-foreground">Physical product that needs delivery</p>
                    </div>
                    <Switch
                      checked={product.requiresShipping}
                      onCheckedChange={(checked) => updateField('requiresShipping', checked)}
                    />
                  </div>

                  {product.requiresShipping && (
                    <>
                      <Separator />
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div>
                          <Label>Weight (oz)</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={product.weight || ''}
                            onChange={(e) => updateField('weight', e.target.value ? parseInt(e.target.value) : null)}
                          />
                        </div>
                        <div>
                          <Label>Length (in)</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={product.length || ''}
                            onChange={(e) => updateField('length', e.target.value ? parseFloat(e.target.value) : null)}
                          />
                        </div>
                        <div>
                          <Label>Width (in)</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={product.width || ''}
                            onChange={(e) => updateField('width', e.target.value ? parseFloat(e.target.value) : null)}
                          />
                        </div>
                        <div>
                          <Label>Height (in)</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={product.height || ''}
                            onChange={(e) => updateField('height', e.target.value ? parseFloat(e.target.value) : null)}
                          />
                        </div>
                      </div>
                    </>
                  )}
                </TabsContent>

                {/* Images Tab */}
                <TabsContent value="images" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {product.images?.map((image, index) => (
                      <Card key={image.id} className="overflow-hidden">
                        <div className="aspect-square relative">
                          <img
                            src={image.media.url}
                            alt={image.media.alt || `Image ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <CardFooter className="p-2 flex justify-between">
                          <p className="text-sm">Image {index + 1}</p>
                          <Button variant="ghost" size="sm">
                            <Trash className="h-4 w-4" />
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}

                    <Card className="border-dashed border-2 flex flex-col items-center justify-center aspect-square cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="p-6 text-center">
                        <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                        <p className="mt-2 font-medium">Add Image</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Upload PNG or JPG
                        </p>
                      </div>
                    </Card>
                  </div>
                </TabsContent>

                {/* Variants Tab */}
                <TabsContent value="variants" className="space-y-6">
                  {!hasBeenSaved ? (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Save product first</AlertTitle>
                      <AlertDescription>
                        Save the product to enable variant management with the Excel-like grid editor.
                      </AlertDescription>
                    </Alert>
                  ) : product.type === 'VARIABLE' ? (
                    <>
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-medium">Product Variants</h3>
                          <p className="text-muted-foreground">
                            Manage variants with options, pricing, and custom fields
                            {variantsDirty && (
                              <Badge variant="outline" className="ml-2 text-amber-600 border-amber-600">
                                Unsaved changes
                              </Badge>
                            )}
                          </p>
                        </div>
                        <Button variant="outline" onClick={() => setShowVariantModal(true)}>
                          <Expand className="mr-2 h-4 w-4" />
                          Full Editor
                        </Button>
                      </div>

                      {/* Options summary */}
                      {product.options && product.options.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {product.options.map((option) => (
                            <Badge key={option.id} variant="secondary">
                              {option.name}: {option.values.map((v) => v.value).join(', ')}
                            </Badge>
                          ))}
                          <Button variant="ghost" size="sm" className="h-6 px-2">
                            <Plus className="h-3 w-3 mr-1" />
                            Add Option
                          </Button>
                        </div>
                      )}

                      {/* Inline Variant Grid Editor */}
                      <VariantGridEditor
                        productId={currentProductId!}
                        mode="inline"
                        maxHeight={400}
                        onDirtyChange={setVariantsDirty}
                        onSave={() => {
                          toast.success('Variants saved successfully');
                          fetchProduct();
                        }}
                        onClose={() => setShowVariantModal(true)}
                      />

                      {/* Variant Grid Modal */}
                      <VariantGridModal
                        productId={currentProductId!}
                        productTitle={product.title}
                        isOpen={showVariantModal}
                        onClose={() => setShowVariantModal(false)}
                        onSave={() => {
                          toast.success('Variants saved successfully');
                          fetchProduct();
                        }}
                      />
                    </>
                  ) : (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Variants not available</AlertTitle>
                      <AlertDescription>
                        Change the product type to &quot;Variable&quot; to add size, color, or other variants.
                      </AlertDescription>
                    </Alert>
                  )}
                </TabsContent>

                {/* SEO Tab */}
                <TabsContent value="seo" className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <Label>Meta Title</Label>
                      <Input
                        value={product.metaTitle || ''}
                        onChange={(e) => updateField('metaTitle', e.target.value)}
                        placeholder="SEO title"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {(product.metaTitle || '').length}/60 characters
                      </p>
                    </div>
                    <div>
                      <Label>Meta Description</Label>
                      <Textarea
                        value={product.metaDescription || ''}
                        onChange={(e) => updateField('metaDescription', e.target.value)}
                        placeholder="SEO description"
                        rows={3}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {(product.metaDescription || '').length}/160 characters
                      </p>
                    </div>
                  </div>
                </TabsContent>
              </CardContent>

              <CardFooter className="flex justify-end">
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {isCreateMode && !hasBeenSaved ? 'Creating...' : 'Saving...'}
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      {isCreateMode && !hasBeenSaved ? 'Create Product' : 'Save Configuration'}
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
