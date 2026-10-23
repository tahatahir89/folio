import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPage } from '@/components/marketing/LegalPage';

export const metadata: Metadata = { title: 'Support' };

export default function SupportPage() {
  return (
    <LegalPage title="Help and contact">
      <p>Most questions are answered in the <Link href="/#faq" className="text-primary underline underline-offset-4">FAQ</Link>.</p>
      <h2>Exports</h2>
      <p>If a PDF or DOCX download fails, wait a moment and try again. Make sure the status bar shows Saved so the export uses your latest changes.</p>
      <h2>Saving</h2>
      <p>If you see Save failed, check your connection and use Retry next to the status. Your text stays in the editor while Folio retries.</p>
      <h2>Contact</h2>
      <p>Add your support email address here before launch.</p>
    </LegalPage>
  );
}
