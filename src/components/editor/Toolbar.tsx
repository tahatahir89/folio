'use client';

import type { Editor } from '@tiptap/react';
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Highlighter,
  ImageIcon,
  IndentDecrease,
  IndentIncrease,
  Italic,
  Link as LinkIcon,
  List,
  ListChecks,
  ListOrdered,
  Minus,
  Quote,
  SeparatorHorizontal,
  Strikethrough,
  Underline,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { HIGHLIGHT_COLORS, TEXT_COLORS } from '@/lib/editor/constants';
import { ColorPicker } from './ColorPicker';
import { ImageMenu, MoreMenu, TableMenu } from './InsertControls';
import { FontFamilyMenu, FontSizeControl, FontWeightMenu, ParagraphStyleMenu, SpacingMenu } from './TextMenus';
import { ToolbarButton, ToolbarDivider, ToolbarGroup } from './toolbar-parts';

interface Props {
  editor: Editor;
  disabled?: boolean;
  onLink: () => void;
  onImage: () => void;
  onShortcuts: () => void;
}

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);
const mod = isMac ? '⌘' : 'Ctrl+';
const shift = isMac ? '⇧' : 'Shift+';

function TextColorIcon() {
  return <span className="text-[15px] font-bold leading-none">A</span>;
}

export function Toolbar({ editor, disabled, onLink, onImage, onShortcuts }: Props) {
  const align = (a: 'left' | 'center' | 'right' | 'justify') => editor.chain().focus().setTextAlign(a).run();
  const textColor = (editor.getAttributes('textStyle').color as string | undefined) ?? null;
  const highlight = (editor.getAttributes('highlight').color as string | undefined) ?? null;
  const noExplicitAlign = !['center', 'right', 'justify'].some((a) => editor.isActive({ textAlign: a }));

  return (
    <div
      role="toolbar"
      aria-label="Formatting"
      aria-disabled={disabled}
      className={cn(
        'flex items-center gap-1 overflow-x-auto px-2 py-1.5 scrollbar-none sm:px-4 lg:flex-wrap lg:overflow-visible',
        disabled && 'pointer-events-none opacity-50',
      )}
    >
      <ToolbarGroup label="Text style">
        <ParagraphStyleMenu editor={editor} />
        <FontFamilyMenu editor={editor} />
        <FontSizeControl editor={editor} />
        <FontWeightMenu editor={editor} />
      </ToolbarGroup>
      <ToolbarDivider />
      <ToolbarGroup label="Character formatting">
        <ToolbarButton label="Bold" shortcut={`${mod}B`} active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}><Bold /></ToolbarButton>
        <ToolbarButton label="Italic" shortcut={`${mod}I`} active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic /></ToolbarButton>
        <ToolbarButton label="Underline" shortcut={`${mod}U`} active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}><Underline /></ToolbarButton>
        <ToolbarButton label="Strikethrough" shortcut={`${mod}${shift}S`} active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}><Strikethrough /></ToolbarButton>
        <ColorPicker
          editor={editor}
          label="Text colour"
          icon={<TextColorIcon />}
          value={textColor}
          fallback="#1f2328"
          palette={TEXT_COLORS}
          onPick={(c) => editor.chain().focus().setColor(c).run()}
          onReset={() => editor.chain().focus().unsetColor().run()}
          resetLabel="Reset to default colour"
        />
        <ColorPicker
          editor={editor}
          label="Highlight colour"
          icon={<Highlighter className="size-4" />}
          value={highlight}
          fallback="#fef08a"
          palette={HIGHLIGHT_COLORS}
          onPick={(c) => editor.chain().focus().setHighlight({ color: c }).run()}
          onReset={() => editor.chain().focus().unsetHighlight().run()}
          resetLabel="Remove highlight"
        />
      </ToolbarGroup>
      <ToolbarDivider />
      <ToolbarGroup label="Alignment">
        <ToolbarButton label="Align left" shortcut={`${mod}${shift}L`} active={noExplicitAlign} onClick={() => align('left')}><AlignLeft /></ToolbarButton>
        <ToolbarButton label="Align centre" shortcut={`${mod}${shift}E`} active={editor.isActive({ textAlign: 'center' })} onClick={() => align('center')}><AlignCenter /></ToolbarButton>
        <ToolbarButton label="Align right" shortcut={`${mod}${shift}R`} active={editor.isActive({ textAlign: 'right' })} onClick={() => align('right')}><AlignRight /></ToolbarButton>
        <ToolbarButton label="Justify" shortcut={`${mod}${shift}J`} active={editor.isActive({ textAlign: 'justify' })} onClick={() => align('justify')}><AlignJustify /></ToolbarButton>
      </ToolbarGroup>
      <ToolbarDivider />
      <ToolbarGroup label="Lists and spacing">
        <ToolbarButton label="Bulleted list" shortcut={`${mod}${shift}8`} active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}><List /></ToolbarButton>
        <ToolbarButton label="Numbered list" shortcut={`${mod}${shift}7`} active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered /></ToolbarButton>
        <ToolbarButton label="Checklist" shortcut={`${mod}${shift}9`} active={editor.isActive('taskList')} onClick={() => editor.chain().focus().toggleTaskList().run()}><ListChecks /></ToolbarButton>
        <ToolbarButton label="Decrease indent" shortcut={`${mod}[`} onClick={() => editor.chain().focus().decreaseIndent().run()}><IndentDecrease /></ToolbarButton>
        <ToolbarButton label="Increase indent" shortcut={`${mod}]`} onClick={() => editor.chain().focus().increaseIndent().run()}><IndentIncrease /></ToolbarButton>
        <SpacingMenu editor={editor} />
      </ToolbarGroup>
      <ToolbarDivider />
      <ToolbarGroup label="Insert">
        <ToolbarButton label="Link" shortcut={`${mod}K`} active={editor.isActive('link')} onClick={onLink}><LinkIcon /></ToolbarButton>
        <ToolbarButton label="Image" onClick={onImage}><ImageIcon /></ToolbarButton>
        <TableMenu editor={editor} />
        <ToolbarButton label="Block quote" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote /></ToolbarButton>
        <ToolbarButton label="Horizontal divider" onClick={() => editor.chain().focus().setHorizontalRule().run()}><Minus /></ToolbarButton>
        <ToolbarButton label="Page break" shortcut={`${mod}↵`} onClick={() => editor.chain().focus().setPageBreak().run()}><SeparatorHorizontal /></ToolbarButton>
        {editor.isActive('image') && <ImageMenu editor={editor} />}
        <MoreMenu editor={editor} onShortcuts={onShortcuts} />
      </ToolbarGroup>
    </div>
  );
}
