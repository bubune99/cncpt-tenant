'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { toast } from 'sonner';
import type { Category, Tag, JournalPostData, PostStatus, PostVisibility } from '@/components/cms/editor/journal/types';

// Dynamically import the heavy JournalEditor (TipTap inside) to avoid SSR
const JournalEditor = dynamic(
  () => import('@/components/cms/editor/journal/JournalEditor').then(m => ({ default: m.JournalEditor })),
  {
    ssr: false,
    loading: () => (
      <div style={{ padding: 32, fontFamily: 'var(--font-geist-mono)', fontSize: 12, color: 'var(--ink-faint)' }}>
        Loading editor…
      </div>
    ),
  }
);

interface ApiPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content?: object;
  contentHtml?: string;
  status: PostStatus;
  visibility: PostVisibility;
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

export default function EditBlogPostPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [categories, setCategories] = useState<ReadonlyArray<Category>>([]);
  const [tags, setTags] = useState<ReadonlyArray<Tag>>([]);
  const [initialData, setInitialData] = useState<Partial<JournalPostData> | null>(null);

  useEffect(() => {
    const abort = new AbortController();

    async function loadAll() {
      try {
        setIsLoading(true);
        const [postRes, catRes, tagRes] = await Promise.all([
          fetch(`/api/cms/blog/posts/${id}`, { signal: abort.signal }),
          fetch('/api/cms/blog/categories', { signal: abort.signal }),
          fetch('/api/cms/blog/tags', { signal: abort.signal }),
        ]);

        if (!postRes.ok) {
          toast.error('Post not found');
          router.push('/admin/blog');
          return;
        }

        const post = await postRes.json() as ApiPost;
        setInitialData({
          title:           post.title,
          slug:            post.slug,
          excerpt:         post.excerpt ?? '',
          contentHtml:     post.contentHtml ?? '',
          content:         post.content ?? null,
          status:          post.status,
          visibility:      post.visibility,
          featured:        post.featured,
          allowComments:   post.allowComments,
          metaTitle:       post.metaTitle ?? '',
          metaDescription: post.metaDescription ?? '',
          categoryIds:     post.categories.map(c => c.category.id),
          tagIds:          post.tags.map(t => t.tag.id),
        });

        if (catRes.ok) {
          const data = await catRes.json() as { categories?: Category[] };
          setCategories(data.categories ?? []);
        }
        if (tagRes.ok) {
          const data = await tagRes.json() as { tags?: Tag[] };
          setTags(data.tags ?? []);
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== 'AbortError') {
          toast.error('Failed to load post');
        }
      } finally {
        setIsLoading(false);
      }
    }

    void loadAll();
    return () => abort.abort();
  }, [id, router]);

  const handleSave = async (data: JournalPostData, publish: boolean) => {
    setIsSaving(true);
    try {
      const body = JSON.stringify({ ...data, status: publish ? 'PUBLISHED' : data.status });
      const res = await fetch(`/api/cms/blog/posts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body,
      });

      if (res.ok) {
        toast.success(publish ? 'Post published!' : 'Draft saved');
      } else {
        const err = await res.json() as { error?: string };
        toast.error(err.error ?? 'Failed to save post');
      }
    } catch {
      toast.error('Failed to save post');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/cms/blog/posts/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Post deleted');
        router.push('/admin/blog');
      } else {
        const err = await res.json() as { error?: string };
        toast.error(err.error ?? 'Failed to delete post');
      }
    } catch {
      toast.error('Failed to delete post');
    }
  };

  if (isLoading || initialData === null) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--font-geist-mono)', fontSize: 12, color: 'var(--ink-faint)',
      }}>
        Loading post…
      </div>
    );
  }

  return (
    <JournalEditor
      postId={id}
      initialData={initialData}
      categories={categories}
      tags={tags}
      onSave={handleSave}
      onDelete={handleDelete}
      isSaving={isSaving}
    />
  );
}
