'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../../hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Badge } from '../../../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../components/ui/tabs';
import { Label } from '../../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { RadioGroup, RadioGroupItem } from '../../../../components/ui/radio-group';
import { Checkbox } from '../../../../components/ui/checkbox';
import { Textarea } from '../../../../components/ui/textarea';
import { Loader2, ArrowLeft, Save, Building2, Users, CreditCard, Calendar, CheckCircle, XCircle, AlertCircle, Globe, Server, Package, Link } from 'lucide-react';
import { toast } from 'sonner';

export default function BusinessOwnerDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [businessOwner, setBusinessOwner] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Form state for each tab
  const [detailsForm, setDetailsForm] = useState({
    email: '',
    businessName: '',
    contactName: '',
    phone: '',
    address: '',
    isActive: true
  });
  
  const [subscriptionForm, setSubscriptionForm] = useState({
    subscriptionTier: 'starter',
    subscriptionStatus: 'trial',
    subscriptionEndsAt: ''
  });
  
  const [deploymentForm, setDeploymentForm] = useState({
    deploymentMode: 'standalone' as 'standalone' | 'wordpress',
    wordpressUrl: ''
  });
  
  const [productSyncForm, setProductSyncForm] = useState({
    hasExistingProducts: false,
    productSyncMethod: 'none' as 'woocommerce' | 'custom' | 'manual' | 'none',
    syncApiEndpoint: '',
    syncApiKey: ''
  });

  const [usageLimitsForm, setUsageLimitsForm] = useState({
    storageLimit: 0,
    apiCallsLimit: 0,
    designsLimit: 0,
    customersLimit: 0,
    resetPeriod: 'monthly' as 'daily' | 'weekly' | 'monthly'
  });

  // Check if user is admin
  useEffect(() => {
    if (!authLoading && (!user || user.primaryEmail !== 'bubuneo99@gmail.com')) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  // Fetch business owner details
  useEffect(() => {
    if (user?.primaryEmail === 'bubuneo99@gmail.com' && id) {
      fetchBusinessOwnerDetails();
    }
  }, [user, id]);
  
  // Update form state when business owner data is loaded
  useEffect(() => {
    if (businessOwner) {
      setDetailsForm({
        email: businessOwner.email || '',
        businessName: businessOwner.businessName || '',
        contactName: businessOwner.contactName || '',
        phone: businessOwner.phone || '',
        address: businessOwner.address ? JSON.stringify(businessOwner.address) : '',
        isActive: businessOwner.isActive
      });
      
      setSubscriptionForm({
        subscriptionTier: businessOwner.subscriptionTier || 'starter',
        subscriptionStatus: businessOwner.subscriptionStatus || 'trial',
        subscriptionEndsAt: businessOwner.subscriptionEndsAt ? new Date(businessOwner.subscriptionEndsAt).toISOString().split('T')[0] : ''
      });
      
      setDeploymentForm({
        deploymentMode: businessOwner.deploymentMode || 'standalone',
        wordpressUrl: businessOwner.wordpressUrl || ''
      });
      
      setProductSyncForm({
        hasExistingProducts: businessOwner.hasExistingProducts || false,
        productSyncMethod: businessOwner.productSyncMethod || 'none',
        syncApiEndpoint: businessOwner.syncApiEndpoint || '',
        syncApiKey: businessOwner.syncApiKey || ''
      });
      
      setUsageLimitsForm({
        storageLimit: businessOwner.storageLimit || 0,
        apiCallsLimit: businessOwner.apiCallsLimit || 0,
        designsLimit: businessOwner.designsLimit || 0,
        customersLimit: businessOwner.customersLimit || 0,
        resetPeriod: businessOwner.resetPeriod || 'monthly'
      });
    }
  }, [businessOwner]);

  const fetchBusinessOwnerDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch business owner details
      const boResponse = await fetch(`/api/admin/business-owners/${id}`);
      
      if (!boResponse.ok) {
        throw new Error('Failed to fetch business owner details');
      }
      
      const boData = await boResponse.json();
      setBusinessOwner(boData);
      
      // Fetch usage limits separately
      const limitsResponse = await fetch(`/api/admin/business-owners/${id}/usage-limits`);
      
      if (limitsResponse.ok) {
        const limitsData = await limitsResponse.json();
        
        // Define interface for usage limit items
        interface UsageLimit {
          limitType: string;
          limitValue: number;
          resetPeriod: 'daily' | 'weekly' | 'monthly' | 'never' | null;
        }
        
        // Extract limits by type
        const storageLimit = limitsData.limits.find((l: UsageLimit) => l.limitType === 'storage');
        const apiCallsLimit = limitsData.limits.find((l: UsageLimit) => l.limitType === 'api_calls');
        const designsLimit = limitsData.limits.find((l: UsageLimit) => l.limitType === 'designs');
        const usersLimit = limitsData.limits.find((l: UsageLimit) => l.limitType === 'users');
        
        // Update usage limits form
        setUsageLimitsForm({
          storageLimit: storageLimit?.limitValue || 0,
          apiCallsLimit: apiCallsLimit?.limitValue || 0,
          designsLimit: designsLimit?.limitValue || 0,
          customersLimit: usersLimit?.limitValue || 0,
          resetPeriod: storageLimit?.resetPeriod || 'monthly'
        });
      }
    } catch (error) {
      console.error('Failed to fetch business owner details:', error);
      toast.error('Failed to load business owner details');
    } finally {
      setLoading(false);
    }
  };
  
  const handleUpdateDetails = async () => {
    try {
      setSaving(true);
      
      // Parse address from string to object
      let addressObj = null;
      if (detailsForm.address) {
        try {
          addressObj = JSON.parse(detailsForm.address);
        } catch (e) {
          toast.error('Invalid address JSON format');
          setSaving(false);
          return;
        }
      }
      
      const response = await fetch(`/api/admin/business-owners/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: detailsForm.email,
          businessName: detailsForm.businessName,
          contactName: detailsForm.contactName,
          phone: detailsForm.phone || null,
          address: addressObj,
          isActive: detailsForm.isActive
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update business details');
      }
      
      const data = await response.json();
      toast.success('Business details updated successfully');
      fetchBusinessOwnerDetails(); // Refresh data
    } catch (error) {
      console.error('Failed to update business details:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update business details');
    } finally {
      setSaving(false);
    }
  };
  
  const handleUpdateSubscription = async () => {
    try {
      setSaving(true);
      
      // Format the date properly for API
      let formattedDate = null;
      if (subscriptionForm.subscriptionEndsAt) {
        formattedDate = new Date(subscriptionForm.subscriptionEndsAt).toISOString();
      }
      
      const response = await fetch(`/api/admin/business-owners/${id}/subscription`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionTier: subscriptionForm.subscriptionTier,
          subscriptionStatus: subscriptionForm.subscriptionStatus,
          subscriptionEndsAt: formattedDate
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update subscription');
      }
      
      const data = await response.json();
      toast.success('Subscription updated successfully');
      fetchBusinessOwnerDetails(); // Refresh data
    } catch (error) {
      console.error('Failed to update subscription:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update subscription');
    } finally {
      setSaving(false);
    }
  };
  
  const handleExtendTrial = async () => {
    try {
      setSaving(true);
      
      const response = await fetch(`/api/admin/business-owners/${id}/extend-trial`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days: 30 })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to extend trial');
      }
      
      const data = await response.json();
      toast.success('Trial extended successfully');
      fetchBusinessOwnerDetails(); // Refresh data
    } catch (error) {
      console.error('Failed to extend trial:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to extend trial');
    } finally {
      setSaving(false);
    }
  };
  
  const handleUpdateDeployment = async () => {
    try {
      setSaving(true);
      
      // Validate WordPress URL if in WordPress mode
      if (deploymentForm.deploymentMode === 'wordpress' && !deploymentForm.wordpressUrl) {
        toast.error('WordPress URL is required when using WordPress integration');
        setSaving(false);
        return;
      }
      
      const response = await fetch(`/api/admin/business-owners/${id}/deployment`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deploymentMode: deploymentForm.deploymentMode,
          wordpressUrl: deploymentForm.wordpressUrl || null
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update deployment configuration');
      }
      
      const data = await response.json();
      toast.success('Deployment configuration updated successfully');
      fetchBusinessOwnerDetails(); // Refresh data
    } catch (error) {
      console.error('Failed to update deployment configuration:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update deployment configuration');
    } finally {
      setSaving(false);
    }
  };
  
  const handleUpdateProductSync = async () => {
    try {
      setSaving(true);
      
      // Validate custom API settings
      if (productSyncForm.productSyncMethod === 'custom') {
        if (!productSyncForm.syncApiEndpoint) {
          toast.error('API endpoint is required for custom sync method');
          setSaving(false);
          return;
        }
        if (!productSyncForm.syncApiKey) {
          toast.error('API key is required for custom sync method');
          setSaving(false);
          return;
        }
      }
      
      const response = await fetch(`/api/admin/business-owners/${id}/product-sync`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hasExistingProducts: productSyncForm.hasExistingProducts,
          productSyncMethod: productSyncForm.productSyncMethod,
          syncApiEndpoint: productSyncForm.syncApiEndpoint || null,
          syncApiKey: productSyncForm.syncApiKey || null
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update product sync configuration');
      }
      
      const data = await response.json();
      toast.success('Product sync configuration updated successfully');
      fetchBusinessOwnerDetails(); // Refresh data
    } catch (error) {
      console.error('Failed to update product sync configuration:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update product sync configuration');
    } finally {
      setSaving(false);
    }
  };
  
  const handleUpdateUsageLimits = async () => {
    try {
      setSaving(true);
      
      // Validate limits are non-negative
      if (usageLimitsForm.storageLimit < 0 || 
          usageLimitsForm.apiCallsLimit < 0 || 
          usageLimitsForm.designsLimit < 0 || 
          usageLimitsForm.customersLimit < 0) {
        toast.error('Usage limits cannot be negative');
        setSaving(false);
        return;
      }
      
      // Format the request body according to the API's expected schema
      const limits = [
        {
          limitType: 'storage',
          limitValue: usageLimitsForm.storageLimit,
          resetPeriod: usageLimitsForm.resetPeriod
        },
        {
          limitType: 'api_calls',
          limitValue: usageLimitsForm.apiCallsLimit,
          resetPeriod: usageLimitsForm.resetPeriod
        },
        {
          limitType: 'designs',
          limitValue: usageLimitsForm.designsLimit,
          resetPeriod: usageLimitsForm.resetPeriod
        },
        {
          limitType: 'users',
          limitValue: usageLimitsForm.customersLimit,
          resetPeriod: usageLimitsForm.resetPeriod
        }
      ];
      
      const response = await fetch(`/api/admin/business-owners/${id}/usage-limits`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limits })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update usage limits');
      }
      
      const data = await response.json();
      toast.success('Usage limits updated successfully');
      fetchBusinessOwnerDetails(); // Refresh data
    } catch (error) {
      console.error('Failed to update usage limits:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update usage limits');
    } finally {
      setSaving(false);
    }
  };

  const formatBytes = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/10 text-green-600 border-green-200">Active</Badge>;
      case 'trial':
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-200">Trial</Badge>;
      case 'past_due':
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-200">Past Due</Badge>;
      case 'canceled':
        return <Badge className="bg-red-500/10 text-red-600 border-red-200">Canceled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'starter':
        return <Badge variant="secondary">Starter</Badge>;
      case 'growth':
        return <Badge className="bg-purple-500/10 text-purple-600 border-purple-200">Growth</Badge>;
      case 'enterprise':
        return <Badge className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 text-blue-600 border-blue-200">Enterprise</Badge>;
      default:
        return <Badge variant="outline">{tier}</Badge>;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!businessOwner) {
    return (
      <div className="p-6 lg:p-8 space-y-6">
        <Button variant="ghost" onClick={() => router.push('/admin/business-owners')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Business Owners
        </Button>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground" />
            <h2 className="mt-4 text-xl font-semibold">Business Owner Not Found</h2>
            <p className="mt-2 text-muted-foreground">
              The requested business owner could not be found.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.push('/admin/business-owners')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Business Owners
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-1/3">
          <Card>
            <CardHeader>
              <CardTitle>{businessOwner.businessName}</CardTitle>
              <CardDescription>{businessOwner.email}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium">Contact</p>
                <p className="text-sm text-muted-foreground">{businessOwner.contactName}</p>
                {businessOwner.phone && (
                  <p className="text-sm text-muted-foreground">{businessOwner.phone}</p>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">Status:</p>
                {getStatusBadge(businessOwner.subscriptionStatus)}
              </div>
              
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">Tier:</p>
                {getTierBadge(businessOwner.subscriptionTier)}
              </div>
              
              {businessOwner.trialEndsAt && (
                <div>
                  <p className="text-sm font-medium">Trial Ends:</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(businessOwner.trialEndsAt).toLocaleDateString()}
                  </p>
                </div>
              )}
              
              {businessOwner.subscriptionEndsAt && (
                <div>
                  <p className="text-sm font-medium">Subscription Ends:</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(businessOwner.subscriptionEndsAt).toLocaleDateString()}
                  </p>
                </div>
              )}
              
              <div>
                <p className="text-sm font-medium">Created:</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(businessOwner.createdAt).toLocaleDateString()}
                </p>
              </div>
              
              {businessOwner.lastLoginAt && (
                <div>
                  <p className="text-sm font-medium">Last Login:</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(businessOwner.lastLoginAt).toLocaleDateString()}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="md:w-2/3">
          <Tabs defaultValue="details">
            <TabsList className="grid grid-cols-5 mb-4">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="subscription">Subscription</TabsTrigger>
              <TabsTrigger value="deployment">Deployment</TabsTrigger>
              <TabsTrigger value="products">Products</TabsTrigger>
              <TabsTrigger value="limits">Usage Limits</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Business Details</CardTitle>
                  <CardDescription>
                    Update the business owner's basic information
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleUpdateDetails(); }}>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={detailsForm.email}
                        onChange={(e) => setDetailsForm({...detailsForm, email: e.target.value})}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="businessName">Business Name</Label>
                      <Input
                        id="businessName"
                        value={detailsForm.businessName}
                        onChange={(e) => setDetailsForm({...detailsForm, businessName: e.target.value})}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contactName">Contact Name</Label>
                      <Input
                        id="contactName"
                        value={detailsForm.contactName}
                        onChange={(e) => setDetailsForm({...detailsForm, contactName: e.target.value})}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={detailsForm.phone}
                        onChange={(e) => setDetailsForm({...detailsForm, phone: e.target.value})}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">Address (JSON)</Label>
                      <Textarea
                        id="address"
                        value={detailsForm.address}
                        onChange={(e) => setDetailsForm({...detailsForm, address: e.target.value})}
                        placeholder='{"street":"123 Main St","city":"Anytown","state":"CA","zip":"12345"}'
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="isActive"
                        checked={detailsForm.isActive}
                        onCheckedChange={(checked) => setDetailsForm({...detailsForm, isActive: checked as boolean})}
                      />
                      <Label htmlFor="isActive">Account Active</Label>
                    </div>

                    <Button
                      type="submit"
                      className="mt-4"
                      disabled={saving}
                    >
                      {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                      Save Changes
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="subscription" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Subscription Management</CardTitle>
                  <CardDescription>
                    Update subscription tier, status, and expiration
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleUpdateSubscription(); }}>
                    <div className="space-y-2">
                      <Label htmlFor="subscriptionTier">Subscription Tier</Label>
                      <Select
                        value={subscriptionForm.subscriptionTier}
                        onValueChange={(value) => setSubscriptionForm({...subscriptionForm, subscriptionTier: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select tier" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="starter">Starter</SelectItem>
                          <SelectItem value="growth">Growth</SelectItem>
                          <SelectItem value="enterprise">Enterprise</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subscriptionStatus">Subscription Status</Label>
                      <Select
                        value={subscriptionForm.subscriptionStatus}
                        onValueChange={(value) => setSubscriptionForm({...subscriptionForm, subscriptionStatus: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="trial">Trial</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="past_due">Past Due</SelectItem>
                          <SelectItem value="canceled">Canceled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subscriptionEndsAt">Subscription End Date</Label>
                      <Input
                        id="subscriptionEndsAt"
                        type="date"
                        value={subscriptionForm.subscriptionEndsAt}
                        onChange={(e) => setSubscriptionForm({...subscriptionForm, subscriptionEndsAt: e.target.value})}
                      />
                    </div>

                    <div className="pt-4">
                      <Button
                        type="submit"
                        disabled={saving}
                      >
                        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Update Subscription
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        className="ml-2"
                        onClick={() => handleExtendTrial()}
                        disabled={saving || subscriptionForm.subscriptionStatus !== 'trial'}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        Extend Trial (30 days)
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="deployment" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Deployment Configuration</CardTitle>
                  <CardDescription>
                    Configure how the business owner's platform is deployed
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleUpdateDeployment(); }}>
                    <div className="space-y-2">
                      <Label>Deployment Mode</Label>
                      <RadioGroup
                        value={deploymentForm.deploymentMode}
                        onValueChange={(value) => setDeploymentForm({
                          ...deploymentForm,
                          deploymentMode: value as 'standalone' | 'wordpress'
                        })}
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="standalone" id="standalone" />
                          <Label htmlFor="standalone" className="cursor-pointer">
                            Standalone
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="wordpress" id="wordpress" />
                          <Label htmlFor="wordpress" className="cursor-pointer">
                            WordPress Integration
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    {deploymentForm.deploymentMode === 'wordpress' && (
                      <div className="space-y-2">
                        <Label htmlFor="wordpressUrl">WordPress URL</Label>
                        <Input
                          id="wordpressUrl"
                          type="url"
                          placeholder="https://example.com"
                          value={deploymentForm.wordpressUrl}
                          onChange={(e) => setDeploymentForm({...deploymentForm, wordpressUrl: e.target.value})}
                        />
                      </div>
                    )}

                    <Button
                      type="submit"
                      className="mt-4"
                      disabled={saving || (deploymentForm.deploymentMode === 'wordpress' && !deploymentForm.wordpressUrl)}
                    >
                      {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                      Save Deployment Configuration
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="products" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Product Sync Configuration</CardTitle>
                  <CardDescription>
                    Configure how products are synchronized
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleUpdateProductSync(); }}>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="hasExistingProducts"
                        checked={productSyncForm.hasExistingProducts}
                        onCheckedChange={(checked) => setProductSyncForm({...productSyncForm, hasExistingProducts: checked as boolean})}
                      />
                      <Label htmlFor="hasExistingProducts">Has Existing Products</Label>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="productSyncMethod">Product Sync Method</Label>
                      <Select
                        value={productSyncForm.productSyncMethod}
                        onValueChange={(value) => setProductSyncForm({
                          ...productSyncForm,
                          productSyncMethod: value as 'woocommerce' | 'custom' | 'manual' | 'none'
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select sync method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="woocommerce">WooCommerce</SelectItem>
                          <SelectItem value="custom">Custom API</SelectItem>
                          <SelectItem value="manual">Manual</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {productSyncForm.productSyncMethod === 'custom' && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="syncApiEndpoint">API Endpoint</Label>
                          <Input
                            id="syncApiEndpoint"
                            type="url"
                            placeholder="https://example.com/api/products"
                            value={productSyncForm.syncApiEndpoint}
                            onChange={(e) => setProductSyncForm({...productSyncForm, syncApiEndpoint: e.target.value})}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="syncApiKey">API Key</Label>
                          <Input
                            id="syncApiKey"
                            type="password"
                            placeholder="Enter API key"
                            value={productSyncForm.syncApiKey}
                            onChange={(e) => setProductSyncForm({...productSyncForm, syncApiKey: e.target.value})}
                          />
                        </div>
                      </>
                    )}

                    <Button
                      type="submit"
                      className="mt-4"
                      disabled={saving || (productSyncForm.productSyncMethod === 'custom' && (!productSyncForm.syncApiEndpoint || !productSyncForm.syncApiKey))}
                    >
                      {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                      Save Product Sync Configuration
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="limits" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Usage Limits</CardTitle>
                  <CardDescription>
                    Configure resource limits for this business owner
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="storageLimit">Storage Limit (bytes)</Label>
                      <Input
                        id="storageLimit"
                        type="number"
                        value={usageLimitsForm.storageLimit}
                        onChange={(e) => setUsageLimitsForm({...usageLimitsForm, storageLimit: parseInt(e.target.value)})}
                      />
                      <p className="text-xs text-muted-foreground">
                        Current usage: {formatBytes(businessOwner?.storageUsed || 0)}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="apiCallsLimit">API Calls Limit</Label>
                      <Input
                        id="apiCallsLimit"
                        type="number"
                        value={usageLimitsForm.apiCallsLimit}
                        onChange={(e) => setUsageLimitsForm({...usageLimitsForm, apiCallsLimit: parseInt(e.target.value)})}
                      />
                      <p className="text-xs text-muted-foreground">
                        Current usage: {businessOwner?.apiCallsUsed || 0}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="designsLimit">Designs Limit</Label>
                      <Input
                        id="designsLimit"
                        type="number"
                        value={usageLimitsForm.designsLimit}
                        onChange={(e) => setUsageLimitsForm({...usageLimitsForm, designsLimit: parseInt(e.target.value)})}
                      />
                      <p className="text-xs text-muted-foreground">
                        Current usage: {businessOwner?.designsCount || 0}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="customersLimit">Customers Limit</Label>
                      <Input
                        id="customersLimit"
                        type="number"
                        value={usageLimitsForm.customersLimit}
                        onChange={(e) => setUsageLimitsForm({...usageLimitsForm, customersLimit: parseInt(e.target.value)})}
                      />
                      <p className="text-xs text-muted-foreground">
                        Current usage: {businessOwner?.customerCount || 0}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Reset Period</Label>
                    <RadioGroup
                      value={usageLimitsForm.resetPeriod}
                      onValueChange={(value) => setUsageLimitsForm({...usageLimitsForm, resetPeriod: value as 'daily' | 'weekly' | 'monthly'})}
                      className="flex flex-row space-x-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="daily" id="daily" />
                        <Label htmlFor="daily">Daily</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="weekly" id="weekly" />
                        <Label htmlFor="weekly">Weekly</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="monthly" id="monthly" />
                        <Label htmlFor="monthly">Monthly</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  
                  <Button 
                    className="w-full mt-4" 
                    onClick={handleUpdateUsageLimits}
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Update Usage Limits
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
