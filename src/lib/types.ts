export interface PMMark {
  type: string;
  attrs?: Record<string, unknown>;
}

export interface PMNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: PMNode[];
  marks?: PMMark[];
  text?: string;
}

export type PageSizeId = 'a4' | 'letter';
export type MarginId = 'narrow' | 'normal' | 'wide';

export interface DocSettings {
  pageSize: PageSizeId;
  margins: MarginId;
  pageNumbers: boolean;
}

export interface DocumentSummary {
  id: string;
  title: string;
  excerpt: string;
  template: string | null;
  starred: boolean;
  trashed: boolean;
  wordCount: number;
  createdAt: string;
  updatedAt: string;
  lastOpenedAt: string;
}

export interface DocumentFull extends DocumentSummary {
  content: PMNode;
  settings: DocSettings;
}

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  plan: 'free';
  createdAt: string;
}

export type SortKey = 'title' | 'created' | 'modified';
export type SortOrder = 'asc' | 'desc';
export type DocumentView = 'all' | 'recent' | 'starred' | 'trash';
