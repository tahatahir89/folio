import type { Metadata } from 'next';
import { DocumentsView } from '@/components/app/DocumentsView';
import { PageHeader } from '@/components/app/ui-bits';

export const metadata: Metadata = { title: 'Trash' };

export default function TrashPage() {
  return (
    <>
      <PageHeader title="Trash" description="Restore a document, or delete it permanently." />
      <DocumentsView view="trash" emptyTitle="The trash is empty" emptyDescription="Documents you move to the trash will wait here until you restore or delete them." />
    </>
  );
}
