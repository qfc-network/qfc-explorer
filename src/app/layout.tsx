import './globals.css';
import type { ReactNode } from 'react';
import SearchBar from '@/components/SearchBar';

export const metadata = {
  title: 'QFC Explorer',
  description: 'QFC blockchain explorer',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
          <header className="border-b border-slate-900/80 bg-slate-950/70 px-6 py-6">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
              <div className="flex items-center justify-between gap-6">
                <div>
                  <p className="text-xs uppercase tracking-[0.4em] text-slate-500">QFC Explorer</p>
                  <p className="mt-1 text-sm text-slate-400">Search blocks, transactions, and accounts.</p>
                </div>
              </div>
              <SearchBar />
            </div>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
