/**
 * Export test harness. Exports REAL formatted documents (every template + a kitchen-sink
 * document using every feature) to PDF and DOCX, then verifies the files.
 *
 *   npm run test:exports
 *
 * Output files are written to ./export-test-output so you can open them in Word / a PDF viewer.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import JSZip from 'jszip';
import { exportDocx } from '../src/lib/export/docx';
import { exportPdf } from '../src/lib/export/pdf';
import { resolveImages } from '../src/lib/export/images';
import { TEMPLATES } from '../src/lib/templates/data';
import { kitchenSink, longDocument } from './fixtures/kitchen-sink';
import type { PMNode } from '../src/lib/types';

const OUT = join(process.cwd(), 'export-test-output');
mkdirSync(OUT, { recursive: true });

let failures = 0;
const check = (ok: boolean, label: string) => {
  console.log(`${ok ? '  PASS' : '  FAIL'}  ${label}`);
  if (!ok) failures += 1;
};

/** First reasonably long text node, used to confirm real content made it into the file. */
function firstText(n: PMNode): string | null {
  if (n.type === 'text' && (n.text ?? '').trim().length >= 8) return (n.text ?? '').trim();
  for (const c of n.content ?? []) {
    const found = firstText(c);
    if (found) return found;
  }
  return null;
}

async function pdfInfo(buf: Buffer) {
  // pdfjs-dist is a devDependency used only to read exported files back.
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const task = pdfjs.getDocument({ data: new Uint8Array(buf), useSystemFonts: true, verbosity: 0 });
  const pdf = await task.promise;
  let text = '';
  let links = 0;
  for (let i = 1; i <= pdf.numPages; i += 1) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((it) => ('str' in it ? it.str : '')).join(' ') + '\n';
    links += (await page.getAnnotations()).filter((a) => a.subtype === 'Link').length;
  }
  return { pages: pdf.numPages, text, links };
}

async function main() {
  const docs: { name: string; title: string; doc: PMNode; settings?: Record<string, unknown> }[] = [
    { name: 'kitchen-sink', title: 'Kitchen sink', doc: kitchenSink },
    { name: 'long-document', title: 'Long document', doc: longDocument },
    ...TEMPLATES.map((t) => ({ name: `template-${t.id}`, title: t.title, doc: t.content, settings: t.settings })),
  ];

  for (const d of docs) {
    console.log(`\n${d.name}`);
    const images = await resolveImages(d.doc);

    // ---- PDF ----
    const pdf = await exportPdf(d.doc, { title: d.title, settings: d.settings, images });
    writeFileSync(join(OUT, `${d.name}.pdf`), pdf);
    check(pdf.subarray(0, 5).toString() === '%PDF-', 'PDF has a valid header');
    check(pdf.subarray(-32).toString().includes('%%EOF'), 'PDF is complete (EOF marker)');
    const info = await pdfInfo(pdf);
    const sample = firstText(d.doc);
    if (sample) {
      const probe = sample.slice(0, 12).replace(/\s+/g, ' ');
      check(info.text.replace(/\s+/g, ' ').includes(probe), `PDF text contains "${probe}"`);
    }
    if (d.name === 'kitchen-sink') check(info.links >= 2, `PDF contains clickable links (${info.links})`);
    if (d.name === 'long-document') check(info.pages >= 4, `long document paginates (${info.pages} pages)`);

    // ---- DOCX ----
    const docx = await exportDocx(d.doc, { title: d.title, settings: d.settings, images });
    writeFileSync(join(OUT, `${d.name}.docx`), docx);
    check(docx[0] === 0x50 && docx[1] === 0x4b, 'DOCX is a real ZIP container (PK header)');
    const zip = await JSZip.loadAsync(docx);
    check(!!zip.file('word/document.xml') && !!zip.file('[Content_Types].xml'), 'DOCX contains word/document.xml');
    const xml = await zip.file('word/document.xml')!.async('string');
    if (d.name === 'kitchen-sink') {
      check(/<w:pStyle w:val="Heading1"/.test(xml), 'DOCX has Heading 1 paragraphs');
      check(/<w:b\/>|<w:b w:val/.test(xml), 'DOCX has bold runs');
      check(/<w:i\/>|<w:i w:val/.test(xml), 'DOCX has italic runs');
      check(/<w:u w:val="single"/.test(xml), 'DOCX has underlined runs');
      check(/<w:strike/.test(xml), 'DOCX has strikethrough runs');
      check(/<w:color w:val="DC2626"/i.test(xml), 'DOCX preserves text colour');
      check(/w:fill="FDE68A"/i.test(xml), 'DOCX preserves highlight (shading)');
      check(/<w:sz w:val="36"/.test(xml), 'DOCX preserves font size (18pt)');
      check(/<w:rFonts w:ascii="Georgia"/.test(xml), 'DOCX preserves font family');
      check(/<w:hyperlink/.test(xml), 'DOCX has hyperlinks');
      check(/<w:tbl>/.test(xml) && /<w:gridSpan/.test(xml), 'DOCX has tables with merged cells');
      check(/<w:numPr>/.test(xml), 'DOCX has list numbering');
      check(/<w:jc w:val="center"/.test(xml) && /<w:jc w:val="both"/.test(xml), 'DOCX preserves alignment');
      check(/<w:drawing>/.test(xml), 'DOCX embeds images');
      check(/<w:br w:type="page"/.test(xml), 'DOCX has page breaks');
    }
  }

  console.log(failures === 0 ? '\nAll export checks passed.' : `\n${failures} check(s) FAILED.`);
  console.log(`Open the files in ${OUT} to inspect them visually.`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
