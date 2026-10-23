'use client';

import Link from 'next/link';
import { DocPreview } from '@/components/app/DocPreview';
import { TEMPLATES } from '@/lib/templates/data';

const PICKS = ['resume', 'business-proposal', 'project-report', 'cover-letter'];

export function TemplatesStrip() {
  const list = PICKS.map((id) => TEMPLATES.find((t) => t.id === id)).filter((t): t is NonNullable<typeof t> => !!t);
  return (
    <ul className="grid grid-cols-2 gap-5 lg:grid-cols-4">
      {list.map((t) => (
        <li key={t.id}>
          <Link href="/register" className="group block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <div className="overflow-hidden rounded-lg border shadow-soft transition-all group-hover:-translate-y-1 group-hover:shadow-pop">
              <DocPreview content={t.content} />
            </div>
            <p className="mt-3 text-sm font-semibold">{t.name}</p>
            <p className="text-[13px] text-muted-foreground">{t.category}</p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
