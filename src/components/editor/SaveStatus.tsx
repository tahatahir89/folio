'use client';

import { AlertCircle, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SaveState } from './useAutosave';

export function SaveStatus({ state, error, onRetry }: { state: SaveState; error: string | null; onRetry: () => void }) {
  return (
    <div role="status" aria-live="polite" className="flex h-8 items-center text-[13px]">
      {state === 'saving' && (
        <span className="flex items-center gap-1.5 text-muted-foreground"><Loader2 className="size-3.5 animate-spin" /> Saving…</span>
      )}
      {state === 'saved' && (
        <span className="flex items-center gap-1.5 text-muted-foreground"><Check className="size-3.5 text-success" /> Saved</span>
      )}
      {state === 'unsaved' && (
        <span className="flex items-center gap-1.5 text-muted-foreground"><span className="size-1.5 rounded-full bg-amber-500" /> Unsaved changes</span>
      )}
      {state === 'error' && (
        <span className={cn('flex items-center gap-1.5 text-destructive')} title={error ?? undefined}>
          <AlertCircle className="size-3.5" /> Save failed
          <button type="button" onClick={onRetry} className="rounded px-1 font-medium underline underline-offset-2 hover:bg-destructive-soft">Retry</button>
        </span>
      )}
    </div>
  );
}
