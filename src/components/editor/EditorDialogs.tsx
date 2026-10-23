'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, dialogDescClass, dialogTitleClass } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { DocSettings } from '@/lib/types';

function Choice<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { value: T; label: string; hint?: string }[]; onChange: (v: T) => void }) {
  return (
    <fieldset className="grid gap-2">
      <legend className="mb-1 text-sm font-medium">{label}</legend>
      <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label={label}>
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={value === o.value}
            onClick={() => onChange(o.value)}
            className={cn(
              'rounded-lg border px-3 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              value === o.value ? 'border-primary bg-primary-soft' : 'hover:bg-muted',
            )}
          >
            <span className="block text-sm font-medium">{o.label}</span>
            {o.hint && <span className="block text-xs text-muted-foreground">{o.hint}</span>}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export function DocSettingsDialog({ open, onOpenChange, settings, onChange }: { open: boolean; onOpenChange: (o: boolean) => void; settings: DocSettings; onChange: (s: DocSettings) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className={dialogTitleClass}>Document settings</DialogTitle>
          <DialogDescription className={dialogDescClass}>Page setup applies to the editor and to PDF and DOCX exports.</DialogDescription>
        </DialogHeader>
        <Choice
          label="Page size"
          value={settings.pageSize}
          onChange={(pageSize) => onChange({ ...settings, pageSize })}
          options={[
            { value: 'a4', label: 'A4', hint: '210 × 297 mm' },
            { value: 'letter', label: 'Letter', hint: '8.5 × 11 in' },
          ]}
        />
        <Choice
          label="Margins"
          value={settings.margins}
          onChange={(margins) => onChange({ ...settings, margins })}
          options={[
            { value: 'narrow', label: 'Narrow', hint: '0.5 in' },
            { value: 'normal', label: 'Normal', hint: '1 in' },
            { value: 'wide', label: 'Wide', hint: '1.5 in' },
          ]}
        />
        <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 hover:bg-muted">
          <input
            type="checkbox"
            checked={settings.pageNumbers}
            onChange={(e) => onChange({ ...settings, pageNumbers: e.target.checked })}
            className="mt-0.5 size-4 accent-[hsl(243_75%_59%)]"
          />
          <span>
            <span className="block text-sm font-medium">Page numbers</span>
            <span className="block text-xs text-muted-foreground">Add a number at the bottom of every page in exported files.</span>
          </span>
        </label>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);
const M = isMac ? '⌘' : 'Ctrl';

const SHORTCUTS: [string, string][] = [
  ['Bold', `${M} B`],
  ['Italic', `${M} I`],
  ['Underline', `${M} U`],
  ['Strikethrough', `${M} Shift S`],
  ['Insert link', `${M} K`],
  ['Undo', `${M} Z`],
  ['Redo', `${M} Shift Z`],
  ['Save now', `${M} S`],
  ['Heading 1 / 2 / 3', `${M} Alt 1 / 2 / 3`],
  ['Bulleted list', `${M} Shift 8`],
  ['Numbered list', `${M} Shift 7`],
  ['Checklist', `${M} Shift 9`],
  ['Align left / centre / right', `${M} Shift L / E / R`],
  ['Justify', `${M} Shift J`],
  ['Increase / decrease indent', `${M} ] / [`],
  ['Page break', `${M} Enter`],
  ['Exit distraction-free mode', 'Esc'],
];

export function ShortcutsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className={dialogTitleClass}>Keyboard shortcuts</DialogTitle>
          <DialogDescription className={dialogDescClass}>Work faster without leaving the keyboard.</DialogDescription>
        </DialogHeader>
        <dl className="grid gap-1 text-sm">
          {SHORTCUTS.map(([name, keys]) => (
            <div key={name} className="flex items-center justify-between gap-4 rounded-md px-2 py-1.5 odd:bg-muted/60">
              <dt>{name}</dt>
              <dd><kbd className="rounded border bg-background px-1.5 py-0.5 font-sans text-xs text-muted-foreground shadow-soft">{keys}</kbd></dd>
            </div>
          ))}
        </dl>
      </DialogContent>
    </Dialog>
  );
}
