'use client';

import { useEffect, useRef, useState } from 'react';
import type { Editor } from '@tiptap/react';
import { toast } from 'sonner';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Code,
  ExternalLink,
  ImageIcon,
  MoreHorizontal,
  RemoveFormatting,
  Table as TableIcon,
  Unlink,
  Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, dialogDescClass, dialogTitleClass } from '@/components/ui/dialog';
import { DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Input, Label } from '@/components/ui/input';
import { ACCEPTED_IMAGE_TYPES, imageFileToDataUrl, normalizeUrl } from '@/lib/client/image';
import { ToolbarMenu } from './toolbar-parts';

// ---------- Link ----------

export function LinkDialog({ editor, open, onOpenChange }: { editor: Editor; open: boolean; onOpenChange: (o: boolean) => void }) {
  const [url, setUrl] = useState('');
  const [label, setLabel] = useState('');
  const [error, setError] = useState<string | null>(null);
  const hadLink = useRef(false);
  const needsText = useRef(false);

  useEffect(() => {
    if (!open) return;
    const href = (editor.getAttributes('link').href as string | undefined) ?? '';
    hadLink.current = !!href;
    needsText.current = editor.state.selection.empty && !href;
    setUrl(href);
    setLabel('');
    setError(null);
  }, [open, editor]);

  const close = () => {
    onOpenChange(false);
    setTimeout(() => editor.chain().focus().run(), 0);
  };

  const apply = (e: React.FormEvent) => {
    e.preventDefault();
    const href = normalizeUrl(url);
    if (!href) {
      setError('Enter a valid web address, email or phone link.');
      return;
    }
    const chain = editor.chain().focus();
    if (needsText.current) {
      chain.insertContent({ type: 'text', text: label.trim() || href, marks: [{ type: 'link', attrs: { href } }] }).run();
    } else if (editor.isActive('link') && editor.state.selection.empty) {
      chain.extendMarkRange('link').setLink({ href }).run();
    } else {
      chain.setLink({ href }).run();
    }
    close();
  };

  const remove = () => {
    editor.chain().focus().extendMarkRange('link').unsetLink().run();
    close();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" onCloseAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className={dialogTitleClass}>{hadLink.current ? 'Edit link' : 'Insert link'}</DialogTitle>
          <DialogDescription className={dialogDescClass}>Link the selected text, or add a new link at the cursor.</DialogDescription>
        </DialogHeader>
        <form onSubmit={apply} className="grid gap-4">
          {needsText.current && (
            <div className="grid gap-1.5">
              <Label htmlFor="link-text">Text to display</Label>
              <Input id="link-text" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Read the guide" />
            </div>
          )}
          <div className="grid gap-1.5">
            <Label htmlFor="link-url">Link address</Label>
            <Input id="link-url" autoFocus value={url} onChange={(e) => { setUrl(e.target.value); setError(null); }} placeholder="https://example.com" aria-invalid={!!error} aria-describedby={error ? 'link-error' : undefined} />
            {error && <p id="link-error" className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter className="sm:justify-between">
            <div className="flex gap-2">
              {hadLink.current && (
                <>
                  <Button type="button" variant="ghost" onClick={remove}><Unlink /> Remove</Button>
                  <Button type="button" variant="ghost" asChild>
                    <a href={normalizeUrl(url) ?? '#'} target="_blank" rel="noopener noreferrer"><ExternalLink /> Open</a>
                  </Button>
                </>
              )}
            </div>
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button type="button" variant="outline" onClick={close}>Cancel</Button>
              <Button type="submit">{hadLink.current ? 'Update link' : 'Insert link'}</Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------- Image ----------

export async function insertImageFile(editor: Editor, file: File) {
  const id = toast.loading('Adding image…');
  try {
    const src = await imageFileToDataUrl(file);
    editor.chain().focus().setImage({ src, alt: file.name.replace(/\.[^.]+$/, '') }).run();
    toast.success('Image added', { id });
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Could not add that image.', { id });
  }
}

export function ImageDialog({ editor, open, onOpenChange }: { editor: Editor; open: boolean; onOpenChange: (o: boolean) => void }) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setUrl('');
      setError(null);
    }
  }, [open]);

  const close = () => {
    onOpenChange(false);
    setTimeout(() => editor.chain().focus().run(), 0);
  };

  const fromUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^https?:\/\/\S+$/i.test(url.trim())) {
      setError('Enter a full image address starting with http:// or https://');
      return;
    }
    editor.chain().focus().setImage({ src: url.trim() }).run();
    close();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" onCloseAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className={dialogTitleClass}>Insert image</DialogTitle>
          <DialogDescription className={dialogDescClass}>Images are resized and saved inside your document so they always export.</DialogDescription>
        </DialogHeader>
        <input
          ref={fileRef}
          type="file"
          accept={ACCEPTED_IMAGE_TYPES.join(',')}
          className="sr-only"
          tabIndex={-1}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (!file) return;
            close();
            await insertImageFile(editor, file);
          }}
        />
        <Button variant="outline" className="h-24 flex-col gap-2 border-dashed" onClick={() => fileRef.current?.click()}>
          <Upload className="!size-5" />
          Upload from your device
        </Button>
        <form onSubmit={fromUrl} className="grid gap-1.5">
          <Label htmlFor="image-url">Or paste an image address</Label>
          <div className="flex gap-2">
            <Input id="image-url" value={url} onChange={(e) => { setUrl(e.target.value); setError(null); }} placeholder="https://…/photo.jpg" aria-invalid={!!error} />
            <Button type="submit" variant="soft">Insert</Button>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Appears while an image is selected: size and alignment. */
export function ImageMenu({ editor }: { editor: Editor }) {
  const set = (attrs: { width?: number | null; align?: string | null }) => editor.chain().focus().updateAttributes('image', attrs).run();
  return (
    <ToolbarMenu editor={editor} label="Image size and alignment" trigger={<><ImageIcon /> <span>Image</span></>}>
      <DropdownMenuLabel>Size</DropdownMenuLabel>
      {[25, 50, 75, 100].map((w) => (
        <DropdownMenuItem key={w} onSelect={() => set({ width: w })}>{w === 100 ? 'Full width' : `${w}% of page width`}</DropdownMenuItem>
      ))}
      <DropdownMenuItem onSelect={() => set({ width: null })}>Original size</DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuLabel>Alignment</DropdownMenuLabel>
      <DropdownMenuItem onSelect={() => set({ align: 'left' })}><AlignLeft /> Left</DropdownMenuItem>
      <DropdownMenuItem onSelect={() => set({ align: 'center' })}><AlignCenter /> Centre</DropdownMenuItem>
      <DropdownMenuItem onSelect={() => set({ align: 'right' })}><AlignRight /> Right</DropdownMenuItem>
    </ToolbarMenu>
  );
}

// ---------- Table ----------

export function TableMenu({ editor }: { editor: Editor }) {
  const inTable = editor.isActive('table');
  const can = editor.can();
  const run = (fn: (c: ReturnType<Editor['chain']>) => { run: () => boolean }) => fn(editor.chain().focus());
  return (
    <ToolbarMenu editor={editor} label="Table" chevron trigger={<TableIcon />} contentClassName="min-w-[12.5rem]">
      <DropdownMenuLabel>Insert</DropdownMenuLabel>
      {[
        [2, 2],
        [3, 3],
        [4, 4],
        [5, 3],
      ].map(([r, c]) => (
        <DropdownMenuItem key={`${r}x${c}`} disabled={inTable} onSelect={() => run((ch) => ch.insertTable({ rows: r, cols: c, withHeaderRow: true }))}>
          {r} × {c} table
        </DropdownMenuItem>
      ))}
      <DropdownMenuSeparator />
      <DropdownMenuLabel>Rows and columns</DropdownMenuLabel>
      <DropdownMenuItem disabled={!inTable || !can.addRowBefore()} onSelect={() => run((c) => c.addRowBefore())}>Add row above</DropdownMenuItem>
      <DropdownMenuItem disabled={!inTable || !can.addRowAfter()} onSelect={() => run((c) => c.addRowAfter())}>Add row below</DropdownMenuItem>
      <DropdownMenuItem disabled={!inTable || !can.deleteRow()} onSelect={() => run((c) => c.deleteRow())}>Delete row</DropdownMenuItem>
      <DropdownMenuItem disabled={!inTable || !can.addColumnBefore()} onSelect={() => run((c) => c.addColumnBefore())}>Add column left</DropdownMenuItem>
      <DropdownMenuItem disabled={!inTable || !can.addColumnAfter()} onSelect={() => run((c) => c.addColumnAfter())}>Add column right</DropdownMenuItem>
      <DropdownMenuItem disabled={!inTable || !can.deleteColumn()} onSelect={() => run((c) => c.deleteColumn())}>Delete column</DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem disabled={!inTable} onSelect={() => run((c) => c.toggleHeaderRow())}>Toggle header row</DropdownMenuItem>
      <DropdownMenuItem disabled={!inTable || !can.mergeCells()} onSelect={() => run((c) => c.mergeCells())}>Merge selected cells</DropdownMenuItem>
      <DropdownMenuItem disabled={!inTable || !can.splitCell()} onSelect={() => run((c) => c.splitCell())}>Split cell</DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem destructive disabled={!inTable || !can.deleteTable()} onSelect={() => run((c) => c.deleteTable())}>Delete table</DropdownMenuItem>
    </ToolbarMenu>
  );
}

// ---------- More ----------

export function MoreMenu({ editor, onShortcuts }: { editor: Editor; onShortcuts: () => void }) {
  return (
    <ToolbarMenu editor={editor} label="More formatting" chevron={false} className="size-8 justify-center px-0" trigger={<MoreHorizontal />}>
      <DropdownMenuItem onSelect={() => editor.chain().focus().toggleCode().run()}><Code /> Inline code</DropdownMenuItem>
      <DropdownMenuItem
        onSelect={() =>
          editor
            .chain()
            .focus()
            .unsetAllMarks()
            .clearNodes()
            .unsetTextAlign()
            .updateAttributes('paragraph', { lineHeight: null, spaceAfter: null, indent: 0, docStyle: null })
            .run()
        }
      >
        <RemoveFormatting /> Clear formatting
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem onSelect={onShortcuts}>Keyboard shortcuts</DropdownMenuItem>
    </ToolbarMenu>
  );
}
