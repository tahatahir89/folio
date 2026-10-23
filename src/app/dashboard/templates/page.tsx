import type { Metadata } from 'next';
import { PageHeader } from '@/components/app/ui-bits';
import { TemplateGallery } from '@/components/app/TemplateGallery';

export const metadata: Metadata = { title: 'Templates' };

export default function TemplatesPage() {
  return (
    <>
      <PageHeader title="Templates" description="Every template is a real, editable document. Pick one and make it yours." />
      <TemplateGallery />
    </>
  );
}
