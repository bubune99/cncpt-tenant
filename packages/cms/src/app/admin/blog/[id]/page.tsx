"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Eye,
  Settings,
  Calendar,
  Tag,
  FolderOpen,
  Globe,
  Lock,
  Loader2,
  Trash2,
  LayoutGrid,
} from "lucide-react";
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { Textarea } from '../../../../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../../components/ui/select';
import { Switch } from '../../../../components/ui/switch';
import { Badge } from '../../../../components/ui/badge';
import { Separator } from '../../../../components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../components/ui/tabs';
import { Checkbox } from '../../../../components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../../../../components/ui/alert-dialog';
import { toast } from "sonner";
import Link from "next/link";
import dynamic from "next/dynamic";

const TipTapEditor = dynamic(() => import('../../../../components/editor/TipTapEditor'), {
  ssr: false,
  loading: () => (
    <div className="border rounded-lg p-4 animate-pulse">
      <div className="h-10 bg-muted rounded mb-4" />
      <div className="h-64 bg-muted rounded" />
    </div>
  ),
});

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Tag {
  id: string;
  name: string;
  slug: string;
}

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content?: object;
  contentHtml?: string;
  puckContent?: object;
  usePuckLayout: boolean;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED" | "SCHEDULED";
  visibility: "PUBLIC" | "PRIVATE" | "PASSWORD_PROTECTED" | "MEMBERS_ONLY";
  featured: boolean;
  allowComments: boolean;
  metaTitle?: string;
  metaDescription?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  categories: Array<{ category: Category }>;
  tags: Array<{ tag: Tag }>;
}

export default function EditBlogPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [post, setPost] = useState<BlogPost | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState<object | null>(null);
  const [contentHtml, setContentHtml] = useState("");
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED" | "ARCHIVED">("DRAFT");
  const [visibility, setVisibility] = useState<"PUBLIC" | "PRIVATE">("PUBLIC");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [featured, setFeatured] = useState(false);
  const [allowComments, setAllowComments] = useState(true);
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [usePuckLayout, setUsePuckLayout] = useState(false);

  useEffect(() => {
    fetchPost();
    fetchCategories();
    fetchTags();
  }, [id]);

  const fetchPost = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/blog/posts/${id}`);
      if (response.ok) {
        const data = await response.json();
        setPost(data);
        setTitle(data.title);
        setSlug(data.slug);
        setExcerpt(data.excerpt || "");
        setContent(data.content);
        setContentHtml(data.contentHtml || "");
        setStatus(data.status);
        setVisibility(data.visibility);
        setSelectedCategories(data.categories.map((c: any) => c.category.id));
        setSelectedTags(data.tags.map((t: any) => t.tag.id));
        setFeatured(data.featured);
        setAllowComments(data.allowComments);
        setMetaTitle(data.metaTitle || "");
        setMetaDescription(data.metaDescription || "");
        setUsePuckLayout(data.usePuckLayout);
      } else {
        toast.error("Post not found");
        router.push("/blog");
      }
    } catch (error) {
      console.error("Error fetching post:", error);
      toast.error("Failed to load post");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/blog/categories");
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchTags = async () => {
    try {
      const response = await fetch("/api/blog/tags");
      if (response.ok) {
        const data = await response.json();
        setTags(data.tags || []);
      }
    } catch (error) {
      console.error("Error fetching tags:", error);
    }
  };

  const handleSubmit = async (publishNow = false) => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    setIsSubmitting(true);

    try {
      const postData = {
        title: title.trim(),
        slug: slug.trim(),
        excerpt: excerpt.trim() || undefined,
        content,
        contentHtml,
        status: publishNow ? "PUBLISHED" : status,
        visibility,
        categoryIds: selectedCategories,
        tagIds: selectedTags,
        featured,
        allowComments,
        metaTitle: metaTitle.trim() || undefined,
        metaDescription: metaDescription.trim() || undefined,
        usePuckLayout,
      };

      const response = await fetch(`/api/blog/posts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(postData),
      });

      if (response.ok) {
        toast.success(
          publishNow ? "Post published!" : "Post saved successfully"
        );
        fetchPost();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to save post");
      }
    } catch (error) {
      console.error("Error saving post:", error);
      toast.error("Failed to save post");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/blog/posts/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Post deleted");
        router.push("/blog");
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to delete post");
      }
    } catch (error) {
      toast.error("Failed to delete post");
    }
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  };

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!post) {
    return null;
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/blog">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Edit Post</h1>
            <p className="text-sm text-muted-foreground">
              Last updated{" "}
              {new Date(post.updatedAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="icon">
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Post</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this post? This action cannot
                  be undone.
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
          {post.status === "PUBLISHED" && (
            <Button variant="outline" asChild>
              <a
                href={`/posts/${post.slug}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Eye className="mr-2 h-4 w-4" />
                View
              </a>
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => handleSubmit(false)}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save
          </Button>
          {post.status !== "PUBLISHED" && (
            <Button onClick={() => handleSubmit(true)} disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Globe className="mr-2 h-4 w-4" />
              )}
              Publish
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Enter post title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-lg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">/posts/</span>
                  <Input
                    id="slug"
                    placeholder="post-url-slug"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Content</CardTitle>
                <div className="flex items-center gap-2">
                  <Label htmlFor="puck-toggle" className="text-sm font-normal">
                    Use Puck Layout
                  </Label>
                  <Switch
                    id="puck-toggle"
                    checked={usePuckLayout}
                    onCheckedChange={setUsePuckLayout}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {usePuckLayout ? (
                <div className="border rounded-lg p-8 text-center bg-muted/30">
                  <LayoutGrid className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-medium mb-2">Puck Visual Editor</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Use the visual page builder for advanced layouts
                  </p>
                  <Button asChild>
                    <Link href={`/admin/blog/${id}/puck`}>
                      Open Puck Editor
                    </Link>
                  </Button>
                </div>
              ) : (
                <TipTapEditor
                  content={contentHtml}
                  onChange={(html) => setContentHtml(html)}
                  onJsonChange={(json) => setContent(json)}
                  placeholder="Start writing your post..."
                  minHeight="400px"
                  maxHeight="600px"
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Excerpt</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Write a short summary of your post..."
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                rows={3}
              />
              <p className="text-xs text-muted-foreground mt-2">
                The excerpt is used in search results and social shares.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>SEO Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="metaTitle">Meta Title</Label>
                <Input
                  id="metaTitle"
                  placeholder="SEO title (defaults to post title)"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  {metaTitle.length || title.length}/60 characters
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="metaDescription">Meta Description</Label>
                <Textarea
                  id="metaDescription"
                  placeholder="SEO description (defaults to excerpt)"
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  rows={2}
                />
                <p className="text-xs text-muted-foreground">
                  {metaDescription.length || excerpt.length}/160 characters
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Post Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={status}
                  onValueChange={(value: any) => setStatus(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="PUBLISHED">Published</SelectItem>
                    <SelectItem value="ARCHIVED">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Visibility</Label>
                <Select
                  value={visibility}
                  onValueChange={(value: any) => setVisibility(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PUBLIC">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        Public
                      </div>
                    </SelectItem>
                    <SelectItem value="PRIVATE">
                      <div className="flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        Private
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <Label htmlFor="featured">Featured Post</Label>
                <Switch
                  id="featured"
                  checked={featured}
                  onCheckedChange={setFeatured}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="comments">Allow Comments</Label>
                <Switch
                  id="comments"
                  checked={allowComments}
                  onCheckedChange={setAllowComments}
                />
              </div>

              {post.publishedAt && (
                <>
                  <Separator />
                  <div className="text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Published {new Date(post.publishedAt).toLocaleDateString()}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4" />
                Categories
              </CardTitle>
            </CardHeader>
            <CardContent>
              {categories.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {categories.map((category) => (
                    <div
                      key={category.id}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={`cat-${category.id}`}
                        checked={selectedCategories.includes(category.id)}
                        onCheckedChange={() => toggleCategory(category.id)}
                      />
                      <label
                        htmlFor={`cat-${category.id}`}
                        className="text-sm cursor-pointer"
                      >
                        {category.name}
                      </label>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No categories yet.{" "}
                  <Link href="/blog/categories" className="text-primary">
                    Create one
                  </Link>
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Tags
              </CardTitle>
            </CardHeader>
            <CardContent>
              {tags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Badge
                      key={tag.id}
                      variant={
                        selectedTags.includes(tag.id) ? "default" : "outline"
                      }
                      className="cursor-pointer"
                      onClick={() => toggleTag(tag.id)}
                    >
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No tags yet.{" "}
                  <Link href="/blog/tags" className="text-primary">
                    Create one
                  </Link>
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
