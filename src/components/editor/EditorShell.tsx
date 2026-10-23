'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { EditorContent, useEditor, type Editor } from '@tiptap/react';
import { toast } from 'sonner';
import { Keyboard, Maximize2, MoreVertical, Redo2, SlidersHorizontal, Trash2, Undo2, Minimize2, RotateCcw } from 'lucide-react';
import { LogoMark } from '@/components/brand/Logo';
import { UserMenu } from '@/components/app/UserMenu';
import { Button } from '@/components/ui/button';
import { AlertDialog, ConfirmContent } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip } from '@/components/ui/popover';
import { api } from '@/lib/client/api';
import { MARGIN_PX, PAGE_PX } from '@/lib/editor/constants';
import { getExtensions } from '@/lib/editor/extensions';
import type { DocSettings, DocumentFull, PMNode, PublicUser } from '@/lib/types';
import { readingTime } from '@/lib/utils';
import { DocSettingsDialog, ShortcutsDialog } from './EditorDialogs';
import { ExportMenu, type ExportFormat } from './ExportMenu';
import { ImageDialog, LinkDialog, insertImageFile } from './InsertControls';
import { SaveStatus } from './SaveStatus';
import { Toolbar } from './Toolbar';
import { ToolbarButton } from './toolbar-parts';
import { useAutosave } from './useAutosave';

function filenameFrom(header: string | null): string | null {
  if (!header) return null;
  const star = /filename\*=UTF-8''([^;]+)/i.exec(header);
  if (star) {
    try {
      return decodeURIComponent(star[1]);
    } catch {
      /* fall through */
    }
  }
  return /filename="([^"]+)"/i.exec(header)?.[1] ?? null;
}

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export function EditorShell({ doc, user }: { doc: DocumentFull; user: PublicUser }) {
  const router = useRouter();
  const [title, setTitle] = useState(doc.title);
  const [settings, setSettings] = useState<DocSettings>(doc.settings);
  const [trashed, setTrashed] = useState(doc.trashed);
  const [focusMode, setFocusMode] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [imageOpen, setImageOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [trashConfirm, setTrashConfirm] = useState(false);
  const [exporting, setExporting] = useState<ExportFormat | null>(null);
  const [pages, setPages] = useState(1);

  const editorRef = useRef<Editor | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  const autosave = useAutosave({
    docId: doc.id,
    initialTitle: doc.title,
    initialSettings: doc.settings,
    disabled: trashed,
    getContent: () => (editorRef.current ? (editorRef.current.getJSON() as PMNode) : null),
  });

  const editor = useEditor({
    extensions: getExtensions(),
    content: doc.content,
    editable: !doc.trashed,
    immediatelyRender: false,
    editorProps: {
      attributes: { class: 'folio-prose', 'aria-label': 'Document content', 'aria-multiline': 'true', role: 'textbox', spellcheck: 'true' },
      handlePaste: (_view, event) => {
        const file = Array.from(event.clipboardData?.files ?? []).find((f) => f.type.startsWith('image/'));
        if (!file || !editorRef.current) return false;
        void insertImageFile(editorRef.current, file);
        return true;
      },
      handleDrop: (_view, event) => {
        const file = Array.from(event.dataTransfer?.files ?? []).find((f) => f.type.startsWith('image/'));
        if (!file || !editorRef.current) return false;
        event.preventDefault();
        void insertImageFile(editorRef.current, file);
        return true;
      },
    },
    onUpdate: () => autosave.markContentDirty(),
  });
  editorRef.current = editor;

  useEffect(() => {
    editor?.setEditable(!trashed);
  }, [editor, trashed]);

  useEffect(() => {
    document.title = `${title.trim() || 'Untitled document'} · Folio`;
  }, [title]);

  // Page-count estimate from the rendered height of the sheet.
  useEffect(() => {
    const el = sheetRef.current;
    if (!el) return;
    const pageH = PAGE_PX[settings.pageSize].h;
    const ro = new ResizeObserver(([entry]) => setPages(Math.max(1, Math.ceil(entry.contentRect.height / pageH - 0.02))));
    ro.observe(el);
    return () => ro.disconnect();
  }, [settings.pageSize, editor]);

  // Global shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === 's') {
        e.preventDefault();
        void autosave.flush().then((ok) => (ok ? toast.success('Saved') : toast.error("Couldn't save. We'll keep retrying.")));
      } else if (mod && e.key.toLowerCase() === 'k' && editorRef.current?.isFocused && !trashed) {
        e.preventDefault();
        setLinkOpen(true);
      } else if (e.key === 'Escape') {
        setFocusMode(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [autosave, trashed]);

  const onTitleChange = (value: string) => {
    setTitle(value);
    autosave.setTitle(value);
  };

  const onSettingsChange = (next: DocSettings) => {
    setSettings(next);
    autosave.setSettings(next);
  };

  const exportAs = useCallback(
    async (format: ExportFormat) => {
      setExporting(format);
      const id = toast.loading(`Preparing your ${format.toUpperCase()}…`);
      try {
        const saved = await autosave.flush();
        if (!saved) throw new Error("We couldn't save your latest changes, so the export was cancelled. Try again in a moment.");
        const res = await fetch(`/api/documents/${doc.id}/export?format=${format}`);
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.error ?? `Export failed (${res.status}).`);
        }
        const blob = await res.blob();
        download(blob, filenameFrom(res.headers.get('Content-Disposition')) ?? `${title.trim() || 'Untitled document'}.${format}`);
        toast.success(`${format.toUpperCase()} downloaded`, { id });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Export failed. Please try again.', { id });
      } finally {
        setExporting(null);
      }
    },
    [autosave, doc.id, title],
  );

  const restore = async () => {
    try {
      await api(`/api/documents/${doc.id}`, { method: 'PATCH', json: { trashed: false } });
      setTrashed(false);
      toast.success('Document restored');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not restore this document.');
    }
  };

  const moveToTrash = async () => {
    try {
      const ok = await autosave.flush();
      if (!ok) throw new Error("We couldn't save your latest changes first. Try again.");
      await api(`/api/documents/${doc.id}`, { method: 'PATCH', json: { trashed: true } });
      toast.success('Moved to trash');
      router.push('/dashboard/documents');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not move this document to the trash.');
    }
  };

  if (!editor) return <EditorSkeleton />;

  const counts = editor.storage.characterCount as { words: () => number; characters: () => number };
  const words = counts.words();
  const page = PAGE_PX[settings.pageSize];
  const pad = MARGIN_PX[settings.margins];

  return (
    <div className="flex h-dvh flex-col bg-background">
      {focusMode ? (
        <div className="pointer-events-none fixed right-3 top-3 z-40">
          <Button size="sm" variant="outline" className="pointer-events-auto bg-background/90 backdrop-blur" onClick={() => setFocusMode(false)}>
            <Minimize2 /> Exit focus mode
          </Button>
        </div>
      ) : (
        <>
          <header className="flex h-14 shrink-0 items-center gap-1.5 border-b bg-background px-2 sm:gap-2 sm:px-4">
            <Tooltip label="Back to your documents">
              <Link href="/dashboard/documents" aria-label="Back to your documents" className="shrink-0 rounded-lg p-1 hover:bg-muted">
                <LogoMark />
              </Link>
            </Tooltip>
            <input
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              onBlur={() => {
                if (!title.trim()) onTitleChange('Untitled document');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  editor.commands.focus('start');
                }
              }}
              readOnly={trashed}
              maxLength={200}
              aria-label="Document title"
              placeholder="Untitled document"
              className="h-9 min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-2 text-[15px] font-medium outline-none transition-colors hover:border-input focus:border-primary focus:bg-background sm:max-w-sm sm:flex-none sm:basis-80"
            />
            <div className="hidden min-w-0 sm:block"><SaveStatus state={autosave.state} error={autosave.error} onRetry={() => void autosave.retryNow()} /></div>
            <div className="ml-auto flex shrink-0 items-center gap-0.5 sm:gap-1">
              <div className="sm:hidden"><SaveStatus state={autosave.state} error={autosave.error} onRetry={() => void autosave.retryNow()} /></div>
              <ToolbarButton label="Undo" shortcut="Ctrl+Z" disabled={trashed || !editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}><Undo2 /></ToolbarButton>
              <ToolbarButton label="Redo" shortcut="Ctrl+Shift+Z" disabled={trashed || !editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}><Redo2 /></ToolbarButton>
              <span className="hidden sm:block">
                <ToolbarButton label="Document settings" onClick={() => setSettingsOpen(true)}><SlidersHorizontal /></ToolbarButton>
              </span>
              <ExportMenu busy={exporting} onExport={(f) => void exportAs(f)} />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon-sm" variant="ghost" aria-label="More document actions"><MoreVertical /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onSelect={() => setSettingsOpen(true)}><SlidersHorizontal /> Document settings</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setFocusMode(true)}><Maximize2 /> Distraction-free mode</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setShortcutsOpen(true)}><Keyboard /> Keyboard shortcuts</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem destructive disabled={trashed} onSelect={() => setTrashConfirm(true)}><Trash2 /> Move to trash</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <UserMenu user={user} />
            </div>
          </header>
          <div className="shrink-0 border-b bg-background">
            <Toolbar editor={editor} disabled={trashed} onLink={() => setLinkOpen(true)} onImage={() => setImageOpen(true)} onShortcuts={() => setShortcutsOpen(true)} />
          </div>
        </>
      )}

      {trashed && (
        <div role="alert" className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b bg-destructive-soft px-4 py-2 text-sm">
          <span>This document is in the trash, so it&apos;s read-only. Restore it to keep editing.</span>
          <Button size="sm" variant="outline" onClick={restore}><RotateCcw /> Restore</Button>
        </div>
      )}

      <main
        id="main"
        className="folio-canvas min-h-0 flex-1 overflow-y-auto scrollbar-thin"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget || (e.target as HTMLElement).dataset.canvas === 'true') {
            e.preventDefault();
            editor.chain().focus('end').run();
          }
        }}
      >
        <div data-canvas="true" className="px-2 py-4 sm:px-6 sm:py-8">
          <div
            ref={sheetRef}
            className="folio-sheet shadow-paper"
            style={{ '--page-w': `${page.w}px`, '--page-h': `${page.h}px`, '--page-pad': `${pad}px` } as React.CSSProperties}
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) {
                e.preventDefault();
                editor.chain().focus('end').run();
              }
            }}
          >
            <EditorContent editor={editor} />
          </div>
        </div>
      </main>

      <footer className="flex h-8 shrink-0 items-center justify-between gap-3 border-t bg-background px-3 text-xs text-muted-foreground sm:px-4">
        <span className="tabular-nums">
          {words.toLocaleString()} {words === 1 ? 'word' : 'words'} · {counts.characters().toLocaleString()} characters
        </span>
        <span className="tabular-nums">
          {readingTime(words)} read · {pages} {pages === 1 ? 'page' : 'pages'} · {settings.pageSize === 'a4' ? 'A4' : 'Letter'}
        </span>
      </footer>

      <LinkDialog editor={editor} open={linkOpen} onOpenChange={setLinkOpen} />
      <ImageDialog editor={editor} open={imageOpen} onOpenChange={setImageOpen} />
      <DocSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} settings={settings} onChange={onSettingsChange} />
      <ShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
      <AlertDialog open={trashConfirm} onOpenChange={setTrashConfirm}>
        <ConfirmContent
          title="Move this document to the trash?"
          description="You can restore it from the trash at any time."
          confirmLabel="Move to trash"
          onConfirm={() => {
            setTrashConfirm(false);
            void moveToTrash();
          }}
        />
      </AlertDialog>
    </div>
  );
}

export function EditorSkeleton() {
  return (
    <div className="flex h-dvh flex-col" aria-busy="true" aria-label="Loading document">
      <div className="h-14 border-b" />
      <div className="h-11 border-b" />
      <div className="folio-canvas flex-1 px-6 py-8">
        <div className="mx-auto h-[70vh] max-w-[794px] animate-pulse rounded bg-background shadow-paper" />
      </div>
    </div>
  );
}
