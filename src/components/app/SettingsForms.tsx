'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, dialogDescClass, dialogTitleClass } from '@/components/ui/dialog';
import { Input, Label } from '@/components/ui/input';
import { api } from '@/lib/client/api';
import { formatDate } from '@/lib/utils';
import { useUser } from './AppShell';
import { Avatar } from './UserMenu';

function Section({ title, description, children, tone }: { title: string; description?: string; children: React.ReactNode; tone?: 'danger' }) {
  return (
    <section className={`rounded-xl border bg-background p-5 shadow-soft sm:p-6 ${tone === 'danger' ? 'border-destructive/30' : ''}`}>
      <h2 className="text-base font-semibold">{title}</h2>
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Field({ label, id, error, hint, ...props }: { label: string; id: string; error?: string | null; hint?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} aria-invalid={!!error} aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined} {...props} />
      {error ? <p id={`${id}-err`} className="text-sm text-destructive">{error}</p> : hint ? <p id={`${id}-hint`} className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function ProfileForm() {
  const user = useUser();
  const router = useRouter();
  const [name, setName] = useState(user.name);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api('/api/account', { method: 'PATCH', json: { name } });
      toast.success('Profile updated');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update your profile.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Section title="Profile" description={`Member since ${formatDate(user.createdAt)}`}>
      <form onSubmit={submit} className="grid max-w-md gap-4">
        <div className="flex items-center gap-3"><Avatar name={user.name} className="size-12 text-base" /><p className="text-sm text-muted-foreground">{user.email}</p></div>
        <Field label="Name" id="profile-name" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} error={error} />
        <div><Button type="submit" loading={busy} disabled={name.trim() === user.name || !name.trim()}>Save changes</Button></div>
      </form>
    </Section>
  );
}

function PlanCard() {
  return (
    <Section title="Plan" description="Folio is free to use.">
      <div className="flex items-center gap-3 rounded-lg bg-primary-soft px-4 py-3 text-sm">
        <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-primary-foreground">Free</span>
        <span>Unlimited documents, every template, PDF and DOCX export.</span>
      </div>
    </Section>
  );
}

function PasswordForm() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api('/api/account/password', { method: 'POST', json: { currentPassword: current, newPassword: next } });
      toast.success('Password changed. Other devices have been signed out.');
      setCurrent('');
      setNext('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not change your password.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Section title="Password" description="Changing your password signs you out everywhere else.">
      <form onSubmit={submit} className="grid max-w-md gap-4">
        <Field label="Current password" id="pw-current" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} required />
        <Field label="New password" id="pw-new" type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} hint="At least 8 characters, with a letter and a number." required />
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <div><Button type="submit" loading={busy} disabled={!current || !next}>Update password</Button></div>
      </form>
    </Section>
  );
}

function DangerZone() {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api('/api/account', { method: 'DELETE', json: { password } });
      window.location.href = '/';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete your account.');
      setBusy(false);
    }
  };

  return (
    <Section title="Delete account" description="Permanently removes your account and every document in it. This can't be undone." tone="danger">
      <Button variant="destructive" onClick={() => setOpen(true)}>Delete my account</Button>
      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setPassword(''); setError(null); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className={dialogTitleClass}>Delete your account?</DialogTitle>
            <DialogDescription className={dialogDescClass}>Enter your password to confirm. All of your documents will be deleted immediately.</DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="grid gap-4">
            <Field label="Password" id="delete-password" type="password" autoComplete="current-password" autoFocus value={password} onChange={(e) => setPassword(e.target.value)} error={error} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" variant="destructive" loading={busy} disabled={!password}>Delete account</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Section>
  );
}

export function SettingsForms() {
  return (
    <div className="grid max-w-2xl gap-5">
      <ProfileForm />
      <PlanCard />
      <PasswordForm />
      <DangerZone />
    </div>
  );
}
