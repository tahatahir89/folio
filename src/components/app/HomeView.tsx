'use client';

import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TEMPLATES } from '@/lib/templates/data';
import { useNewDocument, useUser } from './AppShell';
import { DocumentsView } from './DocumentsView';
import { TEMPLATE_ICONS, useCreateDocument } from './NewDocumentDialog';
import { PageHeader } from './ui-bits';

const QUICK = ['blank', 'resume', 'business-proposal', 'meeting-notes', 'cover-letter'];

export function HomeView() {
  const user = useUser();
  const openNew = useNewDocument();
  const { create, creating } = useCreateDocument();
  const first = user.name.split(/\s+/)[0] ?? user.name;

  return (
    <>
      <PageHeader
        title={`Welcome back, ${first}`}
        description="Pick up where you left off, or start something new."
        actions={
          <Button size="lg" onClick={openNew}>
            <Plus /> Create New Document
          </Button>
        }
      />
      <section aria-label="Quick start" className="mb-8">
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">Start with</h2>
        <div className="flex flex-wrap gap-2">
          {QUICK.map((id) => {
            const t = TEMPLATES.find((x) => x.id === id);
            if (!t) return null;
            const Icon = TEMPLATE_ICONS[id];
            return (
              <Button key={id} variant="outline" loading={creating === id} disabled={!!creating} onClick={() => void create(id)} className="bg-background">
                {creating !== id && Icon && <Icon />} {t.name}
              </Button>
            );
          })}
        </div>
      </section>
      <DocumentsView
        view="recent"
        heading="Recent documents"
        showSort={false}
        emptyTitle="Your first document is one click away"
        emptyDescription="Create a blank page or pick a template. Everything you write is saved automatically."
      />
    </>
  );
}
