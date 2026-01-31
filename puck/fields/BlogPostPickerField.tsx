'use client';

/**
 * Custom Puck Field: Blog Post Picker
 *
 * Allows users to select a blog post from the database to embed in their page
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '../../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { ScrollArea } from '../../components/ui/scroll-area';
import { FileText, Loader2, Check, Search } from 'lucide-react';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featuredImage?: { url: string } | null;
  publishedAt: string | null;
  status: string;
}

interface BlogPostPickerFieldProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

export function BlogPostPickerField({
  value,
  onChange,
  label = 'Blog Post',
}: BlogPostPickerFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [search, setSearch] = useState('');

  const loadPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      let url = '/api/blog?status=PUBLISHED&limit=50';
      if (search) {
        url += '&search=' + encodeURIComponent(search);
      }
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setPosts(data.posts || data || []);
      }
    } catch (error) {
      console.error('Failed to load posts:', error);
    } finally {
      setIsLoading(false);
    }
  }, [search]);

  useEffect(() => {
    if (value) {
      fetch('/api/blog/' + value)
        .then((res) => res.json())
        .then((data) => {
          if (data.post || data) {
            setSelectedPost(data.post || data);
          }
        })
        .catch(console.error);
    }
  }, [value]);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      loadPosts();
    }
  };

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(loadPosts, 300);
      return () => clearTimeout(timer);
    }
  }, [search, isOpen, loadPosts]);

  const handleSelect = (post: BlogPost) => {
    onChange(post.id);
    setSelectedPost(post);
    setIsOpen(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-2">
      {label && <Label className="text-sm font-medium">{label}</Label>}

      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full justify-start" type="button">
            <FileText className="h-4 w-4 mr-2" />
            {selectedPost ? selectedPost.title : 'Select a blog post...'}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Select Blog Post</DialogTitle>
          </DialogHeader>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search posts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No published posts found</p>
            </div>
          ) : (
            <ScrollArea className="h-[300px]">
              <div className="space-y-2 p-1">
                {posts.map((post) => (
                  <div
                    key={post.id}
                    className={`flex items-center gap-3 p-2 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors ${
                      value === post.id ? 'border-primary bg-primary/5' : ''
                    }`}
                    onClick={() => handleSelect(post)}
                  >
                    {post.featuredImage && (
                      <img
                        src={post.featuredImage.url}
                        alt={post.title}
                        className="w-16 h-12 object-cover rounded"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <span className="font-medium block truncate">{post.title}</span>
                      {post.publishedAt && (
                        <span className="text-sm text-muted-foreground">
                          {formatDate(post.publishedAt)}
                        </span>
                      )}
                    </div>
                    {value === post.id && (
                      <Check className="h-5 w-5 text-primary flex-shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {value && (
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          onClick={() => {
            onChange('');
            setSelectedPost(null);
          }}
        >
          Clear selection
        </Button>
      )}
    </div>
  );
}

/**
 * Puck custom field adapter
 */
export const blogPostPickerFieldConfig = {
  type: 'custom' as const,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  render: ({ value, onChange }: any) => (
    <BlogPostPickerField value={value || ''} onChange={(v) => onChange(v || '')} />
  ),
};

export default BlogPostPickerField;
