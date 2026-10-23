'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { api, ApiClientError } from '@/lib/client/api';
import type { DocSettings, PMNode } from '@/lib/types';

export type SaveState = 'saved' | 'saving' | 'unsaved' | 'error';

interface Options {
  docId: string;
  getContent: () => PMNode | null;
  initialTitle: string;
  initialSettings: DocSettings;
  disabled?: boolean;
  debounceMs?: number;
  maxWaitMs?: number;
}

interface Dirty {
  content: boolean;
  title: boolean;
  settings: boolean;
}

const CLEAN: Dirty = { content: false, title: false, settings: false };
const MAX_RETRIES = 5;

/**
 * Debounced, serialized autosave.
 *  - one request in flight at a time, always sending the latest state
 *  - "saved" is only reported after the server confirms persistence
 *  - network / 5xx failures retry with backoff; client errors stop and surface the message
 */
export function useAutosave({ docId, getContent, initialTitle, initialSettings, disabled, debounceMs = 1200, maxWaitMs = 10_000 }: Options) {
  const [state, setState] = useState<SaveState>('saved');
  const [error, setError] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  const dirty = useRef<Dirty>({ ...CLEAN });
  const title = useRef(initialTitle);
  const settings = useRef(initialSettings);
  const getContentRef = useRef(getContent);
  const disabledRef = useRef(disabled);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const maxTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retries = useRef(0);
  const running = useRef<Promise<boolean> | null>(null);

  getContentRef.current = getContent;
  disabledRef.current = disabled;

  const isDirty = () => dirty.current.content || dirty.current.title || dirty.current.settings;

  const clearTimers = () => {
    if (timer.current) clearTimeout(timer.current);
    if (maxTimer.current) clearTimeout(maxTimer.current);
    if (retryTimer.current) clearTimeout(retryTimer.current);
    timer.current = maxTimer.current = retryTimer.current = null;
  };

  const saveOnce = useCallback(async (): Promise<boolean> => {
    const parts = { ...dirty.current };
    if (!parts.content && !parts.title && !parts.settings) return true;
    dirty.current = { ...CLEAN };
    setState('saving');
    try {
      const body: Record<string, unknown> = {};
      if (parts.title) body.title = title.current;
      if (parts.settings) body.settings = settings.current;
      if (parts.content) {
        const content = getContentRef.current();
        if (content) body.content = content;
      }
      if (Object.keys(body).length > 0) await api(`/api/documents/${docId}`, { method: 'PATCH', json: body });
      retries.current = 0;
      setError(null);
      setLastSavedAt(new Date());
      setState(isDirty() ? 'unsaved' : 'saved');
      return true;
    } catch (err) {
      // Put the parts back so nothing is lost, and keep the latest edits too.
      dirty.current = {
        content: dirty.current.content || parts.content,
        title: dirty.current.title || parts.title,
        settings: dirty.current.settings || parts.settings,
      };
      const status = err instanceof ApiClientError ? err.status : 0;
      setError(err instanceof Error ? err.message : 'Save failed.');
      setState('error');
      if ((status === 0 || status >= 500) && retries.current < MAX_RETRIES) {
        const wait = Math.min(30_000, 2000 * 2 ** retries.current);
        retries.current += 1;
        retryTimer.current = setTimeout(() => void flushRef.current(), wait);
      }
      return false;
    }
  }, [docId]);

  const flush = useCallback((): Promise<boolean> => {
    clearTimers();
    if (running.current) return running.current.then(() => flushRef.current());
    if (!isDirty()) return Promise.resolve(true);
    const p = (async () => {
      try {
        let ok = true;
        while (isDirty()) {
          ok = await saveOnce();
          if (!ok) break;
        }
        return ok;
      } finally {
        running.current = null;
      }
    })();
    running.current = p;
    return p;
  }, [saveOnce]);

  const flushRef = useRef(flush);
  flushRef.current = flush;

  const schedule = useCallback(() => {
    if (disabledRef.current) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void flushRef.current(), debounceMs);
    // A long typing burst still saves at least every maxWaitMs.
    maxTimer.current ??= setTimeout(() => void flushRef.current(), maxWaitMs);
  }, [debounceMs, maxWaitMs]);

  const mark = useCallback(
    (part: keyof Dirty) => {
      if (disabledRef.current) return;
      dirty.current[part] = true;
      retries.current = 0;
      setState((s) => (s === 'saving' ? s : 'unsaved'));
      schedule();
    },
    [schedule],
  );

  const markContentDirty = useCallback(() => mark('content'), [mark]);
  const setTitle = useCallback(
    (value: string) => {
      title.current = value;
      mark('title');
    },
    [mark],
  );
  const setSettings = useCallback(
    (value: DocSettings) => {
      settings.current = value;
      mark('settings');
    },
    [mark],
  );

  useEffect(() => {
    const beforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty() || running.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    const onHide = () => {
      if (document.visibilityState === 'hidden' && isDirty()) void flushRef.current();
    };
    window.addEventListener('beforeunload', beforeUnload);
    document.addEventListener('visibilitychange', onHide);
    return () => {
      window.removeEventListener('beforeunload', beforeUnload);
      document.removeEventListener('visibilitychange', onHide);
      if (isDirty()) void flushRef.current();
      clearTimers();
    };
  }, []);

  return { state, error, lastSavedAt, markContentDirty, setTitle, setSettings, flush, retryNow: flush };
}
