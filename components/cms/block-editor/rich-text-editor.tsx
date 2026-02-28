"use client"

import { useEditor, EditorContent, type Editor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Link from "@tiptap/extension-link"
import Underline from "@tiptap/extension-underline"
import TextAlign from "@tiptap/extension-text-align"
import Placeholder from "@tiptap/extension-placeholder"
import { useEffect, useCallback, useState } from "react"
import { Button } from "@/components/cms/ui/button"
import { Input } from "@/components/cms/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/cms/ui/popover"
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Link as LinkIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Quote,
  Code,
  Undo,
  Redo,
  X,
  Check,
} from "lucide-react"
import { cn } from "@/lib/cms/utils"

interface RichTextEditorProps {
  content: string
  onChange: (html: string) => void
  onBlur?: () => void
  placeholder?: string
  className?: string
  minHeight?: string
}

// Toolbar button component
function ToolbarButton({
  active,
  onClick,
  disabled,
  children,
  title,
}: {
  active?: boolean
  onClick: () => void
  disabled?: boolean
  children: React.ReactNode
  title?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "p-1.5 rounded-md transition-colors",
        active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent",
        disabled && "opacity-40 cursor-not-allowed"
      )}
    >
      {children}
    </button>
  )
}

// Link input popover
function LinkInput({ editor }: { editor: Editor }) {
  const [url, setUrl] = useState("")
  const [open, setOpen] = useState(false)

  const handleSubmit = useCallback(() => {
    if (url) {
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run()
    } else {
      editor.chain().focus().extendMarkRange("link").unsetLink().run()
    }
    setOpen(false)
    setUrl("")
  }, [editor, url])

  const handleOpen = useCallback(() => {
    const previousUrl = editor.getAttributes("link").href
    setUrl(previousUrl || "")
  }, [editor])

  return (
    <Popover open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen)
      if (isOpen) handleOpen()
    }}>
      <PopoverTrigger asChild>
        <button
          type="button"
          title="Add link"
          className={cn(
            "p-1.5 rounded-md transition-colors",
            editor.isActive("link") 
              ? "bg-primary text-primary-foreground" 
              : "text-muted-foreground hover:text-foreground hover:bg-accent"
          )}
        >
          <LinkIcon size={14} />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-2" align="start">
        <div className="flex gap-2">
          <Input
            type="url"
            placeholder="https://example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                handleSubmit()
              }
            }}
            className="h-8 text-xs"
          />
          <Button size="sm" className="h-8 w-8 p-0" onClick={handleSubmit}>
            <Check size={14} />
          </Button>
          {editor.isActive("link") && (
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-8 w-8 p-0 text-destructive hover:text-destructive" 
              onClick={() => {
                editor.chain().focus().unsetLink().run()
                setOpen(false)
              }}
            >
              <X size={14} />
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

// Toolbar component
function Toolbar({ editor }: { editor: Editor | null }) {
  if (!editor) return null

  return (
    <div className="flex flex-wrap items-center gap-0.5 p-1 border-b border-border bg-muted/30">
      {/* Text formatting */}
      <ToolbarButton
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
        title="Bold (Ctrl+B)"
      >
        <Bold size={14} />
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        title="Italic (Ctrl+I)"
      >
        <Italic size={14} />
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("underline")}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        title="Underline (Ctrl+U)"
      >
        <UnderlineIcon size={14} />
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("strike")}
        onClick={() => editor.chain().focus().toggleStrike().run()}
        title="Strikethrough"
      >
        <Strikethrough size={14} />
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("code")}
        onClick={() => editor.chain().focus().toggleCode().run()}
        title="Code"
      >
        <Code size={14} />
      </ToolbarButton>

      <div className="w-px h-4 mx-1 bg-border" />

      {/* Link */}
      <LinkInput editor={editor} />

      <div className="w-px h-4 mx-1 bg-border" />

      {/* Text alignment */}
      <ToolbarButton
        active={editor.isActive({ textAlign: "left" })}
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
        title="Align left"
      >
        <AlignLeft size={14} />
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive({ textAlign: "center" })}
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
        title="Align center"
      >
        <AlignCenter size={14} />
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive({ textAlign: "right" })}
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
        title="Align right"
      >
        <AlignRight size={14} />
      </ToolbarButton>

      <div className="w-px h-4 mx-1 bg-border" />

      {/* Lists */}
      <ToolbarButton
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        title="Bullet list"
      >
        <List size={14} />
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        title="Numbered list"
      >
        <ListOrdered size={14} />
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("blockquote")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        title="Blockquote"
      >
        <Quote size={14} />
      </ToolbarButton>

      <div className="flex-1" />

      {/* Undo/Redo */}
      <ToolbarButton
        onClick={() => (editor.chain().focus() as unknown as { undo: () => { run: () => void } }).undo().run()}
        disabled={!(editor.can() as unknown as { undo: () => boolean }).undo()}
        title="Undo (Ctrl+Z)"
      >
        <Undo size={14} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => (editor.chain().focus() as unknown as { redo: () => { run: () => void } }).redo().run()}
        disabled={!(editor.can() as unknown as { redo: () => boolean }).redo()}
        title="Redo (Ctrl+Y)"
      >
        <Redo size={14} />
      </ToolbarButton>
    </div>
  )
}

export function RichTextEditor({
  content,
  onChange,
  onBlur,
  placeholder = "Start typing...",
  className,
  minHeight = "120px",
}: RichTextEditorProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- TipTap v2/v3 type conflict
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline",
        },
      }),
      Underline,
      TextAlign.configure({
        types: ["paragraph"],
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm dark:prose-invert max-w-none px-3 py-2 focus:outline-none",
          "prose-p:my-1 prose-p:leading-relaxed",
          "prose-a:text-primary prose-a:underline",
          "prose-ul:my-1 prose-ol:my-1",
          "prose-li:my-0",
          "prose-blockquote:my-2 prose-blockquote:border-l-primary prose-blockquote:pl-3 prose-blockquote:italic"
        ),
        style: `min-height: ${minHeight}`,
      },
    },
    onUpdate: ({ editor: ed }: { editor: Editor }) => {
      const html = ed.getHTML()
      onChange(html === "<p></p>" ? "" : html)
    },
    onBlur: () => {
      onBlur?.()
    },
  } as any)

  // Sync content changes from outside
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content || "")
    }
  }, [content, editor])

  return (
    <div className={cn(
      "rounded-md border border-border bg-input overflow-hidden",
      "focus-within:ring-1 focus-within:ring-ring",
      className
    )}>
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  )
}

// Simplified inline editor for canvas double-click editing
export function InlineRichTextEditor({
  content,
  onChange,
  onBlur,
  className,
}: {
  content: string
  onChange: (html: string) => void
  onBlur?: () => void
  className?: string
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- TipTap v2/v3 type conflict
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline",
        },
      }),
      Underline,
    ],
    content,
    editorProps: {
      attributes: {
        class: cn(
          "focus:outline-none prose prose-sm dark:prose-invert max-w-none",
          className
        ),
      },
    },
    onUpdate: ({ editor: ed }: { editor: Editor }) => {
      const html = ed.getHTML()
      onChange(html === "<p></p>" ? "" : html)
    },
    onBlur: () => {
      onBlur?.()
    },
  } as any)

  // Focus on mount
  useEffect(() => {
    if (editor) {
      editor.commands.focus("end")
    }
  }, [editor])

  // Sync content changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content || "")
    }
  }, [content, editor])

  if (!editor) return null

  return (
    <div className="relative">
      {/* Mini floating toolbar */}
      <div className="absolute -top-8 left-0 z-30 flex items-center gap-0.5 p-1 rounded-md shadow-lg bg-card border border-border">
        <ToolbarButton
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold size={12} />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic size={12} />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon size={12} />
        </ToolbarButton>
        <LinkInput editor={editor} />
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}
