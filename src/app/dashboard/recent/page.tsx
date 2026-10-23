import type { Metadata } from 'next';
import { DocumentsView } from '@/components/app/DocumentsView';
import { PageHeader } from '@/components/app/ui-bits';

export const metadata: Metadata = { title: 'Recent' };

export default function RecentPage() {
  return (
    <>
      <PageHeader title="Recent" description="Documents you opened lately." />
      <DocumentsView view="recent" showSort={false} emptyTitle="Nothing opened recently" emptyDescription="Documents you open will show up here so you can jump back in." />
    </>
  );
}
