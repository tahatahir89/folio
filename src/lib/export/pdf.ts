/**
 * PDF exporter built on pdf-lib with a small layout engine (text wrapping, lists,
 * tables, quotes, code, images, links, page breaks). Pure JS: works on any Node host.
 *
 * Fonts: the 14 standard PDF fonts are used (Helvetica/Times/Courier families), so text is
 * limited to the WinAnsi (Latin-1 + common punctuation) range. See README "Known limits".
 */
import { PDFArray, PDFDocument, PDFFont, PDFImage, PDFName, PDFPage, PDFString, StandardFonts, rgb } from 'pdf-lib';
import type { DocSettings, PMMark, PMNode } from '../types';
import {
  DEFAULT_SETTINGS,
  FontGroup,
  MARGIN_PT,
  PAGE,
  TYPE,
  fontGroup,
  hexToRgb,
  layoutGrid,
  num,
  resolveRunStyle,
  str,
} from './common';
import type { ResolvedImage } from './images';

type RGB = [number, number, number];
type Align = 'left' | 'center' | 'right' | 'justify';

interface Style {
  group: FontGroup;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strike: boolean;
  color: RGB;
  bg: RGB | null;
  size: number;
  link: string | null;
}

interface Tok {
  text: string;
  style: Style;
  width: number;
  space: boolean;
  nl: boolean;
}

interface Line {
  toks: Tok[];
  width: number;
  last: boolean;
}

interface Box {
  x: number;
  width: number;
}

interface Defaults {
  size: number;
  bold: boolean;
  italic: boolean;
  color: RGB;
  group: FontGroup;
  lineHeight: number;
  after: number;
}

type Marker = (baseline: number, top: number, lineH: number, size: number) => void;

interface BlockOpts {
  marker?: Marker;
  afterOverride?: number;
  depth?: number;
}

const METRICS: Record<FontGroup, { asc: number; desc: number }> = {
  sans: { asc: 0.905, desc: 0.212 },
  serif: { asc: 0.891, desc: 0.216 },
  mono: { asc: 0.833, desc: 0.3 },
};

const FONT_MAP: Record<FontGroup, [string, string, string, string]> = {
  sans: [StandardFonts.Helvetica, StandardFonts.HelveticaBold, StandardFonts.HelveticaOblique, StandardFonts.HelveticaBoldOblique],
  serif: [StandardFonts.TimesRoman, StandardFonts.TimesRomanBold, StandardFonts.TimesRomanItalic, StandardFonts.TimesRomanBoldItalic],
  mono: [StandardFonts.Courier, StandardFonts.CourierBold, StandardFonts.CourierOblique, StandardFonts.CourierBoldOblique],
};

const WIN_ANSI_EXTRA = new Set([
  0x20ac, 0x201a, 0x0192, 0x201e, 0x2026, 0x2020, 0x2021, 0x02c6, 0x2030, 0x0160, 0x2039, 0x0152, 0x017d, 0x2018, 0x2019,
  0x201c, 0x201d, 0x2022, 0x2013, 0x2014, 0x02dc, 0x2122, 0x0161, 0x203a, 0x0153, 0x017e, 0x0178,
]);

const REPLACEMENTS: Record<string, string> = {
  '\u2192': '->',
  '\u2190': '<-',
  '\u2265': '>=',
  '\u2264': '<=',
  '\u2713': 'v',
  '\u2714': 'v',
  '\u2212': '-',
  '\u2009': ' ',
  '\u202f': ' ',
  '\u00a0': ' ',
};

/** Makes text safe for the standard (WinAnsi) PDF fonts. */
export function toWinAnsi(input: string): string {
  let out = '';
  for (const ch of input) {
    const cp = ch.codePointAt(0) as number;
    if (ch === '\t') out += '    ';
    else if (ch === '\n' || ch === '\r') out += ' ';
    else if (cp === 0x200b || cp === 0x200c || cp === 0x200d || cp === 0xfeff) continue;
    else if (REPLACEMENTS[ch] !== undefined) out += REPLACEMENTS[ch];
    else if ((cp >= 0x20 && cp <= 0x7e) || (cp >= 0xa1 && cp <= 0xff) || WIN_ANSI_EXTRA.has(cp)) out += ch;
    else out += '?';
  }
  return out;
}

const COLOR = {
  text: hexToRgb(TYPE.textColor),
  heading: hexToRgb(TYPE.headingColor),
  link: hexToRgb(TYPE.linkColor),
  muted: hexToRgb(TYPE.mutedColor),
  quote: hexToRgb(TYPE.quoteColor),
  rule: hexToRgb(TYPE.ruleColor),
  codeBg: hexToRgb(TYPE.codeBg),
  tableHead: hexToRgb('F3F4F6'),
  accent: hexToRgb('4F46E5'),
};

const col = (c: RGB) => rgb(c[0], c[1], c[2]);

class Renderer {
  private page!: PDFPage;
  private y = 0;
  private atTop = true;
  private pending = 0;
  private measuring = 0;
  private noBreak = 0;
  private spans: { x: number; w: number; color: RGB; startY: number }[] = [];
  private readonly fonts = new Map<string, PDFFont>();
  private readonly imageCache = new Map<string, PDFImage>();
  private readonly styleCache = new Map<string, Style>();

  private constructor(
    private readonly pdf: PDFDocument,
    private readonly settings: DocSettings,
    private readonly images: Map<string, ResolvedImage | null>,
  ) {}

  static async create(settings: DocSettings, images: Map<string, ResolvedImage | null>, title: string) {
    const pdf = await PDFDocument.create();
    pdf.setTitle(title);
    pdf.setCreator('Folio');
    pdf.setProducer('Folio');
    const r = new Renderer(pdf, settings, images);
    for (const group of Object.keys(FONT_MAP) as FontGroup[]) {
      const names = FONT_MAP[group];
      for (let i = 0; i < 4; i += 1) r.fonts.set(`${group}:${i}`, await pdf.embedFont(names[i]));
    }
    r.newPage(true);
    return r;
  }

  // ---------- page geometry ----------

  private get pageW() {
    return PAGE[this.settings.pageSize].wPt;
  }
  private get pageH() {
    return PAGE[this.settings.pageSize].hPt;
  }
  private get margin() {
    return MARGIN_PT[this.settings.margins];
  }
  private get top() {
    return this.pageH - this.margin;
  }
  private get bottom() {
    return this.margin + (this.settings.pageNumbers ? 14 : 0);
  }
  get contentBox(): Box {
    return { x: this.margin, width: this.pageW - this.margin * 2 };
  }

  private newPage(initial = false) {
    if (this.measuring) return;
    if (!initial) this.closeSpans(this.y);
    this.page = this.pdf.addPage([this.pageW, this.pageH]);
    this.y = this.top;
    this.atTop = true;
    this.pending = 0;
    for (const s of this.spans) s.startY = this.top;
  }

  private ensureSpace(h: number) {
    if (this.measuring || this.noBreak) return;
    if (!this.atTop && this.y - h < this.bottom - 0.01) this.newPage();
  }

  private applyMargin(before: number) {
    if (!this.atTop) this.y -= Math.max(this.pending, before);
    this.pending = 0;
  }

  private closeSpans(endY: number) {
    if (this.measuring) return;
    for (const s of this.spans) {
      if (s.startY - endY > 0.5) {
        this.page.drawRectangle({ x: s.x, y: endY, width: s.w, height: s.startY - endY, color: col(s.color) });
      }
    }
  }

  private measure(fn: () => void): number {
    const saved = { y: this.y, pending: this.pending, atTop: this.atTop, spans: this.spans };
    this.measuring += 1;
    this.spans = [];
    this.atTop = true;
    const startY = this.y;
    try {
      fn();
    } finally {
      this.measuring -= 1;
    }
    const h = startY - this.y;
    this.y = saved.y;
    this.pending = saved.pending;
    this.atTop = saved.atTop;
    this.spans = saved.spans;
    return h;
  }

  // ---------- fonts & styles ----------

  private font(s: Pick<Style, 'group' | 'bold' | 'italic'>): PDFFont {
    // FONT_MAP order is [regular, bold, italic, boldItalic]
    const idx = (s.bold ? 1 : 0) + (s.italic ? 2 : 0);
    return this.fonts.get(`${s.group}:${idx}`) as PDFFont;
  }

  private styleFor(marks: PMMark[] | undefined, d: Defaults): Style {
    const rs = resolveRunStyle(marks);
    const group: FontGroup = rs.code ? 'mono' : rs.family ? fontGroup(rs.family) : d.group;
    const size = (rs.sizePt ?? d.size) * (rs.code && !rs.sizePt ? 0.9 : 1);
    const style: Style = {
      group,
      bold: rs.bold ?? d.bold,
      italic: rs.italic || d.italic,
      underline: rs.underline || !!rs.link,
      strike: rs.strike,
      color: rs.color ? hexToRgb(rs.color) : rs.link ? COLOR.link : d.color,
      bg: rs.background ? hexToRgb(rs.background) : rs.code ? COLOR.codeBg : null,
      size,
      link: rs.link,
    };
    const key = JSON.stringify([style.group, style.bold, style.italic, style.underline, style.strike, style.color, style.bg, style.size, style.link]);
    const cached = this.styleCache.get(key);
    if (cached) return cached;
    this.styleCache.set(key, style);
    return style;
  }

  // ---------- inline layout ----------

  private tokens(nodes: PMNode[] | undefined, d: Defaults): Tok[] {
    const out: Tok[] = [];
    const baseStyle = this.styleFor(undefined, d);
    for (const n of nodes ?? []) {
      if (n.type === 'hardBreak') {
        out.push({ text: '', style: baseStyle, width: 0, space: false, nl: true });
      } else if (n.type === 'text' && n.text) {
        const style = this.styleFor(n.marks, d);
        const font = this.font(style);
        for (const part of toWinAnsi(n.text).split(/( +)/)) {
          if (!part) continue;
          out.push({
            text: part,
            style,
            width: font.widthOfTextAtSize(part, style.size),
            space: part[0] === ' ',
            nl: false,
          });
        }
      }
    }
    return out;
  }

  private splitLongWord(tok: Tok, maxWidth: number): Tok[] {
    const font = this.font(tok.style);
    const pieces: Tok[] = [];
    let chunk = '';
    for (const ch of tok.text) {
      const next = chunk + ch;
      if (chunk && font.widthOfTextAtSize(next, tok.style.size) > maxWidth) {
        pieces.push({ ...tok, text: chunk, width: font.widthOfTextAtSize(chunk, tok.style.size) });
        chunk = ch;
      } else chunk = next;
    }
    if (chunk) pieces.push({ ...tok, text: chunk, width: font.widthOfTextAtSize(chunk, tok.style.size) });
    return pieces;
  }

  private flow(tokens: Tok[], maxWidth: number): Line[] {
    const lines: Line[] = [];
    let cur: Tok[] = [];
    let w = 0;
    const trim = () => {
      while (cur.length && cur[cur.length - 1].space) w -= (cur.pop() as Tok).width;
    };
    const expanded: Tok[] = [];
    for (const t of tokens) {
      if (!t.space && !t.nl && t.width > maxWidth) expanded.push(...this.splitLongWord(t, maxWidth));
      else expanded.push(t);
    }
    for (const t of expanded) {
      if (t.nl) {
        trim();
        lines.push({ toks: cur, width: w, last: true });
        cur = [];
        w = 0;
        continue;
      }
      if (t.space) {
        if (cur.length === 0) continue;
        cur.push(t);
        w += t.width;
        continue;
      }
      if (cur.length && w + t.width > maxWidth + 0.01) {
        trim();
        lines.push({ toks: cur, width: w, last: false });
        cur = [];
        w = 0;
      }
      cur.push(t);
      w += t.width;
    }
    trim();
    lines.push({ toks: cur, width: w, last: true });
    return lines;
  }

  private drawLine(line: Line, box: Box, align: Align, d: Defaults, lh: number, marker?: Marker) {
    const maxSize = line.toks.reduce((m, t) => Math.max(m, t.style.size), 0) || d.size;
    const lead = line.toks.find((t) => t.style.size === maxSize);
    const m = METRICS[lead ? lead.style.group : d.group];
    const lineH = lh * maxSize;
    this.ensureSpace(lineH);
    const top = this.y;
    const baseline = top - (lineH - (m.asc + m.desc) * maxSize) / 2 - m.asc * maxSize;
    if (!this.measuring) {
      let extra = 0;
      if (align === 'justify' && !line.last) {
        const spaces = line.toks.filter((t) => t.space).length;
        if (spaces > 0) extra = (box.width - line.width) / spaces;
      }
      let x = box.x;
      if (align === 'center') x += (box.width - line.width) / 2;
      else if (align === 'right') x += box.width - line.width;
      this.paint(line.toks, x, baseline, extra);
      marker?.(baseline, top, lineH, maxSize);
    }
    this.y -= lineH;
    this.atTop = false;
  }

  private paint(toks: Tok[], startX: number, baseline: number, extra: number) {
    interface Run {
      style: Style;
      x0: number;
      x1: number;
    }
    const runs: Run[] = [];
    const placed: { tok: Tok; x: number }[] = [];
    let x = startX;
    for (const t of toks) {
      const w = t.width + (t.space ? extra : 0);
      placed.push({ tok: t, x });
      const last = runs[runs.length - 1];
      if (last && last.style === t.style) last.x1 = x + w;
      else runs.push({ style: t.style, x0: x, x1: x + w });
      x += w;
    }
    // 1) backgrounds, 2) text, 3) decorations and link annotations
    for (const r of runs) {
      if (!r.style.bg) continue;
      const m = METRICS[r.style.group];
      this.page.drawRectangle({
        x: r.x0,
        y: baseline - m.desc * r.style.size,
        width: r.x1 - r.x0,
        height: (m.asc + m.desc) * r.style.size,
        color: col(r.style.bg),
      });
    }
    for (const { tok, x: tx } of placed) {
      if (tok.space) continue;
      this.page.drawText(tok.text, {
        x: tx,
        y: baseline,
        size: tok.style.size,
        font: this.font(tok.style),
        color: col(tok.style.color),
      });
    }
    for (const r of runs) {
      const s = r.style;
      const thickness = Math.max(0.5, s.size * 0.06);
      if (s.underline) {
        this.page.drawLine({
          start: { x: r.x0, y: baseline - s.size * 0.12 },
          end: { x: r.x1, y: baseline - s.size * 0.12 },
          thickness,
          color: col(s.color),
        });
      }
      if (s.strike) {
        this.page.drawLine({
          start: { x: r.x0, y: baseline + s.size * 0.28 },
          end: { x: r.x1, y: baseline + s.size * 0.28 },
          thickness,
          color: col(s.color),
        });
      }
      if (s.link) {
        const m = METRICS[s.group];
        this.addLink(s.link, r.x0, baseline - m.desc * s.size, r.x1, baseline + m.asc * s.size);
      }
    }
  }

  private addLink(url: string, x0: number, y0: number, x1: number, y1: number) {
    const ref = this.pdf.context.register(
      this.pdf.context.obj({
        Type: 'Annot',
        Subtype: 'Link',
        Rect: [x0, y0, x1, y1],
        Border: [0, 0, 0],
        A: { Type: 'Action', S: 'URI', URI: PDFString.of(url) },
      }),
    );
    const key = PDFName.of('Annots');
    const existing = this.page.node.lookupMaybe(key, PDFArray);
    if (existing) existing.push(ref);
    else this.page.node.set(key, this.pdf.context.obj([ref]));
  }

  // ---------- blocks ----------

  blocks(nodes: PMNode[] | undefined, box: Box, d: Defaults, opts: BlockOpts = {}) {
    let marker = opts.marker;
    for (const n of nodes ?? []) {
      const isText = n.type === 'paragraph' || n.type === 'heading';
      this.block(n, box, d, { ...opts, marker: isText ? marker : undefined });
      if (isText) marker = undefined;
    }
  }

  private baseDefaults(): Defaults {
    return {
      size: TYPE.bodySize,
      bold: false,
      italic: false,
      color: COLOR.text,
      group: 'sans',
      lineHeight: TYPE.lineHeight,
      after: TYPE.paragraphAfter,
    };
  }

  private block(node: PMNode, box: Box, d: Defaults, opts: BlockOpts) {
    switch (node.type) {
      case 'paragraph':
        return this.paragraph(node, box, d, opts);
      case 'heading':
        return this.heading(node, box, d, opts);
      case 'bulletList':
      case 'orderedList':
      case 'taskList':
        return this.list(node, box, d, opts.depth ?? 0);
      case 'blockquote':
        return this.quote(node, box, d, opts);
      case 'codeBlock':
        return this.codeBlock(node, box);
      case 'horizontalRule':
        return this.rule(box);
      case 'pageBreak':
        if (!this.atTop) this.newPage();
        return undefined;
      case 'image':
        return this.image(node, box, d);
      case 'table':
        return this.table(node, box, d);
      default:
        return node.content ? this.blocks(node.content, box, d, opts) : undefined;
    }
  }

  private alignOf(node: PMNode): Align {
    const a = node.attrs?.textAlign;
    return a === 'center' || a === 'right' || a === 'justify' ? a : 'left';
  }

  private textBlock(
    node: PMNode,
    box: Box,
    d: Defaults,
    opts: BlockOpts,
    extra: { before?: number; keepNext?: boolean } = {},
  ) {
    const a = node.attrs ?? {};
    const lh = num(a.lineHeight) ?? d.lineHeight;
    const after = num(a.spaceAfter) ?? opts.afterOverride ?? d.after;
    const indent = (num(a.indent) ?? 0) * TYPE.indentPt;
    const inner: Box = { x: box.x + indent, width: Math.max(40, box.width - indent) };
    const lines = this.flow(this.tokens(node.content, d), inner.width);
    const firstH = lh * (lines[0].toks.reduce((m, t) => Math.max(m, t.style.size), 0) || d.size);

    this.applyMargin(extra.before ?? 0);
    if (extra.keepNext) this.ensureSpace(firstH + 36);
    lines.forEach((line, i) => this.drawLine(line, inner, this.alignOf(node), d, lh, i === 0 ? opts.marker : undefined));
    this.pending = after;
  }

  private paragraph(node: PMNode, box: Box, d: Defaults, opts: BlockOpts) {
    const ds = str(node.attrs?.docStyle);
    if (ds === 'title') {
      const t: Defaults = { ...d, size: TYPE.title.size, bold: true, color: COLOR.heading, lineHeight: 1.2, after: TYPE.title.after };
      return this.textBlock(node, box, t, opts);
    }
    if (ds === 'subtitle') {
      const t: Defaults = { ...d, size: TYPE.subtitle.size, color: COLOR.muted, lineHeight: 1.35, after: TYPE.subtitle.after };
      return this.textBlock(node, box, t, opts);
    }
    return this.textBlock(node, box, d, opts);
  }

  private heading(node: PMNode, box: Box, d: Defaults, opts: BlockOpts) {
    const level = Math.min(6, Math.max(1, num(node.attrs?.level) ?? 1));
    const h = TYPE.headings[level];
    const t: Defaults = { ...d, size: h.size, bold: true, color: COLOR.heading, lineHeight: TYPE.headingLineHeight, after: h.after };
    this.textBlock(node, box, t, opts, { before: h.before, keepNext: true });
  }

  private list(node: PMNode, box: Box, d: Defaults, depth: number) {
    const markerW = node.type === 'orderedList' ? 24 : 20;
    const inner: Box = { x: box.x + markerW, width: box.width - markerW };
    const start = Math.max(1, num(node.attrs?.start) ?? 1);
    (node.content ?? []).forEach((item, idx) => {
      const marker = this.makeMarker(node.type, depth, start + idx, item.attrs?.checked === true, box.x, markerW, d);
      let first = true;
      for (const child of item.content ?? []) {
        const isText = child.type === 'paragraph' || child.type === 'heading';
        this.block(child, inner, d, {
          afterOverride: 3,
          depth: depth + 1,
          marker: first && isText ? marker : undefined,
        });
        first = false;
      }
      // an empty item still needs a marker line
      if ((item.content ?? []).length === 0) this.textBlock({ type: 'paragraph' }, inner, d, { marker, afterOverride: 3 });
    });
    if (depth === 0) this.pending = Math.max(this.pending, TYPE.paragraphAfter);
  }

  private makeMarker(kind: string, depth: number, n: number, checked: boolean, x: number, markerW: number, d: Defaults): Marker {
    return (baseline, _top, _lineH, size) => {
      const cy = baseline + size * 0.32;
      if (kind === 'bulletList') {
        const cx = x + 6;
        const lvl = depth % 3;
        if (lvl === 0) this.page.drawCircle({ x: cx, y: cy, size: 2.1, color: col(d.color) });
        else if (lvl === 1) this.page.drawCircle({ x: cx, y: cy, size: 2.1, borderColor: col(d.color), borderWidth: 0.8 });
        else this.page.drawRectangle({ x: cx - 2, y: cy - 2, width: 4, height: 4, color: col(d.color) });
      } else if (kind === 'orderedList') {
        const label = `${formatOrdinal(n, depth)}.`;
        const font = this.font({ group: 'sans', bold: false, italic: false });
        const w = font.widthOfTextAtSize(label, size);
        this.page.drawText(label, { x: x + markerW - 5 - w, y: baseline, size, font, color: col(d.color) });
      } else {
        const s = Math.max(8, size * 0.8);
        const bx = x + 2;
        const by = baseline - size * 0.05;
        this.page.drawRectangle({
          x: bx,
          y: by,
          width: s,
          height: s,
          color: checked ? col(COLOR.accent) : undefined,
          borderColor: col(checked ? COLOR.accent : COLOR.muted),
          borderWidth: 0.9,
        });
        if (checked) {
          const white = rgb(1, 1, 1);
          this.page.drawLine({ start: { x: bx + s * 0.22, y: by + s * 0.5 }, end: { x: bx + s * 0.43, y: by + s * 0.27 }, thickness: 1.2, color: white });
          this.page.drawLine({ start: { x: bx + s * 0.43, y: by + s * 0.27 }, end: { x: bx + s * 0.78, y: by + s * 0.74 }, thickness: 1.2, color: white });
        }
      }
    };
  }

  private quote(node: PMNode, box: Box, d: Defaults, opts: BlockOpts) {
    const inset = 16;
    this.applyMargin(2);
    const span = { x: box.x + 1, w: 2.5, color: COLOR.rule, startY: this.y };
    this.spans.push(span);
    const inner: Box = { x: box.x + inset, width: box.width - inset };
    this.blocks(node.content, inner, { ...d, italic: true, color: COLOR.quote }, { ...opts, marker: undefined });
    this.closeSpans(this.y);
    this.spans = this.spans.filter((s) => s !== span);
    this.pending = Math.max(this.pending, TYPE.paragraphAfter);
  }

  private codeBlock(node: PMNode, box: Box) {
    const size = 9.5;
    const pad = 8;
    const lineH = size * 1.45;
    const font = this.font({ group: 'mono', bold: false, italic: false });
    const charW = font.widthOfTextAtSize('M', size);
    const perLine = Math.max(10, Math.floor((box.width - pad * 2) / charW));
    const raw = (node.content ?? []).map((c) => c.text ?? '').join('');
    const lines: string[] = [];
    for (const l of raw.split(/\r?\n/).map(toWinAnsi)) {
      if (l.length === 0) lines.push('');
      for (let i = 0; i < l.length; i += perLine) lines.push(l.slice(i, i + perLine));
    }
    this.applyMargin(4);
    let i = 0;
    while (i < lines.length) {
      if (!this.measuring && !this.noBreak && !this.atTop && this.y - (lineH + pad * 2) < this.bottom) this.newPage();
      const room = this.measuring || this.noBreak ? lines.length : Math.max(1, Math.floor((this.y - this.bottom - pad * 2) / lineH));
      const chunk = lines.slice(i, i + room);
      const h = chunk.length * lineH + pad * 2;
      if (!this.measuring) {
        this.page.drawRectangle({ x: box.x, y: this.y - h, width: box.width, height: h, color: col(COLOR.codeBg) });
        chunk.forEach((l, k) => {
          if (l) {
            this.page.drawText(l, {
              x: box.x + pad,
              y: this.y - pad - k * lineH - size * 0.95,
              size,
              font,
              color: col(COLOR.text),
            });
          }
        });
      }
      this.y -= h;
      this.atTop = false;
      i += chunk.length;
      if (i < lines.length) this.newPage();
    }
    this.pending = TYPE.paragraphAfter;
  }

  private rule(box: Box) {
    this.applyMargin(10);
    this.ensureSpace(2);
    if (!this.measuring) {
      this.page.drawLine({ start: { x: box.x, y: this.y }, end: { x: box.x + box.width, y: this.y }, thickness: 0.75, color: col(COLOR.rule) });
    }
    this.y -= 1;
    this.atTop = false;
    this.pending = 10;
  }

  private image(node: PMNode, box: Box, d: Defaults) {
    const src = str(node.attrs?.src);
    const info = src ? this.images.get(src) ?? null : null;
    if (!info || !src || (info.kind !== 'png' && info.kind !== 'jpg')) {
      const note: PMNode = { type: 'paragraph', content: [{ type: 'text', text: '[Image could not be embedded]' }] };
      return this.textBlock(note, box, { ...d, italic: true, color: COLOR.muted }, {});
    }
    const pct = num(node.attrs?.width);
    let w = pct ? (box.width * Math.min(100, Math.max(5, pct))) / 100 : Math.min(info.width * 0.75, box.width);
    w = Math.min(w, box.width);
    let h = (w * info.height) / info.width;
    const maxH = this.pageH - this.margin * 2 - 24;
    if (h > maxH) {
      w *= maxH / h;
      h = maxH;
    }
    this.applyMargin(6);
    this.ensureSpace(h);
    const img = this.imageCache.get(src);
    if (!this.measuring && img) {
      const align = str(node.attrs?.align);
      const x = align === 'center' ? box.x + (box.width - w) / 2 : align === 'right' ? box.x + box.width - w : box.x;
      this.page.drawImage(img, { x, y: this.y - h, width: w, height: h });
    }
    this.y -= h;
    this.atTop = false;
    this.pending = TYPE.paragraphAfter;
  }

  private table(node: PMNode, box: Box, d: Defaults) {
    const grid = layoutGrid(node);
    const colW = grid.ratios.map((r) => r * box.width);
    const colX = colW.map((_, i) => box.x + colW.slice(0, i).reduce((a, b) => a + b, 0));
    const pad = 5;
    const fullH = this.pageH - this.margin * 2;
    const border = col(hexToRgb('CBD0D8'));
    this.applyMargin(6);

    for (const row of grid.rows) {
      const cells = row.cells.map((c) => {
        let w = 0;
        for (let k = 0; k < c.span; k += 1) w += colW[c.col + k] ?? 0;
        const header = c.node.type === 'tableHeader';
        const cd: Defaults = { ...d, bold: header || d.bold, after: 2 };
        const cbox: Box = { x: colX[c.col] + pad, width: Math.max(20, w - pad * 2) };
        const h = this.measure(() => this.blocks(c.node.content, cbox, cd, { afterOverride: 2 }));
        return { c, w, header, cd, cbox, h };
      });
      const rowH = Math.max(20, ...cells.map((x) => x.h + pad * 2));

      if (rowH > fullH) {
        // Oversized row: fall back to stacking the cell contents so nothing is lost.
        for (const x of cells) this.blocks(x.c.node.content, box, x.cd, { afterOverride: 4 });
        continue;
      }
      this.ensureSpace(rowH);
      const rowTop = this.y;
      if (!this.measuring) {
        for (const x of cells) {
          this.page.drawRectangle({
            x: colX[x.c.col],
            y: rowTop - rowH,
            width: x.w,
            height: rowH,
            color: x.header ? col(COLOR.tableHead) : undefined,
            borderColor: border,
            borderWidth: 0.6,
          });
        }
        for (const ci of row.placeholders) {
          this.page.drawRectangle({ x: colX[ci], y: rowTop - rowH, width: colW[ci], height: rowH, borderColor: border, borderWidth: 0.6 });
        }
      }
      for (const x of cells) {
        this.y = rowTop - pad;
        this.atTop = true;
        this.noBreak += 1;
        try {
          this.blocks(x.c.node.content, x.cbox, x.cd, { afterOverride: 2 });
        } finally {
          this.noBreak -= 1;
        }
      }
      this.y = rowTop - rowH;
      this.atTop = false;
      this.pending = 0;
    }
    this.pending = TYPE.paragraphAfter;
  }

  // ---------- finish ----------

  async finish(): Promise<Buffer> {
    if (this.settings.pageNumbers) {
      const font = this.font({ group: 'sans', bold: false, italic: false });
      this.pdf.getPages().forEach((p, i) => {
        const label = String(i + 1);
        const w = font.widthOfTextAtSize(label, 9);
        p.drawText(label, { x: (this.pageW - w) / 2, y: this.margin / 2 - 3, size: 9, font, color: col(COLOR.muted) });
      });
    }
    return Buffer.from(await this.pdf.save());
  }

  async embedAll(doc: PMNode) {
    // Images are embedded lazily while drawing; pre-embedding keeps drawing synchronous.
    const seen = new Set<string>();
    const walk = async (n: PMNode) => {
      if (n.type === 'image') {
        const src = str(n.attrs?.src);
        const info = src ? this.images.get(src) : null;
        if (src && info && !seen.has(src) && (info.kind === 'png' || info.kind === 'jpg')) {
          seen.add(src);
          // pdf-lib reads the underlying ArrayBuffer, so hand it a standalone copy (Node Buffers are pooled).
          const bytes = new Uint8Array(info.data);
          this.imageCache.set(src, info.kind === 'png' ? await this.pdf.embedPng(bytes) : await this.pdf.embedJpg(bytes));
        }
      }
      for (const c of n.content ?? []) await walk(c);
    };
    await walk(doc);
  }

  render(doc: PMNode) {
    this.blocks(doc.content, this.contentBox, this.baseDefaults());
  }
}

function formatOrdinal(n: number, depth: number): string {
  const kind = depth % 3;
  if (kind === 0) return String(n);
  if (kind === 1) {
    let s = '';
    let v = n;
    while (v > 0) {
      s = String.fromCharCode(97 + ((v - 1) % 26)) + s;
      v = Math.floor((v - 1) / 26);
    }
    return s;
  }
  const map: [number, string][] = [[1000, 'm'], [900, 'cm'], [500, 'd'], [400, 'cd'], [100, 'c'], [90, 'xc'], [50, 'l'], [40, 'xl'], [10, 'x'], [9, 'ix'], [5, 'v'], [4, 'iv'], [1, 'i']];
  let out = '';
  let v = n;
  for (const [val, sym] of map) {
    while (v >= val) {
      out += sym;
      v -= val;
    }
  }
  return out;
}

export interface PdfOptions {
  title?: string;
  settings?: Partial<DocSettings>;
  images?: Map<string, ResolvedImage | null>;
}

export async function exportPdf(doc: PMNode, options: PdfOptions = {}): Promise<Buffer> {
  const settings: DocSettings = { ...DEFAULT_SETTINGS, ...options.settings };
  const images = options.images ?? new Map();
  const r = await Renderer.create(settings, images, options.title ?? 'Untitled document');
  await r.embedAll(doc);
  r.render(doc);
  return r.finish();
}
