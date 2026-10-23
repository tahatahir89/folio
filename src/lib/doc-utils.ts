import type { PMMark, PMNode } from './types';

/** Thrown when submitted document JSON is malformed or unsafe. */
export class DocValidationError extends Error {}

const NODE_TYPES = new Set([
  'doc', 'paragraph', 'text', 'heading', 'blockquote', 'bulletList', 'orderedList', 'listItem', 'codeBlock',
  'horizontalRule', 'hardBreak', 'taskList', 'taskItem', 'table', 'tableRow', 'tableHeader', 'tableCell', 'image', 'pageBreak',
]);
const MARK_TYPES = new Set(['bold', 'italic', 'underline', 'strike', 'code', 'link', 'textStyle', 'highlight']);

type Check = (v: unknown) => boolean;
const oneOf = (...vals: string[]): Check => (v) => typeof v === 'string' && vals.includes(v);
const numIn = (min: number, max: number): Check => (v) => typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;
const intIn = (min: number, max: number): Check => (v) => Number.isInteger(v) && (v as number) >= min && (v as number) <= max;
const text = (max: number): Check => (v) => typeof v === 'string' && v.length <= max;
const bool: Check = (v) => typeof v === 'boolean';
const color: Check = (v) => typeof v === 'string' && /^(#[0-9a-f]{3,8}|rgba?\([\d\s.,%/]+\)|[a-z]{3,20})$/i.test(v);
const fontFamily: Check = (v) => typeof v === 'string' && v.length <= 200 && /^[\w\s,'"\-.]+$/.test(v);
const fontSize: Check = (v) => typeof v === 'string' && /^\d{1,3}(\.\d+)?(pt|px)$/.test(v);
const fontWeight: Check = (v) => (typeof v === 'string' || typeof v === 'number') && /^[1-9]00$/.test(String(v));
const colwidth: Check = (v) => v === null || (Array.isArray(v) && v.length <= 50 && v.every((n) => typeof n === 'number' && n > 0 && n < 5000));

export const isSafeHref = (v: unknown): v is string =>
  typeof v === 'string' && v.length <= 2048 && /^(https?:\/\/|mailto:|tel:|#|\/)/i.test(v.trim());
export const isSafeImageSrc = (v: unknown): v is string =>
  typeof v === 'string' &&
  (/^data:image\/(png|jpe?g|gif|webp);base64,[a-z0-9+/=\s]+$/i.test(v) || /^https?:\/\/\S+$/i.test(v)) &&
  v.length <= 6_000_000;

const BLOCK_ATTRS = {
  textAlign: oneOf('left', 'center', 'right', 'justify'),
  lineHeight: numIn(0.8, 4),
  spaceAfter: numIn(0, 200),
  indent: intIn(0, 8),
};

const NODE_ATTRS: Record<string, Record<string, Check>> = {
  paragraph: { ...BLOCK_ATTRS, docStyle: oneOf('title', 'subtitle') },
  heading: { ...BLOCK_ATTRS, level: intIn(1, 6) },
  orderedList: { start: intIn(1, 100000), type: text(4) },
  taskItem: { checked: bool },
  codeBlock: { language: text(30) },
  image: { src: isSafeImageSrc, alt: text(300), title: text(300), width: numIn(5, 100), align: oneOf('left', 'center', 'right') },
  tableCell: { colspan: intIn(1, 50), rowspan: intIn(1, 50), colwidth },
  tableHeader: { colspan: intIn(1, 50), rowspan: intIn(1, 50), colwidth },
};

const MARK_ATTRS: Record<string, Record<string, Check>> = {
  textStyle: { color, fontSize, fontFamily, fontWeight },
  highlight: { color },
};

function pickAttrs(raw: unknown, rules: Record<string, Check> | undefined, required: string[] = []): Record<string, unknown> | undefined {
  if (!rules || typeof raw !== 'object' || raw === null) {
    if (required.length) throw new DocValidationError(`Missing required attribute: ${required[0]}`);
    return undefined;
  }
  const out: Record<string, unknown> = {};
  for (const [key, check] of Object.entries(rules)) {
    const v = (raw as Record<string, unknown>)[key];
    if (v === undefined || v === null) {
      if (key === 'colwidth' && v === null) out[key] = null;
      continue;
    }
    if (check(v)) out[key] = v;
  }
  for (const key of required) {
    if (out[key] === undefined) throw new DocValidationError(`Invalid or missing "${key}" value.`);
  }
  return Object.keys(out).length ? out : undefined;
}

function cleanMarks(raw: unknown): PMMark[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const out: PMMark[] = [];
  for (const m of raw) {
    if (typeof m !== 'object' || m === null) continue;
    const type = (m as PMMark).type;
    if (typeof type !== 'string' || !MARK_TYPES.has(type)) throw new DocValidationError(`Unsupported mark: ${String(type)}`);
    if (type === 'link') {
      const href = (m as PMMark).attrs?.href;
      if (isSafeHref(href)) out.push({ type, attrs: { href: href.trim() } });
      continue; // unsafe links (javascript:, data:) are dropped, text is kept
    }
    const attrs = pickAttrs((m as PMMark).attrs, MARK_ATTRS[type]);
    out.push(attrs ? { type, attrs } : { type });
  }
  return out.length ? out : undefined;
}

/**
 * Validates untrusted document JSON against Folio's schema and strips anything unknown or unsafe.
 * Throws DocValidationError when the structure cannot be trusted.
 */
export function sanitizeDoc(input: unknown): PMNode {
  let count = 0;
  const walk = (raw: unknown, depth: number): PMNode => {
    if (depth > 32) throw new DocValidationError('Document is nested too deeply.');
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) throw new DocValidationError('Invalid document node.');
    count += 1;
    if (count > 150_000) throw new DocValidationError('Document is too large.');
    const node = raw as PMNode;
    if (typeof node.type !== 'string' || !NODE_TYPES.has(node.type)) {
      throw new DocValidationError(`Unsupported content type: ${String(node.type)}`);
    }
    const out: PMNode = { type: node.type };
    if (node.type === 'text') {
      if (typeof node.text !== 'string' || node.text.length === 0 || node.text.length > 200_000) {
        throw new DocValidationError('Invalid text content.');
      }
      out.text = node.text;
      const marks = cleanMarks(node.marks);
      if (marks) out.marks = marks;
      return out;
    }
    const attrs = pickAttrs(node.attrs, NODE_ATTRS[node.type], node.type === 'image' ? ['src'] : []);
    if (attrs) out.attrs = attrs;
    if (node.content !== undefined) {
      if (!Array.isArray(node.content)) throw new DocValidationError('Invalid node content.');
      out.content = node.content.map((c) => walk(c, depth + 1));
    }
    return out;
  };
  const root = walk(input, 0);
  if (root.type !== 'doc') throw new DocValidationError('Document root must be a "doc" node.');
  if (JSON.stringify(root).length > 8_000_000) throw new DocValidationError('Document is too large to save (limit 8 MB).');
  return root;
}

export function extractText(node: PMNode | undefined, parts: string[] = []): string[] {
  if (!node) return parts;
  if (node.type === 'text' && node.text) parts.push(node.text);
  else if (node.type === 'hardBreak') parts.push(' ');
  for (const c of node.content ?? []) extractText(c, parts);
  if (['paragraph', 'heading', 'codeBlock', 'tableCell', 'tableHeader', 'listItem'].includes(node.type)) parts.push(' ');
  return parts;
}

export function summarize(doc: PMNode): { excerpt: string; wordCount: number } {
  const plain = extractText(doc).join('').replace(/\s+/g, ' ').trim();
  return { excerpt: plain.slice(0, 200), wordCount: plain ? plain.split(' ').length : 0 };
}

export const emptyDoc = (): PMNode => ({ type: 'doc', content: [{ type: 'paragraph' }] });
