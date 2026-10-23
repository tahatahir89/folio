'use client';

import { useEffect, useMemo, useState } from 'react';
import useSWR, { mutate } from 'swr';
import { toast } from 'sonner';
import { AlertCircle, ArrowUpDown, Clock, FileText, LayoutGrid, Plus, Rows3, Search, Star, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AlertDialog, ConfirmContent, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, dialogTitleClass } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input, Skeleton } from '@/components/ui/input';
import { api } from '@/lib/client/api';
import { cn } from '@/lib/utils';
import type { DocumentSummary, DocumentView, SortKey, SortOrder } from '@/lib/types';
import { useNewDocument } from './AppShell';
import { DocCard, DocRow, type DocActions } from './DocumentItem';
import { EmptyState } from './ui-bits';

const refreshAll = () => mutate((key) => typeof key === 'string' && key.startsWith('/api/documents'));

interface Props {
  view: DocumentView;
  heading?: string;
  searchPlaceholder?: string;
  emptyTitle: string;
  emptyDescription: string;
  showSort?: boolean;
}

const EMPTY_ICONS: Record<DocumentView, React.ReactNode> = {
  all: <FileText />,
  recent: <Clock />,
  starred: <Star />,
  trash: <Trash2 />,
};

export function DocumentsView({ view, heading, searchPlaceholder = 'Search documents by title', emptyTitle, emptyDescription, showSort = true }: Props) {
  const openNew = useNewDocument();
  const [input, setInput] = useState('');
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<SortKey>('modified');
  const [order, setOrder] = useState<SortOrder>('desc');
  const [mode, setMode] = useState<'grid' | 'list'>('grid');
  const [renaming, setRenaming] = useState<DocumentSummary | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [deleting, setDeleting] = useState<DocumentSummary | null>(null);
  const [emptying, setEmptying] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('folio:view-mode');
      if (saved === 'grid' || saved === 'list') setMode(saved);
    } catch {
      /* storage unavailable */
    }
  }, []);
  useEffect(() => {
    const t = setTimeout(() => setQ(input.trim()), 300);
    return () => clearTimeout(t);
  }, [input]);

  const changeMode = (m: 'grid' | 'list') => {
    setMode(m);
    try {
      localStorage.setItem('folio:view-mode', m);
    } catch {
      /* ignore */
    }
  };

  const key = useMemo(() => {
    const p = new URLSearchParams();
    // Searching from "Recent" looks across everything.
    p.set('view', q && view === 'recent' ? 'all' : view);
    if (q) p.set('q', q);
    if (view !== 'recent' || q) {
      p.set('sort', sort);
      p.set('order', order);
    }
    return `/api/documents?${p.toString()}`;
  }, [view, q, sort, order]);

  const { data, error, isLoading, mutate: reload } = useSWR<{ documents: DocumentSummary[] }>(key);
  const docs = data?.documents ?? [];

  const patch = async (doc: DocumentSummary, json: Record<string, unknown>) => {
    await api(`/api/documents/${doc.id}`, { method: 'PATCH', json });
    await refreshAll();
  };

  const actions: DocActions = {
    rename: (d) => {
      setRenaming(d);
      setRenameValue(d.title);
    },
    duplicate: async (d) => {
      try {
        await api(`/api/documents/${d.id}/duplicate`, { method: 'POST' });
        await refreshAll();
        toast.success('Document duplicated');
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Could not duplicate the document.');
      }
    },
    toggleStar: async (d) => {
      try {
        await patch(d, { starred: !d.starred });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Could not update the star.');
      }
    },
    trash: async (d) => {
      try {
        await patch(d, { trashed: true });
        toast('Moved to trash', {
          description: d.title,
          action: { label: 'Undo', onClick: () => void patch(d, { trashed: false }).catch(() => toast.error('Could not undo.')) },
        });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Could not move to trash.');
      }
    },
    restore: async (d) => {
      try {
        await patch(d, { trashed: false });
        toast.success('Document restored');
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Could not restore the document.');
      }
    },
    remove: (d) => setDeleting(d),
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await api(`/api/documents/${deleting.id}`, { method: 'DELETE' });
      await refreshAll();
      toast.success('Document deleted permanently');
      setDeleting(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not delete the document.');
    } finally {
      setBusy(false);
    }
  };

  const confirmEmpty = async () => {
    setBusy(true);
    try {
      const { deleted } = await api<{ deleted: number }>('/api/documents', { method: 'DELETE' });
      await refreshAll();
      toast.success(`Deleted ${deleted} ${deleted === 1 ? 'document' : 'documents'}`);
      setEmptying(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not empty the trash.');
    } finally {
      setBusy(false);
    }
  };

  const submitRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renaming) return;
    setBusy(true);
    try {
      await patch(renaming, { title: renameValue.trim() || 'Untitled document' });
      setRenaming(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not rename the document.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section aria-label={heading ?? 'Documents'}>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {heading && <h2 className="mr-auto text-lg font-semibold tracking-tight">{heading}</h2>}
        <div className={cn('relative w-full sm:w-72', !heading && 'sm:mr-auto')}>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            type="search"
            aria-label="Search documents"
            placeholder={searchPlaceholder}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="pl-9 pr-9"
          />
          {input && (
            <button type="button" aria-label="Clear search" onClick={() => setInput('')} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
              <X className="size-3.5" />
            </button>
          )}
        </div>
        {showSort && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-10"><ArrowUpDown /> Sort</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel>Sort by</DropdownMenuLabel>
              <DropdownMenuRadioGroup value={sort} onValueChange={(v) => setSort(v as SortKey)}>
                <DropdownMenuRadioItem value="modified">Last modified</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="created">Date created</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="title">Title</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Order</DropdownMenuLabel>
              <DropdownMenuRadioGroup value={order} onValueChange={(v) => setOrder(v as SortOrder)}>
                <DropdownMenuRadioItem value="desc">{sort === 'title' ? 'Z to A' : 'Newest first'}</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="asc">{sort === 'title' ? 'A to Z' : 'Oldest first'}</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        <div role="group" aria-label="Layout" className="flex rounded-md border bg-background p-0.5">
          <Button variant="ghost" size="icon-sm" aria-label="Grid view" aria-pressed={mode === 'grid'} className={cn(mode === 'grid' && 'bg-muted')} onClick={() => changeMode('grid')}><LayoutGrid /></Button>
          <Button variant="ghost" size="icon-sm" aria-label="List view" aria-pressed={mode === 'list'} className={cn(mode === 'list' && 'bg-muted')} onClick={() => changeMode('list')}><Rows3 /></Button>
        </div>
        {view === 'trash' && docs.length > 0 && (
          <Button variant="outline" size="sm" className="h-10 text-destructive hover:text-destructive" onClick={() => setEmptying(true)}>
            <Trash2 /> Empty trash
          </Button>
        )}
      </div>

      {isLoading ? (
        mode === 'grid' ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true" aria-label="Loading documents">
            {Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-56 rounded-xl" />)}
          </div>
        ) : (
          <div className="grid gap-px overflow-hidden rounded-xl border" aria-busy="true" aria-label="Loading documents">
            {Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-12 rounded-none" />)}
          </div>
        )
      ) : error ? (
        <EmptyState
          icon={<AlertCircle />}
          title="We couldn't load your documents"
          description={error instanceof Error ? error.message : 'Something went wrong.'}
          action={<Button variant="outline" onClick={() => void reload()}>Try again</Button>}
        />
      ) : docs.length === 0 ? (
        q ? (
          <EmptyState icon={<Search />} title={`No documents match “${q}”`} description="Check the spelling, or try a shorter search." action={<Button variant="outline" onClick={() => setInput('')}>Clear search</Button>} />
        ) : (
          <EmptyState
            icon={EMPTY_ICONS[view]}
            title={emptyTitle}
            description={emptyDescription}
            action={view !== 'trash' ? <Button onClick={openNew}><Plus /> Create a document</Button> : undefined}
          />
        )
      ) : mode === 'grid' ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {docs.map((d) => <DocCard key={d.id} doc={d} actions={actions} />)}
        </div>
      ) : (
        <ul className="overflow-hidden rounded-xl border shadow-soft">
          {docs.map((d) => <DocRow key={d.id} doc={d} actions={actions} />)}
        </ul>
      )}

      <Dialog open={!!renaming} onOpenChange={(o) => !o && setRenaming(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className={dialogTitleClass}>Rename document</DialogTitle></DialogHeader>
          <form onSubmit={submitRename} className="grid gap-4">
            <Input autoFocus aria-label="Document title" value={renameValue} maxLength={200} onChange={(e) => setRenameValue(e.target.value)} onFocus={(e) => e.currentTarget.select()} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setRenaming(null)}>Cancel</Button>
              <Button type="submit" loading={busy}>Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <ConfirmContent
          title="Delete this document forever?"
          description={<>“{deleting?.title}” will be permanently deleted. This can&apos;t be undone.</>}
          confirmLabel="Delete forever"
          busy={busy}
          onConfirm={() => void confirmDelete()}
        />
      </AlertDialog>
      <AlertDialog open={emptying} onOpenChange={setEmptying}>
        <ConfirmContent
          title="Empty the trash?"
          description="Every document in the trash will be permanently deleted. This can't be undone."
          confirmLabel="Empty trash"
          busy={busy}
          onConfirm={() => void confirmEmpty()}
        />
      </AlertDialog>
    </section>
  );
}
