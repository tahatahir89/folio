'use client';

import { useEffect, useRef, useState } from 'react';
import { generateHTML } from '@tiptap/html';
import type { JSONContent } from '@tiptap/core';
import { getExtensions } from '@/lib/editor/extensions';
import type { PMNode } from '@/lib/types';
import { cn } from '@/lib/utils';

const extensions = getExtensions({ interactive: false });

/** A miniature, non-interactive rendering of a document, drawn with the same schema as the editor. */
export function DocPreview({ content, className }: { content: PMNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.3);
  const [html, setHtml] = useState('');

  useEffect(() => {
    try {
      setHtml(generateHTML(content as unknown as JSONContent, extensions));
    } catch {
      setHtml('');
    }
  }, [content]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setScale(entry.contentRect.width / 794));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={ref} aria-hidden className={cn('relative aspect-[794/1123] w-full overflow-hidden bg-white', className)}>
      <div
        className="folio-prose folio-prose--static absolute left-0 top-0 origin-top-left"
        style={{ width: 794, padding: 64, transform: `scale(${scale})` }}
        // Content comes from Folio's own template data, never from user input.
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
