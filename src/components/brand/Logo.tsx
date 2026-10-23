import Link from 'next/link';
import { cn } from '@/lib/utils';

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn('size-7', className)} aria-hidden>
      <rect width="32" height="32" rx="8" className="fill-primary" />
      <path d="M10 7.5h8.2L23 12.3V24a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 9 24V9A1.5 1.5 0 0 1 10 7.5Z" fill="#fff" fillOpacity=".96" />
      <path d="M18.2 7.5v3.3a1.5 1.5 0 0 0 1.5 1.5H23" fill="none" stroke="hsl(243 75% 59%)" strokeOpacity=".55" strokeWidth="1.2" />
      <path d="M12.5 16h7M12.5 19h7M12.5 22h4" stroke="hsl(243 75% 59%)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ href = '/', className, textClassName }: { href?: string; className?: string; textClassName?: string }) {
  return (
    <Link href={href} className={cn('inline-flex items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring', className)} aria-label="Folio home">
      <LogoMark />
      <span className={cn('font-serif text-[22px] font-semibold leading-none tracking-tight', textClassName)}>Folio</span>
    </Link>
  );
}
