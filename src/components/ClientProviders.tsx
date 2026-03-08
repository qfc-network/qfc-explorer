'use client';

import type { ReactNode } from 'react';
import { LocaleProvider } from './LocaleProvider';
import { AuthProvider } from '@/lib/auth-context';

export default function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <LocaleProvider>{children}</LocaleProvider>
    </AuthProvider>
  );
}
