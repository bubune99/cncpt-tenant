"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Loader2, Info } from "lucide-react";
import { Button } from '../ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { toast } from "sonner";
import { MediaPicker } from "./MediaPicker";

interface BrandingData {
  siteName: string;
  siteTagline?: string;
  logoUrl?: string;
  logoAlt?: string;
  logoDarkUrl?: string;
  faviconUrl?: string;
  faviconSvgUrl?: string;
  appleTouchIconUrl?: string;
  ogImageUrl?: string;
  primaryColor?: string;
  accentColor?: string;
  themeColor?: string;
  titleTemplate?: string;
  metaDescription?: string;
  hidePoweredBy?: boolean;
  customCss?: string;
}

export default function BrandingSettings() {
  const params = useParams();
  const subdomain = params?.subdomain as string;

  const [branding, setBranding] = useState<BrandingData>({
    siteName: "",
    siteTagline: "",
    logoUrl: "",
    logoAlt: "",
    logoDarkUrl: "",
    faviconUrl: "",
    faviconSvgUrl: "",
    appleTouchIconUrl: "",
    ogImageUrl: "",
    primaryColor: "#0066cc",
    accentColor: "#6366f1",
    themeColor: "#0891b2",
    titleTemplate: "",
    metaDescription: "",
    hidePoweredBy: false,
    customCss: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchBranding();
  }, [subdomain]);

  const fetchBranding = async () => {
    try {
      setIsLoading(true);

      // Try tenant-scoped branding API first
      if (subdomain) {
        const response = await fetch(
          `/api/cms/admin/branding?subdomain=${encodeURIComponent(subdomain)}`
        );
        if (response.ok) {
          const data = await response.json();
          if (data.branding) {
            setBranding((prev) => ({ ...prev, ...data.branding }));
            setIsLoading(false);
            return;
          }
        }
      }

      // Fallback to global settings API
      const response = await fetch("/api/cms/settings?group=branding");
      if (response.ok) {
        const data = await response.json();
        if (data.branding) {
          setBranding((prev) => ({ ...prev, ...data.branding }));
        }
      }
    } catch (error) {
      console.error("Failed to fetch branding:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      let response: Response;

      if (subdomain) {
        // Save via tenant-scoped branding API
        response = await fetch("/api/cms/admin/branding", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subdomain,
            branding,
          }),
        });
      } else {
        // Fallback to global settings API
        response = await fetch("/api/cms/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            group: "branding",
            settings: branding,
          }),
        });
      }

      if (response.ok) {
        toast.success("Branding settings saved successfully");
        setHasChanges(false);
      } else {
        throw new Error("Failed to save");
      }
    } catch (error) {
      toast.error("Failed to save branding settings");
    } finally {
      setIsSaving(false);
    }
  };

  const updateField = (field: keyof BrandingData, value: string | boolean) => {
    setBranding((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Site Identity */}
      <Card>
        <CardHeader>
          <CardTitle>Site Identity</CardTitle>
          <CardDescription>
            Your site name and tagline appear in headers, metadata, and emails
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="siteName">Site Name</Label>
              <Input
                id="siteName"
                value={branding.siteName}
                onChange={(e) => updateField("siteName", e.target.value)}
                placeholder="My Awesome Site"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="siteTagline">Tagline</Label>
              <Input
                id="siteTagline"
                value={branding.siteTagline || ""}
                onChange={(e) => updateField("siteTagline", e.target.value)}
                placeholder="Your site's slogan or description"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logo */}
      <Card>
        <CardHeader>
          <CardTitle>Logo</CardTitle>
          <CardDescription>
            Upload your logo for light and dark themes. Recommended size: 200x50px or larger.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Light Mode Logo */}
            <MediaPicker
              label="Logo (Light Mode)"
              value={branding.logoUrl || ""}
              onChange={(value) => updateField("logoUrl", value)}
              placeholder="Select or upload logo"
              previewSize="small"
            />

            {/* Dark Mode Logo */}
            <MediaPicker
              label="Logo (Dark Mode)"
              value={branding.logoDarkUrl || ""}
              onChange={(value) => updateField("logoDarkUrl", value)}
              placeholder="Select or upload dark mode logo"
              previewSize="small"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="logoAlt">Logo Alt Text</Label>
            <Input
              id="logoAlt"
              value={branding.logoAlt || ""}
              onChange={(e) => updateField("logoAlt", e.target.value)}
              placeholder="Company Logo"
            />
            <p className="text-xs text-muted-foreground">
              Describes the logo for accessibility and SEO
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Favicon & Icons */}
      <Card>
        <CardHeader>
          <CardTitle>Favicon & Icons</CardTitle>
          <CardDescription>
            Browser tab icon and mobile app icons. Each tenant gets their own favicon.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Favicon */}
            <div className="space-y-2">
              <MediaPicker
                label="Favicon (PNG/ICO)"
                value={branding.faviconUrl || ""}
                onChange={(value) => updateField("faviconUrl", value)}
                placeholder="Select or upload favicon"
                previewSize="small"
              />
              <p className="text-xs text-muted-foreground">
                Recommended: 32x32px .ico or .png
              </p>
            </div>

            {/* SVG Favicon */}
            <div className="space-y-2">
              <MediaPicker
                label="Favicon (SVG)"
                value={branding.faviconSvgUrl || ""}
                onChange={(value) => updateField("faviconSvgUrl", value)}
                placeholder="Select or upload SVG icon"
                previewSize="small"
              />
              <p className="text-xs text-muted-foreground">
                Scalable SVG favicon for modern browsers
              </p>
            </div>

            {/* Apple Touch Icon */}
            <div className="space-y-2">
              <MediaPicker
                label="Apple Touch Icon"
                value={branding.appleTouchIconUrl || ""}
                onChange={(value) => updateField("appleTouchIconUrl", value)}
                placeholder="Select or upload icon"
                previewSize="small"
              />
              <p className="text-xs text-muted-foreground">
                Recommended: 180x180px .png
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SEO & Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>SEO & Metadata</CardTitle>
          <CardDescription>
            Control how your site appears in search results and when shared on social media
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="titleTemplate">Title Template</Label>
            <Input
              id="titleTemplate"
              value={branding.titleTemplate || ""}
              onChange={(e) => updateField("titleTemplate", e.target.value)}
              placeholder="%s | My Brand"
            />
            <p className="text-xs text-muted-foreground">
              Use <code className="bg-muted px-1 rounded">%s</code> as a placeholder for the page title.
              Example: &quot;%s | My Brand&quot; becomes &quot;About Us | My Brand&quot;
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="metaDescription">Default Meta Description</Label>
            <Textarea
              id="metaDescription"
              value={branding.metaDescription || ""}
              onChange={(e) => updateField("metaDescription", e.target.value)}
              placeholder="A brief description of your site for search engines..."
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Used when individual pages do not have their own description. Max 160 characters recommended.
            </p>
          </div>

          <div className="space-y-2">
            <MediaPicker
              label="Default Open Graph Image"
              value={branding.ogImageUrl || ""}
              onChange={(value) => updateField("ogImageUrl", value)}
              placeholder="Select or upload social sharing image"
              previewSize="large"
            />
            <p className="text-xs text-muted-foreground">
              Recommended: 1200x630px for best display on social platforms
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Brand Colors */}
      <Card>
        <CardHeader>
          <CardTitle>Brand Colors</CardTitle>
          <CardDescription>
            Primary colors used throughout the site. These override CSS variables globally.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-3">
              <Label htmlFor="primaryColor">Primary Color</Label>
              <div className="flex gap-3">
                <input
                  type="color"
                  id="primaryColor"
                  value={branding.primaryColor || "#0066cc"}
                  onChange={(e) => updateField("primaryColor", e.target.value)}
                  className="h-10 w-14 rounded border cursor-pointer"
                />
                <Input
                  value={branding.primaryColor || "#0066cc"}
                  onChange={(e) => updateField("primaryColor", e.target.value)}
                  placeholder="#0066cc"
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-3">
              <Label htmlFor="accentColor">Accent Color</Label>
              <div className="flex gap-3">
                <input
                  type="color"
                  id="accentColor"
                  value={branding.accentColor || "#6366f1"}
                  onChange={(e) => updateField("accentColor", e.target.value)}
                  className="h-10 w-14 rounded border cursor-pointer"
                />
                <Input
                  value={branding.accentColor || "#6366f1"}
                  onChange={(e) => updateField("accentColor", e.target.value)}
                  placeholder="#6366f1"
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-3">
              <Label htmlFor="themeColor">Theme Color (Browser/PWA)</Label>
              <div className="flex gap-3">
                <input
                  type="color"
                  id="themeColor"
                  value={branding.themeColor || "#0891b2"}
                  onChange={(e) => updateField("themeColor", e.target.value)}
                  className="h-10 w-14 rounded border cursor-pointer"
                />
                <Input
                  value={branding.themeColor || "#0891b2"}
                  onChange={(e) => updateField("themeColor", e.target.value)}
                  placeholder="#0891b2"
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Colors the browser address bar and PWA splash screen
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Advanced / White Label */}
      <Card>
        <CardHeader>
          <CardTitle>White Label</CardTitle>
          <CardDescription>
            Control CNCPT branding visibility and add custom CSS
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Hide &quot;Powered by CNCPT&quot;</Label>
              <p className="text-sm text-muted-foreground">
                Remove the CNCPT branding from the storefront footer
              </p>
            </div>
            <Switch
              checked={branding.hidePoweredBy || false}
              onCheckedChange={(checked) => updateField("hidePoweredBy", checked)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customCss">Custom CSS</Label>
            <Textarea
              id="customCss"
              value={branding.customCss || ""}
              onChange={(e) => updateField("customCss", e.target.value)}
              placeholder={`.my-class { color: var(--primary); }\n\n/* Override any storefront styles */`}
              rows={6}
              className="font-mono text-sm"
            />
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>
                Custom CSS is sanitized for security. Dangerous constructs like
                @import, expression(), and javascript: URLs are automatically removed.
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-4">
        <Button
          variant="outline"
          onClick={fetchBranding}
          disabled={!hasChanges || isSaving}
        >
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={!hasChanges || isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Branding"
          )}
        </Button>
      </div>
    </div>
  );
}
