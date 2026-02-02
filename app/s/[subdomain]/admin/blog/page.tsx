"use client";

import { useState, useEffect } from "react";
import {
  Search,
  RefreshCw,
  Plus,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Calendar,
  FileText,
} from "lucide-react";
import { Button } from '@/components/cms/ui/button';
import { Input } from '@/components/cms/ui/input';
import { Card, CardContent } from '@/components/cms/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/cms/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/cms/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/cms/ui/dropdown-menu';
import { Badge } from '@/components/cms/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/cms/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/cms/ui/alert-dialog';
import { toast } from "sonner";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { useCMSConfig } from '@/contexts/CMSConfigContext';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED" | "SCHEDULED";
  visibility: "PUBLIC" | "PRIVATE" | "PASSWORD_PROTECTED" | "MEMBERS_ONLY";
  publishedAt?: string;
  createdAt: string;
  viewCount: number;
  commentCount: number;
  featured: boolean;
  author?: {
    id: string;
    name?: string;
    email: string;
  };
  categories: Array<{
    category: {
      id: string;
      name: string;
      slug: string;
    };
  }>;
  featuredImage?: {
    id: string;
    url: string;
    alt?: string;
  };
}

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  DRAFT: "secondary",
  PUBLISHED: "default",
  ARCHIVED: "destructive",
  SCHEDULED: "outline",
};

export default function BlogPostsPage() {
  const { buildPath } = useCMSConfig();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [deletePost, setDeletePost] = useState<BlogPost | null>(null);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchPosts();
  }, [selectedStatus]);

  const fetchPosts = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (selectedStatus !== "all") {
        params.set("status", selectedStatus);
      }
      params.set("limit", "50");

      const response = await fetch(`/api/blog/posts?${params}`);
      if (response.ok) {
        const data = await response.json();
        setPosts(data.posts || []);
        setTotal(data.total || 0);
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
      toast.error("Failed to load posts");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletePost) return;

    try {
      const response = await fetch(`/api/blog/posts/${deletePost.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Post deleted successfully");
        fetchPosts();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to delete post");
      }
    } catch (error) {
      toast.error("Failed to delete post");
    } finally {
      setDeletePost(null);
    }
  };

  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.slug.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab =
      activeTab === "all" ||
      (activeTab === "published" && post.status === "PUBLISHED") ||
      (activeTab === "drafts" && post.status === "DRAFT") ||
      (activeTab === "scheduled" && post.status === "SCHEDULED");

    return matchesSearch && matchesTab;
  });

  const formatDate = (dateString?: string) => {
    if (!dateString) return "—";
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };

  return (
    <div className="p-6 lg:p-8" data-help-key="admin.blog.page">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Blog Posts</h1>
          <p className="text-muted-foreground mt-2">
            Create and manage your blog content
          </p>
        </div>
        <div className="flex gap-2" data-help-key="admin.blog.actions">
          <Button variant="outline" asChild data-help-key="admin.blog.categories">
            <Link href={buildPath('/admin/blog/categories')}>Categories</Link>
          </Button>
          <Button variant="outline" asChild data-help-key="admin.blog.tags">
            <Link href={buildPath('/admin/blog/tags')}>Tags</Link>
          </Button>
          <Button variant="outline" onClick={fetchPosts} disabled={isLoading} data-help-key="admin.blog.refresh">
            {isLoading ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Refresh
          </Button>
          <Button asChild data-help-key="admin.blog.new">
            <Link href={buildPath('/admin/blog/new')}>
              <Plus className="mr-2 h-4 w-4" />
              New Post
            </Link>
          </Button>
        </div>
      </div>

      <Tabs
        defaultValue="all"
        className="mb-6"
        onValueChange={(value) => setActiveTab(value)}
      >
        <TabsList data-help-key="admin.blog.tabs">
          <TabsTrigger value="all">
            All Posts ({total})
          </TabsTrigger>
          <TabsTrigger value="published">Published</TabsTrigger>
          <TabsTrigger value="drafts">Drafts</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex flex-col gap-4 md:flex-row md:items-center mb-6" data-help-key="admin.blog.filters">
        <div className="relative flex-1" data-help-key="admin.blog.search">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search posts..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-[180px]" data-help-key="admin.blog.status-filter">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="PUBLISHED">Published</SelectItem>
            <SelectItem value="SCHEDULED">Scheduled</SelectItem>
            <SelectItem value="ARCHIVED">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card data-help-key="admin.blog.table">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Categories</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Views</TableHead>
                <TableHead>Published</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : filteredPosts.length > 0 ? (
                filteredPosts.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {post.featuredImage ? (
                          <img
                            src={post.featuredImage.url}
                            alt={post.featuredImage.alt || post.title}
                            className="h-10 w-10 rounded-md object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center">
                            <FileText className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {post.title}
                            {post.featured && (
                              <Badge variant="outline" className="text-xs">
                                Featured
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            /{post.slug}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {post.author?.name || post.author?.email || "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {post.categories.length > 0 ? (
                          post.categories.slice(0, 2).map(({ category }) => (
                            <Badge key={category.id} variant="secondary" className="text-xs">
                              {category.name}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                        {post.categories.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{post.categories.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusColors[post.status] || "secondary"}>
                        {post.status.charAt(0) + post.status.slice(1).toLowerCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Eye className="h-3 w-3" />
                        {post.viewCount}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {formatDate(post.publishedAt || post.createdAt)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/blog/${post.id}`}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          {post.status === "PUBLISHED" && (
                            <DropdownMenuItem asChild>
                              <a
                                href={`/posts/${post.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View Live
                              </a>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setDeletePost(post)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="h-8 w-8 text-muted-foreground" />
                      <p className="text-muted-foreground">No posts found</p>
                      <Button asChild size="sm">
                        <Link href={buildPath('/admin/blog/new')}>Create your first post</Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog open={!!deletePost} onOpenChange={() => setDeletePost(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deletePost?.title}&quot;? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
