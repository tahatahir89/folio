'use client';

import { MotionConfig } from 'framer-motion';
import { Toaster } from 'sonner';
import { SWRConfig } from 'swr';
import { TooltipProvider } from '@/components/ui/popover';
import { fetcher } from '@/lib/client/api';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <SWRConfig value={{ fetcher, revalidateOnFocus: false, shouldRetryOnError: false }}>
        <TooltipProvider>{children}</TooltipProvider>
      </SWRConfig>
      <Toaster position="bottom-right" closeButton toastOptions={{ classNames: { toast: 'font-sans' } }} />
    </MotionConfig>
  );
}
