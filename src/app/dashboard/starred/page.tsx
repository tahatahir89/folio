import type { Metadata } from 'next';
import { DocumentsView } from '@/components/app/DocumentsView';
import { PageHeader } from '@/components/app/ui-bits';

export const metadata: Metadata = { title: 'Starred' };

export default function StarredPage() {
  return (
    <>
      <PageHeader title="Starred" description="Pin the documents you come back to most." />
      <DocumentsView view="starred" emptyTitle="No starred documents" emptyDescription="Use the star on any document to keep it handy here." />
    </>
  );
}
