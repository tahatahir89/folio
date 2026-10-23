'use client';

import { TEMPLATES } from '@/lib/templates/data';
import { DocPreview } from './DocPreview';

const showcase = ['business-proposal', 'resume'].map((id) => TEMPLATES.find((t) => t.id === id)).filter((t): t is NonNullable<typeof t> => !!t);

export function AuthShowcase() {
  return (
    <div className="relative flex h-full items-center justify-center overflow-hidden p-12">
      <div className="relative w-[78%] max-w-md">
        <div className="absolute -left-10 top-10 w-[70%] -rotate-3 overflow-hidden rounded-md shadow-paper ring-1 ring-black/5">
          <DocPreview content={showcase[1].content} />
        </div>
        <div className="relative ml-auto w-[85%] rotate-2 overflow-hidden rounded-md shadow-paper ring-1 ring-black/5">
          <DocPreview content={showcase[0].content} />
        </div>
      </div>
    </div>
  );
}
