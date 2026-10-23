import type { PMMark, PMNode } from '../../src/lib/types';
import { SAMPLE_JPG, SAMPLE_PNG } from './sample-images';

const t = (text: string, ...marks: PMMark[]): PMNode => ({ type: 'text', text, ...(marks.length ? { marks } : {}) });
const para = (content: PMNode[], attrs?: Record<string, unknown>): PMNode => ({ type: 'paragraph', ...(attrs ? { attrs } : {}), content });
const head = (level: number, text: string): PMNode => ({ type: 'heading', attrs: { level }, content: [t(text)] });
const li = (...blocks: PMNode[]): PMNode => ({ type: 'listItem', content: blocks });
const cell = (text: string, attrs: Record<string, unknown> = {}, type = 'tableCell'): PMNode => ({
  type,
  attrs: { colspan: 1, rowspan: 1, colwidth: null, ...attrs },
  content: [para([t(text)])],
});

const bold: PMMark = { type: 'bold' };
const italic: PMMark = { type: 'italic' };
const underline: PMMark = { type: 'underline' };
const strike: PMMark = { type: 'strike' };
const color = (c: string): PMMark => ({ type: 'textStyle', attrs: { color: c } });
const size = (s: string): PMMark => ({ type: 'textStyle', attrs: { fontSize: s } });
const family = (f: string): PMMark => ({ type: 'textStyle', attrs: { fontFamily: f } });
const highlight = (c: string): PMMark => ({ type: 'highlight', attrs: { color: c } });
const link = (href: string): PMMark => ({ type: 'link', attrs: { href } });

export const kitchenSink: PMNode = {
  type: 'doc',
  content: [
    para([t('Folio export test document')], { docStyle: 'title' }),
    para([t('Every formatting feature in one place')], { docStyle: 'subtitle' }),
    head(1, 'Heading 1: Inline formatting'),
    para([
      t('Plain text, '),
      t('bold', bold),
      t(', '),
      t('italic', italic),
      t(', '),
      t('underlined', underline),
      t(', '),
      t('struck through', strike),
      t(', and '),
      t('all at once', bold, italic, underline),
      t('.'),
    ]),
    para([
      t('Red text', color('#DC2626')),
      t(', '),
      t('highlighted text', highlight('#FDE68A')),
      t(', '),
      t('large 18pt text', size('18pt')),
      t(', '),
      t('Georgia serif', family("Georgia, 'Times New Roman', serif")),
      t(', '),
      t('Courier mono', family("'Courier New', Courier, monospace")),
      t(' and a link to '),
      t('Anthropic', link('https://www.anthropic.com')),
      t(' plus another to '),
      t('Example', link('https://example.com'), bold),
      t('.'),
    ]),
    head(2, 'Heading 2: Alignment and spacing'),
    para([t('Centered paragraph.')], { textAlign: 'center' }),
    para([t('Right-aligned paragraph.')], { textAlign: 'right' }),
    para(
      [
        t(
          'Justified paragraph. Folio keeps paragraph alignment, spacing and line height when it exports, so long runs of text wrap neatly and stay aligned to both margins in the PDF and in Word. This sentence exists to make the paragraph long enough to wrap across several lines.',
        ),
      ],
      { textAlign: 'justify' },
    ),
    para([t('Indented two levels with double line spacing and extra space after.')], { indent: 2, lineHeight: 2, spaceAfter: 20 }),
    head(3, 'Heading 3: Lists'),
    { type: 'bulletList', content: [li(para([t('Bullet one')])), li(para([t('Bullet two')]), { type: 'bulletList', content: [li(para([t('Nested bullet')])), li(para([t('Another nested bullet')]), { type: 'orderedList', attrs: { start: 1 }, content: [li(para([t('Deep numbered')]))] })] }), li(para([t('Bullet three')]))] },
    { type: 'orderedList', attrs: { start: 1 }, content: [li(para([t('First step')])), li(para([t('Second step')]), { type: 'orderedList', attrs: { start: 1 }, content: [li(para([t('Sub-step a')])), li(para([t('Sub-step b')]))] }), li(para([t('Third step')]))] },
    { type: 'orderedList', attrs: { start: 5 }, content: [li(para([t('Starts at five')])), li(para([t('Then six')]))] },
    { type: 'taskList', content: [{ type: 'taskItem', attrs: { checked: true }, content: [para([t('Done task')])] }, { type: 'taskItem', attrs: { checked: false }, content: [para([t('Open task')])] }] },
    head(4, 'Heading 4: Quote, code and rules'),
    { type: 'blockquote', content: [para([t('“Write beautifully. Organize effortlessly.”')]), para([t('A second quoted paragraph.')])] },
    { type: 'codeBlock', content: [t('function greet(name) {\n  return `Hello, ${name}!`;\n}\n\nconsole.log(greet("Folio"));')] },
    { type: 'horizontalRule' },
    head(2, 'Tables'),
    {
      type: 'table',
      content: [
        { type: 'tableRow', content: [cell('Region', {}, 'tableHeader'), cell('Q1', {}, 'tableHeader'), cell('Q2', {}, 'tableHeader'), cell('Total', {}, 'tableHeader')] },
        { type: 'tableRow', content: [cell('North'), cell('120'), cell('150'), cell('270')] },
        { type: 'tableRow', content: [cell('South'), cell('Combined across both quarters', { colspan: 2 }), cell('310')] },
        { type: 'tableRow', content: [cell('Tall cell', { rowspan: 2 }), cell('90'), cell('95'), cell('185')] },
        { type: 'tableRow', content: [cell('70'), cell('85'), cell('155')] },
      ],
    },
    head(2, 'Images'),
    { type: 'image', attrs: { src: SAMPLE_PNG, alt: 'Gradient PNG', width: 60, align: 'center' } },
    { type: 'image', attrs: { src: SAMPLE_JPG, alt: 'Gradient JPEG' } },
    { type: 'pageBreak' },
    head(1, 'Content after a page break'),
    para([t('This paragraph must start on a new page in both the PDF and the DOCX.')]),
    para([t('Special characters: café, naïve, “curly quotes”, an em dash — and a euro sign €.')]),
  ],
};

const SENTENCE = 'Folio autosaves every change and keeps formatting intact, so you can focus on the words rather than the file. ';

export const longDocument: PMNode = (() => {
  const content: PMNode[] = [para([t('A long document for pagination')], { docStyle: 'title' })];
  for (let s = 1; s <= 8; s += 1) {
    content.push(head(1, `Section ${s}`));
    for (let i = 0; i < 4; i += 1) content.push(para([t(SENTENCE.repeat(5 + ((s + i) % 3)))], { textAlign: i % 2 ? 'justify' : 'left' }));
    content.push({ type: 'bulletList', content: Array.from({ length: 5 }, (_, k) => li(para([t(`List item ${k + 1} in section ${s}: ${SENTENCE}`)]))) });
    if (s % 2 === 0) {
      content.push({
        type: 'table',
        content: Array.from({ length: 8 }, (_, r) => ({
          type: 'tableRow',
          content: [cell(r === 0 ? 'Item' : `Row ${r}`, {}, r === 0 ? 'tableHeader' : 'tableCell'), cell(r === 0 ? 'Notes' : SENTENCE, {}, r === 0 ? 'tableHeader' : 'tableCell')],
        })),
      });
    }
  }
  return { type: 'doc', content };
})();
