'use client';

import { ChevronDown, Download, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export type ExportFormat = 'pdf' | 'docx';

export function ExportMenu({ busy, onExport, disabled }: { busy: ExportFormat | null; onExport: (f: ExportFormat) => void; disabled?: boolean }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" disabled={disabled || !!busy} aria-label="Export document">
          {busy ? <Loader2 className="animate-spin" /> : <Download />}
          <span className="hidden sm:inline">{busy ? 'Exporting…' : 'Export'}</span>
          <ChevronDown className="hidden !size-3.5 sm:block" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel>Export this document</DropdownMenuLabel>
        <DropdownMenuItem onSelect={() => onExport('pdf')}>
          <FileText /> Download as PDF
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onExport('docx')}>
          <FileText /> Download as DOCX (Word)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
