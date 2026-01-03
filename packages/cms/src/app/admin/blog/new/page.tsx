"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Eye,
  Settings,
  Image as ImageIcon,
  Calendar,
  Tag,
  FolderOpen,
  Globe,
  Lock,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import Link from "next/link";
import dynamic from "next/dynamic";

// Dynamically import TipTap to avoid SSR issues
const TipTapEditor = dynamic(() => import("@/components/editor/TipTapEditor"), {
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
  _count?: { posts: number };
}

interface Tag {
  id: string;
  name: string;
  slug: string;
  _count?: { posts: number };
}

export default function NewBlogPostPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);

  // Form state
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState<object | null>(null);
  const [contentHtml, setContentHtml] = useState("");
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED">("DRAFT");
  const [visibility, setVisibility] = useState<"PUBLIC" | "PRIVATE">("PUBLIC");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [featured, setFeatured] = useState(false);
  const [allowComments, setAllowComments] = useState(true);
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");

  useEffect(() => {
    fetchCategories();
    fetchTags();
  }, []);

  // Auto-generate slug from title
  useEffect(() => {
    if (title && !slug) {
      setSlug(
        title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)+/g, "")
      );
    }
  }, [title]);

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
        slug: slug.trim() || undefined,
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
      };

      const response = await fetch("/api/blog/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(postData),
      });

      if (response.ok) {
        const post = await response.json();
        toast.success(
          publishNow ? "Post published successfully!" : "Post saved as draft"
        );
        router.push(`/blog/${post.id}`);
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to create post");
      }
    } catch (error) {
      console.error("Error creating post:", error);
      toast.error("Failed to create post");
    } finally {
      setIsSubmitting(false);
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
            <h1 className="text-2xl font-bold">New Post</h1>
            <p className="text-sm text-muted-foreground">
              Create a new blog post
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
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
            Save Draft
          </Button>
          <Button onClick={() => handleSubmit(true)} disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Globe className="mr-2 h-4 w-4" />
            )}
            Publish
          </Button>
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
              <CardTitle>Content</CardTitle>
            </CardHeader>
            <CardContent>
              <TipTapEditor
                content={contentHtml}
                onChange={(html) => setContentHtml(html)}
                onJsonChange={(json) => setContent(json)}
                placeholder="Start writing your post..."
                minHeight="400px"
                maxHeight="600px"
              />
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
                  onValueChange={(value: "DRAFT" | "PUBLISHED") =>
                    setStatus(value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="PUBLISHED">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Visibility</Label>
                <Select
                  value={visibility}
                  onValueChange={(value: "PUBLIC" | "PRIVATE") =>
                    setVisibility(value)
                  }
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
