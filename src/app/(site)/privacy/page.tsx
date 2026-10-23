import type { Metadata } from 'next';
import { LegalPage } from '@/components/marketing/LegalPage';

export const metadata: Metadata = { title: 'Privacy' };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy">
      <p>Folio stores the account details you provide (name, email and a hashed password) and the documents you create so that you can access them again.</p>
      <h2>Your documents</h2>
      <p>Documents are private to your account. Folio does not read your documents except to render, save and export them at your request.</p>
      <h2>Cookies</h2>
      <p>Folio uses a single, essential session cookie to keep you signed in. It is not used for advertising.</p>
      <h2>Deleting your data</h2>
      <p>You can delete individual documents, empty the trash, or delete your account from Settings. Deleting your account removes your documents immediately.</p>
    </LegalPage>
  );
}
