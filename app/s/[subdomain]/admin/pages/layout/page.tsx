'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCMSConfig } from '@/contexts/CMSConfigContext';
import { Button } from '@/components/cms/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/cms/ui/card';
import { Switch } from '@/components/cms/ui/switch';
import { Label } from '@/components/cms/ui/label';
import { Badge } from '@/components/cms/ui/badge';
import {
  ArrowLeft,
  Layout,
  PanelTop,
  PanelBottom,
  Bell,
  Edit,
  Loader2,
  Settings,
  Eye,
  Save,
} from 'lucide-react';
import { toast } from 'sonner';

interface SiteSettings {
  id: string;
  header: Record<string, unknown> | null;
  footer: Record<string, unknown> | null;
  announcementBar: Record<string, unknown> | null;
  showAnnouncementBar: boolean;
  siteName: string | null;
  siteTagline: string | null;
  logoUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function LayoutSettingsPage() {
  const { buildPath } = useCMSConfig();
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/site-settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      } else {
        throw new Error('Failed to fetch settings');
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load layout settings');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAnnouncementBar = async (enabled: boolean) => {
    try {
      setIsSaving(true);
      const response = await fetch('/api/admin/site-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ showAnnouncementBar: enabled }),
      });

      if (response.ok) {
        setSettings((prev) => prev ? { ...prev, showAnnouncementBar: enabled } : null);
        toast.success(enabled ? 'Announcement bar enabled' : 'Announcement bar disabled');
      } else {
        throw new Error('Failed to update');
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Failed to update announcement bar');
    } finally {
      setIsSaving(false);
    }
  };

  const layoutItems = [
    {
      id: 'header',
      title: 'Header',
      description: 'Site navigation, logo, and top bar settings',
      icon: PanelTop,
      configured: !!settings?.header,
      editUrl: buildPath('/admin/pages/layout/header'),
    },
    {
      id: 'footer',
      title: 'Footer',
      description: 'Footer links, social media, and copyright',
      icon: PanelBottom,
      configured: !!settings?.footer,
      editUrl: buildPath('/admin/pages/layout/footer'),
    },
    {
      id: 'announcement',
      title: 'Announcement Bar',
      description: 'Top banner for promotions and alerts',
      icon: Bell,
      configured: !!settings?.announcementBar,
      editUrl: buildPath('/admin/pages/layout/announcement'),
      toggle: true,
      enabled: settings?.showAnnouncementBar || false,
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={buildPath('/admin/pages')}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Layout className="h-8 w-8" />
              Site Layout
            </h1>
            <p className="text-muted-foreground mt-2">
              Configure your site&apos;s header, footer, and announcement bar
            </p>
          </div>
        </div>
      </div>

      {/* Layout Components */}
      <div className="grid gap-6 md:grid-cols-3">
        {layoutItems.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.id} className="relative">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{item.title}</CardTitle>
                      <Badge
                        variant={item.configured ? 'default' : 'secondary'}
                        className="mt-1"
                      >
                        {item.configured ? 'Configured' : 'Not configured'}
                      </Badge>
                    </div>
                  </div>
                  {item.toggle && (
                    <div className="flex items-center gap-2">
                      <Switch
                        id={`toggle-${item.id}`}
                        checked={item.enabled}
                        onCheckedChange={toggleAnnouncementBar}
                        disabled={isSaving}
                      />
                      <Label htmlFor={`toggle-${item.id}`} className="text-xs">
                        {item.enabled ? 'On' : 'Off'}
                      </Label>
                    </div>
                  )}
                </div>
                <CardDescription className="mt-2">
                  {item.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href={item.editUrl}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit {item.title}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Preview Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Preview
          </CardTitle>
          <CardDescription>
            See how your layout components will appear on the site
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden bg-background">
            {/* Announcement Bar Preview */}
            {settings?.showAnnouncementBar && settings?.announcementBar && (
              <div
                className="p-2 text-center text-sm"
                style={{
                  backgroundColor: (settings.announcementBar as { backgroundColor?: string })?.backgroundColor || '#2563eb',
                  color: (settings.announcementBar as { textColor?: string })?.textColor || '#ffffff',
                }}
              >
                {(settings.announcementBar as { message?: string })?.message || 'Announcement message'}
              </div>
            )}

            {/* Header Preview */}
            <div className="border-b p-4 flex items-center justify-between bg-white">
              <div className="font-bold text-lg">
                {settings?.siteName || 'Your Site Name'}
              </div>
              <div className="flex gap-4 text-sm text-muted-foreground">
                <span>Home</span>
                <span>Products</span>
                <span>About</span>
                <span>Contact</span>
              </div>
            </div>

            {/* Content Placeholder */}
            <div className="p-8 text-center text-muted-foreground min-h-[200px] flex items-center justify-center bg-muted/50">
              <div>
                <Layout className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Page content will appear here</p>
              </div>
            </div>

            {/* Footer Preview */}
            <div
              className="p-6 text-center"
              style={{
                backgroundColor: (settings?.footer as { backgroundColor?: string })?.backgroundColor || '#18181b',
                color: (settings?.footer as { textColor?: string })?.textColor || '#ffffff',
              }}
            >
              <div className="text-lg font-bold mb-2">
                {settings?.siteName || 'Your Site Name'}
              </div>
              <div className="text-sm opacity-75">
                {settings?.siteTagline || '© 2025 All rights reserved.'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Help Section */}
      <Card className="bg-muted">
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Layout Tips
          </h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• The Header appears on every page with navigation links and your logo</li>
            <li>• The Footer contains links, social icons, and legal information</li>
            <li>• The Announcement Bar is great for promotions, shipping info, or alerts</li>
            <li>• Changes are applied globally across your entire site</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
