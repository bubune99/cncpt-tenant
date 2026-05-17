'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { toast } from 'sonner';
import type { Category, Tag, JournalPostData } from '@/components/cms/editor/journal/types';

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

export default function NewBlogPostPage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [categories, setCategories] = useState<ReadonlyArray<Category>>([]);
  const [tags, setTags] = useState<ReadonlyArray<Tag>>([]);

  useEffect(() => {
    const abort = new AbortController();

    async function loadMeta() {
      try {
        const [catRes, tagRes] = await Promise.all([
          fetch('/api/cms/blog/categories', { signal: abort.signal }),
          fetch('/api/cms/blog/tags', { signal: abort.signal }),
        ]);
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
          toast.error('Failed to load categories / tags');
        }
      }
    }

    void loadMeta();
    return () => abort.abort();
  }, []);

  const handleSave = async (data: JournalPostData, publish: boolean) => {
    setIsSaving(true);
    try {
      const body = JSON.stringify({ ...data, status: publish ? 'PUBLISHED' : data.status });
      const res = await fetch('/api/cms/blog/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      });

      if (res.ok) {
        const post = await res.json() as { id: string };
        toast.success(publish ? 'Post published!' : 'Draft saved');
        router.push(`/admin/blog/${post.id}`);
      } else {
        const err = await res.json() as { error?: string };
        toast.error(err.error ?? 'Failed to create post');
      }
    } catch {
      toast.error('Failed to create post');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <JournalEditor
      categories={categories}
      tags={tags}
      onSave={handleSave}
      isSaving={isSaving}
    />
  );
}
