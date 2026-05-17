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
import { cn } from '@/lib/cms/utils';
import EditorToolbar from './EditorToolbar';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

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
  placeholder = 'Start writing…',
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
        heading: { levels: [1, 2, 3, 4] },
        codeBlock: {
          HTMLAttributes: {
            class: 'bg-muted rounded-md p-4 font-mono text-sm overflow-x-auto',
          },
        },
        blockquote: {
          HTMLAttributes: {
            class: 'j-pullquote',
          },
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'j-link',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'j-img',
        },
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Highlight.configure({ multicolor: true }),
      TextStyle,
      Color,
      Youtube.configure({
        HTMLAttributes: { class: 'w-full aspect-video rounded-lg' },
        width: 640,
        height: 360,
      }),
      CharacterCount.configure({
        limit: wordLimit ? wordLimit * 6 : undefined,
      }),
    ] as Parameters<typeof useEditor>[0]['extensions'],
    content,
    editable,
    autofocus: autofocus ? 'end' : false,
    editorProps: {
      attributes: {
        class: cn(
          'j-article',
          'focus:outline-none',
          'px-8 py-6'
        ),
      },
    },
    onUpdate: ({ editor: ed }) => {
      const html = ed.getHTML();
      const json = ed.getJSON();
      onChange?.(html);
      onJsonChange?.(json);
    },
  });

  // Sync content prop → editor
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  // Link dialog
  const openLinkDialog = useCallback(() => {
    if (!editor) return;
    setLinkUrl(editor.getAttributes('link').href ?? '');
    setLinkDialogOpen(true);
  }, [editor]);

  const setLink = useCallback(() => {
    if (!editor) return;
    if (linkUrl === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run();
    }
    setLinkDialogOpen(false);
    setLinkUrl('');
  }, [editor, linkUrl]);

  // Image dialog
  const openImageDialog = useCallback(() => {
    setImageUrl('');
    setImageAlt('');
    setImageDialogOpen(true);
  }, []);

  const insertImage = useCallback(() => {
    if (!editor || !imageUrl) return;
    editor.chain().focus().setImage({ src: imageUrl, alt: imageAlt }).run();
    setImageDialogOpen(false);
    setImageUrl('');
    setImageAlt('');
  }, [editor, imageUrl, imageAlt]);

  // YouTube dialog
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
      <div style={{
        border: '1px solid var(--rule)', borderRadius: 4, padding: 16,
        background: 'var(--paper-2)',
      }}>
        <div style={{ height: 8, background: 'var(--rule)', borderRadius: 2, marginBottom: 12, width: '40%' }} />
        <div style={{ height: 240, background: 'var(--rule-soft)', borderRadius: 2 }} />
      </div>
    );
  }

  const storage = editor.storage as { characterCount?: { words: () => number; characters: () => number } };
  const wordCount = storage.characterCount?.words() ?? 0;
  const charCount = storage.characterCount?.characters() ?? 0;

  return (
    <div className={cn(className)} style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Atlas-styled toolbar */}
      <EditorToolbar
        editor={editor}
        onLinkClick={openLinkDialog}
        onImageClick={openImageDialog}
        onYoutubeClick={openYoutubeDialog}
      />

      {/* Writing canvas */}
      <div
        className="j-canvas"
        style={{ overflowY: 'auto', minHeight, maxHeight: maxHeight === 'none' ? undefined : maxHeight }}
      >
        <EditorContent editor={editor} />
      </div>

      {showWordCount && (
        <div style={{
          display: 'flex', justifyContent: 'space-between', padding: '6px 12px',
          borderTop: '1px solid var(--rule-soft)',
          fontFamily: 'var(--font-geist-mono)', fontSize: 11, color: 'var(--ink-soft)',
        }}>
          <span>{wordCount} words / {charCount} characters</span>
          {wordLimit !== undefined && (
            <span style={{ color: wordCount > wordLimit ? 'var(--hot)' : 'inherit' }}>
              {wordLimit - wordCount} words remaining
            </span>
          )}
        </div>
      )}

      {/* Link Dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Insert Link</DialogTitle>
            <DialogDescription>Enter the URL for the link</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="link-url">URL</Label>
              <Input
                id="link-url"
                type="url"
                value={linkUrl}
                onChange={e => setLinkUrl(e.target.value)}
                placeholder="https://example.com"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>Cancel</Button>
            <Button onClick={setLink}>{linkUrl ? 'Set Link' : 'Remove Link'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Dialog */}
      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Insert Image</DialogTitle>
            <DialogDescription>Enter the URL of the image</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="image-url">Image URL</Label>
              <Input
                id="image-url"
                type="url"
                value={imageUrl}
                onChange={e => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="image-alt">Alt Text</Label>
              <Input
                id="image-alt"
                value={imageAlt}
                onChange={e => setImageAlt(e.target.value)}
                placeholder="Describe the image"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImageDialogOpen(false)}>Cancel</Button>
            <Button onClick={insertImage} disabled={!imageUrl}>Insert Image</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* YouTube Dialog */}
      <Dialog open={youtubeDialogOpen} onOpenChange={setYoutubeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Embed YouTube Video</DialogTitle>
            <DialogDescription>Paste a YouTube video URL</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="youtube-url">YouTube URL</Label>
              <Input
                id="youtube-url"
                type="url"
                value={youtubeUrl}
                onChange={e => setYoutubeUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setYoutubeDialogOpen(false)}>Cancel</Button>
            <Button onClick={insertYoutube} disabled={!youtubeUrl}>Embed Video</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Export the Editor type for external use
export type { Editor };
