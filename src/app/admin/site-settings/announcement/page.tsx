'use client';

/**
 * Announcement Bar Editor Page
 *
 * Visual editor for configuring the global announcement bar.
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, Save, Eye, EyeOff } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { toast } from 'sonner';
import { AnnouncementBar, type AnnouncementBarProps } from '../../../../puck/layout/components';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { Switch } from '../../../../components/ui/switch';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../../components/ui/card';

const defaultAnnouncementProps: AnnouncementBarProps = {
  message: 'Free shipping on orders over $50!',
  link: {
    label: 'Shop Now',
    href: '/products',
  },
  dismissible: true,
  backgroundColor: '#2563eb',
  textColor: '#ffffff',
};

export default function AnnouncementEditorPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [showAnnouncementBar, setShowAnnouncementBar] = useState(false);
  const [announcementProps, setAnnouncementProps] =
    useState<AnnouncementBarProps>(defaultAnnouncementProps);

  useEffect(() => {
    fetchAnnouncement();
  }, []);

  const fetchAnnouncement = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/site-settings/announcement');
      if (response.ok) {
        const data = await response.json();
        setShowAnnouncementBar(data.showAnnouncementBar || false);
        if (data.announcementBar) {
          setAnnouncementProps({
            ...defaultAnnouncementProps,
            ...data.announcementBar,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching announcement:', error);
      toast.error('Failed to load announcement settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/admin/site-settings/announcement', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          announcementBar: announcementProps,
          showAnnouncementBar,
        }),
      });

      if (response.ok) {
        toast.success('Announcement saved successfully');
      } else {
        toast.error('Failed to save announcement');
      }
    } catch (error) {
      console.error('Error saving announcement:', error);
      toast.error('Failed to save announcement');
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
    <div className="min-h-screen bg-muted/30">
      {/* Top Bar */}
      <div className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 border-b bg-background">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/site-settings">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="font-semibold">Announcement Bar Editor</h1>
            <p className="text-xs text-muted-foreground">
              Configure your site-wide announcement banner
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? (
              <EyeOff className="h-4 w-4 mr-2" />
            ) : (
              <Eye className="h-4 w-4 mr-2" />
            )}
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Announcement
          </Button>
        </div>
      </div>

      {/* Preview */}
      {showPreview && showAnnouncementBar && (
        <AnnouncementBar {...announcementProps} />
      )}

      {/* Editor */}
      <div className="container mx-auto py-6 px-4 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Announcement Settings</CardTitle>
            <CardDescription>
              Display a promotional banner at the top of your site
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Enable Toggle */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label className="text-base">Enable Announcement Bar</Label>
                <p className="text-sm text-muted-foreground">
                  Show the announcement bar on all pages
                </p>
              </div>
              <Switch
                checked={showAnnouncementBar}
                onCheckedChange={setShowAnnouncementBar}
              />
            </div>

            {showAnnouncementBar && (
              <>
                {/* Message */}
                <div className="space-y-2">
                  <Label>Message</Label>
                  <Input
                    value={announcementProps.message}
                    onChange={(e) =>
                      setAnnouncementProps({
                        ...announcementProps,
                        message: e.target.value,
                      })
                    }
                    placeholder="Free shipping on orders over $50!"
                  />
                  <p className="text-xs text-muted-foreground">
                    Keep it short and impactful
                  </p>
                </div>

                {/* Link */}
                <div className="space-y-4">
                  <Label>Link (Optional)</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Link Text</Label>
                      <Input
                        value={announcementProps.link?.label || ''}
                        onChange={(e) =>
                          setAnnouncementProps({
                            ...announcementProps,
                            link: {
                              ...announcementProps.link,
                              label: e.target.value,
                              href: announcementProps.link?.href || '',
                            },
                          })
                        }
                        placeholder="Shop Now"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Link URL</Label>
                      <Input
                        value={announcementProps.link?.href || ''}
                        onChange={(e) =>
                          setAnnouncementProps({
                            ...announcementProps,
                            link: {
                              ...announcementProps.link,
                              href: e.target.value,
                              label: announcementProps.link?.label || '',
                            },
                          })
                        }
                        placeholder="/products"
                      />
                    </div>
                  </div>
                </div>

                {/* Dismissible */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Dismissible</Label>
                    <p className="text-xs text-muted-foreground">
                      Allow visitors to close the announcement
                    </p>
                  </div>
                  <Switch
                    checked={announcementProps.dismissible}
                    onCheckedChange={(checked) =>
                      setAnnouncementProps({
                        ...announcementProps,
                        dismissible: checked,
                      })
                    }
                  />
                </div>

                {/* Colors */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Background Color</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={announcementProps.backgroundColor || '#2563eb'}
                        onChange={(e) =>
                          setAnnouncementProps({
                            ...announcementProps,
                            backgroundColor: e.target.value,
                          })
                        }
                        className="w-12 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        value={announcementProps.backgroundColor || '#2563eb'}
                        onChange={(e) =>
                          setAnnouncementProps({
                            ...announcementProps,
                            backgroundColor: e.target.value,
                          })
                        }
                        placeholder="#2563eb"
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Text Color</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={announcementProps.textColor || '#ffffff'}
                        onChange={(e) =>
                          setAnnouncementProps({
                            ...announcementProps,
                            textColor: e.target.value,
                          })
                        }
                        className="w-12 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        value={announcementProps.textColor || '#ffffff'}
                        onChange={(e) =>
                          setAnnouncementProps({
                            ...announcementProps,
                            textColor: e.target.value,
                          })
                        }
                        placeholder="#ffffff"
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>

                {/* Color Presets */}
                <div className="space-y-2">
                  <Label>Quick Color Presets</Label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { bg: '#2563eb', text: '#ffffff', name: 'Blue' },
                      { bg: '#16a34a', text: '#ffffff', name: 'Green' },
                      { bg: '#dc2626', text: '#ffffff', name: 'Red' },
                      { bg: '#7c3aed', text: '#ffffff', name: 'Purple' },
                      { bg: '#f59e0b', text: '#000000', name: 'Amber' },
                      { bg: '#18181b', text: '#ffffff', name: 'Dark' },
                    ].map((preset) => (
                      <Button
                        key={preset.name}
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() =>
                          setAnnouncementProps({
                            ...announcementProps,
                            backgroundColor: preset.bg,
                            textColor: preset.text,
                          })
                        }
                      >
                        <div
                          className="w-4 h-4 rounded-full border"
                          style={{ backgroundColor: preset.bg }}
                        />
                        {preset.name}
                      </Button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
