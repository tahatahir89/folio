import type { DocumentRecord } from './models/Document';
import type { DocSettings, DocumentFull, DocumentSummary, PMNode } from './types';
import { DEFAULT_SETTINGS } from './export/common';

type Lean = Pick<DocumentRecord, '_id' | 'title' | 'excerpt' | 'template' | 'starred' | 'trashed' | 'wordCount'> & {
  createdAt: Date;
  updatedAt: Date;
  lastOpenedAt?: Date;
};

export function toSummary(d: Lean): DocumentSummary {
  return {
    id: String(d._id),
    title: d.title,
    excerpt: d.excerpt ?? '',
    template: d.template ?? null,
    starred: !!d.starred,
    trashed: !!d.trashed,
    wordCount: d.wordCount ?? 0,
    createdAt: d.createdAt.toISOString(),
    updatedAt: d.updatedAt.toISOString(),
    lastOpenedAt: (d.lastOpenedAt ?? d.updatedAt).toISOString(),
  };
}

/** `content` and `settings` are typed loosely because Mongoose `.lean()` flattens nested types. */
export function toFull(d: Lean & { content: unknown; settings?: unknown }): DocumentFull {
  const settings: DocSettings = { ...DEFAULT_SETTINGS, ...((d.settings as Partial<DocSettings> | null | undefined) ?? {}) };
  return { ...toSummary(d), content: d.content as PMNode, settings };
}
