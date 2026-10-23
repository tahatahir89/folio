'use client';

import { createContext, useContext, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Clock, FolderOpen, LayoutDashboard, LayoutTemplate, Menu, Plus, Settings, Star, Trash2 } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTitle, SheetContent } from '@/components/ui/dialog';
import { PageTransition } from '@/components/motion';
import { cn } from '@/lib/utils';
import type { PublicUser } from '@/lib/types';
import { NewDocumentDialog } from './NewDocumentDialog';
import { UserMenu } from './UserMenu';

const UserContext = createContext<PublicUser | null>(null);
export const useUser = () => {
  const u = useContext(UserContext);
  if (!u) throw new Error('useUser must be used inside <AppShell>');
  return u;
};

const NewDocContext = createContext<() => void>(() => undefined);
export const useNewDocument = () => useContext(NewDocContext);

const NAV = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/documents', label: 'My Documents', icon: FolderOpen },
  { href: '/dashboard/recent', label: 'Recent', icon: Clock },
  { href: '/dashboard/starred', label: 'Starred', icon: Star },
  { href: '/dashboard/templates', label: 'Templates', icon: LayoutTemplate },
  { href: '/dashboard/trash', label: 'Trash', icon: Trash2 },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

function SidebarContent({ user, onNavigate, onNew }: { user: PublicUser; onNavigate?: () => void; onNew: () => void }) {
  const pathname = usePathname();
  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <div className="flex h-9 items-center px-1">
        <Logo href="/dashboard" />
      </div>
      <Button
        className="w-full justify-start"
        onClick={() => {
          onNavigate?.();
          onNew();
        }}
      >
        <Plus /> New document
      </Button>
      <nav aria-label="Main" className="grid gap-0.5">
        {NAV.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-foreground/75 transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&_svg]:size-4',
                active && 'bg-primary-soft text-primary hover:bg-primary-soft hover:text-primary',
              )}
            >
              <Icon /> {label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto border-t pt-3">
        <UserMenu user={user} showName align="start" />
      </div>
    </div>
  );
}

export function AppShell({ user, children }: { user: PublicUser; children: React.ReactNode }) {
  const [drawer, setDrawer] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const openNew = () => setNewOpen(true);

  return (
    <UserContext.Provider value={user}>
      <NewDocContext.Provider value={openNew}>
        <div className="min-h-dvh bg-surface">
          <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r bg-background lg:block">
            <SidebarContent user={user} onNew={openNew} />
          </aside>

          <Dialog open={drawer} onOpenChange={setDrawer}>
            <SheetContent aria-describedby={undefined}>
              <DialogTitle className="sr-only">Navigation</DialogTitle>
              <SidebarContent user={user} onNavigate={() => setDrawer(false)} onNew={openNew} />
            </SheetContent>
          </Dialog>

          <div className="lg:pl-64">
            <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b bg-background/90 px-3 backdrop-blur lg:hidden">
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" aria-label="Open navigation" onClick={() => setDrawer(true)}>
                  <Menu />
                </Button>
                <Logo href="/dashboard" />
              </div>
              <Button size="sm" onClick={openNew}>
                <Plus /> New
              </Button>
            </header>
            <main id="main" className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-8 sm:py-10">
              <PageTransition>{children}</PageTransition>
            </main>
          </div>
        </div>
        <NewDocumentDialog open={newOpen} onOpenChange={setNewOpen} />
      </NewDocContext.Provider>
    </UserContext.Provider>
  );
}
