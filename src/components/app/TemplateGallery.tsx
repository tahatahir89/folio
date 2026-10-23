'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { TEMPLATES, TEMPLATE_CATEGORIES, type TemplateCategory } from '@/lib/templates/data';
import { cn } from '@/lib/utils';
import { DocPreview } from './DocPreview';
import { useCreateDocument } from './NewDocumentDialog';

export function TemplateGallery() {
  const [category, setCategory] = useState<TemplateCategory | 'All'>('All');
  const { create, creating } = useCreateDocument();
  const list = TEMPLATES.filter((t) => category === 'All' || t.category === category);

  return (
    <div>
      <div role="tablist" aria-label="Template categories" className="mb-6 flex flex-wrap gap-2">
        {(['All', ...TEMPLATE_CATEGORIES] as const).map((c) => (
          <button
            key={c}
            type="button"
            role="tab"
            aria-selected={category === c}
            onClick={() => setCategory(c)}
            className={cn(
              'rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              category === c ? 'border-primary bg-primary text-primary-foreground' : 'bg-background hover:bg-muted',
            )}
          >
            {c}
          </button>
        ))}
      </div>
      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {list.map((t) => (
          <li key={t.id}>
            <button
              type="button"
              disabled={!!creating}
              onClick={() => void create(t.id)}
              className="group w-full text-left focus-visible:outline-none disabled:opacity-70"
              aria-label={`Use the ${t.name} template`}
            >
              <div className="relative overflow-hidden rounded-lg border bg-white shadow-soft transition-all group-hover:-translate-y-0.5 group-hover:shadow-pop group-focus-visible:ring-2 group-focus-visible:ring-ring">
                <DocPreview content={t.content} />
                <div className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-foreground/35 via-transparent to-transparent pb-4 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                  <span className="rounded-md bg-background px-3 py-1.5 text-sm font-medium shadow-pop">Use this template</span>
                </div>
                {creating === t.id && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/70">
                    <Loader2 className="size-6 animate-spin text-primary" />
                  </div>
                )}
              </div>
              <div className="mt-3 px-0.5">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold">{t.name}</h3>
                  <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">{t.category}</span>
                </div>
                <p className="mt-0.5 text-[13px] leading-snug text-muted-foreground">{t.description}</p>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
