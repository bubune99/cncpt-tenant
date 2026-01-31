"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Tag,
  ArrowLeft,
  Loader2,
  Search,
} from "lucide-react";
import { Button } from '@/components/cms/ui/button';
import { Input } from '@/components/cms/ui/input';
import { Label } from '@/components/cms/ui/label';
import { Textarea } from '@/components/cms/ui/textarea';
import { Card, CardContent } from '@/components/cms/ui/card';
import { Badge } from '@/components/cms/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/cms/ui/dialog';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/cms/ui/dropdown-menu';
import { toast } from "sonner";
import Link from "next/link";

interface BlogTag {
  id: string;
  name: string;
  slug: string;
  description?: string;
  _count?: { posts: number };
}

export default function BlogTagsPage() {
  const [tags, setTags] = useState<BlogTag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTag, setDeleteTag] = useState<BlogTag | null>(null);
  const [editTag, setEditTag] = useState<BlogTag | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/blog/tags");
      if (response.ok) {
        const data = await response.json();
        setTags(data.tags || []);
      }
    } catch (error) {
      console.error("Error fetching tags:", error);
      toast.error("Failed to load tags");
    } finally {
      setIsLoading(false);
    }
  };

  const openDialog = (tag?: BlogTag) => {
    if (tag) {
      setEditTag(tag);
      setName(tag.name);
      setSlug(tag.slug);
      setDescription(tag.description || "");
    } else {
      setEditTag(null);
      setName("");
      setSlug("");
      setDescription("");
    }
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }

    setIsSubmitting(true);

    try {
      const tagData = {
        name: name.trim(),
        slug: slug.trim() || undefined,
        description: description.trim() || undefined,
      };

      const url = editTag ? `/api/blog/tags/${editTag.id}` : "/api/blog/tags";
      const method = editTag ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tagData),
      });

      if (response.ok) {
        toast.success(
          editTag ? "Tag updated successfully" : "Tag created successfully"
        );
        setDialogOpen(false);
        fetchTags();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to save tag");
      }
    } catch (error) {
      toast.error("Failed to save tag");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTag) return;

    try {
      const response = await fetch(`/api/blog/tags/${deleteTag.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Tag deleted");
        fetchTags();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to delete tag");
      }
    } catch (error) {
      toast.error("Failed to delete tag");
    } finally {
      setDeleteTag(null);
    }
  };

  const filteredTags = tags.filter(
    (tag) =>
      tag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tag.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/blog">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tags</h1>
            <p className="text-muted-foreground mt-2">
              Manage tags for your blog posts
            </p>
          </div>
        </div>
        <Button onClick={() => openDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          New Tag
        </Button>
      </div>

      <div className="mb-6">
        <div className="relative max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tags..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredTags.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTags.map((tag) => (
            <Card key={tag.id} className="group">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Tag className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">{tag.name}</h3>
                      <p className="text-sm text-muted-foreground font-mono">
                        {tag.slug}
                      </p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openDialog(tag)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => setDeleteTag(tag)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {tag.description && (
                  <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                    {tag.description}
                  </p>
                )}
                <div className="mt-3">
                  <Badge variant="secondary">
                    {tag._count?.posts || 0} posts
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Tag className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No tags found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery
                ? "Try a different search term"
                : "Create your first tag to get started"}
            </p>
            {!searchQuery && (
              <Button onClick={() => openDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Create Tag
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editTag ? "Edit Tag" : "New Tag"}</DialogTitle>
            <DialogDescription>
              {editTag
                ? "Update the tag details"
                : "Create a new tag for your blog posts"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="Tag name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!editTag) {
                    setSlug(
                      e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, "-")
                        .replace(/(^-|-$)+/g, "")
                    );
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                placeholder="tag-slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Optional description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {editTag ? "Save Changes" : "Create Tag"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTag} onOpenChange={() => setDeleteTag(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tag</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteTag?.name}&quot;?
              {(deleteTag?._count?.posts || 0) > 0 && (
                <span className="block mt-2 text-destructive">
                  This tag is used on {deleteTag?._count?.posts} posts.
                </span>
              )}
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
