export const dynamic = "force-dynamic";

import type { Metadata } from 'next';
import dynamic_ from 'next/dynamic';

export const metadata: Metadata = {
  title: 'Charts',
  description: 'Interactive charts for the QFC blockchain: daily transactions, active addresses, gas prices, and block statistics.',
  openGraph: {
    title: 'Charts | QFC Explorer',
    description: 'Interactive charts for the QFC blockchain: daily transactions, active addresses, gas prices, and block statistics.',
    type: 'website',
  },
};

const ChartsClient = dynamic_(() => import('./ChartsClient'), {
  ssr: false,
  loading: () => (
    <div className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="h-72 animate-pulse rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/50" />
        ))}
      </div>
    </div>
  ),
});

export default function ChartsPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-10 px-6 py-12">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-cyan-500">Network Data</p>
        <h1 className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">Charts</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Visualize QFC blockchain activity over time — transactions, addresses, gas prices, and block statistics.
        </p>
      </div>

      <ChartsClient />
    </main>
  );
}
