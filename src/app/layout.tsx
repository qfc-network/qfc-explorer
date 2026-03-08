import './globals.css';
import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import Navbar from '@/components/Navbar';
import ClientProviders from '@/components/ClientProviders';
import ErrorBoundary from '@/components/ErrorBoundary';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';

const KeyboardShortcuts = dynamic(
  () => import('@/components/KeyboardShortcuts'),
  { ssr: false }
);

export const metadata: Metadata = {
  metadataBase: new URL('https://explorer.testnet.qfc.network'),
  title: {
    default: 'QFC Explorer',
    template: '%s | QFC Explorer',
  },
  description:
    'QFC blockchain explorer — track blocks, transactions, accounts, tokens, and smart contracts on the QFC network.',
  manifest: '/manifest.json',
  openGraph: {
    siteName: 'QFC Explorer',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('qfc-theme');if(t==='light'){document.documentElement.classList.remove('dark')}else if(t==='dark'){document.documentElement.classList.add('dark')}else if(!window.matchMedia('(prefers-color-scheme: dark)').matches){document.documentElement.classList.remove('dark')}}catch(e){}})();`,
          }}
        />
      </head>
      <body>
        <ClientProviders>
          <div className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-100 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
            <Navbar />
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
            <footer className="border-t border-slate-200 dark:border-slate-800/40 mt-16">
              <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-10 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-cyan-400 to-blue-600 text-[10px] font-bold text-white">
                    Q
                  </div>
                  <span className="text-sm text-slate-500">QFC Explorer</span>
                </div>
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-500">
                  <Link href="https://qfc.network" className="hover:text-slate-700 dark:hover:text-slate-300">qfc.network</Link>
                  <Link href="https://docs.qfc.network" className="hover:text-slate-700 dark:hover:text-slate-300">Docs</Link>
                  <Link href="https://faucet.testnet.qfc.network" className="hover:text-slate-700 dark:hover:text-slate-300">Faucet</Link>
                  <Link href="https://github.com/qfc-network" className="hover:text-slate-700 dark:hover:text-slate-300">GitHub</Link>
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-600">QFC Network &copy; 2026</p>
              </div>
            </footer>
          </div>
          <KeyboardShortcuts />
          <ServiceWorkerRegister />
        </ClientProviders>
      </body>
    </html>
  );
}
