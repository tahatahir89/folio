'use client';

import { useEffect, useState } from 'react';
import type { Editor } from '@tiptap/react';
import { ArrowUpDown, Minus, Plus } from 'lucide-react';
import {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  BLOCK_DEFAULT_SIZE,
  DEFAULT_FONT_LABEL,
  DEFAULT_FONT_SIZE,
  DEFAULT_LINE_HEIGHT,
  DEFAULT_SPACE_AFTER,
  FONT_FAMILIES,
  FONT_SIZES,
  FONT_WEIGHTS,
  LINE_HEIGHTS,
  SPACE_AFTER,
} from '@/lib/editor/constants';
import { cn } from '@/lib/utils';
import { ToolbarButton, ToolbarMenu } from './toolbar-parts';

// ---------- Paragraph style ----------

const STYLES = [
  { id: 'normal', label: 'Normal text', cls: 'text-sm' },
  { id: 'title', label: 'Title', cls: 'text-xl font-bold' },
  { id: 'subtitle', label: 'Subtitle', cls: 'text-base text-muted-foreground' },
  { id: 'h1', label: 'Heading 1', cls: 'text-lg font-bold' },
  { id: 'h2', label: 'Heading 2', cls: 'text-base font-bold' },
  { id: 'h3', label: 'Heading 3', cls: 'text-[15px] font-bold' },
  { id: 'h4', label: 'Heading 4', cls: 'text-sm font-bold' },
  { id: 'quote', label: 'Quote', cls: 'text-sm italic text-muted-foreground' },
  { id: 'code', label: 'Code block', cls: 'font-mono text-[13px]' },
] as const;

export function currentStyleId(editor: Editor): (typeof STYLES)[number]['id'] {
  if (editor.isActive('codeBlock')) return 'code';
  for (const n of [1, 2, 3, 4] as const) if (editor.isActive('heading', { level: n })) return `h${n}` as 'h1';
  if (editor.isActive('blockquote')) return 'quote';
  const ds = editor.getAttributes('paragraph').docStyle;
  if (ds === 'title' || ds === 'subtitle') return ds;
  return 'normal';
}

function applyStyle(editor: Editor, id: (typeof STYLES)[number]['id']) {
  const chain = editor.chain().focus();
  switch (id) {
    case 'normal':
      if (editor.isActive('blockquote')) chain.lift('blockquote');
      chain.setDocStyle(null).run();
      break;
    case 'title':
    case 'subtitle':
      chain.setDocStyle(id).run();
      break;
    case 'quote':
      if (!editor.isActive('blockquote')) chain.toggleBlockquote().run();
      break;
    case 'code':
      if (!editor.isActive('codeBlock')) chain.toggleCodeBlock().run();
      break;
    default:
      chain.setHeading({ level: Number(id[1]) as 1 | 2 | 3 | 4 }).run();
  }
}

export function ParagraphStyleMenu({ editor }: { editor: Editor }) {
  const current = currentStyleId(editor);
  const label = STYLES.find((s) => s.id === current)?.label ?? 'Normal text';
  return (
    <ToolbarMenu editor={editor} label="Paragraph style" trigger={<span className="w-[92px] truncate text-left">{label}</span>} contentClassName="min-w-[13rem]">
      {STYLES.map((s) => (
        <DropdownMenuItem key={s.id} onSelect={() => applyStyle(editor, s.id)} className={cn(current === s.id && 'bg-primary-soft')}>
          <span className={cn('text-foreground', s.cls)}>{s.label}</span>
        </DropdownMenuItem>
      ))}
    </ToolbarMenu>
  );
}

// ---------- Font family ----------

export function FontFamilyMenu({ editor }: { editor: Editor }) {
  const family = (editor.getAttributes('textStyle').fontFamily as string | undefined) ?? null;
  const match = FONT_FAMILIES.find((f) => f.value === family);
  const label = family ? (match?.label ?? family.split(',')[0].replace(/['"]/g, '')) : DEFAULT_FONT_LABEL;
  return (
    <ToolbarMenu editor={editor} label="Font" trigger={<span className="w-[96px] truncate text-left">{label}</span>}>
      {FONT_FAMILIES.map((f) => (
        <DropdownMenuItem key={f.label} onSelect={() => editor.chain().focus().setFontFamily(f.value).run()} className={cn(match?.value === f.value && 'bg-primary-soft')}>
          <span style={{ fontFamily: f.value }} className="text-foreground">{f.label}</span>
        </DropdownMenuItem>
      ))}
      <DropdownMenuSeparator />
      <DropdownMenuItem onSelect={() => editor.chain().focus().unsetFontFamily().run()}>Reset to default</DropdownMenuItem>
    </ToolbarMenu>
  );
}

// ---------- Font size ----------

function effectiveSize(editor: Editor): number {
  const explicit = parseFloat((editor.getAttributes('textStyle').fontSize as string | undefined) ?? '');
  if (Number.isFinite(explicit)) return explicit;
  for (const n of [1, 2, 3, 4]) if (editor.isActive('heading', { level: n })) return BLOCK_DEFAULT_SIZE[`h${n}`];
  const ds = editor.getAttributes('paragraph').docStyle as string | undefined;
  if (ds && BLOCK_DEFAULT_SIZE[ds]) return BLOCK_DEFAULT_SIZE[ds];
  return DEFAULT_FONT_SIZE;
}

const clampSize = (n: number) => Math.min(400, Math.max(1, Math.round(n * 2) / 2));

export function FontSizeControl({ editor }: { editor: Editor }) {
  const current = effectiveSize(editor);
  const [draft, setDraft] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => setDraft(null), [current]);

  const apply = (n: number) => editor.chain().focus().setFontSize(`${clampSize(n)}pt`).run();
  const step = (dir: 1 | -1) => {
    const next = dir > 0 ? FONT_SIZES.find((s) => s > current) ?? current + 4 : [...FONT_SIZES].reverse().find((s) => s < current) ?? Math.max(1, current - 1);
    apply(next);
  };
  const commit = () => {
    if (draft === null) return;
    const n = parseFloat(draft);
    setDraft(null);
    setMenuOpen(false);
    if (Number.isFinite(n) && n > 0) apply(n);
    else editor.chain().focus().run();
  };

  return (
    <div role="group" aria-label="Font size" className="flex shrink-0 items-center">
      <ToolbarButton label="Decrease font size" onClick={() => step(-1)}>
        <Minus />
      </ToolbarButton>
      <ToolbarMenu
        editor={editor}
        label="Font size"
        open={menuOpen}
        onOpenChange={setMenuOpen}
        chevron={false}
        className="w-11 justify-center px-0 tabular-nums"
        trigger={<span>{Number.isInteger(current) ? current : current.toFixed(1)}</span>}
        contentClassName="min-w-[5rem] max-h-72"
      >
        <div className="p-1">
          <input
            aria-label="Custom font size in points"
            inputMode="decimal"
            placeholder="Custom"
            value={draft ?? ''}
            onChange={(e) => setDraft(e.target.value.replace(/[^\d.]/g, ''))}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === 'Enter') commit();
            }}
            className="mb-1 h-8 w-full rounded-md border border-input px-2 text-sm outline-none focus:border-primary"
          />
        </div>
        {FONT_SIZES.map((s) => (
          <DropdownMenuItem key={s} onSelect={() => apply(s)} className={cn('justify-center tabular-nums', s === current && 'bg-primary-soft')}>
            {s}
          </DropdownMenuItem>
        ))}
      </ToolbarMenu>
      <ToolbarButton label="Increase font size" onClick={() => step(1)}>
        <Plus />
      </ToolbarButton>
    </div>
  );
}

// ---------- Font weight ----------

export function FontWeightMenu({ editor }: { editor: Editor }) {
  const weight = (editor.getAttributes('textStyle').fontWeight as string | undefined) ?? null;
  const label = FONT_WEIGHTS.find((w) => w.value === weight)?.label ?? 'Weight';
  return (
    <ToolbarMenu editor={editor} label="Font weight" trigger={<span className="w-[58px] truncate text-left">{label}</span>}>
      {FONT_WEIGHTS.map((w) => (
        <DropdownMenuItem key={w.value} onSelect={() => editor.chain().focus().setFontWeight(w.value).run()} className={cn(weight === w.value && 'bg-primary-soft')}>
          <span style={{ fontWeight: Number(w.value) }} className="text-foreground">{w.label}</span>
        </DropdownMenuItem>
      ))}
      <DropdownMenuSeparator />
      <DropdownMenuItem onSelect={() => editor.chain().focus().unsetFontWeight().run()}>Reset weight</DropdownMenuItem>
    </ToolbarMenu>
  );
}

// ---------- Line & paragraph spacing ----------

export function SpacingMenu({ editor }: { editor: Editor }) {
  const lh = (editor.getAttributes('paragraph').lineHeight ?? editor.getAttributes('heading').lineHeight ?? DEFAULT_LINE_HEIGHT) as number;
  const sa = (editor.getAttributes('paragraph').spaceAfter ?? editor.getAttributes('heading').spaceAfter ?? DEFAULT_SPACE_AFTER) as number;
  return (
    <ToolbarMenu editor={editor} label="Line and paragraph spacing" chevron={false} className="size-8 justify-center px-0" trigger={<ArrowUpDown />}>
      <DropdownMenuLabel>Line spacing</DropdownMenuLabel>
      <DropdownMenuRadioGroup value={String(lh)} onValueChange={(v) => editor.chain().focus().setLineHeight(Number(v)).run()}>
        {LINE_HEIGHTS.map((v) => (
          <DropdownMenuRadioItem key={v} value={String(v)}>
            {v === 1 ? '1.0 (single)' : v === 2 ? '2.0 (double)' : v.toFixed(v === 1.15 || v === 1.25 ? 2 : 1)}
          </DropdownMenuRadioItem>
        ))}
      </DropdownMenuRadioGroup>
      <DropdownMenuSeparator />
      <DropdownMenuLabel>Space after paragraph</DropdownMenuLabel>
      <DropdownMenuRadioGroup value={String(sa)} onValueChange={(v) => editor.chain().focus().setSpaceAfter(Number(v)).run()}>
        {SPACE_AFTER.map((v) => (
          <DropdownMenuRadioItem key={v} value={String(v)}>
            {v} pt
          </DropdownMenuRadioItem>
        ))}
      </DropdownMenuRadioGroup>
    </ToolbarMenu>
  );
}
