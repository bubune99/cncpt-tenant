'use client';

import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import Color from '@tiptap/extension-color';
import TextStyle from '@tiptap/extension-text-style';
import Youtube from '@tiptap/extension-youtube';
import CharacterCount from '@tiptap/extension-character-count';
import { useCallback, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import EditorToolbar from './EditorToolbar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface TipTapEditorProps {
  content?: string;
  onChange?: (content: string) => void;
  onJsonChange?: (json: object) => void;
  placeholder?: string;
  editable?: boolean;
  className?: string;
  minHeight?: string;
  maxHeight?: string;
  showWordCount?: boolean;
  wordLimit?: number;
  autofocus?: boolean;
}

export default function TipTapEditor({
  content = '',
  onChange,
  onJsonChange,
  placeholder = 'Start writing...',
  editable = true,
  className,
  minHeight = '300px',
  maxHeight = '600px',
  showWordCount = true,
  wordLimit,
  autofocus = false,
}: TipTapEditorProps) {
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const [youtubeDialogOpen, setYoutubeDialogOpen] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4],
        },
        codeBlock: {
          HTMLAttributes: {
            class: 'bg-muted rounded-md p-4 font-mono text-sm overflow-x-auto',
          },
        },
        blockquote: {
          HTMLAttributes: {
            class: 'border-l-4 border-primary pl-4 italic',
          },
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline hover:text-primary/80 cursor-pointer',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-lg max-w-full h-auto',
        },
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Highlight.configure({
        multicolor: true,
      }),
      TextStyle,
      Color,
      Youtube.configure({
        HTMLAttributes: {
          class: 'w-full aspect-video rounded-lg',
        },
        width: 640,
        height: 360,
      }),
      CharacterCount.configure({
        limit: wordLimit ? wordLimit * 6 : undefined, // Approximate character limit
      }),
    ] as any[],
    content,
    editable,
    autofocus: autofocus ? 'end' : false,
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm sm:prose-base dark:prose-invert max-w-none',
          'focus:outline-none',
          'px-4 py-3'
        ),
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const json = editor.getJSON();
      onChange?.(html);
      onJsonChange?.(json);
    },
  });

  // Update content when prop changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  // Link dialog handlers
  const openLinkDialog = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href || '';
    setLinkUrl(previousUrl);
    setLinkDialogOpen(true);
  }, [editor]);

  const setLink = useCallback(() => {
    if (!editor) return;

    if (linkUrl === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      editor
        .chain()
        .focus()
        .extendMarkRange('link')
        .setLink({ href: linkUrl })
        .run();
    }
    setLinkDialogOpen(false);
    setLinkUrl('');
  }, [editor, linkUrl]);

  // Image dialog handlers
  const openImageDialog = useCallback(() => {
    setImageUrl('');
    setImageAlt('');
    setImageDialogOpen(true);
  }, []);

  const insertImage = useCallback(() => {
    if (!editor || !imageUrl) return;

    editor
      .chain()
      .focus()
      .setImage({ src: imageUrl, alt: imageAlt })
      .run();
    setImageDialogOpen(false);
    setImageUrl('');
    setImageAlt('');
  }, [editor, imageUrl, imageAlt]);

  // YouTube dialog handlers
  const openYoutubeDialog = useCallback(() => {
    setYoutubeUrl('');
    setYoutubeDialogOpen(true);
  }, []);

  const insertYoutube = useCallback(() => {
    if (!editor || !youtubeUrl) return;

    editor.commands.setYoutubeVideo({ src: youtubeUrl });
    setYoutubeDialogOpen(false);
    setYoutubeUrl('');
  }, [editor, youtubeUrl]);

  if (!editor) {
    return (
      <div className="border rounded-lg p-4 animate-pulse">
        <div className="h-10 bg-muted rounded mb-4" />
        <div className="h-64 bg-muted rounded" />
      </div>
    );
  }

  const storage = editor.storage as any;
  const wordCount = storage.characterCount?.words() || 0;
  const charCount = storage.characterCount?.characters() || 0;

  return (
    <div className={cn('border rounded-lg overflow-hidden', className)}>
      <EditorToolbar
        editor={editor}
        onLinkClick={openLinkDialog}
        onImageClick={openImageDialog}
        onYoutubeClick={openYoutubeDialog}
      />
      <div
        className="overflow-y-auto"
        style={{ minHeight, maxHeight }}
      >
        <EditorContent editor={editor} />
      </div>
      {showWordCount && (
        <div className="flex items-center justify-between px-4 py-2 border-t bg-muted/30 text-xs text-muted-foreground">
          <div>
            {wordCount} words / {charCount} characters
          </div>
          {wordLimit && (
            <div className={cn(wordCount > wordLimit && 'text-destructive')}>
              {wordLimit - wordCount} words remaining
            </div>
          )}
        </div>
      )}

      {/* Link Dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Insert Link</DialogTitle>
            <DialogDescription>
              Enter the URL for the link
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="link-url">URL</Label>
              <Input
                id="link-url"
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={setLink}>
              {linkUrl ? 'Set Link' : 'Remove Link'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Dialog */}
      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Insert Image</DialogTitle>
            <DialogDescription>
              Enter the URL of the image
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="image-url">Image URL</Label>
              <Input
                id="image-url"
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="image-alt">Alt Text</Label>
              <Input
                id="image-alt"
                value={imageAlt}
                onChange={(e) => setImageAlt(e.target.value)}
                placeholder="Describe the image"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImageDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={insertImage} disabled={!imageUrl}>
              Insert Image
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* YouTube Dialog */}
      <Dialog open={youtubeDialogOpen} onOpenChange={setYoutubeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Embed YouTube Video</DialogTitle>
            <DialogDescription>
              Paste a YouTube video URL
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="youtube-url">YouTube URL</Label>
              <Input
                id="youtube-url"
                type="url"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setYoutubeDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={insertYoutube} disabled={!youtubeUrl}>
              Embed Video
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Export the Editor type for external use
export type { Editor };
