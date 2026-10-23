'use client';

import { useState } from 'react';
import type { Editor } from '@tiptap/react';
import { Check } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger, Tooltip } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { triggerClass } from './toolbar-parts';

interface Props {
  editor: Editor;
  label: string;
  icon: React.ReactNode;
  /** Currently applied colour, if any. */
  value: string | null;
  /** Colour shown on the indicator bar when nothing is applied. */
  fallback: string;
  palette: readonly (readonly string[])[] | readonly string[];
  onPick: (color: string) => void;
  onReset: () => void;
  resetLabel: string;
}

const same = (a: string | null, b: string) => !!a && a.toLowerCase() === b.toLowerCase();

export function ColorPicker({ editor, label, icon, value, fallback, palette, onPick, onReset, resetLabel }: Props) {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState('#4f46e5');
  const rows: readonly (readonly string[])[] = typeof palette[0] === 'string' ? [palette as readonly string[]] : (palette as readonly (readonly string[])[]);

  const pick = (c: string) => {
    onPick(c);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip label={label}>
        <PopoverTrigger asChild>
          <button type="button" aria-label={label} onMouseDown={(e) => e.preventDefault()} className={cn(triggerClass, 'size-8 flex-col justify-center gap-0 px-0')}>
            {icon}
            <span className="mt-0.5 h-[3px] w-4 rounded-full ring-1 ring-black/10" style={{ background: value ?? fallback }} />
          </button>
        </PopoverTrigger>
      </Tooltip>
      <PopoverContent
        className="w-auto p-3"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => {
          e.preventDefault();
          editor.chain().focus().run();
        }}
      >
        <div className="grid gap-1.5" role="listbox" aria-label={label}>
          {rows.map((row, i) => (
            <div key={i} className="flex gap-1.5">
              {row.map((c) => (
                <button
                  key={c}
                  type="button"
                  role="option"
                  aria-selected={same(value, c)}
                  aria-label={c}
                  title={c}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pick(c)}
                  className="relative flex size-6 items-center justify-center rounded-md ring-1 ring-black/10 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  style={{ background: c }}
                >
                  {same(value, c) && <Check className="size-3.5 text-white mix-blend-difference" />}
                </button>
              ))}
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2 border-t pt-3">
          <label className="relative size-8 shrink-0 cursor-pointer overflow-hidden rounded-md ring-1 ring-black/15">
            <span className="sr-only">Custom colour</span>
            <input
              type="color"
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              className="absolute -inset-2 size-12 cursor-pointer border-0 bg-transparent p-0"
            />
          </label>
          <Button size="sm" variant="outline" className="flex-1" onClick={() => pick(custom)}>
            Apply {custom.toUpperCase()}
          </Button>
        </div>
        <Button size="sm" variant="ghost" className="mt-2 w-full justify-start" onClick={() => { onReset(); setOpen(false); }}>
          {resetLabel}
        </Button>
      </PopoverContent>
    </Popover>
  );
}
