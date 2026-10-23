import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/brand/Logo';

export default function NotFound() {
  return (
    <main id="main" className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-surface px-6 text-center">
      <Logo />
      <div>
        <h1 className="font-serif text-4xl font-semibold tracking-tight">We can&apos;t find that page</h1>
        <p className="mt-2 text-muted-foreground">It may have been moved, deleted, or it belongs to another account.</p>
      </div>
      <Button asChild><Link href="/dashboard">Go to your documents</Link></Button>
    </main>
  );
}
