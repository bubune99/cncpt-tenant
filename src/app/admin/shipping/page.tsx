'use client';

import { useState, useEffect } from 'react';
import {
  Truck,
  Settings,
  Package,
  MapPin,
  Save,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  ExternalLink,
  PlusCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShippingElements } from '@/components/admin/ShippingElements';

interface ShippingSettings {
  enabled: boolean;
  shippoApiKey: string;
  shippoWebhookSecret: string;
  testMode: boolean;
  useElements: boolean;
  fromName: string;
  fromCompany: string;
  fromStreet1: string;
  fromStreet2: string;
  fromCity: string;
  fromState: string;
  fromZip: string;
  fromCountry: string;
  fromPhone: string;
  fromEmail: string;
  enabledCarriers: string[];
  defaultLabelFormat: string;
  defaultPackageWeight: number;
  requireSignature: boolean;
}

interface Shipment {
  id: string;
  orderId: string;
  trackingNumber: string | null;
  carrier: string | null;
  status: string;
  labelUrl: string | null;
  createdAt: string;
  order?: {
    id: string;
    orderNumber: string;
  };
}

const defaultSettings: ShippingSettings = {
  enabled: false,
  shippoApiKey: '',
  shippoWebhookSecret: '',
  testMode: true,
  useElements: true, // Default to using Shippo's embedded widget
  fromName: '',
  fromCompany: '',
  fromStreet1: '',
  fromStreet2: '',
  fromCity: '',
  fromState: '',
  fromZip: '',
  fromCountry: 'US',
  fromPhone: '',
  fromEmail: '',
  enabledCarriers: ['usps'],
  defaultLabelFormat: 'PDF_4x6',
  defaultPackageWeight: 16,
  requireSignature: false,
};

const carriers = [
  { value: 'usps', label: 'USPS' },
  { value: 'ups', label: 'UPS' },
  { value: 'fedex', label: 'FedEx' },
];

const labelFormats = [
  { value: 'PDF', label: 'PDF (Standard)' },
  { value: 'PDF_4x6', label: 'PDF 4x6 (Thermal)' },
  { value: 'PNG', label: 'PNG' },
];

export default function ShippingPage() {
  const [settings, setSettings] = useState<ShippingSettings>(defaultSettings);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchSettings();
    fetchShipments();
  }, []);

  async function fetchSettings() {
    try {
      const response = await fetch('/api/shipping/settings');
      if (response.ok) {
        const data = await response.json();
        // API returns settings directly, not wrapped
        setSettings({ ...defaultSettings, ...data });
      }
    } catch (error) {
      console.error('Failed to fetch shipping settings:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchShipments() {
    try {
      const response = await fetch('/api/admin/shipments');
      if (response.ok) {
        const data = await response.json();
        setShipments(data.shipments || []);
      }
    } catch (error) {
      console.error('Failed to fetch shipments:', error);
    }
  }

  async function saveSettings() {
    setIsSaving(true);
    setSaveMessage(null);
    try {
      const response = await fetch('/api/shipping/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        setSaveMessage({ type: 'success', text: 'Settings saved successfully' });
      } else {
        const error = await response.json();
        setSaveMessage({ type: 'error', text: error.error || 'Failed to save settings' });
      }
    } catch (error) {
      setSaveMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveMessage(null), 3000);
    }
  }

  function updateSetting<K extends keyof ShippingSettings>(key: K, value: ShippingSettings[K]) {
    setSettings(prev => ({ ...prev, [key]: value }));
  }

  function toggleCarrier(carrier: string) {
    const current = settings.enabledCarriers || [];
    const updated = current.includes(carrier)
      ? current.filter(c => c !== carrier)
      : [...current, carrier];
    updateSetting('enabledCarriers', updated);
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-700';
      case 'in_transit':
        return 'bg-blue-100 text-blue-700';
      case 'label_purchased':
        return 'bg-purple-100 text-purple-700';
      case 'exception':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="flex items-center justify-center h-64">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Shipping</h1>
          <p className="text-muted-foreground mt-1">
            Configure shipping providers and manage shipments
          </p>
        </div>
      </div>

      <Tabs defaultValue="create" className="space-y-6">
        <TabsList>
          <TabsTrigger value="create" className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4" />
            Create Shipment
          </TabsTrigger>
          <TabsTrigger value="shipments" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Shipments
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Create Shipment Tab - Shippo Elements Widget */}
        <TabsContent value="create">
          {!settings.enabled ? (
            <div className="border border-dashed rounded-lg p-12 text-center">
              <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Shipping Not Enabled</h3>
              <p className="text-muted-foreground mb-4">
                Enable shipping and configure your Shippo API key in Settings to create shipments.
              </p>
              <Button variant="outline" onClick={() => (document.querySelector('[data-value="settings"]') as HTMLElement)?.click()}>
                Go to Settings
              </Button>
            </div>
          ) : settings.useElements ? (
            <div className="bg-card border rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Package className="h-5 w-5" />
                Create Shipping Label
              </h2>
              <p className="text-muted-foreground mb-6">
                Use the Shippo widget below to create shipping labels. Compare rates across carriers, validate addresses, and purchase labels.
              </p>
              <ShippingElements
                onLabelCreated={(label) => {
                  console.log('Label created:', label);
                  // Refresh shipments list
                  fetchShipments();
                }}
                onError={(error) => {
                  console.error('Shipping error:', error);
                }}
                className="border rounded-lg"
              />
            </div>
          ) : (
            <div className="border border-dashed rounded-lg p-12 text-center">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Custom API Mode</h3>
              <p className="text-muted-foreground mb-4">
                Shippo Elements is disabled. Create shipments programmatically via the API or enable Elements in Settings.
              </p>
              <Button variant="outline" onClick={() => (document.querySelector('[data-value="settings"]') as HTMLElement)?.click()}>
                Enable Elements
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          {/* API Configuration */}
          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Shippo API Configuration</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Shipping</Label>
                  <p className="text-sm text-muted-foreground">Allow shipping calculation and label generation</p>
                </div>
                <Switch
                  checked={settings.enabled}
                  onCheckedChange={(checked) => updateSetting('enabled', checked)}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="apiKey">Shippo API Key</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    value={settings.shippoApiKey}
                    onChange={(e) => updateSetting('shippoApiKey', e.target.value)}
                    placeholder="shippo_live_..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="webhookSecret">Webhook Secret</Label>
                  <Input
                    id="webhookSecret"
                    type="password"
                    value={settings.shippoWebhookSecret}
                    onChange={(e) => updateSetting('shippoWebhookSecret', e.target.value)}
                    placeholder="whsec_..."
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Test Mode</Label>
                  <p className="text-sm text-muted-foreground">Use Shippo test API for development</p>
                </div>
                <Switch
                  checked={settings.testMode}
                  onCheckedChange={(checked) => updateSetting('testMode', checked)}
                />
              </div>

              <div className="flex items-center justify-between border-t pt-4 mt-4">
                <div>
                  <Label>Use Shippo Elements</Label>
                  <p className="text-sm text-muted-foreground">
                    Use Shippo's embedded widget for label creation (recommended)
                  </p>
                </div>
                <Switch
                  checked={settings.useElements}
                  onCheckedChange={(checked) => updateSetting('useElements', checked)}
                />
              </div>
            </div>
          </div>

          {/* From Address */}
          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Default From Address
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fromName">Name</Label>
                <Input
                  id="fromName"
                  value={settings.fromName}
                  onChange={(e) => updateSetting('fromName', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fromCompany">Company</Label>
                <Input
                  id="fromCompany"
                  value={settings.fromCompany}
                  onChange={(e) => updateSetting('fromCompany', e.target.value)}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="fromStreet1">Street Address</Label>
                <Input
                  id="fromStreet1"
                  value={settings.fromStreet1}
                  onChange={(e) => updateSetting('fromStreet1', e.target.value)}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="fromStreet2">Apt, Suite, etc.</Label>
                <Input
                  id="fromStreet2"
                  value={settings.fromStreet2}
                  onChange={(e) => updateSetting('fromStreet2', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fromCity">City</Label>
                <Input
                  id="fromCity"
                  value={settings.fromCity}
                  onChange={(e) => updateSetting('fromCity', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fromState">State</Label>
                  <Input
                    id="fromState"
                    value={settings.fromState}
                    onChange={(e) => updateSetting('fromState', e.target.value)}
                    maxLength={2}
                    placeholder="CA"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fromZip">ZIP Code</Label>
                  <Input
                    id="fromZip"
                    value={settings.fromZip}
                    onChange={(e) => updateSetting('fromZip', e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="fromPhone">Phone</Label>
                <Input
                  id="fromPhone"
                  type="tel"
                  value={settings.fromPhone}
                  onChange={(e) => updateSetting('fromPhone', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fromEmail">Email</Label>
                <Input
                  id="fromEmail"
                  type="email"
                  value={settings.fromEmail}
                  onChange={(e) => updateSetting('fromEmail', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Carrier Settings */}
          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Carriers & Preferences
            </h2>
            <div className="space-y-4">
              <div>
                <Label className="mb-3 block">Enabled Carriers</Label>
                <div className="flex flex-wrap gap-3">
                  {carriers.map((carrier) => (
                    <button
                      key={carrier.value}
                      onClick={() => toggleCarrier(carrier.value)}
                      className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                        settings.enabledCarriers?.includes(carrier.value)
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background hover:bg-accent'
                      }`}
                    >
                      {carrier.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="labelFormat">Default Label Format</Label>
                  <Select
                    value={settings.defaultLabelFormat}
                    onValueChange={(value) => updateSetting('defaultLabelFormat', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {labelFormats.map((format) => (
                        <SelectItem key={format.value} value={format.value}>
                          {format.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="defaultWeight">Default Package Weight (oz)</Label>
                  <Input
                    id="defaultWeight"
                    type="number"
                    value={settings.defaultPackageWeight}
                    onChange={(e) => updateSetting('defaultPackageWeight', parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Require Signature</Label>
                  <p className="text-sm text-muted-foreground">Require signature on delivery for all shipments</p>
                </div>
                <Switch
                  checked={settings.requireSignature}
                  onCheckedChange={(checked) => updateSetting('requireSignature', checked)}
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex items-center gap-4">
            <Button onClick={saveSettings} disabled={isSaving}>
              {isSaving ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Settings
                </>
              )}
            </Button>
            {saveMessage && (
              <span className={`flex items-center gap-1.5 text-sm ${
                saveMessage.type === 'success' ? 'text-green-600' : 'text-red-600'
              }`}>
                {saveMessage.type === 'success' ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                {saveMessage.text}
              </span>
            )}
          </div>
        </TabsContent>

        {/* Shipments Tab */}
        <TabsContent value="shipments">
          {shipments.length === 0 ? (
            <div className="border border-dashed rounded-lg p-12 text-center">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No shipments yet</h3>
              <p className="text-muted-foreground">
                Shipments will appear here when orders are shipped
              </p>
            </div>
          ) : (
            <div className="bg-card border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Order</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Carrier</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Tracking</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Created</th>
                    <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {shipments.map((shipment) => (
                    <tr key={shipment.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-4 font-medium">
                        #{shipment.order?.orderNumber || shipment.orderId.slice(0, 8)}
                      </td>
                      <td className="px-4 py-4 uppercase text-sm">
                        {shipment.carrier || '-'}
                      </td>
                      <td className="px-4 py-4 text-sm font-mono">
                        {shipment.trackingNumber || '-'}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(shipment.status)}`}>
                          {shipment.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-muted-foreground">
                        {new Date(shipment.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-4 text-right">
                        {shipment.labelUrl && (
                          <a
                            href={shipment.labelUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                          >
                            Label
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
