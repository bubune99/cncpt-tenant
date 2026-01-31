'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { Button } from '@/components/cms/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/cms/ui/card';
import { Input } from '@/components/cms/ui/input';
import { Label } from '@/components/cms/ui/label';
import { Textarea } from '@/components/cms/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/cms/ui/select';
import { Badge } from '@/components/cms/ui/badge';
import {
  ArrowLeft,
  Save,
  Loader2,
  Eye,
  Pencil,
  FileText,
  Layers,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

interface Page {
  id: string;
  title: string;
  slug: string;
  status: 'published' | 'draft' | 'archived';
  content: unknown | null;
  metaTitle: string | null;
  metaDescription: string | null;
  parentId: string | null;
  parent: { id: string; title: string; slug: string } | null;
  children: { id: string; title: string; slug: string; status: string }[];
  headerMode: string;
  footerMode: string;
  showAnnouncement: boolean;
  updatedAt: string;
  createdAt: string;
  publishedAt: string | null;
}

export default function PageEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [page, setPage] = useState<Page | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allPages, setAllPages] = useState<{ id: string; title: string; slug: string }[]>([]);

  useEffect(() => {
    fetchPage();
    fetchAllPages();
  }, [id]);

  const fetchPage = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/pages/${id}`);
      if (!response.ok) {
        if (response.status === 404) {
          setError('Page not found');
          return;
        }
        throw new Error('Failed to fetch page');
      }
      const data = await response.json();
      setPage(data);
    } catch (error) {
      console.error('Error fetching page:', error);
      setError('Failed to load page');
      toast.error('Failed to load page');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllPages = async () => {
    try {
      const response = await fetch('/api/admin/pages?limit=100');
      if (response.ok) {
        const data = await response.json();
        setAllPages(data.pages.filter((p: { id: string }) => p.id !== id));
      }
    } catch (error) {
      console.error('Error fetching pages for parent selection:', error);
    }
  };

  const handleSave = async () => {
    if (!page) return;
    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/pages/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: page.title,
          slug: page.slug,
          status: page.status,
          metaTitle: page.metaTitle,
          metaDescription: page.metaDescription,
          parentId: page.parentId,
          headerMode: page.headerMode,
          footerMode: page.footerMode,
          showAnnouncement: page.showAnnouncement,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save page');
      }

      const updatedPage = await response.json();
      setPage(updatedPage);
      toast.success('Page saved successfully');
    } catch (error) {
      console.error('Error saving page:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save page');
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusBadge = (status: Page['status']) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-500">Published</Badge>;
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      case 'archived':
        return <Badge variant="outline">Archived</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="p-6 lg:p-8">
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h2 className="text-xl font-semibold mb-2">{error || 'Page not found'}</h2>
          <p className="text-muted-foreground mb-4">
            The page you&apos;re looking for doesn&apos;t exist or couldn&apos;t be loaded.
          </p>
          <Button asChild>
            <Link href="/admin/pages">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Pages
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/pages">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{page.title}</h1>
              {getStatusBadge(page.status)}
            </div>
            <p className="text-muted-foreground mt-1">
              Last updated: {formatDate(page.updatedAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/p${page.slug === '/' ? '' : page.slug}`} target="_blank">
              <Eye className="mr-2 h-4 w-4" />
              Preview
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/admin/pages/${id}/puck`}>
              <Pencil className="mr-2 h-4 w-4" />
              Open Puck Editor
            </Link>
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Changes
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Page Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Page Settings</CardTitle>
              <CardDescription>
                Basic settings for this page
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Page Title</Label>
                <Input
                  id="title"
                  value={page.title}
                  onChange={(e) => setPage({ ...page, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">URL Slug</Label>
                <Input
                  id="slug"
                  value={page.slug}
                  onChange={(e) => setPage({ ...page, slug: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  The URL path for this page. Published pages are accessible at /p{page.slug}
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={page.status}
                    onValueChange={(value: Page['status']) =>
                      setPage({ ...page, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="parent">Parent Page</Label>
                  <Select
                    value={page.parentId || 'none'}
                    onValueChange={(value) =>
                      setPage({ ...page, parentId: value === 'none' ? null : value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="No parent (top-level)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No parent (top-level)</SelectItem>
                      {allPages.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.title} ({p.slug})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SEO Settings */}
          <Card>
            <CardHeader>
              <CardTitle>SEO Settings</CardTitle>
              <CardDescription>
                Optimize your page for search engines
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="metaTitle">Meta Title</Label>
                <Input
                  id="metaTitle"
                  value={page.metaTitle || ''}
                  onChange={(e) =>
                    setPage({ ...page, metaTitle: e.target.value || null })
                  }
                  placeholder="Enter SEO title (defaults to page title)"
                />
                <p className="text-xs text-muted-foreground">
                  Recommended: 50-60 characters
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="metaDescription">Meta Description</Label>
                <Textarea
                  id="metaDescription"
                  value={page.metaDescription || ''}
                  onChange={(e) =>
                    setPage({ ...page, metaDescription: e.target.value || null })
                  }
                  placeholder="Enter SEO description"
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Recommended: 150-160 characters
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Visual Editor CTA */}
          <Card className="border-primary/50 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5" />
                Visual Page Builder
              </CardTitle>
              <CardDescription>
                Use the Puck visual editor to design your page with drag-and-drop components
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  {page.content ? (
                    <p className="text-sm text-green-600 flex items-center gap-2">
                      <Badge variant="outline" className="text-green-600">Has Content</Badge>
                      This page has visual content
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      This page has no visual content yet. Open the editor to start designing.
                    </p>
                  )}
                </div>
                <Button asChild size="lg">
                  <Link href={`/admin/pages/${id}/puck`}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Open Puck Editor
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Page Info */}
          <Card>
            <CardHeader>
              <CardTitle>Page Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Created</span>
                <span className="text-sm">{formatDate(page.createdAt)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Updated</span>
                <span className="text-sm">{formatDate(page.updatedAt)}</span>
              </div>
              {page.publishedAt && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Published</span>
                  <span className="text-sm">{formatDate(page.publishedAt)}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                {getStatusBadge(page.status)}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Content</span>
                {page.content ? (
                  <Badge variant="outline" className="text-green-600">Has Content</Badge>
                ) : (
                  <Badge variant="outline">Empty</Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href={`/p${page.slug === '/' ? '' : page.slug}`} target="_blank">
                  <Eye className="mr-2 h-4 w-4" />
                  View Live Page
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href={`/admin/pages/${id}/puck`}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Visual Editor
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/admin/pages">
                  <FileText className="mr-2 h-4 w-4" />
                  All Pages
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Child Pages */}
          {page.children && page.children.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Child Pages</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {page.children.map((child) => (
                    <li key={child.id}>
                      <Link
                        href={`/admin/pages/${child.id}`}
                        className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                      >
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        {child.title}
                        <Badge variant="outline" className="ml-auto text-xs">
                          {child.status}
                        </Badge>
                      </Link>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Page URL Info */}
          <Card>
            <CardHeader>
              <CardTitle>Page URL</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">
                {page.status === 'published' ? 'This page is live at:' : 'When published, this page will be at:'}
              </p>
              <code className="text-sm bg-muted px-2 py-1 rounded block">
                /p{page.slug}
              </code>
              {page.status === 'published' && (
                <Button variant="link" className="p-0 h-auto mt-2" asChild>
                  <Link href={`/p${page.slug === '/' ? '' : page.slug}`} target="_blank">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Open in new tab
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
