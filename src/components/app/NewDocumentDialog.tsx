'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { BarChart3, Briefcase, CalendarDays, FileText, GraduationCap, Heart, Loader2, Mail, User, Users } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, dialogDescClass, dialogTitleClass } from '@/components/ui/dialog';
import { api } from '@/lib/client/api';
import { TEMPLATES } from '@/lib/templates/data';
import { cn } from '@/lib/utils';
import type { DocumentSummary } from '@/lib/types';

export const TEMPLATE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  blank: FileText,
  resume: User,
  'business-proposal': Briefcase,
  'project-report': BarChart3,
  'meeting-notes': Users,
  'cover-letter': Mail,
  'academic-assignment': GraduationCap,
  'business-letter': FileText,
  'personal-letter': Heart,
  'weekly-planner': CalendarDays,
};

/** Creates a document from a template and opens it in the editor. */
export function useCreateDocument() {
  const router = useRouter();
  const [creating, setCreating] = useState<string | null>(null);
  const create = async (templateId: string) => {
    if (creating) return;
    setCreating(templateId);
    try {
      const { document } = await api<{ document: DocumentSummary }>('/api/documents', { method: 'POST', json: { templateId } });
      router.push(`/editor/${document.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not create the document.');
      setCreating(null);
    }
  };
  return { create, creating };
}

export function NewDocumentDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { create, creating } = useCreateDocument();
  return (
    <Dialog open={open} onOpenChange={(o) => !creating && onOpenChange(o)}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className={dialogTitleClass}>Create a new document</DialogTitle>
          <DialogDescription className={dialogDescClass}>Start blank, or begin with a template you can edit freely.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-2 sm:grid-cols-2">
          {TEMPLATES.map((t) => {
            const Icon = TEMPLATE_ICONS[t.id] ?? FileText;
            const busy = creating === t.id;
            return (
              <button
                key={t.id}
                type="button"
                disabled={!!creating}
                onClick={() => void create(t.id)}
                className={cn(
                  'group flex items-start gap-3 rounded-lg border p-3 text-left transition-colors hover:border-primary/40 hover:bg-primary-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60',
                  t.id === 'blank' && 'sm:col-span-2',
                )}
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-foreground/70 group-hover:bg-background group-hover:text-primary">
                  {busy ? <Loader2 className="size-4 animate-spin" /> : <Icon className="size-4" />}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium">{t.name}</span>
                  <span className="block text-[13px] leading-snug text-muted-foreground">{t.description}</span>
                </span>
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
