import type { PMMark, PMNode } from '../types';

/** Tiny helpers for authoring template content as Tiptap JSON. */

const INLINE = /(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/;

/** Supports **bold**, *italic* and [label](url) inside a string. */
export function inline(text: string, extra: PMMark[] = []): PMNode[] {
  return text
    .split(INLINE)
    .filter((part) => part.length > 0)
    .map((part) => {
      let marks: PMMark[] = [...extra];
      let value = part;
      let m: RegExpExecArray | null;
      if ((m = /^\*\*([^*]+)\*\*$/.exec(part))) {
        value = m[1];
        marks = [...marks, { type: 'bold' }];
      } else if ((m = /^\*([^*]+)\*$/.exec(part))) {
        value = m[1];
        marks = [...marks, { type: 'italic' }];
      } else if ((m = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part))) {
        value = m[1];
        marks = [...marks, { type: 'link', attrs: { href: m[2] } }];
      }
      return marks.length ? { type: 'text', text: value, marks } : { type: 'text', text: value };
    });
}

type Attrs = Record<string, unknown>;

export const p = (text = '', attrs?: Attrs): PMNode => ({
  type: 'paragraph',
  ...(attrs && Object.keys(attrs).length ? { attrs } : {}),
  ...(text ? { content: inline(text) } : {}),
});

export const title = (text: string, attrs: Attrs = {}): PMNode => p(text, { docStyle: 'title', ...attrs });
export const subtitle = (text: string, attrs: Attrs = {}): PMNode => p(text, { docStyle: 'subtitle', ...attrs });

export const h = (level: 1 | 2 | 3 | 4, text: string, attrs: Attrs = {}): PMNode => ({
  type: 'heading',
  attrs: { level, ...attrs },
  content: inline(text),
});

const item = (text: string): PMNode => ({ type: 'listItem', content: [p(text)] });

export const ul = (...items: string[]): PMNode => ({ type: 'bulletList', content: items.map(item) });
export const ol = (...items: string[]): PMNode => ({ type: 'orderedList', attrs: { start: 1 }, content: items.map(item) });

export const tasks = (...items: (string | [string, boolean])[]): PMNode => ({
  type: 'taskList',
  content: items.map((it) => {
    const [text, checked] = Array.isArray(it) ? it : [it, false];
    return { type: 'taskItem', attrs: { checked }, content: [p(text)] };
  }),
});

export const quote = (text: string): PMNode => ({ type: 'blockquote', content: [p(text)] });
export const hr = (): PMNode => ({ type: 'horizontalRule' });
export const pageBreak = (): PMNode => ({ type: 'pageBreak' });

export const table = (header: string[] | null, ...rows: string[][]): PMNode => {
  const cell = (type: 'tableCell' | 'tableHeader', text: string): PMNode => ({
    type,
    attrs: { colspan: 1, rowspan: 1, colwidth: null },
    content: [p(text)],
  });
  const out: PMNode[] = [];
  if (header) out.push({ type: 'tableRow', content: header.map((t) => cell('tableHeader', t)) });
  for (const r of rows) out.push({ type: 'tableRow', content: r.map((t) => cell('tableCell', t)) });
  return { type: 'table', content: out };
};

export const doc = (...content: PMNode[]): PMNode => ({ type: 'doc', content });
