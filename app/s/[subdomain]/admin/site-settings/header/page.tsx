'use client';

/**
 * Header Editor Page
 *
 * Visual editor for configuring the global site header using Puck.
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCMSConfig } from '@/contexts/CMSConfigContext';
import { ArrowLeft, Loader2, Save, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/cms/ui/button';
import { toast } from 'sonner';
import {
  Header,
  type HeaderProps,
} from '@/puck/layout/components';
import { defaultHeaderProps } from '@/components/cms/page-wrapper/defaults';
import { Input } from '@/components/cms/ui/input';
import { Label } from '@/components/cms/ui/label';
import { Switch } from '@/components/cms/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/cms/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/cms/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/cms/ui/tabs';

interface NavLink {
  label: string;
  href: string;
  openInNewTab?: boolean;
}

export default function HeaderEditorPage() {
  const { buildPath } = useCMSConfig();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [headerProps, setHeaderProps] = useState<HeaderProps>(defaultHeaderProps);

  useEffect(() => {
    fetchHeader();
  }, []);

  const fetchHeader = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/site-settings/header');
      if (response.ok) {
        const data = await response.json();
        if (data.header) {
          setHeaderProps({ ...defaultHeaderProps, ...data.header });
        }
      }
    } catch (error) {
      console.error('Error fetching header:', error);
      toast.error('Failed to load header settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/admin/site-settings/header', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ header: headerProps }),
      });

      if (response.ok) {
        toast.success('Header saved successfully');
      } else {
        toast.error('Failed to save header');
      }
    } catch (error) {
      console.error('Error saving header:', error);
      toast.error('Failed to save header');
    } finally {
      setIsSaving(false);
    }
  };

  const updateLogo = (field: string, value: string | number) => {
    setHeaderProps({
      ...headerProps,
      logo: { ...headerProps.logo!, [field]: value },
    });
  };

  const updateNavLinks = (links: NavLink[]) => {
    setHeaderProps({ ...headerProps, navLinks: links });
  };

  const addNavLink = () => {
    updateNavLinks([
      ...headerProps.navLinks,
      { label: 'New Link', href: '/' },
    ]);
  };

  const removeNavLink = (index: number) => {
    updateNavLinks(headerProps.navLinks.filter((_, i) => i !== index));
  };

  const updateNavLink = (index: number, field: string, value: string | boolean) => {
    const links = [...headerProps.navLinks];
    links[index] = { ...links[index], [field]: value };
    updateNavLinks(links);
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
            <Link href={buildPath('/admin/site-settings')}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="font-semibold">Header Editor</h1>
            <p className="text-xs text-muted-foreground">
              Customize your global site header
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
            Save Header
          </Button>
        </div>
      </div>

      {/* Preview */}
      {showPreview && (
        <div className="border-b">
          <Header {...headerProps} />
        </div>
      )}

      {/* Editor */}
      <div className="container mx-auto py-6 px-4 max-w-4xl">
        <Tabs defaultValue="logo" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="logo">Logo</TabsTrigger>
            <TabsTrigger value="navigation">Navigation</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="style">Style</TabsTrigger>
          </TabsList>

          {/* Logo Tab */}
          <TabsContent value="logo">
            <Card>
              <CardHeader>
                <CardTitle>Logo Settings</CardTitle>
                <CardDescription>
                  Configure your header logo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Logo Type</Label>
                  <Select
                    value={headerProps.logo?.type || 'text'}
                    onValueChange={(value) => updateLogo('type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="image">Image</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(headerProps.logo?.type || 'text') === 'text' ? (
                  <div className="space-y-2">
                    <Label>Logo Text</Label>
                    <Input
                      value={headerProps.logo?.text || ''}
                      onChange={(e) => updateLogo('text', e.target.value)}
                      placeholder="Your Brand"
                    />
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label>Image URL</Label>
                      <Input
                        value={headerProps.logo?.imageUrl || ''}
                        onChange={(e) => updateLogo('imageUrl', e.target.value)}
                        placeholder="https://example.com/logo.png"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Alt Text</Label>
                      <Input
                        value={headerProps.logo?.imageAlt || ''}
                        onChange={(e) => updateLogo('imageAlt', e.target.value)}
                        placeholder="Company Logo"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Width (px)</Label>
                        <Input
                          type="number"
                          value={headerProps.logo?.width || ''}
                          onChange={(e) =>
                            updateLogo('width', parseInt(e.target.value) || 0)
                          }
                          placeholder="120"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Height (px)</Label>
                        <Input
                          type="number"
                          value={headerProps.logo?.height || ''}
                          onChange={(e) =>
                            updateLogo('height', parseInt(e.target.value) || 0)
                          }
                          placeholder="40"
                        />
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Navigation Tab */}
          <TabsContent value="navigation">
            <Card>
              <CardHeader>
                <CardTitle>Navigation Links</CardTitle>
                <CardDescription>
                  Add and manage your header navigation links
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {headerProps.navLinks.map((link, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-4 border rounded-lg"
                  >
                    <div className="flex-1 grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Label</Label>
                        <Input
                          value={link.label}
                          onChange={(e) =>
                            updateNavLink(index, 'label', e.target.value)
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>URL</Label>
                        <Input
                          value={link.href}
                          onChange={(e) =>
                            updateNavLink(index, 'href', e.target.value)
                          }
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={link.openInNewTab || false}
                          onCheckedChange={(checked) =>
                            updateNavLink(index, 'openInNewTab', checked)
                          }
                        />
                        <span className="text-xs">New tab</span>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeNavLink(index)}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
                <Button variant="outline" onClick={addNavLink}>
                  Add Link
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Features Tab */}
          <TabsContent value="features">
            <Card>
              <CardHeader>
                <CardTitle>Header Features</CardTitle>
                <CardDescription>
                  Toggle header elements visibility
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Show Search</Label>
                    <p className="text-xs text-muted-foreground">
                      Display search icon in header
                    </p>
                  </div>
                  <Switch
                    checked={headerProps.showSearch}
                    onCheckedChange={(checked) =>
                      setHeaderProps({ ...headerProps, showSearch: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Show Cart</Label>
                    <p className="text-xs text-muted-foreground">
                      Display cart icon in header
                    </p>
                  </div>
                  <Switch
                    checked={headerProps.showCart}
                    onCheckedChange={(checked) =>
                      setHeaderProps({ ...headerProps, showCart: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Show Account</Label>
                    <p className="text-xs text-muted-foreground">
                      Display account icon in header
                    </p>
                  </div>
                  <Switch
                    checked={headerProps.showAccount || false}
                    onCheckedChange={(checked) =>
                      setHeaderProps({ ...headerProps, showAccount: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Sticky Header</Label>
                    <p className="text-xs text-muted-foreground">
                      Keep header visible when scrolling
                    </p>
                  </div>
                  <Switch
                    checked={headerProps.sticky}
                    onCheckedChange={(checked) =>
                      setHeaderProps({ ...headerProps, sticky: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Transparent Background</Label>
                    <p className="text-xs text-muted-foreground">
                      Make header background transparent
                    </p>
                  </div>
                  <Switch
                    checked={headerProps.transparent}
                    onCheckedChange={(checked) =>
                      setHeaderProps({ ...headerProps, transparent: checked })
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Style Tab */}
          <TabsContent value="style">
            <Card>
              <CardHeader>
                <CardTitle>Header Style</CardTitle>
                <CardDescription>
                  Customize colors and layout
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Background Color</Label>
                    <Input
                      type="text"
                      value={headerProps.backgroundColor || '#ffffff'}
                      onChange={(e) =>
                        setHeaderProps({
                          ...headerProps,
                          backgroundColor: e.target.value,
                        })
                      }
                      placeholder="#ffffff"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Text Color</Label>
                    <Input
                      type="text"
                      value={headerProps.textColor || '#18181b'}
                      onChange={(e) =>
                        setHeaderProps({
                          ...headerProps,
                          textColor: e.target.value,
                        })
                      }
                      placeholder="#18181b"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Max Width</Label>
                  <Select
                    value={headerProps.maxWidth}
                    onValueChange={(value) =>
                      setHeaderProps({ ...headerProps, maxWidth: value as HeaderProps['maxWidth'] })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sm">Small</SelectItem>
                      <SelectItem value="md">Medium</SelectItem>
                      <SelectItem value="lg">Large</SelectItem>
                      <SelectItem value="xl">Extra Large</SelectItem>
                      <SelectItem value="2xl">2XL</SelectItem>
                      <SelectItem value="full">Full Width</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
