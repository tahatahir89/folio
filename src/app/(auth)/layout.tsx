import { Logo } from '@/components/brand/Logo';
import { AuthShowcase } from '@/components/app/AuthShowcase';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <main id="main" className="flex flex-col px-6 py-8 sm:px-12">
        <Logo />
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">{children}</div>
      </main>
      <aside className="hidden border-l bg-surface lg:block" aria-hidden>
        <AuthShowcase />
      </aside>
    </div>
  );
}
