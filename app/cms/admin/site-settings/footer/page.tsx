'use client';

/**
 * Footer Editor Page
 *
 * Visual editor for configuring the global site footer.
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, Save, Eye, EyeOff, Plus, Trash2 } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { toast } from 'sonner';
import { Footer, type FooterProps } from '../../../../puck/layout/components';
import { defaultFooterProps } from '../../../../components/page-wrapper/defaults';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { Textarea } from '../../../../components/ui/textarea';
import { Switch } from '../../../../components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../../components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../../../../components/ui/accordion';

type SocialPlatform = 'facebook' | 'twitter' | 'instagram' | 'linkedin' | 'youtube' | 'tiktok' | 'github';

interface FooterColumn {
  title: string;
  links: { label: string; href: string; openInNewTab?: boolean }[];
}

interface SocialLink {
  platform: SocialPlatform;
  url: string;
}

export default function FooterEditorPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [footerProps, setFooterProps] = useState<FooterProps>(defaultFooterProps);

  useEffect(() => {
    fetchFooter();
  }, []);

  const fetchFooter = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/site-settings/footer');
      if (response.ok) {
        const data = await response.json();
        if (data.footer) {
          setFooterProps({ ...defaultFooterProps, ...data.footer });
        }
      }
    } catch (error) {
      console.error('Error fetching footer:', error);
      toast.error('Failed to load footer settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/admin/site-settings/footer', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ footer: footerProps }),
      });

      if (response.ok) {
        toast.success('Footer saved successfully');
      } else {
        toast.error('Failed to save footer');
      }
    } catch (error) {
      console.error('Error saving footer:', error);
      toast.error('Failed to save footer');
    } finally {
      setIsSaving(false);
    }
  };

  const updateLogo = (field: string, value: string | number) => {
    const currentLogo = footerProps.logo || { type: 'text' as const };
    setFooterProps({
      ...footerProps,
      logo: { ...currentLogo, [field]: value },
    });
  };

  // Column management
  const updateColumns = (columns: FooterColumn[]) => {
    setFooterProps({ ...footerProps, columns });
  };

  const addColumn = () => {
    updateColumns([
      ...(footerProps.columns || []),
      { title: 'New Column', links: [] },
    ]);
  };

  const removeColumn = (index: number) => {
    updateColumns((footerProps.columns || []).filter((_, i) => i !== index));
  };

  const updateColumn = (index: number, field: string, value: unknown) => {
    const columns = [...(footerProps.columns || [])];
    columns[index] = { ...columns[index], [field]: value };
    updateColumns(columns);
  };

  const addColumnLink = (columnIndex: number) => {
    const columns = [...(footerProps.columns || [])];
    columns[columnIndex].links = [
      ...columns[columnIndex].links,
      { label: 'New Link', href: '/' },
    ];
    updateColumns(columns);
  };

  const removeColumnLink = (columnIndex: number, linkIndex: number) => {
    const columns = [...(footerProps.columns || [])];
    columns[columnIndex].links = columns[columnIndex].links.filter(
      (_, i) => i !== linkIndex
    );
    updateColumns(columns);
  };

  const updateColumnLink = (
    columnIndex: number,
    linkIndex: number,
    field: string,
    value: string | boolean
  ) => {
    const columns = [...(footerProps.columns || [])];
    columns[columnIndex].links[linkIndex] = {
      ...columns[columnIndex].links[linkIndex],
      [field]: value,
    };
    updateColumns(columns);
  };

  // Social links management
  const updateSocialLinks = (links: SocialLink[]) => {
    setFooterProps({ ...footerProps, socialLinks: links });
  };

  const addSocialLink = () => {
    updateSocialLinks([
      ...(footerProps.socialLinks || []),
      { platform: 'twitter', url: '' },
    ]);
  };

  const removeSocialLink = (index: number) => {
    updateSocialLinks((footerProps.socialLinks || []).filter((_, i) => i !== index));
  };

  const updateSocialLink = (index: number, field: string, value: string) => {
    const links = [...(footerProps.socialLinks || [])];
    links[index] = { ...links[index], [field]: value };
    updateSocialLinks(links as SocialLink[]);
  };

  // Bottom links management
  const updateBottomLinks = (links: { label: string; href: string; openInNewTab?: boolean }[]) => {
    setFooterProps({ ...footerProps, bottomLinks: links });
  };

  const addBottomLink = () => {
    updateBottomLinks([
      ...(footerProps.bottomLinks || []),
      { label: 'New Link', href: '/' },
    ]);
  };

  const removeBottomLink = (index: number) => {
    updateBottomLinks((footerProps.bottomLinks || []).filter((_, i) => i !== index));
  };

  const updateBottomLink = (index: number, field: string, value: string | boolean) => {
    const links = [...(footerProps.bottomLinks || [])];
    links[index] = { ...links[index], [field]: value };
    updateBottomLinks(links);
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
            <h1 className="font-semibold">Footer Editor</h1>
            <p className="text-xs text-muted-foreground">
              Customize your global site footer
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
            Save Footer
          </Button>
        </div>
      </div>

      {/* Editor */}
      <div className="container mx-auto py-6 px-4 max-w-4xl">
        <Tabs defaultValue="content" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="columns">Link Columns</TabsTrigger>
            <TabsTrigger value="social">Social &amp; Newsletter</TabsTrigger>
            <TabsTrigger value="style">Style</TabsTrigger>
          </TabsList>

          {/* Content Tab */}
          <TabsContent value="content">
            <Card>
              <CardHeader>
                <CardTitle>Footer Content</CardTitle>
                <CardDescription>
                  Configure logo and tagline
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Logo Type</Label>
                  <Select
                    value={footerProps.logo?.type || 'text'}
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

                {footerProps.logo?.type === 'text' ? (
                  <div className="space-y-2">
                    <Label>Logo Text</Label>
                    <Input
                      value={footerProps.logo?.text || ''}
                      onChange={(e) => updateLogo('text', e.target.value)}
                      placeholder="Your Brand"
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>Image URL</Label>
                    <Input
                      value={footerProps.logo?.imageUrl || ''}
                      onChange={(e) => updateLogo('imageUrl', e.target.value)}
                      placeholder="https://example.com/logo.png"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Tagline</Label>
                  <Textarea
                    value={footerProps.tagline || ''}
                    onChange={(e) =>
                      setFooterProps({ ...footerProps, tagline: e.target.value })
                    }
                    placeholder="A brief description of your company"
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Copyright Text (Optional)</Label>
                  <Input
                    value={footerProps.copyrightText || ''}
                    onChange={(e) =>
                      setFooterProps({
                        ...footerProps,
                        copyrightText: e.target.value,
                      })
                    }
                    placeholder="© 2024 Your Company. All rights reserved."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Layout Style</Label>
                  <Select
                    value={footerProps.layout || 'columns'}
                    onValueChange={(value) =>
                      setFooterProps({ ...footerProps, layout: value as FooterProps['layout'] })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="columns">Columns</SelectItem>
                      <SelectItem value="centered">Centered</SelectItem>
                      <SelectItem value="simple">Simple</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Columns Tab */}
          <TabsContent value="columns">
            <Card>
              <CardHeader>
                <CardTitle>Link Columns</CardTitle>
                <CardDescription>
                  Organize your footer links into columns
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Accordion type="multiple" className="space-y-2">
                  {(footerProps.columns || []).map((column, columnIndex) => (
                    <AccordionItem
                      key={columnIndex}
                      value={`column-${columnIndex}`}
                      className="border rounded-lg px-4"
                    >
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-2">
                          <span>{column.title || `Column ${columnIndex + 1}`}</span>
                          <span className="text-xs text-muted-foreground">
                            ({column.links.length} links)
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-4 pt-4">
                        <div className="space-y-2">
                          <Label>Column Title</Label>
                          <Input
                            value={column.title}
                            onChange={(e) =>
                              updateColumn(columnIndex, 'title', e.target.value)
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Links</Label>
                          {column.links.map((link, linkIndex) => (
                            <div
                              key={linkIndex}
                              className="flex items-center gap-2 p-2 bg-muted rounded"
                            >
                              <Input
                                value={link.label}
                                onChange={(e) =>
                                  updateColumnLink(
                                    columnIndex,
                                    linkIndex,
                                    'label',
                                    e.target.value
                                  )
                                }
                                placeholder="Label"
                                className="flex-1"
                              />
                              <Input
                                value={link.href}
                                onChange={(e) =>
                                  updateColumnLink(
                                    columnIndex,
                                    linkIndex,
                                    'href',
                                    e.target.value
                                  )
                                }
                                placeholder="URL"
                                className="flex-1"
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  removeColumnLink(columnIndex, linkIndex)
                                }
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addColumnLink(columnIndex)}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Link
                          </Button>
                        </div>

                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removeColumn(columnIndex)}
                        >
                          Remove Column
                        </Button>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
                <Button variant="outline" onClick={addColumn}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Column
                </Button>
              </CardContent>
            </Card>

            {/* Bottom Links */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Bottom Links</CardTitle>
                <CardDescription>
                  Links that appear at the very bottom (e.g., Privacy, Terms)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {(footerProps.bottomLinks || []).map((link, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={link.label}
                      onChange={(e) =>
                        updateBottomLink(index, 'label', e.target.value)
                      }
                      placeholder="Label"
                      className="flex-1"
                    />
                    <Input
                      value={link.href}
                      onChange={(e) =>
                        updateBottomLink(index, 'href', e.target.value)
                      }
                      placeholder="URL"
                      className="flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeBottomLink(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addBottomLink}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Bottom Link
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Social & Newsletter Tab */}
          <TabsContent value="social">
            <Card>
              <CardHeader>
                <CardTitle>Social Links</CardTitle>
                <CardDescription>
                  Add links to your social media profiles
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {(footerProps.socialLinks || []).map((link, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Select
                      value={link.platform}
                      onValueChange={(value) =>
                        updateSocialLink(index, 'platform', value)
                      }
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="facebook">Facebook</SelectItem>
                        <SelectItem value="twitter">Twitter/X</SelectItem>
                        <SelectItem value="instagram">Instagram</SelectItem>
                        <SelectItem value="linkedin">LinkedIn</SelectItem>
                        <SelectItem value="youtube">YouTube</SelectItem>
                        <SelectItem value="tiktok">TikTok</SelectItem>
                        <SelectItem value="github">GitHub</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      value={link.url}
                      onChange={(e) =>
                        updateSocialLink(index, 'url', e.target.value)
                      }
                      placeholder="https://..."
                      className="flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeSocialLink(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addSocialLink}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Social Link
                </Button>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Newsletter</CardTitle>
                <CardDescription>
                  Configure newsletter signup in footer
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Enable Newsletter</Label>
                    <p className="text-xs text-muted-foreground">
                      Show newsletter signup form
                    </p>
                  </div>
                  <Switch
                    checked={footerProps.newsletter?.enabled || false}
                    onCheckedChange={(checked) =>
                      setFooterProps({
                        ...footerProps,
                        newsletter: {
                          ...footerProps.newsletter,
                          enabled: checked,
                        },
                      })
                    }
                  />
                </div>

                {footerProps.newsletter?.enabled && (
                  <>
                    <div className="space-y-2">
                      <Label>Title</Label>
                      <Input
                        value={footerProps.newsletter?.title || ''}
                        onChange={(e) =>
                          setFooterProps({
                            ...footerProps,
                            newsletter: {
                              enabled: true,
                              ...footerProps.newsletter,
                              title: e.target.value,
                            },
                          })
                        }
                        placeholder="Stay Updated"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        value={footerProps.newsletter?.description || ''}
                        onChange={(e) =>
                          setFooterProps({
                            ...footerProps,
                            newsletter: {
                              enabled: true,
                              ...footerProps.newsletter,
                              description: e.target.value,
                            },
                          })
                        }
                        placeholder="Subscribe to our newsletter..."
                        rows={2}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Placeholder</Label>
                        <Input
                          value={footerProps.newsletter?.placeholder || ''}
                          onChange={(e) =>
                            setFooterProps({
                              ...footerProps,
                              newsletter: {
                                enabled: true,
                                ...footerProps.newsletter,
                                placeholder: e.target.value,
                              },
                            })
                          }
                          placeholder="Enter your email"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Button Label</Label>
                        <Input
                          value={footerProps.newsletter?.buttonLabel || ''}
                          onChange={(e) =>
                            setFooterProps({
                              ...footerProps,
                              newsletter: {
                                enabled: true,
                                ...footerProps.newsletter,
                                buttonLabel: e.target.value,
                              },
                            })
                          }
                          placeholder="Subscribe"
                        />
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Style Tab */}
          <TabsContent value="style">
            <Card>
              <CardHeader>
                <CardTitle>Footer Style</CardTitle>
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
                      value={footerProps.backgroundColor || '#18181b'}
                      onChange={(e) =>
                        setFooterProps({
                          ...footerProps,
                          backgroundColor: e.target.value,
                        })
                      }
                      placeholder="#18181b"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Text Color</Label>
                    <Input
                      type="text"
                      value={footerProps.textColor || '#ffffff'}
                      onChange={(e) =>
                        setFooterProps({
                          ...footerProps,
                          textColor: e.target.value,
                        })
                      }
                      placeholder="#ffffff"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Max Width</Label>
                  <Select
                    value={footerProps.maxWidth || 'xl'}
                    onValueChange={(value) =>
                      setFooterProps({ ...footerProps, maxWidth: value as FooterProps['maxWidth'] })
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

      {/* Preview */}
      {showPreview && (
        <div className="mt-6">
          <Footer {...footerProps} />
        </div>
      )}
    </div>
  );
}
