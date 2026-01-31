'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '../../../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Input } from '../../../components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../../components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../../components/ui/alert-dialog';
import {
  Plus,
  Search,
  MoreVertical,
  Eye,
  Pencil,
  Trash2,
  Copy,
  ExternalLink,
  FileText,
  Home,
  Layers,
  Globe,
  Loader2,
  RefreshCw,
  PanelTop,
  PanelBottom,
  Bell,
  Layout,
} from 'lucide-react';
import { toast } from 'sonner';

interface Page {
  id: string;
  title: string;
  slug: string;
  status: 'published' | 'draft' | 'archived';
  hasContent: boolean;
  parentId: string | null;
  parent: { id: string; title: string; slug: string } | null;
  childCount: number;
  updatedAt: string;
  createdAt: string;
}

export default function PagesPage() {
  const [pages, setPages] = useState<Page[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pageToDelete, setPageToDelete] = useState<Page | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchPages = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.set('search', searchTerm);

      const response = await fetch(`/api/admin/pages?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch pages');
      }
      const data = await response.json();
      setPages(data.pages || []);
    } catch (error) {
      console.error('Error fetching pages:', error);
      toast.error('Failed to load pages');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPages();
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPages();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleDelete = async () => {
    if (!pageToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/pages/${pageToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete page');
      }

      toast.success('Page deleted successfully');
      fetchPages();
    } catch (error) {
      console.error('Error deleting page:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete page');
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setPageToDelete(null);
    }
  };

  const handleDuplicate = async (page: Page) => {
    try {
      const response = await fetch(`/api/admin/pages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `${page.title} (Copy)`,
          slug: `${page.slug}-copy`,
          status: 'draft',
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to duplicate page');
      }

      toast.success('Page duplicated successfully');
      fetchPages();
    } catch (error) {
      console.error('Error duplicating page:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to duplicate page');
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

  const getPageIcon = (slug: string) => {
    if (slug === '/') return <Home className="h-4 w-4 text-muted-foreground" />;
    return <FileText className="h-4 w-4 text-muted-foreground" />;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const stats = {
    total: pages.length,
    published: pages.filter((p) => p.status === 'published').length,
    draft: pages.filter((p) => p.status === 'draft').length,
    withContent: pages.filter((p) => p.hasContent).length,
  };

  return (
    <div className="p-6 lg:p-8" data-help-key="admin.pages.page">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pages</h1>
          <p className="text-muted-foreground mt-2">
            Manage your website pages and content
          </p>
        </div>
        <div className="flex gap-2" data-help-key="admin.pages.actions">
          <Button variant="outline" onClick={fetchPages} disabled={isLoading} data-help-key="admin.pages.refresh">
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button asChild data-help-key="admin.pages.new">
            <Link href="/admin/pages/new">
              <Plus className="mr-2 h-4 w-4" />
              New Page
            </Link>
          </Button>
        </div>
      </div>

      {/* Site Layout Section */}
      <Card className="mb-8 border-primary/20 bg-gradient-to-r from-primary/5 to-transparent" data-help-key="admin.pages.layout">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Layout className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Site Layout</CardTitle>
                <CardDescription>
                  Configure your global Header, Footer, and Announcement Bar
                </CardDescription>
              </div>
            </div>
            <Button asChild>
              <Link href="/admin/pages/layout">
                <Pencil className="mr-2 h-4 w-4" />
                Edit Layout
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            <Link
              href="/admin/pages/layout/header"
              className="flex items-center gap-3 p-3 rounded-lg border hover:border-primary/50 hover:bg-accent transition-colors"
            >
              <PanelTop className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="font-medium">Header</div>
                <div className="text-xs text-muted-foreground">Navigation & branding</div>
              </div>
            </Link>
            <Link
              href="/admin/pages/layout/footer"
              className="flex items-center gap-3 p-3 rounded-lg border hover:border-primary/50 hover:bg-accent transition-colors"
            >
              <PanelBottom className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="font-medium">Footer</div>
                <div className="text-xs text-muted-foreground">Links & social media</div>
              </div>
            </Link>
            <Link
              href="/admin/pages/layout/announcement"
              className="flex items-center gap-3 p-3 rounded-lg border hover:border-primary/50 hover:bg-accent transition-colors"
            >
              <Bell className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="font-medium">Announcement Bar</div>
                <div className="text-xs text-muted-foreground">Promotions & alerts</div>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-8" data-help-key="admin.pages.stats">
        <Card data-help-key="admin.pages.stat.total">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pages</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.published}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Drafts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.draft}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With Content</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.withContent}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4 mb-6" data-help-key="admin.pages.filters">
        <div className="relative flex-1 max-w-sm" data-help-key="admin.pages.search">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search pages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Pages Table */}
      <Card data-help-key="admin.pages.table">
        <CardHeader>
          <CardTitle>All Pages</CardTitle>
          <CardDescription>
            A list of all pages on your website. Click to edit or manage.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : pages.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No pages yet</h3>
              <p className="text-muted-foreground mb-4">
                Get started by creating your first page.
              </p>
              <Button asChild>
                <Link href="/admin/pages/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Page
                </Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Page</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Content</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pages.map((page) => (
                  <TableRow key={page.id}>
                    <TableCell>
                      <Link
                        href={`/admin/pages/${page.id}`}
                        className="flex items-center gap-3 hover:text-primary transition-colors"
                      >
                        {getPageIcon(page.slug)}
                        <span className="font-medium">{page.title}</span>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <code className="text-sm bg-muted px-2 py-1 rounded">
                        {page.slug}
                      </code>
                    </TableCell>
                    <TableCell>
                      {page.hasContent ? (
                        <Badge variant="outline" className="text-green-600">Has Content</Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">Empty</Badge>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(page.status)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(page.updatedAt)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/p${page.slug === '/' ? '' : page.slug}`} target="_blank">
                              <Eye className="mr-2 h-4 w-4" />
                              Preview
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/pages/${page.id}`}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit Settings
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/pages/${page.id}/puck`}>
                              <Layers className="mr-2 h-4 w-4" />
                              Visual Editor
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicate(page)}>
                            <Copy className="mr-2 h-4 w-4" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/p${page.slug === '/' ? '' : page.slug}`} target="_blank">
                              <ExternalLink className="mr-2 h-4 w-4" />
                              View Live
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              setPageToDelete(page);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Page Templates Info */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
          <CardDescription>
            Create your first page using the visual Puck editor
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="border rounded-lg p-4">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center mb-3">
                <Plus className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="font-semibold">1. Create a Page</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Click &quot;New Page&quot; to create a page with title and URL
              </p>
            </div>
            <div className="border rounded-lg p-4">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center mb-3">
                <Layers className="h-5 w-5 text-green-600" />
              </div>
              <h3 className="font-semibold">2. Design with Puck</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Use the visual editor to add components and design your page
              </p>
            </div>
            <div className="border rounded-lg p-4">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center mb-3">
                <Globe className="h-5 w-5 text-purple-600" />
              </div>
              <h3 className="font-semibold">3. Publish</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Set status to &quot;Published&quot; to make it live at /p/your-slug
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Page</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{pageToDelete?.title}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
