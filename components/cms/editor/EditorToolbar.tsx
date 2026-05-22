'use client';

import { Editor } from '@tiptap/react';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Link as LinkIcon,
  Unlink,
  Image,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Highlighter,
  Youtube,
  Minus,
  CodeSquare,
  RemoveFormatting,
} from 'lucide-react';
import { cn } from '@/lib/cms/utils';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../ui/popover';

// TipTap extensions add commands dynamically — TypeScript can't infer them from the base ChainedCommands type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const chain = (editor: Editor) => editor.chain().focus() as any;

interface EditorToolbarProps {
  editor: Editor;
  onLinkClick: () => void;
  onImageClick: () => void;
  onYoutubeClick: () => void;
}

interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  tooltip: string;
}

function ToolbarButton({
  onClick,
  isActive = false,
  disabled = false,
  children,
  tooltip,
}: ToolbarButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'h-7 w-7',
            isActive
              ? 'bg-[var(--ink)] text-[var(--paper)]'
              : 'hover:bg-[var(--paper-2)] text-[var(--ink)]'
          )}
          onClick={onClick}
          disabled={disabled}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p>{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  );
}

const HIGHLIGHT_COLORS = [
  { name: 'Yellow', value: '#fef08a' },
  { name: 'Green',  value: '#bbf7d0' },
  { name: 'Blue',   value: '#bfdbfe' },
  { name: 'Pink',   value: '#fbcfe8' },
  { name: 'Purple', value: '#e9d5ff' },
  { name: 'Orange', value: '#fed7aa' },
] as const;

const TEXT_COLORS = [
  { name: 'Default', value: 'inherit' },
  { name: 'Gray',    value: '#6b7280' },
  { name: 'Red',     value: '#dc2626' },
  { name: 'Orange',  value: '#ea580c' },
  { name: 'Green',   value: '#16a34a' },
  { name: 'Blue',    value: '#2563eb' },
  { name: 'Purple',  value: '#9333ea' },
] as const;

export default function EditorToolbar({
  editor,
  onLinkClick,
  onImageClick,
  onYoutubeClick,
}: EditorToolbarProps) {
  if (!editor) return null;

  const currentHeading = () => {
    if (editor.isActive('heading', { level: 1 })) return '1';
    if (editor.isActive('heading', { level: 2 })) return '2';
    if (editor.isActive('heading', { level: 3 })) return '3';
    if (editor.isActive('heading', { level: 4 })) return '4';
    return 'p';
  };

  const setHeading = (value: string) => {
    if (value === 'p') {
      chain(editor).setParagraph().run();
    } else {
      const level = parseInt(value, 10) as 1 | 2 | 3 | 4;
      chain(editor).toggleHeading({ level }).run();
    }
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div
        className="ed-toolbar-atlas"
        style={{
          display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2,
          padding: '6px 8px',
          borderBottom: '1px solid var(--rule)',
          background: 'var(--paper-2)',
        }}
      >
        {/* Undo/Redo */}
        <ToolbarButton
          onClick={() => chain(editor).undo().run()}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          disabled={!(editor.can() as any).undo()}
          tooltip="Undo (Ctrl+Z)"
        >
          <Undo className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => chain(editor).redo().run()}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          disabled={!(editor.can() as any).redo()}
          tooltip="Redo (Ctrl+Y)"
        >
          <Redo className="h-3.5 w-3.5" />
        </ToolbarButton>

        <Separator orientation="vertical" className="h-5 mx-0.5" />

        {/* Style select */}
        <Select value={currentHeading()} onValueChange={setHeading}>
          <SelectTrigger
            className="h-7 w-[110px] text-xs border-[var(--rule)] bg-transparent"
            style={{ fontFamily: 'var(--font-geist-mono)', letterSpacing: '0.05em' }}
          >
            <SelectValue placeholder="Style" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="p">Paragraph</SelectItem>
            <SelectItem value="1">Heading 1</SelectItem>
            <SelectItem value="2">Heading 2</SelectItem>
            <SelectItem value="3">Heading 3</SelectItem>
            <SelectItem value="4">Heading 4</SelectItem>
          </SelectContent>
        </Select>

        <Separator orientation="vertical" className="h-5 mx-0.5" />

        {/* Text formatting */}
        <ToolbarButton
          onClick={() => chain(editor).toggleBold().run()}
          isActive={editor.isActive('bold')}
          tooltip="Bold (Ctrl+B)"
        >
          <Bold className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => chain(editor).toggleItalic().run()}
          isActive={editor.isActive('italic')}
          tooltip="Italic (Ctrl+I)"
        >
          <Italic className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => chain(editor).toggleUnderline().run()}
          isActive={editor.isActive('underline')}
          tooltip="Underline (Ctrl+U)"
        >
          <UnderlineIcon className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => chain(editor).toggleStrike().run()}
          isActive={editor.isActive('strike')}
          tooltip="Strikethrough"
        >
          <Strikethrough className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => chain(editor).toggleCode().run()}
          isActive={editor.isActive('code')}
          tooltip="Inline Code"
        >
          <Code className="h-3.5 w-3.5" />
        </ToolbarButton>

        {/* Highlight */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'h-7 w-7',
                editor.isActive('highlight')
                  ? 'bg-[var(--ink)] text-[var(--paper)]'
                  : 'hover:bg-[var(--paper-2)] text-[var(--ink)]'
              )}
            >
              <Highlighter className="h-3.5 w-3.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2">
            <div className="grid grid-cols-3 gap-1">
              {HIGHLIGHT_COLORS.map(color => (
                <button
                  key={color.value}
                  className="w-6 h-6 rounded border hover:scale-110 transition-transform"
                  style={{ backgroundColor: color.value }}
                  onClick={() => chain(editor).toggleHighlight({ color: color.value }).run()}
                  title={color.name}
                />
              ))}
              <button
                className="w-6 h-6 rounded border bg-background hover:bg-muted flex items-center justify-center"
                onClick={() => chain(editor).unsetHighlight().run()}
                title="Remove highlight"
              >
                <RemoveFormatting className="h-3 w-3" />
              </button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Text colour */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-[var(--paper-2)] text-[var(--ink)]">
              <span className="text-sm font-bold underline decoration-2 decoration-current">A</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2">
            <div className="grid grid-cols-4 gap-1">
              {TEXT_COLORS.map(color => (
                <button
                  key={color.value}
                  className="w-6 h-6 rounded border hover:scale-110 transition-transform flex items-center justify-center"
                  style={{ color: color.value }}
                  onClick={() => {
                    if (color.value === 'inherit') {
                      chain(editor).unsetColor().run();
                    } else {
                      chain(editor).setColor(color.value).run();
                    }
                  }}
                  title={color.name}
                >
                  <span className="font-bold text-sm">A</span>
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <Separator orientation="vertical" className="h-5 mx-0.5" />

        {/* Alignment */}
        <ToolbarButton
          onClick={() => chain(editor).setTextAlign('left').run()}
          isActive={editor.isActive({ textAlign: 'left' })}
          tooltip="Align Left"
        >
          <AlignLeft className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => chain(editor).setTextAlign('center').run()}
          isActive={editor.isActive({ textAlign: 'center' })}
          tooltip="Align Center"
        >
          <AlignCenter className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => chain(editor).setTextAlign('right').run()}
          isActive={editor.isActive({ textAlign: 'right' })}
          tooltip="Align Right"
        >
          <AlignRight className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => chain(editor).setTextAlign('justify').run()}
          isActive={editor.isActive({ textAlign: 'justify' })}
          tooltip="Justify"
        >
          <AlignJustify className="h-3.5 w-3.5" />
        </ToolbarButton>

        <Separator orientation="vertical" className="h-5 mx-0.5" />

        {/* Lists */}
        <ToolbarButton
          onClick={() => chain(editor).toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          tooltip="Bullet List"
        >
          <List className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => chain(editor).toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          tooltip="Numbered List"
        >
          <ListOrdered className="h-3.5 w-3.5" />
        </ToolbarButton>

        <Separator orientation="vertical" className="h-5 mx-0.5" />

        {/* Blocks */}
        <ToolbarButton
          onClick={() => chain(editor).toggleBlockquote().run()}
          isActive={editor.isActive('blockquote')}
          tooltip="Pull-quote"
        >
          <Quote className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => chain(editor).toggleCodeBlock().run()}
          isActive={editor.isActive('codeBlock')}
          tooltip="Code Block"
        >
          <CodeSquare className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => chain(editor).setHorizontalRule().run()}
          tooltip="Divider"
        >
          <Minus className="h-3.5 w-3.5" />
        </ToolbarButton>

        <Separator orientation="vertical" className="h-5 mx-0.5" />

        {/* Links & Media */}
        <ToolbarButton
          onClick={onLinkClick}
          isActive={editor.isActive('link')}
          tooltip="Insert Link (⌘K)"
        >
          <LinkIcon className="h-3.5 w-3.5" />
        </ToolbarButton>
        {editor.isActive('link') && (
          <ToolbarButton
            onClick={() => chain(editor).unsetLink().run()}
            tooltip="Remove Link"
          >
            <Unlink className="h-3.5 w-3.5" />
          </ToolbarButton>
        )}
        <ToolbarButton onClick={onImageClick} tooltip="Insert Image">
          <Image className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={onYoutubeClick} tooltip="Embed YouTube">
          <Youtube className="h-3.5 w-3.5" />
        </ToolbarButton>

        <Separator orientation="vertical" className="h-5 mx-0.5" />

        {/* Clear formatting */}
        <ToolbarButton
          onClick={() => chain(editor).clearNodes().unsetAllMarks().run()}
          tooltip="Clear Formatting"
        >
          <RemoveFormatting className="h-3.5 w-3.5" />
        </ToolbarButton>
      </div>
    </TooltipProvider>
  );
}
