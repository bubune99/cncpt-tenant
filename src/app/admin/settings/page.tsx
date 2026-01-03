"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import {
  User,
  Mail,
  Bell,
  Shield,
  Palette,
  Globe,
  Smartphone,
  Monitor,
  Moon,
  Sun,
  Check,
  Loader2,
  AlertCircle,
  Download,
  Trash2,
  Key,
  Languages,
  CreditCard,
  Activity,
  ArrowLeft,
  Settings,
  Store,
  Package,
  Truck,
  Receipt,
  Server
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import Link from "next/link";
import EnvManager from "@/components/admin/EnvManager";
import BrandingSettings from "@/components/admin/BrandingSettings";
import EmailProviderSettings from "@/components/admin/EmailProviderSettings";

interface StoreSettings {
  general: {
    storeName: string;
    storeEmail: string;
    storePhone: string;
    storeAddress: string;
    currency: string;
    timezone: string;
  };
  notifications: {
    email: {
      orderConfirmation: boolean;
      orderShipped: boolean;
      lowStock: boolean;
      newCustomer: boolean;
    };
    push: {
      enabled: boolean;
      newOrders: boolean;
      lowStock: boolean;
    };
  };
  shipping: {
    enableFreeShipping: boolean;
    freeShippingThreshold: number;
    defaultShippingRate: number;
    enableLocalPickup: boolean;
  };
  taxes: {
    enableTaxes: boolean;
    taxRate: number;
    taxIncludedInPrice: boolean;
  };
  appearance: {
    theme: 'light' | 'dark' | 'system';
    primaryColor: string;
    accentColor: string;
  };
}

export default function SettingsPage() {
  const { user, isLoading: authLoading, authChecked } = useAuth();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState("branding");
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const [settings, setSettings] = useState<StoreSettings>({
    general: {
      storeName: '',
      storeEmail: '',
      storePhone: '',
      storeAddress: '',
      currency: 'USD',
      timezone: 'America/New_York'
    },
    notifications: {
      email: {
        orderConfirmation: true,
        orderShipped: true,
        lowStock: true,
        newCustomer: true
      },
      push: {
        enabled: false,
        newOrders: true,
        lowStock: true
      }
    },
    shipping: {
      enableFreeShipping: true,
      freeShippingThreshold: 50,
      defaultShippingRate: 5.99,
      enableLocalPickup: false
    },
    taxes: {
      enableTaxes: true,
      taxRate: 8.25,
      taxIncludedInPrice: false
    },
    appearance: {
      theme: 'system',
      primaryColor: 'blue',
      accentColor: 'purple'
    }
  });

  useEffect(() => {
    if (user) {
      loadSettings();
    }
  }, [user]);

  useEffect(() => {
    if (settings.appearance.theme !== theme) {
      setSettings(prev => ({
        ...prev,
        appearance: {
          ...prev.appearance,
          theme: theme as 'light' | 'dark' | 'system'
        }
      }));
    }
  }, [theme]);

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(prev => ({
          ...prev,
          ...data
        }));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        toast.success("Settings saved successfully");
        setHasChanges(false);
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      toast.error("Failed to save settings. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const updateSettings = (section: keyof StoreSettings, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
    setHasChanges(true);
  };

  const updateNestedSettings = (section: keyof StoreSettings, subsection: string, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [subsection]: {
          ...(prev[section] as any)[subsection],
          [field]: value
        }
      }
    }));
    setHasChanges(true);
  };

  if (user === undefined) {
    return (
      <div className="p-6 lg:p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!user && authChecked) {
    return (
      <div className="p-6 lg:p-8">
        <Card>
          <CardHeader>
            <CardTitle>Please Sign In</CardTitle>
            <CardDescription>You need to be logged in to access settings.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <a href="/handler/sign-in?after_auth_return_to=/settings">Sign In</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your store settings and preferences</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-9 lg:w-[1050px]">
          <TabsTrigger value="branding">
            <Palette className="mr-2 h-4 w-4" />
            Branding
          </TabsTrigger>
          <TabsTrigger value="general">
            <Store className="mr-2 h-4 w-4" />
            Store
          </TabsTrigger>
          <TabsTrigger value="email">
            <Mail className="mr-2 h-4 w-4" />
            Email
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="mr-2 h-4 w-4" />
            Alerts
          </TabsTrigger>
          <TabsTrigger value="shipping">
            <Truck className="mr-2 h-4 w-4" />
            Shipping
          </TabsTrigger>
          <TabsTrigger value="taxes">
            <Receipt className="mr-2 h-4 w-4" />
            Taxes
          </TabsTrigger>
          <TabsTrigger value="environment">
            <Server className="mr-2 h-4 w-4" />
            Environment
          </TabsTrigger>
          <TabsTrigger value="appearance">
            <Monitor className="mr-2 h-4 w-4" />
            Theme
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="mr-2 h-4 w-4" />
            Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="branding" className="space-y-4">
          <BrandingSettings />
        </TabsContent>

        <TabsContent value="email" className="space-y-4">
          <EmailProviderSettings />
        </TabsContent>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Store Information</CardTitle>
              <CardDescription>Basic information about your store</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="storeName">Store Name</Label>
                  <Input
                    id="storeName"
                    value={settings.general.storeName}
                    onChange={(e) => updateSettings('general', 'storeName', e.target.value)}
                    placeholder="Your Store Name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="storeEmail">Store Email</Label>
                  <Input
                    id="storeEmail"
                    type="email"
                    value={settings.general.storeEmail}
                    onChange={(e) => updateSettings('general', 'storeEmail', e.target.value)}
                    placeholder="store@example.com"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="storePhone">Phone Number</Label>
                  <Input
                    id="storePhone"
                    value={settings.general.storePhone}
                    onChange={(e) => updateSettings('general', 'storePhone', e.target.value)}
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={settings.general.currency}
                    onValueChange={(value) => updateSettings('general', 'currency', value)}
                  >
                    <SelectTrigger id="currency">
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                      <SelectItem value="GBP">GBP - British Pound</SelectItem>
                      <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                      <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="storeAddress">Store Address</Label>
                <Textarea
                  id="storeAddress"
                  value={settings.general.storeAddress}
                  onChange={(e) => updateSettings('general', 'storeAddress', e.target.value)}
                  placeholder="Enter your store address"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select
                  value={settings.general.timezone}
                  onValueChange={(value) => updateSettings('general', 'timezone', value)}
                >
                  <SelectTrigger id="timezone">
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                    <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                    <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                    <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                    <SelectItem value="Europe/London">London (GMT)</SelectItem>
                    <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                    <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Notifications</CardTitle>
              <CardDescription>Configure when you receive email alerts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Order Confirmations</Label>
                  <p className="text-sm text-muted-foreground">Get notified when orders are placed</p>
                </div>
                <Switch
                  checked={settings.notifications.email.orderConfirmation}
                  onCheckedChange={(checked) => updateNestedSettings('notifications', 'email', 'orderConfirmation', checked)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Order Shipped</Label>
                  <p className="text-sm text-muted-foreground">Get notified when orders ship</p>
                </div>
                <Switch
                  checked={settings.notifications.email.orderShipped}
                  onCheckedChange={(checked) => updateNestedSettings('notifications', 'email', 'orderShipped', checked)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Low Stock Alerts</Label>
                  <p className="text-sm text-muted-foreground">Get notified when products are low on stock</p>
                </div>
                <Switch
                  checked={settings.notifications.email.lowStock}
                  onCheckedChange={(checked) => updateNestedSettings('notifications', 'email', 'lowStock', checked)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>New Customers</Label>
                  <p className="text-sm text-muted-foreground">Get notified when new customers register</p>
                </div>
                <Switch
                  checked={settings.notifications.email.newCustomer}
                  onCheckedChange={(checked) => updateNestedSettings('notifications', 'email', 'newCustomer', checked)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Push Notifications</CardTitle>
              <CardDescription>Real-time browser notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive real-time alerts in your browser</p>
                </div>
                <Switch
                  checked={settings.notifications.push.enabled}
                  onCheckedChange={(checked) => updateNestedSettings('notifications', 'push', 'enabled', checked)}
                />
              </div>
              {settings.notifications.push.enabled && (
                <>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>New Orders</Label>
                      <p className="text-sm text-muted-foreground">Instant alerts for new orders</p>
                    </div>
                    <Switch
                      checked={settings.notifications.push.newOrders}
                      onCheckedChange={(checked) => updateNestedSettings('notifications', 'push', 'newOrders', checked)}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Low Stock</Label>
                      <p className="text-sm text-muted-foreground">Alerts when stock is running low</p>
                    </div>
                    <Switch
                      checked={settings.notifications.push.lowStock}
                      onCheckedChange={(checked) => updateNestedSettings('notifications', 'push', 'lowStock', checked)}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shipping" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Shipping Settings</CardTitle>
              <CardDescription>Configure shipping options for your store</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Free Shipping</Label>
                  <p className="text-sm text-muted-foreground">Offer free shipping on qualifying orders</p>
                </div>
                <Switch
                  checked={settings.shipping.enableFreeShipping}
                  onCheckedChange={(checked) => updateSettings('shipping', 'enableFreeShipping', checked)}
                />
              </div>

              {settings.shipping.enableFreeShipping && (
                <div className="space-y-2">
                  <Label>Free Shipping Threshold</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                    <Input
                      type="number"
                      step="0.01"
                      className="pl-7"
                      value={settings.shipping.freeShippingThreshold}
                      onChange={(e) => updateSettings('shipping', 'freeShippingThreshold', parseFloat(e.target.value))}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Orders above this amount qualify for free shipping
                  </p>
                </div>
              )}

              <Separator />

              <div className="space-y-2">
                <Label>Default Shipping Rate</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                  <Input
                    type="number"
                    step="0.01"
                    className="pl-7"
                    value={settings.shipping.defaultShippingRate}
                    onChange={(e) => updateSettings('shipping', 'defaultShippingRate', parseFloat(e.target.value))}
                  />
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Local Pickup</Label>
                  <p className="text-sm text-muted-foreground">Allow customers to pick up orders</p>
                </div>
                <Switch
                  checked={settings.shipping.enableLocalPickup}
                  onCheckedChange={(checked) => updateSettings('shipping', 'enableLocalPickup', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="taxes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tax Settings</CardTitle>
              <CardDescription>Configure tax rates and options</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Taxes</Label>
                  <p className="text-sm text-muted-foreground">Collect taxes on orders</p>
                </div>
                <Switch
                  checked={settings.taxes.enableTaxes}
                  onCheckedChange={(checked) => updateSettings('taxes', 'enableTaxes', checked)}
                />
              </div>

              {settings.taxes.enableTaxes && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <Label>Tax Rate (%)</Label>
                    <div className="relative">
                      <Input
                        type="number"
                        step="0.01"
                        value={settings.taxes.taxRate}
                        onChange={(e) => updateSettings('taxes', 'taxRate', parseFloat(e.target.value))}
                      />
                      <span className="absolute right-3 top-2.5 text-muted-foreground">%</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Prices Include Tax</Label>
                      <p className="text-sm text-muted-foreground">Display prices with tax included</p>
                    </div>
                    <Switch
                      checked={settings.taxes.taxIncludedInPrice}
                      onCheckedChange={(checked) => updateSettings('taxes', 'taxIncludedInPrice', checked)}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="environment" className="space-y-4">
          <EnvManager />
        </TabsContent>

        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Theme</CardTitle>
              <CardDescription>Customize the appearance of your dashboard</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Color Theme</Label>
                <div className="grid grid-cols-3 gap-4">
                  <div
                    className={`cursor-pointer rounded-lg border-2 p-4 text-center transition-colors ${settings.appearance.theme === 'light' ? 'border-primary' : 'border-muted'
                      }`}
                    onClick={() => {
                      updateSettings('appearance', 'theme', 'light');
                      setTheme('light');
                    }}
                  >
                    <Sun className="mx-auto h-6 w-6 mb-2" />
                    <p className="text-sm font-medium">Light</p>
                  </div>
                  <div
                    className={`cursor-pointer rounded-lg border-2 p-4 text-center transition-colors ${settings.appearance.theme === 'dark' ? 'border-primary' : 'border-muted'
                      }`}
                    onClick={() => {
                      updateSettings('appearance', 'theme', 'dark');
                      setTheme('dark');
                    }}
                  >
                    <Moon className="mx-auto h-6 w-6 mb-2" />
                    <p className="text-sm font-medium">Dark</p>
                  </div>
                  <div
                    className={`cursor-pointer rounded-lg border-2 p-4 text-center transition-colors ${settings.appearance.theme === 'system' ? 'border-primary' : 'border-muted'
                      }`}
                    onClick={() => {
                      updateSettings('appearance', 'theme', 'system');
                      setTheme('system');
                    }}
                  >
                    <Monitor className="mx-auto h-6 w-6 mb-2" />
                    <p className="text-sm font-medium">System</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Primary Color</Label>
                  <Select
                    value={settings.appearance.primaryColor}
                    onValueChange={(value) => updateSettings('appearance', 'primaryColor', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select color" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="blue">Blue</SelectItem>
                      <SelectItem value="green">Green</SelectItem>
                      <SelectItem value="purple">Purple</SelectItem>
                      <SelectItem value="red">Red</SelectItem>
                      <SelectItem value="orange">Orange</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Accent Color</Label>
                  <Select
                    value={settings.appearance.accentColor}
                    onValueChange={(value) => updateSettings('appearance', 'accentColor', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select color" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="blue">Blue</SelectItem>
                      <SelectItem value="green">Green</SelectItem>
                      <SelectItem value="purple">Purple</SelectItem>
                      <SelectItem value="red">Red</SelectItem>
                      <SelectItem value="orange">Orange</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Manage your account security</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Password</Label>
                  <p className="text-sm text-muted-foreground">Change your account password</p>
                </div>
                <Button variant="outline">Change Password</Button>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Two-Factor Authentication</Label>
                  <p className="text-sm text-muted-foreground">Add extra security to your account</p>
                </div>
                <Button variant="outline">
                  <Shield className="mr-2 h-4 w-4" />
                  Enable 2FA
                </Button>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>API Keys</Label>
                  <p className="text-sm text-muted-foreground">Manage API access to your store</p>
                </div>
                <Button variant="outline">
                  <Key className="mr-2 h-4 w-4" />
                  Manage Keys
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
              <CardDescription>Irreversible actions for your account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Export Data</div>
                  <div className="text-sm text-muted-foreground">Download all your store data</div>
                </div>
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-destructive">Delete Store</div>
                  <div className="text-sm text-muted-foreground">Permanently delete your store and all data</div>
                </div>
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-8 flex justify-end space-x-4">
        <Button
          variant="outline"
          onClick={() => {
            loadSettings();
            setHasChanges(false);
          }}
          disabled={!hasChanges || isSaving}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSaveSettings}
          disabled={!hasChanges || isSaving}
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Check className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Store</DialogTitle>
            <DialogDescription>
              This will permanently delete your store and all associated data.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You will lose access to:
                <ul className="list-disc list-inside mt-2">
                  <li>All products and inventory</li>
                  <li>Customer data and orders</li>
                  <li>Store settings and configurations</li>
                  <li>Analytics and reports</li>
                </ul>
              </AlertDescription>
            </Alert>
            <div className="space-y-2">
              <Label htmlFor="delete-confirmation">
                Type <span className="font-mono font-bold">DELETE</span> to confirm
              </Label>
              <Input
                id="delete-confirmation"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="Type DELETE"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setDeleteConfirmation('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteConfirmation !== 'DELETE' || isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Store'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
