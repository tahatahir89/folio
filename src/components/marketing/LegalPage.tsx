export function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <article className="mx-auto max-w-2xl px-5 py-16 sm:px-8 sm:py-24">
      <h1 className="font-serif text-4xl font-medium tracking-tight sm:text-5xl">{title}</h1>
      <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        Starter text for development. Replace it with copy reviewed by a qualified professional before you launch publicly.
      </p>
      <div className="mt-8 grid gap-5 text-[15px] leading-relaxed text-foreground/85 [&_h2]:mt-4 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground">{children}</div>
    </article>
  );
}
