'use client';

import { EditorContent, useEditor } from '@tiptap/react';
import { Bold, Heading2, Highlighter, Italic, List, Underline } from 'lucide-react';
import { ToolbarButton, ToolbarDivider } from '@/components/editor/toolbar-parts';
import { getExtensions } from '@/lib/editor/extensions';
import { doc, h, p, subtitle, title, ul } from '@/lib/templates/builders';

const content = doc(
  title('Q3 product brief'),
  subtitle('Draft for the leadership review'),
  p('Folio keeps the **page** in focus. Select any text and **format** it, switch a line to a heading, or turn these notes into a list.'),
  h(2, 'What we learned'),
  ul('Customers want fewer steps between writing and sharing', 'Export quality matters more than feature count', 'Autosave builds trust'),
);

/** A real Tiptap editor, so visitors can try Folio before signing up. */
export function HeroEditor() {
  const editor = useEditor({
    extensions: getExtensions({ interactive: false }),
    content,
    immediatelyRender: false,
    editorProps: { attributes: { class: 'folio-prose', 'aria-label': 'Try the Folio editor' } },
  });

  return (
    <div className="overflow-hidden rounded-xl border bg-background shadow-paper">
      <div role="toolbar" aria-label="Demo formatting" className="flex items-center gap-0.5 border-b bg-background px-2 py-1.5">
        {editor ? (
          <>
            <ToolbarButton label="Bold" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}><Bold /></ToolbarButton>
            <ToolbarButton label="Italic" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic /></ToolbarButton>
            <ToolbarButton label="Underline" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}><Underline /></ToolbarButton>
            <ToolbarButton label="Highlight" active={editor.isActive('highlight')} onClick={() => editor.chain().focus().toggleHighlight({ color: '#FEF08A' }).run()}><Highlighter /></ToolbarButton>
            <ToolbarDivider />
            <ToolbarButton label="Heading" active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 /></ToolbarButton>
            <ToolbarButton label="Bulleted list" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}><List /></ToolbarButton>
          </>
        ) : (
          <div className="h-8" />
        )}
      </div>
      <div className="min-h-[380px] bg-white px-7 py-8 sm:px-10 sm:py-10">
        {editor ? <EditorContent editor={editor} /> : <div className="space-y-3" aria-hidden><div className="h-8 w-2/3 animate-pulse rounded bg-muted" /><div className="h-4 w-1/2 animate-pulse rounded bg-muted" /><div className="h-4 w-full animate-pulse rounded bg-muted" /><div className="h-4 w-5/6 animate-pulse rounded bg-muted" /></div>}
      </div>
    </div>
  );
}
