import Link from 'next/link';
import { Check, ChevronDown, FileText, FolderOpen, LayoutTemplate, Layers, Smartphone, Table2, Type } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FadeIn } from '@/components/motion';
import { HeroEditor } from '@/components/marketing/HeroEditor';
import { TemplatesStrip } from '@/components/marketing/TemplatesStrip';

const FEATURES = [
  { icon: Type, title: 'Formatting you already know', body: 'Fonts, sizes, colours, highlights, alignment, spacing and indentation, with the shortcuts you expect.' },
  { icon: Layers, title: 'Real document structure', body: 'Title, subtitle and four heading levels apply true styles, so your outline survives export.' },
  { icon: Table2, title: 'Tables, lists and images', body: 'Merge cells, build checklists, nest lists and drop in pictures without fighting the layout.' },
  { icon: Check, title: 'Autosave you can trust', body: 'Changes save after a short pause. You see Saved only once the server has confirmed it.' },
  { icon: FolderOpen, title: 'A library that stays tidy', body: 'Search, sort, star, duplicate and rename. Deleted work waits in the trash until you decide.' },
  { icon: Smartphone, title: 'Comfortable on every screen', body: 'A focused layout from desktop down to phone, with a toolbar that scrolls instead of shrinking.' },
];

const FAQ = [
  { q: 'Is Folio free to use?', a: 'Yes. Creating, editing and exporting documents is free, and the editor does not depend on a paid plan.' },
  { q: 'Will my formatting survive export?', a: 'Headings, text styles, colours, highlights, lists, tables, links and images carry over to both formats. PDFs are drawn with standard Helvetica, Times and Courier-style fonts, so they are best suited to Latin-script text. DOCX files keep your font names.' },
  { q: 'Can I edit the DOCX in Word?', a: 'Yes. Folio generates a genuine .docx file that opens as an editable document in Microsoft Word, Google Docs, Pages and LibreOffice.' },
  { q: 'How does saving work?', a: 'Folio saves a moment after you stop typing, and the status bar shows Saving, Saved or Save failed. If a save fails it retries, and you can retry manually.' },
  { q: 'Can other people see my documents?', a: 'No. Each document belongs to the account that created it, and the server checks ownership on every request.' },
  { q: 'Does it work on a phone or tablet?', a: 'Yes. The editor, dashboard and templates adapt to small screens, with a scrollable formatting toolbar and touch-friendly menus.' },
];

export default function LandingPage() {
  return (
    <>
      {/* Hero */}
      <section className="border-b bg-surface">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[1.02fr_1fr] lg:gap-14">
          <div>
            <FadeIn y={16}>
              <h1 className="font-serif text-[44px] font-medium leading-[1.04] tracking-tight sm:text-6xl lg:text-[68px]">
                Your ideas deserve a <span className="text-primary">better document.</span>
              </h1>
            </FadeIn>
            <FadeIn delay={0.08} y={16}>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
                Create beautiful documents, format every detail, and export your work in seconds.
              </p>
            </FadeIn>
            <FadeIn delay={0.16} y={16}>
              <div className="mt-9 flex flex-wrap gap-3">
                <Button asChild size="lg"><Link href="/register">Start Writing for Free</Link></Button>
                <Button asChild size="lg" variant="outline" className="bg-background"><Link href="/#templates">Explore Templates</Link></Button>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">No credit card. Export to PDF and Word.</p>
            </FadeIn>
          </div>
          <FadeIn delay={0.12} y={24}>
            <HeroEditor />
            <p className="mt-3 text-center text-[13px] text-muted-foreground">This is the real editor. Try it.</p>
          </FadeIn>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="scroll-mt-16 border-b">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-24">
          <FadeIn>
            <h2 className="max-w-2xl font-serif text-4xl font-medium leading-tight tracking-tight sm:text-5xl">Everything a serious document needs, nothing it doesn&apos;t</h2>
          </FadeIn>
          <dl className="mt-14 grid gap-x-12 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <FadeIn key={f.title} delay={(i % 3) * 0.06} className="border-t pt-5">
                <dt className="flex items-center gap-2.5 text-[15px] font-semibold"><f.icon className="size-[18px] text-primary" aria-hidden /> {f.title}</dt>
                <dd className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{f.body}</dd>
              </FadeIn>
            ))}
          </dl>
        </div>
      </section>

      {/* Templates */}
      <section id="templates" className="scroll-mt-16 border-b bg-surface">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-24">
          <FadeIn className="mb-12 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="max-w-xl font-serif text-4xl font-medium leading-tight tracking-tight sm:text-5xl">Start from a template, not a blank page</h2>
              <p className="mt-4 max-w-xl text-lg text-muted-foreground">Ten ready-made documents for work, school and life. Each one is real, editable content.</p>
            </div>
            <Button asChild variant="outline" className="bg-background"><Link href="/register"><LayoutTemplate /> Browse all templates</Link></Button>
          </FadeIn>
          <FadeIn><TemplatesStrip /></FadeIn>
        </div>
      </section>

      {/* Export */}
      <section id="export" className="scroll-mt-16 border-b">
        <div className="mx-auto grid max-w-6xl items-center gap-14 px-5 py-20 sm:px-8 sm:py-24 lg:grid-cols-2">
          <FadeIn>
            <h2 className="font-serif text-4xl font-medium leading-tight tracking-tight sm:text-5xl">Export that keeps its shape</h2>
            <p className="mt-4 max-w-lg text-lg text-muted-foreground">Download a polished PDF to share, or an editable Word file to keep working in. Both come from the same document.</p>
            <ul className="mt-8 grid gap-3 text-[15px]">
              {['Headings, colours, highlights and alignment', 'Lists, task lists and tables with merged cells', 'Links stay clickable and images stay sharp', 'Your page size, margins and page numbers'].map((t) => (
                <li key={t} className="flex items-start gap-3"><Check className="mt-0.5 size-[18px] shrink-0 text-primary" aria-hidden /> {t}</li>
              ))}
            </ul>
          </FadeIn>
          <FadeIn delay={0.1} className="grid gap-4 sm:grid-cols-2" aria-hidden>
            {[{ ext: 'PDF', note: 'Ready to share and print', chip: 'bg-foreground text-background' }, { ext: 'DOCX', note: 'Opens in Word, fully editable', chip: 'bg-primary text-primary-foreground' }].map((f) => (
              <div key={f.ext} className="rounded-xl border bg-background p-5 shadow-soft">
                <div className="relative mb-5 flex h-36 items-end rounded-lg bg-surface p-4">
                  <FileText className="absolute right-4 top-4 size-5 text-muted-foreground/60" />
                  <div className="w-full space-y-1.5"><div className="h-2 w-3/5 rounded bg-foreground/80" /><div className="h-1.5 w-full rounded bg-foreground/15" /><div className="h-1.5 w-11/12 rounded bg-foreground/15" /><div className="h-1.5 w-4/5 rounded bg-foreground/15" /></div>
                </div>
                <span className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${f.chip}`}>{f.ext}</span>
                <p className="mt-2 text-sm text-muted-foreground">{f.note}</p>
              </div>
            ))}
          </FadeIn>
        </div>
      </section>

      {/* Autosave & management */}
      <section className="border-b bg-surface">
        <div className="mx-auto grid max-w-6xl items-center gap-14 px-5 py-20 sm:px-8 sm:py-24 lg:grid-cols-2">
          <FadeIn className="order-2 lg:order-1" aria-hidden>
            <div className="overflow-hidden rounded-xl border bg-background shadow-paper">
              {[['Quarterly report', 'Report', 'Saved'], ['Cover letter, Aisha', 'Cover letter', 'Saved'], ['Studio proposal', 'Proposal', 'Saving…'], ['Weekly planner', 'Planner', 'Saved']].map(([name, type, status]) => (
                <div key={name} className="flex items-center gap-3 border-b px-4 py-3 last:border-b-0">
                  <FileText className="size-4 text-muted-foreground" />
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{name}</p><p className="text-xs text-muted-foreground">{type}</p></div>
                  <span className={`text-xs ${status === 'Saving…' ? 'text-muted-foreground' : 'text-success'}`}>{status}</span>
                </div>
              ))}
            </div>
          </FadeIn>
          <FadeIn className="order-1 lg:order-2">
            <h2 className="font-serif text-4xl font-medium leading-tight tracking-tight sm:text-5xl">Your work is saved before you think about it</h2>
            <p className="mt-4 max-w-lg text-lg text-muted-foreground">Autosave runs quietly while you write and reports honestly when something goes wrong. Find anything fast with search, stars and sorting, and bring back anything you trash by mistake.</p>
          </FadeIn>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-16 border-b">
        <div className="mx-auto max-w-3xl px-5 py-20 sm:px-8 sm:py-24">
          <FadeIn><h2 className="font-serif text-4xl font-medium tracking-tight sm:text-5xl">Questions, answered</h2></FadeIn>
          <div className="mt-10 divide-y border-y">
            {FAQ.map((f) => (
              <details key={f.q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left text-base font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden />
                </summary>
                <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-foreground text-background">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-5 py-16 sm:px-8 sm:py-20 md:flex-row md:items-center md:justify-between">
          <h2 className="max-w-xl font-serif text-3xl font-medium leading-tight sm:text-4xl">Write your first document in under a minute.</h2>
          <Button asChild size="lg" className="bg-background text-foreground hover:bg-background/90"><Link href="/register">Start Writing for Free</Link></Button>
        </div>
      </section>
    </>
  );
}
