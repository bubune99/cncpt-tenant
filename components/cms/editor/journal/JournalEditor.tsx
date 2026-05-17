'use client';

import { useState, useCallback, useEffect } from 'react';
import { JournalEditorChrome } from './JournalEditorChrome';
import { WriteTab } from './WriteTab';
import { BlocksTab } from './BlocksTab';
import { StructureTab } from './StructureTab';
import { DistributeTab } from './DistributeTab';
import type {
  JournalTab,
  JournalEditorProps,
  JournalPostData,
  PostStatus,
  PostVisibility,
} from './types';

function computeReadTime(wordCount: number): number {
  return Math.max(1, Math.round(wordCount / 238));
}

function extractWordCount(html: string): number {
  const stripped = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  if (!stripped) return 0;
  return stripped.split(' ').filter(w => w.length > 0).length;
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

function formatSavedAt(date: Date): string {
  return `autosaved · ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

export function JournalEditor({
  postId, initialData = {}, categories, tags, onSave, onDelete, isSaving = false,
}: JournalEditorProps) {
  const [activeTab, setActiveTab] = useState<JournalTab>('write');

  // Form state — immutable updates throughout
  const [title, setTitle]               = useState(initialData.title ?? '');
  const [slug, setSlug]                 = useState(initialData.slug ?? '');
  const [excerpt, setExcerpt]           = useState(initialData.excerpt ?? '');
  const [contentHtml, setContentHtml]   = useState(initialData.contentHtml ?? '');
  const [content, setContent]           = useState<object | null>(initialData.content ?? null);
  const [status, setStatus]             = useState<PostStatus>(initialData.status ?? 'DRAFT');
  const [visibility, setVisibility]     = useState<PostVisibility>(initialData.visibility ?? 'PUBLIC');
  const [categoryIds, setCategoryIds]   = useState<ReadonlyArray<string>>(initialData.categoryIds ?? []);
  const [tagIds, setTagIds]             = useState<ReadonlyArray<string>>(initialData.tagIds ?? []);
  const [metaTitle, setMetaTitle]       = useState(initialData.metaTitle ?? '');
  const [metaDescription, setMetaDescription] = useState(initialData.metaDescription ?? '');
  const [lastSaved, setLastSaved]       = useState<string | undefined>(undefined);

  // Auto-generate slug on new posts when title changes
  useEffect(() => {
    if (!postId && title && !slug) {
      setSlug(generateSlug(title));
    }
  }, [title, postId, slug]);

  const wordCount = extractWordCount(contentHtml);
  const readTime  = computeReadTime(wordCount);

  const buildPostData = useCallback((): JournalPostData => ({
    title:           title.trim(),
    slug:            slug.trim() || generateSlug(title),
    excerpt:         excerpt.trim(),
    contentHtml,
    content,
    status,
    visibility,
    categoryIds,
    tagIds,
    featured:        initialData.featured ?? false,
    allowComments:   initialData.allowComments ?? true,
    metaTitle:       metaTitle.trim(),
    metaDescription: metaDescription.trim(),
    coverImageUrl:   initialData.coverImageUrl,
    series:          initialData.series,
    seriesPosition:  initialData.seriesPosition,
  }), [
    title, slug, excerpt, contentHtml, content, status, visibility,
    categoryIds, tagIds, metaTitle, metaDescription,
    initialData.featured, initialData.allowComments,
    initialData.coverImageUrl, initialData.series, initialData.seriesPosition,
  ]);

  const handleSaveDraft = useCallback(async () => {
    await onSave(buildPostData(), false);
    setLastSaved(formatSavedAt(new Date()));
  }, [onSave, buildPostData]);

  const handlePublish = useCallback(async () => {
    await onSave(buildPostData(), true);
    setStatus('PUBLISHED');
    setLastSaved(formatSavedAt(new Date()));
  }, [onSave, buildPostData]);

  const handlePreview = useCallback(() => {
    if (slug) {
      window.open(`/posts/${slug}`, '_blank', 'noopener,noreferrer');
    }
  }, [slug]);

  const toggleCategory = useCallback((id: string) => {
    setCategoryIds(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  }, []);

  const toggleTag = useCallback((id: string) => {
    setTagIds(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  }, []);

  const breadcrumbs = [
    { label: 'Journal', href: 'admin/blog' },
    { label: title || 'New post' },
  ];

  const head = {
    title,
    slug,
    status,
    wordCount,
    readTime,
    lastSaved,
    isSaving,
    onSaveDraft: handleSaveDraft,
    onPreview:   handlePreview,
    onPublish:   handlePublish,
  };

  return (
    <JournalEditorChrome
      breadcrumbs={breadcrumbs}
      head={head}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {activeTab === 'write' && (
        <WriteTab
          contentHtml={contentHtml}
          onContentChange={setContentHtml}
          onJsonChange={setContent}
          wordCount={wordCount}
          readTime={readTime}
          headings={[]}
          kicker="Journal · Feature"
        />
      )}

      {activeTab === 'blocks' && (
        <BlocksTab
          contentHtml={contentHtml}
          onContentChange={setContentHtml}
          onJsonChange={setContent}
          blocks={[]}
          onBlocksChange={() => {}}
        />
      )}

      {activeTab === 'structure' && (
        <StructureTab
          categories={categories}
          selectedCategoryIds={categoryIds}
          onToggleCategory={toggleCategory}
          tags={tags}
          selectedTagIds={tagIds}
          onToggleTag={toggleTag}
          metaTitle={metaTitle}
          metaDescription={metaDescription}
          onMetaTitleChange={setMetaTitle}
          onMetaDescriptionChange={setMetaDescription}
          slug={slug}
          onSlugChange={setSlug}
        />
      )}

      {activeTab === 'distribute' && (
        <DistributeTab
          postTitle={title}
          postSlug={slug}
          channels={[]}
          onPublishAll={handlePublish}
        />
      )}
    </JournalEditorChrome>
  );
}
