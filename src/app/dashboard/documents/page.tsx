import type { Metadata } from 'next';
import { DocumentsView } from '@/components/app/DocumentsView';
import { PageHeader } from '@/components/app/ui-bits';

export const metadata: Metadata = { title: 'My Documents' };

export default function DocumentsPage() {
  return (
    <>
      <PageHeader title="My Documents" description="Everything you've written, in one place." />
      <DocumentsView view="all" emptyTitle="No documents yet" emptyDescription="Create a blank page or start from a template. Your work is saved automatically." />
    </>
  );
}
