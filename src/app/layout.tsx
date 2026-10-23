import type { Metadata, Viewport } from 'next';
import '@fontsource-variable/inter';
import '@fontsource-variable/newsreader';
import './globals.css';
import '@/styles/editor.css';
import { Providers } from '@/components/providers';

export const metadata: Metadata = {
  title: { default: 'Folio — Write beautifully. Organize effortlessly.', template: '%s · Folio' },
  description: 'Create beautiful documents, format every detail, and export your work as PDF or Word in seconds.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#ffffff',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a
          href="#main"
          className="sr-only z-[100] rounded-md bg-foreground px-3 py-2 text-sm text-background focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
        >
          Skip to content
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
