'use client';

import * as React from 'react';
import type { Editor } from '@tiptap/react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip } from '@/components/ui/popover';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export const triggerClass =
  'inline-flex h-8 shrink-0 items-center gap-1 rounded-md px-2 text-[13px] font-medium text-foreground/85 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:bg-muted disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-4 [&_svg]:shrink-0';

/** Buttons never take focus from the editor, so the text selection survives a click. */
export function ToolbarButton({
  label,
  shortcut,
  active,
  disabled,
  onClick,
  children,
  className,
}: {
  label: string;
  shortcut?: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Tooltip label={label} shortcut={shortcut}>
      <button
        type="button"
        aria-label={label}
        aria-pressed={active}
        disabled={disabled}
        onMouseDown={(e) => e.preventDefault()}
        onClick={onClick}
        className={cn(
          'inline-flex size-8 shrink-0 items-center justify-center rounded-md text-foreground/80 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-4',
          active && 'bg-primary-soft text-primary hover:bg-primary-soft',
          className,
        )}
      >
        {children}
      </button>
    </Tooltip>
  );
}

export const ToolbarDivider = () => <span className="mx-1 h-5 w-px shrink-0 bg-border" aria-hidden />;

export const ToolbarGroup = ({ children, label }: { children: React.ReactNode; label: string }) => (
  <div role="group" aria-label={label} className="flex shrink-0 items-center gap-0.5">
    {children}
  </div>
);

/** A toolbar dropdown that hands focus back to the editor when it closes. */
export function ToolbarMenu({
  editor,
  label,
  trigger,
  children,
  className,
  contentClassName,
  disabled,
  chevron = true,
  open,
  onOpenChange,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  editor: Editor;
  label: string;
  trigger: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  disabled?: boolean;
  chevron?: boolean;
}) {
  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
      <Tooltip label={label}>
        <DropdownMenuTrigger asChild>
          <button type="button" aria-label={label} disabled={disabled} onMouseDown={(e) => e.preventDefault()} className={cn(triggerClass, className)}>
            {trigger}
            {chevron && <ChevronDown className="!size-3.5 text-muted-foreground" />}
          </button>
        </DropdownMenuTrigger>
      </Tooltip>
      <DropdownMenuContent
        align="start"
        className={contentClassName}
        onCloseAutoFocus={(e) => {
          e.preventDefault();
          editor.chain().focus().run();
        }}
      >
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
