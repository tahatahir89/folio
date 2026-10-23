/** Verifies the server-side document validator accepts real documents and strips unsafe content. */
import { sanitizeDoc, DocValidationError } from '../src/lib/doc-utils';
import { TEMPLATES } from '../src/lib/templates/data';
import { kitchenSink } from './fixtures/kitchen-sink';
import type { PMNode } from '../src/lib/types';

let failures = 0;
const check = (ok: boolean, label: string) => {
  console.log(`${ok ? '  PASS' : '  FAIL'}  ${label}`);
  if (!ok) failures += 1;
};
/** Key-order-independent form; null attributes are equivalent to absent ones. */
const canon = (v: unknown): string =>
  JSON.stringify(v, (_k, val) =>
    val && typeof val === 'object' && !Array.isArray(val)
      ? Object.fromEntries(Object.entries(val).filter(([, x]) => x !== null).sort(([a], [b]) => a.localeCompare(b)))
      : val,
  );
const throws = (fn: () => unknown) => {
  try {
    fn();
    return false;
  } catch (e) {
    return e instanceof DocValidationError;
  }
};

for (const t of TEMPLATES) {
  const clean = sanitizeDoc(t.content);
  check(canon(clean) === canon(t.content), `template "${t.id}" passes unchanged`);
}
const ks = sanitizeDoc(kitchenSink);
check(canon(ks) === canon(kitchenSink), 'kitchen-sink document passes unchanged');

const bad: PMNode = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'click', marks: [{ type: 'link', attrs: { href: 'javascript:alert(1)' } }] },
        { type: 'text', text: 'ok', marks: [{ type: 'link', attrs: { href: 'https://example.com' } }, { type: 'textStyle', attrs: { color: 'red;background:url(x)' , fontSize: '12pt' } }] },
      ],
    },
  ],
};
const cleaned = sanitizeDoc(bad);
const runs = cleaned.content![0].content!;
check(!runs[0].marks, 'javascript: links are dropped (text kept)');
check(runs[1].marks?.some((m) => m.type === 'link') === true, 'https links are kept');
const style = runs[1].marks?.find((m) => m.type === 'textStyle');
check(style?.attrs?.color === undefined && style?.attrs?.fontSize === '12pt', 'unsafe colour value is stripped, valid size kept');

check(throws(() => sanitizeDoc({ type: 'doc', content: [{ type: 'script' }] })), 'unknown node types are rejected');
check(throws(() => sanitizeDoc({ type: 'paragraph' })), 'non-doc roots are rejected');
check(throws(() => sanitizeDoc({ type: 'doc', content: [{ type: 'image', attrs: { src: 'javascript:alert(1)' } }] })), 'unsafe image sources are rejected');
check(throws(() => sanitizeDoc('nope')), 'non-object input is rejected');

console.log(failures === 0 ? '\nAll sanitizer checks passed.' : `\n${failures} check(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
