import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AuthForm } from '@/components/app/AuthForm';

export const metadata: Metadata = { title: 'Sign in' };

export default function LoginPage() {
  return (
    <>
      <h1 className="font-serif text-4xl font-semibold tracking-tight">Welcome back</h1>
      <p className="mb-8 mt-2 text-muted-foreground">Sign in to pick up where you left off.</p>
      <Suspense fallback={null}>
        <AuthForm mode="login" />
      </Suspense>
    </>
  );
}
