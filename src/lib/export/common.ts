/**
 * Shared helpers for the PDF and DOCX exporters.
 * Kept free of framework imports so it can run under plain Node (see scripts/test-exports.ts).
 */
import type { DocSettings, PMMark, PMNode } from '../types';

export const PAGE = {
  a4: { wPt: 595.28, hPt: 841.89, wPx: 794, hPx: 1123, wTw: 11906, hTw: 16838 },
  letter: { wPt: 612, hPt: 792, wPx: 816, hPx: 1056, wTw: 12240, hTw: 15840 },
} as const;

export const MARGIN_PT = { narrow: 36, normal: 72, wide: 108 } as const;

export const DEFAULT_SETTINGS: DocSettings = {
  pageSize: 'a4',
  margins: 'normal',
  pageNumbers: false,
};

/** Typographic defaults. The editor CSS (editor.css) mirrors these values. */
export const TYPE = {
  bodySize: 11,
  lineHeight: 1.5,
  paragraphAfter: 8,
  textColor: '1F2328',
  headingColor: '111827',
  linkColor: '2563EB',
  mutedColor: '6B7280',
  quoteColor: '4B5563',
  ruleColor: 'D1D5DB',
  codeBg: 'F3F4F6',
  headings: {
    1: { size: 20, before: 18, after: 6 },
    2: { size: 16, before: 14, after: 5 },
    3: { size: 14, before: 12, after: 4 },
    4: { size: 12, before: 10, after: 4 },
    5: { size: 11, before: 10, after: 4 },
    6: { size: 11, before: 10, after: 4 },
  } as Record<number, { size: number; before: number; after: number }>,
  headingLineHeight: 1.25,
  title: { size: 28, after: 4 },
  subtitle: { size: 14, after: 14 },
  indentPt: 36,
} as const;

export const num = (v: unknown): number | null =>
  typeof v === 'number' && Number.isFinite(v) ? v : null;

export const str = (v: unknown): string | null =>
  typeof v === 'string' && v.length > 0 ? v : null;

const NAMED: Record<string, string> = {
  black: '000000',
  white: 'FFFFFF',
  red: 'FF0000',
  green: '008000',
  blue: '0000FF',
  yellow: 'FFFF00',
  orange: 'FFA500',
  purple: '800080',
  gray: '808080',
  grey: '808080',
  pink: 'FFC0CB',
  cyan: '00FFFF',
};

/** Returns a 6-digit uppercase hex string (no #) or null when the value cannot be understood. */
export function normalizeColor(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const s = input.trim().toLowerCase();
  let m = /^#([0-9a-f]{6})(?:[0-9a-f]{2})?$/.exec(s);
  if (m) return m[1].toUpperCase();
  m = /^#([0-9a-f]{3})$/.exec(s);
  if (m) {
    return m[1]
      .split('')
      .map((c) => c + c)
      .join('')
      .toUpperCase();
  }
  m = /^rgba?\(\s*(\d{1,3})\s*[,\s]\s*(\d{1,3})\s*[,\s]\s*(\d{1,3})/.exec(s);
  if (m) {
    return [m[1], m[2], m[3]]
      .map((n) => Math.max(0, Math.min(255, Number(n))).toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();
  }
  return NAMED[s] ?? null;
}

export function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

/** "14pt" -> 14, "16px" -> 12, "12" -> 12 */
export function parseSizePt(v: unknown): number | null {
  if (typeof v !== 'string') return null;
  const m = /^(\d+(?:\.\d+)?)(pt|px)?$/.exec(v.trim());
  if (!m) return null;
  const n = Number(m[1]);
  const pt = m[2] === 'px' ? n * 0.75 : n;
  return pt > 0 && pt <= 400 ? pt : null;
}

export type FontGroup = 'sans' | 'serif' | 'mono';

export function fontGroup(family: string | null | undefined): FontGroup {
  const first = (family ?? '').split(',')[0].replace(/['"]/g, '').trim().toLowerCase();
  if (/(courier|mono|consolas|menlo|monaco)/.test(first)) return 'mono';
  if (/(times|georgia|cambria|garamond|palatino|bookman|serif)/.test(first) && !first.includes('sans')) return 'serif';
  return 'sans';
}

/** First family of a CSS font stack without quotes, for use as a DOCX font name. */
export function docxFontName(family: string | null | undefined): string | null {
  if (!family) return null;
  const first = family.split(',')[0]?.replace(/['"]/g, '').trim();
  return first || null;
}

export interface RunStyle {
  bold: boolean | null;
  italic: boolean;
  underline: boolean;
  strike: boolean;
  code: boolean;
  color: string | null;
  background: string | null;
  sizePt: number | null;
  family: string | null;
  link: string | null;
}

export function resolveRunStyle(marks: PMMark[] | undefined): RunStyle {
  const s: RunStyle = {
    bold: null,
    italic: false,
    underline: false,
    strike: false,
    code: false,
    color: null,
    background: null,
    sizePt: null,
    family: null,
    link: null,
  };
  let weight: number | null = null;
  for (const mark of marks ?? []) {
    const a = mark.attrs ?? {};
    switch (mark.type) {
      case 'bold':
        s.bold = true;
        break;
      case 'italic':
        s.italic = true;
        break;
      case 'underline':
        s.underline = true;
        break;
      case 'strike':
        s.strike = true;
        break;
      case 'code':
        s.code = true;
        break;
      case 'highlight':
        s.background = normalizeColor(a.color) ?? 'FFF59D';
        break;
      case 'link':
        s.link = str(a.href);
        break;
      case 'textStyle': {
        s.color = normalizeColor(a.color) ?? s.color;
        s.sizePt = parseSizePt(a.fontSize) ?? s.sizePt;
        s.family = str(a.fontFamily) ?? s.family;
        const w = Number(a.fontWeight);
        if (Number.isFinite(w) && w > 0) weight = w;
        break;
      }
      default:
        break;
    }
  }
  if (s.bold === null && weight !== null) s.bold = weight >= 600;
  return s;
}

export function plainText(node: PMNode | undefined): string {
  if (!node) return '';
  if (node.type === 'text') return node.text ?? '';
  if (node.type === 'hardBreak') return '\n';
  return (node.content ?? []).map(plainText).join('');
}

export interface GridCell {
  node: PMNode;
  col: number;
  span: number;
  rowSpan: number;
}

export interface TableGrid {
  cols: number;
  rows: { cells: GridCell[]; placeholders: number[] }[];
  ratios: number[];
}

/** Resolves colspan/rowspan into a regular grid and derives relative column widths. */
export function layoutGrid(table: PMNode): TableGrid {
  const occupied: number[] = [];
  const rows: TableGrid['rows'] = [];
  let cols = 0;

  for (const row of table.content ?? []) {
    const cells: GridCell[] = [];
    const placeholders: number[] = [];
    let col = 0;
    const takeCarried = () => {
      while ((occupied[col] ?? 0) > 0) {
        occupied[col] -= 1;
        placeholders.push(col);
        col += 1;
      }
    };
    for (const cell of row.content ?? []) {
      takeCarried();
      const span = Math.max(1, num(cell.attrs?.colspan) ?? 1);
      const rowSpan = Math.max(1, num(cell.attrs?.rowspan) ?? 1);
      cells.push({ node: cell, col, span, rowSpan });
      for (let k = 0; k < span; k += 1) occupied[col + k] = rowSpan - 1;
      col += span;
    }
    for (let c = col; c < occupied.length; c += 1) {
      if ((occupied[c] ?? 0) > 0) {
        occupied[c] -= 1;
        placeholders.push(c);
        col = c + 1;
      }
    }
    cols = Math.max(cols, col, occupied.length);
    rows.push({ cells, placeholders });
  }

  cols = Math.max(cols, 1);
  const widths: (number | null)[] = Array.from({ length: cols }, () => null);
  for (const row of rows) {
    for (const cell of row.cells) {
      const cw = cell.node.attrs?.colwidth;
      if (Array.isArray(cw)) {
        cw.forEach((w, i) => {
          if (typeof w === 'number' && w > 0 && widths[cell.col + i] === null) widths[cell.col + i] = w;
        });
      }
    }
  }
  const known = widths.every((w) => w !== null);
  const total = known ? (widths as number[]).reduce((a, b) => a + b, 0) : cols;
  const ratios = known ? (widths as number[]).map((w) => w / total) : widths.map(() => 1 / cols);
  return { cols, rows, ratios };
}

export function sanitizeFilename(title: string, fallback = 'Untitled document'): string {
  const cleaned = title
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f<>:"/\\|?*]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^\.+/, '')
    .slice(0, 120)
    .trim();
  return cleaned || fallback;
}
