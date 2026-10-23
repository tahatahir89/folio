import {
  AlignmentType,
  BorderStyle,
  Document,
  ExternalHyperlink,
  Footer,
  HeadingLevel,
  ImageRun,
  LevelFormat,
  LineRuleType,
  PageBreak,
  PageNumber,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableLayoutType,
  TableRow,
  TextRun,
  UnderlineType,
  WidthType,
} from 'docx';
import type { DocSettings, PMNode } from '../types';
import {
  DEFAULT_SETTINGS,
  MARGIN_PT,
  PAGE,
  TYPE,
  docxFontName,
  layoutGrid,
  num,
  resolveRunStyle,
  str,
} from './common';
import type { ResolvedImage } from './images';

type Child = Paragraph | Table;
type Inline = TextRun | ExternalHyperlink | ImageRun;

const TWIPS_PER_PT = 20;
const TWIPS_PER_PX = 15;
const WORD_LINE_FACTOR = 1.15; // CSS multiplier -> Word "auto" line multiple

const HEADING_LEVELS = [
  HeadingLevel.HEADING_1,
  HeadingLevel.HEADING_2,
  HeadingLevel.HEADING_3,
  HeadingLevel.HEADING_4,
  HeadingLevel.HEADING_5,
  HeadingLevel.HEADING_6,
];

interface Ctx {
  /** Available content width in twips. */
  width: number;
  quote: boolean;
  depth: number;
  tableCell: boolean;
  /** Header cells render bold by default. */
  bold?: boolean;
}

interface NumberingLevel {
  level: number;
  format: (typeof LevelFormat)[keyof typeof LevelFormat];
  text: string;
  alignment: (typeof AlignmentType)[keyof typeof AlignmentType];
  start?: number;
  style: { paragraph: { indent: { left: number; hanging: number } } };
}

const ORDERED_FORMATS = [LevelFormat.DECIMAL, LevelFormat.LOWER_LETTER, LevelFormat.LOWER_ROMAN];
const BULLET_CHARS = ['\u2022', '\u25E6', '\u25AA'];

function levels(kind: 'bullet' | 'ordered', start = 1): NumberingLevel[] {
  return Array.from({ length: 9 }, (_, level) => ({
    level,
    format: kind === 'bullet' ? LevelFormat.BULLET : ORDERED_FORMATS[level % 3],
    text: kind === 'bullet' ? BULLET_CHARS[level % 3] : `%${level + 1}.`,
    alignment: AlignmentType.LEFT,
    ...(kind === 'ordered' && level === 0 ? { start } : {}),
    style: { paragraph: { indent: { left: 720 * (level + 1), hanging: 360 } } },
  }));
}

function alignmentOf(v: unknown) {
  switch (v) {
    case 'center':
      return AlignmentType.CENTER;
    case 'right':
      return AlignmentType.RIGHT;
    case 'justify':
      return AlignmentType.JUSTIFIED;
    default:
      return undefined;
  }
}

class DocxBuilder {
  readonly numbering: { reference: string; levels: NumberingLevel[] }[] = [
    { reference: 'folio-bullets', levels: levels('bullet') },
  ];
  private orderedCount = 0;

  constructor(private readonly images: Map<string, ResolvedImage | null>) {}

  // ---------- inline ----------

  inlines(nodes: PMNode[] | undefined, ctx: Ctx, defaults: { bold?: boolean; italics?: boolean; size?: number; color?: string } = {}): Inline[] {
    const out: Inline[] = [];
    for (const node of nodes ?? []) {
      if (node.type === 'hardBreak') {
        out.push(new TextRun({ break: 1 }));
        continue;
      }
      if (node.type !== 'text' || !node.text) continue;
      const s = resolveRunStyle(node.marks);
      const font = s.code ? 'Courier New' : docxFontName(s.family) ?? undefined;
      const bold = s.bold ?? defaults.bold;
      const color = s.color ?? (s.link ? TYPE.linkColor : defaults.color);
      const size = s.sizePt ?? (s.code ? TYPE.bodySize * 0.9 : defaults.size);
      const fill = s.background ?? (s.code ? TYPE.codeBg : undefined);
      const run = new TextRun({
        text: node.text,
        bold: bold || undefined,
        italics: s.italic || defaults.italics || ctx.quote || undefined,
        underline: s.underline || s.link ? { type: UnderlineType.SINGLE } : undefined,
        strike: s.strike || undefined,
        color,
        size: size ? Math.round(size * 2) : undefined,
        font,
        shading: fill ? { type: ShadingType.CLEAR, fill, color: 'auto' } : undefined,
      });
      out.push(s.link ? new ExternalHyperlink({ children: [run], link: s.link }) : run);
    }
    return out;
  }

  // ---------- blocks ----------

  blocks(nodes: PMNode[] | undefined, ctx: Ctx): Child[] {
    const out: Child[] = [];
    for (const node of nodes ?? []) out.push(...this.block(node, ctx));
    return out;
  }

  private spacing(node: PMNode, base: { before?: number; after?: number; line?: number }) {
    const a = node.attrs ?? {};
    const after = num(a.spaceAfter) ?? base.after;
    const lh = num(a.lineHeight) ?? base.line;
    return {
      before: base.before !== undefined ? Math.round(base.before * TWIPS_PER_PT) : undefined,
      after: after !== undefined ? Math.round(after * TWIPS_PER_PT) : undefined,
      line: lh !== undefined ? Math.round((lh / WORD_LINE_FACTOR) * 240) : undefined,
      lineRule: lh !== undefined ? LineRuleType.AUTO : undefined,
    };
  }

  private quoteProps(ctx: Ctx) {
    return ctx.quote
      ? {
          border: { left: { style: BorderStyle.SINGLE, size: 18, color: 'C7CAD1', space: 10 } },
          indentLeft: 360,
        }
      : { border: undefined, indentLeft: 0 };
  }

  private textBlock(
    node: PMNode,
    ctx: Ctx,
    opts: {
      heading?: (typeof HeadingLevel)[keyof typeof HeadingLevel];
      style?: string;
      base: { before?: number; after?: number; line?: number };
      defaults?: { bold?: boolean; italics?: boolean; size?: number; color?: string };
      numbering?: { reference: string; level: number };
      prefix?: Inline[];
      indentLeft?: number;
      hanging?: number;
    },
  ): Paragraph {
    const q = this.quoteProps(ctx);
    const own = (num(node.attrs?.indent) ?? 0) * 720;
    const left = (opts.indentLeft ?? 0) + own + q.indentLeft;
    return new Paragraph({
      heading: opts.heading,
      style: opts.style,
      alignment: alignmentOf(node.attrs?.textAlign),
      spacing: this.spacing(node, opts.base),
      numbering: opts.numbering,
      border: q.border,
      keepNext: opts.heading ? true : undefined,
      indent:
        left > 0 || opts.hanging
          ? { left: left || undefined, hanging: opts.hanging }
          : undefined,
      children: [...(opts.prefix ?? []), ...this.inlines(node.content, ctx, opts.defaults)],
    });
  }

  private block(node: PMNode, ctx: Ctx): Child[] {
    switch (node.type) {
      case 'paragraph': {
        const ds = str(node.attrs?.docStyle);
        if (ds === 'title') {
          return [this.textBlock(node, ctx, { style: 'Title', base: {} })];
        }
        if (ds === 'subtitle') {
          return [this.textBlock(node, ctx, { style: 'Subtitle', base: {} })];
        }
        return [
          this.textBlock(node, ctx, {
            base: { after: ctx.tableCell ? 2 : TYPE.paragraphAfter, line: TYPE.lineHeight },
            defaults: { bold: ctx.bold || undefined, color: ctx.quote ? TYPE.quoteColor : undefined },
          }),
        ];
      }
      case 'heading': {
        const level = Math.min(6, Math.max(1, num(node.attrs?.level) ?? 1));
        return [this.textBlock(node, ctx, { heading: HEADING_LEVELS[level - 1], base: {} })];
      }
      case 'bulletList':
      case 'orderedList':
      case 'taskList':
        return this.list(node, ctx);
      case 'blockquote':
        return this.blocks(node.content, { ...ctx, quote: true });
      case 'codeBlock':
        return this.codeBlock(node);
      case 'horizontalRule':
        return [
          new Paragraph({
            spacing: { before: 120, after: 120 },
            border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: TYPE.ruleColor, space: 1 } },
          }),
        ];
      case 'pageBreak':
        return [new Paragraph({ children: [new PageBreak()] })];
      case 'image':
        return [this.image(node, ctx)];
      case 'table':
        return this.table(node, ctx);
      default:
        return node.content ? this.blocks(node.content, ctx) : [];
    }
  }

  private codeBlock(node: PMNode): Paragraph[] {
    const text = (node.content ?? []).map((c) => c.text ?? '').join('');
    const lines = text.split('\n');
    return lines.map(
      (line, i) =>
        new Paragraph({
          spacing: { before: 0, after: i === lines.length - 1 ? 160 : 0, line: 260, lineRule: LineRuleType.AUTO },
          shading: { type: ShadingType.CLEAR, fill: TYPE.codeBg, color: 'auto' },
          indent: { left: 120, right: 120 },
          children: [new TextRun({ text: line, font: 'Courier New', size: 19 })],
        }),
    );
  }

  private image(node: PMNode, ctx: Ctx): Paragraph {
    const src = str(node.attrs?.src);
    const info = src ? this.images.get(src) ?? null : null;
    if (!info) {
      return new Paragraph({
        children: [new TextRun({ text: '[Image could not be embedded]', italics: true, color: TYPE.mutedColor })],
      });
    }
    const maxPx = Math.max(40, Math.floor(ctx.width / TWIPS_PER_PX));
    const pct = num(node.attrs?.width);
    let w = pct ? (maxPx * Math.min(100, Math.max(5, pct))) / 100 : Math.min(info.width, maxPx);
    w = Math.min(w, maxPx);
    const h = (w * info.height) / info.width;
    const align = str(node.attrs?.align);
    return new Paragraph({
      alignment: align === 'center' ? AlignmentType.CENTER : align === 'right' ? AlignmentType.RIGHT : undefined,
      spacing: { before: 60, after: 160 },
      children: [
        new ImageRun({
          type: info.kind,
          data: info.data,
          transformation: { width: Math.round(w), height: Math.round(h) },
        }),
      ],
    });
  }

  // ---------- lists ----------

  private list(node: PMNode, ctx: Ctx): Child[] {
    const depth = ctx.depth;
    const level = Math.min(depth, 8);
    let reference = 'folio-bullets';
    if (node.type === 'orderedList') {
      this.orderedCount += 1;
      reference = `folio-ol-${this.orderedCount}`;
      const start = Math.max(1, num(node.attrs?.start) ?? 1);
      this.numbering.push({ reference, levels: levels('ordered', start) });
    }
    const out: Child[] = [];
    for (const item of node.content ?? []) {
      let first = true;
      const checked = item.attrs?.checked === true;
      for (const child of item.content ?? []) {
        if (child.type === 'bulletList' || child.type === 'orderedList' || child.type === 'taskList') {
          out.push(...this.list(child, { ...ctx, depth: depth + 1 }));
          continue;
        }
        if ((child.type === 'paragraph' || child.type === 'heading') && first) {
          first = false;
          const base = { after: 3, line: TYPE.lineHeight };
          if (node.type === 'taskList') {
            out.push(
              this.textBlock(child, ctx, {
                base,
                indentLeft: 720 * (depth + 1),
                hanging: 360,
                prefix: [new TextRun({ text: checked ? '\u2611\t' : '\u2610\t', font: 'Segoe UI Symbol' })],
              }),
            );
          } else {
            out.push(this.textBlock(child, ctx, { base, numbering: { reference, level } }));
          }
          continue;
        }
        first = false;
        out.push(...this.block(child, { ...ctx, depth: depth + 1 }));
      }
    }
    return out;
  }

  // ---------- tables ----------

  private table(node: PMNode, ctx: Ctx): Child[] {
    const grid = layoutGrid(node);
    const total = Math.max(1000, ctx.width);
    const colWidths = grid.ratios.map((r) => Math.max(200, Math.floor(r * total)));
    const tableWidth = colWidths.reduce((a, b) => a + b, 0);
    const border = { style: BorderStyle.SINGLE, size: 4, color: 'D1D5DB' };

    const rows = grid.rows.map((row) => {
      const cells = row.cells.map((c) => {
        let w = 0;
        for (let k = 0; k < c.span; k += 1) w += colWidths[c.col + k] ?? 0;
        const isHeader = c.node.type === 'tableHeader';
        const children = this.blocks(c.node.content, {
          width: Math.max(300, w - 240),
          quote: false,
          depth: 0,
          tableCell: true,
          bold: isHeader,
        });
        if (children.length === 0 || children[children.length - 1] instanceof Table) {
          children.push(new Paragraph({}));
        }
        return new TableCell({
          children,
          columnSpan: c.span > 1 ? c.span : undefined,
          rowSpan: c.rowSpan > 1 ? c.rowSpan : undefined,
          width: { size: w, type: WidthType.DXA },
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          shading: isHeader ? { type: ShadingType.CLEAR, fill: 'F3F4F6', color: 'auto' } : undefined,
        });
      });
      return new TableRow({ children: cells, tableHeader: row.cells.every((c) => c.node.type === 'tableHeader') });
    });

    return [
      new Table({
        width: { size: tableWidth, type: WidthType.DXA },
        columnWidths: colWidths,
        layout: TableLayoutType.FIXED,
        rows,
        borders: {
          top: border,
          bottom: border,
          left: border,
          right: border,
          insideHorizontal: border,
          insideVertical: border,
        },
      }),
      new Paragraph({ spacing: { after: 120 } }),
    ];
  }
}

export interface DocxOptions {
  title?: string;
  settings?: Partial<DocSettings>;
  images?: Map<string, ResolvedImage | null>;
}

export async function exportDocx(doc: PMNode, options: DocxOptions = {}): Promise<Buffer> {
  const settings: DocSettings = { ...DEFAULT_SETTINGS, ...options.settings };
  const page = PAGE[settings.pageSize];
  const marginTw = Math.round(MARGIN_PT[settings.margins] * TWIPS_PER_PT);
  const contentWidth = page.wTw - marginTw * 2;

  const builder = new DocxBuilder(options.images ?? new Map());
  const children = builder.blocks(doc.content, { width: contentWidth, quote: false, depth: 0, tableCell: false });
  if (children.length === 0) children.push(new Paragraph({}));

  const h = TYPE.headings;
  const headingStyle = (lvl: number) => ({
    run: { size: h[lvl].size * 2, bold: true, color: TYPE.headingColor },
    paragraph: {
      spacing: {
        before: h[lvl].before * TWIPS_PER_PT,
        after: h[lvl].after * TWIPS_PER_PT,
        line: Math.round((TYPE.headingLineHeight / WORD_LINE_FACTOR) * 240),
        lineRule: LineRuleType.AUTO,
      },
    },
  });

  const document = new Document({
    creator: 'Folio',
    title: options.title ?? 'Untitled document',
    description: 'Created with Folio',
    styles: {
      default: {
        document: {
          run: { font: 'Arial', size: TYPE.bodySize * 2, color: TYPE.textColor },
          paragraph: {
            spacing: { after: TYPE.paragraphAfter * TWIPS_PER_PT, line: Math.round((TYPE.lineHeight / WORD_LINE_FACTOR) * 240) },
          },
        },
        heading1: headingStyle(1),
        heading2: headingStyle(2),
        heading3: headingStyle(3),
        heading4: headingStyle(4),
        heading5: headingStyle(5),
        heading6: headingStyle(6),
        title: {
          run: { size: TYPE.title.size * 2, bold: true, color: TYPE.headingColor },
          paragraph: { spacing: { after: TYPE.title.after * TWIPS_PER_PT } },
        },
      },
      paragraphStyles: [
        {
          id: 'Subtitle',
          name: 'Subtitle',
          basedOn: 'Normal',
          next: 'Normal',
          quickFormat: true,
          run: { size: TYPE.subtitle.size * 2, color: TYPE.mutedColor },
          paragraph: { spacing: { after: TYPE.subtitle.after * TWIPS_PER_PT } },
        },
      ],
    },
    numbering: { config: builder.numbering },
    sections: [
      {
        properties: {
          page: {
            size: { width: page.wTw, height: page.hTw },
            margin: { top: marginTw, right: marginTw, bottom: marginTw, left: marginTw },
          },
        },
        footers: settings.pageNumbers
          ? {
              default: new Footer({
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({ children: [PageNumber.CURRENT], size: 18, color: TYPE.mutedColor })],
                  }),
                ],
              }),
            }
          : undefined,
        children,
      },
    ],
  });

  return Packer.toBuffer(document);
}
