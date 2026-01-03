'use client';

/**
 * Site Settings Admin Page
 *
 * Manage global site settings including:
 * - Header configuration
 * - Footer configuration
 * - Announcement bar
 * - Site branding (logo, name, tagline)
 * - SEO defaults
 * - Contact information
 * - Analytics tracking codes
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Loader2,
  Save,
  Layout,
  MessageSquare,
  Palette,
  Settings2,
  Globe,
  BarChart,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  logoAlt: string | null;
  faviconUrl: string | null;
  socialLinks: Record<string, unknown>[] | null;
  defaultMetaTitle: string | null;
  defaultMetaDescription: string | null;
  defaultOgImage: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  businessAddress: Record<string, unknown> | null;
  googleAnalyticsId: string | null;
  facebookPixelId: string | null;
}

export default function SiteSettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    siteName: '',
    siteTagline: '',
    logoUrl: '',
    logoAlt: '',
    faviconUrl: '',
    defaultMetaTitle: '',
    defaultMetaDescription: '',
    defaultOgImage: '',
    contactEmail: '',
    contactPhone: '',
    googleAnalyticsId: '',
    facebookPixelId: '',
    showAnnouncementBar: false,
  });

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
        setFormData({
          siteName: data.siteName || '',
          siteTagline: data.siteTagline || '',
          logoUrl: data.logoUrl || '',
          logoAlt: data.logoAlt || '',
          faviconUrl: data.faviconUrl || '',
          defaultMetaTitle: data.defaultMetaTitle || '',
          defaultMetaDescription: data.defaultMetaDescription || '',
          defaultOgImage: data.defaultOgImage || '',
          contactEmail: data.contactEmail || '',
          contactPhone: data.contactPhone || '',
          googleAnalyticsId: data.googleAnalyticsId || '',
          facebookPixelId: data.facebookPixelId || '',
          showAnnouncementBar: data.showAnnouncementBar || false,
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/admin/site-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data);
        toast.success('Settings saved successfully');
      } else {
        toast.error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Site Settings</h1>
            <p className="text-muted-foreground">
              Configure global site settings and appearance
            </p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Changes
        </Button>
      </div>

      <Tabs defaultValue="layout" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="layout" className="flex items-center gap-2">
            <Layout className="h-4 w-4" />
            Layout
          </TabsTrigger>
          <TabsTrigger value="branding" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Branding
          </TabsTrigger>
          <TabsTrigger value="seo" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            SEO
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Layout Tab */}
        <TabsContent value="layout" className="space-y-6">
          {/* Header Editor Link */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layout className="h-5 w-5" />
                Global Header
              </CardTitle>
              <CardDescription>
                Configure the site-wide header that appears on all pages (unless
                overridden)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm">
                    {settings?.header
                      ? 'Header configured'
                      : 'No header configured'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Use the visual editor to customize your header
                  </p>
                </div>
                <Button asChild>
                  <Link href="/admin/site-settings/header">
                    Edit Header
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Footer Editor Link */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layout className="h-5 w-5" />
                Global Footer
              </CardTitle>
              <CardDescription>
                Configure the site-wide footer that appears on all pages (unless
                overridden)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm">
                    {settings?.footer
                      ? 'Footer configured'
                      : 'No footer configured'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Use the visual editor to customize your footer
                  </p>
                </div>
                <Button asChild>
                  <Link href="/admin/site-settings/footer">
                    Edit Footer
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Announcement Bar */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Announcement Bar
              </CardTitle>
              <CardDescription>
                Display a banner message at the top of your site
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="showAnnouncementBar">
                      Enable Announcement Bar
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Show announcement banner on all pages
                    </p>
                  </div>
                  <Switch
                    id="showAnnouncementBar"
                    checked={formData.showAnnouncementBar}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, showAnnouncementBar: checked })
                    }
                  />
                </div>
                {formData.showAnnouncementBar && (
                  <Button variant="outline" asChild>
                    <Link href="/admin/site-settings/announcement">
                      Edit Announcement
                    </Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Branding Tab */}
        <TabsContent value="branding" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Site Identity</CardTitle>
              <CardDescription>
                Basic information about your website
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="siteName">Site Name</Label>
                  <Input
                    id="siteName"
                    value={formData.siteName}
                    onChange={(e) =>
                      setFormData({ ...formData, siteName: e.target.value })
                    }
                    placeholder="My Website"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="siteTagline">Tagline</Label>
                  <Input
                    id="siteTagline"
                    value={formData.siteTagline}
                    onChange={(e) =>
                      setFormData({ ...formData, siteTagline: e.target.value })
                    }
                    placeholder="A brief description of your site"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Logo &amp; Favicon</CardTitle>
              <CardDescription>
                Upload your brand assets
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="logoUrl">Logo URL</Label>
                  <Input
                    id="logoUrl"
                    value={formData.logoUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, logoUrl: e.target.value })
                    }
                    placeholder="https://example.com/logo.png"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="logoAlt">Logo Alt Text</Label>
                  <Input
                    id="logoAlt"
                    value={formData.logoAlt}
                    onChange={(e) =>
                      setFormData({ ...formData, logoAlt: e.target.value })
                    }
                    placeholder="Company Logo"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="faviconUrl">Favicon URL</Label>
                <Input
                  id="faviconUrl"
                  value={formData.faviconUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, faviconUrl: e.target.value })
                  }
                  placeholder="https://example.com/favicon.ico"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>
                How customers can reach you
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Contact Email</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) =>
                      setFormData({ ...formData, contactEmail: e.target.value })
                    }
                    placeholder="contact@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactPhone">Contact Phone</Label>
                  <Input
                    id="contactPhone"
                    type="tel"
                    value={formData.contactPhone}
                    onChange={(e) =>
                      setFormData({ ...formData, contactPhone: e.target.value })
                    }
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SEO Tab */}
        <TabsContent value="seo" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Default SEO Settings</CardTitle>
              <CardDescription>
                Fallback meta tags for pages without custom SEO
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="defaultMetaTitle">Default Meta Title</Label>
                <Input
                  id="defaultMetaTitle"
                  value={formData.defaultMetaTitle}
                  onChange={(e) =>
                    setFormData({ ...formData, defaultMetaTitle: e.target.value })
                  }
                  placeholder="My Website - Tagline"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="defaultMetaDescription">
                  Default Meta Description
                </Label>
                <Textarea
                  id="defaultMetaDescription"
                  value={formData.defaultMetaDescription}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      defaultMetaDescription: e.target.value,
                    })
                  }
                  placeholder="A brief description of your website for search engines"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="defaultOgImage">Default OG Image URL</Label>
                <Input
                  id="defaultOgImage"
                  value={formData.defaultOgImage}
                  onChange={(e) =>
                    setFormData({ ...formData, defaultOgImage: e.target.value })
                  }
                  placeholder="https://example.com/og-image.jpg"
                />
                <p className="text-xs text-muted-foreground">
                  Recommended size: 1200x630 pixels
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Analytics &amp; Tracking</CardTitle>
              <CardDescription>
                Connect your analytics services
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="googleAnalyticsId">Google Analytics ID</Label>
                <Input
                  id="googleAnalyticsId"
                  value={formData.googleAnalyticsId}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      googleAnalyticsId: e.target.value,
                    })
                  }
                  placeholder="G-XXXXXXXXXX"
                />
                <p className="text-xs text-muted-foreground">
                  Your GA4 Measurement ID
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="facebookPixelId">Facebook Pixel ID</Label>
                <Input
                  id="facebookPixelId"
                  value={formData.facebookPixelId}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      facebookPixelId: e.target.value,
                    })
                  }
                  placeholder="XXXXXXXXXXXXXXXX"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
