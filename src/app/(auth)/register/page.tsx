import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AuthForm } from '@/components/app/AuthForm';

export const metadata: Metadata = { title: 'Create your account' };

export default function RegisterPage() {
  return (
    <>
      <h1 className="font-serif text-4xl font-semibold tracking-tight">Start writing</h1>
      <p className="mb-8 mt-2 text-muted-foreground">Create a free account. No credit card needed.</p>
      <Suspense fallback={null}>
        <AuthForm mode="register" />
      </Suspense>
    </>
  );
}
