import type { Metadata } from 'next';
import { LegalPage } from '@/components/marketing/LegalPage';

export const metadata: Metadata = { title: 'Terms' };

export default function TermsPage() {
  return (
    <LegalPage title="Terms of service">
      <p>By creating an account you agree to use Folio lawfully and to keep your sign-in details secure.</p>
      <h2>Your content</h2>
      <p>You own the documents you create. You are responsible for the content you store and for keeping your own backups by exporting important documents.</p>
      <h2>Availability</h2>
      <p>Folio is provided as is. Features may change, and the service may be unavailable from time to time.</p>
      <h2>Accounts</h2>
      <p>Accounts that abuse the service may be limited or removed.</p>
    </LegalPage>
  );
}
