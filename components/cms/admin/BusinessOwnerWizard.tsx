'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { Progress } from '../ui/progress';
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  User, 
  Server, 
  Package, 
  Eye,
  Globe,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/cms/utils';
import { toast } from 'sonner';

interface BusinessOwnerWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  isSelService?: boolean; // When true, uses current user's email and self-registration flow
}

interface FormData {
  // Step 1: Basic Info
  email: string;
  businessName: string;
  contactName: string;
  tier: 'starter' | 'growth' | 'enterprise';
  
  // Step 2: Deployment
  deploymentMode: 'standalone' | 'wordpress';
  wordpressUrl: string;
  
  // Step 3: Products
  hasExistingProducts: boolean;
  productSyncMethod: 'none' | 'woocommerce' | 'custom' | 'manual';
  syncApiEndpoint: string;
  syncApiKey: string;
  
  // Step 4: Review
  trialDays: number;
}

const STEPS = [
  { id: 1, name: 'Basic Info', icon: User, description: 'Business details' },
  { id: 2, name: 'Deployment', icon: Server, description: 'Setup method' },
  { id: 3, name: 'Products', icon: Package, description: 'Product configuration' },
  { id: 4, name: 'Review', icon: Eye, description: 'Confirm details' },
];

const TIER_FEATURES = {
  starter: {
    price: '$29/mo',
    storage: '2GB',
    customers: '50',
    designs: '100',
    apiAccess: false,
  },
  growth: {
    price: '$79/mo',
    storage: '10GB',
    customers: '500',
    designs: '1,000',
    apiAccess: true,
  },
  enterprise: {
    price: '$299/mo',
    storage: '100GB',
    customers: 'Unlimited',
    designs: 'Unlimited',
    apiAccess: true,
  },
};

export default function BusinessOwnerWizard({ isOpen, onClose, onSuccess, isSelService = false }: BusinessOwnerWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [userEmail, setUserEmail] = useState<string>('');
  
  // Get user email for self-service mode
  useEffect(() => {
    if (isSelService) {
      fetch('/api/user/profile')
        .then(res => res.json())
        .then(data => {
          if (data.email) {
            setUserEmail(data.email);
            setFormData(prev => ({ ...prev, email: data.email }));
          }
        })
        .catch(console.error);
    }
  }, [isSelService]);
  
  const [formData, setFormData] = useState<FormData>({
    email: '',
    businessName: '',
    contactName: '',
    tier: 'starter',
    deploymentMode: 'standalone',
    wordpressUrl: '',
    hasExistingProducts: false,
    productSyncMethod: 'none',
    syncApiEndpoint: '',
    syncApiKey: '',
    trialDays: 30,
  });

  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!formData.email) newErrors.email = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          newErrors.email = 'Invalid email format';
        }
        if (!formData.businessName) newErrors.businessName = 'Business name is required';
        if (!formData.contactName) newErrors.contactName = 'Contact name is required';
        break;

      case 2:
        if (formData.deploymentMode === 'wordpress' && !formData.wordpressUrl) {
          newErrors.wordpressUrl = 'WordPress URL is required';
        } else if (formData.deploymentMode === 'wordpress' && formData.wordpressUrl) {
          try {
            new URL(formData.wordpressUrl);
          } catch {
            newErrors.wordpressUrl = 'Invalid URL format';
          }
        }
        break;

      case 3:
        if (formData.hasExistingProducts && formData.productSyncMethod === 'custom') {
          if (!formData.syncApiEndpoint) {
            newErrors.syncApiEndpoint = 'API endpoint is required for custom sync';
          }
          if (!formData.syncApiKey) {
            newErrors.syncApiKey = 'API key is required for custom sync';
          }
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setIsSubmitting(true);
    try {
      // Use different endpoint for self-service vs admin creation
      const endpoint = isSelService 
        ? '/api/user/create-business' 
        : '/api/admin/business-owners/v2';
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };
      
      // Add API key for admin endpoint
      if (!isSelService) {
        headers['x-api-key'] = 'temp-dev-key';
      }
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ...formData,
          productSyncMethod: formData.hasExistingProducts ? formData.productSyncMethod : 'none',
          syncApiEndpoint: formData.hasExistingProducts && formData.productSyncMethod === 'custom' 
            ? formData.syncApiEndpoint : null,
          syncApiKey: formData.hasExistingProducts && formData.productSyncMethod === 'custom' 
            ? formData.syncApiKey : null,
          wordpressUrl: formData.deploymentMode === 'wordpress' ? formData.wordpressUrl : null,
          isSelService: isSelService // Flag to indicate self-registration
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create business owner');
      }

      toast.success('Business owner account created successfully!');
      onSuccess();
      onClose();
      
      // Reset form
      setCurrentStep(1);
      setFormData({
        email: '',
        businessName: '',
        contactName: '',
        tier: 'starter',
        deploymentMode: 'standalone',
        wordpressUrl: '',
        hasExistingProducts: false,
        productSyncMethod: 'none',
        syncApiEndpoint: '',
        syncApiKey: '',
        trialDays: 30,
      });
    } catch (error) {
      console.error('Failed to create business owner:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create business owner');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                placeholder="business@example.com"
                value={formData.email}
                onChange={(e) => !isSelService && updateFormData('email', e.target.value)}
                disabled={isSelService} // Disable email editing in self-service mode
                className={errors.email ? 'border-red-500' : ''}
              />
              {isSelService && (
                <p className="text-xs text-muted-foreground">
                  Using your account email address
                </p>
              )}
              {errors.email && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.email}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name *</Label>
              <Input
                id="businessName"
                placeholder="Acme Design Studio"
                value={formData.businessName}
                onChange={(e) => updateFormData('businessName', e.target.value)}
                className={errors.businessName ? 'border-red-500' : ''}
              />
              {errors.businessName && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.businessName}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactName">Contact Name *</Label>
              <Input
                id="contactName"
                placeholder="John Doe"
                value={formData.contactName}
                onChange={(e) => updateFormData('contactName', e.target.value)}
                className={errors.contactName ? 'border-red-500' : ''}
              />
              {errors.contactName && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.contactName}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Subscription Tier *</Label>
              <RadioGroup
                value={formData.tier}
                onValueChange={(value) => updateFormData('tier', value)}
              >
                {Object.entries(TIER_FEATURES).map(([tier, features]) => (
                  <div key={tier} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                    <RadioGroupItem value={tier} id={tier} className="mt-1" />
                    <Label htmlFor={tier} className="flex-1 cursor-pointer">
                      <div className="font-semibold capitalize">{tier}</div>
                      <div className="text-sm text-muted-foreground">
                        {features.price} • {features.storage} storage • {features.customers} customers
                      </div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Deployment Mode *</Label>
              <RadioGroup
                value={formData.deploymentMode}
                onValueChange={(value) => updateFormData('deploymentMode', value as 'standalone' | 'wordpress')}
              >
                <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                  <RadioGroupItem value="standalone" id="standalone" className="mt-1" />
                  <Label htmlFor="standalone" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Server className="h-4 w-4" />
                      <span className="font-semibold">Standalone Platform</span>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Independent designer platform with custom domain
                    </div>
                  </Label>
                </div>

                <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                  <RadioGroupItem value="wordpress" id="wordpress" className="mt-1" />
                  <Label htmlFor="wordpress" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      <span className="font-semibold">WordPress Integration</span>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Integrate with existing WordPress/WooCommerce site
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {formData.deploymentMode === 'wordpress' && (
              <div className="space-y-2 animate-in slide-in-from-top-2">
                <Label htmlFor="wordpressUrl">WordPress Site URL *</Label>
                <Input
                  id="wordpressUrl"
                  type="url"
                  placeholder="https://their-site.com"
                  value={formData.wordpressUrl}
                  onChange={(e) => updateFormData('wordpressUrl', e.target.value)}
                  className={errors.wordpressUrl ? 'border-red-500' : ''}
                />
                {errors.wordpressUrl && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.wordpressUrl}
                  </p>
                )}
                <p className="text-sm text-muted-foreground">
                  The business owner will need to install our WordPress plugin
                </p>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="hasProducts"
                checked={formData.hasExistingProducts}
                onCheckedChange={(checked) => updateFormData('hasExistingProducts', checked as boolean)}
              />
              <div>
                <Label htmlFor="hasProducts" className="cursor-pointer">
                  Business has existing products
                </Label>
                <p className="text-sm text-muted-foreground">
                  Enable if they need to sync existing product catalog
                </p>
              </div>
            </div>

            {formData.hasExistingProducts && (
              <div className="space-y-4 animate-in slide-in-from-top-2">
                <div className="space-y-2">
                  <Label>Product Sync Method</Label>
                  <Select
                    value={formData.productSyncMethod}
                    onValueChange={(value) => updateFormData('productSyncMethod', value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="woocommerce">WooCommerce API</SelectItem>
                      <SelectItem value="custom">Custom API</SelectItem>
                      <SelectItem value="manual">Manual Import</SelectItem>
                      <SelectItem value="none">No Sync</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.productSyncMethod === 'custom' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="syncApiEndpoint">API Endpoint *</Label>
                      <Input
                        id="syncApiEndpoint"
                        type="url"
                        placeholder="https://api.example.com/products"
                        value={formData.syncApiEndpoint}
                        onChange={(e) => updateFormData('syncApiEndpoint', e.target.value)}
                        className={errors.syncApiEndpoint ? 'border-red-500' : ''}
                      />
                      {errors.syncApiEndpoint && (
                        <p className="text-sm text-red-500 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.syncApiEndpoint}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="syncApiKey">API Key *</Label>
                      <Input
                        id="syncApiKey"
                        type="password"
                        placeholder="Enter API key"
                        value={formData.syncApiKey}
                        onChange={(e) => updateFormData('syncApiKey', e.target.value)}
                        className={errors.syncApiKey ? 'border-red-500' : ''}
                      />
                      {errors.syncApiKey && (
                        <p className="text-sm text-red-500 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.syncApiKey}
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <h4 className="font-semibold">Business Information</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-muted-foreground">Email:</span>
                <span>{formData.email}</span>
                <span className="text-muted-foreground">Business:</span>
                <span>{formData.businessName}</span>
                <span className="text-muted-foreground">Contact:</span>
                <span>{formData.contactName}</span>
                <span className="text-muted-foreground">Tier:</span>
                <span className="capitalize">{formData.tier}</span>
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <h4 className="font-semibold">Deployment Configuration</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-muted-foreground">Mode:</span>
                <span className="capitalize">{formData.deploymentMode}</span>
                {formData.deploymentMode === 'wordpress' && (
                  <>
                    <span className="text-muted-foreground">WordPress URL:</span>
                    <span className="truncate">{formData.wordpressUrl}</span>
                  </>
                )}
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <h4 className="font-semibold">Product Setup</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-muted-foreground">Existing Products:</span>
                <span>{formData.hasExistingProducts ? 'Yes' : 'No'}</span>
                {formData.hasExistingProducts && (
                  <>
                    <span className="text-muted-foreground">Sync Method:</span>
                    <span className="capitalize">{formData.productSyncMethod}</span>
                  </>
                )}
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <h4 className="font-semibold">Trial Period</h4>
              <div className="space-y-2">
                <Label htmlFor="trialDays">Trial Duration (days)</Label>
                <Input
                  id="trialDays"
                  type="number"
                  min="7"
                  max="90"
                  value={formData.trialDays}
                  onChange={(e) => updateFormData('trialDays', parseInt(e.target.value) || 30)}
                />
                <p className="text-sm text-muted-foreground">
                  Account will start with a {formData.trialDays}-day trial period
                </p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>Create Business Owner Account</DialogTitle>
          <DialogDescription>
            Set up a new business owner with their initial configuration
          </DialogDescription>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-8">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;

              return (
                <React.Fragment key={step.id}>
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center border-2',
                        isActive && 'border-primary bg-primary text-primary-foreground',
                        isCompleted && 'border-primary bg-primary text-primary-foreground',
                        !isActive && !isCompleted && 'border-muted-foreground/30 text-muted-foreground'
                      )}
                    >
                      {isCompleted ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        <Icon className="h-5 w-5" />
                      )}
                    </div>
                    <div className="mt-2 text-center">
                      <p className={cn(
                        'text-sm font-medium',
                        isActive && 'text-primary',
                        !isActive && 'text-muted-foreground'
                      )}>
                        {step.name}
                      </p>
                      <p className="text-xs text-muted-foreground">{step.description}</p>
                    </div>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div
                      className={cn(
                        'flex-1 h-0.5 mx-2',
                        currentStep > step.id ? 'bg-primary' : 'bg-muted-foreground/30'
                      )}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          <Progress value={(currentStep / STEPS.length) * 100} className="mb-6" />
        </div>

        {/* Step Content */}
        <div className="px-6 pb-6 min-h-[300px]">
          {renderStepContent()}
        </div>

        <DialogFooter>
          <div className="flex justify-between w-full">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1 || isSubmitting}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>

              {currentStep < 4 ? (
                <Button onClick={handleNext}>
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="min-w-[120px]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Create Account
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}