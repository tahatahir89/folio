'use client';

import * as React from 'react';
import * as P from '@radix-ui/react-popover';
import * as T from '@radix-ui/react-tooltip';
import { cn } from '@/lib/utils';

export const Popover = P.Root;
export const PopoverTrigger = P.Trigger;
export const PopoverAnchor = P.Anchor;

export const PopoverContent = React.forwardRef<React.ElementRef<typeof P.Content>, React.ComponentPropsWithoutRef<typeof P.Content>>(
  ({ className, sideOffset = 6, align = 'start', ...props }, ref) => (
    <P.Portal>
      <P.Content
        ref={ref}
        align={align}
        sideOffset={sideOffset}
        collisionPadding={8}
        className={cn(
          'z-50 w-72 rounded-lg border bg-background p-3 shadow-pop outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          className,
        )}
        {...props}
      />
    </P.Portal>
  ),
);
PopoverContent.displayName = 'PopoverContent';

export const TooltipProvider = T.Provider;

export function Tooltip({ label, shortcut, children, side = 'bottom' }: { label: string; shortcut?: string; children: React.ReactElement; side?: 'top' | 'bottom' | 'left' | 'right' }) {
  return (
    <T.Root delayDuration={350}>
      <T.Trigger asChild>{children}</T.Trigger>
      <T.Portal>
        <T.Content
          side={side}
          sideOffset={6}
          className="z-[60] flex items-center gap-2 rounded-md bg-foreground px-2.5 py-1.5 text-xs font-medium text-background shadow-pop data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0 data-[state=delayed-open]:zoom-in-95"
        >
          {label}
          {shortcut && <kbd className="rounded bg-background/15 px-1 py-px font-sans text-[10px] text-background/80">{shortcut}</kbd>}
        </T.Content>
      </T.Portal>
    </T.Root>
  );
}
