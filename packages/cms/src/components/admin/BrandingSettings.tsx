"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
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
import { toast } from "sonner";
import { MediaPicker } from "./MediaPicker";

interface BrandingData {
  siteName: string;
  siteTagline?: string;
  logoUrl?: string;
  logoAlt?: string;
  logoDarkUrl?: string;
  faviconUrl?: string;
  appleTouchIconUrl?: string;
  ogImageUrl?: string;
  primaryColor?: string;
  accentColor?: string;
}

export default function BrandingSettings() {
  const [branding, setBranding] = useState<BrandingData>({
    siteName: "",
    siteTagline: "",
    logoUrl: "",
    logoAlt: "",
    logoDarkUrl: "",
    faviconUrl: "",
    appleTouchIconUrl: "",
    ogImageUrl: "",
    primaryColor: "#0066cc",
    accentColor: "#6366f1",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchBranding();
  }, []);

  const fetchBranding = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/settings?group=branding");
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
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          group: "branding",
          settings: branding,
        }),
      });

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

  const updateField = (field: keyof BrandingData, value: string) => {
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
            Your site name and tagline appear in headers and metadata
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
            Browser tab icon and mobile app icons
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Favicon */}
            <div className="space-y-2">
              <MediaPicker
                label="Favicon"
                value={branding.faviconUrl || ""}
                onChange={(value) => updateField("faviconUrl", value)}
                placeholder="Select or upload favicon"
                previewSize="small"
              />
              <p className="text-xs text-muted-foreground">
                Recommended: 32x32px .ico or .png
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

      {/* Social Sharing */}
      <Card>
        <CardHeader>
          <CardTitle>Social Sharing</CardTitle>
          <CardDescription>
            Default image for social media shares
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
            Primary colors used throughout the site
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
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
