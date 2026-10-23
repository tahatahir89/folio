'use client';

import Link from 'next/link';
import { Copy, ExternalLink, MoreVertical, Pencil, RotateCcw, Star, Trash2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { templateLabel } from '@/lib/templates/data';
import { cn, formatRelative } from '@/lib/utils';
import type { DocumentSummary } from '@/lib/types';

export interface DocActions {
  rename: (d: DocumentSummary) => void;
  duplicate: (d: DocumentSummary) => void;
  toggleStar: (d: DocumentSummary) => void;
  trash: (d: DocumentSummary) => void;
  restore: (d: DocumentSummary) => void;
  remove: (d: DocumentSummary) => void;
}

function DocMenu({ doc, actions }: { doc: DocumentSummary; actions: DocActions }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${doc.title}`}>
          <MoreVertical />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {doc.trashed ? (
          <>
            <DropdownMenuItem onSelect={() => actions.restore(doc)}><RotateCcw /> Restore</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem destructive onSelect={() => actions.remove(doc)}><XCircle /> Delete forever</DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuItem asChild>
              <Link href={`/editor/${doc.id}`}><ExternalLink /> Open</Link>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => actions.rename(doc)}><Pencil /> Rename</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => actions.duplicate(doc)}><Copy /> Duplicate</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => actions.toggleStar(doc)}>
              <Star /> {doc.starred ? 'Remove star' : 'Add star'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem destructive onSelect={() => actions.trash(doc)}><Trash2 /> Move to trash</DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function StarButton({ doc, actions }: { doc: DocumentSummary; actions: DocActions }) {
  if (doc.trashed) return null;
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={doc.starred ? `Remove star from ${doc.title}` : `Star ${doc.title}`}
      aria-pressed={doc.starred}
      onClick={() => actions.toggleStar(doc)}
    >
      <Star className={cn(doc.starred && 'fill-amber-400 text-amber-500')} />
    </Button>
  );
}

export function DocCard({ doc, actions }: { doc: DocumentSummary; actions: DocActions }) {
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-xl border bg-background shadow-soft transition-shadow hover:shadow-pop focus-within:shadow-pop">
      <Link href={`/editor/${doc.id}`} aria-label={`Open ${doc.title}`} className="absolute inset-0 z-10 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
      <div className="relative h-36 overflow-hidden border-b bg-surface px-5 pt-4">
        <div className="h-full rounded-t-sm bg-white px-3.5 pt-3 shadow-soft ring-1 ring-black/5">
          <p className="line-clamp-[9] text-[7.5px] leading-[1.55] text-foreground/60">{doc.excerpt || 'Empty document'}</p>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-surface to-transparent" />
      </div>
      <div className="flex items-start gap-1 p-3 pl-4">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold">{doc.title}</h3>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {templateLabel(doc.template)} · {formatRelative(doc.updatedAt)}
          </p>
        </div>
        <div className="relative z-20 -mr-1 flex shrink-0 items-center">
          <StarButton doc={doc} actions={actions} />
          <DocMenu doc={doc} actions={actions} />
        </div>
      </div>
    </article>
  );
}

export function DocRow({ doc, actions }: { doc: DocumentSummary; actions: DocActions }) {
  return (
    <li className="group relative flex items-center gap-3 border-b bg-background px-4 py-2.5 transition-colors first:rounded-t-xl last:rounded-b-xl last:border-b-0 hover:bg-muted/50 focus-within:bg-muted/50">
      <Link href={`/editor/${doc.id}`} aria-label={`Open ${doc.title}`} className="absolute inset-0 z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring" />
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-medium">{doc.title}</h3>
        <p className="truncate text-xs text-muted-foreground sm:hidden">{templateLabel(doc.template)} · {formatRelative(doc.updatedAt)}</p>
      </div>
      <span className="hidden w-36 truncate text-sm text-muted-foreground sm:block">{templateLabel(doc.template)}</span>
      <span className="hidden w-32 text-sm text-muted-foreground sm:block">{formatRelative(doc.updatedAt)}</span>
      <span className="hidden w-24 text-right text-sm tabular-nums text-muted-foreground md:block">{doc.wordCount.toLocaleString()} words</span>
      <div className="relative z-20 flex shrink-0 items-center">
        <StarButton doc={doc} actions={actions} />
        <DocMenu doc={doc} actions={actions} />
      </div>
    </li>
  );
}
