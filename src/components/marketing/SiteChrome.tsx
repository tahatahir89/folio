import Link from 'next/link';
import { cookies } from 'next/headers';
import { Logo } from '@/components/brand/Logo';
import { Button } from '@/components/ui/button';
import { SESSION_COOKIE } from '@/lib/auth/session';

const NAV = [
  { href: '/#features', label: 'Features' },
  { href: '/#templates', label: 'Templates' },
  { href: '/#export', label: 'Export' },
  { href: '/#faq', label: 'FAQ' },
];

export async function SiteHeader() {
  const signedIn = !!(await cookies()).get(SESSION_COOKIE)?.value;
  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
        <Logo />
        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="rounded-md px-3 py-2 text-sm font-medium text-foreground/70 transition-colors hover:bg-muted hover:text-foreground">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {signedIn ? (
            <Button asChild size="sm"><Link href="/dashboard">Open dashboard</Link></Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm"><Link href="/login">Log in</Link></Button>
              <Button asChild size="sm"><Link href="/register">Start writing</Link></Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

const COLUMNS = [
  { title: 'Product', links: [{ href: '/#features', label: 'Features' }, { href: '/#templates', label: 'Templates' }, { href: '/#export', label: 'PDF and DOCX export' }] },
  { title: 'Support', links: [{ href: '/support', label: 'Help and contact' }, { href: '/#faq', label: 'FAQ' }] },
  { title: 'Legal', links: [{ href: '/privacy', label: 'Privacy' }, { href: '/terms', label: 'Terms' }] },
];

export function SiteFooter() {
  return (
    <footer className="border-t bg-surface">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:px-8 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <Logo />
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">Write beautifully. Organize effortlessly.</p>
        </div>
        {COLUMNS.map((c) => (
          <nav key={c.title} aria-label={c.title}>
            <h2 className="mb-3 text-sm font-semibold">{c.title}</h2>
            <ul className="grid gap-2">
              {c.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">{l.label}</Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t">
        <p className="mx-auto max-w-6xl px-5 py-5 text-xs text-muted-foreground sm:px-8">© {new Date().getFullYear()} Folio. All rights reserved.</p>
      </div>
    </footer>
  );
}
